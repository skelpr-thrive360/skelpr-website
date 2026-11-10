import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Header } from './components/Header'
import { HeroVisual } from './components/HeroVisual'
import { ProblemSection } from './components/ProblemSection'
import { IdentitySection } from './components/IdentitySection'
import { ModesSection } from './components/ModesSection'
import { WorkflowSection } from './components/WorkflowSection'
import { BenchmarkSection } from './components/BenchmarkSection'
import { RealWorldSection } from './components/RealWorldSection'
import { PrerequisitesSection } from './components/PrerequisitesSection'
import { FaqSection } from './components/FaqSection'
import { Footer, InstallSection, WaitlistSection } from './components/WaitlistInstall'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { useScrollChoreography } from './hooks/useScrollChoreography'
import { useHashScroll } from './hooks/useHashScroll'
import { useSectionSpy } from './hooks/useSectionSpy'
import { useThemeEffect } from './lib/theme'

function App() {
  useSmoothScroll()
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
      <Header />

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="status-dot" /> Skelpr · repository context over MCP and CLI</div>
            <h1>Repository evidence.<br /><em>Within a context budget.</em></h1>
            <p className="hero-lede">Give your coding agent relevant source excerpts with <code>file:line</code> ranges. Set context limits and reduce repeated searches across your repository.</p>
            <div className="hero-actions">
              <a className="button primary" href="/docs">Install and connect <ArrowRight size={16} /></a>
              <a className="button text-button" href="#benchmark">Compare case studies <ArrowRight size={16} /></a>
            </div>
            <div className="hero-proof">
              <span><strong>37.27%</strong> fewer tokens on Django</span>
              <span><strong>28 → 9</strong> native search/read calls</span>
              <span><strong>89 → 91 / 96</strong> combined rubric score</span>
            </div>
            <p className="hero-boundary">Ten Django tasks with Codex, across successive builds tuned using those tasks. Observed results, not a general performance guarantee.</p>
            <p className="hero-boundary">Works with MCP clients such as Codex, Claude Code and Cursor. Your agent chooses when to call Skelpr and remains responsible for its answer.</p>
          </div>
          <HeroVisual />
        </section>

        <div className="signal-strip"><span>CONTEXT LIMITS</span><span className="signal-line" /><span>FILE:LINE EVIDENCE</span><span className="signal-line" /><span>MCP + CLI</span></div>

        <ProblemSection open={isDetailed('problem')} onToggle={() => toggleDetails('problem')} />
        <IdentitySection open={isDetailed('product')} onToggle={() => toggleDetails('product')} />
        <ModesSection open={isDetailed('modes')} onToggle={() => toggleDetails('modes')} />
        <WorkflowSection />
        <BenchmarkSection />
        <RealWorldSection />
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
