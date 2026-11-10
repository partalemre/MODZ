import { expect, test } from 'claude-code/testing'

import { CALL_ID, PR_URL, altOf, groupOf, newGh, openPr, openThePr, setup, sourceOf } from './world'

const MINUTE = 60_000
// The reads of this PR by its link; the start's one look for the branch's PR names none.
const ghViews = (gh: any) => gh.calls.filter((argv: string[]) => argv[2] === 'view' && argv.includes(PR_URL))
const textOf = async (ui: any): Promise<string> => (await ui.findAll({ type: 'Text' })).map((t: any) => t.text).join('\n')
const failingCi = (checkedAt: number) => ({
  number: 7, url: PR_URL, title: 'Add the checkout page', phase: 'failed', checkedAt,
  checks: [{ name: 'build', state: 'pass', link: null }, { name: 'unit tests', state: 'fail', link: null }],
})

test('desktop: only what the app’s own PR pane lacks, the largest changes first', async ($: any, on: any) => {
  const gh = newGh()
  const clock = await setup($, on, { gh })
  await openThePr($, clock)
  const ui = await $.ui.mount(groupOf('desktop'))

  expect(await altOf(ui)).toBe('acme/shop #7 · 2 files +120 −8 · checkout.tsx · a.ts')
  const source = await sourceOf(ui)
  for (const word of ['Checks', 'Review', 'Merge', 'Open']) expect(source).not.toContain(word)
  expect(source.indexOf('checkout.tsx')).toBeLessThan(source.indexOf('>a.ts<'))
  expect(ghViews(gh)[0]).toContain(PR_URL)
})

test('desktop: with nothing the app lacks to show, nothing is drawn', async ($: any, on: any) => {
  const gh = newGh({ hasGh: false })
  const clock = await setup($, on, { gh })
  await openThePr($, clock)
  const ui = await $.ui.mount(groupOf('desktop'))

  expect(await ui.find({ type: 'Svg' })).toBeFalsy()
})

test('a PR is read once: pr-card runs no poller of its own', async ($: any, on: any) => {
  const gh = newGh({ answer: openPr({ statusCheckRollup: [{ name: 'build', status: 'IN_PROGRESS' }] }) })
  const clock = await setup($, on, { gh, surface: 'terminal' })
  await openThePr($, clock)
  await clock.advance(30 * MINUTE)

  expect(ghViews(gh)).toHaveLength(1)
})

test('terminal: the checks come from test-badge’s CI watch when it has read them later', async ($: any, on: any) => {
  const gh = newGh({ answer: openPr({ statusCheckRollup: [{ name: 'build', status: 'IN_PROGRESS' }] }) })
  const ci = { value: null as unknown }
  const clock = await setup($, on, { gh, surface: 'terminal', ci })
  await openThePr($, clock)
  ci.value = failingCi(clock.now() + MINUTE)
  const text = await textOf(await $.ui.mount(groupOf('terminal')))

  expect(text).toContain('Checks: 1 failed')
  expect(text).toContain('Failing: unit tests')
  expect(ghViews(gh)).toHaveLength(1)
})

test('the branch’s open PR is picked up at session start, so a resumed run draws its card', async ($: any, on: any) => {
  const gh = newGh({ onBranch: true })
  await setup($, on, { gh, surface: 'terminal' })

  expect(gh.calls[0]?.slice(0, 3)).toEqual(['gh', 'pr', 'view'])
  expect(await textOf(await $.ui.mount(groupOf('terminal')))).toContain('Open acme/shop #7 · Add the checkout page')
})

test('a resume picks up the branch’s open PR too', async ($: any, on: any) => {
  const gh = newGh()
  const clock = await setup($, on, { gh, surface: 'terminal' })
  gh.onBranch = true
  await $.classic.SessionStart({ source: 'resume', transcript_path: '/t.jsonl' })
  await clock.settle()

  expect(await textOf(await $.ui.mount(groupOf('terminal')))).toContain('acme/shop #7')
})

