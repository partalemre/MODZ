// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0
//
// Blast Radius: holds a risky Bash command and shows what it would change.
//
// tool.call (Bash): if the command is risky, work out its blast radius, open a
// pane with the delete button and Vazgeç, and hold the call until one is pressed.
// A command that would change nothing (no such file, no changes) runs with no card.
// ui.render (Pane): draws the card. If the surface won't place the pane (a
// narrow terminal), the same card is drawn in the AbovePrompt band, above the
// other mods' rows.
//
// Holding: a hook has 10 s of its own time, but time spent inside a `$` call is
// free. So the hold loop waits on a short `$.process.run(["sleep", ...])` until
// a button's onPress sets the decision. Anything unexpected refuses the command.
//
// The host reads `on(...)` and `$.noun.method(...)` from source, so `$` stays in
// this file; the measuring modules get a `run` closure instead.

import type { EngineInterface, Register } from 'claude-code'

import { desktopCard, terminalCard } from './card'
import type { CardProps } from './card'
import { classify } from './classify'
import type { Risk } from './classify'
import { measure, missingFolder } from './measure'
import type { Report, Run } from './report'
import { stamped } from './stamp'
import { resolveLight } from './theme'
import { viewOf } from './view'

const PANE_ID = 'blast-radius'
const POLL_SECONDS = '0.25'
const STRIKE_SECONDS = '0.9'
const SLEEP_TIMEOUT_MS = 5000
const HOLD_LIMIT_MS = 10 * 60 * 1000
const PANE_ROWS_MAX = 24
const PANE_ROWS_CHROME = 9

type Decision = 'proceed' | 'cancel' | 'closed' | 'timeout' | 'interrupted' | 'error'

type Held = {
  command: string
  risk: Risk
  report: Report | null
  cwd: string
  decision: Decision | null
  where: 'pane' | 'band'
  phase: CardProps['phase']
  isExpanded: boolean
}

// The call being held, or null. One at a time: Bash calls in a turn run in order.
let held: Held | null = null
const theme = { isLight: false }

const WHY: Record<Exclude<Decision, 'proceed'>, string> = {
  cancel: 'the user pressed Vazgeç (cancel)',
  closed: 'the user closed the Blast Radius pane',
  timeout: 'no answer within 10 minutes',
  interrupted: 'the turn was interrupted',
  error: 'Blast Radius hit an error while holding it',
}

const refusal = (why: string, summary: string): { deny: string } => ({
  deny: `Blast Radius held this command and did not run it: ${why}. It would have: ${summary}. Do not retry it unless the user asks you to.`,
})

async function pause($: EngineInterface, seconds: string): Promise<void> {
  await $.process.run(['sleep', seconds], { timeoutMs: SLEEP_TIMEOUT_MS })
}

// Resolves a `cd` target to an absolute folder, or null if it doesn't exist.
// The target is passed as an argument, never as source.
const CD_SCRIPT = `unset CDPATH; d="$1"; case "$d" in "~") d="$HOME";; "~/"*) d="$HOME/\${d#\\~/}";; esac; cd -- "$d" 2>/dev/null && pwd -P`

async function resolveDir($: EngineInterface, sessionCwd: string, dir: string): Promise<string | null> {
  if (dir === '-') return null // `cd -` depends on the shell's history
  const ran = await $.process.run(['bash', '-c', CD_SCRIPT, 'blast-radius', dir], { cwd: sessionCwd, timeoutMs: SLEEP_TIMEOUT_MS })
  const out = ran.stdout.trim()

  return ran.exitCode === 0 && out !== '' ? out : null
}

/** Where the command will run (the session folder, moved by `cd dir &&` or `git -C dir`), and what it would change there. */
async function survey($: EngineInterface, mine: Held): Promise<void> {
  const sessionCwd = await $.session.cwd()
  const cwd = mine.risk.dir ? await resolveDir($, sessionCwd, mine.risk.dir) : sessionCwd
  const run: Run = (argv, options) => $.process.run(argv, options)
  mine.cwd = cwd ?? sessionCwd
  mine.report = cwd === null ? missingFolder(mine.risk) : await measure(run, mine.risk, cwd)
}

async function waitForDecision($: EngineInterface, mine: Held, signal: AbortSignal): Promise<void> {
  const startedAt = await $.clock.now()
  while (mine.decision === null) {
    if (signal.aborted) {
      mine.decision = 'interrupted'
    } else if ((await $.clock.now()) - startedAt > HOLD_LIMIT_MS) {
      mine.decision = 'timeout'
    } else {
      await pause($, POLL_SECONDS)
    }
  }
}

/** One question at a time: a second risky call (a subagent's) waits for the first answer. */
async function waitForTurn($: EngineInterface, signal: AbortSignal): Promise<boolean> {
  while (held !== null) {
    if (signal.aborted) return false
    await pause($, POLL_SECONDS)
  }

  return true
}

function paneRows(mine: Held): number {
  const rows = mine.report === null ? 0 : viewOf({ ...mine, report: mine.report }).rows.length

  return Math.min(PANE_ROWS_MAX, PANE_ROWS_CHROME + rows)
}

