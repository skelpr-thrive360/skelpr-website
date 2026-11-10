import { ArrowRight } from 'lucide-react'
import { DetailButton, SectionDetail } from './Shared'

export function ProblemSection({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <section className="problem-section content-section" id="problem">
      <div className="section-kicker">The problem</div>
      <div className="two-column-heading"><h2>Repeated reads<br /><em>add context.</em></h2><div><p>Cross-file questions can send an agent through several searches and file reads. Skelpr gathers related excerpts into a bounded response with source locations.</p><DetailButton open={open} onClick={onToggle} /><SectionDetail open={open}><div className="section-detail"><span className="detail-label">WHEN IT HELPS</span><p>Measure the full task, including fallback reads. A direct file lookup can be cheaper for a simple question; retrieval helps when it replaces several searches.</p></div></SectionDetail></div></div>
      <div className="comparison-visual">
        <div className="comparison-side noisy-side"><div className="compare-label">Search and read</div><div className="file-stack"><span>Search for entry point</span><span>Read handler</span><span>Find callers</span><span>Read related tests</span></div><div className="compare-caption">Illustrative workflow: each step can add another tool result.</div></div>
        <div className="comparison-divider"><ArrowRight size={18} /></div>
        <div className="comparison-side precise-side"><div className="compare-label">Skelpr response</div><div className="citation-stack"><span>Relevant source excerpts</span><span>File paths and line ranges</span><span>Coverage and omission notes</span></div><div className="compare-caption">One budgeted response. Follow up where evidence is incomplete.</div></div>
      </div>
    </section>
  )
}
