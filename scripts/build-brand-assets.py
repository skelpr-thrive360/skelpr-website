#!/usr/bin/env python3
"""Build every brand asset on the site from `brand-source/mainlogo-skelpr.png`.

One script, one source. The supplied logo is flat-colour art on an opaque
near-white page: 84% of the file is paper, and the rest is three inks — a dark
node, a light-grey network and one green link. Everything the site wears comes
out of it:

1. **Lift the paper off.** The page is opaque, so alpha has to be recovered from
   the pixels. A luminance ramp is the usual way and it is wrong here: it assumes
   one ink level, and this drawing has three, so the light-grey network would come
   back nearly transparent while the dark node stayed solid. Instead every pixel
   is solved against the known ink list — which ink, at what alpha, would have
   made this colour on that paper — and snapped to it. Snapping also drops the ±2
   drift the file carries from its compression, so the output is flat the way it
   was drawn rather than noisy.

2. **Two variants, not one.** The node is `#141718`, which is `--ink-1`'s *light*
   value; on the dark surface it sinks into the background. The dark variant swaps
   that single ink for `--ink-1`'s dark value and leaves the network and the green
   alone, so it is the same drawing in the other theme rather than a second logo.

3. **Plates** — `logo-skelpr.png` and `logo-skelpr-dark.png`, the full mark at its
   native resolution, tight to the ink. Large-surface assets: the social card, a
   docs header, a README banner. Not the 20px header mark, where the whole mark is
   a smear — see the small-surface rule below.

4. **Favicons and app icons**, transparent, no baked-in tile — the site's rule
   everywhere. Small surfaces (16–48px: the ICO, the PNG links, the embedded SVG
   favicon) crop to the mark's *detail* — the dark node, the green link and the
   located node, roughly the right 60% of the drawing — because a 16px tab needs a
   subject, not a map. Large surfaces (apple-touch, the PWA icons) carry the whole
   network. iOS and launcher surfaces composite transparency onto dark, so those
   draw with the dark variant; the theme-aware SVG favicon does the real
   light/dark switching wherever SVG favicons are supported.

5. **The social card.** `public/brand/og-card.png` is composed from a pristine
   template in `brand-source/`, so re-running is idempotent — the artwork column
   is cleared back to paper and the mark re-placed rather than pasted onto its own
   last output. The template keeps the typography, which is not reproducible from
   here: the wordmark is set in the site's webfonts, which ship as woff2, which
   Pillow cannot read. Only the artwork in the card's left column changes.

Run from `website/`:

    python scripts/build-brand-assets.py
"""

from __future__ import annotations

import argparse
import base64
import io
from pathlib import Path

from PIL import Image, ImageDraw

# --- the source's own inks, measured from brand-source/mainlogo-skelpr.png -----
INK = (0x14, 0x17, 0x18)       # the loaded node
LINK = (0xC4, 0xC4, 0xC4)      # the network it was loaded from
ACCENT = (0x02, 0x8E, 0x63)    # the located one
PALETTE = (INK, LINK, ACCENT)

PAPER = (0xF9, 0xF8, 0xF4)     # --surface, light: the og card's ground

# The dark variant's one swap: --ink-1's dark value. The network and the green
# already read on a dark surface, and changing them would make this a different
# drawing rather than the same one in the other theme.
DARK_INK = (0xED, 0xEF, 0xF1)
DARK_REMAP = {INK: DARK_INK}

ALPHA_CUT = 0.04   # below this a pixel is paper, not a very faint ink
FIT_SLACK = 120    # sum-of-squared-error slack within which a fuller ink wins

# --- icon layout ---------------------------------------------------------------
CONTENT = 0.86     # of the canvas, on the mark's longest side
DETAIL_CONTENT = 0.90
DETAIL_FROM = 0.40   # detail crop: everything right of 40% of the mark's width
MASKABLE_CONTENT = 0.62   # launchers crop maskable icons to a circle
SVG_EMBED = 64       # the raster embedded in the favicon SVG (tabs draw it 2×)

# --- the social card -------------------------------------------------------------
CARD = (1200, 630)               # what og:image and twitter:image are declared at
CARD_TEXT_LEFT = 629             # where the wordmark column starts, measured
CARD_MARK_BOX = (140, 40, 600, 590)   # the slot the artwork is centred in


