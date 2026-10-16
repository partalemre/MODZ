// MODZ: the one pane that opens by itself (DESIGN.md §9). It lists every mod's pane with the
// mod's own live line, and asks the owning mod to open its pane when a row is pressed. The hub,
// its catalog ("Modlar") and every mod's pane take turns in one panel (kit/stage.ts): whichever
// opens last is the one shown, the rest close, so they never pile up as tabs.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { HubCard } from '../types'
import { autoUpdateSettings, installOf } from './auto-update'
import type { Drawing } from './draw'
import { linkCheck, loadCatalog, marketRoot } from './catalog'
import type { Market } from './catalog'
import { footerTree, isHubShown } from './footer'
import { cardOf, focusOf, hiddenRowsOf, MODS_PANE, modsTitle, presenceOf, rowsOf } from './hub'
import { hubTree } from './hub-pane'
import type { HubActions } from './hub-pane'
import { EMPTY_LAYOUT, layoutOf, moveUp, setHidden } from './layout'
import type { HubLayout } from './layout'
import { setLang } from './kit/lang'
import { HUB_PANE, paneOf } from './kit/stage'
import { isSame } from './kit/same'
import { pinned } from './kit/pin'
import { stableDrawings } from './kit/stable'
import { modzTree } from './pane'
import { themeOf } from './theme'
import type { Theme } from './theme'
import { hubWords } from './words'

const PANE = HUB_PANE
const TITLE = 'MODZ'

const OPEN = { plugin: 'modz', key: 'open' } as const
const STAGE = { plugin: 'modz', key: 'stage' } as const
const cardsAtom = atom({ plugin: 'modz', key: 'cards' } as const, {} as Record<string, HubCard>)
// The person's arrangement, mirrored from `$.store` (kept across sessions) so a change redraws the hub.
const layoutAtom = atom({ plugin: 'modz', key: 'layout' } as const, EMPTY_LAYOUT)
const editingAtom = atom({ plugin: 'modz', key: 'isEditing' } as const, false)
const ON = { plugin: 'modz', key: 'isOn' } as const
const LAYOUT_KEY = 'layout'
const DEFAULT_COLUMNS = 80

async function themeNow($: EngineInterface): Promise<Theme> {
  const rows = await $.config.list().catch(() => [])

  return themeOf(rows.find(row => row.key === 'theme')?.value)
}

async function enabledPlugins($: EngineInterface): Promise<Record<string, unknown>> {
  try {
    const value = (await $.settings.read()).enabledPlugins

    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  } catch {
    $.ui.log('modz: settings could not be read; enabled state unknown', { to: 'debug' })

    return {}
  }
}

// Mods are enabled by a skills-folder symlink (~/.claude/skills, or the project's
// .claude/skills in a cloud session), which settings never mention.
async function skillLinks($: EngineInterface): Promise<(name: string) => Promise<boolean>> {
  const home = await $.env.get('HOME').catch(() => undefined)
  const cwd = await $.session.cwd().catch(() => undefined)

  return linkCheck({ roots: [home, cwd], exists: path => $.fs.exists(path) })
}

// A catalog that cannot be read is an empty one: the hub still draws (the engine closes a pane whose drawing
// throws, and the person would lose the way back to every other pane).
async function marketOf($: EngineInterface): Promise<Market> {
  try {
    const stat = await $.fs.stat($.plugin.root, { resolve: true }).catch(() => undefined)
    const root = marketRoot(stat?.realPath ?? $.plugin.root)

    return await loadCatalog({ read: path => $.fs.read(path), root, enabledPlugins: await enabledPlugins($), hasLink: await skillLinks($) })
  } catch (cause) {
    $.ui.log(`modz: the catalog could not be read: ${String(cause)}`, { to: 'debug' })

    return { name: '', mods: [] }
  }
}

// The hub's and the catalog's drawings, kept per what they show (stable.ts); forgotten when the pane opens again.
const hubDrawings = stableDrawings<Drawing>()
const catalogDrawings = stableDrawings<Drawing>()

// A pane that will not close is logged, never thrown: the one being shown is already up.
const closeQuietly = ($: EngineInterface, id: string) =>
  $.ui.close({ id }).catch(cause => $.ui.log(`modz: ${id} could not be closed: ${String(cause)}`, { to: 'debug' }))

