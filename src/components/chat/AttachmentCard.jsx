// Attachment inside a chat bubble: image preview, or a file row with a download button
import { useState } from 'react'
import { FileText, FileSpreadsheet, FileArchive, FileVideo, FileAudio, File, Download, ImageOff } from 'lucide-react'
import { formatBytes, fileKind, isImage, KIND_STYLE, downloadUrl } from '../../utils/fileMeta.js'

const ICONS = {
  pdf: FileText,
  doc: FileText,
  sheet: FileSpreadsheet,
  zip: FileArchive,
  video: FileVideo,
  audio: FileAudio,
  file: File,
}

export default function AttachmentCard({ attachment }) {
  const kind = fileKind(attachment)
  // The message survives in the DB even if the stored bytes are gone, so say that
  // plainly instead of leaving a broken-image icon in the thread
  const [gone, setGone] = useState(false)

  if (isImage(attachment)) {
    if (gone) {
      return (
        <div className="flex items-center gap-2.5 rounded-lg bg-black/5 p-2.5 text-[#667781]">
          <ImageOff size={18} className="shrink-0" />
          <span className="min-w-0 text-[12px] leading-tight">
            <span className="block truncate font-medium text-[#111b21]">{attachment.name}</span>
            This file is no longer available — please send it again.
          </span>
        </div>
      )
    }
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className="block">
        <img
          src={attachment.url}
          alt={attachment.name}
          onError={() => setGone(true)}
          className="max-h-64 w-full rounded-lg object-cover"
          loading="lazy"
        />
        <span className="mt-1 flex items-center justify-between gap-3 text-[11px] text-[#667781]">
          <span className="truncate">{attachment.name}</span>
          <span className="shrink-0">{formatBytes(attachment.size)}</span>
        </span>
      </a>
    )
  }

  const Icon = ICONS[kind] || File
  return (
    <div className="flex items-center gap-3 rounded-lg bg-black/5 p-2">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${KIND_STYLE[kind]}`}>
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[13px] font-medium text-[#111b21]">{attachment.name}</span>
        <span className="block text-[11px] uppercase text-[#667781]">
          {formatBytes(attachment.size)} · {kind === 'file' ? 'file' : kind}
        </span>
      </span>
      <a
        href={downloadUrl(attachment)}
        download
        aria-label={`Download ${attachment.name}`}
        className="shrink-0 rounded-full p-1.5 text-[#54656f] transition-colors hover:bg-black/10"
      >
        <Download size={18} />
      </a>
    </div>
  )
}
