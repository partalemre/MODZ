import type { RenderSurface } from 'claude-code'

import { HUB_PANE } from './hub'
import type { SuiteFilter } from '../types'

// A press on the Tests page the MODZ hub draws in its own pane (modz/hooks/pages/tests.tsx) reaches this mod as
// `{ plugin: 'modz', key: 'act' }` = `{ page: 'tests', action, arg?, at }`; this reads it into what the pane's own
// button does. A failure is named by its place in this mod's own list, never by a path the hub sends.

export type PagePress =
  | { kind: 'rerun' }
  | { kind: 'filter'; filter: SuiteFilter }
  | { kind: 'open'; index: number; surface: RenderSurface }

const FILTERS: readonly string[] = ['all', 'unit', 'e2e', 'lint', 'typecheck']
const SURFACES: readonly string[] = ['terminal', 'desktop', 'mobile', 'vscode']

function openOf(arg: unknown): PagePress | null {
  try {
    const pair: unknown = JSON.parse(String(arg))
    if (!Array.isArray(pair)) return null
    const [index, surface] = pair as unknown[]
    if (!Number.isInteger(index) || (index as number) < 0 || typeof surface !== 'string' || !SURFACES.includes(surface)) return null

    return { kind: 'open', index: index as number, surface: surface as RenderSurface }
  } catch {
    return null
  }
}

export function pagePressOf(value: unknown): PagePress | null {
  if (typeof value !== 'object' || value === null) return null
  const { page, action, arg } = value as { page?: unknown; action?: unknown; arg?: unknown }
  if (page !== HUB_PANE) return null
  if (action === 'rerun') return { kind: 'rerun' }
  if (action === 'filter') return typeof arg === 'string' && FILTERS.includes(arg) ? { kind: 'filter', filter: arg as SuiteFilter } : null

  return action === 'open' ? openOf(arg) : null
}
