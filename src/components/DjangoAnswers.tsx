import { useLayoutEffect, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Expand, Shrink } from 'lucide-react'
import answers from '../data/djangoAnswers.json'
import { formatCount } from '../data/djangoCaseStudy'
import QaColumns from './QaColumns'
import { ScrollTrigger } from '../lib/anim'

// Render retained answers without making source paths or remote images actionable.
const markdownComponents = {
  a: ({ children }: { children?: React.ReactNode }) => <span className="qa-dead-link">{children}</span>,
  img: ({ alt }: { alt?: string }) => <span>{alt}</span>,
}

export default function DjangoAnswers({ task }: { task: string }) {
  const [expanded, setExpanded] = useState(false)
  useLayoutEffect(() => {
    ScrollTrigger.refresh()
  }, [expanded, task])
  const row = answers.rows.find((entry) => entry.id === task)
  if (!row) return <p>No retained answer is available for this task.</p>
  const native = row.native.metrics
  const skelpr = row.skelpr.metrics
  const metrics = [
    { label: 'Rubric points', without: `${native.score}/${row.maximum_score}`, withValue: `${skelpr.score}/${row.maximum_score}` },
    { label: 'Total tokens', without: formatCount(native.total_tokens), withValue: formatCount(skelpr.total_tokens) },
    { label: 'Input (cached included)', without: formatCount(native.input_tokens), withValue: formatCount(skelpr.input_tokens) },
    { label: 'Cached input', without: formatCount(native.cached_input_tokens), withValue: formatCount(skelpr.cached_input_tokens) },
    { label: 'Uncached input', without: formatCount(native.uncached_input_tokens), withValue: formatCount(skelpr.uncached_input_tokens) },
    { label: 'Output tokens', without: formatCount(native.output_tokens), withValue: formatCount(skelpr.output_tokens) },
    { label: 'Model requests', without: String(native.model_requests), withValue: String(skelpr.model_requests) },
    { label: 'Native search/read calls', without: String(native.native_search_or_read_calls), withValue: String(skelpr.native_search_or_read_calls) },
    { label: 'Native test calls', without: String(native.native_test_calls), withValue: String(skelpr.native_test_calls) },
    { label: 'MCP calls', without: String(native.mcp_calls), withValue: String(skelpr.mcp_calls) },
    { label: 'Wall time', without: `${native.wall_seconds.toFixed(2)} s`, withValue: `${skelpr.wall_seconds.toFixed(2)} s` },
  ]
  const body = (text: string) => <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents} skipHtml>{text}</Markdown>
  const summaryLabels = new Set(['Rubric points', 'Total tokens', 'Native search/read calls', 'Wall time'])
  return (
    <div className="qa-detail">
      <div className="qa-task-line"><span className="eyebrow">{row.id} OF 10</span><h3>{row.task}</h3></div>
      <div className="qa-question"><span>PROMPT — IDENTICAL FOR BOTH ARMS</span><p>{row.prompt}</p></div>
      <div className="qa-answers-head"><strong>The answers, verbatim</strong><button type="button" className="qa-expand" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? <><Shrink size={13} /> Collapse</> : <><Expand size={13} /> Read full answers</>}</button></div>
      <QaColumns metrics={metrics.filter((metric) => summaryLabels.has(metric.label))} detailedMetrics={metrics.filter((metric) => !summaryLabels.has(metric.label))} expanded={expanded} maximumScore={row.maximum_score} scores={{ without: native.score, with: skelpr.score }} bodies={{ without: body(row.native.answer), with: body(row.skelpr.answer) }} />
      <p className="qa-footnote">Retained final answers from GPT-6 Astra / high reasoning. Source links are shown as text; the answers have not been rewritten. Scores use the task rubric, so different tasks have different denominators.</p>
    </div>
  )
}
