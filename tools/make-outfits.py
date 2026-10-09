#!/usr/bin/env python3
"""Generate WearCast's 12 outfit layers (and the waving outfit) from shared garment shapes.

Run from the repo root:  python3 tools/make-outfits.py
Writes assets/character/outfit-<category>-<1..3>.svg and outfit-wave.svg.

Every shape is drawn for the left side of the figure (viewer's left) where it is symmetric,
then mirrored about the body's centre line (x = 497), so both sides always match the body in
assets/character/body.svg. Outfits are listed in spec.md → Content variation.
"""
import re
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "character"
VIEWBOX = "80 -100 840 3060"  # shared by every character layer
CENTER_X = 497

INK = "#2b2722"
WHITE = "#ffffff"
C = {  # muted clothing palette, chosen to sit on the cream background
    "sage": "#a9bba0", "sand": "#ddc9a3", "blush": "#ebbfae", "linen": "#efe6d2",
    "lightdenim": "#a7bbd0", "denim": "#6f88a6", "slate": "#8fa3b8", "olive": "#8c9a6b",
    "mustard": "#d9b45a", "moss": "#7f9479", "rust": "#b9714f", "cream": "#f6f1e6",
    "navy": "#4f6080", "camel": "#b8916a", "charcoal": "#6a645d", "oat": "#e6dccb",
    "lemon": "#f1dc9c", "brown": "#7a5236", "tan": "#c49a6c",
}


# ---------- path helpers ----------

def mirror(path):
    """Mirror an absolute M/L/C/Z path about x = CENTER_X."""
    out, is_x = [], True
    for tok in re.findall(r"[MLCZ]|-?\d+(?:\.\d+)?", path):
        if tok in "MLCZ":
            out.append(tok)
            is_x = True
        else:
            out.append(str(2 * CENTER_X - float(tok)).rstrip("0").rstrip(".") if is_x else tok)
            is_x = not is_x
    return " ".join(out)


def shape(d, fill, extra=""):
    return f'<path fill="{fill}" d="{d}"{extra}/>'


def pair(d, fill, extra=""):
    """A left-side shape plus its mirror image."""
    return shape(d, fill, extra) + "\n  " + shape(mirror(d), fill, extra)


def line(d, width=None):
    w = f' stroke-width="{width}"' if width else ""
    return f'<path fill="none" d="{d}"{w}/>'


# ---------- legs ----------

def trousers(color, joggers=False):
    if joggers:  # tapered, with cuffs at the ankle
        d = ("M316 1420 L678 1420 C690 1800 676 2300 650 2700 L530 2700 C518 2320 506 1920 497 1610 "
             "C488 1920 476 2320 464 2700 L344 2700 C318 2300 304 1800 316 1420 Z")
        cuffs = pair("M344 2700 L464 2700 L462 2774 L348 2774 Z", color)
        return shape(d, color) + "\n  " + cuffs + "\n  " + line("M497 1440 L497 1610")
    d = ("M316 1420 L678 1420 C690 1800 680 2300 660 2770 L524 2770 C516 2320 506 1920 497 1610 "
         "C488 1920 478 2320 470 2770 L334 2770 C314 2300 304 1800 316 1420 Z")
    return shape(d, color) + "\n  " + line("M497 1440 L497 1610")


def jeans(color):
    # Trousers plus a fly and pocket seams so jeans read differently from chinos.
    return (trousers(color) + "\n  " + line("M497 1440 C520 1500 524 1540 510 1580", 10)
            + "\n  " + pair("M340 1450 C380 1500 420 1510 440 1490", "none", ' stroke-width="10"'))


def shorts(color, frayed=False):
    d = ("M316 1420 L678 1420 C686 1600 686 1720 682 1830 L514 1840 C508 1730 502 1660 497 1620 "
         "C492 1660 486 1730 480 1840 L312 1830 C308 1720 308 1600 316 1420 Z")
    s = shape(d, color) + "\n  " + line("M497 1440 L497 1620")
    if frayed:
        s += "\n  " + pair("M330 1830 L336 1856 M370 1834 L372 1860 M410 1836 L414 1862 M450 1838 L452 1864",
                           "none", ' stroke-width="10"')
    else:  # turned-up hem
        s += "\n  " + pair("M314 1790 L480 1800", "none", ' stroke-width="10"')
    return s


def skirt(color):
    d = "M326 1400 L668 1400 C700 1700 728 2000 742 2230 L252 2230 C266 2000 294 1700 326 1400 Z"
    return shape(d, color) + "\n  " + line("M430 1420 C420 1700 400 1980 380 2220", 10) + \
        "\n  " + line("M564 1420 C574 1700 594 1980 614 2220", 10)


# ---------- feet ----------

def sneakers(color=WHITE):
    d = ("M340 2756 L470 2756 C478 2800 492 2826 530 2842 C560 2856 560 2906 524 2906 L346 2906 "
         "C328 2906 326 2880 340 2756 Z")
    left_shoe = shape(d, color)
    right_shoe = shape(shift(d, 186), color)
    soles = line("M334 2878 L552 2878 M520 2878 L738 2878")
    return "\n  ".join([left_shoe, right_shoe, soles])


