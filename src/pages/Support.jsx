// "/support" — support-side layout: sub-tabs render below, using the same
// TabBar as the client shell so both rows behave identically.
import { Outlet } from 'react-router-dom'
import { MessageSquare, LayoutDashboard, BarChart3, CalendarDays, Ticket, Sparkles } from 'lucide-react'
import TabBar from '../components/layout/TabBar.jsx'

// Reviews are not a tab here — they are a section inside the Dashboard, where
// every client review is read.
// The first tab is "Chat", matching the client side — both sides are looking at
// the same WhatsApp-style conversations, so calling one an Inbox was confusing.
// No `end` flag: TabBar picks the longest matching prefix, so '/support/calendar'
// beats '/support' on its own.
const tabs = [
  { to: '/support', label: 'Chat', icon: MessageSquare },
  { to: '/support/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/support/client-work', label: 'Client Work', icon: Ticket },
  { to: '/support/auto-assign', label: 'Auto-assign', icon: Sparkles },
  { to: '/support/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/support/metrics', label: 'Metrics', icon: BarChart3 },
]

export default function Support() {
  return (
    <div>
      <TabBar tabs={tabs} />
      <Outlet />
    </div>
  )
}
