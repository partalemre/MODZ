import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, ProcessRunResult, Timer } from 'claude-code'

import { checksOf, isGitPush, isPrCreate, prInfoOf, prPollOf, prRefOf } from './ci-parse'
import { intervalOf, isBackoffPoll, newWatch, stepOf } from './ci-state'
import type { Step } from './ci-state'
import { notifyText } from './ci-text'
import { hubCardOf } from './hub'
import { CI_SLOW_POLL_MS, EMPTY, GH_TIMEOUT_MS } from './limits'
import { words } from './words'
import type { CiCard, CiWatch } from '../types'

// The CI watch: starts when Claude opens a PR, pushes, or the session opens on a branch with an open PR;
// polls `gh` on a timer until every check is done, the PR leaves the open state, or the longest watch ends.
// Nothing runs where the folder is not a git repo or gh is missing or signed out: each call fails quietly.

// The $.state values this file reads or writes, declared here: the scan lists them per file.
const badgeAtom = atom({ plugin: 'test-badge', key: 'badge' } as const, EMPTY)
const ciAtom = atom({ plugin: 'test-badge', key: 'ci' } as const, null as CiWatch | null)
const ciCardAtom = atom({ plugin: 'test-badge', key: 'ciCard' } as const, null as CiCard | null)
const enabledAtom = atom({ plugin: 'test-badge', key: 'isEnabled' } as const, true)
const hubRef = { plugin: 'test-badge', key: 'hub' } as const

const GH_ENV = { GH_PROMPT_DISABLED: '1', GH_NO_UPDATE_NOTIFIER: '1', NO_COLOR: '1' }
const PR_FIELDS = 'number,url,headRefName,state,title'
const CHECK_FIELDS = 'name,state,bucket,link'
const POLL_FIELDS = 'state,title,reviews,comments'

// A new watch bumps the generation, so a poll still out for the last one is dropped when it answers.
const live = { timer: null as Timer | null, generation: 0, isPolling: false, cardId: 0 }
type Start = { selector: string | null; isFreshRun: boolean }

const debug = ($: EngineInterface, text: string) => $.ui.log(`test-badge: ${text}`, { to: 'debug' })

// A command that cannot start (no gh, no git) or overruns is no answer: the watch stays quiet.
async function run($: EngineInterface, argv: string[], cwd: string): Promise<ProcessRunResult | null> {
  return $.process.run(argv, { cwd, env: GH_ENV, timeoutMs: GH_TIMEOUT_MS }).catch(() => null)
}

async function isGitRepo($: EngineInterface, cwd: string): Promise<boolean> {
  const out = await run($, ['git', 'rev-parse', '--is-inside-work-tree'], cwd)

  return out !== null && out.exitCode === 0 && out.stdout.trim() === 'true'
}

function stop(): void {
  live.timer?.cancel()
  live.timer = null
}

function every($: EngineInterface, spec: { ms: number; generation: number; cwd: string }): void {
  stop()
  live.timer = $.clock.every(spec.ms, () => void poll($, spec).catch(error => debug($, `CI poll failed (${String(error)})`)))
}

// The MODZ main panel's card follows each write of the watch, as register.tsx writes it for a run.
async function writeHub($: EngineInterface): Promise<void> {
  const standing = (await $.state.get(hubRef)).value
  const card = hubCardOf({ badge: await read($, badgeAtom), ci: await read($, ciAtom), standing, at: await $.clock.now() })
  if (card !== null) await $.state.set(hubRef, card)
}

async function clearCard($: EngineInterface): Promise<void> {
  if ((await read($, ciCardAtom)) !== null) await update($, ciCardAtom, () => null)
}

