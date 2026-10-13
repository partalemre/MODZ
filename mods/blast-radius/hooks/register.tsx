// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0
//
// Blast Radius: holds a risky Bash command and shows what it would change.
//
// tool.call (Bash): if the command is risky, work out its blast radius, open a
// pane with Run anyway and Keep my work, and hold the call until one is pressed.
// A command that would change nothing (no such file, no changes) runs with no card.
// Edits another chat just made are guarded in collide.ts.
// ui.render (Pane): draws the card. If the surface won't place the pane (a
// narrow terminal), the same card is drawn in the AbovePrompt band, above the
// other mods' rows.
//
// Anything unexpected while holding a risky command refuses it (hold.ts).
//
// The host reads `on(...)` and `$.noun.method(...)` from source, so `$` stays in
// the hooks modules; the measuring modules get a `run` closure instead.

import type { EngineInterface, Register } from 'claude-code'

import { desktopCard, terminalCard } from './card'
import type { CardProps } from './card'
import { classify } from './classify'
import type { Risk } from './classify'
import { editHooks } from './collide'
import { PANE_ID, SLEEP_TIMEOUT_MS, closeHeld, current, hold, take } from './hold'
import type { Decision, Held, HoldIo } from './hold'
import { setLang } from './lang'
import { measure, missingFolder } from './measure'
import type { Report, Run } from './report'
import { pinned } from './pin'
import { resolveLight } from './theme'
import { viewOf } from './view'
import { words } from './words'

const CD_TIMEOUT_MS = 5000

const theme = { isLight: false }

// The hold loop's calls, spelled here: the engine follows `$` only within one file.
const holdIo = ($: EngineInterface): HoldIo => ({
  sleep: seconds => $.process.run(['sleep', seconds], { timeoutMs: SLEEP_TIMEOUT_MS }),
  now: () => $.clock.now(),
  open: async rows => (await $.ui.open({ id: PANE_ID, title: 'Blast Radius', focus: true, closeOnEscape: true, rows })).isPlaced,
  close: () => $.ui.close({ id: PANE_ID }),
  redraw: () => $.ui.invalidate('ui.render'),
})

const WHY: Record<Exclude<Decision, 'proceed' | 'cancel'>, string> = {
  closed: 'the user closed the Blast Radius pane',
  timeout: 'no answer within 10 minutes',
  interrupted: 'the turn was interrupted',
  error: 'Blast Radius hit an error while holding it',
}

const refusal = (why: string, summary: string): { deny: string } => ({
  deny: `Blast Radius held this command and did not run it: ${why}. It would have: ${summary}. Do not retry it unless the user asks you to.`,
})

function whyOf(decision: Decision | null): string {
  if (decision === 'cancel') return words().cancelWhy
  if (decision === null || decision === 'proceed') return WHY.error

  return WHY[decision]
}

// Resolves a `cd` target to an absolute folder, or null if it doesn't exist.
// The target is passed as an argument, never as source.
const CD_SCRIPT = `unset CDPATH; d="$1"; case "$d" in "~") d="$HOME";; "~/"*) d="$HOME/\${d#\\~/}";; esac; cd -- "$d" 2>/dev/null && pwd -P`

async function resolveDir($: EngineInterface, sessionCwd: string, dir: string): Promise<string | null> {
  if (dir === '-') return null // `cd -` depends on the shell's history
  const ran = await $.process.run(['bash', '-c', CD_SCRIPT, 'blast-radius', dir], { cwd: sessionCwd, timeoutMs: CD_TIMEOUT_MS })
  const out = ran.stdout.trim()

  return ran.exitCode === 0 && out !== '' ? out : null
}

type Risky = { mine: Held; risk: Risk; summary: string }

/** Where the command will run (the session folder, moved by `cd dir &&` or `git -C dir`), and what it would change there. */
async function survey($: EngineInterface, risky: Risky): Promise<boolean> {
  const { mine, risk } = risky
  const sessionCwd = await $.session.cwd()
  const dir = risk.dir ? await resolveDir($, sessionCwd, risk.dir) : sessionCwd
  const run: Run = (argv, options) => $.process.run(argv, options)
  const cwd = dir ?? sessionCwd
  const report: Report = dir === null ? missingFolder(risk) : await measure(run, risk, dir)
  risky.summary = report.summary
  mine.view = isExpanded => viewOf({ command: mine.command, risk, report, cwd, isExpanded })

  return !report.isEmpty
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

type Ready = Held & { view: NonNullable<Held['view']> }
type DrawInput = { ui: Record<string, any>; surface: string; columns: number; place: Held['where']; redraw: () => void }

function draw(mine: Ready, input: DrawInput) {
  // The buttons answer the call this card was drawn for, never whichever one is held now.
  const decide = (choice: Decision) => () => {
    if (mine.decision === null) mine.decision = choice
  }
  const props: CardProps = {
    view: mine.view(mine.isExpanded),
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

const isReady = (mine: Held | null): mine is Ready => mine !== null && mine.view !== null

/** Once the person kept their work, a line says nothing was lost. */
function sayKept($: EngineInterface, decision: Decision | null): void {
  if (decision === 'cancel' || decision === 'closed') $.ui.toast(words().kept)
}

type On = Parameters<Register>[0]

function holdHooks(on: On): void {
  on('session.start', async ($, e, next) => {
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
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
    const mine = await take(holdIo($), { command, signal: next.signal, canStrike: true })
    if (mine === null) return refusal(WHY.interrupted, risk.label)
    const risky: Risky = { mine, risk, summary: risk.label }
    await hold(holdIo($), mine, { signal: next.signal, prepare: () => survey($, risky) })
    if (mine.decision === 'proceed') return next(e)
    sayKept($, mine.decision)

    return refusal(whyOf(mine.decision), risky.summary)
  }).catch(($, e, next) => {
    // Fail closed: a hook that threw, overran or was re-entered refuses a risky command.
    if (String(next.error.kind) !== 're-entry' && next.called) return next(e)
    if (classify(String(e.command ?? '')) === null) return next(e)

    return refusal(WHY.error, 'a risky command')
  })
}

function drawHooks(on: On): void {
  on('ui.close', ($, e, next) => {
    // Closing the pane (Esc, its close mark) keeps the work, as Keep my work does.
    if (e.id === PANE_ID && e.origin.kind === 'person') closeHeld()

    return next(e)
  })

  // Only its own pane waits out a focus flip: every other mod's pane passes through this hook too.
  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    const mine = current()
    if (e.requestId !== PANE_ID || !isReady(mine)) return next(e)
    const redraw = () => $.ui.invalidate('ui.render')
    const ui = $.ui.resolve(e)

    return pinned(e, draw(mine, { ui, surface: e.surface, columns: e.props.bodyColumns, place: 'pane', redraw }))
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const mine = current()
    if (!isReady(mine) || mine.where !== 'band' || e.props.hasSurvey) return next(e)
    const theirs = await next(e)
    const ui = $.ui.resolve(e)
    const { Box } = ui
    const redraw = () => $.ui.invalidate('ui.render')
    const card = pinned(e, draw(mine, { ui, surface: e.surface, columns: e.props.bodyColumns, place: 'band', redraw }))

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
  editHooks(on)
  drawHooks(on)
}
