# MODZ tanıtım filmi v4 — tek seferlik görev

Bu görevi başından sonuna kadar, onay beklemeden yürüt. Üç iş var, sırayla: düzeltmeleri birleştir, yeni filmi yap, GitHub'ı yeni hale getir. Her işin sonunda kendi kontrolünü yap; bir şey başarısız olursa düzelt, düzeltemiyorsan açıkça yaz.

## 1. Tüm düzeltmeleri tek çatı altına topla

- Açık PR'lar: `partalemre/MODZ#45` (`fix/human-readable-hub`) ve `partalemre/MODZ#46` (`fix/agents-waiting-background`). Ayrıca `git branch -a --no-merged main` ile main'e girmemiş başka düzeltme dalı var mı bak.
- Hepsini `main`'den açılan tek bir dala (`fix/consolidated-fixes`) birleştir, çakışmaları çöz, her mod'u doğrula (mod'lar çalışma ağacından yüklenir; her düzenlemeden sonra doğrula), testleri çalıştır.
- Tek PR aç, eski PR'ları bu PR'a bağlayıp kapat. CI yeşil olunca repo kurallarına göre main'e al. Film işi bu birleşmiş main'in üstünde yapılır, çünkü film MODZ'un *şimdiki* halini gösterecek.

## 2. Yepyeni tanıtım filmi

### Önce oku
- Eski film: `docs/modz-film.mp4` (54 sn, 1600×900, 60 fps, tek kamera hareketi, kararmasız geçişler). Kare kare izle, neyin iyi neyin zayıf olduğunu yaz. Yeni film her açıdan daha iyi olmalı.
- `DESIGN.md`, `design/video/*.md` (mod'ların gerçek görünüş ölçüleri), `README.md` mod listesi, `kit/` (renk, yazı, ikon tokenları).
- Gerçek görüntü referansı: `bin/modz shot` ve `tools/shot` ile masaüstü Code sekmesinin ve mod panellerinin güncel ekran görüntülerini al. Filmdeki her arayüz bunlara sadık olmalı.

### Skill ve araçlar (hepsini çağır, kullan)
`impeccable` (yön, kritik, son cila), `design-motion-principles` (hareket dili + sonda audit modu), `framer-motion-animator`, `frontend-design`, `ui-ux-pro-max`. Bitince `impeccable-finish-reviewer` ajanıyla bağımsız bir inceleme yaptır ve çıkan maddeleri düzelt.

### Fikir: baştan sona akan bir agent
Filmin omurgası, hiç kesilmeden ekranda dolaşan tek bir agent. MODZ'un kendi görsel dilinden çıkan küçük, sevimli, okunur bir karakter (ışıklı bir iz bırakan piksel/kıvılcım gibi). Her sahneye o taşır: bir görevi alır, bir araç çağırır, bir mod'u tetikler, sonuç onun hareketiyle görünür olur. Kamera onu izler; sahneler arası geçişler onun hareketiyle olan eşleşmeli geçişlerdir (match cut), karartma yok. Film onun işi bitirip ekranın ortasında MODZ logosuna dönüşmesiyle biter.

### İki seyirci, tek hikaye
MODZ Claude Code içinde çalışır. Film iki kişiye birden konuşmalı:
- **Kod yazan biri** için: değişikliğin neyi etkilediği (blast-radius), geri dönüş noktası (checkpoint), test durumu (test-badge), PR özeti (pr-card), sızan gizli anahtarın yakalanması (secret-guard), cache maliyeti ve doğru efor seviyesi (cache-tax, effort-router), dosya ağacı (filetree).
- **Kod yazmayan biri** için: agent'ın şu an ne yaptığını düz dille gören panel (savvy-progress, plan-steps), iş bitince haber veren ses (done-ping), harcama sınırı (session-budget), tüm projelerin tek tahtası (projects), görünümü kişiselleştirme (skins), yılın özeti (wrapped), işi başka oturuma devretme (handoff).
- Her mod'u gösterme zorunluluğu yok; en güçlü 8–10 tanesini seç, kalanları sonda hızlı bir mod duvarında göster. Her sahne "bu bana ne kazandırır" sorusunu tek bir kısa ekran yazısıyla cevaplasın (en fazla 6–7 kelime, İngilizce).
- Sadece README'de yazan gerçek özellikleri göster. Uydurma rakam, sahte kullanıcı yorumu, var olmayan özellik yok.

### Görünüş ve hareket
- Arayüzler gerçekteki gibi (gerçek ekran görüntüleriyle aynı yerleşim, yazı, renk), ama daha iyi: derinlik, yumuşak ışık, gerçekçi gölge, hafif hareket bulanıklığı (motion blur), 3B kamera hareketi.
- Hareket fiziksel ve amaçlı: yay (spring) eğrileri, nesnelerin ağırlığı, sayaçların canlı akması, olayların panelden panele görünür biçimde yol alması. Her şeyin aynı anda kıpırdadığı "AI kokan" hareketlerden kaçın; `design-motion-principles` audit'inden geç.
- Süre 60–75 sn. İlk 3 saniyede ilgi çekici bir açılış, son 5 saniyede net bir çağrı: kurulum komutu ve site adresi.
- Ses: `tools/sounds` ve done-ping ses paketleriyle ses tasarımı; telifli müzik yok.

### Teknik şartlar
- **En az 60 fps, kare düşmeden.** Ekran kaydı yapma. Animasyonu zamana bağlı ve deterministik kur (sanal saat: her kare `t = kare / 60` ile çizilir), sonra her kareyi tek tek yakalayıp (ör. Playwright ile) ffmpeg'le birleştir. Yeni bağımlılık eklemeden önce repoda olanı kullan.
- Çıktı: 1920×1080, 60 fps, H.264, `yuv420p`, `+faststart`, siteye uygun boyut (hedef 15 MB altı).
- Kontrol: `ffprobe` ile 60/1 fps ve süreyi doğrula; `ffmpeg -vf mpdecimate` ile tekrar eden (donmuş) kare olmadığını göster; her 2 saniyeden bir kare alıp bir kontak sayfası (contact sheet) çıkar ve sahne sahne kendin incele.
- Kaynak kodu ve render betiğini repoda sakla (ör. `tools/film/`), böylece film tek komutla yeniden üretilebilsin.

## 3. GitHub'ı yeni hale getir

- `docs/modz-film.mp4`, `docs/img/poster.jpg` (filmin en güçlü karesi) ve `docs/img/film-preview.webp` (README'de oynayan 16 sn'lik hareketli önizleme) dosyalarını yenile.
- `docs/index.html` içindeki `?v=3` sorgularını `?v=4` yap (tarayıcı önbelleği eski filmi göstermesin), "54 seconds" yazısını yeni süreyle değiştir.
- README: önizleme görselinin `alt` metnini yeni filme göre yaz, süreyi güncelle; mod listesini, kurulum listelerini, `docs/llms.txt` ve site içeriğini birleşmiş main'in gerçek haliyle eşitle (İngilizce varsayılan, `MODZ_LANG=tr` notu kalsın; kurulum listeleri her yerde aynı olsun).
- Filmi yeni bir GitHub Release'e ekle; README'deki "download it" bağlantısı (`releases/latest`) yeni filmi indirsin.
- Hepsini `docs/film-v4` dalında tek PR olarak aç, conventional commit kullan, CI yeşil olunca main'e al ve GitHub Pages sitesinde yeni filmin oynadığını tarayıcıda açıp doğrula.

## Bitti sayılması için
1. Düzeltmeler tek PR'da birleşip main'de.
2. Yeni film 60 fps, donmuş karesiz, iki seyirciye de konuşan, baştan sona akan agent'lı; bağımsız inceleme maddeleri kapatılmış.
3. README, site, önizleme, poster ve Release yeni filmi gösteriyor; site canlıda kontrol edilmiş.
4. Son mesajda: ne yapıldı, ne atlandı, hangi kontrol yapılamadı.
