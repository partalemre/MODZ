// A pane's drawings in motion (kit/moving.ts): each source is kept byte for byte while what it shows is unchanged,
// enters on its first draw since the pane opened, sweeps once when it changes, and always says its colour scheme.
import { expect, test } from 'claude-code/testing'

import { motionCss, rings, shine } from '../hooks/kit/motion'
import { animate, paneMotion } from '../hooks/kit/moving'
import { pill } from '../hooks/kit/svg'

const svg = (text: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0 0 200 40"><text>${text}</text></svg>`
const pic = (text: string) => ({ source: svg(text), width: 200, height: 40, alt: text })

test('an entering drawing cascades in after the ones before it; a changed one sweeps instead', () => {
  const first = animate(svg('a'), { cue: { phase: 'enter', order: 2 } })
  const changed = animate(svg('a'), { cue: { phase: 'change', order: 0 } })

  expect(first).toMatch(/<g class="m-in" style="animation-delay:90ms"><text>a<\/text><\/g><\/svg>$/)
  expect(first).toContain('@keyframes m-in')
  expect(changed).toContain('class="m-sweep"')
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
  expect(changed.source).toContain('m-sweep')
  expect(reopened.source).toContain('m-in')
  expect(reopened.source).not.toContain('m-sweep')
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

test('a source changed only by its ticking clock is redrawn without the sweep', () => {
  const motion = paneMotion()
  motion.pic('row', pic('turn 3 · 1 dk'), { shows: 'turn 3' })
  const ticked = motion.pic('row', pic('turn 3 · 2 dk'), { shows: 'turn 3' })
  const changed = motion.pic('row', pic('turn 4 · 2 dk'), { shows: 'turn 4' })

  expect(ticked.source).toContain('2 dk')
  expect(ticked.source).not.toContain('m-sweep')
  expect(changed.source).toContain('m-sweep')
})

test('a drawing drawn at a new width reflowed, it did not change: no sweep', () => {
  const motion = paneMotion()
  motion.pic('head', pic('a'))
  const wider = motion.pic('head', { ...pic('a'), source: svg('a').replace('width="200"', 'width="300"'), width: 300 })

  expect(wider.source).toContain('width="300"')
  expect(wider.source).not.toContain('m-sweep')
})

test('live loops come only with the drawings that use them', () => {
  const live = `${rings({ cx: 4, cy: 4, r: 3, className: 'f-run' })}${shine({ id: 'bar', x: 0, y: 0, width: 100, height: 6 })}`

  expect(motionCss(live)).toContain('@keyframes m-ripple')
  expect(motionCss(live)).toContain('@keyframes m-shine')
  expect(motionCss(live)).not.toContain('m-sweep')
  expect(motionCss('<rect/>')).toBe('')
})
