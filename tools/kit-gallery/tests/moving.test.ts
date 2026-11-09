// A pane's drawings in motion (kit/moving.ts): each source is kept byte for byte while what it shows is unchanged,
// enters on its first draw since the pane opened, flashes once when it changes, and always says its colour scheme.
import { expect, test } from 'claude-code/testing'

import { motionCss } from '../hooks/kit/motion'
import { meter } from '../hooks/kit/svg-meters'
import { iconEl } from '../hooks/kit/svg-core'
import { animate, paneMotion } from '../hooks/kit/moving'
import { pill } from '../hooks/kit/svg'

declare const setTimeout: (done: (value: unknown) => void, ms: number) => unknown

const svg = (text: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0 0 200 40"><text>${text}</text></svg>`
const pic = (text: string) => ({ source: svg(text), width: 200, height: 40, alt: text })

test('an entering drawing cascades in after the ones before it; a changed one flashes instead', () => {
  const first = animate(svg('a'), { cue: { phase: 'enter', order: 2 } })
  const changed = animate(svg('a'), { cue: { phase: 'change', order: 0 } })

  expect(first).toMatch(/<g class="m-in" style="animation-delay:90ms"><text>a<\/text><\/g><\/svg>$/)
  expect(first).toContain('@keyframes m-in')
  expect(changed).toContain('m-flash')
  expect(changed).not.toContain('m-in')
})

test('every animated source says its colour scheme once, and a row gets the hover wash', () => {
  const row = animate(svg('a'), { cue: { phase: 'enter', order: 0 }, isRow: true })
  const kitPic = animate(pill({ text: '3 geçti', role: 'ok' }).source, { cue: { phase: 'enter', order: 0 } })

  expect(row).toContain(':root{color-scheme:light dark}')
  expect(row).toContain('class="m-wash"')
  expect(kitPic.match(/[{;]color-scheme:/g)?.length).toBe(1)
  expect(animate(svg('a').replace('<text>', '<style>@media (prefers-color-scheme: light){}</style><text>'), { cue: { phase: 'enter', order: 0 } })).toContain(':root{color-scheme:light dark}')
})

test('a source that is not an svg passes through untouched', () => {
  expect(animate('not svg', { cue: { phase: 'enter', order: 0 } })).toBe('not svg')
})

test('an unchanged drawing keeps its very source across redraws; a reset makes it enter again', () => {
  const motion = paneMotion()
  const first = motion.pic('head', pic('a'))
  const again = motion.pic('head', pic('a'))
  const changed = motion.pic('head', pic('b'))
  motion.reset()
  const reopened = motion.pic('head', pic('b'))

  expect(first.isInteractive).toBe(true)
  expect(again.source).toBe(first.source)
  expect(changed.source).toContain('m-flash')
  expect(reopened.source).toContain('m-in')
  expect(reopened.source).not.toContain('m-flash')
})

const NEXT_PASS_MS = 150

test('drawings first drawn together cascade top to bottom; redrawn, each keeps its source', async () => {
  const motion = paneMotion()
  const sources = ['x', 'y', 'z'].map(text => motion.pic(`row-${text}`, pic(text)).source)
  await new Promise(done => setTimeout(done, NEXT_PASS_MS))
  const redrawn = ['x', 'y', 'z'].map(text => motion.pic(`row-${text}`, pic(text)).source)

  expect(sources.map(source => /animation-delay:(\d+)ms/.exec(source)?.[1])).toEqual(['0', '45', '90'])
  expect(redrawn).toEqual(sources)
})

test('a source changed only by its ticking clock is redrawn without the flash', () => {
  const motion = paneMotion()
  motion.pic('row', pic('turn 3 · 1 dk'), { shows: 'turn 3' })
  const ticked = motion.pic('row', pic('turn 3 · 2 dk'), { shows: 'turn 3' })
  const changed = motion.pic('row', pic('turn 4 · 2 dk'), { shows: 'turn 4' })

  expect(ticked.source).toContain('2 dk')
  expect(ticked.source).not.toContain('m-flash')
  expect(changed.source).toContain('m-flash')
})

test('a drawing drawn at a new width reflowed, it did not change: no flash', () => {
  const motion = paneMotion()
  motion.pic('head', pic('a'))
  const wider = motion.pic('head', { ...pic('a'), source: svg('a').replace('width="200"', 'width="300"'), width: 300 })

  expect(wider.source).toContain('width="300"')
  expect(wider.source).not.toContain('m-flash')
})

test('motion rules come only with the drawings that use them', () => {
  expect(motionCss('<rect class="m-flash"/>')).toContain('@keyframes m-flash')
  expect(motionCss('<rect class="m-flash"/>')).not.toContain('m-from')
  expect(motionCss('<rect/>')).toBe('')
})

// Reduced motion drops every animation, so a piece rests at its own rule: the flash must rest unseen.
const restingRule = (css: string, name: string): string => new RegExp(`\\.${name}\\{([^}]*)\\}`).exec(css)?.[1] ?? ''

test('under reduced motion a changed drawing keeps no flash over it, and a done mark rests drawn', () => {
  const css = motionCss('<rect class="m-flash"/><path class="m-draw"/>')

  expect(css).toContain('@media (prefers-reduced-motion: reduce){*{animation:none!important')
  expect(restingRule(css, 'm-flash')).toContain('opacity:0')
  // At rest the dash is the whole path (pathLength 1, offset 0): the mark shows in full.
  expect(restingRule(css, 'm-draw')).not.toContain('dashoffset')
})

const wrap = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40">${body}</svg>`
const meterAt = (value: number) => meter({ value, width: 200 }).source
const check = (x: number) => iconEl({ name: 'check', x, y: 0, size: 16, paint: 'ok' })
const change = (before: string, now: string) => animate(now, { cue: { phase: 'change', order: 0 }, before })

test('a changed meter slides from the width it had, under any style it already holds', () => {
  const moved = change(meterAt(0.4), meterAt(0.8))
  const styled = change(wrap('<rect data-m-fill x="0" width="50" style="fill:red"/>'), wrap('<rect data-m-fill x="0" width="100" style="fill:red"/>'))

  expect(moved).toMatch(/data-m-fill[^>]*style="--m-from:0\.500"/)
  expect(moved).toContain('@keyframes m-from')
  expect(styled).toContain('style="--m-from:0.500;fill:red"')
  expect(styled.match(/style=/g)?.length).toBe(1)
})

test('a meter that did not move, came from empty, or was first drawn does not slide', () => {
  expect(change(meterAt(0.5), meterAt(0.505))).not.toContain('m-from')
  expect(change(meterAt(0), meterAt(0.5))).not.toContain('m-from')
  expect(animate(meterAt(0.5), { cue: { phase: 'enter', order: 0 } })).not.toContain('m-from')
  expect(animate(meterAt(0.8), { cue: { phase: 'still', order: 0 }, before: meterAt(0.4) })).not.toContain('m-from')
})

test('a done mark draws itself only when the drawing turns done', () => {
  const turned = change(wrap('<text>3/4</text>'), wrap(`${check(0)}<text>4/4</text>`))
  const stayed = change(wrap(`${check(0)}<text>4/4</text>`), wrap(`${check(0)}${check(20)}<text>5/5</text>`))

  expect(turned).toMatch(/<path [^>]*data-m-done[^>]*class="m-draw" pathLength="1"/)
  expect(turned).toContain('@keyframes m-draw')
  expect(stayed).not.toContain('m-draw')
})

test('the pane keeps what it drew last, so its next change can move from it', () => {
  const motion = paneMotion()
  motion.pic('m', { source: meterAt(0.25), alt: 'm' })
  const next = motion.pic('m', { source: meterAt(0.75), alt: 'm' })

  expect(next.source).toContain('m-from')
  expect(next.source).toContain('m-flash')
})
