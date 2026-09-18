/**
 * The design intent behind the palette in src/styles.css.
 *
 * Two scripts read this file, and that is the point:
 *   - scripts/derive-palette.mjs solves every token for its target and writes the
 *     generated table into src/styles.css (`npm run derive:palette`);
 *   - scripts/contrast-audit.mjs measures the committed table against the *same*
 *     targets (`npm run audit:contrast`).
 *
 * Because both read one file, a value can never be solved for one target and
 * audited against another. Change a number here, re-derive, and the palette,
 * the CSS comments and the audit move together.
 *
 * Colour maths lives in scripts/lib/color.mjs.
 */

/** Anchors: surfaces and figure panels are declared, never solved. They are the
 *  theme's character, and every other value is measured against them. */
export const SURFACES = {
  light: {
    surface: '#f9f8f4',
    'surface-raised': '#fdfcf9',
    'surface-sunken': '#f1efea',
    'fig-bg': '#15171a',
    'fig-surface': '#1d2024',
  },
  dark: {
    surface: '#121316',
    'surface-raised': '#191c20',
    'surface-sunken': '#0e1013',
    'fig-bg': '#191c20',
    'fig-surface': '#21252a',
  },
}

/** Page tokens are painted on all three page surfaces; the solver takes the
 *  worst of them, which is `surface-sunken` in light and `surface-raised` in dark. */
export const PAGE_SURFACES = ['surface', 'surface-raised', 'surface-sunken']

/** The figure palette is ink-dark in both themes — instrument panels are not
 *  page surfaces — and its first entry also sets the direction it is solved in. */
export const FIGURE_SURFACES = ['fig-bg', 'fig-surface']

/**
 * What each text token has to reach, and where it is painted.
 *
 * `target` is a WCAG ratio against the worst-case surface of its set. These are
 * deliberately quiet numbers: a token is solved to sit *at* its target, so
 * nothing is heavier than its role needs and the hierarchy keeps its steps.
 */
export const ROLES = {
  'ink-1': { target: 12, surfaces: 'page', note: 'body ink' },
  'ink-2': { target: 7, surfaces: 'page', note: 'secondary ink' },
  'ink-3': { target: 5.2, surfaces: 'page', note: 'labels' },
  accent: { target: 5.5, surfaces: 'page', note: 'accent text' },
  positive: { target: 5, surfaces: 'page', note: 'benchmark WITH' },
  negative: { target: 5, surfaces: 'page', note: 'benchmark WITHOUT' },
  warn: { target: 5, surfaces: 'page', note: 'caveat / footnote' },
  'fig-ink': { target: 12, surfaces: 'figure', note: 'figure body' },
  'fig-ink-2': { target: 7, surfaces: 'figure', note: 'figure secondary' },
  'fig-ink-3': { target: 5.2, surfaces: 'figure', note: 'figure labels' },
  'fig-accent': { target: 5.5, surfaces: 'figure', note: 'figure accent' },
  'fig-positive': { target: 5, surfaces: 'figure', note: 'figure positive' },
  'fig-negative': { target: 5, surfaces: 'figure', note: 'figure negative' },
  'fig-warn': { target: 5, surfaces: 'figure', note: 'figure warn' },
}

/**
 * Labels painted *on* a filled control. Here the fill is the solved token and
 * the label is a declared surface, so the constraint runs the other way: the
 * fill has to be dark or light enough for its own label, not just for the page.
 */
export const FILL_PAIRS = [
  { fg: 'surface-raised', bg: ['accent', 'positive', 'negative'], target: 4.5, note: 'label on fill' },
]

/**
 * The hue and chroma each solved token keeps, per theme. The solver moves
 * lightness only, so a re-derived palette is recognisably the same palette.
 */
