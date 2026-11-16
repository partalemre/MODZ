// The session's connections to outside tools (MCP servers) as the hub tells them: which answer, which wait for a
// sign-in, which failed. Pure: no `$`, so the tests and the pane share it.
import type { HubCard, Links } from '../types'
import { LINKS_PANE } from './hub'
import { linkWords } from './upkeep-words'

// What upkeep.tsx read, as it came: the servers whose tools the session holds, Claude Code's own list of servers
// that asked for a sign-in, and the tool search's reply (which names the failed and the still-connecting ones).
export type LinkFacts = { servers: readonly string[]; authCache: unknown; search: unknown; now: number }

// shortcut: Claude Code's sign-in list keeps a server after it is removed, so only a day's entries count; read
// each server's state from the engine once it offers that.
const WAIT_FRESH_MS = 24 * 60 * 60 * 1000
const ERROR_MAX = 80

// The tool list spells a server with `_` where its own name has any other mark.
const wireName = (name: string): string => name.replace(/[^\w-]/g, '_')

// `plugin:engineering:slack` reads as "slack (engineering)"; a server named after its plugin keeps one word.
export function linkName(name: string): string {
  const match = /^plugin([:_])(.+?)\1(.+)$/.exec(name)
  if (match === null) return name
  const [, , plugin, server] = match

  return server === plugin ? String(server) : `${server} (${plugin})`
}

const byName = (a: string, b: string): number => linkName(a).localeCompare(linkName(b))

function waitingOf(cache: unknown, now: number): string[] {
  if (typeof cache !== 'object' || cache === null) return []

  return Object.entries(cache)
    .filter(([, entry]) => now - Number((entry as { timestamp?: unknown } | null)?.timestamp) <= WAIT_FRESH_MS)
    .map(([name]) => name)
}

function searchOf(search: unknown): Pick<Links, 'failed' | 'pending'> {
  const result = (search as { result?: { failed_mcp_servers?: unknown; pending_mcp_servers?: unknown } } | null | undefined)?.result
  const failed = (Array.isArray(result?.failed_mcp_servers) ? result.failed_mcp_servers : [])
    .filter((one): one is { name: string; error?: unknown } => typeof one?.name === 'string')
    .map(one => ({ name: one.name, error: typeof one.error === 'string' ? one.error.slice(0, ERROR_MAX) : '' }))
  const pending = (Array.isArray(result?.pending_mcp_servers) ? result.pending_mcp_servers : []).filter((name): name is string => typeof name === 'string')

  return { failed, pending }
}

// A server is told once, by its worst state: failed, then connecting, then waiting for a sign-in, then working.
export function linksOf(facts: LinkFacts): Links {
  const { failed, pending } = searchOf(facts.search)
  const told = new Set([...failed.map(one => one.name), ...pending].map(wireName))
  const connected = [...new Set(facts.servers)].filter(name => !told.has(wireName(name))).sort(byName)
  for (const name of connected) told.add(wireName(name))
  const waiting = waitingOf(facts.authCache, facts.now).filter(name => !told.has(wireName(name))).sort(byName)

  return { connected, waiting, failed: failed.sort((a, b) => byName(a.name, b.name)), pending: pending.sort(byName) }
}

export const hasLinks = (links: Links): boolean => links.connected.length + links.waiting.length + links.failed.length + links.pending.length > 0

// The row's one line. Only a failure warns: a tool nobody signed in to is a standing state, not news.
export function linksCard(links: Links, at: number): HubCard {
  const say = linkWords()
  const parts = [links.failed.length > 0 ? say.failedCount(links.failed.length) : '', links.waiting.length > 0 ? say.waitingCount(links.waiting.length) : ''].filter(part => part !== '')
  const detail = parts.length > 0 ? parts.join(' · ') : say.connectedCount(links.connected.length)

  return { pane: LINKS_PANE, detail, tone: links.failed.length > 0 ? 'warn' : 'idle', at }
}
