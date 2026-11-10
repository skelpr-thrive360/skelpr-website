import { DetailButton, SectionDetail } from './Shared'

export function IdentitySection({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <section className="identity-section content-section" id="product">
      <div className="section-kicker">What is skelpr?</div>
      <div className="identity-layout"><div><h2>A surgical librarian<br />for <em>code intelligence.</em></h2><p>Skelpr indexes a repository, understands its symbols and relationships, and returns only the code context an agent needs to answer, review, patch, or validate.</p><div className="inline-callout"><span className="callout-line" /><span>Retrieved source includes <code>path:line</code> evidence.</span></div><DetailButton open={open} onClick={onToggle} /><SectionDetail open={open}><div className="section-detail"><span className="detail-label">IMPLEMENTATION DETAIL</span><p><code>Engine.retrieve_context()</code> serves ordinary MCP search and context. Focused lookup, edit and verification tools have specialized paths. Retrieval uses no generation model, while vector search may call an embedding endpoint.</p></div></SectionDetail></div><div className="identity-specs"><div><span className="spec-index">A</span><div><strong>Index once</strong><p>Repository files, symbols, imports, chunks, and embeddings become a working knowledge base.</p></div></div><div><span className="spec-index">B</span><div><strong>Retrieve selectively</strong><p>BM25, symbol and available vector candidates are fused with RRF. Source relationships guide selection.</p></div></div><div><span className="spec-index">C</span><div><strong>Act carefully</strong><p>Patch generation and validation preserve a path from evidence to verification.</p></div></div></div></div>
    </section>
  )
}
