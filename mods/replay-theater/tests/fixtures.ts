import { mock } from 'claude-code/testing'

import { archiveWorld, BIG_ID, DIR, NOW_ID, TEXTS } from './transcripts'

export const SURFACES = ['terminal', 'desktop'] as const
export type Surface = (typeof SURFACES)[number]

const USAGE = { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
const SITE = { viewport: { columns: 140, rows: 40 } }

export const bandOf = (surface: Surface, extra: Record<string, unknown> = {}) =>
  ({
    ...SITE, plugin: 'replay-theater', component: 'AbovePrompt', requestId: 'band', surface,
    props: { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 96, scroll: { offset: 0, bodyRows: 12 }, view: {}, ...extra },
  }) as const

export const paneOf = (surface: Surface) =>
  ({
    ...SITE, plugin: 'replay-theater', component: 'Pane', requestId: 'replay-theater', surface,
    props: { title: 'Tekrar', isFocused: true, bodyColumns: 62, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
  }) as const

export type World = {
  files: Record<string, string>
  ids: string[]
  messages: (ids: string[]) => unknown[]
  modelCalls: any[]
  reply: string | null
  theme: string
  opened: string[]
  closed: string[]
  isPlaced: boolean
  isDenying: boolean
  // What `$.env.get` answers: Turkish unless a test clears it for the English default.
  env: Record<string, string>
  // Folder listings, what `dd` streams for a file, every command spawned, and the plugin store.
  dirs: Record<string, { name: string; kind: string; size: number; mtimeMs: number; isLink: boolean }[]>
  streamed: Record<string, string>
  spawned: string[][]
  store: Record<string, unknown>
  reads: string[]
}

export const newWorld = (): World => ({
  files: { '/w/README.md': 'Call greet(name) to say hi.\n', '/w/src/greet.js': 'export function greet(name) {\n  return `Hi ${name}`\n}\n' },
  ids: [], messages: () => [], modelCalls: [], reply: '1: Selam dosyasını oluşturur.', theme: 'dark', opened: [], closed: [], isPlaced: true, isDenying: false,
  env: { MODZ_LANG: 'tr' },
  dirs: {}, streamed: {}, spawned: [], store: {}, reads: [],
})

// The pieces a spawned `dd if=<path> ...` writes: the file's text cut in two mid-line, as a pipe may.
async function* ddOf(world: World, e: any) {
  world.spawned.push([...e.argv])
  const path = String(e.argv.find((arg: string) => arg.startsWith('if=')) ?? '').slice('if='.length)
  const text = world.streamed[path]
  if (text === undefined) {
    yield { stream: 'stderr', text: 'dd: no such file' }

    return { value: { code: 1, signal: null } }
  }
  const half = Math.floor(text.length / 2)
  yield { stream: 'stdout', text: text.slice(0, half) }
  yield { stream: 'stdout', text: text.slice(half) }

  return { value: { code: 0, signal: null } }
}

function answerTool(world: World, e: any) {
  world.ids.push(e.tool_use_id)
  if (world.isDenying) return { deny: 'hayır' }
  if (e.tool === 'Write') world.files[e.file_path] = e.content
  if (e.tool === 'Edit') world.files[e.file_path] = (world.files[e.file_path] ?? '').replace(e.old_string, e.new_string)
  if (e.tool === 'TaskCreate') return { result: { task: { id: String(world.ids.length), subject: e.subject } } }

  return { result: 'ok' }
}

function answerModel(world: World, e: any) {
  world.modelCalls.push(e)
  if (world.reply === null) return { value: { isAnswered: false, reason: 'api-error', status: 529, error: 'overloaded_error', usage: USAGE } }

  return { value: { isAnswered: true, text: world.reply, usage: USAGE } }
}

function engineIo(on: any, world: World) {
  on('fs.exists', (_: any, e: any) => ({ value: world.files[e.path] !== undefined }))
  on('fs.read', (_: any, e: any) => {
    world.reads.push(e.path)
    const text = world.files[e.path]

    return text === undefined ? Promise.reject(new Error('ENOENT')) : { value: text }
  })
  on('fs.list', (_: any, e: any) => {
    const entries = world.dirs[e.path]

    return entries === undefined ? Promise.reject(new Error(`ENOENT ${e.path}`)) : { value: entries }
  })
  on('process.spawn', async function* (_: any, e: any) {
    return yield* ddOf(world, e)
  })
  on('tool.call', (_: any, e: any) => answerTool(world, e))
  on('session.messages', () => ({ value: world.messages(world.ids) }))
  on('model.complete', (_: any, e: any) => answerModel(world, e))
  on('config.list', () => ({ value: [{ key: 'theme', value: world.theme }] }))
}

export async function setup($: any, on: any, world: World) {
  const clock = mock.clock(on)
  mock.env(on, world.env)
  for (const name of ['command.register', 'ui.log']) on(name, () => ({ value: undefined }))
  on('store.get', (_: any, e: any) => ({ value: world.store[e.key] }))
  on('store.set', (_: any, e: any) => {
    world.store[e.key] = JSON.parse(JSON.stringify(e.value))

    return { value: undefined }
  })
  on('classic.SessionStart', () => ({}))
  on('session.start', () => ({ cwd: '/w' }))
  on('session.cwd', () => ({ value: '/w' }))
  on('ui.open', (_: any, e: any) => {
    world.opened.push(e.id)

    return { value: world.isPlaced ? { isPlaced: true } : { isPlaced: false, reason: 'narrow' } }
  })
  on('ui.close', (_: any, e: any) => {
    world.closed.push(e.id)

    return { value: undefined }
  })
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['engine'] }))
  on('turn.start', (_: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', (_: any, e: any) => ({ text: e.answer }))
  engineIo(on, world)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })

  return clock
}

