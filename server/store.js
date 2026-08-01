// REST endpoints for persisted data: /api/tickets and /api/appointments (reviews live inside)
// Every route degrades gracefully: no DB → GET returns null, writes are no-ops
import { Router } from 'express'
import { getDB } from './db.js'

export const store = Router()

store.get('/tickets', async (req, res) => {
  const db = getDB()
  if (!db) return res.json(null)
  res.json(await db.collection('tickets').find().sort({ createdAt: -1 }).project({ _id: 0 }).toArray())
})

store.post('/tickets', async (req, res) => {
  const db = getDB()
  if (db && req.body?.id) {
    await db.collection('tickets').updateOne({ id: req.body.id }, { $set: req.body }, { upsert: true })
  }
  res.json({ ok: true })
})

store.patch('/tickets/:id', async (req, res) => {
  const db = getDB()
  if (db) await db.collection('tickets').updateOne({ id: req.params.id }, { $set: req.body })
  res.json({ ok: true })
})

// Chat conversation persistence — single demo conversation, whole thread replaced on save
store.get('/messages', async (req, res) => {
  const db = getDB()
  if (!db) return res.json(null)
  res.json(await db.collection('messages').find().sort({ id: 1 }).project({ _id: 0 }).toArray())
})

store.put('/messages', async (req, res) => {
  const db = getDB()
  if (db && Array.isArray(req.body)) {
    await db.collection('messages').deleteMany({})
    if (req.body.length) await db.collection('messages').insertMany(req.body.map((m) => ({ ...m })))
  }
  res.json({ ok: true })
})

store.get('/appointments', async (req, res) => {
  const db = getDB()
  if (!db) return res.json(null)
  res.json(await db.collection('appointments').find().sort({ createdAt: -1 }).project({ _id: 0 }).toArray())
})

store.post('/appointments', async (req, res) => {
  const db = getDB()
  if (db && req.body?.id) {
    await db.collection('appointments').updateOne({ id: req.body.id }, { $set: req.body }, { upsert: true })
  }
  res.json({ ok: true })
})

// Body keys may use dot paths (e.g. "reviews.client") — $set handles them natively
store.patch('/appointments/:id', async (req, res) => {
  const db = getDB()
  if (db) await db.collection('appointments').updateOne({ id: req.params.id }, { $set: req.body })
  res.json({ ok: true })
})
