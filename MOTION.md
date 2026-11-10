# Motion

Repository evidence should stay still while someone reads it. Content is visible
on first render and stays visible when scrolling back up.

## Current behavior

- Wheel and touch scrolling use the browser. No scroll interceptor runs.
- No scroll-triggered fades, parallax, card fly-ins or animated section backgrounds.
- The header reading indicator follows the document's scroll position without a
  tween. A passive listener schedules at most one update per animation frame.
- The hero diagram highlights steps on hover, focus or click. Its connectors
  animate unless reduced motion is enabled.
- Tabs, previous/next controls and answer expansion respond to user input.
- Shared detail panels use a short height transition. With reduced motion enabled,
  they open and close immediately.
- Anchor links clear the sticky header. Reduced-motion visitors jump directly;
  other visitors use the browser's smooth anchor scrolling.

## Files

| File | Responsibility |
|---|---|
| `src/hooks/useScrollChoreography.ts` | Reading indicator; recalculates after viewport or content size changes |
| `src/lib/anim.ts` | GSAP registration for user-triggered controls |
| `src/components/Shared.tsx` | Anchor positioning and detail-panel transitions |
| `src/styles.css` | Hover, focus and reduced-motion rules |

The reading indicator removes its listeners and observer on unmount. It does not
hide content or change layout. Static section rules and backgrounds use their CSS
defaults, so their visibility never depends on JavaScript.

Check keyboard navigation, nested table/code scrolling, expanded answer panes and
reduced-motion behavior when changing these controls.
