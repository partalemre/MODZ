// Session transcripts as Claude Code writes them (one JSON record per line), for the tests that go back through
// earlier turns and sessions: a past session with a subagent, a failed edit, Writes of every kind and torn lines;
// this session; one with no edits; and one too large to read whole.

export const DIR = '/home/.claude/projects/-w'
export const NOW_ID = 's-now'
export const OLD_ID = 's-old'
export const EMPTY_ID = 's-empty'
export const BIG_ID = 's-big'
// Over the engine's 4 MiB whole-file read: listed with this size, the file streams through `dd`.
export const BIG_SIZE = 5_000_000

// Midday UTC, so the day is the same in nearly every time zone.
const DAY = { old: Date.UTC(2026, 9, 12, 12, 0), now: Date.UTC(2026, 9, 13, 12, 0) }
const MINUTE_MS = 60_000
const at = (day: number, minute: number) => new Date(day + minute * MINUTE_MS).toISOString()

type Line = (day: number) => string

const prompt = (minute: number, content: unknown, extra: Record<string, unknown> = {}): Line => day =>
  JSON.stringify({ type: 'user', timestamp: at(day, minute), isSidechain: false, message: { role: 'user', content }, ...extra })
const said = (minute: number, text: string): Line => day =>
  JSON.stringify({ type: 'assistant', timestamp: at(day, minute), message: { role: 'assistant', content: [{ type: 'text', text }] } })
const use = (minute: number, id: string, name: string, input: Record<string, unknown>): Line => day =>
  JSON.stringify({ type: 'assistant', timestamp: at(day, minute), message: { role: 'assistant', content: [{ type: 'tool_use', id, name, input }] } })
const result = (minute: number, id: string, opts: { isError?: boolean; detail?: Record<string, unknown> } = {}): Line => day =>
  JSON.stringify({ type: 'user', timestamp: at(day, minute), message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: 'ok', ...(opts.isError ? { is_error: true } : {}) }] }, ...(opts.detail === undefined ? {} : { toolUseResult: opts.detail }) })
const noise: Line = () => JSON.stringify({ type: 'attachment', attachment: { type: 'skill_listing', content: 'x'.repeat(200) } })

const TODOS = [
  { content: 'Rename the function', status: 'in_progress', activeForm: 'Renaming' },
  { content: 'Update the docs', status: 'pending', activeForm: 'Updating' },
]

const OLD: Line[] = [
  noise,
  prompt(0, [{ type: 'text', text: 'Rename greet to welcome everywhere' }]),
  prompt(0, '<system-reminder>not the person</system-reminder>', { isMeta: true }),
  use(1, 'todo1', 'TodoWrite', { todos: TODOS }),
  result(1, 'todo1'),
  said(2, 'I rename the function first, then the docs.'),
  use(2, 'e1', 'Edit', { file_path: '/w/src/greet.js', old_string: 'export function greet(name) {', new_string: 'export function welcome(name) {' }),
  result(2, 'e1', { detail: { filePath: '/w/src/greet.js', originalFile: 'not used for an Edit' } }),
  use(3, 'e2', 'Edit', { file_path: '/w/README.md', old_string: 'nowhere', new_string: 'there' }),
  result(3, 'e2', { isError: true }),
  () => '{"type":"assistant","message": {torn',
  use(4, 'agent1', 'Agent', { description: 'Update the docs', prompt: 'rename in docs' }),
  result(9, 'agent1'),
  prompt(10, 'Add a changelog'),
  said(11, 'Creating the changelog.'),
  use(11, 'w1', 'Write', { file_path: '/w/CHANGELOG.md', content: '# Changes\n- greet is now welcome\n' }),
  result(11, 'w1', { detail: { type: 'create' } }),
  use(12, 'w2', 'Write', { file_path: '/w/notes.txt', content: 'notes v2\nsame\n' }),
  result(12, 'w2', { detail: { type: 'update', originalFile: 'notes v1\nsame\n' } }),
  use(13, 'w3', 'Write', { file_path: '/w/other.txt', content: 'only the new text\n' }),
  prompt(20, '<command-name>/replay</command-name><command-args>sessions</command-args>'),
  () => 'not json at all',
]

// The subagent's edit lands after the next prompt; its meta file ties it to the turn that started it.
const SUBAGENT: Line[] = [
  said(15, 'Updating the guide.'),
  use(15, 'se1', 'Edit', { file_path: '/w/docs/guide.md', old_string: 'call greet()', new_string: 'call welcome()' }),
  result(15, 'se1'),
]

const NOW: Line[] = [prompt(0, 'Fix the greeting'), said(1, 'Fixing the typo.'), use(1, 'n1', 'Edit', { file_path: '/w/src/greet.js', old_string: 'Hi', new_string: 'Hello' }), result(1, 'n1')]
const EMPTY: Line[] = [prompt(0, 'What does this repo do?'), said(1, 'It greets people.')]
const BIG: Line[] = [noise, prompt(0, 'Big refactor'), use(1, 'b1', 'Edit', { file_path: '/w/big.js', old_string: 'a', new_string: 'b' }), result(1, 'b1')]

const text = (lines: Line[], day: number) => `${lines.map(line => line(day)).join('\n')}\n`

export const TEXTS = {
  old: text(OLD, DAY.old),
  subagent: text(SUBAGENT, DAY.old),
  now: text(NOW, DAY.now),
  empty: text(EMPTY, DAY.old - MINUTE_MS * 60 * 24),
  big: text(BIG, DAY.old - MINUTE_MS * 60 * 2),
}

type Entry = { name: string; kind: string; size: number; mtimeMs: number; isLink: boolean }
const file = (name: string, size: number, mtimeMs: number): Entry => ({ name, kind: 'file', size, mtimeMs, isLink: false })

// The folder listings and file texts of the transcripts, for a test world's file system.
export function archiveWorld(): { dirs: Record<string, Entry[]>; files: Record<string, string> } {
  const sub = `${DIR}/${OLD_ID}/subagents`

  return {
    dirs: {
      [DIR]: [
        file(`${NOW_ID}.jsonl`, TEXTS.now.length, DAY.now + MINUTE_MS),
        file(`${OLD_ID}.jsonl`, TEXTS.old.length, DAY.old + 20 * MINUTE_MS),
        file(`${EMPTY_ID}.jsonl`, TEXTS.empty.length, DAY.old - MINUTE_MS * 60 * 24),
        file(`${BIG_ID}.jsonl`, BIG_SIZE, DAY.old - MINUTE_MS * 60 * 2),
        { name: OLD_ID, kind: 'dir', size: 0, mtimeMs: 0, isLink: false },
      ],
      [sub]: [file('agent-x1.jsonl', TEXTS.subagent.length, DAY.old), file('agent-x1.meta.json', 40, DAY.old)],
    },
    files: {
      [`${DIR}/${NOW_ID}.jsonl`]: TEXTS.now,
      [`${DIR}/${OLD_ID}.jsonl`]: TEXTS.old,
      [`${DIR}/${EMPTY_ID}.jsonl`]: TEXTS.empty,
      [`${sub}/agent-x1.jsonl`]: TEXTS.subagent,
      [`${sub}/agent-x1.meta.json`]: JSON.stringify({ agentType: 'general-purpose', toolUseId: 'agent1' }),
    },
  }
}
