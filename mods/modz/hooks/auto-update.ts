// Keeps every installed mod current at no cost: Claude Code's own background auto-update refreshes a
// marketplace and every plugin installed from it, transceiver's own repo included, but it is off for a
// third-party marketplace until someone turns it on. The hub turns it on once, in the user settings
// entry the engine reads first, and never touches a choice the person already made there.

type Json = Record<string, unknown>

export type UpdatePlan = {
  // The marketplace's name, as `plugin@marketplace` ends.
  market: string
  // The user settings file's text, or undefined when there is none.
  settingsText: string | undefined
  // known_marketplaces.json's text: where the marketplace came from when settings do not say.
  knownText: string | undefined
}

// A marketplace read from a local folder loads in place and is always current; nothing to update.
const LOCAL_SOURCES = new Set(['directory', 'file'])

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parsed(text: string | undefined): Json | undefined {
  if (text === undefined || text.trim() === '') return {}
  try {
    const value: unknown = JSON.parse(text)

    return isRecord(value) ? value : undefined
  } catch {
    return undefined
  }
}

function isRemote(source: unknown): boolean {
  return isRecord(source) && typeof source.source === 'string' && !LOCAL_SOURCES.has(source.source)
}

// The settings entry to write, or undefined when there is nothing to change.
function entryOf(plan: UpdatePlan, declared: unknown): Json | undefined {
  if (isRecord(declared)) {
    if ('autoUpdate' in declared || !isRemote(declared.source)) return undefined

    return { ...declared, autoUpdate: true }
  }
  const known = parsed(plan.knownText)?.[plan.market]
  const source = isRecord(known) ? known.source : undefined

  return isRemote(source) ? { source, autoUpdate: true } : undefined
}

// The new settings text, or undefined to leave the file as it is (unreadable settings included).
export function autoUpdateSettings(plan: UpdatePlan): string | undefined {
  const settings = parsed(plan.settingsText)
  if (settings === undefined || plan.market === '') return undefined
  const markets = isRecord(settings.extraKnownMarketplaces) ? settings.extraKnownMarketplaces : {}
  const entry = entryOf(plan, markets[plan.market])
  if (entry === undefined) return undefined

  return `${JSON.stringify({ ...settings, extraKnownMarketplaces: { ...markets, [plan.market]: entry } }, null, 2)}\n`
}

// An installed copy lives at <plugins>/cache/<marketplace>/<plugin>/<version>.
const CACHED = /^(.*)\/cache\/([^/]+)\/[^/]+\/[^/]+\/?$/

// The marketplace a cached install came from and the plugins folder holding known_marketplaces.json;
// undefined for a copy that loads in place (a skills link, a --plugin-dir, a checkout): always current.
export function installOf(root: string): { market: string; pluginsDir: string } | undefined {
  const match = CACHED.exec(root.replaceAll('\\', '/'))
  if (match?.[1] === undefined || match[2] === undefined) return undefined

  return { pluginsDir: match[1], market: match[2] }
}
