import { lazy, Suspense, useRef, useState } from 'react'
import { djangoMetricsUrl, djangoTasks, djangoTotals, formatCount, reduction } from '../data/djangoCaseStudy'
import { Metric, scrollToElement } from './Shared'
import { TaskTokenChart } from './TaskTokenChart'

const DjangoAnswers = lazy(() => import('./DjangoAnswers'))

const djangoTokenTasks = djangoTasks.map(({ id, task, tokens }) => ({
  id,
  label: `${id} · ${task}`,
  tokens,
}))

export function DjangoCaseStudy({ active }: { active: boolean }) {
  const [selectedTask, setTask] = useState('Q1')
  const answersRef = useRef<HTMLDivElement>(null)
  const openTask = (id: string) => {
    setTask(id)
    if (answersRef.current) {
      scrollToElement(answersRef.current)
      answersRef.current.focus({ preventScroll: true })
    }
  }
  return (
    <div className="django-case-study">
      <div className="two-column-heading">
        <h3>Django · {reduction(djangoTotals.tokens)}% fewer tokens</h3>
        <p>Ten tasks on the Django framework, including code lookups, execution flows, architecture questions and fixes.</p>
      </div>
      <div className="benchmark-meta">
        <span><strong>10</strong> task pairs</span>
        <span><strong>Codex</strong> GPT-6 Astra · high reasoning</span>
        <span>Web framework</span>
        <time dateTime="2026-11">November 2026</time>
      </div>
      <div className="metric-grid">
        <Metric label="Total tokens" simple="Input + output, including cached input" without={formatCount(djangoTotals.tokens[0])} withValue={formatCount(djangoTotals.tokens[1])} change={`−${reduction(djangoTotals.tokens)}%`} withoutPct={100} withPct={djangoTotals.tokens[1] / djangoTotals.tokens[0] * 100} />
        <Metric label="Native search/read calls" simple="Test runs excluded; not a count of files" without={String(djangoTotals.nativeReads[0])} withValue={String(djangoTotals.nativeReads[1])} change="19 fewer calls" withoutPct={100} withPct={djangoTotals.nativeReads[1] / djangoTotals.nativeReads[0] * 100} />
        <Metric label="Combined rubric score" simple="Sum of task-specific checklist points" without={`${djangoTotals.score[0]} / ${djangoTotals.maximumScore}`} withValue={`${djangoTotals.score[1]} / ${djangoTotals.maximumScore}`} change="+2 points" />
        <Metric label="Model requests" simple="Across all ten comparisons" without={String(djangoTotals.requests[0])} withValue={String(djangoTotals.requests[1])} change="10 fewer requests" withoutPct={100} withPct={djangoTotals.requests[1] / djangoTotals.requests[0] * 100} />
      </div>
      <div className="caveat">
        <div>
          <strong>Comparisons span multiple Skelpr builds.</strong>
          <p>Each question has one retained comparison and helped guide retrieval tuning. The results describe these tasks and builds.</p>
        </div>
      </div>
      <TaskTokenChart
        tasks={djangoTokenTasks}
        title="Total tokens by task"
        selectedTask={selectedTask}
        onSelect={openTask}
        formatTokens={formatCount}
      />
      <details className="benchmark-table-wrap">
        <summary className="benchmark-details-summary">View exact values, scores and wall time</summary>
        <div className="table-heading">
          <div><span className="eyebrow">TEN TASKS</span><h3>Select a task to compare the answers</h3></div>
          <span className="table-key">Native tools → With Skelpr MCP<span className="scroll-cue">Scroll for all columns →</span></span>
        </div>
        <div className="benchmark-table" tabIndex={0} role="region" aria-label="Django task comparison, horizontally scrollable">
          <table className="django-results">
            <caption>Matched Django comparisons. Wall time includes startup and shutdown.</caption>
            <thead><tr><th scope="col">Task</th><th scope="col">Total tokens</th><th scope="col">Token reduction</th><th scope="col">Rubric score</th><th scope="col">Wall time (s)</th></tr></thead>
            <tbody>
              {djangoTasks.map((task) => (
                <tr key={task.id} className={selectedTask === task.id ? 'selected' : undefined}>
                  <th scope="row"><button type="button" className="case-task-button" aria-pressed={selectedTask === task.id} aria-controls="django-answers" onClick={() => openTask(task.id)}>{task.id} · {task.task}</button></th>
                  <td>{formatCount(task.tokens[0])} → {formatCount(task.tokens[1])}</td>
                  <td>{reduction(task.tokens)}%</td>
                  <td>{task.score[0]}/{task.maximumScore} → {task.score[1]}/{task.maximumScore}</td>
                  <td>{task.seconds[0].toFixed(2)} → {task.seconds[1].toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><th scope="row">Overall</th><td>{formatCount(djangoTotals.tokens[0])} → {formatCount(djangoTotals.tokens[1])}</td><td>{reduction(djangoTotals.tokens)}%</td><td>{djangoTotals.score[0]}/{djangoTotals.maximumScore} → {djangoTotals.score[1]}/{djangoTotals.maximumScore}</td><td>{djangoTotals.seconds[0].toFixed(2)} → {djangoTotals.seconds[1].toFixed(2)}</td></tr></tfoot>
          </table>
        </div>
      </details>
      <div className="benchmark-qa" id="django-answers" ref={answersRef} role="region" aria-label="Django answer comparison" tabIndex={-1}>
        {active && <Suspense fallback={<p role="status">Loading retained answers…</p>}><DjangoAnswers task={selectedTask} key={selectedTask} /></Suspense>}
      </div>
      <div className="methodology django-methodology">
        <div>
          <strong>Latency and coverage</strong>
          <p>Summed wall time fell {reduction(djangoTotals.seconds)}%, from 534.40 to 521.25 seconds. Six tasks were faster; four were slower. Q1 and Q6 saved less than 10% of tokens. Q3, Q6, and Q7 still missed rubric points.</p>
        </div>
        <div>
          <strong>Accounting and setup</strong>
          <p>Settings matched within each pair. Provider cache state was uncontrolled. Uncached input fell from 134,804 to 87,110 tokens; total-token savings are not a billing estimate. Q8 and Q10 used seeded defects in isolated Django copies.</p>
        </div>
        <div>
          <strong>Source data</strong>
          <p>Scores use task-specific rubrics, not a general accuracy measure. <a href={djangoMetricsUrl}>Inspect per-run metrics, result hashes, and the Django revision.</a></p>
        </div>
      </div>
    </div>
  )
}
