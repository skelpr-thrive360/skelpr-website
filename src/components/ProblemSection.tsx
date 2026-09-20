import { ArrowRight } from 'lucide-react'
import { DetailButton, SectionDetail } from './Shared'

export function ProblemSection({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <section className="problem-section content-section" id="problem">
      <div className="section-kicker">The problem</div>
      <div className="two-column-heading"><h2>Finding a file is easy.<br /><em>Understanding a codebase is not.</em></h2><div><p>Agents can search. The hard part is knowing which files matter, how symbols connect, and whether an answer is grounded in what the repository actually contains.</p><DetailButton open={open} onClick={onToggle} /><SectionDetail open={open}><div className="section-detail"><span className="detail-label">TECHNICAL DETAIL</span><p>LoCoDex addresses context selection, not the agent’s reasoning. It provides ranked, token-efficient evidence through the same retrieval path across CLI and MCP integrations.</p></div></SectionDetail></div></div>
      <div className="comparison-visual">
        <div className="comparison-side noisy-side"><div className="compare-label"><span className="compare-mark bad">×</span> Native browsing</div><div className="file-stack"><span>README.md</span><span>deploy/...</span><span>src/index.ts</span><span>tests/...</span><span>config.yaml</span><span>... + 113 files opened</span></div><div className="compare-caption">Repeated reads. Re-sent context. More places to lose the thread.</div></div>
        <div className="comparison-divider"><ArrowRight size={18} /></div>
        <div className="comparison-side precise-side"><div className="compare-label"><span className="compare-mark good">✓</span> LoCoDex retrieval</div><div className="citation-stack"><span><b>[SYMBOL]</b> locodex/engine.py:354-379</span><span><b>[GRAPH]</b> .locodex/graphify/summary.txt:1-2</span><span><b>[LEXICAL]</b> retrieval/hybrid_retriever.py:1-12</span></div><div className="compare-caption">A small, ranked context package with citations the agent can inspect.</div></div>
      </div>
    </section>
  )
}
