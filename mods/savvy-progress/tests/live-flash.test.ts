// A drawing fed live data (tokens, the call under way) changes every few seconds: only its first change flashes,
// so the Agents pane does not shimmer as if it never stopped loading (kit/moving.ts).
import { expect, test } from 'claude-code/testing'

import { paneMotion } from '../hooks/kit/moving'

const svg = (text: string) => `<svg width="200" height="20" viewBox="0 0 200 20"><text>${text}</text></svg>`

test('a change flashes once; the changes right after it redraw without the flash', () => {
  const motion = paneMotion()
  const draw = (text: string) => motion.pic('chips', { source: svg(text), alt: text }).source

  expect(draw('1.7M')).toContain('m-in')
  expect(draw('1.8M')).toContain('m-flash')
  const live = draw('1.9M')
  expect(live).toContain('1.9M')
  expect(live).not.toContain('m-flash')
})
