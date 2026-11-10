// Every line the mod says, in Turkish (MODZ_LANG=tr). The same entries as phrases-en.ts.

import type { Guard, Phrases, Times } from './phrases-en'

export const TR: Phrases = {
  rateUnknown: 'önbellek yazma fiyatı',
  guard: (g: Guard): string =>
    `${g.lead} Bu gönderim en fazla ${g.tokens} token'ı ${g.rate} fiyatla yeniden yazar = ${g.usd}` +
    (g.warm === null ? '' : ` (sıcak bir tur ${g.warm} olurdu)`) + '.',
  coldLead: (ago: string): string => `önbellek ${ago} önce soğudu.`,
  switchLead: (from: string, to: string): string => `model değişti (${from} → ${to}): önbellek yeniden yazılacak.`,
  dropHeld: (usd: string): string => `cache-tax: mesajın bekletiliyor, kartta seç (soğuk önbellek, en fazla ${usd}).`,
  dropSwitched: (usd: string): string => `cache-tax: mesajın bekletiliyor, kartta seç (model değişti, en fazla ${usd}).`,
  drop: (guard: string, auto: string): string =>
    `cache-tax: ${guard} Ödemek için yeniden gönder; keepwarm sonra önbelleği ${auto} tutar. ` +
    'Ya da /clear ile bir notla baştan başla.',
  warn: (guard: string, auto: string): string => `${guard} Yine de gönderiliyor; keepwarm sonra önbelleği ${auto} tutar.`,
  paid: (g: { tokens: string; usd: string; auto: string }): string =>
    `${g.tokens} token önbelleğe baştan yazıldı (${g.usd}). Bugün yeniden ödenmesin diye önbellek ${g.auto} ` +
    'sıcak tutuluyor; durdurmak için /keepwarm off.',
  resume: (tokens: string, usd: string): string =>
    `soğuk devam ediliyor. İlk mesaj ${tokens} token'ı yeniden yazar, yaklaşık ${usd}. ` +
    'Yalnızca sonuçlar gerekiyorsa /clear ile başlayıp bir özet yapıştır.',
  hookTwice: 'hook sürümü (cache-tax@claude-code-hooks) da kurulu; soğuk gönderim iki kez uyarılır ya da ' +
    'durdurulur. Onu kaldır ya da burada /cache-tax guard warn.',
  forkWaits: 'keepwarm açık, ama henüz tazelenecek bir konuşma yok; sonraki mesajına kadar tazeleme gitmez. ' +
    'Bir mesaj daha gönder, tazelemeler başlasın.',
  firstTurn: ' · ilk tur bekleniyor',
  afterCompact: ' · sıkıştırmadan sonraki ilk tur bekleniyor',
  coldPing: (every: string): string => ` · şimdi soğuk; ilk tazeleme sonraki turdan ${every} sonra`,
  pingIn: (left: string): string => ` · tazeleme ${left} sonra`,
  lastPing: (read: string, usd: string): string => ` · son tazeleme ${read} token okudu, ${usd}`,
  stopped: (why: string): string => `sıcak tutma durdu: ${why}`,
  warmFor: (rest: string): string => `sıcak tutma: ${rest}`,
  left: (left: string): string => `${left} kaldı`,
  coldNow: (every: string): string => `. Önbellek şu an soğuk; ilk tazeleme sonraki turdan ${every} sonra yapılır`,
  armedCold: (span: string): string => `önbellek ${span} sıcak tutulacak`,
  armed: (t: Times): string => `önbellek ${t.span} sıcak tutulacak: her duraklamada ${t.every} sonra küçük bir tazeleme ` +
    'önbelleği okur, baştan yazdırmaz',
  always: (span: string): string =>
    `keepwarm hep açık: her oturum ${span} pencereyle başlar; /keepwarm off kalıcı olarak kapatır`,
  keepwarmCommand: 'Önbelleği sıcak tut: tek başına 6 saat, 90m gibi bir süre, always (ya da always 24h), off ya da status (cache-tax)',
  cacheTaxCommand: 'Önbellek durumu, soğuyunca ödenen fiyat ve bu oturumda kaç kez baştan yazıldığı; guard warn|refuse (cache-tax)',
  keepwarm: {
    off: 'keepwarm kapalı',
    offAlways: 'keepwarm kapalı; oturum başında artık kendiliğinden açılmayacak',
    usage: 'keepwarm bir süre alır (6h, 90m) ya da always, off, status',
    every: 'every 1m ile 59m arası bir süre alır',
    alwaysUsage: 'always 1h ile 168h arası tek bir pencere alır, örneğin always 24h',
  },
  guardMode: {
    usage: '/cache-tax guard warn, refuse ya da refuse 5 gibi dolar sınırlı bir refuse alır',
    floor: (usd: string): string => `koruma: ${usd} ve üstünde bir kez durdur. Daha ucuz soğuk gönderim fiyatı gösterilerek geçer`,
    refuse: 'koruma: bir kez durdur. Soğuk gönderim fiyatıyla bekletilir, yeniden gönderim geçer',
    warn: 'koruma: yalnızca uyar. Soğuk gönderim fiyatı gösterilerek geçer',
  },
  labels: { state: 'durum', context: 'bağlam', cost: 'soğuk bedel', keepwarm: 'keepwarm', even: 'başabaş', guard: 'koruma', session: 'oturum' },
  noModel: 'model henüz görülmedi',
  compacted: 'sıkıştırmayla sıfırlandı, ilk tur bekleniyor',
  noRequest: 'bu oturumda henüz istek yok',
  coldState: (ago: string): string => `SOĞUK, son istek ${ago} önce`,
  warmState: (left: string): string => `sıcak, ${left} kaldı`,
  context: (tokens: string): string => `${tokens} token`,
  cost: (usd: string, warm: string): string => `yeniden yazmak ${usd} (sıcak tur ${warm})`,
  on: (line: string): string => `açık, ${line}`,
  stoppedRow: (why: string): string => `durdu, ${why}`,
  offUntilNext: (span: string): string => `sonraki oturum başına dek kapalı, sonra ${span} açılır (always)`,
  off: (span: string): string => `kapalı (/keepwarm ile ${span} aç)`,
  even: (pings: number, t: Times): string =>
    `${pings} tazeleme, önbelleği baştan yazmakla aynı tutar; ${t.every} arayla tazelersen yaklaşık ${t.span} boşta kalabilirsin`,
  guardRefuse: 'bir kez durdur (/cache-tax guard warn ile yalnızca fiyat göster)',
  guardWarn: 'yalnızca uyar (/cache-tax guard refuse ile bir kez durdur)',
  guardFloor: (usd: string): string => `${usd} ve üstünde bir kez durdur, altında uyar (/cache-tax guard refuse her birini durdurur)`,
  underFloor: (floor: string): string => ` ${floor} sınırının altında olduğu için bekletilmedi.`,
  session: (count: number, usd: string): string => `önbellek ${count} kez baştan yazıldı, ${usd}`,
}
