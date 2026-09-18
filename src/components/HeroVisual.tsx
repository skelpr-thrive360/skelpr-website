import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
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
// 4 bottom) and a zigzag for phones (right edge → left edge hops).
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
    nodes: [
      { x: 105, y: 76 },
      { x: 330, y: 150 },
      { x: 180, y: 260 },
      { x: 450, y: 324 },
    ],
    links: [
      { from: 0, fromEdge: 'right', to: 1, toEdge: 'left' },
      { from: 1, fromEdge: 'left', to: 2, toEdge: 'right' },
      { from: 2, fromEdge: 'right', to: 3, toEdge: 'left' },
    ],
  },
}

function useCompactLayout() {
  const query = '(max-width: 700px)'
  const [compact, setCompact] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setCompact(event.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return compact
}

// The canvas is measured rather than assumed: the cards are a fixed size but the
// canvas is fluid, and a connector has to meet a card exactly at every width.
// One ResizeObserver covers both the canvas box and the card box.
type Metrics = { w: number; h: number; cw: number; ch: number }

function useCanvasMetrics(ref: RefObject<HTMLDivElement | null>) {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  useLayoutEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const measure = () => {
      const card = canvas.querySelector('.hero-node')
      if (!card) return
      const canvasBox = canvas.getBoundingClientRect()
      const cardBox = card.getBoundingClientRect()
      setMetrics({
        w: canvasBox.width,
        h: canvasBox.height,
        cw: cardBox.width,
        ch: cardBox.height,
      })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(canvas)
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

// One cubic per connector: out along the source normal, in along the target
// normal. Perpendicular normals give a quarter turn; opposite normals (the phone
// zigzag) give an S-curve. The pull is capped by the shorter axis, so a connector
// can never overshoot its own endpoints.
function linkPath(from: EdgeAnchor, to: EdgeAnchor) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const pull = Math.min(Math.abs(dx), Math.abs(dy)) * 0.55
  const c1 = { x: from.x + from.nx * pull, y: from.y + from.ny * pull }
  const c2 = { x: to.x - to.nx * pull, y: to.y - to.ny * pull }
  const round = (value: number) => Math.round(value * 10) / 10
  return `M${round(from.x)} ${round(from.y)} C${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(to.x)} ${round(to.y)}`
}

export function HeroVisual() {
  const [stage, setStage] = useState(0)
  const [engaged, setEngaged] = useState(false)
  const [drawn, setDrawn] = useState(false)
  const compact = useCompactLayout()
  const canvasRef = useRef<HTMLDivElement>(null)
  const metrics = useCanvasMetrics(canvasRef)
  const layout = compact ? HERO_LAYOUTS.mobile : HERO_LAYOUTS.desktop
  const currentHero = heroStages[stage]

  // Rebuilt whenever the canvas or the cards change size, so the curves stay
  // glued to the edge midpoints at any viewport.
  const paths = useMemo(() => {
    if (!metrics) return []
    const half = { w: metrics.cw / 2, h: metrics.ch / 2 }
    const centreOf = (index: number) => ({
      x: (layout.nodes[index].x / 600) * metrics.w,
      y: (layout.nodes[index].y / 400) * metrics.h,
    })
    return layout.links.map((link) =>
      linkPath(
        edgeAnchor(centreOf(link.from), link.fromEdge, half),
        edgeAnchor(centreOf(link.to), link.toEdge, half),
      ),
    )
  }, [layout, metrics])

  // The walkthrough is visitor-driven: the connectors draw once, then the stage
  // follows hover, focus and click. There is no autoplay carousel.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setDrawn(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

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
          className={drawn ? 'hero-lines is-drawn' : 'hero-lines'}
          viewBox={`0 0 ${metrics?.w ?? 600} ${metrics?.h ?? 400}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Agent to retrieval to cited context path"
        >
          {paths.map((d, index) => (
            <path
              key={d}
              d={d}
              className={stage >= index + 1 ? '' : 'muted-path'}
              vectorEffect="non-scaling-stroke"
              style={{ transitionDelay: `${index * 120}ms` }}
            />
          ))}
        </svg>
        {heroStages.map((stageItem, index) => {
          const Icon = heroIcons[stageItem.id]
          const point = layout.nodes[index]
          return (
            <button
              key={stageItem.id}
              type="button"
              className={`hero-node ${stageItem.className} ${stage === index ? 'active' : ''} ${stage > index ? 'done' : ''}`}
              style={{ left: `${point.x / 6}%`, top: `${point.y / 4}%` }}
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
