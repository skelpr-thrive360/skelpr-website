# Motion

Repository evidence should stay still while someone reads it. Content is visible
on first render and stays visible when scrolling back up.

## Current behavior

- Wheel and touch scrolling use the browser. No scroll interceptor runs.
- The hero frame fades in. Four step cards slide in from the upper left,
  followed by the trace panel and the dashed connectors. Browsers with
  scroll-driven animation support drift the frame upward as it leaves view.
- The comparison, workflow, and map figures make one short entrance when visible.
- Dragging a map card moves nearby cards aside. Pointer updates are batched
  to one per frame, with geometry measured before the drag.
- The header reading indicator follows the document's scroll position without a
  tween. A passive listener schedules at most one update per animation frame.
- The hero diagram highlights steps on hover, focus or click. CSS animates the
  connector dashes and trace cursor while the diagram is visible. Reduced
  motion shows the assembled panel without animations.
- Tabs, previous/next controls and answer expansion respond to user input.
- Shared detail panels fade and slide on toggle in browsers that support
  display transitions. Reduced motion opens and closes them immediately.
- Anchor links clear the sticky header. Reduced-motion visitors jump directly;
  other visitors use the browser's smooth anchor scrolling.

## Files

| File | Responsibility |
|---|---|
| `src/hooks/useScrollChoreography.ts` | Reading indicator and figure entrances |
| `src/hooks/useNodeDrag.ts` | Snap, spacing, and pointer tracking for the workflow map |
| `src/components/Shared.tsx` | Anchor positioning and detail panels |
| `src/styles.css` | Hover, focus and reduced-motion rules |

The reading indicator removes its listeners and observer on unmount. It does not
hide content or change layout. Static section rules and backgrounds use their CSS
defaults, so their visibility never depends on JavaScript.

Check keyboard navigation, nested table/code scrolling, expanded answer panes and
reduced-motion behavior when changing these controls.
