// One chat bubble, WhatsApp Web style — outgoing green (right, tail, ✓✓) / incoming white (left, tail)
import { CheckCheck } from 'lucide-react'
import { formatClock } from '../../utils/formatTime.js'

// Renders **bold** spans from bot/Gemini markdown-ish text
function renderText(text) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))
}

export default function MessageBubble({ from, text, time, screenshot, variant, highlight }) {
  const isUser = from === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end pr-2' : 'justify-start pl-2'}`}>
      <div
        className={`relative max-w-[70%] rounded-lg px-2.5 py-1.5 text-sm text-[#111b21] shadow-sm transition-shadow ${
          isUser ? 'wa-tail-out rounded-tr-none bg-[#d9fdd3]' : 'wa-tail-in rounded-tl-none bg-white'
        } ${highlight ? 'ring-2 ring-amber-400' : ''}`}
      >
        <span className="whitespace-pre-line">
          {variant === 'success' && <span className="success-pop mr-1.5">✅</span>}
          {renderText(text)}
        </span>
        {screenshot && (
          <div className="mt-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">
            🖼 {screenshot}
          </div>
        )}
        <span className="float-right ml-2 mt-1.5 flex translate-y-1 items-center gap-1 text-[10px] leading-none text-[#667781]">
          {time && formatClock(time)}
          {isUser && <CheckCheck size={14} className="text-[#53bdeb]" />}
        </span>
      </div>
    </div>
  )
}
