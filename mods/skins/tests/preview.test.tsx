import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

// Visual check, not behaviour: logs each drawn tree for the preview renderer
// (`@@TREE@@<label>@@<json>`), once on a dark and once on a light Claude Code theme.

const SITE = { plugin: 'skins', surface: 'desktop', viewport: { columns: 100, rows: 30 } } as const

// The settings pane at the desktop's narrow (≈400 px) and wide (≈600 px) side panel, in columns.
const PANE_WIDTHS = [['400', 62], ['600', 94]] as const
const BASH_MS = 2140
const EDIT_MS = 380
const CONTEXT_FULL = 85
const ADDED = 18
const REMOVED = 3

type Theme = 'dark' | 'light'
type Drawn = { drawn: () => Promise<unknown>; unmount: () => Promise<void> }

const themeRow = (theme: Theme) => [{ key: 'theme', label: 'Theme', kind: 'enum', value: theme, provider: { kind: 'engine' }, isLocked: false }]

const patch = [
  ...Array.from({ length: ADDED }, (_, i) => `+  limit(${i})`),
  ...Array.from({ length: REMOVED }, (_, i) => `-  old(${i})`),
]

const call = (id: string, tool: string, input: unknown, state: object = {}) => ({
  tool_use_id: id,
  tool,
  input,
  isRunning: false,
  isErrored: false,
  isInterrupted: false,
  ...state,
})

const ROWS = [
  ['bash', call('bash', 'Bash', { command: 'pnpm test --filter hub' })],
  ['edit', call('edit', 'Edit', { file_path: '/work/apps/hub/src/server.ts' }, { output: { structuredPatch: [{ lines: patch }] } })],
  ['read', call('read', 'Read', { file_path: '/work/docs/protocols.md' })],
  ['grep', call('grep', 'Grep', { pattern: 'rateLimit', path: '/work/apps' })],
  ['webfetch', call('webfetch', 'WebFetch', { url: 'https://fastify.dev/docs/latest/' })],
  ['bash-failed', call('bash-failed', 'Bash', { command: 'pnpm build' }, { isErrored: true })],
  ['read-running', call('read-running', 'Read', { file_path: '/work/README.md' }, { isRunning: true })],
] as const

const DIFF_OUTPUT = {
  filePath: '/work/apps/hub/src/server.ts',
  structuredPatch: [{ oldStart: 12, newStart: 12, lines: [' const app = fastify()', '-app.listen(7447)', '+app.register(rateLimit, { max: 60 })', '+app.listen(7447)'] }],
}

async function logTree(label: string, ui: Drawn): Promise<void> {
  console.log(`@@TREE@@${label}@@${JSON.stringify(await ui.drawn())}`)
  await ui.unmount()
}

function stubEngine(on: On, theme: Theme) {
  const store: Record<string, unknown> = {}
  const clock = mock.clock(on, { now: 10_000 })
  on('session.cwd', () => ({ value: '/work' }))
  on('env.get', () => ({ value: undefined }))
  on('config.list', () => ({ value: themeRow(theme) as never }))
  on('store.get', ($, e) => ({ value: store[e.key] }))
  on('store.set', ($, e) => {
    store[e.key] = e.value
    return { value: undefined }
  })
  on('ui.toast', () => ({ value: undefined }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: [''] }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000, percent: CONTEXT_FULL }, rateLimits: [{ kind: 'five_hour', percentUsed: 61 }] } }))
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', () => ({ value: { command: 'skin' } }))
  on('tool.register', () => ({ value: { tool: 'mcp__skins__design' } }))
  // A call takes the time its row shows, so the row has a duration to draw.
  on('tool.call', async ($, e) => {
    await clock.advance(e.tool === 'Bash' ? BASH_MS : EDIT_MS)
    return { result: {} }
  })
}

const runSkin = ($: Engine, args: string) =>
  $.command.run({ command: 'skin', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } })

async function previewAll($: Engine, theme: Theme) {
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.tool.call({ tool: 'Bash', tool_use_id: 'bash', command: 'pnpm test --filter hub' })
  await $.tool.call({ tool: 'Edit', tool_use_id: 'edit', file_path: '/work/apps/hub/src/server.ts' })

  for (const [name, props] of ROWS) {
    await logTree(`${theme}-tidemark-rows-${name}`, await $.ui.mount({ ...SITE, component: 'ToolUse', requestId: props.tool_use_id, props }))
  }

  const result = { tool_use_id: 'diff', tool: 'Edit', output: DIFF_OUTPUT, isErrored: false }
  await logTree(`${theme}-tidemark-diff-card`, await $.ui.mount({ ...SITE, component: 'ToolResult', requestId: 'diff', props: result }))

  for (const [label, columns] of PANE_WIDTHS) {
    const pane = { title: 'Görünüm', isFocused: true, bodyColumns: columns, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} } as const
    await logTree(`${theme}-tidemark-settings-${label}`, await $.ui.mount({ ...SITE, component: 'Pane', requestId: 'skins-settings', props: pane }))
  }

  await runSkin($, 'band on')
  const band = { hasSurvey: false, isWorking: false, maxRows: 4, bodyColumns: 90, scroll: { offset: 0, bodyRows: 4 }, view: {} }
  const ui = await $.ui.mount({ ...SITE, component: 'AbovePrompt', requestId: 'band', props: band })
  expect(await ui.find({ type: 'Text', text: `Bağlam %${CONTEXT_FULL} dolu` })).toBeDefined()
  await logTree(`${theme}-tidemark-band`, ui)
}

test('preview: Tidemark on a dark theme', async ($, on) => {
  stubEngine(on, 'dark')
  await previewAll($, 'dark')
})

test('preview: Tidemark on a light theme', async ($, on) => {
  stubEngine(on, 'light')
  await previewAll($, 'light')
})
