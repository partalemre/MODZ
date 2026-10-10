# Replay Theater

Dayandığı proje: [anthropics/claude-code-playground](https://github.com/anthropics/claude-code-playground) (`claude-code/mods/replay-theater`), Apache-2.0 (LICENSE dosyası korunmuştur; değiştirilen dosyaların başında not var).

Bir turda Claude'un yaptığı dosya düzenlemelerini kaydeder, sonra bir panelde tek tek, diff olarak izletir. Düzenlemeyi asla engellemez, değiştirmez, geciktirmez.

## Ne görürsün
- **Teklif kartı** (prompt'un üstü): düzenleme yapan bir tur bitince Orchid oynat kutucuğu, `TEKRAR` etiketi, `4 düzenleme · 4 dosya`, dosya adları, Claude'un cevabındaki ilk cümle ve **Düzenlemeleri izle** (`r`) / *Şimdi değil*. Bandın diğer satırlarının üstünde durur (`next(e)` çağrılır, `theirs` korunur); soru penceresi açıkken ve tur sürerken görünmez; bir sonraki turda kendiliğinden kalkar.
- **Panel** (`/replay` ya da kart): `TEKRAR · 3 dk önce`, `4 dosyada 4 düzenleme`, `6 satır eklendi, 6 silindi`, turu başlatan istek (“greet adını welcome yap”), `SIRAYLA DÜZENLEMELER` altında numaralı daireler (şimdiki Orchid dolu, geçilenler gri ✓, sıradakiler halka) ve her adımın dosyası, klasörü, `+N −N`'i. Altında `DÜZENLEME 2 / 4`, dosya adı, `src/greet.js · Edit`, **bu değişikliğin ne yaptığı** (tek satır), **hangi plan adımına ait olduğu** (`Plan adımı 3/9 · <görev>`), satır renkli ve değişen kelimesi vurgulu diff, lejant (Silindi / Eklendi / Değişen kelime / Değişmedi), **Önceki** (`p`), birincil **Sonraki** (`n`, son adımda **Bitir**), *Kapat* (`c`, Esc).
- Terminalde aynı bilgi metinle; diff Claude Code'un diff renkleriyle (değişen kelime dahil).

## Açıklama satırı (önce sıfır token)
1. Düzenleme çağrısının kendi `description` alanı varsa o.
2. Yoksa transkriptte Claude'un o düzenlemeden hemen önce yazdığı cümle (ana döngü ve alt ajanlar; token harcamaz).
3. İkisi de yoksa, panel ilk açıldığında **tur başına tek** Haiku çağrısı (effort low, 20 sn sınır); sonuç tura önbelleklenir, tekrar açınca çağrı yok. Hiçbiri yoksa satır gösterilmez.

## Plan adımı
`TodoWrite`, `TaskCreate`, `TaskUpdate`, `TaskList` izlenir; her düzenleme, çalıştığı anda `in_progress` olan maddeyi kaydeder. Görev listesi yoksa satır yok.

## Notlar
- Edit için diff `old_string` → `new_string`; Write için yazmadan önce diskteki metin okunur. Değişiklik etrafında 1 satır bağlam, adım başına en çok 12 satır (`… N satır daha`).
- Reddedilen ya da hata veren düzenleme artık kaydedilmez (asıl modda kaydediliyordu).
- Panel yerleşemezse (dar terminal) tekrar, bandın içinde diğer satırların üstünde çizilir.
- Tema: Claude Code'un `theme` ayarı (açık/koyu; `auto` sistemi izler).
- Durum oturum içindir (`$.state`); oturum bitince kaybolur.
