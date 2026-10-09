import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { hubDetail, isOwnOpen } from '../hooks/hub'

// The MODZ main panel's side of skins (DESIGN.md §9): the `hub` card and the `modz.open` request.

type Opened = { id: string; title?: string; focus?: boolean }

const themeRow = (value: string) => [{ key: 'theme', label: 'Theme', kind: 'enum', value, provider: { kind: 'engine' }, isLocked: false }]

function stubEngine(on: On, theme = 'dark') {
  const world = { opens: [] as Opened[], cards: [] as unknown[] }
  mock.clock(on, { now: 10_000 })
  on('session.cwd', () => ({ value: '/work' }))
  on('env.get', () => ({ value: undefined }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('config.list', () => ({ value: themeRow(theme) as never }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.open', ($, e) => {
    world.opens.push(e as Opened)

    return { value: { isPlaced: true } }
  })
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000, percent: 42 }, rateLimits: [] } }))
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', () => ({ value: { command: 'skin' } }))
  on('tool.register', () => ({ value: { tool: 'mcp__skins__design' } }))
  on('state.set', { plugin: 'skins', key: 'hub' } as never, ($: unknown, e: { value: unknown }, next: (e: unknown) => unknown) => {
    world.cards.push(e.value)

    return next(e)
  })

  return world
}

const start = ($: Engine) => $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })

const runSkin = ($: Engine, args: string) =>
  $.command.run({ command: 'skin', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } })

// A stand-in for the MODZ main panel: a press on one of its rows writes `modz.open`.
const MODZ = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'modz-press' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'open' }, { pane: e.args, at: 1 })

      return {}
    })
  },
}

test('/skin opens the Görünüm settings with the keyboard: the person asked for it', async ($, on) => {
  const world = stubEngine(on)
  await start($)

  await runSkin($, '')

  expect(world.opens).toEqual([expect.objectContaining({ id: 'skins-settings', title: 'Görünüm', focus: true })])
})

test('a MODZ open request for skins opens the settings without taking the keyboard', { plugins: [MODZ] } as never, async ($: any, on: any) => {
  const world = stubEngine(on)
  await start($)

  await $.command.run({ command: 'modz-press', args: 'usage' })
  expect(world.opens).toEqual([])
  await $.command.run({ command: 'modz-press', args: 'skins' })
  expect(world.opens).toHaveLength(1)
  expect(world.opens[0]).toMatchObject({ id: 'skins-settings', title: 'Görünüm' })
  expect(world.opens[0]?.focus).toBeUndefined()
  expect(isOwnOpen({ pane: 'skins', at: 1 })).toBe(true)
  expect(isOwnOpen(null)).toBe(false)
})

test('the MODZ card names the skin and its background, once per change', async ($, on) => {
  const world = stubEngine(on)
  await start($)

  expect(world.cards).toEqual([expect.objectContaining({ pane: 'skins', detail: 'tidemark · koyu', tone: 'idle' })])
  await runSkin($, 'rail')
  expect(world.cards).toHaveLength(1)
  await runSkin($, 'dracula')
  expect(world.cards[1]).toMatchObject({ detail: 'dracula · koyu', tone: 'idle' })
  await runSkin($, 'off')
  expect(world.cards[2]).toMatchObject({ detail: 'skin kapalı' })
})

test('on a light theme the card says açık; a long name stays within 40 characters', async ($, on) => {
  const world = stubEngine(on, 'light')
  await start($)

  expect(world.cards[0]).toMatchObject({ detail: 'tidemark · açık' })
  expect(hubDetail('a-very-long-custom-skin-name-made-by-someone', false).length).toBeLessThanOrEqual(40)
})
