// Single-file upload to /api/upload with real byte-level progress.
// XHR (not fetch) because only XHR reports upload progress events.
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024

// Best-effort cleanup when a message with an attachment is deleted — a failure here
// only leaves an orphaned file on disk, so it never blocks the delete.
export function deleteUpload(attachment) {
  if (!attachment?.id) return
  fetch(`/api/files/${encodeURIComponent(attachment.id)}`, { method: 'DELETE' }).catch(() => {})
}

export function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("couldn't read the file"))
    reader.onload = () => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload')
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        let body = null
        try {
          body = JSON.parse(xhr.responseText)
        } catch {
          /* non-JSON error page — usually an Express 404 */
        }
        if (xhr.status >= 200 && xhr.status < 300 && body?.url) {
          onProgress?.(100)
          resolve(body)
        } else if (xhr.status === 404) {
          // The API server predates this route → it needs a restart
          reject(new Error('Upload route not found — restart the API server (npm run server).'))
        } else {
          reject(new Error(body?.error || `Server said ${xhr.status}.`))
        }
      }
      xhr.onerror = () => reject(new Error('No response from the API server — is it running?'))
      xhr.send(JSON.stringify({ name: file.name, type: file.type, size: file.size, data: reader.result }))
    }
    reader.readAsDataURL(file)
  })
}
