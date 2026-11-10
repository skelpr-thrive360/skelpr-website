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
    answer: "Skelpr returns repository evidence with file:line citations within a context budget. Connect it to a coding agent over MCP or use the CLI with your own generation provider. In MCP mode, the agent does the reasoning.",
  },
  {
    question: "How is it different from grep or an embedding search?",
    answer: "Skelpr returns selected code excerpts and related evidence, with source ranges and response limits. This can replace repeated searches and file reads. A limit can exclude relevant code; check reported gaps and request more context when needed. Token savings depend on the task, model and repository.",
  },
  {
    question: "Which agents can call it?",
    answer: "MCP-compatible clients can call Skelpr. skelpr install-mcp detects supported clients, including Codex, Claude Code and Cursor. Configure other clients manually. Reconnect after installation and approve tools as your client requires. The agent decides when to call them; installation does not guarantee tool use.",
  },
  {
    question: "What do I need to run it?",
    answer: "Use Python 3.10 or newer and an activated license. Standard setup uses Docker for PostgreSQL, Qdrant and isolated validation. Configure an embedding endpoint for semantic search. Standalone ask, chat, review and fix also need a generation provider. External database services are supported; host validation requires explicit opt-in.",
  },
  {
    question: "Does my code leave my machine?",
    answer: "That depends on your configuration. Hosted embeddings receive indexed text and queries. Standalone generation receives prompts and selected source context. Optional Langfuse tracing can include inputs, outputs and source. Activation sends the token and a machine-id hash, and managed leases check in during use. Your coding agent has its own data policy.",
  },
  {
    question: "How do I get access?",
    answer: "Install with pip install skelpr. Running requires a personal activation token: request access, then run skelpr activate with your token. Each activated machine uses one seat. Run skelpr license to check the current state.",
  },
]

export function FaqSection() {
  // One open at a time: an accordion that allows every panel open is a list.
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="faq-section content-section" id="faq">
      <div className="section-kicker">FAQ</div>
      <div className="two-column-heading">
        <h2>Requirements, access<br />and <em>data handling.</em></h2>
        <p>Check client support, setup requirements and provider traffic before installing. The install guide includes the commands.</p>
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
