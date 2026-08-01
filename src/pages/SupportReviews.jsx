// "/support/reviews" — every completed meeting's feedback in one place
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, ChevronRight, MessageSquareHeart } from 'lucide-react'
import { useBookings } from '../context/BookingContext.jsx'
import { botScripts } from '../data/botScripts.js'
import { reviewStats } from '../utils/reviewStats.js'
import Card from '../components/common/Card.jsx'
import StatCard from '../components/common/StatCard.jsx'

const personName = (client = '') => client.split(' (')[0]

function Rating({ label, review }) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className="text-slate-400">{label}</span>
      {review ? (
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          {review.stars}/5
        </span>
      ) : (
        <span className="font-medium text-slate-300">waiting</span>
      )}
    </span>
  )
}

export default function SupportReviews() {
  const { appointments, reload } = useBookings()
  const navigate = useNavigate()

  // Same "no sockets" freshness rule as the other support tabs
  useEffect(reload, []) // eslint-disable-line react-hooks/exhaustive-deps

  const done = appointments.filter((a) => a.status === 'done')
  const stats = reviewStats(appointments)

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <MessageSquareHeart size={18} className="text-slate-400" />
        Reviews
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Average rating" value={stats.average ? stats.average.toFixed(1) : '—'} />
        <StatCard label="Fully reviewed" value={stats.reviewed} />
        <StatCard label="Awaiting a review" value={stats.awaiting} />
      </div>

      {done.length ? (
        <div className="mt-5 space-y-2">
          {done.map((appt) => (
            <button
              key={appt.id}
              onClick={() => navigate(`/review/${appt.id}/support`)}
              className="w-full text-left"
            >
              <Card className="flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{personName(appt.client)}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {appt.id} · {appt.category} · {appt.slot}
                  </p>
                </div>
                <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                  <Rating label="Client" review={appt.reviews?.client} />
                  <Rating label={appt.person.split(' ')[0]} review={appt.reviews?.support} />
                </div>
                <ChevronRight size={16} className="shrink-0 text-slate-300" />
              </Card>
            </button>
          ))}
        </div>
      ) : (
        <Card className="mt-5 p-8">
          <p className="text-center text-sm text-slate-400">{botScripts.reviewsTabEmpty}</p>
        </Card>
      )}
    </main>
  )
}
