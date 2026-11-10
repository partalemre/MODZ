// The band's hooks, moved out of register.ts as they were: the hold card's actions, the theme it follows, and the
// band itself (the hold card above the other plugins' rows, the status row below them).

import type { EngineInterface, On } from 'claude-code'

import { composeBand } from './band'
import type { Prefs } from './band'
import type { State } from './core'
import { NAME } from './guard'
import type { HoldActions } from './hold'
import { pinned } from './pin'
import { isLightTheme } from './theme'

function actions($: EngineInterface, s: State): HoldActions {
  const release = () => {
    const held = s.held
    s.held = null
    $.ui.invalidate('ui.render')
    return held
  }
  return {
    pay: () => void (async () => {
      const held = release()
      if (!held) return
      s.resend = held.text
      s.isWarmAfterPay = true
      await $.prompt.submit({ text: held.text, asUser: true })
    })(),
    fresh: () => void (async () => {
      const held = release()
      await $.command.run({ command: 'clear' })
      if (held) await $.prompt.fill({ text: held.text })
    })(),
    status: () => void $.command.run({ command: NAME }),
  }
}

export function wireBand(on: On, c: { s: State; prefs: Prefs }) {
  const { s } = c
  on('config.set', { key: 'theme' }, async ($, e, next) => {
    const result = await next(e)
    if (result.deny === undefined) {
      c.prefs.isLight = isLightTheme(result.value)
      if (s.hasBand) $.ui.invalidate('ui.render')
    }
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const theirs = await next(e)
    if (!s.hasBand || e.props.hasSurvey) return theirs
    const band = { s, prefs: c.prefs, actions: actions($, s), columns: e.props.bodyColumns, now: await $.clock.now() }
    if (e.surface === 'desktop') return pinned(e, composeBand({ surface: 'desktop', ui: $.ui.resolve(e) }, theirs, band))
    if (e.surface === 'terminal') return pinned(e, composeBand({ surface: 'terminal', ui: $.ui.resolve(e) }, theirs, band))
    return theirs
  })
}
