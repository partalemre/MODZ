// The film's instruments: a few oscillators, noise and a kick, summed into stereo and written out as a WAV. All of it
// is arithmetic, so the same year always gets the same sound and nothing is downloaded.

export const RATE = 44_100
const TAU = 2 * Math.PI
const ECHO_S = 0.375
const ECHO_BACK = 0.34
const DUCK = { depth: 0.42, fall: 9 } as const
// Under 1 the sum is left almost as it is; the curve only rounds the loudest hits.
const DRIVE = 0.9
const CEILING = 0.89
const FADE_S = 1.6
const BLOCK = 32

export type Bus = { l: Float32Array; r: Float32Array }
export type Wave = 'sine' | 'saw' | 'square' | 'tri'
export type Note = { at: number; len: number; midi: number; wave: Wave; gain: number; pan?: number; attack?: number; release?: number; decay?: number; cutoff?: number; sweep?: number; detune?: number }
export type Hiss = { at: number; len: number; gain: number; pan?: number; high?: number; low?: number; decay?: number; isRising?: boolean }

export function bus(seconds: number): Bus {
  const count = Math.ceil(seconds * RATE)

  return { l: new Float32Array(count), r: new Float32Array(count) }
}

export const hz = (midi: number): number => 440 * 2 ** ((midi - 69) / 12)

// Rounds a saw's or square's jump so it does not ring where the ear takes it for hiss.
function blep(phase: number, step: number): number {
  if (phase < step) {
    const x = phase / step

    return x + x - x * x - 1
  }
  if (phase > 1 - step) {
    const x = (phase - 1) / step

    return x * x + x + x + 1
  }

  return 0
}

function osc(wave: Wave, phase: number, step: number): number {
  if (wave === 'sine') return Math.sin(TAU * phase)
  if (wave === 'tri') return 1 - 4 * Math.abs(phase - 0.5)
  if (wave === 'saw') return 2 * phase - 1 - blep(phase, step)

  return (phase < 0.5 ? 1 : -1) + blep(phase, step) - blep((phase + 0.5) % 1, step)
}

const sides = (gain: number, pan = 0): { left: number; right: number } => ({ left: gain * Math.cos(((pan + 1) * Math.PI) / 4), right: gain * Math.sin(((pan + 1) * Math.PI) / 4) })

/** One note: an oscillator (two, a little apart, with `detune`) through a low-pass that opens on the attack with `sweep`. */
export function play(out: Bus, n: Note): void {
  const start = Math.round(n.at * RATE)
  const attack = n.attack ?? 0.004
  const release = n.release ?? 0.06
  const count = Math.min(out.l.length - start, Math.round((n.len + release) * RATE))
  const voices = n.detune === undefined ? [0] : [-n.detune, n.detune]
  const { left, right } = sides(n.gain / voices.length, n.pan)
  for (const cents of voices) {
    const step = hz(n.midi + cents / 100) / RATE
    let phase = cents > 0 ? 0.37 : 0
    let low = 0
    let mix = 1
    // The filter opens slowly, so its setting is worked out once a block; the fall is one multiply a sample.
    const fall = n.decay === undefined ? 1 : Math.exp(-n.decay / RATE)
    let faded = 1
    for (let i = 0; i < count; i += 1) {
      const t = i / RATE
      if (n.cutoff !== undefined && i % BLOCK === 0) mix = 1 - Math.exp((-TAU * n.cutoff * (1 + (n.sweep ?? 0) * Math.exp(-t * 14))) / RATE)
      const env = Math.min(1, t / attack) * (t > n.len ? Math.max(0, 1 - (t - n.len) / release) : 1) * faded
      faded *= fall
      low += (osc(n.wave, phase, step) - low) * mix
      phase += step
      if (phase >= 1) phase -= 1
      out.l[start + i] = (out.l[start + i] as number) + low * env * left
      out.r[start + i] = (out.r[start + i] as number) + low * env * right
    }
  }
}

/** Noise between `high` and `low`: hats, claps, crashes, and with `isRising` the swell before a page turns. */
export function hiss(out: Bus, n: Hiss): void {
  const start = Math.round(n.at * RATE)
  const count = Math.min(out.l.length - start, Math.round(n.len * RATE))
  const { left, right } = sides(n.gain, n.pan)
  const lowMix = 1 - Math.exp((-TAU * (n.low ?? 16_000)) / RATE)
  const highMix = 1 - Math.exp((-TAU * (n.high ?? 20)) / RATE)
  let seed = (start * 2_654_435_761) >>> 0 || 1
  let low = 0
  let under = 0
  for (let i = 0; i < count; i += 1) {
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    seed >>>= 0
    low += (seed / 2_147_483_648 - 1 - low) * lowMix
    under += (low - under) * highMix
    const share = i / count
    const env = n.isRising === true ? share * share : Math.exp(-(i / RATE) * (n.decay ?? 0)) * Math.min(1, (1 - share) * 20)
    out.l[start + i] = (out.l[start + i] as number) + (low - under) * env * left
    out.r[start + i] = (out.r[start + i] as number) + (low - under) * env * right
  }
}

