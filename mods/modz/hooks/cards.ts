// The mods' cards as the hub keeps them (DESIGN.md §9), and the one beat the hub runs on its own: while a card
// shows a time that runs ("4m"), the hub is drawn again every few seconds; with none, nothing ticks.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { HubCard } from '../types'
import { cardOf } from './hub'
import { isSame } from './kit/same'
import { HUB_PANE } from './kit/stage'
import { hasRunningClock } from './now'

// State refs live in each file that reads them: the engine follows literals, not imports.
const cardsAtom = atom({ plugin: 'modz', key: 'cards' } as const, {} as Record<string, HubCard>)

type On = Parameters<Register>[0]
type Timer = { cancel: () => void }

// A running line is told in ten-second steps under a minute (now.ts), so this is as often as its words can change.
const BEAT_MS = 10_000
let beat: Timer | null = null

// One beat: the hub is drawn again, but only while it is the pane shown (behind a mod's pane there is nothing to tell).
async function redrawShown($: EngineInterface): Promise<void> {
  if ((await $.ui.panes()).some(pane => pane.id === HUB_PANE && pane.isShown)) $.ui.invalidate('ui.render')
}

// The beat runs only while a card shows a running time. It writes nothing: the redraw reads the clock.
function keepBeat($: EngineInterface, cards: Record<string, HubCard>): void {
  if (!hasRunningClock(cards)) {
    beat?.cancel()
    beat = null

    return
  }
  beat ??= $.clock.every(BEAT_MS, () => void redrawShown($).catch(cause => $.ui.log(`modz: the hub's beat failed: ${String(cause)}`, { to: 'debug' })))
}

export function wireCards(on: On): void {
  // Every mod reports its line under its own `hub` key; the hub keeps the latest of each.
  on('state.set', { key: 'hub' }, async ($, e, next) => {
    const done = await next(e)
    const card = cardOf(e.value)
    // Widened from the declared reporters: the hub also hears a mod it does not list, and never itself.
    const from: string = e.plugin
    if (card === null || from === 'modz') return done
    // An unchanged card is not kept again: the write would redraw the hub for nothing.
    if (isSame((await read($, cardsAtom))[from], card)) return done
    keepBeat($, await update($, cardsAtom, cards => ({ ...cards, [from]: card })))

    return done
  }).catch(($, e, next) => next(e))
}
