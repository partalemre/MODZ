import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { BAND_KEY, band, isBandMode } from './band-mode'
import { HIDDEN_KEY, onCommand } from './command'
import { forecastsFrom, forgetBreakdown } from './context'
import { onDraw } from './draw-hook'
import { accountHistory, addSample, hasLimitsMoved, isHistory, mergeHistory } from './history'
import { EMPTY_HUB, HUB_PANE, hubOf } from './hub'
import { setLang } from './lang'
import { gaugeViews } from './model'
import type { Forecasts } from './model'
import { paceOf } from './pace'
import { fillNotice } from './pace-section'
import { onPast } from './past-hook'
import { isSame } from './same'
import { enqueue, expired, resetSlot } from './slot'
import { onTurns } from './turns-hook'
import { newNotices, toUsage } from './usage'
import { words } from './words'
import type { HudUsage } from '../types'

const HISTORY_KEY = 'hud-pro.history'
// Reset countdowns move by the minute, so the idle line redraws once a minute.
const REFRESH_MS = 60_000

const usageAtom = atom({ plugin: 'hud-pro', key: 'usage' } as const, null)
const hiddenAtom = atom({ plugin: 'hud-pro', key: 'isHidden' } as const, false)
const historyAtom = atom({ plugin: 'hud-pro', key: 'history' } as const, [])
const contextTurnsAtom = atom({ plugin: 'hud-pro', key: 'contextTurns' } as const, [])
const hubAtom = atom({ plugin: 'hud-pro', key: 'hub' } as const, EMPTY_HUB)
const noticesAtom = atom({ plugin: 'hud-pro', key: 'notices' } as const, [])

const noticed = new Set<string>()
// The windows (by reset) whose fill-before-reset line was already said.
const filled = new Set<string>()
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

// A pace that fills the window before it resets earns one line per window, once the history holds the reading.
async function noticeFill($: EngineInterface, fresh: HudUsage): Promise<void> {
  const nowMs = await $.clock.now()
  const fill = fillNotice(paceOf({ usage: fresh, history: await read($, historyAtom), nowMs }), nowMs)
  if (fill === null || filled.has(fill.key)) return
  filled.add(fill.key)
  await update($, noticesAtom, queue => enqueue(queue, fill.text))
  $.ui.invalidate('ui.render')
}

async function forecastsOf($: EngineInterface, usage: HudUsage | null): Promise<Forecasts> {
  return forecastsFrom({ history: await read($, historyAtom), turns: await read($, contextTurnsAtom), usage })
}

// The minute clock moves only the gauges' countdowns, pace marks and estimates, and takes a notice that has been on
// screen long enough off the line; a minute that moves none of them redraws nothing, since every redraw also hands
// out new press handles.
async function redrawIfMoved($: EngineInterface): Promise<void> {
  const nowMs = await $.clock.now()
  const queue = await read($, noticesAtom)
  const left = expired(queue, nowMs)
  if (left !== queue) await update($, noticesAtom, () => [...left])
  const usage = await read($, usageAtom)
  const gauges = usage === null ? null : gaugeViews(usage, nowMs, await forecastsOf($, usage))
  if (isSame(gauges, shownGauges) && left === queue) return
  shownGauges = gauges
  $.ui.invalidate('ui.render')
}

async function setup($: EngineInterface): Promise<void> {
  // Said first, so the other meter mods know before they report that their sections show here.
  await $.state.set({ plugin: 'hud-pro', key: 'host' }, true)
  resetSlot()
  filled.clear()
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
      await noticeFill($, fresh)
    } catch {
      $.ui.log('hud-pro: measure failed', { to: 'debug' })
    }

    return next(e)
  })
}

export const register: Register = (on, options) => {
  onUsage(on)
  onTurns(on)
  onPast(on)
  onCommand(on)
  band.setting = isBandMode(options?.band) ? options.band : 'auto'
  onDraw(on)
}
