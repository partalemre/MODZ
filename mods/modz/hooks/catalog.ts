import { pick } from './kit/lang'
import { BOTH, META, githubName } from './meta'
import type { Group, Surface } from './meta'
import { catalogWords } from './words'

type ReadFile = (path: string) => Promise<unknown>
type HasLink = (name: string) => Promise<boolean>
type LinkedDir = (name: string) => Promise<string | undefined>

export type ModInfo = {
  name: string
  // The manifest's or the entry's version; null when neither pins one and the mod tracks commits.
  version: string | null
  description: string
  group: Group
  surfaces: Surface[]
  // "owner/repo" of the project a mod is built on; null for one made in MODZ.
  upstream: string | null
  isHealthy: boolean
  // settings' enabledPlugins, else a skills link (user's or the project's); null when neither says.
  isEnabled: boolean | null
  // The options its manifest declares (`userConfig`), which a person sets under /plugin.
  options: string[]
}

// A marketplace entry as written; any field may be missing or of another type.
type Entry = { name?: unknown; source?: unknown; version?: unknown; description?: unknown }

type Manifest = { version?: unknown; description?: unknown; repository?: unknown; homepage?: unknown; author?: { url?: unknown }; userConfig?: unknown }

export type CatalogOptions = {
  read: ReadFile
  root: string
  // settings' enabledPlugins, keyed "name@market"; narrowed to this marketplace here.
  enabledPlugins?: Record<string, unknown>
  // Whether a skills-folder link to the mod exists: how this repo's mods are enabled.
  hasLink?: HasLink
  // The folder a skills link to the mod leads to: where a mod kept in its own repo can still be read.
  linkedDir?: LinkedDir
}

export type Market = { name: string; mods: ModInfo[] }

const SKILLS_DIR = '.claude/skills'

// A mod is linked from the user's skills folder (every session on this machine) or from the
// project's (a cloud session gets only what the repo carries). Blank roots are skipped.
type LinkSpec = { roots: (string | undefined)[]; exists: (path: string) => Promise<boolean> }

export function linkedDir(spec: LinkSpec): LinkedDir {
  const dirs = spec.roots.filter((root): root is string => Boolean(root)).map(root => `${root}/${SKILLS_DIR}`)

  return async name => {
    for (const dir of dirs) if (await spec.exists(`${dir}/${name}`).catch(() => false)) return `${dir}/${name}`

    return undefined
  }
}

export function linkCheck(spec: LinkSpec): HasLink {
  const dirOf = linkedDir(spec)

  return async name => (await dirOf(name)) !== undefined
}

// The mod lives in MODZ/mods/modz; given its real path (not the ~/.claude/skills
// symlink), the marketplace root is two levels up. Windows separators are read as '/'.
export function marketRoot(realPluginRoot: string): string {
  return realPluginRoot.replaceAll('\\', '/').replace(/\/mods\/[^/]+\/?$/, '')
}

// A copy installed from a marketplace sits in the plugins cache with its own folder only; the catalog stays in
// the marketplace's clone, where known_marketplaces.json says it was put (by default <plugins>/marketplaces/<name>).
export function installedMarketRoot(install: { market: string; pluginsDir: string }, knownText: string | undefined): string {
  let known: unknown
  try {
    known = JSON.parse(knownText ?? '')
  } catch {
    known = undefined
  }
  const entry = isRecord(known) ? known[install.market] : undefined
  const location = isRecord(entry) ? text(entry.installLocation) : undefined

  return (location ?? `${install.pluginsDir}/marketplaces/${install.market}`).replaceAll('\\', '/').replace(/\/+$/, '')
}

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

// `note` stands in for a description when a mod is fine but its manifest is out of reach (kept in its own repo).
type Facts = { name: string; entry: Entry; manifest: Manifest | undefined; isEnabled: boolean | null; problem?: string; note?: string }

