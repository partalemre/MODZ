import { pick } from './lang'
import type { Lang } from './lang'

// Every text the HUD shows, in English and in Turkish (MODZ_LANG=tr). Read through `pick` at draw
// time, since the language is set at session.start. Numbers arrive already formatted.

type Labels = Readonly<Record<string, string>>

const SHORT: Readonly<Record<Lang, Labels>> = {
  en: { five_hour: '5h', seven_day: 'week', spend_limit: 'spend', context: 'memory' },
  tr: { five_hour: '5s', seven_day: 'hafta', spend_limit: 'harcama', context: 'hafıza' },
}

const LONG: Readonly<Record<Lang, Labels>> = {
  en: { five_hour: '5-hour allowance', seven_day: 'weekly allowance', spend_limit: 'spend limit', context: 'chat memory' },
  tr: { five_hour: '5 saatlik hak', seven_day: 'haftalık hak', spend_limit: 'harcama sınırı', context: 'sohbet hafızası' },
}

// The MODZ card's one line: as short as the band's labels, but whole words.
const CARD: Readonly<Record<Lang, Labels>> = {
  en: { five_hour: '5-hour', seven_day: 'weekly', spend_limit: 'spend', context: 'memory' },
  tr: { five_hour: '5 saatlik', seven_day: 'haftalık', spend_limit: 'harcama', context: 'hafıza' },
}

export const shortLabels = (): Labels => pick(SHORT)
export const cardLabels = (): Labels => pick(CARD)
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

// /context's row names in plain words; an unknown row keeps the engine's own name.
const CATEGORY_EN: Labels = {
  'System prompt': 'Built-in instructions',
  'System tools': 'Built-in tools',
  'MCP tools': 'Connected tools (MCP)',
  'Custom agents': 'Your agents',
  'Slash commands': 'Commands',
}

const CATEGORY_TR: Labels = {
  'System prompt': 'Yerleşik talimatlar',
  'System tools': 'Yerleşik araçlar',
  'MCP tools': 'Bağlı araçlar (MCP)',
  'Custom agents': 'Senin ajanların',
  'Memory files': 'Hafıza dosyaları',
  Skills: 'Beceriler',
  'Slash commands': 'Komutlar',
  Messages: 'Mesajlar',
}

export const categoryLabel = (name: string): string => pick({ en: CATEGORY_EN[name] ?? name, tr: CATEGORY_TR[name] ?? name })

