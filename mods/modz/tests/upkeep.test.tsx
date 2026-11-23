import { expect, test } from 'claude-code/testing'

import { setLang } from '../hooks/kit/lang'
import { linkName, linksCard, linksOf } from '../hooks/links'
import { weightCard, weightsOf } from '../hooks/weight'
import { MARKET_FILES } from './market-fixture'
import { stubWorld } from './world'

const DAY = 24 * 60 * 60 * 1000
const NOW = 400 * DAY

test('a server is told once by its worst state, and a stale sign-in entry is left out', () => {
  const links = linksOf({
    servers: ['github', 'plugin_dart-flutter_dart-mcp-server', 'github'],
    authCache: {
      'plugin:engineering:slack': { timestamp: NOW - 1000 },
      'plugin:dart-flutter:dart-mcp-server': { timestamp: NOW - 1000 },
      'plugin:data:definite': { timestamp: NOW - 1000 },
      'plugin:old:gone': { timestamp: NOW - 3 * DAY },
    },
    search: { result: { failed_mcp_servers: [{ name: 'plugin:data:definite', error: 'endpoint not found' }], pending_mcp_servers: ['playwright'] } },
    now: NOW,
  })

  expect(links).toEqual({
    connected: ['plugin_dart-flutter_dart-mcp-server', 'github'],
    waiting: ['plugin:engineering:slack'],
    failed: [{ name: 'plugin:data:definite', error: 'endpoint not found' }],
    pending: ['playwright'],
  })
  expect(linkName('plugin:engineering:slack')).toBe('slack (engineering)')
  expect(linkName('plugin:nimble:nimble')).toBe('nimble')
})

test('the connections row warns only for a failure; waiting for a sign-in is a quiet state', () => {
  setLang('tr')
  const quiet = { connected: ['github'], waiting: ['a', 'b'], failed: [], pending: [] }

  expect(linksCard(quiet, 1)).toMatchObject({ pane: 'modz-links', detail: '2 giriş bekliyor', tone: 'idle' })
  expect(linksCard({ ...quiet, failed: [{ name: 'x', error: '' }] }, 1)).toMatchObject({ detail: '1 bozuk · 2 giriş bekliyor', tone: 'warn' })
  expect(linksCard({ ...quiet, waiting: [] }, 1).detail).toBe('1 çalışıyor')
})

const skill = (name: string, tokens: number, pluginName?: string) => ({ name, tokens, source: pluginName === undefined ? 'userSettings' : 'plugin', ...(pluginName === undefined ? {} : { pluginName }) })

test('dead weight is what nobody used in a month: a plugin whole, a skill by itself, the heaviest first', () => {
  const weights = weightsOf({
    skills: [
      skill('ui', 300, 'unity'),
      skill('unity:audio', 200, 'unity'),
      skill('brainstorming', 400, 'superpowers'),
      skill('plans', 100, 'superpowers'),
      skill('old-notes', 150),
      skill('run', 90),
      { name: 'init', source: 'built-in', tokens: 50 },
    ],
    usage: {
      'superpowers:brainstorming': { usageCount: 9, lastUsedAt: NOW - DAY },
      run: { usageCount: 2, lastUsedAt: NOW - 45 * DAY },
      'old-notes': { usageCount: 0, lastUsedAt: NOW },
    },
    enabled: { 'unity@market': true, 'superpowers@market': true },
    now: NOW,
  })

  expect(weights).toEqual({
    tokens: 740,
    items: [
      { name: 'unity', kind: 'plugin', skills: 2, tokens: 500, lastUsedAt: null, disable: '/plugin disable unity@market' },
      { name: 'old-notes', kind: 'skill', skills: 1, tokens: 150, lastUsedAt: null, disable: null },
      { name: 'run', kind: 'skill', skills: 1, tokens: 90, lastUsedAt: NOW - 45 * DAY, disable: null },
    ],
  })
  setLang('tr')
  expect(weightCard(weights!, 1)).toMatchObject({ pane: 'modz-weight', detail: '3 kullanılmıyor · ~740 token', tone: 'idle' })
})

test('with no use counts to read, or no skills listed yet, nothing is weighed', () => {
  expect(weightsOf({ skills: [skill('run', 90)], usage: undefined, enabled: {}, now: NOW })).toBeNull()
  expect(weightsOf({ skills: [], usage: {}, enabled: {}, now: NOW })).toBeNull()
})

const PANE = { plugin: 'modz', component: 'Pane', surface: 'terminal', props: {}, viewport: { columns: 100, rows: 40 } } as const
const texts = async (ui: any): Promise<string> => (await ui.findAll({ type: 'Text' })).map((text: any) => (text.children ?? []).join('')).join('\n')
// The rows are filled beside the hook that asked, not inside it: a few engine round trips let that finish.
const settle = async ($: any) => {
  for (let turn = 0; turn < 40; turn++) await $.command.run({ command: 'wait', args: '' })
}

test('the hub fills both rows as the session starts, and asks the engine about failures only once Connections is opened', async ($: any, on: any) => {
  const files = {
    ...MARKET_FILES,
    '/home/.claude/mcp-needs-auth-cache.json': JSON.stringify({ 'plugin:engineering:slack': { timestamp: 900 } }),
    '/home/.claude.json': JSON.stringify({ skillUsage: {} }),
  }
  const world = stubWorld(on, { files, env: { MODZ_LANG: 'tr', HOME: '/home' } })
  const asked: string[] = []
  const logged: string[] = []
  on('ui.log', (_: unknown, e: any) => {
    logged.push(String(e.text ?? e.message ?? JSON.stringify(e)))

    return { value: undefined }
  })
  on('session.usage', () => ({ value: { context: { breakdown: { mcpTools: [{ name: 'mcp__github__x', serverName: 'github', tokens: 9, isLoaded: false }], skills: { skillFrontmatter: [skill('ui', 2100, 'unity')] } } } } }))
  on('tool.call', (_: unknown, e: any) => {
    asked.push(e.tool)

    return { result: { matches: [], failed_mcp_servers: [{ name: 'plugin:data:definite', error: 'adres bulunamadı' }] }, text: '' }
  })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const hub = await $.ui.mount({ ...PANE, requestId: 'modz' })
  await settle($)

  expect(logged).toEqual([])
  expect(await texts(hub)).toContain('1 giriş bekliyor')
  expect(await texts(hub)).toContain('1 kullanılmıyor · ~2,1 bin token')
  expect(asked).toEqual([])

  await hub.press({ key: 'open-modz-links' })
  await settle($)

  // Connections is a page of the hub's one pane.
  expect(world.up).toEqual(['modz'])
  expect(asked).toEqual(['ToolSearch'])
  const links = await texts(hub)
  expect(links).toContain('Bozuk · 1')
  expect(links).toContain('definite (data): adres bulunamadı')
  expect(links).toContain('slack (engineering)')
  expect(links).toContain('github')

  const weight = await texts(await $.ui.mount({ ...PANE, requestId: 'modz-weight' }))
  expect(weight).toContain('unity')
  expect(weight).toContain('hiç kullanılmadı')
})
