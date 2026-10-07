import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Circle, Pause, Play, RotateCcw } from 'lucide-react'
import { workflowSteps } from '../data/siteData'
import { DetailButton, SectionDetail } from './Shared'

export function WorkflowSection({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [activeWorkflow, setActiveWorkflow] = useState(0)
  // Visitor-driven, like the hero walkthrough: the steps only move when the
  // visitor plays them. Autoplaying under someone who is reading the
  // explanation is the one thing this page should not do.
  const [isPlaying, setIsPlaying] = useState(false)
  const [inView, setInView] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  // Autoplay only while the walkthrough is actually on screen.
  useEffect(() => {
    const node = sectionRef.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isPlaying || !inView) return
    const timer = window.setInterval(() => {
      setActiveWorkflow((current) => (current + 1) % workflowSteps.length)
    }, 3400)
    return () => window.clearInterval(timer)
  }, [isPlaying, inView])

  const currentWorkflow = workflowSteps[activeWorkflow]
  // Unitless fraction: the bar scales instead of animating its width.
  const workflowProgress = useMemo(() => String((activeWorkflow + 1) / workflowSteps.length), [activeWorkflow])

  return (
    <section className="workflow-section content-section" id="workflow" ref={sectionRef}>
      <div className="section-kicker">MCP Agent deep dive</div>
      <div className="workflow-heading">
        <div><h2>A live path from <em>question</em><br />to cited context.</h2></div>
        <div>
          <p>The MCP Agent integration is not a search box. It is a boundary between an agent’s reasoning and a repository’s evidence.</p>
          <div className="ownership-legend"><span><i className="legend-agent" /> External agent owns</span><span><i className="legend-skelpr" /> skelpr owns</span></div>
        </div>
      </div>
      <div className="workflow-shell">
        <div className="workflow-progress" style={{ '--progress': workflowProgress } as React.CSSProperties} />
        <div className="workflow-controls">
          <span className="control-status">{isPlaying && inView ? 'PLAYING' : 'SELECT A STEP'}</span>
          <button onClick={() => setIsPlaying(!isPlaying)} aria-label={isPlaying ? 'Pause workflow autoplay' : 'Play workflow autoplay'}>{isPlaying ? <Pause size={13} /> : <Play size={13} />}{isPlaying ? 'Pause' : 'Play'}</button>
          <button onClick={() => setActiveWorkflow((activeWorkflow + 1) % workflowSteps.length)} aria-label="Go to next workflow step"><ArrowRight size={13} /> Step</button>
          <button onClick={() => { setActiveWorkflow(0); setIsPlaying(true) }} aria-label="Replay workflow"><RotateCcw size={13} /> Replay</button>
          <span className="scroll-cue">swipe for all six steps →</span>
        </div>
        <div className="workflow-steps" role="tablist" aria-label="MCP Agent workflow steps">
          {workflowSteps.map((step, index) => (
            <button key={step.id} className={`workflow-step ${activeWorkflow === index ? 'active' : ''} ${step.owner}`} onClick={() => { setActiveWorkflow(index); setIsPlaying(false) }} role="tab" aria-selected={activeWorkflow === index} id={'workflow-tab-' + step.id} aria-controls="workflow-panel">
              <span className="step-index">0{index + 1}</span>
              <span>{step.label}</span>
              {index < workflowSteps.length - 1 && <ArrowRight size={14} />}
            </button>
          ))}
        </div>
        <div
          className="workflow-detail"
          id="workflow-panel"
          role="tabpanel"
          aria-labelledby={`workflow-tab-${workflowSteps[activeWorkflow].id}`}
        >
          <div className={`workflow-terminal accent-${currentWorkflow.accent}`}>
            <div className="terminal-top"><span><Circle size={7} fill="currentColor" /> workflow.trace</span><span>step {String(activeWorkflow + 1).padStart(2, '0')} / 06</span></div>
            <div className="terminal-body"><span className="terminal-prompt">$</span><strong>{currentWorkflow.code}</strong><span className="terminal-cursor" /></div>
            <div className="terminal-source">source · {currentWorkflow.owner === 'agent' ? 'external agent' : 'skelpr core'}</div>
          </div>
          <div className="workflow-explanation">
            <span className={`owner-tag ${currentWorkflow.owner}`}>{currentWorkflow.owner === 'agent' ? 'EXTERNAL AGENT' : 'SKELPR CORE'}</span>
            <h3>{currentWorkflow.label}</h3>
            <p>{currentWorkflow.simple}</p>
            <DetailButton open={open} onClick={onToggle} />
            <SectionDetail open={open}><div className="section-detail"><span className="detail-label">PIPELINE DETAIL</span><p>{currentWorkflow.technical}</p></div></SectionDetail>
            <div className="workflow-nav">
              <button disabled={activeWorkflow === 0} onClick={() => { setActiveWorkflow(Math.max(0, activeWorkflow - 1)); setIsPlaying(false) }}>← Previous</button>
              <button disabled={activeWorkflow === workflowSteps.length - 1} onClick={() => { setActiveWorkflow(Math.min(workflowSteps.length - 1, activeWorkflow + 1)); setIsPlaying(false) }}>Next step →</button>
            </div>
          </div>
        </div>
      </div>
      <div className="tool-row"><span>MCP Agent exposes</span><code>skelpr_search</code><code>skelpr_get_context</code><code>skelpr_find_symbol</code><code>skelpr_dependencies</code><code>skelpr_validate</code><code>skelpr_health</code><code>skelpr_apply_ast_patch</code></div>
    </section>
  )
}
