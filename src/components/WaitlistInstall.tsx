import { Check } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { WaitlistForm } from './Shared'

export function WaitlistSection() {
  return (
    <section className="waitlist-section act-wash content-section" id="waitlist"><div className="waitlist-panel"><div><span className="eyebrow">STAY IN THE LOOP</span><h2>Run it today.<br /><em>Help shape what ships.</em></h2><p>Skelpr is on PyPI and installable right now; 0.2.0 — the engine behind the benchmarks above — ships at launch. Join the list for release notes, new benchmark runs, and first access to the enterprise build.</p></div><WaitlistForm /></div>
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
          <pre><code><span className="comment"># from PyPI — the [mcp] extra brings the MCP server</span>{'\n'}pip install <span className="string">"skelpr[mcp]"</span>{'\n'}{`cd <your-repo>`}{'\n'}skelpr setup{'\n'}skelpr init{'\n'}skelpr index{'\n'}skelpr install-mcp</code></pre>
          <div className="code-footer"><Check size={14} /> agent-agnostic · local-first · Apache-2.0</div>
        </div>
        <div className="install-note">
          <p><strong>Requirements:</strong> Python 3.10+, Docker Desktop running, and an embedding model server — the section above has both. The agent side needs any MCP-capable client: Claude Desktop, Cursor, Antigravity, or your own runner.</p>
          <p><strong>No account, no telemetry.</strong> Skelpr runs entirely against your local checkout; nothing leaves your machine except your agent's own model calls.</p>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="site-footer"><div className="footer-brand"><a className="brand" href="#top"><BrandMark /><span>skelpr</span></a><p>Surgical code retrieval for AI agents, PR reviews, and fixes.</p></div>{/* GitHub links temporarily disabled: <div className="footer-links"><a href="https://github.com/skelpr-thrive360/skelpr/blob/dev/docs/ARCHITECTURE.md" target="_blank" rel="noreferrer">Architecture</a><a href="https://github.com/skelpr-thrive360/skelpr/blob/dev/MCP_SETUP.md" target="_blank" rel="noreferrer">MCP setup</a><a href="https://github.com/skelpr-thrive360/skelpr/blob/dev/LICENSE" target="_blank" rel="noreferrer">Apache-2.0</a></div> */}<nav className="footer-nav" aria-label="Footer"><a href="#workflow">How it works</a><a href="#modes">Integration modes</a><a href="#benchmark">Benchmark</a><a href="#architecture">Architecture</a><a href="#prerequisites">Requirements</a><a href="#install">Get started</a></nav><div className="footer-baseline"><span>Apache-2.0 · local-first · no telemetry</span><span>© 2026 skelpr</span></div></footer>
  )
}
