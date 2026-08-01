// Chip buttons under a bot message — WhatsApp template-button style (white pill, teal text)
export default function QuickReplies({ options = [], onSelect }) {
  if (!options.length) return null
  return (
    <div className="flex flex-wrap gap-2 pl-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#00a884] shadow-sm ring-1 ring-black/5 transition-colors hover:bg-[#f0f2f5]"
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
