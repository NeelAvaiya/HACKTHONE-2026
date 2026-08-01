// "/chat" — WhatsApp Web-style shell: chat list sidebar + HelpSense conversation
import { useEffect, useState } from 'react'
import { Search, Megaphone } from 'lucide-react'
import { useChatBot } from '../hooks/useChatBot.js'
import { useWork } from '../context/WorkContext.jsx'
import { botScripts } from '../data/botScripts.js'
import { buildAnnouncements, unreadSince, latestAt } from '../utils/announcements.js'
import ChatWindow from '../components/chat/ChatWindow.jsx'
import AnnouncementsThread from '../components/chat/AnnouncementsThread.jsx'
import Avatar from '../components/common/Avatar.jsx'
import Toast from '../components/common/Toast.jsx'

const SEEN_KEY = 'helpsense-announce-seen'

const otherChats = [
  { name: 'Superworks Support', preview: 'Ticket SUP-1031 updated: In Progress', time: '10:42 am' },
  { name: 'Priya Nair', preview: 'Sharing the payroll report now', time: '9:15 am' },
]

export default function Chat() {
  const {
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
  } = useChatBot()
  const { items: workItems } = useWork()
  const [activeChat, setActiveChat] = useState('ai')
  // Remembered across reloads so the badge does not reappear for updates already read
  const [seenAt, setSeenAt] = useState(() => {
    try {
      return localStorage.getItem(SEEN_KEY) || ''
    } catch {
      return ''
    }
  })

  const announcements = buildAnnouncements(workItems, botScripts)
  const unread = unreadSince(announcements, seenAt)

  // Opening the group is what marks it read
  useEffect(() => {
    if (activeChat !== 'announcements' || !unread) return
    const stamp = latestAt(announcements)
    setSeenAt(stamp)
    try {
      localStorage.setItem(SEEN_KEY, stamp)
    } catch {
      // Storage disabled — the badge just comes back next reload, which is harmless
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat, unread])

  const last = messages[messages.length - 1]
  const lastPreview = last?.text || (last?.attachment ? `📎 ${last.attachment.name}` : 'Say hi 👋')
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const showMain = !q || 'helpsense'.includes(q) || (last?.text || '').toLowerCase().includes(q)
  const showAnnouncements =
    !q ||
    botScripts.announce.name.toLowerCase().includes(q) ||
    announcements.some((a) => `${a.headline} ${a.quote}`.toLowerCase().includes(q))
  const filteredChats = otherChats.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q)
  )

  return (
    // 6.5rem = the 3.5rem navbar plus the client tab row, matching the support inbox
    <main className="wa-font mx-auto h-[calc(100vh-6.5rem)] max-w-[1600px]">
      <div className="flex h-full">
        <aside className="hidden w-[30%] min-w-[18rem] max-w-sm flex-col border-r border-black/10 bg-white md:flex">
          <div className="bg-[#f0f2f5] px-4 py-3">
            <p className="text-lg font-bold text-[#111b21]">Chats</p>
          </div>
          <div className="px-3 py-2">
            <div className="flex items-center gap-3 rounded-lg bg-[#f0f2f5] px-3 py-1.5">
              <Search size={14} className="text-[#54656f]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search or start a new chat"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#8696a0]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {showMain && (
              <button
                onClick={() => setActiveChat('ai')}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
                  activeChat === 'ai' ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'
                }`}
              >
                <Avatar name="HelpSense" size={44} />
                <div className="min-w-0 flex-1 border-black/5">
                  <div className="flex items-baseline justify-between">
                    <p className="truncate text-[15px] font-semibold text-[#111b21]">HelpSense</p>
                    <span className="text-[11px] text-[#00a884]">now</span>
                  </div>
                  <p className="truncate text-[13px] text-[#667781]">{isTyping ? 'typing…' : lastPreview}</p>
                </div>
              </button>
            )}

            {showAnnouncements && (
              <button
                onClick={() => setActiveChat('announcements')}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
                  activeChat === 'announcements' ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-white">
                  <Megaphone size={20} />
                </span>
                <div className="min-w-0 flex-1 border-b border-black/5 pb-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[15px] text-[#111b21]">{botScripts.announce.name}</p>
                    {unread > 0 && (
                      <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[#00a884] px-1 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[13px] text-[#667781]">
                    {announcements[0]?.headline || botScripts.announce.preview}
                  </p>
                </div>
              </button>
            )}

            {!showMain && !showAnnouncements && !filteredChats.length && (
              <p className="px-4 py-8 text-center text-sm text-[#8696a0]">No chats found</p>
            )}

            {filteredChats.map((c) => (
              <button key={c.name} className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[#f5f6f6]">
                <Avatar name={c.name} size={44} />
                <div className="min-w-0 flex-1 border-b border-black/5 pb-3">
                  <div className="flex items-baseline justify-between">
                    <p className="truncate text-[15px] text-[#111b21]">{c.name}</p>
                    <span className="text-[11px] text-[#667781]">{c.time}</span>
                  </div>
                  <p className="truncate text-[13px] text-[#667781]">{c.preview}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          {activeChat === 'announcements' ? (
            <AnnouncementsThread copy={botScripts.announce} announcements={announcements} />
          ) : (
          <ChatWindow
            persona={botScripts.persona}
            tabLabels={botScripts.tabs}
            attachmentCopy={botScripts.attachment}
            menuLabels={botScripts.menu}
            releaseCopy={botScripts.release}
            banner={botScripts.banner}
            messages={messages}
            isTyping={isTyping}
            pendingUploads={pendingUploads}
            onSend={sendMessage}
            onSendFiles={sendAttachment}
            onToggleStar={toggleStar}
            onEditMessage={editMessage}
            onDeleteMessage={deleteMessage}
            onChipSelect={selectChip}
            onOfferPick={pickOffer}
            onOfferDayChange={changeOfferDay}
            onBookStart={startBooking}
            onChangeSlot={changeSlot}
            bookCtaLabel={botScripts.bookCtaLabel}
            changeSlotLabel={botScripts.booking.changeSlot}
            reviewCtaLabel={botScripts.reviewCtaLabel}
            dayErrorLabel={botScripts.booking.dayFailed}
          />
          )}
        </section>
      </div>
      <Toast message={toast} />
    </main>
  )
}
