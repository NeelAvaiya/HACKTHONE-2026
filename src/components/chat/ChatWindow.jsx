// WhatsApp Web conversation pane: header + tabs (Chat/Files/Starred) + doodle wallpaper + input bar
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Smile, Paperclip, SendHorizontal, Upload, Pencil, X, Search } from 'lucide-react'
import MessageBubble from './MessageBubble.jsx'
import TypingIndicator from './TypingIndicator.jsx'
import QuickReplies from './QuickReplies.jsx'
import TicketCard from './TicketCard.jsx'
import SlotPicker from './SlotPicker.jsx'
import EmojiPicker from './EmojiPicker.jsx'
import SearchBar from './SearchBar.jsx'
import ChatHeader from './ChatHeader.jsx'
import ReleaseCard from './ReleaseCard.jsx'
import FilesPanel from './FilesPanel.jsx'
import StarredPanel from './StarredPanel.jsx'
import UploadProgress from './UploadProgress.jsx'

export default function ChatWindow({
  persona,
  tabLabels,
  attachmentCopy,
  menuLabels,
  releaseCopy,
  banner,
  messages,
  isTyping,
  pendingUploads = [],
  onSend,
  onSendFiles,
  onToggleStar,
  onEditMessage,
  onDeleteMessage,
  onChipSelect,
  onOfferPick,
  onOfferDayChange,
  onBookStart,
  onChangeSlot,
  bookCtaLabel,
  changeSlotLabel,
  reviewCtaLabel,
  dayErrorLabel,
}) {
  const [draft, setDraft] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [matchIdx, setMatchIdx] = useState(0)
  const [tab, setTab] = useState('chat')
  const [jumpId, setJumpId] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const fileRef = useRef(null)
  const msgRefs = useRef({})
  const dragDepth = useRef(0)

  const q = query.trim().toLowerCase()
  const matches = q ? messages.filter((m) => m.text?.toLowerCase().includes(q)) : []
  const safeIdx = matches.length ? Math.min(matchIdx, matches.length - 1) : 0
  const activeId = matches.length ? matches[safeIdx].id : null

  const counts = {
    files: messages.filter((m) => m.attachment).length,
    starred: messages.filter((m) => m.starred).length,
  }

  // Follow the conversation, but never yank the view away from a message jumped to
  useEffect(() => {
    if (tab === 'chat' && !searchOpen && jumpId == null) endRef.current?.scrollIntoView({ behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, isTyping, pendingUploads.length, searchOpen, tab])

  useEffect(() => setMatchIdx(0), [query])

  useEffect(() => {
    if (activeId != null) msgRefs.current[activeId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeId, safeIdx])

  // Jumping in from the Files/Starred tab: scroll to the message and hold the highlight briefly
  useEffect(() => {
    if (jumpId == null) return
    msgRefs.current[jumpId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const t = setTimeout(() => setJumpId(null), 2000)
    return () => clearTimeout(t)
  }, [jumpId])

  function closeSearch() {
    setSearchOpen(false)
    setQuery('')
  }

  function jumpToMessage(id) {
    setTab('chat')
    setJumpId(id)
  }

  // Editing loads the old text into the same input bar; submitting saves instead of sending
  function startEdit(id, text) {
    setTab('chat')
    setEditingId(id)
    setDraft(text || '')
    inputRef.current?.focus()
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft('')
  }

  function deleteMessage(id) {
    if (id === editingId) cancelEdit()
    onDeleteMessage(id)
  }

  function submit(e) {
    e.preventDefault()
    if (!draft.trim()) return
    if (editingId != null) {
      onEditMessage(editingId, draft)
      return cancelEdit()
    }
    onSend(draft)
    setDraft('')
    setShowEmoji(false)
  }

  function addEmoji(emoji) {
    setDraft((d) => d + emoji)
    inputRef.current?.focus()
  }

  // The draft (if any) travels with the files as a caption, then the box clears
  function sendFiles(files) {
    if (!files?.length) return
    onSendFiles(files, draft)
    setDraft('')
    setShowEmoji(false)
  }

  function onDrop(e) {
    e.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    sendFiles(e.dataTransfer?.files)
  }

  // dragenter/leave fire for every child element — a depth counter keeps the overlay steady
  function onDragEnter(e) {
    if (!e.dataTransfer?.types?.includes('Files')) return
    dragDepth.current += 1
    setDragging(true)
  }

  function onDragLeave() {
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (!dragDepth.current) setDragging(false)
  }

  return (
    <div className="wa-font flex h-full flex-col">
      <ChatHeader
        persona={persona}
        labels={tabLabels}
        isTyping={isTyping}
        tab={tab}
        onTab={setTab}
        counts={counts}
        searchOpen={searchOpen}
        onSearchToggle={() => {
          setTab('chat')
          searchOpen ? closeSearch() : setSearchOpen(true)
        }}
        menuItems={[
          {
            label: menuLabels.searchMessages,
            icon: <Search size={15} />,
            onSelect: () => {
              setTab('chat')
              setSearchOpen(true)
            },
          },
        ]}
      />

      {tab === 'chat' && searchOpen && (
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

      {tab === 'files' && (
        <FilesPanel
          messages={messages}
          emptyText={attachmentCopy.emptyFiles}
          deleteLabel={menuLabels.deleteFile}
          onJump={jumpToMessage}
          onDelete={deleteMessage}
        />
      )}

      {tab === 'starred' && (
        <StarredPanel
          messages={messages}
          emptyText={attachmentCopy.emptyStarred}
          onJump={jumpToMessage}
          onToggleStar={onToggleStar}
        />
      )}

      {tab === 'chat' && (
        <div
          onDragEnter={onDragEnter}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className="wa-doodle relative flex-1 space-y-2 overflow-y-auto px-6 py-4 sm:px-12"
        >
          {dragging && (
            <div className="pointer-events-none absolute inset-3 z-10 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#00a884] bg-white/80 text-[#00a884]">
              <Upload size={28} />
              <p className="text-sm font-semibold">{attachmentCopy.dropHint}</p>
            </div>
          )}

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
              <MessageBubble
                {...m}
                highlight={m.id === activeId || m.id === jumpId || m.id === editingId}
                menuLabels={menuLabels}
                onToggleStar={onToggleStar}
                onEdit={startEdit}
                onDelete={deleteMessage}
              />
              {m.chips && <QuickReplies options={m.chips} onSelect={onChipSelect} />}
              {m.release && <div className="pl-2"><ReleaseCard release={m.release} copy={releaseCopy} /></div>}
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
          <UploadProgress uploads={pendingUploads} />
          {isTyping && <TypingIndicator />}
          <div ref={endRef} />
        </div>
      )}

      {tab === 'chat' && (
        <form onSubmit={submit} className="relative flex items-center gap-3 border-l border-black/5 bg-[#f0f2f5] px-4 py-2.5">
          {showEmoji && <EmojiPicker onPick={addEmoji} />}

          {editingId != null && (
            <div className="absolute inset-x-0 bottom-full flex items-center gap-2 border-t-2 border-[#00a884] bg-[#f0f2f5] px-4 py-1.5 text-[13px] text-[#00a884]">
              <Pencil size={14} />
              <span className="flex-1 font-medium">{menuLabels.editingLabel}</span>
              <button type="button" onClick={cancelEdit} aria-label="Cancel editing" className="text-[#54656f]">
                <X size={16} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowEmoji((s) => !s)}
            aria-label="Emoji"
            className="shrink-0 transition-colors"
          >
            <Smile size={24} className={showEmoji ? 'text-[#00a884]' : 'text-[#54656f] hover:text-[#3b4a54]'} />
          </button>

          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              sendFiles(e.target.files)
              e.target.value = '' // re-picking the same file must fire change again
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach a file"
            disabled={editingId != null}
            className="shrink-0 text-[#54656f] transition-colors hover:text-[#3b4a54] disabled:opacity-40"
          >
            <Paperclip size={22} />
          </button>

          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Escape') return
              setShowEmoji(false)
              if (editingId != null) cancelEdit()
            }}
            onPaste={(e) => {
              if (e.clipboardData?.files?.length) {
                e.preventDefault()
                sendFiles(e.clipboardData.files)
              }
            }}
            placeholder="Type a message"
            autoFocus
            className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm text-[#111b21] outline-none placeholder:text-[#8696a0]"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label={editingId != null ? 'Save edit' : 'Send'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#54656f] transition-colors enabled:bg-[#00a884] enabled:text-white disabled:opacity-60"
          >
            {editingId != null ? <Pencil size={17} /> : <SendHorizontal size={19} />}
          </button>
        </form>
      )}
    </div>
  )
}
