// Retained comparisons from benchmarks/results/django-case-study-20261109/metrics.json.
// Pairs are [native Codex, Codex + Skelpr]. Do not substitute later runs silently.
export const djangoMetricsUrl = '/benchmarks/django-case-study-20261109/metrics.json'

type Pair = readonly [number, number]
type DjangoTask = {
  id: string
  task: string
  tokens: Pair
  score: Pair
  maximumScore: number
  seconds: Pair
}

export const djangoTasks: readonly DjangoTask[] = [
  { id: 'Q1', task: 'Middleware lookup', tokens: [14203, 13530], score: [3, 3], maximumScore: 3, seconds: [38.866032299993094, 55.38853209995432] },
  { id: 'Q2', task: 'Request execution flow', tokens: [47406, 28931], score: [24, 24], maximumScore: 24, seconds: [56.90348530001938, 50.54090959997848] },
  { id: 'Q3', task: 'WSGI and ASGI architecture', tokens: [63091, 29474], score: [26, 27], maximumScore: 30, seconds: [61.67082140001003, 56.47838609997416] },
  { id: 'Q4', task: 'QuerySet.exists() behavior', tokens: [24509, 13043], score: [5, 6], maximumScore: 6, seconds: [33.1755766000133, 29.368354199978057] },
  { id: 'Q5', task: 'Custom CSRF header test', tokens: [23552, 13260], score: [6, 6], maximumScore: 6, seconds: [27.18642300000647, 23.69111299997894] },
  { id: 'Q6', task: 'Verify absent integrations', tokens: [34206, 31154], score: [5, 5], maximumScore: 6, seconds: [49.71936689998256, 52.80961280001793] },
  { id: 'Q7', task: 'Cache Vary impact', tokens: [71294, 44562], score: [7, 7], maximumScore: 8, seconds: [61.63585929997498, 70.20505370001774] },
  { id: 'Q8', task: 'Fix URL scheme validation', tokens: [60019, 39048], score: [2, 2], maximumScore: 2, seconds: [72.62632299999996, 63.63729310000008] },
  { id: 'Q9', task: 'Savepoint commit hooks', tokens: [46805, 25573], score: [8, 8], maximumScore: 8, seconds: [63.24973040000032, 64.76728809999986] },
  { id: 'Q10', task: 'Fix multi-batch prefetch', tokens: [52912, 36174], score: [3, 3], maximumScore: 3, seconds: [69.3654359000002, 54.363166199999796] },
]

const sumPair = (key: 'tokens' | 'score' | 'seconds'): Pair => [
  djangoTasks.reduce((sum, task) => sum + task[key][0], 0),
  djangoTasks.reduce((sum, task) => sum + task[key][1], 0),
]

export const djangoTotals = {
  tokens: sumPair('tokens'),
  score: sumPair('score'),
  seconds: sumPair('seconds'),
  maximumScore: djangoTasks.reduce((sum, task) => sum + task.maximumScore, 0),
  nativeReads: [28, 9] as Pair,
  requests: [41, 31] as Pair,
  uncachedInput: [134804, 87110] as Pair,
}

export const reduction = ([before, after]: Pair) => ((1 - after / before) * 100).toFixed(2)
export const formatCount = (value: number) => value.toLocaleString('en-US')
