// Run: bun test tools/film
import { expect, test } from 'bun:test'
import { bezier, presence, spring, SPRING, track } from './src/motion.js'

test('bezier keeps its ends and stays monotonic for an ease-out', () => {
  const ease = bezier(0.2, 0.8, 0.2, 1)
  expect(ease(0)).toBe(0)
  expect(ease(1)).toBe(1)
  let last = 0
  for (let p = 0.05; p < 1; p += 0.05) { expect(ease(p)).toBeGreaterThanOrEqual(last); last = ease(p) }
})

test('a spring rests at 0 before release and settles at 1', () => {
  expect(spring(1, 2, SPRING.smooth)).toBe(0)
  expect(spring(5, 2, SPRING.smooth)).toBeCloseTo(1, 3)
  expect(spring(5, 2, SPRING.pop)).toBeCloseTo(1, 3)
})

test('presence without an exit never goes NaN (it once hid nothing before its time)', () => {
  const before = presence(0, 1)
  expect(before.opacity).toBe(0)
  expect(Number.isFinite(presence(3, 1).opacity)).toBe(true)
  expect(presence(3, 1, 2).opacity).toBe(0)
})

test('track eases between keys and holds past the ends', () => {
  const keys = [{ t: 0, v: 0 }, { t: 1, v: 10 }]
  expect(track(keys, -1)).toBe(0)
  expect(track(keys, 2)).toBe(10)
  expect(track(keys, 0.5)).toBeCloseTo(5, 5)
})
