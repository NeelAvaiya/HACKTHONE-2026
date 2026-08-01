// "/support" — support-side layout: sub-tabs (Inbox / Dashboard / Metrics) render below
import { NavLink, Outlet } from 'react-router-dom'
import { Inbox, LayoutDashboard, BarChart3, CalendarDays, Ticket } from 'lucide-react'

// Reviews are not a tab here — they are a section inside the Dashboard, the one
// place that shows both sides' feedback together
const tabs = [
  { to: '/support', label: 'Inbox', icon: Inbox, end: true },
  { to: '/support/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/support/client-work', label: 'Client Work', icon: Ticket },
  { to: '/support/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/support/metrics', label: 'Metrics', icon: BarChart3 },
]

export default function Support() {
  return (
    <div>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl gap-1 px-4 py-2">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
      <Outlet />
    </div>
  )
}
