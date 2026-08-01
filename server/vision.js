// POST /api/vision — the client sends a screenshot they already uploaded plus their
// question; Gemini reads the image against the same help docs the chat route uses.
// Same contract as /api/chat: covered:false means "docs don't answer this" and the
// frontend routes the client to book an appointment instead.
import { Router } from 'express'
import { readUploadForModel } from './uploads.js'

// Mirrors the hints in /api/chat — the model follows an explicit instruction far
// more reliably than it infers the language from a short question.
const LANG_HINT = {
  hi: 'The user is writing Hindi in Latin script. Reply in Hindi using Latin script.',
  hinglish: 'The user is writing Hinglish. Reply in the same Hindi-English mix.',
  en: 'The user is writing English. Reply in English.',
}

const VISION_RULES = `The user has shared a screenshot from the Superworks product and asked a question about it.

HOW TO READ THE IMAGE:
- Say what you can actually see: the screen or menu they are on, any error/toast text, empty states, greyed-out buttons, filter values.
- If the user has highlighted, circled, boxed, arrowed or scribbled on any part of the image, that marked area IS their question. Answer about that first and say what you see there.
- Never guess at text you cannot read. If the screenshot is too small or blurry to be sure, say so and ask for a clearer one.

HOW TO ANSWER:
- If the OFFICIAL SUPERWORKS HELP DOCS explain what they are looking at, answer in this shape:
  one line naming what you see, then the fix as numbered steps quoting the exact navigation paths from the docs.
- Keep it tight: at most 6 short steps.
- If the docs do not cover what the screenshot shows, reply with exactly the single token NOT_COVERED and nothing else.`

export function makeVision({ apiKeys = [], models = [], callGemini }) {
  const vision = Router()

  vision.post('/vision', async (req, res) => {
    const { fileId, question, lang = 'en', history = [] } = req.body || {}
    if (!fileId) return res.status(400).json({ error: 'fileId is required' })

    const file = await readUploadForModel(fileId)
    if (!file) return res.status(415).json({ error: 'that file type cannot be read as an image' })
    if (!apiKeys.length) return res.json({ reply: null, covered: false, source: 'no-key' })

    const contents = [
      ...history.slice(-6).map((m) => ({
        role: m.from === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      })),
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: file.mime, data: file.base64 } },
          {
            text: `${VISION_RULES}\n\n${LANG_HINT[lang] || LANG_HINT.en}\n\nThe user asks: ${
              question?.trim() || 'What is this screen showing, and what should I do?'
            }`,
          },
        ],
      },
    ]

    for (const key of apiKeys) {
      for (const model of models) {
        const reply = await callGemini(key, model, contents)
        if (!reply) continue
        const covered = !reply.includes('NOT_COVERED')
        return res.json({ reply: covered ? reply : null, covered, source: 'gemini', model })
      }
    }
    // Every key/model failed — the client falls back to booking an appointment
    res.json({ reply: null, covered: false, source: 'fallback' })
  })

  return vision
}
