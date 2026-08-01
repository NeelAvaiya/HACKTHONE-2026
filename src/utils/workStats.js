// Pure counts over the client's tickets and feature requests.
// Backs both the client's summary tiles and the support tab's header.

const of = (items, kind, status) =>
  (Array.isArray(items) ? items : []).filter((i) => i?.kind === kind && i?.status === status)

export function workStats(items = []) {
  const list = Array.isArray(items) ? items : []
  return {
    openTickets: of(list, 'ticket', 'open').length,
    openFRs: of(list, 'fr', 'open').length,
    doneTickets: of(list, 'ticket', 'done').length,
    doneFRs: of(list, 'fr', 'done').length,
    totalOpen: list.filter((i) => i?.status === 'open').length,
    total: list.length,
  }
}

/**
 * Updates the client's chat has not announced yet.
 *
 * Two kinds count: something support resolved, and something support sent back.
 * A reopen by the CLIENT is excluded — they did it themselves, so telling them
 * about it is noise.
 */
export const undelivered = (items = []) =>
  (Array.isArray(items) ? items : []).filter(
    (i) => !i?.notified && (i?.status === 'done' || (i?.status === 'open' && i?.reopen?.by === 'support'))
  )

/**
 * Identifies one announcement, not one item. An item can be resolved, reopened
 * and resolved again — keying the "already announced" guard on the id alone
 * would silently swallow every update after the first.
 */
export const announcementKey = (item) =>
  `${item?.id}:${item?.status}:${item?.resolvedAt || item?.reopen?.at || ''}`
