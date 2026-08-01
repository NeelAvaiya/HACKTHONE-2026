// Call control bar (props-only). Mic and camera are cosmetic: there is no media
// to control, so toggling them only changes the icon and the tile badge.
import { Mic, MicOff, Video, VideoOff, Captions, PanelRightOpen, PhoneOff } from 'lucide-react'

// Off reads as red, the way Meet shows a muted mic or a stopped camera
function ControlButton({ label, active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8ab4f8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#202124] ${
        active ? 'bg-[#3c4043] text-[#e8eaed] hover:bg-[#4a4d51]' : 'bg-[#ea4335] text-white hover:bg-[#d93025]'
      }`}
    >
      {children}
    </button>
  )
}

export default function CallControls({
  micOn,
  cameraOn,
  captionsOn,
  transcriptOpen,
  onToggleMic,
  onToggleCamera,
  onToggleCaptions,
  onToggleTranscript,
  onEnd,
  endLabel,
}) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      <ControlButton label={micOn ? 'Turn off microphone' : 'Turn on microphone'} active={micOn} onClick={onToggleMic}>
        {micOn ? <Mic size={20} /> : <MicOff size={20} />}
      </ControlButton>

      <ControlButton label={cameraOn ? 'Turn off camera' : 'Turn on camera'} active={cameraOn} onClick={onToggleCamera}>
        {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
      </ControlButton>

      <button
        type="button"
        onClick={onToggleCaptions}
        aria-pressed={captionsOn}
        title={captionsOn ? 'Turn off captions' : 'Turn on captions'}
        className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8ab4f8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#202124] ${
          captionsOn ? 'bg-[#8ab4f8] text-[#202124]' : 'bg-[#3c4043] text-[#e8eaed] hover:bg-[#4a4d51]'
        }`}
      >
        <Captions size={20} />
      </button>

      <button
        type="button"
        onClick={onToggleTranscript}
        aria-pressed={transcriptOpen}
        title={transcriptOpen ? 'Hide transcript' : 'Show transcript'}
        // The panel needs the width, so the control only exists where the panel can open
        className={`hidden h-12 w-12 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8ab4f8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#202124] md:flex ${
          transcriptOpen ? 'bg-[#8ab4f8] text-[#202124]' : 'bg-[#3c4043] text-[#e8eaed] hover:bg-[#4a4d51]'
        }`}
      >
        <PanelRightOpen size={20} />
      </button>

      <button
        type="button"
        onClick={onEnd}
        className="ml-1 flex h-12 items-center gap-2 rounded-full bg-[#ea4335] px-5 text-sm font-medium text-white transition-colors hover:bg-[#d93025] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8ab4f8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#202124]"
      >
        <PhoneOff size={19} />
        <span className="hidden sm:inline">{endLabel}</span>
      </button>
    </div>
  )
}
