import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Equal, Expand, Shrink, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react'
import { benchmarkQa, benchmarkTasks } from '../data/siteData'
import type { QaVerdict } from '../data/siteData'
import { Metric, scrollToElement } from './Shared'
import QaColumns from './QaColumns'

// The verbatim panes pull in react-markdown, remark-gfm, micromark and the whole
// generated answers table (~97 kB of text on its own). They belong in their own
// chunk, and that chunk belongs off the critical path: this block sits several
// thousand pixels down, so nothing is lost by mounting it on approach. QaColumns
// renders the same two-column shell without the chunk, so the block holds its
// exact height from the first paint instead of growing when the answers arrive.
const VerbatimAnswers = lazy(() => import('./VerbatimAnswers'))

const verdictMeta: Record<QaVerdict, { label: string; Icon: typeof Equal }> = {
  better: { label: 'Better', Icon: TrendingUp },
  same: { label: 'Same', Icon: Equal },
  weaker: { label: 'Weaker', Icon: TrendingDown },
}

export function BenchmarkSection() {
  const [selectedTask, setSelectedTask] = useState<string>(benchmarkQa[0].task)
  const [answersExpanded, setAnswersExpanded] = useState(false)
  const [methodologyOpen, setMethodologyOpen] = useState(false)
  const [answersReady, setAnswersReady] = useState(false)
  const qaRef = useRef<HTMLDivElement>(null)

  // Root margin, not the viewport edge: the chunk arrives while the block is
  // still below the fold, so the swap is never visible.
  useEffect(() => {
    const node = qaRef.current
    if (!node || answersReady) return
    if (typeof IntersectionObserver === 'undefined') {
      setAnswersReady(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setAnswersReady(true)
          observer.disconnect()
        }
      },
      { rootMargin: '800px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [answersReady])

  const qa = benchmarkQa.find((entry) => entry.task === selectedTask) ?? benchmarkQa[0]

  // Reveal the answers panel for the picked task, clearing the sticky header.
  const openTask = (task: string) => {
    if (task !== selectedTask) {
      setSelectedTask(task)
      setAnswersExpanded(false)
    }
    if (qaRef.current) scrollToElement(qaRef.current)
  }

  return (
    <section className="benchmark-section content-section" id="benchmark">
      <div className="section-kicker">Benchmark evidence</div>
      <div className="two-column-heading"><h2>Does it actually<br /><em>work better?</em></h2><p>In the repository’s self-reported MCP Agent A/B, an Antigravity agent answered seven Sock Shop tasks with native tools only, then with LoCoDex MCP available. Pick any task to read the exact prompt and both verbatim answers.</p></div>
      <div className="benchmark-meta"><span><strong>7 × 2</strong> tasks × arms</span><span><strong>Antigravity</strong> Gemini 3.6 Flash Medium</span><span><strong>Sock Shop</strong> microservices demo</span><span><strong>2026-09-09/10</strong> run dates</span></div>

      <div className="metric-grid"><Metric label="Total tokens" simple="How much context work did the agent do?" without="740,255" withValue="384,263" change="−48.1%" /><Metric label="Wall-clock time" simple="How long did each suite take?" without="301s" withValue="175s" change="−41.9%" /><Metric label="Accuracy" simple="How many checklist points did the answers earn?" without="619" withValue="635" change="+16 pts" /><Metric label="Files opened" simple="How many files did the agent inspect?" without="114" withValue="34" change="−70.2%" /></div>

      <div className="benchmark-table-wrap">
        <div className="table-heading"><div><span className="eyebrow">THE SEVEN TASKS</span><h3>Same questions. Different context path.</h3></div><span className="table-key"><i className="without-key" /> WITHOUT <i className="with-key" /> WITH · <em>click a row to read the answers</em><span className="scroll-cue">swipe for all columns →</span></span></div>
        <div className="benchmark-table" role="table">
          <div className="table-row table-header" role="row"><span role="columnheader">Task</span><span role="columnheader">Category</span><span role="columnheader">Accuracy</span><span role="columnheader">Tokens W/O → W</span><span role="columnheader" /></div>
          {benchmarkTasks.map(([task, category, without, withValue, tokens]) => {
            const entry = benchmarkQa.find((qaEntry) => qaEntry.task === task)
            const verdict = entry?.verdict
            return (
              <div className={`table-row clickable ${selectedTask === task ? 'selected' : ''}`} role="row" key={task} onClick={() => openTask(task)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openTask(task) } }} tabIndex={0} title="Read this task’s prompt and both verbatim answers">
                <span className="task-name" role="cell">{task}</span>
                <span role="cell"><em className={`category ${category}`}>{category}</em></span>
                <span className="accuracy-bars" role="cell"><b>{without}</b><span className="bar"><i style={{ width: `${without}%` }} /><i className="with-bar" style={{ width: `${withValue}%` }} /></span><strong>{withValue}</strong>{verdict === 'better' && <TrendingUp size={12} className="row-verdict better" />}{verdict === 'weaker' && <TrendingDown size={12} className="row-verdict weaker" />}</span>
                <span className="token-change" role="cell">{tokens}</span>
                <span className="row-open" role="cell"><ChevronRight size={13} className={selectedTask === task ? 'rotate' : ''} /></span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="benchmark-qa" ref={qaRef} id="benchmark-qa">
        <div className="qa-detail">
          <div className="qa-task-line"><span className="eyebrow">TASK {benchmarkTasks.findIndex(([task]) => task === qa.task) + 1} OF {benchmarkTasks.length}</span><h3>{qa.task}</h3></div>
          <div className="qa-question"><span>PROMPT — IDENTICAL FOR BOTH ARMS</span><p>{qa.question}</p></div>
          <div className={`qa-verdict ${qa.verdict}`}>
            <strong>{(() => { const { Icon } = verdictMeta[qa.verdict]; return <Icon size={14} /> })()} {verdictMeta[qa.verdict].label}</strong>
            <span>{qa.delta} accuracy, WITHOUT → WITH</span>
            <p>{qa.why}</p>
          </div>
          <div className="qa-answers-head">
            <strong>The answers, verbatim</strong>
            <button className="qa-expand" onClick={() => setAnswersExpanded(!answersExpanded)}>{answersExpanded ? <><Shrink size={13} /> Collapse</> : <><Expand size={13} /> Read full answers</>}</button>
          </div>
          <Suspense fallback={<QaColumns metrics={qa.metrics} expanded={answersExpanded} />}>
            {answersReady ? <VerbatimAnswers task={qa.task} expanded={answersExpanded} metrics={qa.metrics} /> : <QaColumns metrics={qa.metrics} expanded={answersExpanded} />}
          </Suspense>
          <div className="qa-diffs"><strong>What’s actually different</strong><ul>{qa.diffs.map((diff) => <li key={diff}>{diff}</li>)}</ul></div>
          <div className="qa-judgement"><strong>The call</strong><p>{qa.judgement}</p></div>
          {qa.footnote && <div className="qa-footnote"><ShieldCheck size={14} /> {qa.footnote}</div>}
        </div>
      </div>

      <div className="caveat"><ShieldCheck size={17} /><div><strong>Read the accuracy number with care.</strong><p>The +16 swing is driven by the negative task’s phrase match (60 → 100); the repository notes both answers were equally correct. On the other six tasks, WITH totals 535 vs. 559. Token and time savings are unaffected.</p></div></div>
      <button className="methodology-toggle" onClick={() => setMethodologyOpen(!methodologyOpen)} aria-expanded={methodologyOpen}><span>Technical methodology & limitations</span><ChevronDown size={17} className={methodologyOpen ? 'rotate' : ''} /></button>{methodologyOpen && <><div className="methodology"><div><strong>WITHOUT</strong><p>LoCoDex removed from MCP config. Native browse/read/glob/grep tools only.</p></div><div><strong>WITH</strong><p>Native tools plus LoCoDex MCP, with search-first guidance and 1–3 targeted searches.</p></div><div><strong>Evaluation</strong><p>Accuracy uses task-specific keyword/checklist evaluators. No LLM judge. Raw prompts and verbatim outputs are saved in the benchmark artifacts.</p></div></div><div className="mode-one-benchmark"><div><span className="eyebrow">CLI / REFERENCE BASELINE</span><h3>Standalone retrieval vs. a full-repo dump</h3><p>Gemini 2.5 Flash on a mid-size repository. The docs explicitly label this a worst-case reference, not typical user behavior.</p></div><div className="mode-one-table"><div><span>Strategy</span><span>Latency</span><span>Tokens</span><span>Accuracy</span></div><div><strong>Naive full-repo dump</strong><span>16.37s</span><span>122,710</span><span>8.7 / 10</span></div><div><strong>Agentic multi-turn</strong><span>19.62s</span><span>7,491</span><span>8.7 / 10</span></div><div className="highlight-row"><strong>LoCoDex hybrid engine</strong><span>5.61s</span><span>2,474</span><span>9.0 / 10</span></div></div></div></>}
    </section>
  )
}
