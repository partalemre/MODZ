// MODZ kit — the words of the plain-language layer (plain.ts): what each shell command and tool does, said so
// that someone who has never opened a terminal follows it. A term of the trade stays only in brackets after its
// plain name ("çalışma dalı (branch)"), so the person can match it to what the transcript shows. No model is asked.
import type { Lang } from './lang'

/** Which word of the command the sentence names: its first argument, its last file's name, its first file's name, an address's host. */
export type Named = 'arg' | 'file' | 'first' | 'host'

/** English, Turkish, and what `{x}` is. A part in [brackets] is dropped when there is nothing to name. */
export type Entry = readonly [en: string, tr: string, named?: Named]

/** A command whose second word decides what it does (`git commit`, `npm test`). */
export type Family = { readonly sub: Readonly<Record<string, Entry>>; readonly rest: Entry }

export const textOf = (entry: Entry, lang: Lang): string => entry[lang === 'tr' ? 1 : 0]

export function fill(template: string, x = ''): string {
  const named = x.trim()

  return template.replace(/\[([^\]]*)\]/g, (_, part: string) => (named ? part : '')).replace(/\{x\}/g, named)
}

const READ: Entry = ['Reading a file[: {x}]', 'Bir dosyayı okuyor[: {x}]', 'file']
const SEARCH: Entry = ['Searching inside files[ for “{x}”]', 'Dosyaların içinde[ “{x}”] arıyor', 'arg']
const TESTS: Entry = ['Running the tests', 'Testleri çalıştırıyor']
const BUILD: Entry = ['Building the project', 'Projeyi derliyor (çalışır hale getiriyor)']
const INSTALL: Entry = ['Installing the packages the project needs', 'Projenin ihtiyaç duyduğu paketleri kuruyor']
const LINT: Entry = ['Checking the code against the style rules', 'Kodun yazım kurallarına uyduğunu denetliyor']
const TYPES: Entry = ['Checking the code for type errors', 'Kodda tip hatası var mı diye denetliyor']
const FORMAT: Entry = ['Tidying the code’s layout', 'Kodun biçimini düzeltiyor']
export const SCRIPT: Entry = ['Running a script[: {x}]', 'Bir betik (küçük program) çalıştırıyor[: {x}]', 'first']
const SHAPE: Entry = ['Tidying a command’s output', 'Bir komutun çıktısını düzenliyor']
const PROCESSES: Entry = ['Looking at the running programs', 'Çalışan programlara bakıyor']
const DATABASE: Entry = ['Querying the database', 'Veritabanını sorguluyor']
const ARCHIVE: Entry = ['Working with an archive file', 'Arşiv (sıkıştırılmış) dosyasıyla çalışıyor']
export const SERVICE: Entry = ['Working with the {x} service', '{x} servisiyle çalışıyor']

