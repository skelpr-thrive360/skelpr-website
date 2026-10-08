# Skelpr website

The public product website for [skelpr](https://github.com/skelpr-thrive360/skelpr) —
surgical code retrieval for AI agents. React 19 + TypeScript on Vite, statically built
and prerendered, deployed on Vercel. Product copy and benchmark figures are grounded in
the repository's README and `docs/`, never invented.

## Local development

```bash
cd website
npm install
npm run dev        # dev server — marketing page at /, docs page at /docs/
npm run build      # typecheck + build + prerender both pages into dist/
npm run preview    # serve the production build locally
```

## Checks

Plain Node scripts, no extra tooling. CI runs all of them on every push.

```bash
npm run check:palette    # styles.css palette still matches palette.config.mjs
npm run check:links      # every in-page #hash resolves
npm run audit:contrast   # every token meets its contrast target
npm run check:seo        # built HTML indexable; canonical/sitemap/robots agree (needs build)
npm run check:audit      # 22-point ranking audit
```

## Pages

Two Vite entries, two real URLs: the marketing page (`index.html`) and the install guide
(`docs/index.html`, built from `src/docs/install.md` — the markdown is the single source
of truth; the contents rail and heading anchors are derived from it).

The build ends with a prerender pass (`scripts/prerender.mjs`) that writes rendered HTML
into each document, so crawlers receive real content, not an empty root. Components must
not read the browser during render — every `window`/`document` touch lives in an effect,
a handler, or a `useSyncExternalStore` server snapshot.

## Canonical URL

The canonical host is `https://www.skelpr.com` (Vercel 308-redirects the apex there).
Four files must agree: the canonical/og/twitter tags in `index.html` and
`docs/index.html`, `public/sitemap.xml`, and `public/robots.txt`. `npm run check:seo`
fails if any of them drifts — if the domain ever changes, update those four **and** the
`ORIGIN` constant in `scripts/check-seo.mjs` together.

## Waitlist

The form in the waitlist section posts to the endpoint in `VITE_WAITLIST_ENDPOINT`
(`.env`, see [`.env.example`](./.env.example)). **The variable must be set in the
host's build environment too (Vercel → Settings → Environment Variables), or the build
falls back to a local sessionStorage stub that stores nothing.** Joining twice shows a
duplicate state with a withdraw option; withdrawing deletes the row server-side.

Backend: Google Apps Script bound to a Google Sheet —
[`waitlist-apps-script.gs`](./waitlist-apps-script.gs), with the full deploy checklist
in the script header. Sheet columns are `Timestamp | Email | Progress`; the script
styles itself, dedupes, holds a lock for concurrent submissions, silently drops
honeypot hits, and never exposes sheet contents in responses.

**After editing the script, redeploy via Deploy → Manage deployments → ✏️ → Version:
New version.** Saving in the editor alone does not update the live deployment, and
"New deployment" creates a second URL your site isn't calling. Verify what's live by
opening the `/exec` URL: it must report the current schema version.

## Generated files

Nothing visual is edited by hand:

- **Brand assets** — `python scripts/build-brand-assets.py` regenerates every icon,
  logo plate (`public/brand/logo-skelpr.png`, `logo-skelpr-dark.png`) and the social
  card from `brand-source/mainlogo-skelpr.png`.
- **Benchmark answers** — `npm run extract:answers` regenerates
  `src/data/benchmarkAnswers.ts` verbatim from the repo's benchmark comparison doc.
  Re-run only when that doc changes.
- **Palette** — `npm run derive:palette` solves `scripts/palette.config.mjs` into the
  token table in `src/styles.css`; `check:palette` fails on drift.

## Motion and theming

Scroll choreography is documented in [MOTION.md](./MOTION.md). The site ships
light/dark/system themes from one `light-dark()` palette table, applied before first
paint to avoid a flash; `system` is the default.
