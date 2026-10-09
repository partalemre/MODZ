import { test } from 'claude-code/testing'

import { fresh, start } from './setup'

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
    const setup = { ...fresh('Vazgeç', 'desktop'), theme, columns: size.columns }
    await start($, on, setup)
    await ($ as any).tool.call({ tool: 'Write', file_path: '/work/src/lib/supabase.ts', content: `const a = "${ANT}"\n\nconst g = '${GH}'\n` })
    show(`sg-write${suffix}`, setup.trees[0])
  })

  test(`preview: a commit with a key and an env file (${theme}${size.tag})`, async ($, on) => {
    const setup = { ...fresh('Vazgeç', 'desktop'), theme, columns: size.columns }
    setup.git['diff --cached -U0 --no-color'] = `+++ b/src/pay.ts\n@@ -0,0 +1 @@\n+const stripe = "${STRIPE}"\n`
    setup.git['diff --cached --name-only'] = 'src/pay.ts\n.env.production\n'
    await start($, on, setup)
    await ($ as any).tool.call({ tool: 'Bash', command: 'git commit -m "ödeme"' })
    show(`sg-commit${suffix}`, setup.trees[0])
  })
}

test('preview: terminal text card', async ($, on) => {
  const setup = fresh('Vazgeç')
  await start($, on, setup)
  await ($ as any).tool.call({ tool: 'Write', file_path: '/work/src/lib/supabase.ts', content: `const a = "${ANT}"\n\nconst g = '${GH}'\n` })
  show('sg-terminal', setup.trees[0])
})
