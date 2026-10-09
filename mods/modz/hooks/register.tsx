// MODZ: the one pane that opens by itself (DESIGN.md §9). It lists every mod's pane with the
// mod's own live line, and asks the owning mod to open its pane when a row is pressed; the
// catalog of every mod is a second view of the same pane.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { HubCard, ModzView } from '../types'
import { loadCatalog, marketRoot } from './catalog'
import type { Market } from './catalog'
import { cardOf, focusOf, MODS_PANE, rowsOf } from './hub'
import type { Presence } from './hub'
import { hubTree } from './hub-pane'
import { modzTree } from './pane'
import type { Theme } from './theme'

const PANE = 'modz'
const TITLE = 'MODZ'

const OPEN = { plugin: 'modz', key: 'open' } as const
const cardsAtom = atom({ plugin: 'modz', key: 'cards' } as const, {} as Record<string, HubCard>)
const viewAtom = atom({ plugin: 'modz', key: 'view' } as const, 'home' as ModzView)

// Claude Code's theme names say light or dark; anything else follows the system in the Svg.
function themeOf(value: unknown): Theme {
  const name = String(value ?? '').toLowerCase()
  if (name.includes('light')) return 'light'

  return name.includes('dark') ? 'dark' : 'auto'
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

const SKILLS_DIR = '.claude/skills'

// Mods are enabled by a ~/.claude/skills/<name> symlink, which settings never mention.
async function skillLinks($: EngineInterface): Promise<(name: string) => Promise<boolean>> {
  const home = await $.env.get('HOME').catch(() => undefined)
  if (!home) return async () => false

  return name => $.fs.exists(`${home}/${SKILLS_DIR}/${name}`).catch(() => false)
}

async function marketOf($: EngineInterface): Promise<Market> {
  const stat = await $.fs.stat($.plugin.root, { resolve: true }).catch(() => undefined)
  const root = marketRoot(stat?.realPath ?? $.plugin.root)

  return loadCatalog({ read: path => $.fs.read(path), root, enabledPlugins: await enabledPlugins($), hasLink: await skillLinks($) })
}

// A pane press: the catalog is this pane's own view; any other pane is its mod's to open.
// The owner opens its pane unasked (the press belongs to this plugin), and the surface fronts
// the newest pane only while no pane holds the keyboard. A pressed hub holds it, so the hub first
// lets go (closed, then back as an unfocused tab) and only then asks the owner.
async function openPane($: EngineInterface, pane: string): Promise<void> {
  if (pane === MODS_PANE) {
    await update($, viewAtom, () => 'mods' as ModzView)

    return
  }
  await $.ui.close({ id: PANE })
  await $.ui.open({ id: PANE, title: TITLE })
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

  return name => (!listed.has(name) ? 'unlisted' : listed.get(name) === false ? 'off' : 'listed')
}

export const register: Register = (on, options) => {
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
    if (card !== null && e.plugin !== 'modz') await update($, cardsAtom, cards => ({ ...cards, [e.plugin]: card }))

    return done
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'modz' }, async $ => {
    await update($, viewAtom, () => 'home' as ModzView)
    await $.ui.open({ id: PANE, title: TITLE, focus: true })

    return { text: 'MODZ paneli açıldı.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const market = await marketOf($)
    const theme = themeOf((await $.config.list()).find(row => row.key === 'theme')?.value)
    const columns = e.props.bodyColumns || e.viewport?.columns || 80
    if ((await read($, viewAtom)) === 'mods') {
      const { Box, Button } = ui
      const home = () => void update($, viewAtom, () => 'home' as ModzView)

      return (
        <Box flexDirection="column" rowGap={1}>
          <Box flexDirection="row"><Button key="home" label="‹ Ana panel" variant="secondary" {...(e.surface === 'desktop' ? {} : { hotkey: '0' })} onPress={home} /></Box>
          {modzTree(ui, { market, surface: e.surface, columns, theme })}
        </Box>
      )
    }
    const rows = rowsOf(await read($, cardsAtom), presenceOf(market))

    return hubTree(ui, { rows, focus: focusOf(rows), meta: metaOf(market), surface: e.surface, columns, theme, onOpen: pane => void openPane($, pane).catch(cause => $.ui.log(`modz: ${pane} could not be opened: ${String(cause)}`, { to: 'debug' })) })
  })
}
