import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from 'react'
import { heroIcons, heroStages } from '../data/siteData'

// Node centres in viewBox units (x/6 and y/4 give the % position of the card
// centre), plus the connectors between them.
//
// A connector leaves the middle of the source card's edge that faces the target,
// and arrives at the middle of the target's edge that faces the source, with both
// tangents perpendicular to their own edge. That is what makes the curve read as
// attached to a card instead of passing behind it.
//
// Two layouts: a clockwise diamond on desktop (1 left → 2 top → 3 right →
// 4 bottom) and a reading-order 2×2 on phones —
//
//     1  2
//     3  4
//
// chained 1→2, 2→3, 3→4. The phone layout used to be a diagonal cascade, which
// read as a scatter rather than a sequence: four cards stepping down and to the
// right left no row to scan and made the order a guess. Two rows of two are the
// order, stated.
type Edge = 'top' | 'right' | 'bottom' | 'left'
type Link = { from: number; fromEdge: Edge; to: number; toEdge: Edge }
type Layout = {
  nodes: readonly { x: number; y: number }[]
  links: readonly Link[]
}

const HERO_LAYOUTS: { desktop: Layout; mobile: Layout } = {
  desktop: {
    nodes: [
      { x: 99, y: 200 },
      { x: 300, y: 79 },
      { x: 501, y: 200 },
      { x: 300, y: 321 },
    ],
    links: [
      { from: 0, fromEdge: 'top', to: 1, toEdge: 'left' },
      { from: 1, fromEdge: 'right', to: 2, toEdge: 'top' },
      { from: 2, fromEdge: 'bottom', to: 3, toEdge: 'right' },
    ],
  },
  mobile: {
    // 25% / 75% of the canvas in both axes: two columns and two rows, each card a
    // quarter of the box from the edges, so the figure reads left-to-right then
    // down — the same order the step numbering claims.
    nodes: [
      { x: 150, y: 100 },
      { x: 450, y: 100 },
      { x: 150, y: 300 },
      { x: 450, y: 300 },
    ],
    links: [
      { from: 0, fromEdge: 'right', to: 1, toEdge: 'left' },
      { from: 1, fromEdge: 'bottom', to: 2, toEdge: 'top' },
      { from: 2, fromEdge: 'right', to: 3, toEdge: 'left' },
    ],
  },
}

function useCompactLayout() {
  const query = '(max-width: 700px)'
  // A store, not useState: this is the one value that differs between the server
  // render and the browser's. The server snapshot is the desktop layout; the first
  // client read corrects it before paint, so no mismatch — a phone still gets its
  // 2×2 grid on frame one.
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

// The canvas is measured rather than assumed: the cards are a fixed size but the
// canvas is fluid, and a connector has to meet a card exactly at every width.
// One ResizeObserver covers both the canvas box and the card box.
type Metrics = { w: number; h: number; cw: number; ch: number }

function useCanvasMetrics(ref: RefObject<HTMLDivElement | null>) {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  useEffect(() => {
    const canvas = ref.current
    const card = canvas?.querySelector<HTMLElement>('.hero-node')
    if (!canvas || !card) return
    const measure = () => {
      setMetrics({ w: canvas.clientWidth, h: canvas.clientHeight, cw: card.offsetWidth, ch: card.offsetHeight })
    }
    if (typeof ResizeObserver === 'undefined') {
      measure()
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(canvas)
    observer.observe(card)
    return () => observer.disconnect()
  }, [ref])
  return metrics
}

// The middle of one card edge, plus the outward normal: the direction a
// connector leaves along, and (reversed) the direction it arrives along.
function edgeAnchor(centre: { x: number; y: number }, edge: Edge, half: { w: number; h: number }) {
  if (edge === 'top') return { x: centre.x, y: centre.y - half.h, nx: 0, ny: -1 }
  if (edge === 'bottom') return { x: centre.x, y: centre.y + half.h, nx: 0, ny: 1 }
  if (edge === 'left') return { x: centre.x - half.w, y: centre.y, nx: -1, ny: 0 }
  return { x: centre.x + half.w, y: centre.y, nx: 1, ny: 0 }
}

type EdgeAnchor = ReturnType<typeof edgeAnchor>

// One cubic per connector: out along the source's outward normal, and in *against*
// the target's — both control points sit outside the card they belong to, so the
// curve meets an edge instead of travelling through the card to reach it. (The
// target's was on the wrong side of that edge, which is invisible on a shallow
// hop and obvious on a straight one: the line dived under the card it was
// supposed to arrive at.) Perpendicular normals give a quarter turn; opposing ones
// give an S-curve. The pull is capped by the shorter axis, so a connector can
// never overshoot its own endpoints.
function linkCurve(from: EdgeAnchor, to: EdgeAnchor) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const pull = Math.min(Math.abs(dx), Math.abs(dy)) * 0.55
  const c1 = { x: from.x + from.nx * pull, y: from.y + from.ny * pull }
  const c2 = { x: to.x + to.nx * pull, y: to.y + to.ny * pull }
  const round = (value: number) => Math.round(value * 10) / 10
  return `M${round(from.x)} ${round(from.y)} C${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(to.x)} ${round(to.y)}`
}

function useHeroMotion(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const canvas = ref.current
    const hero = canvas?.parentElement
    if (!canvas || !hero) return

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let inView = typeof IntersectionObserver === 'undefined'
    const sync = () => {
      const playing = inView && !preference.matches && !document.hidden
      hero.toggleAttribute('data-motion', playing)
      if (playing && !hero.hasAttribute('data-arrived')) hero.setAttribute('data-arrived', '')
    }
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      sync()
    })
    observer?.observe(hero)
    preference.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => {
      observer?.disconnect()
      preference.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
      hero.removeAttribute('data-motion')
    }
  }, [ref])
}

