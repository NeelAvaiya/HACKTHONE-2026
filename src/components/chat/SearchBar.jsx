// WhatsApp-style in-chat search bar: query + "n of m" match navigation (props-only)
import { ChevronUp, ChevronDown, X, Search } from 'lucide-react'

export default function SearchBar({ query, onQuery, current, total, onPrev, onNext, onClose }) {
  return (
    <div className="flex items-center gap-2 border-b border-black/5 bg-[#f0f2f5] px-4 py-2">
      <div className="flex flex-1 items-center gap-2 rounded-lg bg-white px-3 py-1.5">
        <Search size={14} className="text-[#54656f]" />
        <input
          autoFocus
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.shiftKey ? onPrev : onNext)()
            if (e.key === 'Escape') onClose()
          }}
          placeholder="Search messages"
          className="w-full bg-transparent text-sm text-[#111b21] outline-none placeholder:text-[#8696a0]"
        />
      </div>
      <span className="w-16 text-center text-xs text-[#667781]">
        {total ? `${current + 1} of ${total}` : query ? '0 found' : ''}
      </span>
      <button type="button" onClick={onPrev} disabled={!total} aria-label="Previous match" className="text-[#54656f] disabled:opacity-30">
        <ChevronUp size={18} />
      </button>
      <button type="button" onClick={onNext} disabled={!total} aria-label="Next match" className="text-[#54656f] disabled:opacity-30">
        <ChevronDown size={18} />
      </button>
      <button type="button" onClick={onClose} aria-label="Close search" className="text-[#54656f]">
        <X size={18} />
      </button>
    </div>
  )
}
