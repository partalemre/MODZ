import { expect, test } from 'claude-code/testing'

import { FOCUS_SETTLE_MS, settleFocus } from '../hooks/kit/focus'

// The kit's focus settle on its own: which renders it holds back, and for how long. The module keeps
// the last focus per site for the whole file, so each test draws on sites of its own.

function sleeper() {
  const waits: number[] = []

  return { waits, sleep: async (ms: number) => void waits.push(ms) }
}

function site(requestId: string, isFocused?: boolean, surface = 'desktop') {
  return { surface, requestId, props: isFocused === undefined ? {} : { isFocused } }
}

test('the first render of a site never waits, focused or not', async () => {
  const { waits, sleep } = sleeper()
  await settleFocus(site('first-a', true), sleep)
  await settleFocus(site('first-b', false), sleep)

  expect(waits).toEqual([])
})

test('a render whose focus flipped waits exactly FOCUS_SETTLE_MS, either way, once per flip', async () => {
  const { waits, sleep } = sleeper()
  await settleFocus(site('flip', false), sleep)
  await settleFocus(site('flip', true), sleep)
  expect(waits).toEqual([FOCUS_SETTLE_MS])

  await settleFocus(site('flip', false), sleep)
  expect(waits).toEqual([FOCUS_SETTLE_MS, FOCUS_SETTLE_MS])
})

test('a render with the same focus as the last does not wait', async () => {
  const { waits, sleep } = sleeper()
  for (const isFocused of [true, true, true]) await settleFocus(site('steady', isFocused), sleep)

  expect(waits).toEqual([])
})

test('sites are independent: by pane id and by surface', async () => {
  const { waits, sleep } = sleeper()
  await settleFocus(site('one', true), sleep)
  await settleFocus(site('two', false), sleep)
  await settleFocus(site('one', false, 'terminal'), sleep)
  expect(waits).toEqual([])

  await settleFocus(site('two', false), sleep)
  await settleFocus(site('one', true), sleep)
  expect(waits).toEqual([])
})

test('a site without isFocused (a band) never waits', async () => {
  const { waits, sleep } = sleeper()
  for (let i = 0; i < 3; i += 1) await settleFocus(site('band'), sleep)

  expect(waits).toEqual([])
})
