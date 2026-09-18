import { Check } from 'lucide-react'
import { WaitlistForm } from './Shared'

export function WaitlistSection() {
  return (
    <section className="waitlist-section content-section" id="waitlist"><div className="waitlist-panel"><div><span className="eyebrow">EARLY ACCESS</span><h2>Be first to try <em>MCP Agent</em><br />on your own repo.</h2><p>Join the list for updates as LoCoDex becomes available to more agent workflows.</p></div><WaitlistForm /></div>
    </section>
  )
}

export function InstallSection() {
  return (
    <section className="install-section content-section" id="install">
      <div className="section-kicker">Get started</div>
      <div className="install-layout">
        <div className="install-copy">
          <span className="eyebrow">START WITH YOUR REPOSITORY</span>
          <h2>Give your agent<br /><em>better context.</em></h2>
          <p>Install the MCP integration, index a project, and let your existing agent call LoCoDex when it needs repository understanding.</p>
          {/* GitHub links temporarily disabled: <div className="install-links">…</div> */}
        </div>
        <div className="install-code">
          <div className="code-top"><span>QUICK START</span><span>bash</span></div>
          <pre><code><span className="comment"># install MCP support</span>{'\n'}pip install <span className="string">".[mcp]"</span>{'\n'}{`cd <your-repo>`}{'\n'}locodex init{'\n'}locodex index{'\n'}locodex install-mcp</code></pre>
          <div className="code-footer"><Check size={14} /> agent-agnostic · local-first · Apache-2.0</div>
        </div>
        <div className="install-note">
          <p><strong>Requirements:</strong> Python 3.10+, PostgreSQL 15+ and Qdrant for the index. The agent side needs any MCP-capable client — Claude Desktop, Cursor, Antigravity, or your own runner.</p>
          <p><strong>No account, no telemetry.</strong> LoCoDex runs entirely against your local checkout; nothing leaves your machine except your agent's own model calls.</p>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="site-footer"><div className="footer-brand"><a className="brand" href="#top"><span className="brand-mark"><span /><span /><span /></span><span>LoCoDex</span></a><p>Surgical code retrieval for AI agents, PR reviews, and fixes.</p></div>{/* GitHub links temporarily disabled: <div className="footer-links"><a href="https://github.com/locodex-thrive360/LoCoDex/blob/dev/docs/ARCHITECTURE.md" target="_blank" rel="noreferrer">Architecture</a><a href="https://github.com/locodex-thrive360/LoCoDex/blob/dev/MCP_SETUP.md" target="_blank" rel="noreferrer">MCP setup</a><a href="https://github.com/locodex-thrive360/LoCoDex/blob/dev/LICENSE" target="_blank" rel="noreferrer">Apache-2.0</a></div> */}<div className="footer-end">Built from the repository.<br /><span>Claims trace to source.</span></div></footer>
  )
}
