/**
 * The sections the primary navigation points at.
 *
 * One list, two headers: the marketing page links these as in-page fragments
 * (`#workflow`), the docs page links the same items across documents
 * (`/#workflow`). One list means the two headers cannot drift apart.
 */
export const navItems = [
  { id: 'workflow', label: 'How it works' },
  { id: 'benchmark', label: 'Benchmark' },
  // Private launch: the architecture section is parked.
  // { id: 'architecture', label: 'Architecture' },
] as const
