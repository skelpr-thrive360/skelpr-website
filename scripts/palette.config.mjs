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

/**
 * Anchors: surfaces and figure panels are declared, never solved. They are the
 * theme's character, and every other value is measured against them.
 *
 * What they are not is a whisper. These used to sit a step apart that measured as
 * nothing — 0.012 OKLab lightness between paper and a raised card, 0.015 between
 * paper and a sunken one — so panels, rows and figure cards all read as the same
 * surface and the page felt like one flat sheet. A step is a visible step now
 * (see SURFACE_STEPS, which the audit enforces), and the dark theme's paper is
 * near-black rather than dark grey, so a card or a row has something to be
 * lighter *than*.
 *
 * Paper cannot step up much — `surface-raised` at white is the ceiling, which is
 * why light-mode separation leans on ink and rules while dark-mode separation can
 * lean on fill.
 */
export const SURFACES = {
  light: {
    surface: '#f9f8f4',
    'surface-raised': '#ffffff',
    'surface-sunken': '#edece8',
    'fig-bg': '#121417',
    'fig-surface': '#1d1f23',
  },
  dark: {
    surface: '#0d0e11',
    'surface-raised': '#191a1d',
    'surface-sunken': '#090a0d',
    'fig-bg': '#15171b',
    'fig-surface': '#212327',
  },
}

/**
 * The smallest step allowed between neighbouring surfaces, in OKLab lightness.
 * Perceptual rather than a ratio: this is about whether a panel looks like a
 * panel, and a ratio near either end of the range would lie about that.
 */
export const SURFACE_STEPS = { minimum: 0.015 }

/** Page tokens are painted on all three page surfaces; the solver takes the
 *  worst of them, which is `surface-sunken` in light and `surface-raised` in dark. */
export const PAGE_SURFACES = ['surface', 'surface-raised', 'surface-sunken']

/** The figure palette is ink-dark in both themes — instrument panels are not
 *  page surfaces — and its first entry also sets the direction it is solved in. */
export const FIGURE_SURFACES = ['fig-bg', 'fig-surface']

/**
 * Some things are painted on one named surface rather than a family of them.
 * The architecture map's dot grid only ever sits on `surface-raised`, and
 * measuring it against the page's worst surface instead would make it stronger on
 * the panel than the panel needs — the texture is a property of that one box.
 */
export const SURFACE_SETS = {
  page: PAGE_SURFACES,
  figure: FIGURE_SURFACES,
  raised: ['surface-raised'],
}

/**
 * What each text token has to reach, and where it is painted.
 *
 * `target` is a WCAG ratio against the worst-case surface of its set, and these
 * are set for reading rather than for restraint. They used to sit at the quiet end
 * of AA — body ink 12:1, labels 4.7:1 — which audits as "passing" and reads as
 * washed out: grey body copy on warm paper, and a page you have to work at. Body
 * ink clears 15:1 now (near-black on paper, near-white on a dark page),
 * secondary 10.5:1, labels 7.5:1 and the verdict colours 6:1. The steps between
 * them are still steps, so the hierarchy survives — it just starts from further
 * away, and nothing that carries meaning sits near the floor.
 *
 * 15 rather than 16 is not timidity in the figure set: figure ink is light and
 * cards there have to stand off their panel (see SURFACES), so the ceiling is
 * white-on-card, which a flat #ffffff card caps at 15.9:1. Push past that and the
 * solver refuses, correctly — you would be asking for brightness the panel's own
 * separation cannot deliver.
 */
