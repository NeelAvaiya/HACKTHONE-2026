// "/meetings" — the client's own view of their meetings: upcoming slots, and
// completed calls with the summary and review. Reachable at any time, unlike
// the one-shot summary message in the chat.
import { useEffect } from 'react'
import { CalendarClock, CalendarCheck } from 'lucide-react'
import { useBookings } from '../context/BookingContext.jsx'
import { botScripts } from '../data/botScripts.js'
import Card from '../components/common/Card.jsx'
import MeetingSummaryCard from '../components/booking/MeetingSummaryCard.jsx'

export default function ClientMeetings() {
  const { appointments, reload } = useBookings()

  // Same "no sockets" freshness rule the support tabs use
  useEffect(reload, []) // eslint-disable-line react-hooks/exhaustive-deps

  const upcoming = appointments.filter((a) => a.status === 'upcoming')
  const completed = appointments.filter((a) => a.status === 'done')

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h2 className="text-xl font-bold text-slate-900">My meetings</h2>
      <p className="mt-1 text-sm text-slate-500">{botScripts.meetingsIntro}</p>

      {upcoming.length > 0 && (
        <section className="mt-6">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <CalendarClock size={13} /> Upcoming
          </p>
          <div className="mt-2 space-y-2">
            {upcoming.map((appt) => (
              <Card key={appt.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">{appt.slot}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {appt.person} · {appt.category} · {appt.id}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  Scheduled
                </span>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <CalendarCheck size={13} /> Completed
        </p>
        {completed.length ? (
          <div className="mt-2 space-y-3">
            {completed.map((appt) => (
              <MeetingSummaryCard key={appt.id} appt={appt} copy={botScripts} />
            ))}
          </div>
        ) : (
          <Card className="mt-2 p-8">
            <p className="text-center text-sm text-slate-400">{botScripts.meetingsEmpty}</p>
          </Card>
        )}
      </section>
    </main>
  )
}
