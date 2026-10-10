import { expect, test } from 'claude-code/testing'

import { isSame } from '../hooks/kit/same'

test('isSame compares plain values by structure, key order aside', () => {
  expect(isSame({ pane: 'tests', tone: 'ok', at: 1 }, { at: 1, tone: 'ok', pane: 'tests' })).toBe(true)
  expect(isSame([1, { a: [2, 3] }], [1, { a: [2, 3] }])).toBe(true)
  expect(isSame(Number.NaN, Number.NaN)).toBe(true)
})

test('isSame tells apart a changed field, a missing key, an array from an object and null', () => {
  expect(isSame({ detail: '42/42' }, { detail: '41/42' })).toBe(false)
  expect(isSame({ a: 1, b: undefined }, { a: 1, c: undefined })).toBe(false)
  expect(isSame({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  expect(isSame([], {})).toBe(false)
  expect(isSame(null, {})).toBe(false)
  expect(isSame(undefined, { pane: 'x' })).toBe(false)
})
