// Attachment inside a chat bubble: image preview, or a file row with a download button
import { FileText, FileSpreadsheet, FileArchive, FileVideo, FileAudio, File, Download } from 'lucide-react'
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

  if (isImage(attachment)) {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className="block">
        <img
          src={attachment.url}
          alt={attachment.name}
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
