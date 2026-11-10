import { mock } from 'claude-code/testing'

// The engine around the handoff mod: a repo at /w, a store, a transcript, git and the model, all fakes.

export const ROOT = '/w'
export const MINUTE = 60_000

export type World = {
  env: Record<string, string>
  sessionId: string
  messages: any[]
  store: Record<string, unknown>
  files: Record<string, string>
  argv: string[][]
  asked: any[]
  opened: string[]
  compacts: number
  // The model's reply; null answers an API error.
  reply: string | null
  git: { exitCode: number; stdout: string }
  tasks: unknown
  logs: string[]
  // fs.write rejects with this, when set.
  writeError: string | null
  // The session's folder, and what `git rev-parse --git-common-dir` says there (null: not a repo).
  root: string
  commonDir: string | null
  // The engine's auto-compaction point in tokens (of a 200k window); null: auto-compaction is off.
  autoTokens: number | null
  // What a compaction reports, and the note files there were when core ran.
  sizes: { tokensBefore?: number; tokensAfter?: number }
  filesAtCompact: string[]
  // Rows a plugin appended to the conversation.
  appended: any[]
}

export const newWorld = (over: Partial<World> = {}): World => ({
  env: {}, sessionId: 's1', messages: [], store: {}, files: {}, argv: [], asked: [], opened: [], compacts: 0,
  reply: 'Login form is done.\nNext: wire the API call.', git: { exitCode: 0, stdout: '## main\n M src/app.ts\n' }, tasks: undefined, logs: [], writeError: null,
  root: ROOT, commonDir: `${ROOT}/.git`, autoTokens: 180_000, sizes: {}, filesAtCompact: [], appended: [], ...over,
})

export const said = (role: 'user' | 'assistant', text: string, extra: object = {}) => ({ role, text, toolUses: [], ...extra })

const runOut = (exitCode: number, stdout: string) => ({ value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })

function engineIo(on: any, w: World) {
  on('store.get', (_: any, e: any) => ({ value: w.store[e.key] }))
  on('store.set', (_: any, e: any) => ((w.store[e.key] = JSON.parse(JSON.stringify(e.value))), { value: undefined }))
  on('store.delete', (_: any, e: any) => (delete w.store[e.key], { value: undefined }))
  on('fs.write', (_: any, e: any) => {
    if (w.writeError !== null) return Promise.reject(new Error(w.writeError))
    w.files[e.path] = e.text

    return { value: undefined }
  })
  on('process.run', (_: any, e: any) => {
    w.argv.push([...e.argv])
    if (e.argv[0] === 'rm') {
      delete w.files[e.argv.at(-1)]

      return runOut(0, '')
    }
    if (e.argv.includes('rev-parse')) return w.commonDir === null ? runOut(128, '') : runOut(0, `${w.commonDir}\n`)

    return runOut(w.git.exitCode, w.git.stdout)
  })
  on('model.complete', (_: any, e: any) => {
    w.asked.push(e)
    if (w.reply === null) return { value: { isAnswered: false, reason: 'api-error', status: 529, error: 'overloaded_error' } }

    return { value: { isAnswered: true, text: w.reply, usage: { input_tokens: 900, output_tokens: 60 } } }
  })
}

export function stub(on: any, w: World) {
  const clock = mock.clock(on)
  mock.env(on, w.env)
  on('command.register', () => ({ value: undefined }))
  on('ui.log', (_: any, e: any) => (w.logs.push(e.text), { value: undefined }))
  on('session.start', () => ({ cwd: ROOT }))
  on('session.end', (_: any, e: any) => ({ sessionId: e.sessionId }))
  on('session.root', () => ({ value: w.root }))
  on('session.cwd', () => ({ value: w.root }))
  on('session.id', () => ({ value: w.sessionId }))
  on('session.messages', () => ({ value: w.messages }))
  on('session.measure', (_: any, e: any) => ({ changed: e.changed }))
  on('session.compact', () => {
    w.compacts += 1
    w.filesAtCompact = Object.keys(w.files)

    return { messages: [said('user', 'summary')], ...w.sizes }
  })
  on('session.append', (_: any, e: any, next: any) => (w.appended.push(e.message), next(e)))
  on('session.usage', () => ({
    value: {
      startedAt: 0, rateLimits: [],
      context: { window: 200_000, breakdown: { isAutoCompactEnabled: w.autoTokens !== null, ...(w.autoTokens === null ? {} : { autoCompactThreshold: w.autoTokens }) } },
    },
  }))
  on('config.list', () => ({ value: [{ key: 'theme', value: w.env.MODZ_THEME ?? 'dark' }] }))
  on('ui.open', (_: any, e: any) => (w.opened.push(e.id), { value: { isPlaced: true } }))
  on('ui.render', (_: any, e: any) => $text(e))
  on('prompt.compose', () => ({ sections: [{ id: 'intro', text: 'You are Claude Code.', scope: 'shared' }] }))
  on('tool.call', (_: any, e: any) => (e.fail ? { result: {}, text: e.fail, isError: true } : { result: {}, text: 'ok' }))
  engineIo(on, w)

  return clock
}

