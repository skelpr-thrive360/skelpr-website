import { Monitor, Moon, Sun } from 'lucide-react'
import { THEME_CHOICES, setTheme, useThemeChoice, type ThemeChoice } from '../lib/theme'

const ICONS: Record<ThemeChoice, typeof Sun> = { light: Sun, dark: Moon, system: Monitor }

/**
 * Light / Dark / System, remembered between visits.
 *
 * A group of toggle buttons rather than a radio group: a radiogroup owes the
 * keyboard arrow-key navigation and a roving tabindex, and three plain tab stops
 * are easier to use than a half-implemented contract. Each button carries its own
 * label, so the icon is never the only thing naming the option.
 */
export function ThemeToggle() {
  const choice = useThemeChoice()
  return (
    <div className="theme-switch" role="group" aria-label="Colour theme">
      {THEME_CHOICES.map(({ choice: option, label }) => {
        const Icon = ICONS[option]
        return (
          <button
            key={option}
            type="button"
            className="theme-option"
            aria-pressed={choice === option}
            aria-label={label}
            title={label}
            onClick={() => setTheme(option)}
          >
            <Icon size={14} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
