import { useState, type ReactNode } from 'react'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'

/** Document-space position, independent of transforms. */
export function documentTop(element: HTMLElement) {
  let top = 0
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
    top += node.offsetTop
  }
  return top
}

/**
 * The scroll position that puts `target` just clear of the sticky header.
 *
 * Split out from the scrolling itself because the position is also worth *asking
 * about*: a caller that has to know whether the page actually arrived (rather than
 * merely glide and hope) needs the number without triggering a scroll.
 */
export function landingTop(target: HTMLElement, offset = 16) {
  const header = document.querySelector<HTMLElement>('.site-header')
  const headerHeight = header?.offsetHeight ?? 72
  return Math.max(documentTop(target) - headerHeight - offset, 0)
}

/**
 * The element a jump to section `id` should aim at, or null if there is no such
 * section. The section's first block, not the section box — a section carries a
 * large padding-top so it breathes while you scroll past it, and honouring that on
 * a jump drops the kicker a whole section-padding below the header, which reads as
 * landing somewhere else.
 */
export function sectionTarget(id: string): HTMLElement | null {
  const target = document.getElementById(id)
  if (!target) return null
  const first = target.firstElementChild
  return first instanceof HTMLElement ? first : target
}

export function scrollToElement(target: HTMLElement, offset = 16) {
  const top = landingTop(target, offset)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    window.scrollTo({ top, behavior: 'auto' })
    return
  }
  window.scrollTo({ top, behavior: 'smooth' })
}

/** Jump to a section by id — see `sectionTarget` for what gets aimed at. */
export function scrollToSection(id: string) {
  const target = sectionTarget(id)
  if (target) scrollToElement(target)
}

export function DetailButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return <button className="detail-button" onClick={onClick} aria-expanded={open}><span>{open ? 'Hide technical details' : 'View technical details'}</span><ChevronDown size={14} className={open ? 'rotate' : ''} /></button>
}

export function SectionDetail({ open, children }: { open: boolean; children: ReactNode }) {
  return <div className="detail-motion" hidden={!open} inert={!open}>{children}</div>
}

// `withoutPct`/`withPct` optionally draw the paired bars from the benchmark table
// at card scale: same track, same two inks (grey WITHOUT over green WITH), widths as
// a percentage of the pair's max so every card shares one scale. They are redundant
// with the printed numbers by design — decoration that echoes the table's encoding,
// hence aria-hidden. Omit them and the card renders exactly as before.
export function Metric({ label, simple, without, withValue, change, withoutPct, withPct }: { label: string; simple: string; without: string; withValue: string; change: string; withoutPct?: number; withPct?: number }) {
  return <div className="metric-card"><span className="metric-label">{label}</span><span className="metric-simple">{simple}</span><div className="metric-values"><div><small>Native tools</small><strong>{without}</strong></div><div className="metric-arrow" aria-hidden="true">→</div><div className="with-value"><small>With Skelpr</small><strong>{withValue}</strong></div></div>{withoutPct !== undefined && withPct !== undefined && <div className="metric-bars" aria-hidden="true"><span className="metric-bar"><i style={{ width: `${withoutPct}%` }} /><i className="with-bar" style={{ width: `${withPct}%` }} /></span></div>}<span className="metric-change">{change}</span></div>
}

// Extra payload handed to onSubmit: honeypot value (bots that fill it are dropped server-side).
export type WaitlistSubmitDetails = { trap: string }

type WaitlistPhase =
  | { kind: 'form' }
  | { kind: 'joined' }

/**
 * Self-contained waitlist form: join → "you're on the list". The message is the same
 * for new and repeat emails so the form never reveals who is already signed up. Withdrawals are handled by hand (theskelpr@gmail.com): the public
 * form cannot prove that the person asking owns the address.
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    setPending(true)
    const { submitWaitlistEmail } = await import('../lib/waitlist')
    const result = await submitWaitlistEmail(email, { trap })
    setPending(false)
    if (result.ok) {
      setError('')
      if (result.stub) {
        setError('Email updates are not configured here. Nothing was sent. Use the access email link to contact us.')
      } else {
        setPhase({ kind: 'joined' })
      }
    } else {
      setError(result.error)
    }
  }

  if (phase.kind === 'joined') {
    return (
      <div className="waitlist-success" role="status">
        <span><Check size={15} /></span>
        <div>
          <strong>You’re on the list.</strong>
          <small>Thanks — we’ll share updates when there’s news.</small>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="waitlist-privacy" id="waitlist-privacy">
        We’ll use your email for release updates. <a href="/privacy/">Privacy notice</a>
      </p>
      <form className="waitlist-form" onSubmit={handleSubmit} noValidate>
        <div className="waitlist-input-wrap">
          <label htmlFor="waitlist-email">Email address</label>
          <input id="waitlist-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="you@company.com" aria-invalid={Boolean(error)} aria-describedby={error ? 'waitlist-privacy waitlist-email-error' : 'waitlist-privacy'} />
          {error && <span className="waitlist-error" id="waitlist-email-error">{error}</span>}
        </div>
        <button className="button waitlist-button" type="submit" disabled={pending}>{pending ? 'Joining…' : 'Join the waitlist'} <ArrowRight size={14} /></button>
        <input className="waitlist-hp" type="text" name="company_website" value={trap} onChange={(event) => setTrap(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" />
      </form>
    </div>
  )
}
