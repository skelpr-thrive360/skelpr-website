import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronRight, Equal, Expand, Shrink, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react'
import { benchmarkQa, benchmarkTasks } from '../data/siteData'
import type { QaVerdict } from '../data/siteData'
import { Metric, scrollToElement } from './Shared'
import QaColumns from './QaColumns'
import { DjangoCaseStudy } from './DjangoCaseStudy'
import { ScrollTrigger } from '../lib/anim'

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
  const [study, setStudy] = useState<'sock-shop' | 'django'>('sock-shop')
  const [selectedTask, setSelectedTask] = useState<string>(benchmarkQa[0].task)
  const [answersExpanded, setAnswersExpanded] = useState(false)
  const [methodologyOpen, setMethodologyOpen] = useState(false)
  const [answersReady, setAnswersReady] = useState(false)
  const qaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ScrollTrigger.refresh()
  }, [study, methodologyOpen, answersExpanded, selectedTask, answersReady])

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
      <div className="two-column-heading"><h2>Two repositories.<br /><em>Two agent setups.</em></h2><p>Start with Sock Shop on Gemini and Antigravity, then compare the Django study on Codex. Each study compares its own native-tools baseline with Skelpr MCP. These are separate case studies, not a head-to-head model comparison.</p></div>
      <div className="case-study-switcher" role="tablist" aria-label="Benchmark case study">
        {(['sock-shop', 'django'] as const).map((value, index) => (
          <button type="button" key={value} id={`study-tab-${value}`} role="tab" aria-selected={study === value} aria-controls={`study-panel-${value}`} tabIndex={study === value ? 0 : -1} onClick={() => setStudy(value)} onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
            event.preventDefault()
            const next = event.key === 'Home' ? 'sock-shop' : event.key === 'End' ? 'django' : value === 'sock-shop' ? 'django' : 'sock-shop'
            setStudy(next)
            document.getElementById(`study-tab-${next}`)?.focus()
          }}><span>0{index + 1} · {value === 'sock-shop' ? 'Sock Shop' : 'Django'}</span><small>{value === 'sock-shop' ? 'Gemini · Antigravity · 7 tasks' : 'GPT-6 Astra · Codex · 10 tasks'}</small></button>
        ))}
      </div>

      <div id="study-panel-sock-shop" role="tabpanel" aria-labelledby="study-tab-sock-shop" hidden={study !== 'sock-shop'} tabIndex={0}>
      <div className="two-column-heading"><h3>Sock Shop · September 2026</h3><p>Seven tasks with Antigravity: native tools alone, then native tools with Skelpr MCP. Native runs were recorded September 9–10; Skelpr runs on September 24. Figures below are retained historical reports with known reconciliation gaps.</p></div>
      <div className="benchmark-meta"><span><strong>7 × 2</strong> tasks × arms</span><span><strong>Antigravity</strong> Gemini 3.6 Flash Medium</span><span><strong>Sock Shop</strong> microservices demo</span><span><strong>2026-09-24</strong> WITH re-run</span></div>

      <div className="metric-grid"><Metric label="Reported total tokens" simple="Historical aggregate; not fully reproduced" without="766,393" withValue="312,056" change="−59.3%" withoutPct={100} withPct={Math.round((312056 / 766393) * 100)} /><Metric label="Files opened" simple="Reported files inspected" without="113" withValue="27" change="−76.1%" withoutPct={100} withPct={Math.round((27 / 113) * 100)} /><Metric label="Tool calls" simple="Reported invocations across seven tasks" without="136 native" withValue="21 skelpr + 31 native" change="−61.8%" withoutPct={100} withPct={Math.round((52 / 136) * 100)} /><Metric label="Rubric score" simple="Reported checklist points" without="619" withValue="621" change="+2 / 700 points" /></div>

      <div className="benchmark-table-wrap">
        <div className="table-heading"><div><span className="eyebrow">SEVEN HISTORICAL TASKS</span><h3>Prompts, scores, and answers</h3></div><span className="table-key"><i className="without-key" /> WITHOUT <i className="with-key" /> WITH · <em>select a row to read the answers</em><span className="scroll-cue">scroll for all columns →</span></span></div>
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
          <div className="qa-diffs"><strong>Reported differences</strong><ul>{qa.diffs.map((diff) => <li key={diff}>{diff}</li>)}</ul></div>
          <div className="qa-judgement"><strong>Historical assessment</strong><p>{qa.judgement}</p></div>
          {qa.footnote && <div className="qa-footnote"><ShieldCheck size={14} /> {qa.footnote}</div>}
        </div>
      </div>

      <div className="caveat"><ShieldCheck size={17} /><div><strong>Historical figures with known reconciliation gaps.</strong><p>Retained artifacts do not fully reproduce the published aggregate or architecture row. The reported totals and assessments are preserved for reference. They do not establish current-build performance or accuracy parity on every task.</p></div></div>
      <button className="methodology-toggle" onClick={() => setMethodologyOpen(!methodologyOpen)} aria-expanded={methodologyOpen}><span>Technical methodology & limitations</span><ChevronDown size={17} className={methodologyOpen ? 'rotate' : ''} /></button>{methodologyOpen && <div className="methodology"><div><strong>WITHOUT</strong><p>Skelpr removed from MCP config. Native browse/read/glob/grep tools only.</p></div><div><strong>WITH</strong><p>Native tools plus skelpr MCP, with search-first guidance and 1–3 targeted searches.</p></div><div><strong>Evaluation</strong><p>Scores use task-specific keyword/checklist evaluators, without an LLM judge. Verdict labels retain the historical assessments; consult the numeric scores for differences. Prompts and verbatim outputs are preserved.</p></div></div>}

      <div className="mode-one-benchmark"><div><span className="eyebrow">HISTORICAL CLI COMPARISON</span><h3>The same seven questions in CLI mode</h3><p>Both arms used <code>openai/gpt-oss-120b</code> on Groq, the same checkout, and the same checklist. The reference used two model calls per task; Skelpr used one.</p><p className="cli-latency-note">Latency includes Groq free-tier rate-limit waits. Skelpr ran second. On the unthrottled task, it took 1.56s versus 3.55s. Four tasks tied on score; the reference led the other three by 5–10 points.</p></div><div className="mode-one-table"><div><span>Mode</span><span>Avg. latency</span><span>Avg. total tokens</span><span>Cost / query</span><span>Rubric score</span></div><div><strong>Multi-turn reference</strong><span>24.39s</span><span>7,573</span><span>$0.00200</span><span>88.4 / 100</span></div><div className="highlight-row"><strong>Skelpr CLI</strong><span>28.90s</span><span>3,925 (−48%)</span><span>$0.00099 (−50%)</span><span>85.1 / 100</span></div></div></div>
      </div>
      <div id="study-panel-django" role="tabpanel" aria-labelledby="study-tab-django" hidden={study !== 'django'} tabIndex={0}>
        <DjangoCaseStudy active={study === 'django'} />
      </div>

      {/* The exit. The page spends three sections proving the claim; the reader who is
          convinced by it needs the next step where the proof ends, not four thousand
          pixels later behind two infrastructure sections. The accent is the same
          "you can act on this" rule the palette enforces everywhere else — this is
          the one place between the hero and the waitlist where the reader can act. */}
      <div className="benchmark-exit">
        <div>
          <strong>Measure your own tasks.</strong>
          <p>Results depend on the task, model, cache state and indexed checkout. Measure your own workflow.</p>
        </div>
        <a className="button primary" href="#install">Run it on your repo <ArrowRight size={15} /></a>
      </div>
    </section>
  )
}
