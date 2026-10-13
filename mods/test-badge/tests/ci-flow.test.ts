import { expect, test } from 'claude-code/testing'

import { PR_URL, bandOf, bash, failed, ghCalls, hrefsOf, hubOf, modz, newGh, paneOf, passed, pending, setupCi, shownText } from './ci-world'

const SURFACES = ['terminal', 'desktop'] as const
const MINUTE = 60_000
const WITH_HUB = { plugins: [modz] }

test('a session that opens on a branch with an open PR polls its checks at once, then each minute', WITH_HUB, async ($: any, on: any) => {
  const gh = newGh()
  const clock = await setupCi($, on, { gh })

  expect(ghCalls(gh, 'view')[0]).toEqual(['gh', 'pr', 'view', '--json', 'number,url,headRefName,state,title'])
  expect(ghCalls(gh, 'checks')).toEqual([['gh', 'pr', 'checks', '7', '--json', 'name,state,bucket,link']])
  expect((await hubOf($)).detail).toBe('CI 0/2 · 2 running')
  await clock.advance(MINUTE)
  expect(ghCalls(gh, 'checks')).toHaveLength(2)
})

const QUIET = { 'no git repo': { isRepo: false }, 'no gh': { hasGh: false }, 'no PR on the branch': { branchPr: null } }
for (const [why, over] of Object.entries(QUIET)) {
  test(`${why}: nothing polls and the hub says nothing of CI`, WITH_HUB, async ($: any, on: any) => {
    const gh = newGh(over)
    const clock = await setupCi($, on, { gh })
    await bash($, gh, { command: 'git push' })
    await clock.advance(5 * MINUTE)

    expect(ghCalls(gh, 'checks')).toEqual([])
    if (why === 'no git repo') expect(gh.calls.filter(argv => argv[0] === 'gh')).toEqual([])
    expect((await hubOf($))?.detail ?? '').toBe('')
  })
}

test('Claude opening a PR starts a watch on the PR its output names, first poll a minute later', async ($: any, on: any) => {
  const gh = newGh({ branchPr: null })
  const clock = await setupCi($, on, { gh })
  gh.branchPr = { number: 7, url: PR_URL, title: 'Add the checkout page', state: 'OPEN' }

  await bash($, gh, { command: 'gh pr create --fill', out: `Creating pull request\n${PR_URL}\n` })
  await clock.settle()
  expect(ghCalls(gh, 'view').at(-1)).toEqual(['gh', 'pr', 'view', '7', '--json', 'number,url,headRefName,state,title'])
  expect(ghCalls(gh, 'checks')).toEqual([])
  await clock.advance(MINUTE)
  expect(ghCalls(gh, 'checks')).toHaveLength(1)
})

test('a git push restarts the watch on the branch PR; a failed push or another command does not', async ($: any, on: any) => {
  const gh = newGh({ checks: [passed('lint')] })
  const clock = await setupCi($, on, { gh })
  // The run at session open was already over: the watch stopped quietly.
  await clock.advance(5 * MINUTE)
  expect(ghCalls(gh, 'checks')).toHaveLength(1)
  await bash($, gh, { command: 'git push --force', out: 'rejected', isError: true })
  await bash($, gh, { command: 'git status' })
  await clock.advance(2 * MINUTE)
  expect(ghCalls(gh, 'checks')).toHaveLength(1)

  gh.checks = [pending('lint')]
  await bash($, gh, { command: 'git push' })
  await clock.advance(MINUTE)
  expect(ghCalls(gh, 'checks')).toHaveLength(2)
  expect(gh.notes).toEqual([])
})

