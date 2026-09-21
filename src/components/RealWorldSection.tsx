import { Check } from 'lucide-react'

export function RealWorldSection() {
  return (
    <section className="real-world-section content-section" id="example">
      <div className="section-kicker">In the repository</div>
      <div className="real-world-grid"><div><h2>When the correct answer<br />is <em>“it does not exist.”</em></h2><p>The `negative_missing_service` task asked whether the Sock Shop repository defined a recommendations or inventory service. Skelpr searched for the names, returned compact evidence, and helped the agent avoid inventing a manifest.</p><div className="result-callout"><div className="result-icon"><Check size={18} /></div><div><span>VERIFIED RESULT</span><strong>Recommendations service: absent</strong><code>0 code definitions · 0 deployment manifests</code></div></div></div><div className="evidence-window"><div className="window-top"><span><i /><i /><i /></span><span>negative_missing_service.trace</span><span>0.7s</span></div><div className="evidence-body"><div className="query-line"><span>$</span> skelpr_search “recommendation inventory service”</div><div className="evidence-item"><b>[GRAPH]</b> .skelpr/graphify/summary.txt:1-2 <span>architecture graph summary</span></div><div className="evidence-item muted"><b>[LEXICAL]</b> grafana-service.yaml:1-23 <span>matched generic “service”</span></div><div className="evidence-divider">— second targeted search —</div><div className="evidence-item success"><b>[RESULT]</b> no code chunks matched the query</div><div className="answer-line"><span>agent</span> The service does not exist in this repository. No manifest was fabricated.</div></div></div></div>
    </section>
  )
}
