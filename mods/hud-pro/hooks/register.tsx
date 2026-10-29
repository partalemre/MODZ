import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { bandRow } from './band'
import type { ContextView } from './breakdown'
import { compactedOf, forecastsFrom, freshBreakdown, keepBreakdown, keepLast, reasonOf } from './context'
import { addSample, isHistory } from './history'
import { EMPTY_HUB, HUB_PANE, hubOf, isOwnOpen } from './hub'
import { setLang } from './lang'
import { gaugeViews } from './model'
import type { Forecasts } from './model'
import { paneTree, withHome } from './pane'
import type { CardData } from './pane'
import { onPast, pastViewOf } from './past-hook'
import { motion } from './pane-motion'
import { isSame } from './same'
import { pinned } from './pin'
import { isOffStage, shownOf } from './stage'
import { EMPTY_TURN, onTurns } from './turns-hook'
import { newNotices, toUsage } from './usage'
import { words } from './words'
import type { HudUsage } from '../types'

const PANE = 'hud-pro'
const HIDDEN_KEY = 'hud-pro.hidden'
const HISTORY_KEY = 'hud-pro.history'
// Reset countdowns move by the minute, so the idle line redraws once a minute.
const REFRESH_MS = 60_000

const usageAtom = atom({ plugin: 'hud-pro', key: 'usage' } as const, null)
const turnAtom = atom({ plugin: 'hud-pro', key: 'turn' } as const, EMPTY_TURN)
const lastTurnAtom = atom({ plugin: 'hud-pro', key: 'lastTurn' } as const, null)
const hiddenAtom = atom({ plugin: 'hud-pro', key: 'isHidden' } as const, false)
const historyAtom = atom({ plugin: 'hud-pro', key: 'history' } as const, [])
const compactingAtom = atom({ plugin: 'hud-pro', key: 'isCompacting' } as const, false)
const contextTurnsAtom = atom({ plugin: 'hud-pro', key: 'contextTurns' } as const, [])
const lastCompactAtom = atom({ plugin: 'hud-pro', key: 'lastCompact' } as const, null)
const hubAtom = atom({ plugin: 'hud-pro', key: 'hub' } as const, EMPTY_HUB)
const liveAtom = atom({ plugin: 'hud-pro', key: 'isLive' } as const, false)
const pastAtom = atom({ plugin: 'hud-pro', key: 'past' } as const, null)
const rangeAtom = atom({ plugin: 'hud-pro', key: 'pastRange' } as const, 7)

const noticed = new Set<string>()
// What the minute clock last moved on screen: the gauges' countdowns, pace marks and estimates.
let shownGauges: unknown = null

async function record($: EngineInterface, fresh: HudUsage): Promise<void> {
  const nowMs = await $.clock.now()
  const before = await read($, historyAtom)
  const after = addSample(before, fresh, nowMs)
  if (after === before) return
  await update($, historyAtom, () => after)
  await $.store.set(HISTORY_KEY, after)
}

// The MODZ card: written once at the start, then only when what it shows changes.
async function writeHub($: EngineInterface, usage: HudUsage, isFirst = false): Promise<void> {
  const fresh = hubOf(usage)
  const current = await read($, hubAtom)
  if (!isFirst && current.detail === fresh.detail && current.tone === fresh.tone) return
  const at = await $.clock.now()
  await update($, hubAtom, () => ({ pane: HUB_PANE, ...fresh, at }))
}

async function noticeHigh($: EngineInterface, fresh: HudUsage): Promise<void> {
  for (const text of newNotices(fresh, { nowMs: await $.clock.now(), noticed })) $.ui.toast(text)
}

async function forecastsOf($: EngineInterface, usage: HudUsage | null): Promise<Forecasts> {
  return forecastsFrom({ history: await read($, historyAtom), turns: await read($, contextTurnsAtom), usage })
}

