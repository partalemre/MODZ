# Araştırma dalgası: 16 öneri, MODZ'a yerleşim planı (2026-10-13)

Kaynak: 13 Ekim araştırması (GitHub star, HN puanı, X beğenisi, YouTube izlenmesi, rakip ürün changelog'ları).
Amaç: her öneriyi **ait olduğu moda** koymak; yeni mod yalnızca hiçbir mevcut moda ait olmayan iki iş için.
Panel kalabalığı: hub'a yalnızca iki yeni satır eklenir. Kendiliğinden açılan pane, rutin toast, `$.command.run` yok (DESIGN §1).

## Yerleşim

| # | Öneri | Nereye | Yüzey | Token |
|---|---|---|---|---|
| 1 | Planı zorunlu kılmak: plan diskte, `/clear` ve compact sonrası geri gelir; açık adımla tur biterse kart | plan-steps | bant kartı (bildirim sırası), `prompt.compose` bölümü | 0 (yalnızca plan yeniden enjekte edilince birkaç yüz giriş tokenı) |
| 2 | Bağlam dökümü + tahmin: kategori çubuğu, ~kalan tur, 12 turluk sparkline, "Sıkıştır" düğmesi | hud-pro | Kullanım pane'i, hud satırına "~N tur" | 0 (`breakdown: 'summary'` yerel tahmin) |
| 3 | Otomatik devir (handoff): eşikte kart, devir notu, yeni oturumda tek seferlik enjeksiyon | **yeni: handoff** | bant kartı, küçük "Devir" pane'i, `/handoff` | not yazımı: 1 haiku çağrısı (isteğe bağlı, deterministik yedek var) |
| 4 | Limit hızı tahmini: "~15:40'ta dolar" | hud-pro | ölçer tempo çentiği + pane satırı | 0 |
| 5 | Çakışma koruması: başka oturum son 30 dk'da düzenlediyse sor | blast-radius | tutma kartı (mevcut kart dili) | 0 |
| 6 | Efor yönlendirici: prompt başına efor seçimi, turun gerçek eforu görünür | **yeni: effort-router** | hub satırı, küçük "Efor" pane'i, hud satırında efor çipi değil (kendi satırı) | prompt başına ≤1 sınıflandırma |
| 7 | Gri bölge izin hakemi: düz dille yazılmış ev kuralları (`.claude/house-rules.md`) | blast-radius | aynı tutma kartı, "Kural: …" nedeni | yalnızca kural dosyası varken, çağrı başına ≤1 |
| 8 | Sır yer tutucusu: prompt'taki anahtar modele `⟦secret:1⟧` olarak gider, Bash çalışırken geri konur | secret-guard | toast değil, prompt altı not satırı | 0 |
| 9 | Kayıt modu: ekranda anahtar/env/e-posta maskelenir | secret-guard | `/rec`, durum satırında "REC" | 0 |
| 10 | PR/CI dinleyici: PR açılınca kontroller izlenir, bitince bildirim, kırmızıda "Claude'a düzelt" | test-badge | Testler pane'inde CI bölümü, hub detayı | 0 |
| 11 | Model değişimi uyarısı: yeni model = soğuk önbellek, maliyetiyle tutma kartı | cache-tax | mevcut bekletme kartı | 0 |
| 12 | Dikkat bekleyenler: makinedeki diğer oturumlardan izin/soru bekleyenler | savvy-progress | Ajanlar pane'inin başında, yalnızca bekleyen varsa | 0 |
| 13 | Ses paketleri | done-ping | `userConfig.sound` (varsayılan kapalı), özgün sentez sesler | 0 |
| 14 | Yengeç maskot: oturum durumuna tepki, tur sayısıyla seviye | savvy-progress | Ajanlar pane başlığı; bant varsayılan kapalı | 0 |
| 15 | Mod madencisi: geçmiş oturumlardaki tekrar eden sürtünme → kural/hook/mod önerisi | reflect-mod | `/mine`, "Fikirler" pane'i | ön süzgeç yerel, sonra 1 çağrı |
| 16 | Dağıtım: modların erişim beyanı (okur/yazar/çalıştırır/ağ/token), awesome listeleri | README, marketplace, site | tablo sütunu | — |

Ortak hakem (`kit/judge.ts`, saf): #6 ve #7 kullanır. Varsayılan arka uç motorun kendi `$.model.classify` (haiku,
kişinin kendi hesabı). `MODZ_JUDGE=jev` ve `TYPESAFE_API_KEY` varsa TypeSafe Jev. Hakeme giden metin önce
secret-guard'ın dedektörüyle maskelenir; sır asla dışarı çıkmaz.

## Bilinçli olarak dışarıda kalanlar
Limitte zarif bitiş ve AGENTS.md (motorda yerleşik). Oyunlar ve zengin Markdown çizimi (önerilerde yoktu; ekosistemde
çok kopyası var). Jev'li sıkıştırma (yıldız sayısı şüpheli; ayrı değerlendirme). Awesome listesine PR açmak dışa dönük
bir eylem: metin hazırlanır, gönderim kişinin onayıyla.

## Dalgalar
- **Dalga 1 (paralel, ayrı worktree):** kit/judge.ts · plan-steps · hud-pro · handoff · cache-tax + done-ping ·
  test-badge · secret-guard · savvy-progress · reflect-mod.
- **Dalga 2 (judge birleşince):** blast-radius · effort-router.
- **Dalga 3 (entegrasyon):** hub kataloğu (iki yeni satır), DESIGN §9 tablosu, README / marketplace / llms.txt / site
  listeleri (17 → 19), erişim beyanı, sürüm artışları, `bin/modz check` (CLI + masaüstü motoru), `bin/modz desk`,
  her değişen modun `bin/preview` PNG'lerine göz kontrolü.

## Her mod için kabul ölçütü
`claude plugin validate` + `claude plugin test` yeşil, iki yüzeyde (terminal + desktop) UI testi, `preview.test.tsx`'te
her yeni durum, EN + TR sözcükler, dosya ≤300 / fonksiyon ≤40 satır, kit kopyası `bin/kit-sync` ile, sürüm minor artışı,
mod README'si güncel, hub `detail` ≤40 karakter ve ölçülmüş gerçek.
