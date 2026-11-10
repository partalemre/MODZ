import { expect, test } from 'claude-code/testing'

import { TOKEN_NOTE } from '../hooks/placeholders'
import { english, start } from './setup'

// The guard on the calls themselves: it fails closed, reads what Bash would write, and lets a placeholder pass.

// Built from pieces so this file never holds a literal that a scanner would take for a real key.
const ANT = ['sk', 'ant', 'api03', 'Zx9Qw7Er5Ty3Ui1Op8As6Df4Gh2Jk'].join('-')
const GH = `ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'}`
const ONE = ['⟦', 'secret:1', '⟧'].join('')
const asked = (setup: { asked: string[] }) => setup.asked.filter(line => !line.startsWith('LOG'))

test('a guard that fails denies the write with a clear reason instead of letting it run', async ($, on) => {
  const setup = english('Allow once')
  await start($, on, setup)
  Object.defineProperty(setup, 'surfaces', { get: () => { throw new Error('surfaces broke') } })

  const denied: any = await ($ as any).tool.call({ tool: 'Write', file_path: '/work/src/a.ts', content: `const k = "${ANT}"\n` })

  expect(denied.deny).toMatch(/secret-guard could not check/)
  expect(setup.ran).toHaveLength(0)
})

test('a failed guard still lets a call that writes nothing run', async ($, on) => {
  const setup = english('Allow once')
  await start($, on, setup)
  Object.defineProperty(setup, 'surfaces', { get: () => { throw new Error('surfaces broke') } })

  const ran: any = await ($ as any).tool.call({ tool: 'Read', file_path: '/work/src/a.ts' })

  expect(ran.deny).toBeUndefined()
  expect(setup.ran).toHaveLength(1)
})

test('a heredoc, echo or tee that would write a key to a file asks first', async ($, on) => {
  const setup = english('Cancel')
  await start($, on, setup)

  const heredoc: any = await ($ as any).tool.call({ tool: 'Bash', command: `cat > src/config.ts <<'EOF'\nexport const k = "${ANT}"\nEOF` })
  const echoed: any = await ($ as any).tool.call({ tool: 'Bash', command: `echo "token=${GH}" > src/token.txt` })
  const teed: any = await ($ as any).tool.call({ tool: 'Bash', command: `printf '%s\\n' "${GH}" | tee -a notes.md` })

  expect([heredoc.deny, echoed.deny, teed.deny].every(deny => typeof deny === 'string')).toBe(true)
  expect(heredoc.deny).toContain('src/config.ts:1')
  expect(asked(setup)).toHaveLength(3)
  expect(setup.ran).toHaveLength(0)
})

test('Bash writing a key into .env, or clean text anywhere, never asks', async ($, on) => {
  const setup = english('Cancel')
  await start($, on, setup)

  await ($ as any).tool.call({ tool: 'Bash', command: `echo "ANTHROPIC_API_KEY=${ANT}" >> .env` })
  await ($ as any).tool.call({ tool: 'Bash', command: 'echo "hello world" > out.txt 2>/dev/null' })

  expect(asked(setup)).toEqual([])
  expect(setup.ran).toHaveLength(2)
})

test('a subagent writing only a placeholder passes with the note: the file holds no secret', async ($, on) => {
  const setup = english('Cancel')
  on('prompt.submit', (_: any, e: any) => ({ text: e.text }))
  await start($, on, setup)
  await ($ as any).prompt.submit({ text: `key: ${ANT}` })

  const ran: any = await ($ as any).tool.call({ tool: 'Write', file_path: '/work/src/a.ts', content: `const k = "${ONE}"\n`, agentId: 'agent-1' })

  expect(ran.deny).toBeUndefined()
  expect(ran.context).toContain(TOKEN_NOTE)
  expect(setup.ran[0]?.content).toBe(`const k = "${ONE}"\n`)
})

// Hears each hub card this mod writes, as the MODZ panel does, and tells them back in order.
const panel = {
  name: 'panel',
  register(on: any) {
    const heard: unknown[] = []
    on('state.set', { plugin: 'secret-guard', key: 'hub' }, (_: any, e: any, next: any) => (heard.push(e.value), next(e)))
    on('command.run', { command: 'hub-heard' }, () => ({ text: JSON.stringify(heard) }))
  },
}

test('a write that waits on the question is told to the MODZ panel, and the line goes with the answer', { plugins: [panel] }, async ($: any, on: any) => {
  const setup = english('Allow once')
  await start($, on, setup)
  await $.tool.call({ tool: 'Write', file_path: '/work/src/a.ts', content: `const k = "${ANT}"\n` })
  const heard: any[] = JSON.parse((await $.command.run({ command: 'hub-heard', args: '' })).text)

  expect(heard.map(card => [card.detail, card.tone, card.isBandOnly])).toEqual([['secret in src/a.ts is waiting', 'warn', true], ['', 'idle', true]])
  expect(heard[0]).toMatchObject({ pane: 'secret-guard', title: 'Secret Guard', icon: 'key', section: 'safety' })
})
