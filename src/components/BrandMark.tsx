/**
 * The brand mark: an open frame — the repository — with the located fragment
 * seated in the notch at its lower-right corner, separated by a channel exactly
 * one stroke wide. The open corner is what makes it a cut rather than the
 * box-with-a-square-in-it that every other tool in this category uses.
 *
 * Geometry is a 24-unit grid: 3-unit margin, 18-unit frame, 2-unit stroke,
 * 7-unit fragment flush with the frame's outer silhouette, 2-unit channel.
 * These are the same numbers `scripts/build-brand-assets.py` renders the icons
 * from, so the header and the favicon are one drawing at different sizes.
 *
 * Colour: the frame inherits the current ink and the fragment uses the accent,
 * and both tokens flip with the theme — so this is one mark, not one per theme.
 */
export function BrandMark({ size = 18 }: { size?: number }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {/* Butt caps are load-bearing: the channel is measured from where the ink stops. */}
      <path
        d="M12 20 H4 V4 H20 V12"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
      <rect className="brand-mark-fragment" x={14} y={14} width={7} height={7} />
    </svg>
  )
}
