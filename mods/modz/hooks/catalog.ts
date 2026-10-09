import { BOTH, META, githubName } from './meta'
import type { Group, Surface } from './meta'

type ReadFile = (path: string) => Promise<unknown>
type HasLink = (name: string) => Promise<boolean>

export type ModInfo = {
  name: string
  version: string
  description: string
  group: Group
  surfaces: Surface[]
  // "owner/repo" of the project a mod is built on; null for one made in MODZ.
  upstream: string | null
  isHealthy: boolean
  // settings' enabledPlugins, else a ~/.claude/skills/<name> link; null when neither says.
  isEnabled: boolean | null
}

// A marketplace entry as written; any field may be missing or of another type.
type Entry = { name?: unknown; source?: unknown; version?: unknown; description?: unknown }

type Manifest = { version?: unknown; description?: unknown; repository?: unknown; homepage?: unknown; author?: { url?: unknown } }

export type CatalogOptions = {
  read: ReadFile
  root: string
  // settings' enabledPlugins, keyed "name@market"; narrowed to this marketplace here.
  enabledPlugins?: Record<string, unknown>
  // Whether ~/.claude/skills/<name> exists: how this repo's mods are enabled.
  hasLink?: HasLink
}

export type Market = { name: string; mods: ModInfo[] }

// The mod lives in MODZ/mods/modz; given its real path (not the ~/.claude/skills
// symlink), the marketplace root is two levels up.
export function marketRoot(realPluginRoot: string): string {
  return realPluginRoot.replace(/\/mods\/[^/]+\/?$/, '')
}

const UNREADABLE = 'plugin.json okunamadı'
const INVALID = 'marketplace kaydı geçersiz'
const REMOTE = 'uzak kaynak: yerel plugin.json yok'
const UNKNOWN_VERSION = '?'
const SAFE_NAME = /^[\w.-]+$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

// Undefined when the file is missing, not JSON, or JSON that is not an object.
async function readJson(read: ReadFile, path: string): Promise<Record<string, unknown> | undefined> {
  try {
    const value: unknown = JSON.parse(String(await read(path)))

    return isRecord(value) ? value : undefined
  } catch {
    return undefined
  }
}

function upstreamOf(name: string, manifest: Manifest | undefined): string | null {
  return githubName(manifest?.repository) ?? githubName(manifest?.homepage) ?? META[name]?.upstream ?? githubName(manifest?.author?.url)
}

type Facts = { name: string; entry: Entry; manifest: Manifest | undefined; isEnabled: boolean | null; problem?: string }

function infoOf(facts: Facts): ModInfo {
  const { name, entry, manifest, problem } = facts
  const meta = META[name]

  return {
    name,
    version: text(manifest?.version) ?? text(entry.version) ?? UNKNOWN_VERSION,
    description: problem ?? meta?.summary ?? text(manifest?.description) ?? text(entry.description) ?? (manifest ? '' : UNREADABLE),
    group: meta?.group ?? 'Diğer',
    surfaces: meta?.surfaces ?? BOTH,
    upstream: upstreamOf(name, manifest),
    // A manifest without a version is still a readable one.
    isHealthy: manifest !== undefined && problem === undefined,
    isEnabled: facts.isEnabled,
  }
}

// settings saying false wins; true, or a skills link, means on; otherwise nobody says.
async function enabledOf(spec: { name: string; flag: unknown; hasLink: HasLink }): Promise<boolean | null> {
  if (spec.flag === false) return false
  if (spec.flag === true) return true
  const isLinked = SAFE_NAME.test(spec.name) && (await spec.hasLink(spec.name).catch(() => false))

  return isLinked ? true : null
}

// An object source ({ source: "github", repo }) points away from this checkout; only a string is a local path.
function remoteProblem(source: unknown): string {
  const repo = isRecord(source) ? text(source.repo) ?? text(source.url) : undefined

  return repo === undefined ? REMOTE : `${REMOTE} (${repo})`
}

async function entryInfo(spec: { entry: unknown; index: number; options: CatalogOptions; enabled: Record<string, unknown> }): Promise<ModInfo> {
  const { index, options, enabled } = spec
  const hasLink = options.hasLink ?? (async () => false)
  const entry: Entry = isRecord(spec.entry) ? spec.entry : {}
  const name = text(entry.name)
  if (name === undefined) return infoOf({ name: `kayıt ${index + 1}`, entry, manifest: undefined, isEnabled: null, problem: INVALID })

  const isEnabled = await enabledOf({ name, flag: enabled[name], hasLink })
  if (typeof entry.source !== 'string') return infoOf({ name, entry, manifest: undefined, isEnabled, problem: entry.source === undefined ? INVALID : remoteProblem(entry.source) })
  const dir = `${options.root}/${entry.source.replace(/^\.\//, '')}`

  return infoOf({ name, entry, manifest: await readJson(options.read, `${dir}/.claude-plugin/plugin.json`), isEnabled })
}

export async function loadCatalog(options: CatalogOptions): Promise<Market> {
  const market = await readJson(options.read, `${options.root}/.claude-plugin/marketplace.json`)
  const name = text(market?.name) ?? 'modz'
  const plugins: unknown = market?.plugins
  const entries: unknown[] = Array.isArray(plugins) ? plugins : []
  const enabled = Object.fromEntries(
    Object.entries(options.enabledPlugins ?? {})
      .filter(([key]) => key.endsWith(`@${name}`))
      .map(([key, value]) => [key.slice(0, -name.length - 1), value]),
  )
  const mods = await Promise.all(entries.map((entry, index) => entryInfo({ entry, index, options, enabled })))

  return { name, mods }
}

// "18 mod · hepsi açık", "18 mod · 15 açık", "18 mod · 3 açık · 15 bilinmiyor", or just the count when nothing is known.
export function headline(mods: ModInfo[]): string {
  const known = mods.filter(mod => mod.isEnabled !== null)
  if (known.length === 0) return `${mods.length} mod`
  const on = known.filter(mod => mod.isEnabled === true).length
  const state = on === known.length ? 'hepsi açık' : `${on} açık`
  const unknown = mods.length - known.length

  return unknown === 0 ? `${mods.length} mod · ${state}` : `${mods.length} mod · ${state} · ${unknown} bilinmiyor`
}

// The catalog head's right side: problems are named, a clean catalog says so quietly.
export function healthOf(mods: ModInfo[]): { text: string; isBad: boolean } {
  const bad = mods.filter(mod => !mod.isHealthy).length

  return bad === 0 ? { text: 'hepsi sağlıklı', isBad: false } : { text: `${bad} sorunlu`, isBad: true }
}
