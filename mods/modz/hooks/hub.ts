// The hub's model: which panes it lists, how a mod's reported card reads, and what leads the head.
// Pure: no `$`, so the tests and both surfaces share it.
import type { HubCard, HubTone } from '../types'
import type { Market } from './catalog'
import type { IconName } from './kit/icons'
import type { RoleName } from './theme'
import { paneWords } from './words'
import type { Section } from './words'

export type { Section }

export type HubEntry = { pane: string; mod: string; title: string; icon: IconName; role: RoleName; section: Section; hint: string }

export const SECTIONS: Section[] = ['work', 'safety', 'meter']

// The catalog is this mod's own second pane, a tab beside the hub.
export const MODS_PANE = 'modz-mods'

type EntryBase = Omit<HubEntry, 'title' | 'hint'>

const BASES: EntryBase[] = [
  { pane: 'agents', mod: 'savvy-progress', icon: 'sparkle', role: 'run', section: 'work' },
  { pane: 'files', mod: 'filetree', icon: 'folder', role: 'read', section: 'work' },
  { pane: 'plan', mod: 'plan-steps', icon: 'list', role: 'plan', section: 'work' },
  { pane: 'transceiver', mod: 'transceiver', icon: 'bell', role: 'read', section: 'work' },
  { pane: 'tests', mod: 'test-badge', icon: 'check', role: 'ok', section: 'safety' },
  { pane: 'checkpoints', mod: 'checkpoint', icon: 'bookmark', role: 'ok', section: 'safety' },
  { pane: 'replay', mod: 'replay-theater', icon: 'rewind', role: 'plan', section: 'safety' },
  { pane: 'usage', mod: 'hud-pro', icon: 'gauge', role: 'warn', section: 'meter' },
  { pane: 'skins', mod: 'skins', icon: 'eye', role: 'edit', section: 'meter' },
  { pane: MODS_PANE, mod: 'modz', icon: 'cube', role: 'edit', section: 'meter' },
]

// The hub's rows with their title and hint in the interface language, read when drawn.
export const entries = (): HubEntry[] => BASES.map(base => ({ ...base, ...paneWords(base.pane) }))

export const modsTitle = (): string => paneWords(MODS_PANE).title

const TONES: HubTone[] = ['idle', 'live', 'ok', 'warn', 'bad']
const DETAIL_MAX = 60

// A card as another mod wrote it: anything malformed is dropped rather than drawn.
export function cardOf(value: unknown): HubCard | null {
  if (typeof value !== 'object' || value === null) return null
  const card = value as Partial<HubCard>
  if (typeof card.pane !== 'string' || typeof card.detail !== 'string' || !TONES.includes(card.tone as HubTone)) return null

  return { pane: card.pane, detail: card.detail.slice(0, DETAIL_MAX), tone: card.tone as HubTone, at: Number(card.at) || 0 }
}

export const ROLE_OF_TONE: Record<HubTone, RoleName | null> = { idle: null, live: 'run', ok: 'ok', warn: 'warn', bad: 'danger' }

const RANK: Record<HubTone, number> = { bad: 4, warn: 3, live: 2, ok: 1, idle: 0 }

export type HubRow = { entry: HubEntry; card: HubCard | null; hotkey: string | null }

// What the catalog says of a mod: on (or not said), switched off, or not listed at all.
export type Presence = 'listed' | 'off' | 'unlisted'

export function presenceOf(market: Market): (mod: string) => Presence {
  const listed = new Map(market.mods.map(mod => [mod.name, mod.isEnabled]))

  return name => {
    const isEnabled = listed.get(name)
    if (isEnabled === false) return 'off'

    // A mod nobody says is on (a marketplace install lists every mod, installed or not) shows once it reports.
    return isEnabled === true ? 'listed' : 'unlisted'
  }
}

// The terminal's row hotkeys: the digits in keyboard order, so a tenth row still gets one.
const HOTKEYS = '1234567890'

// A pane belongs to one mod, so only that mod's own card fills its row: a card left behind by a
// removed mod (or another mod claiming the pane) is never drawn. The catalog is always offered; a
// mod the catalog does not list (Transceiver, a mod from elsewhere, or an unreadable catalog) shows once it reports.
export function rowsOf(cards: Record<string, HubCard>, presence: (mod: string) => Presence): HubRow[] {
  const own = (entry: HubEntry) => {
    const card = cards[entry.mod]

    return card !== undefined && card.pane === entry.pane ? card : null
  }
  const shown = entries().filter(entry => {
    const state = presence(entry.mod)

    return entry.pane === MODS_PANE || state === 'listed' || (state === 'unlisted' && own(entry) !== null)
  })

  return shown.map((entry, i) => ({ entry, card: own(entry), hotkey: HOTKEYS[i] ?? null }))
}

export type Focus = { row: HubRow; tone: HubTone }

// What leads the head: the most pressing card (a failure, then a warning, then live work), newest first.
export function focusOf(rows: HubRow[]): Focus | null {
  const ranked = rows
    .filter(row => row.card !== null && row.card.detail !== '' && RANK[row.card.tone] >= RANK.live)
    .sort((a, b) => RANK[b.card!.tone] - RANK[a.card!.tone] || b.card!.at - a.card!.at)
  const top = ranked[0]

  return top === undefined || top.card === null ? null : { row: top, tone: top.card.tone }
}
