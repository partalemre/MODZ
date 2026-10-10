import type { AgentType, Draft } from '../types'
import { clip } from './format'
import { t } from './i18n'

// The agent types "Yeni görev" can start: the engine's built-ins first, then each type the engine
// offers the model (plugins' agents, settings' agents), then the agents/*.md files of the project
// and the user. A name is listed once, the first source to name it kept.

const DESCRIPTION_MAX = 160
export const DEFAULT_TYPE = 'general-purpose'
// The Agent call's own `description`: a few words, cut from the task.
export const TASK_TITLE_MAX = 40

export const BUILTIN_TYPES: AgentType[] = [
  { name: DEFAULT_TYPE, description: 'Research, search and multi-step work', source: 'built-in' },
  { name: 'Explore', description: 'Fast, read-only code search', source: 'built-in' },
  { name: 'Plan', description: 'Drafts an implementation plan', source: 'built-in' },
]

export const blankDraft = (): Draft => ({ isOpen: false, type: DEFAULT_TYPE })

/** An agents/*.md file's `name` and `description` from its front matter, or null when it has no name. */
export function parseAgentFile(text: string, source: string): AgentType | null {
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!front) return null
  const field = (key: string) => new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(front[1] ?? '')?.[1]?.trim().replace(/^["']|["']$/g, '')
  const name = field('name')
  if (!name) return null
  return { name, description: clip(field('description') ?? '', DESCRIPTION_MAX), source }
}

/** `current` with each type of `found` it does not name yet; the same array when none is new. */
export function mergeTypes(current: AgentType[], found: AgentType[]): AgentType[] {
  const fresh = found.filter((type, i) => !current.some(c => c.name === type.name) && found.findIndex(f => f.name === type.name) === i)
  return fresh.length ? [...current, ...fresh] : current
}

/** The type the form shows: the one picked, else the first known. */
export const chosenOf = (types: AgentType[], draft: Draft | undefined): AgentType | undefined =>
  types.find(type => type.name === draft?.type) ?? types[0]

/** What a type does, in the interface's language for a built-in. */
export const describe = (type: AgentType): string => t().builtins[type.name] ?? (type.description || t().noDescription)

/** Where a type comes from, in the interface's words. */
export const sourceWord = (source: string): string => t().sources[source] ?? source

/** What an `agent.offer` names, as a type the form lists. */
export const offered = (e: { agent: string; description: string; source: string }): AgentType => ({
  name: e.agent,
  description: clip(e.description.split('\n')[0] ?? '', DESCRIPTION_MAX),
  source: e.source,
})
