#!/usr/bin/env node
/**
 * In-page hash audit.
 *
 * Three things have to agree for the site's navigation to be honest: the
 * `href="#…"` links, the `id`s they point at, and `sectionIds` in
 * src/lib/sections.ts — the list the scroll spy walks. So this checks that
 *
 *   1. every in-page link resolves to an id that is actually rendered,
 *   2. every registered section is rendered somewhere, and
 *   3. every `<section id="…">` in the markup is registered.
 *
 * A fragment that resolves to nothing is invisible in review — the click just
 * does nothing and the URL lies — so it is worth a check rather than an eye.
 * (2) and (3) are what stop a renamed or newly added section from quietly
 * dropping out of the nav, the hash it writes, and the spy.
 *
 * Usage: npm run check:links
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(root, "src");

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(path) ? [path] : [];
  });
}

const files = sourceFiles(sourceDir);
const ids = new Set();
const links = [];
const sectionIds = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const name = relative(root, file).replace(/\\/g, "/");
  for (const match of source.matchAll(/id="([^"]+)"/g)) ids.add(match[1]);
  for (const match of source.matchAll(/href="#([^"]+)"/g)) links.push({ id: match[1], name });
  for (const match of source.matchAll(/<section[^>]*\sid="([^"]+)"/g)) sectionIds.push({ id: match[1], name });
}

// The registry is read rather than imported: this runs straight from node,
// without a TypeScript step in front of it.
const registry = readFileSync(join(sourceDir, "lib", "sections.ts"), "utf8");
const registered = [...(registry.match(/sectionIds = \[([\s\S]*?)\]/)?.[1] ?? "").matchAll(/'([^']+)'/g)].map(
  (match) => match[1],
);

const problems = [];

console.log("");
console.log(`IN-PAGE LINKS       ${links.length} hash link(s), ${registered.length} registered section(s)`);

for (const link of links) {
  const ok = ids.has(link.id);
  if (!ok) problems.push(`${link.name}: href="#${link.id}" points at no id on the page`);
  console.log(`  ${ok ? "ok" : "FAIL"}  #${link.id.padEnd(14)} ${link.name}`);
}

for (const id of registered) {
  const ok = ids.has(id);
  if (!ok) problems.push(`src/lib/sections.ts: section "${id}" is registered but never rendered`);
  console.log(`  ${ok ? "ok" : "FAIL"}  #${id.padEnd(14)} registered`);
}

for (const section of sectionIds) {
  const ok = registered.includes(section.id);
  if (!ok) problems.push(`${section.name}: <section id="${section.id}"> is missing from sectionIds in src/lib/sections.ts`);
  console.log(`  ${ok ? "ok" : "FAIL"}  #${section.id.padEnd(14)} <section>`);
}

if (problems.length > 0) {
  console.log("");
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(`\n${problems.length} in-page link problem(s) found`);
  process.exit(1);
}

console.log(`\n${links.length} link(s), ${registered.length} section(s), all resolve`);
