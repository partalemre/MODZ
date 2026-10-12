import { mock } from 'claude-code/testing'

// The engine stand-ins the checkpoint tests share: a fake git and the session around it.

type Call = { argv: string[]; env: Record<string, string>; stdin?: string }
// `env` answers `$.env.get`: MODZ_LANG=tr for the Turkish tests, left out for the English ones.
export type Fake = { env: Record<string, string>; calls: Call[]; isRepo: boolean; big: string; refs: string; diff: string; numstat?: string; asked: string[]; answer: string }

export const ok = (stdout = '', exitCode = 0) => ({ exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false })

export function fakeFor(fake: Fake) {
  return (argv: string[], init: { env?: Record<string, string>; stdin?: string } = {}) => {
    fake.calls.push({ argv, env: init.env ?? {}, stdin: init.stdin })
    const sub = argv.filter(arg => !arg.startsWith('--git-dir=') && !arg.startsWith('--work-tree='))
    const line = sub.join(' ')
    if (line.startsWith('git rev-parse --show-toplevel')) return fake.isRepo ? ok('/w\n/w/.git\n') : ok('', 128)
    if (line.startsWith('git rev-parse --git-dir')) return ok('', 128)
    if (line.startsWith('git rev-parse --verify')) return ok('head1\n')
    if (argv[0] === 'find') return ok(fake.big)
    if (line.startsWith('git write-tree')) return ok('tree1\n')
    if (line.startsWith('git commit-tree')) return ok('commit1\n')
    if (line.startsWith('git for-each-ref')) return ok(fake.refs)
    if (line.startsWith('git diff --numstat')) return ok(fake.numstat ?? '')
    if (line.startsWith('git diff')) return ok(fake.diff)

    return ok()
  }
}

export const newFake = (over: Partial<Fake> = {}): Fake => ({ env: { HOME: '/Users/x', MODZ_LANG: 'tr' }, calls: [], isRepo: true, big: '', refs: '', diff: '', asked: [], answer: 'Restore', ...over })

// `seen` collects the prompts and tool calls that reach the engine, `stored` the store's writes.
export function stub(on: any, fake: Fake, record: { seen?: any[]; stored?: Record<string, unknown> } = {}) {
  const { seen = [], stored = {} } = record
  const clock = mock.clock(on)
  on('session.start', () => ({ cwd: '/w' }))
  on('env.get', (_: any, e: any) => ({ value: fake.env[e.name] }))
  on('session.cwd', () => ({ value: '/w' }))
  on('session.id', () => ({ value: 'sess-1' }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.toast', (_: any, e: any) => (fake.asked.push(`toast:${e.text}`), { value: undefined }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', (_: any, e: any) => ((stored[e.key] = e.value), { value: undefined }))
  on('command.register', () => ({ value: undefined }))
  on('prompt.submit', (_: any, e: any) => (seen.push(e), { text: e.text }))
  on('process.run', (_: any, e: any) => ({ value: fakeFor(fake)(e.argv, e.init) }))
  on('tool.call', (_: any, e: any) => (seen.push(e), { result: 'written' }))

  return clock
}

export const paneOf = (surface: string) => ({
  plugin: 'checkpoint', component: 'Pane', requestId: 'checkpoints', surface,
  viewport: { columns: 120, rows: 30 },
  props: { title: 'Kontrol noktaları', isFocused: true, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 24 }, view: {} },
})
