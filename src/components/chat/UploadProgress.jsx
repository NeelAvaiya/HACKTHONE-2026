// Ghost bubbles for files still going up — real percentage, straight from the XHR
import { Paperclip } from 'lucide-react'
import { formatBytes } from '../../utils/fileMeta.js'

export default function UploadProgress({ uploads }) {
  if (!uploads.length) return null
  return (
    <>
      {uploads.map((u) => (
        <div key={u.uid} className="flex justify-end pr-2">
          <div className="w-56 rounded-lg bg-[#d9fdd3]/70 px-3 py-2 shadow-sm">
            <p className="flex items-center gap-2 text-[13px] text-[#111b21]">
              <Paperclip size={14} className="shrink-0 text-[#54656f]" />
              <span className="truncate">{u.name}</span>
            </p>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-[#00a884] transition-[width] duration-200"
                style={{ width: `${u.progress}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-[#667781]">
              {u.progress}% · {formatBytes(u.size)}
            </p>
          </div>
        </div>
      ))}
    </>
  )
}
