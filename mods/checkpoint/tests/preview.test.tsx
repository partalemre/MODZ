import { mock, test } from 'claude-code/testing'

// Draws the timeline, the confirm card and the empty pane on the desktop for bin/preview, once per pinned theme
// and per panel width: narrow ≈400 px (bin/preview --width 400) and wide ≈600 px (--width 600).
const MIN = 60
const NOW = 2_000_000
const TURNS = [
  { n: 14, ago: 2, label: 'Ödeme sayfasındaki hata mesajlarını Türkçeleştir', files: 3, tools: ['E', '$'] },
  { n: 13, ago: 9, label: 'Sepet toplamını kuruşa yuvarlayan testi ekle', files: 2, tools: ['E', 'W', '$'] },
  { n: 12, ago: 21, label: 'Giriş formuna şifre göster düğmesi koy', files: 4, tools: ['R', 'E', 'S'] },
  { n: 11, ago: 48, label: 'README kurulum adımlarını güncelle', files: 1, tools: ['R', 'E'] },
]
const refOf = (n: number) => `refs/checkpoints/s/${n}`
const refs = (withSafety: boolean) => [
  ...(withSafety ? [`${refOf(99)}\tcs\t${NOW - MIN}\tgeri almadan önce: Giriş formuna şifre göster düğmesi koy`] : []),
  ...TURNS.map(t => `${refOf(t.n)}\tc${t.n}\t${NOW - t.ago * MIN}\t${t.label}`),
].join('\n')
const meta = (isUndone: boolean) => Object.fromEntries([
  [refOf(99), { isSafety: true }],
  ...TURNS.map(t => [refOf(t.n), { turn: t.n, files: t.files, tools: t.tools, isUndone: isUndone && t.n >= 12 }]),
])
const NUMSTAT = ['18\t4\tsrc/auth/LoginForm.tsx', '6\t2\tsrc/auth/login.test.ts', '0\t31\tsrc/auth/PasswordToggle.tsx', '3\t3\tsrc/styles/form.css'].join('\0') + '\0'
const DIFF = ['M', 'src/auth/LoginForm.tsx', 'M', 'src/auth/login.test.ts', 'A', 'src/auth/PasswordToggle.tsx', 'M', 'src/styles/form.css'].join('\0') + '\0'
const WIDTHS = { narrow: 50, wide: 75 }
const ok = (stdout = '') => ({ value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })

type Spec = { theme: string; isUndone: boolean; columns: number; isEmpty?: boolean }

async function open($: any, on: any, spec: Spec) {
  const clock = mock.clock(on)
  await clock.advance(NOW * 1000)
  mock.env(on, { MODZ_THEME: spec.theme, HOME: '/Users/x' })
  for (const name of ['ui.log', 'ui.toast', 'store.set', 'command.register']) on(name, () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/w' }))
  on('session.cwd', () => ({ value: '/w' }))
  on('session.id', () => ({ value: 's' }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('store.get', (_: any, e: any) => ({ value: e.key === 'checkpoint.meta' ? meta(spec.isUndone) : undefined }))
  on('process.run', (_: any, e: any) => {
    const line = e.argv.join(' ')
    if (line.includes('rev-parse --show-toplevel')) return ok('/w\n/w/.git\n')
    if (line.includes('for-each-ref')) return ok(spec.isEmpty === true ? '' : refs(spec.isUndone))
    if (line.includes('diff --numstat')) return ok(NUMSTAT)
    if (line.includes('diff --name-status')) return ok(DIFF)
    if (line.includes('write-tree')) return ok('tree1\n')

    return ok()
  })
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
  await $.command.run({ command: 'checkpoints', args: '' })

  return $.ui.mount({
    plugin: 'checkpoint', component: 'Pane', requestId: 'checkpoints', surface: 'desktop', viewport: { columns: spec.columns + 10, rows: 40 },
    props: { title: 'Kontrol noktaları', isFocused: true, bodyColumns: spec.columns, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
  })
}

const dump = async (label: string, ui: any) => console.log(`@@TREE@@${label}@@${JSON.stringify(await ui.drawn())}`)

for (const [size, columns] of Object.entries(WIDTHS)) {
  for (const theme of ['dark', 'light']) {
    test(`preview ${size} ${theme}: timeline and confirm card`, async ($: any, on: any) => {
      const pane = await open($, on, { theme, isUndone: false, columns })
      await dump(`${size}-timeline-${theme}`, pane)
      await pane.press({ key: 'cp-undo-2' })
      await dump(`${size}-confirm-${theme}`, pane)
    })

    test(`preview ${size} ${theme}: timeline after an undo`, async ($: any, on: any) => {
      await dump(`${size}-timeline-undone-${theme}`, await open($, on, { theme, isUndone: true, columns }))
    })

    test(`preview ${size} ${theme}: no checkpoints yet`, async ($: any, on: any) => {
      await dump(`${size}-empty-${theme}`, await open($, on, { theme, isUndone: false, columns, isEmpty: true }))
    })
  }
}
