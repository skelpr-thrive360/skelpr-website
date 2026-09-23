#!/usr/bin/env python3
"""Build the site's brand assets from the source logos in `brand-source/`.

Two jobs:

1. **Strip the white background** off the source JPEGs. The sources are a dark mark
   on pure white, so alpha is derived from luminance against the image's own ink
   level, then every pixel is flattened to the brand hex. Flattening (rather than
   keeping the JPEG's sampled colour) removes white fringing at the edges and
   restores the exact palette instead of the JPEG-shifted approximation.
2. **Render the derived sizes from measured geometry.** The sources are only
   ~250px wide, so upscaling them to 512px would soften the edges. Because the
   mark is axis-aligned rectangles, every output size is drawn from the same
   measurements at any resolution — razor sharp — and those measurements are also
   what the inline SVG component uses, so header and icons agree exactly.

Run from `website/`:

    python scripts/build-brand-assets.py

Requires Pillow (already used for image checks in this environment).
"""

from __future__ import annotations

import argparse
import struct
from pathlib import Path

from PIL import Image, ImageDraw

# --- brand palette ---------------------------------------------------------
INK = (0x17, 0x18, 0x1A)     # --ink-1: the frame (the whole repository)
ACCENT = (0x15, 0x48, 0x74)  # --accent: the located fragment (kept in sync with styles.css)
PAPER = (0xF9, 0xF8, 0xF4)   # light surface, used behind opaque icons
# Dark-theme tokens from styles.css: the SVG favicon flips to these in dark tabs,
# and the raster icons draw with them (see the icons section in main()).
DARK_INK = (0xED, 0xEF, 0xF1)     # --ink-1, dark side
DARK_ACCENT = (0x8A, 0xB4, 0xE0)  # --accent, dark side

# --- mark geometry on a 24-unit grid --------------------------------------
# Measured from the sources: outer silhouette 18 units, stroke 2 units, fragment
# 7 units flush with the frame's lower-right corner. Chosen (not measured): a
# 2-unit channel equal to the stroke, so the separation reads as deliberate, and
# 3-unit margins so every icon is framed identically. The sources themselves sit
# tighter (~1.6 units of margin), which is why the outputs are re-framed here.
GRID = 24.0
FRAME_OUTER = 18.0
STROKE = 2.0
MARGIN = (GRID - FRAME_OUTER) / 2.0   # 3.0
BLOCK = 7.0
CHANNEL = 2.0            # equals the stroke, so the separation reads as deliberate
FAVICON_CHANNEL = 3.0    # optically widened: at 16px a 2-unit gap is ~1.3px
DEFAULT_CONTENT = FRAME_OUTER / GRID  # 0.75 of the canvas
MASKABLE_CONTENT = 0.62  # smaller: launchers crop maskable icons to a circle

# --- background removal tuning -------------------------------------------
ALPHA_CUT_LOW = 12    # below this, treat as background (kills JPEG ringing)
ALPHA_CUT_HIGH = 245  # above this, force fully opaque (clean interiors)

SS = 4  # supersampling factor for geometric renders


def frame_rects(channel: float) -> list[tuple[float, float, float, float]]:
    """Stroke-thick rectangles for the notched frame, in grid units.

    Four edges, each exactly STROKE units thick, with the lower-right corner left
    open so the fragment can be seated in it.
    """
    outer = MARGIN
    far = MARGIN + FRAME_OUTER          # 21.0 — outer edge of the ink
    notch = far - BLOCK - channel       # where the right/bottom edges stop
    return [
        (outer, outer, far, outer + STROKE),   # top edge
        (outer, outer, outer + STROKE, far),   # left edge
        (far - STROKE, outer, far, notch),     # right edge, upper part only
        (outer, far - STROKE, notch, far),     # bottom edge, left part only
    ]


def block_rect() -> tuple[float, float, float, float]:
    far = MARGIN + FRAME_OUTER
    return (far - BLOCK, far - BLOCK, far, far)


