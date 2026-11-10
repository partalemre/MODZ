import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import { HomeButton } from './home'
import { HUB_PANE, isOpenFor } from './hub'
import { NOTE_PREFIX, drawSafely, noteKey, paneKept, plainPane, reopenKeptTab, restorePane, staleNotes, watchPane } from './kit/pane-keep'
import { isOffStage, shownOf } from './kit/stage'
import { resolvePlan } from './match'
import { motion, planPane } from './pane'
import { pinned } from './pin'
import { themeOf } from './ui/theme'
import type { Theme } from './ui/theme'
import { words } from './words'

// The engine reads each module's use of the mod's values from that module's own source.
const docAtom = atom({ plugin: 'plan-steps', key: 'doc' } as const, null)
const tasksAtom = atom({ plugin: 'plan-steps', key: 'tasks' } as const, [])
const tickAtom = atom({ plugin: 'plan-steps', key: 'tick' } as const, 0)
const tracksAtom = atom({ plugin: 'plan-steps', key: 'tracks' } as const, {})

// The Plan pane: /steps or the MODZ main panel opens it, nothing else does; with the hub on, "← MODZ"
// comes first (DESIGN.md §9). It never stays blank (kit/pane-keep.tsx): a drawing that throws costs a plain list,
// and a pane that was open comes back when a desktop attaches or asks a tab the engine no longer lists to draw.

const PANE = 'plan-steps'
const PANE_TITLE = 'Plan'
const TICK_MS = 30_000
// How often the pane is looked at (its open note, a redraw after a failed draw); every BEAT_LOOKS-th look redraws.
const WATCH_MS = 5_000
const BEAT_LOOKS = 6
const DEFAULT_ROWS = 24
const DEFAULT_COLUMNS = 48
// The "← MODZ" button's row.
const HOME_ROWS = 1
const MARK = { completed: '✓', in_progress: '▸', pending: '○' } as const

export type PaneCtx = { touchedAt: () => number }

type Timer = { cancel: () => void }
type Ui = Record<string, any>
type Room = { columns: number; rows: number; surface: string }

const pane = { ticker: null as Timer | null, theme: 'auto' as Theme, isWatched: false }
const kept = paneKept()

const logOf = ($: EngineInterface) => (text: string) => $.ui.log(`plan-steps: ${text}`, { to: 'debug' })

// Asks the hub to come forward; the hub hears this mod's own `home` value. A failure only shows in the debug log.
async function goHome($: EngineInterface): Promise<void> {
  try {
    await $.state.set({ plugin: 'plan-steps', key: 'home' }, { at: await $.clock.now() })
  } catch (error) {
    logOf($)(`home failed (${String(error)})`)
  }
}

// Tells the hub this pane now holds the panel, so the hub and every other pane step aside (kit/stage.ts).
async function reportShown($: EngineInterface): Promise<void> {
  try {
    if ((await $.state.get({ plugin: 'modz', key: 'isOn' })).value !== true) return
    await $.state.set({ plugin: 'plan-steps', key: 'shown' }, shownOf(HUB_PANE, await $.clock.now()))
  } catch (error) {
    logOf($)(`shown failed (${String(error)})`)
  }
}

// The drawing follows Claude Code's theme setting; `auto` leaves it to the system's appearance.
async function refreshTheme($: EngineInterface): Promise<void> {
  try {
    pane.theme = themeOf((await $.config.list()).find(row => row.key === 'theme')?.value)
  } catch (error) {
    logOf($)(`theme not readable (${error instanceof Error ? error.message : 'unknown'})`)
  }
}

// The same pane whoever asks; an open pane comes forward. A 30-second tick moves its times while it is open.
// `focus`: a person asked (the command, a hub row); a pane brought back by itself leaves the keyboard alone.
async function openPane($: EngineInterface, focus = true): Promise<void> {
  kept.isHeld = true
  await refreshTheme($)
  motion.reset()
  const opened = await $.ui.open(focus ? { id: PANE, title: PANE_TITLE, focus: true } : { id: PANE, title: PANE_TITLE })
  if (opened.isPlaced) await reportShown($)
  pane.ticker ??= $.clock.every(TICK_MS, () => void update($, tickAtom, tick => tick + 1))
}

// What the kit asks of the engine for this pane; built here, where `$` is.
const keepNouns = ($: EngineInterface) => ({
  isListed: async () => (await $.ui.panes()).some(up => up.id === PANE),
  reopen: () => openPane($, false),
  redraw: () => $.ui.invalidate('ui.render'),
  soon: (work: () => void) => $.clock.after(0, work),
  note: {
    read: async () => $.store.get(noteKey(await $.session.id())),
    write: async (at: number | undefined) => {
      const key = noteKey(await $.session.id())

      return at === undefined ? $.store.delete(key) : $.store.set(key, at)
    },
  },
  now: () => $.clock.now(),
  log: logOf($),
})

