// Whether a Bash command only reads: one that may write (sed -i, rm, codegen, npm install) takes the turn's
// snapshot first, as a file write does. Unknown commands count as writing, so a snapshot is never missed.

const READERS = new Set([
  'ls', 'cat', 'head', 'tail', 'less', 'wc', 'grep', 'rg', 'ag', 'pwd', 'echo', 'printf', 'which', 'type', 'file', 'stat',
  'du', 'df', 'tree', 'diff', 'cmp', 'jq', 'date', 'env', 'whoami', 'uname', 'true', 'test', '[', 'realpath', 'dirname',
  'basename', 'sort', 'uniq', 'cut', 'column', 'nl', 'od', 'xxd', 'hexdump', 'shasum', 'md5', 'sha256sum', 'ps', 'cd', 'sleep',
])
const GIT_READERS = new Set(['status', 'log', 'diff', 'show', 'rev-parse', 'ls-files', 'ls-tree', 'blame', 'grep', 'describe', 'shortlog', 'cat-file', 'for-each-ref', 'reflog', 'remote', 'config', 'branch'])
const SEPARATORS = /&&|\|\||;|\||\n/
// A redirect into a file; `2>/dev/null`, `>/dev/null` and `2>&1` write nowhere.
const FILE_REDIRECT = /(?<!>)>>?(?!>|\s*(?:&|\/dev\/null))/
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/
const FIND_WRITES = /\s-(?:delete|exec|execdir|ok|fprint)\b/
const SED_IN_PLACE = /\s(?:-[a-zA-Z]*i|--in-place)/

function isReadingSegment(segment: string): boolean {
  if (FILE_REDIRECT.test(segment.replace(/\d>&\d/g, ''))) return false
  const words = segment.trim().split(/\s+/).filter(word => !ASSIGNMENT.test(word))
  const [name = '', verb = ''] = words
  if (name === '') return true
  if (name === 'git') return GIT_READERS.has(words.find((word, index) => index > 0 && !word.startsWith('-')) ?? verb)
  if (name === 'find') return !FIND_WRITES.test(segment)
  if (name === 'sed') return !SED_IN_PLACE.test(segment)

  return READERS.has(name)
}

export const isReadOnly = (command: string): boolean => command.split(SEPARATORS).every(isReadingSegment)
