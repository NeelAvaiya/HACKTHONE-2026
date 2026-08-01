// "/support" (Chat sub-tab) — WhatsApp-style: bookings as chats (left) + thread (right)
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageSquareDashed } from 'lucide-react'
import { useBookings } from '../context/BookingContext.jsx'
import { botScripts } from '../data/botScripts.js'
import SupportThread from '../components/support/SupportThread.jsx'
import { personName, initialsOf } from '../utils/person.js'

const AVATAR_COLORS = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444']

export default function SupportInbox() {
  const { appointments, complete, reload } = useBookings()
  // Clicking a booked cell on the team calendar navigates here with the id
  const location = useLocation()
  const [selectedId, setSelectedId] = useState(location.state?.appointmentId || null)

  // "No sockets" — opening the tab makes the API call that brings in fresh bookings
  useEffect(reload, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selected = appointments.find((a) => a.id === selectedId) || appointments[0]

  return (
    <main className="wa-font mx-auto h-[calc(100vh-6.5rem)] max-w-[1600px]">
      <div className="flex h-full">
        <aside className="flex w-full flex-col border-r border-black/10 bg-white md:w-[30%] md:min-w-[18rem] md:max-w-sm">
          <div className="flex items-center justify-between bg-[#f0f2f5] px-4 py-3">
            <p className="text-lg font-bold text-[#111b21]">Chats</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!appointments.length && (
              <p className="px-6 py-10 text-center text-sm text-[#8696a0]">
                No bookings yet — jaise hi client slot book karega, yahan chat aa jayegi.
              </p>
            )}
            {appointments.map((a, i) => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
                  selected?.id === a.id ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'
                }`}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                >
                  {initialsOf(a.client)}
                </span>
                <div className="min-w-0 flex-1 border-b border-black/5 pb-3">
                  <div className="flex items-baseline justify-between">
                    <p className="truncate text-[15px] text-[#111b21]">{personName(a.client)}</p>
                    <span className={`text-[11px] ${a.status === 'done' ? 'text-[#667781]' : 'text-[#00a884]'}`}>
                      {a.status === 'done' ? '✓ done' : 'new'}
                    </span>
                  </div>
                  <p className="truncate text-[13px] text-[#667781]">
                    {a.slot} · {a.category}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="hidden min-w-0 flex-1 md:block">
          {selected ? (
            <SupportThread appt={selected} copy={botScripts} onDone={(a) => complete(a.id)} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#f0f2f5] text-[#8696a0]">
              <MessageSquareDashed size={40} />
              <p className="text-sm">Select a booking to open its thread</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
