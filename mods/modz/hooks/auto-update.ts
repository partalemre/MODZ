// Keeps every installed mod current at no cost: Claude Code's own background auto-update refreshes a
// marketplace and every plugin installed from it, transceiver's own repo included, but it is off for a
// third-party marketplace until someone turns it on. With keepUpdated on (off by default, so no commit runs
// unreviewed), the hub turns it on once, in the user settings entry the engine reads first, and never touches
// a choice the person already made there.

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

// The marketplace's source as settings or known_marketplaces.json name it, when it is a remote one.
function sourceOf(plan: UpdatePlan, declared: unknown): unknown {
  if (isRecord(declared) && isRemote(declared.source)) return declared.source
  const known = parsed(plan.knownText)?.[plan.market]
  const source = isRecord(known) ? known.source : undefined

  return isRemote(source) ? source : undefined
}

// Whether the engine updates this marketplace by itself: the settings entry wins over known_marketplaces.json.
export function isAutoOn(plan: UpdatePlan): boolean {
  const markets = parsed(plan.settingsText)?.extraKnownMarketplaces
  const declared = isRecord(markets) ? markets[plan.market] : undefined
  if (isRecord(declared) && typeof declared.autoUpdate === 'boolean') return declared.autoUpdate
  const known = parsed(plan.knownText)?.[plan.market]

  return isRecord(known) && known.autoUpdate === true
}

// The settings text with auto-update set to `isOn` by the person's own press; undefined when there is nothing to
// set it on (unreadable settings, a local marketplace).
export function settingsWithAuto(plan: UpdatePlan, isOn: boolean): string | undefined {
  const settings = parsed(plan.settingsText)
  if (settings === undefined || plan.market === '') return undefined
  const markets = isRecord(settings.extraKnownMarketplaces) ? settings.extraKnownMarketplaces : {}
  const declared = markets[plan.market]
  const source = sourceOf(plan, declared)
  if (source === undefined) return undefined
  const entry = { ...(isRecord(declared) ? declared : {}), source, autoUpdate: isOn }

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
