// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0
//
// Replay Theater: records the file edits Claude makes in a turn, then lets you step through them in a pane,
// one diff at a time. Modified 2026 (MODZ): Tidemark drawing, an offer card that stacks with the band, what each
// change does (Claude's own words first, one Haiku call at most), and the plan step each edit served.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { bringReplay, handlersOf, openList, openReplay } from './actions'
import { stdoutOf, whereOf } from './archive'
import type { ArchiveIo } from './archive'
import { shortLine } from './explain'
import { explainReplay, why } from './explainer'
import type { ExplainIo } from './explainer'
import { hookEdits } from './edits-hook'
import { withHome } from './home'
import { HUB_PANE, hubOf, isOpenFor } from './hub'
import { setLang } from './lang'
import { offerCard } from './offer'
import { LIST_PAGE, PANE_ROWS_MAX } from './pane-io'
import type { PaneIo } from './pane-io'
import { pinned } from './pin'
import { isOffStage, shownOf } from './stage'
import { bodyView } from './screen'
import type { Site, Snapshot } from './screen'
import { themeOf } from './ui/theme'
import { words } from './words'
import type { HubCard } from '../types'

const pendingAtom = atom({ plugin: 'replay-theater', key: 'pending' } as const, [])
const replayAtom = atom({ plugin: 'replay-theater', key: 'replay' } as const, null)
const indexAtom = atom({ plugin: 'replay-theater', key: 'index' } as const, 0)
const offeredAtom = atom({ plugin: 'replay-theater', key: 'isOffered' } as const, false)
const viewAtom = atom({ plugin: 'replay-theater', key: 'view' } as const, { isOpen: false, inBand: false, theme: 'auto' })
const planAtom = atom({ plugin: 'replay-theater', key: 'plan' } as const, [])
const browseAtom = atom({ plugin: 'replay-theater', key: 'browse' } as const, { mode: 'replay', source: 'live', shown: LIST_PAGE })
const sessionsAtom = atom({ plugin: 'replay-theater', key: 'sessions' } as const, { status: 'loading', rows: [], older: 0 })
const turnsAtom = atom({ plugin: 'replay-theater', key: 'turns' } as const, null)
const pastAtom = atom({ plugin: 'replay-theater', key: 'past' } as const, null)
const PANE_ID = 'replay-theater'
const HUB = { plugin: 'replay-theater', key: 'hub' } as const
const HOME = { plugin: 'replay-theater', key: 'home' } as const
const KEPT_KEY = 'sessions'
const PANE_COLUMNS = 64

type On = Parameters<Register>[0]

// The session's folder, for relative paths, and its transcript, whose folder holds this project's sessions;
// both set when the session starts. `kept`: the sessions read last, while their transcripts do not change.
const flags = { cwd: '', ask: '', transcript: '' }
const kept: ArchiveIo['kept'] = new Map()

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

function archiveIo($: EngineInterface): ArchiveIo {
  return { list: dir => $.fs.list(dir), read: path => $.fs.read(path), pieces: argv => stdoutOf($.process.spawn({ argv })), log: line => $.ui.log(line, { to: 'debug' }), kept }
}

// Every open of the pane is a person's (a press, /replay, the hub's row): placed, it tells a running hub it holds
// the panel, so the hub and every other pane step aside (kit/stage.ts).
async function reportShown($: EngineInterface): Promise<void> {
  try {
    if ((await $.state.get({ plugin: 'modz', key: 'isOn' })).value !== true) return
    await $.state.set({ plugin: 'replay-theater', key: 'shown' }, shownOf(HUB_PANE, await $.clock.now()))
  } catch (error) {
    $.ui.log(`replay-theater: shown failed (${why(error)})`, { to: 'debug' })
  }
}

