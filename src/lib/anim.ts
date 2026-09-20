/**
 * One place loads and registers GSAP, and owns the Lenis smooth-scroll
 * singleton.
 *
 * Plugins: ScrollTrigger drives the reversible reveals, the scrubbed section
 * rules, the figure drift and the assemblies (see useScrollChoreography).
 * DrawSVG draws the architecture map's wiring out from its source nodes — a
 * diagram asserting a pipeline should be seen tracing it, not fading in as a
 * finished picture. Lenis provides the smoothed wheel scrolling — it scrolls
 * the real window (eased, not transform-wrapped), so the sticky header, the
 * scroll spy and ScrollTrigger all keep reading native scroll position.
 *
 * Lenis runs its own rAF loop (`autoRaf: true`) rather than borrowing
 * gsap.ticker. The common recipe drives Lenis from the ticker, but GSAP sleeps
 * its ticker whenever the last animation finishes (`child || _ticker.sleep()`
 * in gsap-core), so a borrowed loop freezes mid-gesture the moment the page has
 * no GSAP tween running — wheel scrolling stops dead until something else wakes
 * it. ScrollTrigger is still kept in step through `lenis.on('scroll')`.
 */
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin)

export { gsap, ScrollTrigger }

// Smoothness dial. Higher duration = a longer, floatier ride per wheel input;
// the easing is the classic ease-out-expo glide (fast pickup, long settle).
const SMOOTH_DURATION = 1.4

export const smoothEase = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))

let lenis: Lenis | null = null

/**
 * Is the wheel gesture over something that scrolls on its own?
 *
 * Lenis calls `prevent` with the wheel event's target, and a true answer means
 * the gesture belongs to that element, not to the page. The page has several
 * nested scrollers by design — the benchmark table, the verbatim answer panes,
 * code blocks, the workflow step strip — and swallowing their wheel gesture
 * would silently break the one interaction that reads them.
 *
 * The check is structural rather than a class list: walk up from the target and
 * stop at the first ancestor the browser would actually scroll. That way a new
 * scroller is covered by the CSS that makes it one, with no markup attribute to
 * remember and no list to keep in sync.
 */
function isNestedScroller(node: HTMLElement): boolean {
  for (let el: HTMLElement | null = node; el && el !== document.body; el = el.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(el)
    const scrolls = /(auto|scroll|overlay)/.test(`${overflowX}${overflowY}`)
    if (scrolls && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) return true
  }
  return false
}

/**
 * Create (or return the existing) Lenis instance. Null when the visitor asked
 * for reduced motion — their scrolling stays exactly as the browser ships it,
 * and every consumer treats null as "scroll natively".
 */
export function initSmoothScroll(): Lenis | null {
  if (lenis) return lenis
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null

  lenis = new Lenis({
    duration: SMOOTH_DURATION,
    easing: smoothEase,
    prevent: isNestedScroller,
    autoRaf: true,
  })
  lenis.on('scroll', ScrollTrigger.update)
  return lenis
}

export function getLenis(): Lenis | null {
  return lenis
}
