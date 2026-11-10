// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0
//
// Blast Radius: holds a risky Bash command and shows what it would change.
//
// tool.call (Bash): if the command is risky, work out its blast radius, draw a
// card with Run anyway and Keep my work, and hold the call until one is pressed.
// A command that would change nothing (no such file, no changes) runs with no card.
// Any other command is weighed against the person's house rules, when they wrote
// some (house.ts). Edits another chat just made are guarded in collide.ts.
// ui.render (AbovePrompt): draws the card above the other mods' rows. It opens no
// tab; a tab left by an older copy of this mod closes itself (ui.render, Pane).
//
// Anything unexpected while holding a risky command refuses it (hold.ts).
//
// The host reads `on(...)` and `$.noun.method(...)` from source, so `$` stays in
// the hooks modules; the measuring modules get a `run` closure instead.

import type { EngineInterface, Register } from 'claude-code'

import { desktopCard, terminalCard } from './card'
import type { CardProps } from './card'
import { classify, classifyAll } from './classify'
import type { Risk } from './classify'
import { editHooks } from './collide'
import { PANE_ID, SLEEP_TIMEOUT_MS, current, dropStaleTab, hold, markAnswered, take, unheld } from './hold'
import type { Decision, Held, HoldIo } from './hold'
import { houseHooks, resetHouse } from './house'
import { setLang } from './lang'
import { measure, missingFolder } from './measure'
import type { Report, Run } from './report'
import { pinned } from './pin'
import { resolveLight } from './theme'
import { viewOf } from './view'
import { words } from './words'

const CD_TIMEOUT_MS = 5000
// How much of the command a refusal quotes back.
const COMMAND_CHARS = 300

const theme = { isLight: false }

// The hold loop's calls, spelled here: the engine follows `$` only within one file.
const holdIo = ($: EngineInterface): HoldIo => ({
  run: argv => $.process.run(argv, { timeoutMs: SLEEP_TIMEOUT_MS }),
  now: () => $.clock.now(),
  redraw: () => $.ui.invalidate('ui.render'),
})

