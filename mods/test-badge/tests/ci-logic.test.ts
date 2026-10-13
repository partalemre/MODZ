import { expect, test } from 'claude-code/testing'

import { checksOf, isGitPush, isPrCreate, prInfoOf, prPollOf, prRefOf } from '../hooks/ci-parse'
import { intervalOf, newWatch, stepOf } from '../hooks/ci-state'
import type { Poll } from '../hooks/ci-state'
import { fixPrompt, notifyText } from '../hooks/ci-text'
import { hubWith } from '../hooks/hub'
import { setLang } from '../hooks/lang'
import { EMPTY } from '../hooks/limits'
import type { CiCheck, CiWatch, TestBadge } from '../types'

const PR = { number: 7, url: 'https://github.com/acme/shop/pull/7', title: 'Add the checkout page', state: 'open' as const }
const MINUTE = 60_000
const check = (name: string, state: CiCheck['state'], link: string | null = null): CiCheck => ({ name, state, link })
const open = { title: 'Add the checkout page', state: 'open' as const, talk: 0 }
const at = (watch: CiWatch, checks: CiCheck[] | null, now = MINUTE): Poll => ({ checks, pr: open, now })

test('the PR a gh pr create made is read from its output, the last link winning', () => {
  const output = 'Warning: 2 uncommitted changes\nhttps://github.com/acme/shop/pull/3 is the old one\n\nhttps://github.com/acme/shop/pull/7\n'
  expect(prRefOf(output)).toEqual({ number: 7, url: 'https://github.com/acme/shop/pull/7' })
  expect(prRefOf('https://ghe.corp.example/team/app/pull/12')).toEqual({ number: 12, url: 'https://ghe.corp.example/team/app/pull/12' })
  expect(prRefOf('a pull request could not be created')).toBeNull()
})

test('gh pr create and git push start a watch; look-alikes do not', () => {
  expect(isPrCreate('gh pr create --fill')).toBe(true)
  expect(isPrCreate('git push -u origin HEAD && gh pr create --title x --body y')).toBe(true)
  expect(isPrCreate('gh pr view 7')).toBe(false)
  expect(isPrCreate('echo "nogh pr create"')).toBe(false)
  expect(isGitPush('git push')).toBe(true)
  expect(isGitPush('git -C mods push origin main')).toBe(true)
  expect(isGitPush('git pushx')).toBe(false)
  expect(isGitPush('git status')).toBe(false)
})

test('gh JSON is read field by field: buckets map to four states, links only over https', () => {
  const json = JSON.stringify([
    { name: 'lint', state: 'SUCCESS', bucket: 'pass', link: 'https://github.com/acme/shop/actions/runs/1' },
    { name: 'test', state: 'FAILURE', bucket: 'fail', link: 'javascript:alert(1)' },
    { name: 'deploy', state: 'SKIPPED', bucket: 'skipping' },
    { name: 'e2e', state: 'CANCELLED', bucket: 'cancel' },
    { name: 'build', state: 'QUEUED', bucket: 'pending' },
    { state: 'nameless' },
  ])
  expect(checksOf(json)).toEqual([
    check('lint', 'pass', 'https://github.com/acme/shop/actions/runs/1'), check('test', 'fail'), check('deploy', 'skipped'), check('e2e', 'fail'), check('build', 'pending'),
  ])
  expect(checksOf("no checks reported on the 'main' branch")).toBeNull()
  expect(prInfoOf(JSON.stringify({ number: 7, url: PR.url, title: 'x', state: 'MERGED', headRefName: 'b' }))).toMatchObject({ number: 7, state: 'merged' })
  expect(prInfoOf('{"number":"7"}')).toBeNull()
  expect(prPollOf(JSON.stringify({ state: 'OPEN', title: 't', reviews: [{}, {}], comments: [{}] }))).toEqual({ title: 't', state: 'open', talk: 3 })
})

test('pending, then a failure: the finish is heard, so it earns the card and a notification', () => {
  const start = newWatch(PR, { now: 0, isFreshRun: true })
  const first = stepOf(start, at(start, [check('lint', 'pending'), check('test', 'pending')]))
  expect(first).toMatchObject({ isDone: false, heard: null, watch: { phase: 'watching', hasSeenPending: true, polls: 1 } })
  const last = stepOf(first.watch, at(first.watch, [check('lint', 'pass'), check('test', 'fail')], 2 * MINUTE))
  expect(last).toMatchObject({ isDone: true, heard: 'fail', watch: { phase: 'failed' } })
})

test('pending, then all green: heard as a pass; skipped checks finish too', () => {
  const start = newWatch(PR, { now: 0, isFreshRun: false })
  const first = stepOf(start, at(start, [check('lint', 'pending'), check('docs', 'skipped')]))
  const last = stepOf(first.watch, at(first.watch, [check('lint', 'pass'), check('docs', 'skipped')]))
  expect(last).toMatchObject({ isDone: true, heard: 'pass', watch: { phase: 'passed' } })
})

