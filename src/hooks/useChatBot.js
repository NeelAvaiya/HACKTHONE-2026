// Chat brain: messages state, keyword matching, flow state machine, typing delays
import { useEffect, useRef, useState } from 'react'
import { botScripts } from '../data/botScripts.js'
import { team } from '../data/team.js'
import { matchIntent, matchSmallTalk } from '../utils/matchIntent.js'
import { parseSlot, looksLikeBooking } from '../utils/parseSlot.js'
import { matchModule, MODULE_CHIPS } from '../utils/matchModule.js'
import { resolveLanguage } from '../utils/detectLanguage.js'
import { meetingSummaryText } from '../utils/meetingSummary.js'
import { clientQuestions } from '../utils/clientQuestions.js'
import { currentUser } from '../data/currentUser.js'
import { askGemini } from '../utils/askGemini.js'
import { askVision } from '../utils/askVision.js'
import { uploadFile, deleteUpload, MAX_UPLOAD_BYTES } from '../utils/uploadFile.js'
import { useTickets } from '../context/TicketContext.jsx'
import { useBookings } from '../context/BookingContext.jsx'
import { useReleases } from '../context/ReleaseContext.jsx'
import { useWork } from '../context/WorkContext.jsx'
import { undelivered, announcementKey } from '../utils/workStats.js'
import { KIND_LABEL } from '../data/clientWork.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const thinkTime = () => 800 + Math.random() * 700
const SEVERITY_BY_URGENCY = { 'Blocking everyone': 'P1', 'Blocking me': 'P2', 'Can wait': 'P3' }

const assigneeFor = (module) => team.find((m) => m.skills.includes(module))?.name || 'Rohit Sharma'

// requested: {dayIdx, time} the client asked for, or null on the guided path.
// day: the day the pending offers belong to (the server may roll forward).
const emptyBooking = () => ({ stage: null, category: null, requested: null, offers: [], day: 0, reAsked: false })

// How a tapped slot is echoed back as the client's own message. The expert is
// deliberately left out — the client picks a time, we pick who takes the call.
const offerLabel = (offer, dayLabel) => (dayLabel ? `${dayLabel}, ${offer.time}` : offer.time)

// Only these can go to the vision route; anything else is just filed under Files
const READABLE_BY_MODEL = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf']
const canRead = (att) => READABLE_BY_MODEL.includes(att?.type)