const WHY: Record<Exclude<Decision, 'proceed' | 'cancel'>, string> = {
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

type Risky = { mine: Held; risks: Risk[]; summary: string }

/**
 * Where each risky part will run (the session folder, moved by `cd dir &&` or `git -C dir`), and what it
 * would change there. The first part that would lose something is the card; true when there is one.
 */
async function survey($: EngineInterface, risky: Risky): Promise<boolean> {
  const { mine } = risky
  const sessionCwd = await $.session.cwd()
  const run: Run = (argv, options) => $.process.run(argv, options)
  for (const risk of risky.risks) {
    const dir = risk.dir ? await resolveDir($, sessionCwd, risk.dir) : sessionCwd
    // A write under a folder that is not there yet (`mkdir -p out && cd out && … > file`) lands in a new
    // folder or, if the cd fails, here: measure it here.
    const where = dir ?? (risk.kind === 'overwrite' ? sessionCwd : null)
    const report: Report = where === null ? missingFolder(risk) : await measure(run, risk, where)
    if (report.isEmpty) continue
    const cwd = dir ?? sessionCwd
    risky.summary = report.summary
    mine.view = isExpanded => viewOf({ command: mine.command, risk, report, cwd, isExpanded })

    return true
  }

  return false
}

// No card can be answered in a subagent's loop or where no screen is attached: a `claude -p` run, but
// also a desktop chat left in the background or driven over Remote Control.
const isUnattended = async ($: EngineInterface, agentId: string | undefined): Promise<boolean> =>
  agentId !== undefined || (await $.session.surfaces()).length === 0

/** A call nobody can answer: refused at once when it would lose something, never held. Null when it loses nothing. */
async function refuseUnattended($: EngineInterface, input: { command: string; risks: Risk[]; isSubagent: boolean }): Promise<{ deny: string } | null> {
  const risky: Risky = { mine: unheld(input.command), risks: input.risks, summary: input.risks[0]?.label ?? 'a risky command' }
  // A measurement that broke can't say it is harmless: refuse.
  const isLossy = await survey($, risky).catch(() => true)
  if (!isLossy) return null
  const who = input.isSubagent
    ? 'it came from a subagent, and only the main chat can answer its card'
    : 'no screen is attached to this chat right now (it is in the background, driven remotely, or a claude -p run), so nobody can answer its card'
  const then = input.isSubagent
    ? 'ask the user to run it, or run it from the main chat'
    : 'Tell the user what you wanted to run and why, and run it again only when they ask'
  const command = input.command.length > COMMAND_CHARS ? `${input.command.slice(0, COMMAND_CHARS)}…` : input.command

  return {
    deny: `Blast Radius refused this command without running it: ${who}. Command: ${command}. It would have: ${risky.summary}. Do not retry it or work around it; ${then}.`,
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

type Ready = Held & { view: NonNullable<Held['view']> }
type DrawInput = { ui: Record<string, any>; surface: string; columns: number; redraw: () => void }

function draw(mine: Ready, input: DrawInput) {
  // The buttons answer the call this card was drawn for, never whichever one is held now.
  const decide = (choice: Decision) => () => {
    if (mine.decision === null) mine.decision = choice
  }
  const props: CardProps = {
    view: mine.view(mine.isExpanded),
    phase: mine.phase,
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
  if (decision === 'cancel') $.ui.toast(words().kept)
}

type On = Parameters<Register>[0]

function holdHooks(on: On): void {
  on('session.start', async ($, e, next) => {
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    resetHouse()
    try {
      await refreshTheme($)
    } catch {
      $.ui.log('blast-radius: could not read the theme, drawing dark', { to: 'debug' })
    }

    return next(e)
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const command = String(e.command ?? '')
    const risks = classifyAll(command)
    if (risks.length === 0) return next(e)
    if (await isUnattended($, e.agentId)) return (await refuseUnattended($, { command, risks, isSubagent: e.agentId !== undefined })) ?? next(e)
    const mine = await take(holdIo($), { command, signal: next.signal, canStrike: true })
    if (mine === null) return refusal(WHY.interrupted, risks[0]?.label ?? 'a risky command')
    const risky: Risky = { mine, risks, summary: risks[0]?.label ?? 'a risky command' }
    await hold(holdIo($), mine, { signal: next.signal, prepare: () => survey($, risky) })
    if (mine.decision === 'proceed') {
      if (mine.view !== null) markAnswered(command)

      return next(e)
    }
    sayKept($, mine.decision)

    return refusal(whyOf(mine.decision), risky.summary)
  }).catch(($, e, next) => {
    // Fail closed: a hook that threw, overran or was re-entered refuses a risky command.
    if (String(next.error.kind) !== 're-entry' && next.called) return next(e)
    if (classify(String(e.command ?? '')) === null) return next(e)

    return refusal(WHY.error, 'a risky command')
  })
}

// After the draw: a `$` call beneath this plugin's own hook wouldn't reach its hooks.
function dropTabSoon($: EngineInterface): void {
  $.clock.after(0, () => {
    dropStaleTab({
      isListed: async () => (await $.ui.panes()).some(pane => pane.id === PANE_ID),
      open: rows => $.ui.open({ id: PANE_ID, title: 'Blast Radius', rows }),
      close: () => $.ui.close({ id: PANE_ID }),
    }).catch(cause => $.ui.log(`blast-radius: could not drop a stale tab: ${String(cause)}`, { to: 'debug' }))
  })
}

function drawHooks(on: On): void {
  // Only its own pane closes: every other mod's pane passes through this hook too.
  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (e.requestId === PANE_ID) dropTabSoon($)

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const mine = current()
    if (!isReady(mine) || e.props.hasSurvey) return next(e)
    const theirs = await next(e)
    const ui = $.ui.resolve(e)
    const { Box } = ui
    const redraw = () => $.ui.invalidate('ui.render')
    const card = pinned(e, draw(mine, { ui, surface: e.surface, columns: e.props.bodyColumns, redraw }))

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
  houseHooks(on)
  editHooks(on)
  drawHooks(on)
}
