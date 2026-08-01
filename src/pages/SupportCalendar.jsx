// "/support/calendar" — the whole team's day in one screen: 5-day strip + expert × time grid
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { useBookings } from '../context/BookingContext.jsx'
import { timeSlots } from '../data/team.js'
import Card from '../components/common/Card.jsx'
import TeamDayGrid from '../components/support/TeamDayGrid.jsx'

const DAYS = 5

// Local-date key, matching how the server stores appointment dates. Not
// toISOString(), which shifts to UTC and can land a booking on the wrong day.
function dateForDay(dayIdx) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + dayIdx)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dayStrip() {
  return Array.from({ length: DAYS }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return {
      idx: i,
      date: dateForDay(i),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      sub: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    }
  })
}

export default function SupportCalendar() {
  const { appointments, reload } = useBookings()
  const navigate = useNavigate()
  const [team, setTeam] = useState([])
  const [dayIdx, setDayIdx] = useState(0)
  const days = useMemo(dayStrip, [])

  // Same "no sockets" freshness rule as the Chat tab: opening the tab refetches
  useEffect(() => {
    reload()
    fetch('/api/team')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setTeam(data))
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const countFor = (date) => appointments.filter((a) => a.date === date).length
  const day = days[dayIdx]
  const booked = countFor(day.date)
  const capacity = team.length * timeSlots.length

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <CalendarDays size={18} className="text-slate-400" />
            Team calendar
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {booked} booked {booked === 1 ? 'meeting' : 'meetings'} on {day.label.toLowerCase()}
            {capacity ? ` · ${capacity - booked} slots open` : ''}
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => (
            <button
              key={d.idx}
              onClick={() => setDayIdx(d.idx)}
              className={`min-w-[5rem] shrink-0 rounded-xl border px-3 py-2 text-center transition-colors ${
                dayIdx === d.idx
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <p className="text-xs font-bold">{d.label}</p>
              <p className={`text-[10px] ${dayIdx === d.idx ? 'text-slate-300' : 'text-slate-400'}`}>{d.sub}</p>
              <p
                className={`mt-0.5 text-[10px] font-semibold ${
                  dayIdx === d.idx ? 'text-emerald-300' : countFor(d.date) ? 'text-emerald-600' : 'text-slate-300'
                }`}
              >
                {countFor(d.date) ? `${countFor(d.date)} booked` : 'free'}
              </p>
            </button>
          ))}
        </div>
      </div>

      <Card className="mt-5 p-4">
        <TeamDayGrid
          team={team}
          appointments={appointments}
          dayIdx={dayIdx}
          date={day.date}
          onSelectBooking={(appt) => navigate('/support', { state: { appointmentId: appt.id } })}
        />
        <p className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Client booking — click to open the thread
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-slate-200 bg-slate-100" /> Blocked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-emerald-200 bg-emerald-50" /> Available
          </span>
        </p>
      </Card>
    </main>
  )
}
