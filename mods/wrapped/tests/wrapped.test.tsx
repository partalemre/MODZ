import { expect, mock, test } from 'claude-code/testing'

import { cardText, rowsOf, standalone } from '../hooks/card'
import { setLang } from '../hooks/kit/lang'
import { concatList, FPS, frameAt, frameCount, holdsOf } from '../hooks/film'
import { postUrl } from '../hooks/share'
import { pagePic, pageWidth, slidesFor, summaryPic } from '../hooks/story'
import { parseOutput, rootOf, transcriptPaths } from '../hooks/scan'
import { isWrapped, longestStreak, modelLabel, monthsOf, personaOf, weekdaysOf, wrappedOf } from '../hooks/stats'
import type { Raw } from '../hooks/scan'

// A film test draws every frame, a few seconds of work that a busy machine stretches past the default limit.
const FILM_TEST = { timeoutMs: 30_000 }

const OUTPUT = [
  'X\t3\t7\t123.5\t4000\t260000',
  'P\t2026-03-01T12\t10',
  'P\t2026-03-02T12\t20',
  'P\t2026-03-04T12\t5',
  'R\t2026-03-01T12\t100',
  'T\tBash\t50',
  'T\tAgent\t2',
  'O\tclaude-opus-5-5-20261001\t90',
  'O\tclaude-sonnet-5\t10',
  'C\t/Users/me/secret-client\t35',
  'S\t30',
  'S\t5',
  'F\t/Users/me/secret-client/src/pricing.ts\t9',
  'F\t/private/tmp/scratch.ts\t99',
  'B\tbackend\t40\t900\tFix the secret-client invoice',
  'G\tgeneral-purpose\t8\t30\t500',
  'G\tbackend\t2\t50\t900',
  'N\t2026-03\tgeneral-purpose\t8',
  'N\t2026-03\tbackend\t2',
  'M\t2026-03\t/Users/me/secret-client\t30',
  'M\t2026-03\t/Users/me/other\t5',
  'garbage line',
].join('\n')

const SPEC = { year: 2026, readAt: 1 }
const rawOf = (): Raw => parseOutput(OUTPUT)

test('awk output reads into totals, and a line that does not read is dropped', () => {
  const raw = rawOf()
  expect(raw.stops).toBe(3)
  expect(raw.rightCount).toBe(7)
  expect(raw.outputTokens).toBe(260000)
  expect(raw.tools.Bash).toBe(50)
  expect(raw.chats).toEqual([30, 5])
  expect(parseOutput('X\tnot-a-number').stops).toBe(0)
})

test('the year comes to days, a streak, the top names and no scratch file', () => {
  const w = wrappedOf(rawOf(), SPEC)
  if (w === null) throw new Error('expected a reading')
  expect(w.prompts).toBe(35)
  expect(w.sessions).toBe(2)
  expect(w.activeDays).toBe(3)
  expect(w.streak).toBe(2)
  expect(w.busiestDay?.count).toBe(20)
  expect(w.topFile).toEqual({ name: 'pricing.ts', count: 9 })
  expect(w.topProject?.name).toBe('secret-client')
  expect(w.longestChat).toBe(30)
  expect(isWrapped(w)).toBe(true)
})

test('agents are ranked by work done, the hardest run named, and each month told apart', () => {
  const w = wrappedOf(rawOf(), SPEC)
  if (w === null) throw new Error('expected a reading')
  expect(w.agentRuns).toBe(10)
  expect(w.agentTools).toBe(80)
  expect(w.agents[0]?.type).toBe('backend')
  expect(w.hardest?.description).toBe('Fix the secret-client invoice')
  expect(monthsOf(rawOf())).toEqual([{ month: '2026-03', prompts: 35, runs: 10, project: 'secret-client', agent: 'general-purpose' }])
})

const allHolds = (spec: Parameters<typeof holdsOf>[0]) => [...holdsOf(spec)]

