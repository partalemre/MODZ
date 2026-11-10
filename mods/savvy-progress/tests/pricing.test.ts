import { expect } from 'claude-code/testing'
import { test } from './fixtures'

import { costOf, costText, isPriced, windowOf } from '../hooks/pricing'
import type { Usage } from '../hooks/pricing'

// A model with no price has no cost: null stays null.
const round = (n: number | null): number | null => (n === null ? null : Number(n.toFixed(6)))

// List prices in USD per million tokens, cache writes at the 1-hour rate: a turn of 1M input,
// 1M output, 2M cache read and 1M cache write costs input + output + 2 × read + write.
const TURN: Usage = { input_tokens: 1e6, output_tokens: 1e6, cache_read_input_tokens: 2e6, cache_creation_input_tokens: 1e6 }
// The rows are those of mods/cache-tax/hooks/core.ts (cache read, 1h write, output; input is half the write).
const PRICED: readonly (readonly [model: string, usd: number])[] = [
  ['claude-fable-5-2', 64.4],
  ['claude-mythos-5-2', 64.4],
  ['claude-fable-5-1', 80.5],
  ['claude-mythos-5-1', 80.5],
  ['claude-mythos-5', 82],
  ['claude-opus-4-1-20250805', 123],
  ['claude-3-5-haiku-20241022', 6.56],
  ['claude-fable-5', 82],
  ['claude-opus-5-5', 32.4],
  ['claude-opus-5', 41],
  ['claude-opus-4-8', 41],
  ['claude-sonnet-5-5', 16.2],
  ['claude-sonnet-5', 16.4],
  ['claude-sonnet-4-6', 24.6],
  ['claude-haiku-5-5', 0.82],
  ['claude-haiku-4-5', 8.2],
]

for (const [model, usd] of PRICED) {
  test(`a turn on ${model} costs $${usd}`, () => {
    expect(round(costOf(model, TURN, false))).toBe(usd)
  })
}

// Every model Claude Code can run a session or a subagent on today. A new release joins this list, and the test
// below fails until pricing.ts (and cache-tax's table, its source) has its row.
const CURRENT = [
  'claude-fable-5-2', 'claude-mythos-5-2', 'claude-fable-5-1', 'claude-mythos-5-1', 'claude-fable-5', 'claude-mythos-5',
  'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5', 'claude-sonnet-5', 'claude-haiku-5-5',
]

test('every current model id has a row of its own, in every spelling the engine gives it', () => {
  const spelled = CURRENT.flatMap(id => [id, `${id}[1m]`, `us.anthropic.${id}-v1:0`, `${id}-20261001`])

  expect(spelled.filter(id => !isPriced(id))).toEqual([])
})

test('a model the table does not list has no cost rather than a neighbour\'s', () => {
  for (const model of ['claude-fable-5-3', 'claude-opus-6', 'some-other-model', '']) {
    expect(costOf(model, TURN, false)).toBeNull()
    expect(costText({ model, costUsd: 0 })).toBe('')
  }
  expect(costText({ model: 'claude-fable-5-2', costUsd: 0.4 })).toBe('≈$0.40')
})

// 120K of prompt (input, cache reads and writes) is over Haiku 5.5's 100K line.
const LONG: Usage = { input_tokens: 20_000, output_tokens: 10_000, cache_read_input_tokens: 50_000, cache_creation_input_tokens: 50_000 }

test('a Haiku 5.5 request over 100K prompt tokens pays the long-prompt prices; a turn sum does not', () => {
  expect(round(costOf('claude-haiku-5-5', LONG, true))).toBe(0.0875)
  expect(round(costOf('claude-haiku-5-5', LONG, false))).toBe(0.0175)
})

test('Haiku 4.5 has one price whatever the prompt length', () => {
  expect(round(costOf('claude-haiku-4-5', LONG, true))).toBe(0.175)
})

test('Haiku 5.5 has a 1M window; Haiku 4.5 and Claude 3 have 200K', () => {
  expect(windowOf('claude-haiku-5-5')).toBe(1_000_000)
  expect(windowOf('claude-haiku-4-5')).toBe(200_000)
  expect(windowOf('claude-3-5-haiku')).toBe(200_000)
  expect(windowOf('')).toBe(1_000_000)
})
