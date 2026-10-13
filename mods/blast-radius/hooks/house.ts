// House rules for the gray zone: a Bash command blast-radius's own rules don't hold and that is
// not plainly read-only is weighed against `.claude/house-rules.md`, when the person wrote one.
// One judge call per command at most (kit/judge.ts, haiku on the person's own account; Jev when
// they opted in), its verdict kept for the session. allow runs it, ask holds it on the Amber
// card, block refuses it. No verdict (no model, a timeout, a stray reply) runs it: a judge that
// failed never stops the person's work.

import type { EngineInterface, Register } from 'claude-code'

import { ruleView } from './caution'
import { classify } from './classify'
import { PANE_ID, SLEEP_TIMEOUT_MS, hold, take } from './hold'
import type { Decision, Held, HoldIo } from './hold'
import { judge } from './kit/judge'
import type { JudgeIo } from './kit/judge'
import { RULES_FILE, instructionsFor, isReadOnly, labelsFor, parseRules, redact, verdictOf } from './rules'
import type { Verdict } from './rules'
import { words } from './words'

type On = Parameters<Register>[0]

const WHY: Record<Exclude<Decision, 'proceed' | 'cancel' | 'error'>, string> = {
  closed: 'the user closed the Blast Radius pane',
  timeout: 'no answer within 10 minutes',
  interrupted: 'the turn was interrupted',
}

// Verdicts for the session, by exact command; dropped when the rules change.
const cache = { rules: '', verdicts: new Map<string, Verdict>() }

// The hold loop's calls, spelled here: the engine follows `$` only within one file.
const holdIo = ($: EngineInterface): HoldIo => ({
  sleep: seconds => $.process.run(['sleep', seconds], { timeoutMs: SLEEP_TIMEOUT_MS }),
  now: () => $.clock.now(),
  open: async rows => (await $.ui.open({ id: PANE_ID, title: 'Blast Radius', focus: true, closeOnEscape: true, rows })).isPlaced,
  close: () => $.ui.close({ id: PANE_ID }),
  redraw: () => $.ui.invalidate('ui.render'),
})

/** The rules in the session's project, or none when it has no rules file. */
async function rulesOf($: EngineInterface): Promise<string[]> {
  const text = await $.fs.read(`${await $.session.root()}/${RULES_FILE}`).catch(() => '')

  return typeof text === 'string' ? parseRules(text) : []
}

async function judged($: EngineInterface, input: { command: string; rules: string[] }): Promise<Verdict | null> {
  const key = input.rules.join('\n')
  if (cache.rules !== key) cache.verdicts.clear()
  cache.rules = key
  const known = cache.verdicts.get(input.command)
  if (known !== undefined) return known
  const env = { backend: await $.env.get('MODZ_JUDGE'), typesafeKey: await $.env.get('TYPESAFE_API_KEY') }
  const io: JudgeIo = { complete: request => $.model.complete(request), fetch: (url, init) => $.http.fetch(url, init), sleep: ms => $.clock.sleep(ms), redact, env }
  const answer = await judge(io, { text: input.command, labels: labelsFor(input.rules), instructions: instructionsFor(input.rules) })
  const verdict = answer === undefined ? null : verdictOf(answer.label, input.rules)
  if (verdict !== null) cache.verdicts.set(input.command, verdict)

  return verdict
}

type Ask = { command: string; rule: string; signal: AbortSignal }

async function prepare($: EngineInterface, mine: Held, input: Ask): Promise<boolean> {
  const card = { command: input.command, rule: input.rule, cwd: await $.session.cwd() }
  mine.view = () => ruleView(card)

  return true
}

/** Holds the command on the card; a deny unless the person runs it. */
async function ask($: EngineInterface, input: Ask): Promise<{ deny: string } | null> {
  const noAnswer = `Blast Radius held this command and did not run it: a house rule (${input.rule}) asks the user first`
  if ((await $.session.surfaces()).length === 0) return { deny: `${noAnswer}, and nobody is here to answer. Do not retry it.` }
  const mine = await take(holdIo($), { command: input.command, signal: input.signal, canStrike: false })
  if (mine !== null) await hold(holdIo($), mine, { signal: input.signal, prepare: () => prepare($, mine, input) })
  const decision = mine?.decision ?? 'interrupted'
  // A card that broke lets the command through: a house rule is a caution, not a lock.
  if (decision === 'proceed' || decision === 'error') return null
  if (decision === 'cancel' || decision === 'closed') $.ui.toast(words().kept)
  const why = decision === 'cancel' ? words().cancelWhy : WHY[decision]

  return { deny: `Blast Radius held this command and did not run it: ${why}. House rule: ${input.rule}. Do not retry it unless the user asks you to.` }
}

/** A new session judges afresh; register's session.start calls it. */
export function resetHouse(): void {
  cache.verdicts.clear()
}

export function houseHooks(on: On): void {
  // Risky commands are blast-radius's own (register.tsx); plain reads are never judged.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const command = String(e.command ?? '')
    if (classify(command) !== null || isReadOnly(command)) return next(e)
    const rules = await rulesOf($)
    if (rules.length === 0) return next(e)
    const verdict = await judged($, { command, rules })
    if (verdict === null) $.ui.log('blast-radius: the house rules got no verdict for a command, so it runs', { to: 'debug' })
    if (verdict === null || verdict.kind === 'allow') return next(e)
    const rule = verdict.rule ?? words().house.anyRule
    if (verdict.kind === 'block') {
      return { deny: `Blast Radius blocked this command: it breaks a house rule in ${RULES_FILE} (${rule}). Do not retry it or work around it; ask the user if it is needed.` }
    }
    const refused = await ask($, { command, rule, signal: next.signal })

    return refused ?? next(e)
  }).catch(($, e, next) => next(e))
}
