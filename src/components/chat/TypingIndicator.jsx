// Three bouncing dots in a white WhatsApp-style incoming bubble
export default function TypingIndicator() {
  return (
    <div className="flex justify-start pl-2">
      <div className="wa-tail-in relative flex items-center gap-1 rounded-lg rounded-tl-none bg-white px-4 py-3 shadow-sm">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8696a0]"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
