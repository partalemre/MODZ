// The world beneath the mod, shared by the test files: a spied host (processes, tools, files) and a turn.
import { mock } from 'claude-code/testing'

export type Surface = 'terminal' | 'desktop'

export type Spy = {
  runs: string[][]
  calls: Record<string, unknown>[]
  clock: any
  exitCode: number
  front: string
  host: string | undefined
  surface: Surface
  push: Record<string, unknown> | null
  files: Set<string>
  // The turn's test command fails.
  isTestFailing?: boolean
  // MODZ_LANG as $.env.get answers it: Turkish unless a test asks for the English default (null).
  lang?: string | null
}

export function spyOf(over: Partial<Spy> = {}): Spy {
  return { runs: [], calls: [], clock: null, exitCode: 0, front: 'com.apple.Safari', host: undefined, surface: 'terminal', push: null, files: new Set(), ...over }
}

const ok = (stdout: string, exitCode = 0) => ({ value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })

function processAnswer(spy: Spy, argv: string[]) {
  if (argv[0] === 'lsappinfo') return argv[1] === 'front' ? ok('ASN:0x0-0x1:\n') : ok(`"CFBundleIdentifier"="${spy.front}"\n`)

  return ok('', spy.exitCode)
}

function toolAnswer(spy: Spy, e: any) {
  if (e.tool === 'Bash' && spy.isTestFailing === true) return { result: 'FAIL', isError: true }
  if (e.tool !== 'PushNotification') return { result: 'ok' }
  spy.calls.push(e)

  return { result: spy.push ?? {} }
}

export async function setup($: any, on: any, spy: Spy) {
  spy.clock = mock.clock(on)
  const lang = spy.lang === undefined ? 'tr' : spy.lang
  mock.env(on, { ...(lang === null ? {} : { MODZ_LANG: lang }), ...(spy.host === undefined ? {} : { __CFBundleIdentifier: spy.host }) })
  on('session.start', () => ({ cwd: '/work/eliti' }))
  on('session.surfaces', () => ({ value: [spy.surface] }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('command.register', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['engine'] }))
  on('turn.start', (_: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', (_: any, e: any) => ({ text: e.answer }))
  on('fs.exists', (_: any, e: any) => ({ value: spy.files.has(e.path) }))
  on('tool.list', () => ({ value: spy.push === null ? [] : [{ name: 'PushNotification', description: '', mcp: false }] }))
  on('tool.call', (_: any, e: any) => toolAnswer(spy, e))
  on('tool.check', (_: any, e: any) => ({ decision: e.tool === 'PushNotification' ? 'allow' : 'ask' }))
  on('process.run', (_: any, e: any) => {
    spy.runs.push([...e.argv])

    return processAnswer(spy, e.argv)
  })
  await $.session.start({ surface: spy.surface, isInteractive: true, cwd: '/work/eliti' })
}

// Every test turn ends with the same answer; only how long it ran matters to the ping.
const ANSWER = 'Testler geçti, sürüm hazır.'

export async function turn($: any, spy: Spy, durationMs: number) {
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  await $.tool.call({ tool: 'Write', file_path: 'a.ts', content: 'x' })
  await $.tool.call({ tool: 'Edit', file_path: 'b.ts', old_string: 'a', new_string: 'b' })
  await $.turn.complete({ answer: ANSWER, durationMs, isAborted: false, turnId: 't', reason: 'answer' })
  await spy.clock.advance(5)
}

export const bandOf = (surface: Surface) => ({
  plugin: 'done-ping',
  component: 'AbovePrompt',
  requestId: 'band',
  surface,
  viewport: { columns: 100, rows: 30 },
  props: { hasSurvey: false, isWorking: false, maxRows: 5, bodyColumns: 100, scroll: { offset: 0, bodyRows: 5 }, view: {} },
})