for (const surface of SURFACES) {
  test(`${surface}: pending then red: one notification, the card, and "Ask Claude to fix" sends the failing checks`, WITH_HUB, async ($: any, on: any) => {
    const gh = newGh()
    const clock = await setupCi($, on, { gh, surface })
    const band = await $.ui.mount(bandOf(surface))
    expect(await band.find({ key: 'tb-ci-ask' })).toBeUndefined()

    gh.checks = [passed('test'), failed('lint')]
    await clock.advance(MINUTE)
    expect(gh.notes).toEqual(['CI failed: lint · #7'])
    expect((await hubOf($))).toMatchObject({ detail: 'CI 1/2 · 1 failing', tone: 'bad' })
    await band.redraw()
    expect(shownText(await band.drawn())).toContain('CI failed: lint')
    expect(await hrefsOf(band)).toEqual([PR_URL])
    expect(await band.find({ key: 'tb-ci-dismiss' })).toBeDefined()
    expect((await band.drawn() as any).children.at(-1)).toEqual({ type: 'engine', ref: 1 })

    await band.press({ key: 'tb-ci-ask' })
    expect(gh.prompts).toHaveLength(1)
    expect(gh.prompts[0]).toContain('CI failed on PR #7')
    expect(gh.prompts[0]).toContain('- lint: https://github.com/acme/shop/actions/runs/1/job/lint')
    await band.redraw()
    expect(await band.find({ key: 'tb-ci-ask' })).toBeUndefined()
    // Finished: the watch stops polling and never notifies again.
    await clock.advance(10 * MINUTE)
    expect(ghCalls(gh, 'checks')).toHaveLength(2)
    expect(gh.notes).toHaveLength(1)
  })

  test(`${surface}: pending then green: a notification and the hub line, no card`, WITH_HUB, async ($: any, on: any) => {
    const gh = newGh()
    const clock = await setupCi($, on, { gh, surface })
    gh.checks = [passed('lint'), passed('test')]
    await clock.advance(MINUTE)

    expect(gh.notes).toEqual(['CI passed · #7 · 2/2'])
    expect(await hubOf($)).toMatchObject({ detail: 'CI 2/2 passed', tone: 'ok' })
    const band = await $.ui.mount(bandOf(surface))
    expect(await band.find({ key: 'tb-ci-ask' })).toBeUndefined()
    expect(gh.prompts).toEqual([])
  })

  test(`${surface}: the Tests pane's CI section lists each check with its state and links`, async ($: any, on: any) => {
    const gh = newGh({ checks: [passed('lint'), pending('test'), { ...failed('e2e'), link: '' }], talk: 1 })
    const clock = await setupCi($, on, { gh, surface })
    gh.talk = 3
    await clock.advance(MINUTE)
    const pane = await $.ui.mount(paneOf(surface))
    const text = shownText(await pane.drawn())

    expect(text).toContain('#7')
    expect(text).toContain('Add the checkout page')
    expect(text).toContain('CI 1/3 · 1 failing · 2 new reviews or comments')
    expect(text).toMatch(/lint[\s\S]*passed/)
    expect(text).toMatch(/test[\s\S]*running/)
    // e2e gave no link: it gets none.
    expect(await hrefsOf(pane)).toEqual(['https://github.com/acme/shop/actions/runs/1/job/lint', 'https://github.com/acme/shop/actions/runs/1/job/test', PR_URL])
  })

  test(`${surface}: Dismiss takes the card away and leaves the hub line`, WITH_HUB, async ($: any, on: any) => {
    const gh = newGh()
    const clock = await setupCi($, on, { gh, surface })
    gh.checks = [failed('lint'), failed('test'), failed('e2e')]
    await clock.advance(MINUTE)
    const band = await $.ui.mount(bandOf(surface))
    expect(shownText(await band.drawn())).toContain('CI failed: lint, test +1')

    await band.press({ key: 'tb-ci-dismiss' })
    await band.redraw()
    expect(await band.find({ key: 'tb-ci-ask' })).toBeUndefined()
    expect(gh.prompts).toEqual([])
    expect((await hubOf($)).detail).toBe('CI 0/3 · 3 failing')
  })
}

test('a long run backs off to a poll every three minutes after ten, and stops when the PR merges', WITH_HUB, async ($: any, on: any) => {
  const gh = newGh()
  const clock = await setupCi($, on, { gh })
  await clock.advance(9 * MINUTE)
  expect(ghCalls(gh, 'checks')).toHaveLength(10)
  await clock.advance(2 * MINUTE)
  expect(ghCalls(gh, 'checks')).toHaveLength(10)
  await clock.advance(MINUTE)
  expect(ghCalls(gh, 'checks')).toHaveLength(11)

  gh.prState = 'MERGED'
  await clock.advance(3 * MINUTE)
  expect((await hubOf($)).detail).toBe('PR #7 merged')
  await clock.advance(30 * MINUTE)
  expect(ghCalls(gh, 'checks')).toHaveLength(12)
  expect(gh.notes).toEqual([])
})

test('/test-badge off stops the watch; on looks for the branch PR again', async ($: any, on: any) => {
  const gh = newGh()
  const clock = await setupCi($, on, { gh })
  await $.command.run({ command: 'test-badge', args: 'off' })
  await clock.advance(5 * MINUTE)
  expect(ghCalls(gh, 'checks')).toHaveLength(1)
  await $.command.run({ command: 'test-badge', args: 'on' })
  await clock.settle()
  expect(ghCalls(gh, 'checks')).toHaveLength(2)
})
