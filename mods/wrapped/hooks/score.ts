import { BEAT_S } from './film-parts'
import { bus, hiss, kick, mixdown, play, wavBase64 } from './synth'
import type { Bus, Wave } from './synth'

// The film's music: one song in C at the film's beat, a new arrangement for every page. A page is whole bars long, so
// each turn of the page lands on a downbeat; the hook comes back in different voices so it stays one tune.

const BAR = BEAT_S * 4
const STEP = BAR / 16
const BAR_STEPS = 16
const COUNT_STEPS = { from: 2, to: 12 } as const
// The tune and its runs sit well over the bass: a phone's speaker plays little under them.
const ARP_GAIN = 1.7
const LEAD_GAIN = 1.6

type Chord = { bass: number; tones: readonly number[] }
const AM: Chord = { bass: 33, tones: [57, 60, 64, 67] }
const F: Chord = { bass: 29, tones: [53, 57, 60, 64] }
const C: Chord = { bass: 36, tones: [55, 60, 64, 67] }
const G: Chord = { bass: 31, tones: [55, 59, 62, 67] }

type Tune = ReadonlyArray<readonly [step: number, midi: number, steps: number]>
// The hook and its answer, two bars each, in the five notes that sit on every chord here.
const HOOK: Tune = [[0, 76, 2], [2, 79, 2], [4, 81, 3], [7, 79, 1], [8, 76, 4], [12, 74, 2], [14, 72, 2], [16, 74, 2], [18, 76, 2], [20, 79, 4], [24, 76, 6]]
const ANSWER: Tune = [[0, 81, 2], [2, 79, 2], [4, 76, 4], [8, 79, 2], [10, 81, 2], [12, 84, 4], [16, 81, 2], [18, 79, 2], [20, 76, 2], [22, 74, 2], [24, 72, 8]]
const PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93] as const

type Arp = { order: readonly number[]; lift: number; wave: Wave; gain: number; span?: number }
type Lead = { tune: Tune; wave: Wave; lift: number; gain: number }
type Style = {
  kick?: string
  snare?: string
  clap?: string
  hat?: string
  bass?: string
  bassWave?: Wave
  stab?: string
  arp?: Arp
  lead?: Lead
  pad?: number
  keys?: number
  /** How open the filters are: under 1 is a darker page. */
  tone?: number
  /** The bar the band comes in at; the bars before it build. */
  from?: number
  hasCount?: boolean
  hasRing?: boolean
  end?: 'riser' | 'roll'
}

const FOUR = 'x...x...x...x...'
const BACK = '....x.......x...'
const OFF = '..x...x...x...x.'
const OPEN = '..o...o...o...o.'
const EIGHT = 'x.x.x.x.x.x.x.x.'
const SIXTEEN = 'xxxxxxxxxxxxxxxx'
const BOUNCE = 'x.o.x.o.x.o.x.o.'
const PUSH = 'x..x..x...x..x..'
const UP = [0, 1, 2, 3] as const
const UP_DOWN = [0, 1, 2, 3, 2, 1] as const
const CLIMB = [0, 1, 2, 3, 4, 5, 6, 7] as const

