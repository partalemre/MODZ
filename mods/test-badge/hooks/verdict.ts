import { countsOf, newTalkOf } from './ci-state'
import { failedOf } from './summary'
import type { Tone } from './summary'
import type { Role } from './tidemark'
import { words } from './words'
import type { Commands } from './detect'
import type { CheckOutcome, CiCheckState, CiWatch, TestBadge } from '../types'

// What the Tests pane says in plain words, for a reader who knows no jargon: the one sentence over both parts, the
// rows of "On this computer", its run button, and the sentence of "On GitHub". Drawing is elsewhere.

export type PaneState = { badge: TestBadge; ci: CiWatch | null; commands: Commands | null }
export type Verdict = { sentence: string; tone: Tone }
export type LocalRow = { name: string; command: string | null; result: string; state: CiCheckState; role: Role | 'lo' }

// While it is not known yet (detection failed), the pane acts as if a test command exists.
export const hasNoCommand = (commands: Commands | null): boolean => commands !== null && commands.test === null && commands.lint === null

// The command as a person would type it; an override's own text, not the shell around it.
export function commandText(argv: string[] | null): string | null {
  if (argv === null) return null

  return argv[0] === '/bin/sh' ? (argv[2] ?? '') : argv.join(' ')
}

const isOver = (ci: CiWatch): boolean => ci.phase === 'merged' || ci.phase === 'closed'
const failingOnGithub = (ci: CiWatch | null): number => (ci === null || isOver(ci) ? 0 : countsOf(ci.checks).failing)

type Trouble = Verdict & { failed: number | null }

function localTrouble({ tests, lint }: TestBadge): Trouble | null {
  const says = words().verdict
  if (tests?.status === 'timeout') return { sentence: says.testsTooLong, tone: 'amber', failed: null }
  if (tests?.status === 'error') return { sentence: says.testsNoStart, tone: 'amber', failed: null }
  if (tests?.status === 'fail') {
    const failed = failedOf(tests)

    return { sentence: failed === null ? says.testsFailing : says.failing(failed), tone: 'flare', failed }
  }
  if (lint === null || lint.status === 'pass') return null
  if (lint.status === 'timeout') return { sentence: says.lintTooLong, tone: 'amber', failed: null }
  if (lint.status === 'error') return { sentence: says.lintNoStart, tone: 'amber', failed: null }

  return { sentence: lint.errors !== null && lint.errors > 0 ? says.lintProblems(lint.errors) : says.lintFailing, tone: 'amber', failed: null }
}

function passing({ badge, ci }: PaneState): Verdict {
  const says = words().verdict
  if (ci !== null && (ci.phase === 'passed' || ci.phase === 'merged')) return { sentence: says.everything, tone: 'moss' }
  if (ci !== null && countsOf(ci.checks).pending > 0) return { sentence: says.passGithubBusy, tone: 'neutral' }

  return { sentence: badge.tests === null ? says.lintClean : says.passHere, tone: 'moss' }
}

export function verdictOf(state: PaneState): Verdict {
  const says = words().verdict
  const { badge, ci, commands } = state
  if (badge.isRunning) return { sentence: says.running, tone: 'kiln' }
  const onGithub = failingOnGithub(ci)
  const trouble = localTrouble(badge)
  if (trouble !== null) return trouble.failed !== null && onGithub > 0 ? { sentence: says.both(trouble.failed, onGithub), tone: 'flare' } : { sentence: trouble.sentence, tone: trouble.tone }
  if (onGithub > 0) return { sentence: says.githubFailing(onGithub), tone: 'flare' }
  if (badge.finishedAt === null) return { sentence: hasNoCommand(commands) ? says.noCommand : says.notRun, tone: 'neutral' }

  return passing(state)
}

function testsResult(outcome: CheckOutcome): Pick<LocalRow, 'result' | 'state' | 'role'> {
  const says = words().local
  if (outcome.status === 'timeout') return { result: says.tooLong, state: 'fail', role: 'amber' }
  if (outcome.status === 'error') return { result: says.noStart, state: 'fail', role: 'amber' }
  if (outcome.status === 'pass') return { result: outcome.total === null ? says.passed : says.nPassed(outcome.total), state: 'pass', role: 'moss' }
  const failed = failedOf(outcome)
  if (failed !== null) return { result: says.nFailed(failed, outcome.total), state: 'fail', role: 'flare' }

  return { result: outcome.passed === null ? says.failed : says.failedYet(outcome.passed), state: 'fail', role: 'flare' }
}

function lintResult(outcome: CheckOutcome): Pick<LocalRow, 'result' | 'state' | 'role'> {
  const says = words().local
  if (outcome.status === 'timeout') return { result: says.tooLong, state: 'fail', role: 'amber' }
  if (outcome.status === 'error') return { result: says.noStart, state: 'fail', role: 'amber' }
  if (outcome.status === 'pass') return { result: says.clean, state: 'pass', role: 'moss' }

  return { result: outcome.errors !== null && outcome.errors > 0 ? says.problems(outcome.errors) : says.failed, state: 'fail', role: 'amber' }
}

const IDLE = (): Pick<LocalRow, 'result' | 'state' | 'role'> => ({ result: words().local.notRun, state: 'skipped', role: 'lo' })
const RUNNING = (): Pick<LocalRow, 'result' | 'state' | 'role'> => ({ result: words().local.running, state: 'pending', role: 'kiln' })

// One row for each check this project has: its name, the command it runs, what happened last.
export function localRowsOf({ badge, commands }: PaneState): LocalRow[] {
  const says = words().local
  if (hasNoCommand(commands) && badge.finishedAt === null) return []
  const testCommand = commandText(commands?.test ?? null)
  const lintCommand = commandText(commands?.lint ?? null)
  const hasLint = lintCommand !== null || badge.lint !== null
  const hasTests = testCommand !== null || badge.tests !== null || commands === null
  const tests: LocalRow = { name: says.tests, command: testCommand, ...(badge.isRunning ? RUNNING() : badge.tests === null ? IDLE() : testsResult(badge.tests)) }
  const lint: LocalRow = { name: says.lint, command: lintCommand, ...(badge.isRunning ? RUNNING() : badge.lint === null ? IDLE() : lintResult(badge.lint)) }

  return [...(hasTests ? [tests] : []), ...(hasLint ? [lint] : [])]
}

export function runLabelOf(commands: Commands | null): string {
  const says = words().local
  if (hasNoCommand(commands)) return says.lookAgain
  if (commands?.test === null) return says.runLint

  return commands === null || commands.lint === null ? says.runTests : says.runBoth
}

function checksSentence(ci: CiWatch): string {
  const says = words().github
  const { passed, failing, pending, total } = countsOf(ci.checks)
  if (ci.phase === 'merged') return says.merged
  if (ci.phase === 'closed') return says.closed
  if (ci.checks.length > 0 && total === 0) return says.allSkipped
  if (total === 0) {
    if (ci.phase === 'watching') return ci.checkedAt === null ? says.asking : says.starting

    return says.noChecks
  }
  if (failing > 0) return says.failing(failing, total)
  if (ci.phase === 'ended') return says.stopped(passed, total)

  return pending > 0 ? says.running(total - pending, total) : says.allPassed(total)
}

export function githubSentence(ci: CiWatch): string {
  const talk = newTalkOf(ci)

  return talk > 0 ? `${checksSentence(ci)} ${words().ci.newTalk(talk)}.` : checksSentence(ci)
}