/** One-word commands. */
export const COMMANDS: Readonly<Record<string, Entry>> = {
  cat: READ, head: READ, tail: READ, less: READ, more: READ, bat: READ,
  grep: SEARCH, rg: SEARCH, ag: SEARCH, ack: SEARCH,
  ls: ['Listing the files in a folder', 'Bir klasördeki dosyaları listeliyor'],
  tree: ['Listing the files in a folder', 'Bir klasördeki dosyaları listeliyor'],
  find: ['Looking for files', 'Dosya arıyor'],
  fd: ['Looking for files', 'Dosya arıyor'],
  wc: ['Counting lines', 'Satırları sayıyor'],
  diff: ['Comparing two files', 'İki dosyayı karşılaştırıyor'],
  sed: ['Reading part of a file[: {x}]', 'Bir dosyanın bir bölümünü okuyor[: {x}]', 'file'],
  awk: SHAPE, sort: SHAPE, uniq: SHAPE, cut: SHAPE, tr: SHAPE, xargs: SHAPE, tee: SHAPE, column: SHAPE,
  jq: ['Reading JSON data', 'JSON verisini okuyor'],
  cd: ['Moving to another folder', 'Başka bir klasöre geçiyor'],
  pwd: ['Checking which folder it is in', 'Hangi klasörde olduğuna bakıyor'],
  mkdir: ['Making a new folder[: {x}]', 'Yeni bir klasör oluşturuyor[: {x}]', 'file'],
  touch: ['Making an empty file[: {x}]', 'Boş bir dosya oluşturuyor[: {x}]', 'file'],
  cp: ['Copying files', 'Dosya kopyalıyor'],
  mv: ['Moving or renaming files', 'Dosya taşıyor ya da adını değiştiriyor'],
  rm: ['Deleting a file[: {x}]', 'Dosya siliyor[: {x}]', 'file'],
  rmdir: ['Deleting an empty folder', 'Boş bir klasörü siliyor'],
  ln: ['Making a shortcut to a file', 'Bir dosyaya kısayol oluşturuyor'],
  chmod: ['Changing who may use a file', 'Bir dosyanın izinlerini değiştiriyor'],
  chown: ['Changing who owns a file', 'Bir dosyanın sahibini değiştiriyor'],
  echo: ['Printing a line of text', 'Ekrana bir yazı yazdırıyor'],
  printf: ['Printing a line of text', 'Ekrana bir yazı yazdırıyor'],
  curl: ['Fetching data from the internet[: {x}]', 'İnternetten veri alıyor[: {x}]', 'host'],
  wget: ['Downloading from the internet[: {x}]', 'İnternetten indiriyor[: {x}]', 'host'],
  kill: ['Stopping a running program', 'Çalışan bir programı durduruyor'],
  pkill: ['Stopping a running program', 'Çalışan bir programı durduruyor'],
  killall: ['Stopping a running program', 'Çalışan bir programı durduruyor'],
  ps: PROCESSES, top: PROCESSES, lsof: PROCESSES, pgrep: PROCESSES,
  sleep: ['Waiting a moment', 'Kısa bir süre bekliyor'],
  open: ['Opening a file or an app', 'Bir dosyayı ya da uygulamayı açıyor'],
  which: ['Checking whether a tool is installed', 'Bir aracın kurulu olup olmadığına bakıyor'],
  type: ['Checking whether a tool is installed', 'Bir aracın kurulu olup olmadığına bakıyor'],
  env: ['Looking at the environment settings', 'Ortam ayarlarına bakıyor'],
  printenv: ['Looking at the environment settings', 'Ortam ayarlarına bakıyor'],
  date: ['Checking the date and time', 'Tarihe ve saate bakıyor'],
  tar: ARCHIVE, zip: ARCHIVE, unzip: ARCHIVE, gzip: ARCHIVE, gunzip: ARCHIVE,
  ssh: ['Connecting to another computer', 'Başka bir bilgisayara bağlanıyor'],
  scp: ['Copying files to another computer', 'Başka bir bilgisayara dosya kopyalıyor'],
  rsync: ['Copying files, only what changed', 'Dosyaları kopyalıyor (yalnızca değişenleri)'],
  sqlite3: DATABASE, psql: DATABASE, mysql: DATABASE,
  du: ['Checking how much disk space is used', 'Ne kadar disk alanı kullanıldığına bakıyor'],
  df: ['Checking how much disk space is free', 'Ne kadar boş disk alanı olduğuna bakıyor'],
  stat: ['Looking at a file’s details', 'Bir dosyanın bilgilerine bakıyor'],
  file: ['Looking at a file’s details', 'Bir dosyanın bilgilerine bakıyor'],
  shasum: ['Taking a file’s fingerprint', 'Bir dosyanın parmak izini (özetini) alıyor'],
  md5: ['Taking a file’s fingerprint', 'Bir dosyanın parmak izini (özetini) alıyor'],
  screencapture: ['Taking a screenshot', 'Ekran görüntüsü alıyor'],
  ffmpeg: ['Processing a video or sound file', 'Bir video ya da ses dosyasını işliyor'],
  osascript: ['Driving a Mac app with a script', 'Bir Mac uygulamasını betikle yönetiyor'],
  tsc: TYPES, eslint: LINT, biome: LINT, ruff: LINT, prettier: FORMAT,
  jest: TESTS, vitest: TESTS, pytest: TESTS, mocha: TESTS, playwright: TESTS,
  python: SCRIPT, python3: SCRIPT, node: SCRIPT, deno: SCRIPT, ruby: SCRIPT, bash: SCRIPT, sh: SCRIPT, zsh: SCRIPT, swift: SCRIPT,
  pip: INSTALL, pip3: INSTALL, uv: INSTALL, poetry: INSTALL, pod: INSTALL, gem: INSTALL,
  brew: ['Installing or updating a tool on this Mac', 'Bu Mac’e bir araç kuruyor ya da güncelliyor'],
  make: BUILD, xcodebuild: BUILD, gradle: BUILD, gradlew: BUILD,
  kubectl: ['Working with the servers the app runs on', 'Uygulamanın çalıştığı sunucularla çalışıyor'],
  supabase: SERVICE, vercel: SERVICE, wrangler: SERVICE, firebase: SERVICE, netlify: SERVICE, aws: SERVICE, gcloud: SERVICE,
}

