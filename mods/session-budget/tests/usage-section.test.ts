import { expect, mock, test } from 'claude-code/testing'

import { startBudget } from '../hooks/budget'
import { setLang } from '../hooks/lang'
import { budgetSection } from '../hooks/section'

// This mod's section of hud-pro's Usage pane, and `/budget` opening that pane at it while hud-pro runs.

const reading = { percent: 40, resetsAt: 'r1', usd: 1, scope: 'five_hour' }

// Stands in for hud-pro: says it runs, and reports what this mod published and asked for.
const HUD = {
  name: 'hud-pro',
  register(on: any) {
    on('command.run', { command: 'hud-host' }, async ($: any) => (await $.state.set({ plugin: 'hud-pro', key: 'host' }, true), {}))
    on('command.run', { command: 'hud-section' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'session-budget', key: 'section' })).value ?? null) }))
    on('command.run', { command: 'hud-asked' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'session-budget', key: 'openUsage' })).value ?? null) }))
  },
}

async function setup($: any, on: any) {
  mock.clock(on)
  mock.env(on, {})
  on('session.start', () => ({ cwd: '/w' }))
  on('session.usage', () => ({ value: { startedAt: 0, context: {}, rateLimits: [{ kind: 'five_hour', percentUsed: 40, resetsAt: 'r1' }], cost: { usd: 1 } } }))
  on('session.measure', (_: any, e: any) => ({ changed: e.changed }))
  for (const name of ['store.get', 'store.set', 'command.register', 'ui.log']) on(name, () => ({ value: undefined }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })
}

const run = async ($: any, command: string, args = '') => (await $.command.run({ command, args })).text

test('with no budget the section says what /budget does, the brake beside it', () => {
  setLang('en')
  const section = budgetSection({ budget: null, brakeAt: 85, isEnabled: true, nowMs: 0 })
  expect(section).toMatchObject({ id: 'budget', title: 'Session budget', tone: 'neutral', isEmpty: true })
  expect(section.lines[0]).toMatch(/^No budget set\. With \/budget 20%, once this chat has used 20 points/)
  expect(section.lines[1]).toBe('Helper-agent brake on: once 85% of the 5-hour allowance is used, it asks before a helper agent starts.')
})

test('a set budget shows its spend in the window, warns from 80% and is danger when full; dollars say list price', () => {
  setLang('en')
  const spent = (limit: number, last: number) => ({ ...startBudget('percent', limit, reading), last })
  expect(budgetSection({ budget: spent(10, 44), brakeAt: null, isEnabled: true, nowMs: 0 })).toMatchObject({ tone: 'neutral', lines: ['Session budget: 5-hour 4% / 10% (40%)', 'Helper-agent brake off.'] })
  expect(budgetSection({ budget: spent(10, 48), brakeAt: null, isEnabled: true, nowMs: 0 }).tone).toBe('warn')
  expect(budgetSection({ budget: spent(10, 50), brakeAt: null, isEnabled: true, nowMs: 0 }).tone).toBe('danger')
  const usd = startBudget('usd', 5, reading)
  expect(budgetSection({ budget: usd, brakeAt: null, isEnabled: true, nowMs: 0 }).lines[0]).toContain('at list price')
})

test('switched off, the section says so and how to turn it on', () => {
  setLang('tr')
  expect(budgetSection({ budget: null, brakeAt: 85, isEnabled: false, nowMs: 0 }).lines).toEqual([
    'session-budget kapalı: uyarı, devam sorusu ve yardımcı ajan freni yok. /session-budget on ile açılır.',
  ])
})

test('the section is published at start and follows /budget', { plugins: [HUD] } as any, async ($: any, on: any) => {
  await setup($, on)
  expect(JSON.parse(await run($, 'hud-section'))).toMatchObject({ id: 'budget', isEmpty: true })

  await run($, 'budget', '20%')
  expect(JSON.parse(await run($, 'hud-section')).lines[0]).toMatch(/^Session budget: 5-hour 0% \/ 20%/)
})

test('/budget alone asks hud-pro for its Usage pane only while hud-pro runs, and still answers', { plugins: [HUD] } as any, async ($: any, on: any) => {
  await setup($, on)
  expect(await run($, 'budget')).toBe('No session budget. Set one with /budget 20% or /budget $5')
  expect(JSON.parse(await run($, 'hud-asked'))).toBeNull()

  await run($, 'hud-host')
  await run($, 'budget')
  expect(JSON.parse(await run($, 'hud-asked'))).toMatchObject({ section: 'budget' })
})
