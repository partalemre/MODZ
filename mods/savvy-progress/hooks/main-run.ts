import type { AgentRun } from '../types'
import { addRun } from './agents'
import { clip } from './format'
import { t } from './i18n'
import { reopen } from './roster'

// The session's own loop as a row of the panel. In a desktop chat most work is done by the main loop itself, with
// no subagent, and the panel used to show none of it. Its row opens at the loop's first model request of a turn
// and closes with the turn; it is never stopped or written to from its card, and never counted as crew.

export const MAIN_ID = 'main'
const TITLE_MAX = 80

export const isMain = (a: Pick<AgentRun, 'isMain'>): boolean => a.isMain === true

/** The subagents alone: what a count of the crew, the job and the other chats' view are made of. */
export const crewOf = <T extends Pick<AgentRun, 'isMain'>>(list: readonly T[]): T[] => list.filter(a => !isMain(a))

/** What the row is named after: the request's first line, cut short; a slash command names nothing. */
export const titleOf = (prompt: string): string => {
  const line = prompt.split('\n').find(text => text.trim())?.trim() ?? ''

  return line.startsWith('/') ? '' : clip(line, TITLE_MAX)
}

export type MainStart = { title?: string; at: number }

/**
 * The list with the main loop's row running. A new request (`title` given) starts the row over; a turn that woke
 * on its own (a background task's notice) reopens the row it has.
 */
export function mainAwake(list: AgentRun[], start: MainStart): AgentRun[] {
  const known = list.find(isMain)
  if (known && start.title === undefined) return known.status === 'running' ? list : list.map(a => (a === known ? reopen(a) : a))
  const description = start.title || known?.description || t().mainTask
  const spawn = { id: MAIN_ID, agentId: MAIN_ID, type: t().mainType, description, model: known?.model ?? '', at: start.at }

  return addRun(list, spawn).map(a => (a.id === MAIN_ID ? { ...a, isMain: true } : a))
}
