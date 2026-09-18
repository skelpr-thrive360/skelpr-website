/**
 * Reading and writing the generated palette region of src/styles.css.
 *
 * The region is delimited by `generated:start` / `generated:end` markers so the
 * two scripts that touch it cannot disagree about where it begins: the deriver
 * replaces everything between the markers, and both it and the audit read tokens
 * back through the same parser.
 */
import { splitTopLevel } from "./color.mjs";

export const REGION_START = "/* generated:start */";
export const REGION_END = "/* generated:end */";

/** The palette body between the markers (markers excluded). */
export function regionOf(css) {
  const start = css.indexOf(REGION_START);
  const end = css.indexOf(REGION_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `styles.css is missing the ${REGION_START} / ${REGION_END} markers around the palette`,
    );
  }
  return css.slice(start + REGION_START.length, end);
}

/**
 * Every token in the region, as written: `{ light: { token: value }, dark: {...} }`.
 *
 * Both themes are read out of the one `light-dark(light, dark)` pair per token, so
 * a token that is not a pair (there should be none) simply reads the same on both
 * sides rather than disappearing from the audit.
 */
export function readTokens(css) {
  const tokens = { light: {}, dark: {} };
  for (const line of regionOf(css).split("\n")) {
    const match = /^\s*--([\w-]+):\s*(.+?);\s*$/.exec(line);
    if (!match) continue;
    const [, name, value] = match;
    const pair = /^light-dark\((.*)\)$/.exec(value);
    if (pair) {
      const [light, dark] = splitTopLevel(pair[1]);
      tokens.light[name] = light;
      tokens.dark[name] = dark;
    } else {
      tokens.light[name] = value;
      tokens.dark[name] = value;
    }
  }
  return tokens;
}

/** styles.css with the region's body replaced by `body` (already indented). */
export function replaceRegion(css, body, eol = "\n") {
  const start = css.indexOf(REGION_START);
  const end = css.indexOf(REGION_END);
  regionOf(css);
  const endOfLineBeforeEnd = css.lastIndexOf("\n", end) + 1;
  return (
    css.slice(0, start + REGION_START.length) + eol + body + css.slice(endOfLineBeforeEnd)
  );
}

/**
 * The line ending the file already uses. The repository stores LF (git normalises
 * on commit) but a Windows checkout is CRLF, and a generated region written with
 * the other ending would leave the file mixed — and `--check` comparing a mixed
 * file against a uniform one.
 */
export function lineEndingOf(css) {
  const crlf = (css.match(/\r\n/g) ?? []).length;
  const lf = (css.match(/\n/g) ?? []).length;
  return crlf * 2 > lf ? "\r\n" : "\n";
}
