import type { CrabMood } from '../types'
import { crab } from './crabs'
import { HOME_LOOK } from './mood-svg'
import { fitText, textWidth, xml } from './format'
import { meterSvg } from './meter'
import type { JobView } from './job'
import { percentText } from './job'
import { FONT, MONO, paneSvg } from './theme'

// The desktop band as one Svg (the desktop wraps sibling elements onto new lines): title, status
// pill, a quiet meter of one segment per task, the percent and the crab. Its height and baseline
// match hud-pro's line beneath, so the two rows read as one block. As the row narrows the meter
// gives way first, then the title; the pill, the percent and the crab always stay whole.
export const BAND_H = 26
const BASELINE = 17.5
const TITLE_X = 11
const TITLE_SIZE = 13
const TITLE_MIN = 64
// Semibold runs a little wider than the regular advance textWidth measures.
const BOLD = 1.06
const GAP = 8
const PILL = { y: 3, h: 20, padX: 9, size: 11 } as const
const METER = { h: 6, min: 36, max: 360 } as const
const PERCENT_SIZE = 12.5
const MONO_EM = 0.6
const CRAB = { w: 24, y: 2, scale: 0.8 } as const

type Role = 'run' | 'ok' | 'warn' | 'danger'
export type BandDrawing = { source: string; width: number }

const pillRole = (view: JobView): Role => {
  if (!view.isFinished) return 'run'
  return view.failed ? 'warn' : 'ok'
}

type Pill = { label: string; role: Role; x: number; w: number }

// The pill rests on the neutral track; its word takes the state's ink: the accent while live, body text once done.
const PILL_INK: Record<Role, string> = { run: 'f-edit', ok: 's', warn: 'f-warn', danger: 'f-danger' }

const pillSvg = ({ label, role, x, w }: Pill): string =>
  `<rect class="k" x="${x}" y="${PILL.y}" width="${w}" height="${PILL.h}" rx="${PILL.h / 2}"/>
<text class="${PILL_INK[role]}" x="${x + w / 2}" y="${BASELINE - 0.5}" text-anchor="middle" font-family="${FONT}" font-size="${PILL.size}" font-weight="600">${xml(label)}</text>`

type Plan = { title: string; titleW: number; meterW: number; pillW: number; pctW: number }

// The meter shrinks to its minimum before the title gives up a pixel; below that the meter goes.
const planOf = (view: JobView, maxW: number): Plan => {
  const pillW = Math.ceil(textWidth(view.label, PILL.size) * BOLD + PILL.padX * 2)
  const pctW = Math.ceil(percentText(view).length * PERCENT_SIZE * MONO_EM)
  const avail = maxW - TITLE_X - pillW - pctW - CRAB.w - GAP * 4
  const natural = Math.ceil(textWidth(view.title, TITLE_SIZE) * BOLD)
  if (avail - natural >= METER.min) return { title: view.title, titleW: natural, meterW: Math.min(METER.max, avail - natural), pillW, pctW }
  const titleW = Math.max(TITLE_MIN, avail - METER.min)
  const meterW = avail - titleW
  const fits = meterW >= METER.min
  const room = fits ? titleW : Math.max(TITLE_MIN, avail + GAP)
  const title = fitText(view.title, TITLE_SIZE * BOLD, room)
  return { title, titleW: Math.min(room, Math.ceil(textWidth(title, TITLE_SIZE) * BOLD)), meterW: fits ? meterW : 0, pillW, pctW }
}

// The row's crab: the job's own, or with `crabInBand` on and the session idle, the home crab's face.
const bandCrab = (x: number, view: JobView, mood?: CrabMood): string =>
  mood
    ? crab(x, CRAB.y, { costume: 'other', look: HOME_LOOK, mood, scale: CRAB.scale })
    : crab(x, CRAB.y, { costume: 'other', isWalking: view.isWorking, scale: CRAB.scale })

export const bandSvg = (view: JobView, maxW: number, mood?: CrabMood): BandDrawing => {
  const plan = planOf(view, maxW)
  const pillX = TITLE_X + plan.titleW + GAP
  const meterX = pillX + plan.pillW + GAP
  const pctX = meterX + (plan.meterW ? plan.meterW + GAP : 0)
  const crabX = pctX + plan.pctW + GAP
  const width = Math.ceil(crabX + CRAB.w)
  const body = [
    `<text class="t" x="${TITLE_X}" y="${BASELINE}" font-family="${FONT}" font-size="${TITLE_SIZE}" font-weight="600">${xml(plan.title)}</text>`,
    pillSvg({ label: view.label, role: pillRole(view), x: pillX, w: plan.pillW }),
    plan.meterW ? meterSvg(view, { x: meterX, y: (BAND_H - METER.h) / 2, w: plan.meterW, h: METER.h }) : '',
    `<text class="t" x="${pctX}" y="${BASELINE}" font-family="${MONO}" font-size="${PERCENT_SIZE}" font-weight="650">${xml(percentText(view))}</text>`,
    bandCrab(crabX, view, mood),
  ]
  return { source: paneSvg(width, BAND_H, body.join('\n')), width }
}
