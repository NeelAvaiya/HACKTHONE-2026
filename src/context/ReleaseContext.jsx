// Release notes state: loads from MongoDB via the API, polls so a note published on the
// support side reaches an open client chat without a refresh.
import { createContext, useContext, useEffect, useState } from 'react'
import { releases as seedReleases } from '../data/releases.js'

const ReleaseContext = createContext(null)
const POLL_MS = 15000

export function ReleaseProvider({ children }) {
  const [releases, setReleases] = useState(seedReleases)

  useEffect(() => {
    let alive = true
    const load = () =>
      fetch('/api/releases')
        .then((r) => r.json())
        .then((data) => {
          if (alive && Array.isArray(data) && data.length) setReleases(data)
        })
        .catch(() => {})

    load()
    const timer = setInterval(load, POLL_MS)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [])

  /** Publishing = the note goes live and every open chat picks it up on its next poll. */
  async function publish(release) {
    const body = { ...release, notified: false }
    setReleases((prev) => [body, ...prev.filter((r) => r.id !== body.id)])
    await fetch('/api/releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {})
  }

  /** Flipped once the client's chat has actually shown the note, so it arrives once. */
  function markNotified(id) {
    setReleases((prev) => prev.map((r) => (r.id === id ? { ...r, notified: true } : r)))
    fetch(`/api/releases/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notified: true }),
    }).catch(() => {})
  }

  return (
    <ReleaseContext.Provider value={{ releases, publish, markNotified }}>{children}</ReleaseContext.Provider>
  )
}

export function useReleases() {
  return useContext(ReleaseContext)
}
