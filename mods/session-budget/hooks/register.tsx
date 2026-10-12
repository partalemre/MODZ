import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, PromptOrigin, Register } from 'claude-code'

import { WARN_RATIO, advance, describe, parseCommand, raise, ratioOf, readingOf, spendText, startBudget, stepText } from './budget'
import { fullCard, isLive, noticeAbove, stoppedRow, warnRow } from './notice'
import { setLang } from './lang'
import { pinned } from './pin'
import { words } from './words'
import type { Budget, BudgetNotice } from '../types'

const BUDGET = 'budget'
const TOGGLE = 'session-budget'
const STORE_KEY = 'session-budget.enabled'
const PRIORITY = 1
const DISMISS_AFTER_MS = 20_000
// After "Dur" the dropped prompt goes back in the box once the dialog has given it back.
const RESTORE_AFTER_MS = 300
// Prompts a person typed; a plugin's, a peer's or a scheduled one is never held back.
const TYPED_ORIGINS = new Set<PromptOrigin['kind']>(['composer', 'bridge'])

const budgetAtom = atom({ plugin: 'session-budget', key: 'budget' } as const, null)
const readingAtom = atom({ plugin: 'session-budget', key: 'reading' } as const, { percent: null, resetsAt: null, usd: null })
const noticeAtom = atom({ plugin: 'session-budget', key: 'notice' } as const, null)
const enabledAtom = atom({ plugin: 'session-budget', key: 'isEnabled' } as const, true)
// The shared notice line: every one of these outranks this mod's line.
const cacheTaxNotice = { plugin: 'cache-tax', key: 'notice' } as const
const knowNotice = { plugin: 'you-should-know', key: 'notice' } as const
const reflectNotice = { plugin: 'reflect', key: 'notice' } as const

const run = { nextId: 0 }

async function notify($: EngineInterface, kind: BudgetNotice['kind'], text: string): Promise<void> {
  run.nextId += 1
  const id = run.nextId
  const expiresAt = (await $.clock.now()) + DISMISS_AFTER_MS
  await update($, noticeAtom, () => ({ id, kind, text, isAlert: kind === 'stopped', priority: PRIORITY, expiresAt }))
  $.clock.after(DISMISS_AFTER_MS, () => {
    void update($, noticeAtom, current => (current !== null && current.id === id ? null : current))
  })
}

async function checkWarn($: EngineInterface, budget: Budget): Promise<void> {
  if (budget.hasWarned || ratioOf(budget) < WARN_RATIO || ratioOf(budget) >= 1) return
  await update($, budgetAtom, current => (current === null ? null : { ...current, hasWarned: true }))
  await notify($, 'warn', words().warned(describe(budget)))
}

async function setBudget($: EngineInterface, args: string): Promise<string> {
  const command = parseCommand(args)
  if (command.kind === 'error') return command.text
  if (command.kind === 'off') {
    await update($, budgetAtom, () => null)

    return words().removed
  }
  if (command.kind === 'status') {
    const budget = await read($, budgetAtom)

    return budget === null ? words().none : words().status(describe(budget))
  }
  const reading = await read($, readingAtom)
  const { kind, limit } = command.budget
  const hasData = kind === 'percent' ? reading.percent !== null : reading.usd !== null
  const setAt = await $.clock.now()
  await update($, budgetAtom, () => ({ ...startBudget(kind, limit, reading), setAt }))
  const unit = kind === 'percent' ? words().percentUnit(limit) : `$${limit}`

  return words().set(unit, hasData ? '' : words().waitForData)
}

// "Dur" first, as the main way; "Devam et (+$1)" raises the budget a step and lets the prompt in.
async function confirm($: EngineInterface, budget: Budget): Promise<boolean> {
  const says = words()
  const goOn = `${says.goOn} (${stepText(budget)})`
  let answer: string | null = null
  try {
    // The question's chip is its header; the card above it is drawn for that header alone.
    answer = await $.ui.ask(says.question(describe(budget)), { options: [says.stop, goOn], header: says.header })
  } catch {
    // Nobody to ask (a -p run) or dismissed: a budget never blocks a turn it cannot ask about.
    $.ui.log('session-budget: confirm dismissed; prompt let through', { to: 'debug' })
  }
  if (answer === says.stop) return false
  const accept = (current: Budget) => (answer === null ? { ...current, isAccepted: true } : raise(current))
  await update($, budgetAtom, current => (current === null ? null : accept(current)))

  return true
}

// The typed prompt is not lost: it returns to the empty box, for the person to send after /budget.
function restoreDraft($: EngineInterface, text: string): void {
  $.clock.after(RESTORE_AFTER_MS, () => {
    void (async () => {
      const box = await $.prompt.read()
      if (box.text.trim() === '' && text.trim() !== '') await $.prompt.fill({ text })
    })().catch(() => $.ui.log('session-budget: could not put the prompt back', { to: 'debug' }))
  })
}

