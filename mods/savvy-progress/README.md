# savvy-progress

Bir Claude Code modu: prompt'un üstünde bir ilerleme bandı ve alt ajanların canlı paneli. [savvy-flow](../savvy-flow) becerisi için yapıldı, her alt ajanla da çalışır.

Dayandığı proje: [JohnnyVizz/claude-kit](https://github.com/johnnyvizz/claude-kit) (`plugins/savvy-progress`), MIT. Lisans metni `LICENSE` içinde.

- **İlerleme bandı**: iş başlığı, aşama ve sayı (`Görevler 2/4`, `Gözden geçirme 3/4`, `Ajanlar 1/3`, `Bitti`), yüzde, yengeç, ekibi açan `×N` düğmesi ve `✕`. Diğer modların satırlarının üstünde durur; soru penceresi açıkken çekilir.
- **Dürüst ilerleme**: sayılar yalnızca gözlenenden gelir. Önce orkestratörün `progress` raporu; yoksa ana döngünün görev listesi (TodoWrite / TaskCreate / TaskUpdate); o da yoksa bu istekte başlatılan ajanlar (biten/toplam). Çalışan bir ajan kendi adımlarını (`step`) ya da görev listesini bildiriyorsa kısmi pay eklenir ve yüzde `~` ile işaretlenir. Ölçülecek bir şey yokken `—` görünür, asla `%0`. Tahmini bitiş süresi gösterilmez.
- **Ajanlar paneli** (`/agents-info` açar/kapatır): Çalışıyor / Bitti / Planlı grupları; her satır Agent çağrısının açıklamasıyla adlanır, `heavy Opus 5.5 · xhigh`, şu anki araç ve hedefi (`› Edit src/hero.tsx`), araç sayısı, süre (bitince `toplam 2:36`) ve `ctx 13% · 129k · ≈$0.85`. Yazılar yerel metin, okunaklı; yengeç, nabız noktası ve çubuk küçük canlı çizimler. Ölçülebilir ilerlemenin üstünden ışık geçer, ölçülemeyen iş izde kayan bir kuyrukluyıldız olarak çizilir. **Ajanın adına tıkla:** verilen görev, zamanlı iş geçmişi (her araç çağrısı, hedefi, süresi, ✓/✗; çalışan çağrıda nabız) ve bitince sonucu açılır; tekrar tıklayınca kapanır.
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
