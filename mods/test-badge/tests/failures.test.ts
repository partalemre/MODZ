import { expect, test } from 'claude-code/testing'

import { parseLint, parseTests } from '../hooks/parse'

const ctx = { root: '/w', goModule: 'example.com/app' }
const where = (out: string, code = 1) => parseTests(out, code, ctx).failures.map(f => [f.suite, f.file, f.line, f.name, f.message])
const lintWhere = (out: string, code = 1) => parseLint(out, code, ctx).failures.map(f => [f.suite, f.file, f.line, f.name, f.message])

test('jest: FAIL file, the ● block, the line from the code frame', () => {
  const out = [
    'FAIL src/auth/login.test.ts (5.2 s)',
    '  login',
    '    ✕ rejects an expired token (5 ms)',
    '',
    '  ● login › rejects an expired token',
    '',
    '    expect(received).toBe(expected) // Object.is equality',
    '',
    '    > 42 |   expect(res.status).toBe(401)',
    '         |                      ^',
    '      at Object.toBe (src/auth/login.test.ts:42:22)',
    '',
    'Tests:       1 failed, 41 passed, 42 total',
  ].join('\n')
  expect(where(out)).toEqual([['unit', 'src/auth/login.test.ts', 42, 'login › rejects an expired token', 'expect(received).toBe(expected) // Object.is equality']])
  expect(parseTests(out, 1, ctx)).toMatchObject({ passed: 41, total: 42 })
})

test('vitest: FAIL file > name, the error, the ❯ location; e2e told apart by path', () => {
  const out = [
    ' FAIL  src/auth/login.test.ts > login > rejects an expired token',
    'AssertionError: expected 200 to be 401 // Object.is equality',
    ' ❯ src/auth/login.test.ts:42:22',
    '⎯⎯⎯⎯⎯⎯⎯[1/2]⎯',
    ' FAIL  e2e/checkout.spec.ts > pays',
    'Error: Timed out 5000ms waiting for expect(locator).toBeVisible()',
    ' ❯ e2e/checkout.spec.ts:18:5',
    ' Tests  2 failed | 40 passed (42)',
  ].join('\n')
  expect(where(out)).toEqual([
    ['unit', 'src/auth/login.test.ts', 42, 'login > rejects an expired token', 'AssertionError: expected 200 to be 401 // Object.is equality'],
    ['e2e', 'e2e/checkout.spec.ts', 18, 'pays', 'Error: Timed out 5000ms waiting for expect(locator).toBeVisible()'],
  ])
})

test('pytest: the FAILED summary, the line from its traceback section', () => {
  const out = [
    '=================================== FAILURES ===================================',
    '_________________________________ TestAuth.test_login _________________________________',
    '>       assert login() == 401',
    'E       assert 200 == 401',
    'tests/test_auth.py:12: AssertionError',
    '=========================== short test summary info ============================',
    'FAILED tests/test_auth.py::TestAuth::test_login - assert 200 == 401',
    '1 failed, 41 passed in 0.31s',
  ].join('\n')
  expect(where(out)).toEqual([['unit', 'tests/test_auth.py', 12, 'TestAuth › test_login', 'assert 200 == 401']])
})

test('go test: subtests, the package mapped to its folder, and build errors', () => {
  const out = [
    '--- FAIL: TestTable (0.00s)',
    '    --- FAIL: TestTable/expired (0.00s)',
    '        login_test.go:42: expected 401, got 200',
    'FAIL',
    'FAIL\texample.com/app/auth\t0.012s',
    'auth/token.go:9:2: undefined: clock',
  ].join('\n')
  expect(where(out)).toEqual([
    ['unit', 'auth/login_test.go', 42, 'TestTable/expired', 'expected 401, got 200'],
    ['typecheck', 'auth/token.go', 9, 'undefined: clock', 'derleme hatası'],
  ])
})

