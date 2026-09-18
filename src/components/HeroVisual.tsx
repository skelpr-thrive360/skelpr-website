import { useEffect, useState } from 'react'
import { heroIcons, heroStages } from '../data/siteData'

// Node centers in SVG viewBox units — the SVG stretches to the canvas, so these
// map 1:1 onto the % positions and every connector really touches its node.
// Two layouts: a diamond for desktop (1 left → 2 top → 3 right → 4 bottom),
// a compact zigzag that fits phones.
const HERO_LAYOUTS = {
  desktop: {
    nodes: [
      { x: 85, y: 200 },
      { x: 300, y: 70 },
      { x: 505, y: 215 },
      { x: 300, y: 322 },
    ],
    paths: [
      'M85 200 C190 200 195 70 300 70',
      'M300 70 C405 70 405 215 505 215',
      'M505 215 C400 215 395 322 300 322',
    ],
  },
  mobile: {
    nodes: [
      { x: 105, y: 75 },
      { x: 330, y: 150 },
      { x: 180, y: 260 },
      { x: 450, y: 330 },
    ],
    paths: [
      'M105 75 C220 75 230 150 330 150',
      'M330 150 C280 200 240 260 180 260',
      'M180 260 C300 260 360 330 450 330',
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
  const [paused, setPaused] = useState(false)
  const compact = useCompactLayout()
  const layout = compact ? HERO_LAYOUTS.mobile : HERO_LAYOUTS.desktop
  const currentHero = heroStages[stage]

  // Walkthrough auto-advances until the visitor hovers or focuses a stage.
  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(() => {
      setStage((current) => (current + 1) % heroStages.length)
    }, 2800)
    return () => window.clearInterval(timer)
  }, [paused])

  return (
    <div className="hero-visual" aria-label="Interactive MCP Agent workflow walkthrough">
      <div className="visual-label">
        <span>MCP AGENT / INTEGRATION</span>
        <span className="live-label">
          <i /> {paused ? 'HOVER TO EXPLORE' : 'LIVE PATH'}
        </span>
      </div>
      <div className="hero-canvas">
        <svg
          className="hero-lines"
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
                setPaused(true)
              }}
              onMouseLeave={() => setPaused(false)}
              onFocus={() => {
                setStage(index)
                setPaused(true)
              }}
              onBlur={() => setPaused(false)}
              onClick={() => setStage(index)}
              aria-label={`Step ${index + 1}: ${stageItem.label}`}
              aria-pressed={stage === index}
            >
              <span className="hero-node-inner">
                <span
                  className={`node-icon ${stageItem.id === 'mcp' ? 'blue' : stageItem.id === 'retrieval' ? 'green' : stageItem.id === 'result' ? 'amber' : ''}`}
                >
                  <Icon size={16} />
                </span>
                <small>
                  STEP 0{index + 1} · {stageItem.label.toUpperCase()}
                </small>
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