test('the film runs at 60 frames, hides names on every frame when masked, and shows them when on', FILM_TEST, () => {
  setLang('en')
  const w = wrappedOf(rawOf(), SPEC)
  if (w === null) throw new Error('expected a reading')
  expect(FPS).toBe(60)
  const hidden = { wrapped: w, isNamed: false }
  const slides = slidesFor(w)
  const holds = allHolds(hidden)
  expect(holds.reduce((sum, hold) => sum + hold.frames, 0)).toBe(frameCount(slides))
  // The moves really run at that rate: most frames are pictures of their own, not one held.
  expect(holds.length).toBeGreaterThan(frameCount(slides) / 2)
  for (const hold of holds) {
    expect(hold.source).not.toContain('secret-client')
    expect(hold.source).not.toContain('pricing.ts')
    expect(hold.source).not.toContain('<style>')
  }
  expect(holds.some(hold => hold.source.includes('Project A'))).toBe(true)
  expect(frameAt({ wrapped: w, isNamed: true }, slides, Math.round(slides.slice(0, 5).reduce((sum, slide) => sum + slide.dur, 0) * FPS) + 240)).toContain('secret-client')
})

test('a year with no agents drops their pages and still has a film', FILM_TEST, () => {
  const lone = parseOutput('X\t0\t0\t0\t0\t0\nP\t2026-03-01T12\t10\nS\t10\nM\t2026-03\t/w\t10')
  const w = wrappedOf(lone, SPEC)
  if (w === null) throw new Error('expected a reading')
  const keys = slidesFor(w).map(slide => slide.key)
  expect(keys).not.toContain('crew')
  expect(keys).not.toContain('hardest')
  expect(allHolds({ wrapped: w, isNamed: false }).length).toBeGreaterThan(1)
})

test('the year adds its busiest weekday, hours, top lists and models', () => {
  const w = wrappedOf(rawOf(), SPEC)
  if (w === null) throw new Error('expected a reading')
  expect(w.busiestDay?.name).toBe('2026-03-02')
  expect(w.weekdays.reduce((sum, count) => sum + count, 0)).toBe(35)
  expect(weekdaysOf({ '2026-03-02': 20 })[0]).toBe(20)
  expect(w.hours.reduce((sum, count) => sum + count, 0)).toBe(35)
  expect(w.projects[0]).toEqual({ name: 'secret-client', count: 35 })
  expect(w.tools[0]).toEqual({ name: 'Bash', count: 50 })
  expect(w.files.map(file => file.name)).toEqual(['pricing.ts'])
  expect(w.models).toEqual([{ name: 'Opus 5.5', count: 90 }, { name: 'Sonnet 5', count: 10 }])
  expect(modelLabel('something-else')).toBe('something-else')
})

test('a saved reading from before the new figures is refused, so it is read again', () => {
  const w = wrappedOf(rawOf(), SPEC)
  if (w === null) throw new Error('expected a reading')
  const { projects: _gone, ...older } = w
  expect(isWrapped(older)).toBe(false)
})

test('the concat list holds each picture and repeats the last', () => {
  const list = concatList('/d', [{ frames: 60 }, { frames: 30 }])
  expect(list.split('\n')).toEqual(["file '/d/f00000.png'", 'duration 1.00000', "file '/d/f00001.png'", 'duration 0.50000', "file '/d/f00001.png'", ''])
})

test('a year with no prompt has no card, and a damaged saved reading is refused', () => {
  expect(wrappedOf(parseOutput('X\t0\t0\t0\t0\t0'), SPEC)).toBeNull()
  expect(isWrapped({ year: 2026 })).toBe(false)
  expect(isWrapped(null)).toBe(false)
})

test('the streak counts days in a row and skips gaps', () => {
  expect(longestStreak(['2026-01-01', '2026-01-02', '2026-01-03', '2026-02-10'])).toBe(3)
  expect(longestStreak(['2026-12-31'])).toBe(1)
  expect(longestStreak([])).toBe(0)
})

test('each persona follows its own measure', () => {
  const base = { prompts: 100, agentCalls: 0, nightShare: 0, average: 10, stops: 0 }
  expect(personaOf(base)).toBe('builder')
  expect(personaOf({ ...base, nightShare: 0.4 })).toBe('owl')
  expect(personaOf({ ...base, agentCalls: 30 })).toBe('commander')
  expect(personaOf({ ...base, stops: 15 })).toBe('director')
  expect(personaOf({ ...base, average: 40 })).toBe('marathoner')
  expect(personaOf({ ...base, average: 2 })).toBe('sprinter')
})