export const ANCHORS = {
  light: {
    'ink-1': '#17181a',
    'ink-2': '#45464a',
    'ink-3': '#6a6b6f',
    accent: '#1d4f7c',
    positive: '#2b6242',
    negative: '#9c332a',
    warn: '#8a5a12',
    'fig-ink': '#e8eaec',
    'fig-ink-2': '#b4b8bd',
    'fig-ink-3': '#8d9298',
    'fig-accent': '#8ab4e0',
    'fig-positive': '#8ecb9f',
    'fig-negative': '#e5928a',
    'fig-warn': '#ddb06a',
  },
  dark: {
    'ink-1': '#e9eaec',
    'ink-2': '#b0b4ba',
    'ink-3': '#8b9096',
    accent: '#8ab4e0',
    positive: '#86c79a',
    negative: '#e08a7e',
    warn: '#d9a556',
    'fig-ink': '#edeef0',
    'fig-ink-2': '#b6babe',
    'fig-ink-3': '#90959a',
    'fig-accent': '#8ab4e0',
    'fig-positive': '#8ecb9f',
    'fig-negative': '#e5928a',
    'fig-warn': '#ddb06a',
  },
}

/**
 * Rules: hairlines and edges.
 *
 * These used to be placed by a fixed OKLab step from their own surface, and a
 * step that reads well on a dark panel reads as almost nothing on paper: the
 * light theme's step was a third weaker than the dark theme's (−0.066 against
 * +0.097), which is exactly how the two looked. They carry a contrast target
 * now, like every other token, so both themes reach the same measured
 * visibility instead of the same nominal step:
 *
 *   rule         structure you find when you look for it — row and section
 *                dividers, table rules. Quiet on purpose.
 *   rule-strong  edges you have to see without looking: control boundaries
 *                (WCAG 1.4.11 non-text contrast), quote and verdict rules,
 *                diagram lines.
 *
 * `from` is the surface whose hue and chroma the rule borrows: a rule is
 * structure, not a colour, so it stays in the family of the surface it sits on.
 * The target is theme-independent, so there is one table rather than two.
 */
export const RULES = {
  rule: { from: 'surface', surfaces: 'page', target: 1.6, note: 'row and section dividers' },
  'rule-strong': {
    from: 'surface',
    surfaces: 'page',
    target: 3,
    note: 'control edges, quotes, diagram lines',
  },
  'fig-rule': { from: 'fig-bg', surfaces: 'figure', target: 1.6, note: 'figure panel rules' },
  'fig-rule-strong': { from: 'fig-bg', surfaces: 'figure', target: 3, note: 'figure axes and edges' },
}

/**
 * Tokens that follow another token rather than being solved themselves.
 *
 * `delta` moves along the axis the source was solved on (the hover of the accent
 * steps further away from the page than the accent itself). `alpha` composited a
 * source colour — a wash, a veil, a shadow tint — is written as an alpha layer
 * the way the hand-picked palette wrote it, so the fill underneath still shows.
 */
export const FOLLOWS = {
  'accent-hover': { from: 'accent', delta: { light: -0.052, dark: 0.064 } },
  'accent-wash': { from: 'accent', alpha: { light: 0.07, dark: 0.12 } },
  'positive-wash': { from: 'positive', alpha: { light: 0.08, dark: 0.12 } },
  'warn-wash': { from: 'warn', alpha: { light: 0.08, dark: 0.12 } },
  'ink-wash': { from: 'ink-1', alpha: { light: 0.06, dark: 0.08 } },
  // The wash a chip of code sits on inside a figure panel, where the surface
  // underneath is dark in both themes and an ink wash would go the wrong way.
  'fig-wash': { from: 'fig-ink', alpha: { light: 0.08, dark: 0.1 } },
  'grid-dot': { from: 'ink-1', alpha: { light: 0.1, dark: 0.09 } },
  'header-bg': { from: 'surface', alpha: { light: 0.97, dark: 0.97 } },
  'lift-1-color': { from: 'shadow', alpha: { light: 0.05, dark: 0.3 } },
  'lift-2-color': { from: 'shadow', alpha: { light: 0.06, dark: 0.34 } },
}

/** Shadow tints are ink in light mode and true black in dark, where ink is light. */
export const SHADOW_BASE = { light: 'ink-1', dark: '#000000' }

/**
 * The palette rule from styles.css, asserted rather than assumed: one accent
 * means "you can act on this", so brand colour must stay perceptually far from
 * every verdict colour and can never be mistaken for a result. OKLab distance,
 * solved tokens included — the deriver refuses to write a palette that breaks it.
 */
export const SEPARATION = {
  minimum: 12,
  pairs: [
    { fg: 'accent', bg: ['positive', 'negative', 'warn'] },
    { fg: 'fig-accent', bg: ['fig-positive', 'fig-negative', 'fig-warn'] },
  ],
}
