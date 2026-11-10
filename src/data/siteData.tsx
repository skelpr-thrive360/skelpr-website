import { Check, Network, Search, Terminal } from 'lucide-react'

export type Mode = 'standalone' | 'agent'

// Public workflow: inputs, evidence and agent responsibility.
export const workflowSteps = [
  { id: 'task', label: 'Ask', owner: 'agent', title: 'Start with a repository question', description: 'Ask your coding agent about a behavior, a cross-file flow or a change. The agent decides whether to call Skelpr.', example: 'Where is a request validated before it is saved?', note: 'Your existing chat and model stay in place.' },
  { id: 'mcp', label: 'Call MCP', owner: 'agent', title: 'Send the complete question', description: 'The agent calls skelpr_search with the required query argument. It can leave the context budget automatic or set an explicit limit.', example: 'skelpr_search({query: "Where is a request validated before it is saved?"})', note: 'Install the integration, reconnect the client and allow tool access first.' },
  { id: 'retrieve', label: 'Retrieve', owner: 'skelpr', title: 'Collect related source evidence', description: 'Skelpr finds source excerpts relevant to the question, including related code across files. It returns context rather than generating the final answer.', example: 'Repository question → related source excerpts', note: 'The indexed checkout and configured providers determine what is available.' },
  { id: 'cite', label: 'Cite', owner: 'skelpr', title: 'Return a bounded response', description: 'Excerpts include file paths and line ranges. Context limits keep responses bounded; coverage notes identify missing or omitted evidence.', example: 'Source excerpt + file:line range + coverage note', note: 'Missing evidence can require a focused follow-up request.' },
  { id: 'reason', label: 'Answer or edit', owner: 'agent', title: 'Use the evidence', description: 'The agent explains the code or proposes a change using the cited source. It can request missing context or use native tools where needed.', example: 'Evidence → cited answer or proposed edit', note: 'Accurate retrieval does not guarantee an accurate answer. Check the citations.' },
  { id: 'verify', label: 'Validate', owner: 'skelpr', title: 'Run configured checks', description: 'When requested, skelpr_validate runs configured test, lint or typecheck commands. Validation uses Docker by default; host execution requires explicit opt-in.', example: 'skelpr_validate({only: ["test", "lint"]})', note: 'Review the commands and results before accepting a change.' },
]

export const benchmarkTasks = [
  ['service_architecture', 'retrieval', 95, 95, '79.8k → 62.0k'],
  ['request_flow', 'retrieval', 100, 100, '140.5k → 59.4k'],
  ['monitoring_stack', 'retrieval', 88, 82, '158.9k → 41.2k'],
  ['dependency_impact', 'dependency', 92, 92, '176.1k → 52.6k'],
  ['fix_catalogue_image', 'fix', 84, 92, '72.9k → 46.2k'],
  ['negative_missing_service', 'negative', 60, 60, '88.7k → 26.1k'],
  ['exact_file_catalogue', 'exact_file', 100, 100, '49.4k → 24.7k'],
] as const

export type QaVerdict = 'better' | 'same' | 'weaker'

export type BenchmarkQaMetric = { label: string; without: string; withValue: string }

