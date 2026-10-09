"""Render mod UI trees (as `ui.drawn()` returns them) to PNG, approximating the desktop Code tab.

Usage: python3 -I render.py <dump.txt> <out-dir> [--theme dark|light] [--width 760]
<dump.txt> holds lines `@@TREE@@<label>@@<json>`; each label becomes <out-dir>/<label>.png.
Svg elements are drawn exactly; Box/Text/Button are an approximation (1 layout unit = 8px).
"""
import html
import os
import shutil
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

MAC_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def find_chrome() -> str:
    """The browser that screenshots the page: $CHROME, then macOS Chrome, then a chromium on PATH."""
    for path in (os.environ.get("CHROME"), MAC_CHROME, "/opt/pw-browsers/chromium", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"):
        if path and os.path.exists(path):
            return path
    for name in ("chromium", "chromium-browser", "google-chrome"):
        if shutil.which(name):
            return shutil.which(name)
    raise SystemExit("render.py: no Chrome/Chromium found; set CHROME=/path/to/chrome")


CHROME = find_chrome()
UNIT = 8
THEMES = {
    "dark": {"bg": "#151515", "text": "#ececec", "dim": "#878785", "surface": "#202020", "line": "#2e2e2e",
             "primary_bg": "#ececec", "primary_fg": "#151515"},
    "light": {"bg": "#faf9f5", "text": "#1f1e1d", "dim": "#73726c", "surface": "#f0eee6", "line": "#e0ddd4",
              "primary_bg": "#1f1e1d", "primary_fg": "#faf9f5"},
}
THEME_KEYS = {
    "success": "#4eba65", "error": "#ff6b80", "warning": "#ffc107", "claude": "#d97757", "suggestion": "#b1b9f9",
    "permission": "#b1b9f9", "subtle": "#878785", "inactive": "#878785", "merged": "#af87ff", "remember": "#b1b9f9",
    "planMode": "#48968c", "autoAccept": "#af87ff", "diffAdded": "#225c2b", "diffRemoved": "#7a2936",
}
SPACING = {"padding": "padding", "paddingX": ("padding-left", "padding-right"), "paddingY": ("padding-top", "padding-bottom"),
           "paddingTop": "padding-top", "paddingBottom": "padding-bottom", "paddingLeft": "padding-left",
           "paddingRight": "padding-right", "margin": "margin", "marginX": ("margin-left", "margin-right"),
           "marginY": ("margin-top", "margin-bottom"), "marginTop": "margin-top", "marginBottom": "margin-bottom",
           "marginLeft": "margin-left", "marginRight": "margin-right", "gap": "gap", "rowGap": "row-gap",
           "columnGap": "column-gap"}


def color(value, theme):
    if not value:
        return None
    return THEME_KEYS.get(value, THEMES[theme].get(value, value))


def size(value):
    if isinstance(value, str):
        return value
    return f"{value * UNIT}px"


def box_style(props, theme):
    style = [f"display:{props.get('display', 'flex')}", f"flex-direction:{props.get('flexDirection', 'row')}"]
    for key, css in SPACING.items():
        if key in props:
            for name in (css if isinstance(css, tuple) else (css,)):
                style.append(f"{name}:{props[key] * UNIT}px")
    for key in ("width", "height", "minWidth", "minHeight"):
        if key in props:
            css = re.sub(r"([A-Z])", r"-\1", key).lower()
            style.append(f"{css}:{size(props[key])}")
    for key in ("alignItems", "justifyContent", "alignSelf", "flexWrap", "flexGrow", "flexShrink"):
        if key in props:
            css = re.sub(r"([A-Z])", r"-\1", key).lower()
            style.append(f"{css}:{props[key]}")
    if props.get("backgroundColor"):
        style.append(f"background:{color(props['backgroundColor'], theme)}")
    if props.get("borderStyle"):
        border = color(props.get("borderColor"), theme) or THEMES[theme]["line"]
        radius = "10px" if props["borderStyle"] == "round" else "2px"
        style.append(f"border:1px solid {border};border-radius:{radius}")
    if props.get("overflow") == "hidden":
        style.append("overflow:hidden")
    return ";".join(style)


def text_style(props, theme):
    style = []
    if props.get("color"):
        style.append(f"color:{color(props['color'], theme)}")
    if props.get("dimColor"):
        style.append(f"color:{THEMES[theme]['dim']}")
    if props.get("backgroundColor"):
        style.append(f"background:{color(props['backgroundColor'], theme)};border-radius:4px;padding:0 3px")
    if props.get("bold"):
        style.append("font-weight:600")
    if props.get("italic"):
        style.append("font-style:italic")
    deco = [name for name in ("underline", "strikethrough") if props.get(name)]
    if deco:
        style.append("text-decoration:" + " ".join("line-through" if d == "strikethrough" else d for d in deco))
    return ";".join(style)


def button(props, theme, inner=""):
    label = html.escape(props.get("label") or "") or inner
    hotkey = props.get("hotkey")
    variant = props.get("variant")
    t = THEMES[theme]
    if variant == "primary":
        style = f"background:{t['primary_bg']};color:{t['primary_fg']};border:1px solid {t['primary_bg']}"
    elif props.get("plain"):
        style = f"background:transparent;color:{t['dim']};border:1px solid transparent"
    else:
        style = f"background:transparent;color:{t['text']};border:1px solid {t['line']}"
    key = f"<span style='opacity:.5;margin-left:6px'>{html.escape(hotkey)}</span>" if hotkey else ""
    return f"<button style='{style};border-radius:8px;padding:6px 14px;font:inherit;font-weight:500'>{label}{key}</button>"


def node(element, theme):
    if element is None or element is False:
        return ""
    if isinstance(element, (str, int, float)):
        return html.escape(str(element))
    if isinstance(element, list):
        return "".join(node(child, theme) for child in element)
    kind, props = element.get("type"), element.get("props") or {}
    children = element.get("children") or props.get("children") or []
    inner = node(children, theme)
    if kind == "Box":
        return f"<div style='{box_style(props, theme)}'>{inner}</div>"
    if kind == "Text":
        return f"<span style='{text_style(props, theme)};white-space:pre-wrap'>{inner}</span>"
    if kind == "Button":
        return button(props, theme, inner)
    if kind == "Svg":
        dims = "".join(f"{k}:{props[k]}px;" for k in ("width", "height") if props.get(k))
        return f"<div style='{dims}display:inline-block;line-height:0'>{props.get('source', '')}</div>"
    if kind in ("Code", "Markdown"):
        source = html.escape(props.get("source") or props.get("text") or inner)
        return f"<pre style='margin:0;font:12.5px ui-monospace,Menlo;white-space:pre-wrap'>{source}</pre>"
    if kind in ("Input", "Select"):
        value = html.escape(str(props.get("value") or props.get("placeholder") or ""))
        return f"<div style='border:1px solid {THEMES[theme]['line']};border-radius:8px;padding:6px 10px;color:{THEMES[theme]['dim']}'>{value}</div>"
    if kind == "Link":
        return f"<a style='color:#8ab4f8'>{inner or html.escape(props.get('url', ''))}</a>"
    return f"<div data-kind='{html.escape(str(kind))}'>{inner}</div>"


def page(tree, theme, width):
    t = THEMES[theme]
    return (f"<html><body style='margin:0;background:{t['bg']};color:{t['text']};"
            f"font:14px/1.45 -apple-system,BlinkMacSystemFont,Inter,sans-serif'>"
            f"<div style='width:{width}px;padding:20px'>{node(tree, theme)}</div></body></html>")


# Svg colours follow prefers-color-scheme; pin it to the theme so the OS appearance cannot leak in.
SCHEME = {"dark": "0", "light": "1"}


def shoot(markup, out, width, theme="dark"):
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as handle:
        handle.write(markup)
    subprocess.run([CHROME, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", f"--window-size={width + 40},1400",
                    f"--blink-settings=preferredColorScheme={SCHEME[theme]}",
                    f"--screenshot={out}", f"file://{handle.name}"], capture_output=True, timeout=60, check=False)
    trim(out)


def trim(path):
    from PIL import Image, ImageChops
    image = Image.open(path).convert("RGB")
    background = Image.new("RGB", image.size, image.getpixel((0, 0)))
    box = ImageChops.difference(image, background).getbbox()
    if box:
        image.crop((0, 0, image.size[0], min(image.size[1], box[3] + 20))).save(path)


def main():
    args = sys.argv[1:]
    theme = args[args.index("--theme") + 1] if "--theme" in args else "dark"
    width = int(args[args.index("--width") + 1]) if "--width" in args else 760
    out_dir = Path(args[1])
    out_dir.mkdir(parents=True, exist_ok=True)
    for line in Path(args[0]).read_text().splitlines():
        match = re.search(r"@@TREE@@(.+?)@@(\{.*\})\s*$", line)
        if not match:
            continue
        label = re.sub(r"[^\w.-]+", "-", match.group(1))
        out = out_dir / f"{label}.png"
        shoot(page(json.loads(match.group(2)), theme, width), out, width, theme)
        print(out)


if __name__ == "__main__":
    main()