export function HeroVisual() {
  const [stage, setStage] = useState(0)
  const [engaged, setEngaged] = useState(false)
  const compact = useCompactLayout()
  const canvasRef = useRef<HTMLDivElement>(null)
  const metrics = useCanvasMetrics(canvasRef)
  const layout = compact ? HERO_LAYOUTS.mobile : HERO_LAYOUTS.desktop
  const currentHero = heroStages[stage]

  // Rebuilt whenever the canvas or the cards change size, so the curves stay
  // glued to the edge midpoints at any viewport.
  const curves = useMemo(() => {
    if (!metrics) return []
    const half = { w: metrics.cw / 2, h: metrics.ch / 2 }
    const centreOf = (index: number) => ({
      x: (layout.nodes[index].x / 600) * metrics.w,
      y: (layout.nodes[index].y / 400) * metrics.h,
    })
    return layout.links.map((link) =>
      linkCurve(
        edgeAnchor(centreOf(link.from), link.fromEdge, half),
        edgeAnchor(centreOf(link.to), link.toEdge, half),
      ),
    )
  }, [layout, metrics])
  useHeroMotion(canvasRef)

  return (
    <div className="hero-visual" aria-label="Interactive MCP Agent workflow walkthrough">
      <div className="visual-label">
        <span>MCP AGENT / INTEGRATION</span>
        <span className="live-label">
          <i /> {engaged ? 'EXPLORING' : 'HOVER OR CLICK A STEP'}
        </span>
      </div>
      <div className="hero-canvas" ref={canvasRef}>
        <svg
          className="hero-lines"
          viewBox={`0 0 ${metrics?.w ?? 600} ${metrics?.h ?? 400}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Agent to retrieval to cited context path"
        >
          {curves.map((path, index) => (
            <path
              key={index}
              d={path}
              className={stage >= index + 1 ? '' : 'muted-path'}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {heroStages.map((stageItem, index) => {
          const Icon = heroIcons[stageItem.id]
          return (
            <button
              key={stageItem.id}
              type="button"
              className={`hero-node ${stageItem.className} ${stage === index ? 'active' : ''} ${stage > index ? 'done' : ''}`}
              onMouseEnter={() => {
                setStage(index)
                setEngaged(true)
              }}
              onMouseLeave={() => setEngaged(false)}
              onFocus={() => {
                setStage(index)
                setEngaged(true)
              }}
              onBlur={() => setEngaged(false)}
              onClick={() => {
                setStage(index)
                setEngaged(true)
              }}
              aria-label={`Step ${index + 1}: ${stageItem.label}`}
              aria-pressed={stage === index}
            >
              <span className="hero-node-inner">
                <span
                  className={`node-icon ${stageItem.id === 'mcp' ? 'blue' : stageItem.id === 'retrieval' ? 'green' : stageItem.id === 'result' ? 'amber' : ''}`}
                >
                  <Icon size={16} />
                </span>
                <small>STEP 0{index + 1}</small>
                <strong>{stageItem.label}</strong>
              </span>
            </button>
          )
        })}
      </div>
      <div className="hero-console" aria-live="polite">
        <div className="console-top">
          <span>hero.trace</span>
          <span>{String(stage + 1).padStart(2, '0')} / 04</span>
        </div>
        <div className="console-body">
          <span className="terminal-prompt">$</span>
          <strong>{currentHero.code}</strong>
          <span className="terminal-cursor" />
        </div>
        <div className="console-note">{currentHero.detail}</div>
      </div>
    </div>
  )
}
