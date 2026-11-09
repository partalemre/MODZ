import { expect } from 'claude-code/testing'
import { test } from './fixtures'

import { cardHeadSvg } from '../hooks/card-svg'
import { titleOf } from '../hooks/chats'
import { chatLinesSvg } from '../hooks/chats-svg'
import { headerSvg } from '../hooks/header-svg'
import { meterSvg } from '../hooks/meter'

// What the pane must never say: a full bar with no percent, a cut count, a chat named after injected context.

const TRACK = { x: 0, y: 0, w: 100, h: 6 }
const HEAD = { eyebrow: 'Ajanlar', counts: '1 çalışıyor', headline: 'Read all linked sources', percent: '—', tone: 'run', meter: null, stats: [] } as const

test('a running unit never fills its track: a breathing dash on the neutral track', () => {
  const svg = meterSvg({ units: 1, done: 0, failed: 0, active: 1 }, TRACK)
  expect(svg).toContain('class="k" x="0.0" y="0" width="100.0"')
  expect(svg).toContain('class="f-edit live" x="0.0" y="0" width="34.0"')
})

test('a settled unit still fills its segment', () => {
  expect(meterSvg({ units: 1, done: 1, failed: 0, active: 0 }, TRACK)).toContain('class="m" x="0.0" y="0" width="100.0"')
})

test('an unknown percent draws no dash and gives its room to the headline', () => {
  const { source } = headerSvg(376, HEAD)
  expect(source).not.toContain('>—<')
  expect(source).toContain('Read all linked sources')
})

test('a count that does not fit whole is left out, never cut', () => {
  const { source } = headerSvg(150, { ...HEAD, counts: '12 çalışıyor · 30 bitti · 4 planlı' })
  expect(source).not.toContain('çalış…')
  expect(source).not.toContain('planlı')
})

test("a row's head is one control tall and names the agent and its task", () => {
  const source = cardHeadSvg(340, { name: 'Pip', title: 'Read all linked sources', pill: { text: 'çalışıyor', role: 'run' } })
  expect(source).toContain('height="28"')
  expect(source).toContain('Pip')
  expect(source).toContain('Read all linked sources')
})

test('a chat line and an agent line stay one row each, however long the title', () => {
  const long = 'x'.repeat(300)
  const drawn = chatLinesSvg(280, [
    { kind: 'chat', lead: 'IK Oyunu', text: long, end: '3 dk', isLive: true },
    { kind: 'agent', lead: 'Coral', text: long, end: '≈$0,28', isLive: true },
  ])
  expect(drawn.height).toBe(48)
  expect(drawn.source).not.toContain(long)
  expect(drawn.alt).toContain('Coral')
})

test('injected context does not name a chat; the words after it do', () => {
  expect(titleOf('<system-reminder>\nSomething\n</system-reminder>\nFix the checkout')).toBe('Fix the checkout')
  expect(titleOf('<system-reminder>only this</system-reminder>')).toBe('')
  expect(titleOf('Use a < b in the loop')).toBe('Use a < b in the loop')
})