// The pane's actions over this session's values and the engine, as closures.
function paneIo($: EngineInterface): PaneIo {
  const title = words().title

  return {
    browse: { get: () => read($, browseAtom), set: change => update($, browseAtom, change) },
    view: { get: () => read($, viewAtom), set: change => update($, viewAtom, change) },
    index: { get: () => read($, indexAtom), set: change => update($, indexAtom, change) },
    offered: { get: () => read($, offeredAtom), set: change => update($, offeredAtom, change) },
    replay: { get: () => read($, replayAtom), set: change => update($, replayAtom, change) },
    past: { get: () => read($, pastAtom), set: change => update($, pastAtom, change) },
    turns: { get: () => read($, turnsAtom), set: change => update($, turnsAtom, change) },
    sessions: { get: () => read($, sessionsAtom), set: change => update($, sessionsAtom, change) },
    kept: { get: () => $.store.get(KEPT_KEY), set: value => $.store.set(KEPT_KEY, value) },
    open: async rows => {
      const size = rows === undefined ? {} : { closeOnEscape: true as const, rows, columns: PANE_COLUMNS }
      const isPlaced = (await $.ui.open({ id: PANE_ID, title, focus: true, ...size })).isPlaced !== false
      if (isPlaced) await reportShown($)

      return isPlaced
    },
    close: () => $.ui.close({ id: PANE_ID }),
    sleep: ms => $.clock.sleep(ms),
    explain: id => void explainReplay(explainIo($), id),
    archive: archiveIo($),
    where: () => whereOf(flags.transcript, flags.cwd),
  }
}

// What the pane draws, from every value it shows, with its presses.
async function drawn($: EngineInterface, ui: Record<string, any>, site: Site) {
  const snap: Snapshot = {
    browse: await read($, browseAtom), view: await read($, viewAtom), replay: await read($, replayAtom), past: await read($, pastAtom),
    index: await read($, indexAtom), sessions: await read($, sessionsAtom), turns: await read($, turnsAtom), now: await $.clock.now(),
  }

  return bodyView(ui, snap, { site, on: handlersOf(paneIo($), snap.browse) })
}

async function refreshTheme($: EngineInterface): Promise<void> {
  try {
    const rows = await $.config.list()
    const theme = themeOf(rows.find(row => row.key === 'theme')?.value)
    await update($, viewAtom, view => ({ ...view, theme }))
  } catch (error) {
    $.ui.log(`replay-theater: theme not readable (${why(error)})`, { to: 'debug' })
  }
}

// The main panel's card (DESIGN.md §9), written only when what it shows changes so the panel does not redraw for nothing.
async function writeHub($: EngineInterface): Promise<void> {
  const shown = hubOf(await read($, replayAtom))
  const { value } = await $.state.get(HUB)
  if (value !== undefined && value.detail === shown.detail && value.tone === shown.tone) return
  const card: HubCard = { pane: HUB_PANE, ...shown, at: await $.clock.now() }
  await $.state.set(HUB, card)
}

function hookSession(on: On): void {
  on('session.start', async ($, e, next) => {
    // The interface language (kit/lang.ts). Spelled out: the engine admits an env read by a literal name only.
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    const r = await next(e)
    flags.cwd = e.cwd.replace(/\/$/, '')
    await $.command.register({ name: 'replay', description: words().command, argumentHint: '[turns|sessions]' })
    await refreshTheme($)
    await writeHub($)

    return r
  })

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') await update($, planAtom, () => [])

    return next(e)
  }).catch(($, e, next) => next(e))

  on('state.set', { plugin: 'modz', key: 'open' }, async ($, e, next) => {
    const done = await next(e)
    if (isOpenFor(e.value, HUB_PANE)) await bringReplay(paneIo($))

    return done
  }).catch(($, e, next) => next(e))

  // Another pane took the main panel: this one steps aside rather than wait as a tab. A replay shown in the band
  // has no pane there, so it stays.
  on('state.set', { plugin: 'modz', key: 'stage' }, async ($, e, next) => {
    const done = await next(e)
    const view = await read($, viewAtom)
    if (isOffStage(e.value, HUB_PANE) && view.isOpen && !view.inBand) await $.ui.close({ id: PANE_ID })

    return done
  }).catch(($, e, next) => next(e))
}

