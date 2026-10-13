import type { ContextCategory } from 'claude-code'

import { categoryLabel, words } from './words'

// The context card's bar: the window by category, as /context counts it, in a few named parts.
// The four largest used rows keep their names, the rest fold into "Other"; then the free space and
// the compaction reserve. Rows on demand (`deferred`) sit outside the window and are left out.

export const TOP_CATEGORIES = 4

export type SegmentKind = 'used' | 'other' | 'free' | 'reserve'
export type Segment = { label: string; tokens: number; kind: SegmentKind }

export type ContextView = {
  segments: Segment[]
  // The bar's whole: every segment together, so each reads as a share of the window.
  total: number
  usedTokens: number
  // Where auto-compaction runs, when it is on; the "~N turns" forecast counts up to it.
  compactAt: number | null
}

type BreakdownLike = { categories: readonly ContextCategory[]; autoCompactThreshold?: number; isAutoCompactEnabled: boolean }

const sumOf = (rows: readonly { tokens: number }[]): number => rows.reduce((sum, row) => sum + row.tokens, 0)

function tailSegments(categories: readonly ContextCategory[]): Segment[] {
  const free = sumOf(categories.filter(row => row.kind === 'free'))
  const reserve = sumOf(categories.filter(row => row.kind === 'buffer'))

  return [
    ...(free > 0 ? [{ label: words().freeSpace, tokens: free, kind: 'free' as const }] : []),
    ...(reserve > 0 ? [{ label: words().reserve, tokens: reserve, kind: 'reserve' as const }] : []),
  ]
}

export function contextView(breakdown: BreakdownLike): ContextView | null {
  const used = breakdown.categories.filter(row => row.kind === 'used' && row.tokens > 0).sort((left, right) => right.tokens - left.tokens)
  const top = used.slice(0, TOP_CATEGORIES).map(row => ({ label: categoryLabel(row.name), tokens: row.tokens, kind: 'used' as const }))
  const rest = sumOf(used.slice(TOP_CATEGORIES))
  const segments = [...top, ...(rest > 0 ? [{ label: words().other, tokens: rest, kind: 'other' as const }] : []), ...tailSegments(breakdown.categories)]
  const total = sumOf(segments)
  if (total <= 0) return null
  const threshold = breakdown.isAutoCompactEnabled ? breakdown.autoCompactThreshold : undefined

  return { segments, total, usedTokens: sumOf(used), compactAt: threshold ?? null }
}
