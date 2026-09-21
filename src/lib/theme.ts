import { useEffect, useSyncExternalStore } from 'react'

/**
 * The visitor's colour theme: `light`, `dark`, or `system` (the default).
 *
 * The choice lives in a module-level store rather than React state, the same
 * shape as the section spy: the header switch is the only subscriber, so changing
 * the theme re-renders the switch and nothing else. The document itself is the
 * source of truth for what is painted — `data-theme` plus `color-scheme` are what
 * the stylesheet reads, and the palette's `light-dark()` pairs resolve from them.
 */

// Also hard-coded in the pre-paint script in index.html, which has to read the
// choice before any module loads. Change both or the first paint will disagree
// with the first render.
export const THEME_STORAGE_KEY = 'skelpr-theme'

export type ThemeChoice = 'light' | 'dark' | 'system'

export const THEME_CHOICES: { choice: ThemeChoice; label: string }[] = [
  { choice: 'light', label: 'Light' },
  { choice: 'dark', label: 'Dark' },
  { choice: 'system', label: 'Match system' },
]

const DARK_QUERY = '(prefers-color-scheme: dark)'

function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === 'light' || value === 'dark' || value === 'system'
}

/** The remembered choice, or `system`. Storage can be unavailable — private
 *  windows, blocked cookies — in which case the page just follows the system. */
function storedChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeChoice(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

let choice: ThemeChoice = storedChoice()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function publish() {
  for (const listener of listeners) listener()
}

/** What the visitor is actually looking at, with `system` resolved. */
export function effectiveTheme(): 'light' | 'dark' {
  if (choice !== 'system') return choice
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

/**
 * The palette's `--surface` as the browser resolved it for the theme in force.
 *
 * A custom property holding `light-dark(...)` reads back as that unresolved text,
 * so the colour has to be painted on something before `getComputedStyle` will
 * hand it over. Painting a hidden probe costs one element and keeps the browser
 * chrome (the `theme-color` meta) tied to the derived palette instead of a second
 * hard-coded copy of it that no script would keep in sync.
 */
function surfaceColor() {
  const probe = document.createElement('div')
  probe.style.cssText = 'position: absolute; visibility: hidden; background: var(--surface)'
  document.documentElement.append(probe)
  const resolved = getComputedStyle(probe).backgroundColor
  probe.remove()
  return resolved
}

function apply() {
  document.documentElement.dataset.theme = choice
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = surfaceColor()
}

export function setTheme(next: ThemeChoice) {
  choice = next
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // Remembering is a convenience, not a requirement: the theme still applies.
  }
  apply()
  publish()
}

/** The choice, for the control that shows it. */
export function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(subscribe, () => choice, () => choice)
}

/**
 * Keeps the document in step with the store: applies the remembered choice on
 * mount, and re-applies when the choice follows the system and the system changes
 * underneath it.
 */
export function useThemeEffect() {
  useEffect(() => {
    apply()
    const media = window.matchMedia(DARK_QUERY)
    const onSystemChange = () => {
      if (choice === 'system') apply()
    }
    media.addEventListener('change', onSystemChange)
    return () => media.removeEventListener('change', onSystemChange)
  }, [])
}
