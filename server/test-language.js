// Language detection + small-talk matching: npm run test:lang (no server needed)
import { detectLanguage, resolveLanguage } from '../src/utils/detectLanguage.js'
import { matchSmallTalk } from '../src/utils/matchIntent.js'
import { matchModule } from '../src/utils/matchModule.js'

let failed = 0
const check = (label, ok, detail) => {
  if (ok) return console.log(`✓ ${label}`)
  failed++
  console.log(`✗ ${label}${detail ? `\n    ${detail}` : ''}`)
}

const cases = [
  // English
  ['my payslip is not downloading', 'en'],
  ['how do I apply for leave', 'en'],
  ['the report is empty', 'en'],
  // Hindi in Latin script — no English words mixed in
  ['attendance kya hai', 'hi'],
  ['mujhe chhutti apply karni hai'.replace('apply ', ''), 'hi'],
  ['payslip nahi mil rahi', 'hi'],
  ['mujhe kal subah baat karni hai', 'hi'],
  ['yeh kaise karte hain', 'hi'],
  // Hinglish — Hindi grammar with English words dropped in
  ['payslip download nahi ho rahi', 'hinglish'],
  ['mujhe ek meeting schedule karni hai', 'hinglish'],
  ['leave balance check karna hai', 'hinglish'],
  // No signal — must not flip the conversation
  ['9', null],
  ['ok', null],
  ['Payroll', null],
  ['', null],
  ['   ', null],
]

for (const [input, expected] of cases) {
  const got = detectLanguage(input)
  check(`detect ${JSON.stringify(input)} -> ${expected}`, got === expected, `got ${got}`)
}

// Word-boundary safety: these contain "kar"/"na"/"ho" as substrings
for (const word of ['Karnataka', 'market', 'nagpur', 'household', 'nothing works here']) {
  check(`"${word}" is not read as Hindi`, detectLanguage(word) !== 'hi', `got ${detectLanguage(word)}`)
}

// Stickiness: the booking reply "9" must not flip a Hindi conversation
let lang = resolveLanguage('en', 'attendance kya hai')
check('conversation switches to Hindi', lang === 'hi', lang)
lang = resolveLanguage(lang, 'Payroll')
check('a module reply keeps Hindi', lang === 'hi', lang)
lang = resolveLanguage(lang, '9')
check('a slot reply keeps Hindi', lang === 'hi', lang)
lang = resolveLanguage(lang, 'thanks a lot for the help')
check('a clear English message switches back', lang === 'en', lang)

// Small talk — must be answered, never routed to booking
const smallTalk = [
  ['hi', 'greeting'],
  ['Hello', 'greeting'],
  ['namaste', 'greeting'],
  ['good morning', 'greeting'],
  ['kaise ho', 'howAreYou'],
  ['how are you', 'howAreYou'],
  ['thanks', 'thanks'],
  ['thank you', 'thanks'],
  ['shukriya', 'thanks'],
  ['bye', 'bye'],
]
for (const [input, expected] of smallTalk) {
  check(`small talk ${JSON.stringify(input)} -> ${expected}`, matchSmallTalk(input) === expected, `got ${matchSmallTalk(input)}`)
}

// Real questions must NOT be swallowed as small talk
for (const input of [
  'hi my payroll run failed for the whole company',
  'attendance kya hai',
  'payslip download nahi ho rahi',
]) {
  check(`"${input}" is not small talk`, matchSmallTalk(input) === null, `got ${matchSmallTalk(input)}`)
}

// Module matching works in all three languages
check('"salary issue" -> Payroll', matchModule('salary issue') === 'Payroll')
check('"tankhwah" -> Payroll', matchModule('tankhwah ka sawaal hai') === 'Payroll')
check('"chhutti" -> HRMS', matchModule('chhutti ka status') === 'HRMS')

console.log(failed ? `\n${failed} check(s) failed` : '\n✓ all language checks passed')
process.exitCode = failed ? 1 : 0
