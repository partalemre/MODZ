// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0
//
// Replay Theater: records the file edits Claude makes in a turn, then lets you step through them in a pane,
// one diff at a time. Modified 2026 (MODZ): Tidemark drawing, an offer card that stacks with the band, what each
// change does (Claude's own words first, one Haiku call at most), and the plan step each edit served.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { shortLine } from './explain'
import { explainReplay, why } from './explainer'
import { HUB_PANE, hubOf, isOpenFor } from './hub'
import { offerCard } from './offer'
import { replayView } from './pane'
import { currentStep, planAfter, PLAN_TOOLS } from './plan'
import { EDIT_TOOLS, isAnswered, stepsFor } from './record'
import type { EditCall } from './record'
import { themeOf } from './ui/theme'
import type { HubCard, ReplayStep } from '../types'
import type { ExplainIo } from './explainer'

export const PANE_ID = 'replay-theater'
export const PANE_TITLE = 'Tekrar'

export const pendingAtom = atom({ plugin: 'replay-theater', key: 'pending' } as const, [])
export const replayAtom = atom({ plugin: 'replay-theater', key: 'replay' } as const, null)
export const indexAtom = atom({ plugin: 'replay-theater', key: 'index' } as const, 0)
export const offeredAtom = atom({ plugin: 'replay-theater', key: 'isOffered' } as const, false)
export const viewAtom = atom({ plugin: 'replay-theater', key: 'view' } as const, { isOpen: false, inBand: false, theme: 'auto' })
export const planAtom = atom({ plugin: 'replay-theater', key: 'plan' } as const, [])

const BAND_RELEASE_MS = 200
const PANE_COLUMNS = 64
const PANE_ROWS_MAX = 30
const PANE_ROWS_BASE = 12
const LIST_ROWS_MAX = 8
const DIFF_ROWS_MAX = 13
const EMPTY_ROWS = 8
const HUB = { plugin: 'replay-theater', key: 'hub' } as const

type On = Parameters<Register>[0]
type Call = EditCall & Record<string, unknown>

// The session's folder, for relative paths; set when the session starts.
const flags = { cwd: '' }

async function refreshTheme($: EngineInterface): Promise<void> {
  try {
    const rows = await $.config.list()
    const theme = themeOf(rows.find(row => row.key === 'theme')?.value)
    await update($, viewAtom, view => ({ ...view, theme }))
  } catch (error) {
    $.ui.log(`replay-theater: theme not readable (${why(error)})`, { to: 'debug' })
  }
}

function paneRows(steps: ReplayStep[]): number {
  const longest = Math.max(0, ...steps.map(step => step.diff.length))

  return Math.min(PANE_ROWS_MAX, PANE_ROWS_BASE + Math.min(steps.length, LIST_ROWS_MAX) + Math.min(longest, DIFF_ROWS_MAX))
}

// The pane opens with nothing to replay too: it says so there, not in the transcript.
async function openReplay($: EngineInterface): Promise<{ hasEdits: boolean; isPlaced: boolean }> {
  const replay = await read($, replayAtom)
  const steps = replay?.steps ?? []
  const hasEdits = steps.length > 0
  if (hasEdits) {
    await update($, indexAtom, () => 0)
    await update($, offeredAtom, () => false)
  }
  await update($, viewAtom, view => ({ ...view, isOpen: true, inBand: false }))
  // The pane takes the keys only while nothing else holds them: the band's button held them, so wait a beat.
  await $.clock.sleep(BAND_RELEASE_MS)
  const rows = hasEdits ? paneRows(steps) : EMPTY_ROWS
  const placed = await $.ui.open({ id: PANE_ID, title: PANE_TITLE, focus: true, closeOnEscape: true, rows, columns: PANE_COLUMNS })
  const isPlaced = placed.isPlaced !== false
  // The band shows a replay when the pane has no room; an empty one has nothing to show there.
  if (!isPlaced) await update($, viewAtom, view => ({ ...view, isOpen: hasEdits, inBand: hasEdits }))
  if (hasEdits && replay !== null) void explainReplay(explainIo($), replay.id)

  return { hasEdits, isPlaced }
}

