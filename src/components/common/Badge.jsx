// Severity/status pill — P1 red, P2 amber, P3 gray; also renders status variants
const styles = {
  P1: 'bg-red-100 text-red-700 ring-red-200',
  P2: 'bg-amber-100 text-amber-700 ring-amber-200',
  P3: 'bg-slate-100 text-slate-600 ring-slate-200',
  Open: 'bg-blue-50 text-blue-700 ring-blue-200',
  'In Progress': 'bg-violet-50 text-violet-700 ring-violet-200',
  Resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Merged: 'bg-slate-100 text-slate-500 ring-slate-200',
}

export default function Badge({ label }) {
  const style = styles[label] || styles.P3
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${style}`}
    >
      {label}
    </span>
  )
}
