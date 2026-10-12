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
export type Units = { decimalMark: string; percent: (rounded: number) => string; full: string; day: string; hour: string; minute: string }

const UNITS: Readonly<Record<Lang, Units>> = {
  en: { decimalMark: '.', percent: rounded => `${rounded}%`, full: 'full', day: 'd', hour: 'h', minute: 'm' },
  tr: { decimalMark: ',', percent: rounded => `%${rounded}`, full: 'dolu', day: 'g', hour: 'sa', minute: 'dk' },
}

export const units = (): Units => pick(UNITS)

// English counts: "1 reading", "3 readings".
const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`
const nouns = (count: number, one: string): string => (count === 1 ? one : `${one}s`)

type TurnSpec = { input: string; output: string; cache: string; requests: number }
type FreeSpec = { tokens: string; count: number }

type Words = {
  paneTitle: string
  limits: string
  eyebrow: string
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
}

const EN: Words = {
  paneTitle: 'Usage',
  limits: 'Limits',
  eyebrow: 'HUD · usage',
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
}

const TR: Words = {
  paneTitle: 'Kullanım',
  limits: 'Limitler',
  eyebrow: 'HUD · kullanım',
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
}

const WORDS: Readonly<Record<Lang, Words>> = { en: EN, tr: TR }

export const words = (): Words => pick(WORDS)
