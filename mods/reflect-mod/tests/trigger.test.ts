import { expect, test } from 'claude-code/testing'

import { hasTrigger } from '../hooks/register'
import { CORRECTIONS, ORDINARY } from './fixtures/prompts'

// Made-up prompts, not real history: the shapes a working day brings. Ordinary ones are tasks, questions and
// reports that use the old trigger words ("use", "not", "no", "should", "lütfen", "hepsini") without correcting Claude.
const fired = (list: readonly string[]) => list.filter(hasTrigger)

test('every made-up correction or standing preference reaches the model', () => {
  expect(CORRECTIONS.filter(t => !hasTrigger(t))).toEqual([])
})

test('ordinary prompts mostly stay off the model: at most 1 in 20 fires', () => {
  // Measured on this set: the old word list fired on 18 of 42 ordinary prompts (43%) and missed 8 of 35 corrections.
  expect(fired(ORDINARY).length / ORDINARY.length).toBeLessThanOrEqual(0.05)
})

test('"hep" is a whole word: "hepsini" is no trigger', () => {
  expect(hasTrigger('hepsini tek tek kontrol et')).toBe(false)
  expect(hasTrigger('hep böyle yapıyorsun, testleri unutuyorsun')).toBe(true)
})
