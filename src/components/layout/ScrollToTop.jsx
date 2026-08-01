// React Router does not reset the scroll position on navigation — the browser
// keeps whatever offset the previous page had.
//
// That is what made the tabs look like they collapsed into each other: scroll
// down the Support Dashboard, switch to Client Chat, and the new page renders
// with the window still scrolled 800px down. The tab row is above the viewport
// and the chat pane — sized to the viewport height — starts at the document
// top, so you land in the middle of a page with no tabs in sight.
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // 'instant': a smooth scroll would race the page-fade animation
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
