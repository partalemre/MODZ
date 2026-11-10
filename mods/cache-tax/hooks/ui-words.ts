// The words drawn on the band (the hold card and the status row) and the reasons keepwarm stops, in both
// languages. Read through `bandWords()` at draw time, after session.start has set the language.

import { pick } from './lang'

const plural = (n: string, one: string, many: string): string => `${n} ${n === '1' ? one : many}`

const EN = {
  name: 'Cache tax',
  headline: 'Your message is on hold',
  wentCold: (ago: string): string => `The cache went cold ${ago} ago.`,
  switched: (from: string, to: string): string[] =>
    [`Model changed (${from} → ${to}): the cache will be rewritten.`, `Model changed: ${from} → ${to}.`],
  sendNow: 'Send now',
  warmTurn: 'A warm turn',
  warmCaptions: (times: number | null): string[] =>
    (times === null ? ['had it been warm'] : [`had it been warm · ${times}× cheaper`, `${times}× cheaper`]),
  tokens: (tokens: string): string => `~${plural(tokens, 'token', 'tokens')}`,
  rewritten: (rate: string): string[] => [`rewritten · ${rate}`, 'rewritten'],
  keep: (auto: string): string => `Pay once and keepwarm holds the cache for ${auto}.`,
  pay: { label: 'Pay and send', hotkey: 'p' },
  fresh: { label: 'Start fresh', hotkey: 'n' },
  status: { label: 'Cache status', hotkey: 's' },
  alt: (cold: string, warm: string): string => `Cache tax: your message is on hold. Send now ${cold}, a warm turn ${warm}.`,
  held: 'Held: ',
  states: { warm: 'warm', cold: 'cold', unknown: 'unknown', stopped: 'stopped' },
  cache: 'Cache · ',
  coldAgo: (ago: string): string => `went cold ${ago} ago`,
  nextUpTo: (usd: string): string => `next message up to ${usd}`,
  goesCold: (left: string): string => `goes cold in ${left}`,
  keepWarm: 'keep it warm with /keepwarm',
  noPing: 'could not keep the cache warm: it had already gone cold, or Claude could not be reached',
  nothingToFork: 'no conversation to warm yet',
  apiError: (status: string): string => `Claude could not be reached${status}`,
  aborted: 'the refresh was cut off',
  noText: 'the refresh got no reply',
  pingFailed: (why: string): string => `the refresh failed: ${why}`,
  share: (share: string): string => `Sending now takes ${share} at this session’s pace`,
  capReached: (pings: number): string => `${pings} refreshes, the most one window sends; /keepwarm starts another`,
  tooLong: (tokens: number): string => `a refresh wrote ${tokens} output tokens, over the cap`,
  gone: (g: { read: string; wrote: string; usd: string }): string =>
    `the refresh read ${g.read} tokens and rewrote ${g.wrote} tokens (${g.usd}); the cache had already gone cold`,
}

const TR: typeof EN = {
  name: 'Önbellek vergisi',
  headline: 'Mesajın bekletiliyor',
  wentCold: (ago: string): string => `Önbellek ${ago} önce soğudu.`,
  switched: (from: string, to: string): string[] =>
    [`Model değişti (${from} → ${to}): önbellek yeniden yazılacak.`, `Model değişti: ${from} → ${to}.`],
  sendNow: 'Şimdi gönder',
  warmTurn: 'Sıcak bir tur',
  warmCaptions: (times: number | null): string[] =>
    (times === null ? ['olurdu'] : [`sıcakken olurdu · ${times} kat ucuz`, `${times} kat ucuz`]),
  tokens: (tokens: string): string => `~${tokens} token`,
  rewritten: (rate: string): string[] => [`yeniden yazılır · ${rate}`, 'yeniden yazılır'],
  keep: (auto: string): string => `Bir kez öde, keepwarm önbelleği ${auto} tutsun.`,
  pay: { label: 'Öde ve gönder', hotkey: 'o' },
  fresh: { label: 'Yeni başla', hotkey: 'y' },
  status: { label: 'Önbellek durumu', hotkey: 'd' },
  alt: (cold: string, warm: string): string => `Önbellek vergisi: mesajın bekletiliyor. Şimdi gönder ${cold}, sıcak bir tur ${warm}.`,
  held: 'Bekleyen: ',
  states: { warm: 'sıcak', cold: 'soğuk', unknown: 'bilinmiyor', stopped: 'durdu' },
  cache: 'Önbellek · ',
  coldAgo: (ago: string): string => `${ago} önce soğudu`,
  nextUpTo: (usd: string): string => `sonraki mesaj en fazla ${usd}`,
  goesCold: (left: string): string => `${left} içinde soğuyacak`,
  keepWarm: '/keepwarm ile sıcak tut',
  noPing: 'önbellek sıcak tutulamadı: ya zaten soğumuştu ya da Claude\'a ulaşılamadı',
  nothingToFork: 'sıcak tutulacak konuşma henüz yok',
  apiError: (status: string): string => `Claude'a ulaşılamadı${status}`,
  aborted: 'tazeleme yarıda kesildi',
  noText: 'tazeleme yanıt almadı',
  pingFailed: (why: string): string => `tazeleme başarısız: ${why}`,
  share: (share: string): string => `Şimdi göndermek bu oturumun hızıyla ${share} tutar`,
  capReached: (pings: number): string => `${pings} tazeleme, bir pencerenin en fazlası; /keepwarm yenisini başlatır`,
  tooLong: (tokens: number): string => `bir tazeleme ${tokens} çıktı tokenı yazdı, sınırın üstünde`,
  gone: (g: { read: string; wrote: string; usd: string }): string =>
    `tazeleme ${g.read} token okudu, ${g.wrote} token baştan yazdı (${g.usd}); önbellek zaten soğumuştu`,
}

export const bandWords = (): typeof EN => pick({ en: EN, tr: TR })
