import { atom, read, update } from 'claude-code'
import type { EngineInterface, ModelUsage, Register, SessionUsage } from 'claude-code'

import { bandRow } from './band'
import { labelOf, longLabelOf, percentText } from './format'
import { addSample, isHistory } from './history'
import { paneTree } from './pane'
import type { HudTurn, HudUsage } from '../types'

type Measured = Pick<SessionUsage, 'context' | 'rateLimits' | 'cost'>

const PANE = 'hud-pro'
const HIDDEN_KEY = 'hud-pro.hidden'
const HISTORY_KEY = 'hud-pro.history'
// Reset countdowns move by the minute, so the idle line redraws once a minute.
const REFRESH_MS = 60_000
const NOTICE_PERCENT = 90
const EMPTY_TURN: HudTurn = { requests: 0, input: 0, output: 0, cacheRead: 0 }

const usageAtom = atom({ plugin: 'hud-pro', key: 'usage' } as const, null)
const turnAtom = atom({ plugin: 'hud-pro', key: 'turn' } as const, EMPTY_TURN)
const lastTurnAtom = atom({ plugin: 'hud-pro', key: 'lastTurn' } as const, null)
const hiddenAtom = atom({ plugin: 'hud-pro', key: 'isHidden' } as const, false)
const historyAtom = atom({ plugin: 'hud-pro', key: 'history' } as const, [])
const compactingAtom = atom({ plugin: 'hud-pro', key: 'isCompacting' } as const, false)

const noticed = new Set<string>()

function toUsage(measured: Measured): HudUsage {
  const gauges = measured.rateLimits.map(limit => ({
    id: limit.kind,
    label: labelOf(limit.kind),
    percent: limit.percentUsed,
    resetsAt: limit.resetsAt ?? null,
  }))
  const { percent, tokens, window } = measured.context
  if (percent !== undefined) gauges.push({ id: 'context', label: labelOf('context'), percent, resetsAt: null })
  const context = tokens === undefined ? null : { tokens, window }

  return { gauges, costUsd: measured.cost?.usd ?? null, context }
}

function addUsage(turn: HudTurn, usage: ModelUsage): HudTurn {
  const inputSide = usage.input_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens

  return {
    requests: turn.requests + 1,
    input: turn.input + inputSide,
    output: turn.output + usage.output_tokens,
    cacheRead: turn.cacheRead + usage.cache_read_input_tokens,
  }
}

async function record($: EngineInterface, fresh: HudUsage): Promise<void> {
  const nowMs = await $.clock.now()
  const before = await read($, historyAtom)
  const after = addSample(before, fresh, nowMs)
  if (after === before) return
  await update($, historyAtom, () => after)
  await $.store.set(HISTORY_KEY, after)
}

// One short notice per plan window once it passes 90%.
function noticeHigh($: EngineInterface, fresh: HudUsage): void {
  for (const gauge of fresh.gauges.filter(entry => entry.id !== 'context' && entry.percent >= NOTICE_PERCENT)) {
    const id = `${gauge.id}:${gauge.resetsAt}`
    if (noticed.has(id)) continue
    noticed.add(id)
    $.ui.toast(`${longLabelOf(gauge.id)} limiti ${percentText(gauge.percent)} dolu`)
  }
}

async function toggle($: EngineInterface): Promise<{ text: string }> {
  await update($, hiddenAtom, isHidden => !isHidden)
  const isHidden = await read($, hiddenAtom)
  await $.store.set(HIDDEN_KEY, isHidden)

  return { text: isHidden ? 'HUD gizlendi.' : 'HUD gösteriliyor.' }
}

async function runCommand($: EngineInterface, args: string): Promise<{ text?: string }> {
  if (args.trim().toLowerCase() !== 'full') return toggle($)
  await $.ui.open({ id: PANE, title: 'HUD', focus: true, closeOnEscape: true })

  return {}
}

// Runs Claude Code's own /compact. A press's own work is abandoned when the press ends, so a timer
// starts it in a dispatch of its own that lasts until it ends; the button hides until then.
function compactNow($: EngineInterface): void {
  void update($, compactingAtom, () => true)
  $.clock.after(1, () =>
    $.command
      .run({ command: 'compact' })
      .catch((error: unknown) => $.ui.toast(`Sıkıştırma başarısız: ${error instanceof Error ? error.message : String(error)}`))
      .finally(() => update($, compactingAtom, () => false)),
  )
}

async function setup($: EngineInterface): Promise<void> {
  const current = await $.session.usage()
  await update($, usageAtom, () => toUsage(current))
  await update($, hiddenAtom, () => false)
  if ((await $.store.get(HIDDEN_KEY)) === true) await update($, hiddenAtom, () => true)
  const saved = await $.store.get(HISTORY_KEY)
  if (isHistory(saved)) await update($, historyAtom, () => saved)
  $.clock.every(REFRESH_MS, () => $.ui.invalidate('ui.render'))
  await $.command.register({ name: 'hud', description: 'HUD satırını aç/kapat; "/hud full" limit ayrıntılarını açar' })
}

type On = Parameters<Register>[0]

function onUsage(on: On) {
  on('session.start', async ($, e, next) => {
    await setup($).catch(() => $.ui.log('hud-pro: start failed', { to: 'debug' }))

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    try {
      const fresh = toUsage(e)
      await update($, usageAtom, () => fresh)
      noticeHigh($, fresh)
      await record($, fresh)
    } catch {
      $.ui.log('hud-pro: measure failed', { to: 'debug' })
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
    if (usage !== null && e.agentId === undefined) await update($, turnAtom, turn => addUsage(turn, usage))

    return result
  })
}

function onRender(on: On) {
  on('command.run', { command: 'hud' }, async ($, e) => {
    try {
      return await runCommand($, e.args)
    } catch {
      return { text: 'HUD komutu çalışmadı.' }
    }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const turn = await read($, turnAtom)
    const ui = $.ui.resolve(e)

    return paneTree(ui, {
      usage: await read($, usageAtom),
      history: await read($, historyAtom),
      turn: turn.requests > 0 ? turn : await read($, lastTurnAtom),
      columns: e.props.bodyColumns,
      nowMs: await $.clock.now(),
      ...(e.surface !== 'terminal' && 'Svg' in ui ? { svg: ui.Svg } : {}),
    })
  })
}

function onBand(on: On) {
  // The bottom row of the band, right above the prompt: what the plugins beneath drew stays above it.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const theirs = await next(e)
    try {
      const usage = await read($, usageAtom)
      if (e.props.hasSurvey || usage === null || (await read($, hiddenAtom))) return theirs
      const ui = $.ui.resolve(e)
      const row = bandRow(ui, {
        usage,
        columns: e.props.bodyColumns,
        nowMs: await $.clock.now(),
        isDesktop: e.surface !== 'terminal' && 'Svg' in ui,
        canCompact: !e.props.isWorking && !(await read($, compactingAtom)),
        compact: () => compactNow($),
      })
      if (row === null) return theirs
      const { Box } = ui

      return (
        <Box flexDirection="column">
          {theirs}
          {row}
        </Box>
      )
    } catch {
      $.ui.log('hud-pro: band render failed', { to: 'debug' })

      return theirs
    }
  })
}

export const register: Register = on => {
  onUsage(on)
  onRender(on)
  onBand(on)
}