test('a mask takes names off every page, the shared image, the text and the post', () => {
  setLang('en')
  const wrapped = wrappedOf(rawOf(), SPEC)
  if (wrapped === null) throw new Error('expected a reading')
  const hidden = { wrapped, isNamed: false }
  const pages = slidesFor(wrapped).map((_, index) => pagePic(hidden, index, 360).source)
  for (const text of [...pages, summaryPic(hidden).source, cardText(hidden)]) {
    expect(text).not.toContain('pricing.ts')
    expect(text).not.toContain('secret-client')
  }
  expect(rowsOf(hidden).some(row => row.value === '9 edits')).toBe(true)
  const named = { wrapped, isNamed: true }
  expect(cardText(named)).toContain('pricing.ts')
  expect(summaryPic(named).source).toContain('secret-client')
  expect(decodeURIComponent(postUrl(named))).not.toContain('secret-client')
})

test('a page takes the width it is given, at 9:16', () => {
  setLang('en')
  const wrapped = wrappedOf(rawOf(), SPEC)
  if (wrapped === null) throw new Error('expected a reading')
  const pic = pagePic({ wrapped, isNamed: true }, 99, 360)
  expect([pic.width, pic.height]).toEqual([360, 640])
  expect(pic.source).toContain('viewBox="0 0 540 960"')
  // A frame clips markup bigger than itself, so the markup says the size it is drawn at.
  expect(pic.source).toContain('width="360" height="640"')
})

test('a page fits the pane both ways and leaves the buttons on screen', () => {
  const heightOf = (width: number) => (width * 16) / 9
  // A small window that says no rows: the height decides, and the page and its buttons stay within it.
  expect(heightOf(pageWidth(32, 0)) + 190).toBeLessThanOrEqual(591)
  // A tall pane: the width decides, never past the pane.
  expect(pageWidth(32, 80)).toBe(288)
  expect(pageWidth(80, 200)).toBe(400)
  // A very short pane keeps the page readable, a very narrow one keeps it inside.
  expect(pageWidth(32, 5)).toBe(180)
  expect(pageWidth(15, 0)).toBe(135)
})

test('the shared file stands alone: no style, no theme class, its colours on it', () => {
  setLang('en')
  const wrapped = wrappedOf(rawOf(), SPEC)
  if (wrapped === null) throw new Error('expected a reading')
  const saved = standalone(summaryPic({ wrapped, isNamed: false }))
  expect(saved).not.toContain('<style>')
  expect(saved).not.toContain('class="f-')
  expect(saved).toContain('fill="#')
})

test('a Turkish card speaks Turkish', () => {
  setLang('tr')
  const wrapped = wrappedOf(rawOf(), SPEC)
  if (wrapped === null) throw new Error('expected a reading')
  expect(cardText({ wrapped, isNamed: false })).toContain('Claude Code ile 2026 yılım')
  setLang('en')
})

test('the paths take sessions from the year and subagents beside them', async () => {
  const dirs: Record<string, Array<{ name: string; kind: string; size: number; mtimeMs: number }>> = {
    '/r': [{ name: 'p', kind: 'dir', size: 0, mtimeMs: 0 }],
    '/r/p': [
      { name: 'old.jsonl', kind: 'file', size: 1, mtimeMs: 5 },
      { name: 'new.jsonl', kind: 'file', size: 1, mtimeMs: 50 },
      { name: 'new', kind: 'dir', size: 0, mtimeMs: 0 },
      { name: 'memory', kind: 'dir', size: 0, mtimeMs: 0 },
    ],
    '/r/p/new/subagents': [
      { name: 'agent-1.jsonl', kind: 'file', size: 1, mtimeMs: 50 },
      { name: 'agent-1.meta.json', kind: 'file', size: 1, mtimeMs: 50 },
    ],
  }
  const list = async (dir: string) => {
    const found = dirs[dir]
    if (found === undefined) throw new Error('ENOENT')

    return found
  }
  expect(await transcriptPaths(list, '/r', 10)).toEqual(['/r/p/new/subagents/agent-1.meta.json', '/r/p/new.jsonl', '/r/p/new/subagents/agent-1.jsonl'])
  expect(rootOf('/home/me/.claude/projects/-work/abc.jsonl')).toBe('/home/me/.claude/projects')
  expect(rootOf('')).toBe('')
})

