"""Builds app icons and web-sized logos from the brand files in assets/.

Icons: the sun-rose icon centred on pearl with even padding (brief 10.9).
Logos: scaled copies only. Never recoloured, stretched or rearranged.
Run: python3 scripts/make-icons.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
A, OUT = ROOT / "assets", ROOT / "public"
PEARL = (232, 227, 219, 255)

icon = Image.open(A / "DR_logo_icon.png").convert("RGBA")
icon = icon.crop(icon.getbbox())

def square(size, pad_ratio, bg=PEARL):
    canvas = Image.new("RGBA", (size, size), bg)
    inner = int(size * (1 - 2 * pad_ratio))
    w, h = icon.size
    s = inner / max(w, h)
    im = icon.resize((round(w * s), round(h * s)), Image.LANCZOS)
    canvas.paste(im, ((size - im.width) // 2, (size - im.height) // 2), im)
    return canvas

square(192, 0.14).save(OUT / "icons/icon-192.png")
square(512, 0.14).save(OUT / "icons/icon-512.png")
square(512, 0.24).save(OUT / "icons/icon-maskable-512.png")  # safe zone for Android masks
square(180, 0.14).convert("RGB").save(OUT / "icons/apple-touch-icon.png")
square(64, 0.08, (0, 0, 0, 0)).save(OUT / "icons/favicon-64.png")

def scaled(name, width):
    im = Image.open(A / name).convert("RGBA")
    im = im.crop(im.getbbox())
    h = round(im.height * width / im.width)
    im.resize((width, h), Image.LANCZOS).save(OUT / "logo" / name, optimize=True)

scaled("DR_logo_primary.png", 900)
scaled("DR_logo_reversed.png", 900)
scaled("DR_logo_icon.png", 256)
if (A / "DR_logo_horizontal.png").exists():
    scaled("DR_logo_horizontal.png", 900)
print("done")
