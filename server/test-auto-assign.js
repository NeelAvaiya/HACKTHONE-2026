// Integrity checks for the auto-assignment preview data: npm run test:autoassign
// The scenario is hand-written, so a mistyped expert name or a slot row of the
// wrong length would break the animation silently rather than throwing.
import { autoAssignDemo, autoAssignCopy } from '../src/data/autoAssignDemo.js'

const { request, times, experts, steps, result } = autoAssignDemo
const names = experts.map((e) => e.name)

let failed = 0
const check = (label, ok, detail) => {
  if (ok) return console.log(`✓ ${label}`)
  failed++
  console.log(`✗ ${label}${detail ? `\n    ${detail}` : ''}`)
}

check('the requested time is a column in the grid', times.includes(request.time), request.time)
check('every expert has one slot per time', experts.every((e) => e.slots.length === times.length))

const VALID = ['free', 'busy', 'taken', 'booked']
check(
  'every slot uses a known state',
  experts.every((e) => e.slots.every((s) => VALID.includes(s))),
  experts.flatMap((e) => e.slots).filter((s) => !VALID.includes(s)).join(', ')
)

// The conflict: exactly one expert is already taken at the requested time
const requestedIdx = times.indexOf(request.time)
const taken = experts.filter((e) => e.slots[requestedIdx] === 'taken')
check('exactly one expert is taken at the requested time', taken.length === 1, `got ${taken.length}`)
check('the conflicting expert is eligible', taken[0]?.eligible === true)

// The result: the assigned expert must exist, be eligible, and actually be free
const assigned = experts.find((e) => e.name === result.expert)
check('the assigned expert exists in the grid', Boolean(assigned), result.expert)
check('the assigned expert is eligible for this category', assigned?.eligible === true)
check('the assigned expert is free at the requested time', assigned?.slots[requestedIdx] === 'free')
check('the assigned expert is not the conflicting one', result.expert !== taken[0]?.name)
check('the result keeps the requested time', result.time === request.time)

// Steps drive the animation, so each highlight must name a real expert
check(
  'every step highlight names a real expert',
  steps.every((s) => s.highlight === null || names.includes(s.highlight)),
  steps.filter((s) => s.highlight && !names.includes(s.highlight)).map((s) => s.highlight).join(', ')
)
check('the last step is the assignment', steps[steps.length - 1].status === 'assigned')
check('a conflict step exists', steps.some((s) => s.status === 'conflict'))
check('the last step highlights the assigned expert', steps[steps.length - 1].highlight === result.expert)
check('every step has a title and detail', steps.every((s) => s.title && s.detail))

// At least one ineligible expert, or the "skipped" narration has nothing to show
check('some experts are ineligible, so the scan step is visible', experts.some((e) => !e.eligible))

// Legend keys must match the cell states the component renders
check(
  'the legend covers every cell state',
  VALID.every((s) => s in autoAssignCopy.legend),
  Object.keys(autoAssignCopy.legend).join(', ')
)

console.log(failed ? `\n${failed} check(s) failed` : '\n✓ all auto-assign preview checks passed')
process.exitCode = failed ? 1 : 0
