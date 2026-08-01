// "Starred" tab: messages the user kept, newest first — tap to jump back to them in the thread
import { Star, CornerUpLeft, Paperclip } from 'lucide-react'
import { formatClock } from '../../utils/formatTime.js'

export default function StarredPanel({ messages, emptyText, onJump, onToggleStar }) {
  const starred = messages.filter((m) => m.starred).reverse()

  if (!starred.length) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#f7f8fa] px-4 py-3">
        <p className="px-4 py-10 text-center text-sm text-[#8696a0]">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f7f8fa] px-4 py-3">
      <p className="mb-2 px-1 text-[11px] uppercase tracking-wide text-[#8696a0]">
        {starred.length} starred message{starred.length > 1 ? 's' : ''}
      </p>
      <ul className="space-y-2">
        {starred.map((m) => (
          <li key={m.id} className="rounded-lg bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8696a0]">
                {m.from === 'user' ? 'You' : 'HelpSense'} · {m.time && formatClock(m.time)}
              </p>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => onJump(m.id)}
                  aria-label="Show in chat"
                  className="rounded-full p-1.5 text-[#54656f] transition-colors hover:bg-black/5"
                >
                  <CornerUpLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleStar(m.id)}
                  aria-label="Remove star"
                  className="rounded-full p-1.5 text-amber-500 transition-colors hover:bg-amber-500/10"
                >
                  <Star size={16} className="fill-amber-400" />
                </button>
              </div>
            </div>
            {m.attachment && (
              <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-[#111b21]">
                <Paperclip size={13} className="text-[#54656f]" />
                <span className="truncate">{m.attachment.name}</span>
              </p>
            )}
            {m.text && <p className="mt-1 line-clamp-3 whitespace-pre-line text-[13.5px] text-[#3b4a54]">{m.text}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
