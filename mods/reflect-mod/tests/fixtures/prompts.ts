// Made-up prompts for the trigger test (tests/trigger.test.ts): corrections aimed at Claude, and ordinary work.

export const CORRECTIONS = [
  'no, use pnpm', 'no - use pnpm', 'nope, the tests live in spec/', 'wrong, that file is generated',
  'actually npm, not pnpm', "don't add comments to every line", 'do not touch the migrations folder',
  'never commit to main', 'stop running the whole suite, just the failing test', 'always answer in English',
  'from now on run lint before you commit', 'I prefer tabs over spaces', 'use vitest instead of jest',
  'I told you to keep the old API', 'you keep forgetting the changelog', 'remember to bump the lockfile',
  "you shouldn't mock the database", 'next time ask before deleting files', 'never print secrets',
  'hayır, pnpm kullan', 'hayır, bu repoda hep pnpm kullan, npm değil', 'yanlış, o dosya otomatik üretiliyor',
  'bundan sonra testlerde gerçek DB kullan', 'İngilizce yazma, Türkçe cevap ver lütfen', 'asla main dalına push etme',
  'her zaman önce testi yaz', 'yorum satırı ekleme', 'migrations klasörüne dokunmayın', 'npm yerine pnpm kullan',
  'kaç kere söyledim, console.log bırakma', 'tabları tercih ederim', 'hep böyle yapıyorsun, testleri unutuyorsun',
  'нет, используй pnpm', 'никогда не пиши в main', 'всегда отвечай по-русски',
] as const

export const ORDINARY = [
  'fix the login bug', 'use the staging database for this test run', 'why is this not compiling?', 'add a dark mode toggle',
  'should we split this file?', 'is there no index on that table?', 'the build fails with exit code 1', 'can you use a map here',
  'write tests for the parser', 'what does this regex do', 'refactor the auth middleware', 'it does not load on Safari',
  'make the button bigger', 'run the migrations', 'explain this stack trace', 'deploy to preview',
  'there is no README yet, write one', 'how should I name this hook?', 'rename userId to accountId everywhere',
  'check the CI logs', 'use this screenshot as reference', 'the page is not responsive on mobile', 'add pagination to the list',
  'bunu düzelt', 'şu dosyaya bak', 'lütfen testleri çalıştır', 'hepsini tek tek kontrol et', 'login sayfası açılmıyor',
  'bu fonksiyonu kullanarak bir örnek yaz', 'neden derlenmiyor?', 'bir README yaz lütfen', 'veritabanı bağlantısını kur',
  'şu hatayı açıkla', 'buton rengini değiştir', 'mobilde menü kayıyor', 'yeni bir endpoint ekle', 'hepsi geçti mi?',
  'проверь логи', 'почему не работает сборка?', 'добавь тесты', 'what is wrong with this query?', 'no idea why it crashes, look at it',
] as const
