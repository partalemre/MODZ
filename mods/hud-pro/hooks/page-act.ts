import { HUB_PANE } from './hub'
import { RANGES } from './past'
import type { HudRange } from '../types'

// A press on the Usage page the MODZ hub draws (modz/hooks/pages/usage.tsx) reaches this mod as
// `{ plugin: 'modz', key: 'act' }` = `{ page: 'usage', action, arg?, at }`. A section's button travels as
// `press` with `[section, action]` (JSON) and is handed on as the pane's own press is (draw-hook.tsx pressSection).

export type PagePress = { kind: 'compact' } | { kind: 'range'; range: HudRange } | { kind: 'press'; section: string; action: string }

function sectionPress(arg: unknown): PagePress | null {
  try {
    const pair: unknown = JSON.parse(String(arg))
    if (!Array.isArray(pair) || pair.length !== 2) return null
    const [section, action] = pair as unknown[]

    return typeof section === 'string' && typeof action === 'string' ? { kind: 'press', section, action } : null
  } catch {
    return null
  }
}

export function pagePressOf(value: unknown): PagePress | null {
  if (typeof value !== 'object' || value === null) return null
  const { page, action, arg } = value as { page?: unknown; action?: unknown; arg?: unknown }
  if (page !== HUB_PANE) return null
  if (action === 'compact') return { kind: 'compact' }
  if (action === 'range') {
    const range = RANGES.find(each => String(each) === arg)

    return range === undefined ? null : { kind: 'range', range }
  }

  return action === 'press' ? sectionPress(arg) : null
}
