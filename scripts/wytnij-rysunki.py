"""Render the source PDF regions used by the MatIndeks website."""

import argparse
from contextlib import ExitStack
from io import BytesIO
import json
from pathlib import Path

from PIL import Image, ImageChops
import pymupdf


ROOT = Path(__file__).resolve().parents[1]


def crop_figure(page, coordinates):
    rect = pymupdf.Rect(coordinates)
    if rect.is_empty or not page.rect.contains(rect):
        raise ValueError(f"Kadr wychodzi poza stronę {page.number + 1}: {rect}")

    # Rendering to PNG converts the PDF's premultiplied alpha to normal PNG alpha.
    pixmap = page.get_pixmap(dpi=288, clip=rect, alpha=True, annots=False)
    with Image.open(BytesIO(pixmap.tobytes("png"))) as png:
        image = png.convert("RGBA")

    # Some scans and labels have white pixels baked in. Keep the greys and colours of the artwork.
    red, green, blue, alpha = image.split()
    lightest_paper = ImageChops.darker(ImageChops.darker(red, green), blue)
    paper_mask = lightest_paper.point(lambda value: 0 if value >= 250 else 255)
    image.putalpha(ImageChops.multiply(alpha, paper_mask))
    ink = image.getchannel("A").getbbox()
    if ink is None:
        raise ValueError(f"Pusty kadr na stronie {page.number + 1}: {rect}")

    trimmed = image.crop(ink)
    # Publish at 2x density with a consistent scale for the original PDF labels.
    size = tuple(round(dimension * 2 / 3) for dimension in trimmed.size)
    trimmed.info.pop("dpi", None)
    return trimmed.resize(size, Image.Resampling.LANCZOS)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf_directory", type=Path, help="Katalog z arkuszami i zbiorem CKE (zbior.pdf)")
    parser.add_argument("slugs", nargs="*", help="Opcjonalna lista nazw ilustracji do odtworzenia")
    args = parser.parse_args()
    manifest = json.loads((ROOT / "content/kadry-rysunkow.json").read_text(encoding="utf-8"))
    chosen = args.slugs or list(manifest)
    with ExitStack() as stack:
        sources = {}
        for slug in chosen:
            entry = manifest[slug]
            filename = entry["pdf"]
            if filename not in sources:
                pdf = pymupdf.open(args.pdf_directory / filename)
                sources[filename] = stack.enter_context(pdf)
            page = sources[filename][entry["page"] - 1]
            image = crop_figure(page, entry["rect"])
            image.save(ROOT / "docs" / "rysunki" / f"{slug}.png", optimize=True)
    print(f"Wyeksportowane ilustracje: {len(chosen)}")


if __name__ == "__main__":
    main()
