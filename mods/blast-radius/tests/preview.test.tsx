import { test } from 'claude-code/testing'

import { BUILD_SCAN, EN, RESET_NUMSTAT, RESET_STATUS, mountBand, mountPane, pass, start, stub, world } from './world'

// The previews draw the English card, as the film shows it.

// The desktop's right pane is about 400 px wide and the band over the prompt about 520 px: 8 px a column.
const NARROW_PANE = 50
const NARROW_BAND = 65

const show = async (label: string, ui: any) => (globalThis as any).console.log(`@@TREE@@${label}@@${JSON.stringify(await ui.drawn())}`)
// A second size of the same site: drawn once, then let go so the next mount can take the site.
const showOnce = async (label: string, ui: any) => {
  await show(label, ui)
  await ui.unmount()
}

for (const theme of ['dark', 'light']) {
  const suffix = theme === 'light' ? '-light' : ''

  test(`preview: delete card and strike (${theme})`, async ($, on) => {
    const w = world({ ...EN, theme, answers: { files: BUILD_SCAN } })
    stub(on, w)
    await ($ as any).session.start({ surface: 'desktop', isInteractive: true, cwd: w.cwd })
    const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })
    await pass(w, 0)
    await showOnce(`br-delete-w400${suffix}`, await mountPane($, 'desktop', NARROW_PANE))
    const ui = await mountPane($, 'desktop')
    await show(`br-delete${suffix}`, ui)
    await ui.press({ key: 'run' })
    await pass(w, 300)
    await show(`br-strike${suffix}`, ui)
    await pass(w)
    await call
  })

  test(`preview: git reset card and band fallback (${theme})`, async ($, on) => {
    const w = world({ ...EN, theme, isPlaced: false, answers: { 'cd demo-app': '/work/demo-app', 'git status --porcelain': RESET_STATUS, 'git diff --numstat HEAD': RESET_NUMSTAT } })
    stub(on, w)
    on('ui.render', () => ({ type: 'Text', props: { dimColor: true }, children: ['● hud-pro · context 42% · ≈$0.38'] }))
    await ($ as any).session.start({ surface: 'desktop', isInteractive: true, cwd: w.cwd })
    const call = ($ as any).tool.call({ tool: 'Bash', command: 'cd demo-app && git reset --hard' })
    await pass(w, 0)
    await showOnce(`br-reset${suffix}`, await mountPane($, 'desktop'))
    await show(`br-reset-w400${suffix}`, await mountPane($, 'desktop', NARROW_PANE))
    await showOnce(`br-band-w520${suffix}`, await mountBand($, 'desktop', { columns: NARROW_BAND }))
    const band = await mountBand($, 'desktop')
    await show(`br-band${suffix}`, band)
    await band.press({ key: 'cancel' })
    await pass(w)
    await call
  })
}

// git push --force on main: three commits on origin/main that HEAD doesn't have.
const PUSH_ANSWERS = {
  'git rev-parse --abbrev-ref HEAD': 'main',
  'git log --oneline --no-decorate HEAD..origin/main': 'a1b2c3d fix: retry the token refresh once\n9e8f7a6 feat: dark mode for the settings page\n4d5e6f7 chore: bump vite to 6.2\n',
}
const MIGRATE_ANSWERS = { 'python3 manage.py showmigrations --plan': '[X]  auth.0001_initial\n[ ]  billing.0007_invoice_due_date\n[ ]  billing.0008_backfill_due_dates\n' }

for (const theme of ['dark', 'light']) {
  const suffix = theme === 'light' ? '-light' : ''

  test(`preview: push, migrate, unmeasured and the open list (${theme})`, async ($, on) => {
    const w = world({ ...EN, theme, answers: { files: BUILD_SCAN, ...PUSH_ANSWERS, ...MIGRATE_ANSWERS } })
    stub(on, w)
    await ($ as any).session.start({ surface: 'desktop', isInteractive: true, cwd: w.cwd })
    const cases: [string, string, number?][] = [['br-push', 'git push --force'], ['br-migrate', 'python3 manage.py migrate'], ['br-unset', 'rm -rf $OUT_DIR', NARROW_PANE]]
    for (const [label, command, columns] of cases) {
      const call = ($ as any).tool.call({ tool: 'Bash', command })
      await pass(w, 0)
      const ui = await mountPane($, 'desktop', columns)
      await show(`${label}${suffix}`, ui)
      await ui.press({ key: 'cancel' })
      await pass(w)
      await call
      await ui.unmount()
    }
    const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })
    await pass(w, 0)
    const ui = await mountPane($, 'desktop')
    await ui.press({ key: 'toggle' })
    await show(`br-expanded${suffix}`, ui)
    await ui.press({ key: 'cancel' })
    await pass(w)
    await call
  })
}

test('preview: terminal reset in the band', async ($, on) => {
  const w = world({ ...EN, isPlaced: false, answers: { 'git status --porcelain': RESET_STATUS, 'git diff --numstat HEAD': RESET_NUMSTAT } })
  stub(on, w)
  on('ui.render', () => ({ type: 'Text', props: { dimColor: true }, children: ['● hud-pro · context 42% · ≈$0.38'] }))
  const call = ($ as any).tool.call({ tool: 'Bash', command: 'git reset --hard' })
  await pass(w, 0)
  const band = await mountBand($, 'terminal')
  await show('br-terminal-band', band)
  await band.press({ key: 'cancel' })
  await pass(w)
  await call
})

test('preview: terminal pane', async ($, on) => {
  const w = world({ ...EN, answers: { files: BUILD_SCAN } })
  stub(on, w)
  await start($, w, 'terminal')
  const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await pass(w, 0)
  const ui = await mountPane($, 'terminal')
  await show('br-terminal', ui)
  await ui.press({ key: 'cancel' })
  await pass(w)
  await call
})
