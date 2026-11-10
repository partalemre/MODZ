import { expect, mock, test } from 'claude-code/testing'

import { freshState } from '../hooks/core'
import { setLang } from '../hooks/lang'
import { cacheSection } from '../hooks/section'
import { HOUR, MIN, START, run, session, turn, world } from './world'

// This mod's section of hud-pro's Usage pane, and `/cache-tax` opening that pane at it while hud-pro runs.

// Stands in for hud-pro: says it runs, and reports what this mod published and asked for.
const HUD = {
  name: 'hud-pro',
  register(on: any) {
    on('command.run', { command: 'hud-host' }, async ($: any) => (await $.state.set({ plugin: 'hud-pro', key: 'host' }, true), {}))
    on('command.run', { command: 'hud-section' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'cache-tax', key: 'section' })).value ?? null) }))
    on('command.run', { command: 'hud-asked' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'cache-tax', key: 'openUsage' })).value ?? null) }))
  },
}

const hud = async ($: any, command: string) => JSON.parse((await $.command.run({ command, args: '' })).text)

test('before any reply the section says what it will show and when', () => {
  setLang('en')
  expect(cacheSection(freshState(), 0)).toMatchObject({ id: 'cache', title: 'Cache', tone: 'neutral', isEmpty: true })
  expect(cacheSection(freshState(), 0).lines[0]).toMatch(/^No reply yet\. The cache’s one-hour clock starts with the first reply/)
})

test('after a reply it lists the card\'s rows, says the dollars are list-price estimates, and warns once cold', () => {
  setLang('en')
  const s = { ...freshState(), lastRequestAt: START, lastModel: 'claude-opus-5-5', ctx: 200_000 }
  const warm = cacheSection(s, START + 5 * MIN)
  expect(warm.tone).toBe('neutral')
  expect(warm.lines[0]).toBe('claude-opus-5-5')
  expect(warm.lines).toContain('state · warm, 55m left')
  expect(warm.lines.at(-1)).toBe('$ are list-price estimates; on a subscription the limit percent is what counts.')
  expect(cacheSection(s, START + 2 * HOUR).tone).toBe('warn')
})

test('the section is published at start and after each turn', { plugins: [HUD] } as any, async ($: any, on: any) => {
  mock.clock(on, { now: START })
  world(on, [], { lang: 'en' })
  await $.session.start(session)
  expect(await hud($, 'hud-section')).toMatchObject({ id: 'cache', isEmpty: true })

  await $.turn.complete(turn())
  expect((await hud($, 'hud-section')).isEmpty).toBeUndefined()
})

test('/cache-tax asks hud-pro for its Usage pane only while hud-pro runs, and still answers with the card', { plugins: [HUD] } as any, async ($: any, on: any) => {
  mock.clock(on, { now: START })
  world(on, [], { lang: 'en' })
  await $.session.start(session)
  expect((await $.command.run(run('cache-tax', ''))).text).toMatch(/^no model seen yet/)
  expect(await hud($, 'hud-asked')).toBeNull()

  await $.command.run({ command: 'hud-host', args: '' })
  await $.command.run(run('cache-tax', ''))
  expect(await hud($, 'hud-asked')).toMatchObject({ section: 'cache' })
})
