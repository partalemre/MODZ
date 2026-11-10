import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeKey } from 'claude-code'

import type { CrabMood } from '../types'
import { bandSvg, BAND_H } from './band-svg'
import { isOwnOpen } from './hub'
import { HEARTBEAT_MS, SCAN_MS } from './chats'
import { NOTE_PREFIX, noteKey, restorePane, staleNotes, watchPane } from './kit/pane-keep'
import { isOffStage, shownOf } from './stage'
import { t } from './i18n'
import type { JobView } from './job'
import { deriveJob, percentText } from './job'
import { isIdleMood, restingCrab } from './mood'
import { FACES } from './mood-svg'
import { motion } from './pane-motion'
import { paneHeld } from './pane-held'
import { pinned } from './pin'
import { HUB_PANE, PANE } from './state'

// State refs live in each file that reads them: the scan follows literals, not imports.
const agents = atom({ plugin: 'savvy-progress', key: 'agents' } as const, [])
const flow = atom({ plugin: 'savvy-progress', key: 'flow' } as const, null)
const job = atom({ plugin: 'savvy-progress', key: 'job' } as const, null)
const tasks = atom({ plugin: 'savvy-progress', key: 'tasks' } as const, [])
const now = atom({ plugin: 'savvy-progress', key: 'now' } as const, 0)
const crab = atom({ plugin: 'savvy-progress', key: 'crab' } as const, restingCrab(0))

type On = Parameters<Register>[0]
type Ui = Record<string, any>

// About 8 CSS px per reported column; the crew count, the dismiss and their gaps sit beside the Svg.
const PX_PER_COL = 8
const BUTTONS_PX = 128
const DEFAULT_COLS = 100
// Terminal cells: the dot and its space, the two buttons, the gaps between the row's parts.
const TERM = { dot: 2, buttons: 12, gaps: 5, titleMin: 8, meterMin: 8, meterMax: 40, segMin: 3 } as const

// The meter's unit colours on the terminal: done quiet, a failure red, the live ones in Claude's own accent.
type Cell = { key: ThemeKey | null; glyph: string }
const CELL: Record<string, Cell> = {
  ok: { key: 'subtle', glyph: '━' },
  danger: { key: 'error', glyph: '━' },
  run: { key: 'claude', glyph: '━' },
  wait: { key: null, glyph: '─' },
}

const unitKind = (view: JobView, i: number): string => {
  if (i < view.done - view.failed) return 'ok'
  if (i < view.done) return 'danger'
  return i < view.done + view.active ? 'run' : 'wait'
}

const pillKey = (view: JobView): ThemeKey => {
  if (!view.isFinished) return 'claude'
  return view.failed ? 'warning' : 'subtle'
}

// Tells the hub this pane now holds the panel, so the hub and every other pane step aside (kit/stage.ts).
async function reportShown($: EngineInterface, at: number): Promise<void> {
  try {
    if ((await $.state.get({ plugin: 'modz', key: 'isOn' })).value !== true) return
    await $.state.set({ plugin: 'savvy-progress', key: 'shown' }, shownOf(HUB_PANE, at))
  } catch (cause) {
    $.ui.log(`savvy-progress: could not tell MODZ the pane is shown: ${String(cause)}`, { to: 'debug' })
  }
}

// Opens the İlerleme pane, or brings it forward when it is up already; never closes it.
async function openPane($: EngineInterface): Promise<void> {
  paneHeld.isHeld = true
  const at = await $.clock.now()
  await update($, now, () => at)
  motion.reset()
  const opened = await $.ui.open({ id: PANE, title: t().pane, focus: true })
  if (opened.isPlaced) await reportShown($, at)
}

// The pane's watch (kit/pane-keep.tsx): whether it was open is noted in the store, as it must outlive the engine, and
// a draw that failed or never came is asked for again. It starts at the first attach, so a pane not yet restored
// isn't noted; every BEAT_LOOKS-th look redraws whatever the last draw was.
let isWatchingPane = false
const BEAT_LOOKS = HEARTBEAT_MS / SCAN_MS

async function reopenPane($: EngineInterface): Promise<void> {
  const opened = await $.ui.open({ id: PANE, title: t().pane })
  if (opened.isPlaced) await reportShown($, await $.clock.now())
}

