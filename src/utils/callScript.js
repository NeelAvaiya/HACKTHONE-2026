// Pure timing math for the scripted call. No React, no timers — given a script
// and how long the call has been running, work out which line is on screen.

/**
 * @param {{speaker: string, text: string, ms: number}[]} script
 * @param {number} elapsedMs
 * @returns {{index, line, spoken, done}|null} null for an empty script
 *
 * `spoken` is every line up to and including the current one, so the transcript
 * and the captions can share one calculation. Past the end of the script the
 * final line is held rather than looped — a looping conversation reads as a bug.
 */
export function lineAt(script, elapsedMs) {
  if (!Array.isArray(script) || !script.length) return null

  let cursor = 0
  for (let i = 0; i < script.length; i++) {
    cursor += script[i].ms
    if (elapsedMs < cursor) {
      return { index: i, line: script[i], spoken: script.slice(0, i + 1), done: false }
    }
  }

  const last = script.length - 1
  return { index: last, line: script[last], spoken: script.slice(), done: true }
}

/** Total run time of a script, in ms. */
export const scriptDuration = (script) =>
  Array.isArray(script) ? script.reduce((total, line) => total + (line.ms || 0), 0) : 0

/** Seconds -> "MM:SS" for the call-duration clock. */
export function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
