#!/usr/bin/env node
/**
 * Contrast audit for the generated palette in src/styles.css.
 *
 * Measures the committed stylesheet — not the config — so this is the check that
 * can catch a hand-edited colour, a stale derived table, or a surface that moved
 * underneath a token it no longer clears.
 *
 * Every token that carries text is checked against each surface it is actually
 * painted on: both sides of every `light-dark()` pair, the figure panels included.
 * The target for each pair comes from scripts/palette.config.mjs, the same file
 * scripts/derive-palette.mjs solves against, so a value cannot be derived for one
 * budget and audited against another. That is also why the numbers here look
 * quiet: the tokens are solved to sit at their target, not above it.
 *
 * Beyond contrast it re-asserts the palette rule documented in styles.css: the
 * accent must stay perceptually far from every verdict colour, so brand colour
 * can never be mistaken for a result (OKLab distance, minimum from the config).
 *
 * Usage: npm run audit:contrast
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contrastRatio, formatRatio, readColorValue, separation } from "./lib/color.mjs";
import { readTokens } from "./lib/palette-css.mjs";
import { FIGURE_SURFACES, FILL_PAIRS, PAGE_SURFACES, ROLES, SEPARATION } from "./palette.config.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "..", "src", "styles.css"), "utf8");

const THEMES = [
  { name: "light", label: "PAPER (light)", side: 0 },
  { name: "dark", label: "DARK", side: 1 },
];

/** Read out of the stylesheet, then measured. Null means "not in the palette". */
function color(tokens, theme, token) {
  const raw = tokens?.[theme.name]?.[token];
  if (raw === undefined) return null;
  return readColorValue(raw, theme.side);
}

/** Every pair the palette has to satisfy, targets included. */
const CHECKS = [
  ...Object.entries(ROLES).map(([token, role]) => ({
    fg: token,
    bg: role.surfaces === "page" ? PAGE_SURFACES : FIGURE_SURFACES,
    target: role.target,
    note: role.note,
  })),
  ...FILL_PAIRS.map((pair) => ({ fg: pair.fg, bg: pair.bg, target: pair.target, note: pair.note })),
];

const tokens = readTokens(css);
let failures = 0;
let checks = 0;

for (const theme of THEMES) {
  console.log(`\n${theme.label}`);
  for (const { fg, bg, target, note } of CHECKS) {
    const fgColor = color(tokens, theme, fg);
    const bgColors = bg.map((name) => ({ name, value: color(tokens, theme, name) }));
    const missing = [
      ...(fgColor ? [] : [fg]),
      ...bgColors.filter((entry) => !entry.value).map((entry) => entry.name),
    ];
    if (missing.length > 0) {
      console.log(`  ?   ${note.padEnd(24)} token missing: ${[...new Set(missing)].join(", ")}`);
      failures += 1;
      continue;
    }
    for (const against of bgColors) {
      checks += 1;
      const value = contrastRatio(fgColor, against.value);
      const ok = value >= target;
      if (!ok) failures += 1;
      console.log(
        `  ${ok ? "ok " : "FAIL"} ${note.padEnd(24)} ${fgColor} on ${against.name.padEnd(14)} ` +
          `${formatRatio(value).padStart(8)} ≥ ${target}`,
      );
    }
  }
}

console.log("");
console.log(`ACCENT SEPARATION   minimum ${SEPARATION.minimum} (OKLab, higher is safer)`);
let separationFailures = 0;
for (const theme of THEMES) {
  for (const { fg, bg } of SEPARATION.pairs) {
    for (const other of bg) {
      const [a, b] = [color(tokens, theme, fg), color(tokens, theme, other)];
      if (!a || !b) {
        console.log(`  ?    ${theme.name.padEnd(5)} ${fg} vs ${other}: token missing`);
        separationFailures += 1;
        continue;
      }
      const value = separation(a, b);
      const ok = value >= SEPARATION.minimum;
      if (!ok) separationFailures += 1;
      console.log(
        `  ${ok ? "ok " : "FAIL"} ${theme.name.padEnd(5)} ${fg.padEnd(11)} vs ${other.padEnd(14)} ${value.toFixed(1)}`,
      );
    }
  }
}

console.log(`\n${checks - failures}/${checks} pairs meet their targets`);
if (failures > 0 || separationFailures > 0) {
  console.error(
    `${failures} contrast problem(s) and ${separationFailures} accent-separation problem(s) found`,
  );
  console.error("Run `npm run derive:palette` to solve the palette again, or set the target in scripts/palette.config.mjs.");
  process.exit(1);
}
