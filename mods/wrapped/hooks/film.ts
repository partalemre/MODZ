import { standalone } from './card'
import type { CardSpec } from './card'
import { ease, H, W } from './film-parts'
import { segments, slidesFor } from './story'
import type { Slide } from './story'
import { toPic } from './kit/svg'

// The film: the story's pages one after another, each next page sliding up over the last. Sixty frames a second, for
// the moves and the counters; crabs keep their pixel gait. A frame the same as the one before is not drawn twice.

export const FPS = 60
const STEP_FPS = 8
const SLIDE_S = 0.45

export const frameCount = (slides: readonly Slide[]): number => Math.round(slides.reduce((sum, slide) => sum + slide.dur, 0) * FPS)

function pageBody(spec: CardSpec, slide: Slide, t: number, step: number): string {
  return slide.draw({ w: spec.wrapped, isNamed: spec.isNamed, t, step })
}

function frameBody(spec: CardSpec, slides: Slide[], at: { index: number; t: number; step: number }): string {
  const slide = slides[at.index] as Slide
  const page = pageBody(spec, slide, at.t, at.step)
  const before = slides[at.index - 1]
  const moved = before === undefined ? 1 : ease(at.t, 0, SLIDE_S)
  const layers =
    moved >= 1 || before === undefined
      ? page
      : `<g transform="translate(0 ${(-(H * 0.25) * moved).toFixed(2)})">${pageBody(spec, before, before.dur + at.t, at.step)}</g><g transform="translate(0 ${(H * (1 - moved)).toFixed(2)})">${page}</g>`

  return layers + segments(slides, at.index, at.t / slide.dur)
}

export function frameAt(spec: CardSpec, slides: Slide[], frame: number): string {
  let t = frame / FPS
  let index = 0
  while (index < slides.length - 1 && t >= (slides[index] as Slide).dur) {
    t -= (slides[index] as Slide).dur
    index += 1
  }
  const body = frameBody(spec, slides, { index, t: Math.min(t, (slides[index] as Slide).dur), step: Math.floor((frame * STEP_FPS) / FPS) })

  return standalone(toPic({ body, width: W, height: H, alt: '' }))
}

export type FilmIo = {
  write: (path: string, text: string) => Promise<void>
  run: (argv: string[]) => Promise<{ exitCode: number; stderr: string }>
  progress: (made: number, total: number) => Promise<void>
}

const BATCH = 120
const SCALE = 2
const pad = (value: number): string => String(value).padStart(5, '0')

function fail(what: string, ran: { exitCode: number; stderr: string }): void {
  if (ran.exitCode !== 0) throw new Error(`${what}: ${ran.stderr.trim().slice(-160) || `exit ${ran.exitCode}`}`)
}

// Each different frame once, with how long it holds. One at a time: a whole film's frames would not fit in memory.
export function* holdsOf(spec: CardSpec): Generator<{ source: string; frames: number }> {
  const slides = slidesFor(spec.wrapped)
  let last: { source: string; frames: number } | null = null
  for (let frame = 0; frame < frameCount(slides); frame += 1) {
    const source = frameAt(spec, slides, frame)
    if (last !== null && last.source === source) {
      last.frames += 1
      continue
    }
    if (last !== null) yield last
    last = { source, frames: 1 }
  }
  if (last !== null) yield last
}

type Batch = { paths: string[]; start: number }

async function flush(io: FilmIo, dir: string, paths: string[]): Promise<void> {
  if (paths.length > 0) fail('sips', await io.run(['sips', '-s', 'format', 'png', '-z', String(H * SCALE), String(W * SCALE), ...paths, '--out', dir]))
}

// Written and turned to PNG a batch at a time, the batch's SVGs removed by the folder's own removal at the end.
async function drawFrames(io: FilmIo, spec: CardSpec, dir: string): Promise<Array<{ frames: number }>> {
  const holds: Array<{ frames: number }> = []
  const total = frameCount(slidesFor(spec.wrapped))
  let made = 0
  const batch: Batch = { paths: [], start: 0 }
  for (const hold of holdsOf(spec)) {
    const path = `${dir}/f${pad(holds.length)}.svg`
    await io.write(path, hold.source)
    holds.push({ frames: hold.frames })
    batch.paths.push(path)
    made += hold.frames
    if (batch.paths.length < BATCH) continue
    await flush(io, dir, batch.paths)
    batch.paths = []
    await io.progress(made, total)
  }
  await flush(io, dir, batch.paths)

  return holds
}

// The concat list repeats its last file: ffmpeg drops the last entry's duration otherwise.
export function concatList(dir: string, holds: ReadonlyArray<{ frames: number }>): string {
  const lines = holds.flatMap((hold, index) => [`file '${dir}/f${pad(index)}.png'`, `duration ${(hold.frames / FPS).toFixed(5)}`])
  const last = holds.length - 1

  return [...lines, `file '${dir}/f${pad(last)}.png'`, ''].join('\n')
}

// shortcut: frames go through macOS's sips, so the video is macOS only; elsewhere it needs an SVG rasterizer.
export async function makeFilm(io: FilmIo, spec: CardSpec, where: { dir: string; out: string }): Promise<void> {
  const holds = await drawFrames(io, spec, where.dir)
  const list = `${where.dir}/list.txt`
  await io.write(list, concatList(where.dir, holds))
  const argv = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', `fps=${FPS},format=yuv420p`, '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-movflags', '+faststart', where.out]
  fail('ffmpeg', await io.run(argv))
}
