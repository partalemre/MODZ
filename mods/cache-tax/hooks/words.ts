// What the mod says and when: the lines are in phrases-en.ts and phrases-tr.ts, picked at the moment they are
// said (the language is set at session.start). Command names and their arguments stay English.

import type { CommandSpec } from 'claude-code'

import { AUTO_WARM_MS, DEFAULT_WINDOW_MS, TTL_MS, breakEvenPings, coldUsd, isCold, priceOf, warmUsd } from './core'
import type { State } from './core'
import { decimal, fmtDuration, fmtInt, fmtTok, fmtUsd } from './fmt'
import { pick } from './lang'
import { EN } from './phrases-en'
import type { Phrases } from './phrases-en'
import { TR } from './phrases-tr'

export const say = (): Phrases => pick({ en: EN, tr: TR })

export const autoWarm = (): string => fmtDuration(AUTO_WARM_MS)

/** How long ago the cache went cold. */
export const coldFor = (s: State, now: number): number => now - s.lastRequestAt - TTL_MS

export function rateText(s: State): string {
  const price = priceOf(s.lastModel)
  return price ? `$${decimal(price[1])}/MTok` : say().rateUnknown
}

export function guardText(s: State, now: number): string {
  const warm = warmUsd(s)
  const ago = fmtDuration(coldFor(s, now))
  return say().guard({ ago, tokens: fmtInt(s.ctx), rate: rateText(s), usd: fmtUsd(coldUsd(s)), warm: warm == null ? null : fmtUsd(warm) })
}

/** The drop reason. With the band the card says the rest, so the host's line stays short. */
export function dropText(s: State, now: number): string {
  if (s.hasBand) return say().dropHeld(fmtUsd(coldUsd(s)))
  return say().drop(guardText(s, now), autoWarm())
}

export const warnText = (s: State, now: number): string => say().warn(guardText(s, now), autoWarm())

export const paidText = (tokens: number, usd: number | null): string =>
  say().paid({ tokens: fmtTok(tokens), usd: fmtUsd(usd), auto: autoWarm() })

export const resumeText = (tokens: number, usd: string): string => say().resume(fmtInt(tokens), usd)

/** What comes after the time left in the keepwarm line: the next ping, or why there is none yet. */
function nextPingText(s: State, now: number): string {
  if (!s.lastRequestAt) return say().firstTurn
  if (s.compacted) return say().afterCompact
  if (isCold(s, now)) return say().coldPing(fmtDuration(s.every))
  return say().pingIn(fmtDuration(s.lastRequestAt + s.every - now))
}

export const lastPingText = (s: State): string => (s.last ? say().lastPing(fmtTok(s.last.read), fmtUsd(s.last.usd)) : '')

/** The keepwarm line: the status fallback, `/keepwarm status` and the card's keepwarm row. */
export function statusText(s: State, now: number): string | undefined {
  if (s.stopped) return say().stopped(s.stopped)
  if (!s.deadline) return undefined
  return `${say().left(fmtDuration(s.deadline - now))}${nextPingText(s, now)}${lastPingText(s)}`
}

const coldNowText = (s: State): string => say().coldNow(fmtDuration(s.every))

/** The reply to an arming command; on a cold cache it says when the first ping can come. */
export function armedText(s: State, now: number, windowMs: number): string {
  const span = fmtDuration(windowMs)
  if (isCold(s, now)) return `${say().armedCold(span)}${coldNowText(s)}`
  return say().armed({ span, every: fmtDuration(s.every) })
}

export const alwaysText = (s: State, now: number): string =>
  say().always(fmtDuration(DEFAULT_WINDOW_MS)) + (isCold(s, now) ? coldNowText(s) : '')

/** The two commands as the command list shows them. */
export const commands = (): Record<'keepwarm' | 'cacheTax', CommandSpec> => ({
  keepwarm: {
    name: 'keepwarm',
    description: say().keepwarmCommand,
    argumentHint: '[6h | always | off | status]',
    immediate: true,
  },
  cacheTax: {
    name: 'cache-tax',
    description: say().cacheTaxCommand,
    argumentHint: '[status | guard warn | guard refuse]',
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
  if (s.deadline) return `${say().on((statusText(s, now) ?? '').replace(/^keepwarm /, ''))}${always}`
  if (s.stopped) return `${say().stoppedRow(s.stopped)}${always}`
  const window = fmtDuration(DEFAULT_WINDOW_MS)
  return s.always ? say().offUntilNext(window) : say().off(window)
}

/** `/cache-tax`: the model, the clock, the price and the session's tally. */
export function cardText(s: State, now: number): string {
  const { labels } = say()
  const lines = [s.lastModel ?? say().noModel, row(labels.state, stateRow(s, now)), row(labels.context, say().context(fmtInt(s.ctx)))]
  lines.push(row(labels.cost, say().cost(fmtUsd(coldUsd(s)), fmtUsd(warmUsd(s)))))
  lines.push(row(labels.keepwarm, keepwarmRow(s, now)))
  const pings = breakEvenPings(s)
  if (pings != null) {
    lines.push(row(labels.even, say().even(pings, { every: fmtDuration(s.every), span: fmtDuration(pings * s.every) })))
  }
  lines.push(row(labels.guard, s.guard === 'refuse' ? say().guardRefuse : say().guardWarn))
  const paid = s.misses.reduce((a, m) => a + (m.usd ?? 0), 0)
  lines.push(row(labels.session, say().session(s.misses.length, fmtUsd(paid))))
  return lines.join('\n')
}
