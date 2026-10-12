# MODZ tasarım dili v2 — "Tidemark"

Bütün modlar tek bir ürün gibi görünür. Ana yüzey Claude masaüstü uygulamasının **Code sekmesi** (`desktop`);
terminal (`terminal`) aynı bilgiyi metinle verir. Kaynaklar: [design/RESEARCH.md](design/RESEARCH.md) (internet
araştırması, Tidemark önerisi) ve [design/video/](design/video/) (videodaki 9 modun kare kare ölçümü).
Hedef: videodaki kalite, ama kopya değil — özgün çizim, aynı zenginlik.

## 1. İlkeler
1. **Zengin ama sakin.** Kart, ikon kutusu, büyük başlık, etiket, ölçer — ama ekranda aynı anda tek vurgu.
   Neon, ışıma (glow), gökkuşağı, emoji yok. Videodaki turuncu odak halkaları kurgu efektidir, kopyalanmaz.
2. **Dürüst sayı.** Ölçülemeyen değer gösterilmez ("—"); tahmin `~` ile işaretlenir ve dayanağı yoksa çizilmez.
   Bayat veri text.lo + "· 3 dk önce".
3. **Sıfır token varsayılan.** `$.model` yalnızca özelliğin özü gerektiriyorsa (reflect), en ucuz model, olay başına ≤1.
4. **Sakin davranış.** Kendiliğinden açılan tek panel MODZ ana panelidir (§9); başka hiçbir mod paneli kendi açılmaz,
   odak çalmaz, rutin olay için toast atmaz. Komutu kullanıcı adına çalıştırmak (`$.command.run`) yasak: transkripte balon düşer.
5. **İki dil.** Arayüz varsayılan İngilizce, `MODZ_LANG=tr` ile Türkçe (`kit/lang.ts`: `pick`, `upper`). Kısa, cümle düzeni;
   komut adları İngilizce. Büyük harfli etiketler `upper()` ile: Türkçede İ korunur, İngilizcede hiç çıkmaz.

