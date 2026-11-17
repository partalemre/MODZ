import { expect } from 'claude-code/testing'

import { setLang } from '../hooks/i18n'
import { MATE_W, mateX } from '../hooks/strip-mate'
import { layoutOf, sceneSvg } from '../hooks/strip-scene'
import { talkOf, teamArt, teamFrom } from '../hooks/strip-team'
import { test } from './fixtures'

// The teammate in the strip's scene: their figure, and the one line said between them as a speech bubble.

const MINUTE = 60_000
const NOW = 1_000_000_000_000
const WIDTH = 818
const SKY = { phase: 'day' as const, at: 0.5 }
const steps = Array.from({ length: 8 }, (_, i) => ({ subject: `Step ${i}`, status: i < 3 ? 'completed' : i === 3 ? 'in_progress' : 'pending' }))
const line = (text: string, o: { minutes: number; isMine?: boolean; isAgent?: boolean }) => ({ id: text, name: o.isMine ? '' : 'Ayla', text, ts: NOW - o.minutes * MINUTE, isAgent: o.isAgent ?? false, isMine: o.isMine ?? false })
const team = (o: { unread?: number; isAgent?: boolean; at?: number; recent?: unknown[] } = {}) =>
  teamFrom({
    roomId: 'r1',
    mates: [{ name: 'Ayla', at: o.at ?? NOW - MINUTE }],
    unread: o.unread ?? 0,
    last: { id: 'm1', name: 'Ayla', text: 'Tests pass on my side', ts: NOW, isAgent: o.isAgent ?? false },
    ...(o.recent === undefined ? {} : { recent: o.recent }),
  })!
const scene = (talk?: ReturnType<typeof talkOf>, withSteps = true) =>
  sceneSvg({ width: WIDTH, crew: [], mood: 'working', steps: withSteps ? steps : [], sky: SKY, ...(talk === undefined ? {} : { talk }) })

test('mate: with nobody else on the project the scene draws no teammate and says nothing more', async () => {
  setLang('en')
  const plain = scene()
  expect(plain.source).not.toContain('c-mate')
  expect(plain.alt).not.toContain('Ayla')
})

test('mate: the teammate stands between two stones, far from the session crab, never on the flag', async () => {
  const lay = layoutOf({ width: WIDTH, steps })
  const x = mateX(lay)
  expect(lay.at.some(stone => Math.abs(stone - x) < MATE_W / 2)).toBe(false)
  expect(Math.abs(x - lay.stand)).toBeGreaterThan(WIDTH / 3)
  expect(x).toBeLessThan(lay.x1)
})

test('mate: working breathes, away stands dim; the words are only in the bubble when a line is unread', async () => {
  setLang('en')
  const working = scene(talkOf(team(), NOW))
  expect(working.source).toContain('c-mate')
  expect(working.alt).toContain('Ayla is working now')
  expect(working.source).not.toContain('Tests pass')
  const away = scene(talkOf(team({ at: NOW - 120 * MINUTE }), NOW))
  expect(away.alt).toContain('Ayla is not working right now')
  const unread = scene(talkOf(team({ unread: 1, isAgent: true }), NOW))
  expect(unread.source).toContain('Tests pass on my side')
  expect(unread.alt).toContain("Ayla's AI wrote: Tests pass on my side")
})

test('mate: the chip says how many are new, never the words the scene says', async () => {
  setLang('en')
  const art = teamArt(team({ unread: 2 }), NOW)
  expect(art.full.source).toContain('2 new')
  expect(art.full.source).not.toContain('Tests pass')
})

test("mate: the owner's own newest line shows by his crab, alone, and he stands still while it does", async () => {
  setLang('en')
  const recent = [line('Tests pass on my side', { minutes: 5 }), line('Great, I will review it', { minutes: 1, isMine: true })]
  const talk = talkOf(team({ unread: 1, recent }), NOW)
  expect(talk.mine).toBe('Great, I will review it')
  expect(talk.said).toBeNull()
  const drawn = scene(talk, false)
  expect(drawn.source).toContain('Great, I will review it')
  expect(drawn.source).not.toContain('Tests pass on my side')
  expect(drawn.source).not.toContain('class="amble"')
})

test("mate: an old line of the owner's, a newer line of theirs, or an older transceiver shows no owner's bubble", async () => {
  expect(talkOf(team({ recent: [line('hi', { minutes: 30, isMine: true })] }), NOW).mine).toBeNull()
  expect(talkOf(team({ recent: [line('hi', { minutes: 1, isMine: true }), line('yo', { minutes: 0 })] }), NOW).mine).toBeNull()
  expect(talkOf(team({ unread: 1 }), NOW).said?.text).toBe('Tests pass on my side')
})

test('mate: the scene is the same drawing while nothing changes, as the clock moves on', async () => {
  setLang('en')
  const at = (now: number) => scene(talkOf(team({ unread: 1 }), now)).source
  expect(at(NOW)).toBe(at(NOW + 3 * MINUTE))
})

test('mate: a long line is cut to its bubble, and the bubble stays inside the scene', async () => {
  setLang('en')
  const long = teamFrom({ roomId: 'r1', mates: [{ name: 'Ayla', at: NOW }], unread: 1, last: { id: 'x', name: 'Ayla', text: 'word '.repeat(80), ts: NOW, isAgent: false } })!
  for (const width of [818, 528, 400]) {
    const { source } = sceneSvg({ width, crew: [], mood: 'working', steps, sky: SKY, talk: talkOf(long, NOW) })
    const boxes = [...source.matchAll(/<g transform="translate\(([\d.]+),[\d.]+\)"><path class="card ln"[^>]*\/><rect class="card ln" x="\.5" y="\.5" width="([\d.]+)"/g)]
    expect(boxes.length).toBe(1)
    for (const [, x, w] of boxes) expect(Number(x) + Number(w) + 1).toBeLessThanOrEqual(width)
    expect(source).not.toContain('word '.repeat(60))
  }
})
