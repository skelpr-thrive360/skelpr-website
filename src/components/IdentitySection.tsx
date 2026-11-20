import { DetailButton, SectionDetail } from './Shared'

export function IdentitySection({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <section className="identity-section content-section" id="product">
      <div className="identity-layout">
        <div>
          <div className="section-kicker">What Skelpr returns</div>
          <h2>Code you can trace to its source</h2>
          <p>Index one repository or a parent workspace containing several checkouts. Skelpr returns cited evidence for code questions, reviews and edits, with paths that identify each source repository.</p>
          <div className="inline-callout"><span className="callout-line" /><span>Check each citation against the source.</span></div>
          <DetailButton open={open} onClick={onToggle} />
          <SectionDetail open={open}><div className="section-detail"><span className="detail-label">CONTEXT LIMITS</span><p>Search supports an explicit token budget or a bounded automatic budget. A limit can leave evidence out. Read coverage notes and request the missing context before drawing a conclusion.</p></div></SectionDetail>
        </div>
        <div className="identity-specs">
          <div><span className="spec-index">A</span><div><strong>Choose your scope</strong><p>Use one configuration for a checkout or a combined workspace.</p></div></div>
          <div><span className="spec-index">B</span><div><strong>Request evidence</strong><p>Find a definition or follow related code across indexed files and repositories.</p></div></div>
          <div><span className="spec-index">C</span><div><strong>Verify the answer</strong><p>Use the cited ranges and run the relevant checks before accepting a change.</p></div></div>
        </div>
      </div>
    </section>
  )
}
