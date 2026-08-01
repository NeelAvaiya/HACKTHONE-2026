// "/support/meeting/:id" — Google Meet-style call for one booked appointment.
// Everything is simulated: no camera, no microphone, no permissions. The
// conversation is a script in data/callScript.js played back on a timer.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ShieldCheck, Users } from 'lucide-react'
import { useBookings } from '../context/BookingContext.jsx'
import { useCallScript } from '../hooks/useCallScript.js'
import { scriptFor, callCopy } from '../data/callScript.js'
import { botScripts } from '../data/botScripts.js'
import { personName, personCompany } from '../utils/person.js'
import { formatDuration } from '../utils/callScript.js'
import ParticipantTile from '../components/meeting/ParticipantTile.jsx'
import CallControls from '../components/meeting/CallControls.jsx'

const EXPERT_COLOUR = '#8ab4f8'
const CLIENT_COLOUR = '#fdd663'

const firstName = (name = '') => name.split(' ')[0]

export default function MeetingRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { appointments, complete } = useBookings()

  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [captionsOn, setCaptionsOn] = useState(true)
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const transcriptEndRef = useRef(null)

  const appt = appointments.find((a) => a.id === id)
  const script = useMemo(() => scriptFor(appt?.category), [appt?.category])
  const { elapsed, activeSpeaker, currentLine, spoken } = useCallScript(script)

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [spoken.length, transcriptOpen])

  // Appointments arrive from the API, so an empty list means "still loading",
  // not "not found" — only redirect once there is something to look in.
  if (!appt) {
    return appointments.length ? <Navigate to="/support" replace /> : null
  }

  const expert = appt.person
  const client = personName(appt.client)
  const speakerName = (speaker) => (speaker === 'expert' ? expert : client)
  const say = (text) => text.replaceAll('{client}', firstName(client)).replaceAll('{expert}', firstName(expert))

  function endCall() {
    if (appt.status !== 'done') complete(appt.id)
    navigate('/support', { state: { appointmentId: appt.id } })
  }

  // h-[calc(100vh-3.5rem)] fills the viewport below the app's navbar, as the chat page does
  return (
    <div className="meet-font flex h-[calc(100vh-3.5rem)] flex-col bg-[#202124] text-[#e8eaed]">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {appt.category} review · {appt.id}
          </p>
          <p className="truncate text-xs text-[#9aa0a6]">
            {appt.slot} · {formatDuration(elapsed)}
          </p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-[#3c4043] px-3 py-1.5 text-xs text-[#9aa0a6] sm:flex">
          <Users size={13} /> 2
        </span>
        <span className="hidden items-center gap-1.5 text-xs text-[#9aa0a6] md:flex">
          <ShieldCheck size={13} /> {callCopy.encryption}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-2 sm:px-6">
        <main className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex min-h-0 flex-1 flex-col gap-3 sm:flex-row">
            <ParticipantTile
              name={expert}
              role={`${appt.category} expert`}
              colour={EXPERT_COLOUR}
              speaking={activeSpeaker === 'expert'}
              muted={!micOn}
              self
            />
            <ParticipantTile
              name={client}
              role={personCompany(appt.client) || null}
              colour={CLIENT_COLOUR}
              speaking={activeSpeaker === 'client'}
            />
          </div>

          <div className="flex min-h-[4.5rem] items-end justify-center pb-1">
            {captionsOn && currentLine && (
              <div key={currentLine.text} className="meet-caption max-w-2xl rounded-xl bg-black/70 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#9aa0a6]">
                  {speakerName(currentLine.speaker)}
                </p>
                <p className="mt-0.5 text-base leading-snug text-[#e8eaed]">{say(currentLine.text)}</p>
              </div>
            )}
          </div>
        </main>

        {transcriptOpen && (
          <aside className="hidden w-80 shrink-0 flex-col rounded-2xl bg-[#292a2d] md:flex">
            <p className="border-b border-white/5 px-4 py-3 text-sm font-medium">{callCopy.transcriptTitle}</p>
            {/* Pinned above the transcript: the expert can glance at what the
                client originally asked without leaving the call */}
            {appt.questions?.length > 0 && (
              <div className="border-b border-white/5 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#9aa0a6]">
                  {botScripts.askedBefore.title}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {appt.questions.map((q, i) => (
                    <li
                      key={`${i}-${q.text}`}
                      className={`rounded-md border-l-2 bg-white/5 px-2.5 py-1.5 text-[13px] leading-snug text-[#e8eaed] ${
                        q.unanswered ? 'border-amber-400' : 'border-white/20'
                      }`}
                    >
                      “{q.text}”
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {spoken.length ? (
                spoken.map((line, i) => (
                  <div key={`${i}-${line.text}`}>
                    <p className="text-[11px] font-medium text-[#9aa0a6]">{speakerName(line.speaker)}</p>
                    <p className="text-sm leading-snug text-[#e8eaed]">{say(line.text)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#9aa0a6]">{callCopy.transcriptEmpty}</p>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </aside>
        )}
      </div>

      <footer className="px-4 pb-5 pt-1 sm:px-6">
        <CallControls
          micOn={micOn}
          cameraOn={cameraOn}
          captionsOn={captionsOn}
          transcriptOpen={transcriptOpen}
          onToggleMic={() => setMicOn((v) => !v)}
          onToggleCamera={() => setCameraOn((v) => !v)}
          onToggleCaptions={() => setCaptionsOn((v) => !v)}
          onToggleTranscript={() => setTranscriptOpen((v) => !v)}
          onEnd={endCall}
          endLabel={callCopy.endLabel}
        />
      </footer>
    </div>
  )
}
