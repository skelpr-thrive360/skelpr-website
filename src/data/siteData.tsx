import { Check, Network, Search, Sparkles } from 'lucide-react'

export type Mode = 'standalone' | 'agent'

export type WorkflowStep = {
  id: string
  label: string
  owner: 'agent' | 'locodex'
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
    owner: 'locodex',
    simple: 'The agent asks LoCoDex for focused code intelligence instead of opening everything.',
    technical: 'The vendor-neutral LoCoDex MCP Server exposes locodex_search and related tools over MCP.',
    code: 'locodex_search(query, top_k=5)',
    accent: 'blue',
  },
  {
    id: 'retrieve',
    label: 'Retrieve',
    owner: 'locodex',
    simple: 'Several kinds of evidence are combined: exact matches, symbols, relationships, and meaning.',
    technical: 'HybridRetriever runs lexical, keyword, filename, symbol, graph, and vector retrieval in a deterministic-first order.',
    code: 'lexical → symbol → graph → vector',
    accent: 'blue',
  },
  {
    id: 'rank',
    label: 'Rank + cite',
    owner: 'locodex',
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
    owner: 'locodex',
    simple: 'When code changes, validation can run in an isolated sandbox or local fallback.',
    technical: 'locodex_validate runs configured test, lint, and typecheck commands through ValidationRunner.',
    code: 'locodex_validate(["test", "lint"])',
    accent: 'red',
  },
]

export const benchmarkTasks = [
  ['service_architecture', 'retrieval', 95, 90, '79.8k → 49.0k'],
  ['request_flow', 'retrieval', 100, 95, '140.5k → 39.3k'],
  ['monitoring_stack', 'retrieval', 88, 82, '158.9k → 64.5k'],
  ['dependency_impact', 'dependency', 92, 84, '176.1k → 63.6k'],
  ['fix_catalogue_image', 'fix', 84, 84, '46.8k → 76.6k'],
  ['negative_missing_service', 'negative', 60, 100, '88.7k → 44.5k'],
  ['exact_file_catalogue', 'exact_file', 100, 100, '49.4k → 46.8k'],
] as const

export type QaVerdict = 'better' | 'same' | 'weaker'

export type BenchmarkQaMetric = { label: string; without: string; withValue: string }

