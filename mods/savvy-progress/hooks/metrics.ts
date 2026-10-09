import type { AgentRun, LimitTrack } from '../types'
import { ctxOf } from './agents'
import type { Progress } from './estimate'
import { fmtCost, fmtTokens } from './format'
import { t } from './i18n'
import { shareNumber, shareOf } from './limit'
import type { Chip } from './metrics-svg'

// What an agent used, as chips on the desktop and one line on the terminal: its context, its
// tokens, its ≈$ and, once the session has a rate for it, its ≈share of the 5h limit.

const PERCENT = 100
const CONTEXT_COLOR = '#8f8cf4'
const LIMIT_COLOR = '#d49a3a'

export const limitShareOf = (a: AgentRun, limit: LimitTrack | null): number | null => shareOf(a.costUsd, limit)

export const chipsOf = (a: AgentRun, limit: LimitTrack | null): Chip[] => {
  const s = t()
  const ctx = ctxOf(a)
  const share = limitShareOf(a, limit)
  const chips: Chip[] = [
    { text: `${s.context} ${s.pct(ctx)}`, ring: { ratio: ctx / PERCENT, color: CONTEXT_COLOR } },
    { text: `${fmtTokens(a.tokens)} ${s.tokensWord}` },
    { text: `≈${fmtCost(a.costUsd)}` },
  ]
  if (share !== null) chips.push({ text: `${s.limit} ≈${s.pct(shareNumber(share))}`, ring: { ratio: share / PERCENT, color: LIMIT_COLOR } })
  return chips
}

export const metricsLine = (a: AgentRun, limit: LimitTrack | null): string => chipsOf(a, limit).map(chip => chip.text).join(' · ')

export const progressLabel = (p: Progress): string => `${p.isEstimate ? '~' : ''}${t().pct(Math.round(p.value * PERCENT))}`
