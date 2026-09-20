import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Check, ChevronDown, UserX } from 'lucide-react'
import { gsap, getLenis, ScrollTrigger, smoothEase } from '../lib/anim'

/**
 * Document-space top of `element`, read from layout rather than from the
 * painted box.
 *
 * `getBoundingClientRect()` answers "where is this drawn?", and the page draws
 * blocks somewhere other than where they live: every block the choreography
 * retracts carries a 20px transform, and a block still travelling is anywhere at
 * all. Landing a jump on that number aims at the paint, not at the heading the
 * reader named. `offsetTop` walks the layout instead — it is immune to every
 * transform on the page — so a jump lands where the target actually sits.
 */
function documentTop(element: HTMLElement) {
  let top = 0
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
    top += node.offsetTop
  }
  return top
}

/**
 * Offset-aware smooth scroll: clears the sticky header, and skips easing for
 * visitors who asked for reduced motion.
 *
 * The glide rides Lenis when it is running, so an anchor click lands with the
 * same easing vocabulary as the wheel scrolling around it. One duration rule
 * scales with distance (capped, so a footer jump is a deliberate glide, not a
 * commute), and a wheel input mid-flight hands control straight back — Lenis
 * treats fresh user scroll as authoritative over a running programmatic one.
 */
export function scrollToElement(target: HTMLElement, offset = 16) {
  const header = document.querySelector<HTMLElement>('.site-header')
  const headerHeight = header?.offsetHeight ?? 72
  const top = Math.max(documentTop(target) - headerHeight - offset, 0)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    window.scrollTo({ top, behavior: 'auto' })
    return
  }
  const lenis = getLenis()
  if (lenis) {
    // Lenis animates from its own record of the scroll position, and that record
    // can be left behind by a scroll Lenis did not perform: the browser landing
    // a fragment on load, a restored position, or a gesture handed to a nested
    // scroller. A glide started from a stale record first drags the page back to
    // where Lenis thought it was, which is what a click that settles in the
    // wrong section looks like from the outside. `resize()` is Lenis's own way
    // of re-reading where the page really is, so the walk starts from here.
    if (Math.abs(lenis.animatedScroll - window.scrollY) > 1) lenis.resize()
    const distance = Math.abs(top - window.scrollY)
    // ~0.5s for a hop, ~1.4s for the full page — past that the ride stops
    // getting longer and just starts feeling stuck.
    const duration = Math.min(Math.max(distance / 2400, 0.5), 1.4)
    lenis.scrollTo(top, { duration, easing: smoothEase })
    return
  }
  // Lenis not running (no JS motion consent, or init hasn't landed yet):
  // fall back to the browser's own smooth behaviour.
  window.scrollTo({ top, behavior: 'smooth' })
}

/**
 * Jump to a section by id. Targets the section first block rather than its
 * box: a section carries a large padding-top so it breathes while you scroll
 * past it, and honouring that on a jump drops the kicker a whole
 * section-padding below the header, which reads as landing somewhere else.
 */
export function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  const first = target.firstElementChild
  scrollToElement(first instanceof HTMLElement ? first : target)
}

export function DetailButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return <button className="detail-button" onClick={onClick} aria-expanded={open}><span>{open ? 'Hide technical details' : 'View technical details'}</span><ChevronDown size={14} className={open ? 'rotate' : ''} /></button>
}

/**
 * The technical-detail block, opened and closed as motion rather than as a mount.
 *
 * Mounting and unmounting made the panel pop and the whole page below it jump —
 * at the exact moment a reader has asked for more, which is the worst place on a
 * page to look abrupt. Animating the shell's height keeps the document
 * continuous, and the block stays mounted while it closes so the sentence does
 * not disappear from under the cursor.
 *
 * Two details matter as much as the tween. `display: none` is restored once a
 * close settles, so closed detail is out of the accessibility tree and out of
 * find-in-page exactly as it was when unmounted. And ScrollTrigger is refreshed
 * when a tween settles: every trigger below this block has just moved, and a
 * stale start value is how a reveal ends up firing a screen late.
 *
 * Height is measured from the shell's own `scrollHeight` rather than the child's
 * `offsetHeight`, because the child carries a top margin that the collapsed shell
 * clips — measuring the child would leave that gap to be added at the end, as a
 * visible pop when the height hands back to `auto`.
 */
