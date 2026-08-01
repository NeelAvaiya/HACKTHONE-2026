// One chat bubble, WhatsApp Web style — outgoing green (right, tail, ✓✓) / incoming white (left, tail)
import { CheckCheck, Star, MoreVertical, Pencil, Trash2, Copy } from 'lucide-react'
import { formatClock } from '../../utils/formatTime.js'
import AttachmentCard from './AttachmentCard.jsx'
import DropdownMenu from './DropdownMenu.jsx'

// Renders **bold** spans from bot/Gemini markdown-ish text
function renderText(text) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))
}

export default function MessageBubble({
  id,
  from,
  text,
  time,
  screenshot,
  attachment,
  variant,
  highlight,
  starred,
  edited,
  onToggleStar,
  onEdit,
  onDelete,
  menuLabels,
}) {
  const isUser = from === 'user'
  const actions = (onToggleStar || onDelete) && (
    <span className="flex shrink-0 items-center">
      <StarButton id={id} starred={starred} onToggleStar={onToggleStar} />
      <MessageMenu
        id={id}
        text={text}
        // You only edit and delete your own messages — the bot's stay as sent
        canEdit={Boolean(isUser && text && onEdit)}
        canDelete={Boolean(isUser && onDelete)}
        onEdit={onEdit}
        onDelete={onDelete}
        labels={menuLabels}
      />
    </span>
  )

  return (
    <div className={`group flex items-center gap-1.5 ${isUser ? 'justify-end pr-2' : 'justify-start pl-2'}`}>
      {isUser && actions}
      <div
        className={`relative max-w-[70%] rounded-lg px-2.5 py-1.5 text-sm text-[#111b21] shadow-sm transition-shadow ${
          isUser ? 'wa-tail-out rounded-tr-none bg-[#d9fdd3]' : 'wa-tail-in rounded-tl-none bg-white'
        } ${highlight ? 'ring-2 ring-amber-400' : ''}`}
      >
        {attachment && (
          <div className={text ? 'mb-1.5' : ''}>
            <AttachmentCard attachment={attachment} />
          </div>
        )}
        {text && (
          <span className="whitespace-pre-line">
            {variant === 'success' && <span className="success-pop mr-1.5">✅</span>}
            {renderText(text)}
          </span>
        )}
        {screenshot && (
          <div className="mt-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">
            🖼 {screenshot}
          </div>
        )}
        <span className="float-right ml-2 mt-1.5 flex translate-y-1 items-center gap-1 text-[10px] leading-none text-[#667781]">
          {starred && <Star size={11} className="fill-[#667781]" />}
          {edited && <span className="italic">{menuLabels?.editedTag || 'edited'}</span>}
          {time && formatClock(time)}
          {isUser && <CheckCheck size={14} className="text-[#53bdeb]" />}
        </span>
      </div>
      {!isUser && actions}
    </div>
  )
}

// Hidden until the row is hovered, unless the message is already starred
function StarButton({ id, starred, onToggleStar }) {
  if (!onToggleStar) return null
  return (
    <button
      type="button"
      onClick={() => onToggleStar(id)}
      aria-label={starred ? 'Remove star' : 'Star message'}
      aria-pressed={starred}
      className={`shrink-0 rounded-full p-1 transition-opacity focus:opacity-100 group-hover:opacity-100 ${
        starred ? 'text-amber-500 opacity-100' : 'text-[#54656f] opacity-0 focus:opacity-100'
      }`}
    >
      <Star size={15} className={starred ? 'fill-amber-400' : ''} />
    </button>
  )
}

// Edit / copy / delete for a single message. The bot's messages only ever offer copy.
function MessageMenu({ id, text, canEdit, canDelete, onEdit, onDelete, labels = {} }) {
  const items = [
    canEdit && {
      label: labels.edit || 'Edit message',
      icon: <Pencil size={15} />,
      onSelect: () => onEdit(id, text),
    },
    text && {
      label: labels.copy || 'Copy text',
      icon: <Copy size={15} />,
      onSelect: () => navigator.clipboard?.writeText(text),
    },
    canDelete && {
      label: labels.delete || 'Delete message',
      icon: <Trash2 size={15} />,
      danger: true,
      onSelect: () => onDelete(id),
    },
  ].filter(Boolean)

  if (!items.length) return null
  return (
    <DropdownMenu
      className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
      trigger={<MoreVertical size={15} />}
      items={items}
    />
  )
}
