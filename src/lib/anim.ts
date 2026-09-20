/**
 * One place loads and registers GSAP, and owns the Lenis smooth-scroll
 * singleton.
 *
 * Plugins: ScrollTrigger drives the scroll-position reveals and one-shot
 * section-rule draws. Lenis provides the smoothed wheel scrolling — it scrolls
 * the real window (eased, not transform-wrapped), so the sticky header, the
 * scroll spy and ScrollTrigger all keep reading native scroll position.
 *
 * The standard Lenis + GSAP recipe drives Lenis's raf loop from gsap.ticker,
 * with lag smoothing off so a dropped frame cannot stretch the easing.
 */
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

// Smoothness dial. Higher duration = a longer, floatier ride per wheel input;
// the easing is the classic ease-out-expo glide (fast pickup, long settle).
const SMOOTH_DURATION = 1.15

export const smoothEase = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))

let lenis: Lenis | null = null

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
  })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis?.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export function getLenis(): Lenis | null {
  return lenis
}
