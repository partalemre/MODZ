// MODZ: the one pane that opens by itself (DESIGN.md §9). It lists every mod's pane with the
// mod's own live line, and asks the owning mod to open its pane when a row is pressed. The hub,
// its catalog ("Modlar") and every mod's pane take turns in one panel (kit/stage.ts): whichever
// opens last is the one shown, the rest close, so they never pile up as tabs.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { HubCard } from '../types'
import type { Drawing } from './draw'
import type { Market } from './catalog'
import { footerTree, isHubShown } from './footer'
import { cardOf, focusOf, hiddenRowsOf, HOLD_PANE, MODS_PANE, modsTitle, presenceOf, rowsOf, withUnanswered } from './hub'
import { hubTree } from './hub-pane'
import type { HubActions, HubView } from './hub-pane'
import { keepMarket, keepUpdated, marketOf, marketSoon } from './market'
import type { Disk } from './market'
import { wireLanguageKeeper } from './language-keeper'
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
// The pane of a row whose mod did not put it up when asked (openPane's watchdog); the row says so until pressed again.
const unansweredAtom = atom({ plugin: 'modz', key: 'unanswered' } as const, null as string | null)
const ON = { plugin: 'modz', key: 'isOn' } as const
const LAYOUT_KEY = 'layout'
const DEFAULT_COLUMNS = 80
// How long a mod has to put its pane up after a row press before the hub says it did not answer.
const ANSWER_MS = 1_500

async function themeNow($: EngineInterface): Promise<Theme> {
  const rows = await $.config.list().catch(() => [])

  return themeOf(rows.find(row => row.key === 'theme')?.value)
}

// What market.ts reads the catalog and the settings through; built here, where `$` is. Each env name is spelled
// out, as the engine admits an env read by a literal name only.
const diskOf = ($: EngineInterface): Disk => ({
  root: $.plugin.root,
  env: { home: () => $.env.get('HOME'), userProfile: () => $.env.get('USERPROFILE'), configDir: () => $.env.get('CLAUDE_CONFIG_DIR') },
  cwd: () => $.session.cwd(),
  settings: () => $.settings.read(),
  realPath: async path => (await $.fs.stat(path, { resolve: true })).realPath,
  read: path => $.fs.read(path),
  exists: path => $.fs.exists(path),
  write: (path, text) => $.fs.write(path, text),
  log: text => $.ui.log(text, { to: 'debug' }),
})

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
// mod's to open, asked through `modz.open`. The hub steps aside once the mod's pane is up, so a mod that does not
// answer leaves the hub where it is rather than an empty panel.
async function openPane($: EngineInterface, pane: string): Promise<void> {
  if (pane === MODS_PANE) {
    await show($, MODS_PANE)

    return
  }
  const ask = { pane }
  asked = ask
  if ((await read($, unansweredAtom)) !== null) await update($, unansweredAtom, () => null)
  // A pane already open behind a tab does not come forward on another open: the asked one opens anew, last.
  await $.state.set(STAGE, { pane: PANE, at: Date.now() })
  // A click into a pane gives it the keyboard, and the engine shows no new pane over the one a person holds, focus
  // or no focus. Closing the held pane shows the last one open: the mod's if it answered, else this stand-in.
  const isHeld = (await $.ui.panes()).some(up => up.id === PANE && up.isFocused)
  if (isHeld) await $.ui.open({ id: HOLD_PANE, title: TITLE })
  answered = null
  await $.state.set(OPEN, { pane, at: Date.now() }).catch(cause => $.ui.log(`modz: asking for ${pane} failed: ${String(cause)}`, { to: 'debug' }))
  if (isHeld) await closeQuietly($, PANE)
  // The mod answered inside this write, where the hub's own hooks hear nothing: engines up to 2.1.296 ran its
  // `.catch` (re-entry), 2.1.309 skips that too. So the panel itself tells: a mod pane that took it leaves the hub
  // no longer shown.
  if (answered !== null || !isHubShown(await $.ui.panes())) await stepAside($, answered ?? pane)
  else {
    if (isHeld) await show($, PANE)
    $.clock.after(ANSWER_MS, () => void watchAnswer($, ask).catch(cause => $.ui.log(`modz: the watch on ${pane} failed: ${String(cause)}`, { to: 'debug' })))
  }
  if (isHeld) await closeQuietly($, HOLD_PANE)
}

// The pane a mod said it opened while the hub's own write was still running; read once that write settles.
let answered: string | null = null
// The row pressed last: a later press takes the watchdog over.
let asked: { pane: string } | null = null

