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
  // The band's line after a lowered turn, and its button.
  loweredBand: (sent: string, asked: string) => string
  resend: (asked: string) => string
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
  title: 'Thinking level',
  hint: 'How hard Claude thought each turn, and the model',
  command: 'Open the Thinking level panel: how hard Claude thought on each turn (effort) and which model answered',
  modeLabel: 'Mode',
  modeName: { show: 'Show only', auto: 'Auto', off: 'Off' },
  modeLine: {
    show: 'Shows the thinking level each turn was sent with. Uses no tokens.',
    auto: 'Simple messages go at a low thinking level; the rest keep your setting. A small model (Haiku) reads each message to decide: one call per message.',
    off: 'The thinking level is neither shown nor changed.',
  },
  className: { light: 'light', normal: 'normal', deep: 'deep' },
  unjudged: '—',
  noTurns: 'No turns yet',
  waiting: 'The next turn shows here.',
  continuation: '(no message)',
  lastN: count => `last ${count}`,
  lastTurns: count => `Last ${count} turns`,
  latest: (effort, model) => `${effort} · ${model}`,
  lowered: from => `from ${from}`,
  loweredBand: (sent, asked) => `Sent at ${sent} thinking (yours: ${asked}): it looked simple`,
  resend: asked => `Re-send at ${asked}`,
  ago: agoOf({ now: 'now', min: 'min', hour: 'h' }),
  off: 'off',
}

const TR: Words = {
  title: 'Düşünme düzeyi',
  hint: 'Claude her turda ne kadar düşündü, hangi model',
  command: 'Düşünme düzeyi panelini aç: Claude her turda ne kadar düşündü (effort) ve hangi model yanıtladı',
  modeLabel: 'Kip',
  modeName: { show: 'Yalnızca göster', auto: 'Otomatik', off: 'Kapalı' },
  modeLine: {
    show: 'Her turun hangi düşünme düzeyiyle gittiğini gösterir. Token harcamaz.',
    auto: 'Basit mesajlar düşük düşünme düzeyiyle gider; gerisi senin ayarında kalır. Karar için küçük bir model (Haiku) her mesajı okur: mesaj başına bir çağrı.',
    off: 'Düşünme düzeyi ne gösterilir ne değiştirilir.',
  },
  className: { light: 'hafif', normal: 'olağan', deep: 'derin' },
  unjudged: '—',
  noTurns: 'Henüz tur yok',
  waiting: 'Sıradaki tur burada görünür.',
  continuation: '(mesaj yok)',
  lastN: count => `son ${count}`,
  lastTurns: count => `Son ${count} tur`,
  latest: (effort, model) => `${effort} · ${model}`,
  lowered: from => `${from} yerine`,
  loweredBand: (sent, asked) => `${sent} düşünmeyle gönderildi (seninki: ${asked}): basit göründü`,
  resend: asked => `${asked} ile yeniden gönder`,
  ago: agoOf({ now: 'şimdi', min: 'dk', hour: 'sa' }),
  off: 'kapalı',
}

export const words = (): Words => pick({ en: EN, tr: TR })
