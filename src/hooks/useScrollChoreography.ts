import { useLayoutEffect } from 'react'
import { gsap, ScrollTrigger } from '../lib/anim'

/**
 * Scroll choreography — the page's motion script, in one hook.
 *
 * The site moves like a document that reacts to the reader, not a deck that
 * plays at them: everything is transform + opacity, nothing pins, nothing
 * hijacks the axis, and every effect runs backwards when the reader scrolls
 * back up. Four layers, in increasing subtlety:
 *
 * 1. Reveals — blocks rise and fade as they cross the fold. Each block carries
 *    a delay set from its position inside its section, so a section enters as
 *    one gesture. Leaving back through the fold retracts them (fast, no
 *    stagger) so returning to a section replays it rather than presenting a
 *    half-faded page.
 *
 *    A block animates because of where it sits, not because someone remembered
 *    to list it: every direct child of a section is a block, in document order.
 *    The hand-written list this replaced is exactly how the identity specs and
 *    the mode panel shipped with no motion at all — a list is a promise that
 *    every future block gets added to it, and that promise gets broken quietly.
 * 2. Section rules — the full-bleed divider lines draw and retract with scroll
 *    position (scrub), via the `--rule-x` custom property the pseudo-element
 *    reads for its scaleX (see the "section rules" block in styles.css).
 * 3. Hero exit — the hero copy lifts and eases back as the page leaves it,
 *    while the console drifts on its own rate: the first parallax the reader
 *    meets, and the first thing that returns at the top.
 * 4. Figure depth — front-of-page figures drift ±4% across their traversal.
 *    Deliberately excluded: the benchmark table and metric grid. Evidence
 *    sections stay still — numbers that wobble as you read them are harder to
 *    trust, and that is the one thing this page cannot trade away.
 *
 * The intensity dials (rise, stagger, drift, durations) are constants below, so
 * the whole page's feel can be tuned in one place. Lenis owns the scroll
 * smoothing itself (lib/anim.ts).
 *
 * Accessibility contract, unchanged: the hook only runs when the visitor
 * allows motion. Initial states are set from a layout effect — before first
 * paint — so nothing flashes in and then ducks out; with no JS (or reduced
 * motion) nothing is ever hidden, and the rules ship at their default full
 * width. The whole thing lives in one gsap.context, so unmount (and React
 * StrictMode's double-mount) reverts every trigger and inline style.
 */
// Structural, not a list: the hero's copy column children (eyebrow, headline,
// lede, actions, proof, boundary) then its console, and after that every direct
// child of every content section — kicker, headings, figures, panels, grids.
const REVEAL_TARGETS = ['.hero-copy > *', '.hero-visual', '.content-section > *']

// Blocks that draw a full-bleed rule at their bottom edge. The last content
// section is out because the footer already draws the document's bottom edge.
const RULE_BLOCKS = '.hero, .signal-strip, .content-section:not(:last-child)'

// Large figures that drift as they cross the viewport. Kept to the three
// narrative figures — benchmark evidence is intentionally absent.
const DRIFT_TARGETS = ['.comparison-visual', '.workflow-shell', '.architecture-layout']

// --- intensity dials -------------------------------------------------------
const STAGGER_MS = 70 // per-block delay inside a section's entrance
const MAX_STAGGER_STEPS = 4 // after the 5th block, the stagger stops growing
const REVEAL_RISE = 20 // px a block rises from on entry
const REVEAL_DURATION = 0.9 // forward pass
const RETRACT_DURATION = 0.35 // backward pass, deliberately quicker
const DRIFT_PERCENT = 4 // ±% of the figure's own height

/**
 * Every scroll-linked value is scrubbed with `true`, never with a numeric lag,
 * and that is deliberate.
 *
 * `scrub: 0.5` means "catch up over half a second", which ScrollTrigger animates
 * with its own tween — and a tween only advances while the GSAP ticker is awake.
 * The ticker sleeps whenever the page has no active animation, so a lagged wash,
 * rule or drift could sit frozen at its last value with the scroll position
 * saying otherwise (the CTA wash measured exactly that: 0 while the scroll sat
 * mid-act). `scrub: true` writes progress straight from the scroll update, with
 * no tween in between, so a linked value can never disagree with the position
 * that produced it. Smoothness is unaffected: Lenis is already smoothing the
 * scroll itself, and these values ride on top of it.
 */
const LINK = true
// ---------------------------------------------------------------------------

