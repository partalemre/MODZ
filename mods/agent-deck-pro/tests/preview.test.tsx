// Draws the desktop deck in its main states for bin/preview: overview, a picked row's drawer, both themes.
import { mock, test } from 'claude-code/testing'

import { PANE } from './fixtures'

const SECOND = 1_000
// Each tool call waits on a gate the story opens once the clock has moved past the call's length.
const gates: ((value: unknown) => void)[] = []
const MODELS: Record<string, [string, string, number]> = {
  a1: ['claude-sonnet-5-5', 'high', 9_000],
  a2: ['claude-opus-5-5', 'xhigh', 21_000],
  a3: ['claude-sonnet-5-5', 'medium', 12_000],
  a5: ['claude-haiku-5', 'low', 6_000],
}

function agents() {
  return [
    { id: 'a1', description: 'Giriş akışını incele', type: 'Explore', status: 'running' },
    { id: 'a5', description: 'Bağımlılıkları tara', type: 'Explore', status: 'running' },
  ] as any[]
}

async function world($: any, on: any, theme: string) {
  const clock = mock.clock(on)
  const list = agents()
  on('agent.list', () => ({ value: list }))
  on('session.messages', () => ({ value: [] }))
  for (const event of ['env.get', 'command.register', 'ui.toast', 'ui.log']) on(event, () => ({ value: undefined }))
  on('fs.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [{ key: 'theme', value: theme }] }))
  on('session.start', () => ({ cwd: '/work' }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('tool.call', async (_: any, e: any) => {
    await new Promise(resolve => gates.push(resolve))
    const isBroken = e.tool === 'Bash' && String(e.command).includes('test')

    return isBroken ? { isError: true, result: 'exit 1', text: '2 fail' } : { result: 'ok' }
  })
  on('turn.step', async function* (_: any, e: any) {
    const tokens = MODELS[e.agentId]?.[2] ?? 1_000
    const usage = { input_tokens: tokens, output_tokens: tokens / 6, cache_read_input_tokens: tokens * 2, cache_creation_input_tokens: 0 }

    return { turnId: 't', index: 0, answer: '', toolUses: [{ tool: 'Read' }], stopReason: 'tool_use', usage }
  })
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'deck', args: '' })

  return { clock, list }
}

async function story($: any, on: any, theme: string) {
  const { clock, list } = await world($, on, theme)
  const work = async (agentId: string, input: Record<string, unknown>, seconds: number) => {
    const ran = $.tool.call({ ...input, agentId })
    for (let spins = 0; gates.length === 0 && spins < 1_000; spins += 1) await Promise.resolve()
    await clock.advance(seconds * SECOND)
    gates.shift()?.(null)
    await ran
  }
  const step = async (agentId: string) => {
    const [model, effort] = MODELS[agentId] ?? ['claude-sonnet-5-5', 'high']
    const stream = $.turn.step({ turnId: 't', index: 0, model, effort, messageCount: 1, agentId })
    for (let next = await stream.next(); next.done !== true; next = await stream.next());
  }
  await work('a5', { tool: 'Glob', pattern: '**/package.json' }, 6)
  await work('a1', { tool: 'Read', file_path: '/repo/src/auth/login.ts' }, 12)
  await work('a5', { tool: 'Read', file_path: '/repo/package.json' }, 14)
  list.push({ id: 'a2', description: 'Ayarlar sayfasını yeniden yaz', type: 'general-purpose', status: 'running' })
  await work('a2', { tool: 'Read', file_path: '/repo/src/settings/page.tsx' }, 9)
  await work('a1', { tool: 'Grep', pattern: 'session' }, 6)
  await work('a2', { tool: 'Grep', pattern: 'useSettings' }, 5)
  await work('a5', { tool: 'Bash', command: 'npm outdated' }, 11)
  list[1] = { ...list[1], status: 'completed' }
  list.push({ id: 'a3', description: 'API istemcisini test et', type: 'general-purpose', status: 'running' })
  list.push({ id: 'a4', description: 'Tasarım belgesini özetle', type: 'Plan', status: 'idle' })
  const todos = ['Bileşeni böl', 'Formu yaz', 'Doğrulamayı ekle', 'Testleri yaz', 'Stilleri düzelt', 'Erişilebilirlik', 'Gözden geçir']
  await work('a2', { tool: 'TodoWrite', todos: todos.map((content, index) => ({ content, activeForm: content, status: index < 2 ? 'completed' : index === 2 ? 'in_progress' : 'pending' })) }, 1)
  await work('a2', { tool: 'Edit', file_path: '/repo/src/settings/page.tsx', old_string: 'a', new_string: 'b' }, 14)
  await work('a3', { tool: 'Read', file_path: '/repo/src/api/client.ts' }, 8)
  await work('a2', { tool: 'Write', file_path: '/repo/src/settings/form.tsx', content: '' }, 10)
  await work('a3', { tool: 'Bash', command: 'npm test -- api' }, 22)
  await work('a2', { tool: 'Bash', command: 'npm run build' }, 26)
  await work('a3', { tool: 'Edit', file_path: '/repo/src/api/client.ts', old_string: 'a', new_string: 'b' }, 18)
  await work('a2', { tool: 'Edit', file_path: '/repo/src/settings/validate.ts', old_string: 'a', new_string: 'b' }, 30)
  await work('a3', { tool: 'Read', file_path: '/repo/src/api/retry.ts' }, 24)
  await work('a2', { tool: 'Read', file_path: '/repo/src/settings/schema.ts' }, 16)
  await work('a3', { tool: 'Bash', command: 'npm test -- api' }, 34)
  for (const id of ['a1', 'a2', 'a2', 'a3', 'a5', 'a2', 'a3']) await step(id)
  await work('a2', { tool: 'Bash', command: 'npx tsc --noEmit' }, 12)
  const open = async (agentId: string, input: Record<string, unknown>) => {
    const ran = $.tool.call({ ...input, agentId })
    for (let spins = 0; gates.length === 0 && spins < 1_000; spins += 1) await Promise.resolve()

    return { ran, gate: gates.shift() }
  }
  const pending = [await open('a3', { tool: 'Bash', command: 'npm test -- api --watch=false' }), await open('a2', { tool: 'Edit', file_path: '/repo/src/settings/form.tsx', old_string: 'a', new_string: 'b' })]
  await clock.advance(150 * SECOND)

  return pending
}

async function draw($: any, theme: string, suffix: string) {
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop', props: { ...PANE.props, bodyColumns: 90 } })
  console.log(`@@TREE@@deck-overview${suffix}@@${JSON.stringify(await ui.drawn())}`)
  await ui.press({ key: 'pick-a2' })
  console.log(`@@TREE@@deck-drawer${suffix}@@${JSON.stringify(await ui.drawn())}`)
  void theme
}

for (const theme of ['dark', 'light']) {
  test(`preview: the desktop deck (${theme})`, async ($, on) => {
    const pending = await story($, on, theme)
    await draw($, theme, theme === 'light' ? '-light' : '')
    for (const call of pending) call.gate?.(null)
    await Promise.all(pending.map(call => call.ran))
  })
}
