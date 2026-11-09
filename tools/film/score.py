"""The film's sound: a warm pad and a soft pulse, plus a cue for every event the film reports (out/cues.json).

Usage: python3 -I tools/film/score.py   (render.mjs writes out/cues.json first; this writes out/score.wav)

Like tools/sounds/make.py, every sound is synthesized here from sine and triangle tones and seeded noise under
simple envelopes, except the turn-done chime, which is done-ping's own clip. Deterministic: same cues, same bytes.
"""
import json
import wave
from pathlib import Path

import numpy as np

RATE = 48000
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
BEAT = 60 / 96  # 96 bpm; a bar of four is 2.5 s
RNG = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def env(n, attack, release):
    e = np.ones(n)
    a, r = min(n, int(attack * RATE)), min(n, int(release * RATE))
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] *= np.linspace(1, 0, r)
    return e


def tone(freq, length, wave='sine', decay=0.0, attack=0.005, release=0.05, detune=0.0):
    t = np.arange(int(length * RATE)) / RATE
    ph = freq * (1 + detune) * t
    w = np.sin(2 * np.pi * ph) if wave == 'sine' else 4 * np.abs((ph % 1) - 0.5) - 1
    return w * env(len(t), attack, release) * np.exp(-decay * t)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / RATE)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):  # one-pole: small buffers only
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def noise(length, cutoff, attack, release):
    n = int(length * RATE)
    return lowpass(RNG.standard_normal(n), cutoff) * env(n, attack, release)


def sweep(f0, f1, length, decay=0.0):
    t = np.arange(int(length * RATE)) / RATE
    f = np.geomspace(f0, f1, len(t))
    return np.sin(2 * np.pi * np.cumsum(f) / RATE) * env(len(t), 0.01, 0.08) * np.exp(-decay * t)


def clip(name):
    with wave.open(str(ROOT / 'mods/done-ping/sounds' / name)) as w:
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
        return np.interp(np.arange(0, len(data), w.getframerate() / RATE), np.arange(len(data)), data)


def lay(*parts):
    out = np.zeros(max(len(p) for p in parts))
    for p in parts: out[:len(p)] += p
    return out


def cue(kind, i=0):
    if kind == 'rise': return lay(0.5 * sweep(260, 780, 0.9, decay=1.5), 0.25 * noise(0.9, 3000, 0.6, 0.3))
    if kind == 'whoosh': return 0.6 * noise(0.7, 1800, 0.35, 0.35)
    if kind == 'land': return lay(0.9 * sweep(150, 55, 0.18, decay=14), 0.15 * noise(0.04, 5000, 0.001, 0.03))
    if kind == 'tick': return lay(0.35 * tone(2100, 0.05, decay=60), 0.15 * tone(4200, 0.03, decay=90))
    if kind == 'slide': return 0.35 * noise(0.32, 2400, 0.12, 0.2)
    if kind == 'press': return lay(0.5 * tone(1300, 0.04, decay=80), 0.5 * sweep(180, 90, 0.08, decay=30))
    if kind == 'open': return lay(0.4 * noise(0.5, 1600, 0.2, 0.3), 0.3 * tone(hz(81), 0.5, 'triangle', decay=6))
    if kind == 'done': return 0.9 * clip('chime/done.wav')
    if kind == 'pass': return 0.8 * clip('soft/done.wav')
    if kind == 'slam': return lay(1.0 * sweep(110, 42, 0.32, decay=9), 0.35 * noise(0.12, 1200, 0.002, 0.1))
    if kind == 'rewind': return 0.45 * sweep(900, 220, 0.8, decay=1.2)
    if kind == 'nap': return lay(0.35 * tone(hz(62), 0.6, decay=4, attack=0.05), 0.25 * tone(hz(57), 0.8, decay=3, attack=0.2))
    if kind == 'drop': return 0.45 * tone(hz(86), 0.3, 'triangle', decay=10)
    if kind == 'pip': return 0.18 * tone(hz(74 + [0, 2, 4, 7, 9, 12][i % 6]), 0.12, 'triangle', decay=24)
    if kind == 'type':
        out = np.zeros(int(1.7 * RATE))
        for k in range(38):
            at = int((k * 1.6 / 38 + RNG.uniform(0, 0.012)) * RATE)
            c = 0.22 * tone(RNG.uniform(1800, 2600), 0.03, decay=120)
            out[at:at + len(c)] += c
        return out
    if kind == 'end': return 0.9 * clip('chime/done.wav')
    raise ValueError(kind)


CHORDS = [[50, 57, 62, 66, 69, 76], [47, 54, 59, 62, 66, 73], [43, 50, 55, 59, 62, 69], [45, 52, 57, 61, 64, 71]]  # D, Bm, G, A


def music(duration, t_nap, t_wake, t_word):
    n = int(duration * RATE)
    left, right = np.zeros(n), np.zeros(n)
    bar = 4 * BEAT
    for b in range(int(duration / bar) + 1):
        start = b * bar
        chord = CHORDS[b % 4] if start < t_word else CHORDS[0]
        for m in chord:
            for side, det in ((left, -0.0025), (right, 0.0025)):
                v = 0.07 * tone(hz(m), bar + 0.6, attack=0.7, release=0.9, detune=det)
                v += 0.02 * tone(hz(m + 12), bar + 0.6, attack=0.9, release=0.9, detune=-det)
                a = int(start * RATE)
                side[a:a + len(v)] += v[:max(0, n - a)]
    pulse = np.zeros(n)
    for k in range(int(duration / (BEAT / 2))):
        t = k * BEAT / 2
        if t < 6.6 or t_word + 1 < t: continue
        chord = CHORDS[int(t / bar) % 4]
        p = 0.05 * tone(hz(chord[3 + k % 3] + 12), 0.25, 'triangle', decay=12)
        a = int(t * RATE)
        pulse[a:a + len(p)] += p[:max(0, n - a)]
        if k % 2 == 0 and 12.8 < t < t_word:
            kick = 0.16 * sweep(95, 45, 0.22, decay=16)
            pulse[a:a + len(kick)] += kick[:max(0, n - a)]
    # The nap: the pulse rests while the agent sleeps.
    t = np.arange(n) / RATE
    duck = 1 - 0.85 * np.clip(np.minimum((t - t_nap) / 0.4, (t_wake - t) / 0.4), 0, 1)
    fade = np.clip((duration - t) / 2.5, 0, 1) * np.clip(t / 1.5, 0, 1)
    return (left + pulse * duck) * fade, (right + pulse * duck) * fade


def main():
    film = json.loads((HERE / 'out/cues.json').read_text())
    duration, cues = film['duration'], film['cues']
    times = {c['kind']: c['t'] for c in cues}
    left, right = music(duration, times['nap'], times['nap'] + 2.4, max(c['t'] for c in cues if c['kind'] == 'rise'))
    fx = np.zeros_like(left)
    pips = 0
    for c in sorted(cues, key=lambda c: c['t']):
        s = cue(c['kind'], pips)
        pips += c['kind'] == 'pip'
        a = int(c['t'] * RATE)
        fx[a:a + len(s)] += s[:max(0, len(fx) - a)]
    mix = np.stack([left + 0.8 * fx, right + 0.8 * fx], axis=1)
    mix *= 0.89 / np.max(np.abs(mix))  # peak at -1 dBFS
    with wave.open(str(HERE / 'out/score.wav'), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    print(f'score.wav · {duration:.1f}s · {len(cues)} cues')


if __name__ == '__main__':
    main()
