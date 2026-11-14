import { expect } from 'claude-code/testing'

import { runwayOf } from '../hooks/runway'
import { fitRow } from '../hooks/strip'
import { test } from './fixtures'

const HOUR = 3_600_000
const DAY = 24 * HOUR
const NOW = Date.parse('2026-11-14T12:00:00Z')
const week = (percentUsed: number, daysLeft: number) => ({ kind: 'seven_day', percentUsed, resetsAt: new Date(NOW + daysLeft * DAY).toISOString() })

test('runway: half the week gone with 80% used runs out before the reset', async () => {
  // 3.5 days used 80 points, so the last 20 take 0.875 days more.
  const run = runwayOf(week(80, 3.5), NOW)
  expect(Math.round(((run?.endsAt ?? 0) - NOW) / HOUR)).toBe(21)
})

test('runway: a pace that lasts to the reset, a fresh window and an unknown one name no end', async () => {
  expect(runwayOf(week(40, 3.5), NOW)?.endsAt).toBe(null)
  expect(runwayOf(week(2, 6.9), NOW)?.endsAt).toBe(null)
  expect(runwayOf({ kind: 'seven_day', percentUsed: 80 }, NOW)?.endsAt).toBe(null)
  expect(runwayOf({ kind: 'spend_limit', percentUsed: 80 }, NOW)).toBe(null)
  expect(runwayOf(week(100, 2), NOW)?.endsAt).toBe(NOW)
})

test('strip: a tight row drops side notes, then chips by rank; the plan and modz stay', async () => {
  const slot = (id: string, rank: number, note?: string) => ({ chip: { id, label: id, value: '12345', ...(note ? { note } : {}) }, rank, press: () => undefined })
  const slots = [slot('plan', 0, 'a long step that will be cut'), slot('cost', 1, 'last turn'), slot('tokens', 3), slot('time', 4), slot('modz', 0)]
  expect(fitRow(slots, 2000).map(one => one.slot.chip.id)).toEqual(['plan', 'cost', 'tokens', 'time', 'modz'])
  const tight = fitRow(slots, 400)
  expect(tight.map(one => one.slot.chip.id)).toEqual(['plan', 'cost', 'modz'])
  expect(tight[1]?.slot.chip.note).toBeUndefined()
})
