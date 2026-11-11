// MODZ kit — a shell command line said in plain words (see plain.ts). The line is split into its steps
// (`a && b; c | d`), each step is looked up by its command's name, and the first few are joined. Rules only: no
// model, no process; an unknown command is named as it is rather than guessed at.
import type { Lang } from './lang'
import { COMMANDS, FAMILIES, SCRIPT, SERVICE, SHELL, fill, textOf } from './plain-words'
import type { Entry, Family, Named } from './plain-words'

// How many steps a sentence names before it counts the rest.
const STEPS_SHOWN = 2
const NAME_MAX = 40

// Words that only wrap the real command.
const WRAPPERS = new Set(['sudo', 'time', 'command', 'exec', 'nohup', 'env', 'then', 'do', 'else', 'if', 'while', 'until', '!'])
// A step that changes nothing a person needs told: moving folders, setting a variable, a loop's frame.
const SILENT = new Set(['cd', 'export', 'set', 'unset', 'source', '.', 'for', 'done', 'fi', 'true', 'false', ':', '[', '[[', 'test', 'local', 'shift', 'wait'])
// In the middle of a pipe these only shape what the command before them printed.
const FILTERS = new Set(['grep', 'rg', 'sed', 'awk', 'head', 'tail', 'sort', 'uniq', 'wc', 'cut', 'tr', 'tee', 'xargs', 'jq', 'column', 'less', 'cat'])
// These fetch a tool and run it: the tool is the next word.
const FETCHERS = new Set(['npx', 'bunx', 'uvx', 'pipx'])
// After these the next word is the job (`npm run build`, `python -m pytest`).
const PASS_ON = new Set(['run', 'run-script', 'exec', 'x', 'dlx', '-m', 'plugin'])
const INLINE = new Set(['-c', '-e', '-'])
// A sentence that opens with one of these keeps its capital when it follows another.
const PROPER = /^(GitHub|Git\b|Docker|Claude|Flutter|JSON|Python|iOS|Mac)/

const base = (path: string): string => path.split('/').filter(Boolean).at(-1) ?? path
const clip = (text: string): string => (text.length > NAME_MAX ? `${text.slice(0, NAME_MAX - 1)}…` : text)
const isFlag = (word: string): boolean => word.startsWith('-')

