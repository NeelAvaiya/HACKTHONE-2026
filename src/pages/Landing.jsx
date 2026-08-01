// "/" — hero + 3 pillar cards + CTA buttons
import { Link } from 'react-router-dom'
import { Clock, CalendarCheck, GitMerge, MessageSquare, LayoutDashboard } from 'lucide-react'
import Card from '../components/common/Card.jsx'

const pillars = [
  {
    icon: Clock,
    title: 'Always On',
    desc: '24/7 AI agent resolves common issues instantly or files a triaged, severity-classified ticket. Critical issues page the on-call engineer.',
  },
  {
    icon: CalendarCheck,
    title: 'Never Waiting',
    desc: 'Skill-matched meeting slots booked by the bot, with a pre-meeting brief so clients never repeat themselves.',
  },
  {
    icon: GitMerge,
    title: 'Never Repeated',
    desc: 'Semantic duplicate detection links similar tickets and merges repeated feature requests into a demand-ranked backlog.',
  },
]

export default function Landing() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-100 via-violet-100 to-blue-50 opacity-60 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 py-20 text-center">
        <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
          Autonomous support agent for Superworks HRMS
        </span>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          AI{' '}
          <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Syndicate</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Ek problem, ek ticket, ek fix — <strong>24/7, zero wait, zero duplicate.</strong>
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/chat"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
          >
            <MessageSquare size={16} />
            Open Client Chat
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
          >
            <LayoutDashboard size={16} />
            Open Support Dashboard
          </Link>
        </div>

        <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
          {pillars.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-6 transition-all hover:-translate-y-1 hover:shadow-md">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                <Icon size={20} />
              </span>
              <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{desc}</p>
            </Card>
          ))}
        </div>

        <p className="mt-14 text-xs text-slate-400">
          Reduces human effort at every step of a ticket's life — from creation to resolution.
        </p>
      </div>
    </main>
  )
}