/** A kick: a sine that drops from a knock to a thud. */
export function kick(out: Bus, at: number, gain: number): void {
  const start = Math.round(at * RATE)
  const count = Math.min(out.l.length - start, Math.round(0.34 * RATE))
  let phase = 0
  for (let i = 0; i < count; i += 1) {
    const t = i / RATE
    phase += (46 + 120 * Math.exp(-t * 36)) / RATE
    const sample = Math.sin(TAU * phase) * Math.exp(-t * 9) * Math.min(1, (count - i) / 400) * gain
    out.l[start + i] = (out.l[start + i] as number) + sample
    out.r[start + i] = (out.r[start + i] as number) + sample
  }
}

// The echo crosses sides each time it comes back.
function echo(wet: Bus): void {
  const gap = Math.round(ECHO_S * RATE)
  for (let i = gap; i < wet.l.length; i += 1) {
    wet.l[i] = (wet.l[i] as number) + (wet.r[i - gap] as number) * ECHO_BACK
    wet.r[i] = (wet.r[i] as number) + (wet.l[i - gap] as number) * ECHO_BACK
  }
}

// How far the music steps back for each kick, so the kick is felt and not just heard.
function ducking(length: number, kicks: readonly number[]): Float32Array {
  const gain = new Float32Array(length).fill(1)
  for (const at of kicks) {
    const start = Math.round(at * RATE)
    const count = Math.min(length - start, Math.round(0.4 * RATE))
    for (let i = 0; i < count; i += 1) gain[start + i] = Math.min(gain[start + i] as number, 1 - DUCK.depth * Math.exp((-i / RATE) * DUCK.fall))
  }

  return gain
}

export type Mix = { music: Bus; wet: Bus; drums: Bus; kicks: readonly number[] }

/** The buses as one track: echo on the wet one, the music ducked under the kicks, loud but never clipped, faded at the end. */
export function mixdown(m: Mix): Bus {
  echo(m.wet)
  const length = m.music.l.length
  const duck = ducking(length, m.kicks)
  const out: Bus = { l: new Float32Array(length), r: new Float32Array(length) }
  let peak = 0
  for (const side of ['l', 'r'] as const) {
    for (let i = 0; i < length; i += 1) {
      const sample = Math.tanh((((m.music[side][i] as number) + (m.wet[side][i] as number)) * (duck[i] as number) + (m.drums[side][i] as number)) * DRIVE)
      out[side][i] = sample
      peak = Math.max(peak, Math.abs(sample))
    }
  }
  const fade = Math.round(FADE_S * RATE)
  for (const side of ['l', 'r'] as const) {
    for (let i = 0; i < length; i += 1) out[side][i] = ((out[side][i] as number) * CEILING * Math.min(1, (length - i) / fade)) / Math.max(peak, 1e-6)
  }

  return out
}

const CHUNK = 24_000

/** A 16-bit stereo WAV in base64: the engine writes text, and `base64 -d` turns it back. */
export function wavBase64(track: Bus): string {
  const frames = track.l.length
  const bytes = new Uint8Array(44 + frames * 4)
  const view = new DataView(bytes.buffer)
  const tag = (at: number, text: string): void => [...text].forEach((char, index) => view.setUint8(at + index, char.charCodeAt(0)))
  tag(0, 'RIFF')
  view.setUint32(4, 36 + frames * 4, true)
  tag(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 2, true)
  view.setUint32(24, RATE, true)
  view.setUint32(28, RATE * 4, true)
  view.setUint16(32, 4, true)
  view.setUint16(34, 16, true)
  tag(36, 'data')
  view.setUint32(40, frames * 4, true)
  for (let i = 0; i < frames; i += 1) {
    view.setInt16(44 + i * 4, Math.round((track.l[i] as number) * 32_767), true)
    view.setInt16(46 + i * 4, Math.round((track.r[i] as number) * 32_767), true)
  }
  let text = ''
  for (let at = 0; at < bytes.length; at += CHUNK) text += btoa(String.fromCharCode(...bytes.subarray(at, at + CHUNK)))

  return text
}
