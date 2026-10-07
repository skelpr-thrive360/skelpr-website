import { Check } from 'lucide-react'

// Everything on this page is grounded in the engine's own install path: the Docker
// check and the container/image names come from `skelpr setup`
// (skelpr/cli/commands/setup.py), and the embedding endpoint, model identifier and
// fallback behaviour come from skelpr/config/defaults.py and
// skelpr/embeddings/local_embedding_client.py. The model card mirrors what LM Studio
// reports for the Q8_0 GGUF build the default config names.
//
// The point of the section is the one thing the install block cannot say for itself:
// neither prerequisite raises an error when it is missing — Docker stops `skelpr setup`
// at step 1, and a missing embedding endpoint only makes the index quietly worse (or, for the
// background watcher and any credentialed endpoint, abandons the run outright) — so a reader
// has to be told to have both in place *before* they run anything.
//
// Laid out as rows rather than cards on purpose. The three prerequisites carry very
// different amounts of detail (a Docker checklist, a six-field model card, one sentence
// of generation advice), and cards in a grid stretch to the tallest of them — which
// left the first and last two-thirds empty. A row is exactly as tall as its own
// contents, so the imbalance lands in the rail where it reads as a data column.

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
    title: 'Docker Desktop, running',
    body: 'skelpr setup starts the three services above. Docker Desktop must be running first — if it is not, setup stops at step 1 and says so instead of half-configuring the machine.',
    facts: [
      { label: 'Postgres 16', value: 'port 5434' },
      { label: 'Qdrant', value: 'ports 6333 / 6334' },
      { label: 'Sandbox image', value: 'skelpr-runner:latest' },
    ],
    note: 'Without Docker the core still runs end to end on in-memory fallbacks — you lose sandboxed validation and the production-grade stores, not the assistant.',
  },
  {
    index: '02',
    chip: 'Required for retrieval',
    title: 'An embeddings endpoint, hosted or your own',
    body: 'Both modes embed your query, so you need an endpoint — not a language model. Easiest: a hosted-embeddings token sets SKELPR_EMBEDDINGS_ENDPOINT, and every command authenticates itself. Nothing to run. Or run nomic-embed-text-v1.5 in LM Studio on port 1234.',
    model: [
      { label: 'Model', value: 'nomic-ai/nomic-embed-text-v1.5' },
      { label: 'Format', value: 'GGUF' },
      { label: 'Quantization', value: 'Q8_0' },
      { label: 'Architecture', value: 'nomic-bert' },
      { label: 'Domain', value: 'embedding' },
      { label: 'Size on disk', value: '~146 MB' },
    ],
    note: 'Point embeddings.endpoint at a GPU host if you prefer — it need not be local. Leave it down and the index still builds over a hashing embedder: worse recall, no error. A credentialed endpoint and the watcher refuse that fallback.',
  },
  {
    index: '03',
    chip: 'CLI mode only',
    title: 'A model to reason with',
    body: 'ask, chat, review and fix need a generation model. Run qwen2.5-14b-instruct locally, or configure an API key and skip the hardware. MCP mode needs neither: your agent reasons, Skelpr only retrieves.',
    facts: [
      { label: 'Local model', value: 'qwen2.5-14b-instruct' },
      { label: 'or an API key', value: 'Gemini · OpenAI · Anthropic · OpenRouter · Groq' },
      { label: 'Key setup', value: 'skelpr init --gemini / --openai / --anthropic' },
    ],
    note: 'A local model and the embedding server can share one endpoint or run on two — separate model and embeddings blocks in .skelpr.yaml. With an API key, only the embedding endpoint stays local.',
  },
]

export function PrerequisitesSection() {
  return (
    <section className="prereq-section act-wash content-section" id="prerequisites">
      <div className="section-kicker">Before you start</div>
      <div className="two-column-heading">
        <h2>What has to be running<br /><em>before the first index.</em></h2>
        <p>Skelpr cannot start either one for you, and neither one fails loudly. Start Docker Desktop and settle the embedding endpoint first, then run the setup block below.</p>
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
        <p><strong>Check the embedding endpoint before you index.</strong> A 200 here, and the <code>Embedding server online</code> line in the <code>skelpr index</code> output, are the whole difference between a vector index and a keyword one. On the hosted endpoint there is nothing to check by hand — <code>skelpr index</code> probes and authenticates for you — so this is the local path.</p>
        <div className="prereq-code">
          <div className="code-top"><span>VERIFY</span><span>bash</span></div>
          {/* Split across lines to the width of the install snippet next door: this
              panel scrolls sideways on a phone rather than wrapping, like every other
              figure on the page, so the line length is the overflow. */}
          <pre><code>{'curl -s http://127.0.0.1:1234/v1/embeddings \\'}{'\n'}
{'  -H \'Content-Type: application/json\' \\'}{'\n'}
{'  -d \'{"input":["hi"],'}{'\n'}
{'       '}<span className="string">{'"model":"text-embedding-nomic-embed-text-v1.5@q8_0"}\''}</span></code></pre>
          <div className="code-footer"><Check size={14} /> the local endpoint · the hosted one needs no check</div>
        </div>
      </div>
    </section>
  )
}
