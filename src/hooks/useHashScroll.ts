import { useEffect } from 'react'
import { scrollToSection } from '../components/Shared'
import { hashFor, urlFor } from '../lib/sections'

/**
 * Routes in-page hash links through `scrollToSection`, and lands deep links.
 *
 * A native jump honours `scroll-margin-top` and aims at the section box, whose
 * padding-top exists for scroll-past rhythm — so the heading ends up a whole
 * section-padding below the sticky header, which reads as landing somewhere else.
 * Intercepting the click puts the heading where a reader expects it and still
 * writes the hash, so the URL stays shareable.
 *
 * The same landing is applied to deep links and to hash changes made outside the
 * page. A fragment is read long before React mounts the sections, so the browser
 * has nothing to aim at and opens at the top.
 *
 * Every in-page link is a real anchor with a real href, so this only takes over
 * the plain left-click: middle-click, "copy link address" and the fragment the
 * address bar shows all keep working. From here on the spy owns the hash and
 * moves it along as you read.
 */
export function useHashScroll() {
  useEffect(() => {
    const land = (hash: string) => {
      const id = hash.slice(1)
      if (id && document.getElementById(id)) scrollToSection(id)
    }

    // Anchors inside the page already carry their own React click handler, which
    // calls preventDefault first — skip anything handled by someone else.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]')
      const id = anchor?.getAttribute('href')?.slice(1)
      if (!id || !document.getElementById(id)) return
      event.preventDefault()
      // pushState rather than assigning the hash: no hashchange, so no second
      // scroll, and the back button still returns to the previous entry.
      if (window.location.hash !== hashFor(id)) window.history.pushState(null, '', urlFor(id))
      land(`#${id}`)
    }

    document.addEventListener('click', onClick)
    window.addEventListener('hashchange', () => land(window.location.hash))
    const frame = requestAnimationFrame(() => land(window.location.hash))
    return () => {
      document.removeEventListener('click', onClick)
      cancelAnimationFrame(frame)
    }
  }, [])
}
