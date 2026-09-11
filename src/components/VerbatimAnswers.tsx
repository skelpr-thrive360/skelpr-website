import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { benchmarkAnswers } from '../data/benchmarkAnswers'
import type { BenchmarkQaMetric } from '../data/siteData'

// Answer bodies contain file:/// links from the benchmark machine — render them
// as inert text instead of dead links.
const markdownComponents = {
  a: ({ children }: { children?: React.ReactNode }) => <span className="qa-dead-link">{children}</span>,
}

/** Lazy-loaded: verbatim answer panes (react-markdown + answer data live in a split chunk). */
export default function VerbatimAnswers({ task, expanded, metrics }: { task: string; expanded: boolean; metrics: BenchmarkQaMetric[] }) {
  const answers = benchmarkAnswers[task]
  if (!answers?.without && !answers?.with) return null
  return (
    <div className={`qa-columns answers ${expanded ? 'expanded' : ''}`}>
      <div className="qa-col without">
        <header><i className="without-key" /> WITHOUT — native tools only{answers.withoutScore != null && <em>{answers.withoutScore}/100</em>}</header>
        {metrics.map((metric) => <div className="qa-metric" key={metric.label}><span>{metric.label}</span><strong>{metric.without}</strong></div>)}
        <div className="qa-answer"><Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{answers.without}</Markdown></div>
      </div>
      <div className="qa-col with">
        <header><i className="with-key" /> WITH — LoCoDex MCP available{answers.withScore != null && <em>{answers.withScore}/100</em>}</header>
        {metrics.map((metric) => <div className="qa-metric" key={metric.label}><span>{metric.label}</span><strong>{metric.withValue}</strong></div>)}
        <div className="qa-answer"><Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{answers.with}</Markdown></div>
      </div>
    </div>
  )
}
