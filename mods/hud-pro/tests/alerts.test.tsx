import { expect, test } from 'claude-code/testing'

import { BAND, MS_PER_HOUR, USAGE, start, stubSession } from './stubs'

type Drawn = { props: { alt: string } } | undefined

const CALM: any = {
  ...USAGE,
  rateLimits: [
    { kind: 'five_hour', percentUsed: 10, resetsAt: new Date(2 * MS_PER_HOUR).toISOString() },
    { kind: 'seven_day', percentUsed: 20, resetsAt: new Date(94 * MS_PER_HOUR).toISOString() },
  ],
}

test('band: alerts draws nothing of its own while every window is calm', { options: { band: 'alerts' } }, async ($, on) => {
  stubSession(on, CALM)
  await start($, 'desktop')

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })

  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: 'theirs' })).toBeDefined()
})

test('band: alerts keeps only the window that needs a look, without the cost', { options: { band: 'alerts' } }, async ($, on) => {
  stubSession(on)
  await start($, 'desktop')

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svg = (await ui.find({ type: 'Svg' })) as Drawn

  expect(svg?.props.alt).toBe('7 gün %91, 3g 22sa sonra sıfırlanır')
})

test('band: alerts on the terminal shows the warned window as text and drops the calm ones', { options: { band: 'alerts' } }, async ($, on) => {
  stubSession(on)
  await start($, 'terminal')

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

  expect(await ui.find({ type: 'Text', text: '%91' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '%32' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: '≈$1,23' })).toBeUndefined()
})

test('band: alerts leaves Compact to others even when the context is past 70%', { options: { band: 'alerts' } }, async ($, on) => {
  stubSession(on, { ...USAGE, context: { window: 200_000, tokens: 150_000, percent: 75 } })
  await start($, 'desktop')

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svg = (await ui.find({ type: 'Svg' })) as Drawn

  expect(svg?.props.alt).toContain('bağlam %75')
  expect(await ui.find({ key: 'compact' })).toBeUndefined()
})