const PANE = {
  plugin: 'wrapped',
  component: 'Pane',
  requestId: 'wrapped',
  surface: 'desktop',
  props: { title: 'Wrapped', isFocused: true, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
} as const

const TRANSCRIPT = '/home/me/.claude/projects/-work/abc.jsonl'

// The engine's edges: the transcripts' folder, awk's answer, the disk and the converter.
function world(on: any, o: { awk: { exitCode: number; stdout: string; stderr: string }; sips?: number; ffmpeg?: number }) {
  const store = new Map<string, unknown>()
  const written = new Map<string, string>()
  const runs: string[][] = []
  mock.env(on, { MODZ_LANG: 'en', HOME: '/home/me' })
  on('command.register', () => ({ value: { command: 'wrapped' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: any) => ({ cwd: e.cwd }))
  on('classic.SessionStart', () => ({}))
  on('store.get', (_: unknown, e: any) => ({ value: store.get(e.key) }))
  on('store.set', (_: unknown, e: any) => {
    store.set(e.key, e.value)

    return { value: undefined }
  })
  on('fs.list', (_: unknown, e: any) => ({ value: e.path.endsWith('projects') ? [{ name: '-work', kind: 'dir', size: 0, mtimeMs: 0 }] : [{ name: 'abc.jsonl', kind: 'file', size: 9, mtimeMs: Date.UTC(2030, 0, 2) }] }))
  on('fs.write', (_: unknown, e: any) => {
    written.set(e.path, e.text)

    return { value: undefined }
  })
  on('process.run', (_: unknown, e: any) => {
    runs.push([...e.argv])

    if (e.argv[0] === 'awk') return { value: o.awk }
    const isEncode = e.argv[0] === 'ffmpeg' && e.argv.length > 2

    return { value: { exitCode: isEncode ? (o.ffmpeg ?? 0) : e.argv[0] === 'sips' ? (o.sips ?? 0) : 0, stdout: '', stderr: isEncode ? 'boom' : '' } }
  })

  return { store, written, runs }
}

async function opened($: any, on: any, o: Parameters<typeof world>[1] & { surface?: 'desktop' | 'terminal' }) {
  const edges = world(on, o)
  const clock = mock.clock(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.classic.SessionStart({ source: 'startup', transcript_path: TRANSCRIPT })
  const ran = await $.command.run({ command: 'wrapped', args: '2026' })
  const ui = await $.ui.mount({ ...PANE, surface: o.surface ?? 'desktop' })

  return { ...edges, ran, ui, clock }
}

const READS = { exitCode: 0, stdout: OUTPUT, stderr: '' }

test('/wrapped refuses a year that is not one, and reads nothing', async ($: any, on: any) => {
  const edges = world(on, { awk: READS })
  mock.clock(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ran = await $.command.run({ command: 'wrapped', args: 'rm -rf' })
  expect(ran.text).toContain('Give a year')
  expect(edges.runs).toEqual([])
})

test('desktop: the read shows progress, then pages with names; next moves; masking hides them; copying saves a PNG', async ($: any, on: any) => {
  const { ui, clock, runs, store, written } = await opened($, on, { awk: READS })
  expect(await ui.find({ type: 'Text', text: /Reading your 2026/ })).toBeDefined()
  for (let tick = 0; tick < 5; tick += 1) await clock.advance(1)
  expect(runs[0]?.[0]).toBe('awk')
  expect(runs[0]).toContain('YEAR=2026')
  expect(isWrapped(store.get('wrapped.2026'))).toBe(true)
  const first = (await ui.find({ type: 'Svg' }))?.props
  // A frame's own margin would push the page out past its edge.
  expect(first?.source).toContain('body{margin:0}')
  expect(first?.isInteractive).toBe(true)
  await ui.press({ key: 'next' })
  expect((await ui.find({ type: 'Svg' }))?.props.source).not.toBe(first?.source)
  await ui.press({ key: 'back' })
  await ui.press({ key: 'back' })
  expect((await ui.find({ type: 'Svg' }))?.props.source).toBe(first?.source)

  await ui.press({ key: 'copy-image' })
  expect(String(written.get('/home/me/Downloads/wrapped-2026.svg'))).toContain('secret-client')
  expect(runs.map(run => run[0])).toEqual(['awk', 'sips', 'osascript'])
  expect(await ui.find({ type: 'Text', text: /Copied: .*wrapped-2026\.png/ })).toBeDefined()

  await ui.press({ key: 'names' })
  await ui.press({ key: 'copy-image' })
  expect(String(written.get('/home/me/Downloads/wrapped-2026.svg'))).not.toContain('secret-client')
})

test('sharing on X copies the image and opens a post with the words filled in, sending nothing itself', async ($: any, on: any) => {
  const { ui, clock, runs } = await opened($, on, { awk: READS })
  for (let tick = 0; tick < 5; tick += 1) await clock.advance(1)
  await ui.press({ key: 'share-x' })
  expect(runs.map(run => run[0]).slice(-3)).toEqual(['sips', 'osascript', 'open'])
  expect(String(runs.at(-1)?.[1])).toContain('https://x.com/intent/post?text=')
  expect(await ui.find({ type: 'Text', text: /Cmd\+V/ })).toBeDefined()
})

test('the film button draws, encodes, opens the video and removes its frames', FILM_TEST, async ($: any, on: any) => {
  const { ui, clock, runs, written } = await opened($, on, { awk: READS })
  for (let tick = 0; tick < 5; tick += 1) await clock.advance(1)
  await ui.press({ key: 'film' })
  expect(await ui.find({ type: 'Text', text: /Making the video/ })).toBeDefined()
  for (let tick = 0; tick < 5; tick += 1) await clock.advance(1)
  const commands = runs.map(run => run[0])
  expect(commands).toContain('sips')
  expect(commands.slice(-3)).toEqual(['ffmpeg', 'open', 'rm'])
  expect(runs.at(-3)).toContain('/home/me/Downloads/wrapped-2026.mp4')
  expect(runs.at(-1)?.at(-1)).toBe('/tmp/wrapped-film-2026')
  expect([...written.keys()].some(path => path.startsWith('/tmp/wrapped-film-2026/f'))).toBe(true)
  expect(await ui.find({ type: 'Text', text: /Video saved/ })).toBeDefined()
})

test('a failed encode says why and still removes the frames', FILM_TEST, async ($: any, on: any) => {
  const { ui, clock, runs } = await opened($, on, { awk: READS, ffmpeg: 1 })
  for (let tick = 0; tick < 5; tick += 1) await clock.advance(1)
  await ui.press({ key: 'film' })
  for (let tick = 0; tick < 5; tick += 1) await clock.advance(1)
  expect(await ui.find({ type: 'Text', text: /No video: ffmpeg/ })).toBeDefined()
  expect(runs.at(-1)?.[0]).toBe('rm')
  expect(runs.map(run => run[0])).not.toContain('open')
})

test('with no converter the image is not copied and its SVG is named', async ($: any, on: any) => {
  const { ui, clock, runs } = await opened($, on, { awk: READS, sips: 1 })
  for (let tick = 0; tick < 5; tick += 1) await clock.advance(1)
  await ui.press({ key: 'copy-image' })
  expect(runs.map(run => run[0])).not.toContain('osascript')
  expect(await ui.find({ type: 'Text', text: /Could not copy.*wrapped-2026\.svg/ })).toBeDefined()
})

test('terminal: the same figures as text', async ($: any, on: any) => {
  const { ui, clock } = await opened($, on, { awk: READS, surface: 'terminal' })
  for (let tick = 0; tick < 5; tick += 1) await clock.advance(1)
  expect(await ui.find({ type: 'Text', text: /My 2026 with Claude Code/ })).toBeDefined()
  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
})

test('a failed awk says so', async ($: any, on: any) => {
  const { ui, clock } = await opened($, on, { awk: { exitCode: 2, stdout: '', stderr: 'awk: boom' } })
  for (let tick = 0; tick < 5; tick += 1) await clock.advance(1)
  expect(await ui.find({ type: 'Text', text: /could not be read/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /awk: boom/ })).toBeDefined()
})

test('an empty year explains where transcripts go', async ($: any, on: any) => {
  const { ui, clock } = await opened($, on, { awk: { exitCode: 0, stdout: 'X\t0\t0\t0\t0\t0', stderr: '' } })
  for (let tick = 0; tick < 5; tick += 1) await clock.advance(1)
  expect(await ui.find({ type: 'Text', text: /cleanupPeriodDays/ })).toBeDefined()
})
