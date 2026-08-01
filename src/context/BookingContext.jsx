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

const nextId = (appointments) => {
  const nums = appointments.map((a) => parseInt((a.id || '').replace(/\D/g, ''), 10) || 0)
  return `APT-${Math.max(1000, ...nums) + 1}`
}

export function BookingProvider({ children }) {
  const [appointments, setAppointments] = useState([])

  // "No sockets" freshness: called on app mount and again whenever the Support tab opens
  function reload() {
    fetch('/api/appointments')
      .then((r) => r.json())
      .then((data) => {
        // merged duplicates stay in the DB for the record but are hidden from the inbox
        if (Array.isArray(data)) setAppointments(data.filter((a) => a.status !== 'merged'))
      })
      .catch(() => {})
  }

  useEffect(reload, [])

  // Books through the server so the slot is re-checked before it is written —
  // returns the created appointment, or { conflict: true, alternatives } if the
  // slot was taken between the offer and this call.
  async function book({ dayIdx = 0, time, person, category }) {
    try {
      const r = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayIdx, time, person, category }),
      })
      const data = await r.json()
      if (r.status === 409) return { conflict: true, alternatives: data.alternatives || [] }
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

  // Demo: another client raises the same question — a duplicate booking slides in,
  // then gets flagged as a match with the original 1s later
  function simulateDuplicate() {
    const target = appointments.find((a) => !a.duplicateOf)
    if (!target || appointments.some((a) => a.duplicateOf)) return
    // Deliberately bypasses /appointments/book: this demo NEEDS the colliding
    // slot that the freshness check exists to prevent.
    const dup = {
      id: nextId(appointments),
      person: target.person,
      slot: target.slot,
      date: target.date,
      time: target.time,
      category: target.category,
      client: 'Meera Iyer (Nexara Tech)',
      status: 'upcoming',
      notified: true,
      createdAt: new Date().toISOString(),
    }
    setAppointments((prev) => [{ ...dup, incoming: true }, ...prev])
    api('/appointments', 'POST', dup)
    setTimeout(() => {
      setAppointments((prev) => prev.map((a) => (a.id === dup.id ? { ...a, duplicateOf: target.id } : a)))
    }, 1000)
  }

  // Merge: duplicate is removed, original becomes one ticket linked to both clients
  function mergeAppointments(dupId, intoId) {
    setAppointments((prev) => {
      const dup = prev.find((a) => a.id === dupId)
      const mergedClients = [prev.find((a) => a.id === intoId)?.client, dup?.client].filter(Boolean)
      api(`/appointments/${intoId}`, 'PATCH', { mergedClients })
      api(`/appointments/${dupId}`, 'PATCH', { status: 'merged', mergedInto: intoId })
      return prev
        .filter((a) => a.id !== dupId)
        .map((a) => (a.id === intoId ? { ...a, mergedClients } : a))
    })
  }

  function keepSeparateAppt(dupId) {
    setAppointments((prev) => prev.map((a) => (a.id === dupId ? { ...a, duplicateOf: null } : a)))
  }

  return (
    <BookingContext.Provider
      value={{ appointments, book, cancel, complete, markNotified, submitReview, simulateDuplicate, mergeAppointments, keepSeparateAppt, reload }}
    >
      {children}
    </BookingContext.Provider>
  )
}

export function useBookings() {
  return useContext(BookingContext)
}
