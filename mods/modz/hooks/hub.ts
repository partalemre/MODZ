// The hub's model: which panes it lists, how a mod's reported card reads, and what leads the head.
// Pure: no `$`, so the tests and both surfaces share it.
import type { HubCard, HubTone } from '../types'
import type { Market } from './catalog'
import { ICON_NAMES } from './kit/icons'
import type { IconName } from './kit/icons'
import { arrange, EMPTY_LAYOUT, isHidden } from './layout'
import type { HubLayout } from './layout'
import type { RoleName } from './theme'
import { badgeWord, paneWords } from './words'
import type { Section } from './words'

export type { Section }

// `badge` is a short word beside the title ("Beta"); `isGuest` marks a row a mod the hub does not know named itself.
export type HubEntry = {
  pane: string
  mod: string
  title: string
  icon: IconName
  role: RoleName
  section: Section
  hint: string
  badge: string | null
  isGuest: boolean
}

export const SECTIONS: Section[] = ['work', 'safety', 'meter']

// The catalog is this mod's own second pane, a tab beside the hub.
export const MODS_PANE = 'modz-mods'

type EntryBase = Omit<HubEntry, 'title' | 'hint' | 'badge' | 'isGuest'> & { isBeta?: true }

const BASES: EntryBase[] = [
  { pane: 'agents', mod: 'savvy-progress', icon: 'sparkle', role: 'run', section: 'work' },
  { pane: 'files', mod: 'filetree', icon: 'folder', role: 'read', section: 'work' },
  { pane: 'plan', mod: 'plan-steps', icon: 'list', role: 'plan', section: 'work' },
  { pane: 'transceiver', mod: 'transceiver', icon: 'bell', role: 'read', section: 'work', isBeta: true },
  { pane: 'tests', mod: 'test-badge', icon: 'check', role: 'ok', section: 'safety' },
  { pane: 'checkpoints', mod: 'checkpoint', icon: 'bookmark', role: 'ok', section: 'safety' },
  { pane: 'replay', mod: 'replay-theater', icon: 'rewind', role: 'plan', section: 'safety' },
  { pane: 'usage', mod: 'hud-pro', icon: 'gauge', role: 'warn', section: 'meter' },
  { pane: 'effort', mod: 'effort-router', icon: 'bolt', role: 'run', section: 'meter' },
  { pane: 'handoff', mod: 'handoff', icon: 'flag', role: 'plan', section: 'meter' },
  { pane: 'skins', mod: 'skins', icon: 'eye', role: 'edit', section: 'meter' },
  { pane: MODS_PANE, mod: 'modz', icon: 'cube', role: 'edit', section: 'meter' },
]

// The hub's own rows with their title and hint in the interface language, read when drawn.
export const entries = (): HubEntry[] =>
  BASES.map(({ isBeta, ...base }) => ({ ...base, ...paneWords(base.pane), badge: isBeta ? badgeWord() : null, isGuest: false }))

const KNOWN_MODS = new Set(BASES.map(base => base.mod))

// A row for a mod the hub does not list, from what its own card says: a new mod shows up without a change here.
function guestEntry(mod: string, card: HubCard): HubEntry {
  const icon = ICON_NAMES.includes(card.icon as IconName) ? (card.icon as IconName) : 'cube'
  const section = SECTIONS.includes(card.section as Section) ? (card.section as Section) : 'work'

  return { pane: card.pane, mod, title: card.title ?? mod, hint: card.hint ?? '', icon, role: 'edit', section, badge: card.badge ?? null, isGuest: true }
}

export const modsTitle = (): string => paneWords(MODS_PANE).title

const TONES: HubTone[] = ['idle', 'live', 'ok', 'warn', 'bad']
const DETAIL_MAX = 60
const TITLE_MAX = 32
const BADGE_MAX = 12
// What `$.ui.open` admits as a pane id, so a row's keys stay well formed.
const PANE_ID = /^[\w-]{1,64}$/

const textOf = (value: unknown, max: number): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value.trim().slice(0, max) : undefined

// A card as another mod wrote it: anything malformed is dropped rather than drawn; a row's own words are kept short.
export function cardOf(value: unknown): HubCard | null {
  if (typeof value !== 'object' || value === null) return null
  const card = value as Partial<Record<keyof HubCard, unknown>>
  if (typeof card.pane !== 'string' || !PANE_ID.test(card.pane) || typeof card.detail !== 'string' || !TONES.includes(card.tone as HubTone)) return null
  const own = {
    title: textOf(card.title, TITLE_MAX),
    hint: textOf(card.hint, DETAIL_MAX),
    icon: textOf(card.icon, TITLE_MAX),
    section: SECTIONS.includes(card.section as Section) ? (card.section as Section) : undefined,
    badge: textOf(card.badge, BADGE_MAX),
  }
  const named = Object.fromEntries(Object.entries(own).filter(([, v]) => v !== undefined))

  return { pane: card.pane, detail: card.detail.slice(0, DETAIL_MAX), tone: card.tone as HubTone, at: Number(card.at) || 0, ...named }
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
// mod the catalog does not list (Transceiver, a mod from elsewhere, or an unreadable catalog) shows once it
// reports, and a mod the hub does not know at all gets a row of its own from its card.
function candidates(cards: Record<string, HubCard>, presence: (mod: string) => Presence): Array<Omit<HubRow, 'hotkey'>> {
  const own = (entry: HubEntry) => {
    const card = cards[entry.mod]

    return card !== undefined && card.pane === entry.pane ? card : null
  }
  const known = entries().filter(entry => {
    const state = presence(entry.mod)

    return entry.pane === MODS_PANE || state === 'listed' || (state === 'unlisted' && own(entry) !== null)
  })
  const taken = new Set(entries().map(entry => entry.pane))
  const guests = Object.entries(cards)
    .filter(([mod, card]) => mod !== 'modz' && !KNOWN_MODS.has(mod) && presence(mod) !== 'off' && !taken.has(card.pane))
    .map(([mod, card]) => guestEntry(mod, card))

  return [...known, ...guests].map(entry => ({ entry, card: own(entry) }))
}

const panedOf = <T extends { entry: HubEntry }>(rows: T[]) => rows.map(row => ({ ...row, pane: row.entry.pane }))

// The rows the hub draws, in the person's order with the rows they hid left out; the digits follow what is drawn.
export function rowsOf(cards: Record<string, HubCard>, presence: (mod: string) => Presence, layout: HubLayout = EMPTY_LAYOUT): HubRow[] {
  const shown = arrange(panedOf(candidates(cards, presence)), layout).filter(row => !isHidden(layout, row.pane))

  return shown.map(({ entry, card }, i) => ({ entry, card, hotkey: HOTKEYS[i] ?? null }))
}

// The rows the person hid, offered back while they customize the hub.
export function hiddenRowsOf(cards: Record<string, HubCard>, presence: (mod: string) => Presence, layout: HubLayout): HubRow[] {
  return candidates(cards, presence)
    .filter(row => isHidden(layout, row.entry.pane))
    .map(({ entry, card }) => ({ entry, card, hotkey: null }))
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
