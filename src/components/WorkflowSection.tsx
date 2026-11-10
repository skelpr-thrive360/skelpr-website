import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { workflowSteps } from '../data/siteData'

export function WorkflowSection() {
  const [step, setStep] = useState(0)
  const current = workflowSteps[step]
  const choose = (index: number) => {
    setStep(index)
    const tab = document.getElementById(`workflow-tab-${workflowSteps[index].id}`)
    const strip = tab?.parentElement
    if (tab && strip && strip.scrollWidth > strip.clientWidth) {
      const tabBounds = tab.getBoundingClientRect()
      const stripBounds = strip.getBoundingClientRect()
      if (tabBounds.left < stripBounds.left) {
        strip.scrollLeft += tabBounds.left - stripBounds.left
      } else if (tabBounds.right > stripBounds.right) {
        strip.scrollLeft += tabBounds.right - stripBounds.right
      }
    }
  }
  return (
    <section className="workflow-section content-section" id="workflow">
      <div className="workflow-heading">
        <div>
          <div className="section-kicker">How it works</div>
          <h2>From question to source evidence</h2>
        </div>
        <p>The agent sends a question through MCP and receives source excerpts with <code>file:line</code> ranges. It uses that evidence to answer or edit. If context is missing, it can request more.</p>
      </div>
      <div className="ownership-legend"><span><i className="legend-agent" /> Your agent: question, answer and edits</span><span><i className="legend-skelpr" /> Skelpr: evidence and configured checks</span></div>
      <div className="workflow-shell">
        <div className="workflow-steps" role="tablist" aria-label="MCP workflow steps">
          {workflowSteps.map((item, index) => (
            <button type="button" key={item.id} id={`workflow-tab-${item.id}`} className={`workflow-step ${step === index ? 'active' : ''}`} role="tab" aria-selected={step === index} aria-controls="workflow-panel" tabIndex={step === index ? 0 : -1} onClick={() => choose(index)} onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? workflowSteps.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + workflowSteps.length) % workflowSteps.length
              choose(next)
              document.getElementById(`workflow-tab-${workflowSteps[next].id}`)?.focus({ preventScroll: true })
            }}><span className="step-index">0{index + 1} · {item.owner === 'agent' ? 'Agent' : 'Skelpr'}</span><strong>{item.label}</strong></button>
          ))}
        </div>
        <div className="workflow-detail" id="workflow-panel" role="tabpanel" aria-labelledby={`workflow-tab-${current.id}`} tabIndex={0}>
          <div className="workflow-terminal"><div className="terminal-top"><span>ILLUSTRATIVE WORKFLOW</span><span>{step + 1} / {workflowSteps.length}</span></div><div className="terminal-body"><code>{current.example}</code></div><div className="terminal-source">{current.note}</div></div>
          <div className="workflow-explanation"><span className={`owner-tag ${current.owner}`}>{current.owner === 'agent' ? 'Your coding agent' : 'Skelpr'}</span><h3>{current.title}</h3><p>{current.description}</p><div className="workflow-nav"><button type="button" disabled={step === 0} onClick={() => choose(step - 1)}><ArrowLeft size={14} /> Previous</button><button type="button" disabled={step === workflowSteps.length - 1} onClick={() => choose(step + 1)}>Next <ArrowRight size={14} /></button></div></div>
        </div>
      </div>
      <div className="tool-row">
        <span>MCP tools</span>
        <code>skelpr_search</code>
        <code>skelpr_get_context</code>
        <code>skelpr_find_symbol</code>
        <code>skelpr_dependencies</code>
        <code>skelpr_validate</code>
        <code>skelpr_health</code>
        <code>skelpr_apply_ast_patch</code>
      </div>
    </section>
  )
}
