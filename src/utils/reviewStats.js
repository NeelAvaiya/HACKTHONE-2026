// Pure aggregation over appointments for the support Reviews tab.
// Only completed meetings count — an upcoming call has nothing to review yet.

const isDone = (a) => a?.status === 'done'

/** Every star rating submitted for one appointment, both sides pooled. */
const starsOf = (a) => [a.reviews?.client?.stars, a.reviews?.support?.stars].filter((n) => typeof n === 'number')

export const bothReviewed = (a) => Boolean(a?.reviews?.client && a?.reviews?.support)

/**
 * Completed meetings this side still owes a review for. Backs the "My Meetings"
 * nav badge, so a pending review is visible from anywhere instead of depending
 * on a chat message that may be long gone.
 */
export function pendingReviews(appointments = [], side = 'client') {
  return (Array.isArray(appointments) ? appointments : []).filter((a) => isDone(a) && !a?.reviews?.[side])
}

/**
 * @returns {{reviewed: number, awaiting: number, average: number, total: number}}
 * reviewed = completed meetings with BOTH reviews in
 * awaiting = completed meetings missing at least one
 * average  = mean of every submitted rating, both sides pooled, to 1 decimal
 */
export function reviewStats(appointments = []) {
  const done = (Array.isArray(appointments) ? appointments : []).filter(isDone)
  const stars = done.flatMap(starsOf)
  const reviewed = done.filter(bothReviewed).length

  return {
    total: done.length,
    reviewed,
    awaiting: done.length - reviewed,
    // Guarded: an empty list must give 0, not NaN
    average: stars.length ? Math.round((stars.reduce((sum, n) => sum + n, 0) / stars.length) * 10) / 10 : 0,
  }
}
