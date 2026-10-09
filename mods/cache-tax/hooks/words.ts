// Every line the mod says, in Turkish. Command names and their arguments stay English.

import type { CommandSpec } from 'claude-code'

import { AUTO_WARM_MS, DEFAULT_WINDOW_MS, TTL_MS, breakEvenPings, coldUsd, isCold, priceOf, warmUsd } from './core'
import type { State } from './core'
import { fmtDuration, fmtInt, fmtTok, fmtUsd, trDecimal } from './fmt'

export const AUTO_WARM = fmtDuration(AUTO_WARM_MS)

/** How long ago the cache went cold. */
export const coldFor = (s: State, now: number): number => now - s.lastRequestAt - TTL_MS

export function rateText(s: State): string {
  const price = priceOf(s.lastModel)
  return price ? `$${trDecimal(price[1])}/MTok` : 'önbellek yazma fiyatı'
}

export function guardText(s: State, now: number): string {
  const warm = warmUsd(s)
  return `önbellek ${fmtDuration(coldFor(s, now))} önce soğudu. Bu gönderim en fazla ${fmtInt(s.ctx)} token'ı ` +
    `${rateText(s)} fiyatla yeniden yazar = ${fmtUsd(coldUsd(s))}` +
    (warm == null ? '' : ` (sıcak bir tur ${fmtUsd(warm)} olurdu)`) + '.'
}

/** The drop reason. With the band the card says the rest, so the host's line stays short. */
export function dropText(s: State, now: number): string {
  if (s.hasBand) return `cache-tax: mesajın bekletiliyor, kartta seç (soğuk önbellek, en fazla ${fmtUsd(coldUsd(s))}).`
  return `cache-tax: ${guardText(s, now)} Ödemek için yeniden gönder; keepwarm sonra önbelleği ${AUTO_WARM} tutar. ` +
    'Ya da /clear ile bir notla baştan başla.'
}

export const warnText = (s: State, now: number): string =>
  `${guardText(s, now)} Yine de gönderiliyor; keepwarm sonra önbelleği ${AUTO_WARM} tutar.`

export const paidText = (tokens: number, usd: number | null): string =>
  `${fmtTok(tokens)} token soğuk yazım ödendi (${fmtUsd(usd)}). Bugün yeniden ödenmesin diye önbellek ${AUTO_WARM} ` +
  'sıcak tutuluyor; durdurmak için /keepwarm off.'

export const resumeText = (tokens: number, usd: string): string =>
  `soğuk devam ediliyor. İlk mesaj ${fmtInt(tokens)} token'ı yeniden yazar, yaklaşık ${usd}. ` +
  'Yalnızca sonuçlar gerekiyorsa /clear ile başlayıp bir özet yapıştır.'

export const HOOK_TWICE = 'hook sürümü (cache-tax@claude-code-hooks) da kurulu; soğuk gönderim iki kez uyarılır ya da ' +
  'durdurulur. Onu kaldır ya da burada /cache-tax guard warn.'

/** What comes after the time left in the keepwarm line: the next ping, or why there is none yet. */
function nextPingText(s: State, now: number): string {
  if (!s.lastRequestAt) return ' · ilk tur bekleniyor'
  if (s.compacted) return ' · sıkıştırmadan sonraki ilk tur bekleniyor'
  if (isCold(s, now)) return ` · şimdi soğuk, ilk ping sonraki turdan ${fmtDuration(s.every)} sonra`
  return ` · ping ${fmtDuration(s.lastRequestAt + s.every - now)} sonra`
}

export const lastPingText = (s: State): string =>
  s.last ? ` · son ping ${fmtTok(s.last.read)} okudu ${fmtUsd(s.last.usd)}` : ''

/** The keepwarm line: the status fallback, `/keepwarm status` and the card's keepwarm row. */
export function statusText(s: State, now: number): string | undefined {
  if (s.stopped) return `keepwarm durdu: ${s.stopped}`
  if (!s.deadline) return undefined
  return `keepwarm ${fmtDuration(s.deadline - now)} kaldı${nextPingText(s, now)}${lastPingText(s)}`
}

const coldNowText = (s: State): string =>
  `. Önbellek şu an soğuk; ilk ping sonraki turdan ${fmtDuration(s.every)} sonra gelir`

