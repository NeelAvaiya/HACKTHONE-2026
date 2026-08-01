// Two modes (props-only): a list of {time, person} offers, or the booking confirmation card.
import Card from '../common/Card.jsx'

export default function SlotPicker({ offers = [], dayLabel, onPick, booking, onChangeSlot, changeLabel }) {
  if (booking) {
    return (
      <Card className="max-w-sm border-emerald-200 p-4">
        <p className="text-sm font-bold text-emerald-700">✅ Meeting booked</p>
        <p className="mt-2 text-sm font-medium text-slate-900">🕒 {booking.slot}</p>
        {booking.person && (
          <p className="mt-1 text-sm text-slate-700">
            👤 {booking.person}
            {booking.category ? ` — ${booking.category} expert` : ''}
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

  return (
    <Card className="max-w-sm p-4">
      {dayLabel && <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{dayLabel}</p>}
      <div className="mt-2 space-y-2">
        {offers.map((offer) => (
          <button
            key={`${offer.time}-${offer.person}`}
            onClick={() => onPick(offer)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            <span className="text-sm font-bold text-slate-900">{offer.time}</span>
            <span className="text-xs text-slate-500">{offer.person}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}
