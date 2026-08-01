// Pure function: (text) => intent name, by keyword matching against botScripts
import { botScripts } from '../data/botScripts.js'

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
