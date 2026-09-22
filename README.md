# Skelpr website

The public product website for [skelpr](https://github.com/skelpr-thrive360/skelpr) —
surgical code retrieval for AI agents. Isolated React/Vite app: product copy and benchmark
figures are grounded in the repository's README and `docs/`, never invented.

## Tech stack

- **React 19 + TypeScript** on **Vite**, no other runtime dependencies beyond `lucide-react` (icons) and `react-markdown` + `remark-gfm` (renders the verbatim benchmark answers).
- Plain CSS in `src/styles.css` (design tokens as CSS variables at the top; no CSS framework).
- Static output: `npm run build` produces a fully static `dist/` — host anywhere (Netlify, Vercel, GitHub Pages, S3…).

## Project structure

```
website/
├── index.html                      # Vite entry; SEO meta tags live here
├── public/
│   ├── robots.txt                  # placeholder domain — see "Canonical URL"
│   └── sitemap.xml                 # placeholder domain — see "Canonical URL"
├── src/
│   ├── main.tsx / App.tsx          # bootstrap + section order
│   ├── components/                 # one file per page section
│   │   ├── BenchmarkSection.tsx    # 05 — benchmark table + task detail
│   │   ├── VerbatimAnswers.tsx     # side-by-side verbatim answer panes
│   │   ├── Shared.tsx              # WaitlistForm, Metric, small shared bits
│   │   ├── ThemeToggle.tsx         # light / dark / system control
│   │   ├── PrerequisitesSection.tsx # Docker Desktop + the embedding model, ahead of install
│   │   └── WaitlistInstall.tsx     # waitlist panel + install section + footer
│   ├── data/
│   │   ├── siteData.tsx            # page copy, benchmark metrics, per-task Q&A
│   │   └── benchmarkAnswers.ts     # AUTO-GENERATED verbatim answers (see below)
│   ├── lib/theme.ts                # theme choice + persistence
│   └── lib/waitlist.ts             # waitlist submit/withdraw client + local stub
├── scripts/palette.config.mjs      # surfaces, hue anchors, contrast targets
├── scripts/derive-palette.mjs      # solves the palette into src/styles.css
├── scripts/contrast-audit.mjs      # measures the committed palette
├── scripts/check-links.mjs         # in-page hash + section registry audit
├── scripts/lib/                    # colour maths, palette region reader/writer
├── scripts/extract-benchmark-answers.mjs
├── waitlist-apps-script.gs         # backend for the waitlist (Google Sheet)
└── .env.example                    # VITE_WAITLIST_ENDPOINT documentation
```

## Local development

```bash
cd website
npm install
npm run dev        # dev server
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build locally
```

## Checks

Every check is a plain Node script — no linter, no test runner to install — and all
four run in CI (`.github/workflows/ci.yml`) on every push and pull request:

```bash
npm run check:palette    # the palette in styles.css still matches palette.config.mjs
npm run build            # tsc --build (typecheck) + vite build
npm run check:links      # every in-page #hash resolves, sections and registry agree
npm run audit:contrast   # every token meets its contrast target, accent stays distinct
```

## Motion

Scroll choreography is documented in [MOTION.md](./MOTION.md): the page's six-act
script, the four mechanisms (reversible reveals, scrubbed section rules, hero exit,
figure drift), Lenis smooth scrolling, and the intensity dials. Evidence sections are
deliberately excluded from drift; reduced-motion and no-JS visitors get a fully
rendered, still page.

## Theming

The site ships `light`, `dark` and `system`, chosen from the three-way control in the
header and remembered in `localStorage` (`skelpr-theme`). `system` — the default —
follows `prefers-color-scheme`; a stored choice pins the theme, and a short inline
script in `index.html` applies it before the first paint so the page never flashes the
wrong theme.

One palette table drives both themes. Every token in `src/styles.css` is a
`light-dark(light, dark)` pair between the `generated:start` / `generated:end` markers,
and the switch only moves `color-scheme`, which is also what tells the browser to darken
scrollbars and form controls.

```bash
npm run derive:palette   # solve the palette from scripts/palette.config.mjs
npm run check:palette    # fail if the committed table has drifted from the config
```

`scripts/palette.config.mjs` is the design intent: the surfaces and the hue anchors,
plus the ratio every token has to reach on the worst surface it is painted on — text and
rules alike. A divider targets 1.6:1, and an edge you have to see without looking at it
(control outlines, quote rules, diagram lines) targets 3:1, the WCAG non-text floor. The
architecture map's dot grid is the third kind of non-text mark — a texture, one step
below the dividers at 1.4:1, measured against the panel it is painted on. It was a tint
before, which is a description rather than a budget, and it landed at 1.07:1 in the dark
theme: invisible.
`scripts/derive-palette.mjs` keeps each token's hue and chroma and moves only its OKLab
lightness until it sits exactly at its target, then derives the washes, veils and shadow
tints from the solved tokens. Because the targets are ratios rather than steps, light and
dark reach the same *measured* strength: they used to differ by a third, which is what
made paper read as washed out next to the dark theme. Nothing is hand-tuned: edit the config, re-derive,
and the CSS, its comments and the audit move together. The derived table is committed,
so the site builds without running the generator — `check:palette` keeps the two honest.

## Benchmark answers are generated

The side-by-side verbatim answers in the "05 — Benchmark evidence" section are **not
hand-written** — they are extracted verbatim from the repo's benchmark artifacts:

```bash
npm run extract:answers   # docs/comparisons/COMP_ANTIGRAVITY.md → src/data/benchmarkAnswers.ts
```

`src/data/benchmarkAnswers.ts` is committed, so this only needs re-running when the
benchmark doc changes. The task questions/metrics/verdicts themselves live in
`src/data/siteData.tsx` (`benchmarkQa`), grounded in `tests/benchmarking/constants.py`
and `tests/benchmarking/generate_comparison_doc.py`.

## Waitlist

The waitlist form (in the waitlist section — the hero used to carry a second copy) posts
to the endpoint from the `VITE_WAITLIST_ENDPOINT` env variable (`.env`, see [`.env.example`](./.env.example)).
While it is unset, submissions stay in a local stub (sessionStorage) so the UI can be
tested without a backend. Joining twice shows a "You're already on the list" state with a
withdraw option; withdrawing deletes the row from the Sheet.

### Backend: Google Apps Script → Google Sheet (recommended)

Free with no meaningful cap (Apps Script allows ~20k executions/day), the list lives in a
Sheet you can export to Excel anytime, and the script never exposes the sheet contents.
The backend script is in [`waitlist-apps-script.gs`](./waitlist-apps-script.gs).

Deploy checklist (~10 minutes, one time):

1. Create a Google Sheet, name the tab (or let the script create it) `Waitlist`.
2. In the Sheet: **Extensions → Apps Script**. Delete the sample code.
3. Paste the full contents of `waitlist-apps-script.gs` and save (💾).
4. Click **Deploy → New deployment** → gear icon → **Web app**.
5. Set: *Execute as* → **Me**, *Who has access* → **Anyone**. Click **Deploy**.
   (This setting is the usual culprit for "Network error" on submit — "Only myself"
   redirects anonymous visitors to a Google sign-in page.)
6. Authorize when prompted. Google will show *"Google hasn't verified this app"* — this is
   normal for **any** personal Apps Script. Click **Advanced → Go to … (unsafe) → Allow**.
7. Copy the **Web app URL** (`https://script.google.com/macros/s/AKfycb…/exec`).
8. Paste it into `VITE_WAITLIST_ENDPOINT` in `website/.env` (copy `.env.example` to `.env`).
   The env var is read at build/dev time, so restart `npm run dev` (or rebuild) after changing it.
9. Test: open the `/exec` URL in an **incognito** window → should show
   `{"ok":true,"service":"waitlist"}` with **no sign-in prompt**; then submit an email from
   the site and confirm the row appears with Progress = `Pending`.

Notes:

- **After editing the script you must redeploy — the right way:** **Deploy → Manage
  deployments → ✏️ (pencil) → Version: New version → Deploy**. Saving code in the editor
  alone does NOT update the live deployment.
  - ⚠️ Do **not** use **Deploy → New deployment** for updates — that creates a *second*
    deployment with a *different URL*, while your site keeps calling the original URL
    (which keeps running the old code forever). If you did create a new deployment,
    either copy its URL into `.env` or archive it (Manage deployments → … → Archive)
    and re-edit the original.
  - **Verify what's live:** open the `/exec` URL in a browser. It must show
    `"schema":"progress-v4"`. Anything else (or missing) = old code is still live.
- **The Sheet styles itself.** After the first submission the script applies: a bold
  frozen teal header row, banded data rows, `yyyy-mm-dd hh:mm` timestamps, and
  color-coded Progress chips (amber Pending, blue Reached out, green Success,
  red Declined). The Progress dropdown exists ONLY on rows that have a recorded
  email — never on empty rows. Re-styling runs on every join/withdraw, so deleted
  rows shrink the bands and validation back to the remaining data.
- Columns are `Timestamp | Email | Progress`. A legacy `Source` header is renamed
  automatically; new rows start with Progress = `Pending` and the column carries a
  dropdown (`Pending / Reached out / Success / Declined`) for tracking outreach.
- Submitting an email that's already listed answers `{ok, duplicate}` — the site then
  shows a duplicate state with a **Withdraw** option. Withdrawing posts `action:"withdraw"`
  and deletes the row server-side.
- A hidden honeypot (`trap`) silently drops bots.
- If Google shows a quota/permission error email, re-authorize under Apps Script → ⚙️ → *Check auth*.

### Alternative: Formspree

If you'd rather not touch Google at all, a Formspree form also works with the same
`VITE_WAITLIST_ENDPOINT` variable — but its free tier is only ~50 submissions/month
(Getform and Basin are similar). Paste the form endpoint, e.g.:

```bash
# .env
VITE_WAITLIST_ENDPOINT=https://formspree.io/f/yourFormId
```

Note: with Formspree the `trap` field is simply recorded as form data; honeypot
filtering then has to happen on their dashboard (spam settings).

## Canonical URL

The canonical domain is `https://skelpr.com`, used in three places that have to stay in
sync: the canonical/og/twitter meta tags in `index.html`, `public/sitemap.xml`, and
`public/robots.txt`. If the deployed public domain ever changes, update all three
together (they feed SEO — sitemap submission, social preview crawlers).
