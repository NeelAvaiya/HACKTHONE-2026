// "/support/client-work" — what this client has open, and the buttons that
// resolve or reopen it. Both actions go through /api/work, so the client's side
// reflects them straight away.
import { useEffect, useState } from 'react'
import { Ticket, Lightbulb, CheckCircle2, RotateCcw } from 'lucide-react'
import { useWork } from '../context/WorkContext.jsx'
import { botScripts } from '../data/botScripts.js'
import { workStats } from '../utils/workStats.js'
import Card from '../components/common/Card.jsx'
import StatCard from '../components/common/StatCard.jsx'
import WorkRow from '../components/work/WorkRow.jsx'
import ReopenForm from '../components/work/ReopenForm.jsx'

export default function SupportClientWork() {
  const { items, resolve, reopen, reload } = useWork()
  const [reopening, setReopening] = useState(null)
  const stats = workStats(items)

  // The client may have reopened something while this tab was closed
  useEffect(() => {
    reload()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const action = (item) =>
    item.status === 'done' ? (
      <button
        onClick={() => setReopening(item.id)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
      >
        <RotateCcw size={13} /> {botScripts.workReopenLabel}
      </button>
    ) : (
      <button
        onClick={() => resolve(item.id)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
      >
        <CheckCircle2 size={13} /> {botScripts.workDoneLabel}
      </button>
    )

  const section = (title, Icon, kind) => {
    const list = items.filter((i) => i.kind === kind)
    return (
      <section className="mt-6">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Icon size={13} /> {title}
        </p>
        <div className="mt-2 space-y-2">
          {list.map((item) => (
            <WorkRow key={item.id} item={item} action={action(item)} sideLabels={botScripts.reopenBy}>
              {reopening === item.id && (
                <ReopenForm
                  copy={botScripts}
                  onCancel={() => setReopening(null)}
                  onSubmit={async (reason) => {
                    const updated = await reopen(item.id, reason, 'support')
                    if (!updated) return false
                    setReopening(null)
                  }}
                />
              )}
            </WorkRow>
          ))}
        </div>
      </section>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h2 className="text-lg font-bold text-slate-900">{botScripts.clientWorkTitle}</h2>
      <p className="mt-1 text-sm text-slate-500">{botScripts.clientWorkIntro}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Open tickets" value={stats.openTickets} sub={`${stats.doneTickets} resolved`} />
        <StatCard label="Open feature requests" value={stats.openFRs} sub={`${stats.doneFRs} shipped`} />
        <StatCard label="Total open" value={stats.totalOpen} sub={`of ${stats.total} raised`} />
      </div>

      <Card className="mt-4 border-blue-200 bg-blue-50 p-3">
        <p className="text-xs font-medium text-blue-700">{botScripts.clientWorkHint}</p>
      </Card>

      {section('Support tickets', Ticket, 'ticket')}
      {section('Feature requests', Lightbulb, 'fr')}
    </main>
  )
}
