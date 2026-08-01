// Table-driven checks for the slot parser: npm run test:slots (no server needed)
import { parseSlot, looksLikeBooking } from '../src/utils/parseSlot.js'

// Fixed "now" so weekday cases are deterministic — Wed 2026-08-05, 10:00 local
const NOW = new Date(2026, 7, 5, 10, 0, 0)

const cases = [
  // [input, expected dayIdx, expected time]
  ['8', 0, '8:00 AM'],
  ['I want to book at 8', 0, '8:00 AM'],
  ['8 baje book karna hai', 0, '8:00 AM'],
  ['8 bje', 0, '8:00 AM'],
  ['9', 0, '9:00 AM'],
  ['9:30', 0, '9:00 AM'], // minutes round down to the hour
  ['11 am', 0, '11:00 AM'],
  ['8pm', 0, '8:00 PM'],
  ['8 p.m.', 0, '8:00 PM'],
  ['3', 0, '3:00 PM'], // bare 1-6 means afternoon
  ['3 am', 0, '3:00 AM'], // explicit meridiem wins over the heuristic
  ['12', 0, '12:00 PM'], // noon, not midnight
  ['12 am', 0, '12:00 AM'],
  ['15:00', 0, '3:00 PM'], // 24-hour input
  ['tomorrow at 3', 1, '3:00 PM'],
  ['kal 3 baje', 1, '3:00 PM'],
  ['aaj 5 baje', 0, '5:00 PM'],
  ['day after tomorrow at 10', 2, '10:00 AM'],
  ['friday at 11', 2, '11:00 AM'], // Wed -> Fri is +2
  ['wednesday at 11', 7, '11:00 AM'], // same weekday means next week
  ['sometime after lunch', 0, null],
  ['book an appointment', 0, null],
  ['', 0, null],
]

let failed = 0

for (const [input, expectedDay, expectedTime] of cases) {
  const got = parseSlot(input, NOW)
  const ok = got.dayIdx === expectedDay && got.time === expectedTime && got.confident === Boolean(expectedTime)
  if (!ok) {
    failed++
    console.log(`✗ ${JSON.stringify(input)}`)
    console.log(`    expected  day=${expectedDay} time=${expectedTime}`)
    console.log(`    got       day=${got.dayIdx} time=${got.time}`)
  }
}

const bookingCases = [
  ['I want to book at 8', true],
  ['can I schedule a call', true],
  ['mujhe milna hai', true],
  ['my payslip is not downloading', false],
]

for (const [input, expected] of bookingCases) {
  if (looksLikeBooking(input) !== expected) {
    failed++
    console.log(`✗ looksLikeBooking(${JSON.stringify(input)}) expected ${expected}`)
  }
}

const total = cases.length + bookingCases.length
if (failed) {
  console.log(`\n${failed}/${total} failed`)
  process.exit(1)
}
console.log(`✓ all ${total} slot-parser cases passed`)