test('a run already done when the watch began stops quietly: nothing was heard finishing', () => {
  const atOpen = newWatch(PR, { now: 0, isFreshRun: false })
  expect(stepOf(atOpen, at(atOpen, [check('lint', 'fail')]))).toMatchObject({ isDone: true, heard: null, watch: { phase: 'failed' } })
  // After a push the last commit's finished run shows first: it is waited out for the grace polls, then let go.
  let watch = newWatch(PR, { now: 0, isFreshRun: true })
  for (const n of [1, 2]) {
    const step = stepOf(watch, at(watch, [check('lint', 'pass')], n * MINUTE))
    expect(step.isDone).toBe(false)
    watch = step.watch
  }
  expect(stepOf(watch, at(watch, [check('lint', 'pass')], 3 * MINUTE))).toMatchObject({ isDone: true, heard: null, watch: { phase: 'passed' } })
})

test('the watch stops when the PR is merged or closed, when no check ever reports, and at the longest watch', () => {
  const start = newWatch(PR, { now: 0, isFreshRun: true })
  expect(stepOf(start, { checks: [check('lint', 'pending')], pr: { ...open, state: 'merged' }, now: MINUTE })).toMatchObject({ isDone: true, heard: null, watch: { phase: 'merged' } })
  expect(stepOf(start, { checks: null, pr: { ...open, state: 'closed' }, now: MINUTE }).watch.phase).toBe('closed')
  let watch = start
  for (let n = 1; n <= 4; n += 1) watch = stepOf(watch, at(watch, null, n * MINUTE)).watch
  expect(stepOf(watch, at(watch, null, 5 * MINUTE))).toMatchObject({ isDone: true, watch: { phase: 'none' } })
  const long = stepOf(start, at(start, [check('lint', 'pending')], 90 * MINUTE))
  expect(long).toMatchObject({ isDone: true, heard: null, watch: { phase: 'ended' } })
})

test('a gh call that fails keeps the last checks rather than forgetting them', () => {
  const start = newWatch(PR, { now: 0, isFreshRun: true })
  const first = stepOf(start, at(start, [check('lint', 'pending')]))
  const lost = stepOf(first.watch, { checks: null, pr: null, now: 2 * MINUTE })
  expect(lost.watch.checks).toEqual([check('lint', 'pending')])
  expect(lost.watch.title).toBe('Add the checkout page')
})

test('polls come a minute apart, then three after ten polls', () => {
  expect(intervalOf(0)).toBe(MINUTE)
  expect(intervalOf(9)).toBe(MINUTE)
  expect(intervalOf(10)).toBe(3 * MINUTE)
})

const watchWith = (checks: CiCheck[], phase: CiWatch['phase']): CiWatch => ({ ...newWatch(PR, { now: 0, isFreshRun: false }), checks, phase })
const ran: TestBadge = { ...EMPTY, finishedAt: 1, tests: { status: 'pass', passed: 42, total: 42, errors: null, failures: [], tail: [] } }

test('the hub line says CI in ≤40 characters, beside the local checks when both fit', () => {
  for (const lang of ['en', 'tr']) {
    setLang(lang)
    const checks = [check('lint', 'pass'), check('a', 'pass'), check('b', 'pass'), check('test', 'fail')]
    const shown = hubWith(ran, watchWith(checks, 'failed'))
    expect(shown.detail.length).toBeLessThanOrEqual(40)
    expect(shown.tone).toBe('bad')
  }
  setLang('en')
  expect(hubWith(EMPTY, watchWith([check('lint', 'pass'), check('a', 'pass'), check('b', 'pass'), check('test', 'fail')], 'failed')).detail).toBe('CI 3/4 · 1 failing')
  expect(hubWith(ran, watchWith([check('lint', 'pass'), check('test', 'pending')], 'watching'))).toEqual({ detail: '42/42 passed · CI 1/2 · 1 running', tone: 'live' })
  expect(hubWith(ran, watchWith([check('lint', 'pass'), check('docs', 'skipped')], 'passed'))).toEqual({ detail: '42/42 passed · CI 1/1 passed', tone: 'ok' })
  expect(hubWith(EMPTY, watchWith([], 'merged')).detail).toBe('PR #7 merged')
  expect(hubWith(ran, watchWith([], 'none'))).toEqual({ detail: '42/42 passed', tone: 'ok' })
  expect(hubWith(ran, null).detail).toBe('42/42 passed')
  setLang('tr')
  expect(hubWith(EMPTY, watchWith([check('lint', 'pass'), check('test', 'fail')], 'failed')).detail).toBe('CI 1/2 · 1 başarısız')
  setLang('en')
})

test('"Ask Claude to fix" names each failing check with its link, and the notification says what happened', () => {
  setLang('en')
  const failing = [check('lint', 'fail', 'https://github.com/acme/shop/actions/runs/1/job/2'), check('e2e', 'fail')]
  const text = fixPrompt({ id: 1, number: 7, url: PR.url, failing })
  expect(text).toContain('CI failed on PR #7 (https://github.com/acme/shop/pull/7)')
  expect(text).toContain('- lint: https://github.com/acme/shop/actions/runs/1/job/2\n- e2e\n')
  expect(text).toContain('gh run view --log-failed')
  const watch = watchWith([check('lint', 'fail'), check('e2e', 'fail'), check('unit', 'fail'), check('docs', 'pass')], 'failed')
  expect(notifyText(watch, 'fail')).toBe('CI failed: lint, e2e +1 · #7')
  expect(notifyText(watchWith([check('lint', 'pass')], 'passed'), 'pass')).toBe('CI passed · #7 · 1/1')
  setLang('tr')
  expect(fixPrompt({ id: 1, number: 7, url: PR.url, failing })).toContain('PR #7 için CI kaldı')
  setLang('en')
})
