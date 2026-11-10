import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Used by explicit expand/collapse controls, not by page entrances or parallax.
gsap.registerPlugin(ScrollTrigger)
export { gsap, ScrollTrigger }
