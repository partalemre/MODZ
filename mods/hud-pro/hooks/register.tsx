import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { bandRow } from './band'
import { BAND_KEY, band, isAlertsOnly, isBandMode } from './band-mode'
import type { ContextView } from './breakdown'
import { HIDDEN_KEY, PANE, onCommand } from './command'
import { compactedOf, forecastsFrom, forgetBreakdown, freshBreakdown, keepBreakdown, keepLast, reasonOf } from './context'
import { accountHistory, addSample, hasLimitsMoved, isHistory, mergeHistory } from './history'
import { EMPTY_HUB, HUB_PANE, hubOf } from './hub'
import { setLang } from './lang'
import { gaugeViews } from './model'
import type { Forecasts } from './model'
import { paneTree, withHome } from './pane'
import type { CardData } from './pane'
import { onPast, pastViewOf } from './past-hook'
import { isSame } from './same'
import { pinned } from './pin'
import { EMPTY_TURN, onTurns } from './turns-hook'
import { newNotices, toUsage } from './usage'
import { words } from './words'
import type { HudUsage } from '../types'

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

// The session's own history takes every new sample; the store only a moved limit, merged into what other sessions
// stored meanwhile.
async function record($: EngineInterface, fresh: HudUsage): Promise<void> {
  const nowMs = await $.clock.now()
  const before = await read($, historyAtom)
  const after = addSample(before, fresh, nowMs)
  if (after === before) return
  await update($, historyAtom, () => after)
  if (!hasLimitsMoved(before.at(-1), after.at(-1))) return
  const stored = await $.store.get(HISTORY_KEY)
  await $.store.set(HISTORY_KEY, mergeHistory(isHistory(stored) ? stored : [], after))
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
        forgetBreakdown()
        const done = compactedOf(result, await $.clock.now())
        if (done !== null) await update($, lastCompactAtom, () => done)
      })
      .catch((error: unknown) => $.ui.toast(words().compactFailed(reasonOf(error))))
      .finally(() => update($, compactingAtom, () => false)),
  )
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
  if (isHistory(saved)) await update($, historyAtom, () => accountHistory(saved))
  const chosen = await $.store.get(BAND_KEY)
  band.chosen = isBandMode(chosen) ? chosen : null
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

  // Any compaction of the main conversation (/compact, auto, the button); a precompute installs nothing.
  on('session.compact', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId === undefined && e.trigger !== 'precompute') forgetBreakdown()

    return result
  })

  on('session.measure', async ($, e, next) => {
    try {
      const fresh = toUsage(e)
      if (!isSame(await read($, usageAtom), fresh)) await update($, usageAtom, () => fresh)
      await writeHub($, fresh)
      await noticeHigh($, fresh)
      await record($, fresh)
    } catch {
      $.ui.log('hud-pro: measure failed', { to: 'debug' })
    }

    return next(e)
  })
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

function onBand(on: On) {
  // The bottom row of the band, right above the prompt: what the plugins beneath drew stays above it.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const theirs = await next(e)
    try {
      const usage = await read($, usageAtom)
      if (e.props.hasSurvey || usage === null || (await read($, hiddenAtom))) return theirs
      const ui = $.ui.resolve(e)
      const isDesktop = e.surface !== 'terminal' && 'Svg' in ui
      const row = bandRow(ui, {
        usage,
        columns: e.props.bodyColumns,
        nowMs: await $.clock.now(),
        forecasts: await forecastsOf($, usage),
        isDesktop,
        canCompact: !e.props.isWorking && !(await read($, compactingAtom)),
        compact: () => compactNow($),
        isAlertsOnly: isAlertsOnly(band.chosen ?? band.setting, isDesktop),
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
  onCommand(on)
  onRender(on)
  band.setting = isBandMode(options?.band) ? options.band : 'auto'
  onBand(on)
}
