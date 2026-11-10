// One index of what a person can run, set and install: `/modz help` and the catalog pane's first sections.
import { expect, test } from 'claude-code/testing'

import type { Market, ModInfo } from '../hooks/catalog'
import { guideOf, helpText, installsOf } from '../hooks/guide'
import { setLang } from '../hooks/kit/lang'
import { stubWorld } from './world'

const CATALOG = { plugin: 'modz', component: 'Pane', requestId: 'modz-mods', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 50 } } as const

const mod = (name: string, state: Partial<ModInfo> = {}): ModInfo =>
  ({ name, version: null, description: `${name} does its thing`, group: 'other', surfaces: [], upstream: null, isHealthy: true, isEnabled: null, options: [], ...state })

const market = (mods: ModInfo[]): Market => ({ name: 'modz', mods })

// The session's slash commands as the engine lists them: built in, a mod's own, and a mod's from its marketplace.
const COMMANDS = [
  { name: 'help', description: 'Shows help', source: 'builtin' },
  { name: 'hud', description: 'Shows or hides the HUD line', source: 'plugin', plugin: 'hud-pro@modz' },
  { name: 'steps', description: 'Opens the plan', source: 'plugin', plugin: 'plan-steps' },
  { name: 'modz', description: 'Opens the MODZ hub', source: 'plugin', plugin: 'modz' },
]

test('a mod that is not installed gets its exact install line, the core set first', () => {
  const mods = [mod('wrapped'), mod('hud-pro'), mod('skins', { isEnabled: true }), mod('checkpoint', { isEnabled: false }), mod('ghost', { isHealthy: false }), mod('savvy-progress'), mod('modz', { isEnabled: true })]

  expect(installsOf(market(mods)).map(install => install.command)).toEqual([
    '/plugin install savvy-progress@modz',
    '/plugin install hud-pro@modz',
    '/plugin install wrapped@modz',
  ])
})

test('each installed mod lists the commands the engine says are its own and the options its manifest declares', () => {
  const mods = [mod('hud-pro', { isEnabled: true, options: ['band'] }), mod('plan-steps', { isEnabled: true }), mod('filetree', { isEnabled: true, options: ['glyphs', 'follow'] }), mod('skins', { isEnabled: true }), mod('wrapped')]

  expect(guideOf(market(mods), COMMANDS)).toEqual([
    { mod: 'hud-pro', commands: [{ name: 'hud', description: 'Shows or hides the HUD line' }], options: ['band'] },
    { mod: 'plan-steps', commands: [{ name: 'steps', description: 'Opens the plan' }], options: [] },
    { mod: 'filetree', commands: [], options: ['glyphs', 'follow'] },
  ])
})

test('the help text names every command, where the options are set, and what is left to install', () => {
  setLang(undefined)
  const text = helpText(market([mod('hud-pro', { isEnabled: true, options: ['band'] }), mod('wrapped')]), COMMANDS)

  expect(text).toContain('/hud: Shows or hides the HUD line')
  expect(text).toContain('Options under /plugin: band')
  expect(text).toContain('/plugin install wrapped@modz')
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`/modz help prints the index instead of opening the hub (${surface})`, async ($: any, on: any) => {
    const world = stubWorld(on, { env: {} })
    on('command.list', () => ({ value: COMMANDS }))
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    world.opened.length = 0
    const answer = await $.command.run({ command: 'modz', args: 'help' })

    expect(answer.text).toContain('MODZ: commands and settings')
    expect(answer.text).toContain('/hud: Shows or hides the HUD line')
    expect(answer.text).toContain('Options under /plugin: thresholdSeconds, pingOnPermission')
    expect(world.opened).toEqual([])
  })

  test(`with only the hub installed the catalog offers each mod's install line, and Copy takes it (${surface})`, async ($: any, on: any) => {
    stubWorld(on, { env: {}, enabled: ['modz'] })
    on('command.list', () => ({ value: COMMANDS }))
    const copied: string[] = []
    on('ui.copy', (_: unknown, e: { text: string }) => {
      copied.push(e.text)

      return { value: { isCopied: true } }
    })
    const toasts: string[] = []
    on('ui.toast', (_: unknown, e: { text: string }) => {
      toasts.push(e.text)

      return { value: undefined }
    })
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    const ui = await $.ui.mount({ ...CATALOG, surface })
    const lines = (await ui.findAll({ type: 'Text', text: /^\/plugin install / })).map((text: any) => String(text.children?.[0]))

    expect(lines.slice(0, 7)).toEqual(['savvy-progress', 'plan-steps', 'filetree', 'blast-radius', 'secret-guard', 'checkpoint', 'hud-pro'].map(name => `/plugin install ${name}@modz`))
    expect(lines).not.toContain('/plugin install modz@modz')
    await ui.press({ key: 'copy-plan-steps' })
    expect(copied).toEqual(['/plugin install plan-steps@modz'])
    expect(toasts).toEqual(['Copied. Paste it into the prompt.'])
  })

  test(`the catalog lists what each installed mod can be asked and set (${surface})`, async ($: any, on: any) => {
    stubWorld(on, { env: {} })
    on('command.list', () => ({ value: COMMANDS }))
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    const ui = await $.ui.mount({ ...CATALOG, surface })
    const said = surface === 'desktop'
      ? (await ui.findAll({ type: 'Svg' })).map((svg: any) => String(svg.props.alt))
      : (await ui.findAll({ type: 'Text' })).map((text: any) => String(text.children?.[0]))

    expect(said.some((line: string) => line.includes('/hud'))).toBe(true)
    expect(said.some((line: string) => line.includes('Options under /plugin: thresholdSeconds'))).toBe(true)
    expect(await ui.find({ type: 'Text', text: /^\/plugin install / })).toBeUndefined()
  })
}
