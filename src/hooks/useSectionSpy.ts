import { useEffect, useSyncExternalStore } from 'react'
import { hashFor, sectionIds, topSectionId, urlFor, type SectionId } from '../lib/sections'

/**
 * Which section the reader is in, held in a module-level store rather than in
 * App state: the scroll listener belongs to the page shell, but only the header
 * subscribes — crossing a section boundary re-renders the nav, not the fifteen
 * thousand pixels of page below it.
 */
let activeSection: SectionId = topSectionId
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function publish(section: SectionId) {
  if (section === activeSection) return
  activeSection = section
  for (const listener of listeners) listener()
}

/** How far below the sticky header a section starts counting as the one you are reading. */
const READING_GAP = 8

function sectionUnderHeader(): SectionId {
  const header = document.querySelector<HTMLElement>('.site-header')
  const line = window.scrollY + (header?.offsetHeight ?? 72) + READING_GAP
  let current: SectionId = topSectionId
  for (const id of sectionIds) {
    const element = document.getElementById(id)
    if (element && element.getBoundingClientRect().top + window.scrollY <= line) current = id
  }
  // The last section can never reach the reading line — the footer below it is
  // taller than the window — so a page scrolled to its end reads as the last one.
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
    return [...sectionIds].reverse().find((id) => document.getElementById(id)) ?? current
  }
  return current
}

/**
 * Keeps the address bar honest: the hash names the section you are looking at,
 * and scrolling back up to the hero clears it again — so a URL copied out of
 * the page points at what you were reading, without the noise of `#top`.
 *
 * Runs on scroll (frame-throttled) rather than through an IntersectionObserver:
 * these sections are wildly uneven — one is taller than two windows — so a
 * position check against a single reading line is simpler and steadier than
 * arbitrating a list of intersections.
 */
export function useSectionSpy() {
  useEffect(() => {
    let frame = 0
    let primed = false

    const sync = () => {
      frame = 0
      const section = sectionUnderHeader()
      publish(section)
      // The first pass only publishes. A deep link is landed by `useHashScroll`
      // after this effect runs, and rewriting the hash first would drop it.
      if (!primed) {
        primed = true
        return
      }
      if (window.location.hash !== hashFor(section)) window.history.replaceState(null, '', urlFor(section))
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync)
    }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('hashchange', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('hashchange', schedule)
    }
  }, [])
}

/** The section under the sticky header — re-rendering only the caller. */
export function useActiveSection(): SectionId {
  return useSyncExternalStore(subscribe, () => activeSection, () => topSectionId)
}
