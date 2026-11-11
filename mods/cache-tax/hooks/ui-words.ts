// The words drawn on the band (the hold card and the status row) and the reasons keepwarm stops, in both
// languages. Read through `bandWords()` at draw time, after session.start has set the language.

import { pick } from './lang'

const plural = (n: string, one: string, many: string): string => `${n} ${n === '1' ? one : many}`

const EN = {
  name: 'Re-read cost',
  headline: 'Your message is on hold',
  wentCold: (ago: string): string => `The chat stopped being kept ready ${ago} ago.`,
  switched: (from: string, to: string): string[] =>
    [`Model changed (${from} → ${to}): Claude reads the whole chat again.`, `Model changed: ${from} → ${to}.`],
  sendNow: 'Send now',
  warmTurn: 'A usual turn',
  warmCaptions: (times: number | null): string[] =>
    (times === null ? ['while the chat is kept ready'] : [`while the chat is kept ready · ${times}× cheaper`, `${times}× cheaper`]),
  tokens: (tokens: string): string => `~${plural(tokens, 'token', 'tokens')}`,
  rewritten: (rate: string): string[] => [`read again in full · ${rate}`, 'read again in full'],
  keep: (auto: string): string => `Pay once, and keepwarm keeps the chat ready for ${auto}.`,
  pay: { label: 'Pay and send', hotkey: 'p' },
  fresh: { label: 'Start fresh', hotkey: 'n' },
  status: { label: 'Show status', hotkey: 's' },
  alt: (cold: string, warm: string): string => `Re-read cost: your message is on hold. Send now ${cold}, a usual turn ${warm}.`,
  held: 'Held: ',
  states: { warm: 'ready', cold: 'expired', unknown: 'unknown', stopped: 'stopped' },
  cache: 'Chat · ',
  coldAgo: (ago: string): string => `${ago} ago`,
  nextUpTo: (usd: string): string => `next message up to ${usd}`,
  goesCold: (left: string): string => `expires in ${left}`,
  keepWarm: 'keep it ready with /keepwarm',
  noPing: 'could not keep the chat ready: it had already expired, or Claude could not be reached',
  nothingToFork: 'no chat to keep ready yet',
  apiError: (status: string): string => `Claude could not be reached${status}`,
  aborted: 'the refresh was cut off',
  noText: 'the refresh got no answer',
  pingFailed: (why: string): string => `the refresh failed: ${why}`,
  share: (share: string): string => `Sending now takes ${share} at this chat’s pace`,
  capReached: (pings: number): string => `${pings} refreshes, the most one stretch sends; /keepwarm starts another`,
  tooLong: (tokens: number): string => `a refresh wrote ${tokens} tokens, more than allowed`,
  gone: (g: { read: string; wrote: string; usd: string }): string =>
    `the refresh read ${g.read} tokens and had to read ${g.wrote} tokens again in full (${g.usd}); the chat had already expired`,
  // The Usage pane's section (section.ts).
  section: 'Chat kept ready',
  sectionEmpty: 'No answer yet. After each answer Claude keeps the chat ready (cache) for an hour, so the next message costs less; once the first answer arrives this shows whether it is still ready, the time left, what a message costs once it is not, and keepwarm.',
  listPrice: '$ are estimates at list prices; on a subscription the share of your usage allowance is what counts.',
}

const TR: typeof EN = {
  name: 'Baştan okuma bedeli',
  headline: 'Mesajın bekletiliyor',
  wentCold: (ago: string): string => `Sohbet ${ago} önce hazır tutulmayı bıraktı.`,
  switched: (from: string, to: string): string[] =>
    [`Model değişti (${from} → ${to}): Claude tüm sohbeti baştan okur.`, `Model değişti: ${from} → ${to}.`],
  sendNow: 'Şimdi gönder',
  warmTurn: 'Olağan bir tur',
  warmCaptions: (times: number | null): string[] =>
    (times === null ? ['sohbet hazırken'] : [`sohbet hazırken · ${times} kat ucuz`, `${times} kat ucuz`]),
  tokens: (tokens: string): string => `~${tokens} token`,
  rewritten: (rate: string): string[] => [`baştan okunur · ${rate}`, 'baştan okunur'],
  keep: (auto: string): string => `Bir kez öde, keepwarm sohbeti ${auto} hazır tutsun.`,
  pay: { label: 'Öde ve gönder', hotkey: 'o' },
  fresh: { label: 'Yeni başla', hotkey: 'y' },
  status: { label: 'Durumu göster', hotkey: 'd' },
  alt: (cold: string, warm: string): string => `Baştan okuma bedeli: mesajın bekletiliyor. Şimdi gönder ${cold}, olağan bir tur ${warm}.`,
  held: 'Bekleyen: ',
  states: { warm: 'hazır', cold: 'süresi doldu', unknown: 'bilinmiyor', stopped: 'durdu' },
  cache: 'Sohbet · ',
  coldAgo: (ago: string): string => `${ago} önce`,
  nextUpTo: (usd: string): string => `sonraki mesaj en fazla ${usd}`,
  goesCold: (left: string): string => `${left} sonra süresi dolar`,
  keepWarm: '/keepwarm ile hazır tut',
  noPing: 'sohbet hazır tutulamadı: ya süresi zaten dolmuştu ya da Claude\'a ulaşılamadı',
  nothingToFork: 'hazır tutulacak sohbet henüz yok',
  apiError: (status: string): string => `Claude'a ulaşılamadı${status}`,
  aborted: 'tazeleme yarıda kesildi',
  noText: 'tazeleme yanıt almadı',
  pingFailed: (why: string): string => `tazeleme başarısız: ${why}`,
  share: (share: string): string => `Şimdi göndermek bu sohbetin hızıyla ${share} tutar`,
  capReached: (pings: number): string => `${pings} tazeleme, bir seferde gidebilecek en fazlası; /keepwarm yenisini başlatır`,
  tooLong: (tokens: number): string => `bir tazeleme ${tokens} token yazdı, izin verilenden fazla`,
  gone: (g: { read: string; wrote: string; usd: string }): string =>
    `tazeleme ${g.read} token okudu, ${g.wrote} tokenı baştan okumak zorunda kaldı (${g.usd}); sohbetin süresi zaten dolmuştu`,
  section: 'Hazır sohbet',
  sectionEmpty: 'Henüz yanıt yok. Claude her yanıttan sonra sohbeti bir saat hazır tutar (cache), sonraki mesaj daha ucuza gelir; ilk yanıt gelince burada hâlâ hazır mı, kalan süre, hazır değilken bir mesajın kaça geleceği ve keepwarm görünür.',
  listPrice: '$ tutarları liste fiyatıyla tahmindir; abonelikte asıl ölçü kullanım hakkından alınan paydır.',
}

export const bandWords = (): typeof EN => pick({ en: EN, tr: TR })
