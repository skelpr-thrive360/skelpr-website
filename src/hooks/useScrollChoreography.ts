import { useEffect } from 'react'

/** Keep content still and visible; only the header reading indicator follows scroll. */
export function useScrollChoreography() {
  useEffect(() => {
    const rail = document.querySelector<HTMLElement>('.read-rail span')
    if (!rail) return

    let frame = 0
    const update = () => {
      frame = 0
      const distance = document.documentElement.scrollHeight - window.innerHeight
      const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0
      rail.style.transform = `scaleX(${progress})`
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    // Recalculate after tabs or answer panes change the page height.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    observer?.observe(document.body)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()

    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      rail.style.removeProperty('transform')
    }
  }, [])
}
