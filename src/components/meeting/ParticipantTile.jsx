// One participant in the call (props-only). Nothing here is real media — the
// tile shows an avatar, and `speaking` drives the halo and the audio meter.
import { MicOff } from 'lucide-react'

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

export default function ParticipantTile({ name, role, colour = '#8ab4f8', speaking, muted, self }) {
  return (
    <div
      className={`relative flex min-h-[13rem] flex-1 items-center justify-center overflow-hidden rounded-2xl bg-[#3c4043] ${
        speaking && !muted ? 'meet-speaking' : ''
      }`}
    >
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-medium text-[#202124] sm:h-28 sm:w-28 sm:text-3xl"
        style={{ background: colour }}
      >
        {initialsOf(name)}
      </div>

      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/45 px-2.5 py-1.5">
        {muted ? (
          <MicOff size={13} className="shrink-0 text-[#ea4335]" />
        ) : (
          <span className="flex h-3.5 items-end gap-[2px]" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`w-[3px] rounded-sm bg-[#34a853] ${speaking ? 'meet-bar h-3.5' : 'h-1'}`}
              />
            ))}
          </span>
        )}
        <span className="text-[13px] font-medium text-[#e8eaed]">
          {name}
          {self ? ' (You)' : ''}
        </span>
      </div>

      {role && (
        <span className="absolute right-3 top-3 rounded-md bg-black/45 px-2 py-1 text-[11px] text-[#9aa0a6]">
          {role}
        </span>
      )}
    </div>
  )
}
