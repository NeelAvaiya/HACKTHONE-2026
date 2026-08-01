// Release note delivered inside the chat: what shipped, what it affects, which of the
// client's own tickets it closes.
import { Rocket, Sparkles, Wrench, TrendingUp, Ticket } from 'lucide-react'

const TYPE_STYLE = {
  feature: { icon: Sparkles, chip: 'bg-violet-100 text-violet-700' },
  enhancement: { icon: TrendingUp, chip: 'bg-blue-100 text-blue-700' },
  fix: { icon: Wrench, chip: 'bg-amber-100 text-amber-700' },
}

const releaseDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function ReleaseCard({ release, copy }) {
  const style = TYPE_STYLE[release.type] || TYPE_STYLE.enhancement
  const TypeIcon = style.icon

  return (
    <div className="max-w-md rounded-lg bg-white p-3.5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00a884]/10 text-[#00a884]">
          <Rocket size={17} />
        </span>
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-[#8696a0]">
          {release.version} · {releaseDate(release.releasedAt)}
        </span>
        <span className="rounded-full bg-[#00a884] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {copy.liveLabel}
        </span>
      </div>

      <p className="mt-2 text-[15px] font-semibold leading-snug text-[#111b21]">{release.title}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.chip}`}>
          <TypeIcon size={12} />
          {copy.typeLabels[release.type] || release.type}
        </span>
        {release.modules.map((m) => (
          <span key={m} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {m}
          </span>
        ))}
      </div>

      {release.highlights?.length > 0 && (
        <>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-[#8696a0]">
            {copy.whatsNewLabel}
          </p>
          <ul className="mt-1 space-y-1">
            {release.highlights.map((h) => (
              <li key={h} className="flex gap-1.5 text-[13px] leading-snug text-[#3b4a54]">
                <span className="text-[#00a884]">•</span>
                {h}
              </li>
            ))}
          </ul>
        </>
      )}

      {release.affected && (
        <div className="mt-3 rounded-lg bg-[#fff8e6] px-2.5 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
            {copy.affectedLabel}
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-[#3b4a54]">{release.affected}</p>
        </div>
      )}

      {release.fixesTickets?.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px] text-[#3b4a54]">
          <Ticket size={13} className="text-[#00a884]" />
          <span className="font-medium">{copy.fixesLabel}:</span>
          {release.fixesTickets.map((t) => (
            <span key={t} className="rounded bg-[#00a884]/10 px-1.5 py-0.5 font-mono text-[11px] text-[#00a884]">
              {t}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
