import { fitText } from './kit/svg-metrics'
import type { Measure } from './kit/svg-metrics'
import { words } from './words'
import type { Percent } from '../types'

const K = 1000
const M = 1_000_000
const MIN_MS = 60_000
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

const trimmed = (value: number): string => (value >= 100 ? String(Math.round(value)) : String(Math.round(value * 10) / 10))

export function tokensText(count: number): string {
  if (count >= K * M) return `${trimmed(count / (K * M))}B`
  if (count >= M) return `${trimmed(count / M)}M`
  if (count >= K) return `${trimmed(count / K)}k`

  return String(count)
}

export function agoText(thenMs: number, nowMs: number): string {
  const { ago } = words()
  const gap = nowMs - thenMs
  if (thenMs === 0) return '—'
  if (gap < MIN_MS) return ago.now
  if (gap < HOUR_MS) return ago.min(Math.floor(gap / MIN_MS))
  if (gap < DAY_MS) return ago.hour(Math.floor(gap / HOUR_MS))

  return ago.day(Math.floor(gap / DAY_MS))
}

// The same age for a row's narrow column: no "ago", every row reading the same way.
export function agoShortText(thenMs: number, nowMs: number): string {
  const { agoShort } = words()
  const gap = nowMs - thenMs
  if (thenMs === 0) return '—'
  if (gap < MIN_MS) return agoShort.now
  if (gap < HOUR_MS) return agoShort.min(Math.floor(gap / MIN_MS))
  if (gap < DAY_MS) return agoShort.hour(Math.floor(gap / HOUR_MS))

  return agoShort.day(Math.floor(gap / DAY_MS))
}

export function spanText(ms: number): string {
  if (ms < MIN_MS) return `${Math.round(ms / 1000)} s`
  if (ms < HOUR_MS) return `${Math.round(ms / MIN_MS)} min`

  return `${trimmed(ms / HOUR_MS)} h`
}

// `~` marks a number that is a judgment (DESIGN.md §1.2); a counted one has none, and no number is a dash.
export function percentText(percent: Percent): string {
  if (percent.value === null) return '—'

  return `${percent.kind === 'estimate' ? '~' : ''}${percent.value}%`
}

// A week without commits still leaves work the model never read: past it, an estimate reads as old.
const ESTIMATE_FRESH_MS = 7 * DAY_MS

export const isFaded = (percent: Percent, nowMs: number): boolean =>
  percent.isStale || (percent.kind === 'estimate' && percent.at > 0 && nowMs - percent.at > ESTIMATE_FRESH_MS)

// A folder under the home folder as `~`, with either kind of slash.
export function shortPath(root: string, home: string): string {
  if (home === '' || !root.startsWith(home)) return root
  const rest = root.slice(home.length)

  return rest === '' || rest.startsWith('/') || rest.startsWith('\\') ? `~${rest}` : root
}

// A path cut in its middle, since its two ends say the most: `~/…/clients/app`.
export function fitPath(path: string, max: number, measure: Measure): string {
  if (measure(path) <= max) return path
  const slash = path.includes('/') ? '/' : '\\'
  const parts = path.split(slash)
  for (let kept = parts.length - 2; kept > 0; kept -= 1) {
    const cut = [parts[0], '…', ...parts.slice(-kept)].join(slash)
    if (measure(cut) <= max) return cut
  }

  return fitText(path, max, measure)
}

const FOLD_SLACK = 1.15

// Text cut at a word near `chars`, or whole when folding would hide next to nothing.
export function foldText(text: string, chars: number): { text: string; isCut: boolean } {
  if (text.length <= chars * FOLD_SLACK) return { text, isCut: false }
  const space = text.lastIndexOf(' ', chars)

  return { text: `${text.slice(0, space > 0 ? space : chars).trimEnd()}…`, isCut: true }
}
