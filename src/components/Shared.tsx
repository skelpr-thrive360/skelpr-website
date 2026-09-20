import { useState } from 'react'
import { ArrowRight, Check, ChevronDown, UserX } from 'lucide-react'
import { getLenis, smoothEase } from '../lib/anim'

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
  const top = Math.max(target.getBoundingClientRect().top + window.scrollY - headerHeight - offset, 0)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    window.scrollTo({ top, behavior: 'auto' })
    return
  }
  const lenis = getLenis()
  if (lenis) {
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
