import { workflowSteps } from '../data/siteData'

/**
 * The MCP Agent pipeline, as a static strip.
 *
 * Deliberately not interactive any more. This is the least load-bearing section on
 * the page, and the autoplaying walkthrough it used to be — an IntersectionObserver,
 * a timer, a tablist, a terminal trace and a detail toggle — cost more to keep
 * honest than it earned. The step labels still come from the shared `workflowSteps`
 * data, so the pipeline tracks the code; only the presentation was cut back.
 *
 * `id="workflow"` has to stay: the hero's primary call to action and the primary
 * navigation both point at it.
 */
export function WorkflowSection() {
  return (
    <section className="workflow-section content-section" id="workflow">
      <div className="section-kicker">How it works</div>
      <div className="workflow-heading">
        <div><h2>A live path from <em>question</em><br />to cited context.</h2></div>
        <p>The MCP Agent integration is a boundary between an agent’s reasoning and a repository’s evidence. Your agent asks; skelpr retrieves, ranks and cites, and hands back a small package with <code>file:line</code> locations. It never does the reasoning.</p>
      </div>
      <div className="tool-row">
        <span>Pipeline</span>
        {workflowSteps.map((step) => <code key={step.id}>{step.label}</code>)}
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
