import type { ModelUsage, SessionUsage } from 'claude-code'

import { CONTEXT, isFull, labelOf, longLabelOf, resetText, untilReset, valueText } from './format'
import { words } from './words'
import type { HudTurn, HudUsage } from '../types'

// The engine's figures as the HUD keeps them, and the notices a high window raises.

type Measured = Pick<SessionUsage, 'context' | 'rateLimits' | 'cost'>

const NOTICE_PERCENT = 90

export function toUsage(measured: Measured): HudUsage {
  const gauges = measured.rateLimits.map(limit => ({
    id: limit.kind,
    label: labelOf(limit.kind),
    percent: limit.percentUsed,
    resetsAt: limit.resetsAt ?? null,
  }))
  const { percent, tokens, window } = measured.context
  if (percent !== undefined) gauges.push({ id: CONTEXT, label: labelOf(CONTEXT), percent, resetsAt: null })
  const context = tokens === undefined ? null : { tokens, window }

  return { gauges, costUsd: measured.cost?.usd ?? null, context }
}

export function addUsage(turn: HudTurn, usage: ModelUsage): HudTurn {
  const inputSide = usage.input_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens

  return {
    requests: turn.requests + 1,
    input: turn.input + inputSide,
    output: turn.output + usage.output_tokens,
    cacheRead: turn.cacheRead + usage.cache_read_input_tokens,
  }
}

// One short notice per plan window once it passes 90%, with when it resets; `noticed` remembers
// which windows (by their reset) have had theirs.
export function newNotices(fresh: HudUsage, spec: { nowMs: number; noticed: Set<string> }): string[] {
  return fresh.gauges
    .filter(gauge => gauge.id !== CONTEXT && gauge.percent >= NOTICE_PERCENT)
    .flatMap(gauge => {
      const id = `${gauge.id}:${gauge.resetsAt}`
      if (spec.noticed.has(id)) return []
      spec.noticed.add(id)
      const reset = untilReset(gauge.resetsAt, spec.nowMs)
      const label = longLabelOf(gauge.id)
      const head = isFull(gauge.percent) ? words().limitFull(label) : words().limitAt(label, valueText(gauge.percent))

      return [reset === '' ? head : `${head} · ${resetText(reset)}`]
    })
}
