import { expect, test } from 'claude-code/testing'

import { ALLOW, CANCEL, QUESTION, moveLabel } from '../hooks/card'
import { findSecrets, mask } from '../hooks/detect'
import { addedByFile, dryRunPaths, gitSteps, isEnvFile } from '../hooks/git'
import { fresh, start } from './setup'
import { appendText, envLines, hasEnvIgnore, parseEnv, planEntries, rewrite } from '../hooks/move'

// Built from pieces so this file never holds a literal that a scanner would take for a real key.
const ANT = ['sk', 'ant', 'api03', 'Zx9Qw7Er5Ty3Ui1Op8As6Df4Gh2Jk'].join('-')
const GH = `ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'}`
const AWS_ID = `AKIA${'Z7Q2W8E4R6T1Y3U5'}`
const STRIPE = `sk_live_${'4eC39HqLyjWDarjtT1zdp7dc'}`
const PASSWORD = 'Hq7#kd92LmX0pz'

function jwt(role: string): string {
  const encode = (text: string) => btoa(text).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${encode('{"alg":"HS256","typ":"JWT"}')}.${encode(`{"iss":"supabase","role":"${role}","exp":1999999999}`)}.c2lnbmF0dXJlLXZhbHVlLWhlcmU`
}

test('known key shapes are found and masked to four characters', () => {
  const text = `const a = "${ANT}"\nconst b = '${GH}'\nAWS=${AWS_ID}\nstripe: ${STRIPE}\n-----BEGIN RSA PRIVATE KEY-----\n`
  const kinds = findSecrets(text).map(secret => secret.kind)

  expect(kinds).toEqual(expect.arrayContaining(['anthropic', 'github', 'aws-id', 'stripe', 'private-key']))
  expect(mask(ANT)).toBe('sk-a****')
  expect(findSecrets(text).find(secret => secret.kind === 'github')?.line).toBe(2)
})

test('a Supabase service_role JWT is flagged, an anon one is not', () => {
  expect(findSecrets(`key = "${jwt('service_role')}"`).map(secret => secret.kind)).toContain('supabase')
  expect(findSecrets(`key = "${jwt('anon')}"`).map(secret => secret.kind)).not.toContain('supabase')
})

test('high-entropy *KEY/*SECRET/*TOKEN/*PASSWORD values count, placeholders and env reads do not', () => {
  expect(findSecrets(`DB_PASSWORD = "${PASSWORD}"`).map(secret => secret.envName)).toEqual(['DB_PASSWORD'])
  expect(findSecrets('apiKey: "9f8e7d6c5b4a3f2e1d0c"')[0]?.envName).toBe('API_KEY')
  expect(findSecrets('API_KEY = process.env.API_KEY')).toEqual([])
  expect(findSecrets('API_KEY="your-api-key-here"')).toEqual([])
  expect(findSecrets('SECRET_TOKEN = config.auth.secretToken')).toEqual([])
  expect(findSecrets('PASSWORD = "aaaaaaaaaaaaaaaa"')).toEqual([])
})

test('setting keys and fake values in test files are not secrets', () => {
  expect(findSecrets(`const THRESHOLD_KEY = 'done-ping.thresholdSeconds'`)).toEqual([])
  expect(findSecrets(`const STORE_KEY = 'terminal-browser.enabled'`)).toEqual([])
  const fake = 'apiKey: "9f8e7d6c5b4a3f2e1d0c"'
  expect(findSecrets(fake, 'tests/guard.test.ts')).toEqual([])
  expect(findSecrets(fake, 'src/client.ts')).toHaveLength(1)
})

test('git commands are read for add and commit steps', () => {
  expect(gitSteps('cd x && git add . && git commit -am "wip"')).toEqual([
    { kind: 'add', cwd: null, args: ['.'] },
    { kind: 'commit', cwd: null, isAll: true },
  ])
  expect(gitSteps('git -C app add src/a.ts')).toEqual([{ kind: 'add', cwd: 'app', args: ['src/a.ts'] }])
  expect(gitSteps('git status; npm test')).toEqual([])
  expect(isEnvFile('.env')).toBe(true)
  expect(isEnvFile('config/.env.local')).toBe(true)
  expect(isEnvFile('.env.example')).toBe(false)
  expect(dryRunPaths("add 'a.ts'\nadd '.env'\n")).toEqual(['a.ts', '.env'])
  expect([...addedByFile('+++ b/a.ts\n@@ -0,0 +1 @@\n+x = 1\n').entries()]).toEqual([['a.ts', 'x = 1\n']])
})

test('moving to .env reuses equal values, suffixes taken names, rewrites code to env reads', () => {
  const secrets = findSecrets(`const key = "${ANT}"`)
  const fresh = planEntries(secrets, parseEnv('OTHER=1\nANTHROPIC_API_KEY=different\n'))
  expect(fresh).toEqual([{ name: 'ANTHROPIC_API_KEY_2', value: ANT, isNew: true }])
  expect(envLines(fresh)).toBe(`ANTHROPIC_API_KEY_2=${ANT}\n`)
  expect(planEntries(secrets, parseEnv(`ANTHROPIC_API_KEY="${ANT}"`))[0]?.isNew).toBe(false)

  expect(rewrite(`const key = "${ANT}"`, { path: 'a.ts', entries: fresh })).toBe('const key = process.env.ANTHROPIC_API_KEY_2')
  expect(rewrite(`key = '${ANT}'`, { path: 'a.py', entries: fresh })).toBe('key = os.environ["ANTHROPIC_API_KEY_2"]')
  expect(rewrite(`key: ${ANT}`, { path: 'a.yml', entries: fresh })).toBe('key: ${ANTHROPIC_API_KEY_2}')
  expect(appendText('A=1', 'B=2\n')).toBe('A=1\nB=2\n')
  expect(hasEnvIgnore('node_modules\n.env*\n')).toBe(true)
  expect(hasEnvIgnore('node_modules\n')).toBe(false)
})

test('terminal: the text card, eyebrow and file, the headline, masked values in columns', async ($, on) => {
  const setup = fresh(CANCEL)
  await start($, on, setup)

  await ($ as any).tool.call({ tool: 'Write', file_path: '/work/src/lib/supabase.ts', content: `const a = "${ANT}"\n\nconst g = '${GH}'\n` })

  expect(setup.asked).toEqual([QUESTION])
  expect(setup.cards[0]).toEqual([
    '● SIZINTI ENGELLENDİ · src/lib/supabase.ts',
    'Bu yazımda 2 gizli anahtar var',
    '  Anthropic API key  sk-a****  satır 1',
    '  GitHub token       ghp_****  satır 3',
  ])
  expect(setup.cards.flat().join('\n')).not.toContain(ANT)
})

test('desktop: one vector card in a single border, the safe fix first with a line under each answer', async ($, on) => {
  const setup = fresh(CANCEL, 'desktop')
  await start($, on, setup)

  await ($ as any).tool.call({ tool: 'Write', file_path: '/work/src/lib/supabase.ts', content: `const a = "${ANT}"\n\nconst g = '${GH}'\n` })

  const card = setup.trees[0]?.children?.[0]
  const svg = card?.children?.[0]
  expect(card?.props).toMatchObject({ borderStyle: 'single' })
  expect(svg?.type).toBe('Svg')
  expect(svg?.props.alt).toBe('Bu yazımda 2 gizli anahtar var: Anthropic src/lib/supabase.ts:1 sk-a****; GitHub src/lib/supabase.ts:3 ghp_****')
  expect(svg?.props.source).toContain('SIZINTI ENGELLENDİ')
  // The header names the file, so each row says only its line.
  expect(svg?.props.source).toContain('satır 3')
  expect(svg?.props.source).not.toContain('supabase.ts:3')
  expect(JSON.stringify(setup.trees)).not.toContain(ANT)
  const options = setup.dialogs.at(-1)?.questions?.[0]?.options
  expect(options?.map((option: any) => option.label)).toEqual([moveLabel(2), ALLOW, CANCEL])
  expect(options?.[0]?.description).toMatch(/^Önerilen/)
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`git add of .env is blocked even when nothing else is found (${surface})`, async ($, on) => {
    const setup = fresh(CANCEL, surface)
    setup.git['add -n .'] = "add 'src/a.ts'\nadd '.env.local'\n"
    setup.files['/work/src/a.ts'] = 'export const x = 1\n'
    await start($, on, setup)

    const denied: any = await ($ as any).tool.call({ tool: 'Bash', command: 'git add .' })

    if (surface === 'terminal') expect(setup.cards[0]).toEqual(['● ORTAM DOSYASI · git add .', ".env.local git'e ekleniyor", '  ortam dosyası  .env.local'])
    else expect(JSON.stringify(setup.trees[0])).toContain(".env.local git'e ekleniyor")
    expect(denied.deny).toMatch(/blocked/)
  })
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`a Write with a key asks with the masked value only, and Cancel denies (${surface})`, async ($, on) => {
    const setup = fresh(CANCEL, surface)
    await start($, on, setup)

    const denied: any = await ($ as any).tool.call({ tool: 'Write', file_path: '/work/a.ts', content: `const k = "${ANT}"` })

    expect(denied.deny).toMatch(/blocked/)
    expect(denied.deny).toContain('sk-a****')
    expect(JSON.stringify(setup.trees[0])).toContain('sk-a****')
    expect(JSON.stringify(setup.trees[0])).not.toContain(ANT)
    expect(denied.deny).not.toContain(ANT)
    expect(setup.ran).toHaveLength(0)
  })

  test(`the card shows five findings and counts the rest (${surface})`, async ($, on) => {
    const setup = fresh(CANCEL, surface)
    await start($, on, setup)
    const content = Array.from({ length: 7 }, (_, i) => `const API${i}_KEY = "9f8e7d6c5b4a3f2e1d0c${i}q"`).join('\n')

    await ($ as any).tool.call({ tool: 'Write', file_path: '/work/conf.ts', content })

    if (surface === 'desktop') {
      expect(setup.trees[0]?.children?.[0]?.children?.[0]?.props.source).toContain('+2 bulgu daha')
    } else {
      expect(setup.cards[0]?.[1]).toBe('Bu yazımda 7 gizli anahtar var')
      expect(setup.cards[0]).toHaveLength(8)
      expect(setup.cards[0]?.[7]).toBe('  +2 daha')
    }
  })

  test(`git commit scans the staged diff; Move to .env tells Claude to move them (${surface})`, async ($, on) => {
    const setup = fresh(moveLabel(1), surface)
    setup.git['diff --cached -U0 --no-color'] = `+++ b/src/pay.ts\n@@ -0,0 +1 @@\n+const stripe = "${STRIPE}"\n`
    await start($, on, setup)

    const denied: any = await ($ as any).tool.call({ tool: 'Bash', command: 'git commit -m "pay"' })

    if (surface === 'terminal') {
      expect(setup.cards[0]?.[0]).toBe('● SIZINTI ENGELLENDİ · git commit -m "pay"')
      expect(setup.cards[0]?.[2]).toBe('  Stripe live key  sk_l****  src/pay.ts')
    } else {
      expect(setup.trees[0]?.children?.[0]?.children?.[0]?.props.alt).toBe("Bu commit'te 1 gizli anahtar var: Stripe src/pay.ts sk_l****")
    }
    expect(denied.deny).toMatch(/Move each secret/)
    expect(denied.deny).not.toContain(STRIPE)
  })
}

test('Allow once runs the call unchanged', async ($, on) => {
  const setup = fresh(ALLOW)
  await start($, on, setup)

  await ($ as any).tool.call({ tool: 'Edit', file_path: '/work/a.ts', old_string: 'x', new_string: `k = "${GH}"` })

  expect(setup.ran[0]?.new_string).toContain(GH)
})

test('Move to .env writes .env, ignores it in git and rewrites the call', async ($, on) => {
  const setup = fresh(moveLabel(1))
  setup.files['/work/.git'] = ''
  setup.files['/work/.gitignore'] = 'node_modules\n'
  await start($, on, setup)

  const ran: any = await ($ as any).tool.call({ tool: 'Write', file_path: '/work/src/a.ts', content: `const k = "${ANT}"\n` })

  expect(setup.files['/work/.env']).toBe(`ANTHROPIC_API_KEY=${ANT}\n`)
  expect(setup.files['/work/.gitignore']).toBe('node_modules\n.env\n')
  expect(setup.ran[0]?.content).toBe('const k = process.env.ANTHROPIC_API_KEY\n')
  expect(ran.context?.[0]).toContain('ANTHROPIC_API_KEY')
})

test('writing the .env file itself and clean code never ask', async ($, on) => {
  const setup = fresh(CANCEL)
  await start($, on, setup)

  await ($ as any).tool.call({ tool: 'Write', file_path: '/work/.env', content: `ANTHROPIC_API_KEY=${ANT}` })
  await ($ as any).tool.call({ tool: 'Write', file_path: '/work/a.ts', content: 'export const x = 1' })

  expect(setup.asked.filter(line => !line.startsWith('LOG'))).toEqual([])
  expect(setup.ran).toHaveLength(2)
})

test('/secret-guard turns the scan off', async ($, on) => {
  const setup = fresh(CANCEL)
  await start($, on, setup)

  expect(await ($ as any).command.run({ command: 'secret-guard', args: '' })).toMatchObject({ text: 'secret-guard kapalı' })
  await ($ as any).tool.call({ tool: 'Write', file_path: '/work/a.ts', content: `k = "${ANT}"` })

  expect(setup.ran).toHaveLength(1)
})
