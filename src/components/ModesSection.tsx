import { useState } from 'react'
import { modeOptions, modesDetail } from '../data/siteData'
import type { Mode } from '../data/siteData'
import { DetailButton, SectionDetail } from './Shared'

export function ModesSection({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [mode, setMode] = useState<Mode>('agent')
  const current = modeOptions.find((option) => option.value === mode) ?? modeOptions[0]
  return (
    <section className="modes-section content-section" id="modes">
      <div className="section-kicker">Two integration modes</div>
      <div className="two-column-heading"><h2>One retrieval engine.<br /><em>Two ways to use it.</em></h2><p>Use the standalone workflow when LoCoDex should run end to end. Use Agent Integration when an existing coding agent should bring its own reasoning.</p></div>
      <div className="mode-switcher" role="tablist" aria-label="LoCoDex integration modes">
        {modeOptions.map((option) => (
          <button key={option.value} className={mode === option.value ? 'active' : ''} onClick={() => setMode(option.value)} role="tab" aria-selected={mode === option.value}>
            <span>{option.chip}</span> {option.title} <small>{option.sub}</small>
          </button>
        ))}
      </div>
      <div className="mode-panel"><div className="mode-panel-heading"><div><span className="mode-number">{current.chip}</span><h3>{current.heading}</h3></div><span className="mode-chip">{current.panelChip}</span></div><p>{current.body}</p><div className="mode-facts"><div><span>LLM needed</span><strong>{current.llm}</strong></div><div><span>Retrieval</span><strong>LoCoDex hybrid engine</strong></div><div><span>Reasoning</span><strong>{current.reasoning}</strong></div><div><span>Best for</span><strong>{current.bestFor}</strong></div></div><DetailButton open={open} onClick={onToggle} /><SectionDetail open={open}><div className="section-detail"><span className="detail-label">OPERATING TERMINOLOGY</span><p>{modesDetail}</p></div></SectionDetail></div>
    </section>
  )
}
