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
const REVEAL_TARGETS = ['.hero-copy > *', '.content-section > *']

// Blocks that draw a full-bleed rule at their bottom edge. The last content
// section is out because the footer already draws the document's bottom edge.
const RULE_BLOCKS = '.hero, .signal-strip, .content-section:not(:last-child)'

// Large figures that drift as they cross the viewport. Kept to the three
// narrative figures — benchmark evidence is intentionally absent.
const DRIFT_TARGETS = ['.comparison-visual', '.workflow-shell', '.architecture-layout']

/**
 * "Placed by hand": the hero's gesture, reused where the page really is a
 * structure being built rather than a paragraph being read.
 *
 * The hero lays its four step cards down one at a time. The architecture map
 * and the workflow pipeline are the only other places on the page where the
 * content *is* an assembly — a set of pieces that belong in specific slots — so
 * they get the same vocabulary at a third of the scale: each piece arrives from
 * a short offset of its own box, in the order the diagram claims, and the wiring
 * follows once the pieces have landed.
 *
 * The offsets are small here on purpose. The hero is allowed a stage entrance
 * because it is the first thing a visitor sees and the gesture is the page
 * introducing itself; further down, a card that flew in from off-screen would be
 * decoration, and this page does not decorate its evidence.
 *
 * `centered` marks pieces whose own CSS centres them on their slot with a
 * percentage transform. GSAP owns the inline transform from the first frame it
 * animates, so that centring has to be restated in GSAP's terms or the piece
 * lands half its own size away from its slot — the bug that put the hero's first
 * card in the wrong place. `wiring` is drawn after the last piece lands, never
 * underneath one that is still travelling: 'stroke' traces the connection along
 * its own length (a diagram asserting a pipeline should be seen drawing it),
 * 'fade' simply brings it up.
 */
type Assembly = {
  root: string
  piece: string
  x: number
  y: number
  rotation: number
  stagger: number
  centered?: boolean
  wiring?: { selector: string; how: 'stroke' | 'fade' }
}

