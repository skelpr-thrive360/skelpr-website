import { useEffect } from 'react'

/**
 * Reveal-on-scroll for the page's key blocks.
 *
 * The targets are tagged here rather than in every section component, so the
 * reveal vocabulary lives in one place. A block only animates if the visitor
 * allows motion and IntersectionObserver exists — the `has-reveal` class is the
 * switch, so no-JS and reduced-motion visitors get a fully rendered page
 * instead of an empty one.
 */
const REVEAL_TARGETS = [
  '.hero-copy .eyebrow',
  '.hero h1',
  '.hero-actions',
  '.hero-proof',
  '.hero-visual',
  '.section-kicker',
  '.two-column-heading',
  '.workflow-heading',
  '.identity-layout > div:first-child',
  '.comparison-visual',
  '.mode-switcher',
  '.workflow-shell',
  '.benchmark-meta',
  '.metric-grid',
  '.benchmark-table-wrap',
  '.architecture-layout',
  '.real-world-grid',
  '.install-layout',
  '.waitlist-panel',
]

const STAGGER_MS = 60
const MAX_STAGGER_STEPS = 4

export function useScrollReveal() {
  useEffect(() => {
    const root = document.documentElement
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!('IntersectionObserver' in window)) return

    const targets = Array.from(
      new Set(REVEAL_TARGETS.flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)))),
    )

    const seen = new Map<Element, number>()
    for (const target of targets) {
      const group = target.closest('section, main, footer') ?? document.body
      const index = seen.get(group) ?? 0
      seen.set(group, index + 1)
      target.dataset.reveal = ''
      target.style.setProperty('--reveal-delay', `${Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS}ms`)
    }

    root.classList.add('has-reveal')

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      },
      // threshold 0 with a shrunken root: a block taller than the viewport can
      // never reach 15% visible, so it would stay hidden forever.
      { threshold: 0, rootMargin: '0px 0px -10% 0px' },
    )

    for (const target of targets) {
      // Anything already on screen settles immediately instead of waiting.
      if (target.getBoundingClientRect().top < window.innerHeight * 0.9) target.classList.add('is-visible')
      else observer.observe(target)
    }

    return () => {
      observer.disconnect()
      root.classList.remove('has-reveal')
    }
  }, [])
}
