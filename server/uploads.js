// Chat attachments: base64 JSON upload → MongoDB, served back over /api/files/:id
// No multipart dependency — the client sends a data URL, we decode and store it.
//
// The bytes live in MongoDB (GridFS) next to the messages that reference them, so a
// wiped/redeployed server folder can't leave the chat full of broken images. The
// uploads/ folder is only a fallback: it holds files saved before this change, and
// takes new uploads when Mongo is unreachable.
import express, { Router } from 'express'
import { GridFSBucket } from 'mongodb'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { getDB } from './db.js'

const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024
const BUCKET = 'attachments'

const bucket = () => {
  const db = getDB()
  return db ? new GridFSBucket(db, { bucketName: BUCKET }) : null
}

// Only these open inline in the browser; everything else (including .svg and .html,
// which could run script on our own origin) is forced to download instead.
// The type is served from this map rather than guessed, because we send nosniff —
// a wrong Content-Type would make the browser refuse to render the image.
const INLINE_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jpe': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.jfi': 'image/jpeg',
  '.pjpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
}

// Types Gemini can actually look at. Anything else is never sent to the model.
const MODEL_READABLE = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'])

const safeId = (raw) => {
  const id = path.basename(String(raw || ''))
  return /^[A-Za-z0-9._-]+$/.test(id) ? id : null
}

/** Reads a stored file back as a Buffer — GridFS first, then the legacy disk copy. */
async function readUpload(id) {
  const gfs = bucket()
  if (gfs) {
    try {
      const chunks = []
      for await (const chunk of gfs.openDownloadStreamByName(id)) chunks.push(chunk)
      if (chunks.length) return Buffer.concat(chunks)
    } catch {
      // not in GridFS (older upload, or Mongo hiccup) → try the disk copy
    }
  }
  try {
    return await fsp.readFile(path.join(UPLOAD_DIR, id))
  } catch {
    return null
  }
}

/**
 * Loads a stored upload for the vision route: base64 + a mime type the model accepts.
 * Returns null when the id is bogus, missing, or not something the model can read.
 */
export async function readUploadForModel(rawId) {
  const id = safeId(rawId)
  if (!id) return null

  const mime = INLINE_TYPES[path.extname(id).toLowerCase()]
  if (!mime || !MODEL_READABLE.has(mime)) return null

  const buf = await readUpload(id)
  return buf ? { base64: buf.toString('base64'), mime } : null
}

export const uploads = Router()

// base64 costs ~33% extra bytes over the wire, so the parser limit sits above MAX_UPLOAD_BYTES
uploads.post('/upload', express.json({ limit: '25mb' }), async (req, res) => {
  const { name, type, data } = req.body || {}
  if (!name || !data) return res.status(400).json({ error: 'name and data are required' })

  const raw = String(data)
  const base64 = raw.startsWith('data:') ? raw.slice(raw.indexOf(',') + 1) : raw
  const buf = Buffer.from(base64, 'base64')
  if (!buf.length) return res.status(400).json({ error: 'file is empty or not valid base64' })
  if (buf.length > MAX_UPLOAD_BYTES) return res.status(413).json({ error: 'file is larger than 15 MB' })

  // Keep the real name for display, but store under a sanitized, collision-free one
  const clean = path.basename(String(name)).replace(/[^A-Za-z0-9._-]/g, '_').slice(-80) || 'file'
  const id = `${crypto.randomUUID()}-${clean}`
  const contentType = String(type || 'application/octet-stream').slice(0, 120)

  const gfs = bucket()
  try {
    if (gfs) {
      await new Promise((resolve, reject) => {
        const upload = gfs.openUploadStream(id, { contentType, metadata: { name: String(name).slice(0, 200) } })
        upload.on('error', reject)
        upload.on('finish', resolve)
        upload.end(buf)
      })
    } else {
      // No DB — keep the demo working off the local folder
      await fsp.writeFile(path.join(UPLOAD_DIR, id), buf)
    }
  } catch (err) {
    console.error('upload store failed:', err.message)
    return res.status(500).json({ error: 'could not save the file' })
  }

  res.json({
    id,
    name: String(name).slice(0, 200),
    type: contentType,
    size: buf.length,
    url: `/api/files/${encodeURIComponent(id)}`,
    uploadedAt: new Date().toISOString(),
  })
})

// GET /api/files/:id           → inline for images/PDF, download for anything else
// GET /api/files/:id?dl=1      → always download
uploads.get('/files/:id', async (req, res) => {
  const id = safeId(req.params.id)
  if (!id) return res.status(400).json({ error: 'bad file id' })

  const buf = await readUpload(id)
  if (!buf) return res.status(404).json({ error: 'file not found' })

  // Strip the uuid prefix so the download lands with something readable
  const original = id.slice(id.indexOf('-', 35) + 1) || id
  const inlineType = INLINE_TYPES[path.extname(id).toLowerCase()]
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (req.query.dl !== '1' && inlineType) {
    res.type(inlineType)
    return res.send(buf)
  }
  // Quote-stripped: a filename with a quote or newline would break the header
  res.setHeader('Content-Disposition', `attachment; filename="${original.replace(/["\r\n]/g, '')}"`)
  res.type('application/octet-stream')
  res.send(buf)
})

// Called when a message carrying this file is deleted
uploads.delete('/files/:id', async (req, res) => {
  const id = safeId(req.params.id)
  if (!id) return res.status(400).json({ error: 'bad file id' })

  const gfs = bucket()
  if (gfs) {
    try {
      const files = await getDB().collection(`${BUCKET}.files`).find({ filename: id }).toArray()
      await Promise.all(files.map((f) => gfs.delete(f._id)))
    } catch (err) {
      console.error('attachment delete failed:', err.message)
    }
  }
  await fsp.rm(path.join(UPLOAD_DIR, id), { force: true }).catch(() => {})
  res.json({ ok: true })
})
