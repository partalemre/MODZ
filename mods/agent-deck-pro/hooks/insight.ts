// What the pane works out on its own, from state it already holds: who each agent is, who went
// quiet, whose test broke, who needs a look, who costs the most. No model is asked.
import { costText, roughText } from './format'
import { countsOf, isFailed, isLive, isRunning } from './roster'
import type { DeckAgent } from '../types'

export type Mood = 'busy' | 'stuck' | 'resting' | 'happy' | 'hurt'

export type Flag = { text: string; color: string }

// `name` and `reason` are `text` in two parts, for a surface that draws them apart.
export type Attention = { agentId: string; glyph: string; color: string; text: string; name: string; reason: string; isBroken: boolean }

const MS_PER_MINUTE = 60_000
// A running agent with no tool open and nothing heard for this long has gone quiet.
export const QUIET_MS = 2 * MS_PER_MINUTE
// One tool call open this long is worth a look, even if long builds are sometimes fine.
export const LONG_TOOL_MS = 15 * MS_PER_MINUTE
// A failure stays on the attention line this long after it happened.
const FAILURE_FRESH_MS = 10 * MS_PER_MINUTE
const HASH_MULTIPLIER = 31

// Theme keys, so each identity follows the person's theme; success, warning and error stay for status.
const IDENTITY_COLORS = ['claude', 'planMode', 'autoAccept', 'ide', 'permission']
const KNOWN_COLORS: Record<string, string> = { 'general-purpose': 'claude', Explore: 'planMode', Plan: 'autoAccept' }
const EYES = ['•', '°', 'ˆ', '◦', '·', 'ᵒ']
const KNOWN_EYES: Record<string, string> = { 'general-purpose': '•', Explore: '◦', Plan: 'ˆ' }

function hashOf(name: string, size: number): number {
  let hash = 0
  for (const char of name) hash = (hash * HASH_MULTIPLIER + char.charCodeAt(0)) % size

  return hash
}

// What an agent is told apart by: its task's description, since many agents share one type.
export function identityOf(agent: DeckAgent): string {
  return agent.description === '' ? agent.id : agent.description
}

export function colorOf(name: string): string {
  return KNOWN_COLORS[name] ?? IDENTITY_COLORS[hashOf(name, IDENTITY_COLORS.length)] ?? 'claude'
}

// A small face per identity: the eyes are its own, the expression is the agent's state.
export function faceOf(name: string, mood: Mood = 'busy'): string {
  const eye = KNOWN_EYES[name] ?? EYES[hashOf(name, EYES.length)] ?? '•'
  if (mood === 'happy') return '(ᵔᴗᵔ)'
  if (mood === 'hurt') return '(×_×)'
  if (mood === 'resting') return '(-ᴗ-)'
  if (mood === 'stuck') return `(${eye}_${eye})`

  return `(${eye}ᴗ${eye})`
}

// Why a running agent looks stuck, or null while it looks fine.
export function stuckReason(agent: DeckAgent, nowMs: number): string | null {
  if (!isRunning(agent) || agent.endedAt !== null) return null
  if (agent.toolSince !== null) {
    const open = nowMs - agent.toolSince

    return open >= LONG_TOOL_MS ? `${agent.tool ?? 'araç'} ${roughText(open)} sürüyor` : null
  }
  const quiet = nowMs - agent.lastActivityAt

  return quiet >= QUIET_MS ? `sessiz ${roughText(quiet)}` : null
}

// The one quiet mark a live row carries: gone quiet first, then a broken test.
export function flagOf(agent: DeckAgent, nowMs: number): Flag | null {
  const stuck = stuckReason(agent, nowMs)
  if (stuck !== null) return { text: stuck, color: 'warning' }
  if (isLive(agent) && agent.hasFailingTest) return { text: 'son test kırık', color: 'error' }

  return null
}

export function moodOf(agent: DeckAgent, nowMs: number): Mood {
  if (isFailed(agent)) return 'hurt'
  if (!isLive(agent)) return 'happy'
  if (!isRunning(agent)) return 'resting'

  return stuckReason(agent, nowMs) === null ? 'busy' : 'stuck'
}

function nameOf(agent: DeckAgent): string {
  return agent.description === '' ? agent.type : agent.description
}

function attention(agent: DeckAgent, reason: string, isBroken: boolean): Attention {
  const name = nameOf(agent)

  return { agentId: agent.id, glyph: isBroken ? '✕' : '!', color: isBroken ? 'error' : 'warning', text: `${name}: ${reason}`, name, reason, isBroken }
}

// The one agent that most needs a look: the longest-quiet first, then a broken test, then a fresh failure.
export function attentionOf(agents: DeckAgent[], nowMs: number): Attention | null {
  const stuck = agents
    .filter(agent => stuckReason(agent, nowMs) !== null)
    .sort((a, b) => (a.toolSince ?? a.lastActivityAt) - (b.toolSince ?? b.lastActivityAt))[0]
  if (stuck !== undefined) return attention(stuck, stuckReason(stuck, nowMs) ?? '', false)
  const broken = agents.find(agent => isLive(agent) && agent.hasFailingTest)
  if (broken !== undefined) return attention(broken, 'son test kırık', true)
  const failed = agents
    .filter(agent => isFailed(agent) && agent.endedAt !== null && nowMs - agent.endedAt < FAILURE_FRESH_MS)
    .sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))[0]

  return failed === undefined ? null : attention(failed, 'hata verdi', true)
}

// The agent that has cost the most, once two or more have a cost to compare.
export function priciestOf(agents: DeckAgent[]): DeckAgent | null {
  const priced = agents.filter(agent => agent.costUsd > 0)
  if (priced.length < 2) return null

  return priced.reduce((top, agent) => (agent.costUsd > top.costUsd ? agent : top))
}

function longestLive(agents: DeckAgent[], nowMs: number): number | null {
  const live = agents.filter(isLive)
  if (live.length === 0) return null

  return Math.max(...live.map(agent => (agent.endedAt ?? nowMs) - agent.startedAt))
}

// The overview line: "8 ajan · 6 çalışıyor · 2 bitti · en uzun 7dk", only the counts that are not zero.
export function summaryText(agents: DeckAgent[], nowMs: number): string {
  if (agents.length === 0) return 'boşta'
  const counts = countsOf(agents)
  const costUsd = agents.reduce((sum, agent) => sum + agent.costUsd, 0)
  const longest = longestLive(agents, nowMs)
  const parts = [
    `${agents.length} ajan`,
    counts.running > 0 ? `${counts.running} çalışıyor` : '',
    counts.waiting > 0 ? `${counts.waiting} bekliyor` : '',
    counts.done > 0 ? `${counts.done} bitti` : '',
    counts.failed > 0 ? `${counts.failed} hata` : '',
    longest === null ? '' : `en uzun ${roughText(longest)}`,
    costUsd > 0 ? costText(costUsd) : '',
  ]

  return parts.filter(part => part !== '').join(' · ')
}
