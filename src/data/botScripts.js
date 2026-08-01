// ALL bot dialogue lives here — intents, keywords, responses, follow-ups. Edit copy here, never in JSX.
export const botScripts = {
  greeting:
    "Hi! I'm AI Syndicate 👋 I can fix common issues instantly, raise a ticket for you, or set up a call with our team. What's going on?",

  intents: [
    {
      intent: 'p1Escalation',
      keywords: ['payroll run'],
      requiresAlso: ['fail', 'everyone', 'whole company'],
      responses: [
        "That sounds serious — a failed payroll run affects everyone. I'm raising this as a **Critical (P1)** ticket right away.",
      ],
      followUp: 'collectModule',
    },
    {
      intent: 'selfResolve',
      keywords: ['payslip', 'download'],
      responses: [
        "I can help with that! Payslip download issues are usually fixed in under a minute. Try these steps:\n\n1. Go to **My Payroll → Payslips**\n2. Clear the month filter (it defaults to current month — March slips need 'FY 2025-26' selected)\n3. Click the **⬇ PDF** icon, not the row itself\n4. If the PDF is blank, disable your browser's pop-up blocker for this site",
      ],
      followUp: 'didThisSolve',
    },
    {
      intent: 'autoTicket',
      keywords: ['error', 'not working', 'fail', 'broken', 'issue', 'problem'],
      responses: [
        "Sorry you're hitting this! Let me grab a few details so I can route it to the right team instantly.",
      ],
      followUp: 'collectModule',
    },
    {
      intent: 'meeting',
      keywords: ['call', 'meeting', 'talk to someone', 'talk to a person', 'human'],
      responses: ["Of course! Let me check the team's availability..."],
      followUp: 'showSlots',
    },
    {
      intent: 'fallback',
      keywords: [],
      responses: [
        'I can help with payroll, attendance, or PMS issues — or set up a call with our team. Could you describe your issue?',
      ],
      followUp: null,
    },
  ],

  // Question prompts used by the auto-ticket flow (asked one at a time via chips)
  questions: {
    didThisSolve: 'Did this solve your issue?',
    collectModule: 'Which module is this about?',
    collectUrgency: 'How urgent is this for you?',
  },

  // Chip options for each question
  chips: {
    didThisSolve: ['✅ Yes, solved!', '❌ No, still stuck'],
    collectModule: ['Payroll', 'Attendance', 'PMS', 'Other'],
    collectUrgency: ['Blocking everyone', 'Blocking me', 'Can wait'],
  },

  // Identity strip at the top of the chat pane
  persona: {
    name: 'AI Syndicate',
    role: 'Senior. Support Specialist',
    status: 'Online - Clock In',
    typing: 'typing…',
  },

  // Chat pane tabs
  tabs: { chat: 'Chat', files: 'Files', starred: 'Starred' },

  // Three-dot menus: per message, and for the whole conversation
  menu: {
    edit: 'Edit message',
    delete: 'Delete message',
    copy: 'Copy text',
    deleteFile: 'Delete file',
    searchMessages: 'Search messages',
    editingLabel: 'Editing message',
    editedTag: 'edited',
    deletedToast: '🗑 Message deleted',
    fileDeletedToast: '🗑 {name} deleted',
    copiedToast: '📋 Copied to clipboard',
  },

  // Attachment copy ({name}/{count} filled in at render time)
  attachment: {
    received:
      "📎 Got **{name}** — thanks! It's saved to this conversation, you'll always find it under the **Files** tab.",
    receivedMany: '📎 Got all {count} files — saved to this conversation. They are listed under the **Files** tab.',
    inTicketFlow: "📎 Got **{name}** — I'll attach it to your ticket so the engineer sees it right away.",
    tooLarge: '⚠ {name} is over 15 MB — please share a smaller file or a link.',
    failed: "⚠ Couldn't upload {name}. {reason}",
    dropHint: 'Drop files here to send',
    emptyFiles: 'No files yet — share a screenshot, log or payslip and it will show up here.',
    emptyStarred: 'Nothing starred yet — tap ★ on any message to keep it here.',
  },

  // Screenshot flow: the bot asks what to look at, then answers from the docs.
  // `ask` is the bot speaking, so it mirrors the client's language like smallTalk.
  vision: {
    ask: {
      en: "📸 Got your screenshot. What would you like me to help you with in it? If you've highlighted or marked something, tell me — I'll look right there.",
      hi: '📸 Screenshot mil gaya. Isme main aapki kya madad karoon? Agar aapne kuch highlight ya mark kiya hai to bata dijiye — main wahin dekhta hoon.',
      hinglish:
        '📸 Screenshot mil gaya. Isme main aapki kya help karoon? Agar aapne kuch highlight ya mark kiya hai to batayiye — main wahin dekhta hoon.',
    },
    // No booking chip here on purpose — a call is only offered once the docs have failed
    chips: ['🔍 Explain this error', '📋 Give me the steps'],
    // Reading failed (bad key, unreadable file) → hand over to a human rather than guess
    failed:
      "I couldn't read that screenshot properly. 🙋 Book a quick call and an expert will look at it with you.",
    // Answer came from the docs → confirm it landed, reusing the didThisSolve chips
    followUp: 'Did that clear it up?',
    // Docs answered, client says it still isn't fixed → NOW a call is the right move
    stillStuck:
      "Sorry that didn't sort it out. 🙋 Let's put a person on it — book a quick call and an expert will go through your screenshot with you.",
  },

  // Release notes pushed into the client's chat the moment something goes live
  release: {
    toast: '🚀 {title} is now live',
    intro: "🚀 Heads up — we just shipped an update that affects you. Here's the release note:",
    liveLabel: 'LIVE',
    whatsNewLabel: "What's new",
    affectedLabel: "What's affected",
    fixesLabel: 'Fixes your tickets',
    typeLabels: { feature: 'New feature', enhancement: 'Enhancement', fix: 'Fix' },
    askIfHelp: 'Want me to walk you through anything in this update?',
    chips: ['✅ Got it, thanks!', '❓ Explain this update'],
    explainPrefix: 'Explain this release in simple terms: ',
    // Support-side publisher
    publishTitle: 'Release notes',
    publishHint: 'Publishing a note notifies every client inside their chat instantly.',
    publishCta: '🚀 Publish & notify clients',
    publishedToast: '🚀 Published — clients are being notified in chat',
  },

  // Chat window banner
  banner: '🌙 Support hours: 9 AM – 6 PM IST · Currently OFF-HOURS · AI Syndicate is online',

  // Caption for the fake screenshot placeholder in the self-resolve reply
  screenshotCaption: 'Screenshot: My Payroll → Payslips → ⬇ PDF',

  // Ticket ETAs shown on the inline TicketCard, by severity
  etaBySeverity: {
    P1: '2 hours',
    P2: 'Today, EOD',
    P3: '48 hours',
  },

  // Meeting booking data
  meetLink: 'meet.google.com/sup-care-aid',
  bookingLines: ['📅 Calendar invite sent to your email', '📝 {expert} will receive a pre-meeting brief before the call'],

  // In-chat booking flow ({time}/{day}/{module} filled in at render time)
  booking: {
    askModule: 'Sure — which module is this about?',
    moduleUnclear: "I didn't catch the module. Pick one and I'll find you the right expert:",
    outOfHours:
      'We work between 9:00 AM and 6:00 PM, so {time} is outside our hours. Here are the nearest {module} experts free {day}:',
    nearestTo: '{time} is already taken. The closest {module} experts free {day}:',
    rolledForward: 'Nothing is open today. The earliest {module} experts free {day}:',
    freeNow: 'These {module} experts are free {day}:',
    taken: 'That slot was just taken by someone else. Here is what is still open:',
    noSlots: 'Every slot is full for the next 5 days. I have flagged this for the team — someone will reach out to you directly.',
    unavailable: "I couldn't reach the calendar just now. Please try again in a moment.",
    failed: "The booking didn't go through. Please try again in a moment.",
    changeSlot: 'Change slot',
  },

  // Dashboard duplicate-detection copy ({id}/{name} filled in at render time)
  duplicateBanner: '⚠ 94% match with {id} (handled by {name})',
  mergeToast: '✅ Both clients linked to the same resolution thread. Rohit (FinEdge) notified: {name} is already on this.',

  // Dummy meeting summary shown to BOTH sides after the support person marks the call done
  meetingSummary: {
    discussed: [
      'Reproduced the issue and identified the root cause — FY 2025-26 filter migration',
      'Shared a workaround: Admin → Payroll → Bulk PDF Export',
      'Hotfix deploys tonight, we verify it tomorrow morning',
    ],
    nextSteps: [
      '{expert} will confirm the fix by 11 AM tomorrow',
      'Client re-tests and closes the ticket',
    ],
  },

  // Support inbox duplicate-booking demo ({id}/{client} filled at render time)
  apptDuplicateBanner: '⚠ Same question detected — 94% match with {id}. {client} raised this exact issue too. Merge them?',
  apptMergeToast: '✅ Merged into one ticket! Both clients are now linked to the same resolution thread — zero duplicate effort.',

  // Post-meeting review form (asked on BOTH sides after the summary)
  reviewIntro: 'Your feedback matters! 🙏 A quick 10-second review, please:',
  reviewQuestions: [
    { key: 'tone', label: 'How was the tone?' },
    { key: 'accuracy', label: 'How accurate was it?' },
    { key: 'presence', label: 'Presence of mind (quick thinking)?' },
  ],
  reviewOptions: ['😍 Great', '🙂 Okay', '😕 Poor'],
  reviewStarsLabel: 'Overall rating',
  reviewSubmitLabel: 'Submit review',
  reviewThanks: 'Thank you for the feedback! ⭐ It helps us make AI Syndicate better.',

  // When the help docs don't cover a question → route to appointment booking
  notCovered:
    "Hmm, my help docs don't have an exact answer for that — our support team can explain it properly. 🙋 Book an appointment and an expert will walk you through it on a call.",
  bookCtaLabel: '📅 Book an appointment',
  joinLabel: 'Join meeting', // support-side button that opens the call page

  // Greetings and pleasantries — answered locally, never routed to booking.
  // These are the bot ANSWERING, so they mirror the client's language. Every
  // other string in this file stays English; only replies mirror.
  smallTalk: {
    en: {
      greeting: "Hi! I'm AI Syndicate, your Superworks support assistant. What can I help you with?",
      howAreYou: "Doing well, thanks for asking! I'm here whenever you need help with Superworks.",
      thanks: 'Happy to help! Anything else I can look at?',
      bye: 'Take care! Message me any time you need a hand.',
    },
    hi: {
      greeting: 'Namaste! Main AI Syndicate hoon, aapka Superworks sahayak. Bataiye, kaise madad karoon?',
      howAreYou: 'Main bilkul theek hoon, poochne ke liye dhanyavaad! Aapki madad ke liye main yahin hoon.',
      thanks: 'Madad karke khushi hui! Aur kuch dekhoon?',
      bye: 'Apna dhyan rakhiye! Jab bhi zaroorat ho, sandesh bhej dijiye.',
    },
    hinglish: {
      greeting: 'Hi! Main AI Syndicate hoon, aapka Superworks support assistant. Bataiye, kaise help karoon?',
      howAreYou: 'Main bilkul theek hoon, poochne ke liye thanks! Kisi bhi help ke liye main yahin hoon.',
      thanks: 'Khushi hui help karke! Aur kuch dekhoon?',
      bye: 'Apna dhyan rakhiye! Kabhi bhi zaroorat ho to message kar dijiye.',
    },
  },

  // Closing lines
  resolved: 'Great! Marking this as resolved. Have a nice day!',
  notSolved:
    "No problem! Describe the error for me — what exactly isn't working? I'll raise a ticket for you right away.",
  ticketCreated:
    "Done! I've created your ticket and assigned it to the right team. You'll get updates here and on email.",
  p1Alert: '📞 On-call engineer Amit alerted via WhatsApp & call.',
  bookingConfirmed:
    'Booked! 📅 {slot}. {expert} will receive a pre-meeting brief with your recent tickets and issue summary, so you won\'t have to repeat yourself.',
}
