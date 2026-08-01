// Ticket state: loads from MongoDB via the API (falls back to mock data), persists all changes
import { createContext, useContext, useEffect, useState } from 'react'
import { tickets as seedTickets } from '../data/tickets.js'

const TicketContext = createContext(null)
const SIM_ID = 'SUP-1050'

// Fire-and-forget persistence — a dead backend never breaks the UI
const api = (path, method, body) =>
  fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {})

export function TicketProvider({ children }) {
  const [tickets, setTickets] = useState(seedTickets)

  useEffect(() => {
    fetch('/api/tickets')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) setTickets(data)
      })
      .catch(() => {})
  }, [])

  // Prepend a new ticket (chat-created or simulated) so it shows first in the queue
  function addTicket(ticket) {
    setTickets((prev) => [ticket, ...prev])
    api('/tickets', 'POST', ticket)
  }

  // Demo: a duplicate ticket slides in, then gets flagged as a 94% match 1s later
  function simulateIncoming() {
    if (tickets.some((t) => t.id === SIM_ID)) return
    const target = tickets.find((t) => t.id === 'SUP-1043') || tickets.find((t) => t.id === 'SUP-1031')
    const sim = {
      id: SIM_ID,
      title: 'Salary slip not opening',
      client: 'FinEdge Solutions',
      module: 'Payroll',
      severity: 'P2',
      status: 'Open',
      assignee: 'Unassigned',
      createdBy: 'bot',
      createdAt: new Date().toISOString(),
      similarTo: null,
      matchAssignee: target.assignee,
    }
    setTickets((prev) => [{ ...sim, incoming: true }, ...prev])
    api('/tickets', 'POST', sim)
    setTimeout(() => {
      setTickets((prev) => prev.map((t) => (t.id === SIM_ID ? { ...t, duplicateOf: target.id } : t)))
    }, 1000)
  }

  // Merge: duplicate row collapses into a linked "Merged" state under the original
  function mergeTickets(dupId, intoId) {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === dupId ? { ...t, status: 'Merged', similarTo: intoId, duplicateOf: null } : t
      )
    )
    api(`/tickets/${dupId}`, 'PATCH', { status: 'Merged', similarTo: intoId })
  }

  function keepSeparate(dupId) {
    setTickets((prev) => prev.map((t) => (t.id === dupId ? { ...t, duplicateOf: null } : t)))
  }

  return (
    <TicketContext.Provider value={{ tickets, addTicket, simulateIncoming, mergeTickets, keepSeparate }}>
      {children}
    </TicketContext.Provider>
  )
}

export function useTickets() {
  return useContext(TicketContext)
}
