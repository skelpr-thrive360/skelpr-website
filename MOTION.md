# Motion — the page's script

How the site moves, why it moves that way, and where to change it. The code lives
in [`src/hooks/useScrollChoreography.ts`](src/hooks/useScrollChoreography.ts)
(GSAP orchestration) and [`src/lib/anim.ts`](src/lib/anim.ts) (Lenis smooth
scrolling); this page is the intent behind both.

## The rule

The page moves like a document that reacts to the reader — not a deck that plays
at them. Concretely: transform and opacity only, nothing pins, nothing hijacks
the scroll axis, and **every effect runs backwards when the reader scrolls back
up**. Motion is a way of pacing the argument, never a way of hiding a slow
section.

One section is exempt by design: **evidence stands still.** The benchmark table
and the metric grid get no parallax drift. Numbers that move while you read them
are harder to trust, and trust is the product.

## The script

Six acts, in page order. Intensity deliberately tapers: loudest at the hero,
stillest at the call to action.

| Act | Sections | What moves | Why |
|---|---|---|---|
| **1 · Arrival** | Hero, signal strip | Staggered load cascade, then scroll-out: copy lifts ~70px and eases to half opacity while the console drifts at a slower rate | The product introduces itself, then gets out of the way |
| **2 · Tension** | Problem, In the repository | Headings rise in; the comparison figure drifts ±4% across its traversal | Orientation — the reader is shown the gap, not told about it |
| **3 · Mechanism** | What is LoCoDex, Two modes, MCP deep dive | Per-section staggered reveals; the workflow shell drifts | The machine assembling: pieces arrive in order |
| **4 · Evidence** | Benchmark | One calm reveal. No drift, no scrub | Evidence does not perform |
| **5 · Infrastructure** | Architecture, Get started, Plans | Architecture map drifts; install and pricing reveal plainly | The system working, then practical facts |
| **6 · Conversion** | Waitlist, footer | A single quiet reveal; nothing moves near the button | No motion between the reader and the click |

## The four mechanisms

1. **Reversible reveals** — blocks rise 20px and fade in over 0.9s
   (`power3.out`) as they cross the fold line (88% of the viewport), staggered
   70ms per block inside their section, capped at four steps. Leaving back
   through the fold retracts them in 0.35s with no stagger; entering again
   replays the entrance, so returning to the top shows the hero exactly as it
   first arrived.

   **What counts as a block is structural:** the hero's copy children and the
   console, then every direct child of every content section, in document
   order. There is no per-block list to maintain, so a new panel, grid or spec
   row animates the moment it lands in a section — a hand-written list is how a
   block silently ships with no motion.
2. **Scrubbed rules** — the full-bleed dividers between blocks are not
   entrances; they *are* the scroll position, drawn via the `--rule-x` custom
   property (scaleX) as a block's bottom edge crosses from 105% to 88% of the
   viewport. Retracting on scroll-up reads as a rule being un-drawn, not as
   progress lost.
3. **Hero exit** — the first parallax the reader meets: copy and console move at
   different rates across the hero's traversal, both returning fully at the top.
4. **Figure depth** — ±4% `yPercent` drift on the three narrative figures
   (comparison visual, workflow shell, architecture map). It composes with the
   reveal's `y` rather than replacing it, which is why it is `yPercent`.

## Smooth scrolling

Wheel scrolling is eased by **Lenis** (`lib/anim.ts`): it scrolls the real
window — no transform wrapper — so the sticky header, the section spy,
ScrollTrigger and find-in-page all behave natively. Touch scrolling is
deliberately **not** overridden; phones already have their own inertia.

Anchor clicks ride the same easing (`lib/anim.ts` exports the curve; the glide
is started in `components/Shared.tsx`), with duration scaled by distance.

Nested scrollers keep their wheel gesture. Lenis's `prevent` predicate walks up
from the event target and hands the gesture over at the first ancestor that
actually scrolls — so the benchmark table, the verbatim answer panes, the step
strip and code blocks still scroll themselves. It is a structural check, not a
class list, so a new scroller is covered by the CSS that makes it one.

| Dial | Where | Current |
|---|---|---|
| Scroll smoothing duration | `lib/anim.ts` → `SMOOTH_DURATION` | 1.4s, ease-out-expo |
| Anchor glide duration | `components/Shared.tsx` | 0.5–1.4s, distance-scaled |
| Reveal rise / duration / stagger | `useScrollChoreography.ts` dial block | 20px · 0.9s · 70ms×4 |
| Retract duration | same | 0.35s |
| Figure drift | same | ±4% of the figure's height |
| Act wash | same | fade in over the act's first 20%, out over its last 20% |

**Scroll-linked values are always `scrub: true`, never a numeric lag.** A lag
(`scrub: 0.5`) is animated by a GSAP tween, and a tween only advances while the
GSAP ticker is awake — so a lagged rule, wash or drift can sit frozen at a value
that contradicts the scroll position. `scrub: true` writes progress straight from
the scroll update, so a linked value cannot disagree with the position that
produced it, and Lenis is already smoothing the scroll underneath it.

## Guarantees

- **Reduced motion:** the choreography hook returns before touching anything and
  Lenis is never started, so the page renders fully and scrolls exactly as the
  browser ships it.
- **No JS:** nothing is ever hidden by CSS. All initial states are set from a
  layout effect — before first paint — so there is no flash of content that
  ducks away, and a scripting failure leaves a complete page.
- **StrictMode-safe:** everything is created inside one `gsap.context()`, so
  unmount reverts every trigger and inline style.
