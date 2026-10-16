import type { AgentRun, Flow, HubTone, Job, OtherChat, TrackedTask } from '../types'
import { isRunning } from './agents'
import { waitingOf } from './chats'
import { clip } from './format'
import { t } from './i18n'
import { deriveJob } from './job'
import type { JobView } from './job'
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
 * "· 1 chat waits" after it while another chat on this machine waits on the person. The job's part gives way first.
 */
export const hubDetailOf = (view: JobView | null, running: number, waiting = 0): string => {
  const crew = running > 0 ? `${SEP}${t().hubCrew(running)}` : ''
  const jobPart = view ? `${view.label}${crew}` : ''
  const waits = waiting > 0 ? t().chats.hubWaits(waiting) : ''
  if (!waits) return clip(jobPart, DETAIL_MAX)
  if (!view) return clip(waits, DETAIL_MAX)
  const room = DETAIL_MAX - waits.length - SEP.length
  // Too long whole, the crew count goes before the label is cut.
  const lead = jobPart.length <= room ? jobPart : clip(view.label, room)
  return `${lead}${SEP}${waits}`
}

/** Everything the card is drawn from, as it is stored. */
export type HubSources = { flow: Flow | null; agents: AgentRun[]; job: Job | null; tasks: TrackedTask[]; chats: OtherChat[] }

/** The card's words and tone. */
export const hubCardOf = (src: HubSources): { detail: string; tone: HubTone } => {
  const view = deriveJob({ flow: src.flow, agents: src.agents, job: src.job, tasks: src.tasks })
  return { detail: hubDetailOf(view, src.agents.filter(isRunning).length, waitingOf(src.chats).length), tone: toneOf(view) }
}
