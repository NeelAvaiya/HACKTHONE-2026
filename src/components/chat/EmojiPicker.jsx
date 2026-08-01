// Emoji panel above the chat input — click an emoji to insert it (props-only)
const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '🥰', '😘',
  '😎', '🤔', '🙄', '😅', '😭', '😢', '😡', '🥳',
  '👍', '👎', '🙏', '👏', '🤝', '💪', '🙌', '🫡',
  '🎉', '✨', '🔥', '💯', '❤️', '💙', '💚', '🤗',
  '😴', '🤯', '😱', '😇', '😉', '🤩', '😌', '🥺',
  '✅', '❌', '📎', '📅', '📞', '💼', '📋', '⭐',
]

export default function EmojiPicker({ onPick }) {
  return (
    <div className="emoji-pop absolute bottom-full left-2 z-20 mb-2 w-72 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/10">
      <div className="grid max-h-44 grid-cols-8 gap-0.5 overflow-y-auto">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onPick(e)}
            className="rounded-lg p-1 text-xl transition-colors hover:bg-slate-100"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}
