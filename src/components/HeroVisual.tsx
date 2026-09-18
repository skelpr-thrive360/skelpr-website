import { useEffect, useState } from 'react'
import { heroIcons, heroStages } from '../data/siteData'

// Node centers in SVG viewBox units — the SVG stretches to the canvas, so these
// map 1:1 onto the % positions and every connector really touches its node.
// Two layouts: a diamond for desktop (1 left → 2 top → 3 right → 4 bottom),
// a compact zigzag that fits phones.
const HERO_LAYOUTS = {
  desktop: {
    nodes: [
      { x: 99, y: 200 },
      { x: 300, y: 79 },
      { x: 501, y: 200 },
      { x: 300, y: 321 },
    ],
    paths: [
      'M99 200 C190 200 195 79 300 79',
      'M300 79 C405 79 405 200 501 200',
      'M501 200 C395 200 395 321 300 321',
    ],
  },
  mobile: {
    nodes: [
      { x: 105, y: 76 },
      { x: 330, y: 150 },
      { x: 180, y: 260 },
      { x: 450, y: 324 },
    ],
    paths: [
      'M105 76 C220 76 230 150 330 150',
      'M330 150 C280 200 240 260 180 260',
      'M180 260 C300 260 360 324 450 324',
    ],
  },
} as const

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

export function HeroVisual() {
  const [stage, setStage] = useState(0)
  const [engaged, setEngaged] = useState(false)
  const [drawn, setDrawn] = useState(false)
  const compact = useCompactLayout()
  const layout = compact ? HERO_LAYOUTS.mobile : HERO_LAYOUTS.desktop
  const currentHero = heroStages[stage]

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
      <div className="hero-canvas">
        <svg
          className={drawn ? 'hero-lines is-drawn' : 'hero-lines'}
          viewBox="0 0 600 400"
          preserveAspectRatio="none"
          role="img"
          aria-label="Agent to retrieval to cited context path"
        >
          {layout.paths.map((d, index) => (
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
