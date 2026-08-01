// Pure function: chat log -> the questions the client actually asked HelpSense.
//
// It exists so the support side opens a booked meeting already knowing what the
// call is about. Without it the expert sees "Payroll, Tomorrow 3:00 PM" and has
// to ask the client to repeat the problem — the exact thing the pre-meeting
// brief is supposed to prevent.
//
// Most of the work is throwing things away. A booking conversation is mostly
// mechanics: chip taps ("Payroll"), slot picks ("9", "3 pm"), an expert's name,
// yes/no answers. None of that tells the expert anything. What is worth keeping
// is the sentences the client typed at the bot before the handover.

import { botScripts } from '../data/botScripts.js'
import { MODULE_CHIPS } from './matchModule.js'

const MAX_QUESTIONS = 3
const MAX_LENGTH = 180

// Every canned chip label in the product. A chip tap is pushed into the log as
// if the client typed it, so without this list "✅ Yes, solved!" reads as a question.
const chipLabels = (copy) =>
  new Set(
    [
      ...Object.values(copy.chips || {}).flat(),
      ...(copy.vision?.chips || []),
      ...(copy.release?.chips || []),
      ...(copy.reviewOptions || []),
      ...MODULE_CHIPS,
    ].map((s) => normalize(s))
  )

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s:]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()

// "9", "3 pm", "9:00 AM", "8 baje", "kal 3 baje" — a slot pick, not a question
const SLOT_ONLY = /^(kal|aaj|parso|today|tomorrow)?\s*\d{1,2}(:\d{2})?\s*(am|pm|baje|bje)?$/

// Tapping a slot in the picker echoes it into the chat as if the client typed
// it: "📅 Today, 12:00 PM" or "📅 12:00 PM — Rohit Sharma". The expert's name
// on the end pushes it past the word-count check, so it needs its own rule.
// Matched on the RAW text, because the trailing Capitalised name is the signal.
const SLOT_ECHO = /^\s*(?:[A-Za-z]{3,9},\s*)?\d{1,2}(?::\d{2})?\s*(?:AM|PM)(?:\s*[—–-]\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?\s*$/

// Chip and button labels open with an emoji ("📅 Today, 12:00 PM"). Stripping it
// lets the rules below see the label underneath — rather than rejecting anything
// emoji-led, which would also throw away a frustrated "😡 payslip nahi mil raha".
const stripLeadingEmoji = (text) => text.replace(/^[\p{Extended_Pictographic}️\s]+/u, '')

function isNoise(text, chips) {
  const raw = stripLeadingEmoji(String(text || '').trim())
  if (SLOT_ECHO.test(raw)) return true

  const n = normalize(raw)
  if (!n) return true
  if (chips.has(n)) return true
  if (SLOT_ONLY.test(n)) return true
  // "book an appointment", "book a call" — the request, not the problem
  if (/^(book|schedule)\b/.test(n) && n.split(' ').length <= 5) return true
  // One or two words is a pick (an expert's name, "ok", "payroll issue") — too
  // thin to brief anyone with, and the module is already on the appointment.
  return n.split(' ').length < 3
}

const truncate = (text) => (text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH - 1).trimEnd()}…` : text)

/**
 * @param log  [{from, text}] in chat order — the same history sent to the proxy
 * @returns    [{text, unanswered}] newest first, at most MAX_QUESTIONS.
 *             `unanswered` marks the question the docs could not answer, i.e.
 *             the one that sent the client to booking in the first place.
 */
export function clientQuestions(log = [], copy = botScripts, limit = MAX_QUESTIONS) {
  const chips = chipLabels(copy)
  // The bot replies that mean "a human needs to take this"
  const handoffs = new Set([copy.notCovered, copy.vision?.failed, copy.vision?.stillStuck].filter(Boolean))

  const found = []
  for (let i = log.length - 1; i >= 0 && found.length < limit; i--) {
    const entry = log[i]
    if (entry?.from !== 'user' || isNoise(entry.text, chips)) continue
    // The bot's next turn decides whether this question got answered
    const reply = log.slice(i + 1).find((m) => m.from !== 'user')
    found.push({ text: truncate(entry.text.trim()), unanswered: handoffs.has(reply?.text) })
  }
  return found
}
