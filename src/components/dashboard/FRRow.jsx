// One feature request row — demand meter + expandable merged-phrasings list
import { useState } from 'react'
import { ChevronDown, GitMerge } from 'lucide-react'

export default function FRRow({ fr }) {
  const [open, setOpen] = useState(false)
  const hasMerged = fr.mergedPhrasings.length > 0

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-medium text-slate-900">{fr.title}</p>
          {hasMerged && (
            <button
              onClick={() => setOpen(!open)}
              className="flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-200 transition-colors hover:bg-blue-100"
            >
              <GitMerge size={10} />
              {fr.mergedPhrasings.length} similar requests merged
              <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        <p className="shrink-0 text-xs font-semibold text-slate-700">
          {fr.demandCount} clients
          {fr.enterpriseCount > 0 && (
            <span className="font-medium text-slate-400"> ({fr.enterpriseCount} enterprise)</span>
          )}
        </p>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
          style={{ width: `${Math.min(100, fr.demandCount * 4)}%` }}
        />
      </div>

      {open && hasMerged && (
        <div className="ticket-slide-in mt-3 space-y-1.5 rounded-lg bg-slate-50 p-3">
          {fr.mergedPhrasings.map((phrase) => (
            <p key={phrase} className="text-xs text-slate-600">
              💬 “{phrase}”
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