async function isPersonTyped($: EngineInterface, origin: PromptOrigin): Promise<boolean> {
  if (TYPED_ORIGINS.has(origin.kind)) return true

  // The desktop app's Code tab hosts the session through the SDK: its typed prompts arrive as `sdk`.
  return origin.kind === 'sdk' && (await $.session.surfaces()).length > 0
}

async function isOutranked($: EngineInterface): Promise<boolean> {
  const nowMs = await $.clock.now()
  const cacheTax: { value?: unknown } = await $.state.get(cacheTaxNotice as never)
  const know: { value?: unknown } = await $.state.get(knowNotice as never)
  const reflect: { value?: unknown } = await $.state.get(reflectNotice as never)

  return [cacheTax.value, know.value, reflect.value].some(value => isLive(value, nowMs))
}

function registerSetup(on: On) {
  on('session.start', async ($, e, next) => {
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    try {
      const saved = await $.store.get(STORE_KEY)
      await update($, enabledAtom, () => saved !== false)
      const usage = await $.session.usage()
      await update($, readingAtom, () => readingOf(usage.rateLimits, usage.cost?.usd))
      await $.command.register({ name: BUDGET, description: words().budgetHelp, argumentHint: '<20% | $5 | off>' })
      await $.command.register({ name: TOGGLE, description: words().toggleHelp, argumentHint: '[on|off]' })
    } catch {
      $.ui.log('session-budget: could not load settings', { to: 'debug' })
    }

    return next(e)
  })

  on('command.run', { command: BUDGET }, async ($, e) => ({ text: await setBudget($, e.args) }))

  on('command.run', { command: TOGGLE }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const isOn = arg === 'on' || (arg !== 'off' && !(await read($, enabledAtom)))
    await update($, enabledAtom, () => isOn)
    await $.store.set(STORE_KEY, isOn)
    if (!isOn) await update($, noticeAtom, () => null)

    return { text: words().switched(isOn) }
  })
}

function registerFlow(on: On) {
  on('session.measure', async ($, e, next) => {
    try {
      const reading = readingOf(e.rateLimits, e.cost?.usd)
      await update($, readingAtom, () => reading)
      const budget = await read($, budgetAtom)
      if (budget !== null) {
        const advanced = advance(budget, reading)
        await update($, budgetAtom, () => advanced)
        if (await read($, enabledAtom)) await checkWarn($, advanced)
      }
    } catch {
      $.ui.log('session-budget: could not read usage', { to: 'debug' })
    }

    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    const budget = await read($, budgetAtom)
    const isOver = budget !== null && !budget.isAccepted && ratioOf(budget) >= 1
    if (!isOver || !(await read($, enabledAtom)) || !(await isPersonTyped($, e.origin))) return next(e)
    if (await confirm($, budget)) return next(e)
    await notify($, 'stopped', words().stoppedNotice(spendText(budget)))
    restoreDraft($, e.text)

    return { drop: words().dropped(describe(budget)) }
  }).catch(($, e, next) => next(e))
}

function registerBand(on: On) {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const theirs = await next(e)
    const notice = await read($, noticeAtom)
    if (notice === null || e.props.hasSurvey || !isLive(notice, await $.clock.now())) return theirs
    if (await isOutranked($)) return theirs
    const ui = $.ui.resolve(e)
    const budget = await read($, budgetAtom)
    const dismiss = () => void update($, noticeAtom, () => null)
    if (notice.kind === 'stopped') {
      const spend = budget === null ? '' : spendText(budget)

      return pinned(e, noticeAbove(ui, stoppedRow(ui, { text: notice.text, spend, surface: e.surface, columns: e.props.bodyColumns }), { theirs, dismiss }))
    }
    if (budget === null) return theirs

    return pinned(e, noticeAbove(ui, warnRow(ui, { budget, nowMs: await $.clock.now(), surface: e.surface, columns: e.props.bodyColumns }), { theirs, dismiss }))
  })

  // The full-budget question keeps Claude Code's own options; the card above says what is full.
  on('ui.render', { component: 'AskUserQuestion' }, async ($, e, next) => {
    const theirs = await next(e)
    const first = e.props.questions[0] as { header?: unknown } | undefined
    const budget = await read($, budgetAtom)
    if (first?.header !== words().header || budget === null) return theirs

    return pinned(e, fullCard($.ui.resolve(e), { budget, columns: e.viewport?.columns ?? 100, surface: e.surface, theirs }))
  })
}

export const register: Register = on => {
  registerSetup(on)
  registerFlow(on)
  registerBand(on)
}