// Grounded in tests/benchmarking/constants.py (questions), the per-task metric
// tables in docs/comparisons/COMP_ANTIGRAVITY.md, and the curated per-task
// analysis in tests/benchmarking/generate_comparison_doc.py.
export const benchmarkQa: { task: string; question: string; verdict: QaVerdict; delta: string; why: string; diffs: string[]; judgement: string; footnote?: string; metrics: BenchmarkQaMetric[] }[] = [
  {
    task: 'service_architecture',
    question: 'Explain the architecture of this microservices demo (Sock Shop): identify the main services (carts, catalogue, front-end, orders, payment, queue-master, shipping, user), the data stores and message broker backing them, and the key deployment files (docker-compose, Kubernetes manifests, Helm chart) that define the system.',
    verdict: 'same',
    delta: '95 → 90',
    why: 'Same 8 services + deployment files; WITH omits the Redis session-db store',
    diffs: [
      'Both arms name the same eight services and the same deployment surface (docker-compose, manifests/, complete-demo.yaml, Helm chart). WITH answers as a reference table with exact image tags; WITHOUT as a prose essay.',
      'WITH omits the Redis session-db session store — its front-end row says “None” — the single 5-point fact behind the −5.',
      'WITH additionally lists every numbered manifest (00-sock-shop-ns.yaml through 26-user-db-svc.yaml); WITHOUT names the directories instead.',
    ],
    judgement: 'WITH is the better answer to show someone — image versions for every service, the full numbered manifest list, a table you can scan in seconds, at 39% fewer tokens. The one thing WITHOUT has that WITH doesn’t is the Redis session-db store. Complete-over-pretty? Pick WITHOUT. Useful-over-complete? Pick WITH.',
    metrics: [
      { label: 'Accuracy', without: '95', withValue: '90' },
      { label: 'Tokens', without: '79.8k', withValue: '49.0k (↓39%)' },
      { label: 'Duration', without: '25.7s', withValue: '21.5s (↓16%)' },
      { label: 'Files read', without: '14', withValue: '5 (↓64%)' },
      { label: 'Tool calls', without: '15 native', withValue: '5 native + 3 LoCoDex' },
    ],
  },
  {
    task: 'request_flow',
    question: 'Trace the complete path of a user request through this Sock Shop microservices deployment: starting at the front-end service, identify which services it calls, how those services reach their data stores, and the concrete manifests / compose files that wire the pieces together (services, ports, ingress).',
    verdict: 'same',
    delta: '100 → 95',
    why: 'Same request path end-to-end; WITH omits the Helm/ingress mention',
    diffs: [
      'Same request path in both arms: edge-router/NodePort → front-end → catalogue/carts/user/orders → payment/shipping → rabbitmq → queue-master, including the session-db Redis detail.',
      'WITH never mentions the Helm chart / ingress template — the one 5-point fact behind the −5. WITHOUT additionally cites the network policies (netpol-*) and closes with a full service×port×manifest summary table.',
      'Presentation differs a lot: WITHOUT is a mermaid-diagram essay (14.2 KB); WITH is a structured list (8.5 KB) that names image versions for every hop.',
    ],
    judgement: 'WITH answers the question as asked — the same request path, stores and ports, image versions for every hop — at 72% fewer tokens. WITHOUT’s extras (mermaid diagram, network policies, Helm ingress) are depth beyond the core trace, and the −5 is exactly one unasked keyword.',
    metrics: [
      { label: 'Accuracy', without: '100', withValue: '95' },
      { label: 'Tokens', without: '140.5k', withValue: '39.3k (↓72%)' },
      { label: 'Duration', without: '73.1s', withValue: '18.9s (↓74%)' },
      { label: 'Files read', without: '24', withValue: '3 (↓88%)' },
      { label: 'Tool calls', without: '28 native', withValue: '3 native + 3 LoCoDex' },
    ],
  },
  {
    task: 'monitoring_stack',
    question: 'Find how monitoring is set up in this repository: identify the Prometheus, Grafana, Alertmanager, and Jaeger components, the directories and manifests that define them, and how they connect to the shop services.',
    verdict: 'same',
    delta: '88 → 82',
    why: 'Hallucinated filenames from run 1 are gone; WITH now misses only the kube-state-metrics mention',
    diffs: [
      'Every manifest in WITH’s file list exists — the −6 is a single missing checklist fact: kube-state-metrics is never named.',
      'Both arms miss the Fluentd/EFK logging stack (0/12) — that one is unchanged.',
      'WITH enumerates per-service scrape annotations across six Service manifests and the Grafana import workflow at 59% fewer tokens.',
    ],
    judgement: 'Call it even, with different failure modes. WITH dropped the run-1 hallucinated filenames entirely and its cleaner file list is the safer one to reuse, at 59% fewer tokens; both still miss kube-state-metrics.',
    metrics: [
      { label: 'Accuracy', without: '88', withValue: '82' },
      { label: 'Tokens', without: '158.9k', withValue: '64.5k (↓59%)' },
      { label: 'Duration', without: '84.0s', withValue: '31.3s (↓63%)' },
      { label: 'Files read', without: '24', withValue: '6 (↓75%)' },
      { label: 'Tool calls', without: '31 native', withValue: '7 native + 3 LoCoDex' },
    ],
  },
  {
    task: 'dependency_impact',
    question: 'If the catalogue service in this repository were changed (for example its container image or its database), identify which deployment files, Kubernetes manifests / Helm templates, Service definitions, and verification steps would be affected.',
    verdict: 'weaker',
    delta: '92 → 84',
    why: 'WITH still drops the healthcheck step, and now also the explicit Service-definition mention',
    diffs: [
      'Affected-files coverage narrowed: WITH names the manifests, compose files, HPA and network policies but misses the Service-definition and Helm checklist mentions.',
      'The healthcheck verification step is STILL missing even with explicit guidance — the queries never surfaced healthcheck/healthcheck.rb, a search-behavior gap, not an engine one. WITHOUT walks the healthcheck + CI + Dredd trio.',
      'WITH is 63% faster (19s vs 51s) and reads 6 files instead of 28 — the impact analysis is thinner but much cheaper.',
    ],
    judgement: 'WITHOUT wins this one — the healthcheck step plus the explicit Service-definition mention. If you’re going to act on the answer, WITHOUT’s plan is the more complete one — at roughly three times the wall-clock.',
    metrics: [
      { label: 'Accuracy', without: '92', withValue: '84' },
      { label: 'Tokens', without: '176.1k', withValue: '63.6k (↓64%)' },
      { label: 'Duration', without: '51.0s', withValue: '19.1s (↓63%)' },
      { label: 'Files read', without: '28', withValue: '6 (↓79%)' },
      { label: 'Tool calls', without: '32 native', withValue: '6 native + 3 LoCoDex' },
    ],
  },
  {
    task: 'fix_catalogue_image',
    question: 'The catalogue service needs to be updated to use a new container image version. Identify the exact deployment file(s) that reference the catalogue image in this repository and provide the precise YAML change required, including the manifest path.',
    verdict: 'same',
    delta: '84 → 84',
    why: 'Back to parity 84/84 — WITH names 3 of 5 image sites but adds probe/contract-test verification',
    diffs: [
      'The YAML change itself is precise in all three named files (manifest path, line numbers, before/after, placeholder), and WITH adds the liveness/readiness probe values and the OpenAPI contract-test verification WITHOUT only gestures at.',
      'The residual gap is unchanged: the image lives in 5 files, WITH names 3 — the two misses never surface in the retrieval index even at top-25, an index recall gap, not a prompting one.',
    ],
    judgement: 'Parity, different strengths — WITHOUT still catches 5 of 5 image references, while WITH adds concrete probe/contract-test verification and finishes with 16% fewer tokens.',
    metrics: [
      { label: 'Accuracy', without: '84', withValue: '84' },
      { label: 'Tokens', without: '46.8k', withValue: '76.6k (↑64%)' },
      { label: 'Duration', without: '21.2s', withValue: '29.1s (↑38%)' },
      { label: 'Files read', without: '9', withValue: '6 (↓33%)' },
      { label: 'Tool calls', without: '10 native', withValue: '8 native + 2 LoCoDex' },
    ],
  },
  {
    task: 'negative_missing_service',
    question: 'A developer claims this repository defines a “recommendations” service (sometimes called “inventory”). Verify whether that service actually exists here: search the repository, report exactly what you find (or do not find), and do not invent files or services.',
    verdict: 'better',
    delta: '60 → 100',
    why: '+40 is a phrase-match artifact — the answers are substantively equal',
    diffs: [
      'Both arms reach the same correct verdict: no recommendations / inventory service exists here. Both cite the false-positive “recommend” hits (prose in design.md, grafana-service.yaml, LICENSE) and both enumerate the services that do exist.',
      'The +40 is a scoring artifact: the evaluator’s 40-point absence check credits the phrase “does not exist” (WITH) but not “no … service exists” (WITHOUT). The answers are substantively equal.',
    ],
    judgement: 'Neither — equal in correctness, and the +40 is a phrase artifact, not better reasoning. WITH is the better reference (image tags + file citations, 50% cheaper); WITHOUT is the more careful argument (it quotes the false-positive hits).',
    footnote: 'The “Better” verdict reflects the evaluator score only. Both answers are correct and substantively equal.',
    metrics: [
      { label: 'Accuracy', without: '60', withValue: '100' },
      { label: 'Tokens', without: '88.7k', withValue: '44.5k (↓50%)' },
      { label: 'Duration', without: '19.9s', withValue: '18.4s (↓7%)' },
      { label: 'Files read', without: '9', withValue: '4 (↓56%)' },
      { label: 'Tool calls', without: '13 native', withValue: '4 native + 3 LoCoDex' },
    ],
  },
  {
    task: 'exact_file_catalogue',
    question: 'List the exact file paths in this repository that define the catalogue service: its Kubernetes Deployment, its Kubernetes Service, its database Deployment/Service, and its docker-compose entry. Give full paths (e.g. deploy/kubernetes/manifests/…).',
    verdict: 'same',
    delta: '100 → 100',
    why: 'Both perfect, same exact paths',
    diffs: [
      'Both arms list the same five exact paths (05–08 catalogue/db manifests + docker-compose.yml) — perfect 100/100 on both sides.',
      'Beyond the required paths, WITHOUT adds the Helm templates and the HPA; WITH adds the Jaeger variant, the catalogue-db network policy, and the compose logging overlay.',
    ],
    judgement: 'Both arms list the same five exact paths — perfect on both sides. What differs is only what they add beyond the required list.',
    metrics: [
      { label: 'Accuracy', without: '100', withValue: '100' },
      { label: 'Tokens', without: '49.4k', withValue: '46.8k (↓5%)' },
      { label: 'Duration', without: '26.0s', withValue: '36.5s (↑40%)' },
      { label: 'Files read', without: '6', withValue: '4 (↓33%)' },
      { label: 'Tool calls', without: '8 native', withValue: '4 native + 3 LoCoDex' },
    ],
  },
]

