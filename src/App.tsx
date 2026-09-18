import { useState } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { Header } from './components/Header'
import { HeroVisual } from './components/HeroVisual'
import { ProblemSection } from './components/ProblemSection'
import { IdentitySection } from './components/IdentitySection'
import { ModesSection } from './components/ModesSection'
import { WorkflowSection } from './components/WorkflowSection'
import { BenchmarkSection } from './components/BenchmarkSection'
import { ArchitectureSection } from './components/ArchitectureSection'
import { RealWorldSection } from './components/RealWorldSection'
import { Footer, InstallSection, WaitlistSection } from './components/WaitlistInstall'
import { useScrollReveal } from './hooks/useScrollReveal'
import { useHashScroll } from './hooks/useHashScroll'
import { useSectionSpy } from './hooks/useSectionSpy'
import { useThemeEffect } from './lib/theme'

function App() {
  useScrollReveal()
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
            <div className="eyebrow"><span className="status-dot" /> Code intelligence for agents</div>
            <h1>Don’t give an agent the whole repo.<br /><em>Give it the right code.</em></h1>
            <p className="hero-lede">LoCoDex finds the right code for AI agents, PR reviews, and fixes — grounded in syntax-aware context and precise <code>file:line</code> citations.</p>
            <div className="hero-actions">
              <a className="button primary" href="#workflow">Explore LoCoDex <ArrowDown size={16} /></a>
              <a className="button text-button" href="#benchmark">See the benchmark <ArrowRight size={16} /></a>
            </div>
            <div className="hero-proof">
              <span><strong>-48%</strong> agent tokens</span>
              <span><strong>-42%</strong> wall-clock</span>
              <span><strong>114 → 34</strong> files opened</span>
            </div>
            <p className="hero-boundary">LoCoDex retrieves and cites — your agent still does the reasoning.<br />It speaks MCP (Model Context Protocol), so Claude Code, Cursor and Windsurf can call it as they are.</p>
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
        <ArchitectureSection open={isDetailed('architecture')} onToggle={() => toggleDetails('architecture')} />
        <InstallSection />
        <WaitlistSection />
      </main>

      <Footer />
    </div>
  )
}

export default App
