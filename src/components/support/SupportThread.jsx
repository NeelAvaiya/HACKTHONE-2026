// WhatsApp-style conversation for one appointment on the support side (props-only)
import { CheckCircle2, Link2, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import MessageBubble from '../chat/MessageBubble.jsx'
import ReviewForm from '../booking/ReviewForm.jsx'
import ReviewBlock from '../booking/ReviewBlock.jsx'

export default function SupportThread({ appt, copy, onDone, onMerge, onKeepSeparate, onReview }) {
  const first = appt.person.split(' ')[0]
  const bookingText = `🔔 **New booking · ${appt.id}**\n${first}, this slot has been booked for you!\n\n🗓 ${appt.slot} · ${appt.category} query\n🎥 ${copy.meetLink} · with ${appt.client}`
  const summaryText = `📋 **Meeting Summary**\n\n**Discussed:**\n${copy.meetingSummary.discussed
    .map((d) => `• ${d}`)
    .join('\n')}\n\n**Next steps:**\n${copy.meetingSummary.nextSteps
    .map((s) => `• ${s.replace('{expert}', first)}`)
    .join('\n')}`

  return (
    <div className="wa-font flex h-full flex-col">
      <div className="flex items-center gap-3 border-l border-black/5 bg-[#f0f2f5] px-4 py-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7c3aed] text-sm font-bold text-white">
          {appt.client.split(' ').map((w) => w[0]).join('').slice(0, 2)}
        </span>
        <div className="flex-1 leading-tight">
          <p className="text-[15px] font-semibold text-[#111b21]">{appt.client}</p>
          <p className="text-xs text-[#667781]">
            {appt.status === 'done' ? 'meeting completed ✓' : `upcoming · ${appt.slot}`}
          </p>
        </div>
      </div>

      <div className="wa-doodle flex-1 space-y-2 overflow-y-auto px-6 py-4 sm:px-10">
        <div className="flex justify-center pb-2">
          <span className="rounded-lg bg-white/95 px-3 py-1 text-[11px] font-medium uppercase text-[#54656f] shadow-sm">
            Today
          </span>
        </div>

        <MessageBubble from="bot" text={bookingText} time={appt.createdAt} />

        {appt.mergedClients && (
          <div className="flex justify-center py-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700 shadow-sm ring-1 ring-violet-200">
              <Link2 size={11} /> {appt.mergedClients.length} clients merged into one ticket:{' '}
              {appt.mergedClients.map((c) => c.split(' ')[0]).join(' + ')}
            </span>
          </div>
        )}

        {appt.duplicateOf && (
          <div className="ticket-slide-in ml-2 max-w-sm rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 shadow-sm">
            <p className="text-xs font-semibold text-amber-800">
              {copy.apptDuplicateBanner.replace('{id}', appt.duplicateOf).replace('{client}', appt.client.split(' ')[0])}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => onMerge(appt)}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
              >
                Merge into one ticket
              </button>
              <button
                onClick={() => onKeepSeparate(appt)}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
              >
                Keep separate
              </button>
            </div>
          </div>
        )}

        {appt.status === 'upcoming' && !appt.duplicateOf && (
          <div className="flex flex-wrap gap-2 pl-2">
            <Link
              to={`/support/meeting/${appt.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#00a884] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#008f6f]"
            >
              <Video size={15} /> {copy.joinLabel}
            </Link>
            <button
              onClick={() => onDone(appt)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#00a884] shadow-sm ring-1 ring-black/5 transition-colors hover:bg-[#f0f2f5]"
            >
              <CheckCircle2 size={15} /> Meeting done
            </button>
          </div>
        )}

        {appt.status === 'done' && (
          <>
            <MessageBubble from="bot" text={summaryText} />
            {!appt.reviews?.support ? (
              <>
                <MessageBubble from="bot" text={copy.reviewIntro} />
                <div className="pl-2">
                  <ReviewForm
                    questions={copy.reviewQuestions}
                    options={copy.reviewOptions}
                    starsLabel={copy.reviewStarsLabel}
                    submitLabel={copy.reviewSubmitLabel}
                    onSubmit={(review) => onReview(appt, review)}
                  />
                </div>
              </>
            ) : (
              <div className="ml-2 grid max-w-lg gap-3 rounded-lg bg-white p-3 shadow-sm sm:grid-cols-2">
                <ReviewBlock title={`Support review (${first})`} review={appt.reviews.support} />
                <ReviewBlock
                  title="Client review"
                  review={appt.reviews?.client}
                  waitingText="Waiting for client's review from chat…"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
