import { expect, test } from 'claude-code/testing'

import { hubDetail, isOwnOpen } from '../hooks/hub'
import { runSkin, start, stubEngine } from './world'
import { setLang } from '../hooks/lang'

// These tests call the word builders directly and read Turkish.
setLang('tr')

// The MODZ main panel's side of skins (DESIGN.md §9): the `hub` card and the `modz.open` request.

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

test('a MODZ hub press for skins opens the settings asking for the keyboard, so it comes in front of the hub', { plugins: [MODZ] } as never, async ($: any, on: any) => {
  const world = stubEngine(on)
  await start($)

  await $.command.run({ command: 'modz-press', args: 'usage' })
  expect(world.opens).toEqual([])
  await $.command.run({ command: 'modz-press', args: 'skins' })
  expect(world.opens).toHaveLength(1)
  expect(world.opens[0]).toMatchObject({ id: 'skins-settings', title: 'Görünüm' })
  expect(world.opens[0]?.focus).toBe(true)
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
