import { useEffect } from 'react'
import { landingTop, scrollToSection, sectionTarget } from '../components/Shared'
import { hashFor, urlFor } from '../lib/sections'

/** Offset-aware anchors, with one initial correction after fonts and assets settle. */
export function useHashScroll() {
  useEffect(() => {
    const idFromHash = (hash: string) => {
      try {
        return decodeURIComponent(hash.slice(1))
      } catch {
        return ''
      }
    }
    const land = (hash: string) => {
      const id = idFromHash(hash)
      if (id && document.getElementById(id)) scrollToSection(id)
    }

    const initialHash = window.location.hash
    let disposed = false
    let initialCancelled = false
    let frame = 0
    const cancelInitial = () => { initialCancelled = true }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null
      if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return
      const id = idFromHash(anchor.getAttribute('href') ?? '')
      const target = id ? document.getElementById(id) : null
      if (!target) return

      event.preventDefault()
      cancelInitial()
      // Avoid a second browser jump, while preserving the Back button.
      if (window.location.hash !== hashFor(id)) window.history.pushState(null, '', urlFor(id))
      land(`#${encodeURIComponent(id)}`)
      // A skip link must move keyboard focus beyond the navigation. Normal
      // section links leave focus on their control instead of stealing it.
      if (anchor.classList.contains('skip-link')) target.focus({ preventScroll: true })
    }
    const onHashChange = () => {
      cancelInitial()
      land(window.location.hash)
    }

    document.addEventListener('click', onClick)
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('wheel', cancelInitial, { passive: true })
    window.addEventListener('touchstart', cancelInitial, { passive: true })
    window.addEventListener('pointerdown', cancelInitial, { passive: true })
    window.addEventListener('keydown', cancelInitial)

    let onLoad: (() => void) | undefined
    if (initialHash) {
      const loaded = document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
          onLoad = resolve
          window.addEventListener('load', onLoad, { once: true })
        })
      const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve()
      void Promise.all([loaded, fontsReady]).catch(() => undefined).then(() => {
        if (disposed || initialCancelled) return
        frame = requestAnimationFrame(() => {
          frame = 0
          if (disposed || initialCancelled) return
          const target = sectionTarget(idFromHash(initialHash))
          if (target && Math.abs(landingTop(target) - window.scrollY) > 2) land(initialHash)
        })
      })
    }

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      if (onLoad) window.removeEventListener('load', onLoad)
      document.removeEventListener('click', onClick)
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('wheel', cancelInitial)
      window.removeEventListener('touchstart', cancelInitial)
      window.removeEventListener('pointerdown', cancelInitial)
      window.removeEventListener('keydown', cancelInitial)
    }
  }, [])
}