export const ROLES = {
  'ink-1': { target: 15, surfaces: 'page', note: 'body ink' },
  'ink-2': { target: 10.5, surfaces: 'page', note: 'secondary ink' },
  'ink-3': { target: 7.5, surfaces: 'page', note: 'labels' },
  accent: { target: 7, surfaces: 'page', note: 'accent text' },
  positive: { target: 6, surfaces: 'page', note: 'benchmark WITH' },
  negative: { target: 6, surfaces: 'page', note: 'benchmark WITHOUT' },
  warn: { target: 6, surfaces: 'page', note: 'caveat / footnote' },
  'fig-ink': { target: 15, surfaces: 'figure', note: 'figure body' },
  'fig-ink-2': { target: 10.5, surfaces: 'figure', note: 'figure secondary' },
  'fig-ink-3': { target: 7.5, surfaces: 'figure', note: 'figure labels' },
  'fig-accent': { target: 7, surfaces: 'figure', note: 'figure accent' },
  'fig-positive': { target: 6, surfaces: 'figure', note: 'figure positive' },
  'fig-negative': { target: 6, surfaces: 'figure', note: 'figure negative' },
  'fig-warn': { target: 6, surfaces: 'figure', note: 'figure warn' },
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
 *
 * `grid-dot` is the third kind of non-text mark: a texture. It used to be a tint
 * — 10% of the body ink over paper, 9% over a panel — which is a description, not
 * a budget, and it landed at 1.07:1 in the dark theme: invisible. A dot grid you
 * cannot see is not a quiet dot grid, it is bytes. It is solved here like the
 * rules, one step below them (1.4 against their 1.6), so the texture reads as a
 * surface to work on without ever competing with the lines that carry meaning.
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
  'grid-dot': {
    // Hue from the page, contrast against the panel it is painted on: the grid is
    // an impression of the paper underneath, and a neutral grey is a hue nobody
    // chose. The dark theme's panel carries its own faint blue, which is why this
    // is not simply "a lighter grey".
    from: 'surface',
    surfaces: 'raised',
    target: 1.4,
    note: 'architecture map dot grid',
  },
}

/**
 * Tokens that follow another token rather than being solved themselves.
 *
 * `delta` moves along the axis the source was solved on (the hover of the accent
 * steps further away from the page than the accent itself).
 *
 * `tint` is a wash, and it is composited here: the source colour laid over a
 * named surface and written out as a flat colour. Alpha is how a wash is
 * *described*, not how it should ship — an alpha fill depends on whatever is
 * underneath it, so the same token came out pale on paper, muddy on a panel and
 * different again over a figure. Every fill in the palette is now a colour.
 *
 * `alpha` survives only for shadows, where showing what is beneath them is the
 * entire point.
 */
export const FOLLOWS = {
  'accent-hover': { from: 'accent', delta: { light: -0.052, dark: 0.064 } },
  'accent-wash': { from: 'accent', tint: { base: 'surface', amount: { light: 0.07, dark: 0.12 } } },
  'positive-wash': {
    from: 'positive',
    tint: { base: 'surface', amount: { light: 0.08, dark: 0.12 } },
  },
  'warn-wash': { from: 'warn', tint: { base: 'surface', amount: { light: 0.08, dark: 0.12 } } },
  'ink-wash': { from: 'ink-1', tint: { base: 'surface', amount: { light: 0.06, dark: 0.08 } } },
  // A figure panel's fill recesses: it is the page surface come back through, so
  // a chip of code or a quiet item is cut *into* the panel rather than lifted out
  // of it. That direction is deliberate beyond looks — recessing means any text on
  // a fill sits on something darker than the panel, so the targets solved for the
  // panel still hold on the fill. Lifting a fill instead (the obvious move on paper)
  // is what quietly put verdict text on a lighter green than it was solved for.
  'fig-wash': { from: 'fig-bg', tint: { base: 'fig-surface', amount: { light: 0.6, dark: 0.6 } } },
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
/**
 * Fills a rule can border, beyond the surfaces it is measured against.
 *
 * A rule's job is to separate the thing it outlines from what is around it, and
 * once fills became flat colours that means both sides: a wash that tints a panel
 * is a neighbour, and a rule solved only against the bare surfaces can end up
 * under its target against one — which is how a quote rule on a washed panel came
 * out at 2.8:1 while the audit, measuring surfaces, said it was fine.
 */
export const RULE_NEIGHBOURS = {
  page: ['ink-wash', 'accent-wash', 'positive-wash', 'warn-wash'],
  figure: ['fig-wash'],
}

export const SEPARATION = {
  minimum: 12,
  pairs: [
    { fg: 'accent', bg: ['positive', 'negative', 'warn'] },
    { fg: 'fig-accent', bg: ['fig-positive', 'fig-negative', 'fig-warn'] },
  ],
}
