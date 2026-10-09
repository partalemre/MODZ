import { mock, test } from 'claude-code/testing'

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

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
// Seven files for the overflowing card: five rows, then "+2 dosya daha".
const MANY = ['src/cart/total.ts', 'src/cart/total.test.ts', 'src/cart/round.ts', 'src/cart/index.ts', 'src/ui/Price.tsx', 'src/ui/Price.css', 'README.md']
const MANY_NUMSTAT = MANY.map((path, i) => `${i + 2}\t${i}\t${path}`).join('\0') + '\0'
const MANY_DIFF = MANY.flatMap(path => ['M', path]).join('\0') + '\0'
const WIDTHS = { narrow: 50, wide: 75 }
const ok = (stdout = '') => ({ value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })

type Spec = { theme: string; isUndone: boolean; columns: number; isEmpty?: boolean; isMany?: boolean; surface?: string }

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
    if (line.includes('diff --numstat')) return ok(spec.isMany === true ? MANY_NUMSTAT : NUMSTAT)
    if (line.includes('diff --name-status')) return ok(spec.isMany === true ? MANY_DIFF : DIFF)
    if (line.includes('write-tree')) return ok('tree1\n')

    return ok()
  })
  const surface = spec.surface ?? 'desktop'
  await $.session.start({ surface, isInteractive: true, cwd: '/w' })
  await $.command.run({ command: 'checkpoints', args: '' })

  return $.ui.mount({
    plugin: 'checkpoint', component: 'Pane', requestId: 'checkpoints', surface, viewport: { columns: spec.columns + 10, rows: 40 },
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
      await pane.press({ key: 'cp-confirm' })
      await dump(`${size}-done-${theme}`, pane)
    })

    test(`preview ${size} ${theme}: a confirm card with more files than rows`, async ($: any, on: any) => {
      const pane = await open($, on, { theme, isUndone: false, columns, isMany: true })
      await pane.press({ key: 'cp-undo-1' })
      await dump(`${size}-confirm-many-${theme}`, pane)
    })

    test(`preview ${size} ${theme}: timeline after an undo`, async ($: any, on: any) => {
      await dump(`${size}-timeline-undone-${theme}`, await open($, on, { theme, isUndone: true, columns }))
    })

    test(`preview ${size} ${theme}: no checkpoints yet`, async ($: any, on: any) => {
      await dump(`${size}-empty-${theme}`, await open($, on, { theme, isUndone: false, columns, isEmpty: true }))
    })
  }
}

test('preview terminal: timeline, confirm card and after an undo', async ($: any, on: any) => {
  const pane = await open($, on, { theme: 'dark', isUndone: false, columns: 90, surface: 'terminal' })
  await dump('terminal-timeline', pane)
  await pane.press({ key: 'cp-undo-1' })
  await dump('terminal-confirm', pane)
  await pane.press({ key: 'cp-confirm' })
  await dump('terminal-done', pane)
})
