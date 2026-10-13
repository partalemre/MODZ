import { expect, test } from 'claude-code/testing'

import { maskText, maskTree } from '../hooks/mask'
import { english, fresh, start } from './setup'

// Recording mode: /rec masks keys, env values and e-mail addresses on screen, never in the transcript.

// Built from pieces so this file never holds a literal that a scanner would take for a real key.
const ANT = ['sk', 'ant', 'api03', 'Zx9Qw7Er5Ty3Ui1Op8As6Df4Gh2Jk'].join('-')
const MAIL = ['ada.lovelace', 'example.org'].join('@')
const STDOUT = `DATABASE_URL=postgres://u:p@db/x\nkey ${ANT}\nmail ${MAIL}\n`

const bashResult = (stdout: string) => ({ tool_use_id: 'toolu_1', tool: 'Bash', isErrored: false, output: { stdout, stderr: '', interrupted: false, isImage: false } })

async function mountResult($: any, surface: 'terminal' | 'desktop') {
  return $.ui.mount({ plugin: 'secret-guard', component: 'ToolResult', requestId: 'toolu_1', surface, viewport: { columns: 100, rows: 40 }, props: bashResult(STDOUT) })
}

test('masking keeps at most the last two characters of a key, env value or e-mail address', () => {
  expect(maskText(`key ${ANT}`)).toBe('key ●●●●Jk')
  expect(maskText('export API_TOKEN="abc"')).toBe('export API_TOKEN="●●●●"')
  expect(maskText(`write to ${MAIL} today`)).toBe('write to ●●●●rg today')
  expect(maskText('placeholder ⟦secret:1⟧ and plain words')).toBe('placeholder ⟦secret:1⟧ and plain words')
  expect(maskText('the value p4ssw0rd-long is known', ['p4ssw0rd-long'])).toBe('the value ●●●●ng is known')
})

test('a nested tree has every string masked, its shape and engine nodes kept', () => {
  const tree = { type: 'Box', props: { flexDirection: 'column' }, children: [
    { type: 'Text', children: [`token ${ANT}`] },
    { type: 'Box', children: [{ type: 'Text', props: { dimColor: true }, children: ['by ', MAIL] }, { type: 'engine', ref: 2 }] },
    { type: 'Markdown', props: { text: `API_KEY=${ANT}` } },
  ] }

  const masked: any = maskTree(tree, [])

  expect(masked.children[0].children).toEqual(['token ●●●●Jk'])
  expect(masked.children[1].children[0]).toEqual({ type: 'Text', props: { dimColor: true }, children: ['by ', '●●●●rg'] })
  expect(masked.children[1].children[1]).toEqual({ type: 'engine', ref: 2 })
  expect(masked.children[2].props.text).toBe('API_KEY=●●●●Jk')
  expect(JSON.stringify(masked)).not.toContain(ANT)
  const plain = { type: 'Text', children: ['nothing to hide'] }
  expect(maskTree(plain, [])).toBe(plain)
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`/rec toggles, says REC under the prompt, and masks a tool result (${surface})`, async ($, on) => {
    const setup = english('Cancel', surface)
    await start($, on, setup)

    const before = await mountResult($, surface)
    expect(setup.dialogs.at(-1)?.output.stdout).toBe(STDOUT)
    await before.unmount()

    expect(await ($ as any).command.run({ command: 'rec', args: '' })).toMatchObject({ text: expect.stringMatching(/^Recording mode on/) })
    expect(setup.statuses.at(-1)).toBe('REC')
    const during = await mountResult($, surface)
    const shown = setup.dialogs.at(-1)?.output.stdout
    expect(shown).toBe('DATABASE_URL=●●●●/x\nkey ●●●●Jk\nmail ●●●●rg\n')
    await during.unmount()

    expect(await ($ as any).command.run({ command: 'rec', args: '' })).toMatchObject({ text: 'Recording mode off' })
    expect(setup.statuses.at(-1)).toBeUndefined()
  })

  test(`recording mode masks a skin's tree beneath it, nested Box and Text (${surface})`, async ($, on) => {
    const setup = { ...english('Cancel', surface), drawn: { type: 'Box', props: { flexDirection: 'column' }, children: [{ type: 'Text', children: [`$ echo ${ANT}`] }, { type: 'Box', children: [{ type: 'Text', children: [`from ${MAIL}`] }] }] } }
    await start($, on, setup)
    await ($ as any).command.run({ command: 'rec', args: '' })

    const ui = await $.ui.mount({ plugin: 'secret-guard', component: 'AssistantMessage', requestId: 'm1', surface, props: { text: `the key is ${ANT}`, isFirstOfReply: true } })
    const drawn = JSON.stringify(await ui.drawn())

    expect(setup.dialogs.at(-1)?.text).toBe('the key is ●●●●Jk')
    expect(drawn).toContain('$ echo ●●●●Jk')
    expect(drawn).toContain('from ●●●●rg')
    expect(drawn).not.toContain(ANT)
    expect(drawn).not.toContain(MAIL)
  })
}

test('a prompt row is masked on screen; its origin is left as it came', async ($, on) => {
  const setup = fresh('Vazgeç')
  await start($, on, setup)
  expect(await ($ as any).command.run({ command: 'rec', args: '' })).toMatchObject({ text: expect.stringMatching(/^Kayıt modu açık/) })

  const origin = { kind: 'composer' }
  await $.ui.mount({ plugin: 'secret-guard', component: 'UserMessage', requestId: 'u1', surface: 'terminal', props: { text: `mail ${MAIL}`, origin, isExpanded: false } as any })

  expect(setup.dialogs.at(-1)?.text).toBe('mail ●●●●rg')
  expect(setup.dialogs.at(-1)?.origin).toEqual(origin)
  expect(setup.statuses.at(-1)).toBe('REC')
})
