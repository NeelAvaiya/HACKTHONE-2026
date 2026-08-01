// Availability + booking routes. Owns the single answer to "who is free when".
//
// dayIdx is transport-only: a relative offset from today used by requests and the
// UI day-strip. It is resolved to an absolute `date` before anything is stored —
// persisting the offset would make every booking drift by a day at midnight.
import { Router } from 'express'
import { getDB } from './db.js'
import { team as staticTeam, timeSlots } from '../src/data/team.js'

export const availability = Router()

const SEARCH_DAYS = 5 // how far ahead we roll when the asked-for day is full
const MAX_OFFERS = 3

// ── time & date helpers ──────────────────────────────────────────────────────

// "9:00 AM" -> 540. Returns null for anything that isn't a slot-shaped string.
export function toMinutes(time) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(time || '').trim())
  if (!m) return null
  const hour = parseInt(m[1], 10) % 12
  const pm = m[3].toUpperCase() === 'PM'
  return (hour + (pm ? 12 : 0)) * 60 + parseInt(m[2], 10)
}

const normalizeTime = (time) => {
  const mins = toMinutes(time)
  if (mins == null) return null
  const h24 = Math.floor(mins / 60)
  const display = h24 % 12 === 0 ? 12 : h24 % 12
  return `${display}:${String(mins % 60).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`
}

function dayStart(dayIdx = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + dayIdx)
  return d
}

