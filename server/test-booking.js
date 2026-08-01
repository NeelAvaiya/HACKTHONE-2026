// End-to-end booking checks against a running server: npm run test:booking
// (start `npm run server` in another terminal first)
const API = process.env.API || 'http://localhost:3001/api'

let failed = 0
const check = (label, ok, detail) => {
  if (ok) return console.log(`✓ ${label}`)
  failed++
  console.log(`✗ ${label}${detail ? `\n    ${detail}` : ''}`)
}

const get = (path) => fetch(`${API}${path}`).then((r) => r.json())
const send = (path, method, body) =>
  fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => ({ status: r.status, data: await r.json().catch(() => null) }))

try {
  await fetch(`${API}/team`)
} catch {
  console.log('⚠ Could not reach the server — is `npm run server` running?')
  process.exit(1)
}

// 1 — guided path: no time given, soonest slots come back
const guided = await get('/availability?category=Payroll')
check('guided path returns offers', guided.alternatives.length > 0, JSON.stringify(guided.alternatives))
check(
  'at most one offer per expert',
  new Set(guided.alternatives.map((o) => o.person)).size === guided.alternatives.length
)
check('at most one offer per time', new Set(guided.alternatives.map((o) => o.time)).size === guided.alternatives.length)
check('offers capped at 3', guided.alternatives.length <= 3)

// 2 — typed time that is outside business hours
const early = await get('/availability?category=Payroll&day=0&time=8:00 AM')
check('8:00 AM is out of hours', early.inHours === false)
check('no exact match for an out-of-hours time', early.exact.length === 0)
check('out-of-hours request still gets alternatives', early.alternatives.length > 0)
console.log(`    offered: ${early.alternatives.map((o) => `${o.time} — ${o.person}`).join(' | ')}`)

// 3 — book the first alternative
const offer = early.alternatives[0]
const booked = await send('/appointments/book', 'POST', {
  dayIdx: early.day,
  time: offer.time,
  person: offer.person,
  category: 'Payroll',
  client: 'Test Client (automated)',
})
check('booking succeeds', booked.status === 200 && Boolean(booked.data?.id), JSON.stringify(booked.data))
check('appointment stores an absolute date', /^\d{4}-\d{2}-\d{2}$/.test(booked.data?.date || ''), booked.data?.date)
check('appointment does not persist dayIdx', !('dayIdx' in (booked.data || {})))

// 4 — that expert is no longer offered at that time
const after = await get(`/availability?category=Payroll&day=${early.day}&time=${encodeURIComponent(offer.time)}`)
check(
  'booked expert is gone from that slot',
  !after.exact.some((e) => e.person === offer.person) &&
    !after.alternatives.some((o) => o.person === offer.person && o.time === offer.time)
)

// 5 — the same slot cannot be booked twice
const again = await send('/appointments/book', 'POST', {
  dayIdx: early.day,
  time: offer.time,
  person: offer.person,
  category: 'Payroll',
})
check('double-booking is rejected with 409', again.status === 409, `got ${again.status}`)
check('409 carries fresh alternatives', Array.isArray(again.data?.alternatives))

// 6 — undo frees the slot again
await send(`/appointments/${booked.data.id}`, 'DELETE')
const freed = await get(`/availability?category=Payroll&day=${early.day}&time=${encodeURIComponent(offer.time)}`)
check('undo frees the slot', freed.exact.some((e) => e.person === offer.person))

console.log(failed ? `\n${failed} check(s) failed` : '\n✓ all booking checks passed')
// exitCode (not process.exit) so Node can close its keep-alive sockets cleanly
process.exitCode = failed ? 1 : 0
