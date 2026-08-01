// Bottom-right toast notification — visible only when `message` is set
export default function Toast({ message }) {
  if (!message) return null
  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
      {message}
    </div>
  )
}
