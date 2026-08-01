// Loads all PDFs from the PDF/ folder into one knowledge-base text block for the system prompt
import fs from 'node:fs/promises'
import path from 'node:path'
// Deep import avoids pdf-parse's debug-mode side effect when imported as ESM
import pdfParse from 'pdf-parse/lib/pdf-parse.js'

export async function loadKnowledge(dir) {
  let files = []
  try {
    files = (await fs.readdir(dir)).filter((f) => f.toLowerCase().endsWith('.pdf'))
  } catch {
    console.warn(`No PDF folder at ${dir} — bot will answer without help docs`)
    return { text: '', count: 0 }
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
  return { text: docs.join('\n\n---\n\n'), count: docs.length }
}
