// "/chat" — WhatsApp Web-style shell: chat list sidebar + AI Syndicate conversation
import { useState } from 'react'
import { Bot, Search } from 'lucide-react'
import { useChatBot } from '../hooks/useChatBot.js'
import { botScripts } from '../data/botScripts.js'
import ChatWindow from '../components/chat/ChatWindow.jsx'
import Toast from '../components/common/Toast.jsx'

const otherChats = [
  { name: 'Superworks Support', preview: 'Ticket SUP-1031 updated: In Progress', time: '10:42 am', initials: 'SS', color: '#7c3aed' },
  { name: 'Priya Nair', preview: 'Sharing the payroll report now', time: '9:15 am', initials: 'PN', color: '#0ea5e9' },
  { name: 'HR Announcements', preview: 'Holiday calendar 2026 published 🎉', time: 'Yesterday', initials: 'HR', color: '#f59e0b' },
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
    startBooking,
    changeSlot,
    sendReview,
  } = useChatBot()
  const last = messages[messages.length - 1]
  const lastPreview = last?.text || (last?.attachment ? `📎 ${last.attachment.name}` : 'Say hi 👋')
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const showMain = !q || 'ai syndicate'.includes(q) || (last?.text || '').toLowerCase().includes(q)
  const filteredChats = otherChats.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q)
  )

  return (
    <main className="wa-font mx-auto h-[calc(100vh-3.5rem)] max-w-[1600px]">
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
            <button className="flex w-full items-center gap-3 bg-[#f0f2f5] px-3 py-3 text-left">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white">
                <Bot size={24} />
              </span>
              <div className="min-w-0 flex-1 border-black/5">
                <div className="flex items-baseline justify-between">
                  <p className="truncate text-[15px] font-semibold text-[#111b21]">AI Syndicate</p>
                  <span className="text-[11px] text-[#00a884]">now</span>
                </div>
                <p className="truncate text-[13px] text-[#667781]">
                  {isTyping ? 'typing…' : lastPreview}
                </p>
              </div>
            </button>
            )}

            {!showMain && !filteredChats.length && (
              <p className="px-4 py-8 text-center text-sm text-[#8696a0]">No chats found</p>
            )}

            {filteredChats.map((c) => (
              <button key={c.name} className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[#f5f6f6]">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: c.color }}
                >
                  {c.initials}
                </span>
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
            onBookStart={startBooking}
            onChangeSlot={changeSlot}
            bookCtaLabel={botScripts.bookCtaLabel}
            changeSlotLabel={botScripts.booking.changeSlot}
            reviewConfig={{
              questions: botScripts.reviewQuestions,
              options: botScripts.reviewOptions,
              starsLabel: botScripts.reviewStarsLabel,
              submitLabel: botScripts.reviewSubmitLabel,
            }}
            onReviewSubmit={sendReview}
          />
        </section>
      </div>
      <Toast message={toast} />
    </main>
  )
}
