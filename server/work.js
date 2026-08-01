// The client's tickets and feature requests. Support resolves them; either side
// can reopen with a reason. Both sides read the same rows, so a change on one
// shows up on the other. Degrades like the rest of /api — no DB, no crash.
import { Router } from 'express'
import { getDB } from './db.js'
import { clientWorkSeed } from '../src/data/clientWork.js'

export const work = Router()

const SIDES = ['client', 'support']

// Used only when Mongo is unreachable, so the demo still runs end to end
let memory = clientWorkSeed.map((i) => ({ ...i }))

const readAll = async () => {
  const db = getDB()
  if (!db) return memory
  return db.collection('work').find().sort({ id: 1 }).project({ _id: 0 }).toArray()
}

async function update(id, changes) {
  const db = getDB()
  if (!db) {
    memory = memory.map((i) => (i.id === id ? { ...i, ...changes } : i))
    return memory.find((i) => i.id === id) || null
  }
  await db.collection('work').updateOne({ id }, { $set: changes })
  return db.collection('work').findOne({ id }, { projection: { _id: 0 } })
}

work.get('/work', async (req, res) => {
  res.json(await readAll())
})

/** Support marks a ticket or feature request resolved. */
work.post('/work/:id/resolve', async (req, res) => {
  const items = await readAll()
  const item = items.find((i) => i.id === req.params.id)
  if (!item) return res.status(404).json({ error: 'not found' })
  if (item.status === 'done') return res.json(item)

  // notified:false is what makes the client's chat announce it
  const updated = await update(req.params.id, {
    status: 'done',
    notified: false,
    resolvedAt: new Date().toISOString(),
    reopen: null,
  })
  res.json(updated)
})

/**
 * Either side reopens, with a reason. The reason is required — reopening
 * without saying why leaves the other side guessing, which is the whole
 * problem this is meant to solve.
 */
work.post('/work/:id/reopen', async (req, res) => {
  const { reason, by } = req.body || {}
  const text = String(reason || '').trim()
  if (!text) return res.status(400).json({ error: 'reason is required' })
  if (!SIDES.includes(by)) return res.status(400).json({ error: 'by must be client or support' })

  const items = await readAll()
  const item = items.find((i) => i.id === req.params.id)
  if (!item) return res.status(404).json({ error: 'not found' })

  const updated = await update(req.params.id, {
    status: 'open',
    // Cleared so a later resolve is announced again rather than being treated
    // as already delivered
    notified: false,
    resolvedAt: null,
    reopen: { reason: text, by, at: new Date().toISOString() },
  })
  res.json(updated)
})

/** Flips `notified` once the client's chat has actually shown the update. */
work.patch('/work/:id', async (req, res) => {
  const updated = await update(req.params.id, req.body || {})
  res.json(updated || { ok: true })
})
