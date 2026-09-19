import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { benchmarkAnswers } from '../data/benchmarkAnswers'
import type { BenchmarkQaMetric } from '../data/siteData'
import QaColumns from './QaColumns'

// Answer bodies contain file:/// links from the benchmark machine — render them
// as inert text instead of dead links.
const markdownComponents = {
  a: ({ children }: { children?: React.ReactNode }) => <span className="qa-dead-link">{children}</span>,
}

/**
 * Loaded through `lazy()` from BenchmarkSection, so react-markdown, remark-gfm,
 * micromark and the generated answers table stay out of the main bundle. It fills
 * a shell that QaColumns renders at full height from first paint, so neither this
 * chunk nor the placeholder swap moves the page.
 */
export default function VerbatimAnswers({ task, expanded, metrics }: { task: string; expanded: boolean; metrics: BenchmarkQaMetric[] }) {
  const answers = benchmarkAnswers[task]
  if (!answers?.without && !answers?.with) return null
  const body = (text: string) => <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{text}</Markdown>
  return (
    <QaColumns
      metrics={metrics}
      expanded={expanded}
      scores={{ without: answers.withoutScore, with: answers.withScore }}
      bodies={{ without: body(answers.without), with: body(answers.with) }}
    />
  )
}
