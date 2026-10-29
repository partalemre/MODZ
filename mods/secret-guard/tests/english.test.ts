import { expect, test } from 'claude-code/testing'

import { english, start } from './setup'

// With no MODZ_LANG the card and the dialog read in plain English, nothing only Turkish has.

// Built from pieces so this file never holds a literal that a scanner would take for a real key.
const ANT = ['sk', 'ant', 'api03', 'Zx9Qw7Er5Ty3Ui1Op8As6Df4Gh2Jk'].join('-')
const GH = `ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'}`
const TURKISH_ONLY = /[çğıöşüİ]/i
const WRITE = { tool: 'Write', file_path: '/work/src/lib/supabase.ts', content: `const a = "${ANT}"\n\nconst g = '${GH}'\n` }

for (const surface of ['terminal', 'desktop'] as const) {
  test(`a write with two keys asks in English and Cancel blocks it (${surface})`, async ($, on) => {
    const setup = english('Cancel', surface)
    await start($, on, setup)

    const denied: any = await ($ as any).tool.call(WRITE)
    const drawn = JSON.stringify(setup.trees[0])
    const options = setup.dialogs.at(-1)?.questions?.[0]?.options

    expect(setup.asked).toEqual(['How do you want to go on?'])
    for (const text of ['Leak blocked', 'This write has 2 secret keys', 'line 3']) expect(drawn).toContain(text)
    expect(TURKISH_ONLY.test(drawn)).toBe(false)
    expect(options?.map((option: any) => option.label)).toEqual(['Move keys to .env', 'Allow once', 'Cancel'])
    expect(options?.[0]?.description).toMatch(/^Recommended/)
    expect(denied.deny).toMatch(/blocked/)
    expect(setup.ran).toHaveLength(0)
  })

  test(`git add of an env file says it is being added to git (${surface})`, async ($, on) => {
    const setup = english('Cancel', surface)
    setup.git['add -n .'] = "add 'src/a.ts'\nadd '.env.local'\n"
    setup.files['/work/src/a.ts'] = 'export const x = 1\n'
    await start($, on, setup)

    await ($ as any).tool.call({ tool: 'Bash', command: 'git add .' })
    const drawn = JSON.stringify(setup.trees[0])

    for (const text of ['Env file', '.env.local is being added to git']) expect(drawn).toContain(text)
    if (surface === 'terminal') expect(setup.cards[0]?.[2]).toBe('  env file  .env.local')
    expect(TURKISH_ONLY.test(drawn)).toBe(false)
  })

  test(`more findings than rows are counted in English (${surface})`, async ($, on) => {
    const setup = english('Cancel', surface)
    await start($, on, setup)
    const content = Array.from({ length: 7 }, (_, i) => `const API${i}_KEY = "9f8e7d6c5b4a3f2e1d0c${i}q"`).join('\n')

    await ($ as any).tool.call({ tool: 'Write', file_path: '/work/conf.ts', content })

    expect(JSON.stringify(setup.trees[0])).toContain(surface === 'desktop' ? '+ 2 more findings' : '+ 2 more')
  })
}

test('Allow once runs the call; /secret-guard answers in English', async ($, on) => {
  const setup = english('Allow once')
  await start($, on, setup)

  await ($ as any).tool.call(WRITE)
  expect(setup.ran).toHaveLength(1)
  expect(await ($ as any).command.run({ command: 'secret-guard', args: '' })).toMatchObject({ text: 'secret-guard off' })
})
