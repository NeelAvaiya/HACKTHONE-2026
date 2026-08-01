// Demo data for the booking flow: npm run seed [-- --reset]
//
//   npm run seed            ensure the team is in the DB, add sample bookings if none exist
//   npm run seed -- --reset wipe existing appointments first, then add the samples
//
// Slots below are chosen to sit in each expert's free time (see busy[] in
// src/data/team.js), so the calendar and the chat's availability stay consistent.
import { MongoClient } from 'mongodb'
import { team as seedTeam } from '../src/data/team.js'
import { dateForDay, dayLabel } from './availability.js'

const URL = process.env.MONGO_URL || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGO_DB || 'HEKATHONE'
const reset = process.argv.includes('--reset')

// { dayIdx, time, person, category, client } — one per expert, spread over today/tomorrow
const SAMPLES = [
  { dayIdx: 0, time: '11:00 AM', person: 'Rohit Sharma', category: 'HRMS', client: 'Rohit Verma (FinEdge Solutions)' },
  { dayIdx: 0, time: '3:00 PM', person: 'Priya Nair', category: 'PMS', client: 'Meera Iyer (Nexara Tech)' },
  { dayIdx: 1, time: '10:00 AM', person: 'Kavya Reddy', category: 'HRMS', client: 'Arjun Menon (BlueOrbit)' },
  { dayIdx: 1, time: '11:00 AM', person: 'Amit Deshmukh', category: 'Payroll', client: 'Sana Kapoor (Vertex Labs)' },
]

const client = new MongoClient(URL, { serverSelectionTimeoutMS: 3000 })
await client.connect()
const db = client.db(DB_NAME)
console.log(`🗄  ${URL}/${DB_NAME}`)

// Team — the schedules every availability answer is computed from
const teamCount = await db.collection('team').countDocuments()
if (!teamCount) {
  await db.collection('team').insertMany(seedTeam.map((m) => ({ ...m })))
  console.log(`✓ team        seeded ${seedTeam.length} experts`)
} else {
  console.log(`• team        ${teamCount} experts already present, left alone`)
}

// Appointments
if (reset) {
  const { deletedCount } = await db.collection('appointments').deleteMany({})
  console.log(`✓ appointments cleared ${deletedCount}`)
}

const existing = await db.collection('appointments').countDocuments()
if (existing && !reset) {
  console.log(`• appointments ${existing} already present — run with --reset to replace them`)
} else {
  const nums = (await db.collection('appointments').find().project({ id: 1 }).toArray()).map(
    (a) => parseInt((a.id || '').replace(/\D/g, ''), 10) || 0
  )
  let next = Math.max(1000, ...nums, 1000)
  const docs = SAMPLES.map((s) => ({
    id: `APT-${++next}`,
    person: s.person,
    category: s.category,
    date: dateForDay(s.dayIdx),
    time: s.time,
    slot: `${dayLabel(s.dayIdx)}, ${s.time}`,
    client: s.client,
    status: 'upcoming',
    notified: false,
    createdAt: new Date().toISOString(),
  }))
  await db.collection('appointments').insertMany(docs)
  console.log(`✓ appointments seeded ${docs.length}`)
  docs.forEach((d) => console.log(`    ${d.id}  ${d.slot.padEnd(20)} ${d.person.padEnd(16)} ${d.client}`))
}

await client.close()
console.log('\nDone. Restart `npm run server` if it was started before a schema change.')
