// This mod's section of hud-pro's Usage pane, and its lowered-turn notice for the shared line above the prompt.
// Pure: no `$`.
import type { EffortMode, TurnRow, UsageSection } from '../types'
import type { Lowered } from './lowered'
import { MODES } from './route'
import { effortText, isLowered, shortModel } from './turns'
import { words } from './words'

// The newest turns the section lists; the Effort pane of its own lists more.
const SECTION_TURNS = 5

function turnLine(row: TurnRow): string {
  const said = words()
  const snippet = row.snippet === '' ? said.continuation : row.snippet
  const from = isLowered(row) ? ` ${said.lowered(effortText(row.asked))}` : ''

  return `${effortText(row.sent)}${from} · ${shortModel(row.model)} · ${snippet}`
}

export function effortSection(turns: readonly TurnRow[], mode: EffortMode): UsageSection {
  const said = words()
  const actions = MODES.map(id => ({ id, label: said.modeName[id], isOn: id === mode }))
  const head = `${said.modeLabel}: ${said.modeName[mode]}. ${said.modeLine[mode]}`
  const sent = mode === 'off' ? [] : turns.filter(turn => turn.model !== '').slice(0, SECTION_TURNS)
  const base = { id: 'effort', title: said.title, tone: 'neutral' as const, actions, at: 0 }
  if (mode !== 'off' && sent.length === 0) return { ...base, lines: [`${said.noTurns}. ${said.waiting}`, head], isEmpty: true }

  return { ...base, lines: [head, ...sent.map(turnLine)] }
}

// The shared line's notice while a lowered turn's row waits for its re-send (expiresAt 0: until it is cleared).
export const loweredNotice = (lowered: Lowered) => ({ id: 1, text: words().loweredBand(String(lowered.sent), String(lowered.asked)), expiresAt: 0 })

// A notice of the shared line holds it until its `expiresAt`; one without (or 0) until it is cleared.
export function isLive(notice: unknown, nowMs: number): boolean {
  if (notice === undefined || notice === null) return false
  const expiresAt = (notice as { expiresAt?: unknown }).expiresAt

  return typeof expiresAt !== 'number' || expiresAt <= 0 || expiresAt > nowMs
}
