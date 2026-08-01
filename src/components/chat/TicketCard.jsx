// Inline generated-ticket card shown in chat after auto-ticket flow (full version in Step 3)
import Badge from '../common/Badge.jsx'
import Card from '../common/Card.jsx'

export default function TicketCard({ ticket }) {
  if (!ticket) return null
  return (
    <Card className="max-w-sm p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-400">{ticket.id}</p>
        <Badge label={ticket.severity} />
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-900">{ticket.title}</p>
      <p className="mt-2 text-xs text-slate-500">
        {ticket.module} · Assigned to {ticket.assignee} · ETA {ticket.eta}
      </p>
    </Card>
  )
}
