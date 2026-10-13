import { mock } from 'claude-code/testing'
import type { MockClock } from 'claude-code/testing'

// A stand-in for Claude Code under the plugin: process runs answered from a table,
// the pane opened or not, sleeps that a test may hold open.

export type World = {
  cwd: string
  isPlaced: boolean
  theme: string
  // What `$.env.get` answers; the Turkish tests set MODZ_LANG=tr, the English ones leave it unset.
  env: Record<string, string>
  answers: Record<string, string>
  opened: unknown[]
  closed: unknown[]
  ran: unknown[]
  toasts: string[]
  clock: MockClock | null
  // This chat's id and project, and the surfaces drawing it (none in a -p run).
  sessionId: string
  root: string
  surfaces: string[]
  // The plugin's store, as it stands.
  store: Record<string, unknown>
  // Paths that land elsewhere (a symlink), as `$.fs.stat` resolves them.
  links: Record<string, string>
  // A tool other than Bash that answers with an error.
  isToolError: boolean
  // Debug log lines.
  logs: string[]
}

export const SURFACES = ['terminal', 'desktop'] as const

export function world(over: Partial<World> = {}): World {
  return { cwd: '/work/demo-app', isPlaced: true, theme: 'dark', env: { MODZ_LANG: 'tr' }, answers: {}, opened: [], closed: [], ran: [], toasts: [], clock: null, sessionId: 'chat-a', root: '/work/demo-app', surfaces: ['desktop'], store: {}, links: {}, isToolError: false, logs: [], ...over }
}

const SECOND = 1000
// Where the mocked clock starts, so an edit made minutes earlier has a time of its own.
export const NOW = Date.parse('2026-10-13T12:00:00Z')
export const MINUTE = 60 * SECOND

export const EN = { env: {} }

/** Starts the session, which reads MODZ_LANG, as Claude Code does before any call. */
export async function start($: any, w: World, surface = 'desktop'): Promise<void> {
  await $.session.start({ surface, isInteractive: true, cwd: w.cwd })
}

const TURKISH_ONLY = /[çğıöşüİ]/i

/** Whether a drawn tree shows a letter only Turkish has. */
export const hasTurkish = (tree: unknown): boolean => TURKISH_ONLY.test(JSON.stringify(tree))

/** Lets the hold loop run: every sleep it started resolves as the mocked clock passes it. */
export async function pass(w: World, ms = SECOND): Promise<void> {
  await w.clock?.advance(ms)
}

const ok = (stdout: string) => ({ value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })

// The key a process run is answered by: `bash` for the files script, else the argv joined.
function keyOf(argv: string[]): string {
  if (argv[0] === 'bash' && argv[2]?.includes('compgen')) return 'files'
  if (argv[0] === 'bash' && argv[2]?.includes('pwd -P')) return `cd ${argv[4]}`

  return argv.join(' ')
}

// The pane and toast side of the engine: what the mod opened, closed and said.
function stubUi(on: any, w: World): void {
  on('ui.open', (_: any, e: any) => {
    w.opened.push(e)

    return { value: w.isPlaced ? { isPlaced: true } : { isPlaced: false, reason: 'narrow' } }
  })
  on('ui.close', (_: any, e: any) => {
    w.closed.push(e)

    return { value: undefined }
  })
  on('ui.toast', (_: any, e: any) => {
    w.toasts.push(e.text)

    return { value: undefined }
  })
  on('ui.log', (_: any, e: any) => {
    w.logs.push(e.text)

    return { value: undefined }
  })
}

