import { expect, test } from 'claude-code/testing'

import { MAX_IDEAS, MAX_INPUT_CHARS, ideasPrompt, parseIdeas } from '../hooks/ideas'
import { candidatesOf } from '../hooks/mine'
import { signalsOf } from '../hooks/signals'
import { MAX_CHATS, MAX_FILE_BYTES, MAX_LOOKED, MAX_SCAN_CHARS, MAX_SLUG, TAIL_BYTES, findFolder, projectSlug, projectsBase, readRecent, wholeLines } from '../hooks/transcripts'
import type { Disk, DiskEntry } from '../hooks/transcripts'
import type { Candidate } from '../types'
import { CHAT_A, CHAT_B, CHAT_C } from './fixtures/chats'

// `/mine`'s pure parts: where the chats are, what is read of them, what repeats, and the model's answer.

/** A file system of folders and texts; `reads` and `tails` record every whole read and every tail read. */
function fakeDisk(dirs: Record<string, DiskEntry[]>, texts: Record<string, string> = {}) {
  const reads: string[] = []
  const tails: Array<{ path: string; bytes: number }> = []
  const disk: Disk = {
    exists: async path => path in dirs || path in texts,
    list: async path => dirs[path] ?? [],
    read: async path => {
      reads.push(path)
      if (!(path in texts)) throw new Error('ENOENT')
      return texts[path] ?? ''
    },
    tail: async (path, bytes) => {
      tails.push({ path, bytes })
      return texts[path]
    },
  }
  return { disk, reads, tails }
}

const file = (name: string, mtimeMs: number, size = 10): DiskEntry => ({ name, kind: 'file', size, mtimeMs })

test('the project slug is the path with every non-alphanumeric character as a dash, as the engine names the folder', async () => {
  expect(projectSlug('/Users/me/Projects/MODZ')).toBe('-Users-me-Projects-MODZ')
  expect(projectSlug('/Users/me/.subz-work')).toBe('-Users-me--subz-work')
  expect(projectSlug('/private/tmp/claude-501/-Users-me-x/scratch_pad')).toBe('-private-tmp-claude-501--Users-me-x-scratch-pad')
  expect(projectsBase({ home: '/home/u' })).toBe('/home/u/.claude/projects')
  expect(projectsBase({ home: '/home/u', configDir: '/cfg/claude/' })).toBe('/cfg/claude/projects')

  const long = `/${'deep/'.repeat(50)}repo`
  const head = projectSlug(long).slice(0, MAX_SLUG)
  const base = '/home/u/.claude/projects'
  const { disk } = fakeDisk({ [base]: [{ name: `${head}-k3x9`, kind: 'dir', size: 0, mtimeMs: 0 }], '/home/u/.claude/projects/-repo': [] })
  expect(await findFolder(disk, { base, root: long })).toBe(`${base}/${head}-k3x9`)
  expect(await findFolder(disk, { base, root: '/repo' })).toBe(`${base}/-repo`)
  expect(await findFolder(disk, { base, root: '/other' })).toBeUndefined()
})

test('reads are bounded: the newest 20 chats, the running one left out, big files read from their end, each scan cut', async () => {
  const dir = '/p'
  const entries = [
    ...Array.from({ length: MAX_CHATS + 5 }, (_, i) => file(`s${i}.jsonl`, i)),
    file('now.jsonl', 1000),
    file('huge.jsonl', 999, MAX_FILE_BYTES + 1),
    file('notes.txt', 998),
    { name: 'sub', kind: 'dir' as const, size: 0, mtimeMs: 997 },
  ]
  const texts = Object.fromEntries(entries.map(e => [`${dir}/${e.name}`, 'x'.repeat(e.name === 's24.jsonl' ? MAX_SCAN_CHARS + 50 : 5)]))
  texts['/p/huge.jsonl'] = 'rn row"}\n{"type":"user"}\n'
  const { disk, reads, tails } = fakeDisk({ [dir]: entries }, texts)
  const recent = await readRecent(disk, { folder: dir, currentId: 'now' })

  expect(reads).not.toContain('/p/now.jsonl')
  expect(reads).not.toContain('/p/huge.jsonl')
  expect(reads).toHaveLength(MAX_CHATS - 1)
  expect(tails).toEqual([{ path: '/p/huge.jsonl', bytes: TAIL_BYTES }])
  expect(recent.chats[0]).toEqual({ id: 'huge', text: '{"type":"user"}\n' })
  expect({ partial: recent.partial, skipped: recent.skipped }).toEqual({ partial: 1, skipped: 0 })
  expect(recent.chats.find(c => c.id === 's24')?.text.length).toBe(MAX_SCAN_CHARS)
  expect(await readRecent(disk, { folder: undefined, currentId: 'now' })).toEqual({ chats: [], partial: 0, skipped: 0, hasFolder: false })

  delete texts['/p/huge.jsonl']
  expect((await readRecent(disk, { folder: dir, currentId: 'now' })).skipped).toBe(1)
})

