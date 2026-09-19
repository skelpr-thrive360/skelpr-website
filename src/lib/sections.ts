/**
 * Every top-level section of the page, in the order it renders.
 *
 * One list feeds both halves of the same idea — the scroll spy that decides
 * which section you are in, and the hash that names it — so the nav, deep
 * links and the address bar cannot drift apart.
 */
export const sectionIds = [
  'top',
  'problem',
  'example',
  'product',
  'modes',
  'workflow',
  'benchmark',
  'architecture',
  'install',
  'waitlist',
] as const

export type SectionId = (typeof sectionIds)[number]

export const topSectionId: SectionId = 'top'

/**
 * The fragment a link to `id` should carry — empty for the hero. The top of the
 * page is a place you scroll back to, not a destination worth naming in a URL
 * someone copies out of the address bar, so `#top` is never written.
 */
export function hashFor(id: string) {
  return id === topSectionId ? '' : `#${id}`
}

/** A same-document URL for a section, with or without a fragment. */
export function urlFor(id: string) {
  return hashFor(id) || window.location.pathname + window.location.search
}
