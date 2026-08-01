// "/review/:id/:side" — the client's review of a completed meeting.
// Reviews are one-way: the client rates the expert, not the other way round.
// `:side` is kept in the URL only so old links stay valid; anything other than
// 'client' is redirected rather than rendered.
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { useBookings } from '../context/BookingContext.jsx'
import { botScripts } from '../data/botScripts.js'
import Card from '../components/common/Card.jsx'
import ReviewForm from '../components/booking/ReviewForm.jsx'
import ReviewBlock from '../components/booking/ReviewBlock.jsx'
import { personName } from '../utils/person.js'

// Support used to review the client here too. That direction is gone, so a
// /support link lands back on the inbox instead of opening an empty form.

export default function ReviewPage() {
  const { id, side } = useParams()
  const navigate = useNavigate()
  const { appointments, submitReview } = useBookings()

  if (side !== 'client') return <Navigate to="/support" replace />

  const appt = appointments.find((a) => a.id === id)
  // An empty list means the API hasn't answered yet, not "not found"
  if (!appt) {
    if (!appointments.length) return null
    return <Navigate to="/chat" replace />
  }

  const clientName = personName(appt.client)
  const expertName = appt.person
  const mine = appt.reviews?.client
  const back = () => navigate('/chat', { state: { appointmentId: appt.id } })
  const myStars = mine?.stars ?? null

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <button
        onClick={back}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft size={15} /> {botScripts.reviewBackClient}
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
                onSubmit={(review) => submitReview(appt.id, 'client', review)}
                className="border-slate-200 p-4"
              />
            </>
          )}
        </div>
      </Card>
    </main>
  )
}
