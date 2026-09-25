import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronRight, Equal, Expand, Shrink, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react'
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
    <section className="benchmark-section act-wash content-section" id="benchmark">
      <div className="section-kicker">Benchmark evidence</div>
      <div className="two-column-heading"><h2>Does it actually<br /><em>work better?</em></h2><p>In the repository’s self-reported MCP Agent A/B, an Antigravity agent answered seven Sock Shop tasks with native tools only, then with skelpr MCP available (WITHOUT arms 2026-09-09/10; WITH arms re-run 2026-09-24 on the current engine). Below it, the same seven questions answer the like-for-like CLI comparison. Pick any agent-A/B task to read the exact prompt and both verbatim answers.</p></div>
      <div className="benchmark-meta"><span><strong>7 × 2</strong> tasks × arms</span><span><strong>Antigravity</strong> Gemini 3.6 Flash Medium</span><span><strong>Sock Shop</strong> microservices demo</span><span><strong>2026-09-24</strong> WITH re-run</span></div>

      {/* Bars are the table's own encoding at card scale, on one shared scale (each
          pair as % of that metric's max). Accuracy is deliberately omitted: its bars
          would be two near-equal slivers implying a flat line, while the +16 lives
          entirely in one negative task — the caveat below owns that honesty, and a
          chart there would argue against it. */}
      <div className="metric-grid"><Metric label="Total tokens" simple="How much context work did the agent do?" without="766,393" withValue="312,056" change="−59.3%" withoutPct={100} withPct={Math.round((312056 / 766393) * 100)} /><Metric label="Files opened" simple="How many files did the agent inspect?" without="113" withValue="27" change="−76.1%" withoutPct={100} withPct={Math.round((27 / 113) * 100)} /><Metric label="Tool calls" simple="How many tool invocations per suite?" without="136 native" withValue="21 skelpr + 31 native" change="−61.8%" withoutPct={100} withPct={Math.round((52 / 136) * 100)} /><Metric label="Accuracy" simple="How many checklist points did the answers earn?" without="619" withValue="621" change="parity (+2 / 700)" /></div>

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

      <div className="caveat"><ShieldCheck size={17} /><div><strong>Read the accuracy number with care.</strong><p>Parity is the headline: all seven tasks score within the ±5 tolerance, and the run-1 gaps (Helm/ingress, the healthcheck step, 3-of-5 image sites) are closed. Two single checklist facts traded the other way (session-db ↔ Makefile; kube-state-metrics), and both arms miss the negative task’s absence phrase (60/60). Token and file-read savings are unaffected.</p></div></div>
      <button className="methodology-toggle" onClick={() => setMethodologyOpen(!methodologyOpen)} aria-expanded={methodologyOpen}><span>Technical methodology & limitations</span><ChevronDown size={17} className={methodologyOpen ? 'rotate' : ''} /></button>{methodologyOpen && <div className="methodology"><div><strong>WITHOUT</strong><p>Skelpr removed from MCP config. Native browse/read/glob/grep tools only.</p></div><div><strong>WITH</strong><p>Native tools plus skelpr MCP, with search-first guidance and 1–3 targeted searches.</p></div><div><strong>Evaluation</strong><p>Accuracy uses task-specific keyword/checklist evaluators (each fact 5–8 points; |Δ| ≤ 5 scores “Same”). No LLM judge. Raw prompts and verbatim outputs are saved in the benchmark artifacts.</p></div></div>}

      {/* The CLI comparison is a first-class result, not a footnote: it is what a CLI or
          headless user measures, and it is the like-for-like pipeline comparison. The
          latency caveat rides inside the block so the ⚠️ marks in the table are never
          read without it. */}
      <div className="mode-one-benchmark"><div><span className="eyebrow">CLI MODE · LIKE-FOR-LIKE REFERENCE</span><h3>The same seven questions, answered without an agent</h3><p>Same model (<code>openai/gpt-oss-120b</code> on Groq), same checkout, same deterministic checklist as the agent A/B. The agentic reference picks files from a repo listing, then reads them — two model calls per task; the hybrid engine answers from pre-ranked, cited chunks in one.</p><p className="cli-latency-note">⚠️ Latency includes Groq free-tier rate-limit backoff (the Skelpr arm ran second and absorbed the waits); on the task with no throttling it answered in 1.56s vs 3.55s. Accuracy is near-parity, not better: 4 of 7 tasks tie, and the agentic reference leads the other three by 5–10 points.</p></div><div className="mode-one-table"><div><span>Pipeline strategy</span><span>Avg. latency</span><span>Avg. total tokens</span><span>Cost / query</span><span>Accuracy</span></div><div><strong>Agentic multi-turn</strong><span>24.39s ⚠️</span><span>7,573</span><span>$0.00200</span><span>88.4 / 100</span></div><div className="highlight-row"><strong>skelpr hybrid engine</strong><span>28.90s ⚠️</span><span>3,925 (−48%)</span><span>$0.00099 (−50%)</span><span>85.1 / 100</span></div></div></div>

      {/* The exit. The page spends three sections proving the claim; the reader who is
          convinced by it needs the next step where the proof ends, not four thousand
          pixels later behind two infrastructure sections. The accent is the same
          "you can act on this" rule the palette enforces everywhere else — this is
          the one place between the hero and the waitlist where the reader can act. */}
      <div className="benchmark-exit">
        <div>
          <strong>Those numbers came from one agent, one repo, one afternoon.</strong>
          <p>Your repository, your agent, your next task — the setup is two prerequisites and four commands.</p>
        </div>
        <a className="button primary" href="#install">Run it on your repo <ArrowRight size={15} /></a>
      </div>
    </section>
  )
}