// Puts one of the hub's own panes in the panel and closes the other; every mod's open pane closes too.
// The footer toggle opens it without the keyboard (footer.tsx): the composer keeps it.
async function show($: EngineInterface, pane: typeof PANE | typeof MODS_PANE, isFocused = true): Promise<void> {
  const title = pane === PANE ? TITLE : modsTitle()
  const drawings = pane === PANE ? hubDrawings : catalogDrawings
  drawings.reset()
  await $.ui.open(isFocused ? { id: pane, title, focus: true } : { id: pane, title })
  await $.state.set(STAGE, { pane, at: Date.now() })
  await closeQuietly($, pane === PANE ? MODS_PANE : PANE)
}

const openHub = ($: EngineInterface) => show($, PANE)

// The footer toggle (footer.tsx): the hub's panes away when one is shown, else the hub on stage without the keyboard.
async function toggleHub($: EngineInterface): Promise<void> {
  if (!isHubShown(await $.ui.panes())) return show($, PANE, false)
  await closeQuietly($, PANE)
  await closeQuietly($, MODS_PANE)
}

async function saveLayout($: EngineInterface, change: (layout: HubLayout) => HubLayout): Promise<void> {
  const next = change(await read($, layoutAtom))
  await update($, layoutAtom, () => next)
  await $.store.set(LAYOUT_KEY, next)
}

// Each press of the hub, written where it is kept; a failed write is logged, never thrown into the drawing.
// The press waits for the work, so the panel has swapped by the time it settles.
function actionsOf($: EngineInterface): HubActions {
  const run = (what: string, work: () => Promise<unknown>) =>
    work().catch(cause => $.ui.log(`modz: ${what} failed: ${String(cause)}`, { to: 'debug' }))

  return {
    onOpen: pane => run(`opening ${pane}`, () => openPane($, pane)),
    onEdit: isEditing => run('customizing', () => update($, editingAtom, () => isEditing)),
    onMove: opts => run('moving a row', () => saveLayout($, layout => moveUp(layout, opts))),
    onHide: opts => run('hiding a row', () => saveLayout($, layout => setHidden(layout, opts))),
    onReset: () => run('resetting the hub', () => saveLayout($, () => EMPTY_LAYOUT)),
  }
}

// A row press puts that pane in the panel: the catalog is this mod's own pane; any other is its
// mod's to open, asked through `modz.open`. The hub steps aside once the mod says its pane is
// shown, so a mod that does not answer leaves the hub where it is rather than an empty panel.
async function openPane($: EngineInterface, pane: string): Promise<void> {
  if (pane === MODS_PANE) {
    await show($, MODS_PANE)

    return
  }
  answered = null
  await $.state.set(OPEN, { pane, at: Date.now() })
  // The mod answered inside this write, where the engine hands the hub's own hook no event (`.catch`, re-entry).
  if (answered !== null) await stepAside($, answered)
}

// The pane a mod said it opened while the hub's own write was still running; read once that write settles.
let answered: string | null = null

// A mod's pane holds the panel: the hub's panes close and every other mod's pane follows (kit/stage.ts).
async function stepAside($: EngineInterface, pane: string): Promise<void> {
  answered = null
  await $.state.set(STAGE, { pane, at: Date.now() })
  await closeQuietly($, PANE)
  await closeQuietly($, MODS_PANE)
}

// An empty catalog is one that could not be read: the hub says so rather than "0 mods on".
function metaOf(market: Market): string {
  if (market.mods.length === 0) return hubWords().unreadable
  const on = market.mods.filter(mod => mod.isEnabled === true).length

  return hubWords().modsOn(on)
}

async function textOf($: EngineInterface, path: string): Promise<string | undefined> {
  return (await $.fs.exists(path)) ? String(await $.fs.read(path)) : undefined
}

// Turns on Claude Code's own auto-update for the marketplace this copy was installed from (auto-update.ts).
async function keepUpdated($: EngineInterface): Promise<void> {
  const install = installOf($.plugin.root)
  if (install === undefined) return
  const configDir = (await $.env.get('CLAUDE_CONFIG_DIR')) ?? `${await $.env.get('HOME')}/.claude`
  const settingsPath = `${configDir}/settings.json`
  const next = autoUpdateSettings({
    market: install.market,
    settingsText: await textOf($, settingsPath),
    knownText: await textOf($, `${install.pluginsDir}/known_marketplaces.json`),
  })
  if (next === undefined) return
  await $.fs.write(settingsPath, next)
  $.ui.log(`modz: auto-update turned on for the ${install.market} marketplace`, { to: 'debug' })
}

type On = Parameters<Register>[0]
type Options = Parameters<Register>[1]

