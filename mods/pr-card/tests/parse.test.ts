import { expect, test } from 'claude-code/testing'

import { checksOf, isPrCreate, outputText, prRefOf, viewOf } from '../hooks/parse'
import { openPr } from './world'

const viewWith = (over: Record<string, unknown>) => viewOf(JSON.stringify(openPr(over)))

test('only a real gh pr create counts', () => {
  expect(isPrCreate('git push && gh pr create --fill')).toBe(true)
  expect(isPrCreate('gh pr view 3')).toBe(false)
  expect(isPrCreate('echo ghpr create')).toBe(false)
})

test('the last PR link in the output is the new one', () => {
  const ref = prRefOf('see https://github.com/a/b/pull/1\nhttps://github.com/acme/shop/pull/7\n')
  expect(ref).toEqual({ url: 'https://github.com/acme/shop/pull/7', repo: 'acme/shop', number: 7 })
  expect(prRefOf('no link here')).toBe(null)
})

test('a result is read as a record or as plain text', () => {
  expect(outputText({ stdout: 'x', stderr: '' })).toBe('x')
  expect(outputText('y')).toBe('y')
  expect(outputText(undefined)).toBe('')
})

test('check runs and status contexts land in their buckets, failing names kept', () => {
  const checks = checksOf([
    { name: 'build', status: 'COMPLETED', conclusion: 'SUCCESS' },
    { name: 'test', status: 'COMPLETED', conclusion: 'FAILURE' },
    { name: 'deploy', status: 'IN_PROGRESS', conclusion: '' },
    { name: 'docs', status: 'COMPLETED', conclusion: 'SKIPPED' },
    { context: 'lint', state: 'PENDING' },
    { context: 'ci/old', state: 'ERROR' },
    'junk',
  ])
  expect(checks).toEqual({ passed: 1, failed: 2, pending: 2, skipped: 1, failing: ['test', 'ci/old'] })
})

test('review and mergeability map to their states', () => {
  expect(viewWith({ reviewDecision: 'CHANGES_REQUESTED' })?.review).toBe('changes')
  expect(viewWith({ reviewDecision: '' })?.review).toBe('none')
  expect(viewWith({ mergeable: 'CONFLICTING', mergeStateStatus: 'DIRTY' })?.merge).toBe('conflict')
  expect(viewWith({ mergeStateStatus: 'BLOCKED' })?.merge).toBe('blocked')
  expect(viewWith({ mergeable: 'UNKNOWN', mergeStateStatus: 'UNKNOWN' })?.merge).toBe('unknown')
})

test('what is not gh JSON is no answer', () => {
  expect(viewOf('GraphQL: not found')).toBe(null)
  expect(viewOf('[]')).toBe(null)
  expect(viewOf(JSON.stringify({ state: 'WEIRD' }))).toBe(null)
})

test('files with a broken shape are dropped, counts never go negative', () => {
  const view = viewWith({ files: [{ path: 'a.ts', additions: -3 }, { nope: 1 }], additions: 'many' })
  expect(view?.files).toEqual([{ path: 'a.ts', additions: 0, deletions: 0 }])
  expect(view?.additions).toBe(0)
})
