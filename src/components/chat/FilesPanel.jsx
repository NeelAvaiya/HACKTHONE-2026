// "Files" tab: every attachment in the thread, newest first, searchable
import { useState } from 'react'
import { FileText, FileSpreadsheet, FileArchive, FileVideo, FileAudio, File, Download, Search, CornerUpLeft, Trash2, ImageOff } from 'lucide-react'
import { formatBytes, fileKind, isImage, KIND_STYLE, downloadUrl } from '../../utils/fileMeta.js'
import { formatClock } from '../../utils/formatTime.js'

const ICONS = { pdf: FileText, doc: FileText, sheet: FileSpreadsheet, zip: FileArchive, video: FileVideo, audio: FileAudio, file: File }

// Image preview, falling back to an icon when the stored bytes are gone
function Thumb({ att, kind, Icon }) {
  const [gone, setGone] = useState(false)
  if (isImage(att) && !gone) {
    return (
      <img
        src={att.url}
        alt=""
        loading="lazy"
        onError={() => setGone(true)}
        className="h-11 w-11 shrink-0 rounded-lg object-cover"
      />
    )
  }
  const style = isImage(att) ? 'bg-slate-200 text-slate-500' : KIND_STYLE[kind]
  const Glyph = isImage(att) ? ImageOff : Icon
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${style}`}>
      <Glyph size={20} />
    </span>
  )
}

export default function FilesPanel({ messages, emptyText, deleteLabel, onJump, onDelete }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const files = messages.filter((m) => m.attachment).reverse()
  const shown = q ? files.filter((m) => m.attachment.name.toLowerCase().includes(q)) : files
  const totalSize = files.reduce((sum, m) => sum + (m.attachment.size || 0), 0)

  return (
    <div className="flex-1 overflow-y-auto bg-[#f7f8fa] px-4 py-3">
      {files.length > 0 && (
        <>
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm">
            <Search size={15} className="text-[#54656f]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#8696a0]"
            />
          </div>
          <p className="mb-2 px-1 text-[11px] uppercase tracking-wide text-[#8696a0]">
            {files.length} file{files.length > 1 ? 's' : ''} · {formatBytes(totalSize)}
          </p>
        </>
      )}

      {!files.length && <p className="px-4 py-10 text-center text-sm text-[#8696a0]">{emptyText}</p>}
      {files.length > 0 && !shown.length && (
        <p className="px-4 py-10 text-center text-sm text-[#8696a0]">No files match “{query}”.</p>
      )}

      <ul className="space-y-2">
        {shown.map((m) => {
          const att = m.attachment
          const kind = fileKind(att)
          const Icon = ICONS[kind] || File
          return (
            <li key={m.id} className="flex items-center gap-3 rounded-lg bg-white p-2.5 shadow-sm">
              <Thumb att={att} kind={kind} Icon={Icon} />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[13.5px] font-medium text-[#111b21]">{att.name}</p>
                <p className="text-[11px] text-[#667781]">
                  {formatBytes(att.size)} · {m.from === 'user' ? 'You' : 'AI Syndicate'} · {m.time && formatClock(m.time)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onJump(m.id)}
                aria-label="Show in chat"
                className="shrink-0 rounded-full p-1.5 text-[#54656f] transition-colors hover:bg-black/5"
              >
                <CornerUpLeft size={17} />
              </button>
              <a
                href={downloadUrl(att)}
                download
                aria-label={`Download ${att.name}`}
                className="shrink-0 rounded-full p-1.5 text-[#00a884] transition-colors hover:bg-[#00a884]/10"
              >
                <Download size={17} />
              </a>
              {/* Same rule as the chat: you can only delete what you sent */}
              {m.from === 'user' && (
                <button
                  type="button"
                  onClick={() => onDelete(m.id)}
                  aria-label={`${deleteLabel}: ${att.name}`}
                  title={deleteLabel}
                  className="shrink-0 rounded-full p-1.5 text-red-500 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 size={17} />
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
