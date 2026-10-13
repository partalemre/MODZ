import { expect, mock, test } from 'claude-code/testing'

import { TOKEN_NOTE } from '../hooks/placeholders'
import { WORDS } from '../hooks/words'
import { english, fresh, start } from './setup'
import type { Setup } from './setup'

// A key pasted into a prompt: the model reads a placeholder, Bash gets the real value, output hides it again.

// Built from pieces so this file never holds a literal that a scanner would take for a real key.
const ANT = ['sk', 'ant', 'api03', 'Zx9Qw7Er5Ty3Ui1Op8As6Df4Gh2Jk'].join('-')
const GH = `ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'}`
const ONE = '⟦secret:1⟧'
const TWO = '⟦secret:2⟧'
// What the engine composes a system prompt from.
const FACTS = { model: 'claude-opus-5-5', promptModel: 'claude-opus-5-5', surfaces: ['terminal'], tools: ['Bash'], outputStyle: null, traits: [] }

// What the model would read: the prompt as it reached the engine beneath the mod.
function promptsOf(on: any, setup: Setup & { prompts?: string[] }): string[] {
  const prompts: string[] = []
  on('prompt.submit', (_: any, e: any) => {
    prompts.push(e.text)

    return { text: e.text }
  })
  on('prompt.compose', () => ({ sections: [{ id: 'intro', text: 'You are Claude.', scope: 'shared' }] }))
  setup.prompts = prompts

  return prompts
}

