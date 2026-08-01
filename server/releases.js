// Release notes: the team publishes one when something goes live, and every client
// chat picks it up as a notification. Degrades like the rest of /api — no DB, no crash.
import { Router } from 'express'
import { getDB } from './db.js'

export const releaseNotes = Router()

releaseNotes.get('/releases', async (req, res) => {
  const db = getDB()
  if (!db) return res.json(null)
  res.json(await db.collection('releases').find().sort({ releasedAt: -1 }).project({ _id: 0 }).toArray())
})

// Publishing a release = creating it. `notified:false` is what makes the clients' chats pick it up.
releaseNotes.post('/releases', async (req, res) => {
  const db = getDB()
  const body = req.body || {}
  if (!body.id) return res.status(400).json({ error: 'id is required' })

  const release = {
    ...body,
    status: body.status || 'live',
    modules: Array.isArray(body.modules) ? body.modules : [],
    highlights: Array.isArray(body.highlights) ? body.highlights : [],
    fixesTickets: Array.isArray(body.fixesTickets) ? body.fixesTickets : [],
    releasedAt: body.releasedAt || new Date().toISOString(),
    notified: Boolean(body.notified),
  }
  if (db) await db.collection('releases').updateOne({ id: release.id }, { $set: release }, { upsert: true })
  res.json(release)
})

// Used to flip `notified` once a client's chat has actually shown the note
releaseNotes.patch('/releases/:id', async (req, res) => {
  const db = getDB()
  if (db) await db.collection('releases').updateOne({ id: req.params.id }, { $set: req.body })
  res.json({ ok: true })
})
