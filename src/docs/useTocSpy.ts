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

/** How far below the sticky header a heading counts as the one you are reading. */
const READING_GAP = 8

function headingUnderHeader(ids: string[]): string {
  const header = document.querySelector<HTMLElement>('.site-header')
  const line = window.scrollY + (header?.offsetHeight ?? 72) + READING_GAP
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