export const heroIcons = { agent: Sparkles, mcp: Network, retrieval: Search, result: Check } as const

export const heroStages: { id: keyof typeof heroIcons; label: string; detail: string; code: string; className: string }[] = [
  { id: 'agent', label: 'You ask', detail: 'A question about the codebase', code: '“does a recommendations service exist?”', className: 'node-agent' },
  { id: 'mcp', label: 'LoCoDex MCP', detail: 'The agent calls a focused tool instead of reading files', code: 'locodex_search(query, top_k=5)', className: 'node-mcp' },
  { id: 'retrieval', label: 'Hybrid retrieval', detail: 'Lexical, symbol, graph, and vector evidence fused', code: 'lexical → symbol → graph → vector', className: 'node-retrieval' },
  { id: 'result', label: 'Cited answer', detail: 'Evidence with exact file:line locations', code: '[SYMBOL] locodex/engine.py:354-379', className: 'node-result' },
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
  { value: 'agent' as Mode, chip: 'MCP AGENT', title: 'Agent Integration', sub: 'MCP Server', heading: 'Agent Integration (MCP Server)', panelChip: 'NO LLM KEY REQUIRED', bestFor: 'Enhancing an existing agent', llm: 'Agent brings its own', reasoning: 'External agent', body: 'LoCoDex runs as a code intelligence backend for Claude Code, Cursor, Windsurf, or any MCP-compatible agent. The agent’s LLM handles reasoning; LoCoDex provides retrieval and validation.' },
  { value: 'standalone' as Mode, chip: 'CLI', title: 'Standalone Package', sub: 'CLI + Own LLM', heading: 'Standalone Package (CLI + Own LLM)', panelChip: 'FULL PIPELINE', bestFor: 'Self-contained workflow', llm: 'Your endpoint', reasoning: 'LoCoDex model router', body: 'You run locodex commands directly. LoCoDex handles retrieval, context building, LLM calls, patching, and validation end to end through your configured endpoint.' },
]