def svg_markup(channel: float = CHANNEL) -> tuple[str, str]:
    """The same geometry as an SVG path and fragment rect, for the inline component."""
    outer = MARGIN
    far = MARGIN + FRAME_OUTER
    centre_lo = outer + STROKE / 2      # centerline of the top/left edges
    centre_hi = far - STROKE / 2        # centerline of the right/bottom edges
    notch = far - BLOCK - channel
    path = (f"M{notch:g} {centre_hi:g} H{centre_lo:g} V{centre_lo:g} "
            f"H{centre_hi:g} V{notch:g}")
    block = far - BLOCK
    rect = f"x={block:g} y={block:g} width={BLOCK:g} height={BLOCK:g}"
    return path, rect


def check_geometry() -> None:
    """Every edge must be stroke-thick, and the fragment must sit clear of the frame."""
    for rect in frame_rects(CHANNEL):
        x0, y0, x1, y1 = rect
        thickness = min(x1 - x0, y1 - y0)
        assert abs(thickness - STROKE) < 1e-9, f"edge is {thickness} units thick, expected {STROKE}"

    far = MARGIN + FRAME_OUTER
    right_edge_end = frame_rects(CHANNEL)[2][3]        # y where the right edge stops
    bottom_edge_end = frame_rects(CHANNEL)[3][2]       # x where the bottom edge stops
    block_start = far - BLOCK
    assert abs((block_start - right_edge_end) - CHANNEL) < 1e-9, "vertical channel mismatch"
    assert abs((block_start - bottom_edge_end) - CHANNEL) < 1e-9, "horizontal channel mismatch"


def render(size: int, colour: tuple[int, int, int], channel: float = CHANNEL,
           content: float = DEFAULT_CONTENT,
           fragment: tuple[int, int, int] | None = ACCENT) -> Image.Image:
    """Render the mark at `size` px as a transparent RGBA image.

    The frame is drawn in `colour` and the located fragment in `fragment`,
    matching the inline BrandMark component (ink frame, accent fragment).
    Pass ``fragment=None`` for a monochrome mark (or set both to the same colour).

    The geometry already includes its own margins, so the only offset applied is
    the extra padding needed to bring the frame down to `content` of the canvas.
    """
    grid = FRAME_OUTER / content                    # virtual grid size in units
    offset = (grid - GRID) / 2.0                    # extra padding, in units
    big = size * SS
    k = big / grid                                  # px per grid unit
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    def to_px(rect: tuple[float, float, float, float]) -> list[int]:
        x0, y0, x1, y1 = rect
        return [round((x0 + offset) * k), round((y0 + offset) * k),
                round((x1 + offset) * k), round((y1 + offset) * k)]

    for rect in frame_rects(channel):
        draw.rectangle(to_px(rect), fill=colour + (255,))
    draw.rectangle(to_px(block_rect()), fill=(colour if fragment is None else fragment) + (255,))
    return img.resize((size, size), Image.LANCZOS)


def strip_white(src: Path) -> tuple[Image.Image, dict]:
    """Return (RGBA mark on transparency, metrics) for a dark mark on white."""
    rgb = Image.open(src).convert("RGB")
    grey = rgb.convert("L")
    hist = grey.histogram()
    total = sum(hist)

    def percentile(p: float) -> int:
        target = total * p
        acc = 0
        for value, count in enumerate(hist):
            acc += count
            if acc >= target:
                return value
        return 255

    ink_level = percentile(0.01)      # the mark's own dark value
    bg_level = percentile(0.99)       # the paper, ~255 on these sources
    span = max(bg_level - ink_level, 1)

    lut = []
    for value in range(256):
        alpha = 255.0 * (bg_level - value) / span
        alpha = min(255.0, max(0.0, alpha))
        if alpha <= ALPHA_CUT_LOW:
            alpha = 0.0
        elif alpha >= ALPHA_CUT_HIGH:
            alpha = 255.0
        lut.append(int(round(alpha)))

    out = Image.new("RGBA", rgb.size, INK + (0,))
    out.putalpha(grey.point(lut))

    alpha_bbox = out.getchannel("A").getbbox() or (0, 0, *rgb.size)
    metrics = {
        "source": str(src),
        "size": rgb.size,
        "ink_level": ink_level,
        "bg_level": bg_level,
        "content_bbox": alpha_bbox,
        "content_size": (alpha_bbox[2] - alpha_bbox[0], alpha_bbox[3] - alpha_bbox[1]),
        "opaque_fraction": sum(1 for a in out.getchannel("A").getdata() if a > 200)
                           / (rgb.size[0] * rgb.size[1]),
    }
    return out, metrics


