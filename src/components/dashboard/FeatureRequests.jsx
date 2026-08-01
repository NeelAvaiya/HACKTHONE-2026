// Tab 2: feature requests — impact stat cards + demand-sorted list with meters
import { featureRequests } from '../../data/featureRequests.js'
import Card from '../common/Card.jsx'
import StatCard from '../common/StatCard.jsx'
import FRRow from './FRRow.jsx'

export default function FeatureRequests() {
  const sorted = [...featureRequests].sort((a, b) => b.demandCount - a.demandCount)
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard value="142" label="Duplicates merged this quarter" sub="auto-detected by AI Syndicate" />
        <StatCard value="~60%" label="Product-team capacity saved" sub="no manual triage of repeat requests" />
      </div>
      <Card className="divide-y divide-slate-100">
        {sorted.map((fr) => (
          <FRRow key={fr.id} fr={fr} />
        ))}
      </Card>
    </div>
  )
}
