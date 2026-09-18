import { useState } from 'react'
import { ArrowRight, Check, ChevronDown, UserX } from 'lucide-react'

/**
 * Offset-aware smooth scroll: clears the sticky header, and skips easing for
 * visitors who asked for reduced motion.
 */
export function scrollToElement(target: HTMLElement, offset = 16) {
  const header = document.querySelector<HTMLElement>('.site-header')
  const headerHeight = header?.offsetHeight ?? 72
  const top = Math.max(target.getBoundingClientRect().top + window.scrollY - headerHeight - offset, 0)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Easing is a nice touch between neighbouring blocks and a long ride across a
  // page this tall — the footer nav sits ~15,000px below what it links to. Past
  // two viewports the jump is instant, which also reads as deliberate rather
  // than as a scroll that has stalled.
  const far = Math.abs(top - window.scrollY) > window.innerHeight * 2
  window.scrollTo({ top, behavior: reduced || far ? 'auto' : 'smooth' })
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
 */
export function WaitlistForm({ compact = false }: { compact?: boolean }) {
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
      <div className={`waitlist-success ${compact ? 'compact' : ''}`} role="status">
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
    <form className={`waitlist-form ${compact ? 'compact' : ''}`} onSubmit={handleSubmit} noValidate>
      <div className="waitlist-input-wrap">
        <label htmlFor={compact ? 'hero-email' : 'waitlist-email'}>Email address</label>
        <input id={compact ? 'hero-email' : 'waitlist-email'} type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="you@company.com" aria-invalid={Boolean(error)} aria-describedby={error ? `${compact ? 'hero' : 'waitlist'}-email-error` : undefined} />
        {error && <span className="waitlist-error" id={`${compact ? 'hero' : 'waitlist'}-email-error`}>{error}</span>}
      </div>
      <button className="button waitlist-button" type="submit" disabled={pending}>{pending ? 'Joining…' : 'Join the waitlist'} <ArrowRight size={14} /></button>
      <input className="waitlist-hp" type="text" name="company_website" value={trap} onChange={(event) => setTrap(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" />
    </form>
  )
}
