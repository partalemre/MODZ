import { expect, test } from 'claude-code/testing'

import { classify, classifyAll } from '../hooks/classify'
import { cleanArgs, parseScan } from '../hooks/measure-files'
import { parseNumstat } from '../hooks/measure-git'
import { setLang } from '../hooks/lang'
import { viewOf } from '../hooks/view'
import { trSize } from '../hooks/words-tr'
import { BUILD_SCAN, RESET_NUMSTAT, RESET_STATUS, SURFACES, mountBand, mountPane, pass, start, stub, world } from './world'

// These tests read the Turkish card (MODZ_LANG=tr); english.test.ts reads the default one.

test('risky commands are classified, the rest pass', () => {
  expect(classify('rm -rf build')).toMatchObject({ kind: 'rm', label: 'rm -rf', targets: ['build'] })
  expect(classify('sudo -u me nice -n 5 \\rm -r "my dir"')).toMatchObject({ kind: 'rm', targets: ['my dir'] })
  expect(classify('rm file.txt')).toBeNull()
  expect(classify('D=demo-app; rm -rf $D')).toMatchObject({ kind: 'rm', targets: ['demo-app'] })
  expect(classify('export OUT=dist && rm -rf "${OUT}/cache"')).toMatchObject({ kind: 'rm', targets: ['dist/cache'] })
  expect(classify('rm -rf $UNSET')).toMatchObject({ kind: 'rm', targets: ['$UNSET'] })
  expect(classify('cd app && git reset --hard')).toMatchObject({ kind: 'git-reset', dir: 'app' })
  expect(classifyAll('(cd sub && make) > log; rm -rf out')).toMatchObject([{ kind: 'overwrite', paths: ['log'], dir: null }, { kind: 'rm', dir: null }])
  expect(classify('pushd a && pushd b && popd && rm -rf x')).toMatchObject({ dir: 'a' })
  expect(classify('git -C repo clean -fdx')).toMatchObject({ kind: 'git-clean', dir: 'repo', args: ['-fdx'] })
  expect(classify('git push origin +main')).toMatchObject({ kind: 'git-push-force' })
  expect(classify('git push --force-with-lease')).toMatchObject({ kind: 'git-push-force' })
  expect(classify('git restore --staged .')).toBeNull()
  expect(classify('git checkout -- .')).toMatchObject({ kind: 'git-checkout' })
  expect(classify('python3 manage.py migrate')).toMatchObject({ kind: 'migrate', tool: 'django' })
  expect(classify('bin/rails db:migrate:status')).toBeNull()
  expect(classify('make migrate')).toMatchObject({ kind: 'migrate', tool: 'unknown' })
  expect(classify('ls migrate && git status')).toBeNull()
})

test('the files scan groups by folder; git clean keeps only dry-run flags', () => {
  const scan = parseScan(BUILD_SCAN)
  expect(scan).toMatchObject({ files: 9, found: 1, tracked: 0, bytes: 292864 })
  expect(scan.groups.map(group => [group.dir, group.count, group.files.length])).toEqual([['build/assets/', 6, 6], ['build/assets/fonts/', 1, 1], ['build/', 2, 2]])
  expect(cleanArgs(['-fdx', '-e', 'keep', '--', 'tmp'])).toEqual({ flags: ['-dx', '-e', 'keep'], paths: ['tmp'] })
  expect([...parseNumstat('3\t1\tsrc/{old => new}.ts\n-\t-\timg.png\n').entries()]).toEqual([['src/new.ts', { added: 3, removed: 1 }], ['img.png', { added: 0, removed: 0 }]])
  expect(trSize(6451)).toBe('6,3 KB')
  expect(trSize(292864)).toBe('286 KB')
})

