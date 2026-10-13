// The turns this mod keeps and the line it gives the hub. Pure.
import type { EffortMode, HubTone, RouteClass, StepEffort, TurnRow } from '../types'
import { words } from './words'

// Rows the pane lists, and turns the hub line counts.
export const TURNS_KEPT = 8
export const HUB_WINDOW = 5
export const HUB_DETAIL_MAX = 40
export const SNIPPET_MAX = 40

// A key or token pasted into a prompt never reaches the judge, the pane or the state: long unbroken runs and
// NAME=value pairs are masked. Minimal on purpose; secret-guard is the full detector.
const LONG_TOKEN = /[A-Za-z0-9_\-+/=]{32,}/gu
const ASSIGNMENT = /\b([A-Z][A-Z0-9_]{2,})=\S+/gu
const MASK = '****'

export const redact = (text: string): string => text.replace(ASSIGNMENT, `$1=${MASK}`).replace(LONG_TOKEN, MASK)

const ELLIPSIS = '…'

export function snippetOf(text: string): string {
  const line = redact(text.split('\n').find(part => part.trim() !== '')?.trim() ?? '')
  const chars = [...line]

  return chars.length <= SNIPPET_MAX ? line : `${chars.slice(0, SNIPPET_MAX - 1).join('').trimEnd()}${ELLIPSIS}`
}

// "claude-opus-5-5" reads as "opus-5-5"; a dated id keeps its date off.
export const shortModel = (model: string): string => model.replace(/^claude-/u, '').replace(/-\d{8}$/u, '')

export const effortText = (effort: StepEffort | undefined): string => (effort === undefined ? '—' : String(effort))

export const isLowered = (row: TurnRow): boolean => row.asked !== undefined && row.sent !== row.asked

export type TurnStart = { turnId: string; at: number; text: string; cls: RouteClass | null }

export function startedRow(start: TurnStart): TurnRow {
  return { turnId: start.turnId, at: start.at, snippet: snippetOf(start.text), cls: start.cls, model: '' }
}

// A new turn goes first; the list keeps the newest `TURNS_KEPT`.
export function withTurn(turns: readonly TurnRow[], row: TurnRow): TurnRow[] {
  return [row, ...turns.filter(turn => turn.turnId !== row.turnId)].slice(0, TURNS_KEPT)
}

export type StepSeen = { turnId: string; asked?: StepEffort; sent?: StepEffort; model: string }

// A turn's first step fixes what it asked for; a later one (a fallback model) updates what was sent.
export function withStep(turns: readonly TurnRow[], step: StepSeen): TurnRow[] {
  return turns.map(turn => {
    if (turn.turnId !== step.turnId) return turn
    const asked = turn.model === '' ? step.asked : turn.asked
    const row: TurnRow = { turnId: turn.turnId, at: turn.at, snippet: turn.snippet, cls: turn.cls, model: step.model }
    if (asked !== undefined) row.asked = asked
    if (step.sent !== undefined) row.sent = step.sent

    return row
  })
}

export type HubShown = { detail: string; tone: HubTone }

// "high · last 5: 3 high, 2 low"; groups that do not fit become "+N". Nothing to say before a step.
export function hubOf(turns: readonly TurnRow[], mode: EffortMode): HubShown {
  if (mode === 'off') return { detail: words().off, tone: 'idle' }
  const sent = turns.filter(turn => turn.model !== '').slice(0, HUB_WINDOW)
  const latest = sent[0]
  if (latest === undefined) return { detail: '', tone: 'idle' }
  const counts = new Map<string, number>()
  for (const turn of sent) counts.set(effortText(turn.sent), (counts.get(effortText(turn.sent)) ?? 0) + 1)
  const groups = [...counts].sort((a, b) => b[1] - a[1]).map(([effort, count]) => `${count} ${effort}`)

  return { detail: fitGroups({ head: effortText(latest.sent), window: sent.length, groups }), tone: 'idle' }
}

function fitGroups(o: { head: string; window: number; groups: string[] }): string {
  for (let shown = o.groups.length; shown > 0; shown -= 1) {
    const rest = o.groups.length - shown
    const tail = rest > 0 ? ` +${rest}` : ''
    const line = `${o.head} · ${words().lastN(o.window)}: ${o.groups.slice(0, shown).join(', ')}${tail}`
    if ([...line].length <= HUB_DETAIL_MAX) return line
  }

  return o.head
}
