import { useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { scrollToSection } from './Shared'
import { useScrolled } from '../hooks/useScrolled'

export function Header() {
  const [mobileNav, setMobileNav] = useState(false)
  const scrolled = useScrolled()
  const go = (id: string) => {
    scrollToSection(id)
    setMobileNav(false)
  }
  return (
    <header className={scrolled ? 'site-header is-scrolled' : 'site-header'}>
      <a className="brand" href="#top" aria-label="LoCoDex home">
        <span className="brand-mark"><span /><span /><span /></span>
        <span>LoCoDex</span>
      </a>
      <nav className={mobileNav ? 'main-nav open' : 'main-nav'} aria-label="Primary navigation">
        <button onClick={() => go('workflow')}>How it works</button>
        <button onClick={() => go('benchmark')}>Benchmark</button>
        <button onClick={() => go('architecture')}>Architecture</button>
        {/* GitHub link temporarily disabled: <a href="https://github.com/locodex-thrive360/LoCoDex" target="_blank" rel="noreferrer">GitHub <ExternalLink size={13} /></a> */}
      </nav>
      <div className="header-actions">
        <button className="menu-button" onClick={() => setMobileNav(!mobileNav)} aria-label={mobileNav ? 'Close menu' : 'Open menu'}>
          {mobileNav ? <X size={20} /> : <Menu size={20} />}
        </button>
        <a className="nav-waitlist" href="#waitlist">Join waitlist</a>
        <button className="header-cta" onClick={() => go('install')}>Get started <ArrowRight size={15} /></button>
      </div>
    </header>
  )
}