const GIT: Family = {
  rest: ['Working with the project’s saved history (git)', 'Projenin kayıtlı geçmişiyle (git) çalışıyor'],
  sub: {
    status: ['Checking which files have changed', 'Hangi dosyaların değiştiğine bakıyor'],
    diff: ['Looking over the changes made', 'Yapılan değişiklikleri inceliyor'],
    log: ['Looking at the earlier saved versions', 'Daha önce kaydedilmiş sürümlere bakıyor'],
    show: ['Looking at an earlier saved version', 'Daha önce kaydedilmiş bir sürüme bakıyor'],
    blame: ['Checking who last changed each line', 'Her satırı en son kimin değiştirdiğine bakıyor'],
    add: ['Picking the changes to save', 'Kaydedilecek değişiklikleri seçiyor'],
    commit: ['Saving the changes as a new version (commit)', 'Değişiklikleri yeni bir sürüm olarak kaydediyor (commit)'],
    push: ['Sending the saved versions to the shared copy (push)', 'Kaydedilen sürümleri ortak kopyaya gönderiyor (push)'],
    pull: ['Bringing in what is new in the shared copy', 'Ortak kopyadaki yenilikleri alıyor'],
    fetch: ['Checking what is new in the shared copy', 'Ortak kopyada ne yeni diye bakıyor'],
    checkout: ['Switching to another line of work (branch)', 'Başka bir çalışma dalına (branch) geçiyor'],
    switch: ['Switching to another line of work (branch)', 'Başka bir çalışma dalına (branch) geçiyor'],
    branch: ['Looking at the lines of work (branches)', 'Çalışma dallarına (branch) bakıyor'],
    merge: ['Joining two lines of work', 'İki çalışma dalını birleştiriyor'],
    rebase: ['Moving its saved versions onto the newest code', 'Kendi kayıtlarını en güncel kodun üstüne taşıyor'],
    'cherry-pick': ['Copying one saved change onto this branch', 'Kaydedilmiş tek bir değişikliği bu dala kopyalıyor'],
    stash: ['Setting unfinished changes aside', 'Yarım kalan değişiklikleri kenara koyuyor'],
    reset: ['Taking back the changes picked for saving', 'Kayıt için seçilen değişiklikleri geri çekiyor'],
    restore: ['Putting files back as they were (unsaved edits are lost)', 'Dosyaları eski haline döndürüyor (kaydedilmemiş değişiklikler silinir)'],
    revert: ['Undoing an earlier saved version', 'Daha önce kaydedilmiş bir sürümü geri alıyor'],
    clean: ['Deleting files that were never saved', 'Hiç kaydedilmemiş dosyaları siliyor'],
    clone: ['Downloading a project', 'Bir projeyi indiriyor'],
    init: ['Starting to keep this folder’s history', 'Bu klasörün geçmişini tutmaya başlıyor'],
    worktree: ['Working with a separate copy of the project', 'Projenin ayrı bir çalışma kopyasıyla çalışıyor'],
    tag: ['Naming a saved version', 'Kaydedilmiş bir sürüme ad veriyor'],
    remote: ['Looking at where the shared copy lives', 'Ortak kopyanın nerede durduğuna bakıyor'],
  },
}

const GH: Family = {
  rest: ['Working with GitHub', 'GitHub ile çalışıyor'],
  sub: {
    pr: ['Looking at the change requests (PRs) on GitHub', 'GitHub’daki değişiklik isteklerine (PR) bakıyor'],
    issue: ['Looking at the open notes (issues) on GitHub', 'GitHub’daki açık kayıtlara (issue) bakıyor'],
    run: ['Checking GitHub’s automatic checks', 'GitHub’daki otomatik kontrollerin sonucuna bakıyor'],
    workflow: ['Checking GitHub’s automatic checks', 'GitHub’daki otomatik kontrollerin sonucuna bakıyor'],
    api: ['Asking GitHub for information', 'GitHub’dan bilgi alıyor'],
    repo: ['Looking at a project on GitHub', 'GitHub’daki bir projeye bakıyor'],
    release: ['Working with a published version on GitHub', 'GitHub’da yayımlanmış bir sürümle çalışıyor'],
  },
}

// npm, pnpm, yarn, bun: the word after the manager (or after `run`) says which of the project's own jobs runs.
const PACKAGE: Family = {
  rest: ['Running one of the project’s own jobs[: {x}]', 'Projenin hazır işlerinden birini çalıştırıyor[: {x}]'],
  sub: {
    install: INSTALL, i: INSTALL, add: INSTALL, ci: INSTALL, update: INSTALL, upgrade: INSTALL,
    uninstall: ['Removing a package', 'Bir paketi kaldırıyor'],
    remove: ['Removing a package', 'Bir paketi kaldırıyor'],
    test: TESTS, t: TESTS,
    build: BUILD,
    dev: ['Starting the app to try it out', 'Uygulamayı denemek için başlatıyor'],
    start: ['Starting the app', 'Uygulamayı başlatıyor'],
    serve: ['Starting the app', 'Uygulamayı başlatıyor'],
    lint: LINT, typecheck: TYPES, 'type-check': TYPES, check: LINT, format: FORMAT,
    publish: ['Publishing the package for everyone', 'Paketi herkesin kullanımına yayımlıyor'],
  },
}

