// Dashboard section: the ONLY place both sides' reviews are shown together.
// The client and the expert each see just their own on the review page.
import { useEffect } from 'react'
import { Star } from 'lucide-react'
import { useBookings } from '../../context/BookingContext.jsx'
import { botScripts } from '../../data/botScripts.js'
import { reviewStats } from '../../utils/reviewStats.js'
import Card from '../common/Card.jsx'
import StatCard from '../common/StatCard.jsx'
import ReviewBlock from '../booking/ReviewBlock.jsx'

const personName = (client = '') => client.split(' (')[0]

export default function ReviewsPanel() {
  const { appointments, reload } = useBookings()

  // Same "no sockets" freshness rule the other support views use
  useEffect(reload, []) // eslint-disable-line react-hooks/exhaustive-deps

  const completed = appointments.filter((a) => a.status === 'done')
  const stats = reviewStats(appointments)

  if (!completed.length) {
    return (
      <Card className="p-8">
        <p className="text-center text-sm text-slate-400">{botScripts.reviewsTabEmpty}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Average rating" value={stats.average ? stats.average.toFixed(1) : '—'} sub="both sides pooled" />
        <StatCard label="Fully reviewed" value={stats.reviewed} sub="client and expert" />
        <StatCard label="Awaiting a review" value={stats.awaiting} sub="at least one side missing" />
      </div>

      {completed.map((appt) => (
        <Card key={appt.id} className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-4">
            <div>
              <p className="text-sm font-bold text-slate-900">{personName(appt.client)}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {appt.id} · {appt.category} · {appt.slot} · with {appt.person}
              </p>
            </div>
            {appt.reviews?.client?.stars && appt.reviews?.support?.stars && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                {((appt.reviews.client.stars + appt.reviews.support.stars) / 2).toFixed(1)}
              </span>
            )}
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <ReviewBlock
              title={`Client — ${personName(appt.client)}`}
              review={appt.reviews?.client}
              waitingText="No review from the client yet."
            />
            <ReviewBlock
              title={`Expert — ${appt.person}`}
              review={appt.reviews?.support}
              waitingText="No review from the expert yet."
            />
          </div>
        </Card>
      ))}
    </div>
  )
}
