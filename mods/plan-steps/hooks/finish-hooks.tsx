import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import { plansOf, signatureOf, STORE_KEY, withoutPlan } from './carry'
import { finishCard } from './finish-card'
import type { FinishActions } from './finish-card'
import { finishCall, heldCount, nextStep, noticeOf } from './finish'
import { resolveLight } from './kit/tokens'
import { resolvePlan } from './match'
import type { Plan } from './match'
import { pinned } from './pin'
import { words } from './words'

// The engine reads each module's use of the mod's values from that module's own source.
const carriedAtom = atom({ plugin: 'plan-steps', key: 'carried' } as const, null)
const dismissedAtom = atom({ plugin: 'plan-steps', key: 'dismissed' } as const, null)
const docAtom = atom({ plugin: 'plan-steps', key: 'doc' } as const, null)
const heldAtom = atom({ plugin: 'plan-steps', key: 'held' } as const, null)
const noticeAtom = atom({ plugin: 'plan-steps', key: 'notice' } as const, null)
const tasksAtom = atom({ plugin: 'plan-steps', key: 'tasks' } as const, [])

// The finish guard (finish.ts is the pure half): after a main-loop answer that worked on the plan and left
// steps open, a card above the prompt (DESIGN.md §6, slot 2, one notification at a time), or in strict mode
// a prompt to go on.

export type FinishCtx = {
  // When the plan last moved, by the register file's clock of it.
  touchedAt: () => number
  isStrict: boolean
}

// Louder notifications share the slot: while one shows, the card waits.
const cacheTaxNotice = { plugin: 'cache-tax', key: 'notice' } as const
const knowNotice = { plugin: 'you-should-know', key: 'notice' } as const
const reflectNotice = { plugin: 'reflect', key: 'notice' } as const
const budgetNotice = { plugin: 'session-budget', key: 'notice' } as const
const testBadgeNotice = { plugin: 'test-badge', key: 'notice' } as const
const handoffNotice = { plugin: 'handoff', key: 'notice' } as const

// When the current turn began (a plan moved since then is one this turn worked on), and the card's theme.
const turn = { startedAt: 0, isLight: false }

const reason = (error: unknown): string => (error instanceof Error ? error.message : 'unknown')

async function currentPlan($: EngineInterface): Promise<Plan | null> {
  return resolvePlan(await read($, tasksAtom), await read($, docAtom))
}

async function hasLouderNotice($: EngineInterface): Promise<boolean> {
  const others: { value?: unknown }[] = [
    await $.state.get(cacheTaxNotice as never),
    await $.state.get(knowNotice as never),
    await $.state.get(reflectNotice as never),
    await $.state.get(budgetNotice as never),
    await $.state.get(testBadgeNotice as never),
    await $.state.get(handoffNotice as never),
  ]

  return others.some(other => other.value !== undefined && other.value !== null)
}

async function clearNotice($: EngineInterface): Promise<void> {
  if ((await read($, noticeAtom)) !== null) await update($, noticeAtom, () => null)
}

// Only a person's press, or the strict mode the person turned on, submits.
function submit($: EngineInterface, title: string): void {
  void $.prompt.submit({ text: words().continuePrompt(title) }).catch(error => {
    $.ui.log(`plan-steps: could not continue the plan (${reason(error)})`, { to: 'debug' })
  })
}

// The card follows Claude Code's theme setting; `auto` leaves its colours to the system's appearance.
async function refreshLook($: EngineInterface): Promise<void> {
  try {
    turn.isLight = resolveLight({ theme: (await $.config.list()).find(row => row.key === 'theme')?.value })
  } catch (error) {
    $.ui.log(`plan-steps: theme not readable (${reason(error)})`, { to: 'debug' })
  }
}

async function guard($: EngineInterface, ctx: FinishCtx): Promise<void> {
  const plan = await currentPlan($)
  const facts = { plan, isTouched: ctx.touchedAt() >= turn.startedAt, dismissed: await read($, dismissedAtom), held: await read($, heldAtom), isStrict: ctx.isStrict }
  const call = finishCall(facts)
  if (call === 'none' || plan === null) return
  if (call === 'card') {
    await refreshLook($)
    const notice = noticeOf(plan, await $.clock.now())
    await update($, noticeAtom, () => notice)

    return
  }
  const signature = signatureOf(plan.steps)
  await update($, heldAtom, held => ({ signature, count: heldCount(held, signature) + 1 }))
  submit($, nextStep(plan))
}

// No longer kept, carried or guarded. Done here, in the press: the mod's own state.set hooks do not hear it.
async function markDone($: EngineInterface, signature: string): Promise<void> {
  await update($, dismissedAtom, () => signature)
  if ((await read($, carriedAtom)) !== null) await update($, carriedAtom, () => null)
  try {
    const root = await $.session.root()
    const plans = plansOf(await $.store.get(STORE_KEY))
    if (plans[root] !== undefined) await $.store.set(STORE_KEY, withoutPlan(plans, root))
  } catch (error) {
    $.ui.log(`plan-steps: could not drop the kept plan (${reason(error)})`, { to: 'debug' })
  }
}

function actionsFor($: EngineInterface): FinishActions {
  return {
    onContinue: () => void (async () => {
      const notice = await read($, noticeAtom)
      await clearNotice($)
      if (notice !== null) submit($, notice.next)
    })(),
    onMarkDone: () => void (async () => {
      const notice = await read($, noticeAtom)
      await clearNotice($)
      if (notice !== null) await markDone($, notice.signature)
    })(),
    onNotNow: () => void clearNotice($),
  }
}

export function wireFinish(on: On, ctx: FinishCtx): void {
  // The turn a prompt starts; the card goes with it.
  on('turn.start', async ($, e, next) => {
    turn.startedAt = await $.clock.now()
    await clearNotice($)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', { reason: 'answer' }, async ($, e, next) => {
    const done = await next(e)
    if (e.agentId === undefined) await guard($, ctx)

    return done
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const theirs = await next(e)
    const notice = await read($, noticeAtom)
    if (notice === null || e.props.isWorking || (await hasLouderNotice($))) return theirs
    const ui = $.ui.resolve(e)
    const card = finishCard({ ui, surface: e.surface, isLight: turn.isLight }, { notice, columns: e.props.bodyColumns, actions: actionsFor($) })
    const { Box } = ui

    return pinned(e, <Box flexDirection="column" gap={1}>{card}{theirs}</Box>)
  })
}