export function useChatBot() {
  const { tickets, addTicket } = useTickets()
  const { appointments, book, cancel, markNotified } = useBookings()
  const { releases, markNotified: markReleaseNotified } = useReleases()
  const { items: workItems, markNotified: markWorkNotified } = useWork()
  const [messages, setMessages] = useState([
    // No bookCta here: a call is offered only after the help docs have failed to solve it
    { id: 1, from: 'bot', text: botScripts.greeting, time: new Date() },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [toast, setToast] = useState(null)
  // Files still uploading — kept out of `messages` so a half-done upload never reaches the DB
  const [pendingUploads, setPendingUploads] = useState([])
  const uploadIdRef = useRef(1)
  const idRef = useRef(2)
  const logRef = useRef([]) // plain {from, text} history sent to the Gemini proxy
  const flowRef = useRef({ stage: null, description: '', module: null, forceP1: false })
  // The screenshot the client just shared, waiting for them to say what to look at.
  // `answered` stays true after we reply, so a later "still stuck" knows the docs
  // already had their turn and it is time to offer a call.
  const visionRef = useRef({ attachment: null, answered: false })
  // State, not a ref: the effects that must wait for the saved thread (release and
  // resolved-work delivery) need a re-render once it has arrived
  const [loaded, setLoaded] = useState(false)
  // Language the client is writing in, updated only by typed messages that carry
  // a signal. Chip taps and bare replies like "9" leave it alone, so a Hindi
  // conversation doesn't flip to English mid-booking.
  const langRef = useRef('en')

  // Restore the persisted conversation on mount — refresh no longer clears the chat
  useEffect(() => {
    fetch('/api/messages')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setMessages(data)
          idRef.current = Math.max(...data.map((m) => m.id || 0)) + 1
          logRef.current = data.filter((m) => m.text).map((m) => ({ from: m.from, text: m.text }))
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  // Auto-save the whole thread (debounced) after any change
  useEffect(() => {
    if (!loaded) return
    const t = setTimeout(() => {
      fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      }).catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [messages, loaded])

  function push(msg) {
    const entry = { id: idRef.current++, time: new Date(), ...msg }
    setMessages((prev) => [...prev, entry])
    if (entry.text) logRef.current.push({ from: entry.from, text: entry.text })
  }

  // When the support person marks a meeting done, deliver the summary to the client here.
  // deliveredRef also guards against React StrictMode running this effect twice.
  const deliveredRef = useRef(new Set())
  useEffect(() => {
    appointments
      .filter((a) => a.status === 'done' && !a.notified && !deliveredRef.current.has(a.id))
      .forEach((a) => {
        deliveredRef.current.add(a.id)
        markNotified(a.id)
        push({ from: 'bot', text: meetingSummaryText(a) })
        push({ from: 'bot', text: botScripts.reviewIntro, reviewCta: a.id })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments])

  // A release that has gone live but hasn't been announced here yet lands in the chat
  // as a notification. Same deliveredRef guard: StrictMode runs this effect twice.
  const releasedRef = useRef(new Set())
  useEffect(() => {
    if (!loaded) return
    releases
      .filter((r) => r.status === 'live' && !r.notified && !releasedRef.current.has(r.id))
      .forEach((r) => {
        releasedRef.current.add(r.id)
        markReleaseNotified(r.id)
        push({ from: 'bot', text: botScripts.release.intro, release: r })
        push({ from: 'bot', text: botScripts.release.askIfHelp, chips: botScripts.release.chips })
        showToast(fill(botScripts.release.toast, { title: r.title }))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releases, loaded])

  // Tickets and feature requests: support resolves one, or sends one back, and
  // the client hears about it here. A reopen by the client is not announced —
  // they did it themselves.
  const workDeliveredRef = useRef(new Set())
  useEffect(() => {
    // Wait for the saved thread: work items land from /api/work quickly, and
    // announcing before the thread arrives would push a message that
    // setMessages(saved) then throws away.
    if (!loaded) return
    undelivered(workItems)
      .filter((i) => !workDeliveredRef.current.has(announcementKey(i)))
      .forEach((item) => {
        workDeliveredRef.current.add(announcementKey(item))
        markWorkNotified(item.id)
        const template = item.status === 'done' ? botScripts.workResolvedMsg : botScripts.workReopenedMsg
        push({
          from: 'bot',
          text: template
            .replaceAll('{kind}', KIND_LABEL[item.kind] || 'request')
            .replaceAll('{id}', item.id)
            .replaceAll('{title}', item.title)
            .replaceAll('{reason}', item.reopen?.reason || ''),
        })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workItems, loaded])

  async function botSay(fields) {
    setIsTyping(true)
    await sleep(thinkTime())
    setIsTyping(false)
    push({ from: 'bot', ...fields })
  }

  function showToast(text) {
    setToast(text)
    setTimeout(() => setToast(null), 5000)
  }

  async function askModule() {
    await botSay({ text: botScripts.questions.collectModule, chips: botScripts.chips.collectModule })
  }

  async function startTicketFlow(intent, text) {
    const script = botScripts.intents.find((i) => i.intent === intent)
    flowRef.current = { stage: 'module', description: text, module: null, forceP1: intent === 'p1Escalation' }
    await botSay({ text: script.responses[0] })
    await sleep(400)
    await askModule()
  }

  async function createTicket(severity) {
    const flow = flowRef.current
    // Next SUP number follows whatever is already in the (DB-backed) queue
    const nums = tickets.map((t) => parseInt((t.id || '').replace(/\D/g, ''), 10) || 0)
    const ticket = {
      id: `SUP-${Math.max(1042, ...nums) + 1}`,
      title: flow.description.length > 60 ? flow.description.slice(0, 57) + '…' : flow.description,
      client: currentUser.company,
      module: flow.module,
      severity,
      status: 'Open',
      assignee: assigneeFor(flow.module),
      createdBy: 'bot',
      createdAt: new Date().toISOString(),
      similarTo: null,
      eta: botScripts.etaBySeverity[severity],
    }
    flowRef.current = { stage: null, description: '', module: null, forceP1: false }
    addTicket(ticket)
    await botSay({ text: botScripts.ticketCreated, ticket })
    if (severity === 'P1') showToast(botScripts.p1Alert)
  }

  // ── booking flow: module → offers → book ───────────────────────────────────
  const bookingRef = useRef(emptyBooking())

  const fill = (template, values) =>
    Object.entries(values).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), template)

  async function fetchAvailability(category, requested) {
    const params = new URLSearchParams({ category })
    if (requested?.dayIdx != null) params.set('day', String(requested.dayIdx))
    if (requested?.time) params.set('time', requested.time)
    try {
      const r = await fetch(`/api/availability?${params}`)
      return await r.json()
    } catch {
      return null
    }
  }

  // Gemini fallback for phrasings the regex can't read. A miss is not an error —
  // the flow just continues without a requested time.
  async function parseSlotRemote(text) {
    try {
      const r = await fetch('/api/parse-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      return await r.json()
    } catch {
      return null
    }
  }

  /** Entry point for both the CTA button and a typed "book at 8". */
  async function startBooking(requested = null) {
    bookingRef.current = { ...emptyBooking(), stage: 'awaitModule', requested }
    await botSay({ text: botScripts.booking.askModule, chips: MODULE_CHIPS })
  }

  async function chooseModule(text) {
    const flow = bookingRef.current
    const category = matchModule(text)
    if (!category) {
      // Ask once more, then stop nagging and treat it as Other
      if (!flow.reAsked) {
        flow.reAsked = true
        return botSay({ text: botScripts.booking.moduleUnclear, chips: MODULE_CHIPS })
      }
      flow.category = 'Other'
    } else {
      flow.category = category
    }
    return offerSlots()
  }

  function offersIntro(data, category) {
    const values = { time: data.requested, day: data.dayLabel, module: category }
    if (data.requested && !data.inHours) return fill(botScripts.booking.outOfHours, values)
    if (data.rolledToDay != null) return fill(botScripts.booking.rolledForward, values)
    if (data.requested) return fill(botScripts.booking.nearestTo, values)
    return fill(botScripts.booking.freeNow, values)
  }

  async function offerSlots() {
    const flow = bookingRef.current
    setIsTyping(true)
    const data = await fetchAvailability(flow.category, flow.requested)
    setIsTyping(false)

    if (!data) {
      bookingRef.current = emptyBooking()
      return botSay({ text: botScripts.booking.unavailable })
    }
    // The exact time asked for is open → skip the offer step entirely
    if (data.exact?.length) return bookOffer(data.exact[0], data.day)
    if (!data.alternatives?.length) {
      bookingRef.current = emptyBooking()
      return botSay({ text: botScripts.booking.noSlots })
    }

    // The grid lists every open time that day; `alternatives` stays the source for
    // the intro line, which still talks about the nearest few.
    const slots = data.slots?.length ? data.slots : data.alternatives
    flow.stage = 'awaitSlotChoice'
    flow.offers = slots
    flow.day = data.day
    await botSay({
      text: offersIntro(data, flow.category),
      // day/date/category ride along on the message so a reloaded conversation can
      // still switch days and book, even though the in-memory flow is gone
      slotOffers: {
        dayLabel: data.dayLabel,
        day: data.day,
        date: data.date,
        category: flow.category,
        offers: slots,
      },
    })
  }

  /**
   * Day tab / date picker on a pending slot grid — reloads that message's slots.
   * Returns false when the day could not be loaded so the card can say so instead
   * of looking like an empty day.
   */
  async function changeOfferDay(messageId, dayIdx) {
    const meta = messages.find((m) => m.id === messageId)?.slotOffers
    const category = meta?.category || bookingRef.current.category
    const params = new URLSearchParams({ day: String(Math.max(0, dayIdx)) })
    if (category) params.set('category', category)
    let data
    try {
      const r = await fetch(`/api/availability/day?${params}`)
      if (!r.ok) return false
      data = await r.json()
    } catch {
      return false
    }
    if (!data || data.day == null) return false

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.slotOffers
          ? {
              ...m,
              slotOffers: {
                ...m.slotOffers,
                day: data.day,
                date: data.date,
                dayLabel: data.dayLabel,
                offers: data.slots || [],
              },
            }
          : m
      )
    )
    // Keep typed replies ("book the 3 pm one") aimed at the day now on screen
    if (bookingRef.current.stage === 'awaitSlotChoice') {
      bookingRef.current.day = data.day
      bookingRef.current.offers = data.slots || []
    }
    return true
  }

  async function bookOffer(offer, dayIdx = 0) {
    const flow = bookingRef.current
    setMessages((prev) => prev.map((m) => (m.slotOffers ? { ...m, slotOffers: null } : m)))
    setIsTyping(true)
    const result = await book({
      dayIdx,
      time: offer.time,
      person: offer.person,
      category: flow.category || offer.category,
      // Snapshot the questions now: the flow is reset a few lines down, and the
      // expert's brief should reflect what was asked before this booking, not
      // whatever the client types while waiting for the call.
      questions: clientQuestions(logRef.current),
      client: currentUser.label,
    })
    setIsTyping(false)

    // Someone else took it between the offer and the click
    if (result?.conflict) {
      const slots = result.slots?.length ? result.slots : result.alternatives || []
      if (!slots.length) {
        bookingRef.current = emptyBooking()
        return botSay({ text: botScripts.booking.noSlots })
      }
      flow.stage = 'awaitSlotChoice'
      flow.offers = slots
      flow.day = result.day ?? dayIdx
      return botSay({
        text: botScripts.booking.taken,
        slotOffers: {
          day: result.day ?? dayIdx,
          date: result.date,
          dayLabel: result.dayLabel,
          category: flow.category,
          offers: slots,
        },
      })
    }
    if (!result) {
      bookingRef.current = emptyBooking()
      return botSay({ text: botScripts.booking.failed })
    }

    bookingRef.current = emptyBooking()
    const firstName = result.person.split(' ')[0]
    await botSay({
      text: fill(botScripts.bookingConfirmed, { expert: firstName, slot: result.slot }),
      booking: {
        id: result.id,
        slot: result.slot,
        person: result.person,
        category: result.category,
        link: botScripts.meetLink,
        lines: botScripts.bookingLines.map((l) => l.replace('{expert}', firstName)),
      },
    })
  }

  /** Typed reply while offers are pending. Returns false if it wasn't about the offers. */
  function handleSlotReply(text) {
    const flow = bookingRef.current
    const parsed = parseSlot(text)
    const byTime = parsed.time && flow.offers.find((o) => o.time === parsed.time)
    if (byTime) {
      bookOffer(byTime, flow.day)
      return true
    }
    const lower = text.toLowerCase()
    const byName = flow.offers.find((o) => o.person.toLowerCase().split(' ').some((w) => lower.includes(w)))
    if (byName) {
      bookOffer(byName, flow.day)
      return true
    }
    // A different time is a new request, not an error — keep the chosen module
    if (parsed.confident) {
      flow.requested = { dayIdx: parsed.dayIdx, time: parsed.time }
      offerSlots()
      return true
    }
    bookingRef.current = emptyBooking()
    return false
  }

  // `meta` is the slotOffers block of the message the grid was rendered on; the
  // in-memory flow is only a fallback for offers made in this session.
  function pickOffer(offer, meta) {
    push({ from: 'user', text: `📅 ${offerLabel(offer, meta?.dayLabel)}` })
    bookOffer(offer, meta?.day ?? bookingRef.current.day)
  }

  // "Change slot" on the confirmation card: free the slot and re-offer
  async function changeSlot(appointmentId) {
    setMessages((prev) =>
      prev.map((m) => (m.booking?.id === appointmentId ? { ...m, booking: { ...m.booking, done: true } } : m))
    )
    cancel(appointmentId)
    await startBooking(null)
  }

  // ── screenshots ────────────────────────────────────────────────────────────
  /**
   * Answers a question about an image the client shared. Three outcomes, in the order
   * the client expects them: the docs explain it → steps; the docs don't → book a call.
   */
  async function askAboutImage(attachment, question) {
    visionRef.current = { attachment: null, answered: false }
    setIsTyping(true)
    const { reply, covered, failed } = await askVision(
      attachment.id,
      question,
      logRef.current.slice(0, -1),
      langRef.current
    )
    setIsTyping(false)

    if (covered && reply) {
      push({ from: 'bot', text: reply })
      visionRef.current = { attachment: null, answered: true }
      await sleep(400)
      return botSay({ text: botScripts.vision.followUp, chips: botScripts.chips.didThisSolve })
    }
    // Docs say nothing about it, or we never got an answer → hand over to a human
    push({ from: 'bot', text: failed ? botScripts.vision.failed : botScripts.notCovered, bookCta: true })
  }

  async function handleText(text) {
    // A screenshot is waiting on a question — this is that question
    const pendingImage = visionRef.current.attachment
    if (pendingImage) return askAboutImage(pendingImage, text)

    // A booking in progress owns the next reply
    if (bookingRef.current.stage === 'awaitModule') return chooseModule(text)
    if (bookingRef.current.stage === 'awaitSlotChoice' && handleSlotReply(text)) return

    if (flowRef.current.stage === 'awaitDescription') {
      flowRef.current = { stage: 'module', description: text, module: null, forceP1: false }
      return askModule()
    }
    // Typing instead of clicking chips abandons a half-done ticket flow cleanly
    if (flowRef.current.stage) {
      flowRef.current = { stage: null, description: '', module: null, forceP1: false }
    }
    // "Hi", "namaste", "thanks" — answer it, never route it to a booking
    const chat = matchSmallTalk(text)
    if (chat) {
      const lines = botScripts.smallTalk[langRef.current] || botScripts.smallTalk.en
      return botSay({ text: lines[chat] })
    }

    const intent = matchIntent(text)

    // Booking request: use the time if one was given, otherwise go straight to modules.
    // Guarded to `fallback` so it can't hijack an error report that mentions "call".
    if (intent === 'meeting' || (intent === 'fallback' && looksLikeBooking(text))) {
      const parsed = parseSlot(text)
      if (parsed.confident) return startBooking({ dayIdx: parsed.dayIdx, time: parsed.time })
      setIsTyping(true)
      const remote = await parseSlotRemote(text)
      setIsTyping(false)
      return startBooking(remote?.confident ? { dayIdx: remote.dayIdx, time: remote.time } : null)
    }

    if (intent === 'selfResolve') {
      const script = botScripts.intents.find((i) => i.intent === 'selfResolve')
      await botSay({ text: script.responses[0], screenshot: botScripts.screenshotCaption })
      await sleep(500)
      await botSay({ text: botScripts.questions.didThisSolve, chips: botScripts.chips.didThisSolve })
    } else if (intent === 'autoTicket' || intent === 'p1Escalation') {
      await startTicketFlow(intent, text)
    } else {
      setIsTyping(true)
      const { reply, covered } = await askGemini(text, logRef.current.slice(0, -1), langRef.current)
      setIsTyping(false)
      if (covered) {
        push({ from: 'bot', text: reply })
      } else {
        // Docs don't answer this → hand off to the support team via booking page
        push({ from: 'bot', text: botScripts.notCovered, bookCta: true })
      }
    }
  }

  function sendMessage(text) {
    const clean = text.trim()
    if (!clean || isTyping) return
    // Only typed messages can change the language, and only when they carry a signal
    langRef.current = resolveLanguage(langRef.current, clean)
    // Typed input retires any pending chips so old choices can't fire later
    setMessages((prev) => prev.map((m) => (m.chips ? { ...m, chips: null } : m)))
    push({ from: 'user', text: clean })
    handleText(clean)
  }

  // A chip click is answered like a user message; used chips disappear
  function selectChip(option) {
    setMessages((prev) => prev.map((m) => (m.chips ? { ...m, chips: null } : m)))
    push({ from: 'user', text: option })

    // Screenshot chips: the chip itself is the question to ask about the image
    const pendingImage = visionRef.current.attachment
    if (pendingImage && botScripts.vision.chips.includes(option)) {
      return askAboutImage(pendingImage, option)
    }
    // Release chips
    if (option === botScripts.release.chips[0]) return botSay({ text: botScripts.resolved, variant: 'success' })
    if (option === botScripts.release.chips[1]) {
      const latest = releases.find((r) => r.status === 'live')
      return handleText(`${botScripts.release.explainPrefix}${latest?.title || ''}`)
    }

    // Booking's module chips share this handler, so they're checked first
    if (bookingRef.current.stage === 'awaitModule') return chooseModule(option)
    const flow = flowRef.current
    if (flow.stage === 'module') {
      flow.module = option
      if (flow.forceP1) return createTicket('P1')
      flow.stage = 'urgency'
      botSay({ text: botScripts.questions.collectUrgency, chips: botScripts.chips.collectUrgency })
    } else if (flow.stage === 'urgency') {
      createTicket(SEVERITY_BY_URGENCY[option] || 'P3')
    } else if (option === botScripts.chips.didThisSolve[0]) {
      visionRef.current = { attachment: null, answered: false }
      botSay({ text: botScripts.resolved, variant: 'success' })
    } else if (option === botScripts.chips.didThisSolve[1]) {
      // The docs already had their shot at the screenshot → a call is the next step
      if (visionRef.current.answered) {
        visionRef.current = { attachment: null, answered: false }
        return botSay({ text: botScripts.vision.stillStuck, bookCta: true })
      }
      flowRef.current.stage = 'awaitDescription'
      botSay({ text: botScripts.notSolved })
    }
  }

  // ── attachments ────────────────────────────────────────────────────────────
  /**
   * Uploads each file one at a time (real progress per file), then posts it as a
   * message. `caption` rides on the first attachment, exactly like WhatsApp, and
   * is answered by the normal text flow afterwards.
   */
  async function sendAttachment(fileList, caption = '') {
    const files = Array.from(fileList || []).filter(Boolean)
    if (!files.length) return
    const text = caption.trim()
    const sent = []

    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        showToast(fill(botScripts.attachment.tooLarge, { name: file.name }))
        continue
      }
      const uid = uploadIdRef.current++
      setPendingUploads((prev) => [...prev, { uid, name: file.name, size: file.size, progress: 0 }])
      try {
        const attachment = await uploadFile(file, (progress) =>
          setPendingUploads((prev) => prev.map((u) => (u.uid === uid ? { ...u, progress } : u)))
        )
        const withCaption = text && !sent.length ? { text } : {}
        push({ from: 'user', attachment, ...withCaption })
        sent.push(attachment)
      } catch (err) {
        showToast(fill(botScripts.attachment.failed, { name: file.name, reason: err.message }))
      } finally {
        setPendingUploads((prev) => prev.filter((u) => u.uid !== uid))
      }
    }

    if (!sent.length) return
    const readable = sent.find(canRead)

    // Screenshot + caption: the caption already says what to look at
    if (readable && text) return askAboutImage(readable, text)
    // A caption on a plain file is a normal question
    if (text) return handleText(text)
    // Screenshot on its own: ask what they need from it before burning a vision call
    if (readable) {
      visionRef.current = { attachment: readable, answered: false }
      const ask = botScripts.vision.ask[langRef.current] || botScripts.vision.ask.en
      return botSay({ text: ask, chips: botScripts.vision.chips })
    }
    // Mid-ticket the file belongs to the ticket, so acknowledge without derailing the flow
    if (flowRef.current.stage) {
      return botSay({ text: fill(botScripts.attachment.inTicketFlow, { name: sent[0].name }) })
    }
    const ack =
      sent.length === 1
        ? fill(botScripts.attachment.received, { name: sent[0].name })
        : fill(botScripts.attachment.receivedMany, { count: sent.length })
    return botSay({ text: ack })
  }

  // Star / unstar any message; the debounced auto-save persists it
  function toggleStar(id) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)))
  }

  // ── edit / delete ──────────────────────────────────────────────────────────
  /** Rewrites the text of an already-sent message; the bot's earlier reply stands. */
  function editMessage(id, text) {
    const clean = text.trim()
    if (!clean) return
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: clean, edited: true } : m)))
    // Keep the Gemini history in step so follow-ups see the corrected wording
    const idx = logRef.current.findIndex((l) => l.text === messages.find((m) => m.id === id)?.text)
    if (idx !== -1) logRef.current[idx] = { ...logRef.current[idx], text: clean }
  }

  /** Removes a message, and the stored file with it when it carried an attachment. */
  function deleteMessage(id) {
    const target = messages.find((m) => m.id === id)
    if (!target) return
    if (target.attachment) deleteUpload(target.attachment)
    setMessages((prev) => prev.filter((m) => m.id !== id))
    if (target.text) logRef.current = logRef.current.filter((l) => l.text !== target.text)
    showToast(target.attachment ? fill(botScripts.menu.fileDeletedToast, { name: target.attachment.name }) : botScripts.menu.deletedToast)
  }

  // Reviewing happens on /review/:id/client now — the chat only links to it
  return {
    messages,
    isTyping,
    toast,
    pendingUploads,
    sendMessage,
    sendAttachment,
    toggleStar,
    editMessage,
    deleteMessage,
    selectChip,
    pickOffer,
    changeOfferDay,
    startBooking,
    changeSlot,
  }
}
