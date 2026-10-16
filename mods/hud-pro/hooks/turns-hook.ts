import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { addTurn } from './forecast'
import { addUsage } from './usage'
import type { HudTurn } from '../types'

// The current turn's requests and tokens, the last finished turn's, whether a turn is running, and the context's
// fill at each main-loop turn's end; the pane and the forecast read them.

export const EMPTY_TURN: HudTurn = { requests: 0, input: 0, output: 0, cacheRead: 0 }

// The engine reads each module's use of the mod's values from that module's own source.
const turnAtom = atom({ plugin: 'hud-pro', key: 'turn' } as const, EMPTY_TURN)
const lastTurnAtom = atom({ plugin: 'hud-pro', key: 'lastTurn' } as const, null)
const contextTurnsAtom = atom({ plugin: 'hud-pro', key: 'contextTurns' } as const, [])
const liveAtom = atom({ plugin: 'hud-pro', key: 'isLive' } as const, false)

type On = Parameters<Register>[0]

export function onTurns(on: On) {
  on('turn.start', async ($, e, next) => {
    const finished = await read($, turnAtom)
    if (finished.requests > 0) await update($, lastTurnAtom, () => finished)
    await update($, turnAtom, () => EMPTY_TURN)
    // Only the main loop raises `turn.start`; a subagent's run has none.
    await update($, liveAtom, () => true)

    return next(e)
  })

  // The context's fill as each main-loop turn ends, for the "~N turns" forecast.
  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId !== undefined) return done
    await update($, liveAtom, () => false)
    const tokens = (await $.session.usage()).context.tokens
    await update($, contextTurnsAtom, turns => addTurn(turns, tokens))

    return done
  })

  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    const usage = result.usage
    if (usage !== null && e.agentId === undefined) await update($, turnAtom, turn => addUsage(turn, usage))

    return result
  })
}
