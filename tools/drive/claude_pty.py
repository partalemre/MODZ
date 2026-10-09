"""Drive a real `claude` CLI in a pseudo-terminal and screenshot its screen.

Usage: python claude_pty.py <script.json>
script.json: {"cwd": "...", "args": ["--model", "haiku"], "cols": 140, "rows": 46, "out": "dir",
              "steps": [{"wait": 8}, {"type": "/modz"}, {"key": "enter"}, {"shot": "modz"}, {"until": "text", "timeout": 60}]}
Needs `pyte` and Pillow (run with the scratch venv). Every shot is a colored PNG of the emulated screen.
"""
import json
import os
import pty
import select
import signal
import fcntl
import struct
import sys
import termios
import time
from pathlib import Path

import pyte
from PIL import Image, ImageDraw, ImageFont

FONT = "/System/Library/Fonts/Menlo.ttc"
FONT_SIZE = 15
CELL_W, CELL_H = 9, 19
BG, FG = (21, 21, 21), (236, 236, 236)
KEYS = {"enter": "\r", "esc": "\x1b", "tab": "\t", "up": "\x1b[A", "down": "\x1b[B", "left": "\x1b[D",
        "right": "\x1b[C", "ctrl-c": "\x03", "backspace": "\x7f", "space": " "}
NAMED = {"black": (0, 0, 0), "red": (205, 49, 49), "green": (13, 188, 121), "brown": (229, 229, 16),
         "yellow": (229, 229, 16), "blue": (36, 114, 200), "magenta": (188, 63, 188), "cyan": (17, 168, 205),
         "white": (229, 229, 229), "brightblack": (102, 102, 102), "brightred": (241, 76, 76),
         "brightgreen": (35, 209, 139), "brightyellow": (245, 245, 67), "brightblue": (59, 142, 234),
         "brightmagenta": (214, 112, 214), "brightcyan": (41, 184, 219), "brightwhite": (255, 255, 255)}


def rgb(value, fallback):
    if value in (None, "default"):
        return fallback
    if value in NAMED:
        return NAMED[value]
    if len(value) == 6:
        try:
            return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))
        except ValueError:
            return fallback
    return fallback


def render(screen, path):
    font = ImageFont.truetype(FONT, FONT_SIZE)
    bold = ImageFont.truetype(FONT, FONT_SIZE, index=1)
    image = Image.new("RGB", (screen.columns * CELL_W + 20, screen.lines * CELL_H + 20), BG)
    draw = ImageDraw.Draw(image)
    for y in range(screen.lines):
        row = screen.buffer[y]
        for x in range(screen.columns):
            char = row[x]
            fg, bg = rgb(char.fg, FG), rgb(char.bg, BG)
            if char.reverse:
                fg, bg = bg, fg
            left, top = 10 + x * CELL_W, 10 + y * CELL_H
            if bg != BG:
                draw.rectangle([left, top, left + CELL_W, top + CELL_H], fill=bg)
            if char.data.strip():
                draw.text((left, top + 1), char.data, font=bold if char.bold else font, fill=fg)
    image.save(path)


class Session:
    def __init__(self, spec):
        self.cols, self.rows = spec.get("cols", 140), spec.get("rows", 46)
        self.screen = pyte.Screen(self.cols, self.rows)
        self.stream = pyte.ByteStream(self.screen)
        pid, fd = pty.fork()
        if pid == 0:
            os.chdir(spec["cwd"])
            clean = {k: v for k, v in os.environ.items() if not k.startswith(("CLAUDE", "ANTHROPIC", "MCP_"))}
            env = dict(clean, TERM="xterm-256color", COLORTERM="truecolor", COLUMNS=str(self.cols), LINES=str(self.rows))
            os.execvpe("claude", ["claude", *spec.get("args", [])], env)
        self.pid, self.fd = pid, fd
        fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", self.rows, self.cols, 0, 0))

    def pump(self, seconds):
        end = time.time() + seconds
        while time.time() < end:
            ready, _, _ = select.select([self.fd], [], [], 0.1)
            if ready:
                try:
                    self.stream.feed(os.read(self.fd, 65536))
                except OSError:
                    return

    def text(self):
        return "\n".join(self.screen.display)

    def send(self, data):
        os.write(self.fd, data.encode())

    def close(self):
        try:
            os.kill(self.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass


def run(spec):
    out = Path(spec["out"])
    out.mkdir(parents=True, exist_ok=True)
    session = Session(spec)
    try:
        for step in spec["steps"]:
            if "wait" in step:
                session.pump(step["wait"])
            elif "type" in step:
                for char in step["type"]:
                    session.send(char)
                    session.pump(0.02)
            elif "key" in step:
                session.send(KEYS[step["key"]])
                session.pump(0.3)
            elif "until" in step:
                end = time.time() + step.get("timeout", 60)
                while step["until"] not in session.text() and time.time() < end:
                    session.pump(0.5)
            elif "shot" in step:
                session.pump(step.get("settle", 1.0))
                render(session.screen, out / f"{step['shot']}.png")
                (out / f"{step['shot']}.txt").write_text(session.text())
                print(out / f"{step['shot']}.png", flush=True)
    finally:
        session.close()


if __name__ == "__main__":
    run(json.loads(Path(sys.argv[1]).read_text()))
