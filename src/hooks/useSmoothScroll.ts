import { useEffect } from 'react'
import { initSmoothScroll } from '../lib/anim'

/**
 * Starts the smoothed wheel scrolling for the session.
 *
 * Lenis eases wheel input toward the target scroll position rather than
 * jumping per notch, which is what makes long marketing pages feel liquid
 * instead of steppy. It scrolls the real window — no transform wrapper — so
 * the sticky header, the section spy, ScrollTrigger and find-in-page all
 * behave as before. Touch scrolling is left native on purpose: phones already
 * have their own inertial feel, and overriding it reads as wrong.
 *
 * Reduced-motion visitors get no smoothing at all (initSmoothScroll returns
 * null) — their page scrolls exactly as the browser ships it.
 */
export function useSmoothScroll() {
  useEffect(() => {
    initSmoothScroll()
  }, [])
}
