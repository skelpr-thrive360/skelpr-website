/**
 * HTML → visible text, for the SEO checks.
 *
 * The previous implementation stripped script/style/tag content with
 * `<script[\s\S]*?<\/script>`-shaped regexes (CodeQL: "bad HTML filtering
 * regexp") and decoded `&amp;` before the others (CodeQL: "double escaping" —
 * `&amp;lt;` would decode all the way to `<`, an unescape of an unescape).
 * This module replaces both with a linear scan and a single-pass decode: one
 * regex, one lookup, so no decoded output can be matched again.
 *
 * The scan is also simply more correct than the regexes were: a `<script` with
 * no closing tag used to swallow the rest of the page into "invisible" text,
 * and `>` inside a quoted attribute used to end a tag early.
 */

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
}

/** Tag/element name at the start of an open tag: `<div ...` → `div`. */
const tagNameAt = (html, start) => /^[a-zA-Z][a-zA-Z0-9-]*/.exec(html.slice(start, start + 32))?.[0] ?? ''

/**
 * Remove script/style content and every tag, leaving the text a crawler sees.
 * Returns the raw stripped string; callers decide about entity decoding.
 */
export function stripTags(html) {
  let out = ''
  let i = 0
  const n = html.length
  const lower = html.toLowerCase()
  while (i < n) {
    const lt = html.indexOf('<', i)
    if (lt === -1) {
      out += html.slice(i)
      break
    }
    out += html.slice(i, lt)
    // Comments, doctype and processing instructions end by their own rules —
    // an apostrophe inside one is not an attribute quote (a comment that read
    // "the guide's own sentence" used to open a phantom quote here and swallow
    // the rest of the document).
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4)
      if (end === -1) break
      i = end + 3
      out += ' '
      continue
    }
    if (html[lt + 1] === '!' || html[lt + 1] === '?') {
      const gt = html.indexOf('>', lt + 2)
      if (gt === -1) break
      i = gt + 1
      out += ' '
      continue
    }
    // Find the true end of the tag: `>` inside a quoted attribute value does
    // not close it, which the old regex got wrong.
    let j = lt + 1
    let quote = ''
    while (j < n) {
      const ch = html[j]
      if (quote) {
        if (ch === quote) quote = ''
      } else if (ch === '"' || ch === "'") {
        quote = ch
      } else if (ch === '>') {
        break
      }
      j++
    }
    if (j >= n) {
      out += html.slice(lt) // unterminated tag: the tail is text, not markup
      break
    }
    const name = tagNameAt(html, lt + 1).toLowerCase()
    i = j + 1
    if (name === 'script' || name === 'style') {
      const close = lower.indexOf(`</${name}`, i)
      if (close === -1) {
        i = n // unterminated element: its content is not visible text
        break
      }
      const gt = html.indexOf('>', close)
      if (gt === -1) {
        i = n
        break
      }
      i = gt + 1
    }
    // Every skipped tag becomes one space, exactly as the tag-stripping regex
    // it replaces did — adjacent elements would otherwise run their words
    // together ("DocsJoin waitlist") and word-boundary comparisons would fail.
    out += ' '
  }
  return out
}

/** Page text as a crawler sees it: tags stripped, entities decoded once, whitespace collapsed. */
export function visibleText(html) {
  return stripTags(html)
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#39;/g, (m) => ENTITIES[m] ?? m)
    .replace(/\s+/g, ' ')
    .trim()
}

/** The same normalisation the checks apply to schema text, for comparison. */
export function normalizeText(text) {
  return String(text)
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
