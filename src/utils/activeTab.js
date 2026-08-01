// Which sub-tab is "current" for a given path.
//
// Both shells used to answer this their own way — the client matched by prefix
// with a hardcoded '/' fallback, support relied on NavLink's `end` flag. Two
// rules for two identical-looking rows is how you end up on a page whose tab
// isn't lit, or with the wrong one lit after switching sides.
//
// One rule now: the tab whose path is the longest prefix of the current one.

/**
 * @param tabs      [{to}] in any order
 * @param pathname  the current location
 * @returns the winning tab's `to`, or null when no tab owns this path
 */
export function activeTabPath(tabs = [], pathname = '/') {
  let best = null
  for (const { to } of tabs) {
    // A tab owns a path if it IS that path, or is a parent segment of it. The
    // trailing slash matters: without it '/support' would claim '/supportive'.
    const owns = pathname === to || pathname.startsWith(to === '/' ? '/' : `${to}/`)
    if (owns && (best === null || to.length > best.length)) best = to
  }
  return best
}
