// Express proxy for Gemini: keeps GEMINI_API_KEY server-side, exposes POST /api/chat
import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import { loadKnowledge } from './knowledge.js'
import { connectDB, getDB, normalizeQuestion } from './db.js'
import { store } from './store.js'
import { availability, toMinutes } from './availability.js'
import { tickets as seedTickets } from '../src/data/tickets.js'
import { team as seedTeam } from '../src/data/team.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api', store)
app.use('/api', availability)
await connectDB(seedTickets, seedTeam)

const PORT = process.env.PORT || 3001
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'
// Primary key first; backup key kicks in automatically if the primary fails
const API_KEYS = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_BACKUP].filter(Boolean)

// Bumped whenever SYSTEM_PROMPT changes meaningfully. Cached answers written under
// an older version are ignored, so the DB cache can't serve pre-change replies
// (e.g. the old Hinglish answers) straight past the current prompt.
const PROMPT_VERSION = 2

const BASE_PROMPT = `You are AI Syndicate, the 24/7 support agent for Superworks, a B2B HRMS/payroll SaaS used by Indian companies.
ALWAYS reply in English. The user may write in Hinglish or Hindi — understand it, but always answer in English.
Be warm and practical. Keep answers to 2-4 short sentences.

STRICT RULE: You may ONLY answer using the OFFICIAL SUPERWORKS HELP DOCS below. Quote exact navigation paths (e.g. "Attendance → My OD & Remote Work") and steps from the docs. Never invent menu paths and never answer from general knowledge.
If the user's question is NOT clearly answered by the docs, reply with exactly this single token and nothing else: NOT_COVERED`

// Load help-doc PDFs once at startup; drop new PDFs in PDF/ and restart to pick them up
const PDF_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'PDF')
const knowledge = await loadKnowledge(PDF_DIR)
const SYSTEM_PROMPT = `${BASE_PROMPT}

OFFICIAL SUPERWORKS HELP DOCS:

${knowledge.text || '(no docs loaded)'}`

// Reply used whenever the real API can't answer — keeps the demo unbreakable
const FALLBACK_REPLY =
  'I can help with payroll, attendance, or PMS questions — or set up a call with our team. Could you tell me a bit more?'

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body || {}
  if (!message) return res.status(400).json({ error: 'message is required' })

  // Level 1: same question already answered before → serve straight from MongoDB
  const db = getDB()
  const normalized = normalizeQuestion(message)
  if (db && normalized) {
    const cached = await db.collection('qa').findOne({ normalized, promptVersion: PROMPT_VERSION }).catch(() => null)
    if (cached) {
      return res.json({ reply: cached.reply, covered: cached.covered, source: 'db' })
    }
  }

  if (!API_KEYS.length) {
    console.warn('GEMINI_API_KEY not set — returning fallback reply')
    return res.json({ reply: FALLBACK_REPLY, source: 'fallback' })
  }

  // Gemini expects alternating user/model turns; keep the last 10 messages
  const contents = [
    ...history.slice(-10).map((m) => ({
      role: m.from === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ]

  // Try every key × model combo: primary key/model first, then backups —
  // covers quota-exhausted keys and 503-overloaded models
  for (const [i, key] of API_KEYS.entries()) {
    for (const model of [MODEL, 'gemini-flash-lite-latest']) {
      const reply = await callGemini(key, model, contents)
      if (reply) {
        // Question not in the help docs → frontend routes the user to book an appointment
        const covered = !reply.includes('NOT_COVERED')
        // Remember this Q&A so the next identical question is served from the DB
        if (db && normalized) {
          db.collection('qa')
            .updateOne(
              { normalized },
              { $set: { question: message, normalized, reply: covered ? reply : null, covered, promptVersion: PROMPT_VERSION, createdAt: new Date() } },
              { upsert: true }
            )
            .catch(() => {})
        }
        if (!covered) return res.json({ reply: null, covered: false, source: 'gemini', model })
        return res.json({ reply, covered: true, source: 'gemini', model, key: i === 0 ? 'primary' : 'backup' })
      }
    }
  }
  res.json({ reply: FALLBACK_REPLY, covered: true, source: 'fallback' })
})

// Fallback slot extraction for phrasings the client-side regex can't read.
// Never fatal: an unreadable time just returns confident:false and the chat
// falls through to offering the soonest free slots.
app.post('/api/parse-slot', async (req, res) => {
  const { message } = req.body || {}
  const miss = { dayIdx: 0, time: null, confident: false }
  if (!message || !API_KEYS.length) return res.json(miss)

  const prompt = `Extract the appointment day and time the user is asking for.
Reply with ONLY a JSON object, no markdown fences, in exactly this shape:
{"day": <integer 0-4, where 0 = today and 1 = tomorrow>, "time": "<H>:00 AM" or "<H>:00 PM" or null}
Use null for "time" if the user did not name a specific time. Round any minutes down to the hour.

User message: ${message}`

  for (const key of API_KEYS) {
    const raw = await callGemini(key, MODEL, [{ role: 'user', parts: [{ text: prompt }] }])
    if (!raw) continue
    try {
      // Models like wrapping JSON in ```json fences despite being told not to
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      const time = parsed.time ? normalizeSlotTime(parsed.time) : null
      const dayIdx = Number.isInteger(parsed.day) && parsed.day >= 0 && parsed.day <= 4 ? parsed.day : 0
      return res.json({ dayIdx, time, confident: Boolean(time) })
    } catch {
      // fall through to the next key, then to `miss`
    }
  }
  res.json(miss)
})

// "9:00 am" / "9 AM" -> "9:00 AM"; anything unparseable -> null
function normalizeSlotTime(time) {
  const mins = toMinutes(String(time).replace(/^(\d{1,2})\s*(AM|PM)$/i, '$1:00 $2'))
  if (mins == null) return null
  const h24 = Math.floor(mins / 60)
  return `${h24 % 12 === 0 ? 12 : h24 % 12}:00 ${h24 < 12 ? 'AM' : 'PM'}`
}

// Returns the reply text, or null on any failure
async function callGemini(key, model, contents) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        // No maxOutputTokens: newer flash models spend "thinking" tokens from the
        // same budget, and a cap truncates replies mid-sentence. Length is steered
        // by the system prompt instead.
        generationConfig: { temperature: 0.6 },
      }),
    })
    if (!r.ok) {
      console.error(`Gemini error (${model})`, r.status, await r.text())
      return null
    }
    const data = await r.json()
    return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || null
  } catch (err) {
    console.error(`Gemini request failed (${model}):`, err.message)
    return null
  }
}

app.listen(PORT, () => {
  console.log(`AI Syndicate API proxy running on http://localhost:${PORT}`)
  if (!API_KEYS.length) console.warn('⚠ No GEMINI_API_KEY in .env — chat will use fallback replies')
})