test('flutter test: the [E] row, its expectation, the stack line; totals from the last progress line', () => {
  const out = [
    '00:02 +3: test/widget_test.dart: renders the title',
    '00:02 +3 -1: test/widget_test.dart: Counter increments smoke test [E]',
    '  Expected: <1>',
    '    Actual: <0>',
    '  package:matcher                          expect',
    '  test/widget_test.dart 28:5               main.<fn>',
    '00:03 +41 -1: Some tests failed.',
  ].join('\n')
  expect(where(out)).toEqual([['unit', 'test/widget_test.dart', 28, 'Counter increments smoke test', 'Expected: <1>']])
  expect(parseTests(out, 1, ctx)).toMatchObject({ passed: 41, total: 42 })
})

test('bun test and cargo test', () => {
  const bun = [
    'src/math.test.ts:',
    '2 | test("adds", () => { expect(add(1, 1)).toBe(3) })',
    'error: expect(received).toBe(expected)',
    '      at <anonymous> (/w/src/math.test.ts:2:42)',
    '(fail) math > adds [0.40ms]',
    '(pass) math > subtracts',
  ].join('\n')
  expect(where(bun)).toEqual([['unit', 'src/math.test.ts', 2, 'math > adds', 'expect(received).toBe(expected)']])
  const cargo = [
    '---- tests::parses stdout ----',
    "thread 'tests::parses' panicked at src/lib.rs:10:9:",
    'assertion `left == right` failed',
    'test result: FAILED. 3 passed; 1 failed; 0 ignored',
  ].join('\n')
  expect(where(cargo)).toEqual([['unit', 'src/lib.rs', 10, 'tests::parses', 'assertion `left == right` failed']])
})

test('an unknown runner keeps the last lines instead of guessing', () => {
  const outcome = parseTests('compiling…\nsomething broke\n  at the end\n', 2, ctx)
  expect(outcome.failures).toEqual([])
  expect(outcome.tail).toEqual(['compiling…', 'something broke', '  at the end'])
  expect(parseTests('all good', 0, ctx).tail).toEqual([])
})

test('eslint, tsc and flutter analyze: file:line per error, warnings left out, suite by tool', () => {
  const out = [
    '/w/src/api/user.ts',
    "   3:7   error    'x' is assigned a value but never used  no-unused-vars",
    '   5:1   warning  Unexpected console statement            no-console',
    '',
    '✖ 2 problems (1 error, 1 warning)',
    "src/api/user.ts(12,5): error TS2322: Type 'string' is not assignable to type 'number'.",
  ].join('\n')
  expect(lintWhere(out)).toEqual([
    ['lint', 'src/api/user.ts', 3, "'x' is assigned a value but never used", 'no-unused-vars'],
    ['typecheck', 'src/api/user.ts', 12, "Type 'string' is not assignable to type 'number'.", 'TS2322'],
  ])
  expect(parseLint(out, 1, ctx).errors).toBe(2)
  const analyze = "  error • Undefined name 'foo' • lib/main.dart:3:5 • undefined_identifier\n  info • Prefer const • lib/a.dart:1:1 • prefer_const"
  expect(lintWhere(analyze)).toEqual([['lint', 'lib/main.dart', 3, "Undefined name 'foo'", 'undefined_identifier']])
})

test('per-test times are kept where the runner prints them', () => {
  const ms = (out: string) => parseTests(out, 1, ctx).failures.map(f => f.durationMs)
  expect(ms(' FAIL  src/a.test.ts > adds 12ms\nError: boom\n ❯ src/a.test.ts:3:1')).toEqual([12])
  expect(ms('--- FAIL: TestX (1.50s)\n    x_test.go:4: bad\nFAIL\texample.com/app\t0.1s')).toEqual([1500])
  expect(ms('src/m.test.ts:\nerror: no\n(fail) m > adds [0.40ms]')).toEqual([0.4])
  expect(ms('FAIL src/a.test.ts\n    ✕ adds (5 ms)\n  ● math › adds\n    boom')).toEqual([5])
  expect(ms('FAILED tests/t.py::test_x - nope\n1 failed in 0.1s')).toEqual([null])
})
