// Pure aggregation over appointments for the support Dashboard.
// Only completed meetings count — an upcoming call has nothing to review yet.
//
// Reviews go ONE way: the client rates the support expert. Support does not
// rate the client back, so there is one review per meeting and no "are both
// sides in?" state to track.

const isDone = (a) => a?.status === 'done'

/** The client's star rating for one appointment, if they left one. */
const starsOf = (a) => (typeof a?.reviews?.client?.stars === 'number' ? [a.reviews.client.stars] : [])

export const isReviewed = (a) => Boolean(a?.reviews?.client)

/**
 * Completed meetings the client still owes a review for. Backs the "My Meetings"
 * nav badge, so a pending review is visible from anywhere instead of depending
 * on a chat message that may be long gone.
 */
export function pendingReviews(appointments = []) {
  return (Array.isArray(appointments) ? appointments : []).filter((a) => isDone(a) && !isReviewed(a))
}

/**
 * @returns {{reviewed: number, awaiting: number, average: number, total: number}}
 * reviewed = completed meetings the client has rated
 * awaiting = completed meetings with no rating yet
 * average  = mean of every client rating, to 1 decimal
 */
export function reviewStats(appointments = []) {
  const done = (Array.isArray(appointments) ? appointments : []).filter(isDone)
  const stars = done.flatMap(starsOf)
  const reviewed = done.filter(isReviewed).length

  return {
    total: done.length,
    reviewed,
    awaiting: done.length - reviewed,
    // Guarded: an empty list must give 0, not NaN
    average: stars.length ? Math.round((stars.reduce((sum, n) => sum + n, 0) / stars.length) * 10) / 10 : 0,
  }
}
