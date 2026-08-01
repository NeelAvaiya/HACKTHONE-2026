// Chat attachments: base64 JSON upload → disk, served back over /api/files/:id
// No multipart dependency — the client sends a data URL, we decode and store it.
import express, { Router } from 'express'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024

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

/**
 * Loads a stored upload for the vision route: base64 + a mime type the model accepts.
 * Returns null when the id is bogus, missing, or not something the model can read.
 */
export async function readUploadForModel(rawId) {
  const id = path.basename(String(rawId || ''))
  if (!/^[A-Za-z0-9._-]+$/.test(id)) return null

  const mime = INLINE_TYPES[path.extname(id).toLowerCase()]
  if (!mime || !MODEL_READABLE.has(mime)) return null

  try {
    const buf = await fsp.readFile(path.join(UPLOAD_DIR, id))
    return { base64: buf.toString('base64'), mime }
  } catch {
    return null
  }
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
  try {
    await fsp.writeFile(path.join(UPLOAD_DIR, id), buf)
  } catch (err) {
    console.error('upload write failed:', err.message)
    return res.status(500).json({ error: 'could not save the file' })
  }

  res.json({
    id,
    name: String(name).slice(0, 200),
    type: String(type || 'application/octet-stream').slice(0, 120),
    size: buf.length,
    url: `/api/files/${encodeURIComponent(id)}`,
    uploadedAt: new Date().toISOString(),
  })
})

// GET /api/files/:id           → inline for images/PDF, download for anything else
// GET /api/files/:id?dl=1      → always download
uploads.get('/files/:id', (req, res) => {
  const id = path.basename(req.params.id || '')
  if (!/^[A-Za-z0-9._-]+$/.test(id)) return res.status(400).json({ error: 'bad file id' })

  const full = path.join(UPLOAD_DIR, id)
  if (!fs.existsSync(full)) return res.status(404).json({ error: 'file not found' })

  // Strip the uuid prefix so the download lands with something readable
  const original = id.slice(id.indexOf('-', 35) + 1) || id
  const inlineType = INLINE_TYPES[path.extname(id).toLowerCase()]
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (req.query.dl !== '1' && inlineType) {
    res.type(inlineType)
    return res.sendFile(full)
  }
  res.download(full, original)
})

// Called when a message carrying this file is deleted, or the chat is cleared
uploads.delete('/files/:id', async (req, res) => {
  const id = path.basename(req.params.id || '')
  if (!/^[A-Za-z0-9._-]+$/.test(id)) return res.status(400).json({ error: 'bad file id' })
  await fsp.rm(path.join(UPLOAD_DIR, id), { force: true }).catch((err) => {
    console.error('upload delete failed:', err.message)
  })
  res.json({ ok: true })
})
