import { expect, test } from 'claude-code/testing'

import { costOf, windowOf } from '../hooks/pricing'
import type { Usage } from '../hooks/pricing'

const round = (n: number): number => Number(n.toFixed(6))

// List prices in USD per million tokens, cache writes at the 1-hour rate: a turn of 1M input,
// 1M output, 2M cache read and 1M cache write costs input + output + 2 × read + write.
const TURN: Usage = { input_tokens: 1e6, output_tokens: 1e6, cache_read_input_tokens: 2e6, cache_creation_input_tokens: 1e6 }
const PRICED: readonly (readonly [model: string, usd: number])[] = [
  ['claude-fable-5-1', 80.5],
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
