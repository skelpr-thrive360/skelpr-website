import { useEffect, useRef, useState } from 'react'

export type MapPosition = { x: number; y: number }
export type DragNode = { id: string; x: number; y: number }

export type UseNodeDragOptions = {
  /** Minimum pixel gap kept between nodes. */
  gap?: number
  /** Fallback node size used before the DOM can be measured. */
  defaultSize?: { width: number; height: number }
  /** Allowed center range in percent of the map box. */
  clampX?: readonly [number, number]
  clampY?: readonly [number, number]
}

const DEFAULT_GAP_PX = 26
const DEFAULT_NODE_SIZE = { width: 125, height: 62 }
const DEFAULT_CLAMP_X: readonly [number, number] = [10, 90]
const DEFAULT_CLAMP_Y: readonly [number, number] = [14, 93]
const MAX_PASSES = 120

type Bounds = { minX: number; maxX: number; minY: number; maxY: number }

function clampPosition(position: MapPosition, bounds: Bounds): MapPosition {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, position.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, position.y)),
  }
}

// Keeps every pair of nodes at least `gap` px apart. The dragged node (pinnedId)
// never moves; its neighbors absorb the push so the layout settles around the drag.
function resolveOverlaps(
  positions: Record<string, MapPosition>,
  pinnedId: string | null,
  mapWidth: number,
  mapHeight: number,
  optionsGap: number,
  optionsSize: { width: number; height: number },
  bounds: Bounds,
  pinnedSize?: { width: number; height: number },
): Record<string, MapPosition> {
  const next = Object.fromEntries(Object.entries(positions).map(([id, p]) => [id, { ...p }]))
  const ids = Object.keys(next)
  if (mapWidth <= 0 || mapHeight <= 0 || ids.length === 0) return next
  const nodeWidth = pinnedSize?.width ?? optionsSize.width
  const nodeHeight = pinnedSize?.height ?? optionsSize.height
  const minDX = ((nodeWidth + optionsGap) / mapWidth) * 100
  const minDY = ((nodeHeight + optionsGap) / mapHeight) * 100
  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    let moved = false
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const a = next[ids[i]]
        const b = next[ids[j]]
        const dx = b.x - a.x
        const dy = b.y - a.y
        if (Math.abs(dx) >= minDX || Math.abs(dy) >= minDY) continue
        const pinA = ids[i] === pinnedId
        const pinB = ids[j] === pinnedId
        const push = pinA || pinB ? 1 : 0.5
        const overlapX = minDX - Math.abs(dx)
        const overlapY = minDY - Math.abs(dy)
        // Push along the axis of least penetration so nodes slide along walls and
        // wrap into free rows when a full row cannot fit at the current width.
        const axis = overlapX <= overlapY ? 'x' : 'y'
        const overlap = axis === 'x' ? overlapX : overlapY
        // `|| 1` breaks exact ties (both nodes clamped to the same wall coordinate),
        // where Math.sign(0) would zero the push and stall the solver.
        const direction = (axis === 'x' ? Math.sign(dx) : Math.sign(dy)) || 1
        if (axis === 'x') {
          if (!pinA) a.x -= overlap * push * direction
          if (!pinB) b.x += overlap * push * direction
        } else {
          if (!pinA) a.y -= overlap * push * direction
          if (!pinB) b.y += overlap * push * direction
        }
        moved = true
      }
    }
    // Clamp every pass: wall clamping can itself create overlaps, and the next
    // pass must see (and fix) them.
    ids.forEach((id) => {
      next[id] = clampPosition(next[id], bounds)
    })
    if (!moved) break
  }
  return next
}

/**
 * Draggable node positions with keep-away collision resolution. Nodes are placed by
 * percentage; the dragged node follows the pointer while neighbors are pushed aside
 * so a minimum pixel gap always holds. Also settles overlaps on mount and resize.
 */
export function useNodeDrag(nodes: DragNode[], mapRef: React.RefObject<HTMLElement | null>, options: UseNodeDragOptions = {}) {
  const initialRef = useRef<DragNode[]>(nodes)
  const gap = options.gap ?? DEFAULT_GAP_PX
  const defaultSize = options.defaultSize ?? DEFAULT_NODE_SIZE
  const bounds: Bounds = {
    minX: options.clampX?.[0] ?? DEFAULT_CLAMP_X[0],
    maxX: options.clampX?.[1] ?? DEFAULT_CLAMP_X[1],
    minY: options.clampY?.[0] ?? DEFAULT_CLAMP_Y[0],
    maxY: options.clampY?.[1] ?? DEFAULT_CLAMP_Y[1],
  }
  const [positions, setPositions] = useState<Record<string, MapPosition>>(() =>
    Object.fromEntries(nodes.map((node) => [node.id, { x: node.x, y: node.y }])),
  )
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // Re-layout when the caller swaps arrangements (e.g. desktop ↔ mobile layouts).
  const layoutKey = nodes.map((node) => `${node.id}:${node.x},${node.y}`).join('|')
  const layoutKeyRef = useRef(layoutKey)
  useEffect(() => {
    if (layoutKeyRef.current === layoutKey) return
    layoutKeyRef.current = layoutKey
    initialRef.current = nodes
    setPositions(Object.fromEntries(nodes.map((node) => [node.id, { x: node.x, y: node.y }])))
    // nodes is derived from layoutKey; the string key is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey])
  const dragRef = useRef<{ id: string; pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null)

  // Nudge any overlapping nodes apart on mount/resize so the minimum gap always
  // holds at rest too; already-separated nodes (e.g. after a custom drag) stay put.
  useEffect(() => {
    const settle = () => {
      const map = mapRef.current
      if (!map) return
      const rect = map.getBoundingClientRect()
      const sample = map.querySelector<HTMLElement>('[data-drag-node]')
      setPositions((current) =>
        resolveOverlaps(
          current,
          null,
          rect.width,
          rect.height,
          gap,
          defaultSize,
          bounds,
          sample ? { width: sample.offsetWidth, height: sample.offsetHeight } : undefined,
        ),
      )
    }
    settle()
    window.addEventListener('resize', settle)
    return () => window.removeEventListener('resize', settle)
    // Bounds/size options are static per call site; run only on mount/resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onPointerDown = (event: React.PointerEvent<HTMLElement>, id: string) => {
    if (event.button !== 0) return
    event.preventDefault()
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture is a nicety; drag tracking below does not depend on it.
    }
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: positions[id].x,
      baseY: positions[id].y,
    }
    setDraggingId(id)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    const rect = mapRef.current?.getBoundingClientRect()
    if (!drag || !rect || drag.pointerId !== event.pointerId) return
    const raw = clampPosition(
      {
        x: drag.baseX + ((event.clientX - drag.startX) / rect.width) * 100,
        y: drag.baseY + ((event.clientY - drag.startY) / rect.height) * 100,
      },
      bounds,
    )
    // React nulls event.currentTarget after dispatch, so measure the node now —
    // reading it inside the state updater would crash on the first move.
    const draggedSize = { width: event.currentTarget.offsetWidth, height: event.currentTarget.offsetHeight }
    setPositions((current) => resolveOverlaps({ ...current, [drag.id]: raw }, drag.id, rect.width, rect.height, gap, defaultSize, bounds, draggedSize))
  }

  const endDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setDraggingId(null)
  }

  const reset = () => {
    setPositions(Object.fromEntries(initialRef.current.map((node) => [node.id, { x: node.x, y: node.y }])))
  }

  return { positions, draggingId, onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, reset }
}
