import { pick } from './lang'
import type { Lang } from './lang'

// Every text the HUD shows, in English and in Turkish (MODZ_LANG=tr). Read through `pick` at draw
// time, since the language is set at session.start. Numbers arrive already formatted.

type Labels = Readonly<Record<string, string>>

const SHORT: Readonly<Record<Lang, Labels>> = {
  en: { five_hour: '5h', seven_day: '7d', spend_limit: 'spend', context: 'context' },
  tr: { five_hour: '5s', seven_day: '7g', spend_limit: 'harcama', context: 'bağlam' },
}

const LONG: Readonly<Record<Lang, Labels>> = {
  en: { five_hour: '5-hour', seven_day: '7-day', spend_limit: 'spend limit', context: 'context' },
  tr: { five_hour: '5 saat', seven_day: '7 gün', spend_limit: 'harcama limiti', context: 'bağlam' },
}

export const shortLabels = (): Labels => pick(SHORT)
export const longLabels = (): Labels => pick(LONG)

// How numbers read: the decimal mark, where the percent sign goes, a full window, the countdown units.
export type Units = { decimalMark: string; percent: (rounded: number) => string; full: string; day: string; hour: string; minute: string; billion: string }

const UNITS: Readonly<Record<Lang, Units>> = {
  en: { decimalMark: '.', percent: rounded => `${rounded}%`, full: 'full', day: 'd', hour: 'h', minute: 'm', billion: 'B' },
  tr: { decimalMark: ',', percent: rounded => `%${rounded}`, full: 'dolu', day: 'g', hour: 'sa', minute: 'dk', billion: 'Mr' },
}

export const units = (): Units => pick(UNITS)

// Short weekday names, Sunday first as Date.getDay() counts, for a fill time that is not today.
const WEEKDAYS: Readonly<Record<Lang, readonly string[]>> = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  tr: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
}

export const weekdays = (): readonly string[] => pick(WEEKDAYS)

// /context's row names in Turkish; English keeps the engine's own, and so does an unknown row.
const CATEGORY_TR: Labels = {
  'System prompt': 'Sistem istemi',
  'System tools': 'Sistem araçları',
  'MCP tools': 'MCP araçları',
  'Custom agents': 'Özel ajanlar',
  'Memory files': 'Bellek dosyaları',
  Skills: 'Beceriler',
  'Slash commands': 'Komutlar',
  Messages: 'Mesajlar',
}

export const categoryLabel = (name: string): string => pick({ en: name, tr: CATEGORY_TR[name] ?? name })

