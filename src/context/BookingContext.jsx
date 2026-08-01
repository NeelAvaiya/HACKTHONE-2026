// Appointment state shared across chat, booking page and the Support tab.
// Loads from MongoDB via the API and persists bookings, status, and reviews.
import { createContext, useContext, useEffect, useState } from 'react'

const BookingContext = createContext(null)

const api = (path, method, body) =>
  fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {})

export function BookingProvider({ children }) {
  const [appointments, setAppointments] = useState([])

  // "No sockets" freshness: called on app mount and again whenever the Support tab opens
  function reload() {
    fetch('/api/appointments')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAppointments(data)
      })
      .catch(() => {})
  }

  useEffect(reload, [])

  // Books through the server so the slot is re-checked before it is written —
  // returns the created appointment, or { conflict: true, alternatives } if the
  // slot was taken between the offer and this call.
  // `questions` is what the client asked HelpSense before booking — it rides
  // along so the expert opens the meeting already knowing the problem.
  async function book({ dayIdx = 0, time, person, category, questions = [] }) {
    try {
      const r = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayIdx, time, person, category, questions }),
      })
      const data = await r.json()
      if (r.status === 409) {
        const { alternatives = [], slots = [], day, date, dayLabel } = data
        return { conflict: true, alternatives, slots, day, date, dayLabel }
      }
      if (!r.ok) return null
      setAppointments((prev) => [data, ...prev])
      return data
    } catch {
      return null
    }
  }

  // Undo: "Change slot" on the confirmation card frees the slot again
  function cancel(id) {
    setAppointments((prev) => prev.filter((a) => a.id !== id))
    api(`/appointments/${id}`, 'DELETE')
  }

  // Support person marks the meeting done → summary becomes visible on both sides
  function complete(id) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'done' } : a)))
    api(`/appointments/${id}`, 'PATCH', { status: 'done' })
  }

  // Chat has shown this appointment's summary to the client
  function markNotified(id) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, notified: true } : a)))
    api(`/appointments/${id}`, 'PATCH', { notified: true })
  }

  // side: 'client' | 'support' — review: { answers: {tone, accuracy, presence}, stars }
  function submitReview(id, side, review) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, reviews: { ...a.reviews, [side]: review } } : a))
    )
    api(`/appointments/${id}`, 'PATCH', { [`reviews.${side}`]: review })
  }

  return (
    <BookingContext.Provider
      value={{ appointments, book, cancel, complete, markNotified, submitReview, reload }}
    >
      {children}
    </BookingContext.Provider>
  )
}

export function useBookings() {
  return useContext(BookingContext)
}