// Local-time YYYY-MM-DD. Deliberately not toISOString(), which shifts to UTC and
// can land a 9 AM IST booking on the previous calendar day.
export function dateForDay(dayIdx = 0) {
  const d = dayStart(dayIdx)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function dayLabel(dayIdx = 0) {
  if (dayIdx === 0) return 'Today'
  if (dayIdx === 1) return 'Tomorrow'
  const d = dayStart(dayIdx)
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── data access (degrades to static data when Mongo is down) ─────────────────

// Bookings made while Mongo is unreachable: kept for the session so availability
// stays self-consistent, never persisted.
const memAppts = []

async function loadTeam() {
  const db = getDB()
  if (!db) return staticTeam
  const docs = await db.collection('team').find().project({ _id: 0 }).toArray().catch(() => [])
  return docs.length ? docs : staticTeam
}

async function loadAppointments() {
  const db = getDB()
  if (!db) return memAppts
  return db.collection('appointments').find({ status: { $ne: 'merged' } }).project({ _id: 0 }).toArray().catch(() => [])
}

// ── core availability logic (pure) ───────────────────────────────────────────

const busySlots = (member, dayIdx) => member.busy?.[dayIdx] || member.busy?.[String(dayIdx)] || []

function isFree(member, dayIdx, time, appts) {
  if (busySlots(member, dayIdx).includes(time)) return false
  const date = dateForDay(dayIdx)
  return !appts.some((a) => a.person === member.name && a.date === date && a.time === time)
}

// Lower is better. Busy slots and existing bookings both count as load, so ties
// break toward whoever has more of their day still open.
function loadOf(member, dayIdx, appts) {
  const date = dateForDay(dayIdx)
  return busySlots(member, dayIdx).length + appts.filter((a) => a.person === member.name && a.date === date).length
}

const bestExpert = (candidates, dayIdx, appts) =>
  [...candidates].sort((a, b) => loadOf(a, dayIdx, appts) - loadOf(b, dayIdx, appts) || a.name.localeCompare(b.name))[0]

/**
 * Offers for one day, at most one per time and one per expert.
 * Ranked by nearness to `requestedTime`, or by time-of-day when none was given.
 */
function offersForDay(candidates, dayIdx, appts, requestedTime, category) {
  const openTimes = timeSlots
    .map((time) => ({ time, free: candidates.filter((m) => isFree(m, dayIdx, time, appts)) }))
    .filter((slot) => slot.free.length)

  const reqMins = requestedTime ? toMinutes(requestedTime) : null
  openTimes.sort((a, b) => {
    const rank = (s) => (reqMins == null ? toMinutes(s.time) : Math.abs(toMinutes(s.time) - reqMins))
    return rank(a) - rank(b) || toMinutes(a.time) - toMinutes(b.time)
  })

  const usedExperts = new Set()
  const offers = []
  for (const slot of openTimes) {
    const pick = bestExpert(slot.free.filter((m) => !usedExperts.has(m.name)), dayIdx, appts)
    if (!pick) continue
    usedExperts.add(pick.name)
    offers.push({ time: slot.time, person: pick.name, category: category || pick.categories?.[0] || 'Other' })
    if (offers.length === MAX_OFFERS) break
  }
  return offers
}

/** Full availability answer, rolling forward up to SEARCH_DAYS if a day is full. */
export async function computeAvailability({ category, dayIdx = 0, time = null }) {
  const [teamList, appts] = await Promise.all([loadTeam(), loadAppointments()])
  const candidates = category ? teamList.filter((m) => m.categories?.includes(category)) : teamList
  const requested = time ? normalizeTime(time) : null
  const inHours = requested ? timeSlots.includes(requested) : true

  // An exact hit only exists when a time was asked for and it is a real slot.
  // Least-loaded expert first, so the caller can just take exact[0].
  const freeAtRequested = requested && inHours ? candidates.filter((m) => isFree(m, dayIdx, requested, appts)) : []
  const exact = freeAtRequested
    .sort((a, b) => loadOf(a, dayIdx, appts) - loadOf(b, dayIdx, appts) || a.name.localeCompare(b.name))
    .map((m) => ({ time: requested, person: m.name, category: category || m.categories?.[0] || 'Other' }))

  for (let d = dayIdx; d < dayIdx + SEARCH_DAYS; d++) {
    const offers = offersForDay(candidates, d, appts, requested, category)
    if (!offers.length) continue
    return {
      day: d,
      date: dateForDay(d),
      dayLabel: dayLabel(d),
      requested,
      inHours,
      exact,
      alternatives: offers,
      ...(d !== dayIdx ? { rolledToDay: d } : {}),
    }
  }
  return { day: dayIdx, date: dateForDay(dayIdx), dayLabel: dayLabel(dayIdx), requested, inHours, exact, alternatives: [] }
}

// ── routes ───────────────────────────────────────────────────────────────────

availability.get('/team', async (req, res) => {
  res.json(await loadTeam())
})

availability.get('/availability', async (req, res) => {
  const dayIdx = Math.max(0, parseInt(req.query.day, 10) || 0)
  res.json(await computeAvailability({ category: req.query.category || null, dayIdx, time: req.query.time || null }))
})

async function nextId() {
  const appts = await loadAppointments()
  const nums = appts.map((a) => parseInt((a.id || '').replace(/\D/g, ''), 10) || 0)
  return `APT-${Math.max(1000, ...nums) + 1}`
}

availability.post('/appointments/book', async (req, res) => {
  const { dayIdx = 0, time, person, category, client } = req.body || {}
  const slotTime = normalizeTime(time)
  if (!slotTime || !person) return res.status(400).json({ error: 'time and person are required' })

  const teamList = await loadTeam()
  const member = teamList.find((m) => m.name === person)
  if (!member) return res.status(400).json({ error: 'unknown expert' })

  // Freshness re-check: the slot may have gone between the offer and this call
  const appts = await loadAppointments()
  if (!timeSlots.includes(slotTime) || !isFree(member, dayIdx, slotTime, appts)) {
    const fresh = await computeAvailability({ category: category || member.categories?.[0], dayIdx, time: slotTime })
    return res.status(409).json({ error: 'taken', alternatives: fresh.alternatives, dayLabel: fresh.dayLabel })
  }

  const appt = {
    id: await nextId(),
    person,
    category: category || member.categories?.[0] || 'Other',
    date: dateForDay(dayIdx),
    time: slotTime,
    slot: `${dayLabel(dayIdx)}, ${slotTime}`,
    client: client || 'Rohit Verma (FinEdge Solutions)',
    status: 'upcoming',
    notified: false,
    createdAt: new Date().toISOString(),
  }

  const db = getDB()
  if (db) await db.collection('appointments').insertOne({ ...appt })
  else memAppts.push(appt)
  res.json(appt)
})

availability.delete('/appointments/:id', async (req, res) => {
  const db = getDB()
  if (db) await db.collection('appointments').deleteOne({ id: req.params.id })
  else {
    const i = memAppts.findIndex((a) => a.id === req.params.id)
    if (i >= 0) memAppts.splice(i, 1)
  }
  res.json({ ok: true })
})
