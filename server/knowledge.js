// Loads all PDFs from the PDF/ folder into one knowledge-base text block for the system prompt
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
// Deep import avoids pdf-parse's debug-mode side effect when imported as ESM
import pdfParse from 'pdf-parse/lib/pdf-parse.js'

export async function loadKnowledge(dir) {
  let files = []
  try {
    files = (await fs.readdir(dir)).filter((f) => f.toLowerCase().endsWith('.pdf'))
  } catch {
    console.warn(`No PDF folder at ${dir} — bot will answer without help docs`)
    return { text: '', count: 0, version: 'none' }
  }

  const docs = []
  for (const file of files) {
    try {
      const data = await pdfParse(await fs.readFile(path.join(dir, file)))
      docs.push(`### ${file.replace(/\.pdf$/i, '')}\n${data.text.trim()}`)
      console.log(`📄 Loaded help doc: ${file}`)
    } catch (err) {
      console.warn(`Could not read ${file}: ${err.message}`)
    }
  }
  const text = docs.join('\n\n---\n\n')
  // Fingerprint of the docs as loaded. It goes into the answer-cache key, so
  // dropping a new PDF in — or editing one — retires the answers that were
  // written when the bot knew less. PROMPT_VERSION only covers prompt edits;
  // without this a question refused before a doc arrived, or answered thinly,
  // would keep serving the old reply.
  const version = createHash('sha1').update(text).digest('hex').slice(0, 12)
  return { text, count: docs.length, version }
}
