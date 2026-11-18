// The catalog as the hub reads it from disk, and Claude Code's own auto-update switched on for it. No `$` here:
// the engine follows `$` only into the file that got it, so register.tsx hands in the few reads these need (`Disk`).
import { autoUpdateSettings, installOf, isAutoOn, settingsWithAuto } from './auto-update'
import { headOf, installedCommit, installedFrom, isNewer, remoteOf } from './updates'
import { installedMarketRoot, linkedDir, loadCatalog, marketRoot } from './catalog'
import type { Market } from './catalog'
import type { Updates } from '../types'

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

type Run = (argv: string[]) => Promise<{ stdout: string }>

async function settingsPathOf(disk: Disk): Promise<string | undefined> {
  const home = await homeOf(disk)
  const configDir = (await disk.env.configDir()) ?? (home === undefined ? undefined : `${home}/.claude`)

  return configDir === undefined ? undefined : `${configDir}/settings.json`
}

// What the Updates row says (updates.ts). `run` asks GitHub for the latest commit; without it, `hadNew` stands.
export async function updatesOf(disk: Disk, ask: { run?: Run; hadNew: boolean }): Promise<Updates> {
  const install = installOf(disk.root)
  if (install === undefined) return { isInstalled: false, isAuto: false, hasNew: false, mods: [], market: '' }
  const settingsPath = await settingsPathOf(disk)
  const knownText = await textOf(disk, `${install.pluginsDir}/known_marketplaces.json`)
  const isAuto = isAutoOn({ market: install.market, settingsText: settingsPath === undefined ? undefined : await textOf(disk, settingsPath), knownText })
  const url = remoteOf(knownText, install.market)
  const installedText = await textOf(disk, `${install.pluginsDir}/installed_plugins.json`)
  const installed = installedCommit(installedText, `modz@${install.market}`)
  const known = { isInstalled: true, isAuto, mods: installedFrom(installedText, install.market), market: install.market }
  if (ask.run === undefined || url === undefined || installed === undefined) return { ...known, hasNew: ask.hadNew }

  return { ...known, hasNew: isNewer(installed, headOf((await ask.run(['git', 'ls-remote', url, 'HEAD'])).stdout)) }
}

// The person's press on the Updates pane: Claude Code's own auto-update for this marketplace, on or off.
export async function setAutoUpdate(disk: Disk, isOn: boolean): Promise<boolean> {
  const install = installOf(disk.root)
  const settingsPath = await settingsPathOf(disk)
  if (install === undefined || settingsPath === undefined) return false
  const next = settingsWithAuto({
    market: install.market,
    settingsText: await textOf(disk, settingsPath),
    knownText: await textOf(disk, `${install.pluginsDir}/known_marketplaces.json`),
  }, isOn)
  if (next === undefined) return false
  await disk.write(settingsPath, next)

  return true
}