const DOCKER: Family = {
  rest: ['Working with a container (a boxed-up app)', 'Bir kapsayıcıyla (kutulanmış uygulama) çalışıyor'],
  sub: {
    build: ['Packing the app into a container', 'Uygulamayı bir kapsayıcıya paketliyor'],
    run: ['Starting a container (a boxed-up app)', 'Bir kapsayıcıyı (kutulanmış uygulama) başlatıyor'],
    ps: ['Looking at the running containers', 'Çalışan kapsayıcılara bakıyor'],
    logs: ['Reading a container’s log', 'Bir kapsayıcının kayıtlarını okuyor'],
    compose: ['Starting or stopping the app’s containers', 'Uygulamanın kapsayıcılarını başlatıyor ya da durduruyor'],
  },
}

const CLAUDE: Family = {
  rest: ['Running a Claude Code command', 'Bir Claude Code komutu çalıştırıyor'],
  sub: {
    test: ['Running the mod’s tests', 'Modun testlerini çalıştırıyor'],
    validate: ['Checking that the mod follows the rules', 'Modun kurallara uyduğunu denetliyor'],
    install: ['Installing a mod', 'Bir mod kuruyor'],
    marketplace: ['Looking at where mods are installed from', 'Modların kurulduğu kaynağa bakıyor'],
  },
}

const FLUTTER: Family = {
  rest: ['Running a Flutter command', 'Bir Flutter komutu çalıştırıyor'],
  sub: {
    run: ['Starting the app on a phone or simulator', 'Uygulamayı telefonda ya da simülatörde başlatıyor'],
    build: BUILD, test: TESTS, analyze: LINT, format: FORMAT,
    pub: INSTALL, clean: ['Clearing the old build files', 'Eski derleme dosyalarını temizliyor'],
  },
}

const TOOLCHAIN: Family = { rest: BUILD, sub: { test: TESTS, run: SCRIPT, install: INSTALL, fmt: FORMAT, clippy: LINT, vet: LINT } }

export const FAMILIES: Readonly<Record<string, Family>> = {
  git: GIT, gh: GH, npm: PACKAGE, pnpm: PACKAGE, yarn: PACKAGE, bun: PACKAGE,
  docker: DOCKER, 'docker-compose': DOCKER, claude: CLAUDE, flutter: FLUTTER, dart: FLUTTER, cargo: TOOLCHAIN, go: TOOLCHAIN,
}

/** What the special cases of plain-shell.ts say. */
export const SHELL = {
  newBranch: ['Starting a new line of work (branch)[: {x}]', 'Yeni bir çalışma dalı (branch) açıyor[: {x}]'],
  hardReset: ['Throwing away the changes not saved yet', 'Henüz kaydedilmemiş değişiklikleri siliyor'],
  discard: ['Putting files back as they were (unsaved edits are lost)', 'Dosyaları eski haline döndürüyor (kaydedilmemiş değişiklikler silinir)'],
  dropStash: ['Throwing away the changes that were set aside', 'Kenara konmuş değişiklikleri siliyor'],
  deleteBranch: ['Deleting a line of work (branch)[: {x}]', 'Bir çalışma dalını (branch) siliyor[: {x}]'],
  forcePush: ['Overwriting the shared copy with its own versions', 'Ortak kopyanın üzerine kendi kayıtlarını yazıyor'],
  prCreate: ['Opening a change request (PR) on GitHub', 'GitHub’da bir değişiklik isteği (PR) açıyor'],
  prMerge: ['Merging a change request (PR) into the main code', 'Bir değişiklik isteğini (PR) ana koda birleştiriyor'],
  deleteFolder: ['Deleting a folder and everything in it[: {x}]', 'Bir klasörü içindekilerle birlikte siliyor[: {x}]'],
  findDelete: ['Finding files and deleting them', 'Dosyaları bulup siliyor'],
  editInPlace: ['Changing a file by a rule[: {x}]', 'Bir dosyayı kurala göre değiştiriyor[: {x}]'],
  writeFile: ['Writing into a file[: {x}]', 'Bir dosyaya yazıyor[: {x}]'],
  inlineScript: ['Running a short script it just wrote', 'O an yazdığı kısa bir betiği çalıştırıyor'],
  ownScript: ['Running the project’s own script[: {x}]', 'Projenin kendi betiğini çalıştırıyor[: {x}]'],
  fetchedTool: ['Running the “{x}” tool', '“{x}” aracını çalıştırıyor'],
  unknown: ['Running the “{x}” command', '“{x}” komutunu çalıştırıyor'],
  any: ['Running a terminal command', 'Bir terminal komutu çalıştırıyor'],
  then: [', then ', ', sonra '],
  more: [' (+{x} more)', ' (+{x} adım daha)'],
} as const satisfies Record<string, Entry>