def shift(d, dx):
    """Move a path right by dx."""
    out, is_x = [], True
    for tok in re.findall(r"[MLCZ]|-?\d+(?:\.\d+)?", d):
        if tok in "MLCZ":
            out.append(tok)
            is_x = True
        else:
            out.append(str(int(float(tok) + dx)) if is_x else tok)
            is_x = not is_x
    return " ".join(out)


def loafers(color):
    d = ("M344 2790 L466 2790 C476 2820 496 2836 530 2848 C556 2858 556 2906 522 2906 L350 2906 "
         "C332 2906 330 2880 344 2790 Z")
    return "\n  ".join([shape(d, color), shape(shift(d, 186), color),
                        line("M440 2830 C460 2844 486 2846 506 2840 M626 2830 C646 2844 672 2846 692 2840", 10)])


def boots(color):
    d = ("M336 2620 L470 2620 C474 2720 486 2800 530 2832 C566 2856 566 2906 524 2906 L344 2906 "
         "C324 2906 322 2860 336 2620 Z")
    return "\n  ".join([shape(d, color), shape(shift(d, 186), color),
                        line("M334 2880 L556 2880 M520 2880 L742 2880"),
                        line("M340 2660 L468 2660 M526 2660 L654 2660", 10)])


def sandals(color):
    # Bare feet (the body has none) with a sole and two straps.
    foot = ("M352 2780 L454 2780 C462 2810 480 2830 520 2846 C548 2858 548 2896 516 2896 L356 2896 "
            "C338 2896 336 2870 352 2780 Z")
    sole = "M330 2894 L556 2894 L556 2916 L330 2916 Z"
    parts = []
    for dx in (0, 186):
        parts += [shape(shift(foot, dx), WHITE), shape(shift(sole, dx), color),
                  line(shift("M350 2830 L460 2830 M440 2850 C470 2846 500 2850 520 2862", dx), 18)]
    return "\n  ".join(parts)


# ---------- tops ----------

SLEEVES = {
    "short": "M334 600 C298 652 276 770 266 904 L366 922 C368 846 374 776 388 724 Z",
    "elbow": "M330 600 C292 656 268 790 258 1010 L362 1024 C362 900 372 790 388 724 Z",
    "long": ("M334 600 C298 652 272 780 262 920 C256 1080 262 1240 274 1388 L356 1388 "
             "C342 1240 340 1080 350 930 C356 840 370 770 388 724 Z"),
    # outerwear: bulkier, worn over a long-sleeve top
    "outer": ("M322 594 C282 648 256 780 246 922 C240 1080 246 1240 262 1396 L364 1396 "
              "C352 1240 352 1080 360 930 C366 840 380 770 398 724 Z"),
}


def sleeves(kind, color, cuff=False):
    s = pair(SLEEVES[kind], color)
    if cuff and kind in ("long", "outer"):
        y = 1340 if kind == "long" else 1344
        s += "\n  " + pair(f"M{276 if kind == 'long' else 262} {y} L{354 if kind == 'long' else 362} {y}",
                           "none", ' stroke-width="10"')
    if kind == "elbow":  # rolled cuff
        s += "\n  " + pair("M262 960 L362 972", "none", ' stroke-width="10"')
    return s


def top_body(color, hem=1474, flare=0):
    """The front of a top from shoulders to hem. `flare` widens the hem for loose shirts and dresses."""
    l, r = 322 - flare, 672 + flare
    return shape(f"M432 588 L334 600 C356 680 370 770 372 860 C366 1060 {330 - flare // 2} 1300 {l} {hem} "
                 f"L{r} {hem} C{664 + flare // 2} 1300 628 1060 622 860 C624 770 638 680 660 600 "
                 f"L562 588 C540 646 454 646 432 588 Z", color)


def crew_neck(rib=False):
    s = line("M438 594 C472 650 524 650 556 594")
    if rib:
        s += "\n  " + line("M450 596 C478 670 518 670 546 596", 10)
    return s


def collar_and_buttons(hem=1474):
    collar = pair("M432 588 L462 664 L497 626 Z", WHITE)
    buttons = "\n  ".join(f'<circle cx="497" cy="{y}" r="9" fill="{INK}" stroke="none"/>'
                          for y in range(720, hem - 60, 140))
    return collar + "\n  " + line(f"M497 630 L497 {hem}", 10) + "\n  " + buttons


def ribbed_hem(hem=1474):
    return line(f"M326 {hem - 44} L668 {hem - 44}", 10)


def tank(color):
    d = ("M410 588 L438 590 C452 690 542 690 556 590 L584 588 C592 650 608 700 622 744 "
         "C628 1000 664 1300 672 1474 L322 1474 C330 1300 366 1000 372 744 C386 700 402 650 410 588 Z")
    return shape(d, color)


def hood_behind():
    """Hood bunched behind the neck; the head layer is drawn over it."""
    return shape("M380 560 C380 470 430 430 497 430 C564 430 614 470 614 560 C580 600 414 600 380 560 Z",
                 C["mustard"])


