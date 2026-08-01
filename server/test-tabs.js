// Checks the sub-tab active rule for BOTH shells: npm run test:tabs (no server needed)
import { activeTabPath } from '../src/utils/activeTab.js'

let failed = 0
const check = (label, ok, detail) => {
  if (ok) return console.log(`✓ ${label}`)
  failed++
  console.log(`✗ ${label}${detail ? `\n    ${detail}` : ''}`)
}

// The real tab lists, kept in the same order as the shells declare them
const CLIENT = [{ to: '/' }, { to: '/requests' }, { to: '/meetings' }]
const SUPPORT = [
  { to: '/support' },
  { to: '/support/calendar' },
  { to: '/support/client-work' },
  { to: '/support/auto-assign' },
  { to: '/support/dashboard' },
  { to: '/support/metrics' },
]

const at = (tabs, path) => activeTabPath(tabs, path)

// Client shell — '/' is the Chat tab and the fallback
check('client root lights Chat', at(CLIENT, '/') === '/')
check('/chat lights Chat', at(CLIENT, '/chat') === '/', at(CLIENT, '/chat'))
check('/requests lights My Requests', at(CLIENT, '/requests') === '/requests')
check('/meetings lights My Meetings', at(CLIENT, '/meetings') === '/meetings')

// Support shell — the exact-match case that used to need an `end` flag
check('/support lights Inbox', at(SUPPORT, '/support') === '/support', at(SUPPORT, '/support'))
check('/support/calendar lights Calendar', at(SUPPORT, '/support/calendar') === '/support/calendar')
check('/support/client-work lights Client Work', at(SUPPORT, '/support/client-work') === '/support/client-work')
check('/support/auto-assign lights Auto-assign', at(SUPPORT, '/support/auto-assign') === '/support/auto-assign')
check('/support/dashboard lights Dashboard', at(SUPPORT, '/support/dashboard') === '/support/dashboard')
check('/support/metrics lights Metrics', at(SUPPORT, '/support/metrics') === '/support/metrics')

// Exactly one tab is ever lit — the bug being fixed was two rows disagreeing
for (const path of ['/', '/chat', '/requests', '/meetings']) {
  const lit = CLIENT.filter((t) => t.to === at(CLIENT, path))
  check(`exactly one client tab is lit on ${path}`, lit.length === 1, String(lit.length))
}
for (const path of ['/support', '/support/calendar', '/support/dashboard', '/support/metrics']) {
  const lit = SUPPORT.filter((t) => t.to === at(SUPPORT, path))
  check(`exactly one support tab is lit on ${path}`, lit.length === 1, String(lit.length))
}

// The client shell never claims a support path, and vice versa — this is the
// "tabs collapsing into each other" symptom expressed as an assertion
check('support paths never light a client tab', at(CLIENT, '/support/dashboard') === '/', at(CLIENT, '/support/dashboard'))
check('client paths light no support tab', at(SUPPORT, '/meetings') === null, String(at(SUPPORT, '/meetings')))

// A sibling path that merely starts with the same letters must not match
check('/supportive does not light Inbox', at(SUPPORT, '/supportive') === null, String(at(SUPPORT, '/supportive')))
check('/requests-old does not light My Requests', at(CLIENT, '/requests-old') === '/', at(CLIENT, '/requests-old'))

// A deeper page under a tab keeps that tab lit
check('a nested support page keeps its tab lit', at(SUPPORT, '/support/calendar/2026-08-01') === '/support/calendar')

// Degenerate input
check('no tabs gives null', at([], '/support') === null)

console.log(failed ? `\n${failed} check(s) failed` : '\n✓ all tab checks passed')
process.exitCode = failed ? 1 : 0