// Pipeline order, which is also document order: ingestion → stores → retrieval
// → agent, then the map's own edges. The workflow's six steps lay down in the
// sequence they are numbered in.
const ASSEMBLIES: Assembly[] = [
  {
    root: '.architecture-map',
    piece: '.architecture-node',
    x: 30,
    y: 22,
    rotation: 1.4,
    stagger: 0.055,
    centered: true,
    wiring: { selector: 'svg', how: 'stroke' },
  },
  { root: '.workflow-steps', piece: '.workflow-step', x: -26, y: 18, rotation: -1, stagger: 0.07 },
]

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

      // Assemblies. A paused timeline per group, played when the group reaches
      // the fold and reversed (quicker, so backtracking never waits out a stage
      // entrance) when the reader climbs back out of it — the same contract as
      // the reveals, so nothing is ever left half-built behind them.
      for (const assembly of ASSEMBLIES) {
        document.querySelectorAll<HTMLElement>(assembly.root).forEach((root) => {
          const pieces = Array.from(root.querySelectorAll<HTMLElement>(assembly.piece))
          if (!pieces.length) return
          const centering = assembly.centered ? { xPercent: -50, yPercent: -50 } : {}
          const timeline = gsap.timeline({
            paused: true,
            scrollTrigger: {
              trigger: root,
              start: 'top 80%',
              onEnter: () => timeline.timeScale(1).play(),
              onEnterBack: () => timeline.timeScale(1).play(),
              onLeaveBack: () => timeline.timeScale(2.4).reverse(),
            },
          })
          timeline.fromTo(
            pieces,
            { ...centering, x: assembly.x, y: assembly.y, rotation: assembly.rotation, opacity: 0 },
            {
              ...centering,
              x: 0,
              y: 0,
              rotation: 0,
              opacity: 1,
              duration: 0.6,
              ease: 'power3.out',
              stagger: assembly.stagger,
            },
          )
          const wiring = assembly.wiring ? root.querySelector<HTMLElement>(assembly.wiring.selector) : null
          if (wiring && assembly.wiring) {
            if (assembly.wiring.how === 'stroke') {
              // The map's edges, traced out from their source nodes as the pieces
              // land. The dash properties are cleared the moment the draw
              // finishes: the lines are live geometry the reader can drag, and a
              // stale dash pattern would re-clip a line that has grown longer
              // than the length it was measured at.
              const edges = Array.from(wiring.querySelectorAll<SVGGeometryElement>('line, path, polyline'))
              if (edges.length) {
                timeline.fromTo(
                  edges,
                  { drawSVG: '0%' },
                  {
                    drawSVG: '100%',
                    duration: 0.5,
                    ease: 'power2.inOut',
                    stagger: 0.045,
                    onComplete: () => gsap.set(edges, { clearProps: 'strokeDasharray,strokeDashoffset' }),
                  },
                  '>',
                )
              }
            } else {
              timeline.from(wiring, { opacity: 0, duration: 0.5, ease: 'power2.out' }, '>')
            }
          }
        })
      }

      // Hero board: the frame only fades on — it is the table, not a piece. The
      // pieces are placed on it: each step card is dragged in from beyond its own
      // box to its exact position, the trace panel follows, and the connectors
      // draw once everything has landed (HeroVisual waits on the same beat, so
      // the wiring is never drawn underneath a card that is still travelling).
      //
      // Offsets are derived per element from its own box, so the gesture reads as
      // one hand laying pieces down at any viewport. x/y, not xPercent/yPercent:
      // the exit scrub below owns yPercent, and the two must not fight over one
      // property — as separate properties they simply compose.
      const heroVisual = document.querySelector<HTMLElement>('.hero-visual')
      if (heroVisual) {
        gsap.from(heroVisual, { opacity: 0, duration: 0.55, delay: 0.1, ease: 'power2.out' })

        const label = heroVisual.querySelector<HTMLElement>('.visual-label')
        if (label) gsap.from(label, { opacity: 0, x: -24, duration: 0.6, delay: 0.25, ease: 'power3.out' })

        const pieces = heroVisual.querySelectorAll<HTMLElement>('.hero-node')
        if (pieces.length) {
          gsap.fromTo(
            pieces,
            {
              // Each card centres itself on its anchor with a CSS
              // translate(-50%, -50%), and GSAP owns the inline transform from
              // the moment it animates — so the centring is restated in GSAP's
              // own terms, as percentages that survive a resize. Without it the
              // cards land half their own size off their anchor, and the
              // connectors no longer meet the cards they describe.
              xPercent: -50,
              yPercent: -50,
              x: (_index, element) => -Math.min(Math.max(element.getBoundingClientRect().width * 1.6, 140), 260),
              y: (_index, element) => -Math.min(Math.max(element.getBoundingClientRect().height * 2.6, 110), 240),
              rotation: -3,
              scale: 0.94,
              opacity: 0,
              transformOrigin: '50% 60%',
            },
            {
              xPercent: -50,
              yPercent: -50,
              x: 0,
              y: 0,
              rotation: 0,
              scale: 1,
              opacity: 1,
              duration: 0.7,
              delay: 0.3,
              stagger: 0.08,
              ease: 'power3.out',
            },
          )
        }

        const trace = heroVisual.querySelector<HTMLElement>('.hero-console')
        if (trace) gsap.from(trace, { opacity: 0, x: -70, y: 28, duration: 0.75, delay: 0.65, ease: 'power3.out' })
      }

      // Hero exit: copy lifts and eases back; the console drifts slower, which
      // reads as depth. Both fully return when the reader is back at the top.
      const hero = document.querySelector<HTMLElement>('.hero')
      const heroCopy = hero?.querySelector<HTMLElement>('.hero-copy')
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
