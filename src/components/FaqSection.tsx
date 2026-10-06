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
    question: 'What is Skelpr?',
    answer: (
      <>
        Skelpr is surgical code retrieval for AI agents, PR reviews, and fixes. It finds the parts
        of a repository that matter, ranks them, and hands your agent a small context package with
        precise <code>file:line</code> citations. Skelpr retrieves and cites — your agent still does
        the reasoning.
      </>
    ),
  },
  {
    question: 'How is it different from grep or an embedding search?',
    answer: (
      <>
        Search finds matches; Skelpr assembles evidence. It combines symbolic, lexical and graph
        signals over an indexed repository and returns a ranked, token-efficient package — the
        benchmarked runs opened 76% fewer files and spent 59% fewer agent tokens.
      </>
    ),
  },
  {
    question: 'Which agents can call it?',
    answer: (
      <>
        Anything that speaks MCP. <code>skelpr install-mcp</code> auto-detects Claude Code, Cursor
        and Windsurf, and <code>skelpr register-agent</code> covers the rest. The CLI takes the same
        retrieval path for review, diff and fix without an agent in the loop.
      </>
    ),
  },
  {
    question: 'What do I need to run it?',
    answer: (
      <>
        Python 3.10 or newer, Docker Desktop running, and a local embedding model — by default LM
        Studio serving <code>nomic-embed-text-v1.5</code> on port 1234. Without Docker the core
        still runs on in-memory fallbacks; you lose sandboxed validation and the production stores,
        not the assistant.
      </>
    ),
  },
  {
    question: 'Does my code leave my machine?',
    answer: (
      <>
        No. Retrieval, indexing and review run locally, and there is no telemetry. Activation sends
        only your token and a hash of this machine’s id — no hostname, no file paths, no code, no
        usage.
      </>
    ),
  },
  {
    question: 'How do I get access?',
    answer: (
      <>
        <code>pip install skelpr</code> is open to anyone; running is licensed per machine. Join the
        waitlist and we send a token that activates one seat — a seat is a machine, not a person or
        a repository.
      </>
    ),
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
