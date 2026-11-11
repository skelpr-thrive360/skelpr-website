import { ArrowRight, Check } from 'lucide-react'

// Brand glyphs inline: lucide dropped trademark icons in v1, and one-off
// 18px marks are not worth a dependency.
const InstagramGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const LinkedinGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)
import { BrandMark } from './BrandMark'
import { WaitlistForm } from './Shared'
import { navItems } from '../lib/navItems'

export function WaitlistSection() {
  return (
    <section className="waitlist-section content-section" id="waitlist">
      <div className="waitlist-panel">
        <div>
          <div className="section-kicker">Access and updates</div>
          <h2>Request access</h2>
          <p>The package is public. Running it requires an activation token; each activated machine uses one seat. Email us to request access. The waitlist is for release updates.</p>
          <a className="button text-button" href="mailto:theskelpr@gmail.com?subject=Skelpr%20access">Request a token <ArrowRight size={16} /></a>
        </div>
        <WaitlistForm />
      </div>
    </section>
  )
}

export function InstallSection() {
  return (
    <section className="install-section content-section" id="install">
      <div className="install-layout">
        <div className="install-copy">
          <div className="section-kicker">Get started</div>
          <h2>Install and connect</h2>
          <p>These commands connect Skelpr to a coding agent over MCP. See <a href="/docs#check-the-generated-config">what to check after init</a> or follow the <a href="/docs#set-up-the-standalone-cli">standalone CLI setup</a>.</p>
          {/* One link, to the page that owns the exact steps: the channel setup the
              snippet below assumes, the token, and the environment checks are all
              spelled out there, so this section does not restate them. */}
          <div className="install-links">
            <a className="button text-button" href="/docs">Full install guide <ArrowRight size={16} /></a>
          </div>
          {/* GitHub links temporarily disabled */}
        </div>
        <div className="install-code">
          <div className="code-top"><span>MCP SETUP</span><span>bash</span></div>
          <pre><code><span className="comment"># 0.3.6+ includes CLI and MCP</span>{'\n'}python -m pip install --upgrade <span className="string">skelpr</span>{'\n'}{'\n'}<span className="comment"># Once per machine, using the token from your access email</span>{'\n'}skelpr activate <span className="string">{'<token>'}</span>{'\n'}{'\n'}{`cd <your-repo>`}{'\n'}skelpr setup --no-configure --no-sandbox{'\n'}skelpr init{'\n'}<span className="comment"># Check the embedding endpoint and model in .skelpr.yaml</span>{'\n'}skelpr index{'\n'}skelpr install-mcp</code></pre>
          <div className="code-footer"><Check size={14} /> Reconnect the client and run skelpr_health</div>
        </div>
        <div className="install-note">
          <p><strong>Requirements:</strong> Python 3.10+, Git, a running Docker daemon and a configured embedding endpoint for standard setup. <code>skelpr install-mcp</code> detects supported clients, including Codex, Claude Code and Cursor. Use the manual MCP configuration in the guide if a client is missed.</p>
          <p><strong>Provider and license traffic.</strong> Activation and managed check-ins contact the license service. Hosted providers and optional tracing can receive source context and queries. See <a href="/docs#what-activation-sends">what each connection sends</a>.</p>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><a className="brand" href="#top"><BrandMark /><span>skelpr</span></a><p>Budgeted repository evidence for MCP and CLI.</p></div>
      <nav className="footer-nav" aria-label="Footer">
        {navItems.map(({ id, label }) => <a key={id} href={`#${id}`}>{label}</a>)}
        <a href="#prerequisites">Requirements</a>
        <a href="#install">Install</a>
        <a href="/docs#troubleshooting">Troubleshooting</a>
        <a href="/docs#check-the-license">Licensing</a>
        <a href="/privacy/">Privacy</a>
        <a href="mailto:theskelpr@gmail.com">Contact</a>
      </nav>
      <div className="footer-baseline"><span>Proprietary · licensed per machine · local-first</span><span>© 2026 skelpr</span></div>
    </footer>
  )
}
