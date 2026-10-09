# savvy-progress

Bir Claude Code modu: prompt'un üstünde bir ilerleme bandı ve alt ajanların tek canlı paneli, **Ajanlar**. Her ajan kendi yengeciyle bir kart; onu buradan izler, ona yazar, durdurur ya da yenisini başlatırsın. [savvy-flow](../savvy-flow) becerisi için yapıldı, her alt ajanla da çalışır.

Dayandığı proje: [JohnnyVizz/claude-kit](https://github.com/johnnyvizz/claude-kit) (`plugins/savvy-progress`), MIT. Lisans metni `LICENSE` içinde. Zaman çizelgesi, sessiz ajan uyarısı ve "Yeni görev", bu depodaki eski `agent-deck-pro` modundan bu modun kendi diliyle yeniden yazıldı; o mod artık yok.

## Ajanlar paneli

`/agents-info` açar/kapatır; MODZ ana panelindeki "Ajanlar" satırı yalnızca açar. Ajan listesinin doğrusu motorun kendi listesidir (`$.agent.list()`, saniyede bir): mod yüklenmeden başlamış ya da bitiş olayı gelmemiş bir ajan da doğru görünür.

- **Başlık kartı**: işin adı ve yüzdesi, görev/ajan başına segmentli ölçer, sayılar (`2 çalışıyor · 1 bitti · 1 planlı`) ve altta Maliyet, Token, Süre, 5 saat payı. Dört rakam sığmıyorsa ikiye iki dizilir; hiçbiri kesilmez. Ölçülecek bir şey yokken yüzde sessiz bir `—`.
- **Araç satırı**: `＋ Yeni görev` ve `Daralt` (bütün ekip tek sıra yengeç).
- **Dikkat satırı**: en çok bakılması gereken tek ajan. Çalışırken 2 dakikadır sesi çıkmayan (açık aracı yok, model yanıtı da gelmedi) ya da tek bir aracı 15 dakikadır süren ajan Amber (`Pip sessiz 3 dk · Research competitors`), son 10 dakikada kendiliğinden hata veren ajan Flare. Senin durdurduğun ajan sayılmaz. `Bak` onun kartını açar.
- **Zaman çizelgesi** (en az iki ajan varken, `Gizle`/`Göster`): her ajana bir şerit, her araç çağrısı türünün renginde bir parça (okuma, düzenleme, komut, ajan), şeridin sonu nasıl bittiğini söyler, çalışırken "şimdi" çizgisi, sessiz ajanın şeridinde Amber çentik. Terminalde aynı şeritler hücre dizisi olarak.
- **Kartlar** (Çalışıyor / Bitti / Planlı): yengeç, adı ve katmanı (`Nori · light · Opus 5.5 · low`), görev başlığı, durum pill'i, ilerleme çubuğu ve hemen ardından yüzdesi, altta şu anki iş (`› Write src/Hero.tsx`; bitince yanıtının ilk satırı) ve `3 araç · 0:56 · ≈$0,56`. Yüzde, adımlarını (`step`) ya da görev listesini bildiren ajanda ölçülür (`%60`), bildirmeyende yaptığı işten tahmin edilir (`~%45`, çizgili çubuk; yanıt gelmeden %90'ı geçmez). Hata veren kartın çubuğu `✗` ile biter.
- **Açık kart** (sağdaki `▸`): çipler (`bağlam %13`, `129k token`, `≈$0,85`, `5 saat ≈%2,0`), verilen görev, iş karışımı, zamanlı iş geçmişi ve sonuç kartı. Çalışan ajanda **mesaj kutusu** (`Nori'ye yaz, Enter gönderir`, `$.session.send`) ve **`Nori'yi durdur`** (motorun kendi TaskStop aracı, normal izin zinciriyle).
- **Yeni görev**: ajan türünü seç, işi anlat, Enter başlatır (`$.agent.spawn`); kart hemen açılır ve `Kiko işe koyuldu` der. Türler: yerleşikler (general-purpose, Explore, Plan), motorun modele sunduğu her tür (`agent.offer`: eklentilerin ve ayarların ajanları) ve `.claude/agents/*.md` ile `~/.claude/agents/*.md` dosyaları. Reddedilen başlatma nedeniyle formda kalır.
- **Boş panel**: dinlenen bir yengeç, tek cümle ve tek eylem (`＋ Yeni görev`).
- **Yengeçler**: her ajana geliş sırasıyla kendi kabuk rengi, gözleri ve adı (Pip, Mako, Nori…); kostüm katmanı söyler (heavy dedektif, careful mühendis, medium aşçı, light yarışçı, fable astronot, Explore korsan; savvy katmanı yoksa effort seçer). Panelin tek hareketi yengeçlerdir: yalnızca çalışan yürür, sessizleşen durur, iş bitince hareket de biter; `prefers-reduced-motion` hepsini durdurur.

## İlerleme bandı

İş başlığı, aşama ve sayı pill'i (`Görevler 2/4`, `Gözden geçirme 3/4`, `Ajanlar 1/3`, `Bitti`), görev başına bir segmentli ince ölçer, yüzde, paneli açan `×N` ve `✕`. Diğer modların satırlarının üstünde durur; soru penceresi açıkken çekilir.

**Dürüst ilerleme**: sayılar yalnızca gözlenenden gelir. Önce orkestratörün `progress` raporu; yoksa ana döngünün görev listesi (TodoWrite / TaskCreate / TaskUpdate); o da yoksa bu istekte başlatılan ajanlar (biten/toplam). Çalışan bir ajan kendi adımlarını ya da görev listesini bildiriyorsa kısmi pay eklenir ve yüzde `~` ile işaretlenir. Ölçülecek bir şey yokken `—` görünür, asla `%0`. Tahmini bitiş süresi gösterilmez.

## Diğerleri

- **MODZ ana paneli**: `{ plugin: 'savvy-progress', key: 'hub' }` kartı (`Görevler 3/4 · 2 ajan`, iş yokken boş) ve `modz.open` isteğinde `agents` anahtarıyla paneli açar.
- **Sessiz transkript**: `progress` ve `step` çağrılarının satırları çizilmez; hata veren ya da kesilen çağrının satırı kalır.

## Eklediği araçlar

- `mcp__savvy-progress__progress`: orkestratör planı, aşamayı ve kabul edilen görevleri bildirir.
- `mcp__savvy-progress__step`: bir işçi kendi adımlarını bildirir (`done`, `total`, `note`).

Maliyet, token sayılarından ve yerleşik fiyat tablosundan (`hooks/pricing.ts`) kaba bir tahmindir, fatura değildir.

## Ayarlar

`language`: `tr` (varsayılan), `en`, `ru` ya da `auto` (Claude Code'un `language` ayarı, sonra sistem dili).

```json
{ "pluginConfigs": { "savvy-progress": { "options": { "language": "tr" } } } }
```

Kurulum talimatları [depo README'sinde](../../README.md).
