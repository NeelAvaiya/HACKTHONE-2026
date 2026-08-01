// Checks for the pre-meeting brief: npm run test:questions (no server needed)
import { clientQuestions } from '../src/utils/clientQuestions.js'
import { sanitizeQuestions } from './availability.js'
import { botScripts } from '../src/data/botScripts.js'

let failed = 0
const check = (label, ok, detail) => {
  if (ok) return console.log(`✓ ${label}`)
  failed++
  console.log(`✗ ${label}${detail ? `\n    ${detail}` : ''}`)
}

const user = (text) => ({ from: 'user', text })
const bot = (text) => ({ from: 'bot', text })
const texts = (log) => clientQuestions(log).map((q) => q.text)

// The whole point: a real question survives the booking mechanics around it
const realLog = [
  user('payslip download nahi ho raha hai mobile app se'),
  bot(botScripts.notCovered),
  user('📅 Book an appointment'),
  user('Payroll'),
  bot('These Payroll experts are free today:'),
  user('9'),
]
check('the real question is kept', texts(realLog).includes('payslip download nahi ho raha hai mobile app se'))
check('the slot pick is dropped', !texts(realLog).includes('9'))
check('the module chip is dropped', !texts(realLog).includes('Payroll'))
check('the book CTA is dropped', !texts(realLog).some((t) => t.toLowerCase().startsWith('book an appointment')))
check('only the question remains', texts(realLog).length === 1, JSON.stringify(texts(realLog)))

// The question that sent them to booking is the one the expert must see first
const flagged = clientQuestions(realLog)[0]
check('the unanswered question is flagged', flagged.unanswered === true)

// A question the docs DID answer is worth showing, but not as unanswered
const answered = clientQuestions([
  user('how do I apply for casual leave'),
  bot('Go to Leave → Apply Leave and pick the type.'),
])
check('an answered question is still captured', answered.length === 1)
check('an answered question is not flagged', answered[0].unanswered === false)

// Noise that would otherwise read as a question
const noise = [
  user('✅ Yes, solved!'),
  user('❌ No, still stuck'),
  user('3 pm'),
  user('kal 3 baje'),
  user('9:00 AM'),
  user('Priya'),
  user('ok'),
  user('😍 Great'),
  user('book a call'),
]
check('no chip or slot reply is treated as a question', clientQuestions(noise).length === 0, JSON.stringify(texts(noise)))

// The slot picker echoes the tapped offer into the chat as a user message. Two
// shapes have shipped, and the second one survived the word-count check.
const echoes = [
  user('📅 Today, 12:00 PM'),
  user('📅 12:00 PM — Rohit Sharma'),
  user('12:00 PM — Rohit Sharma'),
  user('📅 Book an appointment'),
  user('Tomorrow, 3:00 PM'),
]
check('slot echoes are dropped', clientQuestions(echoes).length === 0, JSON.stringify(texts(echoes)))

// ...but stripping the emoji must not throw away a real question that opens with one
const angry = clientQuestions([user('😡 payslip abhi tak nahi mila')])
check('an emoji-led question is kept', angry.length === 1, JSON.stringify(texts([user('😡 payslip abhi tak nahi mila')])))
check('the emoji is preserved in the text', angry[0]?.text.startsWith('😡'))

// Bot turns are never questions, whatever they say
check('bot messages are ignored', clientQuestions([bot('Which module is this about?')]).length === 0)

// Ordering and limits
const many = [user('question one about payroll'), user('question two about attendance'), user('question three about pms'), user('question four about sso')]
const ordered = texts(many)
check('newest question comes first', ordered[0] === 'question four about sso', ordered[0])
check('at most three questions are kept', ordered.length === 3, String(ordered.length))

// Long questions are truncated so one paste can't fill the support pane
const long = clientQuestions([user('why is the payslip wrong '.repeat(30))])[0]
check('a long question is truncated', long.text.length <= 180, String(long.text.length))
check('truncation is marked with an ellipsis', long.text.endsWith('…'))

// Degenerate input
check('an empty log gives nothing', clientQuestions([]).length === 0)
check('undefined input does not throw', clientQuestions().length === 0)
check('a missing text does not throw', clientQuestions([{ from: 'user' }]).length === 0)

// Server-side sanitising — this is browser-supplied free text
check('non-array input is rejected', sanitizeQuestions('drop table').length === 0)
check('null is rejected', sanitizeQuestions(null).length === 0)
check('plain strings are accepted', sanitizeQuestions(['why is my payslip missing'])[0].text === 'why is my payslip missing')
check('a plain string is not flagged unanswered', sanitizeQuestions(['x'])[0].unanswered === false)
check('unanswered is coerced to a boolean', sanitizeQuestions([{ text: 'q', unanswered: 'yes' }])[0].unanswered === true)
check('empty entries are dropped', sanitizeQuestions([{ text: '   ' }, { text: 'real question' }]).length === 1)
check('the array is capped at three', sanitizeQuestions(Array(50).fill({ text: 'q' })).length === 3)
check('each question is capped at 180 chars', sanitizeQuestions([{ text: 'q'.repeat(9000) }])[0].text.length === 180)
check('malformed entries are dropped', sanitizeQuestions([null, 42, { nope: 1 }, { text: 'ok question' }]).length === 1)

console.log(failed ? `\n${failed} check(s) failed` : '\n✓ all client-question checks passed')
process.exitCode = failed ? 1 : 0