function infoOf(facts: Facts): ModInfo {
  const { name, entry, manifest, problem } = facts
  const meta = META[name]
  const summary = meta?.summary === undefined ? undefined : pick(meta.summary)

  return {
    name,
    version: text(manifest?.version) ?? text(entry.version) ?? null,
    description: problem ?? summary ?? text(manifest?.description) ?? text(entry.description) ?? facts.note ?? (manifest ? '' : catalogWords().unreadable),
    group: meta?.group ?? 'other',
    surfaces: meta?.surfaces ?? BOTH,
    upstream: upstreamOf(name, manifest),
    // A manifest without a version is still a readable one.
    isHealthy: (manifest !== undefined || facts.note !== undefined) && problem === undefined,
    isEnabled: facts.isEnabled,
    options: isRecord(manifest?.userConfig) ? Object.keys(manifest.userConfig) : [],
  }
}

// settings saying false wins; true, or a skills link, means on; otherwise nobody says.
async function enabledOf(spec: { name: string; flag: unknown; hasLink: HasLink }): Promise<boolean | null> {
  if (spec.flag === false) return false
  if (spec.flag === true) return true
  const isLinked = SAFE_NAME.test(spec.name) && (await spec.hasLink(spec.name).catch(() => false))

  return isLinked ? true : null
}

// An object source ({ source: "github", repo } or a git url) is a mod kept in its own repo, not a broken one.
function remoteNote(source: unknown): string {
  const repo = isRecord(source) ? text(source.repo) ?? githubName(source.url) ?? undefined : undefined
  const remote = catalogWords().remote

  return repo === undefined ? remote : `${remote} (${repo})`
}

// Its manifest is read where the skills link leads, when the mod is linked on this computer.
async function remoteInfo(spec: { name: string; entry: Entry; isEnabled: boolean | null; options: CatalogOptions }): Promise<ModInfo> {
  const { name, entry, isEnabled, options } = spec
  const dir = SAFE_NAME.test(name) ? await options.linkedDir?.(name).catch(() => undefined) : undefined
  const manifest = dir === undefined ? undefined : await readJson(options.read, `${dir}/.claude-plugin/plugin.json`)

  return infoOf({ name, entry, manifest, isEnabled, note: remoteNote(entry.source) })
}

async function entryInfo(spec: { entry: unknown; index: number; options: CatalogOptions; enabled: Record<string, unknown> }): Promise<ModInfo> {
  const { index, options, enabled } = spec
  const hasLink = options.hasLink ?? (async () => false)
  const entry: Entry = isRecord(spec.entry) ? spec.entry : {}
  const name = text(entry.name)
  const invalid = catalogWords().invalid
  if (name === undefined) return infoOf({ name: catalogWords().entry(index + 1), entry, manifest: undefined, isEnabled: null, problem: invalid })

  const isEnabled = await enabledOf({ name, flag: enabled[name], hasLink })
  if (entry.source === undefined || entry.source === null) return infoOf({ name, entry, manifest: undefined, isEnabled, problem: invalid })
  if (typeof entry.source !== 'string') return remoteInfo({ name, entry, isEnabled, options })
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

// "18 mods · all on", "18 mods · 15 on", "18 mods · 3 on · 15 unknown", or just the count when nothing is known.
export function headline(mods: ModInfo[]): string {
  const words = catalogWords()
  const known = mods.filter(mod => mod.isEnabled !== null)
  const total = words.mods(mods.length)
  if (known.length === 0) return total
  const on = known.filter(mod => mod.isEnabled === true).length
  const state = on === known.length ? words.allOn : words.on(on)
  const unknown = mods.length - known.length

  return unknown === 0 ? `${total} · ${state}` : `${total} · ${state} · ${words.unknown(unknown)}`
}

// The catalog head's right side: problems are named, a clean catalog says so quietly.
export function healthOf(mods: ModInfo[]): { text: string; isBad: boolean } {
  const words = catalogWords()
  const bad = mods.filter(mod => !mod.isHealthy).length

  return bad === 0 ? { text: words.allHealthy, isBad: false } : { text: words.broken(bad), isBad: true }
}
