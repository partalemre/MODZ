import { expect, test } from 'claude-code/testing'

import { chipSvg, chipWidth } from '../hooks/strip-chips'
import type { Chip } from '../hooks/strip-chips'

const week: Chip = { id: 'week', label: 'hafta', value: '%68', meter: 68, note: 'Per 22:16 biter', tone: 'warn' }
const plan: Chip = { id: 'plan', label: 'plan', value: '0/6', note: 'Pencerenin neden farklı renkte çıktığını bul' }
const texts = (source: string): string[] => [...source.matchAll(/>([^<]+)<\/text>/g)].map(m => m[1] ?? '')

test('a side note fits whole or is left out, never cut mid-word', () => {
  const full = chipWidth(week)
  expect(texts(chipSvg(week, full).source)).toContain('Per 22:16 biter')
  const tight = texts(chipSvg(week, full - 1).source)
  expect(tight.some(text => text.startsWith('Per'))).toBe(false)
  expect(chipSvg(week, full - 1).width).toBeLessThan(full)
})

test("the plan's step gives up whole words from its end, with an ellipsis", () => {
  const drawn = chipSvg(plan, chipWidth(plan) - 20)
  const step = texts(drawn.source).find(text => text.startsWith('Pencerenin'))
  expect(step?.endsWith('…')).toBe(true)
  expect('Pencerenin neden farklı renkte çıktığını bul'.startsWith((step ?? '').slice(0, -1).trimEnd())).toBe(true)
  expect((step ?? '').slice(0, -1).endsWith(' ')).toBe(false)
  expect(drawn.width).toBeLessThanOrEqual(chipWidth(plan) - 20)
})
