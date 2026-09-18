import { useEffect, useState } from 'react'

/**
 * True once the window has scrolled past `offset`, used to give the sticky
 * header a settled state instead of a permanent shadow.
 */
export function useScrolled(offset = 8) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [offset])

  return scrolled
}
