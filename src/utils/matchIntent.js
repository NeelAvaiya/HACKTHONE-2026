// Pure function: (text) => intent name, by keyword matching against botScripts
import { botScripts } from '../data/botScripts.js'

// Greetings and pleasantries, in all three languages. Checked before the doc
// intents so a plain "hi" gets an answer instead of being routed to booking.
// Matched on whole words: "hi" as a substring appears in "this", "which", "high".
const SMALL_TALK = {
  greeting: ['hi', 'hii', 'hey', 'hello', 'helo', 'yo', 'namaste', 'namaskar'],
  howAreYou: ['kaise', 'kaisi'],
  thanks: ['thanks', 'thankyou', 'thx', 'shukriya', 'dhanyavaad'],
  bye: ['bye', 'goodbye', 'alvida'],
}

const tokens = (text) =>
  String(text || '').toLowerCase().split(/[^a-z0-9ऀ-ॿ]+/).filter(Boolean)

// Multi-word greetings that whole-word matching alone would miss
const PHRASES = [
  { key: 'greeting', re: /\bgood (morning|afternoon|evening)\b/ },
  { key: 'howAreYou', re: /\bhow are you\b|\bkaise ho\b|\bkya haal\b/ },
  { key: 'thanks', re: /\bthank you\b/ },
]

/**
 * Which small-talk reply fits, or null. Only fires on short messages — "hi, my
 * payroll run failed" is a support request that happens to open with a greeting.
 */
export function matchSmallTalk(text) {
  const lower = String(text || '').toLowerCase()
  const words = tokens(lower)
  if (!words.length || words.length > 5) return null

  const phrase = PHRASES.find((p) => p.re.test(lower))
  if (phrase) return phrase.key

  for (const [key, list] of Object.entries(SMALL_TALK)) {
    if (words.some((w) => list.includes(w))) return key
  }
  return null
}

export function matchIntent(text) {
  const lower = text.toLowerCase()

  for (const script of botScripts.intents) {
    const hasKeyword = script.keywords.some((k) => lower.includes(k))
    if (!hasKeyword) continue
    // Some intents (P1) need a second keyword group to also match
    if (script.requiresAlso) {
      const hasSecond = script.requiresAlso.some((k) => lower.includes(k))
      if (!hasSecond) continue
    }
    return script.intent
  }
  return 'fallback'
}
