// Reading a shell line closely enough to find each command in it: quoted text, a backslash's
// next character, `$( … )` and a heredoc's body are text, never a separator or a command.

const HEREDOC = /^<<-?\s*(['"]?)([A-Za-z0-9_.-]+)\1/
// Redirect targets that keep nothing: writing there loses no file.
const HARMLESS_TARGET = /^\/dev\/(?:null|zero|stdout|stderr|tty|fd\/\d+)$/
// Temp folders, as written or as the shell will fill them in: nothing there is the person's work.
export const TEMP_PATH = /^(?:\/tmp|\/private\/tmp|\/var\/folders|\$\{?TMPDIR\}?|\$\{?TMP\}?)\//
const WORD_END = /[\s;|&<>()]/

/** `\rm` skips aliases and `/bin/rm` names a path; both are still rm. */
export const commandName = (word: string): string => word.replace(/^\\/, '').split('/').pop() ?? ''

/** A folder a later `cd arg` moves to, given the folder so far (null = the session folder). */
export function joinDir(dir: string | null, arg: string | undefined): string {
  if (arg === undefined || arg === '~' || arg.startsWith('/') || arg.startsWith('~/')) {
    return arg ?? '~'
  }

  return dir ? `${dir}/${arg}` : arg
}

/** Splits one segment into words, honouring quotes. Good enough to read flags and paths. */
export function tokenize(text: string): string[] {
  const words: string[] = []
  for (const match of text.matchAll(/"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+)/g)) {
    words.push(match[1] ?? match[2] ?? match[3] ?? '')
  }

  return words
}

/** Where the quoted, escaped or substituted text starting at `at` ends (the index after it), or -1 when `at` starts none. */
function opaqueEnd(text: string, at: number): number {
  const c = text[at]
  if (c === '\\') return at + 2
  if (c === "'") return closeAt(text, at + 1, "'")
  if (c === '"') return closeAt(text, at + 1, '"')
  if (c === '`') return closeAt(text, at + 1, '`')
  if (c !== '$' || text[at + 1] !== '(') return -1
  let depth = 0
  for (let i = at + 1; i < text.length; i += 1) {
    const inner = text[i] === '(' || text[i] === ')' ? -1 : opaqueEnd(text, i)
    if (inner > i) i = inner - 1
    else if (text[i] === '(') depth += 1
    else if (text[i] === ')' && --depth === 0) return i + 1
  }

  return text.length
}

function closeAt(text: string, from: number, quote: string): number {
  for (let i = from; i < text.length; i += 1) {
    if (text[i] === '\\' && quote !== "'") i += 1
    else if (text[i] === quote) return i + 1
  }

  return text.length
}

/** The index after the last heredoc body that starts at `from`. */
function skipBodies(text: string, from: number, delimiters: string[]): number {
  let at = from
  for (const delimiter of delimiters) {
    while (at < text.length) {
      const end = text.indexOf('\n', at)
      const line = text.slice(at, end === -1 ? text.length : end)
      at = end === -1 ? text.length : end + 1
      if (line.replace(/^\t+/, '').trimEnd() === delimiter) break
    }
  }

  return at
}

// A `#` that starts a word starts a comment; an apostrophe in it opens no quote.
const isCommentAt = (text: string, at: number): boolean => text[at] === '#' && (at === 0 || /[\s;&|]/.test(text[at - 1] ?? ''))

/** A separator at `at`: its length, or 0. `>&`, `&>`, `>|` and `|&`'s `&` belong to redirects and pipes. */
function separatorAt(text: string, at: number): number {
  const two = text.slice(at, at + 2)
  if (two === '&&' || two === '||' || two === '|&') return 2
  const c = text[at]
  const before = text[at - 1]
  if (c === ';' || c === '\n') return 1
  if (c === '|') return before === '>' ? 0 : 1
  if (c === '&') return before === '>' || before === '<' || text[at + 1] === '>' ? 0 : 1

  return 0
}

/** Splits a command line at `&&`, `||`, `;`, `|`, `&` and newlines outside quotes; heredoc bodies are dropped. */
export function splitCommands(command: string): string[] {
  const parts: string[] = []
  const pending: string[] = [] // heredoc delimiters whose bodies start after the next newline
  let start = 0
  for (let i = 0; i < command.length; i += 1) {
    const end = opaqueEnd(command, i)
    if (end > i) {
      i = end - 1
      continue
    }
    if (isCommentAt(command, i)) {
      const newline = command.indexOf('\n', i)
      i = (newline === -1 ? command.length : newline) - 1
      continue
    }
    // `<<<` is a here-string, not a heredoc.
    const isHeredoc = command.startsWith('<<', i) && command[i - 1] !== '<' && command[i + 2] !== '<'
    const heredoc = isHeredoc ? HEREDOC.exec(command.slice(i)) : null
    if (heredoc !== null) {
      pending.push(heredoc[2] ?? '')
      i += heredoc[0].length - 1
      continue
    }
    const size = separatorAt(command, i)
    if (size === 0) continue
    parts.push(command.slice(start, i))
    start = command[i] === '\n' && pending.length > 0 ? skipBodies(command, i + 1, pending.splice(0)) : i + size
    i = start - 1
  }
  parts.push(command.slice(start))

  return parts.filter(part => part.trim() !== '')
}

/** The word starting at `at` with its quotes taken off, and the index after it. */
function wordAt(text: string, at: number): { word: string; end: number } {
  let i = at
  while (i < text.length && !WORD_END.test(text[i] ?? '')) {
    const end = opaqueEnd(text, i)
    i = end > i ? end : i + 1
  }

  return { word: tokenize(text.slice(at, i)).join(''), end: i }
}

/** Files a segment truncates with `>`, `>|`, `2>` or `&>` (not `>>`, `>&2` or /dev/null). */
export function redirectTargets(segment: string): string[] {
  const targets: string[] = []
  for (let i = 0; i < segment.length; i += 1) {
    const end = opaqueEnd(segment, i)
    if (end > i) {
      i = end - 1
      continue
    }
    if (isCommentAt(segment, i)) break
    if (segment[i] !== '>' || segment[i - 1] === '<') continue
    const next = segment[i + 1]
    if (next === '>' || next === '&') {
      i += 1
      continue
    }
    let at = next === '|' ? i + 2 : i + 1
    while (segment[at] === ' ' || segment[at] === '\t') at += 1
    const { word, end: after } = wordAt(segment, at)
    if (word !== '' && !HARMLESS_TARGET.test(word) && !TEMP_PATH.test(word)) targets.push(word)
    i = after - 1
  }

  return targets
}
