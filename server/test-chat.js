// Terminal chat client for testing the proxy: npm run chat (server must be running)
import readline from 'node:readline'

const API = 'http://localhost:3001/api/chat'
const history = []

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
let closed = false
rl.on('close', () => {
  closed = true
})

console.log('HelpSense test chat — type a question, or "exit" to quit.\n')

function ask() {
  if (closed) return
  rl.question('You: ', async (message) => {
    if (!message.trim()) return ask()
    if (message.trim().toLowerCase() === 'exit') return rl.close()
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      })
      const data = await r.json()
      const tag =
        data.source === 'db' ? 'answered from MongoDB cache' : data.source === 'gemini' ? `gemini · ${data.model}` : 'fallback'
      if (data.covered === false) {
        console.log(`\nBot (${tag}): [NOT COVERED by help docs → would show "Book an appointment" button]\n`)
      } else {
        console.log(`\nBot (${tag}):\n${data.reply}\n`)
        history.push({ from: 'user', text: message }, { from: 'bot', text: data.reply })
      }
    } catch {
      console.log('\n⚠ Could not reach the server — is `npm run server` running in another terminal?\n')
    }
    ask()
  })
}

ask()
