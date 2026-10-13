import { listSessions, loadPast, loadTurns } from './browse'
import { why } from './explainer'
import { LIST_PAGE, PANE_ROWS_MAX } from './pane-io'
import type { PaneIo } from './pane-io'
import type { ReplayBrowse, ReplayStep } from '../types'

// What opens the pane and what its presses do: the live replay, a session's turns, the session list, a turn
// read back; stepping, finishing and closing.

export type ListMode = { mode: 'turns' | 'sessions'; session?: string }

const BAND_RELEASE_MS = 200
const PANE_ROWS_BASE = 12
const LIST_ROWS_MAX = 8
const DIFF_ROWS_MAX = 13
const EMPTY_ROWS = 8

function paneRows(steps: ReplayStep[]): number {
  const longest = Math.max(0, ...steps.map(step => step.diff.length))

  return Math.min(PANE_ROWS_MAX, PANE_ROWS_BASE + Math.min(steps.length, LIST_ROWS_MAX) + Math.min(longest, DIFF_ROWS_MAX))
}

// The pane opens with nothing to replay too: it says so there, not in the transcript.
export async function openReplay(io: PaneIo): Promise<{ hasEdits: boolean; isPlaced: boolean }> {
  const replay = await io.replay.get()
  const steps = replay?.steps ?? []
  const hasEdits = steps.length > 0
  await io.browse.set(() => ({ mode: 'replay', source: 'live', shown: LIST_PAGE }))
  if (hasEdits) {
    await io.index.set(() => 0)
    await io.offered.set(() => false)
  }
  await io.view.set(view => ({ ...view, isOpen: true, inBand: false }))
  // The pane takes the keys only while nothing else holds them: the band's button held them, so wait a beat.
  await io.sleep(BAND_RELEASE_MS)
  const isPlaced = await io.open(hasEdits ? paneRows(steps) : EMPTY_ROWS)
  // The band shows a replay when the pane has no room; an empty one has nothing to show there.
  if (!isPlaced) await io.view.set(view => ({ ...view, isOpen: hasEdits, inBand: hasEdits }))
  if (hasEdits && replay !== null) io.explain(replay.id)

  return { hasEdits, isPlaced }
}

// The main panel's open request: an open pane only comes forward, keeping its place.
export async function bringReplay(io: PaneIo): Promise<void> {
  const view = await io.view.get()
  if (view.isOpen && !view.inBand) await io.open()
  else await openReplay(io)
}

// A list in the pane: read in the background and shown at once with what is known; a closed pane opens.
export async function openList(io: PaneIo, list: ListMode): Promise<void> {
  await io.browse.set(() => ({ mode: list.mode, source: 'live', shown: LIST_PAGE }))
  const reading = list.mode === 'sessions' ? listSessions(io) : loadTurns(io, list.session ?? io.where().current)
  void reading.catch((error: unknown) => io.archive.log(`replay-theater: reading failed (${why(error)})`))
  if ((await io.view.get()).isOpen) return
  await io.view.set(view => ({ ...view, isOpen: true, inBand: false }))
  await io.sleep(BAND_RELEASE_MS)
  if (!(await io.open(PANE_ROWS_MAX))) await io.view.set(view => ({ ...view, inBand: true }))
}

async function watchTurn(io: PaneIo, turn: number): Promise<void> {
  const session = (await io.turns.get())?.session ?? io.where().current
  if (await loadPast(io, { session, turn })) await io.browse.set(browse => ({ ...browse, mode: 'replay', source: 'past' }))
}

export async function closeReplay(io: PaneIo): Promise<void> {
  const view = await io.view.get()
  await io.view.set(current => ({ ...current, isOpen: false, inBand: false }))
  if (!view.inBand) await io.close()
}

async function step(io: PaneIo, delta: number): Promise<void> {
  const browse = await io.browse.get()
  const replay = browse.source === 'past' ? await io.past.get() : await io.replay.get()
  const total = replay?.steps.length ?? 0
  await io.index.set(index => Math.max(0, Math.min(index + delta, total - 1)))
}

// The session a "Turns" press lists: the one the replay on screen came from.
async function turnsOfShown(io: PaneIo): Promise<void> {
  const browse = await io.browse.get()
  const past = browse.source === 'past' ? await io.past.get() : null
  await openList(io, { mode: 'turns', session: past?.origin?.session ?? io.where().current })
}

// Every press of the pane and of a replay drawn in the band; the last step of a turn read back returns to its list.
export function handlersOf(io: PaneIo, browse: ReplayBrowse) {
  const turns = () => void turnsOfShown(io)
  const close = () => void closeReplay(io)

  return {
    onPrev: () => void step(io, -1),
    onNext: () => void step(io, 1),
    onFinish: browse.source === 'past' ? turns : close,
    onTurns: turns,
    onSessions: () => void openList(io, { mode: 'sessions' }),
    onThisSession: () => void openList(io, { mode: 'turns', session: io.where().current }),
    onSession: (id: string) => void openList(io, { mode: 'turns', session: id }),
    onTurn: (n: number) => void watchTurn(io, n),
    onMore: () => void io.browse.set(current => ({ ...current, shown: current.shown + LIST_PAGE })),
    onClose: close,
  }
}

export type Handlers = ReturnType<typeof handlersOf>
