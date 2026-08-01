// "/metrics" — impact stats with count-up animation + before/after CSS bar chart
import { useEffect, useState } from 'react'
import Card from '../components/common/Card.jsx'
import StatCard from '../components/common/StatCard.jsx'

const STATS = [
  { end: 15, suffix: ' sec', label: 'First response time', sub: 'was 15 hours' },
  { end: 40, suffix: '%', label: 'Tickets resolved with zero human effort' },
  { end: 100, suffix: '%', label: 'Auto-triaged before 9 AM' },
  { end: 60, prefix: '+', suffix: '%', label: 'Support capacity', sub: 'zero new hires' },
]

// Chart palette validated (CVD-safe): Before #d97706 amber, After #2563eb blue
const CHART = [
  { label: 'Tickets needing human effort', before: 100, after: 60 },
  { label: 'Auto-triaged before 9 AM', before: 0, after: 100 },
  { label: 'Resolved with zero human effort', before: 0, after: 40 },
]
const SERIES = [
  { key: 'before', name: 'Before', color: '#d97706' },
  { key: 'after', name: 'After AI Syndicate', color: '#2563eb' },
]

// Eased 0→1 progress that drives both the count-ups and the bar heights
function useProgress(duration = 1400) {
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf
    const t0 = performance.now()
    const tick = (t) => {
      const x = Math.min(1, (t - t0) / duration)
      setP(1 - Math.pow(1 - x, 3))
      if (x < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration])
  return p
}

export default function Metrics() {
  const p = useProgress()

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h2 className="text-2xl font-bold text-slate-900">Impact</h2>
      <p className="mt-1 text-sm text-slate-500">What AI Syndicate changes for the support team.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <StatCard
            key={s.label}
            value={`${s.prefix || ''}${Math.round(s.end * p)}${s.suffix}`}
            label={s.label}
            sub={s.sub}
          />
        ))}
      </div>

      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">Before vs after AI Syndicate</h3>
          <div className="flex gap-4">
            {SERIES.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {CHART.map((c) => (
            <div key={c.label}>
              <div className="flex h-44 items-end justify-center gap-1 border-b border-slate-200">
                {SERIES.map((s) => (
                  <div key={s.key} className="flex h-full flex-col items-center justify-end">
                    <span className="mb-1 text-[10px] font-semibold text-slate-600">{c[s.key]}%</span>
                    <div
                      className="w-7 rounded-t transition-opacity hover:opacity-80"
                      style={{ height: `${c[s.key] * 1.5 * p}px`, background: s.color }}
                      title={`${s.name}: ${c[s.key]}%`}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-xs font-medium text-slate-500">{c.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </main>
  )
}
