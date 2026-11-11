import { expect, test } from 'claude-code/testing'

import { setLang } from '../hooks/lang'
import { EMPTY } from '../hooks/limits'
import { commandText, githubSentence, localRowsOf, runLabelOf, verdictOf } from '../hooks/verdict'
import { newGh, paneOf, setupCi, shownText } from './ci-world'
import type { CheckOutcome, CiCheck, CiWatch } from '../types'

// The pane's one sentence and its two parts, in words a reader with no jargon can follow.
const outcome = (over: Partial<CheckOutcome>): CheckOutcome => ({ status: 'pass', passed: null, total: null, errors: null, failures: [], tail: [], ...over })
const ran = (over: object) => ({ ...EMPTY, finishedAt: 1, ...over })
const check = (state: CiCheck['state']): CiCheck => ({ name: state, state, link: null })
const ci = (phase: CiWatch['phase'], checks: CiCheck[], polled = true): CiWatch => ({
  number: 7, url: 'u', title: 't', checks, phase, talkAtStart: 0, talk: 0, startedAt: 0, checkedAt: polled ? 1 : null, polls: 1, isFreshRun: false, hasSeenPending: false,
})
const NPM = { test: ['npm', 'test'], lint: null }
const sentence = (spec: { badge?: object; ci?: CiWatch | null; commands?: typeof NPM | { test: null; lint: null } | null }) =>
  verdictOf({ badge: { ...EMPTY, ...spec.badge }, ci: spec.ci ?? null, commands: spec.commands === undefined ? NPM : spec.commands })

test('one sentence says the whole state, the worse side first', () => {
  setLang('en')
  const pass = { tests: outcome({ passed: 42, total: 42 }), finishedAt: 1 }
  const fail = { tests: outcome({ status: 'fail', passed: 39, total: 42 }), finishedAt: 1 }

  expect(sentence({})).toEqual({ sentence: 'No tests run yet', tone: 'neutral' })
  expect(sentence({ commands: { test: null, lint: null } })).toEqual({ sentence: 'No test command found', tone: 'neutral' })
  expect(sentence({ badge: { isRunning: true } })).toEqual({ sentence: 'Running your tests…', tone: 'kiln' })
  expect(sentence({ badge: fail })).toEqual({ sentence: '3 tests failing', tone: 'flare' })
  expect(sentence({ badge: fail, ci: ci('failed', [check('fail')]) }).sentence).toBe('3 tests and 1 automatic check on GitHub failing')
  expect(sentence({ badge: pass, ci: ci('failed', [check('fail'), check('fail')]) })).toEqual({ sentence: '2 automatic checks failing on GitHub', tone: 'flare' })
  expect(sentence({ badge: pass, ci: ci('passed', [check('pass')]) })).toEqual({ sentence: 'Everything passes', tone: 'moss' })
  expect(sentence({ badge: pass, ci: ci('watching', [check('pending')]) }).sentence).toBe('Tests pass, GitHub is still checking')
  // GitHub tested nothing, so "everything" would overclaim.
  expect(sentence({ badge: pass, ci: ci('none', []) })).toEqual({ sentence: 'All tests pass on this computer', tone: 'moss' })
  // A merged PR's old red is over.
  expect(sentence({ badge: pass, ci: ci('merged', [check('fail')]) }).sentence).toBe('Everything passes')
  expect(sentence({ badge: { lint: outcome({ status: 'fail', errors: 2 }), tests: outcome({}), finishedAt: 1 } })).toEqual({ sentence: '2 style-rule problems', tone: 'amber' })
})

test('the local rows name each check, its command and what happened', () => {
  setLang('en')
  const commands = { test: ['npm', 'test'], lint: ['/bin/sh', '-c', 'make lint'] }
  expect(localRowsOf({ badge: EMPTY, ci: null, commands }).map(row => [row.name, row.command, row.result])).toEqual([
    ['Tests', 'npm test', 'not run yet'],
    ['Style-rule check (lint)', 'make lint', 'not run yet'],
  ])
  const failed = ran({ tests: outcome({ status: 'fail', passed: 39, total: 42 }), lint: outcome({ status: 'timeout' }) })
  expect(localRowsOf({ badge: failed, ci: null, commands }).map(row => [row.result, row.role])).toEqual([['3 of 42 failed', 'flare'], ['took too long', 'amber']])
  expect(localRowsOf({ badge: { ...EMPTY, isRunning: true }, ci: null, commands: NPM }).map(row => row.result)).toEqual(['running…'])
  expect(localRowsOf({ badge: EMPTY, ci: null, commands: { test: null, lint: null } })).toEqual([])
  expect(commandText(null)).toBeNull()
})

test('the run button says what it runs', () => {
  setLang('en')
  expect(runLabelOf({ test: ['t'], lint: ['l'] })).toBe('Run tests and style-rule check')
  expect(runLabelOf({ test: ['t'], lint: null })).toBe('Run tests')
  expect(runLabelOf({ test: null, lint: ['l'] })).toBe('Run style-rule check')
  expect(runLabelOf({ test: null, lint: null })).toBe('Look again')
  expect(runLabelOf(null)).toBe('Run tests')
})

test('GitHub with no checks at all says so, and what that means', () => {
  setLang('en')
  expect(githubSentence(ci('none', []))).toContain('nothing was tested there')
  expect(githubSentence(ci('watching', [], false))).toBe('Asking GitHub…')
  expect(githubSentence(ci('watching', []))).toContain('may still be starting')
  expect(githubSentence(ci('passed', [check('skipped')]))).toContain('skipped every check')
  expect(githubSentence(ci('watching', [check('pass'), check('pending')]))).toBe('1 of 2 checks done, the rest still running.')
  expect(githubSentence({ ...ci('passed', [check('pass'), check('pass')]), talk: 1 })).toBe('All 2 checks passed. 1 new review or comment.')
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: the pane names both places, and no CI, whatever GitHub says`, async ($: any, on: any) => {
    const gh = newGh({ checks: null })
    const clock = await setupCi($, on, { gh, surface, hasTests: true })
    for (let poll = 0; poll < 5; poll += 1) await clock.advance(60_000)
    const text = shownText(await (await $.ui.mount(paneOf(surface))).drawn())

    expect(text).toContain('On this computer')
    expect(text).toContain('npm run --silent test')
    expect(text).toContain('On GitHub')
    expect(text).toContain('Change request #7')
    expect(text).toContain('GitHub reported no automatic checks')
    expect(text).not.toMatch(/\bCI\b/)
  })

  test(`${surface}: with no PR followed the GitHub part still says why it is empty`, async ($: any, on: any) => {
    const gh = newGh({ branchPr: null })
    await setupCi($, on, { gh, surface })
    const pane = await $.ui.mount(paneOf(surface))
    const text = shownText(await pane.drawn())

    expect(text).toContain('No test command found')
    expect(text).toContain('No change request (pull request) is being followed')
    expect((await pane.find({ key: 'tb-rerun' }))?.props?.label).toBe('Look again')
  })
}