// The main panel's card (DESIGN.md §9), written only when what it shows changes so the panel does not redraw for nothing.
async function writeHub($: EngineInterface): Promise<void> {
  const shown = hubOf(await read($, replayAtom))
  const { value } = await $.state.get(HUB)
  if (value !== undefined && value.detail === shown.detail && value.tone === shown.tone) return
  const card: HubCard = { pane: HUB_PANE, ...shown, at: await $.clock.now() }
  await $.state.set(HUB, card)
}

// The main panel's open request: an open pane only comes forward, keeping its place in the replay.
async function bringReplay($: EngineInterface): Promise<void> {
  const view = await read($, viewAtom)
  if (view.isOpen && !view.inBand) await $.ui.open({ id: PANE_ID, title: PANE_TITLE, focus: true })
  else await openReplay($)
}

// The engine calls explaining needs, as closures: only this module holds `$`.
function explainIo($: EngineInterface): ExplainIo {
  return {
    replay: () => read($, replayAtom),
    change: (id, change) => update($, replayAtom, replay => (replay !== null && replay.id === id ? change(replay) : replay)),
    messages: agentId => $.session.messages(agentId === undefined ? {} : { agentId }),
    complete: request => $.model.complete(request),
    log: line => $.ui.log(line, { to: 'debug' }),
  }
}

async function readBefore($: EngineInterface, path: string | undefined): Promise<{ text: string; isNew: boolean }> {
  try {
    if (path !== undefined && (await $.fs.exists(path))) return { text: await $.fs.read(path), isNew: false }
  } catch (error) {
    $.ui.log(`replay-theater: ${path} not readable, shown as new (${why(error)})`, { to: 'debug' })
  }

  return { text: '', isNew: true }
}

async function closeReplay($: EngineInterface): Promise<void> {
  const view = await read($, viewAtom)
  await update($, viewAtom, current => ({ ...current, isOpen: false, inBand: false }))
  if (!view.inBand) await $.ui.close({ id: PANE_ID })
}

async function step($: EngineInterface, delta: number): Promise<void> {
  const total = (await read($, replayAtom))?.steps.length ?? 0
  await update($, indexAtom, index => Math.max(0, Math.min(index + delta, total - 1)))
}

// An edit is read before it runs and kept only once it was answered; recording never stops the call.
async function recordEdit($: EngineInterface, e: Call, run: () => Promise<{ deny?: unknown; isError?: unknown }>) {
  let steps: ReplayStep[] = []
  try {
    steps = await stepsFor({ cwd: flags.cwd, before: path => readBefore($, path) }, e)
  } catch (error) {
    $.ui.log(`replay-theater: could not read an edit (${why(error)})`, { to: 'debug' })
  }
  const result = await run()
  if (steps.length === 0 || !isAnswered(result)) return result
  const plan = currentStep(await read($, planAtom)) ?? undefined
  await update($, pendingAtom, pending => [...pending, ...steps.map(one => (plan === undefined ? one : { ...one, plan }))])

  return result
}

// The task list: TodoWrite is the main loop's own; TaskCreate / TaskUpdate share one list across loops.
async function trackPlan($: EngineInterface, e: Call, run: () => Promise<{ deny?: unknown; isError?: unknown; result?: unknown }>) {
  const result = await run()
  if (!isAnswered(result) || (e.tool === 'TodoWrite' && e.agentId !== undefined)) return result
  await update($, planAtom, items => planAfter(items, e, result.result))

  return result
}

