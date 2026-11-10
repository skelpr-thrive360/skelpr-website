/**
 * The sections the primary navigation points at.
 *
 * One list, two headers: the marketing page links these as in-page fragments
 * (`#workflow`), the docs page links the same items across documents
 * (`/#workflow`). One list means the two headers cannot drift apart.
 */
export const navItems = [
  { id: 'modes', label: 'MCP & CLI' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'benchmark', label: 'Benchmark' },
] as const
