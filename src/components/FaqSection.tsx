/**
 * Six questions asked before anyone installs, as a click-to-expand accordion:
 * one open at a time, the answer under its own question, no rules between items.
 *
 * Grounded in the repo's own docs (install guide, `skelpr setup`, the benchmark
 * above). The FAQPage JSON-LD in index.html repeats these answers and
 * `npm run check:seo` fails the build if they drift — it reads the markup, not
 * the screen, so a collapsed answer still has to be in the document.
 */
import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { SectionDetail } from './Shared'

type Faq = { question: string; answer: ReactNode }

const faqs: Faq[] = [
  {
    question: "What is Skelpr?",
    answer: "Skelpr supplies budgeted repository evidence for coding agents, PR reviews and fixes. It combines search results with source ranges. In MCP mode your agent owns reasoning and decides when to call the tools.",
  },
  {
    question: "How is it different from grep or an embedding search?",
    answer: "Skelpr combines BM25, symbol and available vector candidates through reciprocal rank fusion, then selects related source evidence within a budget. The historical Sock Shop report claimed 59% fewer tokens, but retained artifacts do not fully reproduce that aggregate. Savings depend on the task and model.",
  },
  {
    question: "Which agents can call it?",
    answer: "MCP-compatible clients can call Skelpr. skelpr install-mcp detects supported clients, including Codex, Claude Code and Cursor. Manual configuration covers missed clients. Reconnect after installation and approve the tools as required by your client. The agent chooses whether to use them.",
  },
  {
    question: "What do I need to run it?",
    answer: "Use Python 3.10 or newer and activate the machine. The standard setup needs a running Docker daemon for PostgreSQL, Qdrant and isolated validation. External database services can replace Docker. In-memory state lasts only for that process. Configure an embedding endpoint for semantic search and a generation provider for standalone ask, chat, review or fix.",
  },
  {
    question: "Does my code leave my machine?",
    answer: "That depends on your configuration. Hosted embeddings receive indexed text and queries. Standalone generation receives prompts and selected source context. Optional Langfuse tracing can include inputs, outputs and source. Activation sends the token and a machine-id hash, and managed leases check in during use. Your coding agent has its own data policy.",
  },
  {
    question: "How do I get access?",
    answer: "pip install skelpr is publicly available. Running requires a personal activation token. Request access, then run skelpr activate with your token. Each activated machine occupies one seat. skelpr license reports the current state.",
  },
]

export function FaqSection() {
  // One open at a time: an accordion that allows every panel open is a list.
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="faq-section content-section" id="faq">
      <div className="section-kicker">Before you ask</div>
      <div className="two-column-heading">
        <h2>Six questions,<br /><em>answered up front.</em></h2>
        <p>What it is, what it needs, and where your code goes — the answers that otherwise live in an email thread. The full guide has the commands.</p>
      </div>
      <div className="faq-list">
        {faqs.map((item, index) => {
          const isOpen = open === index
          return (
            <article className="faq-item" key={item.question}>
              <h3>
                <button
                  type="button"
                  className="faq-question"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() => setOpen(isOpen ? null : index)}
                >
                  <span className="faq-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <span className="faq-title">{item.question}</span>
                  <ChevronDown size={16} className={isOpen ? 'rotate' : ''} />
                </button>
              </h3>
              {/* The site's own expand: a GSAP height tween that refreshes
                  ScrollTrigger when it settles. The answer stays in the DOM. */}
              <SectionDetail open={isOpen}>
                <div className="faq-answer" id={`faq-answer-${index}`}>
                  <p>{item.answer}</p>
                </div>
              </SectionDetail>
            </article>
          )
        })}
      </div>
    </section>
  )
}