// The window by category while the pane draws: the local estimate, read again once it is stale.
async function breakdownView($: EngineInterface): Promise<ContextView | null> {
  const nowMs = await $.clock.now()
  const fresh = freshBreakdown(nowMs)
  if (fresh !== undefined) return fresh
  try {
    return keepBreakdown(nowMs, (await $.session.usage({ breakdown: 'summary' })).context.breakdown)
  } catch {
    $.ui.log('hud-pro: context breakdown failed', { to: 'debug' })

    return keepLast(nowMs)
  }
}

// Compacts as /compact does, through the engine's own call. A press's own work is abandoned when the
// press ends, so a timer starts it in a dispatch of its own that lasts until it ends; the buttons
// hide until then. A refusal (a turn running) says why in one toast.
function compactNow($: EngineInterface): void {
  void update($, compactingAtom, () => true)
  $.clock.after(1, () =>
    $.session
      .compact()
      .then(async result => {
        const done = compactedOf(result, await $.clock.now())
        if (done !== null) await update($, lastCompactAtom, () => done)
      })
      .catch((error: unknown) => $.ui.toast(words().compactFailed(reasonOf(error))))
      .finally(() => update($, compactingAtom, () => false)),
  )
}

async function toggle($: EngineInterface): Promise<{ text: string }> {
  await update($, hiddenAtom, isHidden => !isHidden)
  const isHidden = await read($, hiddenAtom)
  await $.store.set(HIDDEN_KEY, isHidden)

  return { text: isHidden ? words().hidden : words().shown }
}

// Placed, the pane takes a running MODZ hub's panel, so the hub and every other pane step aside (kit/stage.ts).
// A failed note of that is only logged: the pane is open either way.
async function reportShown($: EngineInterface): Promise<void> {
  try {
    if ((await $.state.get({ plugin: 'modz', key: 'isOn' })).value !== true) return
    await $.state.set({ plugin: 'hud-pro', key: 'shown' }, shownOf(HUB_PANE, await $.clock.now()))
  } catch {
    $.ui.log('hud-pro: could not tell the hub the pane is shown', { to: 'debug' })
  }
}

// Opens the pane, or brings it forward when it is open already; never closes it.
async function openPane($: EngineInterface): Promise<void> {
  motion.reset()
  const opened = await $.ui.open({ id: PANE, title: words().paneTitle, focus: true, closeOnEscape: true })
  if (opened.isPlaced) await reportShown($)
}

async function runCommand($: EngineInterface, args: string): Promise<{ text?: string }> {
  if (args.trim().toLowerCase() !== 'full') return toggle($)
  await openPane($)

  return {}
}

// The minute clock moves only the gauges' countdowns, pace marks and estimates; a minute that moves
// none of them redraws nothing, since every redraw also hands out new press handles.
async function redrawIfMoved($: EngineInterface): Promise<void> {
  const usage = await read($, usageAtom)
  const gauges = usage === null ? null : gaugeViews(usage, await $.clock.now(), await forecastsOf($, usage))
  if (isSame(gauges, shownGauges)) return
  shownGauges = gauges
  $.ui.invalidate('ui.render')
}

async function setup($: EngineInterface): Promise<void> {
  const current = toUsage(await $.session.usage())
  await update($, usageAtom, () => current)
  shownGauges = gaugeViews(current, await $.clock.now(), await forecastsOf($, current))
  await writeHub($, current, true)
  await update($, hiddenAtom, () => false)
  if ((await $.store.get(HIDDEN_KEY)) === true) await update($, hiddenAtom, () => true)
  const saved = await $.store.get(HISTORY_KEY)
  if (isHistory(saved)) await update($, historyAtom, () => saved)
  $.clock.every(REFRESH_MS, () => void redrawIfMoved($))
  await $.command.register({ name: 'hud', description: words().commandDescription })
}

type On = Parameters<Register>[0]

