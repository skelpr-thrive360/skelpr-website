import { useLayoutEffect } from 'react'
import { gsap, ScrollTrigger } from '../lib/anim'

/**
 * Scroll choreography, on GSAP.
 *
 * Two effects, one hook:
 *
 * 1. Reveals — the page's key blocks rise and fade in as they enter the
 *    viewport. ScrollTrigger.batch groups blocks that arrive together and the
 *    per-section index sets each block's delay, so a section reads as one
 *    choreographed entrance rather than twenty independent ones.
 * 2. Section rules — the full-bleed divider lines (see the "section rules"
 *    block in styles.css) draw themselves in as their block arrives, via the
 *    `--rule-x` custom property the pseudo-element reads for its scaleX.
 *
 * Everything is created inside one gsap.context: revert() on unmount kills the
 * triggers and restores the natural styles, which is also what makes the
 * StrictMode double-mount clean.
 *
 * Accessibility contract: the hook only runs when the visitor allows motion.
 * It hides nothing by itself otherwise, and because the initial hidden states
 * are set from a layout effect — before the first paint — there is no flash of
 * visible content that then ducks out of view. No JS at all: nothing is ever
 * hidden, the rules ship at their default full width, and the page reads
 * complete.
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
  '.pricing-grid',
  '.waitlist-panel',
]

const STAGGER_MS = 70
const MAX_STAGGER_STEPS = 4

// The rules sit at each block's bottom edge, so the draw starts as the block's
// end approaches the viewport rather than after the whole block has passed.
const RULE_BLOCKS = '.hero, .signal-strip, .content-section'

export function useScrollReveal() {
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      const targets = Array.from(
        new Set(REVEAL_TARGETS.flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)))),
      )

      // Choreography index: the n-th block inside a section enters n steps late.
      const seen = new Map<Element, number>()
      for (const target of targets) {
        const group = target.closest('section, main, footer') ?? document.body
        const index = seen.get(group) ?? 0
        seen.set(group, index + 1)
        target.dataset.revealDelay = `${Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS}`
      }

      gsap.set(targets, { opacity: 0, y: 16 })
      ScrollTrigger.batch(targets, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out',
            overwrite: 'auto',
            // The batch's own stagger is off; the per-section dataset delay
            // written above owns the choreography.
            delay: (_index, element) => Number((element as HTMLElement).dataset.revealDelay ?? 0) / 1000,
          }),
      })

      // One draw per section rule. `once` keeps each line to a single pass —
      // rules that retracted on scroll-up would read as a progress bar, not a
      // page.
      document.querySelectorAll<HTMLElement>(RULE_BLOCKS).forEach((block) => {
        gsap.fromTo(
          block,
          { '--rule-x': 0 },
          {
            '--rule-x': 1,
            duration: 0.9,
            ease: 'power2.inOut',
            scrollTrigger: { trigger: block, start: 'bottom 96%', once: true },
          },
        )
      })
    })

    return () => ctx.revert()
  }, [])
}
