// The words drawn on the band (the hold card and the status row) and the reasons keepwarm stops, in both
// languages. Read through `bandWords()` at draw time, after session.start has set the language.

import { pick } from './lang'

const plural = (n: string, one: string, many: string): string => `${n} ${n === '1' ? one : many}`

const EN = {
  eyebrow: 'Cache tax',
  headline: 'Your message is on hold',
  wentCold: (ago: string): string => `The cache went cold ${ago} ago.`,
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
  terminalEyebrow: '● CACHE TAX',
  held: 'Held: ',
  states: { warm: 'warm', cold: 'cold', unknown: 'unknown', stopped: 'stopped' },
  cache: 'Cache · ',
  coldAgo: (ago: string): string => `went cold ${ago} ago`,
  nextUpTo: (usd: string): string => `next message up to ${usd}`,
  goesCold: (left: string): string => `goes cold in ${left}`,
  keepWarm: 'keep it warm with /keepwarm',
  noPing: 'the engine did not send the ping: either the snapshot was cold or the API call failed',
  nothingToFork: 'no conversation to warm yet',
  apiError: (status: string): string => `the API call failed${status}`,
  aborted: 'the ping was cut off',
  noText: 'the ping returned no text',
  pingFailed: (why: string): string => `ping failed: ${why}`,
  gone: (g: { read: string; wrote: string; usd: string }): string =>
    `ping read ${g.read} tokens, wrote ${g.wrote} tokens (${g.usd}); the cache was already gone`,
}

const TR: typeof EN = {
  eyebrow: 'Önbellek vergisi',
  headline: 'Mesajın bekletiliyor',
  wentCold: (ago: string): string => `Önbellek ${ago} önce soğudu.`,
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
  terminalEyebrow: '● ÖNBELLEK VERGİSİ',
  held: 'Bekleyen: ',
  states: { warm: 'sıcak', cold: 'soğuk', unknown: 'bilinmiyor', stopped: 'durdu' },
  cache: 'Önbellek · ',
  coldAgo: (ago: string): string => `${ago} önce soğudu`,
  nextUpTo: (usd: string): string => `sonraki mesaj en fazla ${usd}`,
  goesCold: (left: string): string => `${left} içinde soğuyacak`,
  keepWarm: '/keepwarm ile sıcak tut',
  noPing: 'motor pingi göndermedi: ya anlık görüntü soğuktu ya da API çağrısı başarısız oldu',
  nothingToFork: 'ısıtılacak konuşma henüz yok',
  apiError: (status: string): string => `API çağrısı başarısız${status}`,
  aborted: 'ping yarıda kesildi',
  noText: 'ping metin döndürmedi',
  pingFailed: (why: string): string => `ping başarısız: ${why}`,
  gone: (g: { read: string; wrote: string; usd: string }): string =>
    `ping ${g.read} token okudu, ${g.wrote} token yazdı (${g.usd}); önbellek zaten gitmişti`,
}

export const bandWords = (): typeof EN => pick({ en: EN, tr: TR })
