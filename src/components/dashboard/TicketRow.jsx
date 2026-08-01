// One ticket row — badges, bot tag, duplicate-match banner + merged state
import Badge from '../common/Badge.jsx'
import { botScripts } from '../../data/botScripts.js'
import { formatRelative } from '../../utils/formatTime.js'

export default function TicketRow({ ticket, onMerge, onKeepSeparate }) {
  const merged = ticket.status === 'Merged'
  const banner = ticket.duplicateOf
    ? botScripts.duplicateBanner
        .replace('{id}', ticket.duplicateOf)
        .replace('{name}', ticket.matchAssignee?.split(' ')[0] || 'team')
    : null

  return (
    <div className={ticket.incoming ? 'ticket-slide-in' : ''}>
      <div
        className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50 ${merged ? 'opacity-60' : ''}`}
      >
        <span className="w-20 shrink-0 text-xs font-bold text-slate-400">{ticket.id}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-slate-900">{ticket.title}</p>
            {ticket.createdBy === 'bot' && (
              <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600 ring-1 ring-violet-200">
                🤖 created by AI Syndicate
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {ticket.client} · {ticket.module}
            {merged && ticket.similarTo && (
              <span className="font-medium text-blue-600"> · ↳ linked to {ticket.similarTo} — same resolution thread</span>
            )}
          </p>
        </div>
        <Badge label={ticket.severity} />
        <Badge label={ticket.status} />
        <span className="hidden w-28 shrink-0 text-right text-xs text-slate-500 sm:block">
          {ticket.assignee}
        </span>
        <span className="hidden w-16 shrink-0 text-right text-xs text-slate-400 md:block">
          {formatRelative(ticket.createdAt)}
        </span>
      </div>

      {banner && (
        <div className="ticket-slide-in mx-4 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs font-semibold text-amber-800">{banner}</p>
          <div className="flex gap-2">
            <button
              onClick={() => onMerge(ticket)}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
            >
              Merge & Link
            </button>
            <button
              onClick={() => onKeepSeparate(ticket)}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
            >
              Keep Separate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
