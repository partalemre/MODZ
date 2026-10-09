# hud-pro

Bandın en altında, prompt'a bitişik tek sakin satır; kullanım bilgisinin tek yeri (DESIGN.md §6). Sıfır token: yalnızca motorun kendi ölçümlerini okur (`session.usage`, `session.measure`).

```
◔ 5s %32 · 2sa 10dk  │  ◔ 7g %91 · 3g 22sa  │  ◔ bağlam %41  │  ≈$1,23 oturum
```

- **Masaüstü:** tek Svg satır, her limit ve oturum maliyeti için sakin bir hap: etiket (`5 saat`), ince ölçer ve tempo çentiği (pencere eşit harcansaydı nerede olurdu), değer, sıfırlanma. Üstüne gelince ayrıntı ipucu çıkar; dar bantta önce sıfırlanmalar, sonra ölçerler düşer. Renk nötr; tempodan 10 puan öndeyse Amber, %95'ten itibaren Flare. Bağlam (tempo yok) %70'ten Amber.
- **Bağlam ≥ %70:** yanında küçük **Sıkıştır** düğmesi (`s`); Claude Code'un kendi `/compact`'ını kendi dispatch'inde çalıştırır, tur sürerken ve sıkıştırma bitene kadar gizlidir.
- **Terminal:** aynı bilgi tek metin satırında; geniş bantta `━━┊───` ölçerler, daraldıkça önce çubuklar, sonra sıfırlanma ve maliyet düşer.
- `theirs`'in altında durur (`next(e)` çağırır, hiçbir şeyi yutmaz); soru penceresi açıkken çekilir.
- Bir limit %90'ı geçince pencere başına tek kısa bildirim.

## Komutlar
- `/hud` satırı açar/kapatır (oturumlar arası hatırlanır).
- `/hud full` paneli: 5 saat, 7 gün, bağlam ve oturum maliyeti için stat kutuları (Display değer + tempo çentikli ince ölçer + son 96 okumanın sparkline'ı); terminalde metin sparkline'lı satırlar; altında son turun token'ları.

## Sınırlar (dürüst)
- Hız limitleri yalnızca abonelikte gelir; API anahtarıyla satır bağlam ve maliyeti gösterir.
- Maliyet motorun oturum defteridir, `≈` ile gösterilir. Tempo yalnızca süresi bilinen pencerelerde (5s, 7g) çizilir.
- Boştaki satır dakikada bir yenilenir; başka hiçbir şey çalışmaz.

## Geliştirme
`claude plugin validate .`, `claude plugin test .` (iki yüzeyde 12 davranış testi + `tests/preview.test.tsx` görsel durumları). Renkler `hooks/theme.ts`'te (Tidemark token'ları), Svg yapı taşları `hooks/svg.ts`'te.
