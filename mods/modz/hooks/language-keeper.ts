// Keeps Claude's reply in the person's language after English tool output or a subagent's English report
// (anthropics/claude-code#96326): one short reminder rides the tool's result, at most once per main-loop turn.
import type { EngineInterface, Register } from 'claude-code'

import { lang } from './kit/lang'
import { needsReminder, reminderOf, targetOf } from './reply-language'
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

export function wireLanguageKeeper(on: On, options: Options): void {
  if (options.keepReplyLanguage === false) return

  // Read each turn, so a changed `language` setting holds from the next prompt. A subagent's loop is not the reply
  // (an engine a release behind names no `agentId` here, hence the widening).
  on('turn.start', async ($, e, next) => {
    if ((e as { agentId?: string }).agentId === undefined) armed = targetOf({ setting: await languageSetting($), uiLang: lang() })

    return next(e)
  })

  // A subagent's report reaches the main loop as the Agent call's result, so that call is heard here too.
  on('tool.call', async (_$, e, next) => {
    const result = await next(e)
    const target = armed
    if (target === undefined || e.agentId !== undefined || typeof result.text !== 'string') return result
    if (!needsReminder({ text: result.text, target })) return result
    armed = undefined

    return { ...result, context: [...(result.context ?? []), reminderOf(target)] }
  })
}
