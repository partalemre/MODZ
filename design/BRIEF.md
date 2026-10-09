# Ajan çalışma brifi (her mod ajanı için ortak)

Görev: bir veya birkaç Claude Code modunu (hooks plugin) videodaki kalitede, ama ÖZGÜN çizimle yeniden tasarla ve
istenen davranış iyileştirmelerini ekle. Kullanıcı sabırsız: hızlı ama kusursuz.

## Çalışma yeri
- YALNIZCA `/Users/partalle/Projects/MODZ/.staging/<mod>` içinde çalış (canlı kopyalar `mods/` ve `~/.claude/skills`
  açık oturumlarda yüklü; ASLA dokunma). İşin bitince ana oturum test edip canlıya alır.
- Asıl (upstream) modlarda: davranışı bozma, LICENSE'ı koru, README'ye "Dayandığı proje: <repo>, MIT" ekle.

## Önce oku
1. `/Users/partalle/Projects/MODZ/DESIGN.md` — tasarım dili (renkler, tipografi, bileşenler, bant sözleşmesi). Kesin kural.
2. `/Users/partalle/Projects/MODZ/design/video/<mod>.md` (varsa) — videodaki halin kare kare ölçümü. Kalite çıtası bu,
   ama birebir kopyalama: kendi çiziminle aynı zenginliği yakala. Kurgu efektlerini (turuncu odak halkası, glow,
   spot karartma) kopyalama.
3. `/Users/partalle/Projects/MODZ/design/RESEARCH.md` §(c) — modun konsepti.
4. Mod API: `/private/tmp/claude-501/bundled-skills/2.1.293/bc615f9c1072c35505f514fd9466f7c8/plugin-authoring/reference.md`
   ve tipler `.../plugin-authoring/types/claude-code.d.ts` (grep: 'SvgProps', 'BoxProps', 'AbovePrompt: {', 'Pane: {').
5. İyi Svg örnekleri: `mods/savvy-progress/hooks/register.tsx` (rowSvg, kutucuklar, yengeçler),
   `mods/skins/hooks/svg-kit.ts`, `svg-usage.ts`, `light.ts`.

## Ortak kit
`/Users/partalle/Projects/MODZ/kit/` paralel olarak yazılıyor (tokens, ikonlar, Svg kurucular, Card/ButtonRow).
`kit/README.md` varsa `/Users/partalle/Projects/MODZ/bin/kit-sync <mod-yolu>` ile modunun `hooks/kit/`'ine kopyala
ve kullan. Henüz yoksa token'ları DESIGN.md'den birebir al; sonradan kit'e geçmek kolay olsun diye renkleri tek bir
`theme.ts` içinde tut.

## Yüzeyler
- desktop (asıl hedef): Box/Text/Button + Svg (büyük başlık, BÜYÜK HARF eyebrow, ikon kutusu, ölçer, rozet).
- terminal: aynı bilgi metinle (Svg yok), tema anahtarları.
- Tema: koyu + açık (Svg'de prefers-color-scheme; Box/Text hex'i `resolveLight` ile).

## Görsel doğrulama (zorunlu)
`tests/preview.test.tsx` yaz: her önemli durum için desktop'ta mount et ve
`console.log('@@TREE@@<etiket>@@' + JSON.stringify(await ui.drawn()))` yaz. Sonra
`/Users/partalle/Projects/MODZ/bin/preview /Users/partalle/Projects/MODZ/.staging/<mod> /tmp/claude-501/modz-preview/<mod>`
(+ `--theme light` ile ayrı klasöre). PNG'lere Read ile BAK, video karelerinin yanına koy, güzel olana kadar düzelt.
Önizleme Svg'yi birebir, Box/Text'i yaklaşık (1 birim = 8px) çizer.

## Bant sözleşmesi (DESIGN.md §6)
Her AbovePrompt hook'u `next(e)` çağırır, kendi satırını `theirs` ile birleştirir, `e.props.hasSurvey` iken yalnızca
`next(e)` döner. Karar/bildirim/ilerleme satırları `theirs`'in üstüne, durum satırları (hud-pro, cache-tax durumu) altına.

## Bitti tanımı
- `claude plugin validate <klasör>` geçer, `claude plugin test <klasör>` tamamen yeşil (eski testler de; gerekirse güncelle).
- Dosya ≤300 satır, fonksiyon ≤40 satır. Kullanıcıya görünen metin Türkçe.
- plugin.json sürümünü küçük artır.
- Son rapor (kısa): ne değişti, test sayıları, preview PNG yolları (koyu+açık), bilinen eksikler.
