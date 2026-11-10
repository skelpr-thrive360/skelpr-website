import { useRef, useState, useSyncExternalStore } from 'react'
import { workflowSteps } from '../data/siteData'
import { useNodeDrag } from '../hooks/useNodeDrag'

const NARROW_MAP_QUERY = '(max-width: 700px)'
const desktopLayout = [
  [20, 30], [50, 30], [80, 30],
  [80, 72], [50, 72], [20, 72],
]
const mobileLayout = [
  [25, 28], [75, 28], [75, 54],
  [25, 54], [25, 80], [75, 80],
]

function withStepIds(layout: number[][]) {
  return workflowSteps.map(({ id }, index) => ({
    id,
    x: layout[index][0],
    y: layout[index][1],
  }))
}

const desktopNodes = withStepIds(desktopLayout)
const mobileNodes = withStepIds(mobileLayout)
const dragBounds = { clampY: [23, 92] as const }

function subscribeToMapWidth(onChange: () => void) {
  const query = window.matchMedia(NARROW_MAP_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export function WorkflowMap() {
  const [active, setActive] = useState(0)
  const narrow = useSyncExternalStore(
    subscribeToMapWidth,
    () => window.matchMedia(NARROW_MAP_QUERY).matches,
    () => false,
  )
  const mapRef = useRef<HTMLDivElement>(null)
  const drag = useNodeDrag(narrow ? mobileNodes : desktopNodes, mapRef, dragBounds)
  const step = workflowSteps[active]

  return (
    <section className="content-section" id="architecture">
      <div className="two-column-heading">
        <div>
          <div className="section-kicker">Interactive diagram</div>
          <h2>Explore the workflow map</h2>
        </div>
        <p>Drag the cards to rearrange the map. Select a step to see what happens there.</p>
      </div>
      <div className="architecture-layout">
        <div className="architecture-map" ref={mapRef}>
          <div className="map-label">
            MCP workflow
            <span className="map-hint">Drag to rearrange</span>
            <button type="button" className="map-reset" onClick={drag.reset}>Reset</button>
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {workflowSteps.slice(1).map((item, index) => {
              const from = drag.positions[workflowSteps[index].id]
              const to = drag.positions[item.id]
              return <line key={item.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={active === index || active === index + 1 ? 'active-edge' : undefined} />
            })}
          </svg>
          {workflowSteps.map((item, index) => {
            const { x, y } = drag.positions[item.id]
            const size = drag.mapSize
            const style = size
              ? { left: 0, top: 0, translate: `${x * size.width / 100}px ${y * size.height / 100}px` }
              : { left: `${x}%`, top: `${y}%` }
            return (
              <button
                key={item.id}
                type="button"
                data-drag-node
                data-drag-node-id={item.id}
                className={`architecture-node ${active === index ? 'active' : ''} ${drag.draggingId === item.id ? 'dragging' : ''}`}
                style={style}
                onPointerDown={(event) => {
                  if (event.button === 0) setActive(index)
                  drag.onPointerDown(event, item.id)
                }}
                onPointerMove={drag.onPointerMove}
                onPointerUp={drag.onPointerUp}
                onPointerCancel={drag.onPointerCancel}
                onLostPointerCapture={drag.onPointerCancel}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                aria-pressed={active === index}
              >
                <span className="node-pip" aria-hidden="true" />
                <strong>{item.label}</strong>
                <small>{item.owner === 'agent' ? 'Your agent' : 'Skelpr'}</small>
              </button>
            )
          })}
        </div>
        <div className="architecture-inspector">
          <span className={`owner-tag ${step.owner}`}>{step.owner === 'agent' ? 'Your coding agent' : 'Skelpr'}</span>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
          <div className="inspector-detail">
            <span>Example</span>
            <code>{step.example}</code>
          </div>
        </div>
      </div>
    </section>
  )
}
