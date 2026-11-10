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
    index: '01',
    chip: 'Required for setup',
    title: 'A running Docker daemon',
    body: 'skelpr setup talks to the Docker daemon to start the metadata store, the vector store and the validation sandbox. Docker Desktop or Docker Engine must be ready first — if it is not running, setup stops after step 1 and says so rather than half-configuring the machine.',
    facts: [
      { label: 'Postgres 16', value: 'port 5434' },
      { label: 'Qdrant', value: 'ports 6333 / 6334' },
      { label: 'Sandbox image', value: 'skelpr-runner:latest' },
    ],
    note: 'Docker is optional if you configure external PostgreSQL and Qdrant. In-memory fallback is process-local. Host validation requires sandbox.allow_local_fallback: true. Setup resumes stopped containers and gives new containers named data volumes.',
  },
  {
    index: '02',
    chip: 'For semantic retrieval',
    title: 'An embeddings endpoint, hosted or your own',
    body: 'Indexing sends source chunks to the configured embedding endpoint. Vector search embeds queries. BM25 and symbol retrieval can work without vectors. Choose a local endpoint or configure a hosted provider and its credentials. An eligible lease can obtain credentials for the Skelpr hosted endpoint once that endpoint is configured.',
    model: [
      { label: 'Model', value: 'nomic-ai/nomic-embed-text-v1.5' },
      { label: 'Format', value: 'GGUF' },
      { label: 'Quantization', value: 'Q8_0' },
      { label: 'Architecture', value: 'nomic-bert' },
      { label: 'Domain', value: 'embedding' },
      { label: 'Size on disk', value: '~146 MB' },
    ],
    note: 'Match embeddings.model to the model served at embeddings.endpoint. Keyless non-strict initialization can fall back to deterministic hashing. Strict indexing and credentialed endpoints refuse that substitution. Changing embedding models requires rebuilding the vector index.',
  },
  {
    index: '03',
    chip: 'CLI mode only',
    title: 'A model to reason with',
    body: 'ask, chat, review and fix need a generation model. Run qwen2.5-14b-instruct locally, or configure an API key and skip the hardware. MCP mode needs neither: your agent reasons, Skelpr only retrieves.',
    facts: [
      { label: 'Local model', value: 'qwen2.5-14b-instruct' },
      { label: 'or an API key', value: 'Gemini · OpenAI · Anthropic · OpenRouter · Groq' },
      { label: 'Configuration', value: 'skelpr setup (interactive)' },
    ],
    note: 'Generation and embeddings have separate configuration blocks. Either endpoint can be local or hosted. Interactive setup verifies credentials before saving a reference.',
  },
]

export function PrerequisitesSection() {
  return (
    <section className="prereq-section act-wash content-section" id="prerequisites">
      <div className="section-kicker">Before you start</div>
      <div className="two-column-heading">
        <h2>What has to be running<br /><em>before the first index.</em></h2>
        <p>Start Docker and configure the embedding endpoint before the standard setup. Standalone CLI workflows also need generation. The install guide covers external services and failure behavior.</p>
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
        <p><strong>Check the embedding endpoint before you index.</strong> This example checks the default local model. Match its name to your server and inspect the reported indexing backends. Hosted endpoints also need valid configuration and credentials.</p>
        <div className="prereq-code">
          <div className="code-top"><span>VERIFY</span><span>bash</span></div>
          {/* Split across lines to the width of the install snippet next door: this
              panel scrolls sideways on a phone rather than wrapping, like every other
              figure on the page, so the line length is the overflow. */}
          <pre><code>{'curl -s http://127.0.0.1:1234/v1/embeddings \\'}{'\n'}
{'  -H \'Content-Type: application/json\' \\'}{'\n'}
{'  -d \'{"input":["hi"],'}{'\n'}
{'       '}<span className="string">{'"model":"text-embedding-nomic-embed-text-v1.5@q8_0"}\''}</span></code></pre>
          <div className="code-footer"><Check size={14} /> example for the default local endpoint</div>
        </div>
      </div>
    </section>
  )
}
