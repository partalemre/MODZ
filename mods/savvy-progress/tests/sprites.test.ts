import { expect, test } from 'claude-code/testing'

import { CRAB_CSS, crab } from '../hooks/crabs'
import { lookAt } from '../hooks/identity'
import { meterSvg } from '../hooks/meter'
import type { Units } from '../hooks/meter'

// Pins the crab sprites and the job meter to the drawings they made before the house-rule refactor: a
// misplaced bracket once drew costume pixels wrong while every behaviour test still passed. The hashes
// were taken from the pre-refactor source; a deliberate redraw updates them.

const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193
const HEX = 16
const HASH_WIDTH = 8
const LOOK_SLOTS = 4

const fnv = (s: string): string => {
  let h = FNV_OFFSET
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, FNV_PRIME) >>> 0
  }
  return h.toString(HEX).padStart(HASH_WIDTH, '0')
}

const GOLDEN: Record<string, string> = {
  "fable/0/still": "ce1abed2",
  "fable/0/walk": "8b342ec1",
  "fable/1/still": "e27c09bd",
  "fable/1/walk": "743d3cf6",
  "fable/2/still": "03276109",
  "fable/2/walk": "40b80522",
  "fable/3/still": "95675156",
  "fable/3/walk": "c6427a65",
  "heavy/0/still": "5cd2d1c3",
  "heavy/0/walk": "ecf0fbd0",
  "heavy/1/still": "21dcba5e",
  "heavy/1/walk": "973b15c1",
  "heavy/2/still": "831765f2",
  "heavy/2/walk": "d000a8d5",
  "heavy/3/still": "05af4737",
  "heavy/3/walk": "db71f2dc",
  "careful/0/still": "86029544",
  "careful/0/walk": "b35ef0ff",
  "careful/1/still": "c7541a7f",
  "careful/1/walk": "b3dc4db4",
  "careful/2/still": "8be0b40b",
  "careful/2/walk": "5f5fc628",
  "careful/3/still": "0646fd28",
  "careful/3/walk": "fd159ebb",
  "medium/0/still": "fabe491d",
  "medium/0/walk": "92c1abea",
  "medium/1/still": "5b9bf134",
  "medium/1/walk": "0d59c2f7",
  "medium/2/still": "41593078",
  "medium/2/walk": "e46e71b3",
  "medium/3/still": "63aa1d11",
  "medium/3/walk": "82e1e56e",
  "light/0/still": "301e2601",
  "light/0/walk": "e6883658",
  "light/1/still": "2ff2a008",
  "light/1/walk": "a07630a9",
  "light/2/still": "7976c46c",
  "light/2/walk": "5fa1970d",
  "light/3/still": "e3886905",
  "light/3/walk": "224d7dc4",
  "explore/0/still": "fa563ea8",
  "explore/0/walk": "1a4a6fc7",
  "explore/1/still": "334935bb",
  "explore/1/walk": "b70cc664",
  "explore/2/still": "34b9fb97",
  "explore/2/walk": "d839f0c0",
  "explore/3/still": "f2a208a4",
  "explore/3/walk": "c1182bf3",
  "other/0/still": "b29fc620",
  "other/0/walk": "b8165433",
  "other/1/still": "758dc0af",
  "other/1/walk": "b8042d24",
  "other/2/still": "2c5c576b",
  "other/2/walk": "35222e30",
  "other/3/still": "88a67c54",
  "other/3/walk": "014ec3e7",
  "mystery/0/still": "1ce7890d",
  "mystery/0/walk": "589b1162",
  "mystery/1/still": "5199e1da",
  "mystery/1/walk": "8c948135",
  "mystery/2/still": "ed17faee",
  "mystery/2/walk": "00111e31",
  "mystery/3/still": "f7fbf639",
  "mystery/3/walk": "2a9337e6",
  "heavy/dim/scale2": "af85ea81",
  "css": "2ad845f7",
  "meter/empty": "01aff699",
  "meter/segments": "5d2da56e",
  "meter/solid": "6c4d8c24",
  "meter/all-done": "0f30488e"

}

const COSTUMES = ['fable', 'heavy', 'careful', 'medium', 'light', 'explore', 'other', 'mystery']
const TRACK = { x: 4, y: 6, w: 120, h: 6 }
const METERS: [string, Units][] = [
  ['empty', { units: 0, done: 0, failed: 0, active: 0 }],
  ['segments', { units: 5, done: 3, failed: 1, active: 1 }],
  ['solid', { units: 40, done: 22, failed: 3, active: 6 }],
  ['all-done', { units: 4, done: 4, failed: 0, active: 0 }],
]

test('every costume, look and walk frame draws the same crab as before', () => {
  for (const costume of COSTUMES) {
    for (let slot = 0; slot < LOOK_SLOTS; slot++) {
      for (const isWalking of [false, true]) {
        const key = `${costume}/${slot}/${isWalking ? 'walk' : 'still'}`
        expect([key, fnv(crab(10, 20, { costume, look: lookAt(slot), isWalking }))]).toEqual([key, GOLDEN[key]])
      }
    }
  }
})

test('a dim, scaled crab and the walk animation css are unchanged', () => {
  expect(fnv(crab(3, 4, { costume: 'heavy', isDim: true, scale: 2 }))).toBe(GOLDEN['heavy/dim/scale2'])
  expect(fnv(CRAB_CSS)).toBe(GOLDEN.css)
})

test('the job meter draws the same segments and solid track as before', () => {
  for (const [name, view] of METERS) expect([name, fnv(meterSvg(view, TRACK))]).toEqual([name, GOLDEN[`meter/${name}`]])
})
