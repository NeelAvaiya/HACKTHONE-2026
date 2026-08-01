// Client-side layout: sub-tabs (Chat / My Requests / My Meetings) render below,
// mirroring Support.jsx — both use the same TabBar, so the two rows cannot drift
// apart in how they decide which tab is lit.
// The badges count meetings still waiting on the client's review and open
// tickets/FRs, so neither depends on a chat message that may have scrolled away.
import { Outlet } from 'react-router-dom'
import { MessageSquare, CalendarCheck, Ticket } from 'lucide-react'
import { useBookings } from '../context/BookingContext.jsx'
import { useWork } from '../context/WorkContext.jsx'
import { pendingReviews } from '../utils/reviewStats.js'
import { workStats } from '../utils/workStats.js'
import TabBar from '../components/layout/TabBar.jsx'

// '/' is the Chat tab: the chat renders at both "/" and "/chat", and TabBar's
// longest-prefix rule makes '/' the fallback for anything no other tab owns
const tabs = [
  { to: '/', label: 'Chat', icon: MessageSquare },
  { to: '/requests', label: 'My Requests', icon: Ticket },
  { to: '/meetings', label: 'My Meetings', icon: CalendarCheck },
]

export default function Client() {
  const { appointments } = useBookings()
  const { items } = useWork()
  const pending = pendingReviews(appointments).length
  const openWork = workStats(items).totalOpen

  const badgeFor = (to) => (to === '/meetings' ? pending : to === '/requests' ? openWork : 0)
  const badgeTitleFor = (to) =>
    to === '/meetings'
      ? `${pending} meeting${pending > 1 ? 's' : ''} waiting for your review`
      : `${openWork} open ticket${openWork > 1 ? 's' : ''} and feature request${openWork > 1 ? 's' : ''}`

  return (
    <div>
      <TabBar tabs={tabs} badgeFor={badgeFor} badgeTitleFor={badgeTitleFor} />
      <Outlet />
    </div>
  )
}
