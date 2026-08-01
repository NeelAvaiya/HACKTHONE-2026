// Checks for the ticket / feature-request counts: npm run test:work (no server needed)
import { workStats, undelivered, announcementKey } from '../src/utils/workStats.js'
import { clientWorkSeed, KIND_LABEL } from '../src/data/clientWork.js'

let failed = 0
const check = (label, ok, detail) => {
  if (ok) return console.log(`✓ ${label}`)
  failed++
  console.log(`✗ ${label}${detail ? `\n    ${detail}` : ''}`)
}

const item = (id, kind, status, notified = false) => ({ id, kind, status, notified })

// Empty and malformed input
const empty = workStats([])
check('empty list gives zeros', empty.openTickets === 0 && empty.openFRs === 0 && empty.totalOpen === 0)
check('undefined input is handled', workStats().total === 0)
check('non-array input is handled', workStats(null).total === 0)

const list = [
  item('T1', 'ticket', 'open'),
  item('T2', 'ticket', 'open'),
  item('T3', 'ticket', 'done'),
  item('F1', 'fr', 'open'),
  item('F2', 'fr', 'done'),
]
const stats = workStats(list)
check('counts open tickets', stats.openTickets === 2, String(stats.openTickets))
check('counts open feature requests', stats.openFRs === 1, String(stats.openFRs))
check('counts resolved tickets', stats.doneTickets === 1)
check('counts shipped feature requests', stats.doneFRs === 1)
check('totalOpen spans both kinds', stats.totalOpen === 3, String(stats.totalOpen))
check('total counts everything', stats.total === 5)

// Tickets and FRs must not bleed into each other's counts
check('a done ticket is not counted as open', workStats([item('T', 'ticket', 'done')]).openTickets === 0)
check('an FR is never counted as a ticket', workStats([item('F', 'fr', 'open')]).openTickets === 0)

// undelivered drives the chat announcement
const toAnnounce = [
  item('A', 'ticket', 'done', false),
  item('B', 'ticket', 'done', true),
  item('C', 'ticket', 'open', false),
]
check('undelivered picks resolved-but-unannounced only', undelivered(toAnnounce).map((i) => i.id).join(',') === 'A')
check('an announced item is not repeated', !undelivered(toAnnounce).some((i) => i.id === 'B'))
check('an open item is never announced', !undelivered(toAnnounce).some((i) => i.id === 'C'))
check('undelivered handles empty input', undelivered().length === 0)

// Reopens: support's are announced to the client, the client's own are not
const reopened = [
  { id: 'R1', kind: 'ticket', status: 'open', notified: false, reopen: { by: 'support', reason: 'still broken', at: 't1' } },
  { id: 'R2', kind: 'ticket', status: 'open', notified: false, reopen: { by: 'client', reason: 'not fixed', at: 't2' } },
  { id: 'R3', kind: 'ticket', status: 'open', notified: false },
]
const announced = undelivered(reopened).map((i) => i.id)
check('a support reopen is announced', announced.includes('R1'), announced.join(','))
check('a client reopen is not announced', !announced.includes('R2'), announced.join(','))
check('a plain open item is not announced', !announced.includes('R3'))

// The guard key must identify the event, not the item: resolve -> reopen ->
// resolve is three separate updates the client needs to hear about
const base = { id: 'K1', kind: 'ticket' }
const firstResolve = announcementKey({ ...base, status: 'done', resolvedAt: 't1' })
const theReopen = announcementKey({ ...base, status: 'open', reopen: { at: 't2' } })
const secondResolve = announcementKey({ ...base, status: 'done', resolvedAt: 't3' })
check('resolve and reopen produce different keys', firstResolve !== theReopen)
check('two resolves of the same item differ', firstResolve !== secondResolve, `${firstResolve} vs ${secondResolve}`)
check('the same event produces a stable key', firstResolve === announcementKey({ ...base, status: 'done', resolvedAt: 't1' }))

// Seed data integrity — the demo starts from this
check('seed has both kinds', clientWorkSeed.some((i) => i.kind === 'ticket') && clientWorkSeed.some((i) => i.kind === 'fr'))
check('every seed item starts open', clientWorkSeed.every((i) => i.status === 'open'))
check('no seed item starts announced', clientWorkSeed.every((i) => i.notified === false))
check('seed ids are unique', new Set(clientWorkSeed.map((i) => i.id)).size === clientWorkSeed.length)
check('every seed kind has a label', clientWorkSeed.every((i) => KIND_LABEL[i.kind]))
check('every seed item has a title and module', clientWorkSeed.every((i) => i.title && i.module))

console.log(failed ? `\n${failed} check(s) failed` : '\n✓ all work-stats checks passed')
process.exitCode = failed ? 1 : 0
