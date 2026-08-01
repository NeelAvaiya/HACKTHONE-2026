// Pure function: free text -> { dayIdx, time, confident }. No network, no React.
// dayIdx is a relative offset from today (0 = today). `time` is normalised to the
// same "9:00 AM" shape as timeSlots so it can be string-compared against offers.

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

// Booking words that carry no time on their own — used by the chat to tell
// "book an appointment" apart from small talk.
export const BOOKING_KEYWORDS = [
  'book', 'appointment', 'meeting', 'schedule', 'slot', 'call', 'milna', 'baat karni', 'demo',
]

export function looksLikeBooking(text) {
  const lower = String(text || '').toLowerCase()
  return BOOKING_KEYWORDS.some((k) => lower.includes(k))
}

export function parseSlot(text, now = new Date()) {
  const lower = String(text || '').toLowerCase()
  const time = parseTime(lower)
  return { dayIdx: parseDay(lower, now), time, confident: Boolean(time) }
}

function parseDay(lower, now) {
  // "day after tomorrow" contains "tomorrow", so it has to be tested first
  if (/\b(day after tomorrow|parso|parsu)\b/.test(lower)) return 2
  if (/\b(tomorrow|kal)\b/.test(lower)) return 1
  if (/\b(today|aaj|abhi)\b/.test(lower)) return 0

  const named = WEEKDAYS.findIndex((d) => new RegExp(`\\b${d}\\b`).test(lower))
  if (named >= 0) {
    // Next occurrence of that weekday; "monday" said on a Monday means next Monday
    const offset = (named - now.getDay() + 7) % 7
    return offset === 0 ? 7 : offset
  }
  return 0
}

// Matches: 8 · 8am · 8 am · 8pm · 8:30 · at 8 · 8 baje · 8 bje · 08:00 AM
const TIME_RE = /\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*(?:baje|bje)?\b/

function parseTime(lower) {
  const m = lower.match(TIME_RE)
  if (!m) return null

  let hour = parseInt(m[1], 10)
  const meridiem = m[3]?.replace(/\./g, '')
  if (Number.isNaN(hour) || hour > 23) return null

  if (meridiem === 'pm' && hour < 12) hour += 12
  else if (meridiem === 'am' && hour === 12) hour = 0
  else if (!meridiem && hour <= 12) {
    // Business-hours heuristic: a bare 1-6 means afternoon, 7-11 means morning,
    // 12 means noon. Nobody books a 4 AM call with Payroll.
    if (hour >= 1 && hour <= 6) hour += 12
  }

  // Minutes are dropped: every slot sits on the hour
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:00 ${hour < 12 ? 'AM' : 'PM'}`
}
