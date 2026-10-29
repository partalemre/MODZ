// Every word the person reads from effort-router, in English or in Turkish (MODZ_LANG=tr).
// Read through `words()` when drawing or answering: the language is set at session.start.
import type { EffortMode, RouteClass } from '../types'
import { pick } from './kit/lang'

export type Words = {
  title: string
  hint: string
  command: string
  modeLabel: string
  modeName: Record<EffortMode, string>
  modeLine: Record<EffortMode, string>
  className: Record<RouteClass, string>
  unjudged: string
  noTurns: string
  waiting: string
  continuation: string
  lastN: (count: number) => string
  lastTurns: (count: number) => string
  latest: (effort: string, model: string) => string
  lowered: (from: string) => string
  ago: (ms: number) => string
  off: string
}

const MIN = 60_000
const HOUR = 60 * MIN

const agoOf = (units: { now: string; min: string; hour: string }) => (ms: number): string => {
  if (ms < MIN) return units.now
  if (ms < HOUR) return `${Math.floor(ms / MIN)} ${units.min}`

  return `${Math.floor(ms / HOUR)} ${units.hour}`
}

const EN: Words = {
  title: 'Effort',
  hint: "Each turn's effort and model",
  command: "Open the Effort pane: each turn's effort and model",
  modeLabel: 'Mode',
  modeName: { show: 'Show only', auto: 'Route', off: 'Off' },
  modeLine: {
    show: 'Shows the effort each turn was sent with. No tokens.',
    auto: 'Light prompts go at low effort; the rest keep your setting. One haiku call per prompt.',
    off: 'Effort is neither shown nor changed.',
  },
  className: { light: 'light', normal: 'normal', deep: 'deep' },
  unjudged: '—',
  noTurns: 'No turns yet',
  waiting: 'The next turn shows here.',
  continuation: '(no prompt)',
  lastN: count => `last ${count}`,
  lastTurns: count => `Last ${count} turns`,
  latest: (effort, model) => `${effort} · ${model}`,
  lowered: from => `from ${from}`,
  ago: agoOf({ now: 'now', min: 'min', hour: 'h' }),
  off: 'off',
}

const TR: Words = {
  title: 'Efor',
  hint: 'Her turun eforu ve modeli',
  command: 'Efor panelini aç: her turun eforu ve modeli',
  modeLabel: 'Kip',
  modeName: { show: 'Yalnızca göster', auto: 'Yönlendir', off: 'Kapalı' },
  modeLine: {
    show: 'Her turun hangi eforla gittiğini gösterir. Token harcamaz.',
    auto: 'Hafif istemler düşük eforla gider; gerisi senin ayarında kalır. İstem başına bir haiku çağrısı.',
    off: 'Efor ne gösterilir ne değiştirilir.',
  },
  className: { light: 'hafif', normal: 'olağan', deep: 'derin' },
  unjudged: '—',
  noTurns: 'Henüz tur yok',
  waiting: 'Sıradaki tur burada görünür.',
  continuation: '(istem yok)',
  lastN: count => `son ${count}`,
  lastTurns: count => `Son ${count} tur`,
  latest: (effort, model) => `${effort} · ${model}`,
  lowered: from => `${from} yerine`,
  ago: agoOf({ now: 'şimdi', min: 'dk', hour: 'sa' }),
  off: 'kapalı',
}

export const words = (): Words => pick({ en: EN, tr: TR })
