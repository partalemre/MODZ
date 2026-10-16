import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import { HomeButton } from './home'
import { HUB_PANE, isOpenFor } from './hub'
import { isOffStage, shownOf } from './kit/stage'
import { resolvePlan } from './match'
import { motion, planPane } from './pane'
import { pinned } from './pin'
import { themeOf } from './ui/theme'
import type { Theme } from './ui/theme'

// The engine reads each module's use of the mod's values from that module's own source.
const docAtom = atom({ plugin: 'plan-steps', key: 'doc' } as const, null)
const tasksAtom = atom({ plugin: 'plan-steps', key: 'tasks' } as const, [])
const tickAtom = atom({ plugin: 'plan-steps', key: 'tick' } as const, 0)
const tracksAtom = atom({ plugin: 'plan-steps', key: 'tracks' } as const, {})

// The Plan pane: /steps or the MODZ main panel opens it, nothing else does; with the hub on, "← MODZ"
// comes first (DESIGN.md §9).

const PANE = 'plan-steps'
const PANE_TITLE = 'Plan'
const TICK_MS = 30_000
const DEFAULT_ROWS = 24
const DEFAULT_COLUMNS = 48
// The "← MODZ" button's row.
const HOME_ROWS = 1

export type PaneCtx = { touchedAt: () => number }

type Timer = { cancel: () => void }

const pane = { ticker: null as Timer | null, theme: 'auto' as Theme }

// Asks the hub to come forward; the hub hears this mod's own `home` value. A failure only shows in the debug log.
async function goHome($: EngineInterface): Promise<void> {
  try {
    await $.state.set({ plugin: 'plan-steps', key: 'home' }, { at: await $.clock.now() })
  } catch (error) {
    $.ui.log(`plan-steps: home failed (${String(error)})`, { to: 'debug' })
  }
}

// Tells the hub this pane now holds the panel, so the hub and every other pane step aside (kit/stage.ts).
async function reportShown($: EngineInterface): Promise<void> {
  try {
    if ((await $.state.get({ plugin: 'modz', key: 'isOn' })).value !== true) return
    await $.state.set({ plugin: 'plan-steps', key: 'shown' }, shownOf(HUB_PANE, await $.clock.now()))
  } catch (error) {
    $.ui.log(`plan-steps: shown failed (${String(error)})`, { to: 'debug' })
  }
}

// The drawing follows Claude Code's theme setting; `auto` leaves it to the system's appearance.
async function refreshTheme($: EngineInterface): Promise<void> {
  try {
    pane.theme = themeOf((await $.config.list()).find(row => row.key === 'theme')?.value)
  } catch (error) {
    $.ui.log(`plan-steps: theme not readable (${error instanceof Error ? error.message : 'unknown'})`, { to: 'debug' })
  }
}

// The same pane whoever asks; an open pane comes forward. A 30-second tick moves its times while it is open.
async function openPane($: EngineInterface): Promise<void> {
  await refreshTheme($)
  motion.reset()
  const opened = await $.ui.open({ id: PANE, title: PANE_TITLE, focus: true })
  if (opened.isPlaced) await reportShown($)
  pane.ticker ??= $.clock.every(TICK_MS, () => void update($, tickAtom, tick => tick + 1))
}

function opening(on: On): void {
  on('command.run', { command: 'steps' }, async $ => {
    await openPane($)

    return {}
  })

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
    pane.ticker?.cancel()
    pane.ticker = null

    return next(e)
  }).catch(($, e, next) => next(e))
}

export function wirePane(on: On, ctx: PaneCtx): void {
  opening(on)

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    await read($, tickAtom)
    const plan = resolvePlan(await read($, tasksAtom), await read($, docAtom))
    const view = { plan, tracks: await read($, tracksAtom), now: await $.clock.now(), theme: pane.theme, touchedAt: ctx.touchedAt() }
    const layout = { columns: e.props.bodyColumns || DEFAULT_COLUMNS, rows: e.props.scroll?.bodyRows || e.viewport?.rows || DEFAULT_ROWS, surface: e.surface }

    const ui = $.ui.resolve(e)
    const isHubOn = (await $.state.get({ plugin: 'modz', key: 'isOn' })).value === true
    if (!isHubOn) return pinned(e, planPane(ui, view, layout))
    const { Box } = ui

    return pinned(e, (
      <Box flexDirection="column">
        {HomeButton(ui, () => void goHome($))}
        {planPane(ui, view, { ...layout, rows: layout.rows - HOME_ROWS })}
      </Box>
    ))
  })
}
