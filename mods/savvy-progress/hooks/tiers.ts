import type { ThemeKey } from 'claude-code'

import type { AgentRun } from '../types'

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

// The terminal colours tiers with theme keys, never hex.
const TIER_KEY: Record<string, ThemeKey> = {
  fable: 'merged',
  heavy: 'error',
  careful: 'warning',
  medium: 'suggestion',
  light: 'success',
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

export const keyOf = (tier: string): ThemeKey => TIER_KEY[tier] ?? 'subtle'

// `savvy-careful`, or `savvy-flow:savvy-careful` when the agents ship in a plugin.
export const savvyTierOf = (type: string): string | null => {
  const bare = type.replace(/^[^:]*:/, '')
  const tier = bare.replace(/^savvy-/, '').toLowerCase()
  return bare.startsWith('savvy-') && tier in TIER_MODEL ? tier : null
}

export const tierOf = (a: Who): string => savvyTierOf(a.type) ?? EFFORT_TIER[a.effort ?? ''] ?? 'other'

// The upstream costumes stand first (savvy tiers, the Explore pirate); the effort fills in the rest.
export const costumeOf = (a: Who): string => savvyTierOf(a.type) ?? (a.type === 'Explore' ? 'explore' : tierOf(a))

// The coloured word before the model: the tier when one is known, else the agent type.
export const tierWordOf = (a: Who): string => {
  const tier = tierOf(a)
  return tier === 'other' ? a.type : tier
}

export const plannedTierOf = (tier: string): string => (tier in TIER_MODEL ? tier : 'other')
