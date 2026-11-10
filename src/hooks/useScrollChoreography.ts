import { useEffect } from 'react'

/** Track reading progress and play each figure entrance once. */
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
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const entrances = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries, observer) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            observer.unobserve(entry.target)
            if (!motion.matches) entry.target.setAttribute('data-arrived', '')
          }
        }, { rootMargin: '0px 0px -32px 0px' })
    if (entrances) {
      document.querySelectorAll('.comparison-visual, .workflow-shell, .architecture-layout')
        .forEach((figure) => entrances.observe(figure))
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()

    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      entrances?.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      rail.style.removeProperty('transform')
    }
  }, [])
}
