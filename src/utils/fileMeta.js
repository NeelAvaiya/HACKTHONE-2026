// Display helpers for attachments: human size, kind (drives icon + colour), image test
export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const isImage = (att) => Boolean(att?.type?.startsWith('image/')) && !att.type.includes('svg')

const BY_EXT = {
  pdf: 'pdf',
  doc: 'doc', docx: 'doc', txt: 'doc', rtf: 'doc',
  xls: 'sheet', xlsx: 'sheet', csv: 'sheet',
  zip: 'zip', rar: 'zip', '7z': 'zip',
  mp4: 'video', mov: 'video', webm: 'video',
  mp3: 'audio', wav: 'audio', m4a: 'audio',
}

export function fileKind(att) {
  if (isImage(att)) return 'image'
  const ext = (att?.name || '').split('.').pop()?.toLowerCase()
  return BY_EXT[ext] || 'file'
}

// Tailwind classes per kind, so the Files tab and the bubbles stay in sync
export const KIND_STYLE = {
  image: 'bg-emerald-100 text-emerald-700',
  pdf: 'bg-red-100 text-red-600',
  doc: 'bg-blue-100 text-blue-600',
  sheet: 'bg-green-100 text-green-700',
  zip: 'bg-amber-100 text-amber-700',
  video: 'bg-purple-100 text-purple-600',
  audio: 'bg-pink-100 text-pink-600',
  file: 'bg-slate-200 text-slate-600',
}

export const downloadUrl = (att) => `${att.url}${att.url.includes('?') ? '&' : '?'}dl=1`
