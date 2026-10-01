import { Check, Network, Search, Sparkles } from 'lucide-react'

export type Mode = 'standalone' | 'agent'

export type WorkflowStep = {
  id: string
  label: string
  owner: 'agent' | 'skelpr'
  simple: string
  technical: string
  code: string
  accent: string
}

export const workflowSteps: WorkflowStep[] = [
  {
    id: 'task',
    label: 'Task',
    owner: 'agent',
    simple: 'A developer asks the agent a question about a repository.',
    technical: 'The external coding agent receives a repository question, review, or fix request.',
    code: '“does a recommendations service exist?”',
    accent: 'cyan',
  },
  {
    id: 'mcp',
    label: 'MCP Server',
    owner: 'skelpr',
    simple: 'The agent asks skelpr for focused code intelligence instead of opening everything.',
    technical: 'The vendor-neutral skelpr MCP Server exposes skelpr_search and related tools over MCP.',
    code: 'skelpr_search(query, top_k=5)',
    accent: 'blue',
  },
  {
    id: 'retrieve',
    label: 'Retrieve',
    owner: 'skelpr',
    simple: 'Several kinds of evidence are combined: exact matches, symbols, relationships, and meaning.',
    technical: 'HybridRetriever runs lexical, keyword, filename, symbol, graph, and vector retrieval in a deterministic-first order.',
    code: 'lexical → symbol → graph → vector',
    accent: 'blue',
  },
  {
    id: 'rank',
    label: 'Rank + cite',
    owner: 'skelpr',
    simple: 'The strongest snippets are ranked, de-duplicated, and labeled with exact file locations.',
    technical: 'Fusion Ranker applies source priority, overlap merging, file-level deduplication, and source hydration.',
    code: '[LEXICAL] deploy/kubernetes/...:1-23',
    accent: 'green',
  },
  {
    id: 'reason',
    label: 'Reason',
    owner: 'agent',
    simple: 'The agent thinks with the small, relevant context and prepares an answer or change.',
    technical: 'The external agent owns conversation, reasoning, planning, task decomposition, and normal editing.',
    code: 'context → agent LLM → answer / edit plan',
    accent: 'amber',
  },
  {
    id: 'verify',
    label: 'Verify',
    owner: 'skelpr',
    simple: 'When code changes, validation can run in an isolated sandbox or local fallback.',
    technical: 'skelpr_validate runs configured test, lint, and typecheck commands through ValidationRunner.',
    code: 'skelpr_validate(["test", "lint"])',
    accent: 'red',
  },
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

export const heroIcons = { agent: Sparkles, mcp: Network, retrieval: Search, result: Check } as const

export const heroStages: { id: keyof typeof heroIcons; label: string; detail: string; code: string; className: string }[] = [
  { id: 'agent', label: 'You ask', detail: 'A question about the codebase', code: '“does a recommendations service exist?”', className: 'node-agent' },
  { id: 'mcp', label: 'skelpr MCP', detail: 'The agent calls a focused tool instead of reading files', code: 'skelpr_search(query, top_k=5)', className: 'node-mcp' },
  { id: 'retrieval', label: 'Hybrid retrieval', detail: 'Lexical, symbol, graph, and vector evidence fused', code: 'lexical → symbol → graph → vector', className: 'node-retrieval' },
  { id: 'result', label: 'Cited answer', detail: 'Evidence with exact file:line locations', code: '[SYMBOL] skelpr/engine.py:354-379', className: 'node-result' },
]

export const architectureNodes = [
  { id: 'repo', label: 'Repository files', meta: 'source text', group: 'Ingestion' },
  { id: 'scan', label: 'Repo scanner', meta: 'walk + filter', group: 'Ingestion' },
  { id: 'ast', label: 'AST extraction', meta: 'tree-sitter / regex', group: 'Ingestion' },
  { id: 'chunk', label: 'Symbol chunker', meta: 'line fallback', group: 'Ingestion' },
  { id: 'store', label: 'PostgreSQL', meta: 'metadata + RLS', group: 'Data stores' },
  { id: 'vector', label: 'Qdrant', meta: 'vectors + state', group: 'Data stores' },
  { id: 'lexical', label: 'Lexical', meta: 'ripgrep / Python', group: 'Retrieval core' },
  { id: 'symbol', label: 'Symbol', meta: 'definitions + refs', group: 'Retrieval core' },
  { id: 'graph', label: 'Graph', meta: 'import relationships', group: 'Retrieval core' },
  { id: 'hybrid', label: 'Hybrid retriever', meta: 'fusion + citations', group: 'Retrieval core' },
  { id: 'mcp', label: 'MCP server', meta: 'agent integration', group: 'MCP Agent' },
]

// Default desktop arrangement: four columns across three staggered rows.
// Percentages of the map box (node centers).
export const architectureDesktopLayout: { id: string; x: number; y: number }[] = [
  { id: 'scan', x: 12, y: 25 }, { id: 'repo', x: 12, y: 51 },
  { id: 'ast', x: 32, y: 25 }, { id: 'chunk', x: 32, y: 51 }, { id: 'vector', x: 32, y: 86 },
  { id: 'lexical', x: 58, y: 25 }, { id: 'store', x: 58, y: 51 }, { id: 'symbol', x: 58, y: 86 },
  { id: 'mcp', x: 85, y: 25 }, { id: 'hybrid', x: 85, y: 51 }, { id: 'graph', x: 85, y: 86 },
]

// Narrow screens: two columns × six rows so nothing ever overlaps; the map box
// grows taller via CSS at the same breakpoint.
export const architectureMobileLayout: { id: string; x: number; y: number }[] = [
  { id: 'repo', x: 27, y: 14 }, { id: 'scan', x: 73, y: 14 },
  { id: 'ast', x: 27, y: 28.5 }, { id: 'chunk', x: 73, y: 28.5 },
  { id: 'store', x: 27, y: 43 }, { id: 'vector', x: 73, y: 43 },
  { id: 'lexical', x: 27, y: 57.5 }, { id: 'symbol', x: 73, y: 57.5 },
  { id: 'graph', x: 27, y: 72 }, { id: 'hybrid', x: 73, y: 72 },
  { id: 'mcp', x: 50, y: 86.5 },
]

export const architectureEdges = [
  ['repo', 'scan'], ['scan', 'ast'], ['ast', 'chunk'], ['chunk', 'store'], ['chunk', 'vector'],
  ['store', 'symbol'], ['store', 'graph'], ['vector', 'hybrid'], ['lexical', 'hybrid'],
  ['symbol', 'hybrid'], ['graph', 'hybrid'], ['hybrid', 'mcp'],
]


export const modeOptions = [
  { value: 'agent' as Mode, chip: 'MCP AGENT', title: 'Agent Integration', sub: 'MCP Server', heading: 'Agent Integration (MCP Server)', panelChip: 'NO LLM KEY REQUIRED', bestFor: 'Enhancing an existing agent', llm: 'Agent brings its own', reasoning: 'External agent', body: 'Skelpr runs as a code intelligence backend for Claude Code, Cursor, Windsurf, or any MCP-compatible agent. The agent’s LLM handles reasoning; skelpr provides retrieval and validation.' },
  { value: 'standalone' as Mode, chip: 'CLI', title: 'Standalone Package', sub: 'CLI + Own LLM', heading: 'Standalone Package (CLI + Own LLM)', panelChip: 'FULL PIPELINE', bestFor: 'Self-contained workflow', llm: 'Your endpoint', reasoning: 'skelpr model router', body: 'You run skelpr commands directly. Skelpr handles retrieval, context building, LLM calls, patching, and validation end to end through your configured endpoint.' },
]

export const modesDetail = 'The MCP Agent integration uses an external agent through MCP/CLI/HTTP. Headless / Enterprise deployments route application or CI traffic through the skelpr API, retrieval, and LLM gateway.'

export const architectureCopy = (id: string, detailMode: 'simple' | 'technical') => {
  const simple: Record<string, string> = {
    repo: 'The repository is the source of truth. Skelpr starts from its tracked text files.',
    scan: 'The scanner walks the repository, respects ignore rules, and classifies files.',
    ast: 'Code structure is extracted when possible. A regex fallback keeps indexing functional.',
    chunk: 'Code is split around symbols such as functions, classes, and methods.',
    store: 'Metadata, hashes, files, chunks, and symbols are stored here with tenant isolation.',
    vector: 'Embeddings support semantic search, with an in-memory fallback when needed.',
    lexical: 'Exact terms and filenames surface concrete matches first.',
    symbol: 'Definitions, references, and implementations add structural context.',
    graph: 'Import relationships provide architecture-level context.',
    hybrid: 'The orchestrator combines retrieval sources, then reranks and cites the best evidence.',
    mcp: 'The MCP server gives an external agent a compact, standard integration surface.',
  }
  const technical: Record<string, string> = {
    repo: 'scan_repository() prefers git ls-files and filters non-text files before indexing.',
    scan: 'Repo Scanner applies .skelpr.yaml ignore patterns and records language metadata and hashes.',
    ast: 'tree_sitter_indexer.extract() emits symbols/imports; language-aware regex extraction is the fallback.',
    chunk: 'chunk_by_symbols() aligns chunks to outermost symbol spans and falls back to overlapping line windows.',
    store: 'PostgreSQL stores file/chunk/symbol/import records and index state under tenant-aware metadata access.',
    vector: 'VectorStore uses Qdrant when reachable; otherwise an in-memory cosine index tracks degraded state.',
    lexical: 'LexicalRetriever prefers ripgrep and falls back to a Python scanner with IDF-weighted coverage.',
    symbol: 'SymbolIndex uses SCIP when available in the environment; otherwise it uses the AST-backed symbol table.',
    graph: 'GraphifyAdapter currently reports static-import-graph and persists nodes, edges, and summary.txt.',
    hybrid: 'HybridRetriever executes lexical → symbol → graph → vector, dedups by path/line, reranks, and hydrates source.',
    mcp: 'mcp_server registers skelpr_search, get_context, find_symbol, dependencies, validate, health, and AST patching.',
  }
  return detailMode === 'simple' ? simple[id] : technical[id]
}

export const architectureBackend = (id: string) => {
  const backends: Record<string, string> = {
    repo: 'tracked files / filesystem', scan: 'git ls-files → os.walk', ast: 'tree-sitter → regex-fallback', chunk: 'symbol spans → line windows',
    store: 'PostgreSQL → in-memory store', vector: 'Qdrant → memory cosine', lexical: 'ripgrep → Python scanner', symbol: 'SCIP → ast-fallback', graph: 'static-import-graph', hybrid: 'source-priority fusion', mcp: 'stdio MCP protocol',
  }
  return backends[id]
}
