import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement } from 'claude-code'

import { bandRow } from './band'
import { band, isAlertsOnly } from './band-mode'
import type { ContextView } from './breakdown'
import { PANE, focus } from './command'
import { compactedOf, forecastsFrom, forgetBreakdown, freshBreakdown, keepBreakdown, keepLast, reasonOf } from './context'
import type { Forecasts } from './model'
import { paceOf } from './pace'
import { paceSection } from './pace-section'
import { paneTree, withHome } from './pane'
import type { CardData } from './pane'
import { pastViewOf } from './past-hook'
import { pinned } from './pin'
import { isSection } from './sections'
import { headToDraw, isLive } from './slot'
import { words } from './words'
import type { HudUsage, UsageSection } from '../types'

// What the HUD draws: the Usage pane, and its rows of the band above the prompt (the shared notice line on top,
// the HUD line at the bottom).

const usageAtom = atom({ plugin: 'hud-pro', key: 'usage' } as const, null)
const turnAtom = atom({ plugin: 'hud-pro', key: 'turn' } as const, { requests: 0, input: 0, output: 0, cacheRead: 0 })
const lastTurnAtom = atom({ plugin: 'hud-pro', key: 'lastTurn' } as const, null)
const hiddenAtom = atom({ plugin: 'hud-pro', key: 'isHidden' } as const, false)
const historyAtom = atom({ plugin: 'hud-pro', key: 'history' } as const, [])
const compactingAtom = atom({ plugin: 'hud-pro', key: 'isCompacting' } as const, false)
const contextTurnsAtom = atom({ plugin: 'hud-pro', key: 'contextTurns' } as const, [])
const lastCompactAtom = atom({ plugin: 'hud-pro', key: 'lastCompact' } as const, null)
const liveAtom = atom({ plugin: 'hud-pro', key: 'isLive' } as const, false)
const pastAtom = atom({ plugin: 'hud-pro', key: 'past' } as const, null)
const rangeAtom = atom({ plugin: 'hud-pro', key: 'pastRange' } as const, 7)
const sharesAtom = atom({ plugin: 'hud-pro', key: 'shares' } as const, [])
const noticesAtom = atom({ plugin: 'hud-pro', key: 'notices' } as const, [])

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

// Pace, then what the other meter mods published; a value that is not a section is left out.
async function sectionsOf($: EngineInterface, usage: HudUsage | null): Promise<UsageSection[]> {
  const nowMs = await $.clock.now()
  const published: unknown[] = [
    (await $.state.get({ plugin: 'session-budget', key: 'section' })).value,
    (await $.state.get({ plugin: 'cache-tax', key: 'section' })).value,
    (await $.state.get({ plugin: 'effort-router', key: 'section' })).value,
  ]
  // Before any reading the pane's own line says readings are coming; a pace section would only repeat it.
  const pace = paceOf({ usage, history: await read($, historyAtom), nowMs })
  const own = usage === null ? [] : [paceSection({ pace, shares: await read($, sharesAtom), nowMs })]

  return [...own, ...published.filter(isSection)]
}

// A section's button: written for the mod that owns the section, which hears it and acts; then drawn again, since
// that mod's new section was written inside this write, where this mod's own hooks hear nothing.
async function pressSection($: EngineInterface, section: string, action: string): Promise<void> {
  try {
    await $.state.set({ plugin: 'hud-pro', key: 'press' }, { section, action, at: await $.clock.now() })
    $.ui.invalidate('ui.render')
  } catch {
    $.ui.log('hud-pro: a section press failed', { to: 'debug' })
  }
}

type On = Parameters<Register>[0]

function onPane(on: On) {
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
      sections: { sections: await sectionsOf($, usage), press: (section, action) => void pressSection($, section, action) },
      focus: focus.section,
      ...(e.surface !== 'terminal' && 'Svg' in ui ? { svg: ui.Svg } : {}),
    })

    return pinned(e, isHubOn ? withHome(ui, { tree, goHome: () => void goHome($) }) : tree)
  })
}

// A louder mod's live notice holds the shared line (slot.ts LOUDER).
async function isOutranked($: EngineInterface): Promise<boolean> {
  const nowMs = await $.clock.now()
  const values: unknown[] = [
    (await $.state.get({ plugin: 'reflect', key: 'notice' })).value,
    (await $.state.get({ plugin: 'you-should-know', key: 'notice' })).value,
    (await $.state.get({ plugin: 'cache-tax', key: 'notice' })).value,
    (await $.state.get({ plugin: 'session-budget', key: 'notice' })).value,
    (await $.state.get({ plugin: 'effort-router', key: 'notice' })).value,
  ]

  return values.some(value => isLive(value, nowMs))
}

// The HUD's notice for the shared line, or null when it has none or a louder one holds the line.
async function noticeRow($: EngineInterface, ui: Record<string, any>): Promise<RenderElement | null> {
  const queue = await read($, noticesAtom)
  if (queue.length === 0 || (await isOutranked($))) return null
  const head = headToDraw(queue, await $.clock.now())
  const { Box, Text } = ui

  return head === null ? null : (
    <Box key="hud-pro-notice">
      <Text dimColor wrap="wrap">{head.text}</Text>
    </Box>
  )
}

type BandSite = { ui: Record<string, any>; surface: string; columns: number; isWorking: boolean }

async function hudRow($: EngineInterface, site: BandSite): Promise<RenderElement | null> {
  const usage = await read($, usageAtom)
  if (usage === null || (await read($, hiddenAtom))) return null
  const isDesktop = site.surface !== 'terminal' && 'Svg' in site.ui

  return bandRow(site.ui, {
    usage,
    columns: site.columns,
    nowMs: await $.clock.now(),
    forecasts: await forecastsOf($, usage),
    isDesktop,
    canCompact: !site.isWorking && !(await read($, compactingAtom)),
    compact: () => compactNow($),
    isAlertsOnly: isAlertsOnly(band.chosen ?? band.setting, isDesktop),
  })
}

function onBand(on: On) {
  // The notice above what the plugins beneath drew, as notices go; the HUD line at the bottom, next to the prompt.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const theirs = await next(e)
    try {
      if (e.props.hasSurvey) return theirs
      const ui = $.ui.resolve(e)
      const notice = await noticeRow($, ui)
      const row = await hudRow($, { ui, surface: e.surface, columns: e.props.bodyColumns, isWorking: e.props.isWorking })
      if (notice === null && row === null) return theirs
      const { Box } = ui

      return (
        <Box flexDirection="column">
          {notice}
          {theirs}
          {row === null ? null : pinned(e, row)}
        </Box>
      )
    } catch {
      $.ui.log('hud-pro: band render failed', { to: 'debug' })

      return theirs
    }
  })
}

export function onDraw(on: On) {
  onPane(on)
  onBand(on)
}
