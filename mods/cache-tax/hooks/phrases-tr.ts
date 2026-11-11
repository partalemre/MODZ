// Every line the mod says, in Turkish (MODZ_LANG=tr). The same entries as phrases-en.ts.

import type { Guard, Phrases, Times } from './phrases-en'

export const TR: Phrases = {
  rateUnknown: 'baştan okuma fiyatı',
  perMillion: (usd: string): string => `milyon token başına $${usd}`,
  guard: (g: Guard): string =>
    (g.share === null
      ? `${g.lead} Bu mesajla Claude sohbetin en fazla ${g.tokens} token'ını ${g.rate} fiyatla baştan okur = ${g.usd}`
      : `${g.lead} Bu mesajla Claude sohbetin en fazla ${g.tokens} token'ını baştan okur: ${g.share} (liste fiyatıyla ${g.usd})`) +
    (g.warm === null ? '' : ` (sohbet hazır tutulurken bir tur ${g.warm} olurdu)`) + '.',
  share: (percent: string, isWeekly: boolean): string => `${isWeekly ? 'haftalık' : '5 saatlik'} kullanım hakkından ≈%${percent}`,
  noPrice: 'bu modelin fiyatı yok',
  coldLead: (ago: string): string => `sohbet ${ago} önce hazır tutulmayı bıraktı (cache).`,
  switchLead: (from: string, to: string): string => `model değişti (${from} → ${to}): Claude tüm sohbeti baştan okur.`,
  dropHeld: (usd: string): string => `cache-tax: mesajın bekletiliyor, kartta seç (sohbet artık hazır tutulmuyor, en fazla ${usd}).`,
  dropSwitched: (usd: string): string => `cache-tax: mesajın bekletiliyor, kartta seç (model değişti, en fazla ${usd}).`,
  drop: (guard: string): string =>
    `cache-tax: ${guard} Ödemek için yeniden gönder; sonra /keepwarm sohbeti hazır tutar. Ya da /clear ile kısa bir notla baştan başla.`,
  warn: (guard: string): string => `${guard} Yine de gönderiliyor; buradan sonra /keepwarm sohbeti hazır tutar.`,
  paidCold: (g: { tokens: string; usd: string }): string =>
    `Claude sohbetin ${g.tokens} token'ını baştan okudu (${g.usd}). Bugün yeniden ödememen için /keepwarm sohbeti hazır tutar.`,
  cap: (pings: number, output: number): string => `; en fazla ${pings} tazeleme, ${output} tokendan fazlasını yazan tazeleme bunu bitirir`,
  paid: (g: { tokens: string; usd: string; auto: string }): string =>
    `Claude sohbetin ${g.tokens} token'ını baştan okudu (${g.usd}). Bugün yeniden ödememen için sohbet ${g.auto} ` +
    'hazır tutuluyor; durdurmak için /keepwarm off.',
  resume: (tokens: string, usd: string): string =>
    `artık hazır tutulmayan bir sohbete dönülüyor. İlk mesajla Claude ${tokens} token'ı baştan okur, yaklaşık ${usd}. ` +
    'Yalnızca sonuçlar gerekiyorsa /clear ile başlayıp bir özet yapıştır.',
  hookTwice: 'eski hook sürümü (cache-tax@claude-code-hooks) da kurulu; mesaj iki kez uyarılır ya da ' +
    'bekletilir. Onu kaldır ya da burada /cache-tax guard warn.',
  forkWaits: 'keepwarm açık, ama henüz tazelenecek bir sohbet yok; sonraki mesajına kadar tazeleme gitmez. ' +
    'Bir mesaj daha gönder, tazelemeler başlasın.',
  firstTurn: ' · ilk tur bekleniyor',
  afterCompact: ' · sohbet özetlendikten sonraki ilk tur bekleniyor',
  coldPing: (every: string): string => ` · artık hazır değil; ilk tazeleme sonraki turdan ${every} sonra`,
  pingIn: (left: string): string => ` · tazeleme ${left} sonra`,
  lastPing: (read: string, usd: string): string => ` · son tazeleme ${read} token okudu, ${usd}`,
  stopped: (why: string): string => `hazır tutma durdu: ${why}`,
  warmFor: (rest: string): string => `hazır tutma: ${rest}`,
  left: (left: string): string => `${left} kaldı`,
  coldNow: (every: string): string => `. Sohbet şu an hazır tutulmuyor; ilk tazeleme sonraki turdan ${every} sonra yapılır`,
  armedCold: (span: string): string => `sohbet ${span} hazır tutulacak`,
  armed: (t: Times): string => `sohbet ${t.span} hazır tutulacak: her duraklamada ${t.every} sonra küçük bir tazeleme ` +
    'onu baştan okutmadan hazır tutar',
  always: (span: string): string =>
    `keepwarm hep açık: her sohbet ${span} hazır tutularak başlar; /keepwarm off kalıcı olarak kapatır`,
  keepwarmCommand: 'Aralarda sohbeti hazır tut (cache), sonraki mesaj daha ucuza gelsin: tek başına 6 saat, 90m gibi bir süre, always (ya da always 24h), off ya da status (cache-tax)',
  cacheTaxCommand: 'Sohbet hâlâ hazır tutuluyor mu, tutulmuyorsa bir mesaj kaça gelir ve bu sohbette kaç kez baştan okundu; guard warn|refuse (cache-tax)',
  keepwarm: {
    off: 'keepwarm kapalı',
    offAlways: 'keepwarm kapalı; sohbet başında artık kendiliğinden açılmayacak',
    usage: 'keepwarm bir süre alır (6h, 90m) ya da always, off, status',
    every: 'every 1m ile 59m arası bir süre alır',
    alwaysUsage: 'always 1h ile 168h arası tek bir süre alır, örneğin always 24h',
  },
  guardMode: {
    usage: '/cache-tax guard warn, refuse ya da refuse 5 gibi dolar sınırlı bir refuse alır',
    floor: (usd: string): string => `koruma: ${usd} ve üstüne gelen mesajı bir kez beklet. Daha ucuzu fiyatı gösterilerek geçer`,
    refuse: 'koruma: mesajı bir kez beklet. Fiyatıyla bekler, yeniden gönderince geçer',
    warn: 'koruma: yalnızca uyar. Mesaj fiyatı gösterilerek geçer',
  },
  labels: { state: 'hazır mı', context: 'hafıza', cost: 'bedel', keepwarm: 'keepwarm', even: 'değer mi', guard: 'koruma', session: 'bu sohbet' },
  noModel: 'model henüz görülmedi',
  compacted: 'sohbet özetlenince baştan başladı, ilk tur bekleniyor',
  noRequest: 'bu sohbette henüz bir şey gönderilmedi',
  coldState: (ago: string): string => `HAYIR, Claude'a son çağrı ${ago} önce`,
  warmState: (left: string): string => `evet, ${left} kaldı`,
  context: (tokens: string): string => `${tokens} token`,
  cost: (usd: string, warm: string): string => `baştan okumak ${usd} (hazırken bir tur ${warm})`,
  on: (line: string): string => `açık, ${line}`,
  stoppedRow: (why: string): string => `durdu, ${why}`,
  offUntilNext: (span: string): string => `sonraki sohbet başına dek kapalı, sonra ${span} açılır (always)`,
  off: (span: string): string => `kapalı (/keepwarm ile ${span} aç)`,
  even: (pings: number, t: Times): string =>
    `${pings} tazeleme, sohbeti bir kez baştan okumakla aynı tutar; ${t.every} arayla tazelersen yaklaşık ${t.span} uzak kalabilirsin`,
  guardRefuse: 'bir kez beklet (/cache-tax guard warn ile yalnızca fiyat göster)',
  guardWarn: 'yalnızca uyar (/cache-tax guard refuse ile bir kez beklet)',
  guardFloor: (usd: string): string => `${usd} ve üstünde bir kez beklet, altında uyar (/cache-tax guard refuse her birini bekletir)`,
  underFloor: (floor: string): string => ` ${floor} sınırının altında olduğu için bekletilmedi.`,
  session: (count: number, usd: string): string => `sohbet ${count} kez baştan okundu, ${usd}`,
}
