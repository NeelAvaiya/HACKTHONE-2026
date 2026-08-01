// Client-side layout: sub-tabs (Chat / My Meetings) render below, mirroring Support.jsx.
// The badge counts meetings still waiting on the client's review, so a pending
// review is visible without depending on a chat message that may have scrolled away.
import { Link, Outlet, useLocation } from 'react-router-dom'
import { MessageSquare, CalendarCheck, Sparkles, Ticket } from 'lucide-react'
import { useBookings } from '../context/BookingContext.jsx'
import { useWork } from '../context/WorkContext.jsx'
import { pendingReviews } from '../utils/reviewStats.js'
import { workStats } from '../utils/workStats.js'

const tabs = [
  { to: '/', label: 'Chat', icon: MessageSquare },
  { to: '/requests', label: 'My Requests', icon: Ticket },
  { to: '/meetings', label: 'My Meetings', icon: CalendarCheck },
  { to: '/auto-assign', label: 'Auto-assign', icon: Sparkles },
]

export default function Client() {
  const { appointments } = useBookings()
  const { items } = useWork()
  const pending = pendingReviews(appointments, 'client').length
  const openWork = workStats(items).totalOpen
  // The chat renders at both "/" and "/chat", so it is the fallback tab rather
  // than an exact path match
  const { pathname } = useLocation()
  const activeTab = tabs.find((t) => t.to !== '/' && pathname.startsWith(t.to))?.to || '/'

  const badge = (to) => (to === '/meetings' ? pending : to === '/requests' ? openWork : 0)
  const badgeTitle = (to) =>
    to === '/meetings'
      ? `${pending} meeting${pending > 1 ? 's' : ''} waiting for your review`
      : `${openWork} open ticket${openWork > 1 ? 's' : ''} and feature request${openWork > 1 ? 's' : ''}`

  return (
    <div>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl gap-1 px-4 py-2">
          {tabs.map(({ to, label, icon: Icon }) => {
            const isActive = to === activeTab
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={14} />
                {label}
                {badge(to) > 0 && (
                  <span
                    title={badgeTitle(to)}
                    className={`flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      isActive ? 'bg-white text-slate-900' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {badge(to)}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
      <Outlet />
    </div>
  )
}