// English counts: "1 reading", "3 readings".
const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`
const nouns = (count: number, one: string): string => (count === 1 ? one : `${one}s`)

type TurnSpec = { input: string; output: string; cache: string; requests: number }
type FreeSpec = { tokens: string; count: number }
type CompactedSpec = { before: string; after: string }
type PastSpec = { active: number; range: number; sessions: number; tokens: string; cache: string; model: string | null }

type Words = {
  paneTitle: string
  limits: string
  compact: string
  session: string
  sessionCost: string
  thisSession: string
  noReadings: string
  hidden: string
  shown: string
  commandFailed: string
  commandDescription: string
  bandSet: (mode: string) => string
  bandUsage: string
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
  // Input + output tokens' label, with the cache reads and writes beside them.
  tokensApart: (cache: string) => string
  topModel: string
  rangeLabel: (days: number) => string
  lastDays: (days: number) => string
  pastLine: (spec: PastSpec) => string
  dayTokens: (day: string, tokens: string) => string
}

const EN: Words = {
  paneTitle: 'Usage',
  limits: 'Limits',
  compact: 'Summarize',
  session: 'session',
  sessionCost: 'session cost',
  thisSession: 'this session',
  noReadings: 'Nothing measured yet; the numbers arrive with the first answer.',
  hidden: 'Usage line hidden.',
  shown: 'Usage line shown.',
  commandFailed: 'The /hud command did not work.',
  commandDescription: 'Show or hide the usage line above your message box; "/hud full" opens the details; "/hud band auto|always|alerts" picks when it shows',
  bandSet: mode => `Usage line: ${mode}${mode === 'auto' ? ' (only warnings in the desktop app, which shows your allowances itself; the full line in the terminal)' : ''}.`,
  bandUsage: 'Write one of: /hud band auto | always | alerts',
  timeToCompact: 'worth summarizing now',
  readings: count => plural(count, 'reading', 'readings'),
  sessionAt: cost => `session ${cost}`,
  range: (low, high) => `range ${low}–${high}`,
  ahead: points => `${plural(points, 'point', 'points')} ahead of an even pace`,
  pace: percent => `even pace ${percent}`,
  free: spec => `room for ${spec.tokens} more ${nouns(spec.count, 'token')}`,
  lastTurnTokens: spec => `last turn ${spec.tokens} ${nouns(spec.count, 'token')}`,
  turn: spec =>
    `last turn: read ${spec.input} · wrote ${spec.output} · ${spec.cache} reused · ${plural(spec.requests, 'model call', 'model calls')}`,
  resetsIn: reset => `refills in ${reset}`,
  resetsAfter: reset => `refills in ${reset}`,
  limitFull: label => `${label} used up`,
  limitAt: (label, value) => `${label}: ${value} used`,
  compactFailed: message => `Could not summarize the chat (compact): ${message}`,
  contextTitle: 'Chat memory (context)',
  other: 'Other',
  freeSpace: 'Free',
  reserve: 'Set aside',
  compactNow: 'Summarize now',
  compacting: 'Summarizing…',
  noBreakdown: 'No breakdown yet.',
  compacted: 'Summarized',
  compactedFrom: spec => `Summarized ${spec.before} → ${spec.after}`,
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
  tokensApart: cache => `tokens · ${cache} kept ready`,
  topModel: 'most used',
  rangeLabel: days => `${days} days`,
  lastDays: days => `last ${days} days`,
  pastLine: spec =>
    [`${spec.active}/${spec.range} active days`, plural(spec.sessions, 'session', 'sessions'), `${spec.tokens} tokens read and written`, `${spec.cache} kept ready`, spec.model === null ? '' : `mostly ${spec.model}`]
      .filter(part => part !== '')
      .join(' · '),
  dayTokens: (day, tokens) => `${day}: ${tokens} tokens`,
}

const TR: Words = {
  paneTitle: 'Kullanım',
  limits: 'Limitler',
  compact: 'Özetle',
  session: 'oturum',
  sessionCost: 'oturum maliyeti',
  thisSession: 'bu oturum',
  noReadings: 'Henüz ölçüm yok; sayılar ilk yanıtla gelir.',
  hidden: 'Kullanım satırı gizlendi.',
  shown: 'Kullanım satırı gösteriliyor.',
  commandFailed: '/hud komutu çalışmadı.',
  commandDescription: 'Mesaj kutusunun üstündeki kullanım satırını aç/kapat; "/hud full" ayrıntıları açar; "/hud band auto|always|alerts" ne zaman görüneceğini seçer',
  bandSet: mode => `Kullanım satırı: ${mode}${mode === 'auto' ? ' (masaüstü uygulamasında yalnızca uyarılar, kullanım haklarını uygulama zaten gösteriyor; terminalde tam satır)' : ''}.`,
  bandUsage: 'Şunlardan biri: /hud band auto | always | alerts',
  timeToCompact: 'özetlemek iyi olur',
  readings: count => `${count} ölçüm`,
  sessionAt: cost => `oturum ${cost}`,
  range: (low, high) => `aralık ${low}–${high}`,
  ahead: points => `eşit hızdan ${points} puan önde`,
  pace: percent => `eşit hızda ${percent}`,
  free: spec => `${spec.tokens} token daha sığar`,
  lastTurnTokens: spec => `son tur ${spec.tokens} token`,
  turn: spec => `son tur: okunan ${spec.input} · yazılan ${spec.output} · ${spec.cache} hazır sohbetten · ${spec.requests} model çağrısı`,
  resetsIn: reset => `yenilenme ${reset}`,
  resetsAfter: reset => `${reset} sonra yenilenir`,
  limitFull: label => `${label} doldu`,
  limitAt: (label, value) => `${label}: ${value} kullanıldı`,
  compactFailed: message => `Sohbet özetlenemedi (compact): ${message}`,
  contextTitle: 'Sohbet hafızası (context)',
  other: 'Diğer',
  freeSpace: 'Boş',
  reserve: 'Yedek pay',
  compactNow: 'Şimdi özetle',
  compacting: 'Özetleniyor…',
  noBreakdown: 'Henüz döküm yok.',
  compacted: 'Özetlendi',
  compactedFrom: spec => `Özetlendi: ${spec.before} → ${spec.after}`,
  estimate: (used, total) => `~${used} / ${total}`,
  fullAt: time => `~${time} civarında dolar`,
  fullAtShort: time => `~dolar ${time}`,
  turnsLeft: count => `~${count} tur kaldı`,
  turnsShort: count => `~${count} tur`,
  lastTurns: count => `son ${count} tur`,
  pastTitle: 'Geçmiş',
  activeDays: 'kullanılan gün',
  sessions: 'oturum',
  tokens: 'token',
  tokensApart: cache => `token · ${cache} hazır tutulan`,
  topModel: 'en çok',
  rangeLabel: days => `${days} gün`,
  lastDays: days => `son ${days} gün`,
  pastLine: spec =>
    [`${spec.active}/${spec.range} kullanılan gün`, `${spec.sessions} oturum`, `${spec.tokens} token okunup yazıldı`, `${spec.cache} hazır tutulan`, spec.model === null ? '' : `çoğunlukla ${spec.model}`]
      .filter(part => part !== '')
      .join(' · '),
  dayTokens: (day, tokens) => `${day}: ${tokens} token`,
}

const WORDS: Readonly<Record<Lang, Words>> = { en: EN, tr: TR }

export const words = (): Words => pick(WORDS)
