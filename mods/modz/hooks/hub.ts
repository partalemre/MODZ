// The hub's model: which panes it lists, how a mod's reported card reads, and what leads the head.
// Pure: no `$`, so the tests and both surfaces share it.
import type { HubCard, HubTone } from '../types'
import type { IconName } from './kit/icons'
import type { RoleName } from './theme'

export type Section = 'Çalışma' | 'Güvence' | 'Ayarlar'

export type HubEntry = { pane: string; mod: string; title: string; icon: IconName; role: RoleName; section: Section; hint: string }

export const SECTIONS: Section[] = ['Çalışma', 'Güvence', 'Ayarlar']

// The catalog lives inside the hub itself rather than in a pane of its own.
export const MODS_PANE = 'mods'

export const ENTRIES: HubEntry[] = [
  { pane: 'agents', mod: 'savvy-progress', title: 'Ajanlar', icon: 'sparkle', role: 'run', section: 'Çalışma', hint: 'Ajanlar: durum, ilerleme, maliyet' },
  { pane: 'files', mod: 'filetree', title: 'Dosyalar', icon: 'folder', role: 'read', section: 'Çalışma', hint: "Claude'un dokunduğu dosyalar" },
  { pane: 'plan', mod: 'plan-steps', title: 'Plan', icon: 'list', role: 'plan', section: 'Çalışma', hint: 'Planın adımları' },
  { pane: 'tests', mod: 'test-badge', title: 'Testler', icon: 'check', role: 'ok', section: 'Güvence', hint: 'Son test ve lint koşusu' },
  { pane: 'checkpoints', mod: 'checkpoint', title: 'Kontrol noktaları', icon: 'bookmark', role: 'ok', section: 'Güvence', hint: 'Bir turu geri al' },
  { pane: 'replay', mod: 'replay-theater', title: 'Tekrar', icon: 'rewind', role: 'plan', section: 'Güvence', hint: 'Son turun düzenlemelerini izle' },
  { pane: 'usage', mod: 'hud-pro', title: 'Kullanım', icon: 'gauge', role: 'warn', section: 'Ayarlar', hint: 'Limitler ve oturum maliyeti' },
  { pane: 'skins', mod: 'skins', title: 'Görünüm', icon: 'eye', role: 'edit', section: 'Ayarlar', hint: 'Skin ve renkler' },
  { pane: MODS_PANE, mod: 'modz', title: 'Modlar', icon: 'cube', role: 'edit', section: 'Ayarlar', hint: 'Tüm modlar, sürüm ve sağlık' },
]

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

const HOTKEYS = 9

// A pane belongs to one mod, so only that mod's own card fills its row: a card left behind by a
// removed mod (or another mod claiming the pane) is never drawn. The catalog is always offered; a
// mod the catalog does not list (a mod from elsewhere, or an unreadable catalog) shows once it reports.
export function rowsOf(cards: Record<string, HubCard>, presence: (mod: string) => Presence): HubRow[] {
  const own = (entry: HubEntry) => {
    const card = cards[entry.mod]

    return card !== undefined && card.pane === entry.pane ? card : null
  }
  const shown = ENTRIES.filter(entry => {
    const state = presence(entry.mod)

    return entry.pane === MODS_PANE || state === 'listed' || (state === 'unlisted' && own(entry) !== null)
  })

  return shown.map((entry, i) => ({ entry, card: own(entry), hotkey: i < HOTKEYS ? String(i + 1) : null }))
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