function hookSession(on: On): void {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    flags.cwd = e.cwd.replace(/\/$/, '')
    await $.command.register({ name: 'replay', description: 'Tekrar: son turdaki dosya düzenlemelerini adım adım izle' })
    await refreshTheme($)
    await writeHub($)

    return r
  })

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') await update($, planAtom, () => [])

    return next(e)
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'replay' }, async $ => {
    const opened = await openReplay($)
    const count = (await read($, replayAtom))?.steps.length ?? 0
    if (opened.hasEdits) return { text: `Tekrar: ${count} düzenleme` }

    // Only a terminal too narrow for the pane hears it as text.
    return opened.isPlaced ? {} : { text: 'Tekrar: son turda düzenleme yok.' }
  })

  on('state.set', { plugin: 'modz', key: 'open' }, async ($, e, next) => {
    const done = await next(e)
    if (isOpenFor(e.value, HUB_PANE)) await bringReplay($)

    return done
  }).catch(($, e, next) => next(e))
}

function hookRecording(on: On): void {
  on('tool.call', async ($, e, next) => {
    const call = e as unknown as Call
    if (EDIT_TOOLS.has(call.tool)) return recordEdit($, call, () => next(e))
    if ((PLAN_TOOLS as readonly string[]).includes(call.tool)) return trackPlan($, call, () => next(e))

    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    if ((e as { agentId?: string }).agentId === undefined) {
      await update($, pendingAtom, () => [])
      await update($, offeredAtom, () => false)
    }

    return next(e)
  })

  // At the end of a main-loop turn the pending edits become the replay and the offer card shows.
  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    const pending = await read($, pendingAtom)
    if (e.agentId !== undefined || pending.length === 0) return r
    await update($, replayAtom, () => ({ id: e.turnId, steps: pending, explain: 'none' as const, quote: shortLine(e.answer ?? '') }))
    await update($, pendingAtom, () => [])
    await update($, indexAtom, () => 0)
    await update($, offeredAtom, () => true)
    await refreshTheme($)
    await writeHub($)

    return r
  })
}

function hookDrawing(on: On): void {
  // The offer stacks above the other band lines; a survey holds the band alone.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const theirs = await next(e)
    const view = await read($, viewAtom)
    const replay = await read($, replayAtom)
    const ui = $.ui.resolve(e)
    const { Box } = ui
    if (view.isOpen && view.inBand && replay !== null) {
      const model = { steps: replay.steps, index: await read($, indexAtom), explain: replay.explain, theme: view.theme }
      const site = { surface: e.surface, columns: e.props.bodyColumns, inBand: true, maxRows: e.props.maxRows, on: handlers($) }

      return <Box flexDirection="column">{replayView(ui, model, site)}{theirs}</Box>
    }
    if (!(await read($, offeredAtom)) || e.props.isWorking || view.isOpen || replay === null) return theirs
    const offer = { steps: replay.steps, quote: replay.quote, theme: view.theme, columns: e.props.bodyColumns, surface: e.surface }
    const actions = { onOpen: () => void openReplay($), onDismiss: () => void update($, offeredAtom, () => false) }

    return <Box flexDirection="column">{offerCard(ui, offer, actions)}{theirs}</Box>
  })

  on('ui.render', { component: 'Pane', requestId: PANE_ID }, async ($, e) => {
    const replay = await read($, replayAtom)
    const view = await read($, viewAtom)
    const model = { steps: replay?.steps ?? [], index: await read($, indexAtom), explain: replay?.explain ?? 'none', theme: view.theme }
    const site = { surface: e.surface, columns: e.props.bodyColumns, inBand: false, maxRows: e.props.scroll?.bodyRows ?? PANE_ROWS_MAX, on: handlers($) }

    return replayView($.ui.resolve(e), model, site)
  })

  // The person closed the pane (Escape, the close mark): keep the view in step.
  on('ui.close', { id: PANE_ID }, async ($, e, next) => {
    await update($, viewAtom, view => ({ ...view, isOpen: false, inBand: false }))

    return next(e)
  }).catch(($, e, next) => next(e))
}

function handlers($: EngineInterface) {
  return { onPrev: () => void step($, -1), onNext: () => void step($, 1), onClose: () => void closeReplay($) }
}

export const register: Register = on => {
  hookSession(on)
  hookRecording(on)
  hookDrawing(on)
}