// A here-document's body is the script's text, not part of the command line.
const withoutHeredocs = (command: string): string => command.replace(/\\\n/g, ' ').replace(/<<-?\s*(['"]?)(\w+)\1[\s\S]*?\n\s*\2(?=\s|$)/g, '<<')

type Scan = { quote: string; depth: number }

// Whether the character at `i` stands outside quotes and brackets, moving the scan past it.
function isOpenAt(scan: Scan, line: string, i: number): boolean {
  const ch = line[i] ?? ''
  if (scan.quote !== '') {
    if (ch === scan.quote && line[i - 1] !== '\\') scan.quote = ''

    return false
  }
  if (ch === '"' || ch === "'" || ch === '`') scan.quote = ch
  else if (ch === '(' || ch === '{') scan.depth += 1
  else if (ch === ')' || ch === '}') scan.depth = Math.max(0, scan.depth - 1)

  return scan.quote === '' && scan.depth === 0
}

/** The line's steps, each a pipe of commands: `a && b | c` is `[[a], [b, c]]`. */
export function stepsOf(command: string): string[][] {
  const line = withoutHeredocs(command)
  const scan: Scan = { quote: '', depth: 0 }
  const steps: string[][] = [[]]
  let word = ''
  const close = (isStepEnd: boolean): void => {
    steps.at(-1)?.push(word.trim())
    word = ''
    if (isStepEnd) steps.push([])
  }
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i] ?? ''
    const two = line.slice(i, i + 2)
    if (!isOpenAt(scan, line, i)) word += ch
    else if (two === '&&' || two === '||') { close(true); i += 1 }
    else if (ch === ';' || ch === '\n') close(true)
    else if (ch === '|') close(false)
    else if (ch === '&' && line[i - 1] !== '>' && line[i + 1] !== '>') close(true)
    else word += ch
  }
  close(false)

  return steps.map(pipe => pipe.filter(Boolean)).filter(pipe => pipe.length > 0)
}

/** A command's words with quotes taken off; a quoted run with spaces stays one word. */
export function wordsOf(command: string): string[] {
  const found = command.match(/(?:\$\([^)]*\)|"(?:\\.|[^"\\])*"|'[^']*'|\S)+/g) ?? []

  return found.map(word => word.replace(/^(['"])([\s\S]*)\1$/, '$2'))
}

type Call = { name: string; args: string[]; out: string }

// The file a `>` or `>>` writes to, with the redirections taken out of the words.
function splitRedirects(words: string[]): { kept: string[]; out: string } {
  const kept: string[] = []
  let out = ''
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i] ?? ''
    const match = /^\d?>>?(.*)$/.exec(word)
    if (match === null || word.includes('>&')) {
      if (!/^\d?[<>]/.test(word)) kept.push(word)
      continue
    }
    const target = match[1] || words[(i += 1)] || ''
    if (target !== '' && !target.startsWith('/dev/') && !target.startsWith('&')) out = target
  }

  return { kept, out }
}

function callOf(command: string): Call | null {
  const { kept, out } = splitRedirects(wordsOf(command))
  const words = [...kept]
  // `FOO=1 sudo BAR=2 cmd`: settings and wrappers come off the front until the command itself leads.
  while (words.length > 0 && (WRAPPERS.has(words[0] ?? '') || /^\w+\+?=/.test(words[0] ?? ''))) words.shift()
  const [first, ...args] = words

  return first === undefined || first.startsWith('#') ? null : { name: first, args, out }
}

const namedOf = (kind: Named | undefined, args: string[]): string => {
  const plain = args.filter(arg => !isFlag(arg) && !/^\d+$/.test(arg))
  if (kind === 'first') return clip(base(plain[0] ?? ''))
  if (kind === 'host') return /^[a-z]+:\/\/([^/?#]+)/i.exec(plain.find(arg => arg.includes('://')) ?? '')?.[1] ?? ''
  if (kind === 'file') return clip(base(plain.at(-1) ?? ''))

  return kind === 'arg' ? clip(plain[0] ?? '') : ''
}

const say = (entry: Entry, lang: Lang, x = ''): string => fill(textOf(entry, lang), x)

// A family's sentence: the word after the command picks it; `run`, `-m` and the like pass the choice on.
function familySay(family: Family, args: string[], lang: Lang): string {
  const words = args.filter(arg => !isFlag(arg) || arg === '-m')
  const at = words.findIndex(word => !PASS_ON.has(word))
  const sub = words[at] ?? words[0] ?? ''
  const entry = family.sub[sub] ?? family.sub[words[0] ?? ''] ?? family.rest

  return say(entry, lang, entry === family.rest ? clip(sub) : namedOf(entry[2], words.slice(at + 1)))
}

// The cases a table cannot tell apart: a flag changes what the command does to the person's work.
function specialSay(call: Call, lang: Lang): string | null {
  const { name, args } = call
  const has = (...flags: string[]): boolean => args.some(arg => flags.includes(arg))
  const combined = (letter: string): boolean => args.some(arg => /^-[a-zA-Z]+$/.test(arg) && arg.includes(letter))
  const second = args.filter(arg => !isFlag(arg))[1] ?? ''
  if (name === 'git' && (args[0] === 'checkout' || args[0] === 'switch') && has('-b', '-B', '-c')) return say(SHELL.newBranch, lang, clip(args.filter(arg => !isFlag(arg))[1] ?? ''))
  if (name === 'git' && args[0] === 'reset' && has('--hard')) return say(SHELL.hardReset, lang)
  if (name === 'git' && args[0] === 'push' && (has('--force', '--force-with-lease') || combined('f'))) return say(SHELL.forcePush, lang)
  if (name === 'gh' && args[0] === 'pr' && second === 'create') return say(SHELL.prCreate, lang)
  if (name === 'gh' && args[0] === 'pr' && second === 'merge') return say(SHELL.prMerge, lang)
  if (name === 'rm' && (combined('r') || combined('R') || has('--recursive'))) return say(SHELL.deleteFolder, lang, namedOf('file', args))
  if (name === 'find' && has('-delete')) return say(SHELL.findDelete, lang)
  if (name === 'sed' && (has('-i', '--in-place') || args.some(arg => arg.startsWith('-i')))) return say(SHELL.editInPlace, lang, namedOf('file', args))
  if (call.out !== '' && (name === 'echo' || name === 'printf' || name === 'cat')) return say(SHELL.writeFile, lang, clip(base(call.out)))

  return null
}

function scriptSay(call: Call, lang: Lang): string | null {
  const first = call.args[0] ?? ''
  const isRunner = COMMANDS[call.name] === SCRIPT
  if (isRunner && (call.args.length === 0 || INLINE.has(first) || first === '<<')) return say(SHELL.inlineScript, lang)
  if (isRunner && first === '-m') return callSay({ ...call, name: call.args[1] ?? '', args: call.args.slice(2) }, lang)
  if (FETCHERS.has(call.name)) {
    const tool = call.args.find(arg => !isFlag(arg)) ?? ''
    const known = callSay({ name: tool, args: call.args.slice(call.args.indexOf(tool) + 1), out: '' }, lang)

    return known === say(SHELL.unknown, lang, clip(base(tool))) ? say(SHELL.fetchedTool, lang, clip(tool)) : known
  }

  return null
}

/** One command said plainly; null for a step not worth telling (`cd`, `export`). */
export function callSay(call: Call, lang: Lang): string | null {
  const name = base(call.name)
  if (SILENT.has(name)) return null
  const special = specialSay({ ...call, name }, lang) ?? scriptSay({ ...call, name }, lang)
  if (special !== null) return special
  const family = FAMILIES[name]
  if (family !== undefined) return familySay(family, call.args, lang)
  const entry = COMMANDS[name]
  if (entry !== undefined) return say(entry, lang, entry === SERVICE ? name : namedOf(entry[2], call.args))
  // A path to a file of the project's own (`./bin/modz check`, `tools/build.sh`).
  if (call.name.includes('/')) return say(SHELL.ownScript, lang, clip([name, ...call.args.filter(arg => !isFlag(arg)).slice(0, 1)].join(' ')))

  return say(SHELL.unknown, lang, clip(name))
}

// The command of a pipe that does the work: the first one that is not just shaping another's output.
function leadOf(pipe: string[]): Call | null {
  const calls = pipe.map(callOf).filter((call): call is Call => call !== null)

  return calls.find(call => !FILTERS.has(base(call.name)) && !SILENT.has(base(call.name))) ?? calls[0] ?? null
}

const lowerFirst = (text: string, lang: Lang): string => (PROPER.test(text) ? text : text.charAt(0).toLocaleLowerCase(lang) + text.slice(1))

/** A whole command line in a sentence: "Yeni bir çalışma dalı (branch) açıyor: fix/x, sonra bir dosyaya yazıyor". */
export function plainShell(command: string, lang: Lang): string {
  const steps = stepsOf(command)
  const said = steps.map(pipe => leadOf(pipe)).flatMap(call => (call === null ? [] : [callSay(call, lang) ?? '']))
  const unique = said.filter((text, i) => text !== '' && said.indexOf(text) === i)
  if (unique.length === 0) return say(steps.some(pipe => pipe.some(c => /^cd\b/.test(c))) ? (COMMANDS.cd as Entry) : SHELL.any, lang)
  const shown = unique.slice(0, STEPS_SHOWN).map((text, i) => (i === 0 ? text : lowerFirst(text, lang)))
  const more = unique.length - shown.length

  return shown.join(textOf(SHELL.then, lang)) + (more > 0 ? say(SHELL.more, lang, String(more)) : '')
}