const STYLES: Record<string, Style> = {
  intro: { pad: 2, keys: 1.4, arp: { order: UP, span: 2, lift: 12, wave: 'tri', gain: 0.3 }, end: 'riser' },
  prompts: { kick: FOUR, hat: OFF, bass: EIGHT, pad: 0.6, arp: { order: UP_DOWN, lift: 12, wave: 'saw', gain: 0.11 }, hasCount: true },
  day: { kick: FOUR, clap: BACK, hat: OFF, bass: EIGHT, pad: 0.7, arp: { order: [0, 2, 1, 3], span: 2, lift: 12, wave: 'saw', gain: 0.09 }, lead: { tune: HOOK, wave: 'tri', lift: 0, gain: 0.21 } },
  weekday: { kick: FOUR, clap: BACK, hat: SIXTEEN, bass: 'x..x..x.x..x..x.', stab: '..x..x....x..x..', pad: 0.5 },
  hour: { kick: 'x.........x.....', snare: '........x.......', hat: BACK, pad: 1, keys: 1, lead: { tune: ANSWER, wave: 'sine', lift: -12, gain: 0.24 }, tone: 0.45 },
  projects: { kick: FOUR, clap: BACK, hat: OPEN, bass: BOUNCE, pad: 0.6, arp: { order: UP, lift: 24, wave: 'saw', gain: 0.07 }, lead: { tune: HOOK, wave: 'saw', lift: 0, gain: 0.12 } },
  months: { kick: FOUR, hat: EIGHT, bass: EIGHT, pad: 0.7, arp: { order: CLIMB, lift: 12, wave: 'saw', gain: 0.1 }, end: 'roll' },
  tools: { kick: PUSH, clap: BACK, hat: SIXTEEN, bass: PUSH, stab: '..x...x.....x.x.', pad: 0.4 },
  code: { kick: FOUR, hat: SIXTEEN, bass: EIGHT, arp: { order: [0, 4, 2, 5, 1, 4, 3, 6], lift: 12, wave: 'square', gain: 0.07 }, hasCount: true },
  crew: { kick: FOUR, snare: '....x..x....x.xx', bass: BOUNCE, bassWave: 'square', arp: { order: UP_DOWN, span: 2, lift: 12, wave: 'square', gain: 0.06 }, lead: { tune: HOOK, wave: 'square', lift: 0, gain: 0.11 }, hasCount: true },
  hardest: { kick: FOUR, clap: BACK, hat: OFF, bass: 'xxx.xxx.xxx.xxo.', lead: { tune: ANSWER, wave: 'saw', lift: -12, gain: 0.13 }, tone: 0.7, hasCount: true },
  model: { kick: 'x.......x.......', hat: EIGHT, bass: 'x.......x.......', pad: 1, keys: 1, lead: { tune: ANSWER, wave: 'tri', lift: 0, gain: 0.19 } },
  fun: { kick: FOUR, clap: BACK, hat: 'x.xxx.xxx.xxx.xx', bass: BOUNCE, stab: OFF, lead: { tune: ANSWER, wave: 'square', lift: 0, gain: 0.1 } },
  persona: { from: 1, kick: FOUR, clap: BACK, hat: OPEN, bass: EIGHT, pad: 1.4, keys: 1, arp: { order: UP, lift: 24, wave: 'saw', gain: 0.07 }, lead: { tune: HOOK, wave: 'saw', lift: 0, gain: 0.13 } },
  summary: { kick: FOUR, clap: BACK, hat: OPEN, bass: BOUNCE, pad: 1, arp: { order: UP_DOWN, lift: 12, wave: 'saw', gain: 0.09 }, lead: { tune: HOOK, wave: 'tri', lift: 0, gain: 0.2 }, hasRing: true },
}

// Pages answer each other, two chords a page; the last two walk home to C.
function chordsOf(key: string, index: number, bars: number): Chord[] {
  const pair = key === 'intro' ? [F, G] : key === 'persona' ? [F, G, AM] : key === 'summary' ? [F, G, C] : index % 2 === 1 ? [AM, F] : [C, G]

  return Array.from({ length: bars }, (_, bar) => pair[Math.min(bar, pair.length - 1)] as Chord)
}

type Buses = { music: Bus; wet: Bus; drums: Bus; kicks: number[] }
type Bar = { at: number; chord: Chord; style: Style; tone: number }

const hits = (pattern: string | undefined, mark: string): number[] => [...(pattern ?? '')].flatMap((char, step) => (char === mark ? [step] : []))