def solve_pixel(pixel: tuple[int, int, int]) -> tuple[float, tuple[int, int, int]]:
    """The alpha and the ink that best explain one pixel.

    Each candidate ink *c* defines a line from the paper to *c*; the alpha is the
    projection of the pixel onto it and the residual is how far off that line the
    pixel sits. Two inks can fit equally well, and legitimately so: the core of a
    grey link is `LINK` at alpha 1 *and* `INK` at alpha 0.25, and on paper those
    two composites are the same colour. They are not the same on a dark surface,
    where only the fuller ink keeps the link visible — so the tie goes to it, which
    is also the ink that was actually drawn.
    """
    fits = []
    for ink in PALETTE:
        axis = [255 - c for c in ink]
        den = sum(v * v for v in axis)
        alpha = sum((255 - pixel[i]) * axis[i] for i in range(3)) / den
        alpha = min(1.0, max(0.0, alpha))
        error = sum((pixel[i] - (alpha * ink[i] + (1 - alpha) * 255)) ** 2 for i in range(3))
        fits.append((error, alpha, ink))

    best_error = min(error for error, _, _ in fits)
    candidates = [f for f in fits if f[0] <= best_error + FIT_SLACK]
    _, alpha, ink = max(candidates, key=lambda f: f[1])
    return alpha, ink


def debackground(src: Path) -> tuple[Image.Image, dict]:
    """The mark on transparency, cropped to its ink, with its inks snapped flat."""
    rgb = Image.open(src).convert("RGB")
    out = []
    opaque = 0
    for pixel in rgb.getdata():
        alpha, ink = solve_pixel(pixel)
        if alpha < ALPHA_CUT:
            alpha = 0.0
        else:
            opaque += 1
        out.append((ink[0], ink[1], ink[2], int(round(alpha * 255))))

    rgba = Image.new("RGBA", rgb.size)
    rgba.putdata(out)
    bbox = rgba.getchannel("A").getbbox() or (0, 0, *rgb.size)
    metrics = {
        "page": rgb.size,
        "content": (bbox[2] - bbox[0], bbox[3] - bbox[1]),
        "opaque_fraction": opaque / (rgb.size[0] * rgb.size[1]),
    }
    return rgba.crop(bbox), metrics


def recolour(mark: Image.Image, remap: dict) -> Image.Image:
    """The same mark with some inks swapped — alpha untouched."""
    out = mark.copy()
    out.putdata([remap.get((r, g, b), (r, g, b)) + (a,) for r, g, b, a in mark.getdata()])
    return out


def detail_crop(mark: Image.Image) -> Image.Image:
    """The small-surface subject: the loaded node, the green link, the green node.

    A 16px tab needs a subject, not a map — the whole mark at that size is a
    grey smear with a dot in it. The right side of the drawing carries the part
    that reads, and at the right 60% it is also almost exactly square, which is
    what the small icons want to be.
    """
    return mark.crop((round(mark.width * DETAIL_FROM), 0, mark.width, mark.height))