// What the kit asks of the engine for this pane; built here, where `$` is.
const keepNouns = ($: EngineInterface) => ({
  isListed: async () => (await $.ui.panes()).some(p => p.id === PANE),
  reopen: () => reopenPane($),
  redraw: () => $.ui.invalidate('ui.render'),
  note: {
    read: async () => $.store.get(noteKey(await $.session.id())),
    write: async (at: number | undefined) => {
      const key = noteKey(await $.session.id())
      return at === undefined ? $.store.delete(key) : $.store.set(key, at)
    },
  },
  now: () => $.clock.now(),
  log: (text: string) => $.ui.log(`savvy-progress: ${text}`, { to: 'debug' }),
})

// Notes left by sessions long gone (a session that ends with its pane open never clears its own) are dropped.
async function pruneNotes($: EngineInterface): Promise<void> {
  try {
    const entries: [string, unknown][] = []
    for (const key of await $.store.keys()) if (key.startsWith(NOTE_PREFIX)) entries.push([key, await $.store.get(key)])
    for (const key of staleNotes(entries, { own: noteKey(await $.session.id()), now: await $.clock.now() })) await $.store.delete(key)
  } catch (cause) {
    $.ui.log(`savvy-progress: could not drop old pane notes: ${String(cause)}`, { to: 'debug' })
  }
}

function startWatch($: EngineInterface): void {
  let looks = 0
  $.clock.every(SCAN_MS, () => void watchPane(paneHeld, keepNouns($), ++looks % BEAT_LOOKS === 0))
}


// /agents-info and the crew button: open the pane, or close it when it is up; true when it ends up open.
async function togglePane($: EngineInterface): Promise<boolean> {
  const isOpen = (await $.ui.panes()).some(p => p.id === PANE)
  if (isOpen) {
    paneHeld.isHeld = true
    await $.ui.close({ id: PANE })
    return false
  }
  await openPane($)
  return true
}

// Hides the band until the next request launches agents or reports progress.
async function dismiss($: EngineInterface): Promise<void> {
  await update($, flow, () => null)
  await update($, job, prev => (prev ? { ...prev, isSealed: true, isHidden: true } : prev))
}

function buttons(ui: Ui, $: EngineInterface, view: JobView) {
  const { Button } = ui
  return [
    <Button key="savvy-agents" label={t().crew(view.crew)} plain onPress={() => void togglePane($)} />,
    <Button key="savvy-dismiss" label="✕" plain role="dismiss" onPress={() => dismiss($)} />,
  ]
}

/** `mood` is the home crab's while it sits in the row: only with `crabInBand` on and the session idle. */
type BandInput = { view: JobView; cols: number; mood?: CrabMood }

function desktopBand(ui: Ui, $: EngineInterface, { view, cols, mood }: BandInput) {
  const { Box, Svg } = ui
  const drawing = bandSvg(view, (cols || DEFAULT_COLS) * PX_PER_COL - BUTTONS_PX, mood)
  return (
    <Box key="savvy-band" flexDirection="row" alignItems="center" columnGap={1}>
      <Svg source={drawing.source} alt={`${view.title}: ${view.label}, ${percentText(view)}`} width={drawing.width} height={BAND_H} />
      {buttons(ui, $, view)}
    </Box>
  )
}

// One run of cells per unit, a space between units while each gets a few cells; else one solid run.
const termCells = (view: JobView, width: number): Cell[] => {
  const units = Math.max(1, view.units)
  const per = Math.floor((width - (units - 1)) / units)
  const gap: Cell = { key: null, glyph: ' ' }
  if (view.units > 0 && per >= TERM.segMin) {
    return Array.from({ length: units }, (_, i) => [...(i ? [gap] : []), ...Array<Cell>(per).fill(CELL[unitKind(view, i)] ?? gap)]).flat()
  }
  if (view.units < 1) return Array<Cell>(width).fill(CELL.wait ?? gap)
  return Array.from({ length: width }, (_, i) => CELL[unitKind(view, Math.floor((i * units) / width))] ?? gap)
}

function meterText(ui: Ui, cells: Cell[]) {
  const { Text } = ui
  const runs: { key: ThemeKey | null; text: string }[] = []
  for (const cell of cells) {
    const last = runs.at(-1)
    if (last && last.key === cell.key) last.text += cell.glyph
    else runs.push({ key: cell.key, text: cell.glyph })
  }
  return <Text>{runs.map((run, i) => (run.key ? <Text key={`m${i}`} color={run.key}>{run.text}</Text> : <Text key={`m${i}`} dimColor>{run.text}</Text>))}</Text>
}