function hubHooks(on: On, options: Options): void {
  on('session.start', async ($, e, next) => {
    // The interface language (kit/lang.ts). Spelled out: the engine admits an env read by a literal name only.
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    const started = await next(e)
    const saved = layoutOf(await $.store.get(LAYOUT_KEY).catch(() => undefined))
    await update($, layoutAtom, () => saved)
    await $.state.set(ON, true)
    await $.command.register({ name: 'modz', description: hubWords().command })
    if (options.openOnStart !== false) {
      hubDrawings.reset()
      await $.ui.open({ id: PANE, title: TITLE })
    }
    if (options.keepUpdated !== false) {
      void keepUpdated($).catch(cause => $.ui.log(`modz: auto-update could not be turned on: ${String(cause)}`, { to: 'debug' }))
    }

    return started
  })

  // Every mod reports its line under its own `hub` key; the hub keeps the latest of each.
  on('state.set', { key: 'hub' }, async ($, e, next) => {
    const done = await next(e)
    const card = cardOf(e.value)
    // Widened from the declared reporters: the hub also hears a mod it does not list, and never itself.
    const from: string = e.plugin
    if (card === null || from === 'modz') return done
    // An unchanged card is not kept again: the write would redraw the hub for nothing.
    if (isSame((await read($, cardsAtom))[from], card)) return done
    await update($, cardsAtom, cards => ({ ...cards, [from]: card }))

    return done
  }).catch(($, e, next) => next(e))

  // A mod's "MODZ" button: the hub comes forward, and opens again if it was closed. Any mod may ask.
  // The hub comes back once the mod's write has settled: inside it, the mod's own hooks hear nothing (re-entry),
  // so its pane would miss the stage and stay behind as a tab.
  on('state.set', { key: 'home' }, async ($, e, next) => {
    const done = await next(e)
    const from: string = e.plugin
    if (from !== 'modz') {
      $.clock.after(0, () => void openHub($).catch(cause => $.ui.log(`modz: the hub could not come back: ${String(cause)}`, { to: 'debug' })))
    }

    return done
  }).catch(($, e, next) => next(e))

  // A mod's pane is open: it takes the panel. Said inside the hub's own open request, the engine runs only the
  // `.catch` (re-entry, where `$` is closed), which notes the pane for `openPane` to act on once its write settles.
  on('state.set', { key: 'shown' }, async ($, e, next) => {
    const done = await next(e)
    const from: string = e.plugin
    const pane = paneOf(e.value)
    if (from !== 'modz' && pane !== null) await stepAside($, pane)

    return done
  }).catch(($, e, next) => {
    const from: string = e.plugin
    if (next.error.kind === 're-entry' && from !== 'modz') answered = paneOf(e.value) ?? answered

    return next(e)
  })

  on('command.run', { command: 'modz' }, async $ => {
    await openHub($)

    return { text: hubWords().opened }
  })
}

function paneHooks(on: On): void {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const market = await marketOf($)
    const theme = await themeNow($)
    const columns = e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS
    const [cards, layout, isEditing] = [await read($, cardsAtom), await read($, layoutAtom), await read($, editingAtom)]
    const presence = presenceOf(market)
    const rows = rowsOf(cards, presence, layout)
    const view = { rows, hidden: hiddenRowsOf(cards, presence, layout), focus: focusOf(rows), meta: metaOf(market), isEditing }

    return pinned(e, hubTree(ui, { ...view, surface: e.surface, columns, theme, actions: actionsOf($), stable: hubDrawings }))
  })

  on('ui.render', { component: 'Pane', requestId: MODS_PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const columns = e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS

    const onHome = () => void openHub($).catch(cause => $.ui.log(`modz: the hub could not be opened: ${String(cause)}`, { to: 'debug' }))

    return pinned(e, modzTree(ui, { market: await marketOf($), surface: e.surface, columns, theme: await themeNow($), onHome, stable: catalogDrawings }))
  })
}

// The desktop only: the terminal keeps its footer as the engine draws it, and /modz.
function footerHooks(on: On): void {
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    if (e.surface !== 'desktop') return next(e)
    const onPress = () => void toggleHub($).catch(cause => $.ui.log(`modz: the footer toggle failed: ${String(cause)}`, { to: 'debug' }))

    return pinned(e, footerTree($.ui.resolve(e), { modes: e.props.modes, onPress }))
  })
}

export const register: Register = (on, options) => {
  hubHooks(on, options)
  paneHooks(on)
  footerHooks(on)
}