export function SectionDetail({ open, children }: { open: boolean; children: ReactNode }) {
  const shell = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = shell.current
    if (!el) return
    const settle = () => {
      gsap.set(el, { height: 'auto' })
      ScrollTrigger.refresh()
    }

    // Reduced motion gets the block, not the motion — including the first render,
    // where `open` is false and the block must simply not be there.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.height = open ? 'auto' : '0px'
      el.style.display = open ? 'block' : 'none'
      return
    }

    if (open) {
      el.style.display = 'block'
      const tween = gsap.fromTo(
        el,
        { height: 0, opacity: 0 },
        { height: el.scrollHeight, opacity: 1, duration: 0.42, ease: 'power2.out', onComplete: settle },
      )
      return () => {
        tween.kill()
      }
    }

    const tween = gsap.to(el, {
      height: 0,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set(el, { height: 'auto', display: 'none' })
        ScrollTrigger.refresh()
      },
    })
    return () => {
      tween.kill()
    }
  }, [open])

  return (
    <div className="detail-reveal" ref={shell}>
      {children}
    </div>
  )
}

export function Metric({ label, simple, without, withValue, change }: { label: string; simple: string; without: string; withValue: string; change: string }) {
  return <div className="metric-card"><span className="metric-label">{label}</span><span className="metric-simple">{simple}</span><div className="metric-values"><div><small>WITHOUT</small><strong>{without}</strong></div><div className="metric-arrow">→</div><div className="with-value"><small>WITH</small><strong>{withValue}</strong></div></div><span className="metric-change">{change}</span></div>
}

// Extra payload handed to onSubmit: honeypot value (bots that fill it are dropped server-side).
export type WaitlistSubmitDetails = { trap: string }

type WaitlistPhase =
  | { kind: 'form' }
  | { kind: 'joined'; duplicate: boolean }
  | { kind: 'withdrawn' }

/**
 * Self-contained waitlist form: join → "you're on the list", re-join →
 * duplicate state with a withdraw option, withdraw → removed + re-join link.
 *
 * One form on the page, in the waitlist section. The hero used to render a second,
 * compact copy of it — same fields, same submit, `hero-email` instead of
 * `waitlist-email` — which is why every id here was conditional. Three routes to one
 * action (header CTA, hero form, section form) made the page look busier than it was.
 */
export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [phase, setPhase] = useState<WaitlistPhase>({ kind: 'form' })
  // Honeypot: visually hidden field humans never tab into.
  const [trap, setTrap] = useState('')

  const post = async (action: 'join' | 'withdraw') => {
    if (pending) return
    setPending(true)
    const { submitWaitlistEmail } = await import('../lib/waitlist')
    const result = await submitWaitlistEmail(email, { action, trap })
    setPending(false)
    if (result.ok) {
      setError('')
      setPhase(action === 'withdraw' ? { kind: 'withdrawn' } : { kind: 'joined', duplicate: Boolean(result.duplicate) })
    } else {
      setError(result.error)
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void post('join')
  }

  if (phase.kind === 'joined') {
    return (
      <div className="waitlist-success" role="status">
        <span><Check size={15} /></span>
        <div>
          <strong>{phase.duplicate ? 'You’re already on the list.' : 'You’re on the list.'}</strong>
          <small>
            {phase.duplicate
              ? <>This email was already registered — no need to sign up twice. Changed your mind? <button type="button" className="waitlist-link" onClick={() => void post('withdraw')}>{pending ? 'Withdrawing…' : 'Withdraw from the waitlist'}</button></>
              : 'Thanks — we’ll share updates when there’s news.'}
          </small>
        </div>
      </div>
    )
  }

  if (phase.kind === 'withdrawn') {
    return (
      <div className="waitlist-success removed" role="status">
        <span className="removed"><UserX size={15} /></span>
        <div>
          <strong>You’ve been removed from the waitlist.</strong>
          <small>Sorry to see you go. <button type="button" className="waitlist-link" onClick={() => setPhase({ kind: 'form' })}>Join again</button></small>
        </div>
      </div>
    )
  }

  return (
    <form className="waitlist-form" onSubmit={handleSubmit} noValidate>
      <div className="waitlist-input-wrap">
        <label htmlFor="waitlist-email">Email address</label>
        <input id="waitlist-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="you@company.com" aria-invalid={Boolean(error)} aria-describedby={error ? 'waitlist-email-error' : undefined} />
        {error && <span className="waitlist-error" id="waitlist-email-error">{error}</span>}
      </div>
      <button className="button waitlist-button" type="submit" disabled={pending}>{pending ? 'Joining…' : 'Join the waitlist'} <ArrowRight size={14} /></button>
      <input className="waitlist-hp" type="text" name="company_website" value={trap} onChange={(event) => setTrap(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" />
    </form>
  )
}