def open_jacket(color, hem, collar="lapel"):
    """Two open front panels over the top underneath, plus bulky sleeves."""
    left = (f"M436 584 L322 594 C344 680 360 770 364 860 C356 1060 316 {hem - 300} 306 {hem} "
            f"L458 {hem + 6} C454 1200 450 900 446 700 Z")
    parts = [sleeves("outer", color, cuff=True), pair(left, color)]
    if collar == "lapel":
        parts.append(pair("M436 584 L400 700 L452 760 L446 700 Z", color))
    elif collar == "stand":
        parts.append(pair("M430 520 L436 600 L470 610 L466 530 Z", color))
    return "\n  ".join(parts)


def puffer_lines(hem):
    ys = range(820, hem, 150)
    return "\n  ".join(pair(f"M{350 - (y - 820) // 40} {y} L452 {y}", "none", ' stroke-width="10"') for y in ys)


def beanie(color):
    """Drawn in a separate '-top' layer above the head."""
    return "\n  ".join([
        shape("M286 262 C276 130 360 28 474 26 C592 24 670 120 662 254 C540 232 410 236 286 262 Z", color),
        shape("M282 214 C410 186 540 184 666 206 L664 262 C540 240 410 242 284 268 Z", color),
        line("M330 230 L330 256 M380 220 L380 248 M430 214 L430 242 M480 212 L480 240 M530 212 L530 240 "
             "M580 216 L580 244 M630 222 L630 250", 10),
        f'<circle cx="474" cy="6" r="40" fill="{color}"/>',
    ])


# ---------- outfits (spec.md → Content variation) ----------

def tee_outfit(color):
    return [sleeves("short", color), top_body(color), crew_neck()]


OUTFITS = {
    "hot-1": [shorts(C["lightdenim"], frayed=True), sandals(C["tan"]), tank(C["blush"])],
    "hot-2": [shorts(C["sand"]), sneakers(),
              sleeves("elbow", C["linen"]), top_body(C["linen"], hem=1560, flare=14), collar_and_buttons(1560)],
    "hot-3": [sandals(C["tan"]), sleeves("short", C["lemon"]), top_body(C["lemon"], hem=2080, flare=60), crew_neck()],
    "warm-1": [trousers(C["sand"]), sneakers(), *tee_outfit(C["sage"])],
    "warm-2": [skirt(C["olive"]), sneakers(), *tee_outfit(C["blush"])],
    "warm-3": [jeans(C["lightdenim"]), loafers(C["brown"]),
               sleeves("short", C["slate"]), top_body(C["slate"]), collar_and_buttons()],
    "mild-1": [jeans(C["denim"]), sneakers(), sleeves("long", C["mustard"], cuff=True), top_body(C["mustard"]), crew_neck()],
    "mild-2": [trousers(C["sand"]), sneakers(),
               sleeves("long", C["moss"], cuff=True), top_body(C["moss"]), crew_neck(rib=True), ribbed_hem()],
    "mild-3": [jeans(C["denim"]), boots(C["brown"]), top_body(C["cream"], hem=1500), crew_neck(),
               open_jacket(C["rust"], 1530, collar="lapel")],
    "cold-1": [jeans(C["denim"]), boots(C["brown"]), top_body(C["oat"]), crew_neck(rib=True),
               open_jacket(C["navy"], 1640, collar="stand"), puffer_lines(1640)],
    "cold-2": [trousers(C["charcoal"]), sneakers(), hood_behind(), top_body(C["mustard"]), crew_neck(),
               open_jacket(C["camel"], 2060, collar="lapel")],
    "cold-3": [trousers(C["charcoal"], joggers=True), sneakers(), top_body(C["oat"]), crew_neck(),
               open_jacket(C["olive"], 1520, collar="stand")],
}

# Pieces drawn above the head layer.
TOPS = {"cold-3": [beanie(C["rust"])]}

# First visit: Warm 1 with the right sleeve raised to match body-wave.svg.
WAVE_SLEEVE = "M664 598 C712 586 758 540 786 462 L706 436 C690 490 660 530 610 560 Z"
OUTFITS["wave"] = [trousers(C["sand"]), sneakers(), shape(SLEEVES["short"], C["sage"]),
                   shape(WAVE_SLEEVE, C["sage"]), top_body(C["sage"]), crew_neck()]


def write(name, pieces, note):
    body = "\n  ".join(p for p in pieces if p)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VIEWBOX}">\n'
           f"<!-- {note} Original SVG for WearCast, generated by tools/make-outfits.py. -->\n"
           f'<g stroke="{INK}" stroke-width="14" stroke-linejoin="round" stroke-linecap="round">\n  {body}\n</g>\n</svg>\n')
    (OUT / f"{name}.svg").write_text(svg)


if __name__ == "__main__":
    for key, pieces in OUTFITS.items():
        write(f"outfit-{key}", pieces, f"Outfit {key}.")
    for key, pieces in TOPS.items():
        write(f"outfit-{key}-top", pieces, f"Outfit {key}, pieces above the head.")
    print("wrote", len(OUTFITS) + len(TOPS), "files to", OUT)
