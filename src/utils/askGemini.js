// Fetch wrapper for the Gemini proxy — resolves to { reply, covered }
// covered:false means the help docs don't answer this → offer appointment booking
import { botScripts } from '../data/botScripts.js'

export async function askGemini(message, history = []) {
  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        // Only send what the API needs (drop chips/cards/etc.)
        history: history.map((m) => ({ from: m.from, text: m.text })),
      }),
    })
    if (!r.ok) throw new Error(`proxy returned ${r.status}`)
    const data = await r.json()
    return { reply: data.reply, covered: data.covered !== false }
  } catch (err) {
    console.warn('askGemini failed, using scripted fallback:', err.message)
    const fallback = botScripts.intents.find((i) => i.intent === 'fallback')
    return { reply: fallback.responses[0], covered: true }
  }
}