// Widths in cells: the meter gives way to its minimum first, then the title, then the meter goes.
const termPlan = (view: JobView, cols: number): { titleW: number; meterW: number } => {
  const avail = cols - TERM.dot - view.label.length - percentText(view).length - TERM.buttons - TERM.gaps
  const natural = view.title.length
  if (avail - natural >= TERM.meterMin) return { titleW: natural, meterW: Math.min(TERM.meterMax, avail - natural) }
  const titleW = Math.max(TERM.titleMin, avail - TERM.meterMin)
  const meterW = avail - titleW
  return meterW >= TERM.meterMin ? { titleW, meterW } : { titleW: Math.max(TERM.titleMin, avail + 1), meterW: 0 }
}

function terminalBand(ui: Ui, $: EngineInterface, { view, cols, mood }: BandInput) {
  const { Box, Text } = ui
  const face = mood ? FACES[mood] : ''
  const plan = termPlan(view, (cols || DEFAULT_COLS) - (face ? face.length + 1 : 0))
  return (
    <Box key="savvy-band" flexDirection="row" columnGap={1}>
      <Box width={plan.titleW + TERM.dot} flexShrink={0}>
        <Text color={pillKey(view)}>● </Text>
        <Text bold wrap="truncate-end">{view.title}</Text>
      </Box>
      <Text color={pillKey(view)}>{view.label}</Text>
      {plan.meterW > 0 && meterText(ui, termCells(view, plan.meterW))}
      <Text bold>{percentText(view)}</Text>
      {face !== '' && <Text dimColor>{face}</Text>}
      {buttons(ui, $, view)}
    </Box>
  )
}

async function viewOf($: EngineInterface): Promise<JobView | null> {
  return deriveJob({ flow: await read($, flow), agents: await read($, agents), job: await read($, job), tasks: await read($, tasks) })
}

// The ways in to the pane: the command, and the MODZ hub's open request (DESIGN.md §9).
function onOpen(on: On): void {
  on('command.run', { command: 'agents-info' }, async $ => {
    const isOpen = await togglePane($)
    return { text: isOpen ? t().opened : t().closed }
  })

  // A desktop that comes back (the app restarted, a session resumed) keeps this pane's tab, but the engine's panes are
  // gone and the tab reads "Nothing to show yet" until the pane opens again. The stage can't say so: the hub writes it
  // back to itself on every start. So the note the watch keeps decides; the pane is drawn again either way.
  on('session.attach', async ($, e, next) => {
    const done = await next(e)
    if (e.surface !== 'desktop') return done
    await restorePane(paneHeld, keepNouns($))
    if (!isWatchingPane) {
      isWatchingPane = true
      await pruneNotes($)
      startWatch($)
    }
    return done
  }).catch(($, e, next) => next(e))

  on('state.set', { plugin: 'modz', key: 'open' }, async ($, e, next) => {
    const done = await next(e)
    if (isOwnOpen(e.value)) await openPane($)
    return done
  }).catch(($, e, next) => next(e))

  // Another pane took the MODZ panel: this one steps aside rather than wait as a tab.
  on('state.set', { plugin: 'modz', key: 'stage' }, async ($, e, next) => {
    const done = await next(e)
    if (isOffStage(e.value, HUB_PANE)) {
      paneHeld.isHeld = true
      await $.ui.close({ id: PANE })
    }
    return done
  }).catch(($, e, next) => next(e))
}

// The band contract: the engine's and other plugins' rows are drawn first and kept;
// progress stacks above them, and a survey gets the band to itself.
// The home crab's mood for the row, or none: it sits there only when asked for and while idle.
async function bandMood($: EngineInterface, isCrabInBand: boolean): Promise<CrabMood | undefined> {
  if (!isCrabInBand) return undefined
  const { mood } = await read($, crab)
  return isIdleMood(mood) ? mood : undefined
}

export type BandOptions = { isCrabInBand: boolean }

export function onBand(on: On, opts: BandOptions): void {
  onOpen(on)

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const theirs = await next(e)
    const view = await viewOf($)
    if (!view) return theirs
    const table = $.ui.resolve(e)
    const ui = table as Ui
    const { Box } = ui
    const input = { view, cols: e.props.bodyColumns, mood: await bandMood($, opts.isCrabInBand) }
    const mine = e.surface !== 'terminal' && 'Svg' in ui ? desktopBand(ui, $, input) : terminalBand(ui, $, input)
    return (
      <Box flexDirection="column">
        {pinned(e, mine)}
        {theirs}
      </Box>
    )
  })
}
