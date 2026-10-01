import { useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './ThemeToggle'
import { useActiveSection } from '../hooks/useSectionSpy'
import { useScrolled } from '../hooks/useScrolled'
import { navItems } from '../lib/navItems'

// The nav is a list of anchors, not buttons: the link, the hash it writes and
// the active state all then name the same section, so the URL and the highlight
// can never disagree with where the reader is. The list itself is shared with
// the docs header, which points the same items at this page.

export function Header() {
  const [mobileNav, setMobileNav] = useState(false)
  const scrolled = useScrolled()
  const active = useActiveSection()
  const closeNav = () => setMobileNav(false)
  return (
    <header className={scrolled ? 'site-header is-scrolled' : 'site-header'}>
      <a className="brand" href="#top" aria-label="skelpr home">
        <BrandMark />
        <span>skelpr</span>
      </a>
      <nav className={mobileNav ? 'main-nav open' : 'main-nav'} aria-label="Primary navigation">
        {navItems.map((item) => (
          <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? 'location' : undefined} onClick={closeNav}>{item.label}</a>
        ))}
        {/* A page, not a section: /docs is its own document, so unlike the three
            above it takes no active state and never appears in the section spy. */}
        <a href="/docs" onClick={closeNav}>Docs</a>
        {/* The header's waitlist CTA is hidden at phone widths, where the hamburger
            took the free space — and the hero used to carry a second copy of the
            form, so a phone had a route to it above the fold and a desktop had two.
            One conversion point per width: the drawer carries the link here, the
            header carries it there, and the hero carries none. */}
        <a className="nav-join" href="#waitlist" onClick={closeNav}>Join waitlist</a>
        {/* GitHub link temporarily disabled: <a href="https://github.com/skelpr-thrive360/skelpr" target="_blank" rel="noreferrer">GitHub <ExternalLink size={13} /></a> */}
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        <button className="menu-button" onClick={() => setMobileNav(!mobileNav)} aria-label={mobileNav ? 'Close menu' : 'Open menu'}>
          {mobileNav ? <X size={20} /> : <Menu size={20} />}
        </button>
        <a className="nav-waitlist" href="#waitlist">Join waitlist</a>
        <a className="header-cta" href="#install">Get started <ArrowRight size={15} /></a>
      </div>
      {/* Decorative: the rail reports scroll position, which a screen reader
          already gets from the document itself. */}
      <div className="read-rail" aria-hidden="true"><span /></div>
    </header>
  )
}
