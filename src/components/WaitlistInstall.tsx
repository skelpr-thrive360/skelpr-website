import { Check } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { WaitlistForm } from './Shared'

export function WaitlistSection() {
  return (
    <section className="waitlist-section act-wash content-section" id="waitlist"><div className="waitlist-panel"><div><span className="eyebrow">STAY IN THE LOOP</span><h2>Run it today.<br /><em>Help shape what ships.</em></h2><p>Skelpr is public and installable from source right now. Join the list for release notes, new benchmark runs, and first access to the enterprise build.</p></div><WaitlistForm /></div>
    </section>
  )
}

export function InstallSection() {
  return (
    <section className="install-section content-section" id="install">
      <div className="section-kicker">Get started</div>
      <div className="install-layout">
        <div className="install-copy">
          <h2>Give your agent<br /><em>better context.</em></h2>
          <p>Index a project, add the MCP integration, and let your existing agent call skelpr when it needs repository understanding.</p>
          {/* GitHub links temporarily disabled: <div className="install-links">…</div> */}
        </div>
        <div className="install-code">
          <div className="code-top"><span>SETUP</span><span>bash</span></div>
          <pre><code><span className="comment"># from source — the repository is public (not on PyPI yet)</span>{'\n'}git clone <span className="string">https://github.com/skelpr-thrive360/skelpr.git</span>{'\n'}cd skelpr && pip install <span className="string">-e ".[mcp]"</span>{'\n'}{`cd <your-repo>`}{'\n'}skelpr setup{'\n'}skelpr init{'\n'}skelpr index{'\n'}skelpr install-mcp</code></pre>
          <div className="code-footer"><Check size={14} /> agent-agnostic · local-first · Apache-2.0</div>
        </div>
        <div className="install-note">
          <p><strong>Requirements:</strong> Python 3.10+, PostgreSQL 15+ and Qdrant for the index. The agent side needs any MCP-capable client — Claude Desktop, Cursor, Antigravity, or your own runner.</p>
          <p><strong>No account, no telemetry.</strong> Skelpr runs entirely against your local checkout; nothing leaves your machine except your agent's own model calls.</p>
          <p><strong>There is no published package yet.</strong> <code>pip install ".[mcp]"</code> installs from a checkout of the repository itself, so the block above is what setup looks like rather than a one-line install from PyPI.</p>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="site-footer"><div className="footer-brand"><a className="brand" href="#top"><BrandMark /><span>skelpr</span></a><p>Surgical code retrieval for AI agents, PR reviews, and fixes.</p></div>{/* GitHub links temporarily disabled: <div className="footer-links"><a href="https://github.com/skelpr-thrive360/skelpr/blob/dev/docs/ARCHITECTURE.md" target="_blank" rel="noreferrer">Architecture</a><a href="https://github.com/skelpr-thrive360/skelpr/blob/dev/MCP_SETUP.md" target="_blank" rel="noreferrer">MCP setup</a><a href="https://github.com/skelpr-thrive360/skelpr/blob/dev/LICENSE" target="_blank" rel="noreferrer">Apache-2.0</a></div> */}<nav className="footer-nav" aria-label="Footer"><a href="#workflow">How it works</a><a href="#modes">Integration modes</a><a href="#benchmark">Benchmark</a><a href="#architecture">Architecture</a><a href="#install">Get started</a></nav><div className="footer-baseline"><span>Apache-2.0 · local-first · no telemetry</span><span>© 2026 skelpr</span></div></footer>
  )
}
