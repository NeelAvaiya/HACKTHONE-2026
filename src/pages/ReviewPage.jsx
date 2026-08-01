// "/review/:id/:side" — one review page used by BOTH sides. `:side` only decides
// which review slot is written and where Back returns to; everything else is
// identical, which is what keeps the two sides genuinely the same.
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { useBookings } from '../context/BookingContext.jsx'
import { botScripts } from '../data/botScripts.js'
import Card from '../components/common/Card.jsx'
import ReviewForm from '../components/booking/ReviewForm.jsx'
import ReviewBlock from '../components/booking/ReviewBlock.jsx'

const SIDES = ['client', 'support']
// "Rohit Verma (FinEdge Solutions)" -> "Rohit Verma"
const personName = (client = '') => client.split(' (')[0]

export default function ReviewPage() {
  const { id, side } = useParams()
  const navigate = useNavigate()
  const { appointments, submitReview } = useBookings()

  if (!SIDES.includes(side)) return <Navigate to="/support" replace />

  const appt = appointments.find((a) => a.id === id)
  // An empty list means the API hasn't answered yet, not "not found"
  if (!appt) {
    if (!appointments.length) return null
    return <Navigate to={side === 'client' ? '/chat' : '/support'} replace />
  }

  const clientName = personName(appt.client)
  const expertName = appt.person
  const mine = appt.reviews?.[side]
  const back = () => navigate(side === 'client' ? '/chat' : '/support', { state: { appointmentId: appt.id } })

  // Deliberately your own rating, not an average of both — an average would let
  // each side work out what the other gave.
  const myStars = mine?.stars ?? null

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <button
        onClick={back}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft size={15} /> {side === 'client' ? botScripts.reviewBackClient : botScripts.reviewBackSupport}
      </button>

      <Card className="mt-4 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-900 p-5 text-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                {appt.category} meeting · {appt.id}
              </p>
              <h2 className="mt-1 text-lg font-bold">
                {expertName} <span className="font-normal text-slate-400">with</span> {clientName}
              </h2>
              <p className="mt-1 text-xs text-slate-400">{appt.slot}</p>
            </div>
            {myStars !== null && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                {myStars}/5
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          {appt.status !== 'done' ? (
            <p className="text-sm text-slate-500">{botScripts.reviewNotReady}</p>
          ) : mine ? (
            <>
              <p className="mb-3 text-sm font-semibold text-emerald-700">{botScripts.reviewPageDone}</p>
              {/* Only ever the reviewer's own feedback — the other side's stays
                  private to them, and is pooled on the support Dashboard */}
              <ReviewBlock title="Your review" review={mine} />
            </>
          ) : (
            <>
              <p className="mb-3 text-sm font-semibold text-slate-900">{botScripts.reviewPageTitle}</p>
              <ReviewForm
                questions={botScripts.reviewQuestions}
                options={botScripts.reviewOptions}
                starsLabel={botScripts.reviewStarsLabel}
                submitLabel={botScripts.reviewSubmitLabel}
                onSubmit={(review) => submitReview(appt.id, side, review)}
                className="border-slate-200 p-4"
              />
            </>
          )}
        </div>
      </Card>
    </main>
  )
}
