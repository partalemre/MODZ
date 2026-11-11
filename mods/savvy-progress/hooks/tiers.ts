import type { AgentRun } from '../types'
import { t } from './i18n'

type Who = Pick<AgentRun, 'type' | 'effort'>

// Bar and hat colour per savvy tier. Svg art keeps fixed hex; words get per-theme shades in the Svg style.
export const TIER_COLOR: Record<string, string> = {
  fable: '#7F77DD',
  heavy: '#D85A30',
  careful: '#BA7517',
  medium: '#378ADD',
  light: '#1D9E75',
  other: '#888780',
}

// What each savvy tier runs on, for planned tasks that have no run yet.
export const TIER_MODEL: Record<string, string> = {
  fable: 'Fable · high',
  heavy: 'Opus · xhigh',
  careful: 'Opus · high',
  medium: 'Opus · medium',
  light: 'Opus · low',
}

// Without a savvy tier the agent's effort picks the costume:
// xhigh the detective, high the engineer, medium the chef, low the racer.
const EFFORT_TIER: Record<string, string> = {
  max: 'heavy',
  xhigh: 'heavy',
  high: 'careful',
  medium: 'medium',
  low: 'light',
}

export const colorOf = (tier: string): string => TIER_COLOR[tier] ?? '#888780'


// `savvy-careful`, or `savvy-flow:savvy-careful` when the agents ship in a plugin.
export const savvyTierOf = (type: string): string | null => {
  const bare = type.replace(/^[^:]*:/, '')
  const tier = bare.replace(/^savvy-/, '').toLowerCase()
  return bare.startsWith('savvy-') && Object.hasOwn(TIER_MODEL, tier) ? tier : null
}

const effortTierOf = (effort = ''): string | null => (Object.hasOwn(EFFORT_TIER, effort) ? EFFORT_TIER[effort] ?? null : null)

export const tierOf = (a: Who): string => savvyTierOf(a.type) ?? effortTierOf(a.effort) ?? 'other'

// The upstream costumes stand first (savvy tiers, the Explore pirate); the effort fills in the rest.
export const costumeOf = (a: Who): string => savvyTierOf(a.type) ?? (a.type === 'Explore' ? 'explore' : tierOf(a))

// The coloured word before the model: the tier when one is known, else the agent type.
/** "orta düşünme" for the engine's `medium`; a word the table lacks stays as it is. */
export const effortWord = (effort = ''): string => t().efforts[effort] ?? effort

// A savvy tier is the agent's own name for itself; without one the thinking level is said in words.
export const tierWordOf = (a: Who): string => savvyTierOf(a.type) ?? (effortTierOf(a.effort) ? effortWord(a.effort) : a.type)

export const plannedTierOf = (tier: string): string => (Object.hasOwn(TIER_MODEL, tier) ? tier : 'other')