// Notes left by sessions long gone are dropped, then the pane is looked at every WATCH_MS; once per engine.
async function startWatch($: EngineInterface): Promise<void> {
  if (pane.isWatched) return
  pane.isWatched = true
  try {
    const entries: [string, unknown][] = []
    for (const key of await $.store.keys()) if (key.startsWith(NOTE_PREFIX)) entries.push([key, await $.store.get(key)])
    for (const key of staleNotes(entries, { own: noteKey(await $.session.id()), now: await $.clock.now() })) await $.store.delete(key)
  } catch (error) {
    logOf($)(`could not drop old pane notes (${String(error)})`)
  }
  let looks = 0
  $.clock.every(WATCH_MS, () => void watchPane(kept, keepNouns($), ++looks % BEAT_LOOKS === 0))
}

function opening(on: On): void {
  on('command.run', { command: 'steps' }, async $ => {
    await openPane($)

    return {}
  })

  // A desktop that comes back (the app restarted, a session resumed) keeps this pane's tab while the engine's panes
  // are gone: the pane the store's note says was open opens again, and is drawn again either way.
  on('session.attach', async ($, e, next) => {
    const done = await next(e)
    if (e.surface !== 'desktop') return done
    await restorePane(kept, keepNouns($))
    await startWatch($)

    return done
  }).catch(($, e, next) => next(e))

  // The MODZ main panel asks by pane key; this only opens, so a pane already open just comes forward.
  on('state.set', { plugin: 'modz', key: 'open' }, async ($, e, next) => {
    const done = await next(e)
    if (isOpenFor(e.value, HUB_PANE)) await openPane($)

    return done
  }).catch(($, e, next) => next(e))

  // Another pane took the MODZ panel: this one steps aside rather than wait as a tab; its ticker stops on the close.
  on('state.set', { plugin: 'modz', key: 'stage' }, async ($, e, next) => {
    const done = await next(e)
    if (isOffStage(e.value, HUB_PANE)) await $.ui.close({ id: PANE })

    return done
  }).catch(($, e, next) => next(e))

  on('ui.close', { id: PANE }, ($, e, next) => {
    kept.isHeld = true
    pane.ticker?.cancel()
    pane.ticker = null

    return next(e)
  }).catch(($, e, next) => next(e))
}

// Everything the pane draws; a throw anywhere in it costs the plain list, never the tab.
async function drawnPane($: EngineInterface, ui: Ui, o: { room: Room; touchedAt: number }) {
  await read($, tickAtom)
  const plan = resolvePlan(await read($, tasksAtom), await read($, docAtom))
  const view = { plan, tracks: await read($, tracksAtom), now: await $.clock.now(), theme: pane.theme, touchedAt: o.touchedAt }
  const isHubOn = (await $.state.get({ plugin: 'modz', key: 'isOn' })).value === true
  if (!isHubOn) return planPane(ui, view, o.room)
  const { Box } = ui

  return (
    <Box flexDirection="column">
      {HomeButton(ui, () => void goHome($))}
      {planPane(ui, view, { ...o.room, rows: o.room.rows - HOME_ROWS })}
    </Box>
  )
}

// The plain list: each step by its mark and title; with no plan to read, the notice alone.
async function plainOf($: EngineInterface, ui: Ui) {
  const plan = await (async () => resolvePlan(await read($, tasksAtom), await read($, docAtom)))().catch(() => null)

  return plainPane(ui, { notice: words().paneFailed, lines: (plan?.steps ?? []).map(step => `${MARK[step.status]} ${step.title}`) })
}

export function wirePane(on: On, ctx: PaneCtx): void {
  opening(on)

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e) as Ui
    const nouns = keepNouns($)
    reopenKeptTab(kept, nouns)
    const room = { columns: e.props.bodyColumns || DEFAULT_COLUMNS, rows: e.props.scroll?.bodyRows || e.viewport?.rows || DEFAULT_ROWS, surface: e.surface }

    return pinned(e, await drawSafely(kept, { draw: () => drawnPane($, ui, { room, touchedAt: ctx.touchedAt() }), plain: () => plainOf($, ui), log: nouns.log }))
  }).catch(async ($, e, next) => {
    // The hook threw past its own guard or ran out of time: still a list, and a redraw on the next look.
    if (next.error.kind === 're-entry') return next(e)
    kept.needsDraw = true

    return pinned(e, await plainOf($, $.ui.resolve(e) as Ui))
  })
}
