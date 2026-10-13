import { expect, test } from 'claude-code/testing'

import { costText, rowCost, turnCost } from '../hooks/costtext'
import { setLang } from '../hooks/lang'
import { type Added, addedOf, attribute, growthOf, guess, merge, NO_COST, rateAfter, sizeOf } from '../hooks/readcost'
import { NO_TURN } from '../hooks/turn'

// How a read's tokens are measured from the requests' own sizes, and how the pane writes them.

const usage = (prompt: number, output: number) => ({ input_tokens: 2, cache_read_input_tokens: prompt - 2 - 100, cache_creation_input_tokens: 100, output_tokens: output })
const read = (id: string, chars: number) => ({ id, file: `/r/${id}.ts`, chars })
const result = (id: string, text: string) => ({ type: 'tool_result', tool_use_id: id, content: text })
const NO_RATE = { tokens: 0, chars: 0 }

test('a request counts its whole prompt, cached or not', () => {
  expect(sizeOf(usage(5_000, 40))).toEqual({ prompt: 5_000, output: 40 })
  expect(sizeOf(null)).toBe(null)
})

test("the step's growth leaves out its own answer and never goes below zero", () => {
  expect(growthOf({ prompt: 1_000, output: 50 }, { prompt: 1_950, output: 9 })).toBe(900)
  expect(growthOf({ prompt: 9_000, output: 50 }, { prompt: 2_000, output: 9 })).toBe(0)
  expect(growthOf(null, { prompt: 2_000, output: 9 })).toBe(0)
})

test('the blocks a step added are found by its results, between its answer and the next one', () => {
  const messages = [
    { role: 'user', content: [{ type: 'text', text: 'read it' }] },
    { role: 'assistant', content: [{ type: 'thinking', thinking: '' }, { type: 'tool_use', id: 'r1', input: {} }] },
    { role: 'user', content: [result('r1', 'x'.repeat(40)), { type: 'text', text: 'reminder' }] },
    { role: 'assistant', content: [{ type: 'text', text: 'done' }] },
  ]
  expect(addedOf(messages, ['r1'])).toEqual({ blocks: [{ id: 'r1', chars: 40, isOpaque: false }, { id: '', chars: 8, isOpaque: false }], hasThinking: true })
  expect(addedOf(messages, ['gone'])).toBe(null)
})

test('an image result has no text length to share by', () => {
  const messages = [{ role: 'user', content: [{ type: 'tool_result', tool_use_id: 'i', content: [{ type: 'image', source: {} }] }] }]
  expect(addedOf(messages, ['i'])?.blocks).toEqual([{ id: 'i', chars: 0, isOpaque: true }])
})

test('a read alone after a step that did not think is measured exactly', () => {
  const added: Added = { blocks: [{ id: 'a', chars: 900, isOpaque: false }], hasThinking: false }
  expect(attribute({ reads: [read('a', 900)], added, grown: 13_321 }, NO_RATE)).toEqual([{ file: '/r/a.ts', cost: { tokens: 13_321, kind: 'exact', reads: 1 } }])
})

test('several results, or a reminder riding along, share the growth by text length', () => {
  const two: Added = { blocks: [{ id: 'a', chars: 300, isOpaque: false }, { id: 'b', chars: 100, isOpaque: false }], hasThinking: false }
  expect(attribute({ reads: [read('a', 300), read('b', 100)], added: two, grown: 1_000 }, NO_RATE).map(x => x.cost)).toEqual([
    { tokens: 750, kind: 'share', reads: 1 },
    { tokens: 250, kind: 'share', reads: 1 },
  ])
  const reminded: Added = { blocks: [{ id: 'a', chars: 1_000, isOpaque: false }], hasThinking: false }
  expect(attribute({ reads: [read('a', 800)], added: reminded, grown: 500 }, NO_RATE)[0]?.cost).toEqual({ tokens: 400, kind: 'share', reads: 1 })
})

test('a step that thought is never called exact', () => {
  const added: Added = { blocks: [{ id: 'a', chars: 900, isOpaque: false }], hasThinking: true }
  expect(attribute({ reads: [read('a', 900)], added, grown: 600 }, NO_RATE)[0]?.cost.kind).toBe('share')
})

test('with no growth to read, a read is guessed from its length, at the rate the session measured', () => {
  expect(attribute({ reads: [read('a', 3_000)], added: null, grown: 0 }, NO_RATE)[0]?.cost).toEqual({ tokens: 1_000, kind: 'guess', reads: 1 })
  expect(guess(3_000, { tokens: 2_000, chars: 4_000 })).toBe(1_500)
  const opaque: Added = { blocks: [{ id: 'a', chars: 10, isOpaque: false }, { id: 'i', chars: 0, isOpaque: true }], hasThinking: false }
  expect(attribute({ reads: [read('a', 10)], added: opaque, grown: 2_000 }, NO_RATE)[0]?.cost.kind).toBe('guess')
})

test('only a measured step that did not think teaches the rate', () => {
  const added: Added = { blocks: [{ id: 'a', chars: 1_000, isOpaque: false }], hasThinking: false }
  expect(rateAfter(NO_RATE, { added, grown: 450 })).toEqual({ tokens: 450, chars: 1_000 })
  expect(rateAfter(NO_RATE, { added: { ...added, hasThinking: true }, grown: 450 })).toEqual(NO_RATE)
  expect(rateAfter(NO_RATE, { added: null, grown: 0 })).toEqual(NO_RATE)
})

test('costs add up, only as sure as the least sure part', () => {
  const exact = { tokens: 100, kind: 'exact', reads: 1 } as const
  expect(merge(merge(NO_COST, exact), { tokens: 50, kind: 'share', reads: 1 })).toEqual({ tokens: 150, kind: 'share', reads: 2 })
  expect(merge(exact, { tokens: 5, kind: 'guess', reads: 1 }).kind).toBe('guess')
})

test('the pane writes a measured count bare and marks a shared one ≈ and a guess ~', () => {
  setLang('en')
  expect(costText({ tokens: 13_321, kind: 'exact', reads: 1 })).toBe('13,321')
  expect(costText({ tokens: 13_321, kind: 'share', reads: 1 }, true)).toBe('≈13.3k')
  expect(costText({ tokens: 842, kind: 'guess', reads: 1 }, true)).toBe('~842')
  const turn = { ...NO_TURN, costs: { '/r/a.ts': { tokens: 2_221, kind: 'exact', reads: 1 }, '/r/b.ts': { tokens: 100, kind: 'share', reads: 1 } } } as const
  expect(turnCost(turn)).toEqual({ tokens: 2_321, kind: 'share', reads: 2 })
  expect(turnCost(NO_TURN)).toBe(null)
  expect(rowCost(turn, '/r/a.ts')).toBe('2.2k tok')
  setLang('tr')
  expect(costText({ tokens: 13_321, kind: 'exact', reads: 1 })).toBe('13.321')
  expect(rowCost(turn, '/r/a.ts')).toBe('2,2k token')
  setLang('en')
})
