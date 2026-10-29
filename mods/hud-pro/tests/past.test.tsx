import { expect, test } from 'claude-code/testing'

import { modelName, pastOf } from '../hooks/past'
import { addRow, closeLog, dayKey, dayStart, EMPTY_LOG, openLog, parseLine } from '../hooks/past-log'
import { rootOf } from '../hooks/past-hook'
import { scanLog } from '../hooks/past-scan'
import { PANE, start, stubSession } from './stubs'

// The Usage pane's history: transcript lines read into days (each reply once), the 7- and 30-day figures and
// heatmap, the cheap rescan, and the card on both surfaces, absent when the transcripts cannot be read.

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000
const ROOT = '/home/me/.claude/projects'
const PROJECT = `${ROOT}/-work`
const SESSION_A = 'aaaaaaaa-0000-0000-0000-000000000001'
const SESSION_B = 'bbbbbbbb-0000-0000-0000-000000000002'
// Noon of a day well inside any time zone's date, so a reply's local day is the one meant.
const NOW = Date.parse('2026-10-29T12:00:00Z')

type Reply = { path?: string; model?: string; id: string; atMs: number; counts?: [number, number, number, number] }

// One line as the extractor prints it.
function line(reply: Reply): string {
  const [input, create, readCache, output] = reply.counts ?? [10, 20, 30, 40]
  const usage = `"usage":{"input_tokens":${input},"cache_creation_input_tokens":${create},"cache_read_input_tokens":${readCache},"output_tokens":${output}`

  return [reply.path ?? `${PROJECT}/${SESSION_A}.jsonl`, `"model":"${reply.model ?? 'claude-opus-5-5'}","id":"${reply.id}"`, usage, `"timestamp":"${new Date(reply.atMs).toISOString()}"`].join('\t')
}

function daysOf(lines: readonly string[]) {
  const open = openLog({})
  for (const text of lines) {
    const row = parseLine(text)
    if (row !== null) addRow(open, row)
  }

  return closeLog(open, '0000-00-00')
}

test('a line reads into its session, model, id, time and the four token counts summed', () => {
  expect(parseLine(line({ id: 'msg_1', atMs: NOW }))).toEqual({ session: SESSION_A, model: 'claude-opus-5-5', id: 'msg_1', atMs: NOW, tokens: 100 })
  // A subagent's transcript belongs to its session.
  expect(parseLine(line({ path: `${PROJECT}/${SESSION_B}/subagents/agent-x1.jsonl`, id: 'msg_2', atMs: NOW }))?.session).toBe(SESSION_B)
})

