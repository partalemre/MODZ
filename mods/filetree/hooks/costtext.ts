// A read cost as the pane writes it: a measured count bare, a shared one with ≈, a guess with ~ (readcost.ts).

import type { CostKind, ReadCost, TurnLog } from '../types'
import { sumOf } from './readcost'
import { words } from './words'

const MARK: Record<CostKind, string> = { exact: '', share: '≈', guess: '~' }
const THOUSAND = 1_000
// Below this many thousands a short count keeps one decimal ("13.3k"); above it, none ("133k").
const DECIMAL_BELOW = 100

const grouped = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, words().thousands)

function short(n: number): string {
  if (n < THOUSAND) return String(Math.round(n))
  const k = n / THOUSAND
  return k < DECIMAL_BELOW ? `${k.toFixed(1).replace('.', words().decimal)}k` : `${Math.round(k)}k`
}

// "≈13,321" in full, "≈13.3k" where a row has little room.
export const costText = (c: ReadCost, isShort = false): string => `${MARK[c.kind]}${isShort ? short(c.tokens) : grouped(c.tokens)}`

// This turn's reads, the main loop's and its subagents' together; null before the first.
export function turnCost(turn: TurnLog): ReadCost | null {
  const all = Object.values(turn.costs ?? {})
  return all.length ? sumOf(all) : null
}

// A tree row's figure: the file's reads this turn, short, with its unit.
export function rowCost(turn: TurnLog, id: string): string {
  const c = turn.costs?.[id]
  return c ? `${costText(c, true)} ${words().tokUnit}` : ''
}
