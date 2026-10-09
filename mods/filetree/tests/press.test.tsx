import { expect, test } from 'claude-code/testing'

import { FOCUS_SETTLE_MS } from '../hooks/focus'
import { world } from './world'

// The two desktop press races: a click that focuses the pane redraws it under the click, and a desktop
// that reattaches keeps a tree whose buttons the engine already released.

const ROOT = '/Users/k/MODZ'
const REPO = { root: ROOT, files: ['a.ts'], status: '## main\0', heads: { [ROOT]: ['1111111aaaa'] } }
const PROPS = { title: 'Dosyalar', isFocused: false, bodyColumns: 50, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} } as any
const PANE = { plugin: 'filetree', surface: 'desktop', component: 'Pane', requestId: 'filetree', props: PROPS } as const
const STAMP = { key: 'render-stamp' }

async function stampOf(ui: any): Promise<string | undefined> {
  return (await ui.find(STAMP))?.text
}

async function start($: any, on: any) {
  const clock = world(on, REPO)
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  await clock.settle()

  return clock
}

// Whether the work finishes before the clock moves at all; it is let finish either way.
async function isImmediate(clock: any, work: Promise<unknown>): Promise<boolean> {
  let isDone = false
  const watched = work.then(() => {
    isDone = true
  })
  await clock.settle()
  const wasDone = isDone
  await clock.advance(FOCUS_SETTLE_MS)
  await watched

  return wasDone
}

test('a reattaching desktop gets the pane drawn again', { timeoutMs: 20_000 }, async ($: any, on: any) => {
  on('session.attach', (_: any, e: any) => ({ clientId: e.clientId }))
  const clock = await start($, on)
  const pane = await $.ui.mount(PANE)
  await clock.settle()
  const before = await stampOf(pane)
  expect(before).toBeDefined()

  await $.session.attach({ surface: 'desktop', clientId: 'desktop-2' })

  expect(await stampOf(pane)).not.toBe(before)
})

test('a pane render whose focus flipped waits for the click; first and same-focus renders do not', { timeoutMs: 20_000 }, async ($: any, on: any) => {
  const clock = await start($, on)
  const mounting = $.ui.mount(PANE)
  expect(await isImmediate(clock, mounting)).toBe(true)
  const pane = await mounting
  expect(await isImmediate(clock, pane.redraw(PROPS))).toBe(true)

  let isDone = false
  const flip = pane.redraw({ ...PROPS, isFocused: !PROPS.isFocused }).then(() => {
    isDone = true
  })
  await clock.advance(FOCUS_SETTLE_MS - 1)
  expect(isDone).toBe(false)
  await clock.advance(1)
  await flip
  expect(isDone).toBe(true)
})