// The watchdog. Most mods answer inside the ask itself; one that answers a moment later takes the stage through its
// `shown`. After ANSWER_MS with the hub still on stage, nobody did: the hub stays (and comes back if it went) and
// the row says its pane did not answer, so a press never just vanishes.
async function watchAnswer($: EngineInterface, ask: { pane: string }): Promise<void> {
  if (asked !== ask || paneOf((await $.state.get(STAGE)).value) !== PANE) return
  await update($, unansweredAtom, () => ask.pane)
  if (!isHubShown(await $.ui.panes())) await show($, PANE, false)
}

// A mod's pane holds the panel: the hub's panes close and every other mod's pane follows (kit/stage.ts).
async function stepAside($: EngineInterface, pane: string): Promise<void> {
  answered = null
  await $.state.set(STAGE, { pane, at: Date.now() })
  await closeQuietly($, PANE)
  await closeQuietly($, MODS_PANE)
  if ((await read($, unansweredAtom)) !== null) await update($, unansweredAtom, () => null)
}

// An empty catalog is one that could not be read: the hub says so rather than "0 mods on".
function metaOf(market: Market): string {
  if (market.mods.length === 0) return hubWords().unreadable
  const on = market.mods.filter(mod => mod.isEnabled === true).length

  return hubWords().modsOn(on)
}

type Site = { surface: string; columns: number }

// What the hub draws: the rows the catalog and the mods' cards give, in the person's arrangement.
async function hubView($: EngineInterface, site: Site): Promise<HubView> {
  const market = await marketSoon(diskOf($))
  const [cards, layout, isEditing] = [await read($, cardsAtom), await read($, layoutAtom), await read($, editingAtom)]
  const presence = presenceOf(market)
  const rows = withUnanswered(rowsOf(cards, presence, layout), await read($, unansweredAtom), hubWords().noAnswer)

  return { rows, hidden: hiddenRowsOf(cards, presence, layout), focus: focusOf(rows), meta: metaOf(market), isEditing, ...site, theme: await themeNow($), actions: actionsOf($), stable: hubDrawings }
}

// The hub when its drawing threw: the same rows under the same keys, in the catalog's own order and as plain
// elements, so every row stays pressable (its press handle goes by its key) and the way to each pane is kept.
async function plainHubView($: EngineInterface, site: Site): Promise<HubView> {
  const rows = rowsOf(await read($, cardsAtom), presenceOf(await marketSoon(diskOf($))))

  return { rows, hidden: [], focus: null, meta: hubWords().plain, isEditing: false, ...site, surface: 'plain', theme: 'auto', actions: actionsOf($), stable: hubDrawings }
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
      void keepUpdated(diskOf($)).catch(cause => $.ui.log(`modz: auto-update could not be turned on: ${String(cause)}`, { to: 'debug' }))
    }

    return started
  })

  // A desktop that comes back (the app restarted, a session resumed) gets no session.start, and its panes are gone:
  // the hub comes back too, without the keyboard, unless one of its own panes is already up. A client that only left
  // and came back (the same session, the panes kept) finds a mod's pane still holding the panel: that stays.
  on('session.attach', async ($, e, next) => {
    const done = await next(e)
    const isDesktop = e.surface === 'desktop'
    const staged = paneOf((await $.state.get(STAGE)).value)
    const isModStaged = staged !== null && staged !== PANE && staged !== MODS_PANE
    if (isDesktop && options.openOnStart !== false && !isModStaged && (await $.ui.panes()).length === 0) await show($, PANE, false)
    // A desktop that comes back may still show a tree from before: drawn again, its rows carry presses this engine holds.
    if (isDesktop) $.ui.invalidate('ui.render')

    return done
  }).catch(($, e, next) => next(e))

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
    const columns = e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS

    return pinned(e, hubTree($.ui.resolve(e), await hubView($, { surface: e.surface, columns })))
  }).catch(async ($, e, next) => {
    // The drawing threw or ran out of time. The engine would draw nothing and drop every row's press, so the tree
    // the desktop still shows would go dead: the plain rows keep the hub, and the presses, alive.
    if (next.error.kind === 're-entry') return next(e)
    $.ui.log(`modz: the hub fell back to its plain rows: ${next.error.message ?? next.error.kind}`, { to: 'debug' })
    const columns = e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS

    return pinned(e, hubTree($.ui.resolve(e), await plainHubView($, { surface: e.surface, columns })))
  })

  on('ui.render', { component: 'Pane', requestId: HOLD_PANE }, async ($, e) => {
    const { Box } = $.ui.resolve(e)

    return <Box />
  })

  on('ui.render', { component: 'Pane', requestId: MODS_PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const columns = e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS

    const onHome = () => void openHub($).catch(cause => $.ui.log(`modz: the hub could not be opened: ${String(cause)}`, { to: 'debug' }))

    const market = await marketOf(diskOf($))
    keepMarket(market)

    return pinned(e, modzTree(ui, { market, surface: e.surface, columns, theme: await themeNow($), onHome, stable: catalogDrawings }))
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
  wireLanguageKeeper(on, options)
}
