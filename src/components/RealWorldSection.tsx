export function RealWorldSection() {
  return (
    <section className="real-world-section content-section" id="example">
      <div className="real-world-grid">
        <div>
          <div className="section-kicker">Reading the evidence</div>
          <h2>Check what the search covered</h2>
          <p>An empty search result does not prove that a feature is absent. Check what was searched, which files were excluded and whether the scan completed.</p>
          <p>Skelpr supports live-checkout verification for presence and absence questions. Treat an incomplete scan as inconclusive.</p>
        </div>
        <div className="evidence-window">
          <div className="window-top"><span>RESPONSE CHECKLIST</span></div>
          <div className="evidence-body">
            <div className="evidence-item"><b>Source</b><span>Do the cited lines support the answer?</span></div>
            <div className="evidence-item"><b>Coverage</b><span>Was required context omitted by the budget?</span></div>
            <div className="evidence-item"><b>Scope</b><span>Were relevant paths excluded or unreadable?</span></div>
            <div className="answer-line">Refine the query or inspect the missing source when evidence is insufficient.</div>
          </div>
        </div>
      </div>
    </section>
  )
}
