import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionUsage } from 'claude-code'

import { addTurn } from './forecast'
import { addShare, paceWindow, shareOf } from './pace'
import { shareNotice } from './pace-section'
import { enqueue } from './slot'
import { addUsage, toUsage } from './usage'
import type { HudGauge, HudTurn } from '../types'

// The current turn's requests and tokens, the last finished turn's, whether a turn is running, the context's
// fill at each main-loop turn's end, and each such turn's share of the limit window; the pane, the forecast and
// the pace read them. A notable share waits for the line above the prompt (slot.ts).

export const EMPTY_TURN: HudTurn = { requests: 0, input: 0, output: 0, cacheRead: 0 }

// The engine reads each module's use of the mod's values from that module's own source.
const turnAtom = atom({ plugin: 'hud-pro', key: 'turn' } as const, EMPTY_TURN)
const lastTurnAtom = atom({ plugin: 'hud-pro', key: 'lastTurn' } as const, null)
const contextTurnsAtom = atom({ plugin: 'hud-pro', key: 'contextTurns' } as const, [])
const liveAtom = atom({ plugin: 'hud-pro', key: 'isLive' } as const, false)
const usageAtom = atom({ plugin: 'hud-pro', key: 'usage' } as const, null)
const sharesAtom = atom({ plugin: 'hud-pro', key: 'shares' } as const, [])
const noticesAtom = atom({ plugin: 'hud-pro', key: 'notices' } as const, [])

// The window as the running turn started, for its share once it ends.
const running: { window: HudGauge | null } = { window: null }

type On = Parameters<Register>[0]

// The window's rise over the turn just ended; a notable one waits for the line.
async function recordShare($: EngineInterface, measured: SessionUsage): Promise<void> {
  const after = paceWindow(toUsage(measured))
  if (after === null) return
  const share = { window: after.id, share: shareOf(running.window, after), percent: after.percent }
  await update($, sharesAtom, shares => addShare(shares, share))
  const text = shareNotice(share)
  if (text === null) return
  await update($, noticesAtom, queue => enqueue(queue, text))
  $.ui.invalidate('ui.render')
}

export function onTurns(on: On) {
  on('turn.start', async ($, e, next) => {
    const finished = await read($, turnAtom)
    if (finished.requests > 0) await update($, lastTurnAtom, () => finished)
    await update($, turnAtom, () => EMPTY_TURN)
    running.window = paceWindow(await read($, usageAtom))
    // Only the main loop raises `turn.start`; a subagent's run has none.
    await update($, liveAtom, () => true)

    return next(e)
  })

  // The context's fill as each main-loop turn ends, for the "~N turns" forecast, and the window's share of the turn.
  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId !== undefined) return done
    await update($, liveAtom, () => false)
    const measured = await $.session.usage()
    await recordShare($, measured)
    const tokens = measured.context.tokens
    // An unmeasured turn adds no sample: the forecast counts only what was read.
    if (tokens === undefined) return done
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