def normalise(mark: Image.Image, content: float = DEFAULT_CONTENT) -> Image.Image:
    """Crop to the mark and re-pad to a square with equal margins."""
    bbox = mark.getchannel("A").getbbox()
    if bbox is None:
        return mark
    cropped = mark.crop(bbox)
    side = int(round(max(cropped.size[1] / content, cropped.size[0] / content)))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(cropped, ((side - cropped.size[0]) // 2, (side - cropped.size[1]) // 2))
    return canvas


def flatten(mark: Image.Image, size: int, background: tuple[int, int, int]) -> Image.Image:
    """Composite the mark onto an opaque square (for icons that cannot be transparent)."""
    base = Image.new("RGBA", (size, size), background + (255,))
    base.alpha_composite(mark.resize((size, size), Image.LANCZOS))
    return base.convert("RGB")


def hexs(rgb: tuple[int, int, int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(*rgb)


def write_favicon_svg(path: Path, dark: bool = False) -> None:
    """The mark as a favicon SVG.

    The light variant carries an embedded prefers-color-scheme query so the
    no-JS default follows the OS; the dark variant is hard-coded, because the
    site's own theme toggle — not the OS — is what the running page follows,
    and src/lib/theme.ts re-points the icon link at this file when the
    visitor chooses dark. The two files must stay in sync with that swap.
    Safari ignores SVG favicons entirely and falls back to the ICO/PNG links.
    The widened FAVICON_CHANNEL keeps the 16px gap readable.
    """
    path_d, _ = svg_markup(FAVICON_CHANNEL)
    block = MARGIN + FRAME_OUTER - BLOCK
    frame, fragment = (hexs(DARK_INK), hexs(DARK_ACCENT)) if dark else (hexs(INK), hexs(ACCENT))
    if dark:
        rules = (f'    path {{ stroke: {frame}; }}\n'
                 f'    rect {{ fill: {fragment}; }}\n')
    else:
        rules = (f'    path {{ stroke: {frame}; }}\n'
                 f'    rect {{ fill: {fragment}; }}\n'
                 '    @media (prefers-color-scheme: dark) {\n'
                 f'      path {{ stroke: {hexs(DARK_INK)}; }}\n'
                 f'      rect {{ fill: {hexs(DARK_ACCENT)}; }}\n'
                 '    }\n')
    path.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">\n'
        '  <style>\n'
        f'{rules}'
        '  </style>\n'
        f'  <path d="{path_d}" fill="none" stroke-width="{STROKE:g}"/>\n'
        f'  <rect x="{block:g}" y="{block:g}" width="{BLOCK:g}" height="{BLOCK:g}"/>\n'
        '</svg>\n',
        encoding="utf-8",
    )


def write_ico(path: Path, layers: list[tuple[int, Image.Image]]) -> None:
    """Write a multi-size .ico containing PNG payloads (each size rendered, not upscaled)."""
    import io

    payloads = []
    for size, image in layers:
        buffer = io.BytesIO()
        image.save(buffer, format="PNG", optimize=True)
        payloads.append((size, buffer.getvalue()))

    header = struct.pack("<HHH", 0, 1, len(payloads))
    offset = len(header) + 16 * len(payloads)
    directory = b""
    for size, data in payloads:
        directory += struct.pack("<BBBBHHII", size if size < 256 else 0,
                                 size if size < 256 else 0, 0, 0, 1, 32, len(data), offset)
        offset += len(data)
    path.write_bytes(header + directory + b"".join(data for _, data in payloads))


def channel_report(mark: Image.Image, size: int = 16) -> tuple[list[int], list[int]]:
    """Alpha across and down the block's centre — the channel shows up as a dip."""
    rgba = mark.convert("RGBA")
    k = size / GRID
    centre = int(round((MARGIN + FRAME_OUTER - BLOCK / 2) * k))
    centre = min(max(centre, 0), size - 1)
    row = [rgba.getpixel((x, centre))[3] for x in range(size)]
    col = [rgba.getpixel((centre, y))[3] for y in range(size)]
    return row, col


def hexdump(mark: Image.Image, size: int) -> list[str]:
    return ["".join("#" if mark.getpixel((x, y))[3] > 128 else "." for x in range(size))
            for y in range(size)]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="public", help="site public directory (default: public)")
    parser.add_argument("--source-dir", default="brand-source", help="source logo directory")
    args = parser.parse_args()

    check_geometry()

    public = Path(args.out)
    brand = public / "brand"
    brand.mkdir(parents=True, exist_ok=True)

    sources = Path(args.source_dir)
    ink_src = sources / "mainlogo-ink.jpg"
    accent_src = sources / "mainlogo-accent.jpg"

    print("== measured sources ==")
    for path in (ink_src, accent_src):
        if not path.exists():
            print(f"  ! missing {path} — skipping")
            continue
        _, m = strip_white(path)
        print(f"  {path.name}: {m['size'][0]}x{m['size'][1]}, ink L={m['ink_level']}, "
              f"paper L={m['bg_level']}, content {m['content_size'][0]}x{m['content_size'][1]}, "
              f"opaque {m['opaque_fraction'] * 100:.1f}%")

    if not ink_src.exists():
        print("!! no source logos found; nothing to do")
        return 1

    # 1. Faithful de-backgrounded rasters at source resolution (provenance / fallback).
    stripped, _ = strip_white(ink_src)
    normalise(stripped).save(brand / "mark-source.png")
    if accent_src.exists():
        accent_stripped, _ = strip_white(accent_src)
        recoloured = Image.new("RGBA", accent_stripped.size, ACCENT + (0,))
        recoloured.putalpha(accent_stripped.getchannel("A"))
        normalise(recoloured).save(brand / "mark-accent-source.png")

    # 2. Geometry renders — sharp at every size. The fragment colour is explicit:
    # the component's look is an ink frame + accent fragment, not monochrome fill.
    for name, size, colour, fragment in [
        ("mark-ink.png", 512, INK, ACCENT),        # ink frame + accent fragment (the component)
        ("mark-accent.png", 512, ACCENT, ACCENT),  # all-accent monochrome
        ("mark-paper.png", 512, PAPER, None),      # all-paper monochrome, for dark backgrounds
    ]:
        render(size, colour, CHANNEL, DEFAULT_CONTENT, fragment).save(brand / name)

    # 3. Icons — every raster is transparent, no baked-in tile. White lines
    # everywhere: the ICO and PNG links cannot read media queries, and the
    # surfaces that composite transparency themselves (iOS home screen, app
    # launchers) put it on dark, so the light mark is the one that reads
    # everywhere without a background. The theme-aware SVG favicon does the
    # real light/dark switching wherever SVG favicons are supported.
    render(32, DARK_INK, fragment=DARK_ACCENT).save(brand / "favicon-32.png")
    render(16, DARK_INK, channel=FAVICON_CHANNEL, fragment=DARK_ACCENT).save(brand / "favicon-16.png")
    write_ico(public / "favicon.ico", [
        (16, render(16, DARK_INK, channel=FAVICON_CHANNEL, fragment=DARK_ACCENT)),
        (32, render(32, DARK_INK, fragment=DARK_ACCENT)),
        (48, render(48, DARK_INK, fragment=DARK_ACCENT)),
    ])
    write_favicon_svg(public / "favicon.svg")  # OS-aware default (no-JS)
    write_favicon_svg(public / "favicon-dark.svg", dark=True)  # hard-coded, swapped in by theme.ts

    # Transparent icons (user request: no backgrounds anywhere). iOS composites
    # transparency onto dark, so the light mark keeps its contrast there.
    render(180, DARK_INK, fragment=DARK_ACCENT).save(brand / "apple-touch-icon-180.png")
    for size in (192, 512):
        render(size, DARK_INK, fragment=DARK_ACCENT).save(brand / f"icon-{size}.png")
        # Maskable variants: launchers crop these, so the mark is pulled in.
        render(size, DARK_INK, fragment=DARK_ACCENT, content=MASKABLE_CONTENT).save(
            brand / f"icon-maskable-{size}.png")
    render(460, DARK_INK, fragment=DARK_ACCENT, content=0.64).save(brand / "github-avatar.png")

    # 4. Self-checks.
    notch = (MARGIN + FRAME_OUTER) - BLOCK - CHANNEL
    print("== geometry ==")
    print("  frame edges stroke-thick, fragment clear of frame ends -> OK")
    print(f"  measured: frame outer {FRAME_OUTER:g}/24, stroke {STROKE:g}, fragment {BLOCK:g}")
    print(f"  chosen:   margin {MARGIN:g}, channel {CHANNEL:g} (favicon {FAVICON_CHANNEL:g})")
    print(f"  frame ends at {notch:g} ({(notch - MARGIN) / FRAME_OUTER * 100:.0f}% along the edge)")
    path_d, rect_attrs = svg_markup()
    print(f"  inline SVG geometry: '{path_d}' + rect {rect_attrs}")

    print("== checks ==")
    ink = Image.open(brand / "mark-ink.png").convert("RGBA")
    corners = [ink.getpixel((0, 0))[3], ink.getpixel((511, 0))[3],
               ink.getpixel((0, 511))[3], ink.getpixel((511, 511))[3]]
    print(f"  corner alpha {corners} -> {'transparent OK' if max(corners) == 0 else 'FAIL'}")

    bbox = ink.getchannel("A").getbbox()
    left, top = bbox[0], bbox[1]
    right, bottom = 512 - bbox[2], 512 - bbox[3]
    print(f"  margins L{left} T{top} R{right} B{bottom} -> "
          f"{'equal OK' if max(left, top, right, bottom) - min(left, top, right, bottom) <= 1 else 'UNEVEN'}")

    # Interior must be open: the centre of the frame has to be transparent.
    centre_alpha = ink.getpixel((256, 256))[3]
    print(f"  frame interior alpha {centre_alpha} -> {'open OK' if centre_alpha < 8 else 'FILLED (bug)'}")

    for size, channel in ((16, FAVICON_CHANNEL), (32, CHANNEL)):
        icon = render(size, INK, channel=channel)
        label = "favicon channel" if channel != CHANNEL else "normal channel"
        print(f"  {size}px ({label}):")
        for line in hexdump(icon, size):
            print("    " + line)
        row, col = channel_report(icon, size)
        print(f"    alpha across block centre: {row}")
        print(f"    channel visible: {'YES' if min(row) < 128 and min(col) < 128 else 'NO'}")

    print("== written ==")
    for path in sorted([*brand.glob("*.png"), public / "favicon.ico",
                        public / "favicon.svg", public / "favicon-dark.svg"]):
        print(f"  {path}  ({path.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
