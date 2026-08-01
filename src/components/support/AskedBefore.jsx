// Pre-meeting brief bubble: the questions the client put to HelpSense before
// booking. Sits with the Join meeting controls so the expert reads it in the
// two seconds before the call, which is the only moment it is useful.
import { MessageCircleQuestion, AlertCircle } from 'lucide-react'

export default function AskedBefore({ questions = [], copy }) {
  return (
    <div className="flex justify-start">
      <div className="wa-tail-in relative max-w-[85%] rounded-lg rounded-tl-none bg-white px-3 py-2.5 shadow-sm">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#111b21]">
          <MessageCircleQuestion size={15} className="text-[#7c3aed]" />
          {copy.title}
        </p>
        <p className="mt-0.5 text-[11px] text-[#667781]">{copy.subtitle}</p>

        {questions.length ? (
          <ul className="mt-2.5 space-y-2">
            {questions.map((q, i) => (
              <li
                key={`${i}-${q.text}`}
                className={`rounded-md border-l-[3px] px-2.5 py-1.5 ${
                  q.unanswered ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-[#f0f2f5]'
                }`}
              >
                <p className="text-[13px] leading-snug text-[#111b21]">“{q.text}”</p>
                {q.unanswered && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    <AlertCircle size={11} />
                    {copy.unansweredTag}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13px] italic leading-snug text-[#667781]">{copy.empty}</p>
        )}
      </div>
    </div>
  )
}
