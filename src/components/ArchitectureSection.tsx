import { useEffect, useRef, useState } from 'react'
import { architectureBackend, architectureCopy, architectureDesktopLayout, architectureEdges, architectureMobileLayout, architectureNodes } from '../data/siteData'
import { useNodeDrag } from '../hooks/useNodeDrag'
import { DetailButton } from './Shared'

const NARROW_MAP_QUERY = '(max-width: 700px)'

export function ArchitectureSection({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [activeNode, setActiveNode] = useState('hybrid')
  const [isNarrow, setIsNarrow] = useState(() => window.matchMedia(NARROW_MAP_QUERY).matches)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const query = window.matchMedia(NARROW_MAP_QUERY)
    const onChange = (event: MediaQueryListEvent) => setIsNarrow(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const drag = useNodeDrag(isNarrow ? architectureMobileLayout : architectureDesktopLayout, mapRef)
  const activeArchitecture = architectureNodes.find((node) => node.id === activeNode) ?? architectureNodes[0]

  return (
    <section className="architecture-section content-section" id="architecture">
      <div className="section-kicker">Technical architecture</div>
      <div className="two-column-heading"><h2>Deterministic first.<br /><em>Semantic second.</em></h2><p>Every integration shares one retrieval path. Explore the real components and the graceful fallback hierarchy behind it.</p></div>
      <DetailButton open={open} onClick={onToggle} />
      <div className="architecture-layout">
        <div className="architecture-map" ref={mapRef}>
          <div className="map-label">SHARED RETRIEVAL ENGINE <span className="map-hint">DRAG NODES · THEY KEEP THEIR DISTANCE</span><button type="button" className="map-reset" onClick={drag.reset}>Reset</button></div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="LoCoDex architecture diagram" role="img">
            {architectureEdges.map(([from, to]) => {
              const a = drag.positions[from]
              const b = drag.positions[to]
              return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={from === activeNode || to === activeNode ? 'active-edge' : ''} />
            })}
          </svg>
          {architectureNodes.map((node) => (
            <button
              key={node.id}
              data-drag-node
              className={`architecture-node ${node.group.toLowerCase().replace(/ /g, '-')} ${node.id === activeNode ? 'active' : ''} ${drag.draggingId === node.id ? 'dragging' : ''}`}
              style={{ left: `${drag.positions[node.id].x}%`, top: `${drag.positions[node.id].y}%` }}
              onPointerDown={(event) => drag.onPointerDown(event, node.id)}
              onPointerMove={drag.onPointerMove}
              onPointerUp={drag.onPointerUp}
              onPointerCancel={drag.onPointerCancel}
              onMouseEnter={() => setActiveNode(node.id)}
              onFocus={() => setActiveNode(node.id)}
              onClick={() => setActiveNode(node.id)}
              aria-label={`Inspect ${node.label} (draggable)`}
            >
              <span className="node-pip" />
              <strong>{node.label}</strong>
              <small>{node.meta}</small>
            </button>
          ))}
        </div>
        <div className="architecture-inspector">
          <span className="owner-tag locodex">{activeArchitecture.group.toUpperCase()}</span>
          <h3>{activeArchitecture.label}</h3>
          <p>{architectureCopy(activeArchitecture.id, open ? 'technical' : 'simple')}</p>
          <div className="inspector-detail"><span>BACKEND / FALLBACK</span><code>{architectureBackend(activeArchitecture.id)}</code></div>
        </div>
      </div>
    </section>
  )
}
