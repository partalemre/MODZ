import type { Failure, Suite } from '../types'

// Where the run happened, so paths can be made relative and Go packages mapped to folders.
export type ParseContext = { root: string; goModule: string | null }

export const ANSI = /\u001b\[[0-9;?]*[A-Za-z]/g
export const MAX_FAILURES = 50
const MESSAGE_MAX = 160
const E2E_PATH = /(^|\/)(e2e|integration_test|integration-tests|cypress|playwright)(\/|$)|\.e2e\.|\.cy\.|\.pw\./

export const clean = (output: string): string => output.replace(ANSI, '').replace(/\r/g, '')

export function firstLine(text: string): string {
  const line = text.trim().split('\n')[0]?.trim() ?? ''

  return line.length > MESSAGE_MAX ? `${line.slice(0, MESSAGE_MAX - 1)}…` : line
}

export function relative(path: string, ctx: ParseContext): string {
  const bare = path.replace(/^file:\/\//, '').replace(/^\.\//, '')
  const prefix = `${ctx.root.replace(/\/$/, '')}/`

  return bare.startsWith(prefix) ? bare.slice(prefix.length) : bare
}

export function testSuite(file: string | null): Suite {
  return file !== null && E2E_PATH.test(file) ? 'e2e' : 'unit'
}

type Spec = { file: string | null; line: number | null; name: string; message: string; suite?: Suite; durationMs?: number | null }

export function failure(spec: Spec, ctx: ParseContext): Failure {
  const file = spec.file === null ? null : relative(spec.file, ctx)

  return { suite: spec.suite ?? testSuite(file), file, line: spec.line, name: firstLine(spec.name), message: firstLine(spec.message), durationMs: spec.durationMs ?? null }
}

// Splits lines into sections, each opened by a line `start` matches and running to the next one.
export function sections(lines: string[], start: RegExp): { head: RegExpExecArray; body: string[] }[] {
  const out: { head: RegExpExecArray; body: string[] }[] = []
  for (const line of lines) {
    const head = start.exec(line)
    if (head !== null) out.push({ head, body: [] })
    else out.at(-1)?.body.push(line)
  }

  return out
}

export const firstText = (body: string[]): string => body.find(line => line.trim() !== '')?.trim() ?? ''

export function firstMatch(body: string[], re: RegExp): RegExpExecArray | null {
  for (const line of body) {
    const found = re.exec(line)
    if (found !== null) return found
  }

  return null
}

export const lineNumber = (text: string | undefined): number | null => (text === undefined ? null : Number(text))

const MS_PER_SECOND = 1000

// "12" with "ms" or "0.40" with "s": a runner's per-test time in milliseconds.
export function durationOf(value: string | undefined, unit: string | undefined): number | null {
  if (value === undefined) return null

  return unit === 's' ? Number(value) * MS_PER_SECOND : Number(value)
}