// `/replay` opens the last turn; `/replay turns` this session's turns, `/replay sessions` the project's sessions.
function hookCommand(on: On): void {
  // The transcript's path comes with the classic start, and again after /clear, a resume or a fork.
  on('classic.SessionStart', async ($, e, next) => {
    flags.transcript = typeof e.transcript_path === 'string' ? e.transcript_path : ''

    return next(e)
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'replay' }, async ($, e) => {
    const list = String(e.args ?? '').trim().toLowerCase()
    if (list === 'turns' || list === 'sessions') {
      await openList(paneIo($), { mode: list })

      return {}
    }
    const opened = await openReplay(paneIo($))
    const count = (await read($, replayAtom))?.steps.length ?? 0
    if (opened.hasEdits) return { text: words().commandCount(count) }

    // Only a terminal too narrow for the pane hears it as text.
    return opened.isPlaced ? {} : { text: words().commandEmpty }
  })
}

function hookRecording(on: On): void {
  hookEdits(on, flags)

  on('turn.start', async ($, e, next) => {
    if ((e as { agentId?: string }).agentId === undefined) {
      flags.ask = typeof (e as { text?: unknown }).text === 'string' ? (e as { text: string }).text : ''
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
    const turn = { quote: shortLine(e.answer ?? ''), ask: shortLine(flags.ask), at: await $.clock.now() }
    await update($, replayAtom, () => ({ id: e.turnId, steps: pending, explain: 'none' as const, ...turn }))
    await update($, pendingAtom, () => [])
    await update($, indexAtom, () => 0)
    await update($, offeredAtom, () => true)
    await refreshTheme($)
    await writeHub($)

    return r
  })
}

function hookBand(on: On): void {
  // The offer stacks above the other band lines; a survey holds the band alone.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const theirs = await next(e)
    const view = await read($, viewAtom)
    const replay = await read($, replayAtom)
    const ui = $.ui.resolve(e)
    const { Box } = ui
    if (view.isOpen && view.inBand) {
      const body = await drawn($, ui, { surface: e.surface, columns: e.props.bodyColumns, inBand: true, maxRows: e.props.maxRows })

      return pinned(e, <Box flexDirection="column">{body}{theirs}</Box>)
    }
    if (!(await read($, offeredAtom)) || e.props.isWorking || view.isOpen || replay === null) return theirs
    const offer = { steps: replay.steps, quote: replay.quote, theme: view.theme, columns: e.props.bodyColumns, surface: e.surface }
    const actions = { onOpen: () => void openReplay(paneIo($)), onDismiss: () => void update($, offeredAtom, () => false) }

    return pinned(e, <Box flexDirection="column">{offerCard(ui, offer, actions)}{theirs}</Box>)
  })
}

function hookPane(on: On): void {
  on('ui.render', { component: 'Pane', requestId: PANE_ID }, async ($, e) => {
    const site = { surface: e.surface, columns: e.props.bodyColumns, inBand: false, maxRows: e.props.scroll?.bodyRows ?? PANE_ROWS_MAX }
    const isHubOn = (await $.state.get({ plugin: 'modz', key: 'isOn' })).value === true
    // Written when pressed, never while drawing; a failure only goes to the debug log.
    const goHome = () => void $.clock.now().then(at => $.state.set(HOME, { at })).catch(() => $.ui.log('replay-theater: could not go back to MODZ', { to: 'debug' }))
    const ui = $.ui.resolve(e)

    return pinned(e, withHome(ui, await drawn($, ui, site), isHubOn ? goHome : null))
  })

  // The person closed the pane (Escape, the close mark): keep the view in step.
  on('ui.close', { id: PANE_ID }, async ($, e, next) => {
    await update($, viewAtom, view => ({ ...view, isOpen: false, inBand: false }))

    return next(e)
  }).catch(($, e, next) => next(e))
}

export const register: Register = on => {
  hookSession(on)
  hookCommand(on)
  hookRecording(on)
  hookBand(on)
  hookPane(on)
}
