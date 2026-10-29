// The guard on a typed prompt: a cold send of a big context waits once. Cold is the one-hour clock running out,
// or a model change, since the cache belongs to the model that wrote it. Of a prompt only its first character is
// read, and its text kept while it waits.

import type { PromptSubmitInput, PromptSubmitResult } from 'claude-code'

import { BIG_TOKENS, isCold } from './core'
import type { State } from './core'
import { switchOf } from './model-switch'
import type { ModelSwitch } from './model-switch'
import { dropText, warnText } from './words'

export const NAME = 'cache-tax'

// Prompts no person sent, so nobody could send them again after a refusal. Every other origin, sdk and Slack
// included, may carry a person's words and keeps the guard.
const UNATTENDED = new Set(['task-notification', 'scheduled-trigger', 'peer', 'peer-send-message', 'projects-relay', 'coordinator', 'observer', 'observer-activity'])

export type Submit = { e: PromptSubmitInput; next: (e: PromptSubmitInput) => Promise<PromptSubmitResult> }

/** The guard's reach, bound in register.ts, the one file that holds `$`. */
export type GuardIo = {
  now: () => Promise<number>
  model: () => Promise<string>
  log: (text: string) => void
  redraw: () => void
}

/** The switch the next send would make, read only once a turn has named the cache's model. */
async function switchNow(io: GuardIo, s: State): Promise<ModelSwitch | null> {
  if (!s.cacheModel) return null
  return switchOf(s.cacheModel, await io.model())
}

function release(io: GuardIo, s: State) {
  if (s.held && s.hasBand) io.redraw()
  s.held = null
}

// The card's own resend: the person pressed pay, so its cold write is scored.
function ownResend(s: State, { e, next }: Submit): Promise<PromptSubmitResult> {
  if (e.origin.kind === 'plugin' && e.origin.name === NAME && e.text === s.resend) {
    s.resend = null
    s.coldWritePending = true
  }
  return next(e)
}

export async function onPrompt(io: GuardIo, s: State, { e, next }: Submit): Promise<PromptSubmitResult> {
  if (e.origin.kind === 'plugin') return ownResend(s, { e, next })
  if (typeof e.text !== 'string' || e.text.trimStart().startsWith('/') || s.ctx < BIG_TOKENS) return next(e)
  const now = await io.now()
  const switched = await switchNow(io, s)
  if (!switched && !isCold(s, now)) {
    // Switched back while a switch held the send: that card no longer says anything true.
    if (s.held?.switch) release(io, s)
    return next(e)
  }
  const isUnattended = UNATTENDED.has(e.origin.kind)
  if (s.guard === 'warn' || isUnattended || s.ackedAt === s.lastRequestAt) {
    if (s.guard === 'warn' || isUnattended) io.log(warnText(s, { now, switched }))
    s.ackedAt = 0
    s.coldWritePending = true
    release(io, s)
    return next(e)
  }
  s.ackedAt = s.lastRequestAt
  s.held = { text: e.text, at: now, switch: switched }
  if (s.hasBand) io.redraw()
  return { drop: dropText(s, now) }
}
