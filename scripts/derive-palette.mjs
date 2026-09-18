#!/usr/bin/env node
/**
 * Solves the palette in src/styles.css from scripts/palette.config.mjs.
 *
 * Every text token is derived, not chosen. The solver keeps the token's hue and
 * chroma and moves only its OKLab lightness — perceptually uniform, so "exactly
 * meets its target" is also the quietest value that is still legible: body ink
 * lands at its target rather than at black, and the steps between the ink tokens
 * stay steps instead of collapsing toward each other.
 *
 * What it writes is one `light-dark(light, dark)` pair per token, so both themes
 * sit on one line and the theme switch only has to move `color-scheme`. Rules,
 * washes, veils and shadow tints are derived from the solved tokens, so changing
 * an accent moves everything that is built on it.
 *
 * The palette rule from styles.css is enforced here, not just audited: if the
 * accent came within `SEPARATION.minimum` of a verdict colour, this refuses to
 * write the result at all.
 *
 * Usage:
 *   npm run derive:palette             solve and write styles.css
 *   npm run derive:palette -- --check  solve and compare; exit 1 if they differ
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  contrastRatio,
  formatRatio,
  hexToOklch,
  luminance,
  oklchToHex,
  separation,
} from "./lib/color.mjs";
import { lineEndingOf, readTokens, replaceRegion } from "./lib/palette-css.mjs";
import {
  ANCHORS,
  FIGURE_SURFACES,
  FILL_PAIRS,
  FOLLOWS,
  PAGE_SURFACES,
  ROLES,
  RULES,
  SEPARATION,
  SHADOW_BASE,
  SURFACES,
} from "./palette.config.mjs";

const THEMES = ["light", "dark"];
const THEME_LABELS = { light: "PAPER (light)", dark: "DARK" };

const here = dirname(fileURLToPath(import.meta.url));
const stylesPath = join(here, "..", "src", "styles.css");

/**
 * Ratio headroom each token is solved with. The value that gets committed is a
 * rounded 8-bit hex, which can fall a hundredth under the exact target, and this
 * is the room to fall in: invisible in the result, decisive for the audit, which
 * measures the committed file and nothing else.
 */
const MIN_SLACK = 0.02;

const INDENT = "  ";

/** How the generated region is laid out. Every derived token must appear in
 *  exactly one group — the check at the bottom of this file enforces that, so a
 *  new token cannot be solved and then quietly left out of the stylesheet. */
const GROUPS = [
  ["surfaces", ["surface", "surface-raised", "surface-sunken"]],
  ["ink", ["ink-1", "ink-2", "ink-3"]],
  ["structure", ["rule", "rule-strong"]],
  ["accent", ["accent", "accent-hover", "accent-wash"]],
  ["verdicts", ["positive", "positive-wash", "negative", "warn", "warn-wash"]],
  [
    "washes, veils, shadows",
    ["ink-wash", "fig-wash", "grid-dot", "header-bg", "lift-1-color", "lift-2-color"],
  ],
  [
    "figure (ink) palette",
    [
      "fig-bg",
      "fig-surface",
      "fig-ink",
      "fig-ink-2",
      "fig-ink-3",
      "fig-rule",
      "fig-rule-strong",
      "fig-accent",
      "fig-positive",
      "fig-negative",
      "fig-warn",
    ],
  ],
];

/** The surfaces a role is painted on, in the order the config declares them. */
function surfacesFor(role, theme) {
  const names = role.surfaces === "page" ? PAGE_SURFACES : FIGURE_SURFACES;
  return names.map((name) => ({ name, hex: SURFACES[theme][name] }));
}

/** Every contrast budget a token has to meet, including the labels painted on it
 *  when it is used as a fill. */
function checksFor(token, theme) {
  const role = ROLES[token];
  const checks = surfacesFor(role, theme).map(({ name, hex }) => ({
    against: hex,
    where: name,
    target: role.target,
  }));
  for (const pair of FILL_PAIRS.filter((candidate) => candidate.bg.includes(token))) {
    checks.push({ against: SURFACES[theme][pair.fg], where: pair.fg, target: pair.target });
  }
  return checks;
}

/** How much room the *rounded* colour has left against its tightest budget. */
function slack(hex, checks) {
  return Math.min(...checks.map((check) => contrastRatio(hex, check.against) - check.target));
}

/**
 * Finds the lightness that puts a token exactly at its target.
 *
 * The ratio rises monotonically as the token moves away from a light surface
 * (darker) or away from a dark one (lighter), so a binary search finds the
 * boundary, and a short walk afterwards guarantees the *rounded* value clears the
 * target before it is written.
 */