// English counts: "1 reading", "3 readings".
const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`
const nouns = (count: number, one: string): string => (count === 1 ? one : `${one}s`)

type TurnSpec = { input: string; output: string; cache: string; requests: number }
type FreeSpec = { tokens: string; count: number }
type CompactedSpec = { before: string; after: string }
type PastSpec = { active: number; range: number; sessions: number; tokens: string; model: string | null }

type Words = {
  paneTitle: string
  limits: string
  compact: string
  session: string
  sessionCost: string
  thisSession: string
  oneReading: string
  noReadings: string
  hidden: string
  shown: string
  commandFailed: string
  commandDescription: string
  timeToCompact: string
  readings: (count: number) => string
  sessionAt: (cost: string) => string
  range: (low: string, high: string) => string
  ahead: (points: number) => string
  pace: (percent: string) => string
  free: (spec: FreeSpec) => string
  lastTurnTokens: (spec: FreeSpec) => string
  turn: (spec: TurnSpec) => string
  resetsIn: (reset: string) => string
  resetsAfter: (reset: string) => string
  limitFull: (label: string) => string
  limitAt: (label: string, value: string) => string
  compactFailed: (message: string) => string
  contextTitle: string
  other: string
  freeSpace: string
  reserve: string
  compactNow: string
  compacting: string
  noBreakdown: string
  compacted: string
  compactedFrom: (spec: CompactedSpec) => string
  estimate: (used: string, total: string) => string
  fullAt: (time: string) => string
  fullAtShort: (time: string) => string
  turnsLeft: (count: number) => string
  turnsShort: (count: number) => string
  lastTurns: (count: number) => string
  pastTitle: string
  activeDays: string
  sessions: string
  tokens: string
  topModel: string
  rangeLabel: (days: number) => string
  lastDays: (days: number) => string
  pastLine: (spec: PastSpec) => string
  dayTokens: (day: string, tokens: string) => string
}

const EN: Words = {
  paneTitle: 'Usage',
  limits: 'Limits',
  compact: 'Compact',
  session: 'session',
  sessionCost: 'session cost',
  thisSession: 'this session',
  oneReading: 'one reading',
  noReadings: 'No readings yet; they come with the first model reply.',
  hidden: 'HUD hidden.',
  shown: 'HUD shown.',
  commandFailed: 'The HUD command failed.',
  commandDescription: 'Show or hide the HUD line; "/hud full" opens the limit details',
  timeToCompact: 'time to compact',
  readings: count => plural(count, 'reading', 'readings'),
  sessionAt: cost => `session ${cost}`,
  range: (low, high) => `range ${low}–${high}`,
  ahead: points => `${plural(points, 'point', 'points')} ahead of pace`,
  pace: percent => `pace ${percent}`,
  free: spec => `${spec.tokens} ${nouns(spec.count, 'token')} free`,
  lastTurnTokens: spec => `last turn ${spec.tokens} ${nouns(spec.count, 'token')}`,
  turn: spec =>
    `last turn: input ${spec.input} · output ${spec.output} · cache ${spec.cache} · ${plural(spec.requests, 'request', 'requests')}`,
  resetsIn: reset => `resets in ${reset}`,
  resetsAfter: reset => `resets in ${reset}`,
  limitFull: label => `${label} limit reached`,
  limitAt: (label, value) => `${label} limit ${value} used`,
  compactFailed: message => `Compact failed: ${message}`,
  contextTitle: 'Context breakdown',
  other: 'Other',
  freeSpace: 'Free',
  reserve: 'Reserve',
  compactNow: 'Compact now',
  compacting: 'Compacting…',
  noBreakdown: 'No breakdown yet.',
  compacted: 'Compacted',
  compactedFrom: spec => `Compacted ${spec.before} → ${spec.after}`,
  estimate: (used, total) => `~${used} / ${total}`,
  fullAt: time => `~full at ${time}`,
  fullAtShort: time => `~full ${time}`,
  turnsLeft: count => `~${plural(count, 'turn', 'turns')} left`,
  turnsShort: count => `~${plural(count, 'turn', 'turns')}`,
  lastTurns: count => `last ${plural(count, 'turn', 'turns')}`,
  pastTitle: 'History',
  activeDays: 'active days',
  sessions: 'sessions',
  tokens: 'tokens',
  topModel: 'most used',
  rangeLabel: days => `${days} days`,
  lastDays: days => `last ${days} days`,
  pastLine: spec =>
    [`${spec.active}/${spec.range} active days`, plural(spec.sessions, 'session', 'sessions'), `${spec.tokens} tokens`, spec.model === null ? '' : `mostly ${spec.model}`]
      .filter(part => part !== '')
      .join(' · '),
  dayTokens: (day, tokens) => `${day}: ${tokens} tokens`,
}

const TR: Words = {
  paneTitle: 'Kullanım',
  limits: 'Limitler',
  compact: 'Sıkıştır',
  session: 'oturum',
  sessionCost: 'oturum maliyeti',
  thisSession: 'bu oturum',
  oneReading: 'tek okuma',
  noReadings: 'Henüz ölçüm yok; ilk model yanıtıyla gelir.',
  hidden: 'HUD gizlendi.',
  shown: 'HUD gösteriliyor.',
  commandFailed: 'HUD komutu çalışmadı.',
  commandDescription: 'HUD satırını aç/kapat; "/hud full" limit ayrıntılarını açar',
  timeToCompact: 'sıkıştırmak iyi olur',
  readings: count => `${count} okuma`,
  sessionAt: cost => `oturum ${cost}`,
  range: (low, high) => `aralık ${low}–${high}`,
  ahead: points => `tempodan ${points} puan önde`,
  pace: percent => `tempo ${percent}`,
  free: spec => `${spec.tokens} token boş`,
  lastTurnTokens: spec => `son tur ${spec.tokens} token`,
  turn: spec => `son tur: girdi ${spec.input} · çıktı ${spec.output} · önbellek ${spec.cache} · ${spec.requests} istek`,
  resetsIn: reset => `sıfırlanma ${reset}`,
  resetsAfter: reset => `${reset} sonra sıfırlanır`,
  limitFull: label => `${label} limiti doldu`,
  limitAt: (label, value) => `${label} limiti ${value} dolu`,
  compactFailed: message => `Sıkıştırma başarısız: ${message}`,
  contextTitle: 'Bağlam dökümü',
  other: 'Diğer',
  freeSpace: 'Boş',
  reserve: 'Yedek pay',
  compactNow: 'Şimdi sıkıştır',
  compacting: 'Sıkıştırılıyor…',
  noBreakdown: 'Henüz döküm yok.',
  compacted: 'Sıkıştırıldı',
  compactedFrom: spec => `Sıkıştırıldı: ${spec.before} → ${spec.after}`,
  estimate: (used, total) => `~${used} / ${total}`,
  fullAt: time => `~${time} civarında dolar`,
  fullAtShort: time => `~dolar ${time}`,
  turnsLeft: count => `~${count} tur kaldı`,
  turnsShort: count => `~${count} tur`,
  lastTurns: count => `son ${count} tur`,
  pastTitle: 'Geçmiş',
  activeDays: 'aktif gün',
  sessions: 'oturum',
  tokens: 'token',
  topModel: 'en çok',
  rangeLabel: days => `${days} gün`,
  lastDays: days => `son ${days} gün`,
  pastLine: spec =>
    [`${spec.active}/${spec.range} aktif gün`, `${spec.sessions} oturum`, `${spec.tokens} token`, spec.model === null ? '' : `çoğunlukla ${spec.model}`]
      .filter(part => part !== '')
      .join(' · '),
  dayTokens: (day, tokens) => `${day}: ${tokens} token`,
}

const WORDS: Readonly<Record<Lang, Words>> = { en: EN, tr: TR }

export const words = (): Words => pick(WORDS)
