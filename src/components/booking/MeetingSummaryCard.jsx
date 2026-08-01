// One completed meeting on the client's My Meetings page: the summary, plus
// where the reviews stand (props-only).
import { Link } from 'react-router-dom'
import { Star, ClipboardList, ArrowRight } from 'lucide-react'
import { meetingSummary } from '../../utils/meetingSummary.js'
import Card from '../common/Card.jsx'

function Rating({ label, review, waiting }) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className="text-slate-400">{label}</span>
      {review ? (
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          {review.stars}/5
        </span>
      ) : (
        <span className="font-medium text-slate-300">{waiting}</span>
      )}
    </span>
  )
}

export default function MeetingSummaryCard({ appt, copy }) {
  const { discussed, nextSteps } = meetingSummary(appt, copy)
  const mine = appt.reviews?.client

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 p-4">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {appt.person} <span className="font-normal text-slate-400">· {appt.category} expert</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {appt.id} · {appt.slot}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          Completed
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <ClipboardList size={12} /> Discussed
          </p>
          <ul className="mt-1.5 space-y-1 text-sm text-slate-700">
            {discussed.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-slate-300">•</span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Next steps</p>
          <ul className="mt-1.5 space-y-1 text-sm text-slate-700">
            {nextSteps.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-slate-300">•</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
        {/* Only the client's own rating — the expert's review is theirs, and is
            pooled with this one on the support Dashboard */}
        <Rating label="Your review" review={mine} waiting="not given yet" />
        <Link
          to={`/review/${appt.id}/client`}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            mine
              ? 'text-slate-600 ring-1 ring-slate-200 hover:bg-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {mine ? copy.reviewViewLabel : copy.reviewCtaLabel}
          <ArrowRight size={14} />
        </Link>
      </div>
    </Card>
  )
}
