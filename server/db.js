// MongoDB connection (localhost:27017/HEKATHONE) — app runs fine without it (in-memory fallback)
import { MongoClient } from 'mongodb'

const URL = process.env.MONGO_URL || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGO_DB || 'HEKATHONE'

let db = null

export async function connectDB(seedTickets = [], seedTeam = []) {
  try {
    const client = new MongoClient(URL, { serverSelectionTimeoutMS: 2500 })
    await client.connect()
    db = client.db(DB_NAME)
    // First run: move the dummy tickets into the DB so the dashboard is DB-backed
    const count = await db.collection('tickets').countDocuments()
    if (!count && seedTickets.length) {
      await db.collection('tickets').insertMany(seedTickets.map((t) => ({ ...t })))
      console.log(`🗄  Seeded ${seedTickets.length} tickets into ${DB_NAME}.tickets`)
    }
    // Team schedules back both the chat's availability answers and the support calendar
    const teamCount = await db.collection('team').countDocuments()
    if (!teamCount && seedTeam.length) {
      await db.collection('team').insertMany(seedTeam.map((m) => ({ ...m })))
      console.log(`🗄  Seeded ${seedTeam.length} team members into ${DB_NAME}.team`)
    }
    // Cache lookups are keyed by question AND language — same question asked in
    // Hindi and English are two different cached answers
    await db.collection('qa').createIndex({ normalized: 1, lang: 1 })
    await db.collection('appointments').createIndex({ date: 1, time: 1, person: 1 })
    console.log(`🗄  MongoDB connected: ${URL}/${DB_NAME}`)
  } catch (err) {
    db = null
    console.warn(`⚠ MongoDB not reachable (${err.message}) — running without persistence`)
  }
}

export const getDB = () => db

// Same question asked differently-cased/punctuated should still hit the cache
export function normalizeQuestion(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim()
}
