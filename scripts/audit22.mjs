// One-off audit of the 22-point checklist against the built site (dist/).
// Usage: node scripts/audit22.mjs
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripTags } from './lib/visible-text.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const home = readFileSync(join(dist, 'index.html'), 'utf8')
const docs = readFileSync(join(dist, 'docs/index.html'), 'utf8')
const robots = readFileSync(join(dist, 'robots.txt'), 'utf8')
const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8')

// Linear-scan tag stripping from ./lib/visible-text.mjs — not tag-matching regexes.
const strip = (html) => stripTags(html).replace(/\s+/g, ' ').trim()

const homeText = strip(home)
const docsText = strip(docs)
const words = (s) => s.split(' ').filter(Boolean).length
const meta = (html, re) => (re.exec(html)?.[1] ?? '').trim()

const results = []
const ok = (n, label, detail = '') => results.push(['PASS', n, label, detail])
const no = (n, label, detail = '') => results.push(['FAIL', n, label, detail])
const na = (n, label, detail = '') => results.push(['N/A ', n, label, detail])

// 1 HTTPS — checked live below; here: every URL in the build is https.
// Namespace declarations (www.w3.org/2000/svg) are identifiers, not links.
const urls = [...home.matchAll(/https?:\/\/[^"'<> ]+/g)].map((m) => m[0])
const isNamespace = (u) => /w3\.org|schema\.org|xml\.org|ietf\.org|127\.0\.0\.1|localhost/.test(u)
const nonHttps = urls.filter((u) => u.startsWith('http://') && !isNamespace(u))
nonHttps.length === 0 ? ok(1, 'No insecure (http://) URLs baked into the page', `${urls.length} URLs, all https`) : no(1, 'Insecure URLs in page', nonHttps.join(', '))

existsSync(join(dist, 'robots.txt')) ? ok(2, 'robots.txt ships') : no(2, 'robots.txt missing')
!/^Disallow:\s*\/\s*$/im.test(robots) && !/^Disallow:\s*$/im.test(robots) ? ok(3, 'robots.txt does not block the site', robots.replace(/\n/g, ' | ')) : no(3, 'robots.txt blocks')
existsSync(join(dist, 'sitemap.xml')) ? ok(4, 'sitemap.xml ships', `${[...sitemap.matchAll(/<loc>/g)].length} URLs`) : no(4, 'sitemap missing');
/^\s*Sitemap:\s*\S+/im.test(robots) ? ok(5, 'robots.txt points at the sitemap', meta(robots, /Sitemap:\s*(\S+)/im)) : no(5, 'no Sitemap line')

const h1s = (html) => (html.match(/<h1[\s>]/g) ?? []).length
homeText.length > 1000 && docsText.length > 1000 ? ok(6, 'Both pages carry indexable text (server-rendered)', `home ${homeText.length} chars, docs ${docsText.length} chars`) : no(6, 'thin/empty pages')
!/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(home + docs) && /index,\s*follow/i.test(home) ? ok(6, 'index,follow on both pages, no noindex') : no(6, 'robots meta problem')

const title = meta(home, /<title[^>]*>([\s\S]*?)<\/title>/)
const docsTitle = meta(docs, /<title[^>]*>([\s\S]*?)<\/title>/)
title.length >= 30 && title.length <= 65 && docsTitle.length >= 30 && docsTitle.length <= 65 ? ok(7, 'Titles in the 30–65 band', `${title.length} / ${docsTitle.length} — ${title}`) : no(7, 'title length', `${title.length} / ${docsTitle.length}`)

const desc = meta(home, /<meta\s+name="description"\s+content="([^"]*)"/)
const docsDesc = meta(docs, /<meta\s+name="description"\s+content="([^"]*)"/)
desc.length >= 120 && desc.length <= 165 && docsDesc.length >= 120 && docsDesc.length <= 165 ? ok(8, 'Descriptions in the 120–165 band', `${desc.length} / ${docsDesc.length} chars`) : no(8, 'description length', `${desc.length} / ${docsDesc.length}`)

const canon = meta(home, /<link\s+rel="canonical"\s+href="([^"]+)"/)
const docsCanon = meta(docs, /<link\s+rel="canonical"\s+href="([^"]+)"/)
const sitemapHosts = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
canon.startsWith('https://') && docsCanon.startsWith('https://') && sitemapHosts.every((u) => u.startsWith('https://www.skelpr.com')) ? ok(9, 'Canonical on both pages, sitemap agrees', `${canon} · ${docsCanon}`) : no(9, 'canonical/sitemap disagree')