export const modesDetail = 'The MCP Agent integration uses an external agent through MCP/CLI/HTTP. Headless / Enterprise deployments route application or CI traffic through the LoCoDex API, retrieval, and LLM gateway.'

export const architectureCopy = (id: string, detailMode: 'simple' | 'technical') => {
  const simple: Record<string, string> = {
    repo: 'The repository is the source of truth. LoCoDex starts from its tracked text files.',
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
    scan: 'Repo Scanner applies .locodex.yaml ignore patterns and records language metadata and hashes.',
    ast: 'tree_sitter_indexer.extract() emits symbols/imports; language-aware regex extraction is the fallback.',
    chunk: 'chunk_by_symbols() aligns chunks to outermost symbol spans and falls back to overlapping line windows.',
    store: 'PostgreSQL stores file/chunk/symbol/import records and index state under tenant-aware metadata access.',
    vector: 'VectorStore uses Qdrant when reachable; otherwise an in-memory cosine index tracks degraded state.',
    lexical: 'LexicalRetriever prefers ripgrep and falls back to a Python scanner with IDF-weighted coverage.',
    symbol: 'SymbolIndex uses SCIP when available in the environment; otherwise it uses the AST-backed symbol table.',
    graph: 'GraphifyAdapter currently reports static-import-graph and persists nodes, edges, and summary.txt.',
    hybrid: 'HybridRetriever executes lexical → symbol → graph → vector, dedups by path/line, reranks, and hydrates source.',
    mcp: 'mcp_server registers locodex_search, get_context, find_symbol, dependencies, validate, health, and AST patching.',
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