async function hold($: EngineInterface, mine: Held, signal: AbortSignal): Promise<void> {
  let isPlaced = false
  try {
    await survey($, mine)
    if (mine.report?.isEmpty) {
      mine.decision = 'proceed'

      return
    }
    isPlaced = (await $.ui.open({ id: PANE_ID, title: 'Blast Radius', focus: true, closeOnEscape: true, rows: paneRows(mine) })).isPlaced
    if (!isPlaced) mine.where = 'band'
    $.ui.invalidate('ui.render')
    await waitForDecision($, mine, signal)
    if (mine.decision === 'proceed') {
      // The rows it is about to delete get struck through, then the pane goes.
      mine.phase = 'striking'
      $.ui.invalidate('ui.render')
      await pause($, STRIKE_SECONDS)
    }
  } catch {
    mine.decision = 'error'
  } finally {
    // Close this call's pane before releasing the hold, so the next call's pane can't be the one closed.
    if (isPlaced) await $.ui.close({ id: PANE_ID }).catch(() => undefined)
    if (held === mine) held = null
    $.ui.invalidate('ui.render')
  }
}

async function refreshTheme($: EngineInterface): Promise<void> {
  const rows = await $.config.list()
  const hints = { override: await $.env.get('MODZ_THEME'), theme: rows.find(row => row.key === 'theme')?.value, colorfgbg: await $.env.get('COLORFGBG') }
  if (resolveLight(hints) === resolveLight({ ...hints, systemDark: false })) {
    theme.isLight = resolveLight(hints)

    return
  }
  const mac = await $.process.run(['defaults', 'read', '-g', 'AppleInterfaceStyle'], { timeoutMs: 2000 })
  theme.isLight = resolveLight({ ...hints, systemDark: mac.exitCode === 0 ? mac.stdout.trim() === 'Dark' : false })
}

type DrawInput = { ui: Record<string, any>; surface: string; columns: number; place: Held['where']; redraw: () => void }

function draw(mine: Held & { report: Report }, input: DrawInput) {
  // The buttons answer the call this card was drawn for, never whichever one is held now.
  const decide = (choice: Decision) => () => {
    if (mine.decision === null) mine.decision = choice
  }
  const props: CardProps = {
    view: viewOf(mine),
    phase: mine.phase,
    place: input.place,
    isExpanded: mine.isExpanded,
    isLight: theme.isLight,
    columns: input.columns,
    onRun: decide('proceed'),
    onCancel: decide('cancel'),
    onToggle: () => {
      mine.isExpanded = !mine.isExpanded
      input.redraw()
    },
  }

  return input.surface !== 'terminal' && 'Svg' in input.ui ? desktopCard(input.ui, props) : terminalCard(input.ui, props)
}

const isMeasured = (mine: Held | null): mine is Held & { report: Report } => mine !== null && mine.report !== null

type On = Parameters<Register>[0]

function holdHooks(on: On): void {
  on('session.start', async ($, e, next) => {
    try {
      await refreshTheme($)
    } catch {
      $.ui.log('blast-radius: could not read the theme, drawing dark', { to: 'debug' })
    }

    return next(e)
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const command = String(e.command ?? '')
    const risk = classify(command)
    if (risk === null) return next(e)
    if (!(await waitForTurn($, next.signal))) return refusal(WHY.interrupted, risk.label)
    // `held` is claimed with no await between the check and the claim, so two waiting calls can't both get through.
    const mine: Held = { command, risk, report: null, cwd: '', decision: null, where: 'pane', phase: 'asking', isExpanded: false }
    held = mine
    await hold($, mine, next.signal)
    if (mine.decision === 'proceed') return next(e)

    return refusal(WHY[mine.decision ?? 'error'], mine.report?.summary ?? risk.label)
  }).catch(($, e, next) => {
    // Fail closed: a hook that threw, overran or was re-entered refuses a risky command.
    if (String(next.error.kind) !== 're-entry' && next.called) return next(e)
    if (classify(String(e.command ?? '')) === null) return next(e)

    return refusal(WHY.error, 'a risky command')
  })

}

function drawHooks(on: On): void {
  on('ui.close', ($, e, next) => {
    // Closing the pane (Esc, its close mark) is Vazgeç.
    if (e.id === PANE_ID && e.origin.kind === 'person' && held !== null && held.decision === null) held.decision = 'closed'

    return next(e)
  })

  on('ui.render', { component: 'Pane' }, ($, e, next) => {
    const mine = held
    if (e.requestId !== PANE_ID || !isMeasured(mine)) return next(e)
    const redraw = () => $.ui.invalidate('ui.render')
    const ui = $.ui.resolve(e)

    return stamped(ui, draw(mine, { ui, surface: e.surface, columns: e.props.bodyColumns, place: 'pane', redraw }))
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const mine = held
    if (!isMeasured(mine) || mine.where !== 'band' || e.props.hasSurvey) return next(e)
    const theirs = await next(e)
    const ui = $.ui.resolve(e)
    const { Box } = ui
    const redraw = () => $.ui.invalidate('ui.render')
    const card = stamped(ui, draw(mine, { ui, surface: e.surface, columns: e.props.bodyColumns, place: 'band', redraw }))

    // A decision card goes above the other mods' rows (DESIGN.md §6).
    return (
      <Box flexDirection="column">
        {card}
        {theirs}
      </Box>
    )
  })
}

export const register: Register = on => {
  holdHooks(on)
  drawHooks(on)
}
