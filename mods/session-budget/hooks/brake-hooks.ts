import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import { BRAKE_DEFAULT, brakeWhy } from './brake'
import { isWeekly } from './budget'
import { words } from './words'

// The spawn brake: past its line in the limit window, a subagent spawn asks first. Moved out of register.tsx as is.

// Agent is today's name of the subagent tool; Task the older one.
const SPAWN_TOOLS = /^(Agent|Task)$/

const enabledAtom = atom({ plugin: 'session-budget', key: 'isEnabled' } as const, true)
const brakeAtom = atom({ plugin: 'session-budget', key: 'brakeAt' } as const, BRAKE_DEFAULT)
const ackAtom = atom({ plugin: 'session-budget', key: 'brakeAck' } as const, null)
const paceAtom = atom({ plugin: 'session-budget', key: 'pace' } as const, { points: [], resetsAt: null })

// A fan-out raises several spawns at once: they share one brake question.
const run: { brake: Promise<boolean> | null } = { brake: null }

// "Dur" first, as the main way; anything else, a dismissal or nobody to ask lets spawns through for a step.
async function askBrake($: EngineInterface, why: string): Promise<boolean> {
  const says = words()
  let answer: string | null = null
  try {
    answer = await $.ui.ask(says.brakeQuestion(why), { options: [says.stop, says.brakeGo], header: says.brakeHeader })
  } catch {
    // Nobody to ask (a -p run) or dismissed: the brake never blocks a spawn it cannot ask about.
    $.ui.log('session-budget: spawn brake not answered; spawn let through', { to: 'debug' })
  }
  if (answer === says.stop) return false
  const pace = await read($, paceAtom)
  const percent = pace.points[pace.points.length - 1]?.value ?? 0
  await update($, ackAtom, () => ({ percent, window: pace.resetsAt }))

  return true
}

async function heldWhy($: EngineInterface): Promise<string | null> {
  if (!(await read($, enabledAtom))) return null
  const pace = await read($, paceAtom)

  const ack = await read($, ackAtom)

  return brakeWhy({ at: await read($, brakeAtom), points: pace.points, resetsAt: pace.resetsAt, ack, isWeekly: isWeekly(pace.scope) })
}

export function registerBrake(on: On) {
  // Only spawns are braked; a brake that fails lets the spawn through.
  on('tool.call', { tool: SPAWN_TOOLS }, async ($, e, next) => {
    const why = await heldWhy($)
    if (why === null) return next(e)
    run.brake ??= askBrake($, why).finally(() => {
      run.brake = null
    })

    return (await run.brake) ? next(e) : { deny: words().brakeDenied(why) }
  }).catch(($, e, next) => next(e))
}
