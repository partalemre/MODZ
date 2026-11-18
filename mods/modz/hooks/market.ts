// The catalog as the hub reads it from disk, and Claude Code's own auto-update switched on for it. No `$` here:
// the engine follows `$` only into the file that got it, so register.tsx hands in the few reads these need (`Disk`).
import { autoUpdateSettings, installOf } from './auto-update'
import { headOf, installedCommit, isNewer, remoteOf } from './updates'
import { installedMarketRoot, linkedDir, loadCatalog, marketRoot } from './catalog'
import type { Market } from './catalog'

export type Disk = {
  // The folder this copy of the mod was loaded from.
  root: string
  // Each name is spelled out where `$` is: the engine admits an env read by a literal name only.
  env: { home: () => Promise<string | undefined>; userProfile: () => Promise<string | undefined>; configDir: () => Promise<string | undefined> }
  cwd: () => Promise<string>
  settings: () => Promise<Record<string, unknown>>
  realPath: (path: string) => Promise<string | undefined>
  read: (path: string) => Promise<unknown>
  exists: (path: string) => Promise<boolean>
  write: (path: string, text: string) => Promise<unknown>
  log: (text: string) => void
}

async function enabledPlugins(disk: Disk): Promise<Record<string, unknown>> {
  try {
    const value = (await disk.settings()).enabledPlugins

    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  } catch {
    disk.log('modz: settings could not be read; enabled state unknown')

    return {}
  }
}

// The home folder, with '/' separators. Windows sets USERPROFILE and no HOME.
async function homeOf(disk: Disk): Promise<string | undefined> {
  const home = (await disk.env.home().catch(() => undefined)) || (await disk.env.userProfile().catch(() => undefined))

  return home ? home.replaceAll('\\', '/').replace(/\/+$/, '') : undefined
}

// Mods are enabled by a skills-folder symlink (~/.claude/skills, or the project's
// .claude/skills in a cloud session), which settings never mention.
async function skillLinks(disk: Disk): Promise<(name: string) => Promise<string | undefined>> {
  const home = await homeOf(disk)
  const cwd = await disk.cwd().catch(() => undefined)

  return linkedDir({ roots: [home, cwd], exists: path => disk.exists(path) })
}

async function linksOf(disk: Disk): Promise<{ hasLink: (name: string) => Promise<boolean>; linkedDir: (name: string) => Promise<string | undefined> }> {
  const dirOf = await skillLinks(disk)

  return { hasLink: async name => (await dirOf(name)) !== undefined, linkedDir: dirOf }
}

async function textOf(disk: Disk, path: string): Promise<string | undefined> {
  return (await disk.exists(path)) ? String(await disk.read(path)) : undefined
}

// A catalog that cannot be read is an empty one: the hub still draws (the engine closes a pane whose drawing
// throws, and the person would lose the way back to every other pane).
export async function marketOf(disk: Disk): Promise<Market> {
  try {
    const real = (await disk.realPath(disk.root).catch(() => undefined)) ?? disk.root
    const install = installOf(real)
    const root = install === undefined
      ? marketRoot(real)
      : installedMarketRoot(install, await textOf(disk, `${install.pluginsDir}/known_marketplaces.json`).catch(() => undefined))

    return await loadCatalog({ read: path => disk.read(path), root, enabledPlugins: await enabledPlugins(disk), ...(await linksOf(disk)) })
  } catch (cause) {
    disk.log(`modz: the catalog could not be read: ${String(cause)}`)

    return { name: '', mods: [] }
  }
}

// Every card a mod writes redraws the hub; the catalog (some twenty files, settings and links) is read again only
// after MARKET_TTL_MS, so a busy session does not reread it on each redraw. The catalog pane always reads it fresh.
const MARKET_TTL_MS = 15_000
let marketKept: { at: number; market: Promise<Market> } | null = null

export function marketSoon(disk: Disk): Promise<Market> {
  const now = Date.now()
  if (marketKept === null || now - marketKept.at > MARKET_TTL_MS) marketKept = { at: now, market: marketOf(disk) }

  return marketKept.market
}

// The catalog pane read it fresh: the hub draws from the same reading.
export function keepMarket(market: Market): void {
  marketKept = { at: Date.now(), market: Promise.resolve(market) }
}

// Turns on Claude Code's own auto-update for the marketplace this copy was installed from (auto-update.ts).
export async function keepUpdated(disk: Disk): Promise<void> {
  const install = installOf(disk.root)
  if (install === undefined) return
  const home = await homeOf(disk)
  const configDir = (await disk.env.configDir()) ?? (home === undefined ? undefined : `${home}/.claude`)
  // With no folder to name, nothing is written: never a settings file under "undefined/.claude".
  if (configDir === undefined) return
  const settingsPath = `${configDir}/settings.json`
  const next = autoUpdateSettings({
    market: install.market,
    settingsText: await textOf(disk, settingsPath),
    knownText: await textOf(disk, `${install.pluginsDir}/known_marketplaces.json`),
  })
  if (next === undefined) return
  await disk.write(settingsPath, next)
  disk.log(`modz: auto-update turned on for the ${install.market} marketplace`)
}

// Whether GitHub has a newer MODZ than the installed copy (updates.ts); false for a copy that loads in place.
export async function updateReady(disk: Disk, run: (argv: string[]) => Promise<{ stdout: string }>): Promise<boolean> {
  const install = installOf(disk.root)
  if (install === undefined) return false
  const url = remoteOf(await textOf(disk, `${install.pluginsDir}/known_marketplaces.json`), install.market)
  const installed = installedCommit(await textOf(disk, `${install.pluginsDir}/installed_plugins.json`), `modz@${install.market}`)
  if (url === undefined || installed === undefined) return false

  return isNewer(installed, headOf((await run(['git', 'ls-remote', url, 'HEAD'])).stdout))
}
