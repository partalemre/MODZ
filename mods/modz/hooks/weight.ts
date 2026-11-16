// Dead weight: the plugins and skills the session lists for the model that the person has not used in a month, with
// what each listing costs every conversation. Pure: no `$`, so the tests and the pane share it.
import type { HubCard, Weight, Weights } from '../types'
import { WEIGHT_PANE } from './hub'
import { weightWords } from './upkeep-words'

// One skill as the engine's context breakdown lists it (ContextSkill).
export type SkillFact = { name: string; source: string; pluginName?: string; tokens: number }

// `usage` is Claude Code's own count of each skill's calls (`skillUsage` in its `.claude.json`); `enabled` the
// settings' `enabledPlugins`.
export type WeightFacts = { skills: readonly SkillFact[]; usage: unknown; enabled: Record<string, unknown>; now: number }

export const IDLE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

type Use = { usageCount?: unknown; lastUsedAt?: unknown }

// Claude Code counts a plugin's skill as `plugin:skill` and a person's own by its bare name.
const usageKey = (skill: SkillFact): string => (skill.name.includes(':') || skill.pluginName === undefined ? skill.name : `${skill.pluginName}:${skill.name}`)

function lastUsedOf(usage: Record<string, Use | undefined>, skill: SkillFact): number | null {
  const use = usage[usageKey(skill)]

  return Number(use?.usageCount) > 0 && typeof use?.lastUsedAt === 'number' ? use.lastUsedAt : null
}

// The line that switches a plugin off, for one the settings say is on; a plugin the app itself brings has none.
function disableOf(plugin: string, enabled: Record<string, unknown>): string | null {
  const id = Object.keys(enabled).find(key => key.startsWith(`${plugin}@`) && enabled[key] === true)

  return id === undefined ? null : `/plugin disable ${id}`
}

// A plugin is weighed whole (one use of any of its skills keeps it); a person's own skill by itself. Null when
// there is nothing to weigh by: without the use counts every skill would look unused, and before the session has
// listed its skills none would.
export function weightsOf(facts: WeightFacts): Weights | null {
  if (typeof facts.usage !== 'object' || facts.usage === null || facts.skills.length === 0) return null
  const usage = facts.usage as Record<string, Use | undefined>
  const groups = new Map<string, Weight>()
  for (const skill of facts.skills) {
    if (skill.source === 'built-in') continue
    const isPlugin = skill.pluginName !== undefined
    const name = skill.pluginName ?? skill.name
    const key = `${isPlugin ? 'plugin' : 'skill'}:${name}`
    const kept = groups.get(key) ?? { name, kind: isPlugin ? 'plugin' : 'skill', skills: 0, tokens: 0, lastUsedAt: null, disable: isPlugin ? disableOf(name, facts.enabled) : null }
    const lastUsedAt = lastUsedOf(usage, skill)
    groups.set(key, { ...kept, skills: kept.skills + 1, tokens: kept.tokens + skill.tokens, lastUsedAt: lastUsedAt === null ? kept.lastUsedAt : Math.max(lastUsedAt, kept.lastUsedAt ?? 0) })
  }
  const items = [...groups.values()]
    .filter(one => one.lastUsedAt === null || facts.now - one.lastUsedAt > IDLE_DAYS * DAY_MS)
    .sort((a, b) => b.tokens - a.tokens || a.name.localeCompare(b.name))

  return { items, tokens: items.reduce((sum, one) => sum + one.tokens, 0) }
}

// Whole days since a use, for the pane's "not used for 42 days".
export const idleDays = (lastUsedAt: number, now: number): number => Math.floor((now - lastUsedAt) / DAY_MS)

export function weightCard(weights: Weights, at: number): HubCard {
  const say = weightWords()
  const detail = weights.items.length === 0 ? say.noneShort : say.count(weights.items.length, weights.tokens)

  return { pane: WEIGHT_PANE, detail, tone: 'idle', at }
}
