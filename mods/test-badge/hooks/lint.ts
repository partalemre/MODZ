import type { Failure } from '../types'
import { dedupe } from './failures'
import { failure, lineNumber } from './text'
import type { ParseContext } from './text'

type Parser = (lines: string[], ctx: ParseContext) => Failure[]

// eslint's stylish format: a path line, then "  3:7  error  message  rule" rows; warnings are left out.
const eslint: Parser = (lines, ctx) => {
  const out: Failure[] = []
  let file: string | null = null
  for (const row of lines) {
    const entry = /^\s+(\d+):\d+\s+error\s+(.+?)(?:\s{2,}(\S+))?\s*$/.exec(row)
    if (entry !== null) out.push(failure({ file, line: lineNumber(entry[1]), name: entry[2] ?? '', message: entry[3] ?? '', suite: 'lint' }, ctx))
    else if (/^\/?[^\s:]+\.\w+$/.test(row)) file = row
  }

  return out
}

// tsc: "src/a.ts(12,5): error TS2322: msg" (plain) or "src/a.ts:12:5 - error TS2322: msg" (pretty).
const tsc: Parser = (lines, ctx) => lines.flatMap(row => {
  const found = /^(\S.*?)\((\d+),\d+\): error (TS\d+): (.*)$/.exec(row) ?? /^(\S.*?):(\d+):\d+ - error (TS\d+): (.*)$/.exec(row)

  return found === null ? [] : [failure({ file: found[1] ?? null, line: lineNumber(found[2]), name: found[4] ?? '', message: found[3] ?? '', suite: 'typecheck' }, ctx)]
})

// flutter analyze "error • msg • lib/a.dart:3:5 • rule", dart analyze "error - lib/a.dart:3:5 - msg - rule".
const dartAnalyze: Parser = (lines, ctx) => lines.flatMap(row => {
  const bullet = /^\s*error • (.+?) • (\S+?):(\d+):\d+ • (\S+)\s*$/.exec(row)
  const dash = /^\s*error - (\S+?):(\d+):\d+ - (.+?) - (\S+)\s*$/.exec(row)
  if (bullet !== null) return [failure({ file: bullet[2] ?? null, line: lineNumber(bullet[3]), name: bullet[1] ?? '', message: bullet[4] ?? '', suite: 'lint' }, ctx)]
  if (dash !== null) return [failure({ file: dash[1] ?? null, line: lineNumber(dash[2]), name: dash[3] ?? '', message: dash[4] ?? '', suite: 'lint' }, ctx)]

  return []
})

export function lintFailures(text: string, ctx: ParseContext): Failure[] {
  const lines = text.split('\n')

  return dedupe([eslint, tsc, dartAnalyze].flatMap(parse => parse(lines, ctx)))
}
