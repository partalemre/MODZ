import { test } from 'claude-code/testing'

import { BUILD_SCAN, RESET_NUMSTAT, RESET_STATUS, mountBand, mountPane, pass, stub, world } from './world'

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
    const w = world({ theme, answers: { files: BUILD_SCAN } })
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
    const w = world({ theme, isPlaced: false, answers: { 'cd demo-app': '/work/demo-app', 'git status --porcelain': RESET_STATUS, 'git diff --numstat HEAD': RESET_NUMSTAT } })
    stub(on, w)
    on('ui.render', () => ({ type: 'Text', props: { dimColor: true }, children: ['● hud-pro · bağlam %42 · ≈$0,38'] }))
    await ($ as any).session.start({ surface: 'desktop', isInteractive: true, cwd: w.cwd })
    const call = ($ as any).tool.call({ tool: 'Bash', command: 'cd demo-app && git reset --hard' })
    await pass(w, 0)
    await showOnce(`br-reset${suffix}`, await mountPane($, 'desktop'))
    await show(`br-reset-w400${suffix}`, await mountPane($, 'desktop', NARROW_PANE))
    await showOnce(`br-band-w520${suffix}`, await mountBand($, 'desktop', false, NARROW_BAND))
    const band = await mountBand($, 'desktop')
    await show(`br-band${suffix}`, band)
    await band.press({ key: 'cancel' })
    await pass(w)
    await call
  })
}

test('preview: terminal pane', async ($, on) => {
  const w = world({ answers: { files: BUILD_SCAN } })
  stub(on, w)
  const call = ($ as any).tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await pass(w, 0)
  const ui = await mountPane($, 'terminal')
  await show('br-terminal', ui)
  await ui.press({ key: 'cancel' })
  await pass(w)
  await call
})
