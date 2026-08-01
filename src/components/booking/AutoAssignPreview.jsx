// Animated preview of automatic reassignment (props-only, static data).
// The step index drives every visual state, so the grid, the narration and the
// result card can never disagree about where the scenario is.
import { useEffect, useRef, useState } from 'react'
import { Play, RotateCcw, Check, X, Search } from 'lucide-react'
import Card from '../common/Card.jsx'

const STEP_MS = 1600

const STATUS_ICON = { conflict: X, scanning: Search, assigned: Check }

export default function AutoAssignPreview({ demo, copy }) {
  const { request, times, experts, steps, result } = demo
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef(null)

  // Someone who prefers reduced motion gets the outcome, not the animation
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => () => clearTimeout(timerRef.current), [])

  useEffect(() => {
    if (!playing) return
    if (step >= steps.length - 1) {
      setPlaying(false)
      return
    }
    timerRef.current = setTimeout(() => setStep((s) => s + 1), STEP_MS)
    return () => clearTimeout(timerRef.current)
  }, [playing, step, steps.length])

  function run() {
    clearTimeout(timerRef.current)
    if (reduceMotion) return setStep(steps.length - 1)
    setStep(0)
    setPlaying(true)
  }

  const current = steps[step]
  const done = step === steps.length - 1
  const StatusIcon = STATUS_ICON[current.status]

  // A cell only reveals the conflict or the booking once its step is reached
  function cellState(expert, slotState, time) {
    const isRequested = time === request.time
    if (!isRequested) return slotState === 'busy' ? 'busy' : 'free'
    if (slotState === 'taken') return step >= 1 ? 'taken' : 'busy'
    if (expert.name === result.expert) return done ? 'booked' : 'free'
    return slotState
  }

  const CELL = {
    free: 'border-dashed border-emerald-200 bg-emerald-50/50 text-emerald-700',
    busy: 'border-slate-200 bg-slate-100 text-slate-300',
    taken: 'border-red-300 bg-red-50 text-red-600',
    booked: 'border-emerald-500 bg-emerald-500 text-white',
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {request.client} · {request.category} call
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Asked for {request.day}, {request.time}
          </p>
        </div>
        <button
          onClick={run}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          {step === 0 && !playing ? <Play size={14} /> : <RotateCcw size={14} />}
          {step === 0 && !playing ? copy.run : copy.replay}
        </button>
      </div>

      <div className="overflow-x-auto p-4">
        <table className="w-full min-w-[34rem] border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-44" />
              {times.map((t) => (
                <th
                  key={t}
                  className={`text-[11px] font-semibold ${t === request.time ? 'text-slate-900' : 'text-slate-400'}`}
                >
                  {t.replace(':00', '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {experts.map((expert) => {
              const skipped = step >= 2 && !expert.eligible
              const lit = current.highlight === expert.name
              return (
                <tr key={expert.name} className={skipped ? 'opacity-35' : ''}>
                  <td className="w-44 pr-2">
                    <p className={`truncate text-xs font-bold ${lit ? 'text-slate-900' : 'text-slate-600'}`}>
                      {expert.name}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">
                      {skipped ? copy.skipped : expert.role}
                    </p>
                  </td>
                  {expert.slots.map((slotState, i) => {
                    const state = cellState(expert, slotState, times[i])
                    return (
                      <td key={times[i]}>
                        <div
                          className={`flex h-10 items-center justify-center rounded-lg border text-[10px] font-bold transition-all duration-500 ${CELL[state]} ${
                            lit && times[i] === request.time ? 'scale-105 shadow-md' : ''
                          }`}
                        >
                          {state === 'taken' ? 'TAKEN' : state === 'booked' ? 'BOOKED' : ''}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              current.status === 'conflict'
                ? 'bg-red-100 text-red-600'
                : current.status === 'assigned'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200 text-slate-500'
            }`}
          >
            {StatusIcon ? <StatusIcon size={14} /> : <span className="text-xs font-bold">{step + 1}</span>}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">{current.title}</p>
            <p className="mt-0.5 text-xs text-slate-600">{current.detail}</p>
          </div>
          <span className="shrink-0 text-[11px] font-medium text-slate-400">
            {step + 1} / {steps.length}
          </span>
        </div>

        <div className="mt-3 flex gap-1">
          {steps.map((s, i) => (
            <span
              key={s.title}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-slate-900' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        {done && (
          <div className="meet-caption mt-4 rounded-lg border border-emerald-200 bg-white p-3">
            <p className="text-sm font-bold text-emerald-700">
              ✅ Booked — {result.day}, {result.time} with {result.expert}
            </p>
            <p className="mt-1 text-xs text-slate-500">{result.note}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 border-t border-slate-100 px-4 py-3 text-[11px] text-slate-400">
        {Object.entries(copy.legend).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm border ${CELL[key]}`} /> {label}
          </span>
        ))}
      </div>
    </Card>
  )
}
