import { expect } from 'claude-code/testing'

import { setLang } from '../hooks/i18n'
import { fitRow } from '../hooks/strip'
import { chipWidth } from '../hooks/strip-chips'
import { TEAM_W, teamArt, teamFrom } from '../hooks/strip-team'
import { test, BAND, setup } from './fixtures'

// The strip's teammate chip: who else works on this project, read from the transceiver mod's `team` state.

const MINUTE = 60_000
const NOW = Date.parse('2026-11-17T12:00:00Z')
const EN = { lang: 'en' } as const
const DESK = { ...BAND, surface: 'desktop' } as const

// Stands for transceiver (it owns `team`) and the MODZ hub (it says it runs and records the home values it hears).
const TRANSCEIVER = {
  name: 'transceiver',
  register(on: any) {
    on('command.run', { command: 'team-set' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'transceiver', key: 'team' }, JSON.parse(e.args))
      return {}
    })
  },
}
const HUB = {
  name: 'modz',
  register(on: any) {
    const homes: unknown[] = []
    on('command.run', { command: 'hub-on' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)
      return {}
    })
    on('state.set', { key: 'home' }, async ($: any, e: any, next: any) => {
      homes.push({ from: e.plugin, value: e.value })
      return next(e)
    })
    on('command.run', { command: 'heard-home' }, async () => ({ text: JSON.stringify(homes) }))
  },
}
const PLUGINS = { plugins: [TRANSCEIVER, HUB] }

const team = (o: { unread?: number; isAgent?: boolean; mates?: number; at?: number } = {}) => ({
  roomId: 'r1',
  repo: 'o/r',
  mates: [{ name: 'Ayla', at: o.at ?? NOW - MINUTE, branch: 'feature/login' }, { name: 'Can', at: NOW - 90 * MINUTE }].slice(0, o.mates ?? 1),
  unread: o.unread ?? 0,
  last: { id: 'm1', name: 'Ayla', text: 'Tests pass on my side, merging after lunch', ts: NOW, isAgent: o.isAgent ?? false },
})
const setTeam = ($: any, value: unknown) => $.command.run({ command: 'team-set', args: JSON.stringify(value) } as never)

test('team: with nobody else on the project there is no chip and no gap', PLUGINS, async ($, on) => {
  await setup($, on, EN)
  await setTeam($, null)
  const ui = await $.ui.mount(DESK)
  expect(await ui.find({ key: 'savvy-chip-press-team' })).toBeUndefined()
  expect(await ui.find({ key: 'savvy-chip-press-cost' })).toBeDefined()
})

test('team: without the transceiver mod the strip draws as before', async ($, on) => {
  await setup($, on, EN)
  const ui = await $.ui.mount(DESK)
  expect(await ui.find({ key: 'savvy-chip-press-team' })).toBeUndefined()
  expect(await ui.find({ key: 'savvy-chip-press-tokens' })).toBeDefined()
})

test('team: someone working now reads as a presence: name, line of work, the others counted', async () => {
  setLang('en')
  const { full } = teamArt(teamFrom(team({ mates: 2 }))!, NOW)
  expect(full.alt).toBe('Ayla is working now, on the line of work feature/login, and 1 more on this project')
  expect(full.source).toContain('feature/login')
  expect(full.source).toContain('+1')
  const away = teamArt(teamFrom(team({ at: NOW - 2 * 60 * MINUTE }))!, NOW).full
  expect(away.alt).toMatch(/^Ayla worked 2 .* ago$/)
  expect(away.source).not.toContain('feature/login')
})

test('team: an unread line from their AI reads as the message, with the crab mark, in the accent', async () => {
  setLang('en')
  const { full } = teamArt(teamFrom(team({ unread: 2, isAgent: true }))!, NOW)
  expect(full.alt).toBe("Ayla's AI wrote: Tests pass on my side, merging after lunch")
  expect(full.source).toContain('class="f-edit"')
  expect(full.source).toContain('<text class="f-edit"')
  const read = teamArt(teamFrom(team({ unread: 0, isAgent: true }))!, NOW).full
  expect(read.alt).toMatch(/^Ayla is working now/)
})

test('team: the chip keeps one width whatever it says', async () => {
  setLang('en')
  const readings = [team(), team({ mates: 2 }), team({ unread: 3 }), team({ unread: 1, isAgent: true }), team({ at: NOW - 600 * MINUTE })]
  for (const one of readings) {
    const art = teamArt(teamFrom(one)!, NOW)
    expect(art.full.width).toBe(TEAM_W.full)
    expect(art.bare.width).toBe(TEAM_W.bare)
  }
})

test('team: a tight row drops the side value, then the chip, before any other chip gives way', async () => {
  setLang('en')
  const slot = (id: string, rank: number, note?: string) => ({ chip: { id, label: id, value: '12345', ...(note ? { note } : {}) }, rank, press: () => undefined })
  const mate = { chip: { id: 'team', label: '', value: '' }, rank: 6, press: () => undefined, art: teamArt(teamFrom(team())!, NOW) }
  const [cost, tokens, modz] = [slot('cost', 1, 'last turn'), slot('tokens', 3), slot('modz', 0)]
  const used = [cost, tokens, modz].reduce((sum, one) => sum + chipWidth(one.chip), 0)
  const row = (width: number) => fitRow([cost, tokens, mate, modz], width)
  const teamIn = (width: number) => row(width).find(one => one.slot.chip.id === 'team')?.slot
  expect(teamIn(used + TEAM_W.full)?.isBare).toBeUndefined()
  expect(teamIn(used + TEAM_W.bare)?.isBare).toBe(true)
  expect(row(used + TEAM_W.bare)[0]?.slot.chip.note).toBe('last turn')
  expect(teamIn(used + 1)).toBeUndefined()
  expect(row(used + 1).map(one => one.slot.chip.id)).toEqual(['cost', 'tokens', 'modz'])
  expect(row(used + 1)[0]?.slot.chip.note).toBe('last turn')
})

test('team: pressing the chip asks the hub to open the Transceiver panel', PLUGINS, async ($, on) => {
  await setup($, on, EN)
  await $.command.run({ command: 'hub-on', args: '' } as never)
  await setTeam($, team({ unread: 1 }))
  const ui = await $.ui.mount(DESK)
  const alts = (await ui.findAll({ type: 'Svg' })).map((n: any) => n.props.alt)
  expect(alts).toContain('Ayla wrote: Tests pass on my side, merging after lunch')
  await ui.press({ key: 'savvy-chip-press-team' })
  const heard = await $.command.run({ command: 'heard-home', args: '' } as never)
  expect(JSON.parse((heard as { text: string }).text)).toContainEqual({ from: 'savvy-progress', value: expect.objectContaining({ pane: 'transceiver' }) })
})
