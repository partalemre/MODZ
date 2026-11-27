// Refusal Card: when the model's safeguards end a turn ("…'s safeguards flagged this message"), a card above the
// prompt shows the request that was flagged and offers to report it as a false positive.
//
// turn.start (main loop): keeps the request the turn begins with, and clears a card left by the turn before.
// turn.complete (main loop, reason `refusal`): the engine's own signal for a refused turn, no text matching.
// ui.render (AbovePrompt): the card. Report puts a /feedback line in an empty prompt box; nothing is sent, the
// person reads it and presses Enter, and /feedback opens Claude Code's own form, which asks again before sending.
//
// A refusal the engine retries on a fallback model ends no turn as refused, so it draws no card.

import type { EngineInterface, Register } from 'claude-code'

import { feedbackLine, excerpt } from './flag'
import type { Flag } from './flag'
import { ButtonRow, Card, cardInnerWidth } from './kit/ui'
import type { DrawCtx } from './kit/ui'
import { setLang } from './kit/lang'
import { resolveLight } from './kit/tokens'
import { words } from './words'

type On = Parameters<Register>[0]

// The module's own memory: a reload of the mod forgets a card, which only costs the person the shortcut.
const state: { request: string; flag: Flag | null; isLight: boolean } = { request: '', flag: null, isLight: false }

async function isLightNow($: EngineInterface): Promise<boolean> {
  const override = await $.env.get('MODZ_THEME').catch(() => undefined)
  const rows = await $.config.list().catch(() => [])

  return resolveLight({ override, theme: rows.find(row => row.key === 'theme')?.value })
}

function clear($: EngineInterface): void {
  state.flag = null
  $.ui.invalidate('ui.render')
}

/** Puts the report in the prompt box, only when the box is empty: a draft the person typed is never replaced. */
async function report($: EngineInterface, flag: Flag): Promise<void> {
  const box = await $.prompt.read()
  if (box.text.trim() !== '') {
    $.ui.toast(words().draftTaken)

    return
  }
  const filled = await $.prompt.fill({ text: feedbackLine(flag) })
  if (!filled.isFilled) return
  $.ui.toast(words().filled)
  clear($)
}

function hookTurns(on: On): void {
  on('session.start', async ($, e, next) => {
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    state.isLight = await isLightNow($)
    state.request = ''
    state.flag = null

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    if (e.text.trim() !== '') state.request = e.text
    if (state.flag !== null) clear($)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId === undefined && e.reason === 'refusal') {
      state.flag = { request: state.request, category: e.refusal.category, explanation: e.refusal.explanation }
      $.ui.invalidate('ui.render')
    }

    return result
  })
}

function hookCard(on: On): void {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const flag = state.flag
    if (flag === null || e.props.hasSurvey) return next(e)
    const theirs = await next(e)
    const draw: DrawCtx = { ui: $.ui.resolve(e), surface: e.surface, isLight: state.isLight }
    const says = words()
    const quoted = excerpt(flag.request)
    const pressed = () => void report($, flag).catch(cause => $.ui.log(`refusal-card: could not fill the prompt: ${String(cause)}`, { to: 'debug' }))
    const card = Card(draw, {
      role: 'warn',
      header: { icon: 'flag', eyebrow: says.eyebrow, headline: says.headline, sub: quoted === '' ? says.noRequest : `“${quoted}”`, width: cardInnerWidth(e.props.bodyColumns) },
      children: [
        ButtonRow(draw, {
          buttons: [
            { key: 'refusal-card-report', label: says.report, variant: 'primary', onPress: pressed },
            { key: 'refusal-card-dismiss', label: says.dismiss, variant: 'plain', onPress: () => clear($) },
          ],
        }),
      ],
    })
    const { Box } = draw.ui

    return (
      <Box flexDirection="column">
        {card}
        {theirs}
      </Box>
    )
  })
}

export const register: Register = on => {
  hookTurns(on)
  hookCard(on)
}
