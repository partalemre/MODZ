import type { Failure } from '../types'
import { durationOf, failure, firstMatch, firstText, lineNumber, MAX_FAILURES, sections } from './text'
import type { ParseContext } from './text'
import { words } from './words'

type Parser = (lines: string[], ctx: ParseContext) => Failure[]

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const endsWithFile = (path: string, file: string | null) => file !== null && (path === file || path.endsWith(`/${file}`) || file.endsWith(`/${path}`))

// jest: "FAIL src/a.test.ts" then "● suite › name" blocks with a "> 42 |" code frame.
const jest: Parser = (lines, ctx) => {
  const out: Failure[] = []
  const times = new Map(lines.flatMap(row => {
    const timed = /^\s*✕ (.+?) \((\d+) ms\)$/.exec(row)

    return timed === null ? [] : [[timed[1] ?? '', Number(timed[2])] as const]
  }))
  let file: string | null = null
  for (const { head, body } of sections(lines, /^\s*(?:FAIL\s+(\S+)(?:\s+\([\d.]+ m?s\))?\s*|● (.+))$/)) {
    if (head[1] !== undefined) file = head[1]
    const name = head[2]
    if (name === undefined || name.startsWith('Console')) continue
    const frame = firstMatch(body, /^\s*>\s*(\d+)\s*\|/)
    const at = firstMatch(body, /\(?([^\s()]+):(\d+):\d+\)?\s*$/)
    const line = frame?.[1] ?? (at !== null && endsWithFile(at[1] ?? '', file) ? at[2] : undefined)
    const durationMs = times.get(name.split(' › ').at(-1) ?? '') ?? null
    out.push(failure({ file, line: lineNumber(line), name, message: firstText(body), durationMs }, ctx))
  }

  return out
}

// vitest: " FAIL  src/a.test.ts > suite > name", the error, then " ❯ src/a.test.ts:42:22".
const vitest: Parser = (lines, ctx) => sections(lines, /^\s*FAIL\s+(\S+) > (.+?)(?:\s+(\d+(?:\.\d+)?)(m?s))?$/).map(({ head, body }) => {
  const file = head[1] ?? null
  const at = firstMatch(body, /❯ (\S+?):(\d+):\d+/)
  const line = at !== null && endsWithFile(at[1] ?? '', file) ? at[2] : undefined

  const message = firstText(body.filter(row => !row.includes('⎯')))

  return failure({ file, line: lineNumber(line), name: head[2] ?? '', message, durationMs: durationOf(head[3], head[4]) }, ctx)
})

// pytest: "FAILED tests/t.py::test_x - msg", its "____ test_x ____" section holding "tests/t.py:12: Error".
const pytest: Parser = (lines, ctx) => {
  const bodies = new Map(sections(lines, /^_{3,} (.+?) _{3,}$/).map(({ head, body }) => [head[1] ?? '', body]))
  const out: Failure[] = []
  for (const row of lines) {
    const found = /^(?:FAILED|ERROR) (\S+?)::(\S+)(?: - (.*))?$/.exec(row)
    if (found === null) continue
    const [, file = '', id = '', summary = ''] = found
    const key = id.replace(/::/g, '.')
    const body = bodies.get(key) ?? [...bodies.entries()].find(([name]) => name.endsWith(key))?.[1] ?? []
    const at = firstMatch(body, new RegExp(`^${escape(file)}:(\\d+): `))
    const message = summary || (firstMatch(body, /^E\s+(.*)$/)?.[1] ?? '')
    out.push(failure({ file, line: lineNumber(at?.[1]), name: id.replace(/::/g, ' › '), message }, ctx))
  }

  return out
}

