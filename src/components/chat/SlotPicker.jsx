// Two modes (props-only): the day/time grid the client books from, or the booking
// confirmation card. The grid shows times only — which expert takes the call is
// decided server-side and revealed on the confirmation.
import { useState } from 'react'
import Card from '../common/Card.jsx'
import Avatar from '../common/Avatar.jsx'

const DAY_MS = 24 * 60 * 60 * 1000

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// Local-time YYYY-MM-DD — toISOString() would shift the date across the UTC boundary
const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const dayIdxFromISO = (value) => {
  const picked = new Date(`${value}T00:00:00`)
  if (Number.isNaN(picked.getTime())) return null
  return Math.round((picked - startOfToday()) / DAY_MS)
}

const dateForDayIdx = (dayIdx) => {
  const d = startOfToday()
  d.setDate(d.getDate() + dayIdx)
  return isoDate(d)
}

const QUICK_DAYS = [
  { idx: 0, label: 'Today' },
  { idx: 1, label: 'Tomorrow' },
]

export default function SlotPicker({
  offers = [],
  dayLabel,
  day = 0,
  date,
  onPick,
  onDayChange,
  dayErrorLabel,
  booking,
  onChangeSlot,
  changeLabel,
}) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  if (booking) {
    return (
      <Card className="max-w-sm border-emerald-200 p-4">
        <p className="text-sm font-bold text-emerald-700">✅ Meeting booked</p>
        <p className="mt-2 text-sm font-medium text-slate-900">🕒 {booking.slot}</p>
        {booking.person && (
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
            <Avatar name={booking.person} size={22} />
            <span>
              {booking.person}
              {booking.category ? ` — ${booking.category} expert` : ''}
            </span>
          </p>
        )}
        <p className="mt-1 text-sm text-blue-600 underline">🔗 {booking.link}</p>
        {booking.lines?.map((line) => (
          <p key={line} className="mt-1 text-xs text-slate-500">
            {line}
          </p>
        ))}
        {onChangeSlot && !booking.done && (
          <button
            onClick={() => onChangeSlot(booking.id)}
            className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            {changeLabel}
          </button>
        )}
      </Card>
    )
  }

  const selectedDate = date || dateForDayIdx(day)

  // Retrying the day already on screen is allowed only after a failure, so the
  // error message has a way out.
  async function goToDay(dayIdx) {
    if (!onDayChange || dayIdx < 0 || busy) return
    if (dayIdx === day && !failed) return
    setBusy(true)
    try {
      setFailed((await onDayChange(dayIdx)) === false)
    } finally {
      setBusy(false)
    }
  }

  const dayButton = (idx, label) => {
    const active = day === idx
    return (
      <button
        key={idx}
        type="button"
        onClick={() => goToDay(idx)}
        disabled={busy}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
          active
            ? 'bg-emerald-500 text-white'
            : 'border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <Card className="w-[20rem] max-w-full p-3">
      <div className="flex items-center gap-1.5">
        {QUICK_DAYS.map((d) => dayButton(d.idx, d.label))}
        <input
          type="date"
          value={selectedDate}
          min={dateForDayIdx(0)}
          max={dateForDayIdx(60)}
          disabled={busy}
          onChange={(e) => {
            const idx = dayIdxFromISO(e.target.value)
            if (idx != null && idx >= 0) goToDay(idx)
          }}
          aria-label="Pick a date"
          className={`ml-auto w-[7.6rem] rounded-full border px-2 py-1 text-[11px] font-semibold outline-none transition-colors disabled:opacity-60 ${
            day > 1
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 text-slate-600 hover:border-emerald-300'
          }`}
        />
      </div>

      <p className="mt-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {busy ? 'Checking…' : dayLabel}
      </p>

      {failed && !busy ? (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-3 text-center text-xs font-medium text-amber-700">
          {dayErrorLabel || "Couldn't load that day — tap the day again to retry."}
        </p>
      ) : offers.length ? (
        <div className={`mt-2 grid grid-cols-3 gap-2 ${busy ? 'opacity-50' : ''}`}>
          {offers.map((offer) => (
            <button
              key={offer.time}
              type="button"
              onClick={() => onPick?.(offer)}
              disabled={busy}
              className="rounded-lg border border-slate-200 px-1 py-2 text-[11px] font-bold text-slate-900 transition-colors hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-60"
            >
              {offer.time}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
          {busy ? 'Loading slots…' : 'No slots left on this day — try another date.'}
        </p>
      )}
    </Card>
  )
}
