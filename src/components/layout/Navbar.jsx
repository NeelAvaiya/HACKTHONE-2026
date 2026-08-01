// Top navigation bar with route links + active state
import { NavLink, useLocation } from 'react-router-dom'
import { Bot, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme.js'

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
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <NavLink to="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white">
            <Bot size={18} />
          </span>
          HelpSense
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

          <button
            type="button"
            onClick={toggle}
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Light theme' : 'Dark theme'}
            className="ml-2 flex h-7 w-[3.25rem] items-center rounded-full border border-slate-200 bg-slate-100 p-0.5 transition-colors"
          >
            {/* The knob slides; both icons stay put so the track reads as a switch */}
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform dark:bg-slate-600 ${
                isDark ? 'translate-x-[1.5rem]' : 'translate-x-0'
              }`}
            >
              {isDark ? <Moon size={13} className="text-slate-100" /> : <Sun size={13} className="text-amber-500" />}
            </span>
          </button>
        </nav>
      </div>
    </header>
  )
}
