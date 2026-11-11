// Every word the hub and the catalog show, in English and in Turkish (MODZ_LANG=tr). Each is read
// through `pick` while drawing, since the language is known only once the session starts.
import { pick } from './kit/lang'
import type { Group, Surface } from './meta'

export type Section = 'work' | 'safety' | 'meter'

export type PaneWords = { title: string; hint: string }

// "1 mod" / "3 mods": English counts take an s, Turkish ones never do.
const count = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`

const PANES = {
  en: {
    agents: { title: 'Agents', hint: 'Agent status, progress and cost' },
    files: { title: 'Files', hint: 'Files Claude touched' },
    plan: { title: 'Plan', hint: "The plan's steps" },
    transceiver: { title: 'Transceiver', hint: 'Chat rooms with your team' },
    tests: { title: 'Tests', hint: 'How the last test run went' },
    checkpoints: { title: 'Restore points', hint: 'Take back what a turn changed' },
    replay: { title: 'Replay', hint: 'Watch what the last turn changed' },
    usage: { title: 'Usage', hint: 'Allowance used and what it cost' },
    effort: { title: 'Thinking level', hint: 'How hard Claude thinks each turn' },
    handoff: { title: 'Handoff', hint: 'A note for your next fresh chat' },
    skins: { title: 'Look', hint: 'Looks and colors' },
    'modz-mods': { title: 'Mods', hint: 'Every mod and whether it works' },
  },
  tr: {
    agents: { title: 'Ajanlar', hint: 'Ajanlar: durum, ilerleme, maliyet' },
    files: { title: 'Dosyalar', hint: "Claude'un dokunduğu dosyalar" },
    plan: { title: 'Plan', hint: 'Planın adımları' },
    transceiver: { title: 'Transceiver', hint: 'Arkadaşlarla sohbet odaları' },
    tests: { title: 'Testler', hint: 'Testlerin son sonucu' },
    checkpoints: { title: 'Geri dönüş noktaları', hint: 'Bir turun yaptıklarını geri al' },
    replay: { title: 'Tekrar', hint: 'Son turun değiştirdiklerini izle' },
    usage: { title: 'Kullanım', hint: 'Harcanan kullanım hakkı ve maliyet' },
    effort: { title: 'Düşünme düzeyi', hint: 'Claude her turda ne kadar derin düşünüyor' },
    handoff: { title: 'Devir', hint: 'Bir sonraki temiz sohbet için not' },
    skins: { title: 'Görünüm', hint: 'Görünüm ve renkler' },
    'modz-mods': { title: 'Modlar', hint: 'Tüm modlar ve çalışıp çalışmadıkları' },
  },
} as const

// A pane the tables do not know keeps its id as its title.
export function paneWords(pane: string): PaneWords {
  const table = pick<Readonly<Record<string, PaneWords>>>(PANES)

  return table[pane] ?? { title: pane, hint: '' }
}

const HUB = {
  en: {
    sections: { work: 'Work', safety: 'Safety', meter: 'Meters & settings' } as Record<Section, string>,
    idleTitle: 'All quiet',
    idleLine: 'Agents, tests and plans show here when they move.',
    now: 'Now',
    open: 'Open',
    openPane: (title: string) => `Open ${title}`,
    modsOn: (n: number) => `${count(n, 'mod', 'mods')} on`,
    unreadable: 'the mod list could not be read',
    command: 'Opens the MODZ hub: agents, files, plan, tests and every mod',
    opened: 'Opened the MODZ panel.',
    customize: 'Customize',
    done: 'Done',
    up: 'Up',
    hide: 'Hide',
    show: 'Show',
    reset: 'Reset',
    hidden: 'Hidden',
    editLine: 'Move a row up or hide it. Hidden rows wait here.',
    noAnswer: 'did not answer: its panel did not open',
    inBand: (title: string) => `${title} has no panel: its question waits above the message box.`,
    plain: 'plain view: the drawing failed',
    more: (n: number) => `+${n} more`,
    ago: {
      now: 'now',
      seconds: (n: number) => `${n}s`,
      minutes: (n: number) => `${n}m`,
      hours: (h: number, m: number) => `${h}h ${String(m).padStart(2, '0')}m`,
    },
    firstRun: 'Only the hub is installed. Each mod adds a row here.',
    addMods: 'Add mods',
    helpTitle: 'MODZ: commands and settings',
    helpHub: '/modz opens the hub · /modz help prints this list',
    helpNone: 'No installed mod has a command or an option.',
    helpInstall: 'Not installed:',
  },
  tr: {
    sections: { work: 'Çalışma', safety: 'Güvence', meter: 'Ölçüm ve ayarlar' } as Record<Section, string>,
    idleTitle: 'Sakin',
    idleLine: 'Ajan, test ya da plan hareketlenince burada görünür.',
    now: 'Şu an',
    open: 'Aç',
    openPane: (title: string) => `${title} panelini aç`,
    modsOn: (n: number) => `${n} mod açık`,
    unreadable: 'mod listesi okunamadı',
    command: 'MODZ ana panelini açar: ajanlar, dosyalar, plan, testler ve tüm modlar',
    opened: 'MODZ paneli açıldı.',
    customize: 'Düzenle',
    done: 'Bitti',
    up: 'Yukarı',
    hide: 'Gizle',
    show: 'Göster',
    reset: 'Sıfırla',
    hidden: 'Gizli',
    editLine: 'Bir satırı yukarı taşı ya da gizle. Gizlenenler burada bekler.',
    noAnswer: 'yanıt vermedi: paneli açılmadı',
    inBand: (title: string) => `${title} modunun paneli yok: sorusu mesaj kutusunun üstünde bekliyor.`,
    plain: 'düz görünüm: çizim başarısız',
    more: (n: number) => `+${n} tane daha`,
    ago: {
      now: 'şimdi',
      seconds: (n: number) => `${n} sn`,
      minutes: (n: number) => `${n} dk`,
      hours: (h: number, m: number) => `${h} sa ${String(m).padStart(2, '0')} dk`,
    },
    firstRun: 'Yalnızca ana panel kurulu. Her mod buraya bir satır ekler.',
    addMods: 'Mod ekle',
    helpTitle: 'MODZ: komutlar ve ayarlar',
    helpHub: '/modz ana paneli açar · /modz help bu listeyi yazar',
    helpNone: 'Kurulu hiçbir modun komutu ya da seçeneği yok.',
    helpInstall: 'Kurulu değil:',
  },
}

export const hubWords = () => pick(HUB)

// The word beside a row that is still being tried out.
export const badgeWord = (): string => pick({ en: 'Beta', tr: 'Beta' })

const CATALOG = {
  en: {
    groups: { look: 'Look', safety: 'Safety', meter: 'Meter', flow: 'Flow', other: 'Other' } as Record<Group, string>,
    surfaces: { desktop: 'desktop', terminal: 'terminal' } as Record<Surface, string>,
    allMods: 'All mods',
    mods: (n: number) => count(n, 'mod', 'mods'),
    allOn: 'all on',
    on: (n: number) => `${n} on`,
    unknown: (n: number) => `${n} unknown`,
    allHealthy: 'all healthy',
    broken: (n: number) => `${n} broken`,
    brokenWord: 'broken',
    offWord: 'off',
    onWord: 'on',
    stateUnknown: 'state unknown',
    from: (upstream: string) => `from ${upstream}`,
    unreadable: 'its settings file (plugin.json) could not be read',
    invalid: 'its line in the mod list is broken',
    remote: 'kept elsewhere: no details on this computer',
    entry: (n: number) => `entry ${n}`,
    emptyTitle: 'The mod list could not be read',
    emptyLine: 'The list file (marketplace.json) is missing or lists no mods.',
    install: 'Not installed',
    installLine: 'Paste a line into the message box to install that mod.',
    copy: 'Copy',
    copied: 'Copied. Paste it into the message box.',
    notCopied: 'Could not copy; select the line instead.',
    guide: 'Commands and settings',
    options: (keys: string) => `Options under /plugin: ${keys}`,
    noCommand: 'no command',
  },
  tr: {
    groups: { look: 'Görünüm', safety: 'Koruma', meter: 'Ölçüm', flow: 'Akış', other: 'Diğer' } as Record<Group, string>,
    surfaces: { desktop: 'masaüstü', terminal: 'terminal' } as Record<Surface, string>,
    allMods: 'Tüm modlar',
    mods: (n: number) => `${n} mod`,
    allOn: 'hepsi açık',
    on: (n: number) => `${n} açık`,
    unknown: (n: number) => `${n} bilinmiyor`,
    allHealthy: 'hepsi sağlıklı',
    broken: (n: number) => `${n} sorunlu`,
    brokenWord: 'sorunlu',
    offWord: 'kapalı',
    onWord: 'açık',
    stateUnknown: 'durum bilinmiyor',
    from: (upstream: string) => `asıl: ${upstream}`,
    unreadable: 'ayar dosyası (plugin.json) okunamadı',
    invalid: 'mod listesindeki satırı bozuk',
    remote: 'başka yerde tutuluyor: bu bilgisayarda ayrıntısı yok',
    entry: (n: number) => `kayıt ${n}`,
    emptyTitle: 'Mod listesi okunamadı',
    emptyLine: 'Liste dosyası (marketplace.json) bulunamadı ya da içinde mod yok.',
    install: 'Kurulu değil',
    installLine: 'Bir satırı mesaj kutusuna yapıştır; o mod kurulur.',
    copy: 'Kopyala',
    copied: 'Kopyalandı. Mesaj kutusuna yapıştır.',
    notCopied: 'Kopyalanamadı; satırı seçip kopyala.',
    guide: 'Komutlar ve ayarlar',
    options: (keys: string) => `/plugin altındaki seçenekler: ${keys}`,
    noCommand: 'komut yok',
  },
}

export const catalogWords = () => pick(CATALOG)

// Where a mod draws and where it comes from, as the catalog's quiet line says it.
export function placeLine(mod: { surfaces: Surface[]; upstream: string | null }): string {
  const words = catalogWords()
  const source = mod.upstream === null ? 'MODZ' : words.from(mod.upstream)

  return `${mod.surfaces.map(surface => words.surfaces[surface]).join(' · ')} · ${source}`
}
