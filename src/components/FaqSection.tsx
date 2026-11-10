import { ChevronDown } from 'lucide-react'

// Keep these questions and answers in sync with FAQPage in index.html.
const faqs = [
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
  return (
    <section className="faq-section content-section" id="faq" aria-labelledby="faq-title">
      <div className="faq-intro">
        <h2 id="faq-title">Frequently asked questions</h2>
        <p>For installation and client setup, see the <a href="/docs">setup guide</a>.</p>
      </div>
      <div className="faq-list">
        {faqs.map(({ question, answer }) => (
          <details className="faq-item" name="skelpr-faq" key={question}>
            <summary className="faq-question">
              <span>{question}</span>
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <p className="faq-answer">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
