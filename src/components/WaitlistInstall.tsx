import { ArrowRight, Check } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { WaitlistForm } from './Shared'

export function WaitlistSection() {
  return (
    <section className="waitlist-section act-wash content-section" id="waitlist"><div className="waitlist-panel"><div><span className="eyebrow">STAY IN THE LOOP</span><h2>Run it today.<br /><em>Help shape what ships.</em></h2><p>Installing is open to anyone today; running is gated per machine. Request access to receive a personal activation token and its seat allowance. Join the list for release notes and new benchmark reports.</p></div><WaitlistForm /></div>
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
          <pre><code><span className="comment"># 0.3.6+ includes CLI, MCP and local AST grammars</span>{'\n'}pip install <span className="string">skelpr</span>{'\n'}{'\n'}<span className="comment">{`# once per machine — the token from your access email`}</span>{'\n'}skelpr activate <span className="string">{'<token>'}</span>{'\n'}{'\n'}{`cd <your-repo>`}{'\n'}skelpr setup --no-configure{'\n'}skelpr init{'\n'}skelpr index{'\n'}skelpr install-mcp</code></pre>
          <div className="code-footer"><Check size={14} /> agent-agnostic · local-first · configurable providers</div>
        </div>
        <div className="install-note">
          <p><strong>Requirements:</strong> Python 3.10+, Docker Desktop running, and an embeddings endpoint — hosted or local, the section above has both. The agent side needs any MCP-capable client: <code>skelpr install-mcp</code> auto-detects common agents such as Claude Code, Cursor and Antigravity, and <code>skelpr register-agent</code> covers the rest.</p>
          <p><strong>Provider and license traffic.</strong> Activation and managed check-ins contact the license service. Hosted embeddings receive indexed text and search queries. Standalone generation and optional Langfuse tracing can send prompts, source context and outputs to their configured endpoints. Your agent has its own data policy. <code>skelpr license</code> reports the state.</p>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="site-footer"><div className="footer-brand"><a className="brand" href="#top"><BrandMark /><span>skelpr</span></a><p>Surgical code retrieval for AI agents, PR reviews, and fixes.</p></div>{/* GitHub links temporarily disabled: <div className="footer-links"><a href="https://github.com/skelpr-thrive360/skelpr/blob/dev/docs/ARCHITECTURE.md" target="_blank" rel="noreferrer">Architecture</a><a href="https://github.com/skelpr-thrive360/skelpr/blob/dev/MCP_SETUP.md" target="_blank" rel="noreferrer">MCP setup</a><a href="https://github.com/skelpr-thrive360/skelpr/blob/dev/LICENSE" target="_blank" rel="noreferrer">License</a></div> */}<nav className="footer-nav" aria-label="Footer"><a href="#workflow">How it works</a><a href="#modes">Integration modes</a><a href="#benchmark">Benchmark</a>{/* Private launch: architecture parked. <a href="#architecture">Architecture</a> */}<a href="#prerequisites">Requirements</a><a href="#install">Get started</a><a href="/docs#troubleshooting">Support</a><a href="/docs#check-the-license">License</a><a href="mailto:theskelpr@gmail.com">Contact</a></nav><div className="footer-baseline"><span>Proprietary · licensed per machine · local-first</span><span>© 2026 skelpr</span></div></footer>
  )
}
