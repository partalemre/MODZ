# savvy-progress

Bir Claude Code modu: prompt'un üstünde bir ilerleme bandı ve alt ajanların canlı paneli. [savvy-flow](../savvy-flow) becerisi için yapıldı, her alt ajanla da çalışır.

Dayandığı proje: [JohnnyVizz/claude-kit](https://github.com/johnnyvizz/claude-kit) (`plugins/savvy-progress`), MIT. Lisans metni `LICENSE` içinde.

- **İlerleme bandı**: iş başlığı, aşama ve sayı pill'i (`Görevler 2/4`, `Gözden geçirme 3/4`, `Ajanlar 1/3`, `Bitti`), görev başına bir segmentli ince ölçer (bitti yeşil, çalışan mor, bekleyen iz), yüzde, yengeç, ekibi açan `×N` düğmesi ve `✕`. Yüksekliği hud-pro satırıyla aynı; dar genişlikte önce ölçer kısalır, sonra başlık. Diğer modların satırlarının üstünde durur; soru penceresi açıkken çekilir.
- **Dürüst ilerleme**: sayılar yalnızca gözlenenden gelir. Önce orkestratörün `progress` raporu; yoksa ana döngünün görev listesi (TodoWrite / TaskCreate / TaskUpdate); o da yoksa bu istekte başlatılan ajanlar (biten/toplam). Çalışan bir ajan kendi adımlarını (`step`) ya da görev listesini bildiriyorsa kısmi pay eklenir ve yüzde `~` ile işaretlenir. Ölçülecek bir şey yokken `—` görünür, asla `%0`. Tahmini bitiş süresi gösterilmez.
- **İlerleme paneli** (`/agents-info` açar/kapatır, MODZ ana panelindeki satır yalnızca açar): başta beş stat kutusu (Ajan, Maliyet, Token, Süre, 5 saat payı; dar panelde 2–3 sütunlu ızgara), sonra Çalışıyor / Bitti / Planlı grupları. Her kart ilk bakışta adı, durumu, ilerleme çubuğunu ve `≈$`'ı verir; altında tek sessiz satır (`heavy · Opus 5.5 · xhigh · 3 araç`, süre) ve çalışırken şu anki araç (`› Edit src/hero.tsx`). Yüzde adımlarını ya da görev listesini bildiren ajanda ölçülür (`%60`), bildirmeyende yaptığı işten tahmin edilir (`~%45`, çizgili çubuk; yanıt gelmeden %90'ı geçmez). **Ajanın adına tıkla:** çipler (`bağlam %13`, `129k token`, `≈$0.85`, `5 saat ≈%2.0`: ajanın 5 saatlik limitten payı, oturumun puan/$ oranından), verilen görev, iş karışımı, zamanlı iş geçmişi ve sonuç kartı açılır; tekrar tıklayınca kapanır.
- **MODZ ana paneli**: `{ plugin: 'savvy-progress', key: 'hub' }` kartı (`Görevler 3/4 · 2 ajan`, iş yokken boş) ve `modz.open` isteğinde `progress` anahtarıyla paneli açar.
- **Sessiz transkript**: `progress` ve `step` çağrılarının satırları (`savvy-progress:progress 2ms`) çizilmez; hata veren ya da kesilen çağrının satırı kalır.
- **Yengeç kostümleri**: savvy katmanı varsa asıl eşleme (heavy dedektif, careful mühendis, medium aşçı, light yarışçı, fable astronot, Explore korsan); yoksa ajanın effort'u seçer: xhigh/max dedektif, high mühendis, medium aşçı, low yarışçı. `prefers-reduced-motion` hareketi durdurur.

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