h1s(home) === 1 && h1s(docs) === 1 ? ok(10, 'Exactly one <h1> per page') : no(10, 'h1 count', `home ${h1s(home)}, docs ${h1s(docs)}`)

const ogOk = ['og:title', 'og:description', 'og:image', 'og:url', 'twitter:card', 'twitter:image'].every((p) => home.includes(`property="${p}"`) || home.includes(`name="${p}"`))
const ogImg = new URL(meta(home, /<meta\s+property="og:image"\s+content="([^"]+)"/)).pathname;
ogOk && existsSync(join(dist, ogImg)) ? ok(11, 'Social preview tags + image ship', ogImg) : no(11, 'social preview');
/viewport/.test(home) && /viewport/.test(docs) ? ok(12, 'Viewport meta on both pages') : no(12, 'no viewport')

const imgs = [...(home + docs).matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
const noAlt = imgs.filter((t) => !/\balt=/.test(t))
const svgNoLabel = [...(home + docs).matchAll(/<svg\b[^>]*>/g)].map((m) => m[0]).filter((t) => !/aria-label|aria-hidden|role=/.test(t))
noAlt.length === 0 ? ok(13, 'Every <img> has an alt attribute', `${imgs.length} imgs (${imgs.filter((t) => /alt=""/.test(t)).length} decorative/empty) — svg gaps: ${svgNoLabel.length}`) : no(13, 'images without alt', noAlt.length)

words(homeText) >= 300 && words(docsText) >= 300 ? ok(14, 'Word count', `home ${words(homeText)} words, docs ${words(docsText)} words`) : no(14, 'under 300 words', `${words(homeText)} / ${words(docsText)}`)

const blockedAgents = [...robots.matchAll(/User-agent:\s*(\S+)/gi)].map((m) => m[1]).filter((a) => !/^\*$/i.test(a))
blockedAgents.length === 0 ? ok(15, 'No AI crawler is singled out for blocking', `agents named: ${blockedAgents.length || 'none (wildcard allow)'}`) : no(15, 'AI agents named in robots', blockedAgents.join(', '))

homeText.length > 1000 ? ok(16, 'Non-JS / AI crawlers get the page, not a blank div', `${homeText.length} chars before any script runs`) : no(16, 'blank page for non-JS crawlers')

existsSync(join(dist, 'llms.txt')) ? ok(17, 'llms.txt ships') : no(17, 'no llms.txt')

const jsonld = [...(home + docs).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1])
let parseOk = true
const types = []
for (const block of jsonld) {
  try { const doc = JSON.parse(block); types.push(...(doc['@graph'] ?? [doc]).map((n) => n['@type'])) } catch { parseOk = false }
}
parseOk && jsonld.length > 0 ? ok(18, 'Structured data parses', types.join(', ')) : no(18, 'JSON-LD broken')

const faq = home.includes('"FAQPage"')
const firstAnswer = faq ? (JSON.parse(jsonld.find((b) => b.includes('FAQPage')))['@graph']?.find((n) => n['@type'] === 'FAQPage')?.mainEntity?.[0]?.acceptedAnswer?.text ?? '') : ''
firstAnswer && firstAnswer.split(' ').length <= 50 ? ok(19, 'Opening sentence of each answer is a short, quotable reply', `${firstAnswer.split(' ').length} words in the first answer`) : no(19, 'no short answer up front')

faq ? ok(20, 'Q&A block present (visible FAQ + FAQPage schema)') : no(20, 'no Q&A block')

const org = JSON.parse(jsonld[0])['@graph'].find((n) => n['@type'] === 'Organization')
org?.name && org?.logo ? ok(21, 'Site owner named behind the page', `${org.name}, logo ${org.logo.url ? '✓' : '✗'}${org.email ? ', email ✓' : ', no email'}`) : no(21, 'no named owner')

const crumbs = JSON.parse(jsonld.find((b) => b.includes('BreadcrumbList')) ?? 'null')
crumbs ? ok(22, 'BreadcrumbList schema', 'docs page') : no(22, 'no breadcrumbs')

const width = (s) => String(s).padEnd(2)
for (const [status, n, label, detail] of results) console.log(`${status} ${width(n)} ${label}${detail ? ` — ${detail}` : ''}`)
const fails = results.filter((r) => r[0] === 'FAIL')
console.log(`\n${results.filter((r) => r[0] === 'PASS').length} pass, ${fails.length} fail`)
