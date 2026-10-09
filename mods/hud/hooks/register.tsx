import { atom, read, update } from 'claude-code'
import type { EngineInterface, ModelUsage, Register, SessionUsage } from 'claude-code'

import { labelOf } from './format'
import { hudCells } from './raster'
import { hudSvg } from './svg'
import type { SvgTheme } from './svg'
import { advanceView, isAnimating, rasterInputOf, svgInputOf, syncView, view } from './view'
import type { Frame } from './view'
import type { HudTurn, HudUsage } from '../types'

type Measured = Pick<SessionUsage, 'context' | 'rateLimits' | 'cost'>

const COMMAND = 'hud'
const TICK_MS = 90
const REFRESH_MS = 60_000
const SETTLE_MS = 1_200
const WARN_PERCENT = 90
const OUTPUT_HISTORY = 16
const CELL_PIXELS = 7.6
const SVG_MAX_WIDTH = 1_100
const EMPTY_TURN: HudTurn = { requests: 0, input: 0, output: 0, cacheRead: 0, outputs: [] }

const usageAtom = atom({ plugin: 'hud', key: 'usage' } as const, null)
const turnAtom = atom({ plugin: 'hud', key: 'turn' } as const, EMPTY_TURN)
const lastTurnAtom = atom({ plugin: 'hud', key: 'lastTurn' } as const, null)
const previousAtom = atom({ plugin: 'hud', key: 'previous' } as const, {})
const hiddenAtom = atom({ plugin: 'hud', key: 'isHidden' } as const, false)

function toUsage(measured: Measured): HudUsage {
  const gauges = measured.rateLimits.map(limit => ({
    id: limit.kind,
    label: labelOf(limit.kind),
    percent: limit.percentUsed,
    resetsAt: limit.resetsAt ?? null,
  }))
  const context = measured.context.percent
  if (context !== undefined) {
    gauges.push({ id: 'context', label: labelOf('context'), percent: context, resetsAt: null })
  }

  return { gauges, costUsd: measured.cost?.usd ?? null }
}

function percentsOf(usage: HudUsage | null): Record<string, number> {
  const percents: Record<string, number> = {}
  for (const gauge of usage?.gauges ?? []) percents[gauge.id] = gauge.percent

  return percents
}

function addUsage(turn: HudTurn, usage: ModelUsage): HudTurn {
  const inputSide = usage.input_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens

  return {
    requests: turn.requests + 1,
    input: turn.input + inputSide,
    output: turn.output + usage.output_tokens,
    cacheRead: turn.cacheRead + usage.cache_read_input_tokens,
    outputs: [...turn.outputs, usage.output_tokens].slice(-OUTPUT_HISTORY),
  }
}

function themeOf(value: unknown): SvgTheme {
  const text = String(value ?? '').toLowerCase()
  if (text.includes('light')) return 'light'
  if (text.includes('dark')) return 'dark'

  return 'auto'
}

let ticker: { cancel: () => void } | null = null

function ensureTicker($: EngineInterface): void {
  if (ticker !== null) return
  ticker = $.clock.every(TICK_MS, async () => {
    advanceView()
    const { requestId, columns } = view
    if (requestId !== null) {
      await $.ui.blit({ requestId, key: 'hud', columns, cells: hudCells(rasterInputOf()) })
    }
    if (!isAnimating() && ticker !== null) {
      ticker.cancel()
      ticker = null
    }
  })
}

export const register: Register = on => {
  const warned = new Set<string>()

  on('session.start', async ($, e, next) => {
    const current = await $.session.usage()
    await update($, usageAtom, () => toUsage(current))
    view.theme = themeOf((await $.config.list()).find(row => row.key === 'theme')?.value)
    $.clock.every(REFRESH_MS, () => $.ui.invalidate('ui.render'))
    await $.command.register({ name: COMMAND, description: 'Show or hide the HUD band above the prompt' })

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    const fresh = toUsage(e)
    const old = await read($, usageAtom)
    await update($, previousAtom, () => percentsOf(old))
    await update($, usageAtom, () => fresh)
    $.clock.after(SETTLE_MS, () => update($, previousAtom, () => percentsOf(fresh)))

    for (const gauge of fresh.gauges.filter(entry => entry.id !== 'context' && entry.percent >= WARN_PERCENT)) {
      const id = `${gauge.id}:${gauge.resetsAt}`
      if (warned.has(id)) continue
      warned.add(id)
      $.ui.toast(`${gauge.label} limit ${Math.round(gauge.percent)}% used`)
    }

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    const finished = await read($, turnAtom)
    if (finished.requests > 0) await update($, lastTurnAtom, () => finished)
    await update($, turnAtom, () => EMPTY_TURN)

    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    const usage = result.usage
    if (usage !== null) await update($, turnAtom, turn => addUsage(turn, usage))

    return result
  })

  on('command.run', { command: COMMAND }, async $ => {
    await update($, hiddenAtom, isHidden => !isHidden)

    return { text: (await read($, hiddenAtom)) ? 'HUD hidden.' : 'HUD shown.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const usage = await read($, usageAtom)
    const isQuiet = e.props.hasSurvey || usage === null || (await read($, hiddenAtom))
    if (isQuiet || usage.gauges.length === 0) return next(e)

    const frame: Frame = {
      usage,
      turn: await read($, turnAtom),
      lastTurn: await read($, lastTurnAtom),
      previous: await read($, previousAtom),
      isLive: e.props.isWorking,
      columns: e.props.bodyColumns,
      nowMs: await $.clock.now(),
    }

    if (e.surface === 'terminal') {
      const { Raster } = $.ui.resolve(e)
      syncView(e.requestId, frame)
      if (isAnimating()) ensureTicker($)

      return <Raster key="hud" columns={frame.columns} rows={1} cells={hudCells(rasterInputOf())} />
    }
    if (e.surface === 'desktop') {
      const { Svg } = $.ui.resolve(e)
      const width = Math.min(SVG_MAX_WIDTH, Math.floor(frame.columns * CELL_PIXELS))
      const { source, alt, height } = hudSvg(svgInputOf(frame, width))

      return <Svg source={source} alt={alt} width={width} height={height} />
    }

    return next(e)
  })
}
