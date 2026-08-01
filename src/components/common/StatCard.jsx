// Big-number card for metrics — value, label, optional sub-line
import Card from './Card.jsx'

export default function StatCard({ value, label, sub }) {
  return (
    <Card className="p-5">
      <p className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </Card>
  )
}
