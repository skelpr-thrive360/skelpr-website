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

/**
 * The line the reader is measured against, in document coordinates: where a
 * heading lands when its link in the rail is followed.
 *
 * `html` reserves the sticky header with `scroll-padding-top`, and a heading's
 * own `scroll-margin-top` is *added* to it rather than clamped against it — so
 * reserving the header in both places dropped a clicked heading ~100px below the
 * line the spy watched, and the rail lit the heading *before* the one that was
 * asked for. The docs headings keep their `scroll-margin-top` at 0 and let the
 * scroll padding place them, so reading that same padding here makes the jump
 * and the highlight agree by construction. The extra pixel keeps a heading that
 * lands exactly on the line counted as being at it.
 */
function readingLine(): number {
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
  return window.scrollY + (Number.isFinite(padding) ? padding : 0) + 1
}

function headingUnderHeader(ids: string[]): string {
  const line = readingLine()
  let current = ''
  for (const id of ids) {
    const element = document.getElementById(id)
    if (element && element.getBoundingClientRect().top + window.scrollY <= line) current = id
  }
  // The footer is taller than the window, so the last heading never reaches the
  // line — page-at-the-end reads as the last one.
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
    return ids[ids.length - 1] ?? current
  }
  return current
}

/** Listens while mounted; `ids` is the contents list in document order. */
export function useTocSpy(ids: string[]): string {
  useEffect(() => {
    let frame = 0
    const sync = () => {
      frame = 0
      publish(headingUnderHeader(ids))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync)
    }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [ids])

  return useSyncExternalStore(subscribe, () => activeId, () => '')
}
