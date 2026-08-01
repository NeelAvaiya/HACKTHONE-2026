// Reopen a ticket or feature request with a reason (props-only).
// The reason is required: reopening without saying why leaves the other side
// guessing, which is exactly what this is meant to prevent.
import { useState } from 'react'
import { X } from 'lucide-react'

export default function ReopenForm({ copy, onSubmit, onCancel }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const ready = reason.trim().length > 0

  async function submit(e) {
    e.preventDefault()
    if (!ready || busy) return
    setBusy(true)
    setFailed((await onSubmit(reason.trim())) === false)
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <label htmlFor="reopen-reason" className="text-xs font-semibold text-slate-700">
          {copy.reopenPrompt}
        </label>
        <button
          type="button"
          onClick={onCancel}
          aria-label={copy.reopenCancel}
          className="shrink-0 text-slate-400 transition-colors hover:text-slate-600"
        >
          <X size={14} />
        </button>
      </div>

      <textarea
        id="reopen-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        autoFocus
        placeholder={copy.reopenPlaceholder}
        className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-400"
      />

      {failed && <p className="mt-1.5 text-xs font-medium text-red-600">{copy.reopenFailed}</p>}

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-white"
        >
          {copy.reopenCancel}
        </button>
        <button
          type="submit"
          disabled={!ready || busy}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? copy.reopenSubmitting : copy.reopenSubmit}
        </button>
      </div>
    </form>
  )
}