function onUsage(on: On) {
  on('session.start', async ($, e, next) => {
    // The interface language (kit/lang.ts). Spelled out: the engine admits an env read by a literal name only.
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    await setup($).catch(() => $.ui.log('hud-pro: start failed', { to: 'debug' }))

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    try {
      const fresh = toUsage(e)
      await update($, usageAtom, () => fresh)
      await writeHub($, fresh)
      await noticeHigh($, fresh)
      await record($, fresh)
    } catch {
      $.ui.log('hud-pro: measure failed', { to: 'debug' })
    }

    return next(e)
  })
}

// The MODZ main panel asks for this pane by writing `{ pane: 'usage' }` to `modz.open`. modz's
// contract is not this mod's to import, so its address stays untyped here.
function onOpen(on: On) {
  on('state.set', { plugin: 'modz', key: 'open' } as any, async ($: EngineInterface, e: any, next: any) => {
    const done = await next(e)
    if (isOwnOpen(e.value)) await openPane($)

    return done
  }).catch(($: EngineInterface, e: any, next: any) => next(e))
  // Another pane took the hub's one panel: this one steps aside rather than wait as a tab.
  on('state.set', { plugin: 'modz', key: 'stage' } as any, async ($: EngineInterface, e: any, next: any) => {
    const done = await next(e)
    if (isOffStage(e.value, HUB_PANE)) await $.ui.close({ id: PANE })

    return done
  }).catch(($: EngineInterface, e: any, next: any) => next(e))
}

// The way back to the MODZ hub: written to this mod's own `home` value, which the hub hears. A press
// never throws out of the handler, so a failed write is logged and the pane stays as it is.
async function goHome($: EngineInterface): Promise<void> {
  try {
    await $.state.set({ plugin: 'hud-pro', key: 'home' }, { at: await $.clock.now() })
  } catch {
    $.ui.log('hud-pro: could not go back to the hub', { to: 'debug' })
  }
}

async function cardData($: EngineInterface): Promise<CardData> {
  return {
    view: await breakdownView($),
    turns: await read($, contextTurnsAtom),
    lastCompact: await read($, lastCompactAtom),
    isCompacting: await read($, compactingAtom),
    compact: () => compactNow($),
  }
}

function onRender(on: On) {
  on('command.run', { command: 'hud' }, async ($, e) => {
    try {
      return await runCommand($, e.args)
    } catch {
      return { text: words().commandFailed }
    }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const turn = await read($, turnAtom)
    const ui = $.ui.resolve(e)
    const isHubOn = (await $.state.get({ plugin: 'modz', key: 'isOn' })).value === true
    const usage = await read($, usageAtom)
    const tree = paneTree(ui, {
      usage,
      history: await read($, historyAtom),
      turn: turn.requests > 0 ? turn : await read($, lastTurnAtom),
      columns: e.props.bodyColumns,
      nowMs: await $.clock.now(),
      card: await cardData($),
      isLive: await read($, liveAtom),
      // The breakdown read first, so the forecast counts up to the compaction point it names.
      forecasts: await forecastsOf($, usage),
      past: pastViewOf(await read($, pastAtom), { range: await read($, rangeAtom), choose: range => void update($, rangeAtom, () => range) }),
      ...(e.surface !== 'terminal' && 'Svg' in ui ? { svg: ui.Svg } : {}),
    })

    return pinned(e, isHubOn ? withHome(ui, { tree, goHome: () => void goHome($) }) : tree)
  })
}

function onBand(on: On, isAlertsOnly: boolean) {
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
        forecasts: await forecastsOf($, usage),
        isDesktop: e.surface !== 'terminal' && 'Svg' in ui,
        canCompact: !e.props.isWorking && !(await read($, compactingAtom)),
        compact: () => compactNow($),
        isAlertsOnly,
      })
      if (row === null) return theirs
      const { Box } = ui

      return (
        <Box flexDirection="column">
          {theirs}
          {pinned(e, row)}
        </Box>
      )
    } catch {
      $.ui.log('hud-pro: band render failed', { to: 'debug' })

      return theirs
    }
  })
}

export const register: Register = (on, options) => {
  onUsage(on)
  onTurns(on)
  onPast(on)
  onOpen(on)
  onRender(on)
  onBand(on, options?.band === 'alerts')
}
