// Dashboard sidebar: tab buttons (Ticket Queue / Feature Requests / Meeting Brief)
import { Inbox, Lightbulb, FileText, Rocket } from 'lucide-react'

const tabs = [
  { key: 'queue', label: 'Ticket Queue', icon: Inbox },
  { key: 'features', label: 'Feature Requests', icon: Lightbulb },
  { key: 'brief', label: 'Meeting Brief', icon: FileText },
  { key: 'releases', label: 'Release Notes', icon: Rocket },
]

export default function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="w-full shrink-0 rounded-xl bg-slate-900 p-3 text-slate-300 md:w-56">
      <p className="hidden px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 md:block">
        Support Dashboard
      </p>
      <nav className="flex gap-1 md:flex-col">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex flex-1 items-center justify-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:flex-none md:justify-start ${
              activeTab === key
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
