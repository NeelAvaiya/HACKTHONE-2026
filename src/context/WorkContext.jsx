// The client's tickets and feature requests, shared between the client's
// "My Requests" tab, the support "Client Work" tab, and the chat that announces
// updates. Backed by /api/work so both sides see the same rows after a refresh.
import { createContext, useContext, useEffect, useState } from 'react'
import { clientWorkSeed } from '../data/clientWork.js'

const WorkContext = createContext(null)

export function WorkProvider({ children }) {
  // Seeded locally so the pages render immediately; replaced by the API response
  const [items, setItems] = useState(clientWorkSeed)

  function reload() {
    return fetch('/api/work')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) setItems(data)
      })
      .catch(() => {})
  }

  useEffect(() => {
    reload()
  }, [])

  // The server is the source of truth: it returns the updated row, and that is
  // what lands in state. Avoids the two sides drifting apart on a failed write.
  async function post(path, body) {
    try {
      const r = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      })
      if (!r.ok) return null
      const updated = await r.json()
      if (updated?.id) setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      return updated
    } catch {
      return null
    }
  }

  /** Support marks it resolved; the client's chat announces it. */
  const resolve = (id) => post(`/api/work/${id}/resolve`)

  /** Either side reopens, with a reason. `by` is 'client' | 'support'. */
  const reopen = (id, reason, by) => post(`/api/work/${id}/reopen`, { reason, by })

  // The chat has announced this one — stops it being announced again
  function markNotified(id) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notified: true } : i)))
    fetch(`/api/work/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notified: true }),
    }).catch(() => {})
  }

  return (
    <WorkContext.Provider value={{ items, resolve, reopen, markNotified, reload }}>
      {children}
    </WorkContext.Provider>
  )
}

export function useWork() {
  return useContext(WorkContext)
}
