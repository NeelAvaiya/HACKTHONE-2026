// Fetch wrapper for the screenshot route — resolves to { reply, covered }
// covered:false means the docs don't answer what the image shows → offer booking.
export async function askVision(fileId, question, history = [], lang = 'en') {
  try {
    const r = await fetch('/api/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId,
        question,
        lang,
        history: history.map((m) => ({ from: m.from, text: m.text })),
      }),
    })
    if (!r.ok) throw new Error(`vision returned ${r.status}`)
    const data = await r.json()
    // `failed` separates "the model read it, the docs don't cover it" (→ book a call)
    // from "we never got an answer at all" (→ say so, then book a call)
    return {
      reply: data.reply,
      covered: data.covered !== false,
      failed: data.source === 'fallback' || data.source === 'no-key',
    }
  } catch (err) {
    console.warn('askVision failed:', err.message)
    return { reply: null, covered: false, failed: true }
  }
}
