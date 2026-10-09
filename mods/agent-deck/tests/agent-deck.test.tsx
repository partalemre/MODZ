import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'agent-deck',
  component: 'Pane',
  requestId: 'agent-deck',
  viewport: { columns: 120, rows: 40 },
  props: {
    title: 'Agents',
    isFocused: true,
    bodyColumns: 70,
    placement: 'inline',
    scroll: { offset: 0, bodyRows: 24 },
    view: {},
  },
} as const

const LIST = [
  { id: 'a1', description: 'find auth code', type: 'Explore', status: 'running' },
  { id: 'a2', description: 'plan the ui', type: 'Plan', status: 'completed' },
]

const MESSAGES = [
  { role: 'user', text: 'Find where login is handled', toolUses: [] },
  { role: 'assistant', text: 'Looking in src/auth', toolUses: [{ tool: 'Grep', input: { pattern: 'login' } }] },
]

type Spy = { spawned: any[]; sent: any[] }

async function setup($: any, on: any, spy: Spy, list: any[] = LIST) {
  mock.clock(on)
  on('agent.list', () => ({ value: list }))
  on('session.messages', () => ({ value: MESSAGES }))
  on('session.send', (_: any, e: any) => {
    spy.sent.push(e)

    return { isDelivered: true }
  })
  on('agent.spawn', (_: any, e: any) => {
    spy.spawned.push(e)

    return { model: 'test', agentId: 'a3' }
  })
  on('env.get', () => ({ value: undefined }))
  on('fs.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [{ key: 'theme', value: 'dark' }] }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('tool.call', () => ({ result: 'ok' }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'deck', args: '' })
}

test('the crew tab lists every agent with its activity', async ($, on) => {
  await setup($, on, { spawned: [], sent: [] })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })

  expect(await ui.find({ type: 'Text', text: /1 running/ })).toBeDefined()
  expect(await ui.find({ key: 'pick-a1' })).toBeDefined()
  expect(await ui.find({ key: 'pick-a2' })).toBeDefined()
})

test('with no agent running the pane still lists the team to hand work to', async ($, on) => {
  await setup($, on, { spawned: [], sent: [] }, [])

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })

  expect(await ui.find({ type: 'Text', text: /TEAM/ })).toBeDefined()
  expect(await ui.find({ key: 'give-Explore' })).toBeDefined()
  expect(await ui.find({ key: 'give-general-purpose' })).toBeDefined()
})

test('Give task opens the dispatch tab with that agent chosen', async ($, on) => {
  const spy: Spy = { spawned: [], sent: [] }
  await setup($, on, spy)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'give-Plan' })
  await ui.input({ key: 'task', text: 'plan the settings page' })

  expect(spy.spawned).toHaveLength(1)
  expect(spy.spawned[0].subagent_type).toBe('Plan')
})

test('the desktop pane adds a live timeline', async ($, on) => {
  await setup($, on, { spawned: [], sent: [] })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const svg = await ui.find({ type: 'Svg' })

  expect(svg?.props?.isInteractive).toBeUndefined()
  expect(svg?.props?.source).toContain('Explore')
})

test('picking a running agent shows its transcript and a message box', async ($, on) => {
  await setup($, on, { spawned: [], sent: [] })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'pick-a1' })

  expect(await ui.find({ type: 'Text', text: /Find where login/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Grep login/ })).toBeDefined()
  expect(await ui.find({ key: 'send' })).toBeDefined()
})

test('a message typed in the detail goes to that agent', async ($, on) => {
  const spy: Spy = { spawned: [], sent: [] }
  await setup($, on, spy)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'pick-a1' })
  await ui.input({ key: 'send', text: 'focus on the oauth flow' })

  expect(spy.sent).toHaveLength(1)
  expect(spy.sent[0].text).toBe('focus on the oauth flow')
})

test('a task typed in the dispatch tab starts the chosen agent type', async ($, on) => {
  const spy: Spy = { spawned: [], sent: [] }
  await setup($, on, spy)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'tab-dispatch' })
  await ui.select({ key: 'type', value: 'Explore' })
  await ui.input({ key: 'task', text: 'audit the login flow' })

  expect(spy.spawned).toHaveLength(1)
  expect(spy.spawned[0].subagent_type).toBe('Explore')
  expect(spy.spawned[0].prompt).toBe('audit the login flow')
})

test('a subagent tool call shows up as that agent activity', async ($, on) => {
  await setup($, on, { spawned: [], sent: [] })

  await $.tool.call({ tool: 'Read', file_path: 'src/auth/login.ts', agentId: 'a1' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })

  expect(await ui.find({ type: 'Text', text: /Read src\/auth\/login.ts/ })).toBeDefined()
})
