#!/usr/bin/env node
// Guard: no absolute path from a maintainer's machine in this repository.
//
// The site publishes the agents' verbatim benchmark answers, and those answers used to
// carry absolute file links pointing at the disk of the machine that ran the benchmark —
// which would render as clickable links to somebody else's filesystem.
// `src/data/benchmarkAnswers.ts` is generated, so the check has to be able to fail on
// generated output, not just on hand-written source.
//
// This mirrors the engine's `scripts/check_repo_hygiene.py` (docs/HYGIENE.md there).
// The engine's heavy check is authoritative and also runs nightly over both checkouts;
// this one exists so the website's own CI fails fast, without a cross-repo checkout.
//
//   node scripts/check-hygiene.mjs

import { readFileSync } from 'node:fs'
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const PATTERNS = [
  ['absolute file:// link', /file:\/\/\//],
  ['home directory path', /(?<![A-Za-z0-9])[A-Za-z]:[\\/]+Users[\\/][^\\/\s"']+[\\/]?|(?<![\w:./-])\/(?:Users|home)\/[^/\s"']+\//],
  [
    'absolute drive path',
    /(?<![A-Za-z0-9])[A-Za-z]:[\\/]+(?:Projects|Documents|Desktop|Downloads|Development|Dev|repos|code|workspace|Freelance|localmodel)[\\/]/,
  ],
  ['client folder name', /Freelance/],
]

// Files that define the detection patterns themselves, or document the shapes in prose.
// They contain the shapes look-alikes on purpose, so they are exempted explicitly rather
// than by loosening a pattern. Everything else — including generated data — is scanned.
const EXEMPT = new Set(['scripts/check-hygiene.mjs'])

const SKIP_DIRS = new Set(['.git', 'dist', 'node_modules', 'brand-source'])
const SUFFIXES = ['.ts', '.tsx', '.js', '.mjs', '.json', '.css', '.html', '.md', '.txt', '.xml', '.yml', '.yaml']

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const path = join(dir, entry)
    const info = statSync(path)
    if (info.isDirectory()) yield* walk(path)
    else yield path
  }
}

let scanned = 0
const problems = []

for (const path of walk(root)) {
  const name = relative(root, path)
  if (name.startsWith('package-lock.json')) continue
  if (EXEMPT.has(name.split(/[\\/]/).join('/'))) continue
  if (!SUFFIXES.some((suffix) => name.endsWith(suffix))) continue
  scanned += 1

  let text
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    continue
  }
  if (text.includes('\0')) continue

  for (const [label, pattern] of PATTERNS) {
    const match = pattern.exec(text)
    if (!match) continue
    const before = text.slice(0, match.index)
    const line = before.split('\n').length
    const snippet = text.slice(Math.max(0, match.index - 40), match.index + 60).replace(/\s+/g, ' ')
    problems.push(`  ${name}:${line} — ${label}\n      …${snippet}…`)
    break
  }
}

if (problems.length > 0) {
  console.error('hygiene check: FAILED\n')
  console.error(problems.join('\n'))
  console.error(
    '\nFix generated output by regenerating it from the sanitized engine docs\n' +
      '(npm run extract:answers), never by hand-editing src/data/benchmarkAnswers.ts.',
  )
  process.exit(1)
}

console.log(`hygiene check: ok (${scanned} files scanned)`)
