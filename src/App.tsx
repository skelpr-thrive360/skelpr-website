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
import { WhySection } from './components/WhySection'
import { Footer, InstallSection, WaitlistSection } from './components/WaitlistInstall'
import { scrollToSection, WaitlistForm } from './components/Shared'

function App() {
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
      <div className="noise" aria-hidden="true" />
      <Header />

      <main id="top">
        <section className="hero section-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="status-dot" /> Code intelligence for agents</div>
            <h1>Don’t give an agent the whole repo.<br /><em>Give it the right code.</em></h1>
            <p className="hero-lede">LoCoDex is surgical code retrieval for AI agents, PR reviews, and fixes — grounded in AST-aware context and precise <code>file:line</code> citations.</p>
            <div className="hero-actions">
              <button className="button primary" onClick={() => scrollToSection('workflow')}>Explore LoCoDex <ArrowDown size={16} /></button>
              <button className="button text-button" onClick={() => scrollToSection('benchmark')}>See the benchmark <ArrowRight size={16} /></button>
            </div>
            <WaitlistForm compact />
            <div className="hero-proof">
              <span><strong>-48%</strong> agent tokens</span>
              <span><strong>-42%</strong> wall-clock</span>
              <span><strong>+16</strong> accuracy points<sup>*</sup></span>
            </div>
          </div>
          <HeroVisual />
        </section>

        <div className="signal-strip"><span>REPOSITORY UNDERSTANDING</span><span className="signal-line" /><span>RETRIEVAL ≠ REASONING</span><span className="signal-line" /><span>EVERY CLAIM HAS A LOCATION</span></div>

        <ProblemSection open={isDetailed('problem')} onToggle={() => toggleDetails('problem')} />
        <IdentitySection open={isDetailed('product')} onToggle={() => toggleDetails('product')} />
        <ModesSection open={isDetailed('modes')} onToggle={() => toggleDetails('modes')} />
        <WorkflowSection open={isDetailed('workflow')} onToggle={() => toggleDetails('workflow')} />
        <BenchmarkSection />
        <ArchitectureSection open={isDetailed('architecture')} onToggle={() => toggleDetails('architecture')} />
        <RealWorldSection />
        <WhySection />
        <InstallSection />
        <WaitlistSection />
      </main>

      <Footer />
    </div>
  )
}

export default App
