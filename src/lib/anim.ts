/**
 * One place loads and registers GSAP and its plugins, so every consumer
 * imports the same registered instances — registering twice is harmless but
 * scattered imports are how plugin registration gets forgotten somewhere.
 *
 * Plugins: ScrollTrigger (scroll-position reveals and one-shot draws) and
 * ScrollToPlugin (the page's own anchor glides). Both ship inside the `gsap`
 * package; nothing here needs a network or a paid tier.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

export { gsap, ScrollTrigger }
