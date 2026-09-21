import type { ReactNode } from 'react'
import type { BenchmarkQaMetric } from '../data/siteData'

type PaneKey = 'without' | 'with'

const panes: { key: PaneKey; label: string; value: (metric: BenchmarkQaMetric) => string }[] = [
  { key: 'without', label: 'WITHOUT — native tools only', value: (metric) => metric.without },
  { key: 'with', label: 'WITH — skelpr MCP available', value: (metric) => metric.withValue },
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
export default function QaColumns({ metrics, expanded, scores, bodies }: {
  metrics: BenchmarkQaMetric[]
  expanded: boolean
  scores?: { without: number | null; with: number | null }
  bodies?: Record<PaneKey, ReactNode>
}) {
  return (
    <div className={`qa-columns answers ${expanded ? 'expanded' : ''}`}>
      {panes.map((pane) => {
        const score = scores?.[pane.key]
        return (
          <div className={`qa-col ${pane.key}`} key={pane.key}>
            <header><i className={`${pane.key}-key`} />{` ${pane.label}`}{score != null && <em>{score}/100</em>}</header>
            {metrics.map((metric) => <div className="qa-metric" key={metric.label}><span>{metric.label}</span><strong>{pane.value(metric)}</strong></div>)}
            <div className="qa-answer">{bodies?.[pane.key]}</div>
          </div>
        )
      })}
    </div>
  )
}
