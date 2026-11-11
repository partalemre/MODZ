// What the mod says and when: the lines are in phrases-en.ts and phrases-tr.ts, picked at the moment they are
// said (the language is set at session.start). Command names and their arguments stay English.

import type { CommandSpec } from 'claude-code'

import { DEFAULT_WINDOW_MS, MAX_PINGS, MAX_PING_OUTPUT, TTL_MS, breakEvenPings, coldUsd, heldModel, holdMs, isCold, priceOf, warmUsd } from './core'
import { shareOf } from './share'
import type { State } from './core'
import { modelName } from './model-switch'
import type { ModelSwitch } from './model-switch'
import { decimal, fmtDuration, fmtInt, fmtTok, fmtUsd } from './fmt'
import { pick } from './lang'
import { EN } from './phrases-en'
import type { Phrases } from './phrases-en'
import { TR } from './phrases-tr'

export const say = (): Phrases => pick({ en: EN, tr: TR })

export const autoWarm = (s: State): string => fmtDuration(holdMs(s))

/** How long ago the cache went cold. */
export const coldFor = (s: State, now: number): number => now - s.lastRequestAt - TTL_MS

export function rateText(s: State, model = s.lastModel): string {
  const price = priceOf(model, s.ctx)
  return price ? say().perMillion(decimal(price[1])) : say().rateUnknown
}

/** Why the send is cold, and the model it is priced at: the one a switch sends it to. */
export type Cause = { now: number; switched: ModelSwitch | null }

/** On a subscription with a basis, "≈2% of the weekly limit"; null otherwise. Under half a point says "<1". */
export function shareText(s: State, usd: number | null): string | null {
  const share = shareOf(s.rate, usd)
  if (share === null) return null
  const percent = share.percent < HALF_POINT ? '<1' : decimal(String(Math.round(share.percent)))
  return say().share(percent, share.isWeekly)
}

const HALF_POINT = 0.5

export function guardText(s: State, { now, switched }: Cause): string {
  const model = switched?.to ?? s.lastModel
  const warm = warmUsd(s, model)
  const usd = coldUsd(s, model)
  const lead = switched ? say().switchLead(modelName(switched.from), modelName(switched.to)) : say().coldLead(fmtDuration(coldFor(s, now)))
  const share = shareText(s, usd)
  return say().guard({ lead, tokens: fmtInt(s.ctx), rate: rateText(s, model), usd: fmtUsd(usd), warm: warm == null ? null : fmtUsd(warm), share })
}

/** The drop reason for the held send. With the band the card says the rest, so the host's line stays short. */
export function dropText(s: State, now: number): string {
  const switched = s.held?.switch ?? null
  const usd = fmtUsd(coldUsd(s, heldModel(s)))
  if (s.hasBand) return switched ? say().dropSwitched(usd) : say().dropHeld(usd)
  return say().drop(guardText(s, { now, switched }))
}

export const warnText = (s: State, cause: Cause): string => say().warn(guardText(s, cause))

export const floorText = (s: State): string => say().underFloor(fmtUsd(s.guardFloor))

/** The reply to `/cache-tax guard ...`. */
export function guardSetText(s: State): string {
  if (s.guard === 'warn') return say().guardMode.warn
  return s.guardFloor ? say().guardMode.floor(fmtUsd(s.guardFloor)) : say().guardMode.refuse
}

function guardRow(s: State): string {
  if (s.guard === 'warn') return say().guardWarn
  return s.guardFloor ? say().guardFloor(fmtUsd(s.guardFloor)) : say().guardRefuse
}

/** After a full rewrite: the window the card's pay button opened, or the offer of /keepwarm. */
export const paidText = (s: State, { tokens, usd, isWarm }: { tokens: number; usd: number | null; isWarm: boolean }): string =>
  isWarm ? say().paid({ tokens: fmtTok(tokens), usd: fmtUsd(usd), auto: autoWarm(s) }) : say().paidCold({ tokens: fmtTok(tokens), usd: fmtUsd(usd) })

const capText = (): string => say().cap(MAX_PINGS, MAX_PING_OUTPUT)

export const resumeText = (tokens: number, usd: string): string => say().resume(fmtInt(tokens), usd)

