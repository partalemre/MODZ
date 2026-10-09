import type { RasterInput } from './raster'
import type { SvgInput, SvgTheme } from './svg'
import type { HudTurn, HudUsage } from '../types'

export type Frame = {
  usage: HudUsage
  turn: HudTurn
  lastTurn: HudTurn | null
  previous: Record<string, number>
  isLive: boolean
  columns: number
  nowMs: number
}

type ShownTurn = { turn: HudTurn | null; isTurnLive: boolean }

const EASE_FACTOR = 0.3
const SNAP_DISTANCE = 0.25

export const view = {
  requestId: null as string | null,
  columns: 0,
  frame: 0,
  isLive: false,
  isTurnLive: false,
  nowMs: 0,
  usage: null as HudUsage | null,
  turn: null as HudTurn | null,
  shown: {} as Record<string, number>,
  theme: 'auto' as SvgTheme,
}

export function turnToShow(frame: Pick<Frame, 'turn' | 'lastTurn' | 'isLive'>): ShownTurn {
  if (frame.turn.requests > 0) return { turn: frame.turn, isTurnLive: frame.isLive }
  if (frame.lastTurn !== null) return { turn: frame.lastTurn, isTurnLive: false }

  return { turn: null, isTurnLive: false }
}

export function syncView(requestId: string, frame: Frame): void {
  const shownTurn = turnToShow(frame)
  view.requestId = requestId
  view.columns = frame.columns
  view.isLive = frame.isLive
  view.isTurnLive = shownTurn.isTurnLive
  view.nowMs = frame.nowMs
  view.usage = frame.usage
  view.turn = shownTurn.turn

  const next: Record<string, number> = {}
  for (const gauge of frame.usage.gauges) {
    next[gauge.id] = view.shown[gauge.id] ?? gauge.percent
  }
  view.shown = next
}

export function isAnimating(): boolean {
  if (view.isLive) return true

  return (view.usage?.gauges ?? []).some(gauge => Math.abs((view.shown[gauge.id] ?? gauge.percent) - gauge.percent) > 0)
}

export function advanceView(): void {
  view.frame += 1
  for (const gauge of view.usage?.gauges ?? []) {
    const current = view.shown[gauge.id] ?? gauge.percent
    const distance = gauge.percent - current
    view.shown[gauge.id] = Math.abs(distance) < SNAP_DISTANCE ? gauge.percent : current + distance * EASE_FACTOR
  }
}

export function rasterInputOf(): RasterInput {
  const gauges = (view.usage?.gauges ?? []).map(gauge => ({
    id: gauge.id,
    percent: view.shown[gauge.id] ?? gauge.percent,
    resetsAt: gauge.resetsAt,
  }))

  return {
    columns: view.columns,
    gauges,
    costUsd: view.usage?.costUsd ?? null,
    turn: view.turn,
    isLive: view.isLive,
    isTurnLive: view.isTurnLive,
    frame: view.frame,
    nowMs: view.nowMs,
  }
}

export function svgInputOf(frame: Frame, width: number): SvgInput {
  const shownTurn = turnToShow(frame)

  return {
    width,
    theme: view.theme,
    gauges: frame.usage.gauges.map(gauge => ({
      id: gauge.id,
      percent: gauge.percent,
      previous: frame.previous[gauge.id] ?? null,
      resetsAt: gauge.resetsAt,
    })),
    costUsd: frame.usage.costUsd,
    turn: shownTurn.turn,
    isLive: frame.isLive,
    isTurnLive: shownTurn.isTurnLive,
    nowMs: frame.nowMs,
  }
}
