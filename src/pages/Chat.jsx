// "/chat" — WhatsApp Web-style shell: chat list sidebar + AI Syndicate conversation
import { useState } from 'react'
import { Search } from 'lucide-react'
import { useChatBot } from '../hooks/useChatBot.js'
import { botScripts } from '../data/botScripts.js'
import ChatWindow from '../components/chat/ChatWindow.jsx'
import Avatar from '../components/common/Avatar.jsx'
import Toast from '../components/common/Toast.jsx'

const otherChats = [
  { name: 'Superworks Support', preview: 'Ticket SUP-1031 updated: In Progress', time: '10:42 am' },
  { name: 'Priya Nair', preview: 'Sharing the payroll report now', time: '9:15 am' },
  { name: 'HR Announcements', preview: 'Holiday calendar 2026 published 🎉', time: 'Yesterday' },
]

export default function Chat() {
  const {
    messages,
    isTyping,
    toast,
    sendMessage,
    selectChip,
    pickOffer,
    changeOfferDay,
    startBooking,
    changeSlot,
  } = useChatBot()
  const last = messages[messages.length - 1]
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const showMain = !q || 'ai syndicate'.includes(q) || (last?.text || '').toLowerCase().includes(q)
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
            <button className="flex w-full items-center gap-3 bg-[#f0f2f5] px-3 py-3 text-left">
              <Avatar name="AI Syndicate" size={44} />
              <div className="min-w-0 flex-1 border-black/5">
                <div className="flex items-baseline justify-between">
                  <p className="truncate text-[15px] font-semibold text-[#111b21]">AI Syndicate</p>
                  <span className="text-[11px] text-[#00a884]">now</span>
                </div>
                <p className="truncate text-[13px] text-[#667781]">
                  {isTyping ? 'typing…' : last?.text || 'Say hi 👋'}
                </p>
              </div>
            </button>
            )}

            {!showMain && !filteredChats.length && (
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
          <ChatWindow
            banner={botScripts.banner}
            messages={messages}
            isTyping={isTyping}
            onSend={sendMessage}
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
        </section>
      </div>
      <Toast message={toast} />
    </main>
  )
}