// Grounded in tests/benchmarking/constants.py (questions), the per-task metric
// tables in docs/comparisons/COMP_ANTIGRAVITY.md and docs/BENCHMARK.md, and the
// curated per-task analysis in tests/benchmarking/generate_comparison_doc.py.
// Run of record: WITHOUT arms 2026-09-09/10, WITH arms re-run 2026-09-24 on the
// post-hardening engine with the fuller index (196 files / 371 chunks).
export const benchmarkQa: { task: string; question: string; verdict: QaVerdict; delta: string; why: string; diffs: string[]; judgement: string; footnote?: string; metrics: BenchmarkQaMetric[] }[] = [
  {
    task: 'service_architecture',
    question: 'Explain the architecture of this microservices demo (Sock Shop): identify the main services (carts, catalogue, front-end, orders, payment, queue-master, shipping, user), the data stores and message broker backing them, and the key deployment files (docker-compose, Kubernetes manifests, Helm chart) that define the system.',
    verdict: 'same',
    delta: '95 → 95',
    why: 'A score-neutral swap: WITH’s table omits the Redis session-db row (−5) but adds the Makefile workflow (+5)',
    diffs: [
      'Both arms name the same eight services and the same deployment surface (docker-compose, manifests/, complete-demo.yaml, Helm chart). WITH answers as a reference table with exact image tags; WITHOUT as a prose essay.',
      'Score-neutral swaps: WITH’s table omits the Redis session-db store (the −5 infra point) but adds the Makefile make gen-complete-demo workflow (the +5 deployment point) — the 95/95 tie is those two facts trading places.',
      'WITH additionally lists every numbered manifest (00-sock-shop-ns.yaml through 26-user-db-svc.yaml); WITHOUT names the directories instead.',
    ],
    judgement: 'WITH is the better answer to show someone — image versions for every service and a table you can scan in seconds, at 22% fewer tokens. The one thing WITHOUT has that WITH doesn’t is the Redis session-db row; WITH alone has the Makefile workflow. On facts, it’s a wash.',
    metrics: [
      { label: 'Accuracy', without: '95', withValue: '95' },
      { label: 'Tokens', without: '79.8k', withValue: '62.0k (↓22%)' },
      { label: 'Duration', without: '25.7s', withValue: '89.5s (↑249%)' },
      { label: 'Files read', without: '14', withValue: '4 (↓71%)' },
      { label: 'Tool calls', without: '15 native', withValue: '4 native + 3 skelpr' },
    ],
  },
  {
    task: 'request_flow',
    question: 'Trace the complete path of a user request through this Sock Shop microservices deployment: starting at the front-end service, identify which services it calls, how those services reach their data stores, and the concrete manifests / compose files that wire the pieces together (services, ports, ingress).',
    verdict: 'same',
    delta: '100 → 100',
    why: 'Identical request path end-to-end — the Helm/ingress gap from run 1 is closed',
    diffs: [
      'Same request path in both arms: edge-router/NodePort → front-end → catalogue/carts/user/orders → payment/shipping → rabbitmq → queue-master, including the session-db detail AND the Helm/ingress mention — the expanded index (196 files vs 146) closed run-1’s Helm gap.',
      'WITHOUT goes deeper on wiring: netpol-* network policies, a mermaid diagram, and a closing service×port×manifest table. WITH is the compact trace with image versions per hop, at 58% fewer tokens.',
    ],
    judgement: 'A clean tie on facts — and the run-1 gap (the Helm/ingress template) is gone. WITHOUT’s extras are depth beyond the core trace; WITH answers the same question at 58% fewer tokens with image versions for every hop.',
    metrics: [
      { label: 'Accuracy', without: '100', withValue: '100' },
      { label: 'Tokens', without: '140.5k', withValue: '59.4k (↓58%)' },
      { label: 'Duration', without: '73.1s', withValue: '111.5s (↑52%)' },
      { label: 'Files read', without: '24', withValue: '5 (↓79%)' },
      { label: 'Tool calls', without: '28 native', withValue: '8 native + 3 skelpr' },
    ],
  },
  {
    task: 'monitoring_stack',
    question: 'Find how monitoring is set up in this repository: identify the Prometheus, Grafana, Alertmanager, and Jaeger components, the directories and manifests that define them, and how they connect to the shop services.',
    verdict: 'same',
    delta: '88 → 82',
    why: 'Every manifest WITH lists is real — the −6 is a single missing fact: kube-state-metrics',
    diffs: [
      'Every manifest in WITH’s file list exists (04-prometheus-configmap.yaml, 25-prometheus-node-exporter-daemonset.yaml, the manifests-alerting/ trio…) — run-1’s hallucinated names stay gone. The −6 is one missing checklist fact: kube-state-metrics is never named.',
      'Both arms miss the Fluentd/EFK logging stack (0/12) — that one is unchanged.',
      'WITH costs 74% fewer tokens (158.9k → 41.2k) and enumerates per-service scrape annotations across six Service manifests.',
    ],
    judgement: 'Call it even, with different failure modes. WITH dropped the run-1 hallucinated filenames entirely and its cleaner file list is the safer one to reuse; both still miss kube-state-metrics, and both miss the logging stack.',
    metrics: [
      { label: 'Accuracy', without: '88', withValue: '82' },
      { label: 'Tokens', without: '158.9k', withValue: '41.2k (↓74%)' },
      { label: 'Duration', without: '84.0s', withValue: '75.1s (↓11%)' },
      { label: 'Files read', without: '24', withValue: '4 (↓83%)' },
      { label: 'Tool calls', without: '31 native', withValue: '4 native + 3 skelpr' },
    ],
  },
  {
    task: 'dependency_impact',
    question: 'If the catalogue service in this repository were changed (for example its container image or its database), identify which deployment files, Kubernetes manifests / Helm templates, Service definitions, and verification steps would be affected.',
    verdict: 'same',
    delta: '92 → 92',
    why: 'Tied 92/92 — the healthcheck step the last run missed is named by BOTH arms now',
    diffs: [
      'The run-1 healthcheck gap is closed: WITH now walks healthcheck/healthcheck.rb too. Both arms cover the manifests, compose files, HPA and network policies.',
      'The 92/92 tie hides different verification lists: WITHOUT adds Dredd + OpenAPI contract tests, WITH adds loadtest + CI wiring.',
      'Wall-clock flipped (51s → 107s) on one slow search burst; live median search latency is 0.54s.',
    ],
    judgement: 'A dead heat with different strengths: WITHOUT’s verification list leans on contract tests, WITH’s on CI wiring and load tests — and the healthcheck step both need is now present on both sides, at 70% fewer tokens.',
    metrics: [
      { label: 'Accuracy', without: '92', withValue: '92' },
      { label: 'Tokens', without: '176.1k', withValue: '52.6k (↓70%)' },
      { label: 'Duration', without: '51.0s', withValue: '106.5s (↑109%)' },
      { label: 'Files read', without: '28', withValue: '7 (↓75%)' },
      { label: 'Tool calls', without: '32 native', withValue: '7 native + 3 skelpr' },
    ],
  },
  {
    task: 'fix_catalogue_image',
    question: 'The catalogue service needs to be updated to use a new container image version. Identify the exact deployment file(s) that reference the catalogue image in this repository and provide the precise YAML change required, including the manifest path.',
    verdict: 'same',
    delta: '84 → 92',
    why: 'The run-1 recall gap is gone: WITH names all 5 image sites and adds the verification step (+8 — under the +10 Better threshold)',
    diffs: [
      'The run-1 recall gap is gone: complete-demo.yaml and helm-chart/values.yaml both surface now, and WITH names all 5 image sites (run 1: 3 of 5) — the fresh index without the old hand-tuned ignores is the difference.',
      'The +8 is the verification bucket (8/16 vs 0/16): WITH closes with an explicit post-change check; neither arm mentions kubectl/rollout.',
      'WITH is 67% faster (98s vs 301s — WITHOUT spent five minutes exploring) and 37% cheaper (72.9k → 46.2k tokens).',
    ],
    judgement: 'The clearest win of the re-run: the same precise YAML edits, all five image sites instead of three, and an explicit post-change verification step — at 37% fewer tokens and 67% less wall-clock.',
    metrics: [
      { label: 'Accuracy', without: '84', withValue: '92' },
      { label: 'Tokens', without: '72.9k', withValue: '46.2k (↓37%)' },
      { label: 'Duration', without: '301s', withValue: '98s (↓67%)' },
      { label: 'Files read', without: '8', withValue: '5 (↓37%)' },
      { label: 'Tool calls', without: '9 native', withValue: '6 native + 3 skelpr' },
    ],
  },
  {
    task: 'negative_missing_service',
    question: 'A developer claims this repository defines a “recommendations” service (sometimes called “inventory”). Verify whether that service actually exists here: search the repository, report exactly what you find (or do not find), and do not invent files or services.',
    verdict: 'same',
    delta: '60 → 60',
    why: 'Both 60 — same correct verdict, and the evaluator’s absence-phrase list misses BOTH answers',
    diffs: [
      'Both arms reach the same correct verdict — no recommendations / inventory service exists — and both lose the same 40-point absence bucket: the evaluator’s phrase list (“does not exist”, “not found”, …) matches neither answer’s “no … service exists” phrasing. The 60 understates both, equally.',
      'Both verify by search and both call out the false-positive “recommend” prose hits; neither fabricates a path. WITH does it with 3 cited searches and 1 file read (26.1k tokens); WITHOUT browses 9 files (88.7k).',
    ],
    judgement: 'Equal in correctness, equal in score, wildly unequal in cost — WITH proves the absence with 3 cited searches and a single file read, at 71% fewer tokens. The score understates both answers identically.',
    footnote: 'The score understates both arms equally: the evaluator’s absence-phrase list matches neither answer’s phrasing.',
    metrics: [
      { label: 'Accuracy', without: '60', withValue: '60' },
      { label: 'Tokens', without: '88.7k', withValue: '26.1k (↓71%)' },
      { label: 'Duration', without: '19.9s', withValue: '58.1s (↑193%)' },
      { label: 'Files read', without: '9', withValue: '1 (↓88%)' },
      { label: 'Tool calls', without: '13 native', withValue: '1 native + 3 skelpr' },
    ],
  },
  {
    task: 'exact_file_catalogue',
    question: 'List the exact file paths in this repository that define the catalogue service: its Kubernetes Deployment, its Kubernetes Service, its database Deployment/Service, and its docker-compose entry. Give full paths (e.g. deploy/kubernetes/manifests/…).',
    verdict: 'same',
    delta: '100 → 100',
    why: 'Both perfect, same exact paths — WITH needs 1 file read instead of 6',
    diffs: [
      'Both arms list the same five exact paths (05–08 catalogue/db manifests + docker-compose.yml) — perfect 100/100 on both sides.',
      'WITH gets there with 1 file read vs 6 and half the tokens — the search result carries the paths, so almost no browsing is needed.',
      'Beyond the required paths, WITHOUT adds the Helm templates and the HPA; WITH adds the Jaeger variant and the compose logging overlay.',
    ],
    judgement: 'Both arms list the same five exact paths — perfect on both sides. WITH just gets there with one file read instead of six, at half the tokens.',
    metrics: [
      { label: 'Accuracy', without: '100', withValue: '100' },
      { label: 'Tokens', without: '49.4k', withValue: '24.7k (↓50%)' },
      { label: 'Duration', without: '26.0s', withValue: '55.1s (↑112%)' },
      { label: 'Files read', without: '6', withValue: '1 (↓83%)' },
      { label: 'Tool calls', without: '8 native', withValue: '1 native + 3 skelpr' },
    ],
  },
]