test('the view: consequence headline, untracked banner, capped rows with an honest overflow', () => {
  setLang('tr')
  const scan = parseScan(BUILD_SCAN)
  const report = { kind: 'files' as const, summary: '', count: 9, bytes: scan.bytes, groups: scan.groups, items: [], more: 0, tracked: 0, where: null, added: 0, removed: 0, note: null, isEmpty: false }
  const risk = classify('rm -rf build')!
  const view = viewOf({ command: 'rm -rf build', risk, report, cwd: '/work/demo-app', isExpanded: false })

  expect([view.command, view.payload, view.tail, view.context]).toEqual(['rm -rf build', '9 dosya · 286 KB', ' silinecek', 'demo-app içinde'])
  expect(view.banner).toEqual({ tone: 'danger', text: 'Bunların hiçbiri git\'te değil, geri getirilemez.' })
  expect(view.rows.filter(row => row.kind === 'file')).toHaveLength(6)
  expect(view.rows.at(-1)?.name).toBe('+3 dosya daha · 29 KB')
  expect(view.toggleCount).toBe(3)
  expect(view.action).toEqual({ label: '9 dosyayı sil', hotkey: 's' })
  const expanded = viewOf({ command: 'cd x && rm -rf build', risk, report: { ...report, tracked: 9 }, cwd: '/w', isExpanded: true })
  expect(expanded.rows.filter(row => row.kind === 'file')).toHaveLength(9)
  expect(expanded.fullCommand).toBe('cd x && rm -rf build')
  expect(expanded.banner?.tone).toBe('read')
})

for (const surface of SURFACES) {
  test(`Vazgeç refuses rm -rf and Claude is told why (${surface})`, async ($, on) => {
    const w = world({ answers: { files: BUILD_SCAN } })
    stub(on, w)
    await start($, w, surface)
    const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })
    await pass(w, 0)
    const ui = await mountBand($, surface)
    expect(JSON.stringify(await ui.drawn())).toContain('9 dosyayı sil')

    await ui.press({ key: 'cancel' })
    await pass(w)
    const result: any = await call

    expect(result.deny).toMatch(/Vazgeç.*delete 9 files/)
    expect(w.ran).toHaveLength(0)
  })

  test(`delete runs the command after striking the rows (${surface})`, async ($, on) => {
    const w = world({ answers: { files: BUILD_SCAN } })
    stub(on, w)
    await start($, w, surface)
    const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })
    await pass(w, 0)
    const ui = await mountBand($, surface)
    await ui.press({ key: 'run' })
    await pass(w, 300)
    expect(JSON.stringify(await ui.drawn())).not.toContain('9 dosyayı sil')
    await pass(w)
    await call

    expect(w.ran).toMatchObject([{ command: 'rm -rf build' }])
    expect(w.toasts).toEqual([])
  })

  test(`the band draws above the other rows and yields to a survey (${surface})`, async ($, on) => {
    const w = world({ beneath: { type: 'Text', children: ['other mod row'] }, answers: { files: BUILD_SCAN } })
    stub(on, w)
    await start($, w, surface)
    const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })
    await pass(w, 0)
    const band = await mountBand($, surface)
    const drawn: any = await band.drawn()

    expect(JSON.stringify(drawn.children?.[0])).toContain('9 dosyayı sil')
    expect(JSON.stringify(drawn.children?.[1])).toContain('other mod row')
    const survey = await mountBand($, surface, { hasSurvey: true })
    expect(JSON.stringify(await survey.drawn())).not.toContain('9 dosyayı sil')
    await band.press({ key: 'cancel' })
    await pass(w)
    expect((await call).deny).toMatch(/did not run it/)
  })
}

test('a card opens no tab and closes none: it lives in the band', async ($, on) => {
  const w = world({ answers: { files: BUILD_SCAN } })
  stub(on, w)
  await start($, w)
  const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await pass(w, 0)
  const band = await mountBand($, 'desktop')
  await band.press({ key: 'cancel' })
  await pass(w)
  await call

  expect(w.opened).toHaveLength(0)
  expect(w.closed).toHaveLength(0)
})

test('with no sleep on the machine, as on Windows, the hold still waits and the card still answers', async ($, on) => {
  const w = world({ hasNoSleep: true, answers: { files: BUILD_SCAN } })
  stub(on, w)
  await start($, w)
  const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await pass(w, 0)
  const band = await mountBand($, 'desktop')
  await band.press({ key: 'cancel' })
  await pass(w)

  expect(((await call) as any).deny).toMatch(/did not run it/)
})