// What the engine (and the mods beneath) drew in the band: one dim line.
const $text = (e: any) => (e.component === 'AbovePrompt' ? { type: 'Text', props: { dimColor: true }, children: ['theirs'] } : { type: 'Text', props: {}, children: ['engine'] })

export async function start($: any, surface: string) {
  await $.session.start({ surface, isInteractive: true, cwd: ROOT })
}

export const measure = ($: any, percent: number | undefined) =>
  $.session.measure({ context: { window: 200_000, tokens: percent === undefined ? undefined : percent * 2000, percent }, rateLimits: [], changed: ['context'] })

export const COMPOSE = { model: 'claude-test', promptModel: 'claude-test', surfaces: ['terminal'], tools: [], outputStyle: null, traits: [] }

export const bandOf = (surface: string, over: object = {}) => ({
  plugin: 'handoff', component: 'AbovePrompt', requestId: 'band', surface, viewport: { columns: 110, rows: 40 },
  props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 100, scroll: { offset: 0, bodyRows: 20 }, view: {}, ...over },
})

export const paneOf = (surface: string, columns = 60) => ({
  plugin: 'handoff', component: 'Pane', requestId: 'handoff', surface, viewport: { columns: 120, rows: 40 },
  props: { title: 'Handoff', isFocused: true, bodyColumns: columns, placement: 'dock', scroll: { offset: 0, bodyRows: 36 }, view: {} },
})

export function buttonsOf(node: any, out: string[] = []): string[] {
  if (node === null || typeof node !== 'object') return out
  if (node.type === 'Button' && typeof node.props?.key === 'string') out.push(node.props.key)
  for (const child of node.children ?? []) buttonsOf(child, out)

  return out
}

// Stands for the MODZ hub: it switches itself on, writes open and stage requests, reads this mod's card and hears `home`.
export const modz = {
  name: 'modz',
  register(on: any) {
    const heard: unknown[] = []
    on('command.run', { command: 'hub-on' }, async ($: any) => (await $.state.set({ plugin: 'modz', key: 'isOn' }, true), {}))
    on('command.run', { command: 'modz-open' }, async ($: any, e: any) => (await $.state.set({ plugin: 'modz', key: 'open' }, { pane: e.args, at: 1 }), {}))
    on('command.run', { command: 'modz-stage' }, async ($: any, e: any) => (await $.state.set({ plugin: 'modz', key: 'stage' }, { pane: e.args, at: 1 }), {}))
    on('command.run', { command: 'modz-hub' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'handoff', key: 'hub' })).value ?? null) }))
    on('state.set', { key: 'home' }, async (_: any, e: any, next: any) => (heard.push(e.value), next(e)))
    on('command.run', { command: 'hub-heard' }, async () => ({ text: JSON.stringify(heard) }))
  },
}

export const hubCardOf = async ($: any) => JSON.parse((await $.command.run({ command: 'modz-hub', args: '' })).text)

// A /clear: the next conversation in the same process, under its own id.
export async function nextChat($: any, w: World, sessionId: string) {
  await $.session.end({ reason: 'clear', sessionId: w.sessionId, resume: { id: w.sessionId } } as any)
  w.sessionId = sessionId
}

// A compaction the engine starts (the person's /compact, the threshold, an idle one), over the conversation so far.
export const compactBy = ($: any, trigger: string, over: object = {}) =>
  $.session.compact({ trigger, messages: [said('user', 'earlier work')], ...over })

// The person presses "Continue from handoff" in the band.
export async function takeNote($: any) {
  const band = await $.ui.mount(bandOf('terminal'))
  await band.press({ key: 'handoff-continue' })
  await band.unmount()
}
