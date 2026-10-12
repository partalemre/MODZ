import type { SessionRateLimit } from 'claude-code'

import type { Budget, BudgetKind, BudgetReading } from '../types'
import { words } from './words'

export type BudgetCommand =
  | { kind: 'status' }
  | { kind: 'off' }
  | { kind: 'set'; budget: { kind: BudgetKind; limit: number } }
  | { kind: 'error'; text: string }

export const WARN_RATIO = 0.8
export const FIVE_HOUR = 'five_hour'
const MAX_PERCENT = 100
const PERCENT = 100
const MS_PER_MINUTE = 60_000
const MINUTES_PER_HOUR = 60
// A pace needs a minute of history before "bu hızla" says anything.
const MIN_PACE_MS = 60_000
// "Devam et" adds $1, or a fifth of a 5h budget (at least one point).
const USD_STEP = 1
const PERCENT_STEP_SHARE = 5

export function parseCommand(raw: string): BudgetCommand {
  const arg = raw.trim().toLowerCase().replace(/\s+/g, '')
  if (arg === '' || arg === 'status') return { kind: 'status' }
  if (arg === 'off' || arg === 'clear') return { kind: 'off' }
  const usd = /^(?:\$(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)(?:\$|usd))$/.exec(arg)
  if (usd !== null) return positive('usd', Number(usd[1] ?? usd[2]))
  const percent = /^(\d+(?:\.\d+)?)%?$/.exec(arg)
  if (percent !== null) {
    const limit = Number(percent[1])
    if (limit > MAX_PERCENT) return { kind: 'error', text: words().tooMuch }

    return positive('percent', limit)
  }

  return { kind: 'error', text: words().usage }
}

function positive(kind: BudgetKind, limit: number): BudgetCommand {
  return limit > 0 ? { kind: 'set', budget: { kind, limit } } : { kind: 'error', text: words().notPositive }
}

export function readingOf(rateLimits: readonly SessionRateLimit[], usd: number | undefined): BudgetReading {
  const window = rateLimits.find(limit => limit.kind === FIVE_HOUR)

  return { percent: window?.percentUsed ?? null, resetsAt: window?.resetsAt ?? null, usd: usd ?? null }
}

export function valueOf(kind: BudgetKind, reading: BudgetReading): number | null {
  return kind === 'percent' ? reading.percent : reading.usd
}

export function startBudget(kind: BudgetKind, limit: number, reading: BudgetReading): Budget {
  const value = valueOf(kind, reading)

  return { kind, limit, base: value, carried: 0, last: value, window: reading.resetsAt, hasWarned: false, isAccepted: false }
}

// Folds a new reading in. A 5h window that reset starts counting again from 0.
export function advance(budget: Budget, reading: BudgetReading): Budget {
  const value = valueOf(budget.kind, reading)
  if (value === null) return budget
  if (budget.base === null) return { ...budget, base: value, last: value, window: reading.resetsAt }
  const hasReset = budget.kind === 'percent' && reading.resetsAt !== null && budget.window !== null && reading.resetsAt !== budget.window
  if (!hasReset) return { ...budget, last: value, window: reading.resetsAt ?? budget.window }
  const before = Math.max(0, (budget.last ?? budget.base) - budget.base)

  return { ...budget, base: 0, carried: budget.carried + before, last: value, window: reading.resetsAt }
}

export function spentOf(budget: Budget): number {
  if (budget.base === null || budget.last === null) return budget.carried

  return budget.carried + Math.max(0, budget.last - budget.base)
}

export function ratioOf(budget: Budget): number {
  return spentOf(budget) / budget.limit
}

// What "Devam et" adds to the budget.
export function stepOf(budget: Budget): number {
  return budget.kind === 'usd' ? USD_STEP : Math.max(1, Math.round(budget.limit / PERCENT_STEP_SHARE))
}

// Going on past a full budget: the step counts from what is spent, so the next ask comes a step later.
export function raise(budget: Budget): Budget {
  return { ...budget, limit: Math.max(budget.limit, spentOf(budget)) + stepOf(budget) }
}

const decimal = (value: number, digits: number): string => words().decimal(value.toFixed(digits))
const trim = (value: number): string => words().decimal(value.toFixed(1).replace(/\.0$/, ''))

export const amountOf = (budget: Budget, value: number): string =>
  budget.kind === 'usd' ? `$${decimal(value, 2)}` : words().percent(trim(value))

export const stepText = (budget: Budget): string => (budget.kind === 'usd' ? `+$${stepOf(budget)}` : `+${words().percent(String(stepOf(budget)))}`)

export const percentOf = (budget: Budget): string => words().percent(String(Math.round(ratioOf(budget) * PERCENT)))

// "$4,00 / $5,00", or "5s %8,5 / %10" for a share of the 5h limit.
export function spendText(budget: Budget): string {
  const pair = `${amountOf(budget, spentOf(budget))} / ${amountOf(budget, budget.limit)}`

  return budget.kind === 'usd' ? pair : `${words().fiveHour} ${pair}`
}

export function describe(budget: Budget): string {
  return `${spendText(budget)} (${percentOf(budget)})`
}

// Minutes until the budget runs out at the pace since it was set; null without an honest pace.
export function etaMinutes(budget: Budget, nowMs: number): number | null {
  const spent = spentOf(budget)
  const elapsed = budget.setAt === undefined ? 0 : nowMs - budget.setAt
  if (spent <= 0 || elapsed < MIN_PACE_MS || spent >= budget.limit) return null

  return Math.max(1, Math.round(((budget.limit - spent) / spent) * (elapsed / MS_PER_MINUTE)))
}

export function etaText(minutes: number | null): string {
  if (minutes === null) return ''
  if (minutes < MINUTES_PER_HOUR) return words().etaMinutes(minutes)

  return words().etaHours(Math.floor(minutes / MINUTES_PER_HOUR), minutes % MINUTES_PER_HOUR)
}
