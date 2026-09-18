/**
 * Colour maths shared by the palette scripts.
 *
 * Three spaces, each for the one job it is actually good at:
 *   - sRGB (`#rrggbb`, 0-255)  — what the browser paints, and the space WCAG
 *                                contrast is defined in;
 *   - OKLab                    — perceptually uniform, so a step in lightness is
 *                                a step the eye agrees with: the solver moves L
 *                                and nothing else;
 *   - OKLCh                    — OKLab in polar form, so a token can keep its hue
 *                                and chroma while its lightness moves.
 *
 * Everything is pure: no I/O, no globals, no state.
 */

/** `#abc` / `#aabbcc` -> `[r, g, b]` (0-255). */
export function hexToRgb(hex) {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

/** `[r, g, b]` (fractions or 0-255) -> `#rrggbb`. */
export function rgbToHex(rgb) {
  return (
    "#" +
    rgb
      .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** One sRGB channel (0-255) -> linear light (0-1). */
function linearize(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Linear light (0-1) -> one sRGB channel (0-255). */
function delinearize(value) {
  const c = value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
  return c * 255;
}

/** WCAG relative luminance of an sRGB colour. */
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two sRGB colours (1-21). */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** sRGB -> OKLab. */
export function rgbToOklab(rgb) {
  const [r, g, b] = rgb.map(linearize);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLab -> sRGB channels (0-255, unrounded, may fall outside the gamut). */
export function oklabToRgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    delinearize(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    delinearize(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    delinearize(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/** sRGB -> OKLCh, in degrees and 0-0.4 chroma. */
export function rgbToOklch(rgb) {
  const [L, a, b] = rgbToOklab(rgb);
  return { L, C: Math.hypot(a, b), h: (Math.atan2(b, a) * 180) / Math.PI };
}

/** `#rrggbb` -> OKLCh. */
export function hexToOklch(hex) {
  return rgbToOklch(hexToRgb(hex));
}

function inGamut(rgb, tolerance = 0.5) {
  return rgb.every((c) => c >= -tolerance && c <= 255 + tolerance);
}

/**
 * OKLCh -> `#rrggbb`, reducing chroma until the colour fits in sRGB.
 *
 * Lightness is the axis that carries the contrast target, so it is never
 * sacrificed to gamut: the hue is kept and the chroma gives way, which is what
 * keeps a solved token recognisably the same colour as its anchor.
 */
export function oklchToHex(L, C, h) {
  const rad = (h * Math.PI) / 180;
  let chroma = C;
  let rgb = oklabToRgb([L, chroma * Math.cos(rad), chroma * Math.sin(rad)]);
  if (!inGamut(rgb)) {
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 24; i += 1) {
      const mid = (lo + hi) / 2;
      const candidate = oklabToRgb([L, mid * Math.cos(rad), mid * Math.sin(rad)]);
      if (inGamut(candidate)) lo = mid;
      else hi = mid;
      chroma = lo;
      rgb = candidate;
    }
    rgb = oklabToRgb([L, chroma * Math.cos(rad), chroma * Math.sin(rad)]);
  }
  return rgbToHex(rgb);
}

/** WCAG contrast ratio, reported the way the audit prints it. */
export function formatRatio(value) {
  return `${value.toFixed(2)}:1`;
}

/**
 * A translucent colour laid over an opaque one, flat.
 *
 * Alpha layers are how a wash is *described*, not how it should ship: what the
 * page paints is the composite, so the palette composites it at derive time and
 * writes the result as a plain colour. Same colour everywhere it is used, no
 * dependency on what happens to be underneath, and nothing to fade out when the
 * surface beneath it changes.
 */
export function compositeOver(base, over, amount) {
  const [b, o] = [hexToRgb(base), hexToRgb(over)];
  return rgbToHex(o.map((channel, i) => channel * amount + b[i] * (1 - amount)));
}

/**
 * Perceptual distance between two colours (OKLab, x100).
 *
 * Used for the palette rule that brand colour must stay far from every verdict
 * colour: Euclidean distance in OKLab is uniform enough that a single minimum
 * means the same thing in light and dark.
 */
export function separation(a, b) {
  const [x, y] = [rgbToOklab(hexToRgb(a)), rgbToOklab(hexToRgb(b))];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) * 100;
}

/**
 * Parses one value out of a CSS token: either a plain colour or the side of a
 * `light-dark(a, b)` pair. Returns an sRGB colour string, or null when the value
 * is not a colour the audit can measure (an alpha wash, a shadow).
 */
export function readColorValue(value, side) {
  const pair = /^light-dark\((.*)\)$/.exec(value.trim());
  if (pair) {
    const parts = splitTopLevel(pair[1]);
    if (parts.length !== 2) return null;
    return normalizeColor(parts[side]);
  }
  return normalizeColor(value);
}

/** Splits on commas that are not inside parentheses. */
export function splitTopLevel(value) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current.trim());
  return parts;
}

/** `#abc`, `#aabbcc` or `rgb(r, g, b)` -> `#rrggbb`, or null if unmeasurable. */
function normalizeColor(value) {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();

  const rgb = /^rgba?\(([^)]+)\)$/.exec(trimmed);
  if (!rgb) return null;
  // An alpha layer is not a flat colour, so the audit cannot measure it: the
  // washes, the header veil and the shadow colours are the tokens in that shape.
  if (rgb[1].includes("/")) return null;
  const [r, g, b] = splitTopLevel(rgb[1]).map((c) => parseFloat(c));
  if ([r, g, b].some((c) => Number.isNaN(c))) return null;
  return rgbToHex([r, g, b]);
}
