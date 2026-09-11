import { DetailButton } from './Shared'

export function IdentitySection({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <section className="identity-section content-section section-grid" id="product">
      <div className="section-kicker">02 — What is LoCoDex?</div>
      <div className="identity-layout"><div><h2>A surgical librarian<br />for <em>code intelligence.</em></h2><p>LoCoDex indexes a repository, understands its symbols and relationships, and returns only the code context an agent needs to answer, review, patch, or validate.</p><div className="inline-callout"><span className="callout-line" /><span>Every output includes precise <code>path:line</code> evidence.</span></div><DetailButton open={open} onClick={onToggle} />{open && <div className="section-detail"><span className="detail-label">IMPLEMENTATION DETAIL</span><p><code>Engine.retrieve_context()</code> is the shared context retrieval method used by MCP, CLI, and integrations. It performs retrieval without invoking an LLM.</p></div>}</div><div className="identity-specs"><div><span className="spec-index">A</span><div><strong>Index once</strong><p>Repository files, symbols, imports, chunks, and embeddings become a working knowledge base.</p></div></div><div><span className="spec-index">B</span><div><strong>Retrieve selectively</strong><p>Lexical, symbol, graph, and vector signals are fused deterministically.</p></div></div><div><span className="spec-index">C</span><div><strong>Act carefully</strong><p>Patch generation and validation preserve a path from evidence to verification.</p></div></div></div></div>
    </section>
  )
}