export function useScrollChoreography() {
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

      const reveal = (batch: Element[]) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: REVEAL_DURATION,
          ease: 'power3.out',
          overwrite: 'auto',
          delay: (_index, element) => Number((element as HTMLElement).dataset.revealDelay ?? 0) / 1000,
        })

      const retract = (batch: Element[]) => {
        gsap.killTweensOf(batch)
        gsap.to(batch, {
          opacity: 0,
          y: REVEAL_RISE,
          duration: RETRACT_DURATION,
          ease: 'power2.in',
          overwrite: true,
        })
      }

      gsap.set(targets, { opacity: 0, y: REVEAL_RISE })
      // One trigger per block rather than ScrollTrigger.batch(). batch() delivers
      // its callbacks through a gsap.delayedCall — and a delayed call is a tween,
      // whose delivery depends on the ticker being awake. That indirection is how
      // blocks were left visible on the way back up while others retracted: the
      // per-block triggers below fire synchronously inside the same scroll
      // update, so a block can only ever end in the state its position implies.
      // The choreography itself is unchanged: the stagger lives in each block's
      // own delay, not in the batching.
      for (const target of targets) {
        ScrollTrigger.create({
          trigger: target,
          start: 'top 88%',
          onEnter: () => reveal([target]),
          onEnterBack: () => reveal([target]), // returning from above replays it
          onLeaveBack: () => retract([target]),
        })
      }

      // One scrubbed draw per rule: forward as the block's end approaches,
      // backwards when the reader returns. The line and the scroll are the
      // same gesture, so there is nothing to "replay" — it simply follows.
      document.querySelectorAll<HTMLElement>(RULE_BLOCKS).forEach((block) => {
        gsap.fromTo(
          block,
          { '--rule-x': 0 },
          {
            '--rule-x': 1,
            ease: 'none',
            scrollTrigger: { trigger: block, start: 'bottom 105%', end: 'bottom 88%', scrub: LINK },
          },
        )
      })

      // Hero exit: copy lifts and eases back; the console drifts slower, which
      // reads as depth. Both fully return when the reader is back at the top.
      const hero = document.querySelector<HTMLElement>('.hero')
      const heroCopy = hero?.querySelector<HTMLElement>('.hero-copy')
      const heroVisual = hero?.querySelector<HTMLElement>('.hero-visual')
      if (hero) {
        if (heroCopy) {
          gsap.to(heroCopy, {
            y: -70,
            opacity: 0.5,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: LINK },
          })
        }
        if (heroVisual) {
          gsap.to(heroVisual, {
            yPercent: -6,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: LINK },
          })
        }
      }

      // Figure depth. yPercent, not y: the reveal owns the element's y, and
      // GSAP composes the two transforms rather than one clobbering the other.
      for (const selector of DRIFT_TARGETS) {
        document.querySelectorAll<HTMLElement>(selector).forEach((figure) => {
          gsap.fromTo(
            figure,
            { yPercent: DRIFT_PERCENT },
            {
              yPercent: -DRIFT_PERCENT,
              ease: 'none',
              scrollTrigger: { trigger: figure, start: 'top bottom', end: 'bottom top', scrub: LINK },
            },
          )
        })
      }

      // Act washes. An act whose section carries `.act-wash` cross-fades the
      // page to its own colour as it takes the screen and back out as it hands
      // over — the one moment on this page where the background itself moves.
      // It is a timeline rather than two tweens so a short act (the waitlist
      // band is shorter than the viewport) can never have its fade-out start
      // before its fade-in ends. Scroll position is the whole clock: scroll
      // back up and the colour withdraws with it.
      document.querySelectorAll<HTMLElement>('.act-wash').forEach((act) => {
        gsap
          .timeline({
            scrollTrigger: { trigger: act, start: 'top 85%', end: 'bottom 15%', scrub: LINK },
          })
          .fromTo(act, { '--act-wash': 0 }, { '--act-wash': 1, duration: 0.2, ease: 'none' })
          .to(act, { '--act-wash': 0, duration: 0.2, ease: 'none' }, 0.8)
      })

      // Reading rail: how much of the document is behind you, drawn across the
      // header's bottom edge. It follows the scroll rather than a timer, so on
      // a page this tall it answers "how much is left?" at a glance — and it is
      // the one line on the site that is allowed to be incomplete on purpose.
      const rail = document.querySelector<HTMLElement>('.read-rail span')
      if (rail) {
        gsap.fromTo(
          rail,
          { scaleX: 0 },
          { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: LINK } },
        )
      }
    })

    return () => ctx.revert()
  }, [])
}
