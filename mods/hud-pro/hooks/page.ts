import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { compactPoint, freshBreakdown, keepBreakdown, keepLast } from './context'
import { PANE } from './command'
import { compactNow, pressSection } from './draw-hook'
import { HUB_PANE } from './hub'
import { startReading } from './past-hook'
import { pagePressOf } from './page-act'

// The Usage page the MODZ hub draws in its own pane (modz/hooks/pages/usage.tsx). The hub draws it from this mod's
// state, so what the pane read inside its own drawing (the window by category) is read here, outside any drawing,
// and kept under `breakdown`; a press on the page (modz.act) does what the pane's own control does.

const breakdownAtom = atom({ plugin: 'hud-pro', key: 'breakdown' } as const, null)
const focusAtom = atom({ plugin: 'hud-pro', key: 'focus' } as const, null as string | null)
const rangeAtom = atom({ plugin: 'hud-pro', key: 'pastRange' } as const, 7)

// Whether the hub's one pane shows the Usage page now.
export async function isPageShown($: EngineInterface): Promise<boolean> {
  const stage = (await $.state.get({ plugin: 'modz', key: 'stage' })).value
  const drawn = (await $.state.get({ plugin: 'modz', key: 'drawn' })).value

  return stage?.pane === HUB_PANE && Array.isArray(drawn) && drawn.includes(HUB_PANE)
}

// The engine's local estimate, read at most as often as the pane reads it (context.ts), or now when forced.
// register.tsx calls it on each reading and after a compaction (an event has one hook a mod).
export async function keepPageBreakdown($: EngineInterface, isForced = false): Promise<void> {
  const nowMs = await $.clock.now()
  if (!isForced && freshBreakdown(nowMs) !== undefined && (await read($, breakdownAtom)) !== null) return
  let view
  try {
    view = keepBreakdown(nowMs, (await $.session.usage({ breakdown: 'summary' })).context.breakdown)
  } catch {
    $.ui.log('hud-pro: context breakdown failed', { to: 'debug' })
    view = keepLast(nowMs)
  }
  await update($, breakdownAtom, () => ({ at: nowMs, view, compactAt: compactPoint() }))
}

async function onAct($: EngineInterface, value: unknown): Promise<void> {
  const press = pagePressOf(value)
  if (press === null) return
  if (press.kind === 'compact') return compactNow($, () => keepPageBreakdown($, true))
  if (press.kind === 'range') return void (await update($, rangeAtom, () => press.range))
  await pressSection($, press.section, press.action)
}

type On = Parameters<Register>[0]

export function onPage(on: On) {
  // The hub puts the page up: this mod's own pane steps aside, and what it shows is read anew. Any other stage
  // forgets the section a command led with, so the next visit starts at Limits.
  on('state.set', { plugin: 'modz', key: 'stage' } as any, async ($: EngineInterface, e: any, next: any) => {
    const done = await next(e)
    if (await isPageShown($)) {
      await $.ui.close({ id: PANE })
      await keepPageBreakdown($)
      await startReading($)
    } else if (e.value?.pane !== HUB_PANE && (await read($, focusAtom)) !== null) await update($, focusAtom, () => null)

    return done
  }).catch(($: EngineInterface, e: any, next: any) => next(e))

  // A press on the page: after the hub's write settles, so the meter mods hear a section press as from the pane.
  on('state.set', { plugin: 'modz', key: 'act' } as any, async ($: EngineInterface, e: any, next: any) => {
    const done = await next(e)
    const value: unknown = e.value
    $.clock.after(0, () => void onAct($, value).catch(() => $.ui.log('hud-pro: a press on the hub\'s Usage page failed', { to: 'debug' })))

    return done
  }).catch(($: EngineInterface, e: any, next: any) => next(e))
}
