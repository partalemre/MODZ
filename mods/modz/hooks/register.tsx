// MODZ: the one pane that opens by itself (DESIGN.md §9). It lists every mod's pane with the
// mod's own live line, and asks the owning mod to open its pane when a row is pressed; the
// catalog of every mod ("Modlar") is a second pane of this mod, a tab of its own.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { HubCard } from '../types'
import { linkCheck, loadCatalog, marketRoot } from './catalog'
import type { Market } from './catalog'
import { cardOf, focusOf, hiddenRowsOf, MODS_PANE, modsTitle, presenceOf, rowsOf } from './hub'
import { hubTree } from './hub-pane'
import type { HubActions } from './hub-pane'
import { EMPTY_LAYOUT, layoutOf, moveUp, setHidden } from './layout'
import type { HubLayout } from './layout'
import { setLang } from './kit/lang'
import { isSame } from './kit/same'
import { pinned } from './kit/pin'
import { modzTree } from './pane'
import type { Theme } from './theme'
import { hubWords } from './words'

const PANE = 'modz'
const TITLE = 'MODZ'

const OPEN = { plugin: 'modz', key: 'open' } as const
const cardsAtom = atom({ plugin: 'modz', key: 'cards' } as const, {} as Record<string, HubCard>)
// The person's arrangement, mirrored from `$.store` (kept across sessions) so a change redraws the hub.
const layoutAtom = atom({ plugin: 'modz', key: 'layout' } as const, EMPTY_LAYOUT)
const editingAtom = atom({ plugin: 'modz', key: 'isEditing' } as const, false)
const ON = { plugin: 'modz', key: 'isOn' } as const
const LAYOUT_KEY = 'layout'
const DEFAULT_COLUMNS = 80

// Claude Code's theme names say light or dark; anything else follows the system in the Svg.
function themeOf(value: unknown): Theme {
  const name = String(value ?? '').toLowerCase()
  if (name.includes('light')) return 'light'

  return name.includes('dark') ? 'dark' : 'auto'
}

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

const openHub = ($: EngineInterface) => $.ui.open({ id: PANE, title: TITLE, focus: true })

async function saveLayout($: EngineInterface, change: (layout: HubLayout) => HubLayout): Promise<void> {
  const next = change(await read($, layoutAtom))
  await update($, layoutAtom, () => next)
  await $.store.set(LAYOUT_KEY, next)
}

// Each press of the hub, written where it is kept; a failed write is logged, never thrown into the drawing.
function actionsOf($: EngineInterface): HubActions {
  const run = (what: string, work: () => Promise<unknown>) =>
    void work().catch(cause => $.ui.log(`modz: ${what} failed: ${String(cause)}`, { to: 'debug' }))

  return {
    onOpen: pane => run(`opening ${pane}`, () => openPane($, pane)),
    onEdit: isEditing => run('customizing', () => update($, editingAtom, () => isEditing)),
    onMove: opts => run('moving a row', () => saveLayout($, layout => moveUp(layout, opts))),
    onHide: opts => run('hiding a row', () => saveLayout($, layout => setHidden(layout, opts))),
    onReset: () => run('resetting the hub', () => saveLayout($, () => EMPTY_LAYOUT)),
  }
}

// A pane press opens a tab and leaves the hub open where it is: the catalog is this mod's own
// pane; any other is its mod's to open, asked through `modz.open`. Each opens with `focus`: the
// surface gives that pane the keyboard, and so the front, while the composer is empty and idle;
// otherwise it waits as a tab beside the hub.
async function openPane($: EngineInterface, pane: string): Promise<void> {
  if (pane === MODS_PANE) {
    await $.ui.open({ id: MODS_PANE, title: modsTitle(), focus: true })

    return
  }
  await $.state.set(OPEN, { pane, at: Date.now() })
}

// An empty catalog is one that could not be read: the hub says so rather than "0 mods on".
function metaOf(market: Market): string {
  if (market.mods.length === 0) return hubWords().unreadable
  const on = market.mods.filter(mod => mod.isEnabled === true).length

  return hubWords().modsOn(on)
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
    if (options.openOnStart !== false) await $.ui.open({ id: PANE, title: TITLE })

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
  on('state.set', { key: 'home' }, async ($, e, next) => {
    const done = await next(e)
    const from: string = e.plugin
    if (from !== 'modz') await openHub($)

    return done
  }).catch(($, e, next) => next(e))

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

    return pinned(e, hubTree(ui, { ...view, surface: e.surface, columns, theme, actions: actionsOf($) }))
  })

  on('ui.render', { component: 'Pane', requestId: MODS_PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const columns = e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS

    const onHome = () => void openHub($).catch(cause => $.ui.log(`modz: the hub could not be opened: ${String(cause)}`, { to: 'debug' }))

    return pinned(e, modzTree(ui, { market: await marketOf($), surface: e.surface, columns, theme: await themeNow($), onHome }))
  })
}

export const register: Register = (on, options) => {
  hubHooks(on, options)
  paneHooks(on)
}
