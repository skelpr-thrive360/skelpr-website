import { useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { useActiveSection } from '../hooks/useSectionSpy'
import { useScrolled } from '../hooks/useScrolled'

// The nav is a list of anchors, not buttons: the link, the hash it writes and
// the active state all then name the same section, so the URL and the highlight
// can never disagree with where the reader is.
const navItems = [
  { id: 'workflow', label: 'How it works' },
  { id: 'benchmark', label: 'Benchmark' },
  { id: 'architecture', label: 'Architecture' },
] as const

export function Header() {
  const [mobileNav, setMobileNav] = useState(false)
  const scrolled = useScrolled()
  const active = useActiveSection()
  const closeNav = () => setMobileNav(false)
  return (
    <header className={scrolled ? 'site-header is-scrolled' : 'site-header'}>
      <a className="brand" href="#top" aria-label="LoCoDex home">
        <BrandMark />
        <span>LoCoDex</span>
      </a>
      <nav className={mobileNav ? 'main-nav open' : 'main-nav'} aria-label="Primary navigation">
        {navItems.map((item) => (
          <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? 'location' : undefined} onClick={closeNav}>{item.label}</a>
        ))}
        {/* GitHub link temporarily disabled: <a href="https://github.com/locodex-thrive360/LoCoDex" target="_blank" rel="noreferrer">GitHub <ExternalLink size={13} /></a> */}
      </nav>
      <div className="header-actions">
        <button className="menu-button" onClick={() => setMobileNav(!mobileNav)} aria-label={mobileNav ? 'Close menu' : 'Open menu'}>
          {mobileNav ? <X size={20} /> : <Menu size={20} />}
        </button>
        <a className="nav-waitlist" href="#waitlist">Join waitlist</a>
        <a className="header-cta" href="#install">Get started <ArrowRight size={15} /></a>
      </div>
    </header>
  )
}
