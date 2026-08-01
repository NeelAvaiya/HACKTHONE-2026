// Plays a call script on a timer. All the timing math lives in utils/callScript.js;
// this hook only owns the clock and its cleanup.
import { useEffect, useRef, useState } from 'react'
import { lineAt } from '../utils/callScript.js'

const TICK_MS = 250

export function useCallScript(script) {
  const [elapsed, setElapsed] = useState(0)
  const startedRef = useRef(Date.now())

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startedRef.current), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const current = lineAt(script, elapsed)

  return {
    elapsed,
    activeSpeaker: current?.line.speaker ?? null,
    currentLine: current?.line ?? null,
    spoken: current?.spoken ?? [],
    done: current?.done ?? false,
  }
}
