import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Header } from './components/Header'
import { HeroVisual } from './components/HeroVisual'
import { ProblemSection } from './components/ProblemSection'
import { IdentitySection } from './components/IdentitySection'
import { ModesSection } from './components/ModesSection'
import { WorkflowSection } from './components/WorkflowSection'
import { WorkflowMap } from './components/WorkflowMap'
import { BenchmarkSection } from './components/BenchmarkSection'
import { RealWorldSection } from './components/RealWorldSection'
import { PrerequisitesSection } from './components/PrerequisitesSection'
import { FaqSection } from './components/FaqSection'
import { Footer, InstallSection, WaitlistSection } from './components/WaitlistInstall'
import { useScrollChoreography } from './hooks/useScrollChoreography'
import { useHashScroll } from './hooks/useHashScroll'
import { useSectionSpy } from './hooks/useSectionSpy'
import { useThemeEffect } from './lib/theme'
import { djangoTotals, reduction } from './data/djangoCaseStudy'
import { sockShopTotals } from './data/siteData'

function App() {
  useScrollChoreography()
  useSectionSpy()
  useHashScroll()
  useThemeEffect()
  const [openDetails, setOpenDetails] = useState<Set<string>>(new Set())

  const toggleDetails = (section: string) => {
    setOpenDetails((current) => {
      const next = new Set(current)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }
  const isDetailed = (section: string) => openDetails.has(section)

  return (
    <div className="site-shell">
      {/* First in the tab order: bypass the header and its nav in one press. */}
      <a className="skip-link" href="#top">Skip to main content</a>
      <Header />

      <main id="top" tabIndex={-1}>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="status-dot" /> Skelpr · repository context over MCP and CLI</div>
            <h1>Repository context.<br />Within your token budget.</h1>
            <p className="hero-lede">Give your coding agent relevant source excerpts with <code>file:line</code> ranges. Set context limits and reduce repeated searches across your repository.</p>
            <div className="hero-actions">
              <a className="button primary" href="/docs">Install and connect <ArrowRight size={16} /></a>
              <a className="button text-button" href="#benchmark">Compare case studies <ArrowRight size={16} /></a>
            </div>
            <ul className="hero-proof" aria-label="Benchmark highlights">
              <li>
                <span className="hero-study-name">Sock Shop</span>
                <span className="hero-study-metric"><strong>{sockShopTotals.tokenReduction}</strong> fewer reported tokens</span>
                <span className="hero-study-detail">{sockShopTotals.filesOpened.join(' → ')} files opened</span>
                <span className="hero-study-detail">Gemini · Antigravity · 7 tasks</span>
              </li>
              <li>
                <span className="hero-study-name">Django</span>
                <span className="hero-study-metric"><strong>{reduction(djangoTotals.tokens)}%</strong> fewer total tokens</span>
                <span className="hero-study-detail">{djangoTotals.nativeReads.join(' → ')} native search/read calls</span>
                <span className="hero-study-detail">GPT-6 Astra · Codex · 10 tasks</span>
              </li>
            </ul>
            <p className="hero-boundary">Retained Sock Shop artifacts only partly reproduce the reported totals. Django results span builds tuned on those tasks.</p>
            <p className="hero-boundary">Works with MCP clients such as Codex, Claude Code and Cursor. Your agent chooses when to call Skelpr and remains responsible for its answer.</p>
          </div>
          <HeroVisual />
        </section>

        <ProblemSection open={isDetailed('problem')} onToggle={() => toggleDetails('problem')} />
        <IdentitySection open={isDetailed('product')} onToggle={() => toggleDetails('product')} />
        <ModesSection open={isDetailed('modes')} onToggle={() => toggleDetails('modes')} />
        <WorkflowSection />
        <BenchmarkSection />
        <RealWorldSection />
        <WorkflowMap />
        <PrerequisitesSection />
        <InstallSection />
        {/* Directly before the ask: what is still open, at the moment of deciding. */}
        <FaqSection />
        <WaitlistSection />
      </main>

      <Footer />
    </div>
  )
}

export default App
