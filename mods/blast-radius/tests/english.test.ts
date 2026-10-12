import { expect, test } from 'claude-code/testing'

import { BUILD_SCAN, EN, RESET_NUMSTAT, RESET_STATUS, SURFACES, hasTurkish, mountBand, mountPane, pass, start, stub, world } from './world'

// With no MODZ_LANG the card reads like the film: English words, nothing only Turkish has.

const RESET_ANSWERS = { 'git status --porcelain': RESET_STATUS, 'git diff --numstat HEAD': RESET_NUMSTAT }

for (const surface of SURFACES) {
  test(`git reset reads like the film and Keep my work keeps it (${surface})`, async ($, on) => {
    const w = world({ ...EN, answers: RESET_ANSWERS })
    stub(on, w)
    await start($, w, surface)
    const call = ($ as any).tool.call({ tool: 'Bash', command: 'git reset --hard' })
    await pass(w, 0)
    const ui = await mountPane($, surface)
    const tree = await ui.drawn()
    const drawn = JSON.stringify(tree)

    for (const text of ['HELD · BLAST RADIUS', 'Waiting for you', 'git reset --hard', 'Run anyway', 'Keep my work']) expect(drawn).toContain(text)
    expect(drawn).toContain('This would throw away 3 files and 124 lines you haven\'t committed.')
    expect(hasTurkish(tree)).toBe(false)
    await ui.press({ key: 'cancel' })
    await pass(w)
    const result: any = await call

    expect(result.deny).toMatch(/pressed Keep my work.*discard uncommitted changes in 3 files/)
    expect(w.toasts).toEqual(['Kept. Nothing was thrown away.'])
    expect(w.ran).toHaveLength(0)
  })

  test(`rm -rf says what it deletes, opens its list and runs anyway (${surface})`, async ($, on) => {
    const w = world({ ...EN, answers: { files: BUILD_SCAN } })
    stub(on, w)
    await start($, w, surface)
    const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })
    await pass(w, 0)
    const ui = await mountPane($, surface)
    const drawn = JSON.stringify(await ui.drawn())

    expect(drawn).toContain('This would delete 9 files (286 KB). None of them are in git, so they can\'t be brought back.')
    expect(drawn).toContain('+ 3 more files · 29 KB')
    expect(drawn).toContain('Show more')
    await ui.press({ key: 'toggle' })
    const open = await ui.drawn()
    expect(JSON.stringify(open)).toContain('Show less')
    expect(hasTurkish(open)).toBe(false)
    await ui.press({ key: 'run' })
    await pass(w, 300)
    expect(JSON.stringify(await ui.drawn())).toContain('Deleting…')
    await pass(w)
    await call

    expect(w.ran).toMatchObject([{ command: 'rm -rf build' }])
    expect(w.toasts).toEqual([])
  })

  test(`the band says who holds the command (${surface})`, async ($, on) => {
    const w = world({ ...EN, isPlaced: false, answers: { files: BUILD_SCAN } })
    stub(on, w)
    on('ui.render', () => ({ type: 'Text', children: ['other mod row'] }))
    await start($, w, surface)
    const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })
    await pass(w, 0)
    const band = await mountBand($, surface)
    const tree = await band.drawn()
    const drawn = JSON.stringify(tree)

    for (const text of ['Held by Blast Radius', 'Run anyway', 'Keep my work', '+ 3 more files']) expect(drawn).toContain(text)
    expect(hasTurkish(tree)).toBe(false)
    await band.press({ key: 'cancel' })
    await pass(w)
    expect((await call).deny).toMatch(/Keep my work/)
  })

  test(`a path set at run time is held with an English reason (${surface})`, async ($, on) => {
    const w = world(EN)
    stub(on, w)
    await start($, w, surface)
    const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf $UNSET' })
    await pass(w, 0)
    const ui = await mountPane($, surface)
    const tree = await ui.drawn()

    expect(JSON.stringify(tree)).toContain('$UNSET is set while the command runs')
    expect(hasTurkish(tree)).toBe(false)
    await ui.press({ key: 'cancel' })
    await pass(w)
    await call
  })
}
