// MODZ: the one pane that opens by itself (DESIGN.md §9). It lists every mod's pane with the
// mod's own live line, and asks the owning mod to open its pane when a row is pressed. The hub,
// its catalog ("Modlar") and every mod's pane take turns in one panel (kit/stage.ts): whichever
// opens last is the one shown, the rest close, so they never pile up as tabs.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { HubCard, Updates } from '../types'
import { wireCards } from './cards'
import { footerTree } from './footer'
import { checkFacts, checkText } from './check'
import { helpText } from './guide'
import { HOLD_PANE, MODS_PANE, SIDE_PANES } from './hub'
import { hubTree } from './hub-pane'
import type { HubActions } from './hub-pane'
import { keepMarket, keepUpdated, marketOf, marketSoon } from './market'
import { wireLanguageKeeper } from './language-keeper'
import { EMPTY_LAYOUT, layoutOf, moveUp, setHidden } from './layout'
import type { HubLayout } from './layout'
import { setLang } from './kit/lang'
import { HUB_PANE, paneOf } from './kit/stage'
import { pinned } from './kit/pin'
import { catalogDrawings, closeQuietly, copy, hubDrawings, hubKept, openHub, show } from './own-panes'
import { modzTree } from './pane'
import { wireFilesPage } from './pages/files'
import { HUB_DRAWN, pageTree } from './pages/index'
import { wirePlainRows } from './plain-rows'
import { noteAnswer, openPane, stepAside, toggleHub } from './swap'
import type { Swap } from './swap'
import { themeOf } from './theme'
import { diskOf } from './disk'
import { fillSideRows, refreshSide, wireUpkeep } from './upkeep'
import type { Theme } from './theme'
import { plainViewOf, viewOf } from './view'
import type { Frame, Parts } from './view'
import { catalogWords, hubWords } from './words'

const PANE = HUB_PANE
const TITLE = 'modz'

const OPEN = { plugin: 'modz', key: 'open' } as const
const STAGE = { plugin: 'modz', key: 'stage' } as const
const OWN_PANES: readonly string[] = [PANE, MODS_PANE, ...SIDE_PANES]
const cardsAtom = atom({ plugin: 'modz', key: 'cards' } as const, {} as Record<string, HubCard>)
// The person's arrangement, mirrored from `$.store` (kept across sessions) so a change redraws the hub.
const layoutAtom = atom({ plugin: 'modz', key: 'layout' } as const, EMPTY_LAYOUT)
const editingAtom = atom({ plugin: 'modz', key: 'isEditing' } as const, false)
const beatAtom = atom({ plugin: 'modz', key: 'beat' } as const, 0)
// The pane of a row whose mod did not put it up when asked (openPane's watchdog); the row says so until pressed again.
const updatesAtom = atom({ plugin: 'modz', key: 'updates' } as const, null as Updates | null)
const unansweredAtom = atom({ plugin: 'modz', key: 'unanswered' } as const, null as string | null)
const ON = { plugin: 'modz', key: 'isOn' } as const
const DRAWN = { plugin: 'modz', key: 'drawn' } as const
const LAYOUT_KEY = 'layout'
const DEFAULT_COLUMNS = 80

// The drawings follow the app they are drawn in (light or dark, as the Svg's own media query sees it). Claude
// Code's `theme` setting is the terminal's: unset it reads `dark`, which pinned the pane dark in a light app.
// Only `MODZ_THEME` pins a palette.
async function themeNow($: EngineInterface): Promise<Theme> {
  return themeOf(await $.env.get('MODZ_THEME').catch(() => undefined))
}


