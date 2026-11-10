import { useEffect, useSyncExternalStore } from 'react'

/**
 * Which heading of the /docs article the reader is in.
 *
 * Same shape as `useSectionSpy` on the marketing page — a module-level store, so
 * crossing a heading re-renders the rail and nothing else — minus the address-bar
 * writes: a rail is a map, not a claim about where you are.
 */
let activeId = ''
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function publish(id: string) {
  if (id === activeId) return
  activeId = id
  for (const listener of listeners) listener()
}

/** Activate headings as they enter the reading area just below the sticky header. */
function headingInView(headings: HTMLElement[]): string {
  const { scrollHeight } = document.documentElement
  if (window.scrollY + window.innerHeight >= scrollHeight - 2) {
    return headings[headings.length - 1]?.id ?? ''
  }

  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
  const readingLine = (Number.isFinite(padding) ? padding : 0) + 24
  let current = ''
  for (const heading of headings) {
    if (heading.getBoundingClientRect().top > readingLine) break
    current = heading.id
  }
  return current
}

/** Track the article once for both the desktop rail and the mobile contents. */
export function useTrackToc(ids: string[]) {
  useEffect(() => {
    let frame = 0
    const sync = () => {
      frame = 0
      // React can replace the heading nodes while keeping their IDs.
      const headings = ids
        .map((id) => document.getElementById(id))
        .filter((heading): heading is HTMLElement => heading !== null)
      publish(headingInView(headings))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync)
    }
    const article = document.querySelector('.docs-prose')
    const observer = article && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(schedule)
      : null
    if (article) observer?.observe(article)
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [ids])
}

export function useActiveTocHeading(): string {
  return useSyncExternalStore(subscribe, () => activeId, () => '')
}
