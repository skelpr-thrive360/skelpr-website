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
      <div className="two-column-heading"><h2>Connect your agent or use the CLI</h2><p>Both modes use the indexed repository. MCP supplies evidence to your coding agent. The CLI uses a generation model you configure.</p></div>
      <div className="mode-switcher" role="tablist" aria-label="skelpr integration modes">
        {modeOptions.map((option, index) => (
          <button key={option.value} id={`mode-tab-${option.value}`} className={mode === option.value ? 'active' : ''} onClick={() => setMode(option.value)} role="tab" aria-selected={mode === option.value} aria-controls="mode-panel" tabIndex={mode === option.value ? 0 : -1} onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
            event.preventDefault()
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? modeOptions.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + modeOptions.length) % modeOptions.length
            setMode(modeOptions[next].value)
            document.getElementById(`mode-tab-${modeOptions[next].value}`)?.focus()
          }}>
            <span>{option.chip}</span> {option.title} <small>{option.sub}</small>
          </button>
        ))}
      </div>
      <div className="mode-panel" id="mode-panel" role="tabpanel" aria-labelledby={`mode-tab-${mode}`} tabIndex={0}><div className="mode-panel-heading"><div><span className="mode-number">{current.chip}</span><h3>{current.heading}</h3></div><span className="mode-chip">{current.panelChip}</span></div><p>{current.body}</p><div className="mode-facts"><div><span>Generation model</span><strong>{current.llm}</strong></div><div><span>Repository evidence</span><strong>Skelpr</strong></div><div><span>Reasoning</span><strong>{current.reasoning}</strong></div><div><span>Use case</span><strong>{current.bestFor}</strong></div></div><DetailButton open={open} onClick={onToggle} /><SectionDetail open={open}><div className="section-detail"><span className="detail-label">PROVIDERS AND PERMISSIONS</span><p>{modesDetail}</p></div></SectionDetail></div>
    </section>
  )
}
