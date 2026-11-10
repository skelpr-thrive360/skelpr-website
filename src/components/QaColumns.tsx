import type { ReactNode } from 'react'
import type { BenchmarkQaMetric } from '../data/siteData'

type PaneKey = 'without' | 'with'

const panes: { key: PaneKey; label: string; value: (metric: BenchmarkQaMetric) => string }[] = [
  { key: 'without', label: 'Native tools only', value: (metric) => metric.without },
  { key: 'with', label: 'With Skelpr MCP', value: (metric) => metric.withValue },
]

/**
 * The two verbatim answer panes — header, metric rows, scored frame — without
 * the answer bodies.
 *
 * Deliberately outside the lazy boundary that carries the answers table, so the
 * block can hold its full height while that chunk is still on the wire:
 * BenchmarkSection renders this shell bare as the placeholder and hands it the
 * markdown bodies once they arrive. A block that grew on mount would shove every
 * section below it down by the height of two panes and break anchor landings.
 */
export default function QaColumns({ metrics, expanded, scores, bodies, maximumScore = 100, detailedMetrics = [] }: {
  metrics: BenchmarkQaMetric[]
  expanded: boolean
  scores?: { without: number | null; with: number | null }
  bodies?: Record<PaneKey, ReactNode>
  maximumScore?: number
  detailedMetrics?: BenchmarkQaMetric[]
}) {
  return (
    <div className={`qa-columns answers ${expanded ? 'expanded' : ''}`}>
      {panes.map((pane) => {
        const score = scores?.[pane.key]
        return (
          <div className={`qa-col ${pane.key}`} key={pane.key}>
            <header><i className={`${pane.key}-key`} />{` ${pane.label}`}{score != null && <em>{score}/{maximumScore}</em>}</header>
            {metrics.map((metric) => <div className="qa-metric" key={metric.label}><span>{metric.label}</span><strong>{pane.value(metric)}</strong></div>)}
            {detailedMetrics.length > 0 && <details className="qa-accounting"><summary>Full token and tool counts</summary>{detailedMetrics.map((metric) => <div className="qa-metric" key={metric.label}><span>{metric.label}</span><strong>{pane.value(metric)}</strong></div>)}</details>}
            <div className={`qa-answer ${bodies ? '' : 'is-loading'}`} role="region" aria-label={`${pane.label}: answer text`} tabIndex={0}>{bodies?.[pane.key] ?? <span role="status">Loading answer…</span>}</div>
          </div>
        )
      })}
    </div>
  )
}
