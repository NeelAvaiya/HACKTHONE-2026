// Chat pane identity strip: avatar + name | role + live status, with Chat/Files/Starred tabs
import { Bot, MessageSquareText, FolderClosed, Star, Search, MoreVertical } from 'lucide-react'
import DropdownMenu from './DropdownMenu.jsx'

const TABS = [
  { key: 'chat', Icon: MessageSquareText },
  { key: 'files', Icon: FolderClosed },
  { key: 'starred', Icon: Star },
]

export default function ChatHeader({
  persona,
  labels,
  isTyping,
  tab,
  onTab,
  counts,
  searchOpen,
  onSearchToggle,
  menuItems = [],
}) {
  return (
    <div className="border-l border-black/5 bg-[#f0f2f5]">
      <div className="flex items-center gap-3 px-4 pb-1.5 pt-2.5">
        <span className="relative shrink-0">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00a884] text-white">
            <Bot size={24} />
          </span>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#f0f2f5] bg-[#22c55e]" />
        </span>

        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15px] text-[#111b21]">
            <span className="font-semibold">{persona.name}</span>
            <span className="text-[#8696a0]"> | </span>
            <span className="text-[#54656f]">{persona.role}</span>
          </p>
          <p className="flex items-center gap-1.5 text-xs text-[#667781]">
            {!isTyping && <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />}
            {isTyping ? persona.typing : persona.status}
          </p>
        </div>

        <button
          type="button"
          onClick={onSearchToggle}
          aria-label="Search messages"
          className="shrink-0 rounded-full p-1.5 transition-colors hover:bg-black/5"
        >
          <Search size={20} className={searchOpen ? 'text-[#00a884]' : 'text-[#54656f]'} />
        </button>
        <DropdownMenu className="shrink-0" trigger={<MoreVertical size={20} />} items={menuItems} />
      </div>

      <div className="flex items-center gap-1 px-2">
        {TABS.map(({ key, Icon }) => {
          const active = tab === key
          const count = counts[key]
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTab(key)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
                active
                  ? 'border-[#00a884] font-semibold text-[#00a884]'
                  : 'border-transparent text-[#54656f] hover:text-[#111b21]'
              }`}
            >
              <Icon size={16} className={active && key === 'starred' ? 'fill-[#00a884]' : ''} />
              {labels[key]}
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${
                    active ? 'bg-[#00a884] text-white' : 'bg-black/10 text-[#54656f]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