test('a PR opened through the GitHub MCP tool gets its card', async ($: any, on: any) => {
  const gh = newGh()
  const clock = await setup($, on, { gh, surface: 'terminal' })
  const output = JSON.stringify({ number: 7, html_url: PR_URL })
  await $.tool.call({ tool: 'mcp__github__create_pull_request', owner: 'acme', repo: 'shop', tool_use_id: CALL_ID })
  await clock.settle()
  const group = { ...groupOf('terminal'), props: { ...groupOf('terminal').props, calls: [{ ...groupOf('terminal').props.calls[0], tool: 'mcp__github__create_pull_request', input: {}, output }] } }

  expect(await textOf(await $.ui.mount(group))).toContain('Open acme/shop #7')
})

for (const [state, word] of [['MERGED', 'Merged'], ['CLOSED', 'Closed']] as const) {
  test(`terminal: a ${word.toLowerCase()} PR says so`, async ($: any, on: any) => {
    const gh = newGh({ answer: openPr({ state }) })
    const clock = await setup($, on, { gh, surface: 'terminal' })
    await openThePr($, clock)

    expect(await textOf(await $.ui.mount(groupOf('terminal')))).toContain(`${word} acme/shop #7`)
  })
}

test('a group or a result that opened no PR is left to what lies beneath', async ($: any, on: any) => {
  const gh = newGh()
  const clock = await setup($, on, { gh })
  await openThePr($, clock)

  const other = await $.ui.mount(groupOf('desktop', 'ok', 'ls'))
  expect(await other.find({ type: 'Svg' })).toBeFalsy()
  const mention = await $.ui.mount({ plugin: 'pr-card', surface: 'desktop', component: 'ToolResult', requestId: 'r2', props: { tool_use_id: 'other', tool: 'Bash', output: PR_URL, isErrored: false } })
  expect(await mention.find({ type: 'Svg' })).toBeFalsy()
  const own = await $.ui.mount({ plugin: 'pr-card', surface: 'desktop', component: 'ToolResult', requestId: CALL_ID, props: { tool_use_id: CALL_ID, tool: 'Bash', output: PR_URL, isErrored: false } })
  expect(await altOf(own)).toContain('acme/shop #7')
})

test('a failed gh pr create draws nothing and asks nothing', async ($: any, on: any) => {
  const gh = newGh({ bashOut: 'pull request create failed' })
  const clock = await setup($, on, { gh })
  const asked = gh.calls.length
  await openThePr($, clock)

  expect(gh.calls).toHaveLength(asked)
})

test('Turkish with MODZ_LANG=tr, and no Turkish without it', async ($: any, on: any) => {
  const gh = newGh({ answer: openPr({ reviewDecision: 'REVIEW_REQUIRED', mergeStateStatus: 'BEHIND' }) })
  const clock = await setup($, on, { gh, lang: 'tr', surface: 'terminal' })
  await openThePr($, clock)
  const text = await textOf(await $.ui.mount(groupOf('terminal')))

  expect(text).toContain('Açık acme/shop #7 · Add the checkout page')
  expect(text).toContain('Kontroller: 2/2 geçti · İnceleme: Bekliyor · Birleştirme: Tabandan geride')
  const desk = await $.ui.mount(groupOf('desktop'))
  expect(await altOf(desk)).toBe('acme/shop #7 · 2 dosya +120 −8 · checkout.tsx · a.ts')
  expect((await desk.find({ key: `r-${PR_URL}` })).props.label).toBe('Yenile')
})

test('the terminal gets the facts as text', async ($: any, on: any) => {
  const gh = newGh({ answer: openPr({ statusCheckRollup: [{ name: 'unit tests', status: 'COMPLETED', conclusion: 'FAILURE' }] }) })
  const clock = await setup($, on, { gh, surface: 'terminal' })
  await openThePr($, clock)
  const text = await textOf(await $.ui.mount(groupOf('terminal')))

  expect(text).toContain('Open acme/shop #7 · Add the checkout page')
  expect(text).toContain('Checks: 1 failed')
  expect(text).toContain('Failing: unit tests')
  expect(text).toContain('checkout.tsx')
})
