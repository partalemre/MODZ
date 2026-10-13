import { ageText } from './age'
import type { Handlers } from './actions'
import { sessionsView, turnsView } from './lists'
import type { Ui } from './offer'
import { paneWidth, replayView } from './pane'
import { words } from './words'
import type { Replay, ReplayBrowse, ReplaySessions, ReplayTurns, ReplayView } from '../types'

// What the pane (or a terminal's band, with no room for one) draws from the session's values: a replay, a
// session's turns, or the session list.

export type Snapshot = {
  browse: ReplayBrowse
  view: ReplayView
  replay: Replay | null
  past: Replay | null
  index: number
  sessions: ReplaySessions
  turns: ReplayTurns | null
  now: number
}
export type Site = { surface: string; columns: number; inBand: boolean; maxRows: number }

const NO_TURNS: ReplayTurns = { session: '', status: 'loading', title: '', isCurrent: true, isCut: false, prompts: 0, rows: [] }

// "Turn 3 · 2d ago" for a turn read back; the live turn's age alone.
function ageOf(replay: Replay | null, now: number): string {
  const age = ageText(replay?.at, now)
  if (replay?.origin === undefined) return age

  return [words().turnN(replay.origin.turn), age].filter(Boolean).join(' · ')
}

export function bodyView(ui: Ui, snap: Snapshot, view: { site: Site; on: Handlers }) {
  const { site, on } = view
  const { browse, now } = snap
  const theme = snap.view.theme
  if (browse.mode !== 'replay') {
    const listSite = { surface: site.surface, width: paneWidth(site.columns), theme, isCompact: site.inBand, maxRows: site.maxRows, on }
    if (browse.mode === 'sessions') return sessionsView(ui, snap.sessions, { shown: browse.shown, site: listSite })

    return turnsView(ui, snap.turns ?? NO_TURNS, { shown: browse.shown, now, site: listSite })
  }
  const replay = browse.source === 'past' ? snap.past : snap.replay
  const model = { steps: replay?.steps ?? [], index: snap.index, explain: replay?.explain ?? 'none', theme, ask: replay?.ask ?? '', age: ageOf(replay, now) }

  return replayView(ui, model, { ...site, on })
}
