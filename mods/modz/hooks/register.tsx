// MODZ: the one pane that opens by itself (DESIGN.md §9). It lists every mod's pane with the
// mod's own live line, and asks the owning mod to open its pane when a row is pressed. The hub,
// its catalog ("Modlar") and every mod's pane take turns in one panel (kit/stage.ts): whichever
// opens last is the one shown, the rest close, so they never pile up as tabs.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { HubCard } from '../types'
import { wireCards } from './cards'
import type { Drawing } from './draw'
import { footerTree } from './footer'
import { helpText } from './guide'
import { HOLD_PANE, MODS_PANE, modsTitle } from './hub'
import { hubTree } from './hub-pane'
import type { HubActions } from './hub-pane'
import { keepMarket, keepUpdated, marketOf, marketSoon } from './market'
import type { Disk } from './market'
import { wireLanguageKeeper } from './language-keeper'
import { EMPTY_LAYOUT, layoutOf, moveUp, setHidden } from './layout'
import type { HubLayout } from './layout'
import { setLang } from './kit/lang'
import { HUB_PANE, paneOf } from './kit/stage'
import { pinned } from './kit/pin'
import { stableDrawings } from './kit/stable'
import { modzTree } from './pane'
import { noteAnswer, openPane, stepAside, toggleHub } from './swap'
import type { Swap } from './swap'
import { themeOf } from './theme'
import type { Theme } from './theme'
import { plainViewOf, viewOf } from './view'
import type { Frame, Parts } from './view'
import { catalogWords, hubWords } from './words'

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

// What swap.ts moves the panel through; built here, where `$` is.
const swapOf = ($: EngineInterface): Swap => ({
  panes: () => $.ui.panes(),
  show: (pane, isFocused) => show($, pane, isFocused),
  hold: () => $.ui.open({ id: HOLD_PANE, title: TITLE }),
  close: id => closeQuietly($, id),
  stage: { read: async () => (await $.state.get(STAGE)).value, write: pane => $.state.set(STAGE, { pane, at: Date.now() }) },
  ask: pane => $.state.set(OPEN, { pane, at: Date.now() }).catch(cause => $.ui.log(`modz: asking for ${pane} failed: ${String(cause)}`, { to: 'debug' })),
  unanswered: { read: () => read($, unansweredAtom), write: pane => update($, unansweredAtom, () => pane) },
  later: (ms, work) => $.clock.after(ms, work),
  log: text => $.ui.log(`modz: ${text}`, { to: 'debug' }),
})

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
    onOpen: pane => run(`opening ${pane}`, () => openPane(swapOf($), pane)),
    onEdit: isEditing => run('customizing', () => update($, editingAtom, () => isEditing)),
    onMove: opts => run('moving a row', () => saveLayout($, layout => moveUp(layout, opts))),
    onHide: opts => run('hiding a row', () => saveLayout($, layout => setHidden(layout, opts))),
    onReset: () => run('resetting the hub', () => saveLayout($, () => EMPTY_LAYOUT)),
  }
}

type Site = { surface: string; columns: number }

const frameOf = async ($: EngineInterface, site: Site): Promise<Frame> => ({ ...site, theme: await themeNow($), actions: actionsOf($), stable: hubDrawings })

// What the hub is drawn from (view.ts), read where `$` is. A clock that cannot be read costs the running times
// their exactness, never the hub.
async function partsOf($: EngineInterface): Promise<Parts> {
  const [cards, layout, isEditing] = [await read($, cardsAtom), await read($, layoutAtom), await read($, editingAtom)]

  return { market: await marketSoon(diskOf($)), cards, layout, isEditing, unanswered: await read($, unansweredAtom), now: await $.clock.now().catch(() => Date.now()) }
}

type On = Parameters<Register>[0]
type Options = Parameters<Register>[1]

// The hub's life: up when the session starts, and back when a desktop returns.
function startHooks(on: On, options: Options): void {
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
}

// Who holds the one panel: a mod's way home, a mod's pane taking it, and /modz.
function stageHooks(on: On): void {
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
    if (from !== 'modz' && pane !== null) await stepAside(swapOf($), pane)

    return done
  }).catch(($, e, next) => {
    const from: string = e.plugin
    if (next.error.kind === 're-entry' && from !== 'modz') noteAnswer(paneOf(e.value))

    return next(e)
  })

  // `/modz help`: the one index of every installed mod's commands and options, as text; `/modz` opens the hub.
  on('command.run', { command: 'modz' }, async ($, e) => {
    if (e.args.trim().toLowerCase() === 'help') return { text: helpText(await marketOf(diskOf($)), await $.command.list().catch(() => [])) }
    await openHub($)

    return { text: hubWords().opened }
  })
}

function paneHooks(on: On): void {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const columns = e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS

    return pinned(e, hubTree($.ui.resolve(e), viewOf(await partsOf($), await frameOf($, { surface: e.surface, columns }))))
  }).catch(async ($, e, next) => {
    // The drawing threw or ran out of time. The engine would draw nothing and drop every row's press, so the tree
    // the desktop still shows would go dead: the plain rows keep the hub, and the presses, alive.
    if (next.error.kind === 're-entry') return next(e)
    $.ui.log(`modz: the hub fell back to its plain rows: ${next.error.message ?? next.error.kind}`, { to: 'debug' })
    const columns = e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS

    return pinned(e, hubTree($.ui.resolve(e), plainViewOf(await partsOf($), await frameOf($, { surface: e.surface, columns }))))
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
    const commands = await $.command.list().catch(() => [])

    return pinned(e, modzTree(ui, { market, commands, surface: e.surface, columns, theme: await themeNow($), onHome, onCopy: (text, press) => copy($, text, press), stable: catalogDrawings }))
  })
}

// An install line onto the clipboard of the surface that was pressed; a toast says whether it took.
async function copy($: EngineInterface, text: string, press: unknown): Promise<void> {
  const surface = (press as { surface?: 'desktop' | 'terminal' } | undefined)?.surface
  const words = catalogWords()
  try {
    $.ui.toast((await $.ui.copy(surface === undefined ? { text } : { text, surface })).isCopied ? words.copied : words.notCopied)
  } catch (cause) {
    $.ui.log(`modz: the install line could not be copied: ${String(cause)}`, { to: 'debug' })
  }
}

// The desktop only: the terminal keeps its footer as the engine draws it, and /modz.
function footerHooks(on: On): void {
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    if (e.surface !== 'desktop') return next(e)
    const onPress = () => void toggleHub(swapOf($)).catch(cause => $.ui.log(`modz: the footer toggle failed: ${String(cause)}`, { to: 'debug' }))

    return pinned(e, footerTree($.ui.resolve(e), { modes: e.props.modes, onPress }))
  })
}

export const register: Register = (on, options) => {
  startHooks(on, options)
  stageHooks(on)
  wireCards(on)
  paneHooks(on)
  footerHooks(on)
  wireLanguageKeeper(on, options)
}
