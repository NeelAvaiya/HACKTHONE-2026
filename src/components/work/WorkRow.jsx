// One ticket or feature request (props-only). `action` lets each side drop its
// own button in; `children` is where the reopen form opens, inside the card.
import { Ticket, Lightbulb, CheckCircle2, RotateCcw } from 'lucide-react'
import Card from '../common/Card.jsx'

const ICON = { ticket: Ticket, fr: Lightbulb }

export default function WorkRow({ item, action, children, sideLabels }) {
  const Icon = ICON[item.kind] || Ticket
  const done = item.status === 'done'

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            done
              ? 'bg-emerald-50 text-emerald-600'
              : item.kind === 'fr'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-blue-50 text-blue-600'
          }`}
        >
          {done ? <CheckCircle2 size={17} /> : <Icon size={17} />}
        </span>

        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-bold ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
            {item.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {item.id} · {item.module} · {item.tag} · raised {item.raised}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {done ? 'Resolved' : 'Open'}
        </span>

        {action}
      </div>

      {/* Why it came back, and who sent it back — visible to both sides */}
      {item.reopen?.reason && (
        <div className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <RotateCcw size={13} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
              {sideLabels?.[item.reopen.by] || item.reopen.by}
            </p>
            <p className="mt-0.5 text-xs text-slate-700">{item.reopen.reason}</p>
          </div>
        </div>
      )}

      {children}
    </Card>
  )
}
