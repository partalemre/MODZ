import { expect, test } from 'claude-code/testing'

import { CALL_ID, PR_URL, altOf, groupOf, newGh, openPr, openThePr, setup, sourceOf } from './world'

const MINUTE = 60_000
const ghViews = (gh: any) => gh.calls.filter((argv: string[]) => argv[2] === 'view')

test('an open PR: state, repo and number, title, counts, checks, review, merge, files', async ($: any, on: any) => {
  const gh = newGh()
  const clock = await setup($, on, { gh })
  await openThePr($, clock)
  const ui = await $.ui.mount(groupOf('desktop'))

  expect(await altOf(ui)).toBe('Open acme/shop #7 · Add the checkout page · Checks: 2/2 passed · Review: Approved · Merge: Ready')
  const source = await sourceOf(ui)
  for (const word of ['2 files', '+120', '−8', 'checkout.tsx', 'a.ts']) expect(source).toContain(word)
  // The largest change comes first in a row that may not hold them all.
  expect(source.indexOf('checkout.tsx')).toBeLessThan(source.indexOf('>a.ts<'))
  expect(ghViews(gh)[0]).toContain(PR_URL)
})

for (const [state, word] of [['MERGED', 'Merged'], ['CLOSED', 'Closed']] as const) {
  test(`${word.toLowerCase()} PR says so and is not asked again`, async ($: any, on: any) => {
    const gh = newGh({ answer: openPr({ state }) })
    const clock = await setup($, on, { gh })
    await openThePr($, clock)
    const ui = await $.ui.mount(groupOf('desktop'))
    expect(await altOf(ui)).toContain(`${word} acme/shop #7`)
    expect(await altOf(ui)).toContain('Merge: —')
    const asked = ghViews(gh).length
    await clock.advance(30 * MINUTE)
    expect(ghViews(gh)).toHaveLength(asked)
  })
}

test('failing CI names the failing checks', async ($: any, on: any) => {
  const gh = newGh({ answer: openPr({ statusCheckRollup: [{ name: 'unit tests', status: 'COMPLETED', conclusion: 'FAILURE' }] }) })
  const clock = await setup($, on, { gh })
  await openThePr($, clock)
  const ui = await $.ui.mount(groupOf('desktop'))

  expect(await altOf(ui)).toContain('Checks: 1 failed')
  expect(await sourceOf(ui)).toContain('unit tests')
})

test('no gh: the card still says what the link knows, polling stops, a press asks again', async ($: any, on: any) => {
  const gh = newGh({ hasGh: false })
  const clock = await setup($, on, { gh })
  await openThePr($, clock)
  const ui = await $.ui.mount(groupOf('desktop'))

  expect(await altOf(ui)).toBe('Open acme/shop #7 · gh is not available, so only the link is known')
  const asked = gh.calls.length
  await clock.advance(30 * MINUTE)
  expect(gh.calls).toHaveLength(asked)

  gh.hasGh = true
  await ui.press({ key: `r-${PR_URL}` })
  await clock.settle()
  expect(await altOf(ui)).toContain('Add the checkout page')
})

test('a refresh that fails keeps the last answer and says how old it is', async ($: any, on: any) => {
  const gh = newGh({ answer: openPr({ statusCheckRollup: [{ name: 'build', status: 'IN_PROGRESS' }] }) })
  const clock = await setup($, on, { gh })
  await openThePr($, clock)
  const ui = await $.ui.mount(groupOf('desktop'))

  gh.exitCode = 1
  await clock.advance(3 * MINUTE)
  expect(await altOf(ui)).toContain('Add the checkout page')
  expect(await altOf(ui)).toMatch(/Could not refresh · last read \d min ago/)
})

test('gh is asked each minute while checks run, every five once they settle', async ($: any, on: any) => {
  const gh = newGh({ answer: openPr({ statusCheckRollup: [{ name: 'build', status: 'IN_PROGRESS' }] }) })
  const clock = await setup($, on, { gh })
  await openThePr($, clock)
  expect(ghViews(gh)).toHaveLength(1)
  await clock.advance(MINUTE)
  expect(ghViews(gh)).toHaveLength(2)

  gh.answer = openPr()
  await clock.advance(MINUTE)
  expect(ghViews(gh)).toHaveLength(3)
  await clock.advance(4 * MINUTE)
  expect(ghViews(gh)).toHaveLength(3)
  await clock.advance(MINUTE)
  expect(ghViews(gh)).toHaveLength(4)
})

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
  await openThePr($, clock)

  expect(gh.calls).toEqual([])
})

test('Turkish with MODZ_LANG=tr, and no Turkish without it', async ($: any, on: any) => {
  const gh = newGh({ answer: openPr({ reviewDecision: 'REVIEW_REQUIRED', mergeStateStatus: 'BEHIND' }) })
  const clock = await setup($, on, { gh, lang: 'tr' })
  await openThePr($, clock)
  const ui = await $.ui.mount(groupOf('desktop'))

  expect(await altOf(ui)).toBe('Açık acme/shop #7 · Add the checkout page · Kontroller: 2/2 geçti · İnceleme: Bekliyor · Birleştirme: Tabandan geride')
  expect((await ui.find({ key: `r-${PR_URL}` })).props.label).toBe('Yenile')
})

test('the terminal gets the same facts as text', async ($: any, on: any) => {
  const gh = newGh({ answer: openPr({ statusCheckRollup: [{ name: 'unit tests', status: 'COMPLETED', conclusion: 'FAILURE' }] }) })
  const clock = await setup($, on, { gh, surface: 'terminal' })
  await openThePr($, clock)
  const ui = await $.ui.mount(groupOf('terminal'))
  const text = (await ui.findAll({ type: 'Text' })).map((t: any) => t.text).join('\n')

  expect(text).toContain('Open acme/shop #7 · Add the checkout page')
  expect(text).toContain('Checks: 1 failed')
  expect(text).toContain('Failing: unit tests')
  expect(text).toContain('checkout.tsx')
})
