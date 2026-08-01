// One source for the post-meeting summary. It is rendered in three places —
// the client chat, the support thread, and the client's My Meetings card — and
// they were each building the same text by hand.
import { botScripts } from '../data/botScripts.js'

/** Structured summary, for callers that lay the parts out themselves. */
export function meetingSummary(appt, copy = botScripts) {
  const expert = appt?.person?.split(' ')[0] || 'the expert'
  return {
    expert,
    discussed: copy.meetingSummary.discussed,
    nextSteps: copy.meetingSummary.nextSteps.map((s) => s.replace('{expert}', expert)),
  }
}

/** Markdown blob, for callers that render it inside a chat bubble. */
export function meetingSummaryText(appt, copy = botScripts) {
  const { expert, discussed, nextSteps } = meetingSummary(appt, copy)
  const bullets = (lines) => lines.map((l) => `• ${l}`).join('\n')
  return `📋 **Meeting Summary** — your call with ${expert} is complete ✅\n\n**Discussed:**\n${bullets(
    discussed
  )}\n\n**Next steps:**\n${bullets(nextSteps)}`
}