test('placeholder replies, empty usage and lines that do not read are dropped', () => {
  expect(parseLine(line({ id: 'msg_1', atMs: NOW, model: '<synthetic>' }))).toBeNull()
  expect(parseLine(line({ id: 'msg_1', atMs: NOW, counts: [0, 0, 0, 0] }))).toBeNull()
  expect(parseLine('')).toBeNull()
  expect(parseLine('garbage\twith\ttabs')).toBeNull()
  expect(parseLine(line({ id: 'msg_1', atMs: NOW }).replace(/"timestamp":"[^"]*"/, '"timestamp":"never"'))).toBeNull()
  expect(parseLine(line({ id: 'not-a-message', atMs: NOW }))).toBeNull()
})

test('a reply counts once, however many lines or files repeat it; sessions and models are counted per day', () => {
  const days = daysOf([
    line({ id: 'msg_1', atMs: NOW }),
    line({ id: 'msg_1', atMs: NOW }),
    // A fork copies its parent's replies into its own file.
    line({ path: `${PROJECT}/${SESSION_B}.jsonl`, id: 'msg_1', atMs: NOW }),
    line({ path: `${PROJECT}/${SESSION_B}.jsonl`, id: 'msg_2', atMs: NOW, model: 'claude-sonnet-5-5' }),
  ])
  const today = days[dayKey(NOW)]

  expect(today?.tokens).toBe(200)
  expect(today?.models).toEqual({ 'claude-opus-5-5': 1, 'claude-sonnet-5-5': 1 })
  expect(today?.sessions.length).toBe(2)
})

test('7 and 30 days: active days, sessions, tokens, the most used model; older days left out', () => {
  const days = daysOf([
    line({ id: 'msg_1', atMs: NOW }),
    line({ id: 'msg_2', atMs: NOW - 3 * DAY_MS, model: 'claude-haiku-4-5-20251001' }),
    line({ path: `${PROJECT}/${SESSION_B}.jsonl`, id: 'msg_3', atMs: NOW - 10 * DAY_MS, model: 'claude-haiku-4-5-20251001' }),
    line({ path: `${PROJECT}/${SESSION_B}.jsonl`, id: 'msg_4', atMs: NOW - 10 * DAY_MS - HOUR_MS, model: 'claude-haiku-4-5-20251001' }),
    line({ id: 'msg_5', atMs: NOW - 40 * DAY_MS }),
  ])
  const week = pastOf(days, { range: 7, nowMs: NOW })
  const month = pastOf(days, { range: 30, nowMs: NOW })

  expect({ active: week.activeDays, sessions: week.sessions, tokens: week.tokens }).toEqual({ active: 2, sessions: 1, tokens: 200 })
  expect({ active: month.activeDays, sessions: month.sessions, tokens: month.tokens }).toEqual({ active: 3, sessions: 2, tokens: 400 })
  expect(month.model).toBe('Haiku 4.5')
  expect(pastOf({}, { range: 7, nowMs: NOW }).model).toBeNull()
})

test('the heatmap: a cell per day ending today, its weekday, the busiest day at the top shade', () => {
  const days = daysOf([
    line({ id: 'msg_1', atMs: NOW, counts: [0, 0, 0, 400] }),
    line({ id: 'msg_2', atMs: NOW - DAY_MS, counts: [0, 0, 0, 100] }),
    line({ id: 'msg_3', atMs: NOW - 2 * DAY_MS, counts: [0, 0, 0, 1] }),
  ])
  const week = pastOf(days, { range: 7, nowMs: NOW })
  const month = pastOf(days, { range: 30, nowMs: NOW })

  expect(week.cells.length).toBe(7)
  expect(month.cells.length).toBe(30)
  expect(week.cells.map(cell => cell.level)).toEqual([0, 0, 0, 0, 1, 1, 4])
  expect(week.cells[6]).toEqual({ day: dayKey(NOW), weekday: new Date(NOW).getDay(), tokens: 400, level: 4 })
  expect(month.cells[0]?.day).toBe(dayKey(dayStart(NOW, 29)))
})

test('days before the kept range are dropped from the log', () => {
  const open = openLog({})
  for (const text of [line({ id: 'msg_1', atMs: NOW }), line({ id: 'msg_2', atMs: NOW - 40 * DAY_MS })]) addRow(open, parseLine(text)!)

  expect(Object.keys(closeLog(open, dayKey(dayStart(NOW, 29))))).toEqual([dayKey(NOW)])
})

test('model names read as family and version; another shape keeps its id', () => {
  expect(modelName('claude-opus-5-5')).toBe('Opus 5.5')
  expect(modelName('claude-fable-5')).toBe('Fable 5')
  expect(modelName('claude-haiku-4-5-20251001')).toBe('Haiku 4.5')
  expect(modelName('gpt-x')).toBe('gpt-x')
  expect(rootOf(`${PROJECT}/${SESSION_A}.jsonl`)).toBe(ROOT)
  expect(rootOf('')).toBe('')
})

// A transcripts folder and an awk that prints `out` for whichever files it is handed.
function stubIo(spec: { out: string[]; code?: number; isListable?: boolean }) {
  const runs: string[][] = []
  const entries: Record<string, any[]> = {
    [ROOT]: [{ name: '-work', kind: 'dir', size: 0, mtimeMs: 0 }],
    [PROJECT]: [
      { name: `${SESSION_A}.jsonl`, kind: 'file', size: 100, mtimeMs: NOW },
      { name: SESSION_A, kind: 'dir', size: 0, mtimeMs: 0 },
      { name: 'old.jsonl', kind: 'file', size: 100, mtimeMs: NOW - 40 * DAY_MS },
    ],
    [`${PROJECT}/${SESSION_A}/subagents`]: [{ name: 'agent-x1.jsonl', kind: 'file', size: 50, mtimeMs: NOW }],
  }
  const io = {
    list: async (dir: string) => {
      if (spec.isListable === false || entries[dir] === undefined) throw new Error(`ENOENT ${dir}`)

      return entries[dir]
    },
    spawn: (argv: readonly string[]) => {
      runs.push(argv.slice(2))
      const pieces = (async function* () {
        yield { stream: 'stdout', text: spec.out.join('\n').slice(0, 7) }
        yield { stream: 'stdout', text: `${spec.out.join('\n').slice(7)}\n` }
      })()

      return Object.assign(pieces, { result: Promise.resolve({ code: spec.code ?? 0 }) })
    },
  }

  return { io, runs }
}

test('a read takes only recent transcripts, subagents included, and reads again only what changed', async () => {
  const { io, runs } = stubIo({ out: [line({ id: 'msg_1', atMs: NOW })] })
  const first = await scanLog(io, { root: ROOT, log: EMPTY_LOG, nowMs: NOW })
  expect(runs).toEqual([[`${PROJECT}/${SESSION_A}.jsonl`, `${PROJECT}/${SESSION_A}/subagents/agent-x1.jsonl`]])
  expect(first.days[dayKey(NOW)]?.tokens).toBe(100)

  const again = await scanLog(io, { root: ROOT, log: first, nowMs: NOW + HOUR_MS })
  expect(runs.length).toBe(1)
  expect(again.days).toEqual(first.days)
})

test('an unlistable folder or a failed awk rejects, so nothing is guessed', async () => {
  await expect(scanLog(stubIo({ out: [], isListable: false }).io, { root: ROOT, log: EMPTY_LOG, nowMs: NOW })).rejects.toThrow()
  await expect(scanLog(stubIo({ out: [], code: 2 }).io, { root: ROOT, log: EMPTY_LOG, nowMs: NOW })).rejects.toThrow()
})

// The engine beneath the mod: the session's transcript path, the folder listing and awk.
function stubTranscripts(on: any, spec: { isReadable: boolean; now: number }) {
  on('classic.SessionStart', () => ({}))
  const { now } = spec
  on('fs.list', (_: any, e: any) => {
    if (!spec.isReadable) return Promise.reject(new Error('EACCES'))
    if (e.path === ROOT) return { value: [{ name: '-work', kind: 'dir', size: 0, mtimeMs: 0, isLink: false }] }

    return { value: [{ name: `${SESSION_A}.jsonl`, kind: 'file', size: 10, mtimeMs: now, isLink: false }] }
  })
  on('process.spawn', async function* () {
    yield { stream: 'stdout', text: `${[line({ id: 'msg_1', atMs: now }), line({ id: 'msg_2', atMs: now - 9 * DAY_MS })].join('\n')}\n` }

    return { value: { code: 0, signal: null } }
  })
}

// The history card's drawing, by what it says.
const pastSvgOf = async (ui: any) => (await ui.findAll({ type: 'Svg' })).find((svg: any) => String(svg.props.alt).startsWith('Geçmiş'))

async function openPane($: any, on: any, spec: { surface: string; isReadable: boolean }) {
  const clock = stubSession(on)
  stubTranscripts(on, { isReadable: spec.isReadable, now: clock.now() })
  await start($, spec.surface)
  await $.classic.SessionStart({ source: 'startup', transcript_path: `${PROJECT}/${SESSION_A}.jsonl` })
  // Opening the pane starts the read.
  await $.command.run({ command: 'hud', args: 'full' })
  const ui = await $.ui.mount({ ...PANE, surface: spec.surface })
  for (let tick = 0; tick < 5; tick++) await clock.advance(1)

  return ui
}

test('desktop: the history card draws the 7 days, and its switch shows 30', async ($, on) => {
  const ui = await openPane($, on, { surface: 'desktop', isReadable: true })
  const svg = await pastSvgOf(ui)
  expect(svg?.props.alt).toContain('son 7 gün')
  expect(svg?.props.alt).toContain('aktif gün 1/7')
  expect((await ui.find({ type: 'Button', key: 'past-7' }))?.props.variant).toBe('secondary')
  expect((await ui.find({ type: 'Button', key: 'past-30' }))?.props.plain).toBe(true)

  await ui.press({ key: 'past-30' })
  const month = await pastSvgOf(ui)
  expect(month?.props.alt).toContain('son 30 gün')
  expect(month?.props.alt).toContain('aktif gün 2/30')
})

test('terminal: two lines, the figures and a strip of one cell per day', async ($, on) => {
  const ui = await openPane($, on, { surface: 'terminal', isReadable: true })

  expect(await ui.find({ type: 'Text', text: 'Geçmiş' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '1/7 aktif gün · 1 oturum · 100 token · çoğunlukla Opus 5.5' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '······█' })).toBeDefined()
})

for (const surface of ['terminal', 'desktop']) {
  test(`${surface}: unreadable transcripts draw no history at all`, async ($, on) => {
    const ui = await openPane($, on, { surface, isReadable: false })

    expect(await ui.find({ type: 'Button', key: 'past-7' })).toBeUndefined()
    expect(await pastSvgOf(ui)).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: 'Geçmiş' })).toBeUndefined()
  })
}
