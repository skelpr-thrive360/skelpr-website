import { useEffect } from 'react'
import { landingTop, scrollToSection, sectionTarget } from '../components/Shared'
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
 * page. A fragment is read long before React mounts the sections, so the browser has
 * nothing to aim at and opens at the top — and a deep link is re-aimed as the page
 * settles rather than landed once (see below).
 *
 * Every in-page link is a real anchor with a real href, so this only takes over
 * the plain left-click: middle-click, "copy link address" and the fragment the
 * address bar shows all keep working. From here on the spy owns the hash and
 * moves it along as you read.
 */

/**
 * How often to re-check a deep link's landing, and for how long, in ms from `load`.
 *
 * A jump is a distance down a document that is not finished being one. The page's
 * reveals animate layout, not just transforms, so arriving starts them and they move
 * the ground everything below was aimed at; and the page is still growing below the
 * fold, so an early glide can be clamped short of a position that becomes reachable a
 * moment later. Aim once and the reader lands an arbitrary distance into the section,
 * differently on every visit. So the landing is re-checked until the page is actually
 * at the target (Lenis retargets rather than restarting, so it reads as one settling
 * correction), the later passes outlasting the reveals the earlier ones start.
 */
const AIM_EVERY = 400
const AIM_FOR = 6000

/** Below this the target has not really moved, so the scroll is left alone. */
const MOVED = 2

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

    // Captured before anything can rewrite it: the spy moves the hash along as you
    // read, so a pass aimed at the current hash would follow it somewhere else.
    const deepLink = window.location.hash.slice(1)

    // A landing only stands while the reader has not taken the scroll over. Wheel,
    // touch, pointer and the keys that scroll are the hand-off — a scrollbar drag is
    // a pointer, not a wheel. The scroll events our own glide produces are not input,
    // which is why this watches these rather than scroll.
    let cancelled = false
    let moved = false
    const noteUser = () => {
      moved = true
    }
    const onHashChange = () => land(window.location.hash)

    document.addEventListener('click', onClick)
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('wheel', noteUser, { passive: true })
    window.addEventListener('touchstart', noteUser, { passive: true })
    window.addEventListener('pointerdown', noteUser, { passive: true })
    window.addEventListener('keydown', noteUser)

    const timers: number[] = []
    const startedAt = performance.now()
    const aim = () => {
      if (cancelled || moved) return
      const target = sectionTarget(deepLink)
      // Off by more than this from where the jump should have left it: either the
      // layout moved under the landing, or the glide was clamped short because the
      // page was still growing below the fold when it started. Either way, aim again.
      if (target && Math.abs(landingTop(target) - window.scrollY) > MOVED) land(`#${deepLink}`)
      if (performance.now() - startedAt < AIM_FOR) timers.push(window.setTimeout(aim, AIM_EVERY))
    }

    if (deepLink) {
      const loaded = document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }))
      const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve()
      void Promise.all([loaded, fontsReady])
        .catch(() => undefined)
        .then(() => {
          if (cancelled) return
          aim()
        })
    }

    return () => {
      cancelled = true
      for (const timer of timers) window.clearTimeout(timer)
      document.removeEventListener('click', onClick)
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('wheel', noteUser)
      window.removeEventListener('touchstart', noteUser)
      window.removeEventListener('pointerdown', noteUser)
      window.removeEventListener('keydown', noteUser)
    }
  }, [])
}
