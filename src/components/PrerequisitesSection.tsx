import { Check } from 'lucide-react'

// Setup and provider requirements follow the package configuration and CLI.

type Spec = { label: string; value: string }

type Prerequisite = {
  index: string
  chip: string
  title: string
  body: string
  model?: Spec[]
  facts?: Spec[]
  note: string
}

const prerequisites: Prerequisite[] = [
  {
    index: '01', chip: 'Standard setup', title: 'Docker',
    body: 'Start Docker Desktop or Docker Engine before running skelpr setup. Setup starts the repository stores and prepares isolated validation.',
    facts: [
      { label: 'PostgreSQL', value: 'port 5434' },
      { label: 'Qdrant', value: 'ports 6333 / 6334' },
    ],
    note: 'External PostgreSQL and Qdrant can replace the bundled services. Running validation on the host requires explicit opt-in.',
  },
  {
    index: '02', chip: 'Semantic search', title: 'An embedding provider',
    body: 'Choose a local or hosted endpoint. Hosted embeddings receive indexed source text and search queries. Check the endpoint and credentials before indexing.',
    facts: [
      { label: 'Where it runs', value: 'Local or hosted' },
      { label: 'Configuration', value: 'embeddings in .skelpr.yaml' },
    ],
    note: 'Match the configured model to the endpoint. Changing the embedding model requires rebuilding the vector index.',
  },
  {
    index: '03', chip: 'Standalone CLI', title: 'A generation provider',
    body: 'ask, chat, review and fix use a configured generation model. MCP retrieval uses your coding agent for reasoning and needs no separate Skelpr generation key.',
    facts: [
      { label: 'Where it runs', value: 'Local or hosted' },
      { label: 'Setup', value: 'skelpr setup' },
    ],
    note: 'Generation and embeddings have separate settings. Hosted generation receives your prompt and selected source context.',
  },
]

export function PrerequisitesSection() {
  return (
    <section className="prereq-section act-wash content-section" id="prerequisites">
      <div className="section-kicker">Before you start</div>
      <div className="two-column-heading">
        <h2>Check the requirements.<br /><em>Then index.</em></h2>
        <p>Use Python 3.10+, Git and an activated license. Standard setup also needs Docker and an embedding endpoint. Configure generation only for standalone CLI workflows.</p>
      </div>
      <div className="prereq-list">
        {prerequisites.map((item) => (
          <article className="prereq-row" key={item.index}>
            <span className="prereq-number" aria-hidden="true">{item.index}</span>
            <div className="prereq-main">
              <div className="prereq-head">
                <h3>{item.title}</h3>
                <span className="prereq-chip">{item.chip}</span>
              </div>
              <p className="prereq-body">{item.body}</p>
              <p className="prereq-note-line">{item.note}</p>
            </div>
            <div className="prereq-aside">
              {item.model && (
                <dl className="prereq-model">
                  {item.model.map((row) => (
                    <div className="prereq-spec" key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {item.facts && (
                <dl className="prereq-facts">
                  {item.facts.map((row) => (
                    <div className="prereq-spec" key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="prereq-verify">
        <p><strong>Check your setup.</strong> Run diagnostics from the repository after configuration. Resolve provider and service errors before indexing.</p>
        <div className="prereq-code">
          <div className="code-top"><span>DIAGNOSTICS</span><span>terminal</span></div>
          <pre><code>{'skelpr license\nskelpr doctor --verbose'}</code></pre>
          <div className="code-footer"><Check size={14} /> <a href="/docs#troubleshooting">Troubleshooting commands</a></div>
        </div>
      </div>
    </section>
  )
}