def fit(mark: Image.Image, size: int, content: float) -> Image.Image:
    """Scale the mark to *content* of a transparent square and centre it."""
    scale = content * size / max(mark.width, mark.height)
    w, h = round(mark.width * scale), round(mark.height * scale)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(mark.resize((w, h), Image.LANCZOS), ((size - w) // 2, (size - h) // 2))
    return canvas


def write_ico(path: Path, layers: list[tuple[int, Image.Image]]) -> None:
    """A multi-size .ico with PNG payloads (each size rendered, not upscaled)."""
    payloads = []
    for size, image in layers:
        buffer = io.BytesIO()
        image.save(buffer, format="PNG", optimize=True)
        payloads.append((size, buffer.getvalue()))

    header = b"\x00\x00\x01\x00" + len(payloads).to_bytes(2, "little")
    offset = len(header) + 16 * len(payloads)
    directory = b""
    for size, data in payloads:
        directory += (size if size < 256 else 0).to_bytes(4, "little") + (1).to_bytes(2, "little") \
            + (32).to_bytes(2, "little") + len(data).to_bytes(4, "little") + offset.to_bytes(4, "little")
        offset += len(data)
    path.write_bytes(header + directory + b"".join(data for _, data in payloads))


def png_data_url(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")


def write_favicon_svg(path: Path, light: Image.Image, dark: Image.Image, dark_only: bool) -> None:
    """The favicon as an SVG that carries both variants as embedded rasters.

    The mark is curves and circles, not geometry simple enough to trace, so the
    SVG is a wrapper around PNGs rather than a redraw. The light variant carries
    an embedded prefers-color-scheme query so the no-JS default follows the OS;
    the dark variant is hard-coded, because the site's own theme toggle — not the
    OS — is what the running page follows, and src/lib/theme.ts re-points the
    icon link at this file when the visitor chooses dark.
    """
    if dark_only:
        body = f'  <image width="{SVG_EMBED}" height="{SVG_EMBED}" href="{png_data_url(dark)}"/>\n'
    else:
        body = (
            f'  <style>.l{{display:inline}}.d{{display:none}}'
            f'@media (prefers-color-scheme: dark){{.l{{display:none}}.d{{display:inline}}}}</style>\n'
            f'  <image class="l" width="{SVG_EMBED}" height="{SVG_EMBED}" href="{png_data_url(light)}"/>\n'
            f'  <image class="d" width="{SVG_EMBED}" height="{SVG_EMBED}" href="{png_data_url(dark)}"/>\n'
        )
    path.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {SVG_EMBED} {SVG_EMBED}">\n{body}</svg>\n',
        encoding="utf-8",
    )


def leftovers(image: Image.Image, box: tuple[int, int, int, int]) -> int:
    """Non-paper pixels inside *box* — the mark that is still on the template."""
    pixels = image.crop(box).getdata()
    return sum(1 for p in pixels if max(abs(p[i] - PAPER[i]) for i in range(3)) > 6)


def compose_card(template: Path, mark: Image.Image, out: Path) -> dict:
    """Clear the template's mark column back to paper and place the new mark in it."""
    card = Image.open(template).convert("RGB")
    if card.size != CARD:
        raise SystemExit(f"!! template is {card.size}, expected {CARD}")

    # The old mark's slot, found rather than assumed: anything but paper in the
    # artwork column. The box below has to contain it, or clearing the box would
    # leave a piece of the old mark behind.
    columns = [x for x in range(CARD_TEXT_LEFT)
               if leftovers(card, (x, 0, x + 1, CARD[1]))]
    before = (min(columns), 0, max(columns) + 1, CARD[1])
    rows = [y for y in range(CARD[1]) if leftovers(card, (before[0], y, before[2], y + 1))]
    before = (before[0], min(rows), before[2], max(rows) + 1)
    if not (before[0] >= CARD_MARK_BOX[0] and before[1] >= CARD_MARK_BOX[1]
            and before[2] <= CARD_MARK_BOX[2] and before[3] <= CARD_MARK_BOX[3]):
        raise SystemExit(f"!! template mark {before} is not inside {CARD_MARK_BOX}")

    box_w = CARD_MARK_BOX[2] - CARD_MARK_BOX[0]
    box_h = CARD_MARK_BOX[3] - CARD_MARK_BOX[1]
    scale = min(box_w / mark.width, box_h / mark.height)
    size = (round(mark.width * scale), round(mark.height * scale))
    placed = (
        CARD_MARK_BOX[0] + (box_w - size[0]) // 2,
        CARD_MARK_BOX[1] + (box_h - size[1]) // 2,
    )

    # Clear first, then paste: the new mark is a different shape from the one it
    # replaces, so it does not cover every pixel the old one did — and on a flat
    # paper ground, clearing is what makes the swap exact rather than a paste that
    # leaves the corners of the old artwork showing.
    ImageDraw.Draw(card).rectangle(CARD_MARK_BOX, fill=PAPER)
    stale = leftovers(card, CARD_MARK_BOX)
    scaled = mark.resize(size, Image.LANCZOS)
    card.paste(scaled, placed, scaled)
    card.save(out, optimize=True)

    return {
        "placed": (*placed, placed[0] + size[0], placed[1] + size[1]),
        "leftovers": stale,
        "gap_to_text": CARD_TEXT_LEFT - (placed[0] + size[0]),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="public", help="site public directory (default: public)")
    parser.add_argument("--source-dir", default="brand-source", help="source logo directory")
    parser.add_argument("--source", default="mainlogo-skelpr.png", help="the supplied logo")
    parser.add_argument("--card-template", default="og-card-template.png",
                        help="pristine social card, relative to --source-dir")
    args = parser.parse_args()

    public = Path(args.out)
    brand = public / "brand"
    brand.mkdir(parents=True, exist_ok=True)
    source = Path(args.source_dir) / args.source
    if not source.exists():
        print(f"!! {source} not found; nothing to do")
        return 1

    print("== source ==")
    mark, metrics = debackground(source)
    dark = recolour(mark, DARK_REMAP)
    print(f"  {source}: {metrics['page'][0]}x{metrics['page'][1]}, "
          f"ink {metrics['content'][0]}x{metrics['content'][1]} "
          f"({metrics['content'][0] / metrics['content'][1]:.2f}:1), "
          f"opaque {metrics['opaque_fraction'] * 100:.1f}%")
    print(f"  inks: node #{INK[0]:02X}{INK[1]:02X}{INK[2]:02X}, "
          f"network #{LINK[0]:02X}{LINK[1]:02X}{LINK[2]:02X}, "
          f"accent #{ACCENT[0]:02X}{ACCENT[1]:02X}{ACCENT[2]:02X}")

    # 1. Plates: the whole mark at native resolution, tight to the ink. Large
    #    surfaces only — upscaling past ~575px would invent detail that is not
    #    there, and down to header sizes the whole mark is a smear.
    light_path = brand / "logo-skelpr.png"
    dark_path = brand / "logo-skelpr-dark.png"
    mark.save(light_path, optimize=True)
    dark.save(dark_path, optimize=True)

    # 2. Small surfaces: the detail crop, dark variant. ICO and the PNG links
    #    cannot read media queries, and the surfaces that composite transparency
    #    themselves (iOS home screen, browser tab strips) put it on dark, so the
    #    light-on-dark variant is the one that reads everywhere without a tile.
    subject_dark = fit(detail_crop(dark), SVG_EMBED, DETAIL_CONTENT)
    subject_light = fit(detail_crop(mark), SVG_EMBED, DETAIL_CONTENT)
    fit(detail_crop(dark), 32, DETAIL_CONTENT).save(brand / "favicon-32.png")
    fit(detail_crop(dark), 16, DETAIL_CONTENT).save(brand / "favicon-16.png")
    write_ico(public / "favicon.ico", [
        (16, fit(detail_crop(dark), 16, DETAIL_CONTENT)),
        (32, fit(detail_crop(dark), 32, DETAIL_CONTENT)),
        (48, fit(detail_crop(dark), 48, DETAIL_CONTENT)),
    ])
    write_favicon_svg(public / "favicon.svg", subject_light, subject_dark, dark_only=False)
    write_favicon_svg(public / "favicon-dark.svg", subject_light, subject_dark, dark_only=True)

    # 3. App icons: whole network, dark variant, transparent (no baked-in tile).
    fit(dark, 180, CONTENT).save(brand / "apple-touch-icon-180.png")
    for size in (192, 512):
        fit(dark, size, CONTENT).save(brand / f"icon-{size}.png")
        fit(dark, size, MASKABLE_CONTENT).save(brand / f"icon-maskable-{size}.png")

    # 4. The social card, recomposed from the pristine template.
    card = compose_card(Path(args.source_dir) / args.card_template, mark, brand / "og-card.png")

    # 5. Self-checks.
    print("== checks ==")
    corners = [mark.getpixel(p)[3] for p in ((0, 0), (mark.width - 1, 0),
                                             (0, mark.height - 1), (mark.width - 1, mark.height - 1))]
    print(f"  corner alpha {corners} -> {'transparent OK' if max(corners) == 0 else 'FAIL: page still attached'}")
    opaque = {p[:3] for p in mark.getdata() if p[3] > 250}
    print(f"  solid pixels use {len(opaque)} distinct colours -> "
          f"{'flat OK' if len(opaque) <= 3 else 'NOISY: snapping missed'}")

    print("== og card ==")
    print(f"  placed {card['placed']}, {card['gap_to_text']}px clear of the wordmark column")
    print(f"  pixels of the old mark left behind: {card['leftovers']} -> "
          f"{'clean OK' if card['leftovers'] == 0 else 'FAIL'}")

    print("== written ==")
    for path in sorted([*brand.glob("*.png"), public / "favicon.ico",
                        public / "favicon.svg", public / "favicon-dark.svg"]):
        print(f"  {path}  ({path.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
