import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { BAND_KEY, band, parseBand } from './band-mode'
import { HUB_PANE, isOwnOpen } from './hub'
import { motion } from './pane-motion'
import { LOUDER } from './slot'
import { isOffStage, shownOf } from './stage'
import { words } from './words'

// What /hud does: hide or show the line, open the pane (`full`), or pick the band (`band <mode>`).

export const PANE = 'hud-pro'
export const HIDDEN_KEY = 'hud-pro.hidden'

const hiddenAtom = atom({ plugin: 'hud-pro', key: 'isHidden' } as const, false)

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

// The section the pane leads with: the one a meter mod's command asked for, or none (Limits first).
export const focus: { section: string | null } = { section: null }

// The meter mods whose sections the pane draws, by the section each publishes.
const SECTION_OF: Readonly<Record<string, string>> = { 'session-budget': 'budget', 'cache-tax': 'cache', 'effort-router': 'effort' }
// The hub's Effort row asks for effort-router's pane, which the Usage pane stands in for once that mod reports.
const EFFORT_PANE = 'effort'

// Opens the pane, or brings it forward when it is open already; never closes it.
async function openPane($: EngineInterface, section: string | null = null): Promise<void> {
  focus.section = section
  motion.reset()
  const opened = await $.ui.open({ id: PANE, title: words().paneTitle, focus: true, closeOnEscape: true })
  if (opened.isPlaced) await reportShown($)
}

// `/hud band <mode>`: stored, so it holds in every session, and drawn at once.
async function setBand($: EngineInterface, args: string): Promise<{ text: string }> {
  const mode = parseBand(args)
  if (mode === null) return { text: words().bandUsage }
  band.chosen = mode
  await $.store.set(BAND_KEY, mode)
  $.ui.invalidate('ui.render')

  return { text: words().bandSet(mode) }
}

async function runCommand($: EngineInterface, args: string): Promise<{ text?: string }> {
  const arg = args.trim().toLowerCase()
  if (arg.startsWith('band')) return setBand($, args)
  if (arg !== 'full') return toggle($)
  await openPane($)

  return {}
}

type On = Parameters<Register>[0]

export function onCommand(on: On) {
  on('command.run', { command: 'hud' }, async ($, e) => {
    try {
      return await runCommand($, e.args)
    } catch {
      return { text: words().commandFailed }
    }
  })
  // The MODZ main panel asks for this pane by writing `{ pane: 'usage' }` to `modz.open`; modz's contract is not
  // this mod's to import, so its address stays untyped here.
  on('state.set', { plugin: 'modz', key: 'open' } as any, async ($: EngineInterface, e: any, next: any) => {
    const done = await next(e)
    if (isOwnOpen(e.value)) await openPane($)
    else if (e.value?.pane === EFFORT_PANE && (await $.state.get({ plugin: 'effort-router', key: 'section' })).value !== undefined) {
      await openPane($, 'effort')
    }

    return done
  }).catch(($: EngineInterface, e: any, next: any) => next(e))
  // Another pane took the hub's one panel: this one steps aside rather than wait as a tab.
  on('state.set', { plugin: 'modz', key: 'stage' } as any, async ($: EngineInterface, e: any, next: any) => {
    const done = await next(e)
    if (isOffStage(e.value, HUB_PANE)) await $.ui.close({ id: PANE })

    return done
  }).catch(($: EngineInterface, e: any, next: any) => next(e))
  onUsageAsks(on)
}

// The other meter mods: an ask for the pane at their section, a changed section, a louder notice that comes or goes.
function onUsageAsks(on: On) {
  // `/budget`, `/cache-tax` or `/effort-router` while this mod runs: the Usage pane opens at that mod's section.
  on('state.set', { key: 'openUsage' } as any, async ($: EngineInterface, e: any, next: any) => {
    const done = await next(e)
    const section = SECTION_OF[e.plugin]
    if (section !== undefined) await openPane($, section)

    return done
  }).catch(($: EngineInterface, e: any, next: any) => next(e))
  // A section that changed draws again; so does the band when a louder notice comes or goes (slot.ts).
  on('state.set', { key: 'section' } as any, async ($: EngineInterface, e: any, next: any) => {
    const done = await next(e)
    if (SECTION_OF[e.plugin] !== undefined) $.ui.invalidate('ui.render')

    return done
  }).catch(($: EngineInterface, e: any, next: any) => next(e))
  on('state.set', { key: 'notice' } as any, async ($: EngineInterface, e: any, next: any) => {
    const done = await next(e)
    if ((LOUDER as readonly string[]).includes(e.plugin)) $.ui.invalidate('ui.render')

    return done
  }).catch(($: EngineInterface, e: any, next: any) => next(e))
}
