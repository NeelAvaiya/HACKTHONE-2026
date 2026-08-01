// Small click-away dropdown used by the header ⋮ and every message ⋮
import { useEffect, useRef, useState } from 'react'

export default function DropdownMenu({ trigger, items, align = 'right', className = '' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const usable = items.filter(Boolean)

  return (
    <span ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More options"
        className="rounded-full p-1 text-[#54656f] transition-colors hover:bg-black/10"
      >
        {trigger}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute top-full z-30 mt-1 min-w-[10.5rem] overflow-hidden rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/10 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {usable.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13.5px] transition-colors hover:bg-[#f0f2f5] ${
                item.danger ? 'text-red-600' : 'text-[#3b4a54]'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </span>
  )
}