## 2. Renk (hex, iki tema)
Svg içinde iki palet `<style>` + `@media (prefers-color-scheme: …)` ile; Box/Text hex'i kit'teki `palette(isLight)`
ile seçilir (tema: Claude `theme` ayarı → sistem görünümü; skins'in `resolveLight` mantığı).

| Token | Koyu | Açık | Kullanım |
|---|---|---|---|
| sheet | #191917 | #F4F2EC | panel/pane zemini (host ≈ #151515 / #FAF9F5) |
| card | #1F1F1C | #FFFFFF | kart dolgusu |
| inset | #171715 | #F6F4EF | kart içi gömme alan (karşılaştırma, kod) |
| line | #2E2E2A | #E4E0D6 | kart kenarı, ayraç |
| line.strong | #45443F | #CFC9BC | seçili satır kenarı, input |
| track | #34332F | #ECE8DF | ölçer izi |
| text.hi | #F0EEE8 | #1C1B19 | başlık, değer |
| text.mid | #C2BEB4 | #4F4B44 | gövde |
| text.lo | #8E8A80 | #706B63 | meta |

Rol renkleri (`fg` · `tint` · `line`), her biri kart üstünde ≥4.5:1:

| Rol | Koyu | Açık | Anlam |
|---|---|---|---|
| read · Tide | #7FB6E8 · #1E2B37 · #2F4A63 | #2464A0 · #E7F0F9 · #B9D3EC | okuma, bilgi |
| edit · Kiln (marka) | #E58A5F · #38251D · #6A3E2D | #A94A26 · #FBEDE6 · #EFC6B4 | Claude dokundu, düzenleme |
| run · Iris | #B19CF3 · #29243D · #4A3F75 | #6243C4 · #F0ECFC · #CFC3F3 | çalışan iş, ajan, komut |
| ok · Moss | #6FC593 · #1B2F25 · #2F5A42 | #1F6E43 · #E4F4EA · #B5DEC4 | başarı, commit, sıcak |
| warn · Amber | #E9B949 · #332D19 · #66552A | #8A6000 · #FBF2D9 · #EBD48F | dikkat, para, bekliyor |
| danger · Flare | #F2727F · #3B2023 · #74343C | #C0263A · #FCE8EA · #F1B9C0 | geri alınamaz, sızıntı |
| plan · Orchid | #E07BC0 · #351F2E · #6B3A5C | #A8337F · #FBE9F4 · #EDBFDC | plan adımı, tekrar |

Dosya rozetleri (yumuşak, tür başına): ts/js Amber, py Tide, md/txt Iris-soluk, json/csv/yaml Moss, pdf Flare,
img Orchid, sh/git text.lo. Etkinlik rengi (okuma/düzenleme) satırda rozetin üstüne geçer.

Terminal eşlemesi: read→`suggestion`, edit→`claude`, run→`permission`, ok→`success`, warn→`warning`,
danger→`error`, plan→`merged`, meta→`dimColor`.

## 3. Tipografi (Svg) ve metin (Text)
Svg font: `-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, system-ui`; sayılar `ui-monospace, "SF Mono"`, tabular.
- **Display** 24/650 — fiyat, büyük sayı (stat kutusu, "$0.52").
- **Headline** 17/620 — kart başlığı ("Mesajın bekletiliyor"), pane başlığı.
- **Title** 14/600 — satır başlığı, ajan adı.
- **Eyebrow** 10.5/700, +0.10em, BÜYÜK HARF, rol rengi — her kart bununla açılır.
- **Label** 12/500 · **Micro** 10.5/500 (tick, birim).
Text ile: başlık = bold text.hi · gövde = text.mid · meta = text.lo · vurgu = highlight span (tint zemin + fg).
İtalik yalnızca kullanıcıdan alıntıda; üstü çizili yalnızca geri alınan/silinen işte.

## 4. Bileşenler (kit: `hooks/kit/`, her modda aynı kopya)
- **Kart:** Box `borderStyle="round"`, `borderColor=line` (rol kartında role.line), `backgroundColor=card`,
  `paddingX 2, paddingY 1, gap 1`. Sıra: başlık bloğu (ikon kutusu + eyebrow + headline + meta sağda) →
  gövde → düğme sırası. Kararlı/riskli işlemde (blast-radius, secret-guard) kenar `single` + Flare.line.
- **İkon kutusu:** Svg 32–38px yuvarlak kare (rx 9) role.tint zemin, 18px çizgi ikon (stroke 1.75, role.fg).
  İkonlar kit'te özgün çizim: trash, shield, key, eye, pencil, check, x, clock, cube, bookmark, bulb, play,
  pause, folder, file, branch, terminal, bell, sparkle, list, flag, bolt, gauge, rewind, plug.
- **Eyebrow satırı:** Svg h16: (ops. 6px nokta) + BÜYÜK HARF etiket + sağda meta ("%95 emin", "2 dk önce").
- **Stat kutusu:** Svg ~120×58 rx 10, inset zemin: eyebrow, Display değer, birim; ops. ince alan grafiği.
- **Pill:** Svg h20 rx 10, tint zemin + line kenar + fg 11/600 ("Okunuyor", "Commit", "3/5").
- **Ölçer:** iz h4 (kahraman h6) + dolgu + **tempo çentiği** (beklenen yer, 1×10 text.mid). Renk: tempoda nötr,
  >%10 öndeyse Amber, ≥%95 Flare. %100'ü asla aşmaz ("dolu").
- **Halka (segmentli yay):** 270°, 20 segment, 44px (band) / 72px (pane); ortada değer.
- **Adım noktaları:** 8px noktalar ince çizgiyle bağlı: bitti Moss dolu ✓, aktif Iris/Orchid halka + nefes alan
  çekirdek, bekleyen line.strong halka, hata Flare ✕.
- **Numaralı adım dairesi** (replay/plan): 22px daire; şimdiki = rol dolgu + beyaz sayı, biten = gri ✓, gelecek = halka.
- **Dosya rozeti:** Svg 26×16 rx 4, tür rengi tint + fg 9.5/700 mono ("TS", "PDF").
- **Boyut çubuğu:** 96×6 rx 3, toplam üzerinden oran (en büyük satır değil).
- **Highlight span:** Text `backgroundColor=role.tint`, `color=role.fg`, bold değil.
- **Düğme sırası:** en fazla bir `primary` (önerilen yol), sonra `secondary`, en sonda `plain` ("Şimdi değil").
  Tehlikede güvenli seçenek odakta (`autoFocus`), yıkıcı düğme fiil + nesne ("9 dosyayı sil") ve harf kısayolu.
- **Maskot:** savvy-progress yengeçleri (asıl moddan) ajan kimliğidir; başka modda maskot yok, tehlike kartında asla.
- **Durumlar:** boş = eyebrow + tek cümle + tek eylem · yükleniyor = 1.4s parıltılı iskelet (azaltılmış harekette sabit) ·
  hata = Flare kart, "HATA" eyebrow, tek satır neden, "Tekrar dene".

## 5. Hareket
Kısa 120ms (hover) · durum 200ms · yol 320ms `cubic-bezier(.2,.8,.2,1)` · nefes 1.8s · parıltı 1.4s.
Yüzey başına tek döngü animasyonu; iş bitince durur. Her Svg `<style>` sonu:
`@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}`.
Terminal spinner `◐◓◑◒` ≥250ms/kare, yalnızca aktif satırda.

## 6. Prompt üstü bant (AbovePrompt) sözleşmesi
Her hook `next(e)` çağırır ve kendi satırını `theirs` ile birleştirir; asla yutmaz.
`e.props.hasSurvey` doluyken (soru penceresi açık) yalnızca `next(e)` döner.
Sıra (yukarıdan aşağı):
1. **Karar kartları** (yerleşmezse): blast-radius bant yedeği, cache-tax bekletme kartı → `theirs`'in **üstü**.
2. **Bildirimler** (aynı anda tek): reflect, replay teklifi, test-badge, session-budget, done-ping yedeği → üstü.
3. **İlerleme**: savvy-progress (yalnızca tur sürerken) → üstü.
4. **Durum satırları**: cache-tax durum satırı, hud-pro (en altta, prompt'a bitişik) → `theirs`'in **altı**.
Kullanım bilgisi tek yerde: hud-pro. skins'in kullanım bandı varsayılan kapalı (`/skin` ayarından açılır).
cache-tax durum satırı yalnızca anlamlıyken: keepwarm açık, ≤10 dk içinde soğuyacak ya da soğuk.

## 7. Yüzeyler
- **desktop:** Box/Text/Button + Svg (büyük başlık, eyebrow, ikon, ölçer, halka, rozet, maskot). Svg genişliği
  `e.props.bodyColumns`/viewport'tan hesaplanır, taşmaz.
- **terminal:** aynı ağaç, Svg yerine metin: eyebrow → `● ETİKET` rol renginde, ölçer → `━━━━╸┊───`,
  ikon kutusu → tek glyph. Her UI testi iki yüzeyde koşar.

## 8. Kod kuralları
Dosya ≤300 satır, fonksiyon ≤40 satır, ≤3 parametre, sihirli sayı yok, boş catch yok. Davranış testi;
`claude plugin validate` + `claude plugin test` yeşil. Görsel değişiklikte `bin/preview <mod>` ile PNG'ye bak:
`tests/preview.test.tsx` her durum için `console.log('@@TREE@@<etiket>@@' + JSON.stringify(await ui.drawn()))` yazar.
Asıl (upstream) modlarda: kaynak belirt (README "Dayandığı proje"), LICENSE'ı koru, davranışı bozma.

## 9. MODZ ana paneli ve mod veri yolu
Oturum açılınca sağda **tek** panel açık gelir: `modz` modunun "MODZ" paneli. Her özellik oradan bir tıkla açılır.
Modlar birbirini doğrudan çağırmaz; `$.state` yazımları ve `state.set` kancalarıyla konuşur:

- **Aç isteği:** ana panel `{ plugin: 'modz', key: 'open' }` değerine `{ pane, at }` yazar. Paneli olan mod
  `on('state.set', { plugin: 'modz', key: 'open' }, …)` ile dinler, `next(e)`'den sonra `pane` kendi anahtarıysa
  kendi `$.ui.open`'ını çağırır (komut değil). Kanca `.catch(($, e, next) => next(e))` taşır.
- **Öne getirme:** ana panel açık kalır, her satır kendi sekmesini açar. Yüzey, klavyeyi tutan paneli yerinden
  etmez; bu yüzden sahibi `$.ui.open`'ı `focus: true` ile çağırır: oluru yüzey verir (masaüstünde istem kutusu boş
  ve tur yokken), panel klavyeyi ve önü alır. Olmazsa panel ana panelin yanında sekme olarak bekler.
- **Sabit basış tutamacı:** JSX her çizimde yeni tutamaç verir, host da yeniden çizimde eskileri bırakır; masaüstü
  son boyadığı ağaca tıkladığı için araya giren her çizim tıklamayı düşürürdü. Button, Input ya da Select çizen her
  `ui.render` kancası ağacını `pinned(e, ağaç)` ile döner (`kit/pin.ts`): her öğe yeri ve anahtarı için ilk aldığı
  tutamacı korur, eski ağaç da basılabilir kalır. Değişmeyen değer `$.state`'e yeniden yazılmaz (`kit/same.ts`).
- **Özet kartı:** her mod kendi `{ plugin: '<mod>', key: 'hub' }` değerine `HubCard` yazar; ana panel
  `on('state.set', { key: 'hub' }, …)` ile hepsini toplar. Yalnızca gösterilen metin değişince yazılır.

- **Eve dönüş:** hub çalıştıkça `{ plugin: 'modz', key: 'isOn' }` `true`'dur. Hub'ın açtığı her panel bunu çizerken
  okur ve açıksa ağacın başına `HomeButton` (`kit/home.tsx`, "← MODZ") koyar. Basınca mod kendi
  `{ plugin: '<mod>', key: 'home' }` değerine `{ at }` yazar; hub `state.set { key: 'home' }` ile duyar ve kendini
  `focus: true` ile açar, kapanmışsa yeniden. Tek panel kalıp sekme şeridi çizilmese de dönüş yolu hep vardır.
- **Kişiye göre düzen:** hub'da "Düzenle" satırları yukarı taşır ya da gizler; gizlenenler "Gizli" bölümünde
  "Göster" ile bekler, "Sıfırla" hepsini geri koyar. Düzen `$.store`'da (`layout`: `{ hidden, order }`) oturumlar
  arasında kalır.
- **Yeni mod:** hub'ın tanımadığı bir mod da satır alır: kartına kendi `title`, `hint`, `icon` (kit ikon adı),
  `section` (`work`, `safety`, `meter`) ve `badge` ("Beta") alanlarını yazar, `modz.open` isteğini dinler, `home`
  değerini yazar. Tanınan modlar için hub'ın kendi sözcükleri geçerlidir; bilinen bir paneli başka mod alamaz.

```ts
type HubTone = 'idle' | 'live' | 'ok' | 'warn' | 'bad'   // lo · Iris · Moss · Amber · Flare
type HubCard = { pane: string; detail: string; tone: HubTone; at: number
                 title?: string; hint?: string; icon?: string; section?: 'work' | 'safety' | 'meter'; badge?: string }
```

| pane | mod | panel başlığı |
|---|---|---|
| agents | savvy-progress | Ajanlar |
| files | filetree | Dosyalar |
| plan | plan-steps | Plan |
| transceiver | transceiver | Transceiver (Beta) |
| tests | test-badge | Testler |
| checkpoints | checkpoint | Kontrol noktaları |
| replay | replay-theater | Tekrar |
| usage | hud-pro | Kullanım |
| skins | skins | Görünüm |
| modz-mods | modz | Modlar (modz'un ikinci paneli) |

`detail` tek satır, ≤40 karakter, Türkçe, ölçülmüş gerçek ("2 ajan çalışıyor", "41/42 geçti", "3/9 adım"); bilinmiyorsa
boş dize. Panel başlıkları tabloda yazıldığı gibidir; iki sekme aynı adı taşımaz.
