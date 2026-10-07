import { useState } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { Header } from './components/Header'
import { HeroVisual } from './components/HeroVisual'
import { ProblemSection } from './components/ProblemSection'
import { IdentitySection } from './components/IdentitySection'
import { ModesSection } from './components/ModesSection'
import { WorkflowSection } from './components/WorkflowSection'
import { BenchmarkSection } from './components/BenchmarkSection'
// Private launch: architecture stays out of the public page for now.
// import { ArchitectureSection } from './components/ArchitectureSection'
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
            {/* The brand in the page's first line of text — a crawler used to meet
                "skelpr" for the first time in the lede. One word, no layout change. */}
            <div className="eyebrow"><span className="status-dot" /> Skelpr — code intelligence for agents</div>
            <h1>Don’t give an agent the whole repo.<br /><em>Give it the right code.</em></h1>
            <p className="hero-lede">Skelpr finds the right code for AI agents, PR reviews, and fixes — grounded in syntax-aware context and precise <code>file:line</code> citations.</p>
            <div className="hero-actions">
              <a className="button primary" href="#workflow">Explore skelpr <ArrowDown size={16} /></a>
              <a className="button text-button" href="#benchmark">See the benchmark <ArrowRight size={16} /></a>
            </div>
            <div className="hero-proof">
              <span><strong>-59%</strong> agent tokens</span>
              <span><strong>-76%</strong> files opened</span>
              <span><strong>-69%</strong> cache-read tokens</span>
            </div>
            <p className="hero-boundary">Skelpr retrieves and cites — your agent still does the reasoning.<br />It speaks MCP (Model Context Protocol), so agents such as Claude Code, Cursor and Antigravity can call it as they are.</p>
          </div>
          <HeroVisual />
        </section>

        <div className="signal-strip"><span>REPOSITORY UNDERSTANDING</span><span className="signal-line" /><span>RETRIEVAL ≠ REASONING</span><span className="signal-line" /><span>EVERY CLAIM HAS A LOCATION</span></div>

        <ProblemSection open={isDetailed('problem')} onToggle={() => toggleDetails('problem')} />
        <RealWorldSection />
        <IdentitySection open={isDetailed('product')} onToggle={() => toggleDetails('product')} />
        <ModesSection open={isDetailed('modes')} onToggle={() => toggleDetails('modes')} />
        <WorkflowSection open={isDetailed('workflow')} onToggle={() => toggleDetails('workflow')} />
        <BenchmarkSection />
        {/* Private launch: section parked — see the import note above. */}
        {/* <ArchitectureSection open={isDetailed('architecture')} onToggle={() => toggleDetails('architecture')} /> */}
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
