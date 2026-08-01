// Checks for the call-script timing math: npm run test:call (no server needed)
import { lineAt, scriptDuration, formatDuration } from '../src/utils/callScript.js'

const script = [
  { speaker: 'expert', text: 'one', ms: 1000 },
  { speaker: 'client', text: 'two', ms: 2000 },
  { speaker: 'expert', text: 'three', ms: 1500 },
]

let failed = 0
const check = (label, ok, detail) => {
  if (ok) return console.log(`✓ ${label}`)
  failed++
  console.log(`✗ ${label}${detail ? `\n    ${detail}` : ''}`)
}

const at0 = lineAt(script, 0)
check('0ms is the first line', at0.index === 0 && at0.line.text === 'one')
check('first line has one spoken entry', at0.spoken.length === 1)
check('first line is not done', at0.done === false)

const mid = lineAt(script, 1500)
check('1500ms falls inside the second line', mid.index === 1 && mid.line.text === 'two')
check('second line has two spoken entries', mid.spoken.length === 2, JSON.stringify(mid.spoken.map((l) => l.text)))

// The boundary belongs to the later line: at exactly 1000ms, line one is over
const boundary = lineAt(script, 1000)
check('the boundary resolves to the later line', boundary.index === 1, `got index ${boundary.index}`)

const last = lineAt(script, 4499)
check('just before the end is still the last line, not done', last.index === 2 && last.done === false)

const past = lineAt(script, 99999)
check('past the end holds the final line', past.index === 2 && past.line.text === 'three')
check('past the end is marked done', past.done === true)
check('past the end has spoken every line', past.spoken.length === 3)

check('an empty script returns null', lineAt([], 500) === null)
check('a missing script returns null', lineAt(undefined, 500) === null)

check('scriptDuration sums the lines', scriptDuration(script) === 4500, String(scriptDuration(script)))
check('formatDuration pads to MM:SS', formatDuration(65000) === '01:05', formatDuration(65000))
check('formatDuration handles zero', formatDuration(0) === '00:00')

console.log(failed ? `\n${failed} check(s) failed` : '\n✓ all call-script checks passed')
process.exitCode = failed ? 1 : 0
