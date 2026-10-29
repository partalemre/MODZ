import { expect, test } from 'claude-code/testing'

import { isReadOnly, labelsFor, parseRules, redact, verdictOf } from '../hooks/rules'
import { BUILD_SCAN, EN, SURFACES, mountPane, pass, start, stub, world } from './world'

// House rules: the gray zone put to the judge, with the person's own rules as its instructions.

const RULES_PATH = '/work/demo-app/.claude/house-rules.md'
const RULES = '# House rules\n\n<!-- plain words -->\n- never touch the production database\n* no network calls to *.internal\n'
const WITH_RULES = { ...EN, files: { [RULES_PATH]: RULES } }
const PSQL = 'psql "$PROD_URL" -c "delete from users"'
// Built at run time so no scanner mistakes the fixture for a real key.
const SECRET = ['sk', 'live', '0123456789abcdef0123'].join('_')

function byKey(node: any, key: string): any {
  if (node === null || typeof node !== 'object') return undefined
  if (node.props?.key === key && node.type === 'Button') return node
  for (const child of node.children ?? []) {
    const found = byKey(child, key)
    if (found !== undefined) return found
  }

  return undefined
}

test('rules, the read-only allowlist, the labels, the verdicts and the masking', () => {
  const rules = parseRules(RULES)
  expect(rules).toEqual(['never touch the production database', 'no network calls to *.internal'])
  expect(labelsFor(rules)).toEqual(['allow', 'ask 1', 'block 1', 'ask 2', 'block 2'])
  expect(labelsFor(Array.from({ length: 9 }, (_, i) => `rule ${i}`))).toEqual(['allow', 'ask', 'block'])
  expect(verdictOf('block 2', rules)).toEqual({ kind: 'block', rule: 'no network calls to *.internal' })
  expect(verdictOf('ask', rules)).toEqual({ kind: 'ask', rule: null })
  expect(verdictOf('maybe', rules)).toBeNull()
  for (const command of ['ls -la', 'git status && git diff HEAD | head -5', 'rg TODO src']) expect(isReadOnly(command)).toBe(true)
  for (const command of ['echo x > out', 'git diff --output=x', 'ls; npm publish', 'cat $(which x)', 'lsof -i', 'curl api.internal']) expect(isReadOnly(command)).toBe(false)
  expect(redact(`API_KEY=${SECRET} curl -H "Authorization: Bearer abc.def" https://me:pw@host --token ${SECRET} OUT=dist`))
    .toBe('API_KEY=**** curl -H "Authorization: Bearer ****" https://me:****@host --token **** OUT=dist')
})

test('with no rules file nothing is judged', async ($, on) => {
  const w = world({ ...EN })
  stub(on, w)
  await start($, w)
  const result: any = await ($ as any).tool.call({ tool: 'Bash', command: PSQL })

  expect(result.deny).toBeUndefined()
  expect(w.asked).toHaveLength(0)
})

test('plain reads and blast-radius\'s own risky commands are never judged', async ($, on) => {
  const w = world({ ...WITH_RULES, answers: { files: BUILD_SCAN } })
  stub(on, w)
  await start($, w)
  await ($ as any).tool.call({ tool: 'Bash', command: 'git status && ls -la | grep src' })
  const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await pass(w, 0)
  const ui = await mountPane($, 'desktop')
  expect(JSON.stringify(await ui.drawn())).toContain('This would delete 9 files')
  await ui.press({ key: 'cancel' })
  await pass(w)
  await call

  expect(w.asked).toHaveLength(0)
  expect(w.ran).toHaveLength(1)
})

test('allow runs it after one cheap call, kept for the session; another command is asked afresh', async ($, on) => {
  const w = world({ ...WITH_RULES })
  stub(on, w)
  await start($, w)
  for (const command of ['npm test', 'npm test']) expect(((await ($ as any).tool.call({ tool: 'Bash', command })) as any).deny).toBeUndefined()
  expect(w.asked).toHaveLength(1)
  expect(w.asked[0]).toMatchObject({ model: 'haiku', effort: 'low' })
  expect(w.asked[0].system).toContain('1. never touch the production database')
  expect(w.asked[0].prompt).toContain('npm test')
  await ($ as any).tool.call({ tool: 'Bash', command: 'npm run build' })

  expect(w.asked).toHaveLength(2)
  expect(w.ran).toHaveLength(3)
})

