// Builds the Announcements feed from the work items themselves.
//
// Derived, not stored: an announcement is just a view of an item's current
// state. That keeps the group honest — reopen an item and its "resolved" notice
// disappears, because it is no longer true.
import { KIND_LABEL } from '../data/clientWork.js'

const kindOf = (item) => KIND_LABEL[item?.kind] || 'request'

// "Other" is a catch-all bucket, not a team — saying "the Superworks Other team"
// reads like a bug. Anything unnamed falls back to "support".
const teamOf = (item) => (!item?.module || item.module === 'Other' ? 'support' : item.module)

const fill = (template = '', item = {}) =>
  template
    .replaceAll('{kind}', kindOf(item))
    .replaceAll('{id}', item.id || '')
    .replaceAll('{title}', item.title || '')
    .replaceAll('{module}', teamOf(item))

/**
 * @returns {{key, itemId, type, chip, headline, quote, note, reason, at}[]} newest first
 * type: 'resolved' — support closed it
 *       'reopened' — it went back, with the reason and who sent it
 *
 * `quote` is the item's own wording, shown as the thing being talked about.
 * `headline`/`note` are the message around it, so an entry reads like a
 * notification rather than a row lifted out of a table.
 */
export function buildAnnouncements(items = [], copy = {}) {
  const list = Array.isArray(items) ? items : []
  const a = copy.announce || {}
  const feed = []

  for (const item of list) {
    if (item?.status === 'done') {
      feed.push({
        key: `${item.id}-resolved`,
        itemId: item.id,
        type: 'resolved',
        chip: a.chipResolved || 'Resolved',
        headline: fill(a.resolved?.headline || 'Your {kind} {id} is done', item),
        quote: item.title,
        note: fill(a.resolved?.note || '', item),
        at: item.resolvedAt || null,
      })
    }

    if (item?.reopen?.reason) {
      const byClient = item.reopen.by === 'client'
      const voice = byClient ? a.reopenedByClient : a.reopenedBySupport
      feed.push({
        key: `${item.id}-reopened-${item.reopen.at || ''}`,
        itemId: item.id,
        type: 'reopened',
        chip: a.chipReopened || 'Reopened',
        headline: fill(voice?.headline || 'Your {kind} {id} was reopened', item),
        quote: item.title,
        note: fill(voice?.note || '', item),
        reason: item.reopen.reason,
        at: item.reopen.at || null,
      })
    }
  }

  // Newest first; entries without a timestamp sink to the bottom rather than
  // jumping to the top, which is what an empty string would do in a raw sort
  return feed.sort((a, b) => (b.at || '').localeCompare(a.at || ''))
}

/**
 * How many entries arrived after the group was last opened.
 *
 * Deliberately independent of the item's `notified` flag: that one belongs to
 * the AI chat's delivery, which flips it the moment the message is pushed. If
 * the badge read the same flag it would clear itself before anyone saw it.
 */
export const unreadSince = (feed = [], seenAt = null) =>
  (Array.isArray(feed) ? feed : []).filter((a) => a.at && (!seenAt || a.at > seenAt)).length

/** Timestamp of the newest entry, for stamping "seen" when the group is opened. */
export const latestAt = (feed = []) =>
  (Array.isArray(feed) ? feed : []).reduce((newest, a) => (a.at && a.at > newest ? a.at : newest), '')
