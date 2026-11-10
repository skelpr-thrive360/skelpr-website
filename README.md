# Skelpr website

Product pages, installation docs and benchmark comparisons for Skelpr.
Public copy describes repository evidence, context limits and MCP/CLI integration.
Keep engine internals out of product copy. Source setup claims from the package;
source performance claims from the saved benchmark evidence.

## Develop and build

Use Node 24, matching CI.

```bash
npm ci
npm run dev        # home page, /docs/ and /privacy/
npm run build      # typecheck, client build, SSR build, prerender
npm run preview    # serve dist/
```

The site uses React, TypeScript and Vite, with plain CSS. Runtime dependencies
include Lucide icons, React Markdown with remark-gfm, and bundled fonts.
Scrolling uses the browser. `package.json` lists all dependencies.

`dist/` is static output. The homepage and install guide are prerendered, then
hydrated in the browser. The privacy notice is plain HTML. Keep browser APIs out
of component render paths.
For Lighthouse, audit the production preview after building. Use the same
viewport and throttling settings for comparisons.

## File map

| Change | Files |
|---|---|
| Page order and hero | `src/App.tsx` |
| Product sections | `src/components/`, `src/data/siteData.tsx` |
| Benchmark selector and task comparisons | `src/components/BenchmarkSection.tsx` |
| Django data | `src/data/djangoCaseStudy.ts`, `public/benchmarks/django-case-study-20261109/` |
| Historical Sock Shop answers | `src/data/benchmarkAnswers.ts` (generated) |
| Installation guide | `src/docs/install.md` |
| Docs layout and navigation | `src/docs/DocsApp.tsx`, `src/docs/docs.css` |
| Layout, color and typography | `src/styles.css` |
| Metadata and structured data | `index.html`, `docs/index.html` |
| Website privacy notice | `privacy/index.html` |
| Indexing hints | `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt` |
| Static rendering | `src/entry-server.tsx`, `scripts/prerender.mjs` |
| Release-updates waitlist | `src/lib/waitlist.ts`, `waitlist-apps-script.gs` |

## Checks

CI runs on pushes to `main` and pull requests targeting `main` or `dev`.
It runs the build and five checks. A direct push to `dev` does not trigger CI.

```bash
npm run check:palette
npm run check:hygiene
npm run build
npm run check:seo
npm run check:links
npm run audit:contrast
```

`check:seo` reads `dist/`, so run it after the build. `check:audit` is an additional
local content/SEO audit; it is not part of the current CI workflow.

## Documentation and metadata

`src/docs/install.md` supplies the `/docs/` article and its table of contents.
Heading text determines anchors. Preserve linked headings or update incoming links
when renaming them. Shell comments in fenced code are excluded from the contents.

When changing product copy, check these surfaces together:

- Visible sections and FAQ answers.
- Titles, descriptions, social tags and JSON-LD where applicable.
- `public/llms.txt` and documentation.

`check:seo` checks prerendering, title/description lengths, canonical URLs, social
assets and FAQ text against structured data. `check:links` checks in-page links.

### Canonical URL

The configured origin is `https://www.skelpr.com`. If it changes, update:

- Canonical URLs in `index.html`, `docs/index.html` and `privacy/index.html`, plus the social URLs.
- `public/sitemap.xml`, the sitemap URL in `public/robots.txt`, and `public/llms.txt`.
- `ORIGIN` in `scripts/check-seo.mjs`.

## Benchmark evidence

Keep Sock Shop and Django separately selectable. Do not combine their models,
tasks or totals into one performance claim. Keep reported limitations next to the
numbers and make the prompts and answer comparisons accessible from each study.

### Sock Shop

The historical figures and verbatim answers remain available. Some retained engine
artifacts do not reproduce the published aggregate or architecture row. Preserve
that caveat; these figures are not a current-build guarantee.

`src/data/benchmarkAnswers.ts` is generated from the engine repository's
`docs/comparisons/COMP_ANTIGRAVITY.md`:

```bash
npm run extract:answers
```

The extractor searches common sibling/nested checkout locations. Set
`SKELPR_COMPARISON_DOC` to the source document for another layout. Regenerate only
when intentionally updating the source record; do not edit verbatim answers by hand.
Historical task metadata is in `src/data/siteData.tsx`.

### Django

The canonical source is the engine repository's
`benchmarks/results/django-case-study-20261109/metrics.json`. A byte-identical,
SHA-256-verified public copy lives at
`public/benchmarks/django-case-study-20261109/metrics.json`.
`src/data/djangoCaseStudy.ts` provides the website's task data.

