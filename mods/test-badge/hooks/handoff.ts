import type { On } from 'claude-code'

import type { Commands } from './detect'
import { placeOf } from './open'
import { words } from './words'
import type { CheckOutcome, TestBadge } from '../types'

// A failed run is offered to the next prompt as the box's dim suggestion (Tab takes it). Only a prompt that is
// that suggestion carries the failing output, once, as context the model reads: no model call, nothing sent
// unless the person takes it.

const MAX_LINES = 20
const live = { offer: null as { text: string; context: string } | null }

function outcomeLines(outcome: CheckOutcome): string[] {
  const failures = outcome.failures.slice(0, MAX_LINES).map(failure => `${placeOf(failure)} ${failure.name} — ${failure.message}`.trim())

  return failures.length > 0 ? failures : outcome.tail
}

export function contextOf(badge: TestBadge, commands: Commands): string {
  const root = badge.root ?? '.'
  const runs: [CheckOutcome | null, string[] | null][] = [[badge.tests, commands.test], [badge.lint, commands.lint]]
  const parts = runs.flatMap(([outcome, argv]) =>
    outcome === null || outcome.status === 'pass' || argv === null ? [] : [[words().fixContext(argv.join(' '), root), ...outcomeLines(outcome)].join('\n')])

  return parts.join('\n\n')
}

// Called after every run, with the engine's `$.prompt.suggest` as a closure: a green or empty run takes the
// offer back.
export async function offerFix(suggest: (text: string) => Promise<unknown>, run: { badge: TestBadge; commands: Commands }): Promise<void> {
  const context = contextOf(run.badge, run.commands)
  if (context === '') {
    live.offer = null

    return
  }
  live.offer = { text: words().fixSuggestion, context }
  await suggest(live.offer.text)
}

export function hookHandoff(on: On): void {
  on('prompt.submit', async ($, e, next) => {
    const offer = live.offer
    if (offer === null || e.text.trim() !== offer.text) return next(e)
    live.offer = null

    return next({ ...e, context: [...(e.context ?? []), offer.context] })
  }).catch(($, e, next) => next(e))
}
