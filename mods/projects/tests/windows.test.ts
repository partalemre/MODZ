import { expect, test } from 'claude-code/testing'

import { withClearNames } from '../hooks/build'
import { pathsOf } from '../hooks/collect'
import { cutWorktree, isMachinery, resolveRoots } from '../hooks/roots'
import { parseOutput, scanFiles } from '../hooks/scan'
import type { ScanIo } from '../hooks/scan'
import { plainRows } from '../hooks/scan-plain'
import type { Project } from '../types'

// No Windows machine runs these: its paths and its missing programs are stand-ins.

const named = (root: string): Pick<Project, 'root' | 'name'> => ({ root, name: 'app' })

test('the Windows way of naming things: a transcript, a working folder, its worktree, its name', () => {
  expect(pathsOf('C:\\Users\\me\\.claude\\projects\\x\\s.jsonl', 'C:\\Users\\me')?.config).toBe('C:\\Users\\me\\.claude')
  expect(pathsOf('/home/me/.claude/projects/x/s.jsonl', '/home/me')?.config).toBe('/home/me/.claude')
  expect(pathsOf('/home/a\\b/.claude/projects/x/s.jsonl', '')?.config).toBe('/home/a\\b/.claude')
  expect(cutWorktree('C:\\w\\app\\.claude\\worktrees\\one')).toBe('C:\\w\\app')
  expect(isMachinery('C:\\Users\\me\\AppData\\Local\\x', 'C:\\Users\\me')).toBe(true)
  expect(isMachinery('C:\\Users\\me\\code\\app', 'C:\\Users\\me')).toBe(false)
  expect(withClearNames([named('C:\\a\\app'), named('C:\\b\\app')]).map(one => one.name)).toEqual(['a/app', 'b/app'])
  expect(parseOutput('F\t/s.jsonl\tC:\\\\w\\\\app\t\t\t\t0\n').get('/s.jsonl')?.cwd).toBe('C:\\w\\app')
})

test('a Windows folder under a Windows home takes its own name', async () => {
  const io = { exists: async () => false, read: async () => '', isDir: async () => false }
  const roots = await resolveRoots(['C:\\w\\app\\inner', 'C:\\w\\app'], new Set(['C:\\w\\app']), { io, home: 'C:\\Users\\me' })
  expect(roots.get('C:\\w\\app\\inner')?.root).toBe('C:\\w\\app')
})

// Run through the real awk by hand when AWK changes: these rows are what it printed for this transcript.
const TRANSCRIPT = [
  '{"type":"user","cwd":"/w/app","timestamp":"2026-11-04T10:00:00.000Z"}',
  '{"type":"ai-title","aiTitle":"First"}',
  '{"type":"custom-title","customTitle":"Chosen"}',
  '{"type":"assistant","timestamp":"2026-11-04T10:00:01.000Z","message":{"model":"opus","id":"msg_a","content":[{"type":"text"}],"usage":{"input_tokens":1,"cache_creation_input_tokens":2,"cache_read_input_tokens":3,"output_tokens":4}}}',
  '{"type":"assistant","timestamp":"2026-11-04T10:00:02.000Z","message":{"model":"opus","id":"msg_a","content":[{"type":"tool_use"}],"usage":{"input_tokens":1,"cache_creation_input_tokens":2,"cache_read_input_tokens":3,"output_tokens":9}}}',
  '{"type":"assistant","timestamp":"2026-11-04T10:00:03.000Z","message":{"model":"haiku","id":"msg_b","content":[],"usage":{"input_tokens":5,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":1}}}',
  '{"type":"assistant","timestamp":"2026-11-04T10:00:04.000Z","message":{"model":"<synthetic>","id":"msg_c","content":[],"usage":{"input_tokens":7,"cache_creation_input_tokens":7,"cache_read_input_tokens":7,"output_tokens":7}}}',
  'a cut line with no json',
  '',
].join('\n')

test('the plain reader gives what awk gives', () => {
  const awk = 'F\t/p/s.jsonl\t/w/app\tChosen\t2026-11-04T10:00:00.000Z\t2026-11-04T10:00:04.000Z\t1\nU\t/p/s.jsonl\thaiku\t5\t0\t0\t1\t1\nU\t/p/s.jsonl\topus\t1\t2\t3\t9\t1\nU\t/p/s.jsonl\t<synthetic>\t7\t7\t7\t7\t1\n'
  expect(parseOutput(plainRows('/p/s.jsonl', TRANSCRIPT))).toEqual(parseOutput(awk))
  expect(plainRows('/p/empty.jsonl', '')).toBe('')
})

const scanIo = (spawn: ScanIo['spawn'], read: ScanIo['read']): ScanIo => ({
  list: async dir => (dir === '/r' ? [{ name: 'p', kind: 'dir', size: 0, mtimeMs: 0 }] : dir === '/r/p' ? [{ name: 'a.jsonl', kind: 'file', size: 1, mtimeMs: 1 }, { name: 'gone.jsonl', kind: 'file', size: 1, mtimeMs: 1 }] : []),
  read, spawn,
})
// As the engine's stream does when a program cannot start: its first pull rejects.
const noAwk = (): ReturnType<ScanIo['spawn']> => Object.assign((async function* () { yield await Promise.reject<{ stream: string; text: string }>(new Error('spawn awk ENOENT')) })(), { result: Promise.resolve({ code: null }) })

test('with no awk the transcripts are read here, once a batch, and one gone costs only itself', async () => {
  let spawns = 0
  const read = async (path: string) => { if (path.endsWith('a.jsonl')) return TRANSCRIPT; throw new Error('gone') }
  const sums = await scanFiles(scanIo(() => { spawns += 1; return noAwk() }, read), '/r', {})
  expect(Object.keys(sums)).toEqual(['/r/p/a.jsonl'])
  expect(sums['/r/p/a.jsonl']).toMatchObject({ cwd: '/w/app', title: 'Chosen', tools: 1, models: { opus: { output: 9, replies: 1 } } })
  expect(spawns).toBe(1)
})

test('with no awk and nothing readable the scan rejects, so the last good list stays', async () => {
  const fails = scanFiles(scanIo(noAwk, async () => { throw new Error('gone') }), '/r', {})
  expect(await fails.then(() => 'read', (error: Error) => error.message)).toContain('spawn awk ENOENT')
})
