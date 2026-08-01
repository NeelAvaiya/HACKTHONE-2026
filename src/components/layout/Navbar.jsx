// Top navigation bar with route links + active state
import { NavLink, useLocation } from 'react-router-dom'
import { Bot } from 'lucide-react'

// Top level only — the client's own tabs (Chat / My Meetings) live in Client.jsx,
// the same way the support tabs live in Support.jsx
const links = [
  { to: '/', label: 'Client Chat' },
  { to: '/support', label: 'Support' },
]

export default function Navbar() {
  // "Client Chat" covers every client route, so it stays lit on My Meetings too.
  // NavLink's own matching can't express this: `end` would drop /meetings, and
  // without `end` the "/" link would also match /support.
  const { pathname } = useLocation()
  const onSupport = pathname.startsWith('/support')

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <NavLink to="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white">
            <Bot size={18} />
          </span>
          AI Syndicate
        </NavLink>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const isActive = l.to === '/support' ? onSupport : !onSupport
            return (
              <NavLink
                key={l.to}
                to={l.to}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {l.label}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
