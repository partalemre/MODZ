import { mock } from 'claude-code/testing'
import type { MockClock } from 'claude-code/testing'

// A stand-in for Claude Code under the plugin: process runs answered from a table,
// the pane opened or not, sleeps that a test may hold open.

export type World = {
  cwd: string
  isPlaced: boolean
  theme: string
  answers: Record<string, string>
  opened: unknown[]
  closed: unknown[]
  ran: unknown[]
  toasts: string[]
  clock: MockClock | null
}

export const SURFACES = ['terminal', 'desktop'] as const

export function world(over: Partial<World> = {}): World {
  return { cwd: '/work/demo-app', isPlaced: true, theme: 'dark', answers: {}, opened: [], closed: [], ran: [], toasts: [], clock: null, ...over }
}

const SECOND = 1000

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

export function stub(on: any, w: World): void {
  w.clock = mock.clock(on)
  on('session.start', () => ({ cwd: w.cwd }))
  on('session.cwd', () => {
    if (w.cwd === '') throw new Error('no session folder')

    return { value: w.cwd }
  })
  on('config.list', () => ({ value: [{ key: 'theme', label: 'Theme', kind: 'enum', value: w.theme }] }))
  on('env.get', () => ({ value: undefined }))
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
  on('ui.log', () => ({ value: undefined }))
  on('process.run', async (_: any, e: any) => {
    if (e.argv[0] === 'sleep') {
      await w.clock?.sleep(Number(e.argv[1]) * SECOND)

      return ok('')
    }

    return ok(w.answers[keyOf(e.argv)] ?? '')
  })
  on('tool.call', (_: any, e: any) => {
    w.ran.push(e)

    return { result: 'ran' }
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

export async function mountBand($: any, surface: string, hasSurvey = false, columns = 110) {
  return await $.ui.mount({
    plugin: 'blast-radius', component: 'AbovePrompt', requestId: hasSurvey ? 'band-survey' : 'band', surface,
    viewport: { columns: 120, rows: 40 },
    props: { hasSurvey, isWorking: true, maxRows: 20, bodyColumns: columns, scroll: { top: 0, bodyRows: 20, rows: 20 }, view: {} },
  })
}
