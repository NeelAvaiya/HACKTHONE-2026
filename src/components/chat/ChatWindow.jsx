// WhatsApp Web conversation pane: header + doodle wallpaper + messages + input bar (props-only)
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Search, MoreVertical, Smile, Plus, SendHorizontal } from 'lucide-react'
import Avatar from '../common/Avatar.jsx'
import MessageBubble from './MessageBubble.jsx'
import TypingIndicator from './TypingIndicator.jsx'
import QuickReplies from './QuickReplies.jsx'
import TicketCard from './TicketCard.jsx'
import SlotPicker from './SlotPicker.jsx'
import EmojiPicker from './EmojiPicker.jsx'
import SearchBar from './SearchBar.jsx'

export default function ChatWindow({ banner, messages, isTyping, onSend, onChipSelect, onOfferPick, onOfferDayChange, onBookStart, onChangeSlot, bookCtaLabel, changeSlotLabel, dayErrorLabel, reviewCtaLabel }) {
  const [draft, setDraft] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [matchIdx, setMatchIdx] = useState(0)
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const msgRefs = useRef({})

  const q = query.trim().toLowerCase()
  const matches = q ? messages.filter((m) => m.text?.toLowerCase().includes(q)) : []
  const safeIdx = matches.length ? Math.min(matchIdx, matches.length - 1) : 0
  const activeId = matches.length ? matches[safeIdx].id : null

  useEffect(() => {
    if (!searchOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, searchOpen])

  useEffect(() => setMatchIdx(0), [query])

  useEffect(() => {
    if (activeId != null) msgRefs.current[activeId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeId, safeIdx])

  function closeSearch() {
    setSearchOpen(false)
    setQuery('')
  }

  function submit(e) {
    e.preventDefault()
    onSend(draft)
    setDraft('')
    setShowEmoji(false)
  }

  function addEmoji(emoji) {
    setDraft((d) => d + emoji)
    inputRef.current?.focus()
  }

  return (
    <div className="wa-font flex h-full flex-col">
      <div className="flex items-center gap-3 border-l border-black/5 bg-[#f0f2f5] px-4 py-2.5">
        <Avatar name="AI Syndicate" size={40} />
        <div className="flex-1 leading-tight">
          <p className="text-[15px] font-semibold text-[#111b21]">AI Syndicate</p>
          <p className="text-xs text-[#667781]">{isTyping ? 'typing…' : 'online'}</p>
        </div>
        <button
          type="button"
          onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
          aria-label="Search messages"
        >
          <Search size={20} className={searchOpen ? 'text-[#00a884]' : 'text-[#54656f] hover:text-[#3b4a54]'} />
        </button>
        <MoreVertical size={20} className="text-[#54656f]" />
      </div>

      {searchOpen && (
        <SearchBar
          query={query}
          onQuery={setQuery}
          current={safeIdx}
          total={matches.length}
          onPrev={() => matches.length && setMatchIdx((i) => (i - 1 + matches.length) % matches.length)}
          onNext={() => matches.length && setMatchIdx((i) => (i + 1) % matches.length)}
          onClose={closeSearch}
        />
      )}

      <div className="wa-doodle flex-1 space-y-2 overflow-y-auto px-6 py-4 sm:px-12">
        <div className="flex justify-center">
          <span className="rounded-lg bg-white/95 px-3 py-1 text-[11px] font-medium uppercase text-[#54656f] shadow-sm">
            Today
          </span>
        </div>
        <div className="flex justify-center pb-2">
          <span className="max-w-md rounded-lg bg-[#ffeecd] px-3 py-1.5 text-center text-[11px] text-[#54656f] shadow-sm">
            {banner}
          </span>
        </div>

        {messages.map((m) => (
          <div key={m.id} ref={(el) => (msgRefs.current[m.id] = el)} className="space-y-2">
            <MessageBubble {...m} highlight={m.id === activeId} />
            {m.chips && <QuickReplies options={m.chips} onSelect={onChipSelect} />}
            {m.ticket && <div className="pl-2"><TicketCard ticket={m.ticket} /></div>}
            {m.slotOffers && (
              <div className="pl-2">
                <SlotPicker
                  offers={m.slotOffers.offers}
                  dayLabel={m.slotOffers.dayLabel}
                  day={m.slotOffers.day}
                  date={m.slotOffers.date}
                  onPick={(offer) => onOfferPick(offer, m.slotOffers)}
                  onDayChange={(dayIdx) => onOfferDayChange(m.id, dayIdx)}
                  dayErrorLabel={dayErrorLabel}
                />
              </div>
            )}
            {m.booking && (
              <div className="pl-2">
                <SlotPicker booking={m.booking} onChangeSlot={onChangeSlot} changeLabel={changeSlotLabel} />
              </div>
            )}
            {m.reviewCta && (
              <Link
                to={`/review/${m.reviewCta}/client`}
                className="ml-2 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#00a884] shadow-sm ring-1 ring-black/5 transition-colors hover:bg-[#f0f2f5]"
              >
                {reviewCtaLabel}
              </Link>
            )}
            {m.bookCta && (
              <button
                type="button"
                onClick={() => onBookStart()}
                className="ml-2 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#00a884] shadow-sm ring-1 ring-black/5 transition-colors hover:bg-[#f0f2f5]"
              >
                {bookCtaLabel}
              </button>
            )}
          </div>
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="relative flex items-center gap-3 border-l border-black/5 bg-[#f0f2f5] px-4 py-2.5">
        {showEmoji && <EmojiPicker onPick={addEmoji} />}
        <button
          type="button"
          onClick={() => setShowEmoji((s) => !s)}
          aria-label="Emoji"
          className="shrink-0 transition-colors"
        >
          <Smile size={24} className={showEmoji ? 'text-[#00a884]' : 'text-[#54656f] hover:text-[#3b4a54]'} />
        </button>
        <Plus size={24} className="shrink-0 text-[#54656f]" />
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setShowEmoji(false)}
          placeholder="Type a message"
          autoFocus
          className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm text-[#111b21] outline-none placeholder:text-[#8696a0]"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#54656f] transition-colors enabled:bg-[#00a884] enabled:text-white disabled:opacity-60"
        >
          <SendHorizontal size={19} />
        </button>
      </form>
    </div>
  )
}
