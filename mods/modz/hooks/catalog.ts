import { BOTH, META, githubName } from './meta'
import type { Group, Surface } from './meta'

type ReadFile = (path: string) => Promise<unknown>

export type ModInfo = {
  name: string
  version: string
  description: string
  group: Group
  surfaces: Surface[]
  // "owner/repo" of the project a mod is built on; null for one made in MODZ.
  upstream: string | null
  isHealthy: boolean
  // From settings' enabledPlugins; null when settings do not say.
  isEnabled: boolean | null
}

type Entry = { name: string; source: string }

type Manifest = { version?: string; description?: string; repository?: unknown; homepage?: unknown; author?: { url?: unknown } }

export type Market = { name: string; mods: ModInfo[] }

// The mod lives in MODZ/mods/modz; given its real path (not the ~/.claude/skills
// symlink), the marketplace root is two levels up.
export function marketRoot(realPluginRoot: string): string {
  return realPluginRoot.replace(/\/mods\/[^/]+\/?$/, '')
}

async function readJson<T>(read: ReadFile, path: string): Promise<T | undefined> {
  try {
    return JSON.parse(String(await read(path))) as T
  } catch {
    return undefined
  }
}

function upstreamOf(name: string, manifest: Manifest | undefined): string | null {
  return githubName(manifest?.repository) ?? githubName(manifest?.homepage) ?? META[name]?.upstream ?? githubName(manifest?.author?.url)
}

function infoOf(entry: Entry, manifest: Manifest | undefined, enabled: Record<string, unknown>): ModInfo {
  const meta = META[entry.name]
  const flag = enabled[entry.name]

  return {
    name: entry.name,
    version: manifest?.version ?? '?',
    description: manifest?.description ?? 'plugin.json okunamadı',
    group: meta?.group ?? 'Diğer',
    surfaces: meta?.surfaces ?? BOTH,
    upstream: upstreamOf(entry.name, manifest),
    isHealthy: manifest?.version !== undefined,
    isEnabled: typeof flag === 'boolean' ? flag : null,
  }
}

// `enabled` is settings' enabledPlugins narrowed to this marketplace, keyed by plugin name.
export async function loadCatalog(read: ReadFile, root: string, enabledPlugins: Record<string, unknown> = {}): Promise<Market> {
  const market = await readJson<{ name?: string; plugins?: Entry[] }>(read, `${root}/.claude-plugin/marketplace.json`)
  const name = market?.name ?? 'modz'
  const enabled = Object.fromEntries(Object.entries(enabledPlugins).filter(([key]) => key.endsWith(`@${name}`)).map(([key, value]) => [key.slice(0, -name.length - 1), value]))
  const mods = await Promise.all(
    (market?.plugins ?? []).map(async entry => {
      const dir = `${root}/${entry.source.replace(/^\.\//, '')}`

      return infoOf(entry, await readJson<Manifest>(read, `${dir}/.claude-plugin/plugin.json`), enabled)
    }),
  )

  return { name, mods }
}

// "18 mod · hepsi açık", "18 mod · 15 açık", or just the count when settings do not say.
export function headline(mods: ModInfo[]): string {
  const known = mods.filter(mod => mod.isEnabled !== null)
  const on = known.filter(mod => mod.isEnabled === true).length
  if (known.length === 0) return `${mods.length} mod`

  return on === mods.length ? `${mods.length} mod · hepsi açık` : `${mods.length} mod · ${on} açık`
}