/** What comes after the time left in the keepwarm line: the next ping, or why there is none yet. */
function nextPingText(s: State, now: number): string {
  if (!s.lastRequestAt) return say().firstTurn
  if (s.compacted) return say().afterCompact
  if (isCold(s, now)) return say().coldPing(fmtDuration(s.every))
  if (s.waitForTurn) return say().firstTurn
  return say().pingIn(fmtDuration(s.lastRequestAt + s.every - now))
}

export const lastPingText = (s: State): string => (s.last ? say().lastPing(fmtTok(s.last.read), fmtUsd(s.last.usd)) : '')

/** Time left, the next refresh and the last one: what the keepwarm line and the card's row share. */
const heldText = (s: State, now: number): string =>
  `${say().left(fmtDuration(s.deadline - now))}${nextPingText(s, now)}${lastPingText(s)}`

/** The keepwarm line: the status fallback and `/keepwarm status`. */
export function statusText(s: State, now: number): string | undefined {
  if (s.stopped) return say().stopped(s.stopped)
  if (!s.deadline) return undefined
  return say().warmFor(heldText(s, now))
}

const coldNowText = (s: State): string => say().coldNow(fmtDuration(s.every))

/** The reply to an arming command; on a cold cache it says when the first ping can come. */
export function armedText(s: State, now: number, windowMs: number): string {
  const span = fmtDuration(windowMs)
  if (isCold(s, now)) return `${say().armedCold(span)}${capText()}${coldNowText(s)}`
  return say().armed({ span, every: fmtDuration(s.every) }) + capText()
}

export const alwaysText = (s: State, now: number): string =>
  say().always(fmtDuration(s.alwaysMs)) + capText() + (isCold(s, now) ? coldNowText(s) : '')

/** The two commands as the command list shows them. */
export const commands = (): Record<'keepwarm' | 'cacheTax', CommandSpec> => ({
  keepwarm: {
    name: 'keepwarm',
    description: say().keepwarmCommand,
    argumentHint: '[6h | always [24h] | off | status]',
    immediate: true,
  },
  cacheTax: {
    name: 'cache-tax',
    description: say().cacheTaxCommand,
    argumentHint: '[status | guard warn | guard refuse [dollars]]',
    immediate: true,
  },
})

const row = (label: string, value: string): string => `${label.padEnd(12)}${value}`

function stateRow(s: State, now: number): string {
  if (s.compacted) return say().compacted
  if (!s.lastRequestAt) return say().noRequest
  if (isCold(s, now)) return say().coldState(fmtDuration(now - s.lastRequestAt))
  return say().warmState(fmtDuration(s.lastRequestAt + TTL_MS - now))
}

function keepwarmRow(s: State, now: number): string {
  const always = s.always ? ' (always)' : ''
  if (s.deadline) return `${say().on(heldText(s, now))}${always}${capText()}`
  if (s.stopped) return `${say().stoppedRow(s.stopped)}${always}`
  return s.always ? say().offUntilNext(fmtDuration(s.alwaysMs)) : say().off(fmtDuration(DEFAULT_WINDOW_MS))
}

/** `/cache-tax`: the model, the clock, the price and the session's tally. */
export function cardText(s: State, now: number): string {
  const { labels } = say()
  const lines = [s.lastModel ?? say().noModel, row(labels.state, stateRow(s, now)), row(labels.context, say().context(fmtInt(s.ctx)))]
  const hasPrice = s.lastModel === null || priceOf(s.lastModel, s.ctx) !== null
  lines.push(row(labels.cost, hasPrice ? say().cost(fmtUsd(coldUsd(s)), fmtUsd(warmUsd(s))) : say().noPrice))
  lines.push(row(labels.keepwarm, keepwarmRow(s, now)))
  const pings = breakEvenPings(s)
  if (pings != null) {
    lines.push(row(labels.even, say().even(pings, { every: fmtDuration(s.every), span: fmtDuration(pings * s.every) })))
  }
  lines.push(row(labels.guard, guardRow(s)))
  const paid = s.misses.reduce((a, m) => a + (m.usd ?? 0), 0)
  lines.push(row(labels.session, say().session(s.misses.length, fmtUsd(paid))))
  return lines.join('\n')
}
