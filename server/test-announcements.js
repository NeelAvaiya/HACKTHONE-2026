// Checks for the Announcements feed: npm run test:announce (no server needed)
import { buildAnnouncements, unreadSince, latestAt } from '../src/utils/announcements.js'

const copy = {
  announce: {
    chipResolved: 'Resolved',
    chipReopened: 'Reopened',
    resolved: { headline: '✅ Your {kind} {id} is done', note: 'Marked resolved by the Superworks {module} team.' },
    reopenedBySupport: { headline: '🔄 We have reopened your {kind} {id}', note: 'Our team is taking another look.' },
    reopenedByClient: { headline: '🔄 You reopened your {kind} {id}', note: 'It is back with the {module} team.' },
  },
}

let failed = 0
const check = (label, ok, detail) => {
  if (ok) return console.log(`✓ ${label}`)
  failed++
  console.log(`✗ ${label}${detail ? `\n    ${detail}` : ''}`)
}

const item = (over) => ({ id: 'SUP-1', kind: 'ticket', title: 'Payslip blank', status: 'open', ...over })

// Nothing to announce
check('open items produce nothing', buildAnnouncements([item()], copy).length === 0)
check('empty input is handled', buildAnnouncements([], copy).length === 0)
check('undefined input is handled', buildAnnouncements(undefined, copy).length === 0)

// Resolved — reads as a message, not a table row
const resolved = buildAnnouncements([item({ status: 'done', module: 'Payroll', resolvedAt: '2026-08-01T10:00:00Z' })], copy)
check('a resolved item produces one entry', resolved.length === 1)
check('the entry is a resolution', resolved[0].type === 'resolved')
check('the headline names kind and id', resolved[0].headline === '✅ Your ticket SUP-1 is done', resolved[0].headline)
check('the item wording is quoted separately', resolved[0].quote === 'Payslip blank', resolved[0].quote)
check('the note names the module team', resolved[0].note.includes('Payroll team'), resolved[0].note)
check('no placeholder survives into the headline', !resolved[0].headline.includes('{'))
check('no placeholder survives into the note', !resolved[0].note.includes('{'))

// "Other" is a bucket, not a team
const other = buildAnnouncements([item({ status: 'done', module: 'Other', resolvedAt: '2026-08-01T10:00:00Z' })], copy)
check('an "Other" module reads as the support team', other[0].note.includes('support team'), other[0].note)
check('an "Other" module never says "Other team"', !other[0].note.includes('Other team'))
const noModule = buildAnnouncements([item({ status: 'done', module: undefined, resolvedAt: '2026-08-01T10:00:00Z' })], copy)
check('a missing module falls back to support', noModule[0].note.includes('support team'), noModule[0].note)

// A feature request reads as a feature request, not a ticket
const fr = buildAnnouncements([item({ kind: 'fr', status: 'done', resolvedAt: '2026-08-01T10:00:00Z' })], copy)
check('a feature request is named as one', fr[0].headline.includes('feature request'), fr[0].headline)

// Reopened — the voice changes depending on who sent it back
const bySupport = buildAnnouncements(
  [item({ reopen: { reason: 'Still blank', by: 'support', at: '2026-08-01T11:00:00Z' } })],
  copy
)
check('a reopen produces an entry', bySupport.length === 1 && bySupport[0].type === 'reopened')
check('support reopening speaks as "we"', bySupport[0].headline.startsWith('🔄 We have reopened'), bySupport[0].headline)
check('the reopen carries the reason', bySupport[0].reason === 'Still blank')

const byClient = buildAnnouncements(
  [item({ reopen: { reason: 'Nope', by: 'client', at: '2026-08-01T11:00:00Z' } })],
  copy
)
check('the client reopening speaks as "you"', byClient[0].headline.startsWith('🔄 You reopened'), byClient[0].headline)

// Reopening removes the "resolved" notice: it is no longer true
const afterReopen = buildAnnouncements(
  [item({ status: 'open', resolvedAt: null, reopen: { reason: 'Nope', by: 'client', at: '2026-08-01T12:00:00Z' } })],
  copy
)
check('a reopened item no longer claims to be resolved', !afterReopen.some((a) => a.type === 'resolved'))

// Ordering — newest first
const feed = buildAnnouncements(
  [
    item({ id: 'A', status: 'done', resolvedAt: '2026-08-01T09:00:00Z' }),
    item({ id: 'B', status: 'done', resolvedAt: '2026-08-01T12:00:00Z' }),
    item({ id: 'C', status: 'done', resolvedAt: '2026-08-01T10:00:00Z' }),
  ],
  copy
)
check('newest entry comes first', feed[0].itemId === 'B', feed.map((a) => a.itemId).join(','))
check('oldest entry comes last', feed[feed.length - 1].itemId === 'A')

// An entry with no timestamp must sink, not float to the top
const mixed = buildAnnouncements(
  [item({ id: 'X', status: 'done', resolvedAt: null }), item({ id: 'Y', status: 'done', resolvedAt: '2026-08-01T09:00:00Z' })],
  copy
)
check('an undated entry sinks below dated ones', mixed[0].itemId === 'Y', mixed.map((a) => a.itemId).join(','))

// Unread counting is by timestamp, not by the item's notified flag
check('everything is unread when never opened', unreadSince(feed, '') === 3)
check('only newer entries count as unread', unreadSince(feed, '2026-08-01T09:00:00Z') === 2)
check('nothing is unread once caught up', unreadSince(feed, '2026-08-01T12:00:00Z') === 0)
check('the notified flag does not affect the badge', unreadSince(buildAnnouncements([item({ id: 'N', status: 'done', notified: true, resolvedAt: '2026-08-01T09:00:00Z' })], copy), '') === 1)
check('undated entries never count as unread', unreadSince(mixed, '') === 1)

check('latestAt returns the newest timestamp', latestAt(feed) === '2026-08-01T12:00:00Z', latestAt(feed))
check('latestAt on an empty feed is empty', latestAt([]) === '')

console.log(failed ? `\n${failed} check(s) failed` : '\n✓ all announcement checks passed')
process.exitCode = failed ? 1 : 0
