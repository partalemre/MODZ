# modz: dürüst denetim ve yeniden tasarım (2026-11-23)

## Durum tek cümlede
22 ayrı eklenti, ~73 bin satır kod, 20 tanesi açık. Her biri kendi panelini, kendi çizimini, kendi sayacını getiriyor. Sorunların çoğu tek tek hata değil; bu kalabalığın kendisi.

## Gerçek uygulamada gördüklerim (ekran görüntüsü, 13:14)
| Şikayet | Ekranda görülen | Muhtemel kaynak |
|---|---|---|
| Aynı şey 4–5 kez yazıyor | Bir adım için: Claude'un cümlesi, "Neden:" satırı, adım başlığı, kural cümlesi ve ham komut alt alta | `mods/modz/hooks/reply-language.ts` her turda Claude'a "her adımdan önce cümle yaz" diyor; aynı cümleyi sohbet, araç satırı (`plain-rows.tsx`) ve Ajanlar paneli ayrı ayrı basıyor. Üstelik bu talimat her turda token harcıyor. |
| Kural cümleleri yanlış | `"(" komutunu çalıştırıyor`, `"which" komutunu…` | `kit/plain-shell.ts` kabuk komutunu yanlış bölüyor |
| Plan ilerlemesi yanlış | Şerit ve alt satır `plan 0/9`, iş ise çok ilerlemiş | plan-steps adımları işaretlenmediğinde sayaç hiç kımıldamıyor |
| Aynı bilgi iki yerde | `plan 0/9 · Save v2…` hem şeritte hem alttaki durum satırında | savvy-progress ve plan-steps ikisi de çiziyor |
| Etkinlik paneli dağınık | Saat sütunu, iki satıra taşan metin, hizasız "Neden:" blokları | savvy-progress aktivite görünümü |
| Sekme "Eklenti" yazıyor, kapanmıyor, beyaz yükleniyor | — | Masaüstü uygulaması tek panelin adını göstermiyor (belgede yazıyor). modz her alt sayfa için ayrı panel açıp kapatıyor (`kit/stage.ts`, `modz-hold` yer tutucu) → sekmeler bir an çıkıp kayboluyor, arada boş/beyaz kare |
| Çift tıklama gerekiyor | — | Tahmin (henüz kanıtlanmadı): düğmelerde sabit `key` yok ve 20 eklentiden biri yeniden çizdiğinde düğme basış anında değişiyor. Motor belgesi: "metni değişen düğmeye sabit key ver". |
| Ağır yükte modz gelmiyor, tema geç geliyor | — | 20 ayrı paket her açılışta yükleniyor ve her çizimde zincir halinde çalışıyor. Notlarda "hooks worker is wedged" kaydı var. |
| Maliyet/token doğru mu | `$7,17 · 17,6M` | Henüz ölçülmedi; `$.session.usage` ile tek oturumda karşılaştırılmalı |

## "Claude'un içine doğrudan girelim mi?" (tersine mühendislik)
Önerim: **hayır, ürünün yolu bu olmamalı.**
- Panel arayüzü uygulamanın içinde değil, claude.ai'den gelen ve sürekli değişen web kodu. Yamamız her güncellemede silinir; ponytail yaması zaten her güncellemede yeniden yapılıyor.
- modz herkese açık; bir yamayı başka kullanıcılara dağıtamayız.
- İmzalı uygulamayı değiştirmek kullanım koşullarıyla çatışabilir (kesin bilmiyorum, risk olarak not).
- Asıl müjde: ihtiyacımız olan şey resmi yolla zaten mümkün. Motor 2.1.330 belgesine göre **tek panel kimliği açıp içinde sayfa değiştirebiliriz**; o zaman sekme kayması, yer tutucu panel ve beyaz geçiş tamamen ortadan kalkar. `$.state` okuyan çizim kendi kendine yenileniyor; elle "her şeyi yeniden çiz" çağrısına gerek yok.
- Tersine mühendisliği yalnızca okumak için kullanırız: "basışlar neden düşüyor" gibi tek sorulara.

## Yeni modz: az ama işe yarar
Tek eklenti, tek paket, tek panel. Üç yüzey, hepsinin bir işi var:

1. **Alt şerit (sohbetin üstü):** Şu an ne oluyor + haftalık limit. Yengeç sahnesi kalır ama alt ajanlar nokta değil, adlı küçük kartlar; plan adımının adı okunur büyüklükte. Alt satırdaki tekrar kalkar.
2. **Tur özeti (her tur sonunda):** "Okuduğu dosyalar · Değiştirdikleri · Neden" — tek kart, yanında gerçek düğmeler: *farkı aç*, *geri al*, *dosyayı aç*. Sizin "ne yaptığını anlamıyorum" şikayetinin doğrudan cevabı bu.
3. **Panel (tek sekme, içinde gezinme):** Ajanlar, Değişiklikler, Plan, Kullanım, Ayarlar. Her satır bir eylemle biter (durdur, aç, geri al); sadece gösterip bir şey yaptırmayan satır olmaz.

Her adım **tek satır**: Claude'un kendi açıklaması. Kural cümlesi ve ham komut yalnızca satıra basınca açılır. Her turda Claude'a eklenen talimat kalkar (token tasarrufu).

Kalanlar (secret-guard, checkpoint, blast-radius) görünmez koruma olarak içeride kalır. Transceiver, wrapped, skins sahneleri, replay, projects, reflect, done-ping gibi ekstralar varsayılan kapalı ayrı paket olur ya da dondurulur.