// What swap.ts moves the panel through; built here, where `$` is.
const swapOf = ($: EngineInterface): Swap => ({
  panes: () => $.ui.panes(),
  // A side pane reads what it shows anew each time it opens.
  show: (pane, isFocused) => show($, pane, isFocused).then(() => refreshSide($, pane)),
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

// A page the hub draws itself (pages.tsx): the stage names it and the one pane comes up; the hub's other panes go,
// and a mod pane still open closes on the stage write (kit/stage.ts), so the panel never holds two.
async function showPage($: EngineInterface, page: string): Promise<void> {
  hubKept.isHeld = true
  await $.state.set(STAGE, { pane: page, at: Date.now() })
  await $.ui.open({ id: PANE, title: TITLE, focus: true })
  const up = new Set((await $.ui.panes().catch(() => [])).map(each => each.id))
  for (const own of OWN_PANES) if (own !== PANE && up.has(own)) await closeQuietly($, own)
}

// A mod with no pane answers on its card above the prompt: the press says where, and nothing is asked to open.
async function openOrPoint($: EngineInterface, pane: string): Promise<void> {
  const [mod, card] = Object.entries(await read($, cardsAtom)).find(([, each]) => each.pane === pane && each.isBandOnly === true) ?? []
  if (HUB_DRAWN.includes(pane)) return showPage($, pane)
  if (card === undefined) return openPane(swapOf($), pane)
  $.ui.toast(hubWords().inBand(card.title ?? String(mod)))
}

// Each press of the hub, written where it is kept; a failed write is logged, never thrown into the drawing.
// The press waits for the work, so the panel has swapped by the time it settles.
function actionsOf($: EngineInterface): HubActions {
  const run = (what: string, work: () => Promise<unknown>) =>
    work().catch(cause => $.ui.log(`modz: ${what} failed: ${String(cause)}`, { to: 'debug' }))

  return {
    onOpen: pane => run(`opening ${pane}`, () => openOrPoint($, pane)),
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
  // Read so the cards' beat (cards.ts) redraws the hub alone.
  await read($, beatAtom)
  const [cards, layout, isEditing] = [await read($, cardsAtom), await read($, layoutAtom), await read($, editingAtom)]

  // hud-pro says when its Usage pane hosts the other meter mods; nobody saying so means nobody hosts.
  const host = await $.state.get({ plugin: 'hud-pro', key: 'host' }).catch(() => ({ value: false }))

  return { market: await marketSoon(diskOf($)), cards, layout, isEditing, unanswered: await read($, unansweredAtom), now: await $.clock.now().catch(() => Date.now()), isUsageHosting: host.value === true, hasUpdate: (await read($, updatesAtom))?.hasNew === true }
}

type On = Parameters<Register>[0]
type Options = Parameters<Register>[1]

// The hub's life: closed until asked for (up at the start with `openOnStart`), and back when a desktop returns.
function startHooks(on: On, options: Options): void {
  on('session.start', async ($, e, next) => {
    // The interface language (kit/lang.ts). Spelled out: the engine admits an env read by a literal name only.
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    const started = await next(e)
    const saved = layoutOf(await $.store.get(LAYOUT_KEY).catch(() => undefined))
    await update($, layoutAtom, () => saved)
    await $.state.set(ON, true)
    // The pages this hub draws in its own pane: their mods then ask for them here rather than open a pane.
    await $.state.set(DRAWN, HUB_DRAWN)
    await $.command.register({ name: 'modz', description: hubWords().command })
    fillSideRows($)
    if (options.openOnStart === true) {
      hubDrawings.reset()
      hubKept.isHeld = true
      await $.ui.open({ id: PANE, title: TITLE })
    }
    if (options.keepUpdated === true) {
      void keepUpdated(diskOf($)).catch(cause => $.ui.log(`modz: auto-update could not be turned on: ${String(cause)}`, { to: 'debug' }))
    }

    return started
  })

  // A desktop that comes back (the app restarted, a session resumed) gets no session.start, and its panes are gone:
  // with `openOnStart` the hub comes back too, without the keyboard, unless one of its own panes is already up (a hub
  // the person opened comes back through its kept tab, paneHooks). A client that only left
  // and came back (the same session, the panes kept) finds a mod's pane still holding the panel: that stays.
  on('session.attach', async ($, e, next) => {
    const done = await next(e)
    const isDesktop = e.surface === 'desktop'
    const staged = paneOf((await $.state.get(STAGE)).value)
    const isModStaged = staged !== null && !OWN_PANES.includes(staged)
    if (isDesktop && options.openOnStart === true && !isModStaged && (await $.ui.panes()).length === 0) await show($, PANE, false)
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
      // A value that names a pane asks for that mod's pane, as a press on its row here would.
      const pane = paneOf(e.value)
      const go = () => (pane === null ? openHub($) : openOrPoint($, pane))
      $.clock.after(0, () => void go().catch(cause => $.ui.log(`modz: the hub could not come back: ${String(cause)}`, { to: 'debug' })))
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
    const arg = e.args.trim().toLowerCase()
    if (arg === 'help') return { text: helpText(await marketOf(diskOf($)), await $.command.list().catch(() => [])) }
    if (arg === 'check') {
      const market = await marketOf(diskOf($)).catch(() => ({ mods: [] as { name: string; isEnabled: boolean | null }[] }))

      return { text: checkText(await checkFacts($, market.mods.filter(mod => mod.isEnabled === true).map(mod => mod.name))) }
    }
    await openHub($)

    return { text: hubWords().opened }
  })
}

// The desktop keeps the hub's tab across an engine restart, and the new engine has no such pane: the tab would stay
// blank. So the hub opens again, once per module and after the draw, when the panel is empty. `hubKept` is module
// memory, so a reload (a rebuilt bundle) forgets it, and `$.ui.panes()` lists only the hub's own panes: the stage,
// kept by the engine, says a mod's pane holds the panel, and then the hub stays away.
async function reopenKept($: EngineInterface): Promise<void> {
  const staged = paneOf((await $.state.get(STAGE)).value)
  if (staged !== null && !OWN_PANES.includes(staged)) return
  if ((await $.ui.panes()).length === 0) await show($, PANE, false)
}

function paneHooks(on: On): void {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const staged = paneOf((await $.state.get(STAGE)).value)
    if (staged !== null && HUB_DRAWN.includes(staged)) {
      const onHome = () => void openHub($).catch(cause => $.ui.log(`modz: the hub could not come back: ${String(cause)}`, { to: 'debug' }))

      return pinned(e, await pageTree($, e, { page: staged, ui: $.ui.resolve(e), columns: e.props.bodyColumns || DEFAULT_COLUMNS, surface: e.surface, onHome }))
    }
    if (!hubKept.isHeld) {
      hubKept.isHeld = true
      $.clock.after(0, () => void reopenKept($).catch(cause => $.ui.log(`modz: the kept hub tab could not be opened: ${String(cause)}`, { to: 'debug' })))
    }
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
  wireUpkeep(on)
  paneHooks(on)
  wireFilesPage(on)
  footerHooks(on)
  wireLanguageKeeper(on, options)
  wirePlainRows(on, options)
}
