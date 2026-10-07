#!/usr/bin/env node
/**
 * SEO guard: the built documents must contain their page, and canonical, og:url,
 * sitemap and robots must all name the same host.
 *
 * Every rule is a bug this site has had: an empty root (Google indexed the URL
 * with no content), a canonical pointing at the redirecting host, a title or
 * description outside the band Google truncates at, and FAQPage schema claiming
 * answers the page does not render — compared here against the rendered text.
 *
 * Usage: npm run check:seo — reads dist/, so run `npm run build` first.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

/**
 * The canonical host, in one place. Vercel 308-redirects the apex domain to www,
 * so www answers 200. Flip it here and the checks name whichever file you miss.
 */
const ORIGIN = 'https://www.skelpr.com'

const problems = []
const notes = []
const ok = (label) => notes.push(`  ok    ${label}`)
const bad = (label, detail) => problems.push(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`)

if (!existsSync(dist)) {
  console.error('check:seo: FAILED\n  dist/ does not exist — run `npm run build` first.\n')
  process.exit(1)
}

/** Page text as a crawler sees it: tags stripped, whitespace collapsed. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The same normalisation applied to schema text, so the two are comparable. */
function normalize(text) {
  return String(text)
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function meta(html, pattern) {
  const match = pattern.exec(html)
  return match ? match[1].trim() : null
}

const pages = [
  { label: '/', file: join(dist, 'index.html'), minText: 4000 },
  { label: '/docs', file: join(dist, 'docs/index.html'), minText: 4000 },
]

const canonicals = {}

for (const page of pages) {
  if (!existsSync(page.file)) {
    bad(`${page.label}: ${page.file.replace(`${root}/`, '')} is missing`, 'the build produced no document for this page')
    continue
  }
  const html = readFileSync(page.file, 'utf8')

  // --- the page must contain the page -------------------------------
  const text = visibleText(html)
  if (text.length < page.minText) {
    bad(`${page.label}: only ${text.length} characters of visible text`, `expected at least ${page.minText} — is the prerender pass running?`)
  } else ok(`${page.label}: ${text.length.toLocaleString()} characters of visible text`)

  const h1s = html.match(/<h1[\s>]/g) ?? []
  if (h1s.length !== 1) bad(`${page.label}: ${h1s.length} <h1> elements`, 'exactly one is allowed')
  else ok(`${page.label}: exactly one <h1>`)

  if (!/<html[^>]+lang=/.test(html)) bad(`${page.label}: <html> has no lang attribute`)

  // --- title and description, inside their bands --------------------
  const title = meta(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
  if (!title) bad(`${page.label}: no <title>`)
  else if (title.length < 30 || title.length > 65) bad(`${page.label}: title is ${title.length} characters (30–65)`, title)
  else ok(`${page.label}: title ${title.length} chars — ${title}`)

  const description = meta(html, /<meta\s+name="description"\s+content="([^"]*)"/i)
  if (!description) bad(`${page.label}: no meta description`)
  else if (description.length < 120 || description.length > 165) bad(`${page.label}: description is ${description.length} characters (120–165)`, description)
  else ok(`${page.label}: description ${description.length} chars`)

  // --- the host, named consistently ---------------------------------
  const canonical = meta(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i)
  if (!canonical) bad(`${page.label}: no canonical link`)
  else {
    canonicals[page.label] = canonical
    if (!canonical.startsWith(`${ORIGIN}/`) && canonical !== ORIGIN) bad(`${page.label}: canonical is not on ${ORIGIN}`, canonical)
    else ok(`${page.label}: canonical ${canonical}`)
  }

  const ogUrl = meta(html, /<meta\s+property="og:url"\s+content="([^"]+)"/i)
  if (!ogUrl) bad(`${page.label}: no og:url`)
  else if (canonical && ogUrl !== canonical) bad(`${page.label}: og:url disagrees with canonical`, `${ogUrl} vs ${canonical}`)
  else ok(`${page.label}: og:url matches canonical`)

  const robots = meta(html, /<meta\s+name="robots"\s+content="([^"]+)"/i)
  if (!robots) bad(`${page.label}: no robots meta`)
  else if (/\bnoindex\b/i.test(robots)) bad(`${page.label}: page is noindexed`, robots)
  else if (!/\bindex\b/i.test(robots) || !/\bfollow\b/i.test(robots)) bad(`${page.label}: robots meta is missing index, follow`, robots)
  else ok(`${page.label}: robots ${robots}`)

  // --- social preview ------------------------------------------------
  const ogImage = meta(html, /<meta\s+property="og:image"\s+content="([^"]+)"/i)
  if (!ogImage) bad(`${page.label}: no og:image`)
  else if (!ogImage.startsWith('https://')) bad(`${page.label}: og:image is not absolute https`, ogImage)
  else {
    const asset = ogImage.replace(ORIGIN, '')
    if (!existsSync(join(dist, asset))) bad(`${page.label}: og:image points at a missing file`, `${asset} is not in dist/`)
    else ok(`${page.label}: og:image ships (${asset})`)
  }
  if (!/<meta\s+property="og:image:alt"/.test(html)) bad(`${page.label}: og:image:alt is missing`)
  if (!/<meta\s+name="twitter:image:alt"/.test(html)) bad(`${page.label}: twitter:image:alt is missing`)

  // --- structured data must parse -----------------------------------
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  if (blocks.length === 0) bad(`${page.label}: no JSON-LD`)
  const schema = []
  for (const [index, block] of blocks.entries()) {
    try {
      schema.push(JSON.parse(block[1]))
      ok(`${page.label}: JSON-LD #${index + 1} parses`)
    } catch (error) {
      bad(`${page.label}: JSON-LD #${index + 1} does not parse`, error.message)
    }
  }

  // --- the FAQ schema describes what the page says -------------------
  // The FAQPage node lives inside the page's @graph, not at the top level — and
  // a lookup that misses reports no failures, so "no node" must fail outright.
  const faq = schema
    .flatMap((doc) => (Array.isArray(doc?.['@graph']) ? doc['@graph'] : [doc]))
    .find((node) => node && node['@type'] === 'FAQPage')

  if (page.label === '/') {
    if (!faq) bad('/: no FAQPage schema in the JSON-LD graph')
    else {
      const mainEntity = faq.mainEntity ?? []
      if (mainEntity.length === 0) bad('/: FAQPage schema carries no questions')
      for (const item of mainEntity) {
        const question = normalize(item.name ?? '')
        const answer = normalize(item.acceptedAnswer?.text ?? '')
        if (!text.includes(question)) bad('FAQ question not rendered on the page', question)
        else if (!text.includes(answer)) bad('FAQ answer not rendered on the page', `${question} → ${answer.slice(0, 90)}…`)
        else ok(`FAQ schema matches the page: ${question}`)
      }
    }
  }
}

