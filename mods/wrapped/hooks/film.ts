import { standalone } from './card'
import type { CardSpec } from './card'
import { clamp, H, PAD, INNER, pixelText, W } from './film-parts'
import type { SceneCtx } from './film-parts'
import { boardScene, crewScene, funScene, hardestScene, introScene, monthsScene, personaScene, volumeScene } from './film-scenes'
import { toPic } from './kit/svg'
import { rectEl } from './kit/svg-core'

// The film: a vertical story, one pure frame per moment, the same transcript figures as the card. Twelve frames a
// second suits pixel crabs and keeps the frame count small; a frame the same as the one before is not drawn twice.

export const FPS = 12
const STEP_FPS = 4
const FADE_S = 0.22
const SEGMENT = { y: 30, h: 4, gap: 4 } as const

type Scene = { draw: (c: SceneCtx) => string; dur: number; needsAgents?: boolean }

const SCENES: Scene[] = [
  { draw: introScene, dur: 3 },
  { draw: volumeScene, dur: 3.8 },
  { draw: crewScene, dur: 4.2, needsAgents: true },
  { draw: boardScene, dur: 5, needsAgents: true },
  { draw: hardestScene, dur: 3.8, needsAgents: true },
  { draw: monthsScene, dur: 6 },
  { draw: funScene, dur: 4.2 },
  { draw: personaScene, dur: 4.2 },
]

export function scenesFor(spec: CardSpec): Scene[] {
  return SCENES.filter(scene => !scene.needsAgents || spec.wrapped.agentRuns > 0)
}

// The story's bars at the top, as a phone shows them: done, running, to come.
function segments(count: number, at: number, share: number): string {
  const width = (INNER - (count - 1) * SEGMENT.gap) / count
  let body = ''
  for (let index = 0; index < count; index += 1) {
    const x = PAD + index * (width + SEGMENT.gap)
    const fill = index < at ? 1 : index === at ? share : 0
    body += rectEl({ x, y: SEGMENT.y, width, height: SEGMENT.h, radius: SEGMENT.h / 2, paint: 'track' })
    if (fill > 0) body += rectEl({ x, y: SEGMENT.y, width: width * fill, height: SEGMENT.h, radius: SEGMENT.h / 2, paint: 'mid' })
  }

  return body
}

function frameBody(spec: CardSpec, scenes: Scene[], at: { index: number; t: number; step: number }): string {
  const scene = scenes[at.index] as Scene
  const ctx: SceneCtx = { w: spec.wrapped, isNamed: spec.isNamed, t: at.t, dur: scene.dur, step: at.step }
  const fade = clamp(Math.min(at.t / FADE_S, (scene.dur - at.t) / FADE_S))

  return [
    rectEl({ x: 0, y: 0, width: W, height: H, paint: 'sheet' }),
    segments(scenes.length, at.index, at.t / scene.dur),
    pixelText('MODZ x CLAUDE', { x: PAD, y: 52, cell: 2.4, paint: 'lo' }),
    `<g opacity="${fade.toFixed(3)}">${scene.draw(ctx)}</g>`,
  ].join('')
}

export const frameCount = (scenes: readonly Scene[]): number => Math.round(scenes.reduce((sum, scene) => sum + scene.dur, 0) * FPS)

export function frameAt(spec: CardSpec, scenes: Scene[], frame: number): string {
  let t = frame / FPS
  let index = 0
  while (index < scenes.length - 1 && t >= (scenes[index] as Scene).dur) {
    t -= (scenes[index] as Scene).dur
    index += 1
  }
  const body = frameBody(spec, scenes, { index, t: Math.min(t, (scenes[index] as Scene).dur), step: Math.floor((frame * STEP_FPS) / FPS) })

  return standalone(toPic({ body, width: W, height: H, alt: '' }))
}

export type FilmIo = {
  write: (path: string, text: string) => Promise<void>
  run: (argv: string[]) => Promise<{ exitCode: number; stderr: string }>
  progress: (made: number, total: number) => Promise<void>
}

const BATCH = 80
const SCALE = 2
const pad = (value: number): string => String(value).padStart(5, '0')

function fail(what: string, ran: { exitCode: number; stderr: string }): void {
  if (ran.exitCode !== 0) throw new Error(`${what}: ${ran.stderr.trim().slice(-160) || `exit ${ran.exitCode}`}`)
}

// Each different frame once, with how long it holds: most frames of a quiet moment are the same picture.
export function holdsOf(spec: CardSpec): Array<{ source: string; frames: number }> {
  const scenes = scenesFor(spec)
  const holds: Array<{ source: string; frames: number }> = []
  for (let frame = 0; frame < frameCount(scenes); frame += 1) {
    const source = frameAt(spec, scenes, frame)
    const last = holds[holds.length - 1]
    if (last !== undefined && last.source === source) last.frames += 1
    else holds.push({ source, frames: 1 })
  }

  return holds
}

async function drawFrames(io: FilmIo, dir: string, holds: ReadonlyArray<{ source: string }>): Promise<void> {
  for (let start = 0; start < holds.length; start += BATCH) {
    const paths: string[] = []
    const batch = holds.slice(start, start + BATCH)
    for (const [offset, hold] of batch.entries()) {
      const path = `${dir}/f${pad(start + offset)}.svg`
      await io.write(path, hold.source)
      paths.push(path)
    }
    fail('sips', await io.run(['sips', '-s', 'format', 'png', '-z', String(H * SCALE), String(W * SCALE), ...paths, '--out', dir]))
    await io.progress(Math.min(start + BATCH, holds.length), holds.length)
  }
}

// The concat list repeats its last file: ffmpeg drops the last entry's duration otherwise.
export function concatList(dir: string, holds: ReadonlyArray<{ frames: number }>): string {
  const lines = holds.flatMap((hold, index) => [`file '${dir}/f${pad(index)}.png'`, `duration ${(hold.frames / FPS).toFixed(5)}`])
  const last = holds.length - 1

  return [...lines, `file '${dir}/f${pad(last)}.png'`, ''].join('\n')
}

// shortcut: frames go through macOS's sips, so the video is macOS only; elsewhere it needs an SVG rasterizer.
export async function makeFilm(io: FilmIo, spec: CardSpec, where: { dir: string; out: string }): Promise<void> {
  const holds = holdsOf(spec)
  await drawFrames(io, where.dir, holds)
  const list = `${where.dir}/list.txt`
  await io.write(list, concatList(where.dir, holds))
  const argv = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', 'fps=24,format=yuv420p', '-c:v', 'libx264', '-crf', '20', '-movflags', '+faststart', where.out]
  fail('ffmpeg', await io.run(argv))
}
