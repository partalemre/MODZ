// What a prompt is worth thinking about, and the effort a main-loop step is sent with because of it.
// Pure: no `$`, so the tests and the hooks share it.
import type { EffortMode, RouteClass, StepEffort } from '../types'

export const MODES: readonly EffortMode[] = ['show', 'auto', 'off']
export const DEFAULT_MODE: EffortMode = 'show'
export const CLASSES: readonly RouteClass[] = ['light', 'normal', 'deep']

// The level a light prompt is sent at; never above the session's own setting.
export const LIGHT_EFFORT = 'low'
const LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'] as const
type Level = (typeof LEVELS)[number]

// The judge reads no more of a prompt than this: a pasted log costs nothing extra.
export const JUDGE_TEXT_MAX = 2000

export const JUDGE_INSTRUCTIONS = [
  'How much reasoning does this request to a coding agent need?',
  'light: a quick question, a lookup, a rename, a small mechanical edit.',
  'normal: ordinary feature or bug work.',
  'deep: hard debugging, architecture, a plan of many steps.',
].join('\n')

// Follow-ups that carry on the previous turn: they keep its routing and ask no judge. Both languages.
const FOLLOW_UPS = new Set([
  'yes', 'y', 'yep', 'yeah', 'ok', 'okay', 'k', 'sure', 'go', 'go on', 'go ahead', 'continue', 'proceed', 'do it',
  'next', 'thanks', 'thank you', 'right', 'fine', 'agreed', 'sounds good', 'lgtm', 'no', 'nope', 'stop',
  'evet', 'tamam', 'olur', 'peki', 'devam', 'devam et', 'aynen', 'hadi', 'yap', 'sağol', 'sağ ol', 'teşekkürler',
  'teşekkür ederim', 'eyvallah', 'hayır', 'yok', 'dur', 'tamamdır', 'okey',
])

// The origins that are a person's own words; any other prompt (a notification, a peer, a plugin) keeps the routing.
const PERSON_ORIGINS = new Set(['composer', 'bridge', 'sdk', 'slack-ping'])

export const modeOf = (value: unknown): EffortMode | undefined =>
  MODES.includes(value as EffortMode) ? (value as EffortMode) : undefined

// The person's own pick (kept in `$.store`) wins over the plugin option, which wins over the default.
export const resolveMode = (stored: unknown, option: unknown): EffortMode => modeOf(stored) ?? modeOf(option) ?? DEFAULT_MODE

const normalized = (text: string): string =>
  text.trim().toLocaleLowerCase('tr').replace(/[\s.!?,;:…]+$/u, '').replace(/\s+/gu, ' ')

export const isFollowUp = (text: string): boolean => FOLLOW_UPS.has(normalized(text))

export const isSlashCommand = (text: string): boolean => text.trimStart().startsWith('/')

export type PromptFacts = { text: string; origin: string; isMidTurn: boolean }

// A prompt the judge never reads: empty, a slash command, a follow-up, not a person's, or delivered into a running turn.
export function isSkipped(facts: PromptFacts): boolean {
  if (facts.isMidTurn || !PERSON_ORIGINS.has(facts.origin)) return true

  return normalized(facts.text) === '' || isSlashCommand(facts.text) || isFollowUp(facts.text)
}

export const classOf = (label: string | undefined): RouteClass | null =>
  CLASSES.includes(label as RouteClass) ? (label as RouteClass) : null

const rankOf = (effort: StepEffort | undefined): number => LEVELS.indexOf(effort as Level)

// The effort a main-loop step goes with. Only `light` changes anything, and only downwards: a session at a
// level above `low` is sent `low`; a numeric budget, an unknown level or no effort at all is left alone, as
// is `normal`, `deep` (never raised past the person's setting) and an unjudged prompt.
export function routedEffort(cls: RouteClass | null, effort: StepEffort | undefined): StepEffort | undefined {
  if (cls !== 'light') return effort
  const rank = rankOf(effort)
  if (rank < 0) return effort

  return rank > rankOf(LIGHT_EFFORT) ? LIGHT_EFFORT : effort
}
