// "/support/auto-assign" — support-side preview of automatic reassignment.
// Static data only: this page never reads or writes real appointments.
import { Sparkles } from 'lucide-react'
import { autoAssignDemo, autoAssignCopy } from '../data/autoAssignDemo.js'
import AutoAssignPreview from '../components/booking/AutoAssignPreview.jsx'

export default function AutoAssign() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Sparkles size={18} className="text-slate-400" />
          {autoAssignCopy.title}
        </h2>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
          {autoAssignCopy.previewBadge}
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">{autoAssignCopy.intro}</p>

      <div className="mt-6">
        <AutoAssignPreview demo={autoAssignDemo} copy={autoAssignCopy} />
      </div>
    </main>
  )
}
