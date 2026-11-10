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
const MAX_PASSES = 20
const POSITION_EPSILON = 0.0001

type Bounds = { minX: number; maxX: number; minY: number; maxY: number }

function clampPosition(position: MapPosition, bounds: Bounds): MapPosition {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, position.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, position.y)),
  }
}

/**
 * The pitch the map's dot grid is painted at, read off the element rather than
 * passed in. The same token drives the background pattern (see `.architecture-map`),
 * and a second copy of the number is exactly how a snap and a texture drift apart.
 */
function gridPitch(map: HTMLElement | null): number {
  if (!map) return 0
  const value = Number.parseFloat(getComputedStyle(map).getPropertyValue('--grid-pitch'))
  return Number.isFinite(value) && value > 0 ? value : 0
}

/**
 * Nearest dot centre. The pattern is centred in each tile, so a dot sits at
 * pitch/2 + n·pitch; snapping a card's centre there is what makes the grid read as
 * a plane the nodes sit on instead of wallpaper behind them. Without this the two
 * were unrelated — the texture said "grid" and the drag said "freeform".
 */
function snapToGrid(
  position: MapPosition,
  pitch: number,
  rect: { width: number; height: number },
): MapPosition {
  if (pitch <= 0 || rect.width <= 0 || rect.height <= 0) return position
  const axis = (value: number, span: number) => {
    const px = (value / 100) * span
    const nearest = Math.round((px - pitch / 2) / pitch) * pitch + pitch / 2
    return (nearest / span) * 100
  }
  return { x: axis(position.x, rect.width), y: axis(position.y, rect.height) }
}

/**
 * The configured range is a percentage of the map box, but a node half-size is
 * pixels: without subtracting it, a card pinned at the wall hangs off the edge
 * and the map clips it. Bounds are therefore per node, from its measured size.
 */
function clampBoundsFor(
  id: string,
  sizes: Record<string, NodeSize>,
  fallbackSize: NodeSize,
  bounds: Bounds,
  mapWidth: number,
  mapHeight: number,
): Bounds {
  const size = sizes[id] ?? fallbackSize
  const halfW = (size.width / 2 / mapWidth) * 100
  const halfH = (size.height / 2 / mapHeight) * 100
  return {
    minX: Math.max(bounds.minX, halfW),
    maxX: Math.min(bounds.maxX, 100 - halfW),
    minY: Math.max(bounds.minY, halfH),
    maxY: Math.min(bounds.maxY, 100 - halfH),
  }
}

type NodeSize = { width: number; height: number }

/**
 * Measure every node, keyed by id. Sampling a single node is not enough: the
 * layouts place rows at a percentage of the map box, so a card whose meta line
 * wraps to two lines is taller than its neighbours and needs more clearance
 * than whichever card happened to be measured first.
 */
function measureNodes(map: HTMLElement | null): Record<string, NodeSize> {
  const sizes: Record<string, NodeSize> = {}
  if (!map) return sizes
  map.querySelectorAll<HTMLElement>('[data-drag-node]').forEach((node) => {
    const id = node.dataset.dragNodeId
    if (id) sizes[id] = { width: node.offsetWidth, height: node.offsetHeight }
  })
  return sizes
}

