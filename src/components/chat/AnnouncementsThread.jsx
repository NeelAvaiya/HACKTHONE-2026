// The Announcements group (props-only): a read-only thread of updates on the
// client's tickets and feature requests. No input bar — nobody replies to a
// broadcast, and pretending otherwise would just be a dead text box.
import { Megaphone, CheckCircle2, RotateCcw } from 'lucide-react'
import { formatClock } from '../../utils/formatTime.js'

const STYLE = {
  resolved: { Icon: CheckCircle2, ring: 'border-emerald-200', chip: 'bg-emerald-50 text-emerald-700' },
  reopened: { Icon: RotateCcw, ring: 'border-amber-200', chip: 'bg-amber-50 text-amber-700' },
}

export default function AnnouncementsThread({ copy, announcements = [] }) {
  return (
    <div className="wa-font flex h-full flex-col">
      <div className="flex items-center gap-3 border-l border-black/5 bg-[#f0f2f5] px-4 py-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7c3aed] text-white">
          <Megaphone size={19} />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15px] font-semibold text-[#111b21]">{copy.name}</p>
          <p className="truncate text-xs text-[#667781]">{copy.subtitle}</p>
        </div>
      </div>

      <div className="wa-doodle flex-1 space-y-3 overflow-y-auto px-6 py-4 sm:px-12">
        {announcements.length ? (
          announcements.map((a) => {
            const { Icon, ring, chip } = STYLE[a.type] || STYLE.resolved
            return (
              <div key={a.key} className="flex justify-start pl-2">
                <div className={`max-w-[80%] rounded-lg border bg-white px-3.5 py-3 shadow-sm ${ring}`}>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${chip}`}>
                    <Icon size={10} /> {a.chip}
                  </span>

                  <p className="mt-2 text-sm font-semibold text-[#111b21]">{a.headline}</p>

                  {/* The client's own wording, quoted back so they recognise it */}
                  {a.quote && (
                    <p className="mt-1.5 border-l-2 border-slate-200 pl-2.5 text-sm italic text-slate-600">
                      “{a.quote}”
                    </p>
                  )}

                  {a.reason && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-slate-700">
                      <span className="font-semibold">{copy.reasonLabel}:</span> {a.reason}
                    </p>
                  )}

                  {a.note && <p className="mt-2 text-xs leading-relaxed text-[#667781]">{a.note}</p>}

                  {a.at && (
                    <span className="mt-2 block text-right text-[10px] leading-none text-[#667781]">
                      {formatClock(a.at)}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="max-w-xs rounded-lg bg-white/95 px-4 py-3 text-center text-sm text-[#667781] shadow-sm">
              {copy.empty}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