test('runs nobody typed in do not take a chat\'s place, and at most MAX_LOOKED files are opened', async () => {
  const dir = '/p'
  const entries = Array.from({ length: MAX_LOOKED + 20 }, (_, i) => file(`s${i}.jsonl`, -i))
  // Every third file is a conversation; the rest are scripted runs.
  const texts = Object.fromEntries(entries.map((e, i) => [`${dir}/${e.name}`, i % 3 === 0 ? 'talk' : 'script']))
  const { disk, reads } = fakeDisk({ [dir]: entries }, texts)
  const recent = await readRecent(disk, { folder: dir, currentId: 'now', isTalk: text => text === 'talk' })
  expect(recent.chats).toHaveLength(MAX_CHATS)
  expect(recent.chats.every(c => c.text === 'talk')).toBe(true)
  expect(reads.length).toBeLessThanOrEqual(MAX_LOOKED)

  const sparse = Object.fromEntries(entries.map(e => [`${dir}/${e.name}`, 'script']))
  const few = fakeDisk({ [dir]: entries }, sparse)
  expect((await readRecent(few.disk, { folder: dir, currentId: 'now', isTalk: text => text === 'talk' })).chats).toEqual([])
  expect(few.reads).toHaveLength(MAX_LOOKED)
})

test('a tail starts mid-row, so everything before its first line break is dropped', () => {
  expect(wholeLines('torn"}\n{"a":1}\n{"b":2}')).toBe('{"a":1}\n{"b":2}')
  expect(wholeLines('no line break at all')).toBe('')
})

test('a chat reads down to typed prompts, held calls and failed commands; engine rows and a torn line are passed over', () => {
  const a = signalsOf(CHAT_A)
  expect(a.prompts).toEqual(['no, use pnpm not npm in this repo', 'always answer in English please', 'run the tests', 'ok', `my key is sk-${'abcdefghijklmnopqrstuvwx'}`])
  expect(a.holds).toEqual(['Bash'])
  expect(a.failures).toEqual(['npm test', 'npm test'])
  expect(signalsOf(CHAT_B).holds).toEqual(['Bash', 'Edit'])
})

test('the prefilter ranks what repeats across chats, most seen first; one-offs, go-aheads and secrets stay out', () => {
  const found = candidatesOf([CHAT_A, CHAT_B, CHAT_C].map(signalsOf))
  expect(found[0]).toEqual({ kind: 'failing', sample: 'npm test', count: 3, chats: 2 })
  expect(found.slice(1).sort((x, y) => x.kind.localeCompare(y.kind))).toEqual([
    { kind: 'ask', sample: 'always answer in English please', count: 2, chats: 2 },
    { kind: 'correction', sample: 'no, use pnpm not npm in this repo', count: 2, chats: 2 },
    { kind: 'held', sample: 'Bash', count: 2, chats: 2 },
    { kind: 'repeat', sample: 'run the tests', count: 2, chats: 2 },
  ])
  expect(candidatesOf([signalsOf(CHAT_C)])).toEqual([])
})

const CANDS: Candidate[] = [
  { kind: 'correction', sample: 'no, use pnpm not npm', count: 4, chats: 3 },
  { kind: 'held', sample: 'Bash', count: 2, chats: 2 },
]

test('the model answer is parsed strictly; the counts are always the local ones', () => {
  const good = JSON.stringify({ ideas: [
    { type: 'rule', text: 'Use pnpm, not npm, in this repo', why: 'Corrected four times', from: 1, count: 99 },
    { type: 'hook', text: 'Make a hook that allows rm -rf build', why: 'Held twice', from: 2 },
    { type: 'wish', text: 'x', why: 'y', from: 1 },
    { type: 'skill', text: 'two\nlines', why: 'y', from: 1 },
    { type: 'mod', text: 'Make a mod', why: 'y', from: 7 },
    { type: 'rule', text: 'No reason given', from: 1 },
  ] })
  expect(parseIdeas(`Here you go:\n${good}`, CANDS)).toEqual([
    { type: 'rule', text: 'Use pnpm, not npm, in this repo', why: 'Corrected four times', count: 4, chats: 3 },
    { type: 'hook', text: 'Make a hook that allows rm -rf build', why: 'Held twice', count: 2, chats: 2 },
  ])
  const many = JSON.stringify({ ideas: Array.from({ length: 9 }, (_, i) => ({ type: 'rule', text: `Rule ${i}`, why: 'w', from: 1 })) })
  expect(parseIdeas(many, CANDS)).toHaveLength(MAX_IDEAS)
  for (const garbage of ['no json', '{"ideas": "none"}', '{"ideas": [{"type": "wish"}]}', '{broken', '{"ideas": []}'])
    expect(parseIdeas(garbage, CANDS)).toBeUndefined()
})

test('the request holds the strongest candidates that fit, numbered from 1', () => {
  const lots = Array.from({ length: 200 }, (_, i): Candidate => ({ kind: 'repeat', sample: `prompt ${i} ${'x'.repeat(100)}`, count: 2, chats: 1 }))
  const { prompt, sent } = ideasPrompt(lots)
  expect(sent.length).toBeLessThan(lots.length)
  expect(sent[0]).toBe(lots[0])
  expect(prompt.length).toBeLessThan(MAX_INPUT_CHARS + '<candidates>\n\n</candidates>'.length + sent.length)
  expect(prompt).toContain('"index":1,')
})
