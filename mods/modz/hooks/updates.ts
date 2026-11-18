// Whether a newer MODZ is on GitHub than the one installed, so the hub can say so while updates stay the person's
// choice: the installed commit (installed_plugins.json) against the marketplace repo's head (`git ls-remote`, one
// read of a public repo that sends nothing about the person). Pure: market.ts does the reads.
import type { HubCard, Updates } from '../types'
import { UPDATES_PANE } from './hub'
import { updateWords } from './upkeep-words'

type Json = Record<string, unknown>

const isRecord = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value)

function parsed(text: string | undefined): Json | undefined {
  if (text === undefined) return undefined
  try {
    const value: unknown = JSON.parse(text)

    return isRecord(value) ? value : undefined
  } catch {
    return undefined
  }
}

// The git address a marketplace was added from (known_marketplaces.json); undefined for a local folder.
export function remoteOf(knownText: string | undefined, market: string): string | undefined {
  const entry = parsed(knownText)?.[market]
  const source = isRecord(entry) ? entry.source : undefined
  if (!isRecord(source)) return undefined
  if (source.source === 'github' && typeof source.repo === 'string') return `https://github.com/${source.repo}.git`
  if ((source.source === 'git' || source.source === 'url') && typeof source.url === 'string') return source.url

  return undefined
}

// The commit a plugin was installed at; `key` is `plugin@marketplace`.
export function installedCommit(installedText: string | undefined, key: string): string | undefined {
  const plugins = parsed(installedText)?.plugins
  const entries = isRecord(plugins) ? plugins[key] : undefined
  const first: unknown = Array.isArray(entries) ? entries[0] : undefined
  const sha = isRecord(first) ? first.gitCommitSha : undefined

  return typeof sha === 'string' ? sha : undefined
}

// The head commit in `git ls-remote <url> HEAD`'s output.
export function headOf(lsRemote: string): string | undefined {
  return /^([0-9a-f]{40})\s+HEAD$/m.exec(lsRemote)?.[1]
}

export const isNewer = (installed: string | undefined, head: string | undefined): boolean =>
  installed !== undefined && head !== undefined && installed !== head

// The plugins installed from `market`, by name.
export function installedFrom(installedText: string | undefined, market: string): string[] {
  const plugins = parsed(installedText)?.plugins
  const suffix = `@${market}`

  return isRecord(plugins) ? Object.keys(plugins).filter(key => key.endsWith(suffix)).map(key => key.slice(0, -suffix.length)).sort() : []
}

// What updating by hand takes: refresh the marketplace, then each plugin installed from it.
export const updateCommands = (market: string, mods: string[]): string =>
  [`claude plugin marketplace update ${market}`, ...mods.map(mod => `claude plugin update ${mod}@${market}`)].join(' && ')

// The row's one line; only a new version asks for attention.
export function updatesCard(updates: Updates, at: number): HubCard {
  const say = updateWords()
  if (updates.hasNew) return { pane: UPDATES_PANE, detail: say.cardNew, tone: 'warn', at }

  return { pane: UPDATES_PANE, detail: updates.isAuto ? say.cardAuto : say.cardCurrent, tone: 'idle', at }
}
