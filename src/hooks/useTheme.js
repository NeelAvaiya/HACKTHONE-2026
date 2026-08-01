// Light/dark theme: a `dark` class on <html>, remembered in localStorage.
// Falls back to the OS preference the first time someone opens the app.
import { useEffect, useState } from 'react'

const KEY = 'helpsense-theme'

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches

export function storedTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // private mode / storage disabled — fall through to the OS preference
  }
  return prefersDark() ? 'dark' : 'light'
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

/**
 * Applied once before render in main.jsx, so the page never flashes light
 * before the toggle mounts.
 */
export function initTheme() {
  applyTheme(storedTheme())
}

export function useTheme() {
  const [theme, setTheme] = useState(storedTheme)

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // Not being able to remember the choice is not worth breaking the app over
    }
  }, [theme])

  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }
}