function drumBar(b: Buses, { at, style }: Bar): void {
  for (const step of hits(style.kick, 'x')) {
    kick(b.drums, at + step * STEP, 0.7)
    b.kicks.push(at + step * STEP)
  }
  for (const step of hits(style.snare, 'x')) {
    hiss(b.drums, { at: at + step * STEP, len: 0.2, gain: 0.3, high: 1400, decay: 20 })
    play(b.drums, { at: at + step * STEP, len: 0.05, midi: 55, wave: 'tri', gain: 0.22, decay: 30 })
  }
  for (const step of hits(style.clap, 'x')) hiss(b.drums, { at: at + step * STEP, len: 0.22, gain: 0.34, high: 900, low: 5000, decay: 24 })
  for (const step of hits(style.hat, 'x')) hiss(b.drums, { at: at + step * STEP, len: 0.05, gain: step % 4 === 0 ? 0.26 : 0.18, high: 7000, decay: 70, pan: 0.25 })
  for (const step of hits(style.hat, 'o')) hiss(b.drums, { at: at + step * STEP, len: 0.22, gain: 0.18, high: 6000, decay: 13, pan: -0.25 })
}

function bassBar(b: Buses, { at, chord, style, tone }: Bar): void {
  for (const mark of ['x', 'o'] as const) {
    for (const step of hits(style.bass, mark)) {
      const midi = chord.bass + (mark === 'o' ? 12 : 0)
      play(b.music, { at: at + step * STEP, len: STEP * 1.5, midi: midi + 12, wave: style.bassWave ?? 'saw', gain: 0.26, cutoff: 750 * tone, sweep: 2.5 })
      play(b.music, { at: at + step * STEP, len: STEP * 1.5, midi, wave: 'sine', gain: 0.2 })
    }
  }
}

function chordBar(b: Buses, { at, chord, style, tone }: Bar): void {
  chord.tones.forEach((midi, index) => {
    const pan = (index - 1.5) * 0.4
    if (style.pad !== undefined) play(b.music, { at, len: BAR, midi, wave: 'saw', gain: style.pad * 0.13, pan, attack: 0.25, release: 0.5, cutoff: 2600 * tone, detune: 9 })
    for (const step of style.keys === undefined ? [] : [0, 6, 10]) play(b.wet, { at: at + step * STEP, len: 0.5, midi, wave: 'tri', gain: (style.keys ?? 0) * 0.13, pan: -pan, decay: 4, cutoff: 3200 * tone })
    for (const step of hits(style.stab, 'x')) play(b.wet, { at: at + step * STEP, len: 0.12, midi: midi + 12, wave: 'saw', gain: 0.15, pan: -pan, decay: 12, cutoff: 3000 * tone, sweep: 3 })
  })
}

function arpBar(b: Buses, { at, chord, tone }: Bar, o: { arp: Arp; bar: number }): void {
  const span = o.arp.span ?? 1
  for (let step = 0; step < BAR_STEPS; step += span) {
    const turn = (o.bar * BAR_STEPS + step) / span
    const place = o.arp.order[turn % o.arp.order.length] as number
    const midi = (chord.tones[place % chord.tones.length] as number) + 12 * Math.floor(place / chord.tones.length) + o.arp.lift
    play(b.wet, { at: at + step * STEP, len: STEP * span * 0.9, midi, wave: o.arp.wave, gain: o.arp.gain * ARP_GAIN, pan: turn % 2 === 0 ? -0.35 : 0.35, decay: 9 / span, cutoff: 2800 * tone, sweep: 4 })
  }
}

function leadFrom(b: Buses, o: { at: number; steps: number; lead: Lead; tone: number }): void {
  for (let loop = 0; loop * 2 * BAR_STEPS < o.steps; loop += 1) {
    for (const [step, midi, length] of o.lead.tune) {
      const place = loop * 2 * BAR_STEPS + step
      if (place < o.steps) play(b.wet, { at: o.at + place * STEP, len: Math.min(length, o.steps - place) * STEP * 0.92, midi: midi + o.lead.lift, wave: o.lead.wave, gain: o.lead.gain * LEAD_GAIN, attack: 0.012, release: 0.09, cutoff: 4800 * o.tone })
    }
  }
}

