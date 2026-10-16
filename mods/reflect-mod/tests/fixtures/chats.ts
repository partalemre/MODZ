// Small past-chat transcripts in the engine's JSONL shape (one row a line), for `/mine`'s tests. Each chat
// holds the frictions the prefilter looks for, plus the rows it must pass over: engine rows, meta rows,
// a slash command, a go-ahead, a secret-shaped prompt and a torn last line.

const typed = (text: string) => ({ type: 'user', message: { role: 'user', content: text } })
const meta = (text: string) => ({ type: 'user', isMeta: true, message: { role: 'user', content: text } })
const bash = (id: string, command: string) => ({
  type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id, name: 'Bash', input: { command } }] },
})
const edit = (id: string) => ({
  type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id, name: 'Edit', input: { file_path: '/repo/a.ts' } }] },
})
const failed = (id: string, text: string) => ({
  type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, is_error: true, content: text }] },
})

const HELD = 'Blast Radius held this command and did not run it: it deletes 9 files. Do not retry it unless the user asks you to.'
const DENIED = 'Permission for this tool use was denied. It requires approval, and this session has no approver.'

const jsonl = (rows: object[], tail = ''): string => `${rows.map(row => JSON.stringify(row)).join('\n')}\n${tail}`

/** Chat A: a correction, a standing ask, a plain prompt, `npm test` failing twice, a held `rm -rf`. */
export const CHAT_A = jsonl([
  { type: 'custom-title', title: 'a' },
  typed('no, use pnpm not npm in this repo'),
  meta('<local-command-caveat>The command below was run directly</local-command-caveat>'),
  typed('<command-name>/mine</command-name>'),
  typed('always answer in English please'),
  typed('run the tests'),
  typed('ok'),
  typed(`my key is sk-${'abcdefghijklmnopqrstuvwx'}`),
  bash('a1', 'npm test'),
  failed('a1', 'Exit code 1\n> weather@1.0.0 test'),
  bash('a2', 'npm test'),
  failed('a2', 'Exit code 2\nnpm ERR! missing script'),
  bash('a3', 'rm -rf build'),
  failed('a3', HELD),
], '{"type":"user","message":{"role":"us')

/** Chat B: the same correction and ask in other words, the prompt again, `npm test` failing, Edit denied, `rm -rf` held. */
export const CHAT_B = jsonl([
  typed("don't use npm, use pnpm in this repo"),
  typed('remember to always answer in English'),
  typed('Run the   tests'),
  typed('Another Claude session sent a message: hi'),
  bash('b1', 'npm test'),
  failed('b1', 'Exit code 1'),
  bash('b2', 'rm -rf build'),
  failed('b2', HELD),
  edit('b3'),
  failed('b3', DENIED),
])

/** Chat C: one of everything, nothing repeated within it. */
export const CHAT_C = jsonl([typed('fix the login bug'), bash('c1', 'ls'), failed('c1', 'Exit code 1')])

/** The running session's own chat: never read as a past one. */
export const CHAT_NOW = jsonl([typed('no, use pnpm not npm in this repo'), typed('no, use pnpm not npm in this repo')])
