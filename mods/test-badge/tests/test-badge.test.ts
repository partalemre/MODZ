import { expect, test } from 'claude-code/testing'

import { detect, isSource } from '../hooks/detect'
import type { RootInfo } from '../hooks/detect'
import { openCandidates } from '../hooks/open'
import { setLang } from '../hooks/lang'
import { badgeText, parseLint, parseTests } from '../hooks/parse'

const root = (names: string[], texts: Record<string, string> = {}, vendor: string[] = []): RootInfo =>
  ({ names: new Set(names), texts, hasVendorBin: tool => vendor.includes(tool) })
const NONE = { test: '', lint: '' }
const CTX = { root: '/w', goModule: null }
const pkg = (scripts: Record<string, string>) => JSON.stringify({ scripts })

test('commands are detected per ecosystem, and config overrides win', () => {
  expect(detect(root(['package.json'], { 'package.json': pkg({ test: 'vitest', lint: 'eslint .' }) }), NONE))
    .toEqual({ test: ['npm', 'run', '--silent', 'test'], lint: ['npm', 'run', '--silent', 'lint'] })
  expect(detect(root(['package.json', 'pnpm-lock.yaml'], { 'package.json': pkg({ test: 'jest' }) }), NONE).test).toEqual(['pnpm', 'test'])
  expect(detect(root(['package.json'], { 'package.json': pkg({ test: 'echo "Error: no test specified" && exit 1' }) }), NONE).test).toBeNull()
  expect(detect(root(['pyproject.toml'], { 'pyproject.toml': '[tool.pytest.ini_options]' }), NONE).test).toEqual(['python3', '-m', 'pytest', '-q'])
  expect(detect(root(['go.mod']), NONE).test).toEqual(['go', 'test', './...'])
  expect(detect(root(['Cargo.toml']), NONE).test).toEqual(['cargo', 'test', '-q'])
  expect(detect(root(['phpunit.xml', 'phpstan.neon'], {}, ['phpunit', 'phpstan']), NONE))
    .toEqual({ test: ['vendor/bin/phpunit'], lint: ['vendor/bin/phpstan', 'analyse', '--no-progress', '--no-ansi'] })
  expect(detect(root(['pubspec.yaml', 'test'], { 'pubspec.yaml': 'dependencies:\n  flutter:\n    sdk: flutter' }), NONE).test).toEqual(['flutter', 'test'])
  expect(detect(root(['pubspec.yaml', 'test'], { 'pubspec.yaml': 'name: cli' }), NONE).test).toEqual(['dart', 'test'])
  expect(detect(root(['pubspec.yaml'], { 'pubspec.yaml': 'sdk: flutter' }), NONE).test).toBeNull()
  expect(detect(root(['README.md']), NONE)).toEqual({ test: null, lint: null })
  expect(detect(root(['go.mod']), { test: 'make check', lint: '' }).test).toEqual(['/bin/sh', '-c', 'make check'])
})

test('only source files count as edits', () => {
  expect(isSource('/w/src/app.tsx')).toBe(true)
  expect(isSource('/w/main.go')).toBe(true)
  expect(isSource('/w/README.md')).toBe(false)
  expect(isSource('/w/.env')).toBe(false)
})

test('test counts are read from common runners', () => {
  const counts = (out: string, code = 0) => { const o = parseTests(out, code, CTX); return [o.passed, o.total, o.status] }
  expect(counts('Tests:       1 failed, 41 passed, 42 total', 1)).toEqual([41, 42, 'fail'])
  expect(counts(' \u001b[32mTests\u001b[39m  42 passed (42)')).toEqual([42, 42, 'pass'])
  expect(counts('==== 40 passed, 2 failed in 1.20s ====', 1)).toEqual([40, 42, 'fail'])
  expect(counts('test result: ok. 3 passed; 0 failed; 0 ignored\ntest result: ok. 2 passed; 0 failed;')).toEqual([5, 5, 'pass'])
  expect(counts('  7 passing (20ms)\n  1 failing', 1)).toEqual([7, 8, 'fail'])
  expect(counts('# tests 4\n# pass 4\n# fail 0')).toEqual([4, 4, 'pass'])
  expect(counts(' 12 pass\n 0 fail\nRan 12 tests')).toEqual([12, 12, 'pass'])
  expect(counts('OK (42 tests, 80 assertions)')).toEqual([42, 42, 'pass'])
  expect(counts('Tests: 10, Assertions: 20, Failures: 2.', 1)).toEqual([8, 10, 'fail'])
  expect(counts('ok  \texample.com/a\t0.1s\nFAIL\texample.com/b\t0.2s\nFAIL', 1)).toEqual([1, 2, 'fail'])
  expect(counts('something went wrong', 2)).toEqual([null, null, 'fail'])
})

test('lint errors are read from eslint, tsc and phpstan', () => {
  expect(parseLint('✖ 3 problems (2 errors, 1 warning)', 1, CTX).errors).toBe(2)
  expect(parseLint('Found 1 error in src/a.ts:3', 2, CTX).errors).toBe(1)
  expect(parseLint(' [ERROR] Found 4 errors', 1, CTX).errors).toBe(4)
  expect(parseLint('', 0, CTX)).toMatchObject({ status: 'pass', errors: 0 })
  expect(parseLint('boom', 1, CTX)).toMatchObject({ status: 'fail', errors: null })
})

const outcome = (over: object) => ({ status: 'pass' as const, passed: null, total: null, errors: null, failures: [], tail: [], ...over })

test('the badge reads like "testler 41/42 · lint 2 hata · 4 sn önce"', () => {
  setLang('tr')
  const badge = {
    tests: outcome({ status: 'fail', passed: 41, total: 42 }),
    lint: outcome({ status: 'fail', errors: 2 }),
    root: '/w', finishedAt: 1000, durationMs: 3000, isRunning: false,
  }
  expect(badgeText(badge, 5000)).toBe('testler 41/42 · lint 2 hata · 4 sn önce')
  expect(badgeText({ ...badge, isRunning: true }, 5000)).toBe('testler 41/42 · lint 2 hata · çalışıyor…')
  expect(badgeText({ ...badge, tests: null, lint: outcome({ status: 'timeout' }) }, 125_000)).toBe('lint zaman aşımı · 2 dk önce')
  expect(badgeText({ ...badge, tests: outcome({}), lint: outcome({ errors: 0 }) }, 1000)).toBe('testler geçti · lint temiz · 0 sn önce')
})

test('a failure row opens VS Code at the line, or the configured command, never through a shell', () => {
  expect(openCandidates('', { path: '/w/a.ts', line: 12 })[0]).toEqual(['code', '-g', '/w/a.ts:12'])
  expect(openCandidates('cursor -g {file}:{line}', { path: '/w/my file.ts', line: 3 })).toEqual([['cursor', '-g', '/w/my file.ts:3']])
})
