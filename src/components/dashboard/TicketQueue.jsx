// Tab 1: ticket queue — filter chips, simulate-duplicate button, rows; chat tickets arrive via context
import { useState } from 'react'
import { Play } from 'lucide-react'
import { useTickets } from '../../context/TicketContext.jsx'
import { botScripts } from '../../data/botScripts.js'
import Card from '../common/Card.jsx'
import Toast from '../common/Toast.jsx'
import TicketRow from './TicketRow.jsx'

const SEVERITIES = ['All', 'P1', 'P2', 'P3']
const MODULES = ['All', 'Payroll', 'Attendance', 'PMS', 'Other']

export default function TicketQueue() {
  const { tickets, simulateIncoming, mergeTickets, keepSeparate } = useTickets()
  const [severity, setSeverity] = useState('All')
  const [module, setModule] = useState('All')
  const [toast, setToast] = useState(null)

  const filtered = tickets.filter(
    (t) =>
      (severity === 'All' || t.severity === severity) &&
      (module === 'All' || t.module === module)
  )

  function handleMerge(ticket) {
    mergeTickets(ticket.id, ticket.duplicateOf)
    setToast(botScripts.mergeToast.replace('{name}', ticket.matchAssignee?.split(' ')[0] || 'the team'))
    setTimeout(() => setToast(null), 6000)
  }

  const chip = (active) =>
    `rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
      active ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
    }`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {SEVERITIES.map((s) => (
          <button key={s} onClick={() => setSeverity(s)} className={chip(severity === s)}>
            {s}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-slate-300" />
        {MODULES.map((m) => (
          <button key={m} onClick={() => setModule(m)} className={chip(module === m)}>
            {m}
          </button>
        ))}
        <button
          onClick={simulateIncoming}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Play size={12} />
          Simulate incoming ticket
        </button>
      </div>

      <Card className="divide-y divide-slate-100">
        {filtered.map((t) => (
          <TicketRow key={t.id} ticket={t} onMerge={handleMerge} onKeepSeparate={(x) => keepSeparate(x.id)} />
        ))}
        {!filtered.length && (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            No tickets match these filters.
          </p>
        )}
      </Card>

      <Toast message={toast} />
    </div>
  )
}
