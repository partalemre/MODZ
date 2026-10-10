import { isAbsolute, posix } from './tree'

// A shell command read just far enough to find its words and the operators between them.
type Lexer = { command: string; i: number; out: string[][]; cur: string[]; tok: string; quote: string; has: boolean; seps: string[] }

function endTok(lx: Lexer): void {
  if (lx.has) lx.cur.push(lx.tok)
  lx.tok = ''
  lx.has = false
}

function endSeg(lx: Lexer): void {
  endTok(lx)
  if (lx.cur.length) lx.out.push(lx.cur)
  lx.cur = []
}

function take(lx: Lexer, text: string): void {
  lx.tok += text
  lx.has = true
}

function inQuote(lx: Lexer, ch: string): void {
  const { command } = lx
  if (ch === lx.quote) lx.quote = ''
  else if (ch === '\\' && lx.quote === '"' && lx.i + 1 < command.length) lx.tok += command[++lx.i]
  else lx.tok += ch
}

function operator(lx: Lexer, ch: string): boolean {
  const { command, i } = lx
  if (ch === '\n' || ch === ';') {
    lx.seps.push(';')
    endSeg(lx)
  } else if (ch === '&' && (command[i - 1] === '>' || command[i + 1] === '>')) take(lx, ch)
  else if (ch === '&' || ch === '|') {
    const twice = command[i + 1] === ch
    if (twice) lx.i++
    lx.seps.push(twice ? ch + ch : ch)
    endSeg(lx)
  } else return false
  return true
}

function step(lx: Lexer, ch: string): void {
  const { command } = lx
  if (lx.quote) inQuote(lx, ch)
  else if (ch === '"' || ch === "'") {
    lx.quote = ch
    lx.has = true
  } else if (ch === '\\' && lx.i + 1 < command.length) take(lx, command[++lx.i] ?? '')
  else if (ch === '#' && !lx.has) {
    while (lx.i + 1 < command.length && command[lx.i + 1] !== '\n') lx.i++
  } else if (ch === ' ' || ch === '\t') endTok(lx)
  else if (!operator(lx, ch)) take(lx, ch)
}

export function segments(command: string, seps: string[] = []): string[][] {
  const lx: Lexer = { command, i: 0, out: [], cur: [], tok: '', quote: '', has: false, seps }
  for (; lx.i < command.length; lx.i++) step(lx, command[lx.i] ?? '')
  endSeg(lx)
  if (!lx.quote) return lx.out
  seps.push(';')
  return command
    .split(/&&|\|\||;|\||\n/)
    .map(s => s.trim().split(/\s+/).filter(Boolean))
    .filter(s => s.length > 0)
}

export function stripGlobals(tokens: string[]): string[] {
  const out = [...tokens]
  if (out[0] === 'env') out.shift()
  while (out.length && /^[A-Z_][A-Z0-9_]*=/.test(out[0] ?? '')) out.shift()
  return out
}

function tidy(path: string): string {
  const s = path.replace(/\/+$/, '')
  if (s === '') return '/'
  return /^[A-Za-z]:$/.test(s) && isAbsolute(`${s}/`) ? `${s}/` : s
}

export function resolve(cwd: string, p: string, home = ''): string {
  let path = posix(p)
  if (home && (path === '~' || path.startsWith('~/'))) path = home + path.slice(1)
  const drive = isAbsolute(path) && !path.startsWith('/') ? path.slice(0, 2) : ''
  const parts = isAbsolute(path) ? [drive] : posix(cwd).replace(/\/+$/, '').split('/')
  for (const seg of path.slice(drive.length).split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') {
      if (parts.length > 1) parts.pop()
    } else parts.push(seg)
  }
  return tidy(parts.join('/'))
}
