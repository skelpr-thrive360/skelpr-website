/**
 * The brand mark, in the header and the footer.
 *
 * The vendor logo is a raster, not a drawing, so it cannot simply be a token —
 * but it has the tokens' problem: the light file's near-black node sinks into the
 * dark surface. Two files, and CSS decides which is on show (rules in
 * `styles.css`); the component carries no theme logic.
 */
export function BrandMark() {
  return (
    <>
      <img
        className="brand-mark brand-mark-light"
        src="/brand/logo-skeplr.png"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <img
        className="brand-mark brand-mark-dark"
        src="/brand/logo-skeplr-dark.png"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    </>
  )
}
