import { DetailButton, SectionDetail } from './Shared'

export function IdentitySection({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <section className="identity-section content-section" id="product">
      <div className="section-kicker">What Skelpr returns</div>
      <div className="identity-layout">
        <div>
          <h2>Source excerpts.<br /><em>Paths. Line ranges.</em></h2>
          <p>Skelpr indexes your repository and returns evidence for code questions, reviews and edits. Your agent can use those excerpts without reading each file in full.</p>
          <div className="inline-callout"><span className="callout-line" /><span>Check each citation against the source.</span></div>
          <DetailButton open={open} onClick={onToggle} />
          <SectionDetail open={open}><div className="section-detail"><span className="detail-label">CONTEXT LIMITS</span><p>Search supports an explicit token budget or a bounded automatic budget. A limit can leave evidence out. Read coverage notes and request the missing context before drawing a conclusion.</p></div></SectionDetail>
        </div>
        <div className="identity-specs">
          <div><span className="spec-index">A</span><div><strong>Index the checkout</strong><p>Prepare repository context before the agent starts a task.</p></div></div>
          <div><span className="spec-index">B</span><div><strong>Request evidence</strong><p>Ask a question, find a definition or follow related code across files.</p></div></div>
          <div><span className="spec-index">C</span><div><strong>Verify the answer</strong><p>Use the cited ranges and run the relevant checks before accepting a change.</p></div></div>
        </div>
      </div>
    </section>
  )
}