export const said = (text: string, toolUses: { tool_use_id: string; tool: string }[]) => ({
  role: 'assistant', text, toolUses: toolUses.map(use => ({ ...use, input: {} })),
})

export const TODOS = [
  { content: 'Planı yaz', status: 'completed', activeForm: 'Plan yazılıyor' },
  { content: 'Adı değiştir', status: 'in_progress', activeForm: 'Ad değiştiriliyor' },
  { content: 'Test et', status: 'pending', activeForm: 'Test ediliyor' },
]

// TodoWrite, an Edit Claude narrated, a Read, and a Write it did not narrate.
export async function plannedTurn($: any, world: World) {
  world.messages = ([todo, edit, readId, write]) => [
    { role: 'user', text: 'greet adını welcome yap', toolUses: [] },
    said('README içindeki çağrıyı yeni adla güncelliyorum.', [{ tool_use_id: todo as string, tool: 'TodoWrite' }, { tool_use_id: edit as string, tool: 'Edit' }]),
    said('Dosyayı okuyorum.', [{ tool_use_id: readId as string, tool: 'Read' }]),
    said('', [{ tool_use_id: write as string, tool: 'Write' }]),
  ]
  await $.turn.start({ text: 'greet adını welcome yap', turnId: 't1' })
  await $.tool.call({ tool: 'TodoWrite', todos: TODOS })
  await $.tool.call({ tool: 'Edit', file_path: '/w/README.md', old_string: 'Call greet(name)', new_string: 'Call welcome(name)' })
  await $.tool.call({ tool: 'Read', file_path: '/w/README.md' })
  await $.tool.call({ tool: 'Write', file_path: '/w/src/hello.js', content: 'selam\ndünya\n' })
  await $.turn.complete({ answer: 'greet adını **welcome** yaptım. Testler geçiyor.', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' })
}

// The texts a site shows, in order.
export async function texts(site: any): Promise<string[]> {
  return (await site.findAll({ type: 'Text' })).map((found: any) => found.text)
}

export const svgText = async (site: any): Promise<string> =>
  (await site.findAll({ type: 'Svg' })).map((found: any) => String(found.props?.source ?? '')).join('\n')

const REPLAY_WAIT_MS = 200
const SETTLE_TICKS = 20

function withArchive(world: World): World {
  const archive = archiveWorld()
  Object.assign(world.dirs, archive.dirs)
  Object.assign(world.files, archive.files)
  world.streamed[`${DIR}/${BIG_ID}.jsonl`] = TEXTS.big

  return world
}

// The session starts with its transcript's path, as the engine's classic start gives it.
export async function startWithArchive($: any, on: any, world: World) {
  const clock = await setup($, on, withArchive(world))
  await $.classic.SessionStart({ source: 'startup', transcript_path: `${DIR}/${NOW_ID}.jsonl` })

  return clock
}

// Reading runs in the background: a few clock ticks let it finish.
export async function settle(clock: any): Promise<void> {
  for (let tick = 0; tick < SETTLE_TICKS; tick++) await clock.advance(1)
}

export async function replayCommand($: any, clock: any, args: string): Promise<void> {
  const opening = $.command.run({ command: 'replay', args })
  await clock.advance(REPLAY_WAIT_MS)
  await opening
  await settle(clock)
}