// Keeps every pair of nodes at least `gap` px apart. The dragged node (pinnedId)
// never moves; its neighbors absorb the push so the layout settles around the drag.
function resolveOverlaps(
  positions: Record<string, MapPosition>,
  sizes: Record<string, NodeSize>,
  fallbackSize: NodeSize,
  pinnedId: string | null,
  mapWidth: number,
  mapHeight: number,
  optionsGap: number,
  bounds: Bounds,
): Record<string, MapPosition> {
  const next = Object.fromEntries(Object.entries(positions).map(([id, p]) => [id, { ...p }]))
  const ids = Object.keys(next)
  if (mapWidth <= 0 || mapHeight <= 0 || ids.length === 0) return next
  const limits = Object.fromEntries(ids.map((id) => [
    id,
    clampBoundsFor(id, sizes, fallbackSize, bounds, mapWidth, mapHeight),
  ]))
  for (const id of ids) next[id] = clampPosition(next[id], limits[id])

  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    let moved = false
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const idA = ids[i]
        const idB = ids[j]
        const a = next[idA]
        const b = next[idB]
        const sizeA = sizes[idA] ?? fallbackSize
        const sizeB = sizes[idB] ?? fallbackSize
        const minDX = ((sizeA.width + sizeB.width) / 2 + optionsGap) / mapWidth * 100
        const minDY = ((sizeA.height + sizeB.height) / 2 + optionsGap) / mapHeight * 100
        const overlapX = minDX - Math.abs(b.x - a.x)
        const overlapY = minDY - Math.abs(b.y - a.y)
        if (overlapX <= POSITION_EPSILON || overlapY <= POSITION_EPSILON) continue

        // Prefer the shorter push. If a wall blocks it, try the other axis.
        const axes = overlapX <= overlapY ? (['x', 'y'] as const) : (['y', 'x'] as const)
        for (const axis of axes) {
          const overlap = axis === 'x' ? overlapX : overlapY
          const direction = Math.sign(b[axis] - a[axis]) || 1
          const min = axis === 'x' ? 'minX' : 'minY'
          const max = axis === 'x' ? 'maxX' : 'maxY'
          const availableA = direction > 0 ? a[axis] - limits[idA][min] : limits[idA][max] - a[axis]
          const availableB = direction > 0 ? limits[idB][max] - b[axis] : b[axis] - limits[idB][min]
          const roomA = idA === pinnedId ? 0 : availableA
          const roomB = idB === pinnedId ? 0 : availableB
          if (roomA + roomB < overlap - POSITION_EPSILON) continue
          const pushA = Math.min(roomA, Math.max(overlap - roomB, overlap / 2))
          a[axis] -= direction * pushA
          b[axis] += direction * (overlap - pushA)
          moved = true
          break
        }
      }
    }
    if (!moved) break
  }
  return next
}

type DragGesture = {
  id: string
  pointerId: number
  target: HTMLElement
  origin: MapPosition
  start: MapPosition
  mapSize: NodeSize
  sizes: Record<string, NodeSize>
  pitch: number
}

function startingPositions(nodes: DragNode[]): Record<string, MapPosition> {
  return Object.fromEntries(nodes.map(({ id, x, y }) => [id, { x, y }]))
}

