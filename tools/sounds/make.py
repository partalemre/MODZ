"""Synthesize done-ping's sound packs: two short clips each (done, wait), written as 16-bit mono WAV.

Usage: python3 -I tools/sounds/make.py [out-dir]   (default: mods/done-ping/sounds)

Every clip is made here from sine and triangle tones under simple envelopes, with no sample or recording
from anywhere else, so the files are this repository's own work under its MIT licence. The output is
deterministic: the same script always writes the same bytes.
"""
import math
import struct
import sys
import wave
from pathlib import Path

RATE = 22050
PEAK = 0.45  # well under full scale: a notification, not an alarm
MAX_SECONDS = 1.2
FADE_IN = 0.004  # seconds; keeps the first sample from clicking
FADE_OUT = 0.015  # seconds; a note that ends mid-decay closes without a click
TAIL = 0.03  # seconds of silence after the last note


def sine(phase: float) -> float:
    return math.sin(2 * math.pi * phase)


def triangle(phase: float) -> float:
    p = phase % 1.0
    return 4 * p - 1 if p < 0.5 else 3 - 4 * p


def note(freq: float, start: float, length: float, *, wave_fn=sine, decay: float = 6.0, attack: float = FADE_IN,
         overtone: float = 0.0):
    """One tone as (start, samples): a quick or slow attack, an exponential decay, a short close."""
    count = int(length * RATE)
    out = []
    for i in range(count):
        t = i / RATE
        env = min(1.0, t / attack, (length - t) / FADE_OUT) * math.exp(-decay * t)
        tone = wave_fn(freq * t) + overtone * wave_fn(2 * freq * t)
        out.append(env * tone / (1 + overtone))
    return int(start * RATE), out


def mix(notes) -> list:
    end = max(start + len(samples) for start, samples in notes) + int(TAIL * RATE)
    buf = [0.0] * end
    for start, samples in notes:
        for i, value in enumerate(samples):
            buf[start + i] += value
    loudest = max(abs(v) for v in buf) or 1.0
    return [PEAK * v / loudest for v in buf]


# Pitches in Hz (equal temperament, A4 = 440).
A4, D5, E5, G5, A5, C5, C6, E6 = 440.0, 587.33, 659.25, 783.99, 880.0, 523.25, 1046.5, 1318.51

# done resolves downward; wait rises like a question. Each pack keeps one voice.
PACKS = {
    'chime': {
        'done': [note(E6, 0.0, 0.5, overtone=0.3), note(C6, 0.14, 0.7, overtone=0.3)],
        'wait': [note(C6, 0.0, 0.4, overtone=0.3), note(E6, 0.16, 0.6, overtone=0.3)],
    },
    'soft': {
        'done': [note(A4, 0.0, 0.9, decay=3.5, attack=0.08), note(E5, 0.0, 0.9, decay=4.5, attack=0.1)],
        'wait': [note(D5, 0.0, 0.35, decay=7.0, attack=0.05), note(D5, 0.3, 0.5, decay=6.0, attack=0.05)],
    },
    'retro': {
        'done': [note(f, 0.07 * i, 0.12 if i < 3 else 0.3, wave_fn=triangle, decay=4.0) for i, f in enumerate([C5, E5, G5, C6])],
        'wait': [note(A5, 0.0, 0.1, wave_fn=triangle, decay=3.0), note(A5, 0.16, 0.1, wave_fn=triangle, decay=3.0)],
    },
}


def write(path: Path, samples: list) -> None:
    if len(samples) / RATE > MAX_SECONDS:
        raise ValueError(f'{path.name} runs {len(samples) / RATE:.2f}s, over {MAX_SECONDS}s')
    with wave.open(str(path), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(b''.join(struct.pack('<h', round(v * 32767)) for v in samples))


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'mods' / 'done-ping' / 'sounds'
    for pack, clips in PACKS.items():
        (out_dir / pack).mkdir(parents=True, exist_ok=True)
        for kind, notes in clips.items():
            path = out_dir / pack / f'{kind}.wav'
            write(path, mix(notes))
            print(f'{path.relative_to(root) if path.is_relative_to(root) else path}  {path.stat().st_size} bytes')


if __name__ == '__main__':
    main()