test('block refuses it with the rule it breaks', async ($, on) => {
  const w = world({ ...WITH_RULES, reply: 'block 1' })
  stub(on, w)
  await start($, w)
  const result: any = await ($ as any).tool.call({ tool: 'Bash', command: PSQL })

  expect(result.deny).toMatch(/blocked this command.*never touch the production database/)
  expect(w.ran).toHaveLength(0)
  expect(w.opened).toHaveLength(0)
})

for (const surface of SURFACES) {
  test(`ask holds it on the card with the rule; Keep my work has the focus (${surface})`, async ($, on) => {
    const w = world({ ...WITH_RULES, reply: 'ask 2' })
    stub(on, w)
    await start($, w, surface)
    const command = 'curl https://billing.internal/v1/charges'
    const call = ($ as any).tool.call({ tool: 'Bash', command })
    await pass(w, 0)
    const ui = await mountPane($, surface)
    const tree = await ui.drawn()
    const drawn = JSON.stringify(tree)
    for (const text of ['Held · Blast Radius', command, 'House rule: no network calls to *.internal', 'Run anyway', 'Keep my work']) expect(drawn).toContain(text)
    expect(byKey(tree, 'cancel')?.props?.autoFocus).toBe(true)
    await ui.press({ key: 'cancel' })
    await pass(w)
    expect(((await call) as any).deny).toMatch(/Keep my work.*House rule: no network calls/)

    const again = ($ as any).tool.call({ tool: 'Bash', command })
    await pass(w, 0)
    await ui.press({ key: 'run' })
    await pass(w)
    expect(((await again) as any).deny).toBeUndefined()
    expect(w.ran).toHaveLength(1)
    expect(w.asked).toHaveLength(1)
  })
}

test('a judge that fails or answers off the list lets the command run', async ($, on) => {
  const w = world({ ...WITH_RULES, reply: 'throw' })
  stub(on, w)
  await start($, w)
  expect(((await ($ as any).tool.call({ tool: 'Bash', command: PSQL })) as any).deny).toBeUndefined()
  w.reply = 'probably fine'
  expect(((await ($ as any).tool.call({ tool: 'Bash', command: PSQL })) as any).deny).toBeUndefined()

  expect(w.asked).toHaveLength(2)
  expect(w.ran).toHaveLength(2)
  expect(w.logs.filter(line => line.includes('no verdict'))).toHaveLength(2)
})

test('an unnamed rule says house rules; with nobody to ask, ask refuses', async ($, on) => {
  // Past eight rules the judge answers by kind alone.
  const many = Array.from({ length: 9 }, (_, i) => `- rule ${i + 1}`).join('\n')
  const w = world({ ...EN, files: { [RULES_PATH]: many }, reply: 'ask', surfaces: [] })
  stub(on, w)
  await start($, w)
  const result: any = await ($ as any).tool.call({ tool: 'Bash', command: PSQL })

  expect(result.deny).toMatch(/a house rule \(house rules\) asks the user first, and nobody is here/)
  expect(w.opened).toHaveLength(0)
})

test('Jev, when opted in, gets the masked command and the model is not asked', async ($, on) => {
  const w = world({ ...WITH_RULES, env: { MODZ_JUDGE: 'jev', TYPESAFE_API_KEY: 'ts-test-key' }, jevChoice: 'block 1' })
  stub(on, w)
  await start($, w)
  const result: any = await ($ as any).tool.call({ tool: 'Bash', command: `DB_PASSWORD=${SECRET} psql -c "drop table users"` })

  expect(result.deny).toMatch(/never touch the production database/)
  expect(w.asked).toHaveLength(0)
  expect(w.fetched).toHaveLength(1)
  expect(w.fetched[0].url).toBe('https://api.typesafe.ai/v1/systemone')
  expect(w.fetched[0].init.body).toContain('DB_PASSWORD=****')
  expect(w.fetched[0].init.body).not.toContain(SECRET)
})
