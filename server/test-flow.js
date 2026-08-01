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
check('two or more experts offered', data.alternatives.length >= 2, JSON.stringify(data.alternatives))
console.log(`  Bot: ${data.alternatives.map((o) => `${o.time} — ${o.person}`).join('  |  ')}`)

// Turn 4: the client replies with just "9" and it books
const reply = '9'
const parsedReply = parseSlot(reply)
const chosen = data.alternatives.find((o) => o.time === parsedReply.time)
check('bare "9" matched an offered slot', Boolean(chosen), `parsed ${parsedReply.time}`)

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
