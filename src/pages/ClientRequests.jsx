// "/requests" — the client's own view of their tickets and feature requests.
// The client can reopen anything support has resolved, with a reason.
import { useEffect, useState } from 'react'
import { Ticket, Lightbulb, RotateCcw } from 'lucide-react'
import { useWork } from '../context/WorkContext.jsx'
import { botScripts } from '../data/botScripts.js'
import { workStats } from '../utils/workStats.js'
import Card from '../components/common/Card.jsx'
import StatCard from '../components/common/StatCard.jsx'
import WorkRow from '../components/work/WorkRow.jsx'
import ReopenForm from '../components/work/ReopenForm.jsx'

export default function ClientRequests() {
  const { items, reopen, reload } = useWork()
  const [reopening, setReopening] = useState(null)
  const stats = workStats(items)

  // Support may have resolved something while this tab was closed
  useEffect(() => {
    reload()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // The client can send something back, but never mark it resolved themselves
  const action = (item) =>
    item.status === 'done' ? (
      <button
        onClick={() => setReopening(item.id)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
      >
        <RotateCcw size={13} /> {botScripts.workReopenLabel}
      </button>
    ) : null

  const section = (title, Icon, list, emptyText) => (
    <section className="mt-6">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Icon size={13} /> {title}
      </p>
      {list.length ? (
        <div className="mt-2 space-y-2">
          {list.map((item) => (
            <WorkRow key={item.id} item={item} action={action(item)} sideLabels={botScripts.reopenBy}>
              {reopening === item.id && (
                <ReopenForm
                  copy={botScripts}
                  onCancel={() => setReopening(null)}
                  onSubmit={async (reason) => {
                    const updated = await reopen(item.id, reason, 'client')
                    if (!updated) return false
                    setReopening(null)
                  }}
                />
              )}
            </WorkRow>
          ))}
        </div>
      ) : (
        <Card className="mt-2 p-6">
          <p className="text-center text-sm text-slate-400">{emptyText}</p>
        </Card>
      )}
    </section>
  )

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h2 className="text-xl font-bold text-slate-900">{botScripts.requestsTitle}</h2>
      <p className="mt-1 text-sm text-slate-500">{botScripts.requestsIntro}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Open tickets" value={stats.openTickets} sub={`${stats.doneTickets} resolved`} />
        <StatCard label="Open feature requests" value={stats.openFRs} sub={`${stats.doneFRs} shipped`} />
        <StatCard label="Total open" value={stats.totalOpen} sub={`of ${stats.total} raised`} />
      </div>

      {section('Support tickets', Ticket, items.filter((i) => i.kind === 'ticket'), 'No tickets raised yet.')}
      {section('Feature requests', Lightbulb, items.filter((i) => i.kind === 'fr'), 'No feature requests yet.')}
    </main>
  )
}
