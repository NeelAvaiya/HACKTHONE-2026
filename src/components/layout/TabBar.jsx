// The sub-tab row used by BOTH shells (Client and Support).
//
// It was duplicated before, and the two copies had drifted: one matched the
// active tab by prefix with a hardcoded fallback, the other relied on NavLink's
// `end` flag. Same-looking rows, different rules — which is how you end up on a
// page whose tab isn't lit.
//
// Sticky under the 3.5rem navbar: on a long page (Dashboard, Metrics) a static
// row scrolls away, and then nothing on screen says which tab you are in.
import { Link, useLocation } from 'react-router-dom'
import { activeTabPath } from '../../utils/activeTab.js'

export default function TabBar({ tabs, badgeFor = () => 0, badgeTitleFor = () => undefined }) {
  const { pathname } = useLocation()
  const active = activeTabPath(tabs, pathname)

  return (
    <div className="sticky top-14 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2">
        {tabs.map(({ to, label, icon: Icon }) => {
          const isActive = to === active
          const count = badgeFor(to)
          return (
            <Link
              key={to}
              to={to}
              aria-current={isActive ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={14} />
              {label}
              {count > 0 && (
                <span
                  title={badgeTitleFor(to)}
                  className={`flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    isActive ? 'bg-white text-slate-900' : 'bg-blue-600 text-white'
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
