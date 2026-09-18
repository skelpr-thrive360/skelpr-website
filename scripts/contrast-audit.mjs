#!/usr/bin/env node
/**
 * Contrast audit for the design tokens in src/styles.css.
 *
 * Every token that carries text is checked against the surfaces it is actually
 * painted on, in both themes, including the dark "figure" palette used by the
 * code and terminal panels. Threshold is WCAG AA for small text (4.5:1): the
 * site renders no informational text above 24px, so the large-text exemption
 * does not apply.
 *
 * Beyond contrast it asserts the palette rule documented in styles.css: the
 * accent must stay perceptually far from every verdict colour, so brand colour
 * can never be mistaken for a result (OKLab distance, minimum 12).
 *
 * Usage: npm run audit:contrast
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const THRESHOLD = 4.5
const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(join(here, '..', 'src', 'styles.css'), 'utf8')

function tokenBlock(startPattern) {
  const start = css.search(startPattern)
  if (start === -1) throw new Error(`Token block not found: ${startPattern}`)
  const open = css.indexOf('{', start)
  const end = css.indexOf('\n}', open)
  if (open === -1 || end === -1) throw new Error(`Unterminated token block: ${startPattern}`)
  const tokens = {}
  for (const [, name, value] of css.slice(open, end).matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8})/g)) {
    tokens[name] = value
  }
  return tokens
}

function channel(value) {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex) {
  const h = hex.replace('#', '').slice(0, 6)
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function oklab(hex) {
  const h = hex.replace("#", "")
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(h.slice(i, i + 2), 16)))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function separation(a, b) {
  const [x, y] = [oklab(a), oklab(b)]
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) * 100
}

const PAGE = ['surface', 'surface-raised', 'surface-sunken']
const FIGURE = ['fig-bg', 'fig-surface']

const PAIRS = [
  { fg: 'ink-1', bg: PAGE, note: 'body ink' },
  { fg: 'ink-2', bg: PAGE, note: 'secondary ink' },
  { fg: 'ink-3', bg: PAGE, note: 'labels' },
  { fg: 'accent', bg: PAGE, note: 'accent text' },
  { fg: 'positive', bg: PAGE, note: 'benchmark WITH' },
  { fg: 'negative', bg: PAGE, note: 'benchmark WITHOUT' },
  { fg: 'warn', bg: PAGE, note: 'caveat / footnote' },
  { fg: 'surface-raised', bg: ['accent'], note: 'primary button label' },
  { fg: 'surface-raised', bg: ['positive', 'negative'], note: 'badge label on fill' },
  { fg: 'fig-ink', bg: FIGURE, note: 'figure body' },
  { fg: 'fig-ink-2', bg: FIGURE, note: 'figure secondary' },
  { fg: 'fig-ink-3', bg: FIGURE, note: 'figure labels' },
  { fg: 'fig-accent', bg: FIGURE, note: 'figure accent' },
  { fg: 'fig-positive', bg: FIGURE, note: 'figure positive' },
  { fg: 'fig-negative', bg: FIGURE, note: 'figure negative' },
  { fg: 'fig-warn', bg: FIGURE, note: 'figure warn' },
]

const themes = {
  paper: tokenBlock(/:root\s*\{/),
  dark: tokenBlock(/html\[data-theme="dark"\]\s*\{/),
}

let failures = 0
let checks = 0

for (const [theme, tokens] of Object.entries(themes)) {
  console.log(`\n${theme.toUpperCase()}`)
  for (const pair of PAIRS) {
    const fg = tokens[pair.fg]
    if (!fg) {
      console.log(`  ?  ${pair.note}: token --${pair.fg} missing`)
      failures += 1
      continue
    }
    for (const bgName of pair.bg) {
      const bg = tokens[bgName]
      if (!bg) {
        console.log(`  ?  ${pair.note}: token --${bgName} missing`)
        failures += 1
        continue
      }
      checks += 1
      const value = ratio(fg, bg)
      const ok = value >= THRESHOLD
      if (!ok) failures += 1
      console.log(
        `  ${ok ? 'ok' : 'FAIL'}  ${pair.note.padEnd(24)} ${fg} on ${bgName.padEnd(14)} ${value.toFixed(2)}:1`,
      )
    }
  }
}

const MIN_SEPARATION = 12
const SEPARATION_CHECKS = [
  { theme: "paper", fg: "accent", bg: ["positive", "negative", "warn"] },
  { theme: "dark", fg: "accent", bg: ["positive", "negative", "warn"] },
  { theme: "paper", fg: "fig-accent", bg: ["fig-positive", "fig-negative", "fig-warn"] },
]

console.log("")
console.log(`ACCENT SEPARATION   minimum ${MIN_SEPARATION} (OKLab, higher is safer)`)
let separationFailures = 0
for (const { theme, fg, bg } of SEPARATION_CHECKS) {
  for (const name of bg) {
    const value = separation(themes[theme][fg], themes[theme][name])
    const ok = value >= MIN_SEPARATION
    if (!ok) separationFailures += 1
    console.log(
      `  ${ok ? "ok" : "FAIL"}  ${theme.padEnd(6)} ${fg.padEnd(11)} vs ${name.padEnd(13)} ${value.toFixed(1)}`,
    )
  }
}

console.log(`\n${checks - failures}/${checks} pairs meet ${THRESHOLD}:1`)
if (failures > 0 || separationFailures > 0) {
  console.error(
    `${failures} contrast problem(s) and ${separationFailures} accent-separation problem(s) found`,
  )
  process.exit(1)
}
