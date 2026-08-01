// Support side: publish a release note and every open client chat gets notified.
import { useState } from 'react'
import { Rocket, Send, CheckCircle2 } from 'lucide-react'
import { botScripts } from '../../data/botScripts.js'
import { useReleases } from '../../context/ReleaseContext.jsx'
import Toast from '../common/Toast.jsx'

const copy = botScripts.release
const TYPES = ['feature', 'enhancement', 'fix']
const MODULES = ['Payroll', 'Attendance', 'PMS', 'Other']

const empty = {
  version: '',
  title: '',
  type: 'enhancement',
  modules: ['Payroll'],
  highlights: '',
  affected: '',
  fixesTickets: '',
}

// "SUP-1031, SUP-1042" / one per line → ['SUP-1031','SUP-1042']
const toList = (raw) =>
  raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)

const stamp = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

export default function ReleaseNotes() {
  const { releases, publish } = useReleases()
  const [form, setForm] = useState(empty)
  const [toast, setToast] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function toggleModule(mod) {
    setForm((f) => ({
      ...f,
      modules: f.modules.includes(mod) ? f.modules.filter((m) => m !== mod) : [...f.modules, mod],
    }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const now = new Date()
    await publish({
      // Date-based id keeps the list readable; the time slice keeps same-day notes apart
      id: `REL-${now.toISOString().slice(0, 10).replace(/-/g, '.')}-${now.getTime().toString().slice(-4)}`,
      version: form.version.trim() || 'v4.12.1',
      title: form.title.trim(),
      type: form.type,
      status: 'live',
      modules: form.modules,
      highlights: toList(form.highlights),
      affected: form.affected.trim(),
      fixesTickets: toList(form.fixesTickets),
      releasedAt: now.toISOString(),
    })
    setForm(empty)
    setToast(copy.publishedToast)
    setTimeout(() => setToast(null), 5000)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Rocket size={16} className="text-blue-600" />
          {copy.publishTitle}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{copy.publishHint}</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_9rem]">
          <input
            value={form.title}
            onChange={set('title')}
            placeholder="What went live? e.g. Payslip PDF download fixed"
            required
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input
            value={form.version}
            onChange={set('version')}
            placeholder="v4.12.1"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: t }))}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                form.type === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {copy.typeLabels[t]}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-slate-200" />
          {MODULES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggleModule(m)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                form.modules.includes(m)
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <textarea
          value={form.highlights}
          onChange={set('highlights')}
          rows={3}
          placeholder="What's new — one line per point"
          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <textarea
          value={form.affected}
          onChange={set('affected')}
          rows={2}
          placeholder="What's affected — who should re-check what"
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <input
          value={form.fixesTickets}
          onChange={set('fixesTickets')}
          placeholder="Tickets this closes, comma separated — SUP-1031, SUP-1042"
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={!form.title.trim()}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <Send size={15} />
          {copy.publishCta}
        </button>
      </form>

      <ul className="space-y-2">
        {releases.map((r) => (
          <li key={r.id} className="rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                {r.version}
              </span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-blue-700">
                {copy.typeLabels[r.type] || r.type}
              </span>
              {r.modules?.map((m) => (
                <span key={m} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                  {m}
                </span>
              ))}
              <span className="ml-auto text-[11px] text-slate-400">{stamp(r.releasedAt)}</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-slate-900">{r.title}</p>
            {r.affected && <p className="mt-1 text-xs leading-snug text-slate-500">{r.affected}</p>}
            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium">
              {r.notified ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span className="text-emerald-700">Clients notified in chat</span>
                </>
              ) : (
                <span className="text-amber-600">● Notifying clients…</span>
              )}
            </p>
          </li>
        ))}
      </ul>

      <Toast message={toast} />
    </div>
  )
}
