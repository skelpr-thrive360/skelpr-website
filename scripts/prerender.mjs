#!/usr/bin/env node
/**
 * Prerender: write each page's rendered HTML into the built document.
 *
 *   vite build       → dist/*.html (root empty)
 *   vite build --ssr → dist-ssr/entry-server.js
 *   this script      → the same documents, page inside the root
 *
 * Only the inside of `<div id="root">` moves; the authored head (theme script,
 * favicons, canonical, JSON-LD) is left alone. Without this pass the response
 * ships an empty div — why Google had the URL indexed with no content.
 *
 * A non-empty root is an error: the lazy `</div>` match would splice markup
 * into markup rather than obviously break.
 *
 * Usage: npm run prerender   (as part of `npm run build`)
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function fail(message) {
  console.error(`\nprerender: FAILED\n  ${message}\n`)
  process.exit(1)
}

const entry = join(root, 'dist-ssr', 'entry-server.js')
if (!existsSync(entry)) fail('dist-ssr/entry-server.js is missing — run `npm run build:ssr` first.')
if (!existsSync(join(root, 'dist'))) fail('dist/ is missing — run `vite build` first.')

const { renderMarketingPage, renderDocsPage } = await import(pathToFileURL(entry).href)

const pages = [
  { label: '/', file: 'dist/index.html', render: renderMarketingPage },
  { label: '/docs', file: 'dist/docs/index.html', render: renderDocsPage },
]

// Only run over fresh `vite build` output (root empty); the guard enforces it.
const ROOT = /<div id="root">([\s\S]*?)<\/div>/

for (const page of pages) {
  const file = join(root, page.file)
  const document = readFileSync(file, 'utf8')

  const match = ROOT.exec(document)
  if (!match) fail(`${page.file}: no <div id="root"></div> to prerender into.`)
  if (match[1].trim() !== '') {
    fail(
      `${page.file}: <div id="root"> already contains markup. This script rewrites the ` +
        'output of `vite build`; run `npm run build`, not `npm run prerender` twice.',
    )
  }

  let rendered
  try {
    rendered = page.render()
  } catch (error) {
    fail(`${page.label} threw while rendering: ${error?.stack ?? error}`)
  }

  // An app that renders nothing would pass an empty-div round trip; the point of
  // this pass is text, so require it.
  const text = rendered.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  if (text.trim().length < 500 || !/<h1[\s>]/.test(rendered)) {
    fail(
      `${page.label} rendered ${text.trim().length} characters of text and ` +
        `${/<h1[\s>]/.test(rendered) ? 'an' : 'no'} <h1> — refusing to write it as the page.`,
    )
  }

  writeFileSync(file, document.replace(ROOT, `<div id="root">${rendered}</div>`))
  console.log(`  prerendered ${page.label.padEnd(6)} → ${page.file} (${text.trim().length.toLocaleString()} chars of text)`)
}

console.log('\nprerender: ok — both documents now carry their page in the initial HTML\n')
