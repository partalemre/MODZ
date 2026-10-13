// House rules: plain sentences the person keeps in `.claude/house-rules.md` ("never touch the
// production database"). A command that is neither risky nor plainly read-only is put to the
// shared judge with the rules as its instructions. Pure: parsing, the read-only allowlist, the
// question, the verdict, and the masking applied before any text could leave the machine.

export const RULES_FILE = '.claude/house-rules.md'
// Rules past this much text are not sent: the judge's prompt stays small and its cost bounded.
export const RULES_MAX_CHARS = 4000
// Up to this many rules, the judge names the one it matched; past it, it answers by kind alone.
export const MAX_NAMED_RULES = 8

export type VerdictKind = 'allow' | 'ask' | 'block'
// `rule`: the rule the judge matched, or null when it could not say which.
export type Verdict = { kind: VerdictKind; rule: string | null }

const BULLET = /^(?:[-*+]|\d+[.)])\s+/
const HEADING = /^#/
const COMMENT = /^<!--.*-->$/

/** The rules, one per line or list item; headings, comments and blank lines are not rules. */
export function parseRules(text: string): string[] {
  const rules: string[] = []
  let total = 0
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (line === '' || HEADING.test(line) || COMMENT.test(line)) continue
    const rule = line.replace(BULLET, '').trim()
    if (rule === '') continue
    total += rule.length
    if (total > RULES_MAX_CHARS) break
    rules.push(rule)
  }

  return rules
}

// Commands that only read; each part of a pipe or list must be one of them.
const READ_ONLY = [
  'ls', 'cat', 'head', 'tail', 'wc', 'pwd', 'echo', 'grep', 'rg', 'which', 'stat', 'file', 'tree', 'du', 'df', 'date', 'whoami',
  'git status', 'git diff', 'git log', 'git show', 'git blame',
]
// Text that can write or run something even after a read-only name: redirects, substitutions,
// and the flags that make a reader write a file or run a program.
const WRITES = /[>`]|\$\(|<\(|--output|--pre\b|--exec/
const PARTS = /\|\||&&|[|;\n]/

export function isReadOnly(command: string): boolean {
  if (command.trim() === '' || WRITES.test(command)) return false

  return command.split(PARTS).every(part => {
    const words = part.trim().split(/\s+/)

    return READ_ONLY.some(name => name.split(' ').every((word, i) => words[i] === word))
  })
}

const isNamed = (rules: readonly string[]): boolean => rules.length <= MAX_NAMED_RULES

/** `allow`, then `ask N` and `block N` per rule while they can be named; else `allow | ask | block`. */
export function labelsFor(rules: readonly string[]): string[] {
  if (!isNamed(rules)) return ['allow', 'ask', 'block']

  return ['allow', ...rules.flatMap((_, i) => [`ask ${i + 1}`, `block ${i + 1}`])]
}

export function instructionsFor(rules: readonly string[]): string {
  const listed = rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')
  const answer = isNamed(rules)
    ? 'Answer allow when the command breaks none of them, ask N when it may break rule N and the person should decide, block N when it clearly breaks rule N.'
    : 'Answer allow when the command breaks none of them, ask when it may break one and the person should decide, block when it clearly breaks one.'

  return [`You check one shell command against the house rules the person wrote for this repository:`, listed, answer].join('\n')
}

/** The judge's label as a verdict; null for a label this question never offered. */
export function verdictOf(label: string, rules: readonly string[]): Verdict | null {
  const [kind, number] = label.split(' ')
  if (kind !== 'allow' && kind !== 'ask' && kind !== 'block') return null
  const rule = number === undefined ? undefined : rules[Number(number) - 1]

  return { kind, rule: rule ?? null }
}

// Masking for what leaves the machine (the Jev backend): secret-looking assignments and flags,
// credentials in URLs, bearer tokens, and long mixed strings that read like keys.
const SECRET_NAME = /key|token|secret|pass(?:word)?|pwd|auth|credential/i
const ASSIGNMENT = /\b([A-Za-z_][A-Za-z0-9_]*)=("[^"]*"|'[^']*'|\S+)/g
const SECRET_FLAG = /(--?(?:password|passwd|token|secret|api-key|apikey|key)(?:=|\s+))("[^"]*"|'[^']*'|\S+)/gi
const URL_CREDENTIAL = /:\/\/([^/\s:@]+):([^/\s@]+)@/g
const BEARER = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/g
const LONG_TOKEN = /[A-Za-z0-9_+/=-]{24,}/g
const MASK = '****'

export function redact(text: string): string {
  return text
    .replace(ASSIGNMENT, (whole, name: string) => (SECRET_NAME.test(name) ? `${name}=${MASK}` : whole))
    .replace(SECRET_FLAG, `$1${MASK}`)
    .replace(URL_CREDENTIAL, `://$1:${MASK}@`)
    .replace(BEARER, `$1 ${MASK}`)
    .replace(LONG_TOKEN, token => (/\d/.test(token) && /[A-Za-z]/.test(token) ? MASK : token))
}