## Tek panel: denemelerin sonucu (motor 2.1.330)
- **Olmayan yol:** "her mod kendi sayfasını modz panelinin içine çizsin". Motor bir panelin çizimini yalnızca o paneli açan eklentiye soruyor; plan modunun kancası modz'un panelinde hiç çağrılmadı (ayrıntılı günlükle ölçüldü).
- **Çalışan yol:** sayfayı modz çiziyor, verisini modun kendi kaydından okuyor. Plan sayfası bu yolla modz panelinin içinde açıldı; açılırken hiçbir an ikinci panel listelenmedi, "← modz" aynı panelde hub'a döndü (`tools/desk/one_pane.py`, worktree `feature/one-pane`). Bedeli: modz paketi 190 → 237 KB.
- Bu yol zaten "tek eklenti" yönüne çıkıyor: sayfalar modz'a taşınıyor, modlar yalnızca veri ve korumayı tutuyor.

## Söyledikleri kaybolmasın (sahibin isteği, 13:36)
Bugün Claude'un sana söylediği önemli cümleler araç satırlarının, açıklama satırlarının ve "Neden:" bloklarının arasında kayboluyor. Kural:
- Sohbette ve Ajanlar sayfasında **ana çizgi Claude'un söyledikleri**. Her mesaj tek kart; yaptığı işler o mesajın altına tek satır özet olarak katlanır ("3 dosya okudu, 1 dosya değiştirdi, 2 komut"), basınca açılır.
- Araç satırının altındaki ikinci açıklama satırı (kural cümlesi + ham komut) varsayılan olarak gizli.
- "Önemli", "dikkat", "karar", "bitti", "başarısız" gibi işaretli cümleler ayrıca öne çıkar; tur özeti kartı bunları toplar.

## Açık sorular
- checkpoint modunun yedek deposu (`~/.cache/claude-checkpoint`) 3,5 GB'a ulaştı ve İndirilenler gibi proje dışı klasörleri de yedekliyor. Bir süre sınırı ve proje dışı klasör yasağı gerekiyor.
- Şeritteki plan `0/9` kalıyor (diğer oturum, 13:36). Kod `update_plan`'ın `advance` adımını tanıyor; neden ilerlemediği o oturumun kaydıyla bulunmalı.
- Çift tıklama: düğmelerin hepsinin sabit kimliği var, yani ilk tahmin yanlıştı. Uygulamanın salt-okur incelemesi sürüyor.

## Uygulamanın kodundan öğrendiklerimiz (salt okuma, uygulama 6.28899.6, motor 2.1.330)
Hiçbir şey değiştirilmedi; ayrıntı ve kanıtlar oturumun geçici klasöründe (`scratchpad/rea/EVIDENCE.md`).
- **Çift tıklama:** Uygulama basışı `click` olayında gönderir ve düğmeyi `key` ile yeni çizimde yeniden bulur. Panel eski bir çizimi gösterirken ilk tık yalnızca motoru uyandırır; yeni çizimde aynı `key` gelmezse basış düşer. Tık sürerken ikinci tık yok sayılır. Bunlar kodun okunmasından çıkan nedenler, henüz ölçülmedi.
- **Yeniden çizim seli:** Bir modun `$.ui.invalidate` çağrısı oturumdaki bütün yerleri, bütün modlar için yeniden çizdirir. Uygulama bunu kısıtlıyor: beklenmeyen yerler için saniyede 2 çizim. modz modlarının kodunda onlarca çağrı ve 17 düzenli zamanlayıcı var. Çözüm: veriyi `$.state` içinde tutmak. Çizim onu okuyunca yalnızca o yer kendi kendine yenilenir.
- **Tek işçi:** Bütün modların kancaları tek bir işçide çalışıyor (yorum, kesin değil). Bir modun uzun işi hepsini kilitler ve kilitlenen işçi yeniden başlarken modların hafızası silinir. "modz bazen kayboluyor"un en olası nedeni bu.
- **Tema gecikmesi:** Pencere açılırken saklı renkler gelir; modun canlı teması motor bağlandıktan 2–4 sn sonra gelir. Tema yalnızca bir kez, oturum başında ayarlanmalı.
- **"Eklenti" yazısı:** Uygulamanın sabit adı; değiştirilemez. Sekme şeridi yalnızca birden fazla panel açıkken çıkar.
- **Uygulamanın zaten çizdikleri:** plan (`update_plan`), arka plan görevleri, maliyet, kullanım, değişiklikler. modz bunları tekrar çizmemeli; kendi işi açıklamak ve eylem sunmak olmalı.

## Sıra
0. **Yeniden çizim selini kes:** `invalidate` çağrılarını `$.state` okumalarına çevir, gereksiz zamanlayıcıları kaldır. Bu, çift tıklama ve yavaşlık için ilk ölçülecek iş.
1. **Hemen düzelecekler (dal üzerinde, yapıldı):** her turdaki talimatı kaldır, çift yazımı kes, alt satır tekrarını kaldır, düğmelere sabit `key`, kabuk cümle hatası.
2. **Tek panel:** alt sayfa değiştirme panel içinde; `stage.ts` ve `modz-hold` silinir. Gerçek uygulamada tıklayarak sınanır.
3. **Tur özeti kartı** ve okunur alt ajan kartları.
4. **Birleştirme:** 20 eklenti → 1 çekirdek + isteğe bağlı ekstralar. Bu, herkese açık kullanıcıları etkilediği için son karar sizin.
5. Sayıların doğruluğu: maliyet, token, plan yüzdesi gerçek oturumla karşılaştırılır.

Her adım bir dalda yapılır, ana dala sizin onayınızla girer (ana dal tüm kullanıcılara otomatik gidiyor).
