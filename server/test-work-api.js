// End-to-end checks for the work API: npm run test:workapi
// (start `npm run server` in another terminal first)
const API = process.env.API || 'http://localhost:3001/api'

let failed = 0
const check = (label, ok, detail) => {
  if (ok) return console.log(`✓ ${label}`)
  failed++
  console.log(`✗ ${label}${detail ? `\n    ${detail}` : ''}`)
}

const get = (path) => fetch(`${API}${path}`).then((r) => r.json())
const send = (path, method, body) =>
  fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => ({ status: r.status, data: await r.json().catch(() => null) }))

try {
  await fetch(`${API}/work`)
} catch {
  console.log('⚠ Could not reach the server — is `npm run server` running?')
  process.exit(1)
}

const items = await get('/work')
check('GET /work returns the client work list', Array.isArray(items) && items.length > 0)
check('items carry a kind and a status', items.every((i) => i.kind && i.status))

const target = items[0]

// Resolve
const resolved = await send(`/work/${target.id}/resolve`, 'POST')
check('resolve succeeds', resolved.status === 200 && resolved.data?.status === 'done', JSON.stringify(resolved.data))
check('resolve stamps resolvedAt', Boolean(resolved.data?.resolvedAt))
check('resolve leaves notified false so the chat announces it', resolved.data?.notified === false)

// Resolving twice must not thrash the row
const again = await send(`/work/${target.id}/resolve`, 'POST')
check('resolving an already-resolved item is a no-op', again.status === 200 && again.data?.status === 'done')

// Reopen needs a reason
const noReason = await send(`/work/${target.id}/reopen`, 'POST', { by: 'client' })
check('reopen without a reason is rejected', noReason.status === 400, `got ${noReason.status}`)
const blank = await send(`/work/${target.id}/reopen`, 'POST', { by: 'client', reason: '   ' })
check('a whitespace-only reason is rejected', blank.status === 400, `got ${blank.status}`)
const badSide = await send(`/work/${target.id}/reopen`, 'POST', { by: 'nobody', reason: 'x' })
check('reopen from an unknown side is rejected', badSide.status === 400, `got ${badSide.status}`)

// Reopen from the client
const clientReopen = await send(`/work/${target.id}/reopen`, 'POST', {
  by: 'client',
  reason: 'Still blank on my side',
})
check('client can reopen', clientReopen.status === 200 && clientReopen.data?.status === 'open')
check('the reason is stored', clientReopen.data?.reopen?.reason === 'Still blank on my side')
check('the side is stored', clientReopen.data?.reopen?.by === 'client')
check('reopening clears resolvedAt', !clientReopen.data?.resolvedAt)

// Both sides read the same row
const after = await get('/work')
const fresh = after.find((i) => i.id === target.id)
check('the change is visible to the other side', fresh?.status === 'open' && fresh?.reopen?.by === 'client')

// Reopen from support
await send(`/work/${target.id}/resolve`, 'POST')
const supportReopen = await send(`/work/${target.id}/reopen`, 'POST', {
  by: 'support',
  reason: 'Reproduced again on staging',
})
check('support can reopen', supportReopen.status === 200 && supportReopen.data?.reopen?.by === 'support')

// Unknown ids
const missing = await send('/work/NOPE-1/resolve', 'POST')
check('resolving an unknown id is a 404', missing.status === 404, `got ${missing.status}`)

// Put the row back so re-running the suite starts clean
await send(`/work/${target.id}/reopen`, 'POST', { by: 'client', reason: 'test cleanup' })
await send(`/work/${target.id}`, 'PATCH', { notified: false, reopen: null })

console.log(failed ? `\n${failed} check(s) failed` : '\n✓ all work API checks passed')
process.exitCode = failed ? 1 : 0