const toolRow = (text: string) => ({
  door: 'tool-result', uuid: 'row-1', origin: { kind: 'tool', tool: 'Bash' },
  message: { type: 'user', role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_1', content: text }] },
})

test('round trip: the model sees a placeholder, Bash gets the value, the echo is hidden again', async ($, on) => {
  const setup = english('Cancel')
  const prompts = promptsOf(on, setup)
  const rows = mock.session(on)
  await start($, on, setup)

  await ($ as any).prompt.submit({ text: `call the API with ${ANT} please` })
  expect(prompts[0]).toBe(`call the API with ${ONE} please`)
  expect(setup.statuses.at(-1)).toBe('1 secret kept out of the chat')

  const sections = (await ($ as any).prompt.compose(FACTS)).sections
  expect(sections.at(-1)).toMatchObject({ id: 'secret-guard:placeholders', scope: 'session' })
  expect(sections.at(-1).text).toContain('⟦secret:N⟧')

  await ($ as any).tool.call({ tool: 'Bash', command: `curl -H "x-api-key: ${ONE}" https://api.example.test` })
  expect(setup.ran[0]?.command).toBe(`curl -H "x-api-key: ${ANT}" https://api.example.test`)

  await ($ as any).session.append(toolRow(`sent key ${ANT}\n`))
  const stored = JSON.stringify(rows.appended().at(-1)?.message.content)
  expect(stored).toContain(`sent key ${ONE}`)
  expect(stored).not.toContain(ANT)
})

test('the same value keeps its placeholder; a new one gets the next', async ($, on) => {
  const setup = english('Cancel')
  const prompts = promptsOf(on, setup)
  await start($, on, setup)

  await ($ as any).prompt.submit({ text: `first ${ANT}` })
  await ($ as any).prompt.submit({ text: `again ${ANT} and ${GH}` })

  expect(prompts).toEqual([`first ${ONE}`, `again ${ONE} and ${TWO}`])
  expect(setup.statuses.at(-1)).toBe('2 secrets kept out of the chat')
})

test('a prompt without secrets is left alone and adds no system prompt note', async ($, on) => {
  const setup = english('Cancel')
  const prompts = promptsOf(on, setup)
  await start($, on, setup)

  await ($ as any).prompt.submit({ text: 'list the files' })
  const sections = (await ($ as any).prompt.compose(FACTS)).sections

  expect(prompts).toEqual(['list the files'])
  expect(sections.map((section: any) => section.id)).toEqual(['intro'])
  expect(setup.statuses.filter(line => line !== undefined)).toEqual([])
})

test('Allow once writes the file with the placeholder, never the value, and tells Claude', async ($, on) => {
  const setup = english('Allow once')
  promptsOf(on, setup)
  await start($, on, setup)
  await ($ as any).prompt.submit({ text: `key: ${ANT}` })

  const ran: any = await ($ as any).tool.call({ tool: 'Write', file_path: '/work/src/a.ts', content: `const k = "${ONE}"\n` })

  expect(setup.ran[0]?.content).toBe(`const k = "${ONE}"\n`)
  expect(ran.context).toContain(TOKEN_NOTE)
  // The card names the placeholder itself, not the first characters of the value.
  expect(JSON.stringify(setup.trees[0])).toContain(ONE)
  expect(JSON.stringify(setup.trees[0])).not.toContain(ANT.slice(0, 4) + '****')
})

test('Move keys to .env puts the value in .env and the file reads the environment', async ($, on) => {
  const setup = english(WORDS.en.move(1))
  setup.files['/work/.git'] = ''
  promptsOf(on, setup)
  await start($, on, setup)
  await ($ as any).prompt.submit({ text: `key: ${ANT}` })

  await ($ as any).tool.call({ tool: 'Write', file_path: '/work/src/a.ts', content: `const k = "${ONE}"\n` })

  expect(setup.files['/work/.env']).toBe(`ANTHROPIC_API_KEY=${ANT}\n`)
  expect(setup.ran[0]?.content).toBe('const k = process.env.ANTHROPIC_API_KEY\n')
})

test('a .env write keeps the placeholder too, with the note, and nobody is asked', async ($, on) => {
  const setup = english('Cancel')
  promptsOf(on, setup)
  await start($, on, setup)
  await ($ as any).prompt.submit({ text: `key: ${ANT}` })

  const ran: any = await ($ as any).tool.call({ tool: 'Write', file_path: '/work/.env', content: `ANTHROPIC_API_KEY=${ONE}\n` })

  expect(setup.ran[0]?.content).toBe(`ANTHROPIC_API_KEY=${ONE}\n`)
  expect(ran.context).toContain(TOKEN_NOTE)
  expect(setup.asked.filter(line => !line.startsWith('LOG'))).toEqual([])
})

// $.state holds only booleans and the card's masked rows by its contract (types/index.d.ts).
test('the value is never stored, written, logged or shown', async ($, on) => {
  const setup = fresh('Vazgeç')
  promptsOf(on, setup)
  await start($, on, setup)

  await ($ as any).prompt.submit({ text: `key: ${ANT}` })
  await ($ as any).tool.call({ tool: 'Bash', command: `echo ${ONE}` })

  expect(setup.statuses.at(-1)).toBe('1 sır sohbetin dışında tutuldu')
  for (const kept of [setup.files, setup.stored, setup.asked, setup.statuses, setup.trees]) expect(JSON.stringify(kept)).not.toContain(ANT)
})

test('a placeholder this session does not hold stops the command', async ($, on) => {
  const setup = english('Cancel')
  await start($, on, setup)

  const denied: any = await ($ as any).tool.call({ tool: 'Bash', command: `echo ${TWO}` })

  expect(denied.deny).toMatch(/no longer holds ⟦secret:2⟧/)
  expect(setup.ran).toHaveLength(0)
})

test('/clear forgets the values and clears the line', async ($, on) => {
  const setup = english('Cancel')
  promptsOf(on, setup)
  on('session.end', (_: any, e: any) => ({ sessionId: e.sessionId }))
  await start($, on, setup)
  await ($ as any).prompt.submit({ text: `key: ${ANT}` })

  await ($ as any).session.end({ reason: 'clear', sessionId: 's', resume: { id: 's' } })
  const denied: any = await ($ as any).tool.call({ tool: 'Bash', command: `echo ${ONE}` })

  expect(denied.deny).toMatch(/no longer holds/)
  expect(setup.statuses.at(-1)).toBeUndefined()
})

test('with the scan off, prompts pass as typed', async ($, on) => {
  const setup = english('Cancel')
  const prompts = promptsOf(on, setup)
  await start($, on, setup)

  await ($ as any).command.run({ command: 'secret-guard', args: '' })
  await ($ as any).prompt.submit({ text: `key: ${ANT}` })

  expect(prompts).toEqual([`key: ${ANT}`])
})
