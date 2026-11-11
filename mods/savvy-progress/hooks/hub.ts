import type { AgentRun, Flow, HubCard, HubLive, HubTone, Job, OtherChat, TrackedTask } from '../types'
import { isRunning } from './agents'
import { quietOf, waitingOf } from './chats'
import { clip, fmtCost } from './format'
import { t } from './i18n'
import { deriveJob } from './job'
import type { JobView } from './job'
import { crewOf, isMain } from './main-run'
import { isSame } from './same'
import { HUB_PANE } from './state'

// The MODZ data path (DESIGN.md §9), its pure half: whether the hub's open request names this
// pane, and what this mod's one-line card says. The hooks live where `$` is: band.tsx opens the
// pane, register.tsx keeps the card.

const DETAIL_MAX = 40
const SEP = ' · '

/** Whether a `modz.open` request names this mod's pane. */
export const isOwnOpen = (value: unknown): boolean =>
  typeof value === 'object' && value !== null && (value as { pane?: unknown }).pane === HUB_PANE

export const toneOf = (view: JobView | null): HubTone => {
  if (!view) return 'idle'
  if (!view.isFinished) return 'live'
  return view.failed ? 'warn' : 'ok'
}

/**
 * "Görevler 3/4 · 2 ajan" ("Tasks 3/4 · 2 running") while agents run, the band's label alone otherwise, "" with no job;
 * "· 1 chat waits" after it while another chat on this machine waits on the person, else "· 2 chats working" while
 * others work (the desktop runs work in side sessions). The job's part gives way first.
 */
export const hubDetailOf = (view: JobView | null, running: number, others: { waiting?: number; working?: number } = {}): string => {
  const { waiting = 0, working = 0 } = others
  const crew = running > 0 ? `${SEP}${t().hubCrew(running)}` : ''
  const jobPart = view ? `${view.label}${crew}` : ''
  const works = working > 0 ? t().chats.hubWorks(working) : ''
  const waits = waiting > 0 ? t().chats.hubWaits(waiting) : works
  if (!waits) return clip(jobPart, DETAIL_MAX)
  if (!view) return clip(waits, DETAIL_MAX)
  const room = DETAIL_MAX - waits.length - SEP.length
  // Too long whole, the crew count goes before the label is cut.
  const lead = jobPart.length <= room ? jobPart : clip(view.label, room)
  return `${lead}${SEP}${waits}`
}

/** Everything the card is drawn from, as it is stored. */
export type HubSources = { flow: Flow | null; agents: AgentRun[]; job: Job | null; tasks: TrackedTask[]; chats: OtherChat[] }

// How many running agents the hub lists by name before it counts the rest, and how long a name may be.
const LIVE_LINES = 3
const LABEL_MAX = 48
// A cost under half a cent would read "$0.00": it is left out until there is one to show.
const COST_MIN = 0.005

/**
 * The running agents as the hub lists them (DESIGN.md §9): what each works on, when it started (the hub tells the
 * time itself, so a running clock costs no write) and its cost once it has one; a few by name, the rest counted.
 */
export const hubLiveOf = (agents: AgentRun[]): HubLive | undefined => {
  // The main loop leads: what this chat itself does now is the first thing asked of the hub.
  const running = [...agents.filter(a => isRunning(a) && isMain(a)), ...crewOf(agents).filter(isRunning)]
  if (running.length === 0) return undefined
  const lines = running.slice(0, LIVE_LINES).map(a => ({
    // The main loop's line says what it does now, in plain words; an agent's line, the task it was handed.
    label: clip((isMain(a) && a.lastPlain) || a.description || a.type, LABEL_MAX),
    since: a.startedAt,
    ...(a.costUsd >= COST_MIN ? { value: fmtCost(a.costUsd) } : {}),
  }))
  return running.length > LIVE_LINES ? { lines, more: running.length - LIVE_LINES } : { lines }
}

/** What the card shows: its words, its tone and the running agents; `at` is not part of it. */
export type HubShown = Pick<HubCard, 'detail' | 'tone' | 'live'>

export const hubCardOf = (src: HubSources): HubShown => {
  const view = deriveJob({ flow: src.flow, agents: src.agents, job: src.job, tasks: src.tasks })
  const others = { waiting: waitingOf(src.chats).length, working: quietOf(src.chats).filter(chat => chat.state === 'working').length }
  const live = hubLiveOf(src.agents)
  const tone = !view && (others.working > 0 || live !== undefined) ? 'live' : toneOf(view)
  return { detail: hubDetailOf(view, crewOf(src.agents).filter(isRunning).length, others), tone, ...(live ? { live } : {}) }
}

/** Whether the stored card already shows this, so it is not written again. */
export const isShowing = (card: HubCard, shown: HubShown): boolean =>
  card.detail === shown.detail && card.tone === shown.tone && isSame(card.live, shown.live)
