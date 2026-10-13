import { test } from 'claude-code/testing'

import { english, start } from './setup'

// The previews draw the English card, as the film shows it.

// Built from pieces so this file never holds a literal that a scanner would take for a real key.
const ANT = ['sk', 'ant', 'api03', 'Zx9Qw7Er5Ty3Ui1Op8As6Df4Gh2Jk'].join('-')
const GH = `ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'}`
const STRIPE = `sk_live_${'4eC39HqLyjWDarjtT1zdp7dc'}`

const show = (label: string, tree: unknown) => (globalThis as any).console.log(`@@TREE@@${label}@@${JSON.stringify(tree)}`)

// The dialog at full width, then as narrow as the desktop draws it beside an open pane (8 px a column).
const SIZES = [{ tag: '', columns: 100 }, { tag: '-w520', columns: 65 }, { tag: '-w400', columns: 50 }]

for (const [theme, size] of ['dark', 'light'].flatMap(theme => SIZES.map(size => [theme, size] as const))) {
  const suffix = `${size.tag}${theme === 'light' ? '-light' : ''}`

  test(`preview: a write with two keys (${theme}${size.tag})`, async ($, on) => {
    const setup = { ...english('Cancel', 'desktop'), theme, columns: size.columns }
    await start($, on, setup)
    await ($ as any).tool.call({ tool: 'Write', file_path: '/work/src/lib/supabase.ts', content: `const a = "${ANT}"\n\nconst g = '${GH}'\n` })
    show(`sg-write${suffix}`, setup.trees[0])
  })

  test(`preview: a commit with a key and an env file (${theme}${size.tag})`, async ($, on) => {
    const setup = { ...english('Cancel', 'desktop'), theme, columns: size.columns }
    setup.git['diff --cached -U0 --no-color'] = `+++ b/src/pay.ts\n@@ -0,0 +1 @@\n+const stripe = "${STRIPE}"\n`
    setup.git['diff --cached --name-only'] = 'src/pay.ts\n.env.production\n'
    await start($, on, setup)
    await ($ as any).tool.call({ tool: 'Bash', command: 'git commit -m "payment"' })
    show(`sg-commit${suffix}`, setup.trees[0])
  })

  test(`preview: git add of an env file only (${theme}${size.tag})`, async ($, on) => {
    const setup = { ...english('Cancel', 'desktop'), theme, columns: size.columns }
    setup.git['add -n .'] = "add 'src/a.ts'\nadd '.env.local'\n"
    setup.files['/work/src/a.ts'] = 'export const x = 1\n'
    await start($, on, setup)
    await ($ as any).tool.call({ tool: 'Bash', command: 'git add .' })
    show(`sg-env${suffix}`, setup.trees[0])
  })
}

test('preview: terminal text card', async ($, on) => {
  const setup = english('Cancel')
  await start($, on, setup)
  await ($ as any).tool.call({ tool: 'Write', file_path: '/work/src/lib/supabase.ts', content: `const a = "${ANT}"\n\nconst g = '${GH}'\n` })
  show('sg-terminal', setup.trees[0])
})

test('preview: terminal commit with an env file', async ($, on) => {
  const setup = english('Cancel')
  setup.git['diff --cached -U0 --no-color'] = `+++ b/src/pay.ts\n@@ -0,0 +1 @@\n+const stripe = "${STRIPE}"\n`
  setup.git['diff --cached --name-only'] = 'src/pay.ts\n.env.production\n'
  await start($, on, setup)
  await ($ as any).tool.call({ tool: 'Bash', command: 'git commit -m "payment"' })
  show('sg-terminal-commit', setup.trees[0])
})

// Recording mode over a Bash result a skin drew beneath it: every key, env value and e-mail address masked.
const MAIL = ['ada.lovelace', 'example.org'].join('@')
const RESULT_LINES = [`ANTHROPIC_API_KEY=${ANT}`, 'DATABASE_URL=postgres://app:hunter22@db.internal/app', `GITHUB_TOKEN=${GH}`, `git config user.email ${MAIL}`]
const resultTree = {
  type: 'Box', props: { flexDirection: 'column' }, children: [
    { type: 'Text', props: { bold: true }, children: ['Bash(cat .env.local && git config user.email)'] },
    { type: 'Box', props: { flexDirection: 'column', paddingLeft: 2 }, children: RESULT_LINES.map(line => ({ type: 'Text', props: { dimColor: true }, children: [line] })) },
  ],
}

for (const [surface, theme] of (['terminal', 'desktop'] as const).flatMap(surface => ['dark', 'light'].map(theme => [surface, theme] as const))) {
  test(`preview: a masked tool result in recording mode (${surface}, ${theme})`, async ($, on) => {
    const setup = { ...english('Cancel', surface), theme, drawn: resultTree }
    await start($, on, setup)
    await ($ as any).command.run({ command: 'rec', args: '' })
    const output = { stdout: RESULT_LINES.join('\n'), stderr: '', interrupted: false, isImage: false }
    const ui = await $.ui.mount({ plugin: 'secret-guard', component: 'ToolResult', requestId: 'toolu_1', surface, viewport: { columns: 100, rows: 40 }, props: { tool_use_id: 'toolu_1', tool: 'Bash', isErrored: false, output } })
    show(`sg-rec-${surface}${theme === 'light' ? '-light' : ''}`, await ui.drawn())
  })
}