/** The reply to an arming command; on a cold cache it says when the first ping can come. */
export function armedText(s: State, now: number, windowMs: number): string {
  if (isCold(s, now)) return `keepwarm ${fmtDuration(windowMs)} açık${coldNowText(s)}`
  return `keepwarm ${fmtDuration(windowMs)} açık: her boşta kalışın ${fmtDuration(s.every)} sonrasında bir ping ` +
    'önbelleği okur, yeniden yazdırmaz'
}

export const alwaysText = (s: State, now: number): string =>
  `keepwarm hep açık: her oturum ${fmtDuration(DEFAULT_WINDOW_MS)} pencereyle başlar; /keepwarm off kalıcı olarak kapatır` +
  (isCold(s, now) ? coldNowText(s) : '')

/** The two commands as the command list shows them. */
export const COMMANDS: Record<'keepwarm' | 'cacheTax', CommandSpec> = {
  keepwarm: {
    name: 'keepwarm',
    description: 'Önbelleği sıcak tut: tek başına 6 saat, 90m gibi bir süre, always, off ya da status (cache-tax)',
    argumentHint: '[6h | always | off | status]',
    immediate: true,
  },
  cacheTax: {
    name: 'cache-tax',
    description: 'Önbellek durumu, soğuk fiyatı ve bu oturumun soğuk yazımları; guard warn|refuse (cache-tax)',
    argumentHint: '[status | guard warn | guard refuse]',
    immediate: true,
  },
}

export const KEEPWARM = {
  off:'keepwarm kapalı',
  offAlways: 'keepwarm kapalı; oturum başında artık kendiliğinden açılmayacak',
  usage: 'keepwarm bir süre alır (6h, 90m) ya da always, off, status',
  every: 'every en az 1m bir süre alır',
}

export const GUARD = {
  usage: '/cache-tax guard warn ya da refuse alır',
  refuse: 'koruma: bir kez durdur. Soğuk gönderim fiyatıyla bekletilir, yeniden gönderim geçer',
  warn: 'koruma: yalnızca uyar. Soğuk gönderim fiyatı gösterilerek geçer',
}

const row = (label: string, value: string): string => `${label.padEnd(12)}${value}`

function stateRow(s: State, now: number): string {
  if (s.compacted) return 'sıkıştırmayla sıfırlandı, ilk tur bekleniyor'
  if (!s.lastRequestAt) return 'bu oturumda henüz istek yok'
  if (isCold(s, now)) return `SOĞUK, son istek ${fmtDuration(now - s.lastRequestAt)} önce`
  return `sıcak, ${fmtDuration(s.lastRequestAt + TTL_MS - now)} kaldı`
}

function keepwarmRow(s: State, now: number): string {
  const always = s.always ? ' (always)' : ''
  if (s.deadline) return `açık, ${(statusText(s, now) ?? '').replace(/^keepwarm /, '')}${always}`
  if (s.stopped) return `durdu, ${s.stopped}${always}`
  const window = fmtDuration(DEFAULT_WINDOW_MS)
  return s.always ? `sonraki oturum başına dek kapalı, sonra ${window} açılır (always)` : `kapalı (/keepwarm ile ${window} aç)`
}

/** `/cache-tax`: the model, the clock, the price and the session's tally. */
export function cardText(s: State, now: number): string {
  const lines = [s.lastModel ?? 'model henüz görülmedi', row('durum', stateRow(s, now)), row('bağlam', `${fmtInt(s.ctx)} token`)]
  lines.push(row('soğuk bedel', `yeniden yazmak ${fmtUsd(coldUsd(s))} (sıcak tur ${fmtUsd(warmUsd(s))})`))
  lines.push(row('keepwarm', keepwarmRow(s, now)))
  const pings = breakEvenPings(s)
  if (pings != null) {
    lines.push(row('başabaş', `okuma fiyatıyla en fazla ${pings} ping bir soğuk yazıma eder; ${fmtDuration(s.every)} ` +
      `başına bir pingle yaklaşık ${fmtDuration(pings * s.every)} boşta`))
  }
  lines.push(row('koruma', s.guard === 'refuse' ? 'bir kez durdur (/cache-tax guard warn ile yalnızca fiyat göster)'
    : 'yalnızca uyar (/cache-tax guard refuse ile bir kez durdur)'))
  const paid = s.misses.reduce((a, m) => a + (m.usd ?? 0), 0)
  lines.push(row('oturum', `${s.misses.length} soğuk yazım ödendi, ${fmtUsd(paid)}`))
  return lines.join('\n')
}