// A figure counting up is heard climbing, and rings when it lands.
function countUp(b: Buses, at: number): void {
  for (let step = COUNT_STEPS.from; step < COUNT_STEPS.to; step += 1) play(b.wet, { at: at + step * STEP, len: 0.05, midi: PENTA[step - COUNT_STEPS.from] as number, wave: 'square', gain: 0.06 + step * 0.005, decay: 26, cutoff: 5000 })
  for (const midi of [84, 91]) play(b.wet, { at: at + COUNT_STEPS.to * STEP, len: 0.7, midi, wave: 'sine', gain: 0.13, decay: 5 })
}

function roll(b: Buses, at: number, steps: number): void {
  for (let step = 0; step < steps; step += 1) hiss(b.drums, { at: at + step * STEP, len: 0.11, gain: 0.07 + 0.24 * (step / steps), high: 1400, decay: 26 })
}

function landing(b: Buses, at: number, gain: number): void {
  hiss(b.drums, { at, len: 1.1, gain, high: 4500, decay: 5 })
}

// The last bar: the home chord struck once and left to ring, with bells walking up it.
function ring(b: Buses, at: number, chord: Chord): void {
  kick(b.drums, at, 0.9)
  b.kicks.push(at)
  landing(b, at, 0.3)
  play(b.music, { at, len: BAR, midi: chord.bass, wave: 'sine', gain: 0.34, release: 0.4 })
  chord.tones.forEach((midi, index) => {
    play(b.music, { at, len: BAR, midi, wave: 'saw', gain: 0.1, pan: (index - 1.5) * 0.4, attack: 0.01, release: 0.3, cutoff: 2200, sweep: 2, detune: 9 })
    play(b.wet, { at: at + index * BEAT_S * 0.5, len: 1, midi: midi + 24, wave: 'sine', gain: 0.14, decay: 3.5 })
  })
}

type Page = { key: string; dur: number }

function pageInto(b: Buses, page: Page, o: { at: number; index: number }): void {
  const style = STYLES[page.key] ?? (STYLES['day'] as Style)
  const steps = Math.round(page.dur / STEP)
  const bars = Math.ceil(steps / BAR_STEPS)
  const chords = chordsOf(page.key, o.index, bars)
  const from = style.from ?? 0
  const tone = style.tone ?? 1
  chords.forEach((chord, bar) => {
    const part: Bar = { at: o.at + bar * BAR, chord, style, tone }
    if (style.hasRing === true && bar === bars - 1) return ring(b, part.at, chord)
    chordBar(b, part)
    if (bar < from) return
    drumBar(b, part)
    bassBar(b, part)
    if (style.arp !== undefined) arpBar(b, part, { arp: style.arp, bar })
  })
  if (o.index > 0) landing(b, o.at, 0.13)
  if (style.lead !== undefined) leadFrom(b, { at: o.at + from * BAR, steps: (bars - from - (style.hasRing === true ? 1 : 0)) * BAR_STEPS, lead: style.lead, tone })
  if (style.hasCount === true) countUp(b, o.at)
  if (from > 0) {
    hiss(b.drums, { at: o.at, len: from * BAR, gain: 0.2, high: 1800, isRising: true })
    roll(b, o.at + from * BAR - BAR / 2, BAR_STEPS / 2)
    landing(b, o.at + from * BAR, 0.3)
  }
  if (style.end === 'riser') hiss(b.drums, { at: o.at + page.dur - BAR, len: BAR, gain: 0.2, high: 1800, isRising: true })
  if (style.end === 'roll') roll(b, o.at + page.dur - BAR / 2, BAR_STEPS / 2)
}

/** The whole film's music for these pages, as a base64 WAV exactly as long as the film. */
export function scoreFor(pages: readonly Page[]): string {
  const total = pages.reduce((sum, page) => sum + page.dur, 0)
  const b: Buses = { music: bus(total), wet: bus(total), drums: bus(total), kicks: [] }
  let at = 0
  pages.forEach((page, index) => {
    pageInto(b, page, { at, index })
    at += page.dur
  })

  return wavBase64(mixdown(b))
}