function solveLightness({ C, h, direction, checks, token, theme }) {
  const colourAt = (L) => oklchToHex(L, C, h);
  const meets = (L) => slack(colourAt(L), checks) >= MIN_SLACK;
  const away = direction === "darker" ? -1 : 1;

  let lo = 0;
  let hi = 1;
  // The far end of the axis always clears the target (black against paper, white
  // against a panel); if it does not, the config is asking for something no
  // lightness can deliver and the message should say which token asked.
  if (!meets(away === -1 ? lo : hi)) {
    throw new Error(
      `${theme}/${token}: nothing between black and white reaches ${checks[0].target}:1 against ${checks[0].where}`,
    );
  }
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (meets(mid)) {
      if (away === -1) lo = mid;
      else hi = mid;
    } else if (away === -1) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  let L = away === -1 ? lo : hi;
  for (let i = 0; i < 40 && !meets(L); i += 1) L += away * 0.002;
  for (let i = 0; i < 40 && meets(L - away * 0.002); i += 1) L -= away * 0.002;
  return L;
}

/** A token that follows another one instead of being solved. */
function resolveSource(name, theme, table) {
  const base = name === "shadow" ? SHADOW_BASE[theme] : name;
  return base.startsWith("#") ? base : table[base];
}

function alphaLayer(hex, alpha) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r} ${g} ${b} / ${Math.round(alpha * 100)}%)`;
}

function buildTheme(theme) {
  const table = { ...SURFACES[theme] };
  const solved = [];

  for (const token of Object.keys(ROLES)) {
    const anchor = hexToOklch(ANCHORS[theme][token]);
    const checks = checksFor(token, theme);
    // Direction comes from the primary surface of the set: against paper the ink
    // goes darker, inside a figure panel it goes lighter, in a dark theme it goes
    // lighter again — no per-theme switch has to state that.
    const primary = checks[0].against;
    const direction = luminance(primary) > 0.4 ? "darker" : "lighter";
    const L = solveLightness({ C: anchor.C, h: anchor.h, direction, checks, token, theme });
    const hex = oklchToHex(L, anchor.C, anchor.h);
    table[token] = hex;
    solved.push({ token, hex, checks, target: Math.min(...checks.map((c) => c.target)) });
  }

  // A rule is solved the same way a text token is — same solver, same budget
  // bookkeeping — and only its surface set and target differ. It keeps the hue
  // and chroma of the surface it sits on and moves lightness alone, so a rule
  // stays structure rather than becoming a colour.
  for (const [token, rule] of Object.entries(RULES)) {
    const anchor = hexToOklch(SURFACES[theme][rule.from]);
    const checks = surfacesFor(rule, theme).map(({ name, hex }) => ({
      against: hex,
      where: name,
      target: rule.target,
    }));
    const direction = luminance(SURFACES[theme][rule.from]) > 0.4 ? "darker" : "lighter";
    const L = solveLightness({ C: anchor.C, h: anchor.h, direction, checks, token, theme });
    table[token] = oklchToHex(L, anchor.C, anchor.h);
    solved.push({ token, hex: table[token], checks, target: rule.target });
  }

  for (const [token, follow] of Object.entries(FOLLOWS)) {
    const source = resolveSource(follow.from, theme, table);
    if (follow.delta) {
      const base = hexToOklch(source);
      table[token] = oklchToHex(base.L + follow.delta[theme], base.C, base.h);
    } else {
      table[token] = alphaLayer(source, follow.alpha[theme]);
    }
  }

  return { table, solved };
}

function assertSeparation(tables) {
  const failures = [];
  for (const theme of THEMES) {
    for (const { fg, bg } of SEPARATION.pairs) {
      for (const other of bg) {
        const distance = separation(tables[theme][fg], tables[theme][other]);
        if (distance < SEPARATION.minimum) {
          failures.push(
            `${theme}: --${fg} is ${distance.toFixed(1)} from --${other} (minimum ${SEPARATION.minimum})`,
          );
        }
      }
    }
  }
  if (failures.length > 0) {
    console.error("Refusing to write a palette that breaks the accent-separation rule:");
    for (const failure of failures) console.error(`  ${failure}`);
    console.error("Widen the accent's or the verdict's hue in scripts/palette.config.mjs.");
    process.exit(1);
  }
}

function assertGroups(tables) {
  const listed = GROUPS.flatMap(([, names]) => names);
  const derived = Object.keys(tables.light);
  const duplicates = listed.filter((name, i) => listed.indexOf(name) !== i);
  const missing = derived.filter((name) => !listed.includes(name));
  const unknown = listed.filter((name) => !derived.includes(name));
  if (duplicates.length || missing.length || unknown.length) {
    throw new Error(
      `GROUPS does not match the palette (duplicates: ${duplicates.join(", ") || "none"}; ` +
        `unlisted: ${missing.join(", ") || "none"}; listed but not derived: ${unknown.join(", ") || "none"})`,
    );
  }
}

function wrap(text, width) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && `${line} ${word}`.length > width) {
      lines.push(line);
      line = word;
      continue;
    }
    line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

function targetLines() {
  const page = [];
  const figure = [];
  for (const [token, role] of Object.entries(ROLES)) {
    (role.surfaces === "page" ? page : figure).push(`${token} ${role.target}:1`);
  }
  return [
    ...wrap(`page: ${page.join(" · ")}`, 70),
    ...wrap(`figure: ${figure.join(" · ")}`, 70),
  ].map((line) => `${INDENT}   ${line}`);
}

function renderRegion(tables, eol) {
  const lines = [
    `${INDENT}/* -- palette ----------------------------------------------------------`,
    `${INDENT}   Generated from scripts/palette.config.mjs. Run \`npm run derive:palette\``,
    `${INDENT}   after changing it — never edit these by hand, and CI fails if they drift.`,
    `${INDENT}`,
    `${INDENT}   Each token is a light-dark() pair: the first value resolves in the light`,
    `${INDENT}   theme, the second in the dark one, per \`color-scheme\`. Text tokens are`,
    `${INDENT}   solved to sit at their target against the worst surface they are painted`,
    `${INDENT}   on, so nothing is heavier than its role needs:`,
    ...targetLines(),
    `${INDENT}*/`,
  ];
  for (const [heading, names] of GROUPS) {
    lines.push("", `${INDENT}/* ${heading} */`);
    for (const name of names) {
      lines.push(`${INDENT}--${name}: light-dark(${tables.light[name]}, ${tables.dark[name]});`);
    }
  }
  return lines.join(eol) + eol;
}

function report(previous, tables, solved) {
  const groups = { declared: [], solved: [], derived: [] };
  for (const name of Object.keys(tables.light)) {
    if ([...PAGE_SURFACES, ...FIGURE_SURFACES].includes(name)) groups.declared.push(name);
    else if (ROLES[name] || RULES[name]) groups.solved.push(name);
    else groups.derived.push(name);
  }

  for (const theme of THEMES) {
    console.log(`\n${THEME_LABELS[theme]}`);
    for (const { token, hex, checks } of solved[theme]) {
      const check = checks.reduce((worst, candidate) =>
        contrastRatio(hex, candidate.against) - candidate.target <
        contrastRatio(hex, worst.against) - worst.target
          ? candidate
          : worst,
      );
      const was = previous[theme][token] ?? "—";
      const column = `${was} → ${hex}`.padEnd(21);
      console.log(
        `  ok  ${token.padEnd(14)} ${column} ${formatRatio(contrastRatio(hex, check.against)).padStart(7)} ≥ ${String(check.target).padEnd(4)} ${check.where}`,
      );
    }
    for (const name of groups.derived) {
      const was = previous[theme][name] ?? "—";
      console.log(`  --  ${name.padEnd(14)} ${`${was} → ${tables[theme][name]}`.padEnd(21)} derived`);
    }
  }
  console.log(
    `\n${Object.keys(tables.light).length} tokens · ${groups.solved.length} solved · ` +
      `${groups.derived.length} derived · ${groups.declared.length} declared`,
  );
}

const checkOnly = process.argv.includes("--check");
const css = readFileSync(stylesPath, "utf8");
const previous = readTokens(css);

const tables = {};
const solved = {};
for (const theme of THEMES) {
  const { table, solved: themeSolved } = buildTheme(theme);
  tables[theme] = table;
  solved[theme] = themeSolved;
}

assertSeparation(tables);
assertGroups(tables);

const eol = lineEndingOf(css);
const region = renderRegion(tables, eol);
const next = replaceRegion(css, region, eol);

if (checkOnly) {
  if (next === css) {
    console.log("palette in sync with scripts/palette.config.mjs");
    process.exit(0);
  }
  const committed = css.split(eol);
  const wanted = next.split(eol);
  const line = committed.findIndex((text, i) => text !== wanted[i]);
  console.error("palette has drifted from scripts/palette.config.mjs");
  console.error(`  src/styles.css:${line + 1}`);
  console.error(`    committed: ${committed[line]}`);
  console.error(`    derived:   ${wanted[line]}`);
  console.error("  Run `npm run derive:palette` to rewrite the generated region.");
  process.exit(1);
}

writeFileSync(stylesPath, next);
report(previous, tables, solved);
console.log("\nwrote src/styles.css");