async function startWatch($: EngineInterface, start: Start): Promise<void> {
  if (!(await read($, enabledAtom))) return
  const cwd = await $.session.cwd()
  if (!(await isGitRepo($, cwd))) return
  const argv = ['gh', 'pr', 'view', ...(start.selector === null ? [] : [start.selector]), '--json', PR_FIELDS]
  const out = await run($, argv, cwd)
  const pr = out === null || out.exitCode !== 0 ? null : prInfoOf(out.stdout)
  if (pr === null || pr.state !== 'open') return
  live.generation += 1
  const generation = live.generation
  const watch = newWatch(pr, { now: await $.clock.now(), isFreshRun: start.isFreshRun })
  await update($, ciAtom, () => watch)
  await writeHub($)
  await clearCard($)
  every($, { ms: intervalOf(0), generation, cwd })
  if (!start.isFreshRun) await poll($, { generation, cwd })
}

async function finish($: EngineInterface, step: Step): Promise<void> {
  if (step.heard === null) return
  if (step.heard === 'fail') {
    live.cardId += 1
    const card: CiCard = { id: live.cardId, number: step.watch.number, url: step.watch.url, failing: step.watch.checks.filter(check => check.state === 'fail') }
    await update($, ciCardAtom, () => card)
  }
  const sent = await $.ui.notify(notifyText(step.watch, step.heard), { title: words().ci.eyebrow }).catch(() => null)
  if (sent === null || !sent.isSent) debug($, 'CI notification not sent')
}

async function answers($: EngineInterface, watch: CiWatch, cwd: string) {
  const n = String(watch.number)
  const checks = await run($, ['gh', 'pr', 'checks', n, '--json', CHECK_FIELDS], cwd)
  const pr = await run($, ['gh', 'pr', 'view', n, '--json', POLL_FIELDS], cwd)

  // gh pr checks exits 8 while checks are pending and 1 when one failed: its JSON is read whatever the code.
  return { checks: checks === null ? null : checksOf(checks.stdout), pr: pr === null || pr.exitCode !== 0 ? null : prPollOf(pr.stdout) }
}

// One poll at a time: a tick that comes while one is out is skipped, not queued.
async function poll($: EngineInterface, spec: { generation: number; cwd: string }): Promise<void> {
  if (live.isPolling) return
  live.isPolling = true
  try {
    const watch = await read($, ciAtom)
    if (watch === null || watch.phase !== 'watching' || spec.generation !== live.generation) return
    if (!(await read($, enabledAtom))) return stop()
    const got = await answers($, watch, spec.cwd)
    if (spec.generation !== live.generation) return
    const step = stepOf(watch, { ...got, now: await $.clock.now() })
    await update($, ciAtom, () => step.watch)
    await writeHub($)
    if (step.isDone) stop()
    else if (isBackoffPoll(step.watch.polls)) every($, { generation: spec.generation, cwd: spec.cwd, ms: CI_SLOW_POLL_MS })
    await finish($, step)
  } finally {
    live.isPolling = false
  }
}

function outputOf(result: { text?: string; result?: unknown }): string {
  const record = result.result as { stdout?: unknown } | undefined
  const stdout = typeof record?.stdout === 'string' ? record.stdout : ''

  return `${result.text ?? ''}\n${stdout}`
}

function startQuietly($: EngineInterface, start: Start): void {
  void startWatch($, start).catch(error => debug($, `CI watch did not start (${String(error)})`))
}

export function hookCi(on: On): void {
  // The switch is written at session.start and by /test-badge on|off: on looks for the branch's open PR
  // (a finish already over by then stays quiet), off stops the polling.
  on('state.set', { plugin: 'test-badge', key: 'isEnabled' }, async ($, e, next) => {
    const done = await next(e)
    if (e.value === true) startQuietly($, { selector: null, isFreshRun: false })
    else stop()

    return done
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const result = await next(e)
    const command = String((e as { command?: unknown }).command ?? '')
    if (result.deny !== undefined || result.isError === true) return result
    const ref = isPrCreate(command) ? prRefOf(outputOf(result)) : null
    if (isPrCreate(command) || isGitPush(command)) {
      startQuietly($, { selector: ref === null ? null : String(ref.number), isFreshRun: true })
    }

    return result
  }).catch(($, e, next) => next(e))
}