// Who this chat is, where it runs and what its paths resolve to.
function stubSession(on: any, w: World): void {
  on('store.get', (_: any, e: any) => ({ value: w.store[e.key] }))
  on('store.set', (_: any, e: any) => {
    w.store[e.key] = JSON.parse(JSON.stringify(e.value))

    return { value: undefined }
  })
  on('store.delete', (_: any, e: any) => {
    delete w.store[e.key]

    return { value: undefined }
  })
  on('store.keys', () => ({ value: Object.keys(w.store) }))
  on('session.id', () => ({ value: w.sessionId }))
  on('session.end', (_: any, e: any) => ({ sessionId: e.sessionId }))
  on('session.root', () => ({ value: w.root }))
  on('session.surfaces', () => ({ value: w.surfaces }))
  on('fs.stat', (_: any, e: any) => {
    const path = e.path.startsWith('/') ? e.path : `${w.cwd}/${e.path}`.replace(/\/\.\//g, '/')

    return { value: { kind: 'file', size: 0, mtimeMs: 0, isLink: path in w.links, realPath: w.links[path] ?? path } }
  })
}

export function stub(on: any, w: World): void {
  w.clock = mock.clock(on, { now: NOW })
  on('session.start', () => ({ cwd: w.cwd }))
  on('session.cwd', () => {
    if (w.cwd === '') throw new Error('no session folder')

    return { value: w.cwd }
  })
  on('config.list', () => ({ value: [{ key: 'theme', label: 'Theme', kind: 'enum', value: w.theme }] }))
  on('env.get', (_: any, e: any) => ({ value: w.env[e.name] }))
  stubSession(on, w)
  stubUi(on, w)
  on('process.run', async (_: any, e: any) => {
    if (e.argv[0] === 'sleep') {
      await w.clock?.sleep(Number(e.argv[1]) * SECOND)

      return ok('')
    }

    return ok(w.answers[keyOf(e.argv)] ?? '')
  })
  on('tool.call', (_: any, e: any) => {
    w.ran.push(e)

    return e.tool !== 'Bash' && w.isToolError ? { isError: true, result: 'failed', text: 'failed' } : { result: 'ran' }
  })
}

// `rm -rf build` in demo-app: 9 files, 286 KB, none tracked, as the files script prints it.
export const BUILD_SCAN = [
  'H 9 1 0',
  'T\t292864',
  'G\t239616\t./build/assets\t6',
  'F\t80896\t./build/assets\tapp.4f2a.js',
  'F\t64512\t./build/assets\tvendor.91c3.js',
  'F\t35840\t./build/assets\tindex.css',
  'F\t29696\t./build/assets\tlogo.svg',
  'F\t26624\t./build/assets\tapp.4f2a.js.map',
  'F\t2048\t./build/assets\tmanifest.json',
  'G\t48128\t./build/assets/fonts\t1',
  'F\t48128\t./build/assets/fonts\tinter-var.woff2',
  'G\t5120\t./build\t2',
  'F\t4096\t./build\tindex.html',
  'F\t1024\t./build\trobots.txt',
].join('\n')

export const RESET_STATUS = 'M  src/api/client.ts\n M src/App.tsx\nA  src/hooks/useAuth.ts\n?? notes.md\n'
export const RESET_NUMSTAT = '38\t12\tsrc/api/client.ts\n9\t4\tsrc/App.tsx\n61\t0\tsrc/hooks/useAuth.ts\n'

export const PANE_PROPS = { title: 'Blast Radius', isFocused: true, bodyColumns: 72, placement: 'dock', scroll: { top: 0, bodyRows: 40, rows: 40 }, view: {} } as const

export async function mountPane($: any, surface: string, columns: number = PANE_PROPS.bodyColumns) {
  return await $.ui.mount({
    plugin: 'blast-radius', component: 'Pane', requestId: 'blast-radius', surface,
    viewport: { columns: 160, rows: 48 },
    props: { ...PANE_PROPS, bodyColumns: columns },
  })
}

export async function mountBand($: any, surface: string, opts: { hasSurvey?: boolean; columns?: number } = {}) {
  const { hasSurvey = false, columns = 110 } = opts
  return await $.ui.mount({
    plugin: 'blast-radius', component: 'AbovePrompt', requestId: hasSurvey ? 'band-survey' : 'band', surface,
    viewport: { columns: 120, rows: 40 },
    props: { hasSurvey, isWorking: true, maxRows: 20, bodyColumns: columns, scroll: { top: 0, bodyRows: 20, rows: 20 }, view: {} },
  })
}