function goFile(base: string, pkg: string | undefined, ctx: ParseContext): string {
  if (pkg === undefined || ctx.goModule === null || !pkg.startsWith(ctx.goModule)) return base
  const dir = pkg.slice(ctx.goModule.length).replace(/^\//, '')

  return dir === '' ? base : `${dir}/${base}`
}

// go test: "--- FAIL: TestX (0.00s)", "    x_test.go:42: msg", later "FAIL\texample.com/pkg\t0.1s".
const goTest: Parser = (lines, ctx) => {
  const out: Failure[] = []
  lines.forEach((row, index) => {
    const head = /^\s*--- FAIL: (\S+)(?: \((\d+(?:\.\d+)?)s\))?/.exec(row)
    if (head === null) return
    const rest = lines.slice(index + 1)
    const end = rest.findIndex(next => /^\s*--- |^\S/.test(next))
    const at = firstMatch(end === -1 ? rest : rest.slice(0, end), /^\s+(\S+\.go):(\d+): (.*)$/)
    const pkg = firstMatch(rest, /^FAIL\s+(\S+)\s/)?.[1]
    const file = at === null ? null : goFile(at[1] ?? '', pkg, ctx)
    out.push(failure({ file, line: lineNumber(at?.[2]), name: head[1] ?? '', message: at?.[3] ?? '', durationMs: durationOf(head[2], 's') }, ctx))
  })

  // A parent test failing only through its subtests says nothing of its own.
  return out.filter(item => item.file !== null || !out.some(other => other.name.startsWith(`${item.name}/`)))
}

// flutter test / dart test: "00:02 +3 -1: test/w_test.dart: name [E]", a stack line "test/w_test.dart 28:5".
const dartTest: Parser = (lines, ctx) => sections(lines, /^\d+:\d+ \+\d+(?: ~\d+)?(?: -\d+)?: (.*)$/)
  .filter(({ head }) => (head[1] ?? '').endsWith(' [E]'))
  .map(({ head, body }) => {
    const title = (head[1] ?? '').replace(/ \[E\]$/, '')
    const split = /^(\S+\.dart): (.*)$/.exec(title)
    const file = split?.[1] ?? null
    const at = firstMatch(body, /^\s*(\S+\.dart) (\d+):\d+\s/)
    const line = at !== null && endsWithFile(at[1] ?? '', file) ? at[2] : undefined

    return failure({ file, line: lineNumber(line), name: split?.[2] ?? title, message: firstText(body) }, ctx)
  })

// bun test: "src/a.test.ts:" header, "error: msg", "at … (/w/src/a.test.ts:2:29)", then "(fail) name".
const bunTest: Parser = (lines, ctx) => {
  const out: Failure[] = []
  let state = { file: null as string | null, message: '', at: null as RegExpExecArray | null }
  for (const row of lines) {
    const header = /^(\S+\.\w+):$/.exec(row)
    const error = /^error: (.*)$/.exec(row)
    const fail = /^\(fail\) (.+?)(?: \[([\d.]+)(m?s)\])?$/.exec(row)
    if (header !== null) state = { file: header[1] ?? null, message: '', at: null }
    else if (error !== null) state = { ...state, message: error[1] ?? '', at: null }
    else if (state.at === null && /:\d+:\d+\)?$/.test(row)) state.at = /([^\s(]+):(\d+):\d+\)?$/.exec(row)
    const durationMs = fail === null ? null : durationOf(fail[2], fail[3])
    if (fail !== null) out.push(failure({ file: state.at?.[1] ?? state.file, line: lineNumber(state.at?.[2]), name: fail[1] ?? '', message: state.message, durationMs }, ctx))
    if (fail !== null || /^\((pass|skip|todo)\)/.test(row)) state = { ...state, message: '', at: null }
  }

  return out
}

// cargo test: "---- tests::x stdout ----", "thread … panicked at src/lib.rs:10:9:" then the message.
const cargoTest: Parser = (lines, ctx) => sections(lines, /^---- (\S+) stdout ----$/).map(({ head, body }) => {
  const index = body.findIndex(row => /panicked at /.test(row))
  const row = body[index] ?? ''
  const modern = /panicked at (\S+?):(\d+):\d+:?\s*$/.exec(row)
  const legacy = /panicked at '(.*)', (\S+?):(\d+):\d+/.exec(row)
  const file = modern?.[1] ?? legacy?.[2] ?? null
  const message = modern !== null ? firstText(body.slice(index + 1)) : (legacy?.[1] ?? '')

  return failure({ file, line: lineNumber(modern?.[2] ?? legacy?.[3]), name: head[1] ?? '', message }, ctx)
})

// Compile errors that stop a test run: go "pkg/a.go:12:2: msg", dart "test/a.dart:3:8: Error: msg".
const compileErrors: Parser = (lines, ctx) => lines.flatMap(row => {
  const found = /^(\S+\.go):(\d+):\d+: (.+)$/.exec(row) ?? /^(\S+\.dart):(\d+):\d+: Error: (.+)$/.exec(row)

  return found === null ? [] : [failure({ file: found[1] ?? null, line: lineNumber(found[2]), name: found[3] ?? '', message: words().compileError, suite: 'typecheck' }, ctx)]
})

const PARSERS = [jest, vitest, pytest, goTest, dartTest, bunTest, cargoTest, compileErrors]

export function dedupe(items: Failure[]): Failure[] {
  const seen = new Set<string>()

  return items.filter(item => {
    const key = `${item.suite}|${item.file}|${item.line}|${item.name}`
    if (seen.has(key)) return false
    seen.add(key)

    return true
  }).slice(0, MAX_FAILURES)
}

export function testFailures(text: string, ctx: ParseContext): Failure[] {
  const lines = text.split('\n')

  return dedupe(PARSERS.flatMap(parse => parse(lines, ctx)))
}
