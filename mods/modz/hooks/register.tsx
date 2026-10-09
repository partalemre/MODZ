// MODZ: the one pane that opens by itself (DESIGN.md §9). It lists every mod's pane with the
// mod's own live line, and asks the owning mod to open its pane when a row is pressed; the
// catalog of every mod ("Modlar") is a second pane of this mod, a tab of its own.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { HubCard } from '../types'
import { linkCheck, loadCatalog, marketRoot } from './catalog'
import type { Market } from './catalog'
import { cardOf, focusOf, MODS_PANE, MODS_TITLE, rowsOf } from './hub'
import type { Presence } from './hub'
import { hubTree } from './hub-pane'
import { settleFocus } from './kit/focus'
import { isSame } from './kit/same'
import { stamped } from './kit/stamp'
import { modzTree } from './pane'
import type { Theme } from './theme'

const PANE = 'modz'
const TITLE = 'MODZ'

const OPEN = { plugin: 'modz', key: 'open' } as const
const cardsAtom = atom({ plugin: 'modz', key: 'cards' } as const, {} as Record<string, HubCard>)
const DEFAULT_COLUMNS = 80

// Claude Code's theme names say light or dark; anything else follows the system in the Svg.
function themeOf(value: unknown): Theme {
  const name = String(value ?? '').toLowerCase()
  if (name.includes('light')) return 'light'

  return name.includes('dark') ? 'dark' : 'auto'
}

async function themeNow($: EngineInterface): Promise<Theme> {
  return themeOf((await $.config.list()).find(row => row.key === 'theme')?.value)
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

async function marketOf($: EngineInterface): Promise<Market> {
  const stat = await $.fs.stat($.plugin.root, { resolve: true }).catch(() => undefined)
  const root = marketRoot(stat?.realPath ?? $.plugin.root)

  return loadCatalog({ read: path => $.fs.read(path), root, enabledPlugins: await enabledPlugins($), hasLink: await skillLinks($) })
}

// A pane press opens a tab and leaves the hub open where it is: the catalog is this mod's own
// pane; any other is its mod's to open, asked through `modz.open`. Each opens with `focus`: the
// surface gives that pane the keyboard, and so the front, while the composer is empty and idle;
// otherwise it waits as a tab beside the hub.
async function openPane($: EngineInterface, pane: string): Promise<void> {
  if (pane === MODS_PANE) {
    await $.ui.open({ id: MODS_PANE, title: MODS_TITLE, focus: true })

    return
  }
  await $.state.set(OPEN, { pane, at: Date.now() })
}

// An empty catalog is one that could not be read: the hub says so rather than "0 mod açık".
function metaOf(market: Market): string {
  if (market.mods.length === 0) return 'katalog okunamadı'
  const on = market.mods.filter(mod => mod.isEnabled !== false).length

  return `${on} mod açık`
}

function presenceOf(market: Market): (mod: string) => Presence {
  const listed = new Map(market.mods.map(mod => [mod.name, mod.isEnabled]))

  return name => {
    if (!listed.has(name)) return 'unlisted'

    return listed.get(name) === false ? 'off' : 'listed'
  }
}

type On = Parameters<Register>[0]
type Options = Parameters<Register>[1]

function hubHooks(on: On, options: Options): void {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({ name: 'modz', description: 'MODZ ana panelini açar: ajanlar, dosyalar, plan, testler ve tüm modlar' })
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

  // A desktop that comes back keeps showing the tree it had; the engine released that tree's buttons when it
  // left, so its first click would be refused. Drawing again on attach hands it live buttons.
  on('session.attach', async ($, e, next) => {
    const attached = await next(e)
    $.ui.invalidate('ui.render')

    return attached
  })

  on('command.run', { command: 'modz' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE, focus: true })

    return { text: 'MODZ paneli açıldı.' }
  })
}

function paneHooks(on: On): void {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    await settleFocus(e, ms => $.clock.sleep(ms))
    const ui = $.ui.resolve(e)
    const market = await marketOf($)
    const theme = await themeNow($)
    const columns = e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS
    const rows = rowsOf(await read($, cardsAtom), presenceOf(market))
    const onOpen = (pane: string) => void openPane($, pane).catch(cause => $.ui.log(`modz: ${pane} could not be opened: ${String(cause)}`, { to: 'debug' }))

    return stamped(ui, hubTree(ui, { rows, focus: focusOf(rows), meta: metaOf(market), surface: e.surface, columns, theme, onOpen }))
  })

  on('ui.render', { component: 'Pane', requestId: MODS_PANE }, async ($, e) => {
    await settleFocus(e, ms => $.clock.sleep(ms))
    const ui = $.ui.resolve(e)
    const columns = e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS

    return stamped(ui, modzTree(ui, { market: await marketOf($), surface: e.surface, columns, theme: await themeNow($) }))
  })
}

export const register: Register = (on, options) => {
  hubHooks(on, options)
  paneHooks(on)
}
