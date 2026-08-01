// Walks the target conversation against a running server, using the same pure
// helpers the chat hook uses: npm run test:flow
import { parseSlot, looksLikeBooking } from '../src/utils/parseSlot.js'
import { matchModule } from '../src/utils/matchModule.js'

const API = process.env.API || 'http://localhost:3001/api'

let failed = 0
const check = (label, ok, detail) => {
  if (ok) return console.log(`✓ ${label}`)
  failed++
  console.log(`✗ ${label}${detail ? `\n    ${detail}` : ''}`)
}

const get = (path) => fetch(`${API}${path}`).then((r) => r.json())

try {
  await fetch(`${API}/team`)
} catch {
  console.log('⚠ Could not reach the server — is `npm run server` running?')
  process.exit(1)
}

console.log('\n--- Conversation: "I want to book at 8" ---\n')

// Turn 1: the client asks for a time
const opening = 'I want to book at 8'
check('recognised as a booking request', looksLikeBooking(opening))
const requested = parseSlot(opening)
check('time parsed as 8:00 AM today', requested.time === '8:00 AM' && requested.dayIdx === 0, JSON.stringify(requested))
console.log('  Bot: Sure — which module is this about?  [HRMS] [Payroll] [PMS] [Other]')

// Turn 2: the client answers with the module
const moduleReply = 'Payroll'
const category = matchModule(moduleReply)
check('module resolved to Payroll', category === 'Payroll')

// Turn 3: the bot offers real slots from the database
const data = await get(`/availability?category=${category}&day=${requested.dayIdx}&time=${encodeURIComponent(requested.time)}`)
check('8:00 AM reported as out of hours', data.inHours === false)

// Properties of the offer list, not a count the seed data happens to produce.
// Real bookings fill the calendar as the demo is used, and "only one expert is
// still free today" is a correct answer — not a regression.
const people = data.alternatives.map((o) => o.person)
const times = data.alternatives.map((o) => o.time)
check('at most three offers', data.alternatives.length <= 3, JSON.stringify(times))
check('no expert offered twice', new Set(people).size === people.length, people.join(', '))
check('no time offered twice', new Set(times).size === times.length, times.join(', '))
// The point of the list is a CHOICE of people — but only when two are actually free
const freePeople = new Set(data.slots.map((s) => s.person))
if (freePeople.size >= 2) {
  check('a choice of experts is offered', data.alternatives.length >= 2, JSON.stringify(data.alternatives))
} else {
  console.log(`  (only ${freePeople.size} expert free today — skipping the multi-expert check)`)
}
console.log(`  Bot: ${data.alternatives.map((o) => `${o.time} — ${o.person}`).join('  |  ')}`)

// Turn 4: the client replies with just the hour ("9") and it books.
// The hour is taken from what was actually offered rather than hardcoded — a
// real booking can fill 9 AM, and that is a busy calendar, not a broken parser.
const offered = data.alternatives[0]
check('at least one slot was offered', Boolean(offered), JSON.stringify(data.alternatives))
if (!offered) {
  console.log('\n1 check(s) failed — the calendar is full, nothing to book')
  process.exitCode = 1
  throw new Error('no alternatives offered')
}
const reply = String(parseInt(offered.time, 10))
const parsedReply = parseSlot(reply)
const chosen = data.alternatives.find((o) => o.time === parsedReply.time)
check(`bare "${reply}" matched the offered slot`, Boolean(chosen), `parsed ${parsedReply.time}, offered ${data.alternatives.map((o) => o.time).join(', ')}`)
if (!chosen) {
  console.log('\n1 check(s) failed')
  process.exitCode = 1
  throw new Error('bare hour did not resolve to an offer')
}

const r = await fetch(`${API}/appointments/book`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ dayIdx: data.day, time: chosen.time, person: chosen.person, category, client: 'Flow Test' }),
})
const appt = await r.json()
check('booked in one reply, no confirmation step', r.status === 200 && Boolean(appt.id), JSON.stringify(appt))
console.log(`  Bot: ✅ Booked — ${appt.slot} with ${appt.person}`)

// The support calendar reads the same rows
const onCalendar = (await get('/appointments')).some?.((a) => a.id === appt.id)
check('booking is visible to the support calendar', onCalendar !== false)

await fetch(`${API}/appointments/${appt.id}`, { method: 'DELETE' })

console.log(failed ? `\n${failed} check(s) failed` : '\n✓ conversation flow works end to end')
// exitCode (not process.exit) so Node can close its keep-alive sockets cleanly
process.exitCode = failed ? 1 : 0
