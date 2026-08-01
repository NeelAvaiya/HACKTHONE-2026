// Checks for the review aggregation: npm run test:reviews (no server needed)
import { reviewStats, isReviewed, pendingReviews } from '../src/utils/reviewStats.js'
import { meetingSummary, meetingSummaryText } from '../src/utils/meetingSummary.js'

let failed = 0
const check = (label, ok, detail) => {
  if (ok) return console.log(`✓ ${label}`)
  failed++
  console.log(`✗ ${label}${detail ? `\n    ${detail}` : ''}`)
}

const review = (stars) => ({ stars, answers: { tone: '😍 Great', accuracy: '🙂 Okay', presence: '😍 Great' } })
const appt = (id, status, reviews) => ({ id, status, reviews })

// Empty and malformed input
const empty = reviewStats([])
check('empty list gives zeros', empty.reviewed === 0 && empty.awaiting === 0 && empty.total === 0)
check('empty list does not divide by zero', empty.average === 0, String(empty.average))
check('undefined input is handled', reviewStats().average === 0)
check('non-array input is handled', reviewStats(null).total === 0)

// Reviews are one-way: a client review is the whole story
const one = reviewStats([appt('A', 'done', { client: review(4) })])
check('a client review counts as reviewed', one.reviewed === 1 && one.awaiting === 0)
check('the client rating is the average', one.average === 4, String(one.average))

// A stray support review must be ignored entirely, not averaged in. Old rows in
// the database still carry one, and it must not move the numbers.
const stray = reviewStats([appt('A', 'done', { support: review(1) })])
check('a support-only review does not count as reviewed', stray.reviewed === 0 && stray.awaiting === 1)
check('a support rating is excluded from the average', stray.average === 0, String(stray.average))
const mixedSides = reviewStats([appt('A', 'done', { client: review(4), support: review(1) })])
check('a legacy support rating never drags the average', mixedSides.average === 4, String(mixedSides.average))

// Averaging across appointments, rounded to one decimal
const many = reviewStats([
  appt('A', 'done', { client: review(5) }),
  appt('B', 'done', undefined),
  appt('C', 'done', { client: review(4) }),
])
check('counts across appointments', many.total === 3 && many.reviewed === 2 && many.awaiting === 1)
check('average across appointments', many.average === 4.5, String(many.average))

// Rounding: (5 + 4 + 4) / 3 = 4.333... -> 4.3
const rounded = reviewStats([
  appt('A', 'done', { client: review(5) }),
  appt('B', 'done', { client: review(4) }),
  appt('C', 'done', { client: review(4) }),
])
check('average rounds to one decimal', rounded.average === 4.3, String(rounded.average))

// Upcoming meetings are not reviewable and must be excluded entirely
const mixed = reviewStats([
  appt('A', 'done', { client: review(5) }),
  appt('B', 'upcoming', undefined),
  appt('C', 'upcoming', undefined),
])
check('upcoming meetings are excluded', mixed.total === 1 && mixed.awaiting === 0, JSON.stringify(mixed))

// A done meeting with no reviews at all is awaiting, not reviewed
const none = reviewStats([appt('A', 'done', undefined)])
check('done with no reviews is awaiting', none.awaiting === 1 && none.reviewed === 0)
check('done with no reviews keeps average at 0', none.average === 0)

check('isReviewed is true with a client review', isReviewed(appt('A', 'done', { client: review(4) })))
check('isReviewed ignores a support review', !isReviewed(appt('A', 'done', { support: review(4) })))
check('isReviewed is false with none', !isReviewed(appt('A', 'done', undefined)))
check('isReviewed handles undefined', !isReviewed(undefined))

// pendingReviews — what the "My Meetings" badge counts
const list = [
  appt('A', 'done', { client: review(4) }), // nothing pending
  appt('B', 'done', { support: review(5) }), // a legacy support review is not the client's
  appt('C', 'done', undefined), // the client still owes one
  appt('D', 'upcoming', undefined), // not reviewable yet
]
check('pending client reviews', pendingReviews(list).map((a) => a.id).join(',') === 'B,C')
check('a support review does not clear the client badge', pendingReviews(list).some((a) => a.id === 'B'))
check('upcoming meetings are never pending', !pendingReviews(list).some((a) => a.id === 'D'))
check('empty list gives none', pendingReviews([]).length === 0)
check('undefined input gives none', pendingReviews().length === 0)

// meetingSummary — one source for text rendered in three places
const meeting = { id: 'A', person: 'Priya Nair', status: 'done' }
const summary = meetingSummary(meeting)
check('summary uses the expert first name', summary.expert === 'Priya', summary.expert)
check('next steps substitute the expert', summary.nextSteps.every((s) => !s.includes('{expert}')), summary.nextSteps.join(' | '))
check('next steps name the expert', summary.nextSteps.some((s) => s.includes('Priya')))
check('summary text includes the heading', meetingSummaryText(meeting).includes('Meeting Summary'))
check('summary text has no leftover placeholder', !meetingSummaryText(meeting).includes('{expert}'))
check('a missing person does not throw', meetingSummary({ id: 'X' }).expert === 'the expert')

console.log(failed ? `\n${failed} check(s) failed` : '\n✓ all review-stats checks passed')
process.exitCode = failed ? 1 : 0
