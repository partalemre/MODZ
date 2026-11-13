// Keeps Claude's reply in the person's language after English tool output or a subagent's English report
// (anthropics/claude-code#96326): one short reminder rides the tool's result, at most once per main-loop turn.
import type { EngineInterface, Register } from 'claude-code'

import { lang } from './kit/lang'
import { needsReminder, reminderOf, targetOf, whyReminderOf } from './reply-language'
import type { Target } from './reply-language'

type On = Parameters<Register>[0]
type Options = Parameters<Register>[1]

// The language the current turn still owes a reminder in; spent by the first reminder, set again by the next turn.
let armed: Target | undefined

async function languageSetting($: EngineInterface): Promise<unknown> {
  try {
    // The merged object, not `{ key }`: an engine a release behind reads no single key.
    return (await $.settings.read()).language
  } catch (cause) {
    $.ui.log(`modz: the language setting could not be read: ${String(cause)}`, { to: 'debug' })

    return undefined
  }
}

// The loops (the main one, each subagent's) whose current turn has not yet been asked to say why it does a step.
const MAIN = 'main'
const unasked = new Set<string>()

// One hook per event holds both jobs (the engine takes one unmatched hook of an event per plugin): the language
// reminder after English output, and once a turn, on its first tool result, the request to say in a sentence
// what each next step is for.
export function wireLanguageKeeper(on: On, options: Options): void {
  const keepsLanguage = options.keepReplyLanguage !== false
  const asksWhy = options.sayWhy !== false
  if (!keepsLanguage && !asksWhy) return

  // Read each turn, so a changed `language` setting holds from the next prompt. A subagent's loop is not the reply
  // (an engine a release behind names no `agentId` here, hence the widening).
  on('turn.start', async ($, e, next) => {
    const agentId = (e as { agentId?: string }).agentId
    if (asksWhy) unasked.add(agentId ?? MAIN)
    if (agentId === undefined) armed = targetOf({ setting: await languageSetting($), uiLang: lang() })

    return next(e)
  })

  // A subagent's report reaches the main loop as the Agent call's result, so that call is heard here too.
  on('tool.call', async (_$, e, next) => {
    const result = await next(e)
    // A mod's own background call (transceiver polling ArtifactData) is not Claude's step: a note riding it
    // reaches nobody and would spend the turn's one request.
    if (next.origin.plugin !== 'engine') return result
    const why = asksWhy && unasked.delete(e.agentId ?? MAIN) ? [whyReminderOf(armed)] : []
    const target = armed
    const needsLanguage = keepsLanguage && target !== undefined && e.agentId === undefined && typeof result.text === 'string' && needsReminder({ text: result.text, target })
    if (needsLanguage) armed = undefined
    const added = [...why, ...(needsLanguage && target !== undefined ? [reminderOf(target)] : [])]
    // A refused call carries no note: there is no result for one to ride on.
    if (added.length === 0 || result.deny !== undefined) return result

    return { ...result, context: [...(result.context ?? []), ...added] }
  })
}