test('a files scan that failed is no reason to run the delete with no card', async ($, on) => {
  const w = world({ failing: ['files'] })
  stub(on, w)
  await start($, w)
  const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await pass(w, 0)
  const band = await mountBand($, 'desktop')
  await band.press({ key: 'cancel' })
  await pass(w)

  expect(((await call) as any).deny).toMatch(/did not run it/)
})

test('a delete with nothing to lose opens no pane, so it closes none', async ($, on) => {
  const w = world()
  stub(on, w)
  await start($, w)
  await ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })

  expect(w.opened).toHaveLength(0)
  expect(w.closed).toHaveLength(0)
})

test('a tab left by an engine restart is opened once so its close reaches the desktop', async ($, on) => {
  const w = world()
  stub(on, w)
  await start($, w)
  const ui = await mountPane($, 'desktop')
  await ui.drawn()
  await pass(w, 0)
  expect(w.opened).toHaveLength(1)
  expect(w.closed).toHaveLength(1)

  await ui.unmount()
  const again = await mountPane($, 'desktop')
  await again.drawn()
  await pass(w, 0)
  expect(w.opened).toHaveLength(1)
})

test('a listed pane with nothing held just closes', async ($, on) => {
  const w = world({ panes: ['blast-radius'] })
  stub(on, w)
  await start($, w)
  const ui = await mountPane($, 'desktop')
  await ui.drawn()
  await pass(w, 0)

  expect(w.opened).toHaveLength(0)
  expect(w.closed).toHaveLength(1)
})

for (const surface of SURFACES) {
  test(`git reset lists the changes it drops; plain commands are never held (${surface})`, async ($, on) => {
    const w = world({ answers: { 'git status --porcelain': RESET_STATUS, 'git diff --numstat HEAD': RESET_NUMSTAT } })
    stub(on, w)
    await start($, w, surface)
    await ($ as any).tool.call({ tool: 'Bash', command: 'ls -la' })
    expect(w.opened).toHaveLength(0)

    const call = ($ as any).tool.call({ tool: 'Bash', command: 'git reset --hard' })
    await pass(w, 0)
    const ui = await mountBand($, surface)
    const drawn = JSON.stringify(await ui.drawn())
    expect(drawn).toContain('Değişiklikleri sil')
    expect(drawn).toContain('Komut bekletildi')
    await ui.press({ key: 'cancel' })
    await pass(w)
    const result: any = await call

    expect(result.deny).toMatch(/discard uncommitted changes in 3 files/)
    expect(w.ran).toHaveLength(1)
  })

  test(`a path the shell fills in at run time is held with that reason (${surface})`, async ($, on) => {
    const w = world()
    stub(on, w)
    await start($, w, surface)
    const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf $UNSET' })
    await pass(w, 0)
    const ui = await mountBand($, surface)
    expect(JSON.stringify(await ui.drawn())).toContain('komut çalışırken belirleniyor')
    await ui.press({ key: 'cancel' })
    await pass(w)

    expect(((await call) as any).deny).toMatch(/paths decided at run time/)
  })

  test(`the list opens and closes; the card says who holds it (${surface})`, async ($, on) => {
    const w = world({ answers: { files: BUILD_SCAN } })
    stub(on, w)
    await start($, w, surface)
    const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })
    await pass(w, 0)
    const ui = await mountBand($, surface)
    expect(JSON.stringify(await ui.drawn())).not.toContain('robots.txt')
    await ui.press({ key: 'toggle' })
    expect(JSON.stringify(await ui.drawn())).toContain('robots.txt')
    expect(JSON.stringify(await ui.drawn())).toContain('Daha az göster')
    await ui.press({ key: 'cancel' })
    await pass(w)
    await call
  })
}

test('a command that would change nothing runs with no card', async ($, on) => {
  const w = world()
  stub(on, w)
  await start($, w)
  const result: any = await ($ as any).tool.call({ tool: 'Bash', command: 'D=missing; rm -rf $D' })

  expect(result?.deny).toBeUndefined()
  expect(w.opened).toHaveLength(0)
  expect(w.toasts).toEqual([])
})

test('fail closed: an error while holding refuses the command', async ($, on) => {
  const w = world({ cwd: '' })
  stub(on, w)
  await start($, w)
  const result: any = await ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })

  expect(result.deny).toMatch(/hit an error/)
  expect(w.ran).toHaveLength(0)
})