export const heroIcons = { agent: Terminal, mcp: Network, retrieval: Search, result: Check } as const

export const heroStages: { id: keyof typeof heroIcons; label: string; detail: string; code: string; className: string }[] = [
  { id: 'agent', label: 'Question', detail: 'Example: a cross-file code question.', code: 'Where is a request validated before it is saved?', className: 'node-agent' },
  { id: 'mcp', label: 'MCP call', detail: 'Your agent sends the question to Skelpr.', code: 'skelpr_search({query: "Where is a request validated before it is saved?"})', className: 'node-mcp' },
  { id: 'retrieval', label: 'Evidence', detail: 'Source excerpts within a context limit.', code: 'Excerpts + file:line ranges + coverage notes', className: 'node-retrieval' },
  { id: 'result', label: 'Agent answer', detail: 'The agent checks the evidence and cites the source.', code: 'Read evidence → answer or edit → verify', className: 'node-result' },
]

export const modeOptions = [
  { value: 'agent' as Mode, chip: 'MCP', title: 'Coding agent', sub: 'Use your existing client', heading: 'Connect through MCP', panelChip: 'YOUR AGENT REASONS', bestFor: 'Existing agent workflows', llm: 'Your coding agent', reasoning: 'Your coding agent', body: 'Connect Codex, Claude Code, Cursor or another MCP client. Skelpr returns repository evidence; your agent writes the answer or edit. Reconnect after setup and allow tool access in the client.' },
  { value: 'standalone' as Mode, chip: 'CLI', title: 'Terminal', sub: 'Use a configured model', heading: 'Run commands directly', panelChip: 'GENERATION PROVIDER REQUIRED', bestFor: 'Terminal workflows', llm: 'Configured provider', reasoning: 'Configured model', body: 'Run ask, chat, review or fix from the terminal. Skelpr supplies repository context to your configured generation model. Review proposed changes and run the relevant checks.' },
]

export const modesDetail = 'MCP retrieval needs no Skelpr generation key. Hosted embeddings may still need credentials. Standalone generation and embeddings are configured separately. Installing an MCP server makes tools available; it does not force an agent to call them.'
