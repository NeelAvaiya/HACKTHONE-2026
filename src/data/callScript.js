// Scripted call dialogue, played back on a timer in the meeting room.
// ALL dialogue lives here, never in JSX. {expert} and {client} are replaced with
// the real first names from the appointment at render time.
//
// The Payroll script deliberately tracks the meeting summary in botScripts.js —
// the call and the summary the client receives afterwards tell the same story.

const payroll = [
  { speaker: 'expert', text: "Hi {client}, thanks for joining. I've read your ticket — the payslip download for March, right?", ms: 5200 },
  { speaker: 'client', text: "Yes. My team downloads payslips every month and this time the PDF just comes out blank.", ms: 5000 },
  { speaker: 'expert', text: "Got it. Can you open My Payroll → Payslips and tell me what the financial year filter shows?", ms: 5200 },
  { speaker: 'client', text: "It says FY 2026-27. But March salary is last financial year, isn't it?", ms: 4600 },
  { speaker: 'expert', text: "That's exactly it. The filter defaults to the current FY, so March slips sit under FY 2025-26.", ms: 5400 },
  { speaker: 'client', text: "Ah. So it was never missing — I was just looking in the wrong year.", ms: 4200 },
  { speaker: 'expert', text: "Right. And for bulk downloads, use Admin → Payroll → Bulk PDF Export instead of one row at a time.", ms: 5600 },
  { speaker: 'client', text: "That helps. We do about 200 payslips a month, so clicking each one was painful.", ms: 4800 },
  { speaker: 'expert', text: "Understood. The default-year behaviour is confusing, so we're shipping a hotfix tonight.", ms: 5200 },
  { speaker: 'client', text: "Perfect. Anything I need to do on my side after that?", ms: 3800 },
  { speaker: 'expert', text: "Just re-test tomorrow morning. I'll confirm the fix by 11 AM and you can close the ticket.", ms: 5200 },
  { speaker: 'client', text: "Sounds good. Thanks for turning this around so quickly.", ms: 3600 },
]

const generic = [
  { speaker: 'expert', text: "Hi {client}, thanks for making the time. I've gone through your ticket history before this call.", ms: 5200 },
  { speaker: 'client', text: "Thanks. It's been slowing my team down for about a week now.", ms: 4200 },
  { speaker: 'expert', text: "Let's reproduce it together — can you walk me through exactly what you click?", ms: 4800 },
  { speaker: 'client', text: "Sure. I open the module, apply the filter, and the list comes back empty.", ms: 4600 },
  { speaker: 'expert', text: "I can see it on my side too. That narrows it down to the filter, not your data.", ms: 5000 },
  { speaker: 'client', text: "That's a relief. Is there something we can use in the meantime?", ms: 4000 },
  { speaker: 'expert', text: "Yes — clear the filter and export from the admin view. Same result, one extra step.", ms: 5200 },
  { speaker: 'client', text: "We can live with that for a few days.", ms: 3200 },
  { speaker: 'expert', text: "The permanent fix goes out with this week's release. I'll keep you posted on the ticket.", ms: 5200 },
  { speaker: 'client', text: "Great, thank you for looking at it so quickly.", ms: 3400 },
]

export const callScripts = { Payroll: payroll, default: generic }

export const scriptFor = (category) => callScripts[category] || callScripts.default

// Static UI copy for the meeting room. The "Join meeting" button lives on the
// support thread, so its label sits in botScripts with the other button labels.
export const callCopy = {
  endLabel: 'End call',
  transcriptTitle: 'Live transcript',
  transcriptEmpty: 'The conversation will appear here as it happens.',
  encryption: 'This call is a simulation for demo purposes',
}