/** Snap the dragged card to the grid while the collision solver moves its neighbors. */
export function useNodeDrag(nodes: DragNode[], mapRef: React.RefObject<HTMLElement | null>, options: UseNodeDragOptions = {}) {
  const gap = options.gap ?? DEFAULT_GAP_PX
  const defaultSize = options.defaultSize ?? DEFAULT_NODE_SIZE
  const bounds: Bounds = {
    minX: options.clampX?.[0] ?? DEFAULT_CLAMP_X[0],
    maxX: options.clampX?.[1] ?? DEFAULT_CLAMP_X[1],
    minY: options.clampY?.[0] ?? DEFAULT_CLAMP_Y[0],
    maxY: options.clampY?.[1] ?? DEFAULT_CLAMP_Y[1],
  }
  const [positions, setPositions] = useState(() => startingPositions(nodes))
  const [mapSize, setMapSize] = useState<NodeSize | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragRef = useRef<DragGesture | null>(null)
  const pendingMove = useRef<MapPosition | null>(null)
  const moveFrame = useRef<number | null>(null)

  const clearGesture = () => {
    if (moveFrame.current !== null) window.cancelAnimationFrame(moveFrame.current)
    moveFrame.current = null
    pendingMove.current = null
    const drag = dragRef.current
    dragRef.current = null
    if (drag?.target.hasPointerCapture(drag.pointerId)) {
      drag.target.releasePointerCapture(drag.pointerId)
    }
  }

  // The layout key stays stable while the visitor moves the cards.
  const layoutKey = nodes.map(({ id, x, y }) => `${id}:${x},${y}`).join('|')
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    setPositions(startingPositions(nodes))
    setDraggingId(null)
    const settle = () => {
      const width = map.clientWidth
      const height = map.clientHeight
      if (!width || !height) return
      const drag = dragRef.current
      if (drag?.mapSize.width === width && drag.mapSize.height === height) return
      if (drag) {
        clearGesture()
        setDraggingId(null)
      }
      const sizes = measureNodes(map)
      setMapSize((current) => current?.width === width && current.height === height ? current : { width, height })
      setPositions((current) => resolveOverlaps(current, sizes, defaultSize, null, width, height, gap, bounds))
    }
    let frame: number | null = null
    let disposed = false
    const schedule = () => {
      if (disposed || frame !== null) return
      frame = window.requestAnimationFrame(() => {
        frame = null
        settle()
      })
    }
    settle()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    observer?.observe(map)
    window.addEventListener('resize', schedule)
    document.fonts?.ready.then(schedule).catch(() => {})
    return () => {
      disposed = true
      observer?.disconnect()
      window.removeEventListener('resize', schedule)
      if (frame !== null) window.cancelAnimationFrame(frame)
      clearGesture()
    }
    // Bounds and size options are static at the call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey, mapRef])

  const onPointerDown = (event: React.PointerEvent<HTMLElement>, id: string) => {
    const map = mapRef.current
    const origin = positions[id]
    if (event.button !== 0 || dragRef.current || !map || !origin) return
    const width = map.clientWidth
    const height = map.clientHeight
    if (!width || !height) return

    const target = event.currentTarget
    try {
      target.setPointerCapture(event.pointerId)
    } catch {
      return
    }
    event.preventDefault()
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      target,
      origin,
      start: { x: event.clientX, y: event.clientY },
      mapSize: { width, height },
      sizes: measureNodes(map),
      pitch: gridPitch(map),
    }
    setDraggingId(id)
  }

  const applyPendingMove = () => {
    const drag = dragRef.current
    const point = pendingMove.current
    pendingMove.current = null
    if (!drag || !point) return
    const { width, height } = drag.mapSize
    const raw = clampPosition(
      snapToGrid(
        {
          x: drag.origin.x + ((point.x - drag.start.x) / width) * 100,
          y: drag.origin.y + ((point.y - drag.start.y) / height) * 100,
        },
        drag.pitch,
        drag.mapSize,
      ),
      clampBoundsFor(drag.id, drag.sizes, defaultSize, bounds, width, height),
    )
    setPositions((current) => {
      const pinned = current[drag.id]
      if (pinned?.x === raw.x && pinned.y === raw.y) return current
      return resolveOverlaps({ ...current, [drag.id]: raw }, drag.sizes, defaultSize, drag.id, width, height, gap, bounds)
    })
  }

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    pendingMove.current = { x: event.clientX, y: event.clientY }
    if (moveFrame.current !== null) return
    moveFrame.current = window.requestAnimationFrame(() => {
      moveFrame.current = null
      applyPendingMove()
    })
  }

  const finishDrag = () => {
    clearGesture()
    setDraggingId(null)
  }

  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    applyPendingMove()
    finishDrag()
  }

  const onPointerCancel = (event: React.PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    finishDrag()
  }

  const reset = () => {
    finishDrag()
    const initial = startingPositions(nodes)
    const map = mapRef.current
    if (map) {
      setPositions(resolveOverlaps(initial, measureNodes(map), defaultSize, null, map.clientWidth, map.clientHeight, gap, bounds))
    } else {
      setPositions(initial)
    }
  }

  return { positions, mapSize, draggingId, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, reset }
}
