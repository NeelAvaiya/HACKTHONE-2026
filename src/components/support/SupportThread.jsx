// WhatsApp-style conversation for one appointment on the support side (props-only)
import { CheckCircle2, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import MessageBubble from '../chat/MessageBubble.jsx'
import { meetingSummary } from '../../utils/meetingSummary.js'

export default function SupportThread({ appt, copy, onDone }) {
  const { expert: first, discussed, nextSteps } = meetingSummary(appt, copy)
  const bookingText = `🔔 **New booking · ${appt.id}**\n${first}, this slot has been booked for you!\n\n🗓 ${appt.slot} · ${appt.category} query\n🎥 ${copy.meetLink} · with ${appt.client}`
  const bullets = (lines) => lines.map((l) => `• ${l}`).join('\n')
  // Support sees the same summary as the client, minus the "your call" framing
  const summaryText = `📋 **Meeting Summary**\n\n**Discussed:**\n${bullets(discussed)}\n\n**Next steps:**\n${bullets(nextSteps)}`

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

        {appt.status === 'upcoming' && (
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
            <MessageBubble from="bot" text={copy.reviewIntro} />
            {/* Reviewing happens on the shared /review page, same as the client side */}
            <div className="pl-2">
              <Link
                to={`/review/${appt.id}/support`}
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#00a884] shadow-sm ring-1 ring-black/5 transition-colors hover:bg-[#f0f2f5]"
              >
                {appt.reviews?.support ? copy.reviewViewLabel : copy.reviewCtaLabel}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
