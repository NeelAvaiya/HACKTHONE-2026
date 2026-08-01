// "/dashboard" — sidebar + 3 tabs (queue / feature requests / meeting brief)
import { useState } from 'react'
import Sidebar from '../components/layout/Sidebar.jsx'
import TicketQueue from '../components/dashboard/TicketQueue.jsx'
import FeatureRequests from '../components/dashboard/FeatureRequests.jsx'
import MeetingBrief from '../components/dashboard/MeetingBrief.jsx'
import ReviewsPanel from '../components/dashboard/ReviewsPanel.jsx'

const titles = {
  queue: 'Ticket Queue',
  features: 'Feature Requests',
  brief: 'Pre-Meeting Brief',
  reviews: 'Meeting Reviews',
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('queue')
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:flex-row">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <section className="min-w-0 flex-1">
        <h2 className="mb-4 text-xl font-bold text-slate-900">{titles[activeTab]}</h2>
        {activeTab === 'queue' && <TicketQueue />}
        {activeTab === 'features' && <FeatureRequests />}
        {activeTab === 'brief' && <MeetingBrief />}
        {activeTab === 'reviews' && <ReviewsPanel />}
      </section>
    </main>
  )
}