`src/data/djangoAnswers.json` contains all twenty retained answers, exact prompts,
per-run metrics and result/answer hashes. Each result hash matches the canonical
metrics record; each answer hash matches its original UTF-8 text. All twenty runs
record GPT-6 Astra with high reasoning. Do not substitute a later run or rewrite
an answer. Keep local run directories and session paths out of this export.

Sock Shop is the first/default tab; Django is the second. Both provide task tables
and side-by-side answers. Django answer text loads only when its study is selected.
Four primary metrics appear above each Django answer; full token and tool counts
remain available in a disclosure. Answers can be expanded without changing the
retained text. The six-step workflow explains the agent/MCP contract without engine
algorithms.

| Metric | Native tools | With Skelpr MCP |
|---|---:|---:|
| Total tokens | 437,997 | 274,749 (37.27% fewer) |
| Native search/read calls | 28 | 9 |
| Combined rubric score | 89/96 | 91/96 |
| Model requests | 41 | 31 |
| Summed wall time | 534.40 s | 521.25 s |

Total tokens count all input, including cached input, plus output. Native search
and read counts exclude tests.
Six tasks finished faster; four were slower. This is one retained comparison per
question across successive builds; questions informed tuning, two edit tasks used
seeded defects, and provider caching was uncontrolled. It is a case study, not an
unseen-task evaluation of one frozen release or a general performance guarantee.

To publish a new study, add a separate versioned record. Preserve existing answers,
scores and metrics. Verify file hashes and recompute displayed totals from the
record before changing copy. Do not regenerate or replace historical evidence as
part of a UI edit.

## Theme and motion

Light, dark and system themes share CSS tokens. The selected theme is stored under
`skelpr-theme`; an early script applies it before paint. Change palette inputs in
`scripts/palette.config.mjs`, then regenerate and check:

```bash
npm run derive:palette
npm run check:palette
npm run audit:contrast
```

Do not hand-edit the generated palette block in `src/styles.css`.
See [MOTION.md](./MOTION.md) for scrolling and animation controls. Keep content
visible without JavaScript and respect reduced-motion preferences. Wheel and touch
scrolling are native; content does not fade out or move as readers scroll.

## Brand assets

`scripts/build-brand-assets.py` generates logos, icons and the social card from
`brand-source/mainlogo-skelpr.png` and `brand-source/og-card-template.png`.
It requires Pillow. Preserve both light and dark variants.

```bash
python scripts/build-brand-assets.py
```

The social-card template owns its text. If product claims change, inspect the card
as well as HTML metadata; the generator replaces the artwork, not the typography.

## Release-updates waitlist

The waitlist is for release updates. Users request activation tokens separately
by email. The form links to the [privacy notice](./privacy/index.html).

`VITE_WAITLIST_ENDPOINT` is read at build time; see [`.env.example`](./.env.example).
Set it in the hosting provider's build environment as well as local development,
then rebuild. Without an endpoint, the form reports that signups are unavailable
and sends or stores no address.

### Google Apps Script setup

1. Create a Google Sheet and open **Extensions → Apps Script**.
2. Paste `waitlist-apps-script.gs` and save.
3. Choose **Deploy → New deployment → Web app**. Execute as your account; allow
   access to anyone. Review and authorize the script's requested permissions.
4. Copy the `/exec` URL to `VITE_WAITLIST_ENDPOINT` and rebuild the site.
5. Open the endpoint signed out. Confirm a JSON response with `ok: true` and
   `schema: "progress-v4"`, without a sign-in redirect.
6. Submit a test signup and confirm its row in the Sheet. Repeat it: there should
   be one row and the same success response. Confirm withdrawal requests are refused.

For updates, use **Deploy → Manage deployments → Edit → New version → Deploy**
to keep the same URL. Saving the script alone does not update the deployment.
A new deployment has a new URL and requires rebuilding the site with that URL.

The script maintains `Timestamp | Email | Progress`, deduplicates under a script
lock, and silently drops honeypot submissions. New and existing emails receive
identical success responses, so the endpoint does not disclose list membership.
Removals are handled manually in the Sheet after contacting `theskelpr@gmail.com`;
the public endpoint refuses withdrawal because it cannot verify email ownership.

The client posts JSON containing `email` and `trap`, with a `text/plain` content
type. A replacement backend must return JSON containing `ok: true` on success or
`ok: false` with an `error` message. Do not reintroduce duplicate-membership flags,
public deletion or responses containing Sheet data.