// --- sitemap, robots, and the origin they all share -------------------
const sitemapFile = join(dist, 'sitemap.xml')
if (!existsSync(sitemapFile)) bad('sitemap.xml is missing from dist/')
else {
  const sitemap = readFileSync(sitemapFile, 'utf8')
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  if (locs.length === 0) bad('sitemap.xml lists no URLs')
  for (const loc of locs) {
    if (!loc.startsWith(`${ORIGIN}/`) && loc !== ORIGIN) bad('sitemap URL is not on the canonical host', loc)
  }
  const home = locs.find((loc) => loc.replace(/\/$/, '') === ORIGIN)
  if (canonicals['/'] && home !== canonicals['/']) bad('sitemap home URL disagrees with the home canonical', `${home} vs ${canonicals['/']}`)
  if (canonicals['/docs'] && !locs.includes(canonicals['/docs'])) bad('the docs canonical is not in the sitemap', canonicals['/docs'])
  if (!problems.some((line) => line.includes('sitemap'))) ok(`sitemap: ${locs.length} URL(s) on ${ORIGIN}`)
}

const robotsFile = join(dist, 'robots.txt')
if (!existsSync(robotsFile)) bad('robots.txt is missing from dist/')
else {
  const robots = readFileSync(robotsFile, 'utf8')
  const sitemapLine = /Sitemap:\s*(\S+)/i.exec(robots)
  if (!sitemapLine) bad('robots.txt names no sitemap')
  else if (sitemapLine[1] !== `${ORIGIN}/sitemap.xml`) bad('robots.txt points the sitemap at the wrong host', sitemapLine[1])
  else ok(`robots.txt: Sitemap ${sitemapLine[1]}`)
  // A crawl rule is what Search Console files as "Indexed, though blocked by
  // robots.txt": the page stays in the index while Googlebot is kept off it, so it
  // can only ever be shown as a bare URL - no title, no snippet. Comments are
  // stripped first, because `# Disallow: /` is a note and not a rule, and then any
  // non-empty Disallow fails. The previous assertion matched an exact
  // `Disallow: /` and read straight past a narrower one such as `Disallow: /docs`,
  // which reports to a reader the same way.
  const rules = robots
    .split('\n')
    .map((line) => line.replace(/#.*$/, '').trim())
    .filter(Boolean)

  const blocked = rules.filter((line) => /^Disallow:\s*\S/i.test(line))
  if (blocked.length > 0) {
    bad('robots.txt blocks a path', `${blocked.join(', ')} - blocked pages are indexed without a snippet`)
  } else if (!rules.some((line) => /^User-agent:\s*\*/i.test(line))) {
    bad('robots.txt has no `User-agent: *` group')
  } else if (!rules.some((line) => /^Allow:\s*\/\s*$/i.test(line))) {
    bad('robots.txt does not explicitly `Allow: /`')
  } else {
    ok('robots.txt: no crawl rules, Allow: / for every agent')
  }

  // The site icon, asserted from the same place a crawler looks at it. Google
  // Search ignores SVG favicons outright and wants a raster of at least 48x48; a
  // page declaring only 16 and 32px PNGs, or an .ico whose directory describes an
  // image the payload is not, leaves it with nothing to draw and the result shows
  // a generic globe instead of the logo. Each half has failed on its own.
  const iconHtml = readFileSync(join(dist, 'index.html'), 'utf8')
  const declaredIcons = [...iconHtml.matchAll(/<link[^>]*rel=["']icon["'][^>]*>/gi)].map((m) => m[0])
  const rasterIcons = declaredIcons.filter((tag) => !/type=["']image\/svg\+xml["']/i.test(tag))
  const hasLargeIcon = rasterIcons.some((tag) => {
    const sizes = /sizes=["'](\d+)x(\d+)["']/i.exec(tag)
    if (sizes) return Math.max(Number(sizes[1]), Number(sizes[2])) >= 48
    return /href=["'][^"']*\.ico["']/i.test(tag)
  })
  if (rasterIcons.length === 0) bad('index.html declares no raster favicon')
  else if (!hasLargeIcon) bad('index.html declares no favicon of 48px or more', rasterIcons.join(' '))
  else ok('favicon: a raster of 48px or more is declared')

  const icoPath = join(dist, 'favicon.ico')
  if (!existsSync(icoPath)) bad('favicon.ico is missing from dist/')
  else {
    const buf = readFileSync(icoPath)
    const count = buf.length > 6 ? buf.readUInt16LE(4) : 0
    let largest = 0
    const malformed = []
    for (let i = 0; i < count; i += 1) {
      const at = 6 + i * 16
      const w = buf[at] || 256
      const h = buf[at + 1] || 256
      largest = Math.max(largest, Math.min(w, h))
      // An ICO directory stores the height doubled for the AND mask, so a square
      // entry reads as h === w (PNG payload) or h === 2w. Anything else is a
      // directory that disagrees with its own payload.
      if (h !== w && h !== 2 * w) malformed.push(`${w}x${h}`)
    }
    if (malformed.length > 0) bad('favicon.ico directory disagrees with its payload', malformed.join(', '))
    else if (largest < 48) bad(`favicon.ico largest layer is ${largest}px, a crawler wants at least 48`)
    else ok(`favicon.ico: ${count} layers, largest ${largest}px`)
  }
}

if (!existsSync(join(dist, '404.html'))) bad('404.html is missing from dist/')
else ok('404.html ships')

// AI answer engines read this file directly; its absence is invisible to a
// normal crawl, which is why it is asserted rather than assumed.
if (!existsSync(join(dist, 'llms.txt'))) bad('llms.txt is missing from dist/')
else ok('llms.txt ships')

console.log('\nSEO CHECK')
console.log(notes.join('\n'))

if (problems.length > 0) {
  console.log('\n' + problems.join('\n'))
  console.error(`\ncheck:seo: FAILED — ${problems.length} problem(s)\n`)
  process.exit(1)
}

console.log(`\ncheck:seo: ok (${notes.length} assertions)\n`)
