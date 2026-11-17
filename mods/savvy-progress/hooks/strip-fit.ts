import { CHIP_GAP, chipSvg, chipWidth } from './strip-chips'
import type { Chip } from './strip-chips'
import type { Drawing, TeamArt, Tier } from './strip-team'

// Which of the strip's chips fit its row, and how wide each is drawn. Every width is decided by the widest
// reading a chip can show, so the row never moves under the pointer as numbers change.

// The plan chip is counted this wide while the row is fitted, then takes the room left for its step, up to a cap;
// its width follows the row, never the step's name, so a new step does not move the chips after it.
const PLAN_MIN = 150
const PLAN_MAX = 340

/**
 * `rank` 0 never leaves the row; when it is tight the highest rank leaves first. `isNoteKept`: the note is the point.
 * `art`: a chip that draws itself (the teammate), at the width `tier` names.
 */
export type Slot = { chip: Chip; rank: number; isNoteKept?: boolean; press: () => unknown; art?: TeamArt; tier?: Tier }

const withoutNote = (slot: Slot): Slot => {
  const { note: _dropped, ...chip } = slot.chip

  return slot.isNoteKept === true ? slot : { ...slot, chip }
}

export const drawingOf = (slot: Slot, maxW: number): Drawing => {
  if (slot.art === undefined) return chipSvg(slot.chip, maxW)
  return slot.art[slot.tier ?? 'full']
}

const fitW = (slot: Slot): number => {
  if (slot.art !== undefined) return drawingOf(slot, 0).width
  return slot.chip.id === 'plan' ? PLAN_MIN : chipWidth(slot.chip)
}

const rowW = (row: readonly Slot[]): number => row.reduce((sum, slot) => sum + fitW(slot), 0) + CHIP_GAP * Math.max(0, row.length - 1)

// Side notes give way first, then whole chips by rank.
function trimmed(slots: readonly Slot[], width: number): Slot[] {
  let row = rowW(slots) > width ? slots.map(withoutNote) : [...slots]
  while (rowW(row) > width && row.some(slot => slot.rank > 0)) {
    const top = Math.max(...row.map(slot => slot.rank))
    row = row.filter(slot => slot.rank !== top)
  }

  return row
}

const quiet = (row: readonly Slot[]): Slot[] => row.map(withoutNote)

// When room is short, what gives way, in order: the plan's step title (it only ever gets the room left), the side
// values (the teammate's, then the other chips' notes), then whole chips (the teammate's face, the 5-hour allowance
// ranked with it, then the rest by rank). The teammate only ever takes room the others leave.
function withTeam(slots: readonly Slot[], width: number): Slot[] {
  const team = slots.find(slot => slot.art !== undefined)
  const others = slots.filter(slot => slot !== team)
  if (team === undefined) return trimmed(others, width)
  const yielding = quiet(others.filter(slot => slot.rank < team.rank))
  const tries: [Slot[], Tier][] = [[others, 'full'], [others, 'bare'], [quiet(others), 'bare'], [quiet(others), 'face'], [yielding, 'face']]
  const hit = tries.find(([row, tier]) => rowW([...row, { ...team, tier }]) <= width)
  if (hit === undefined) return trimmed(others, width)
  const [row, tier] = hit

  return slots.flatMap(slot => (slot === team ? [{ ...team, tier }] : row.filter(kept => kept.chip.id === slot.chip.id)))
}

/** The chips that fit `width`: the teammate in the room left, side notes, then whole chips by rank; the plan takes the rest. */
export function fitRow(slots: readonly Slot[], width: number): { slot: Slot; maxW: number }[] {
  const row = withTeam(slots, width)
  const left = Math.max(0, width - rowW(row))

  return row.map(slot => ({ slot, maxW: slot.chip.id === 'plan' ? Math.min(PLAN_MAX, PLAN_MIN + left) : Number.POSITIVE_INFINITY }))
}
