// Team day-grid (props-only): experts down the side, time slots across the top.
// Three cell states — booked (client name, clickable), busy (blocked), free.
import { timeSlots } from '../../data/team.js'
import Avatar from '../common/Avatar.jsx'

export default function TeamDayGrid({ team = [], appointments = [], dayIdx = 0, date, onSelectBooking }) {
  const busyAt = (member, time) => (member.busy?.[dayIdx] || member.busy?.[String(dayIdx)] || []).includes(time)
  const bookingAt = (member, time) =>
    appointments.find((a) => a.person === member.name && a.date === date && a.time === time)

  if (!team.length) {
    return <p className="px-4 py-12 text-center text-sm text-slate-400">No team schedule available.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="w-40 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Expert</th>
            {timeSlots.map((time) => (
              <th key={time} className="text-[11px] font-semibold text-slate-500">
                {time.replace(':00', '')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {team.map((member) => (
            <tr key={member.name}>
              <td className="w-40 pr-2">
                <div className="flex items-center gap-2">
                  <Avatar name={member.name} size={28} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">{member.name}</p>
                    <p className="truncate text-[10px] text-slate-400">{member.categories?.join(' · ')}</p>
                  </div>
                </div>
              </td>

              {timeSlots.map((time) => {
                const booking = bookingAt(member, time)
                if (booking) {
                  return (
                    <td key={time}>
                      <button
                        onClick={() => onSelectBooking?.(booking)}
                        title={`${booking.client} — ${booking.category}`}
                        className="h-12 w-full rounded-lg bg-emerald-500 px-1.5 text-left text-white transition-colors hover:bg-emerald-600"
                      >
                        <span className="block truncate text-[10px] font-bold leading-tight">
                          {booking.client.split(' (')[0]}
                        </span>
                        <span className="block truncate text-[9px] leading-tight text-emerald-50">
                          {booking.category}
                        </span>
                      </button>
                    </td>
                  )
                }
                const busy = busyAt(member, time)
                return (
                  <td key={time}>
                    <div
                      title={busy ? 'Blocked' : 'Available'}
                      className={`h-12 w-full rounded-lg border ${
                        busy
                          ? 'border-slate-200 bg-slate-100'
                          : 'border-dashed border-emerald-200 bg-emerald-50/40'
                      }`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
