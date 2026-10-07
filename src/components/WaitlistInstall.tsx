import { ArrowRight, Check } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { WaitlistForm } from './Shared'

export function WaitlistSection() {
  return (
    <section className="waitlist-section act-wash content-section" id="waitlist"><div className="waitlist-panel"><div><span className="eyebrow">STAY IN THE LOOP</span><h2>Run it today.<br /><em>Help shape what ships.</em></h2><p>Install is open today; running is licensed per machine. Access is invite-only until 0.2.0 — the engine behind these benchmarks — ships. Join the list and we send a token for one machine, plus release notes, new runs and early enterprise access.</p></div><WaitlistForm /></div>
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
          {/* One link, to the page that owns the exact steps: the channel setup the
              snippet below assumes, the token, and the environment checks are all
              spelled out there, so this section does not restate them. */}
          <div className="install-links">
            <a className="button text-button" href="/docs">Full install guide <ArrowRight size={16} /></a>
          </div>
          {/* GitHub links temporarily disabled */}
        </div>
        <div className="install-code">
          <div className="code-top"><span>SETUP</span><span>bash</span></div>
          <pre><code><span className="comment"># from PyPI — the [mcp] extra brings the MCP server</span>{'\n'}pip install <span className="string">"skelpr[mcp]"</span>{'\n'}{'\n'}<span className="comment">{`# once per machine — the token from your access email`}</span>{'\n'}skelpr activate <span className="string">{'<token>'}</span>{'\n'}{'\n'}{`cd <your-repo>`}{'\n'}skelpr setup{'\n'}skelpr init{'\n'}skelpr index{'\n'}skelpr install-mcp</code></pre>
          <div className="code-footer"><Check size={14} /> agent-agnostic · local-first · no telemetry</div>
        </div>
        <div className="install-note">
          <p><strong>Requirements:</strong> Python 3.10+, Docker Desktop running, and an embeddings endpoint — hosted or local, the section above has both. The agent side needs any MCP-capable client: <code>skelpr install-mcp</code> auto-detects common agents such as Claude Code, Cursor and Antigravity, and <code>skelpr register-agent</code> covers the rest.</p>
          <p><strong>No account, no telemetry.</strong> Activation is a one-off token, not a sign-up, and it is verified offline — nothing is sent anywhere. Skelpr runs entirely against your local checkout; nothing leaves your machine except your agent's own model calls. <code>skelpr license</code> reports the state.</p>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="site-footer"><div className="footer-brand"><a className="brand" href="#top"><BrandMark /><span>skelpr</span></a><p>Surgical code retrieval for AI agents, PR reviews, and fixes.</p></div>{/* GitHub links temporarily disabled: <div className="footer-links"><a href="https://github.com/skelpr-thrive360/skelpr/blob/dev/docs/ARCHITECTURE.md" target="_blank" rel="noreferrer">Architecture</a><a href="https://github.com/skelpr-thrive360/skelpr/blob/dev/MCP_SETUP.md" target="_blank" rel="noreferrer">MCP setup</a><a href="https://github.com/skelpr-thrive360/skelpr/blob/dev/LICENSE" target="_blank" rel="noreferrer">License</a></div> */}<nav className="footer-nav" aria-label="Footer"><a href="#workflow">How it works</a><a href="#modes">Integration modes</a><a href="#benchmark">Benchmark</a>{/* Private launch: architecture parked. <a href="#architecture">Architecture</a> */}<a href="#prerequisites">Requirements</a><a href="#install">Get started</a><a href="/docs#troubleshooting">Support</a><a href="/docs#check-the-license">License</a><a href="mailto:theskelpr@gmail.com">Contact</a></nav><div className="footer-baseline"><span>Proprietary · invite-only · local-first · no telemetry</span><span>© 2026 skelpr</span></div></footer>
  )
}
