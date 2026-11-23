// Built by `bin/modz build` from the files beside it. Never edited by hand.
import { update } from 'claude-code';

const cp = (n) => String.fromCodePoint(n);
const CHEVRON_OPEN = cp(62588);
const CHEVRON_CLOSED = cp(62560);
const NAMES = {
  "agents.md": 983892,
  "changelog.md": 983892,
  "contributing.md": 983892,
  "todo.md": 983892,
  "readme.md": 983892,
  license: 58890,
  dockerfile: 985192,
  makefile: 987236,
  "cmakelists.txt": 987236,
  justfile: 984503,
  gemfile: 986413,
  rakefile: 986413,
  "cargo.toml": 59058,
  "cargo.lock": 59058,
  "pyproject.toml": 59058,
  "requirements.txt": 988686,
  "go.mod": 985850,
  "go.sum": 985043,
  "package.json": 984614,
  "package-lock.json": 984614,
  "tsconfig.json": 984614,
  ".prettierrc": 984614,
  ".eslintrc": 984614,
  "pnpm-lock.yaml": 59048,
  "yarn.lock": 59048,
  ".gitignore": 983714,
  ".gitmodules": 984211,
  ".editorconfig": 58962
};
const EXTS = {
  lua: 58912,
  py: 58886,
  pyi: 58886,
  js: 58892,
  mjs: 58892,
  cjs: 58892,
  ts: 58920,
  jsx: 58917,
  tsx: 59322,
  json: 58891,
  jsonc: 58891,
  yaml: 59048,
  yml: 59048,
  sh: 59285,
  bash: 59285,
  zsh: 59285,
  fish: 59285,
  md: 983892,
  markdown: 983892,
  css: 59064,
  scss: 983836,
  html: 59190,
  htm: 59190,
  go: 58919,
  rs: 59019,
  rb: 59281,
  php: 58888,
  java: 59192,
  cs: 983835,
  sql: 59142,
  graphql: 61966,
  gql: 61966,
  xml: 984512,
  toml: 59058,
  ini: 986050,
  conf: 984211,
  pdf: 60139,
  svg: 984865,
  jpg: 983589,
  jpeg: 983589,
  png: 58893,
  gif: 986488,
  webp: 983583,
  mp4: 983595,
  mkv: 983595,
  mov: 983595,
  mp3: 983587,
  wav: 983587,
  flac: 983587,
  zip: 984516,
  gz: 984516,
  xz: 984516,
  tar: 984516,
  qml: 62325,
  cpp: 58909,
  cc: 58909,
  cxx: 58909,
  c: 58910,
  h: 985845,
  hpp: 985845,
  vue: 59040,
  svelte: 59031,
  csv: 58954,
  txt: 985514
};
function fileIcon(n, open, isRepo) {
  if (n.kind === "link")
    return cp(62593);
  if (n.kind === "dir" && isRepo)
    return cp(983714);
  if (n.kind === "dir")
    return cp(open ? 58878 : 58879);
  const lower = n.name.toLowerCase();
  const named = NAMES[lower];
  if (named)
    return cp(named);
  const dot = lower.lastIndexOf(".");
  const ext = dot >= 0 ? lower.slice(dot + 1) : "";
  return cp(EXTS[ext] ?? 983572);
}
const GIT_COLOR = {
  A: "#98c379",
  "?": "#98c379",
  R: "#61afef",
  C: "#61afef",
  M: "#e5c07b",
  T: "#e5c07b"
};
const PRIORITY = ["U", "D", "M", "T", "R", "C", "A", "?"];
function stronger(a, b) {
  if (!a)
    return b;
  return PRIORITY.indexOf(b) < PRIORITY.indexOf(a) ? b : a;
}

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const lang = () => current;
const pick = (table) => table[current];

const count$1 = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const files = (n) => count$1(n, "file", "files");
const EN$1 = {
  title: "Files",
  command: "Opens the file tree; add a folder to show it instead (empty: the current folder)",
  needsFullscreen: "The file tree opens in a side panel, which needs the full-screen layout. Run /tui fullscreen, then /filetree.",
  needsColumns: (min) => `The file tree opens in a side panel, which needs a terminal window at least ${min} characters wide. Widen the window, then run /filetree.`,
  opened: (path, isFollowing) => `File tree: ${path}${isFollowing ? " (following the working folder)" : ""}.`,
  cutShort: (kind) => `${kind} cut short`,
  copied: (text) => `Copied: ${text}`,
  notCopied: "Could not copy the path",
  notOpened: (path, app) => `Could not open ${path} (${app})`,
  exitCode: (code) => `error code ${code}`,
  notListed: (dir, why) => `Could not list ${dir}: ${why}`,
  now: "Now",
  done: "Done",
  liveOne: { read: ["Claude is reading ", ""], edit: ["Claude is editing ", ""], commit: ["Claude saved ", " in a new version"] },
  liveMany: { read: (n) => `Claude is reading ${files(n)}`, edit: (n) => `Claude is editing ${files(n)}`, commit: (n) => `Claude saved ${files(n)} in a new version` },
  inDir: (dir) => `in ${dir}`,
  inRoot: "in the main project folder",
  openedFiles: (n) => `opened ${files(n)}`,
  editedFiles: (n) => `edited ${files(n)}`,
  noTouchYet: "no files touched yet",
  onBranch: (branch) => `on ${branch}`,
  toBranch: (branch) => `to ${branch}`,
  committedN: (n) => `Claude saved ${files(n)} in a new version`,
  editedN: (n) => `Claude edited ${files(n)}`,
  readN: (n) => `Claude read ${files(n)}`,
  untouched: "Claude didn't touch any files",
  untouchedSub: "No files read or edited last turn.",
  committing: "Claude is saving a new version",
  thinking: "Claude is thinking",
  waiting: "Claude is waiting",
  waitingSub: "No files touched this session yet",
  pillLive: { read: "Reading", edit: "Editing", commit: "Saved" },
  pillDone: { read: "Opened", edit: "Edited", commit: "Saved" },
  rowLive: { read: "reading", edit: "editing" },
  rowCommitted: "saved",
  rowStaged: "picked to save",
  emptyFolder: "empty folder",
  changes: (n) => count$1(n, "change", "changes"),
  cleanNoChanges: "all saved, no changes",
  clean: "all saved",
  touchedTitle: (n) => `Touched by Claude · ${files(n)}`,
  noTouchThisTurn: "No files touched this turn yet.",
  moreFiles: (n) => `+${n} more ${n === 1 ? "file" : "files"}`,
  noneYet: "none yet",
  legend: { read: "read", edit: "edited", warn: "not saved yet" },
  allFiles: "All files",
  noRepo: "no version history (git) here · changes show once there is one",
  find: "Find a file",
  findGo: "Go",
  findOpen: "Open",
  clear: "Clear",
  selected: "selected: ",
  tools: {
    refresh: "Refresh",
    collapse: "Collapse",
    showDates: "Show dates",
    showSizes: "Show sizes",
    up: "Parent folder",
    cwd: "Back to project",
    hideHidden: "Hide hidden files",
    showHidden: "Show hidden files",
    unselect: "Clear selection",
    less: "Less",
    more: "More"
  },
  whileFocused: "With the tree focused:",
  shortcuts: ["refresh", "collapse", "size/date", "hidden", "parent folder", "project", "clear selection"],
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  day: (day, month) => `${month} ${day}`,
  dayOfYear: (dayText, year) => `${dayText}, ${year}`,
  decimal: ".",
  thousands: ",",
  tokUnit: "tok",
  costTurn: ["", " tokens read this turn"],
  costNone: "No reads this turn",
  costSession: (n) => `session ${n}`,
  hubLive: (touched, edited) => edited > 0 ? `${edited} changed this turn` : `${files(touched)} read this turn`,
  hubEditedLast: (n) => `${files(n)} edited last turn`,
  hubNoRepo: "no version history",
  hubUncommitted: (n) => `${count$1(n, "unsaved change", "unsaved changes")}`,
  hubCommit: "new version saved · all saved",
  hubClean: "all saved"
};
const TR$1 = {
  title: "Dosyalar",
  command: "Dosya ağacını açar; başka bir klasör göstermek için onu yaz (boşsa şu anki klasör)",
  needsFullscreen: "Dosya ağacı yan panelde açılır; bunun için tam ekran düzen gerekir. Önce /tui fullscreen, sonra /filetree çalıştır.",
  needsColumns: (min) => `Dosya ağacı yan panelde açılır; terminal penceresi en az ${min} karakter genişliğinde olmalı. Pencereyi genişletip /filetree çalıştır.`,
  opened: (path, isFollowing) => `Dosya ağacı: ${path}${isFollowing ? " (çalışma klasörünü izliyor)" : ""}.`,
  cutShort: (kind) => `${kind} yarıda kaldı`,
  copied: (text) => `Kopyalandı: ${text}`,
  notCopied: "Yol kopyalanamadı",
  notOpened: (path, app) => `${path} açılamadı (${app})`,
  exitCode: (code) => `hata kodu ${code}`,
  notListed: (dir, why) => `${dir} listelenemedi: ${why}`,
  now: "Şu an",
  done: "Bitti",
  liveOne: { read: ["Claude ", " dosyasını okuyor"], edit: ["Claude ", " dosyasını düzenliyor"], commit: ["Claude ", " dosyasını yeni sürüm olarak kaydetti"] },
  liveMany: { read: (n) => `Claude ${n} dosyayı okuyor`, edit: (n) => `Claude ${n} dosyayı düzenliyor`, commit: (n) => `Claude ${n} dosyayı yeni sürüm olarak kaydetti` },
  inDir: (dir) => `${dir} klasöründe`,
  inRoot: "proje ana klasöründe",
  openedFiles: (n) => `${n} dosya açtı`,
  editedFiles: (n) => `${n} dosya düzenledi`,
  noTouchYet: "henüz dosyaya dokunmadı",
  onBranch: (branch) => `${branch} çalışma dalında`,
  toBranch: (branch) => `${branch} çalışma dalına`,
  committedN: (n) => `Claude ${n} dosyayı yeni sürüm olarak kaydetti`,
  editedN: (n) => `Claude ${n} dosyayı düzenledi`,
  readN: (n) => `Claude ${n} dosyayı okudu`,
  untouched: "Claude dosyalara dokunmadı",
  untouchedSub: "Son turda dosya okumadı, düzenlemedi.",
  committing: "Claude yeni sürüm kaydediyor",
  thinking: "Claude düşünüyor",
  waiting: "Claude bekliyor",
  waitingSub: "Bu oturumda henüz dosyaya dokunmadı",
  pillLive: { read: "Okunuyor", edit: "Düzenleniyor", commit: "Kaydedildi" },
  pillDone: { read: "Açıldı", edit: "Düzenlendi", commit: "Kaydedildi" },
  rowLive: { read: "okunuyor", edit: "düzenleniyor" },
  rowCommitted: "kaydedildi",
  rowStaged: "kayda seçildi",
  emptyFolder: "boş klasör",
  changes: (n) => `${n} değişiklik`,
  cleanNoChanges: "hepsi kayıtlı, değişiklik yok",
  clean: "hepsi kayıtlı",
  touchedTitle: (n) => `Claude'un dokundukları · ${n} dosya`,
  noTouchThisTurn: "Bu turda henüz dosyaya dokunmadı.",
  moreFiles: (n) => `+${n} dosya daha`,
  noneYet: "henüz yok",
  legend: { read: "okudu", edit: "düzenledi", warn: "henüz kaydedilmedi" },
  allFiles: "Tüm dosyalar",
  noRepo: "burada sürüm geçmişi (git) yok · olunca değişiklikler görünür",
  find: "Dosya bul",
  findGo: "git",
  findOpen: "Aç",
  clear: "Temizle",
  selected: "seçili: ",
  tools: {
    refresh: "Yenile",
    collapse: "Daralt",
    showDates: "Tarihleri göster",
    showSizes: "Boyutları göster",
    up: "Üst klasör",
    cwd: "Projeye dön",
    hideHidden: "Gizlileri gizle",
    showHidden: "Gizlileri göster",
    unselect: "Seçimi kaldır",
    less: "Daha az",
    more: "Daha fazla"
  },
  whileFocused: "Ağaç seçiliyken:",
  shortcuts: ["yenile", "daralt", "boyut/tarih", "gizliler", "üst klasör", "proje", "seçimi kaldır"],
  months: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
  day: (day, month) => `${day} ${month}`,
  dayOfYear: (dayText, year) => `${dayText} ${year}`,
  decimal: ",",
  thousands: ".",
  tokUnit: "token",
  costTurn: ["Bu turda okunanlar ", " token"],
  costNone: "Bu turda okuma yok",
  costSession: (n) => `oturum ${n}`,
  hubLive: (touched, edited) => edited > 0 ? `${edited} dosya değişti` : `${touched} dosya okundu`,
  hubEditedLast: (n) => `son tur ${n} dosya düzenlendi`,
  hubNoRepo: "sürüm geçmişi yok",
  hubUncommitted: (n) => `${n} değişiklik kaydedilmedi`,
  hubCommit: "yeni sürüm kaydedildi · hepsi kayıtlı",
  hubClean: "hepsi kayıtlı"
};
const words = () => pick({ en: EN$1, tr: TR$1 });

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const DEFAULT_THEME = {
  fg: "",
  accent: "#5b9bd5",
  muted: "#808a96",
  urgent: "#d0605e",
  selection: "#6b7280",
  bg: ""
};
function emptyTree(root) {
  return {
    root,
    nodes: [],
    expanded: [],
    cursor: "",
    selected: "",
    query: "",
    showHidden: true,
    showSize: false,
    dirSizes: {},
    git: {},
    diff: {},
    ignored: [],
    untrackedDirs: [],
    top: "",
    prefix: "",
    branch: null,
    counts: {},
    flash: [],
    flashDim: [],
    flashOn: false,
    flashTones: {},
    scroll: null,
    showTools: false
  };
}
function parseTheme(toml) {
  const get = (k) => toml.match(new RegExp(`^${k}\\s*=\\s*"(#[0-9a-fA-F]{6})"`, "m"))?.[1];
  return {
    fg: get("foreground") ?? get("color7") ?? DEFAULT_THEME.fg,
    accent: get("accent") ?? get("color4") ?? DEFAULT_THEME.accent,
    muted: get("muted") ?? get("color8") ?? DEFAULT_THEME.muted,
    urgent: get("red") ?? get("color1") ?? DEFAULT_THEME.urgent,
    selection: get("selection") ?? DEFAULT_THEME.selection,
    bg: get("dark_background") ?? get("background") ?? DEFAULT_THEME.bg
  };
}
function join(dir, name) {
  return dir.endsWith("/") ? dir + name : `${dir}/${name}`;
}
let drives = false;
function dirname(path) {
  if (drives && /^[A-Za-z]:\/[^/]*$/.test(path))
    return path.slice(0, 3);
  const i = path.lastIndexOf("/");
  return i <= 0 ? "/" : path.slice(0, i);
}
function useDrives(on) {
  drives = on;
}
function drivesOn() {
  return drives;
}
function posix(path) {
  if (!drives)
    return path;
  return path.replace(/\\/g, "/").replace(/^\/([A-Za-z])(\/|$)/, (_, d) => `${d.toUpperCase()}:/`);
}
function dropBelow(nodes, dirs) {
  if (dirs.length === 0)
    return nodes;
  const under = (id) => dirs.some((d) => id !== d && inside(d, id));
  const gone = new Set(dirs);
  return nodes.filter((n) => !under(n.id)).map((n) => gone.has(n.id) && n.loaded ? { ...n, loaded: false } : n);
}
function isAbsolute(path) {
  return path.startsWith("/") || drives && /^[A-Za-z]:\//.test(path);
}
function inside(root, path) {
  return path === root || path.startsWith(root.endsWith("/") ? root : `${root}/`);
}
function kindOf(e) {
  if (e.isLink)
    return "link";
  return e.kind === "dir" ? "dir" : "file";
}
function toNodes(dir, list) {
  return list.map((e) => ({
    id: join(dir, e.name),
    parent: dir,
    name: e.name,
    kind: kindOf(e),
    hidden: e.name.startsWith("."),
    mtime: e.mtimeMs,
    size: e.size,
    loaded: false
  })).sort((a, b) => (a.kind === "dir" ? 0 : 1) - (b.kind === "dir" ? 0 : 1) || collator.compare(a.name, b.name));
}
function replaceChildren(nodes, listed) {
  if (listed.size === 0)
    return nodes;
  const keep = new Map;
  for (const n of nodes)
    if (listed.has(n.parent))
      keep.set(n.id, n);
  const freshIds = new Set;
  for (const kids of listed.values())
    for (const k of kids)
      freshIds.add(k.id);
  const gone = new Set([...keep.keys()].filter((id) => !freshIds.has(id)));
  const under = (id) => {
    if (gone.size === 0)
      return false;
    for (let dir = dirname(id), prev = id;dir !== prev; prev = dir, dir = dirname(dir))
      if (gone.has(dir))
        return true;
    return false;
  };
  const fresh = [];
  for (const kids of listed.values()) {
    for (const k of kids) {
      if (under(k.id))
        continue;
      const old = keep.get(k.id);
      fresh.push(old && old.kind === "dir" && k.kind === "dir" ? { ...k, loaded: old.loaded } : k);
    }
  }
  const out = nodes.filter((n) => !listed.has(n.parent) && !under(n.id));
  return [...out.map((n) => listed.has(n.id) ? { ...n, loaded: true } : n), ...fresh];
}
function underAny(id, set, root) {
  if (set.size === 0)
    return false;
  let cur = id;
  while (cur.length >= root.length) {
    if (set.has(cur))
      return true;
    const up = dirname(cur);
    if (up === cur)
      break;
    cur = up;
  }
  return false;
}
function ancestorsOf(id, root) {
  const out = [];
  if (!root)
    return out;
  for (let dir = dirname(id), prev = id;dir !== prev && dir !== root && inside(root, dir); prev = dir, dir = dirname(dir))
    out.push(dir);
  return out;
}
function relative(root, path) {
  return path === root ? "" : path.slice(root.endsWith("/") ? root.length : root.length + 1);
}
function visibleRows(t) {
  const kids = new Map;
  for (const n of t.nodes) {
    if (!t.showHidden && n.hidden)
      continue;
    const list = kids.get(n.parent);
    if (list)
      list.push(n);
    else
      kids.set(n.parent, [n]);
  }
  const q = t.query.trim().toLowerCase();
  let keep = null;
  if (q) {
    keep = new Set;
    for (const n of t.nodes) {
      if (!relative(t.root, n.id).toLowerCase().includes(q))
        continue;
      keep.add(n.id);
      for (const a of ancestorsOf(n.id, t.root))
        keep.add(a);
    }
  }
  const open = new Set(t.expanded);
  const rows = [];
  const walk = (dir, depth) => {
    for (const n of kids.get(dir) ?? []) {
      if (keep && !keep.has(n.id))
        continue;
      const isOpen = n.kind === "dir" && (keep ? kids.has(n.id) : open.has(n.id));
      rows.push({ node: n, depth, open: isOpen });
      if (isOpen)
        walk(n.id, depth + 1);
    }
  };
  walk(t.root, 0);
  return rows;
}
function stamp(ms, now = Date.now()) {
  if (!ms)
    return "";
  const d = new Date(ms);
  const today = new Date(now);
  const p = (v) => String(v).padStart(2, "0");
  if (d.toDateString() === today.toDateString())
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
  const w = words();
  const day = w.day(d.getDate(), w.months[d.getMonth()] ?? "");
  return d.getFullYear() === today.getFullYear() ? day : w.dayOfYear(day, d.getFullYear());
}
function formatSize(bytes) {
  if (bytes < 0)
    return "?";
  if (bytes < 1024)
    return `${bytes} B`;
  const units = ["K", "M", "G", "T"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 100 ? v.toFixed(1).replace(".", words().decimal) : Math.round(v)} ${units[i]}`;
}
const unsized = (t, rows) => rows.filter((r) => r.node.kind === "dir" && !(r.node.id in t.dirSizes)).map((r) => r.node.id);

const LETTERS = ["D", "M", "R", "C", "A", "T"];
const MIN_RECORD = 4;
const PATH_AT = 3;
function parseBranch(record) {
  const body = record.replace(/^## /, "");
  if (body.startsWith("HEAD (no branch)"))
    return { head: "detached", upstream: "", ahead: 0, behind: 0 };
  const head = body.match(/^(?:No commits yet on |Initial commit on )?(.+?)(?:\.\.\.|\s|$)/)?.[1] ?? body;
  const upstream = body.match(/\.\.\.(\S+)/)?.[1] ?? "";
  const ahead = Number(body.match(/ahead (\d+)/)?.[1] ?? 0);
  const behind = Number(body.match(/behind (\d+)/)?.[1] ?? 0);
  return { head, upstream, ahead, behind };
}
function mapper(root, prefix) {
  return (rel) => rel.startsWith(prefix) ? join(root, rel.slice(prefix.length).replace(/\/$/, "")).replace(/\/$/, "") : null;
}
function changeOf(xy) {
  if (xy === "??" || xy.includes("A") && !xy.includes("D"))
    return "new";
  return xy.includes("D") && !/U/.test(xy) ? "del" : "mod";
}
function letterOf(xy) {
  if (xy === "??")
    return "?";
  if (/U/.test(xy) || xy === "AA" || xy === "DD")
    return "U";
  return LETTERS.find((c) => xy.includes(c)) ?? "";
}
function markUp(git, at, letter) {
  git[at.path] = stronger(git[at.path], letter);
  let dir = dirname(at.path);
  while (dir.length >= at.root.length && dir !== "/") {
    git[dir] = stronger(git[dir], letter);
    if (dir === at.root)
      break;
    dir = dirname(dir);
  }
}
function addRecord(out, rec, root) {
  const { xy, path } = rec;
  if (xy === "!!") {
    out.ignored.push(path);
    return;
  }
  if (xy === "??" && rec.isDir)
    out.untrackedDirs.push(path);
  else
    out.files[path] = changeOf(xy);
  const letter = letterOf(xy);
  if (letter)
    markUp(out.git, { path, root }, letter);
}
function parseGit(stdout, root, prefix) {
  const map = mapper(root, prefix);
  const out = { git: {}, ignored: [], untrackedDirs: [], branch: null, files: {} };
  const parts = stdout.split("\x00");
  for (let i = 0;i < parts.length; i++) {
    const rec = parts[i] ?? "";
    if (rec.startsWith("## ")) {
      out.branch = parseBranch(rec);
      continue;
    }
    if (rec.length < MIN_RECORD)
      continue;
    const xy = rec.slice(0, 2);
    const raw = rec.slice(PATH_AT);
    if (xy[0] === "R" || xy[0] === "C")
      i++;
    const path = map(raw);
    if (!path)
      continue;
    addRecord(out, { xy, path, isDir: raw.endsWith("/") }, root);
  }
  return out;
}
function parseNumstat(stdout, map) {
  const into = {};
  const parts = stdout.split("\x00");
  for (let i = 0;i < parts.length; i++) {
    const rec = parts[i] ?? "";
    if (!rec)
      continue;
    const m = rec.match(/^(-|\d+)\t(-|\d+)\t(.*)$/s);
    if (!m)
      continue;
    let path = m[3] ?? "";
    if (path === "") {
      i += 2;
      path = parts[i] ?? "";
    }
    if (!path)
      continue;
    const add = m[1] === "-" ? 0 : Number(m[1]);
    const del = m[2] === "-" ? 0 : Number(m[2]);
    const abs = map(path);
    if (!abs)
      continue;
    const prev = into[abs] ?? [0, 0];
    into[abs] = [prev[0] + add, prev[1] + del];
  }
  return into;
}
function rollUp(diff, root) {
  const out = { ...diff };
  for (const [path, [add, del]] of Object.entries(diff)) {
    let dir = dirname(path);
    while (dir.length >= root.length && dir !== "/") {
      const prev = out[dir] ?? [0, 0];
      out[dir] = [prev[0] + add, prev[1] + del];
      if (dir === root)
        break;
      dir = dirname(dir);
    }
  }
  return out;
}
function rollCounts(files, root) {
  const out = {};
  const slot = { new: 0, mod: 1, del: 2 };
  for (const [path, change] of Object.entries(files)) {
    let dir = dirname(path);
    while (dir.length >= root.length && dir !== "/") {
      const cur = out[dir] ?? [0, 0, 0];
      cur[slot[change]] += 1;
      out[dir] = cur;
      if (dir === root)
        break;
      dir = dirname(dir);
    }
  }
  return out;
}

function patch(h, fn) {
  return h.putTree((t) => ({ ...t, ...fn(t) }));
}

const mem = {
  isLooked: false,
  look: { isWindows: false, isRemote: async () => false },
  quick: { hasRepo: false, changed: 0 },
  blink: null,
  themePoll: null,
  themeMtime: null,
  generation: 0,
  lastPress: { key: "", at: 0 },
  noNerd: false,
  glyphSetting: "auto",
  follow: true,
  followClaude: true,
  queuedReads: [],
  showReads: true,
  showWrites: true,
  searchIndex: null,
  activityId: 0,
  pointer: true,
  view: { from: 0, max: 0 },
  lastSync: 0,
  noDock: false,
  home: "",
  dirty: { root: "", files: {} },
  lastRoot: "",
  freshPick: "",
  freshPickAt: 0,
  sizeDefault: false,
  sizeEpoch: 0,
  sizeQueue: [],
  background: new Map,
  loops: new Map,
  rate: { tokens: 0, chars: 0 }
};

function endTok(lx) {
  if (lx.has)
    lx.cur.push(lx.tok);
  lx.tok = "";
  lx.has = false;
}
function endSeg(lx) {
  endTok(lx);
  if (lx.cur.length)
    lx.out.push(lx.cur);
  lx.cur = [];
}
function take(lx, text) {
  lx.tok += text;
  lx.has = true;
}
function inQuote(lx, ch) {
  const { command } = lx;
  if (ch === lx.quote)
    lx.quote = "";
  else if (ch === "\\" && lx.quote === '"' && lx.i + 1 < command.length)
    lx.tok += command[++lx.i];
  else
    lx.tok += ch;
}
function operator(lx, ch) {
  const { command, i } = lx;
  if (ch === `
` || ch === ";") {
    lx.seps.push(";");
    endSeg(lx);
  } else if (ch === "&" && (command[i - 1] === ">" || command[i + 1] === ">"))
    take(lx, ch);
  else if (ch === "&" || ch === "|") {
    const twice = command[i + 1] === ch;
    if (twice)
      lx.i++;
    lx.seps.push(twice ? ch + ch : ch);
    endSeg(lx);
  } else
    return false;
  return true;
}
function step$1(lx, ch) {
  const { command } = lx;
  if (lx.quote)
    inQuote(lx, ch);
  else if (ch === '"' || ch === "'") {
    lx.quote = ch;
    lx.has = true;
  } else if (ch === "\\" && lx.i + 1 < command.length)
    take(lx, command[++lx.i] ?? "");
  else if (ch === "#" && !lx.has) {
    while (lx.i + 1 < command.length && command[lx.i + 1] !== `
`)
      lx.i++;
  } else if (ch === " " || ch === "\t")
    endTok(lx);
  else if (!operator(lx, ch))
    take(lx, ch);
}
function segments(command, seps = []) {
  const lx = { command, i: 0, out: [], cur: [], tok: "", quote: "", has: false, seps };
  for (;lx.i < command.length; lx.i++)
    step$1(lx, command[lx.i] ?? "");
  endSeg(lx);
  if (!lx.quote)
    return lx.out;
  seps.push(";");
  return command.split(/&&|\|\||;|\||\n/).map((s) => s.trim().split(/\s+/).filter(Boolean)).filter((s) => s.length > 0);
}
function stripGlobals(tokens) {
  const out = [...tokens];
  if (out[0] === "env")
    out.shift();
  while (out.length && /^[A-Z_][A-Z0-9_]*=/.test(out[0] ?? ""))
    out.shift();
  return out;
}
function tidy(path) {
  const s = path.replace(/\/+$/, "");
  if (s === "")
    return "/";
  return /^[A-Za-z]:$/.test(s) && isAbsolute(`${s}/`) ? `${s}/` : s;
}
function resolve(cwd, p, home = "") {
  let path = posix(p);
  if (home && (path === "~" || path.startsWith("~/")))
    path = home + path.slice(1);
  const drive = isAbsolute(path) && !path.startsWith("/") ? path.slice(0, 2) : "";
  const parts = isAbsolute(path) ? [drive] : posix(cwd).replace(/\/+$/, "").split("/");
  for (const seg of path.slice(drive.length).split("/")) {
    if (!seg || seg === ".")
      continue;
    if (seg === "..") {
      if (parts.length > 1)
        parts.pop();
    } else
      parts.push(seg);
  }
  return tidy(parts.join("/"));
}

const HUB_PANE = "files";
function hubOf(s) {
  const edited = s.edited ?? 0;
  const w = words();
  if (s.isRunning && s.touched > 0)
    return { detail: w.hubLive(s.touched, edited), tone: "live" };
  if (!s.hasRepo)
    return edited > 0 ? { detail: w.hubEditedLast(edited), tone: "idle" } : { detail: w.hubNoRepo, tone: "idle" };
  if (s.changed > 0)
    return { detail: w.hubUncommitted(s.changed), tone: "warn" };
  if (s.sha)
    return { detail: w.hubCommit, tone: "ok" };
  return { detail: w.hubClean, tone: "ok" };
}
function isSameCard(card, shown) {
  return card !== undefined && card.detail === shown.detail && card.tone === shown.tone;
}
function isOpenFor(value, pane) {
  return typeof value === "object" && value !== null && value.pane === pane;
}

const DEFAULT_CHARS_PER_TOKEN = 3;
const RATE_MIN_CHARS = 500;
const RANK = { exact: 0, share: 1, guess: 2 };
const NO_COST = { tokens: 0, kind: "exact", reads: 0 };
const promptOf = (u) => u.input_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens;
const sizeOf = (u) => u ? { prompt: promptOf(u), output: u.output_tokens } : null;
function growthOf(before, after) {
  if (!before || !after)
    return 0;
  return Math.max(0, after.prompt - before.prompt - before.output);
}
function textChars(content) {
  if (typeof content === "string")
    return { chars: content.length, isOpaque: false };
  if (!Array.isArray(content))
    return { chars: 0, isOpaque: true };
  return content.reduce((acc, part) => part.type === "text" && typeof part.text === "string" ? { ...acc, chars: acc.chars + part.text.length } : { ...acc, isOpaque: true }, { chars: 0, isOpaque: false });
}
function blockOf(b) {
  if (b.type === "text")
    return { id: "", ...textChars(String(b.text ?? "")) };
  if (b.type === "tool_result")
    return { id: String(b.tool_use_id ?? ""), ...textChars(b.content) };
  return { id: "", chars: 0, isOpaque: true };
}
const blocksOf = (m) => m && Array.isArray(m.content) ? [...m.content] : [];
function addedOf(messages, ids) {
  const at = messages.findLastIndex((m) => m.role === "user" && blocksOf(m).some((b) => b.type === "tool_result" && ids.includes(String(b.tool_use_id))));
  if (at < 0)
    return null;
  let start = at;
  while (start > 0 && messages[start - 1]?.role === "user")
    start--;
  let end = at;
  while (end + 1 < messages.length && messages[end + 1]?.role === "user")
    end++;
  const answer = messages[start - 1];
  const hasThinking = blocksOf(answer).some((b) => b.type === "thinking" || b.type === "redacted_thinking");
  return { blocks: messages.slice(start, end + 1).flatMap((m) => blocksOf(m).map(blockOf)), hasThinking };
}
function guess(chars, rate) {
  const perChar = rate.chars >= RATE_MIN_CHARS ? rate.tokens / rate.chars : 1 / DEFAULT_CHARS_PER_TOKEN;
  return Math.max(1, Math.round(chars * perChar));
}
const guessed = (reads, rate) => reads.map((r) => ({ file: r.file, cost: { tokens: guess(r.chars, rate), kind: "guess", reads: 1 } }));
const ownChars = (r, b) => r.chars > 0 ? Math.min(r.chars, b.chars) : b.chars;
function attribute(step, rate) {
  const { reads, added, grown } = step;
  const total = added?.blocks.reduce((s, b) => s + b.chars, 0) ?? 0;
  if (!added || grown <= 0 || total <= 0 || added.blocks.some((b) => b.isOpaque))
    return guessed(reads, rate);
  const isAlone = reads.length === 1 && added.blocks.length === 1 && !added.hasThinking;
  return reads.map((r) => {
    const b = added.blocks.find((x) => x.id === r.id);
    if (!b)
      return guessed([r], rate)[0];
    const own = ownChars(r, b);
    if (isAlone && own === b.chars)
      return { file: r.file, cost: { tokens: grown, kind: "exact", reads: 1 } };
    return { file: r.file, cost: { tokens: Math.max(1, Math.round(grown * own / total)), kind: "share", reads: 1 } };
  });
}
function rateAfter(rate, step) {
  const { added, grown } = step;
  if (!added || added.hasThinking || grown <= 0 || added.blocks.some((b) => b.isOpaque))
    return rate;
  const chars = added.blocks.reduce((s, b) => s + b.chars, 0);
  return chars > 0 ? { tokens: rate.tokens + grown, chars: rate.chars + chars } : rate;
}
function merge(a, b) {
  if (!a)
    return b;
  return { tokens: a.tokens + b.tokens, kind: RANK[b.kind] > RANK[a.kind] ? b.kind : a.kind, reads: a.reads + b.reads };
}
const sumOf = (costs) => costs.reduce((acc, c) => merge(acc, c), NO_COST);

const NO_TURN = { isRunning: false, hasRun: false, touches: [], sha: "", committed: 0, costs: {} };
const TOUCH_RANK = { read: 0, edit: 1, commit: 2 };
const TOUCH_LIMIT = 200;
async function syncHub(h) {
  const t = await h.tree();
  const turn = await h.turn();
  const changed = mem.isLooked ? (t.counts[t.root] ?? [0, 0, 0]).reduce((a, b) => a + b, 0) : mem.quick.changed;
  const hasRepo = mem.isLooked ? Boolean(t.top) : mem.quick.hasRepo;
  const edited = turn.touches.filter((x) => x.role !== "read").length;
  const shown = hubOf({ isRunning: turn.isRunning, touched: turn.touches.length, hasRepo, changed, edited, sha: turn.sha });
  if (isSameCard(await h.hubCard(), shown))
    return;
  await h.setHubCard({ pane: HUB_PANE, ...shown, at: await h.now() });
}
async function noteTouches(h, ids, role) {
  if (ids.length === 0)
    return;
  const at = await h.now();
  await h.setTurn((cur) => {
    const log = { ...NO_TURN, ...cur, hasRun: true };
    const touches = [...log.touches];
    for (const id of ids) {
      const i = touches.findIndex((x) => x.id === id);
      const old = touches[i];
      if (!old)
        touches.push({ id, role, at });
      else
        touches[i] = { id, role: TOUCH_RANK[role] > TOUCH_RANK[old.role] ? role : old.role, at };
    }
    return { ...log, touches: touches.slice(-TOUCH_LIMIT) };
  });
  await syncHub(h);
}
async function noteCommit(h, fields) {
  await h.setTurn((cur) => ({ ...NO_TURN, ...cur, hasRun: true, ...fields }));
  await syncHub(h);
}
async function noteCosts(h, list) {
  if (list.length === 0)
    return;
  await h.setTurn((cur) => {
    const costs = { ...cur.costs };
    for (const { file, cost } of list)
      costs[file] = merge(costs[file], cost);
    return { ...NO_TURN, ...cur, costs };
  });
  await h.setReadTotal((cur) => list.reduce((acc, { cost }) => merge(acc, cost), cur ?? NO_COST));
}

const GIT_TIMEOUT_MS = 20000;
const QUICK_MS = 5000;
const GIT_DIR_LEVELS = 64;
let gitRun = null;
let gitNext = null;
function git(h, cwd, call) {
  const { args, timeoutMs = GIT_TIMEOUT_MS } = call;
  return h.run(["git", "--no-optional-locks", "-C", cwd, ...args], { timeoutMs, env: { GIT_OPTIONAL_LOCKS: "0" } });
}
async function detectRepo(h) {
  const t = await h.tree();
  if (!t.root)
    return;
  let top = "";
  let prefix = "";
  try {
    const run = await git(h, t.root, { args: ["rev-parse", "--show-prefix", "--show-toplevel"], timeoutMs: QUICK_MS });
    const [p = "", tl = ""] = run.exitCode === 0 ? run.stdout.split(`
`) : [];
    prefix = p.trim();
    top = tl.trim();
  } catch {
    top = "";
  }
  await patch(h, (cur) => cur.root === t.root ? { top, prefix } : {});
}
async function untracked(h, root, dirs) {
  if (!dirs.length)
    return [];
  const others = await git(h, root, { args: ["ls-files", "-o", "--exclude-standard", "-z", "--", ...dirs.map((d) => d.slice(root.length + 1) || ".")] });
  return others.exitCode === 0 ? others.stdout.split("\x00").filter(Boolean) : [];
}
async function readGit(h) {
  const t = await h.tree();
  if (!t.root || !t.top)
    return;
  const root = t.root;
  try {
    const status = await git(h, root, { args: ["status", "--porcelain=v1", "-b", "-z", "--ignored=traditional", "--untracked-files=normal", "--", "."] });
    if (status.exitCode !== 0)
      return;
    const parsed = parseGit(status.stdout, root, t.prefix);
    const head = await git(h, root, { args: ["diff", "HEAD", "--numstat", "-z", "--", "."] });
    const diff = head.exitCode === 0 ? parseNumstat(head.stdout, mapper(root, t.prefix)) : {};
    const files = { ...parsed.files };
    for (const rel of await untracked(h, root, parsed.untrackedDirs))
      files[join(root, rel)] = "new";
    for (const path of Object.keys(diff))
      if (files[path] === "new")
        delete diff[path];
    mem.dirty = { root, files };
    const { git: marks, ignored, untrackedDirs, branch } = parsed;
    await patch(h, (cur) => cur.root === root ? { git: marks, ignored, untrackedDirs, branch, counts: rollCounts(files, root), diff: rollUp(diff, root) } : {});
    await syncHub(h);
  } catch {
    return;
  }
}
const STATUS_ENTRY = /^[ MTADRCU?!]{2} /;
async function quickStatus(h) {
  if (mem.isLooked)
    return;
  try {
    const run = await git(h, posix(await h.cwd()), { args: ["status", "--porcelain=v1", "-z", "--untracked-files=normal"], timeoutMs: QUICK_MS });
    mem.quick = run.exitCode === 0 ? { hasRepo: true, changed: run.stdout.split("\x00").filter((entry) => STATUS_ENTRY.test(entry)).length } : { hasRepo: false, changed: 0 };
  } catch {
    mem.quick = { hasRepo: false, changed: 0 };
  }
  await syncHub(h);
}
const hubAfterTurn = (h) => mem.isLooked ? syncHub(h) : quickStatus(h);
function refreshGit(h) {
  if (!gitRun) {
    gitRun = readGit(h).finally(() => {
      gitRun = null;
    });
    return gitRun;
  }
  const rerun = () => {
    gitNext = null;
    return refreshGit(h);
  };
  gitNext ??= gitRun.then(rerun, rerun);
  return gitNext;
}
async function headOf(h, cwd) {
  try {
    const run = await git(h, cwd, { args: ["rev-parse", "HEAD"], timeoutMs: QUICK_MS });
    return run.exitCode === 0 ? run.stdout.trim() : "";
  } catch {
    return "";
  }
}
async function gitPaths(h, at, isCommitted) {
  const map = mapper(at.root, at.prefix);
  try {
    const args = isCommitted ? ["diff-tree", "--root", "--no-commit-id", "--name-only", "-r", "-z", "HEAD"] : ["diff", "--cached", "--name-only", "-z"];
    const run = await git(h, at.root, { args, timeoutMs: QUICK_MS });
    return run.exitCode === 0 ? run.stdout.split("\x00").filter(Boolean).flatMap((rel) => map(rel) ?? []) : [];
  } catch {
    return [];
  }
}
async function gitDir(h, cwd) {
  for (let dir = cwd, i = 0;i < GIT_DIR_LEVELS; i++) {
    try {
      const dot = join(dir, ".git");
      const st = await h.stat(dot);
      if (st.kind === "dir")
        return dot;
      const ref = /^gitdir:\s*(.+)$/m.exec(String(await h.read(dot)))?.[1]?.trim();
      if (ref)
        return resolve(dir, ref, mem.home);
    } catch {
      const up = dirname(dir);
      if (up === dir)
        return "";
      dir = up;
      continue;
    }
    return "";
  }
  return "";
}

const REVEAL_PASSES = 32;
let listSeq = 0;
const listLatest = new Map;
const unreadable = new Set;
function shortPath(path) {
  return mem.home && inside(mem.home, path) ? `~${path.slice(mem.home.length)}` : path;
}
async function exists(h, path) {
  try {
    await h.stat(path);
    return true;
  } catch {
    return false;
  }
}
async function entryOf(h, dir, e) {
  if (!e.isLink)
    return { name: e.name, kind: e.kind, mtimeMs: e.mtimeMs, size: e.size, isLink: false };
  try {
    const target = await h.stat(join(dir, e.name));
    return target.kind === "dir" ? { name: e.name, kind: "dir", mtimeMs: target.mtimeMs, size: 0, isLink: false } : { name: e.name, kind: "file", mtimeMs: target.mtimeMs, size: target.size, isLink: true };
  } catch {
    return { name: e.name, kind: "other", mtimeMs: 0, size: 0, isLink: true };
  }
}
async function list(h, dir) {
  try {
    const entries = await h.list(dir);
    const resolved = await Promise.all(entries.map((e) => entryOf(h, dir, e)));
    unreadable.delete(dir);
    return toNodes(dir, resolved);
  } catch (err) {
    if (!await exists(h, dir))
      return [];
    if (!unreadable.has(dir)) {
      unreadable.add(dir);
      h.toast(words().notListed(shortPath(dir), err instanceof Error ? err.message : String(err)));
    }
    return null;
  }
}
async function loadDirs(h, dirs) {
  const root = (await h.tree()).root;
  const seq = ++listSeq;
  for (const dir of dirs)
    listLatest.set(dir, seq);
  const results = await Promise.all(dirs.map(async (dir) => [dir, await list(h, dir)]));
  const listed = new Map;
  for (const [dir, kids] of results) {
    if (listLatest.get(dir) !== seq)
      continue;
    listLatest.delete(dir);
    if (kids)
      listed.set(dir, kids);
  }
  await patch(h, (t) => t.root === root ? { nodes: replaceChildren(t.nodes, listed) } : {});
  return listed;
}
function unloaded(t, paths, tried) {
  const loaded = new Set(t.nodes.filter((n) => n.loaded).map((n) => n.id));
  if (t.nodes.some((n) => n.parent === t.root))
    loaded.add(t.root);
  const need = new Set;
  for (const p of paths) {
    for (const dir of [t.root, ...ancestorsOf(p, t.root).reverse()]) {
      if (!loaded.has(dir)) {
        if (!tried.has(dir))
          need.add(dir);
        break;
      }
    }
  }
  return need;
}
async function revealPaths(h, paths) {
  const tried = new Set;
  for (let pass = 0;pass < REVEAL_PASSES; pass++) {
    const need = unloaded(await h.tree(), paths, tried);
    if (need.size === 0)
      return;
    for (const dir of need)
      tried.add(dir);
    await loadDirs(h, [...need]);
  }
}
function openDirs(t) {
  const open = new Set(t.expanded);
  return t.nodes.filter((n) => n.kind === "dir" && n.loaded && open.has(n.id)).map((n) => n.id);
}

const BRANCH_ROW = "#branch";
const FLASH_MS = 2700;
function unlit() {
  return { flash: [], flashDim: [], flashOn: false, flashTones: {} };
}
function cancelFlash() {
  mem.generation += 1;
  mem.blink?.cancel();
  mem.blink = null;
}
function keepTop(cur, expanded) {
  if (mem.followClaude)
    return { scroll: null };
  const top = visibleRows(cur)[cur.scroll ?? mem.view.from]?.node.id;
  const at = top ? visibleRows({ ...cur, expanded }).findIndex((r) => r.node.id === top) : -1;
  return at < 0 ? {} : { scroll: at };
}
function lit(cur, tones) {
  const unique = Object.keys(tones);
  const open = new Set(cur.expanded);
  const bright = new Set([...cur.flashOn ? cur.flash.filter((id) => !unique.includes(id)) : [], ...unique]);
  const dim = new Set(cur.flashOn ? cur.flashDim : []);
  const all = cur.flashOn ? { ...cur.flashTones } : {};
  for (const id of unique) {
    const tone = tones[id] ?? "orange";
    all[id] = tone;
    if (id === BRANCH_ROW)
      continue;
    const chain = ancestorsOf(id, cur.root);
    if (!chain.some((a) => !open.has(a)))
      continue;
    for (const a of chain) {
      if (!open.has(a)) {
        dim.add(a);
        all[a] = all[a] ?? tone;
      }
      open.add(a);
    }
  }
  for (const id of bright)
    dim.delete(id);
  return { flash: [...bright], flashDim: [...dim], flashOn: true, flashTones: all, expanded: [...open], ...keepTop(cur, [...open]) };
}
async function flash(h, tones) {
  if (Object.keys(tones).length === 0)
    return;
  const mine = ++mem.generation;
  const root = (await h.tree()).root;
  mem.blink?.cancel();
  mem.blink = null;
  await patch(h, (cur) => cur.root === root ? lit(cur, tones) : {});
  if (mem.generation !== mine)
    return;
  mem.blink = h.after(FLASH_MS, () => {
    if (mem.generation !== mine)
      return;
    mem.blink = null;
    patch(h, () => mem.generation === mine ? unlit() : {});
  });
}

const LINUX_LAUNCH = 'setsid -f -w "$@" </dev/null >/dev/null 2>&1 & p=$!; sleep 1; kill -0 "$p" 2>/dev/null && exit 0; wait "$p"';
const LINUX_OPEN = [
  "set -f",
  "f=$1",
  "if command -v gio >/dev/null; then",
  '  if [ -f "$f" ] && command -v file >/dev/null && encoding=$(file -b --mime-encoding -- "$f") && [ -n "$encoding" ] && [ "$encoding" != binary ]; then',
  `    case $(gio info -a standard::content-type -- "$f" | sed -n 's/.*standard::content-type: //p') in`,
  "      video/* | audio/*)",
  "        app=$(xdg-mime query default text/plain)",
  "        IFS=:",
  '        for dir in "${XDG_DATA_HOME:-$HOME/.local/share}" ${XDG_DATA_DIRS:-/usr/local/share:/usr/share}; do',
  '          [ -n "$app" ] && [ -f "$dir/applications/$app" ] && exec gio launch "$dir/applications/$app" "$f"',
  "        done",
  '        echo "No text/plain desktop application found for $f" >&2',
  "        exit 1",
  "        ;;",
  "    esac",
  "  fi",
  '  if (exec gio open "$f"); then exit 0; fi',
  "fi",
  'exec xdg-open "$f"'
].join(`
`);
const WIN_OPEN = "$ErrorActionPreference = 'Stop'; [Diagnostics.Process]::Start([Diagnostics.ProcessStartInfo]@{ FileName = $env:PANE_OPEN_TARGET; UseShellExecute = $true }) | Out-Null";
function argvOf(os, target) {
  if (os === "linux")
    return ["sh", "-c", LINUX_LAUNCH, "sh", "sh", "-c", LINUX_OPEN, "sh", target];
  return os === "darwin" ? ["open", "--", target] : ["powershell", "-NoProfile", "-NonInteractive", "-Command", WIN_OPEN];
}
function openCommand(os, target) {
  const argv = argvOf(os, target);
  return {
    argv,
    init: {
      timeoutMs: 1e4,
      ...os === "win32" ? { env: { PANE_OPEN_TARGET: /^[a-z][a-z0-9+.-]*:\/\//i.test(target) ? target : target.replace(/\//g, "\\") } } : {}
    }
  };
}

const UNAME_MS = 3000;
const APPEARANCE_MS = 2000;
const FONT_MS = 5000;
const VERSION_MS = 3000;
const HERDR_POINTER = 9001;
const MAJOR = 1e6;
const MINOR = 1000;
const FONT_SCRIPT = 'if command -v fc-list >/dev/null 2>&1; then f=$(fc-list ":charset=$1" file | grep -vi lastresort | head -n1 | cut -d: -f1); fi; ' + '[ -n "$f" ] || for g in "$HOME"/Library/Fonts/*Nerd* /Library/Fonts/*Nerd*; do [ -f "$g" ] && LC_ALL=C grep -aqE "Nerd Fonts ([3-9]|[1-9][0-9]+)\\." "$g" && { f=$g; break; }; done; ' + '[ -n "$f" ] || { echo missing; exit 0; }; m=$(stat -c %Z "$f" 2>/dev/null || stat -f %c "$f"); p=$PPID; ' + 'while [ -n "$p" ] && [ "$p" -gt 1 ]; do c=$(ps -o comm= -p "$p" 2>/dev/null); c=$(basename "$c" 2>/dev/null | tr -d " "); case "$c" in ' + "ghostty|kitty|alacritty|Alacritty|foot|footclient|wezterm-gui|konsole|gnome-terminal-|xterm|urxvt|st|Terminal|iTerm2) " + `e=$(ps -o etime= -p "$p" 2>/dev/null | awk -F'[-:]' '{n=NF; s=$n+60*$(n-1); if (n>2) s+=3600*$(n-2); if (n>3) s+=86400*$(n-3); print s}'); [ -n "$e" ] && [ $(( $(date +%s) - e )) -lt "$m" ] && echo stale || echo ok; exit 0;; esac; ` + 'p=$(ps -o ppid= -p "$p" 2>/dev/null | tr -d " "); done; echo ok';
let platform = null;
function osName(h) {
  platform ??= (async () => {
    if (await h.osEnv() === "Windows_NT")
      return "win32";
    try {
      return (await h.run(["uname", "-s"], { timeoutMs: UNAME_MS })).stdout.trim() === "Darwin" ? "darwin" : "linux";
    } catch {
      return "linux";
    }
  })();
  return platform;
}
async function macDark(h) {
  const mac = await h.run(["defaults", "read", "-g", "AppleInterfaceStyle"], { timeoutMs: APPEARANCE_MS });
  if (mac.exitCode === 0)
    return mac.stdout.trim() === "Dark";
  return /does not exist/.test(mac.stderr) ? false : undefined;
}
async function systemDark(h) {
  const os = await osName(h);
  try {
    if (os === "darwin")
      return await macDark(h);
    if (os !== "linux")
      return;
    const gnome = await h.run(["gsettings", "get", "org.gnome.desktop.interface", "color-scheme"], { timeoutMs: APPEARANCE_MS });
    return gnome.exitCode === 0 ? gnome.stdout.includes("dark") : undefined;
  } catch {
    return;
  }
}
async function fontState(h, charset) {
  try {
    const out = (await h.run(["sh", "-c", FONT_SCRIPT, "sh", charset], { timeoutMs: FONT_MS })).stdout.trim();
    return out === "stale" || out === "missing" ? out : "ok";
  } catch {
    return "missing";
  }
}
async function finePointerOk(h) {
  if (!await h.herdrEnv())
    return true;
  try {
    const out = (await h.run([await h.herdrBin() || "herdr", "--version"], { timeoutMs: VERSION_MS })).stdout;
    const [major = 0, minor = 0, fix = 0] = (/(\d+)\.(\d+)\.(\d+)/.exec(out) ?? []).slice(1).map(Number);
    return major * MAJOR + minor * MINOR + fix >= HERDR_POINTER;
  } catch {
    return false;
  }
}
async function openFile(h, path) {
  const { argv, init } = openCommand(await osName(h), path);
  try {
    const run = await h.run(argv, init);
    if (run.exitCode !== 0)
      h.toast(`${words().notOpened(path, argv[0] ?? "")}: ${run.stderr.trim().split(`
`)[0] || words().exitCode(run.exitCode)}`);
  } catch {
    h.toast(words().notOpened(path, argv[0] ?? ""));
  }
}

const PRUNE = [".git", "node_modules", "target", ".venv", "__pycache__", "dist", ".next"];
const HOME_PRUNE = ["Library", "AppData", ".Trash"];
const FIND_MS = 8000;
const TOUCH_MS = 3000;
const MS_PER_S = 1000;
const IGNORED_LIMIT = 40;
const STAT_LIMIT = 4000;
let markId = 0;
function broad(root) {
  return root === mem.home || root === "/" || /^[A-Za-z]:\/$/.test(root);
}
function rootOfDisk(root) {
  return root === "/" || /^[A-Za-z]:\/$/.test(root);
}
function pruneArgs(root, ignored = []) {
  const names = broad(root) ? [...PRUNE, ...HOME_PRUNE] : PRUNE;
  return ["(", ...names.flatMap((name, i) => i === 0 ? ["-name", name] : ["-o", "-name", name]), ...ignored.flatMap((p) => ["-o", "-path", p]), ")", "-prune", "-o"];
}
async function newer(h, paths, sinceMs) {
  const stats = await Promise.all(paths.map(async (p) => {
    try {
      return (await h.stat(p)).mtimeMs > sinceMs ? p : "";
    } catch {
      return "";
    }
  }));
  return stats.filter(Boolean);
}
async function changedSince(h, scan) {
  const { root, since, depth = 0, ignored = [] } = scan;
  if (rootOfDisk(root))
    return [];
  const test = since.mark ? ["-newer", since.mark] : ["-newermt", `@${(since.ms / MS_PER_S).toFixed(3)}`];
  const prune = pruneArgs(root, ignored.filter((p) => inside(root, p)).slice(0, IGNORED_LIMIT));
  try {
    const run = await h.run(["find", "-H", root, "-xdev", ...depth ? ["-maxdepth", String(depth)] : [], ...prune, ...test, "-print0"], { timeoutMs: FIND_MS });
    return run.stdout.split("\x00").filter((p) => p && p !== root);
  } catch {
    return [];
  }
}
async function changedInRepo(h, scan, before) {
  const { root, since } = scan;
  if (mem.dirty.root !== root)
    return { hits: since.os === "win32" ? [] : await changedSince(h, { root, since, depth: 0, ignored: scan.ignored ?? [] }), gone: [] };
  const entries = Object.entries(mem.dirty.files);
  const gone = entries.filter(([p, c]) => c === "del" && before[p] !== "del").map(([p]) => p);
  const live = entries.filter(([, c]) => c !== "del").map(([p]) => p);
  return { hits: await newer(h, live.slice(0, STAT_LIMIT), since.ms), gone };
}
async function sinceNow(h, writes) {
  const ms = await h.now();
  const os = await osName(h);
  if (os !== "darwin" || !writes)
    return { ms, mark: "", os };
  const mark = `${(await h.tmpdir() || "/tmp").replace(/\/+$/, "")}/filetree-${await h.sessionId()}-${++markId}.mark`;
  try {
    await h.run(["touch", mark], { timeoutMs: TOUCH_MS });
    return { ms, mark, os };
  } catch {
    return { ms, mark: "", os };
  }
}

const SEARCH_REVEAL_LIMIT = 60;
const JUMP_LIMIT = 10;
const LIST_MS = 1e4;
const WALK_LIMIT = 20000;
const DISK_DEPTH = 3;
const DEPTH = 6;
function dropIndex() {
  mem.searchIndex = null;
}
async function walk(h, root, at) {
  const out = [];
  let level = [root];
  for (let d = 0;d < at.depth && level.length && out.length < at.limit; d++) {
    const next = [];
    for (const dir of level) {
      for (const n of await list(h, dir) ?? []) {
        if (n.kind === "dir") {
          if (!PRUNE.includes(n.name))
            next.push(n.id);
        } else
          out.push(n.id);
      }
      if (out.length >= at.limit)
        break;
    }
    level = next;
  }
  return out;
}
async function listAll(h, t) {
  const depth = rootOfDisk(t.root) ? DISK_DEPTH : DEPTH;
  try {
    if (!t.top && await osName(h) === "win32")
      return await walk(h, t.root, { depth, limit: WALK_LIMIT });
    const run = t.top ? await git(h, t.root, { args: ["ls-files", "-co", "--exclude-standard", "-z"], timeoutMs: LIST_MS }) : await h.run(["find", "-H", t.root, "-xdev", "-maxdepth", String(depth), ...pruneArgs(t.root), "-type", "f", "-print0"], { timeoutMs: LIST_MS });
    if (t.top && run.exitCode !== 0)
      return null;
    const paths = run.stdout.split("\x00").filter(Boolean);
    if (run.isStdoutTruncated)
      paths.pop();
    return paths.map((p) => isAbsolute(p) ? p : join(t.root, p));
  } catch {
    return null;
  }
}
function indexPaths(h, t) {
  if (mem.searchIndex?.root !== t.root) {
    const index = {
      root: t.root,
      paths: listAll(h, t).then((paths) => {
        if (paths === null && mem.searchIndex === index)
          mem.searchIndex = null;
        return paths ?? [];
      })
    };
    mem.searchIndex = index;
  }
  return mem.searchIndex.paths;
}
async function search(h, query) {
  if (!(await h.tree()).query.trim())
    mem.searchIndex = null;
  await patch(h, () => ({ query }));
  const q = query.trim().toLowerCase();
  if (!q)
    return [];
  const t = await h.tree();
  const hits = (await indexPaths(h, t)).filter((p) => relative(t.root, p).toLowerCase().includes(q)).slice(0, SEARCH_REVEAL_LIMIT);
  if ((await h.tree()).query !== query)
    return [];
  await revealPaths(h, hits);
  const shown = await h.tree();
  const ids = new Set(shown.nodes.map((n) => n.id));
  const stale = [...new Set(hits.filter((p) => !ids.has(p)).map(dirname))].filter((d) => inside(shown.root, d));
  if (stale.length)
    await loadDirs(h, stale);
  return hits;
}
async function jump(h, query) {
  const hits = (await search(h, query)).slice(0, JUMP_LIMIT);
  await patch(h, (cur) => {
    const open = new Set(cur.expanded);
    for (const p of hits)
      for (const a of ancestorsOf(p, cur.root))
        open.add(a);
    return { query: "", expanded: [...open], cursor: hits[0] ?? cur.cursor, scroll: null };
  });
}

const MARK = { exact: "", share: "≈", guess: "~" };
const THOUSAND = 1000;
const DECIMAL_BELOW = 100;
const grouped = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, words().thousands);
function short(n) {
  if (n < THOUSAND)
    return String(Math.round(n));
  const k = n / THOUSAND;
  return k < DECIMAL_BELOW ? `${k.toFixed(1).replace(".", words().decimal)}k` : `${Math.round(k)}k`;
}
const costText = (c, isShort = false) => `${MARK[c.kind]}${isShort ? short(c.tokens) : grouped(c.tokens)}`;
function turnCost(turn) {
  const all = Object.values(turn.costs ?? {});
  return all.length ? sumOf(all) : null;
}
function rowCost(turn, id) {
  const c = turn.costs?.[id];
  return c ? `${costText(c, true)} ${words().tokUnit}` : "";
}

const EN_VERBS = {
  commit: { running: "saving a new version", done: "new version saved" },
  push: { running: "sending to the shared copy", done: "sent to the shared copy" },
  pull: { running: "bringing in from the shared copy", done: "brought in from the shared copy" },
  fetch: { running: "checking the shared copy", done: "checked the shared copy" },
  checkout: { running: "switching version", done: "switched version" },
  switch: { running: "switching line of work", done: "switched line of work" },
  branch: { running: "starting a line of work", done: "line of work started" },
  merge: { running: "joining lines of work", done: "lines of work joined" },
  rebase: { running: "moving onto the newest code", done: "moved onto the newest code" },
  "cherry-pick": { running: "copying a saved version", done: "saved version copied" },
  stash: { running: "setting changes aside", done: "changes set aside" },
  reset: { running: "going back to a saved version", done: "back at a saved version" },
  restore: { running: "restoring", done: "restored" },
  revert: { running: "undoing a saved version", done: "saved version undone" },
  add: { running: "picking changes to save", done: "picked to save" },
  rm: { running: "removing", done: "removed" },
  mv: { running: "moving", done: "moved" },
  tag: { running: "labelling a version", done: "version labelled" },
  init: { running: "starting version history", done: "version history started" },
  clone: { running: "downloading a copy", done: "copy downloaded" },
  "pr create": { running: "opening a change request", done: "change request opened" },
  "pr merge": { running: "accepting a change request", done: "change request accepted" },
  "pr checkout": { running: "getting a change request", done: "change request here" },
  "pr comment": { running: "commenting on a change request", done: "commented on a change request" },
  "pr review": { running: "reviewing a change request", done: "change request reviewed" },
  "repo clone": { running: "downloading a copy", done: "copy downloaded" },
  "release create": { running: "publishing a release", done: "release published" },
  "issue create": { running: "opening an issue", done: "issue opened" }
};
const TR_VERBS = {
  commit: { running: "yeni sürüm kaydediliyor", done: "yeni sürüm kaydedildi" },
  push: { running: "ortak kopyaya gönderiliyor", done: "ortak kopyaya gönderildi" },
  pull: { running: "ortak kopyadan alınıyor", done: "ortak kopyadan alındı" },
  fetch: { running: "ortak kopyaya bakılıyor", done: "ortak kopyaya bakıldı" },
  checkout: { running: "sürüm değiştiriliyor", done: "sürüm değiştirildi" },
  switch: { running: "çalışma dalı değiştiriliyor", done: "çalışma dalı değiştirildi" },
  branch: { running: "çalışma dalı açılıyor", done: "çalışma dalı açıldı" },
  merge: { running: "çalışma dalları birleştiriliyor", done: "çalışma dalları birleşti" },
  rebase: { running: "en güncel kodun üstüne taşınıyor", done: "en güncel kodun üstüne taşındı" },
  "cherry-pick": { running: "bir kayıt kopyalanıyor", done: "kayıt kopyalandı" },
  stash: { running: "değişiklikler kenara konuyor", done: "değişiklikler kenara kondu" },
  reset: { running: "bir kayda dönülüyor", done: "kayda dönüldü" },
  restore: { running: "geri yükleniyor", done: "geri yüklendi" },
  revert: { running: "bir kayıt geri alınıyor", done: "kayıt geri alındı" },
  add: { running: "kaydedilecekler seçiliyor", done: "kayda seçildi" },
  rm: { running: "siliniyor", done: "silindi" },
  mv: { running: "taşınıyor", done: "taşındı" },
  tag: { running: "sürüm etiketleniyor", done: "sürüm etiketlendi" },
  init: { running: "sürüm geçmişi başlatılıyor", done: "sürüm geçmişi başladı" },
  clone: { running: "kopya indiriliyor", done: "kopya indirildi" },
  "pr create": { running: "değişiklik isteği açılıyor", done: "değişiklik isteği açıldı" },
  "pr merge": { running: "değişiklik isteği kabul ediliyor", done: "değişiklik isteği kabul edildi" },
  "pr checkout": { running: "değişiklik isteği alınıyor", done: "değişiklik isteği alındı" },
  "pr comment": { running: "değişiklik isteğine yorum yazılıyor", done: "değişiklik isteğine yorum yazıldı" },
  "pr review": { running: "değişiklik isteği inceleniyor", done: "değişiklik isteği incelendi" },
  "repo clone": { running: "kopya indiriliyor", done: "kopya indirildi" },
  "release create": { running: "sürüm yayımlanıyor", done: "sürüm yayımlandı" },
  "issue create": { running: "sorun kaydı açılıyor", done: "sorun kaydı açıldı" }
};
const EN = {
  reasons: {
    nothing: "no changes to save",
    identity: "git does not know your name and email yet",
    notRepo: "no version history (git) here",
    conflicts: "clashing changes not settled yet",
    sign: "could not sign the version",
    emptyMessage: "the version has no description",
    locked: "git is busy with another job (index.lock)",
    hook: "a project check stopped it (git hook)"
  },
  committed: "new version saved",
  committedIn: (place) => `new version saved · ${place}`,
  noCommit: (reason) => `not saved: ${reason}`,
  noCommitMade: "no new version saved",
  commitRan: "tried to save a new version",
  failed: (doing) => `Did not work: ${doing}`,
  ran: (doing) => `Ran: ${doing}`
};
const TR = {
  reasons: {
    nothing: "kaydedilecek değişiklik yok",
    identity: "git adını ve e-postanı henüz bilmiyor",
    notRepo: "burada sürüm geçmişi (git) yok",
    conflicts: "çakışan değişiklikler henüz çözülmedi",
    sign: "sürüm imzalanamadı",
    emptyMessage: "kaydın açıklaması boş",
    locked: "git başka bir işle meşgul (index.lock)",
    hook: "bir proje denetimi durdurdu (git hook)"
  },
  committed: "yeni sürüm kaydedildi",
  committedIn: (place) => `yeni sürüm kaydedildi · ${place}`,
  noCommit: (reason) => `kaydedilmedi: ${reason}`,
  noCommitMade: "yeni sürüm kaydedilmedi",
  commitRan: "yeni sürüm kaydetmeyi denedi",
  failed: (doing) => `Olmadı: ${doing}`,
  ran: (doing) => `Çalıştı: ${doing}`
};
const gitWords = () => pick({ en: EN, tr: TR });
const saidOf = (verb) => pick({ en: EN_VERBS, tr: TR_VERBS })[verb] ?? { running: verb, done: verb };

const SHA_SHOWN = 7;
const ASSIGN = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/s;
const UNSURE = /[$`*?]|^~[^/]|^-$/;
const SUBSHELL_HEADS = new Set(["pushd", "popd", "source", ".", "eval", "sh", "bash", "zsh"]);
const REASONS = [
  [/nothing to commit|nothing added to commit|no changes added to commit/i, "nothing"],
  [/please tell me who you are|author identity unknown|empty ident name/i, "identity"],
  [/not a git repository/i, "notRepo"],
  [/unmerged files|fix conflicts|not concluded your merge/i, "conflicts"],
  [/gpg failed|failed to sign/i, "sign"],
  [/empty commit message/i, "emptyMessage"],
  [/index\.lock/i, "locked"],
  [/hook (failed|exited|declined)|pre-commit|commit-msg/i, "hook"]
];
function commitReason(text) {
  const reason = REASONS.find(([pattern]) => pattern.test(text))?.[1];
  return reason === undefined ? "" : gitWords().reasons[reason];
}
function expand(token, vars) {
  return token.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (whole, braced, bare) => vars[braced ?? bare] ?? whole);
}
function step(dir, to, home) {
  if (!to || UNSURE.test(to))
    return null;
  const isRooted = isAbsolute(to) || to === "~" || to.startsWith("~/");
  if (!dir && !isRooted)
    return null;
  return resolve(dir || "/", to, home);
}
function gitDirOf(command, at) {
  const vars = at.home ? { HOME: at.home } : {};
  let dir = at.cwd;
  let first;
  for (const raw of segments(command)) {
    const tokens = raw.map((t) => expand(t, vars));
    const assigns = tokens.map((t) => ASSIGN.exec(t));
    if (assigns.every(Boolean)) {
      for (const m of assigns)
        if (m)
          vars[m[1] ?? ""] = m[2] ?? "";
      continue;
    }
    const words = stripGlobals(tokens);
    const head = words[0]?.split("/").pop() ?? "";
    if (SUBSHELL_HEADS.has(head) || head.startsWith("("))
      return null;
    if (head === "cd")
      dir = dir === null ? null : step(dir, words[1], at.home);
    if (head !== "git")
      continue;
    const run = gitCall(words, dir, at.home);
    if (run.verb === "commit")
      return run.dir;
    if (first === undefined)
      first = run.dir;
  }
  return first ?? null;
}
function gitCall(words, dir, home) {
  let at = dir;
  let i = 1;
  while (i < words.length && (words[i] ?? "").startsWith("-")) {
    if (words[i] === "-C")
      at = at === null ? null : step(at, words[i + 1], home);
    if (words[i] === "-C" || words[i] === "-c")
      i++;
    i++;
  }
  return { verb: words[i] ?? "", dir: at === "" ? null : at };
}
function placeOf(dir, home) {
  if (dir === null)
    return { isHere: !home.isAgent, name: "" };
  if (home.top && inside(home.top, dir))
    return { isHere: true, name: "" };
  return { isHere: false, name: dir.slice(dir.lastIndexOf("/") + 1) || dir };
}
function commitOutcome(f) {
  const w = gitWords();
  if (f.sha)
    return { state: "done", label: f.place ? w.committedIn(f.place) : w.committed, detail: f.sha.slice(0, SHA_SHOWN) };
  const reason = commitReason(f.text);
  if (reason)
    return { state: "failed", label: w.noCommit(reason), detail: "" };
  if (f.isDirKnown || f.hasFailed)
    return { state: "failed", label: w.noCommitMade, detail: "" };
  return { state: "done", label: w.commitRan, detail: "" };
}

const ICON$1 = {
  commit: { nerd: "", plain: "●" },
  push: { nerd: "\uDB81\uDD52", plain: "↑" },
  pull: { nerd: "\uDB81\uDD53", plain: "↓" },
  branch: { nerd: "", plain: "⑂" },
  merge: { nerd: "", plain: "⑃" },
  pr: { nerd: "", plain: "⇄" },
  github: { nerd: "", plain: "◎" },
  stash: { nerd: "\uDB80\uDDBC", plain: "≡" },
  undo: { nerd: "\uDB81\uDD4C", plain: "↶" },
  tag: { nerd: "", plain: "⌖" },
  git: { nerd: "", plain: "±" }
};
const TONES = {
  orange: { bright: ["#f97316", "#fb923c", "#fdba74", "#ffedd5"], dim: ["#8a4316", "#a3562a", "#bd7444", "#d29267"], solid: "#f97316" },
  green: { bright: ["#22c55e", "#4ade80", "#86efac", "#dcfce7"], dim: ["#14532d", "#166534", "#2f7a47", "#4f9a66"], solid: "#4ade80" },
  teal: { bright: ["#14b8a6", "#2dd4bf", "#5eead4", "#ccfbf1"], dim: ["#0f5e57", "#16786f", "#2a9488", "#4fb3a8"], solid: "#2dd4bf" },
  blue: { bright: ["#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe"], dim: ["#1e3a8a", "#1d4ed8", "#3b6fd1", "#6b93dc"], solid: "#60a5fa" },
  iris: { bright: ["#a855f7", "#c084fc", "#d8b4fe", "#f3e8ff"], dim: ["#581c87", "#6b21a8", "#8b47c4", "#a874d6"], solid: "#c084fc" },
  purple: { bright: ["#a855f7", "#c084fc", "#d8b4fe", "#f3e8ff"], dim: ["#581c87", "#6b21a8", "#8b47c4", "#a874d6"], solid: "#c084fc" },
  cyan: { bright: ["#06b6d4", "#22d3ee", "#67e8f9", "#cffafe"], dim: ["#155e75", "#0e7490", "#2b8ea3", "#5aa9b8"], solid: "#22d3ee" },
  red: { bright: ["#ef4444", "#f87171", "#fca5a5", "#fee2e2"], dim: ["#7f1d1d", "#991b1b", "#b54040", "#c96a6a"], solid: "#f87171" }
};
const GIT_VERBS = {
  commit: { verb: "commit", tone: "green", icon: ICON$1.commit },
  push: { verb: "push", tone: "teal", icon: ICON$1.push },
  pull: { verb: "pull", tone: "blue", icon: ICON$1.pull },
  fetch: { verb: "fetch", tone: "blue", icon: ICON$1.pull },
  checkout: { verb: "checkout", tone: "blue", icon: ICON$1.branch },
  switch: { verb: "switch", tone: "blue", icon: ICON$1.branch },
  branch: { verb: "branch", tone: "blue", icon: ICON$1.branch },
  merge: { verb: "merge", tone: "iris", icon: ICON$1.merge },
  rebase: { verb: "rebase", tone: "iris", icon: ICON$1.merge },
  "cherry-pick": { verb: "cherry-pick", tone: "iris", icon: ICON$1.merge },
  stash: { verb: "stash", tone: "orange", icon: ICON$1.stash },
  reset: { verb: "reset", tone: "red", icon: ICON$1.undo },
  restore: { verb: "restore", tone: "red", icon: ICON$1.undo },
  revert: { verb: "revert", tone: "red", icon: ICON$1.undo },
  add: { verb: "add", tone: "green", icon: ICON$1.git },
  rm: { verb: "rm", tone: "red", icon: ICON$1.git },
  mv: { verb: "mv", tone: "orange", icon: ICON$1.git },
  tag: { verb: "tag", tone: "iris", icon: ICON$1.tag },
  init: { verb: "init", tone: "green", icon: ICON$1.git, init: true },
  clone: { verb: "clone", tone: "blue", icon: ICON$1.pull, init: true }
};
const GH_VERBS = {
  "pr create": { verb: "pr create", tone: "iris", icon: ICON$1.pr },
  "pr merge": { verb: "pr merge", tone: "iris", icon: ICON$1.merge },
  "pr checkout": { verb: "pr checkout", tone: "blue", icon: ICON$1.pr },
  "pr comment": { verb: "pr comment", tone: "iris", icon: ICON$1.pr },
  "pr review": { verb: "pr review", tone: "iris", icon: ICON$1.pr },
  "repo clone": { verb: "repo clone", tone: "blue", icon: ICON$1.github, init: true },
  "release create": { verb: "release create", tone: "iris", icon: ICON$1.tag },
  "issue create": { verb: "issue create", tone: "iris", icon: ICON$1.github }
};
const READ_ONLY_GIT = new Set(["status", "log", "diff", "show", "blame", "rev-parse", "ls-files", "grep", "describe", "config", "remote", "reflog", "shortlog", "help", "version", "check-ignore"]);
function gitVerb(tokens) {
  let i = 1;
  while (i < tokens.length && (tokens[i] ?? "").startsWith("-")) {
    if (tokens[i] === "-C" || tokens[i] === "-c")
      i++;
    i++;
  }
  return i;
}
function gitReadOnly(verb, rest) {
  if (!verb || READ_ONLY_GIT.has(verb))
    return true;
  if (verb === "stash")
    return ["list", "show"].includes(rest[0] ?? "");
  if (verb === "branch")
    return rest.every((t) => t.startsWith("-"));
  if (verb === "tag")
    return rest.length === 0 || rest.some((t) => /^(-l|--list|-n\d*|--contains|--points-at|--merged|--no-merged|-v|--verify)$/.test(t));
  return false;
}
function chainOf(command) {
  const seps = [];
  const size = segments(command, seps).length;
  return { size, and: seps.every((s) => s === "&&") };
}
function gitActions(command) {
  const out = [];
  for (const raw of segments(command)) {
    const tokens = stripGlobals(raw);
    const head = tokens[0]?.split("/").pop();
    if (head === "git") {
      const i = gitVerb(tokens);
      const verb = tokens[i] ?? "";
      const rest = tokens.slice(i + 1);
      if (gitReadOnly(verb, rest))
        continue;
      const spec = verb === "checkout" && rest.includes("--") ? GIT_VERBS.restore : GIT_VERBS[verb];
      if (spec)
        out.push({ kind: `git ${verb}`, ...spec, ...saidOf(spec.verb) });
    } else if (head === "gh") {
      const pair = `${tokens[1] ?? ""} ${tokens[2] ?? ""}`;
      const spec = GH_VERBS[pair];
      if (spec)
        out.push({ kind: `gh ${pair}`, ...spec, ...saidOf(spec.verb) });
    }
  }
  return out;
}
const BRANCH_ICON = ICON$1.branch;
const READERS = new Set(["rg", "grep", "egrep", "fgrep", "find", "fd", "fdfind", "cat", "head", "tail", "bat", "less", "more", "ls", "eza", "tree", "wc", "sed", "awk", "jq"]);
const PATTERN_FIRST = new Set(["rg", "grep", "egrep", "fgrep", "sed", "awk", "jq"]);
const OUTPUT_PATHS = new Set(["rg", "grep", "egrep", "fgrep", "find", "fd", "fdfind"]);
const WRITE_FLAGS = /^-(delete|exec|execdir|ok|okdir|fprint\w*|fls|x|X|-exec|-exec-batch)$/;
function readOnly(command) {
  const bare = ` ${command}`.replace(/\d*>&\d/g, " ").replace(/(\d*|&)>>?\s*\/dev\/null/g, " ");
  if (/[^>]>[^>&]|>>/.test(bare))
    return false;
  return segments(command).every((raw) => {
    const tokens = stripGlobals(raw);
    const head = tokens[0]?.split("/").pop() ?? "";
    if (head === "cd" || head === "echo" || head === "printf" || head === "true" || head === "pwd")
      return true;
    if (head === "git") {
      const i = gitVerb(tokens);
      return gitReadOnly(tokens[i] ?? "", tokens.slice(i + 1));
    }
    if (head === "sed")
      return !tokens.some((t) => /^-i/.test(t));
    if (head === "find" || head === "fd" || head === "fdfind")
      return !tokens.some((t) => WRITE_FLAGS.test(t));
    return READERS.has(head);
  });
}
function readTargets(command, at) {
  const { stdout, home = "" } = at;
  let cwd = at.cwd;
  const out = new Set;
  let listsPaths = false;
  for (const raw of segments(command)) {
    const tokens = stripGlobals(raw).map((t) => posix(t.replace(/^["']|["']$/g, "")));
    const head = tokens[0]?.split("/").pop() ?? "";
    if (head === "cd" && tokens[1]) {
      cwd = resolve(cwd, tokens[1], home);
      continue;
    }
    if (!READERS.has(head))
      continue;
    if (head === "sed" && tokens.some((t) => /^-i/.test(t)))
      continue;
    if (OUTPUT_PATHS.has(head))
      listsPaths = true;
    const args = tokens.slice(1);
    let skipPattern = PATTERN_FIRST.has(head) && !args.some((t) => t === "-e" || t === "-f" || t === "--files");
    for (let i = 0;i < args.length; i++) {
      const a = args[i] ?? "";
      if (a.startsWith("-")) {
        if (/^-(e|f|g|t|T|m|A|B|C|-glob|-type|-max-count|name|iname|maxdepth|mindepth)$/.test(a))
          i++;
        continue;
      }
      if (skipPattern) {
        skipPattern = false;
        continue;
      }
      if (/[*?<>|]/.test(a))
        continue;
      out.add(resolve(cwd, a, home));
    }
  }
  if (listsPaths) {
    for (const line of stdout.split(`
`).slice(0, 400)) {
      const path = posix(line).match(drivesOn() ? /^((?:[A-Za-z]:)?[^:\0]+?)(?::\d+[:-]|$|:)/ : /^([^:\0]+?)(?::\d+[:-]|$|:)/)?.[1]?.trim();
      if (path && !path.includes(" "))
        out.add(resolve(cwd, path, home));
    }
  }
  return [...out].slice(0, 60);
}

const textOf = (entry, lang) => entry[lang === "tr" ? 1 : 0];
function fill(template, x = "") {
  const named = x.trim();
  return template.replace(/\[([^\]]*)\]/g, (_, part) => named ? part : "").replace(/\{x\}/g, named);
}
const READ = ["Reading a file[: {x}]", "Bir dosyayı okuyor[: {x}]", "file"];
const SEARCH = ["Searching inside files[ for “{x}”]", "Dosyaların içinde[ “{x}”] arıyor", "arg"];
const TESTS = ["Running the tests", "Testleri çalıştırıyor"];
const BUILD = ["Building the project", "Projeyi derliyor (çalışır hale getiriyor)"];
const INSTALL = ["Installing the packages the project needs", "Projenin ihtiyaç duyduğu paketleri kuruyor"];
const LINT = ["Checking the code against the style rules", "Kodun yazım kurallarına uyduğunu denetliyor"];
const TYPES = ["Checking the code for type errors", "Kodda tip hatası var mı diye denetliyor"];
const FORMAT = ["Tidying the code’s layout", "Kodun biçimini düzeltiyor"];
const SCRIPT = ["Running a script[: {x}]", "Bir betik (küçük program) çalıştırıyor[: {x}]", "first"];
const SHAPE = ["Tidying a command’s output", "Bir komutun çıktısını düzenliyor"];
const PROCESSES = ["Looking at the running programs", "Çalışan programlara bakıyor"];
const DATABASE = ["Querying the database", "Veritabanını sorguluyor"];
const ARCHIVE = ["Working with an archive file", "Arşiv (sıkıştırılmış) dosyasıyla çalışıyor"];
const SERVICE = ["Working with the {x} service", "{x} servisiyle çalışıyor"];
const COMMANDS = {
  cat: READ,
  head: READ,
  tail: READ,
  less: READ,
  more: READ,
  bat: READ,
  grep: SEARCH,
  rg: SEARCH,
  ag: SEARCH,
  ack: SEARCH,
  ls: ["Listing the files in a folder", "Bir klasördeki dosyaları listeliyor"],
  tree: ["Listing the files in a folder", "Bir klasördeki dosyaları listeliyor"],
  find: ["Looking for files", "Dosya arıyor"],
  fd: ["Looking for files", "Dosya arıyor"],
  wc: ["Counting lines", "Satırları sayıyor"],
  diff: ["Comparing two files", "İki dosyayı karşılaştırıyor"],
  sed: ["Reading part of a file[: {x}]", "Bir dosyanın bir bölümünü okuyor[: {x}]", "file"],
  awk: SHAPE,
  sort: SHAPE,
  uniq: SHAPE,
  cut: SHAPE,
  tr: SHAPE,
  xargs: SHAPE,
  tee: SHAPE,
  column: SHAPE,
  jq: ["Reading JSON data", "JSON verisini okuyor"],
  cd: ["Moving to another folder", "Başka bir klasöre geçiyor"],
  pwd: ["Checking which folder it is in", "Hangi klasörde olduğuna bakıyor"],
  mkdir: ["Making a new folder[: {x}]", "Yeni bir klasör oluşturuyor[: {x}]", "file"],
  touch: ["Making an empty file[: {x}]", "Boş bir dosya oluşturuyor[: {x}]", "file"],
  cp: ["Copying files", "Dosya kopyalıyor"],
  mv: ["Moving or renaming files", "Dosya taşıyor ya da adını değiştiriyor"],
  rm: ["Deleting a file[: {x}]", "Dosya siliyor[: {x}]", "file"],
  rmdir: ["Deleting an empty folder", "Boş bir klasörü siliyor"],
  ln: ["Making a shortcut to a file", "Bir dosyaya kısayol oluşturuyor"],
  chmod: ["Changing who may use a file", "Bir dosyanın izinlerini değiştiriyor"],
  chown: ["Changing who owns a file", "Bir dosyanın sahibini değiştiriyor"],
  echo: ["Printing a line of text[: “{x}”]", "Ekrana bir yazı yazdırıyor[: “{x}”]", "arg"],
  printf: ["Printing a line of text[: “{x}”]", "Ekrana bir yazı yazdırıyor[: “{x}”]", "arg"],
  curl: ["Fetching data from the internet[: {x}]", "İnternetten veri alıyor[: {x}]", "host"],
  wget: ["Downloading from the internet[: {x}]", "İnternetten indiriyor[: {x}]", "host"],
  kill: ["Stopping a running program", "Çalışan bir programı durduruyor"],
  pkill: ["Stopping a running program", "Çalışan bir programı durduruyor"],
  killall: ["Stopping a running program", "Çalışan bir programı durduruyor"],
  ps: PROCESSES,
  top: PROCESSES,
  lsof: PROCESSES,
  pgrep: PROCESSES,
  sleep: ["Waiting a moment", "Kısa bir süre bekliyor"],
  open: ["Opening a file or an app", "Bir dosyayı ya da uygulamayı açıyor"],
  which: ["Checking whether a tool is installed", "Bir aracın kurulu olup olmadığına bakıyor"],
  type: ["Checking whether a tool is installed", "Bir aracın kurulu olup olmadığına bakıyor"],
  env: ["Looking at the environment settings", "Ortam ayarlarına bakıyor"],
  printenv: ["Looking at the environment settings", "Ortam ayarlarına bakıyor"],
  date: ["Checking the date and time", "Tarihe ve saate bakıyor"],
  tar: ARCHIVE,
  zip: ARCHIVE,
  unzip: ARCHIVE,
  gzip: ARCHIVE,
  gunzip: ARCHIVE,
  ssh: ["Connecting to another computer", "Başka bir bilgisayara bağlanıyor"],
  scp: ["Copying files to another computer", "Başka bir bilgisayara dosya kopyalıyor"],
  rsync: ["Copying files, only what changed", "Dosyaları kopyalıyor (yalnızca değişenleri)"],
  sqlite3: DATABASE,
  psql: DATABASE,
  mysql: DATABASE,
  du: ["Checking how much disk space is used", "Ne kadar disk alanı kullanıldığına bakıyor"],
  df: ["Checking how much disk space is free", "Ne kadar boş disk alanı olduğuna bakıyor"],
  stat: ["Looking at a file’s details", "Bir dosyanın bilgilerine bakıyor"],
  file: ["Looking at a file’s details", "Bir dosyanın bilgilerine bakıyor"],
  shasum: ["Taking a file’s fingerprint", "Bir dosyanın parmak izini (özetini) alıyor"],
  md5: ["Taking a file’s fingerprint", "Bir dosyanın parmak izini (özetini) alıyor"],
  screencapture: ["Taking a screenshot", "Ekran görüntüsü alıyor"],
  ffmpeg: ["Processing a video or sound file", "Bir video ya da ses dosyasını işliyor"],
  osascript: ["Driving a Mac app with a script", "Bir Mac uygulamasını betikle yönetiyor"],
  tsc: TYPES,
  eslint: LINT,
  biome: LINT,
  ruff: LINT,
  prettier: FORMAT,
  jest: TESTS,
  vitest: TESTS,
  pytest: TESTS,
  mocha: TESTS,
  playwright: TESTS,
  python: SCRIPT,
  python3: SCRIPT,
  node: SCRIPT,
  deno: SCRIPT,
  ruby: SCRIPT,
  bash: SCRIPT,
  sh: SCRIPT,
  zsh: SCRIPT,
  swift: SCRIPT,
  pip: INSTALL,
  pip3: INSTALL,
  uv: INSTALL,
  poetry: INSTALL,
  pod: INSTALL,
  gem: INSTALL,
  brew: ["Installing or updating a tool on this Mac", "Bu Mac’e bir araç kuruyor ya da güncelliyor"],
  make: BUILD,
  xcodebuild: BUILD,
  gradle: BUILD,
  gradlew: BUILD,
  kubectl: ["Working with the servers the app runs on", "Uygulamanın çalıştığı sunucularla çalışıyor"],
  supabase: SERVICE,
  vercel: SERVICE,
  wrangler: SERVICE,
  firebase: SERVICE,
  netlify: SERVICE,
  aws: SERVICE,
  gcloud: SERVICE
};
const GIT = {
  rest: ["Working with the project’s saved history (git)", "Projenin kayıtlı geçmişiyle (git) çalışıyor"],
  sub: {
    status: ["Checking which files have changed", "Hangi dosyaların değiştiğine bakıyor"],
    diff: ["Looking over the changes made", "Yapılan değişiklikleri inceliyor"],
    log: ["Looking at the earlier saved versions", "Daha önce kaydedilmiş sürümlere bakıyor"],
    show: ["Looking at an earlier saved version", "Daha önce kaydedilmiş bir sürüme bakıyor"],
    blame: ["Checking who last changed each line", "Her satırı en son kimin değiştirdiğine bakıyor"],
    add: ["Picking the changes to save", "Kaydedilecek değişiklikleri seçiyor"],
    commit: ["Saving the changes as a new version (commit)", "Değişiklikleri yeni bir sürüm olarak kaydediyor (commit)"],
    push: ["Sending the saved versions to the shared copy (push)", "Kaydedilen sürümleri ortak kopyaya gönderiyor (push)"],
    pull: ["Bringing in what is new in the shared copy", "Ortak kopyadaki yenilikleri alıyor"],
    fetch: ["Checking what is new in the shared copy", "Ortak kopyada ne yeni diye bakıyor"],
    checkout: ["Switching to another line of work (branch)", "Başka bir çalışma dalına (branch) geçiyor"],
    switch: ["Switching to another line of work (branch)", "Başka bir çalışma dalına (branch) geçiyor"],
    branch: ["Looking at the lines of work (branches)", "Çalışma dallarına (branch) bakıyor"],
    merge: ["Joining two lines of work", "İki çalışma dalını birleştiriyor"],
    rebase: ["Moving its saved versions onto the newest code", "Kendi kayıtlarını en güncel kodun üstüne taşıyor"],
    "cherry-pick": ["Copying one saved change onto this branch", "Kaydedilmiş tek bir değişikliği bu dala kopyalıyor"],
    stash: ["Setting unfinished changes aside", "Yarım kalan değişiklikleri kenara koyuyor"],
    reset: ["Taking back the changes picked for saving", "Kayıt için seçilen değişiklikleri geri çekiyor"],
    restore: ["Putting files back as they were (unsaved edits are lost)", "Dosyaları eski haline döndürüyor (kaydedilmemiş değişiklikler silinir)"],
    revert: ["Undoing an earlier saved version", "Daha önce kaydedilmiş bir sürümü geri alıyor"],
    clean: ["Deleting files that were never saved", "Hiç kaydedilmemiş dosyaları siliyor"],
    clone: ["Downloading a project", "Bir projeyi indiriyor"],
    init: ["Starting to keep this folder’s history", "Bu klasörün geçmişini tutmaya başlıyor"],
    worktree: ["Working with a separate copy of the project", "Projenin ayrı bir çalışma kopyasıyla çalışıyor"],
    tag: ["Naming a saved version", "Kaydedilmiş bir sürüme ad veriyor"],
    remote: ["Looking at where the shared copy lives", "Ortak kopyanın nerede durduğuna bakıyor"]
  }
};
const GH = {
  rest: ["Working with GitHub", "GitHub ile çalışıyor"],
  sub: {
    pr: ["Looking at the change requests (PRs) on GitHub", "GitHub’daki değişiklik isteklerine (PR) bakıyor"],
    issue: ["Looking at the open notes (issues) on GitHub", "GitHub’daki açık kayıtlara (issue) bakıyor"],
    run: ["Checking GitHub’s automatic checks", "GitHub’daki otomatik kontrollerin sonucuna bakıyor"],
    workflow: ["Checking GitHub’s automatic checks", "GitHub’daki otomatik kontrollerin sonucuna bakıyor"],
    api: ["Asking GitHub for information", "GitHub’dan bilgi alıyor"],
    repo: ["Looking at a project on GitHub", "GitHub’daki bir projeye bakıyor"],
    release: ["Working with a published version on GitHub", "GitHub’da yayımlanmış bir sürümle çalışıyor"]
  }
};
const PACKAGE = {
  rest: ["Running one of the project’s own jobs[: {x}]", "Projenin hazır işlerinden birini çalıştırıyor[: {x}]"],
  sub: {
    install: INSTALL,
    i: INSTALL,
    add: INSTALL,
    ci: INSTALL,
    update: INSTALL,
    upgrade: INSTALL,
    uninstall: ["Removing a package", "Bir paketi kaldırıyor"],
    remove: ["Removing a package", "Bir paketi kaldırıyor"],
    test: TESTS,
    t: TESTS,
    build: BUILD,
    dev: ["Starting the app to try it out", "Uygulamayı denemek için başlatıyor"],
    start: ["Starting the app", "Uygulamayı başlatıyor"],
    serve: ["Starting the app", "Uygulamayı başlatıyor"],
    lint: LINT,
    typecheck: TYPES,
    "type-check": TYPES,
    check: LINT,
    format: FORMAT,
    publish: ["Publishing the package for everyone", "Paketi herkesin kullanımına yayımlıyor"]
  }
};
const DOCKER = {
  rest: ["Working with a container (a boxed-up app)", "Bir kapsayıcıyla (kutulanmış uygulama) çalışıyor"],
  sub: {
    build: ["Packing the app into a container", "Uygulamayı bir kapsayıcıya paketliyor"],
    run: ["Starting a container (a boxed-up app)", "Bir kapsayıcıyı (kutulanmış uygulama) başlatıyor"],
    ps: ["Looking at the running containers", "Çalışan kapsayıcılara bakıyor"],
    logs: ["Reading a container’s log", "Bir kapsayıcının kayıtlarını okuyor"],
    compose: ["Starting or stopping the app’s containers", "Uygulamanın kapsayıcılarını başlatıyor ya da durduruyor"]
  }
};
const CLAUDE = {
  rest: ["Running a Claude Code command", "Bir Claude Code komutu çalıştırıyor"],
  sub: {
    test: ["Running the mod’s tests", "Modun testlerini çalıştırıyor"],
    validate: ["Checking that the mod follows the rules", "Modun kurallara uyduğunu denetliyor"],
    install: ["Installing a mod", "Bir mod kuruyor"],
    marketplace: ["Looking at where mods are installed from", "Modların kurulduğu kaynağa bakıyor"]
  }
};
const FLUTTER = {
  rest: ["Running a Flutter command", "Bir Flutter komutu çalıştırıyor"],
  sub: {
    run: ["Starting the app on a phone or simulator", "Uygulamayı telefonda ya da simülatörde başlatıyor"],
    build: BUILD,
    test: TESTS,
    analyze: LINT,
    format: FORMAT,
    pub: INSTALL,
    clean: ["Clearing the old build files", "Eski derleme dosyalarını temizliyor"]
  }
};
const TOOLCHAIN = { rest: BUILD, sub: { test: TESTS, run: SCRIPT, install: INSTALL, fmt: FORMAT, clippy: LINT, vet: LINT } };
const FAMILIES = {
  git: GIT,
  gh: GH,
  npm: PACKAGE,
  pnpm: PACKAGE,
  yarn: PACKAGE,
  bun: PACKAGE,
  docker: DOCKER,
  "docker-compose": DOCKER,
  claude: CLAUDE,
  flutter: FLUTTER,
  dart: FLUTTER,
  cargo: TOOLCHAIN,
  go: TOOLCHAIN
};
const SHELL = {
  newBranch: ["Starting a new line of work (branch)[: {x}]", "Yeni bir çalışma dalı (branch) açıyor[: {x}]"],
  hardReset: ["Throwing away the changes not saved yet", "Henüz kaydedilmemiş değişiklikleri siliyor"],
  discard: ["Putting files back as they were (unsaved edits are lost)", "Dosyaları eski haline döndürüyor (kaydedilmemiş değişiklikler silinir)"],
  dropStash: ["Throwing away the changes that were set aside", "Kenara konmuş değişiklikleri siliyor"],
  deleteBranch: ["Deleting a line of work (branch)[: {x}]", "Bir çalışma dalını (branch) siliyor[: {x}]"],
  forcePush: ["Overwriting the shared copy with its own versions", "Ortak kopyanın üzerine kendi kayıtlarını yazıyor"],
  prCreate: ["Opening a change request (PR) on GitHub", "GitHub’da bir değişiklik isteği (PR) açıyor"],
  prMerge: ["Merging a change request (PR) into the main code", "Bir değişiklik isteğini (PR) ana koda birleştiriyor"],
  deleteFolder: ["Deleting a folder and everything in it[: {x}]", "Bir klasörü içindekilerle birlikte siliyor[: {x}]"],
  findDelete: ["Finding files and deleting them", "Dosyaları bulup siliyor"],
  editInPlace: ["Changing a file by a rule[: {x}]", "Bir dosyayı kurala göre değiştiriyor[: {x}]"],
  writeFile: ["Writing into a file[: {x}]", "Bir dosyaya yazıyor[: {x}]"],
  inlineScript: ["Running a short script it just wrote", "O an yazdığı kısa bir betiği çalıştırıyor"],
  ownScript: ["Running the project’s own script[: {x}]", "Projenin kendi betiğini çalıştırıyor[: {x}]"],
  fetchedTool: ["Running the “{x}” tool", "“{x}” aracını çalıştırıyor"],
  unknown: ["Running the “{x}” command", "“{x}” komutunu çalıştırıyor"],
  any: ["Running a terminal command", "Bir terminal komutu çalıştırıyor"],
  then: [", then ", ", sonra "],
  more: [" (+{x} more)", " (+{x} adım daha)"]
};

const STEPS_SHOWN = 2;
const NAME_MAX = 40;
const WRAPPERS = new Set(["sudo", "time", "command", "exec", "nohup", "env", "then", "do", "else", "if", "while", "until", "!"]);
const SILENT = new Set(["cd", "export", "set", "unset", "source", ".", "for", "done", "fi", "true", "false", ":", "[", "[[", "test", "local", "shift", "wait"]);
const FILTERS = new Set(["grep", "rg", "sed", "awk", "head", "tail", "sort", "uniq", "wc", "cut", "tr", "tee", "xargs", "jq", "column", "less", "cat"]);
const FETCHERS = new Set(["npx", "bunx", "uvx", "pipx"]);
const PASS_ON = new Set(["run", "run-script", "exec", "x", "dlx", "-m", "plugin"]);
const INLINE = new Set(["-c", "-e", "-"]);
const PROPER = /^(GitHub|Git\b|Docker|Claude|Flutter|JSON|Python|iOS|Mac)/;
const base = (path) => path.split("/").filter(Boolean).at(-1) ?? path;
const clip = (text) => text.length > NAME_MAX ? `${text.slice(0, NAME_MAX - 1)}…` : text;
const isFlag = (word) => word.startsWith("-");
const withoutHeredocs = (command) => command.replace(/\\\n/g, " ").replace(/<<-?\s*(['"]?)(\w+)\1[\s\S]*?\n\s*\2(?=\s|$)/g, "<<");
function isOpenAt(scan, line, i) {
  const ch = line[i] ?? "";
  if (scan.quote !== "") {
    if (ch === scan.quote && line[i - 1] !== "\\")
      scan.quote = "";
    return false;
  }
  if (ch === '"' || ch === "'" || ch === "`")
    scan.quote = ch;
  else if (ch === "(" || ch === "{")
    scan.depth += 1;
  else if (ch === ")" || ch === "}")
    scan.depth = Math.max(0, scan.depth - 1);
  return scan.quote === "" && scan.depth === 0;
}
function stepsOf(command) {
  const line = withoutHeredocs(command);
  const scan = { quote: "", depth: 0 };
  const steps = [[]];
  let word = "";
  const close = (isStepEnd) => {
    steps.at(-1)?.push(word.trim());
    word = "";
    if (isStepEnd)
      steps.push([]);
  };
  for (let i = 0;i < line.length; i += 1) {
    const ch = line[i] ?? "";
    const two = line.slice(i, i + 2);
    if (!isOpenAt(scan, line, i))
      word += ch;
    else if (two === "&&" || two === "||") {
      close(true);
      i += 1;
    } else if (ch === ";" || ch === `
`)
      close(true);
    else if (ch === "|")
      close(false);
    else if (ch === "&" && line[i - 1] !== ">" && line[i + 1] !== ">")
      close(true);
    else
      word += ch;
  }
  close(false);
  return steps.map((pipe) => pipe.filter(Boolean)).filter((pipe) => pipe.length > 0);
}
function wordsOf(command) {
  const found = command.match(/(?:\$\([^)]*\)|"(?:\\.|[^"\\])*"|'[^']*'|\S)+/g) ?? [];
  return found.map((word) => word.replace(/^(['"])([\s\S]*)\1$/, "$2"));
}
function splitRedirects(words) {
  const kept = [];
  let out = "";
  for (let i = 0;i < words.length; i += 1) {
    const word = words[i] ?? "";
    const match = /^\d?>>?(.*)$/.exec(word);
    if (match === null || word.includes(">&")) {
      if (!/^\d?[<>]/.test(word))
        kept.push(word);
      continue;
    }
    const target = match[1] || words[i += 1] || "";
    if (target !== "" && !target.startsWith("/dev/") && !target.startsWith("&"))
      out = target;
  }
  return { kept, out };
}
const GLUE = new Set(["", "!", "if", "then", "else", "elif", "do", "while", "until", "time"]);
function callOf(command) {
  const { kept, out } = splitRedirects(wordsOf(command));
  const words = kept.map((word) => word.replace(/^[({]+/, ""));
  while (words.length > 0 && GLUE.has(words[0] ?? ""))
    words.shift();
  while (words.length > 0 && (WRAPPERS.has(words[0] ?? "") || /^\w+\+?=/.test(words[0] ?? "")))
    words.shift();
  const [first, ...args] = words;
  return first === undefined || first.startsWith("#") ? null : { name: first, args, out };
}
const namedOf = (kind, args) => {
  const plain = args.filter((arg) => !isFlag(arg) && !/^\d+$/.test(arg));
  if (kind === "first")
    return clip(base(plain[0] ?? ""));
  if (kind === "host")
    return /^[a-z]+:\/\/([^/?#]+)/i.exec(plain.find((arg) => arg.includes("://")) ?? "")?.[1] ?? "";
  if (kind === "file")
    return clip(base(plain.at(-1) ?? ""));
  return kind === "arg" ? clip(plain[0] ?? "") : "";
};
const say = (entry, lang, x = "") => fill(textOf(entry, lang), x);
function familySay(family, args, lang) {
  const words = args.filter((arg) => !isFlag(arg) || arg === "-m");
  const at = words.findIndex((word) => !PASS_ON.has(word));
  const sub = words[at] ?? words[0] ?? "";
  const entry = family.sub[sub] ?? family.sub[words[0] ?? ""] ?? family.rest;
  return say(entry, lang, entry === family.rest ? clip(sub) : namedOf(entry[2], words.slice(at + 1)));
}
function specialSay(call, lang) {
  const { name, args } = call;
  const has = (...flags) => args.some((arg) => flags.includes(arg));
  const combined = (letter) => args.some((arg) => /^-[a-zA-Z]+$/.test(arg) && arg.includes(letter));
  const second = args.filter((arg) => !isFlag(arg))[1] ?? "";
  if (name === "git" && (args[0] === "checkout" || args[0] === "switch") && has("-b", "-B", "-c"))
    return say(SHELL.newBranch, lang, clip(args.filter((arg) => !isFlag(arg))[1] ?? ""));
  if (name === "git" && args[0] === "reset" && has("--hard", "--merge", "--keep"))
    return say(SHELL.hardReset, lang);
  if (name === "git" && args[0] === "checkout" && (has("--", ".") || has("-f", "--force")))
    return say(SHELL.discard, lang);
  if (name === "git" && args[0] === "stash" && (second === "drop" || second === "clear"))
    return say(SHELL.dropStash, lang);
  if (name === "git" && args[0] === "branch" && (has("-D", "--delete") || combined("d")))
    return say(SHELL.deleteBranch, lang, clip(args.filter((arg) => !isFlag(arg))[1] ?? ""));
  if (name === "git" && args[0] === "push" && (has("--force", "--force-with-lease") || combined("f")))
    return say(SHELL.forcePush, lang);
  if (name === "gh" && args[0] === "pr" && second === "create")
    return say(SHELL.prCreate, lang);
  if (name === "gh" && args[0] === "pr" && second === "merge")
    return say(SHELL.prMerge, lang);
  if (name === "rm" && (combined("r") || combined("R") || has("--recursive")))
    return say(SHELL.deleteFolder, lang, namedOf("file", args));
  if (name === "find" && has("-delete"))
    return say(SHELL.findDelete, lang);
  if (name === "sed" && (has("-i", "--in-place") || args.some((arg) => arg.startsWith("-i"))))
    return say(SHELL.editInPlace, lang, namedOf("file", args));
  if (call.out !== "" && (name === "echo" || name === "printf" || name === "cat"))
    return say(SHELL.writeFile, lang, clip(base(call.out)));
  return null;
}
function scriptSay(call, lang) {
  const first = call.args[0] ?? "";
  const isRunner = COMMANDS[call.name] === SCRIPT;
  if (isRunner && (call.args.length === 0 || INLINE.has(first) || first === "<<"))
    return say(SHELL.inlineScript, lang);
  if (isRunner && first === "-m")
    return callSay({ ...call, name: call.args[1] ?? "", args: call.args.slice(2) }, lang);
  if (FETCHERS.has(call.name)) {
    const tool = call.args.find((arg) => !isFlag(arg)) ?? "";
    const known = callSay({ name: tool, args: call.args.slice(call.args.indexOf(tool) + 1), out: "" }, lang);
    return known === say(SHELL.unknown, lang, clip(base(tool))) ? say(SHELL.fetchedTool, lang, clip(tool)) : known;
  }
  return null;
}
function callSay(call, lang) {
  const name = base(call.name);
  if (SILENT.has(name))
    return null;
  const special = specialSay({ ...call, name }, lang) ?? scriptSay({ ...call, name }, lang);
  if (special !== null)
    return special;
  const family = FAMILIES[name];
  if (family !== undefined)
    return familySay(family, call.args, lang);
  const entry = COMMANDS[name];
  if (entry !== undefined)
    return say(entry, lang, entry === SERVICE ? name : namedOf(entry[2], call.args));
  if (call.name.includes("/"))
    return say(SHELL.ownScript, lang, clip([name, ...call.args.filter((arg) => !isFlag(arg)).slice(0, 1)].join(" ")));
  return say(SHELL.unknown, lang, clip(name));
}
function leadOf(pipe) {
  const calls = pipe.map(callOf).filter((call) => call !== null);
  return calls.find((call) => !FILTERS.has(base(call.name)) && !SILENT.has(base(call.name))) ?? calls[0] ?? null;
}
const WAITS = new Set(["sleep"]);
const MARKERS = new Set(["echo", "printf"]);
const isWait = (call) => WAITS.has(base(call.name)) || MARKERS.has(base(call.name)) && call.out === "";
function leadsOf(command) {
  const leads = stepsOf(command).map((pipe) => leadOf(pipe)).filter((call) => call !== null);
  const hasWork = leads.some((call) => !isWait(call) && !SILENT.has(base(call.name)));
  return hasWork ? leads.filter((call) => !isWait(call)) : leads;
}
const lowerFirst = (text, lang) => PROPER.test(text) ? text : text.charAt(0).toLocaleLowerCase(lang) + text.slice(1);
function plainShell(command, lang) {
  const steps = stepsOf(command);
  const said = leadsOf(command).map((call) => callSay(call, lang) ?? "");
  const unique = said.filter((text, i) => text !== "" && said.indexOf(text) === i);
  if (unique.length === 0)
    return say(steps.some((pipe) => pipe.some((c) => /^cd\b/.test(c))) ? COMMANDS.cd : SHELL.any, lang);
  const shown = unique.slice(0, STEPS_SHOWN).map((text, i) => i === 0 ? text : lowerFirst(text, lang));
  const more = unique.length - shown.length;
  return shown.join(textOf(SHELL.then, lang)) + (more > 0 ? say(SHELL.more, lang, String(more)) : "");
}

const ACTIVITY_TTL_MS = 45000;
const SWEEP_SLACK_MS = 500;
const PROOF = {
  push: (op) => Boolean(op.push),
  merge: (op) => op.branch?.action === "merged",
  rebase: (op) => op.branch?.action === "rebased",
  "pr create": (op) => op.pr?.action === "created",
  "pr merge": (op) => op.pr?.action === "merged",
  "pr comment": (op) => op.pr?.action === "commented"
};
async function startGit(h, actions) {
  const now = await h.now();
  const ids = actions.map(() => ++mem.activityId);
  const started = actions.map((a, i) => ({
    id: ids[i] ?? 0,
    kind: a.kind,
    label: a.running,
    state: "running",
    detail: "",
    at: now,
    tone: a.tone,
    nerd: a.icon.nerd,
    plain: a.icon.plain
  }));
  await h.setActivities((cur) => [...cur.filter((a) => a.state === "running" || now - a.at < ACTIVITY_TTL_MS), ...started]);
  return ids;
}
async function outcomes(h, p, run) {
  const chain = chainOf(p.command);
  const isCommit = p.actions.some((a) => a.verb === "commit");
  const after = isCommit && !run.op?.commit && p.dir !== null ? await headOf(h, p.dir) : "";
  return p.actions.map((a) => {
    if (a.verb === "commit") {
      const sha = run.op?.commit?.sha || (after && after !== p.head ? after : "");
      return commitOutcome({ sha, place: p.place.name, isDirKnown: p.dir !== null, hasFailed: !run.ok && chain.and && chain.size === 1, text: run.text });
    }
    if (run.op && PROOF[a.verb]?.(run.op) || run.ok && chain.and)
      return { state: "done", label: a.done, detail: "" };
    if (!run.ok && chain.and && chain.size === 1)
      return { state: "failed", label: gitWords().failed(plainShell(a.kind, lang())), detail: "" };
    return { state: "done", label: gitWords().ran(plainShell(a.kind, lang())), detail: "" };
  });
}
async function pendingOf(h, call) {
  const t = await h.tree();
  const dir = gitDirOf(call.command, { cwd: call.cwd, home: mem.home });
  const isCommit = call.actions.some((a) => a.verb === "commit");
  const head = isCommit && dir !== null ? await headOf(h, dir) : "";
  const place = placeOf(dir, { top: t.top || t.root || call.cwd, isAgent: !call.cwd });
  return { actions: call.actions, ids: await startGit(h, call.actions), command: call.command, dir, head, place };
}
async function finishGit(h, p, results) {
  const now = await h.now();
  await h.setActivities((cur) => cur.map((a) => {
    const i = p.ids.indexOf(a.id);
    const result = i < 0 ? undefined : results[i];
    return result ? { ...a, ...result, at: now } : a;
  }));
  h.after(ACTIVITY_TTL_MS + SWEEP_SLACK_MS, () => void h.setActivities((cur) => cur.filter((a) => a.state === "running" || a.at > now)));
}
function failAll(p) {
  return p.actions.map((a) => ({ state: "failed", label: gitWords().failed(plainShell(a.kind, lang())), detail: "" }));
}
function proven(p, results) {
  return p && p.place.isHere ? p.actions.filter((_, i) => results[i]?.state !== "failed") : [];
}
function taskEnds(text) {
  return [...text.matchAll(/<task-notification>([\s\S]*?)<\/task-notification>/g)].flatMap((m) => {
    const id = /<task-id>([^<]*)<\/task-id>/.exec(m[1] ?? "")?.[1]?.trim();
    const status = /<status>([^<]*)<\/status>/.exec(m[1] ?? "")?.[1]?.trim();
    return id && status ? [[id, status]] : [];
  });
}

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
function mix(a, b, t) {
  const from = channels(a);
  const to = channels(b);
  return `#${from.map((v, i) => Math.round(v + ((to[i] ?? v) - v) * t).toString(16).padStart(2, "0")).join("")}`;
}
const DARK_LO = "#8E8A80";
const LIGHT_LO = "#77726A";
const DARK = {
  sheet: "#191917",
  card: "#1F1F1C",
  inset: "#171715",
  line: "#2E2E2A",
  lineStrong: "#45443F",
  track: "#34332F",
  hi: "#F0EEE8",
  mid: "#C2BEB4",
  lo: DARK_LO,
  roles: {
    read: { fg: "#7FB6E8", tint: "#1E2B37", line: "#2F4A63" },
    edit: { fg: "#E58A5F", tint: "#38251D", line: "#6A3E2D" },
    run: { fg: "#B19CF3", tint: "#29243D", line: "#4A3F75" },
    ok: { fg: "#6FC593", tint: "#1B2F25", line: "#2F5A42" },
    warn: { fg: "#E9B949", tint: "#332D19", line: "#66552A" },
    danger: { fg: "#F2727F", tint: "#3B2023", line: "#74343C" },
    plan: { fg: "#E07BC0", tint: "#351F2E", line: "#6B3A5C" },
    note: { fg: mix("#B19CF3", DARK_LO, 0.4), tint: "#25222F", line: "#3B3650" },
    neutral: { fg: DARK_LO, tint: "#2A2A27", line: "#3A3935" }
  }
};
const LIGHT = {
  sheet: "#F4F2EC",
  card: "#FFFFFF",
  inset: "#F6F4EF",
  line: "#E4E0D6",
  lineStrong: "#CFC9BC",
  track: "#ECE8DF",
  hi: "#1C1B19",
  mid: "#4F4B44",
  lo: LIGHT_LO,
  roles: {
    read: { fg: "#2464A0", tint: "#E7F0F9", line: "#B9D3EC" },
    edit: { fg: "#A94A26", tint: "#FBEDE6", line: "#EFC6B4" },
    run: { fg: "#6243C4", tint: "#F0ECFC", line: "#CFC3F3" },
    ok: { fg: "#1F6E43", tint: "#E4F4EA", line: "#B5DEC4" },
    warn: { fg: "#8A6000", tint: "#FBF2D9", line: "#EBD48F" },
    danger: { fg: "#C0263A", tint: "#FCE8EA", line: "#F1B9C0" },
    plan: { fg: "#A8337F", tint: "#FBE9F4", line: "#EDBFDC" },
    note: { fg: mix("#6243C4", LIGHT_LO, 0.35), tint: "#F2EFFA", line: "#D9D2EE" },
    neutral: { fg: LIGHT_LO, tint: "#EFECE5", line: "#DCD7CC" }
  }
};
const paletteOf = (isLight) => isLight ? LIGHT : DARK;
const TONE_ROLE = {
  purple: "read",
  blue: "read",
  cyan: "read",
  orange: "edit",
  green: "ok",
  teal: "ok",
  iris: "run",
  red: "danger"
};
const roleOfTone = (tone) => TONE_ROLE[tone ?? ""] ?? "edit";
const SHIMMER_STEPS = [0, 0.3, 0.58, 0.85];
const LIGHT_STEPS = [0, 0.22, 0.4, 0.55];
const DIM_MIX = 0.55;
function shimmerTones(p, isLight) {
  const steps = isLight ? LIGHT_STEPS : SHIMMER_STEPS;
  const out = {};
  for (const [tone, role] of Object.entries(TONE_ROLE)) {
    const fg = p.roles[role].fg;
    const bright = steps.map((s) => mix(fg, "#FFFFFF", s));
    out[tone] = { bright, dim: bright.map((c) => mix(c, p.lo, DIM_MIX)) };
  }
  return out;
}
function lightByName(value) {
  const name = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (name.includes("light"))
    return true;
  return name.includes("dark") ? false : undefined;
}

const THEME_FILE = ".local/state/omarchy/current/theme/colors.toml";
async function refreshLook(h) {
  let theme;
  try {
    theme = (await h.config()).find((row) => row.key === "theme")?.value;
  } catch {
    theme = undefined;
  }
  const named = lightByName(theme);
  const dark = named === undefined ? await systemDark(h) : undefined;
  const look = named === undefined ? { isLight: dark === false, isAuto: true } : { isLight: named, isAuto: false };
  const cur = await h.look();
  if (cur?.isLight !== look.isLight || cur?.isAuto !== look.isAuto)
    await h.setLook(look);
}
async function loadTheme(h) {
  const path = `${await h.homeEnv() ?? ""}/${THEME_FILE}`;
  try {
    const stat = await h.stat(path);
    if (stat.kind !== "file")
      throw new Error("no theme file");
    if (stat.mtimeMs === mem.themeMtime)
      return;
    await h.setTheme(parseTheme(String(await h.read(path))));
    mem.themeMtime = stat.mtimeMs;
  } catch {
    if (mem.themeMtime === 0)
      return;
    await h.setTheme(DEFAULT_THEME);
    mem.themeMtime = 0;
  }
}

const RUNNING_MAX_MS = 600000;
const LIVE_SPREAD_MS = 1500;
const PIN_SHARE = 3;
const MIN_REST = 3;
const feelNow = () => ({ glyphs: mem.glyphSetting, noNerd: mem.noNerd, pointer: mem.pointer, followClaude: mem.followClaude, follow: mem.follow });
function sceneFrom(p) {
  const { t, now } = p;
  const live = p.activities.filter((a) => now - a.at < (a.state === "running" ? RUNNING_MAX_MS : ACTIVITY_TTL_MS));
  return {
    t,
    theme: p.theme ?? DEFAULT_THEME,
    now,
    latest: [...live].reverse().find((a) => a.state === "running") ?? live[live.length - 1],
    bright: new Set(t.flashOn ? t.flash : []),
    dimmed: new Set(t.flashOn ? t.flashDim : []),
    turn: p.turn,
    readTotal: p.readTotal,
    look: p.look ?? { isLight: false, isAuto: true },
    isCommitting: live.some((a) => a.kind === "git commit" && a.state === "running"),
    feel: p.feel
  };
}
async function sceneOf(h, isDesktop) {
  const parts = { t: await h.tree(), now: await h.now(), activities: await h.activities(), readTotal: await h.readTotal() };
  const stored = isDesktop ? await h.look() : undefined;
  if (isDesktop && !stored)
    refreshLook(h);
  return sceneFrom({ ...parts, theme: await h.theme(), turn: await h.turn(), look: stored, feel: feelNow() });
}
function liveOf(s) {
  const lit = s.turn.touches.filter((x) => s.bright.has(x.id));
  const latest = [...lit].sort((a, b) => a.at - b.at).pop();
  if (!latest || !s.turn.isRunning)
    return new Set;
  return new Set(lit.filter((x) => x.role === latest.role && latest.at - x.at <= LIVE_SPREAD_MS).map((x) => x.id));
}
function heroInput(s) {
  return { turn: s.turn, live: liveOf(s), root: s.t.root, isCommitting: s.isCommitting, branch: s.t.branch?.head ?? "", diff: s.t.diff };
}
function rowCtx(s, width, unicode) {
  const commits = new Set(s.turn.touches.filter((x) => x.role === "commit").map((x) => x.id));
  const live = liveOf(s);
  const w = words();
  const pills = w.rowLive;
  const pillOf = (id, role) => {
    if (role === "ok")
      return commits.has(id) ? w.rowCommitted : w.rowStaged;
    return live.has(id) ? pills[role] ?? "" : "";
  };
  const { t } = s;
  const costOf = (id) => rowCost(s.turn, id);
  return { t, bright: s.bright, dimmed: s.dimmed, ignored: new Set(t.ignored), untracked: new Set(t.untrackedDirs), width, now: s.now, unicode, theme: s.theme, pal: paletteOf(s.look.isLight), pillOf, costOf };
}
function spanOf(s, rows, room) {
  const { t } = s;
  if (t.scroll !== null)
    return { from: Math.max(0, Math.min(t.scroll, Math.max(0, rows.length - room))), pinned: [] };
  const isFollowing = s.feel.followClaude && t.flashOn;
  const isLit = (id) => s.bright.has(id) || s.dimmed.has(id);
  const focus = isFollowing ? [...t.flash].reverse().find((id) => id !== BRANCH_ROW) ?? t.cursor : t.cursor;
  const at = Math.max(0, rows.findIndex((r) => r.node.id === focus));
  const lit = isFollowing ? rows.findIndex((r) => isLit(r.node.id)) : -1;
  const cap = Math.max(1, Math.floor(room / PIN_SHARE));
  const centered = lit >= 0 && at - lit < room - 2 ? Math.max(0, lit - 1) : at - Math.floor(room / 2);
  let from = Math.max(0, Math.min(centered, rows.length - room));
  let pinned = isFollowing ? rows.slice(0, from).filter((r) => isLit(r.node.id)).slice(-cap) : [];
  if (pinned.length) {
    const rest = Math.max(MIN_REST, room - pinned.length);
    from = Math.max(0, Math.min(at - Math.floor(rest / 2), rows.length - rest));
    pinned = rows.slice(0, from).filter((r) => isLit(r.node.id)).slice(-cap);
  }
  return { from, pinned };
}
function treeWindow(s, room, draw) {
  const rows = visibleRows(s.t);
  const { from, pinned } = spanOf(s, rows, room);
  const max = Math.max(0, rows.length - room);
  mem.view = { from, max };
  const shown = rows.slice(from, from + room - pinned.length);
  const { toSpec, colors } = draw;
  const note = (text) => ({ id: "", left: [{ t: text, c: colors.note }], right: [] });
  const specs = [...rows.length === 0 ? [note(words().emptyFolder)] : [], ...pinned.map(toSpec), ...pinned.length > 0 ? [note("  ⋮")] : [], ...shown.map(toSpec)];
  const barSize = Math.max(1, Math.round(specs.length * shown.length / Math.max(1, rows.length)));
  const bar = { pos: max ? Math.round(from / max * (specs.length - barSize)) : 0, size: barSize, thumb: colors.thumb, track: colors.track };
  return { rows: [...pinned, ...shown], specs, ...rows.length > shown.length + pinned.length ? { bar } : {} };
}

const SIZE_TIMEOUT_MS = 15000;
const SIZE_JOBS = 2;
const SIZE_WALK_LIMIT = 50000;
const BYTES_PER_KB = 1024;
let sizeActive = 0;
const sizing = new Set;
async function walkSize(h, dir) {
  let total = 0;
  let seen = 0;
  let level = [dir];
  while (level.length) {
    const next = [];
    for (const d of level) {
      let entries;
      try {
        entries = await h.list(d);
      } catch {
        continue;
      }
      for (const e of entries) {
        if (++seen > SIZE_WALK_LIMIT)
          return -1;
        if (e.kind === "dir" && !e.isLink)
          next.push(join(d, e.name));
        else if (e.kind === "file")
          total += e.size;
      }
    }
    level = next;
  }
  return total;
}
async function dirSize(h, dir) {
  if (rootOfDisk(dir))
    return -1;
  if (await osName(h) === "win32")
    return walkSize(h, dir);
  try {
    const run = await h.run(["du", "-skxH", dir], { timeoutMs: SIZE_TIMEOUT_MS });
    const kb = Number(run.stdout.trim().split(/\s/)[0] || NaN);
    return Number.isFinite(kb) ? kb * BYTES_PER_KB : -1;
  } catch {
    return -1;
  }
}
async function settle$1(h, dir, at) {
  if (at.epoch === mem.sizeEpoch)
    return patch(h, (cur) => inside(cur.root, dir) ? { dirSizes: { ...cur.dirSizes, [dir]: at.bytes } } : {});
  const cur = await h.tree();
  if (cur.showSize && inside(cur.root, dir) && !(dir in cur.dirSizes) && !mem.sizeQueue.includes(dir))
    mem.sizeQueue.push(dir);
}
function pumpSizes(h) {
  while (sizeActive < SIZE_JOBS && mem.sizeQueue.length) {
    const dir = mem.sizeQueue.shift() ?? "";
    const epoch = mem.sizeEpoch;
    sizing.add(dir);
    sizeActive += 1;
    dirSize(h, dir).then((bytes) => settle$1(h, dir, { epoch, bytes })).catch(() => {
      return;
    }).finally(() => {
      sizing.delete(dir);
      sizeActive -= 1;
      pumpSizes(h);
    });
  }
}
function wantSizes(h, dirs) {
  for (const dir of dirs)
    if (!sizing.has(dir) && !mem.sizeQueue.includes(dir))
      mem.sizeQueue.push(dir);
  pumpSizes(h);
}
function forgetSizes() {
  mem.sizeEpoch += 1;
  mem.sizeQueue = [];
}
async function staleSizes(h, paths) {
  forgetSizes();
  await patch(h, (cur) => {
    if (!paths)
      return { dirSizes: {} };
    const keep = {};
    for (const [dir, bytes] of Object.entries(cur.dirSizes))
      if (!paths.some((p) => inside(dir, p)))
        keep[dir] = bytes;
    return { dirSizes: keep };
  });
}

const DOUBLE_MS = 450;
const SYNC_MS = 2000;
async function cwdOf(h) {
  return posix(await h.cwd());
}
async function saveFeel(h) {
  const feel = feelNow();
  if (JSON.stringify(await h.feel()) !== JSON.stringify(feel))
    await h.setFeel(feel);
}
async function showPane(h, isAsked) {
  if (isAsked && await h.isHubDrawing())
    await h.goHome(HUB_PANE);
  else if (isAsked) {
    if ((await h.openPane(true)).isPlaced)
      await h.reportShown();
  } else if (!mem.noDock && await h.isPaneOpen())
    await h.openPane(false);
}
async function inApp(h) {
  try {
    return (await h.surfaces()).some((s) => s !== "terminal");
  } catch {
    return false;
  }
}
async function reset(h, root, focus = false) {
  const prev = await h.tree();
  cancelFlash();
  mem.lastRoot = root;
  dropIndex();
  forgetSizes();
  await h.putTree(() => ({ ...emptyTree(root), showHidden: prev.showHidden, showTools: prev.showTools, showSize: prev.root ? prev.showSize : mem.sizeDefault }));
  await showPane(h, focus);
  await loadDirs(h, [root]);
  await detectRepo(h);
  await refreshGit(h);
}
async function openFromHub(h) {
  mem.noDock = false;
  const t = await h.tree();
  if (!t.root || t.nodes.length === 0)
    await reset(h, await cwdOf(h), true);
  else
    await showPane(h, true);
}
async function followCwd(h) {
  if (!mem.follow)
    return false;
  const cwd = await cwdOf(h);
  const t = await h.tree();
  if (t.root === cwd)
    return false;
  await reset(h, cwd);
  return true;
}
async function sync(h, force = false) {
  const now = await h.now();
  if (!force && now - mem.lastSync < SYNC_MS)
    return;
  mem.lastSync = now;
  dropIndex();
  const t = await h.tree();
  if (!t.root)
    return;
  await loadDirs(h, [t.root, ...openDirs(t)]);
  if (t.top)
    await refreshGit(h);
}
async function copyPath(h, id, how) {
  const t = await h.tree();
  const text = !how.isAbsolute && id !== t.root && inside(t.root, id) ? id.slice(t.root.endsWith("/") ? t.root.length : t.root.length + 1) : id;
  const done = await h.copy({ text, ...how.surface ? { surface: how.surface } : {} });
  h.toast(done.isCopied ? words().copied(text) : words().notCopied);
}
async function toggle(h, n) {
  if (n.kind === "dir" && !(await h.tree()).expanded.includes(n.id))
    await loadDirs(h, [n.id]);
  else if (n.kind !== "dir") {
    mem.freshPick = n.id;
    mem.freshPickAt = await h.now();
  }
  await patch(h, (t) => {
    const open = new Set(t.expanded);
    if (n.kind === "dir")
      open.has(n.id) ? open.delete(n.id) : open.add(n.id);
    return { expanded: [...open], cursor: n.id, selected: n.kind === "dir" ? t.selected : n.id };
  });
}
async function openNode(h, n) {
  if (n.kind === "dir") {
    mem.follow = false;
    await reset(h, n.id);
  } else
    await openFile(h, n.id);
}
async function press(h, n) {
  const now = await h.now();
  const isDouble = mem.lastPress.key === n.id && now - mem.lastPress.at < DOUBLE_MS;
  mem.lastPress = { key: isDouble ? "" : n.id, at: now };
  if (!isDouble || n.kind === "dir") {
    await toggle(h, n);
    return;
  }
  await openNode(h, n);
}
async function reveal(h, paths) {
  if (await followCwd(h))
    return;
  await revealPaths(h, paths);
  await patch(h, (cur) => {
    const open = new Set(cur.expanded);
    for (const p of paths)
      for (const a of ancestorsOf(p, cur.root))
        open.add(a);
    return { expanded: [...open], cursor: paths[paths.length - 1] ?? cur.cursor, scroll: null };
  });
}

async function refresh(h) {
  const cur = await h.tree();
  dropIndex();
  await staleSizes(h);
  await loadDirs(h, [cur.root, ...cur.expanded]);
  await detectRepo(h);
  await refreshGit(h);
  if (cur.query.trim())
    await search(h, cur.query);
}
async function up(h, t) {
  mem.follow = false;
  await reset(h, dirname(t.root));
}
async function home(h) {
  mem.follow = true;
  await reset(h, await cwdOf(h));
}
function toolWork(h, t) {
  return {
    refresh: () => refresh(h),
    collapse: () => patch(h, (cur) => ({ expanded: [], nodes: dropBelow(cur.nodes, cur.nodes.filter((x) => x.parent === cur.root && x.kind === "dir").map((x) => x.id)) })),
    size: () => patch(h, (cur) => ({ showSize: !cur.showSize })),
    up: () => up(h, t),
    cwd: () => home(h),
    hidden: () => patch(h, (cur) => ({ showHidden: !cur.showHidden })),
    unselect: () => patch(h, () => ({ selected: "" })),
    more: () => patch(h, (cur) => ({ showTools: !cur.showTools }))
  };
}
function actionsOf(h, t) {
  const work = toolWork(h, t);
  return Object.fromEntries(Object.entries(work).map(([key, run]) => [key, () => void run()]));
}
function filesActs(h, t) {
  return { tool: actionsOf(h, t), find: (v) => void search(h, v), jump: (v) => void jump(h, v), sizes: (dirs) => wantSizes(h, dirs) };
}

const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`;
const MONO = `ui-monospace, 'SF Mono', Menlo, monospace`;
const BOLD_WIDTH = 1.07;
const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function measure$1(text, size, isBold = false) {
  const plain = [...text].reduce((sum, ch) => {
    if ("iljtfıI.,:;|!'` ".includes(ch))
      return sum + size * 0.3;
    if ("mwMW@%".includes(ch))
      return sum + size * 0.84;
    return sum + (ch >= "A" && ch <= "Z" ? size * 0.65 : size * 0.55);
  }, 0);
  return isBold ? plain * BOLD_WIDTH : plain;
}
function fitMiddle(text, width, font) {
  const { size, isBold = false } = font;
  if (measure$1(text, size, isBold) <= width)
    return text;
  const chars = [...text];
  let keep = chars.length - 1;
  while (keep > 2) {
    const head = Math.ceil(keep / 2);
    const cut = `${chars.slice(0, head).join("")}…${chars.slice(chars.length - (keep - head)).join("")}`;
    if (measure$1(cut, size, isBold) <= width)
      return cut;
    keep -= 1;
  }
  return `${chars[0] ?? ""}…`;
}
const ROLE_NAMES = Object.keys(DARK.roles);
function rules(p) {
  const base = `.hi{fill:${p.hi}}.mid{fill:${p.mid}}.lo{fill:${p.lo}}.card{fill:${p.card};stroke:${p.line}}.track{fill:${p.track}}.s-mid{stroke:${p.mid}}`;
  const roles = ROLE_NAMES.map((r) => {
    const c = p.roles[r];
    return `.f-${r}{fill:${c.fg}}.t-${r}{fill:${c.tint}}.l-${r}{stroke:${c.line}}.s-${r}{stroke:${c.fg}}`;
  });
  return base + roles.join("");
}
function style(look) {
  const fonts = `text{font-family:${FONT}}.num{font-family:${MONO};font-variant-numeric:tabular-nums}`;
  const breathe = ".breathe{animation:breathe 1.8s ease-in-out infinite}@keyframes breathe{50%{opacity:.35}}";
  const motion = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
  const scheme = look.isAuto ? `@media (prefers-color-scheme: light){${rules(LIGHT)}}@media (prefers-color-scheme: dark){${rules(DARK)}}` : "";
  return `<style>${fonts}${breathe}${rules(paletteOf(look.isLight))}${scheme}${motion}</style>`;
}
const svgDoc = ({ width, height }, look, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${style(look)}${body}</svg>`;
const ICONS = {
  eye: '<path d="M2.5 12c2.2-4.3 5.4-6.5 9.5-6.5s7.3 2.2 9.5 6.5c-2.2 4.3-5.4 6.5-9.5 6.5S4.7 16.3 2.5 12z"/><circle cx="12" cy="12" r="3.2"/>',
  pencil: '<path d="M15.2 4.8l4 4L8.6 19.4 3.8 20.2l.8-4.8z"/><path d="M13 7l4 4"/>',
  check: '<path d="M4.5 12.8l4.6 4.4L19.5 6.8"/>',
  sparkle: '<path d="M12 3.5c.7 4.6 3 6.9 7.5 7.5-4.5.6-6.8 2.9-7.5 7.5-.7-4.6-3-6.9-7.5-7.5 4.5-.6 6.8-2.9 7.5-7.5z"/>',
  branch: '<circle cx="6.5" cy="5.5" r="2.2"/><circle cx="6.5" cy="18.5" r="2.2"/><circle cx="17.5" cy="7.5" r="2.2"/><path d="M6.5 7.7v8.6M17.5 9.7c0 4.6-5.2 4.2-9.6 7.2"/>'
};
function icon(name, { x, y, size }) {
  const scale = size / 24;
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" class="s-mid" stroke-width="${1.5 / scale}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</g>`;
}
const groupLabel = (text, { x, y, anchor = "start" }) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="12" font-weight="600" class="lo">${escape(text)}</text>`;

const PAD = 2;
const GAP = 12;
const TITLE = 13;
const SUB = 12;
const ROW = 13;
const LINE = 22;
const TITLE_Y = 15;
const LINES_TOP = TITLE_Y;
const ICON_INDENT = 20;
const ICON = 14;
const ICON_LIFT = 11.5;
const DOT_R = 3;
const MIN_SUB = 56;
function fitEnd(text, width, font) {
  const { size, isBold = false } = font;
  if (measure$1(text, size, isBold) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 1 && measure$1(`${chars.join("")}…`, size, isBold) > width)
    chars.pop();
  return `${chars.join("")}…`;
}
function spans(parts, width, size) {
  let used = 0;
  const out = [];
  for (const p of parts) {
    const room = width - used;
    if (room < size)
      break;
    const text = fitEnd(p.text, room, { size, isBold: p.isBold });
    used += measure$1(text, size, p.isBold);
    const weight = p.isBold ? ' font-weight="650"' : "";
    out.push(`<tspan class="${p.cls}${p.isNum ? " num" : ""}"${weight}>${escape(text)}</tspan>`);
    if (text !== p.text)
      break;
  }
  return out.join("");
}
function titleLine(hero, { x, y, width }) {
  const { lead, name, tail } = hero.title;
  const room = width - measure$1(lead + tail, TITLE, true);
  const fitted = name ? fitMiddle(name, Math.max(TITLE * 3, room), { size: TITLE, isBold: true }) : "";
  const full = fitEnd(`${lead}${fitted}${tail}`, width, { size: TITLE, isBold: true });
  return `<text x="${x}" y="${y}" font-size="${TITLE}" font-weight="600" class="hi">${escape(full)}</text>`;
}
function gitLine(git, y, w) {
  const said = words();
  const status = git.changed ? [
    ...git.add ? [{ text: `+${git.add} `, cls: "f-ok", isNum: true }] : [],
    ...git.del ? [{ text: `−${git.del} `, cls: "f-danger", isNum: true }] : [],
    ...git.add || git.del ? [{ text: "· ", cls: "lo" }] : [],
    { text: said.changes(git.changed), cls: "f-warn" }
  ] : [{ text: said.cleanNoChanges, cls: "mid" }];
  const statusW = status.reduce((s, p) => s + measure$1(p.text, ROW, p.isBold), 0);
  const moves = `${git.ahead ? ` ↑${git.ahead}` : ""}${git.behind ? ` ↓${git.behind}` : ""}`;
  const nameRoom = w - 2 * PAD - ICON_INDENT - statusW - measure$1(moves, ROW, true) - GAP;
  const name = fitMiddle(git.branch, Math.max(40, nameRoom), { size: ROW, isBold: true });
  const upRoom = nameRoom - measure$1(name, ROW, true) - 10;
  const upstream = git.upstream && upRoom > 40 ? `<tspan dx="8" font-size="12" class="lo">${escape(fitMiddle(git.upstream, upRoom, { size: 12 }))}</tspan>` : "";
  const branch = `<text x="${PAD + ICON_INDENT}" y="${y}" font-size="${ROW}"><tspan font-weight="560" class="hi">${escape(name)}</tspan>${git.ahead ? `<tspan font-weight="650" class="mid"> ↑${git.ahead}</tspan>` : ""}${git.behind ? `<tspan font-weight="650" class="f-warn"> ↓${git.behind}</tspan>` : ""}${upstream}</text>`;
  const right = `<text x="${w - PAD}" y="${y}" text-anchor="end" font-size="${ROW}">${spans(status, statusW + 4, ROW)}</text>`;
  return `${icon("branch", { x: PAD, y: y - ICON_LIFT, size: ICON })}${branch}${right}`;
}
function costLine(cost, y, w) {
  const said = words();
  const [lead = "", tail = ""] = said.costTurn;
  const left = cost.turn ? [{ text: lead, cls: "mid" }, { text: cost.turn, cls: "hi", isBold: true, isNum: true }, { text: tail, cls: "mid" }] : [{ text: said.costNone, cls: "lo" }];
  const leftW = left.reduce((s, p) => s + measure$1(p.text, ROW, p.isBold), 0);
  const room = w - 2 * PAD - ICON_INDENT;
  const right = cost.session ? said.costSession(cost.session) : "";
  const rightW = right ? measure$1(right, 12) + GAP : 0;
  const isRightShown = right !== "" && leftW + rightW <= room;
  const head = `<text x="${PAD + ICON_INDENT}" y="${y}" font-size="${ROW}">${spans(left, room - (isRightShown ? rightW : 0), ROW)}</text>`;
  const tailText = isRightShown ? `<text x="${w - PAD}" y="${y}" text-anchor="end" font-size="12" class="lo">${escape(right)}</text>` : "";
  return `${icon("eye", { x: PAD, y: y - ICON_LIFT, size: ICON })}${head}${tailText}`;
}
function legendLine(items, { y, w }) {
  let x = PAD + ICON_INDENT;
  return items.map((item) => {
    if (x + 11 + measure$1(item.label, 12) > w - PAD)
      return "";
    const dot = `<circle cx="${x + 3}" cy="${y - 4}" r="3" class="f-${item.role}"/>`;
    const label = `<text x="${x + 11}" y="${y}" font-size="12" class="lo">${escape(item.label)}</text>`;
    x += 11 + measure$1(item.label, 12) + 14;
    return dot + label;
  }).join("");
}
const leadDot = (hero) => `<circle cx="${PAD + ICON / 2}" cy="${TITLE_Y - 4.5}" r="${DOT_R}" class="${hero.isLive === true ? "f-edit breathe" : "lo"}"/>`;
function nowLine$1(hero, w) {
  const x = PAD + ICON_INDENT;
  const width = w - x - PAD;
  const head = titleLine(hero, { x, y: TITLE_Y, width });
  const said = `${hero.title.lead}${hero.title.name}${hero.title.tail}`;
  const used = measure$1(said, TITLE, true) + 8;
  const room = width - used;
  const sub = hero.sub.length && room >= MIN_SUB ? `<text x="${x + used}" y="${TITLE_Y}" font-size="${SUB}">${spans(hero.sub, room, SUB)}</text>` : "";
  return head + sub;
}
function heroCard(hero, { git, cost, legend }, { look, w }) {
  const rows = [];
  let y = LINES_TOP;
  if (git)
    rows.push(gitLine(git, y += LINE, w));
  if (cost)
    rows.push(costLine(cost, y += LINE, w));
  if (legend.length)
    rows.push(legendLine(legend, { y: y += LINE, w }));
  const h = y + 8;
  const [lead = "", tail = ""] = words().costTurn;
  const costAlt = cost?.turn ? ` · ${lead}${cost.turn}${tail}` : "";
  const alt = `${hero.label}: ${hero.title.lead}${hero.title.name}${hero.title.tail}. ${hero.sub.map((p) => p.text).join("")}${costAlt}`;
  return { source: svgDoc({ width: w, height: h }, look, leadDot(hero) + nowLine$1(hero, w) + rows.join("")), width: w, height: h, alt };
}
const ROW_H = 24;
const HEAD_H = 22;
const MAX_ROWS = 6;
const ROW_BASE = 16;
function touchedRow(r, y, w) {
  const wordW = measure$1(r.pill.text, 12);
  const diff = r.diff ? `${r.diff[0] ? `+${r.diff[0]}` : ""}${r.diff[0] && r.diff[1] ? " " : ""}${r.diff[1] ? `−${r.diff[1]}` : ""}` : "";
  const diffW = diff ? measure$1(diff, 12) + GAP : 0;
  const unit = r.cost ? ` ${words().tokUnit}` : "";
  const costW = r.cost ? measure$1(`${r.cost}${unit}`, 12) + GAP : 0;
  const room = w - 2 * PAD - wordW - diffW - costW - GAP;
  const name = fitMiddle(r.name, Math.max(48, room * 0.7), { size: ROW });
  const dirRoom = room - measure$1(name, ROW) - 8;
  const dir = r.dir && dirRoom > 24 ? fitMiddle(r.dir, dirRoom, { size: 12 }) : "";
  const base = y + ROW_BASE;
  const parts = [
    `<text x="${PAD}" y="${base}" font-size="${ROW}"><tspan class="hi">${escape(name)}</tspan>${dir ? `<tspan dx="8" font-size="12" class="lo">${escape(dir)}</tspan>` : ""}</text>`,
    `<text x="${w - PAD}" y="${base}" text-anchor="end" font-size="12" class="${r.pill.role ? `f-${r.pill.role}` : "lo"}">${escape(r.pill.text)}</text>`
  ];
  if (diff) {
    const [add = 0, del = 0] = r.diff ?? [];
    const plus = add ? `<tspan class="f-ok">+${add}</tspan>` : "";
    const minus = del ? `<tspan class="f-danger">${add ? " " : ""}−${del}</tspan>` : "";
    parts.push(`<text x="${w - PAD - wordW - GAP}" y="${base}" text-anchor="end" font-size="12" class="num">${plus}${minus}</text>`);
  }
  if (r.cost) {
    const tokens = `<tspan class="num mid">${escape(r.cost)}</tspan><tspan class="lo">${escape(unit)}</tspan>`;
    parts.push(`<text x="${w - PAD - wordW - diffW - GAP}" y="${base}" text-anchor="end" font-size="12">${tokens}</text>`);
  }
  return parts.join("");
}
function touchedCard(rows, look, w) {
  const said = words();
  const title = said.touchedTitle(rows.length);
  const shown = rows.slice(0, MAX_ROWS);
  const more = rows.length - shown.length;
  const body = shown.length ? shown.map((r, i) => touchedRow(r, HEAD_H + i * ROW_H, w)).join("") : `<text x="2" y="${HEAD_H + 16}" font-size="${SUB}" class="lo">${escape(said.noTouchThisTurn)}</text>`;
  const listH = shown.length ? HEAD_H + shown.length * ROW_H : HEAD_H + 22;
  const moreLine = more > 0 ? `<text x="2" y="${listH + 14}" font-size="12" class="lo">${escape(said.moreFiles(more))}</text>` : "";
  const h = listH + (more > 0 ? 20 : 0);
  const head = groupLabel(title, { x: PAD, y: 15 });
  const alt = `${title}: ${rows.map((r) => `${r.name} ${r.pill.text}${r.cost ? ` ${r.cost} ${said.tokUnit}` : ""}`).join(", ") || said.noneYet}`;
  return { source: svgDoc({ width: w, height: h }, look, head + body + moreLine), width: w, height: h, alt };
}
function sectionLine({ label, name }, { look, w }) {
  const h = 22;
  const fitted = fitMiddle(name, w - 2 * PAD, { size: 12, isBold: true });
  return { source: svgDoc({ width: w, height: h }, look, groupLabel(fitted, { x: PAD, y: 15 })), width: w, height: h, alt: `${label} · ${name}` };
}

const relOrShort = (t, id) => id !== t.root && inside(t.root, id) ? id.slice(t.root.endsWith("/") ? t.root.length : t.root.length + 1) : shortPath(id);
function activityChip(ui, a, look) {
  const { Box, Text } = ui;
  const color = look.colorOf(a.state === "failed" ? "red" : a.tone);
  const hash = a.state === "done" && a.kind === "git commit" ? a.detail.split(" ")[0] ?? "" : "";
  return h(Box, {
    flexDirection: "row",
    marginLeft: 2
  }, h(Text, {
    color
  }, (look.unicode ? a.plain : a.nerd) + " "), h(Text, {
    bold: a.state === "running",
    color
  }, a.state === "running" ? `${a.label}…` : a.label), hash && h(Text, {
    dimColor: true
  }, ` ${hash}`));
}
function footer(ui, s, chip) {
  const { Box, Text } = ui;
  if (!s.t.selected && !s.latest)
    return null;
  return h(Box, {
    flexDirection: "row"
  }, s.t.selected ? h(Box, {
    flexShrink: 1
  }, h(Text, {
    dimColor: true,
    wrap: "truncate-start"
  }, words().selected, relOrShort(s.t, s.t.selected))) : null, h(Box, {
    flexGrow: 1
  }), chip);
}

const FILL = /<rect\b[^>]*\bdata-m-fill\b[^>]*>/g;
const DONE = /<path\b[^>]*\bdata-m-done\b[^>]*>/g;
const HAS_DONE = /\bdata-m-done\b/;
const WIDTH = /\swidth="([\d.]+)"/;
const CLASS = /\sclass="([^"]*)"/;
const STYLE = /\sstyle="([^"]*)"/;
const MIN_RATIO_STEP = 0.02;
const RATIO_DIGITS = 3;
const widthOf$1 = (tag) => Number(WIDTH.exec(tag)?.[1] ?? 0);
function withClass(tag, name, extra = "") {
  const tagged = CLASS.test(tag) ? tag.replace(CLASS, (_, classes) => ` class="${classes} ${name}"`) : tag.replace(/\s*\/?>$/, ` class="${name}"$&`);
  return tagged.replace(/\s*\/?>$/, `${extra}$&`);
}
function slideFills(before, now) {
  const old = before.match(FILL) ?? [];
  if (old.length !== (now.match(FILL) ?? []).length)
    return now;
  let index = 0;
  return now.replace(FILL, (tag) => {
    const was = old[index++];
    const from = was === undefined ? 0 : widthOf$1(was);
    const to = widthOf$1(tag);
    if (from <= 0 || to <= 0 || Math.abs(from - to) / to < MIN_RATIO_STEP)
      return tag;
    const slide = `--m-from:${(from / to).toFixed(RATIO_DIGITS)}`;
    const styled = STYLE.test(tag) ? tag.replace(STYLE, (_, rules) => ` style="${slide};${rules}"`) : tag.replace(/\s*\/?>$/, ` style="${slide}"$&`);
    return withClass(styled, "m-from");
  });
}
function drawDone(before, now) {
  if (HAS_DONE.test(before))
    return now;
  return now.replace(DONE, (tag) => withClass(tag, "m-draw", ' pathLength="1"'));
}
function markChanges(before, now) {
  return drawDone(before, slideFills(before, now));
}

const STAGGER_MS = 45;
const EASE = "cubic-bezier(.2,.8,.2,1)";
const SHEEN = "#A39E93";
const RULES = {
  "m-in": `.m-in{animation:m-in .42s ${EASE} both}@keyframes m-in{from{opacity:0;transform:translateY(8px)}}`,
  "m-fade": `.m-fade{animation:m-fade .5s ${EASE} both}@keyframes m-fade{from{opacity:0}}`,
  "m-grow": `.m-grow{transform-box:fill-box;transform-origin:left center;animation:m-grow .7s ${EASE} both}@keyframes m-grow{from{transform:scaleX(0)}}`,
  "m-px": `.m-px{transform-box:fill-box;transform-origin:center;animation:m-px .34s ${EASE} both}@keyframes m-px{from{opacity:0;transform:translateY(-10px) scale(.6)}}`,
  "m-flash": ".m-flash{opacity:0;animation:m-flash 1.6s ease-out both}@keyframes m-flash{from{opacity:.9}to{opacity:0}}",
  "m-from": `.m-from{transform-box:fill-box;transform-origin:left center;animation:m-from .32s ${EASE} both}@keyframes m-from{from{transform:scaleX(var(--m-from))}}`,
  "m-draw": `.m-draw{stroke-dasharray:1;animation:m-draw .32s ${EASE} .12s both}@keyframes m-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}`,
  "m-breathe": ".m-breathe{animation:m-breathe 1.8s ease-in-out infinite}@keyframes m-breathe{50%{opacity:.4}}",
  "m-ring": ".m-ring{transform-box:fill-box;transform-origin:center;animation:m-ring 1.8s ease-out infinite}@keyframes m-ring{from{opacity:.55;transform:scale(1)}to{opacity:0;transform:scale(2.8)}}",
  "m-wash": `.m-wash{fill:#8E8A80;opacity:0;transition:opacity .12s ${EASE}}svg:hover .m-wash{opacity:.12}`,
  "m-tile": `.m-tile{transform-box:fill-box;transform-origin:center;transition:transform .2s ${EASE}}svg:hover .m-tile{transform:translateY(-1px) scale(1.06)}`
};
const REDUCED = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function motionCss(body) {
  const used = Object.keys(RULES).filter((name) => new RegExp(`\\b${name}\\b`).test(body));
  return used.length === 0 ? "" : `${used.map((name) => RULES[name]).join("")}${REDUCED}`;
}
Object.values(RULES).join("");
const isEntering = (cue) => cue.phase === "enter";
function entering(body, cue, kind = "in") {
  if (!isEntering(cue))
    return body;
  return `<g class="m-${kind}" style="animation-delay:${cue.order * STAGGER_MS}ms">${body}</g>`;
}
const FLASH = `<rect x="0" y="0" width="100%" height="100%" rx="10" fill="${SHEEN}" fill-opacity=".22" class="m-flash"/>`;
const WASH = '<rect x="0" y="0" width="100%" height="100%" rx="10" class="m-wash"/>';

function stableDrawings() {
  const kept = new Map;
  return {
    reset: () => kept.clear(),
    draw: (key, what, build) => {
      const signature = typeof what === "string" ? what : JSON.stringify(what);
      const before = kept.get(key);
      if (before !== undefined && before.what === signature)
        return before.drawing;
      const drawing = build(before === undefined ? "enter" : "change");
      kept.set(key, { what: signature, drawing });
      return drawing;
    }
  };
}

const TAG_WIDTH = /^[\s\S]*?<svg\b[^>]*?\swidth="([\d.]+)"/;
const SVG = /^([\s\S]*?<svg\b[^>]*>)([\s\S]*)(<\/svg>\s*)$/;
const SCHEME = "<style>:root{color-scheme:light dark}</style>";
const SAYS_SCHEME = /(^|[^-\w])color-scheme\s*:/;
const PASS_MS = 120;
const MAX_ORDER = 12;
const LIVE_MS = 30000;
function animate(source, spec) {
  const moved = spec.cue.phase === "change" && spec.before !== undefined ? markChanges(spec.before, source) : source;
  const parts = SVG.exec(moved);
  if (parts === null)
    return source;
  const [, open, inner = "", close] = parts;
  const scheme = SAYS_SCHEME.test(inner) ? "" : SCHEME;
  const lit = `${spec.isRow === true ? WASH : ""}${spec.cue.phase === "change" && spec.isLive !== true ? FLASH : ""}${inner}`;
  const body = entering(lit, spec.cue);
  const css = motionCss(body);
  return `${open}${scheme}${css === "" ? "" : `<style>${css}</style>`}${body}${close}`;
}
function paneMotion() {
  const drawings = stableDrawings();
  const shown = new Map;
  const pass = { at: Number.NEGATIVE_INFINITY, entered: 0 };
  const begin = () => {
    const now = Date.now();
    if (now - pass.at > PASS_MS)
      pass.entered = 0;
    pass.at = now;
  };
  return {
    reset: () => {
      drawings.reset();
      shown.clear();
    },
    pic: (key, pic, opts = {}) => {
      begin();
      const what = `${opts.isRow === true ? "row:" : ""}${pic.source}`;
      const now = { shows: opts.shows === undefined ? what : JSON.stringify(opts.shows), width: String(pic.width ?? TAG_WIDTH.exec(pic.source)?.[1]), source: pic.source };
      const source = drawings.draw(key, what, (built) => {
        const order = built === "enter" ? Math.min(MAX_ORDER, pass.entered++) : 0;
        const before = shown.get(key);
        const isQuiet = before !== undefined && (before.shows === now.shows || before.width !== now.width);
        const phase = built === "change" && isQuiet ? "still" : built;
        const lastChange = before?.changedAt ?? Number.NEGATIVE_INFINITY;
        const isLive = phase === "change" && pass.at - lastChange < LIVE_MS;
        shown.set(key, { ...now, changedAt: phase === "change" ? pass.at : lastChange });
        return animate(pic.source, { cue: { phase, order }, isRow: opts.isRow, before: before?.source, isLive });
      });
      return { ...pic, source, isInteractive: true };
    }
  };
}

const ROLE = { read: "read", edit: "edit", commit: "ok" };
const baseName = (id) => id.slice(id.lastIndexOf("/") + 1);
function relDir(id, root) {
  const rel = id.startsWith(`${root}/`) ? id.slice(root.length + 1) : id;
  const cut = rel.lastIndexOf("/");
  return cut < 0 ? "" : rel.slice(0, cut);
}
const relPath = (id, root) => id.startsWith(`${root}/`) ? id.slice(root.length + 1) : id;
const where = (id, root) => {
  const dir = relDir(id, root);
  return { text: dir ? words().inDir(dir) : words().inRoot, cls: "mid" };
};
function diffParts(diff) {
  if (!diff || diff[0] === 0 && diff[1] === 0)
    return [];
  return [
    ...diff[0] ? [{ text: ` +${diff[0]}`, cls: "f-ok", isNum: true }] : [],
    ...diff[1] ? [{ text: ` −${diff[1]}`, cls: "f-danger", isNum: true }] : []
  ];
}
const count = (turn, role) => turn.touches.filter((t) => t.role === role).length;
function tally(turn) {
  const w = words();
  const parts = [
    count(turn, "read") ? w.openedFiles(count(turn, "read")) : "",
    count(turn, "edit") ? w.editedFiles(count(turn, "edit")) : ""
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : w.noTouchYet;
}
function liveHero(input, latest) {
  const same = input.turn.touches.filter((t) => t.role === latest.role && input.live.has(t.id));
  const w = words();
  const [lead = "", tail = ""] = w.liveOne[latest.role];
  const isMany = same.length > 1;
  const title = isMany ? { lead: w.liveMany[latest.role](same.length), name: "", tail: "" } : { lead, name: baseName(latest.id), tail };
  const sub = latest.role === "commit" ? shaParts(input) : [where(latest.id, input.root)];
  return { label: w.now, title, sub };
}
function shaParts(input) {
  const sha = input.turn.sha ? [{ text: input.turn.sha, cls: "mid", isNum: true }] : [];
  const branch = input.branch ? [{ text: `${sha.length ? " · " : ""}${words().onBranch(input.branch)}`, cls: "lo" }] : [];
  return [...sha, ...branch];
}
const quiet = (label, lead, sub) => ({
  label,
  title: { lead, name: "", tail: "" },
  sub: [{ text: sub, cls: "mid" }]
});
function names(touches) {
  return touches.map((t) => baseName(t.id)).join(", ");
}
function doneHero(input) {
  const { turn, root } = input;
  const w = words();
  const commits = count(turn, "commit");
  if (commits || turn.committed) {
    const n = Math.max(commits, turn.committed);
    return { label: w.done, title: { lead: w.committedN(n), name: "", tail: "" }, sub: shaParts(input) };
  }
  const edits = turn.touches.filter((t) => t.role === "edit");
  const reads = count(turn, "read");
  const opened = reads ? [{ text: ` · ${w.openedFiles(reads)}`, cls: "lo" }] : [];
  if (edits.length) {
    const first = edits[0];
    const sub = edits.length === 1 ? [{ text: relPath(first.id, root), cls: "mid" }, ...diffParts(input.diff[first.id])] : [{ text: names(edits), cls: "mid" }];
    return { label: w.done, title: { lead: w.editedN(edits.length), name: "", tail: "" }, sub: [...sub, ...opened] };
  }
  if (reads) {
    const sub = [{ text: names(turn.touches), cls: "mid" }];
    return { label: w.done, title: { lead: w.readN(reads), name: "", tail: "" }, sub };
  }
  return quiet(w.done, w.untouched, w.untouchedSub);
}
function runningHero(input) {
  const { turn } = input;
  const w = words();
  const latest = [...turn.touches].filter((t) => input.live.has(t.id)).sort((a, b) => a.at - b.at).pop();
  if (latest)
    return liveHero(input, latest);
  if (input.isCommitting) {
    const sub = input.branch ? [{ text: w.toBranch(input.branch), cls: "mid" }] : [];
    return { label: w.now, title: { lead: w.committing, name: "", tail: "" }, sub };
  }
  return quiet(w.now, w.thinking, tally(turn));
}
function heroOf(input) {
  const { turn } = input;
  if (turn.isRunning)
    return { ...runningHero(input), isLive: true };
  if (!turn.hasRun)
    return quiet(words().now, words().waiting, words().waitingSub);
  return doneHero(input);
}
const heroText = (h) => `${h.title.lead}${h.title.name}${h.title.tail}`;
const subText = (h) => h.sub.map((p) => p.text).join("");
function touchedRows(input) {
  const { turn, root } = input;
  const w = words();
  return turn.touches.map((t) => {
    const isLive = turn.isRunning && input.live.has(t.id);
    const diff = t.role === "read" ? undefined : input.diff[t.id];
    const cost = turn.costs?.[t.id];
    return {
      name: baseName(t.id),
      dir: relDir(t.id, root),
      pill: { text: (isLive ? w.pillLive : w.pillDone)[t.role], role: isLive ? ROLE[t.role] : null },
      ...diff && (diff[0] || diff[1]) ? { diff } : {},
      ...cost ? { cost: costText(cost) } : {}
    };
  });
}

const ADD_COLOR$1 = "#98c379";
const DEL_COLOR$1 = "#e06c75";
const PX_PER_COL = 9;
const NAME_PX = 14;
const LEVEL_CELLS = 2;
const RIGHT_GAP_PX = 10;
const MIN_NAME_PX = 72;
function clean(segs) {
  for (const seg of segs)
    for (const k of Object.keys(seg))
      if (seg[k] === undefined)
        delete seg[k];
  return segs;
}
function countSegs(c, theme) {
  if (!c)
    return [];
  const out = [];
  if (c[0] > 0)
    out.push({ t: ` ?:${c[0]}`, c: GIT_COLOR["?"] });
  if (c[1] > 0)
    out.push({ t: ` M:${c[1]}`, c: GIT_COLOR.M });
  if (c[2] > 0)
    out.push({ t: ` D:${c[2]}`, c: theme.urgent });
  return out;
}
function statusOf(ctx, id) {
  return ctx.t.git[id] ?? (underAny(dirname(id), ctx.untracked, ctx.t.root) ? "?" : undefined);
}
function metaOf(ctx, r) {
  const { t } = ctx;
  const n = r.node;
  if (t.showSize) {
    if (n.kind === "dir")
      return n.id in t.dirSizes ? formatSize(t.dirSizes[n.id] ?? -1) : "…";
    return n.kind === "file" || n.kind === "link" && n.size > 0 ? formatSize(n.size) : "";
  }
  return t.diff[n.id] || n.kind !== "file" ? "" : stamp(n.mtime, ctx.now);
}
const fit = (name, cols) => name.length > cols ? name.slice(0, Math.max(1, cols - 1)) + "…" : name;
function gitColorOf(status, theme) {
  if (status === "D" || status === "U")
    return theme.urgent;
  return status ? GIT_COLOR[status] ?? theme.muted : undefined;
}
function terminalColors(theme, n, git) {
  if (git.isIgnored)
    return { icon: theme.muted, name: theme.muted };
  if (git.color !== undefined)
    return { icon: git.color, name: git.color };
  if (n.hidden)
    return { icon: theme.muted, name: theme.muted };
  return { icon: n.kind === "dir" ? theme.accent : theme.muted, name: theme.fg || undefined };
}
function badgeText(ctx, s) {
  if (s.hasCounts)
    return "";
  if (s.status)
    return ` ${s.status}`;
  if (!s.isIgnored)
    return "  ";
  return ctx.unicode ? " ⊘" : " ";
}
function caretOf(r, unicode) {
  if (r.node.kind !== "dir")
    return "  ";
  if (unicode)
    return (r.open ? "▾" : "▸") + " ";
  return (r.open ? CHEVRON_OPEN : CHEVRON_CLOSED) + " ";
}
function glyphOf(ctx, r) {
  const n = r.node;
  if (!ctx.unicode)
    return fileIcon(n, r.open, n.kind === "dir" && n.id === ctx.t.top);
  return n.kind === "dir" ? "■" : "·";
}
function terminalRow(ctx, r) {
  const { t, theme, unicode } = ctx;
  const n = r.node;
  const status = statusOf(ctx, n.id);
  const isIgnored = !status && underAny(n.id, ctx.ignored, t.root);
  const gitColor = gitColorOf(status, theme);
  const isBright = ctx.bright.has(n.id);
  const isDim = !isBright && ctx.dimmed.has(n.id);
  const tone = t.flashTones[n.id] ?? "orange";
  const colors = terminalColors(theme, n, { color: gitColor, isIgnored });
  const loc = t.diff[n.id];
  const meta = metaOf(ctx, r);
  const cost = ctx.costOf(n.id);
  const locText = loc ? `${loc[0] ? ` +${loc[0]}` : ""}${loc[1] ? ` -${loc[1]}` : ""}` : "";
  const dirCounts = n.kind === "dir" ? countSegs(t.counts[n.id], theme) : [];
  const badge = badgeText(ctx, { status, isIgnored, hasCounts: dirCounts.length > 0 });
  const countsText = dirCounts.map((c) => c.t).join("");
  const cols = Math.max(4, ctx.width - r.depth * 2 - 6 - (meta ? meta.length + 1 : 0) - (cost ? cost.length + 1 : 0) - locText.length - badge.length - countsText.length);
  const caret = caretOf(r, unicode);
  const glyph = glyphOf(ctx, r);
  const lit = isBright || isDim;
  const left = [
    { t: "  ".repeat(r.depth) },
    { t: caret, c: theme.muted },
    lit ? { t: glyph + " ", sh: tone, dim: isDim, one: true } : { t: glyph + " ", c: colors.icon },
    lit ? { t: fit(n.name, cols), sh: tone, dim: isDim, b: isBright } : { t: fit(n.name, cols), c: colors.name, b: n.id === t.selected, s: status === "D" && n.kind !== "dir" }
  ];
  const right = [];
  if (cost)
    right.push({ t: ` ${cost}`, c: TONES.blue?.solid ?? theme.accent });
  if (meta)
    right.push({ t: ` ${meta}`, c: theme.muted });
  if (loc && loc[0] > 0)
    right.push({ t: ` +${loc[0]}`, c: ADD_COLOR$1 });
  if (loc && loc[1] > 0)
    right.push({ t: ` -${loc[1]}`, c: DEL_COLOR$1 });
  right.push(...dirCounts);
  if (badge)
    right.push({ t: badge, c: status ? gitColor : theme.muted, b: true });
  return { id: n.id, left: clean(left), right: clean(right) };
}
const changesIn = (ctx, n) => n.kind === "dir" ? (ctx.t.counts[n.id] ?? [0, 0, 0]).reduce((a, b) => a + b, 0) : 0;
function desktopPrefix(ctx, r, role) {
  const { pal } = ctx;
  const chevron = r.node.kind === "dir" ? r.open ? "⌄" : "›" : "";
  const guides = Array.from({ length: r.depth }, () => ({ t: "│", c: pal.lineStrong, cells: LEVEL_CELLS }));
  return [...guides, { t: chevron, c: role ? pal.roles[role].fg : pal.lo, cells: LEVEL_CELLS }];
}
function desktopRight(ctx, r, role) {
  const { t, pal } = ctx;
  const n = r.node;
  const live = role ? ctx.pillOf(n.id, role) : "";
  if (role && live)
    return { must: [{ t: ` ${live}`, c: pal.roles[role].fg }], may: [] };
  const changes = changesIn(ctx, n);
  if (changes && !t.showSize)
    return { must: [{ t: ` ${changes}`, c: pal.roles.warn.fg }], may: [] };
  const loc = t.diff[n.id];
  const must = [];
  if (loc && !t.showSize) {
    if (loc[0] > 0)
      must.push({ t: ` +${loc[0]}`, c: pal.roles.ok.fg });
    if (loc[1] > 0)
      must.push({ t: ` −${loc[1]}`, c: pal.roles.danger.fg });
  }
  const cost = ctx.costOf(n.id);
  const meta = metaOf(ctx, r);
  return { must, may: [...cost ? [{ t: ` ${cost}`, c: pal.mid }] : [], ...meta ? [{ t: ` ${meta}`, c: pal.lo }] : []] };
}
const widthOf = (segs) => measure$1(segs.map((x) => x.t).join(""), NAME_PX);
function fitRow(ctx, r, right, isBold) {
  const room = (ctx.width - (r.depth + 1) * LEVEL_CELLS) * PX_PER_COL;
  const whole = measure$1(r.node.name, NAME_PX, isBold);
  const must = room - widthOf(right.must) < MIN_NAME_PX ? [] : right.must;
  const kept = [...must];
  for (const seg of right.may)
    if (whole + widthOf([...kept, seg]) + RIGHT_GAP_PX <= room)
      kept.push(seg);
  return { name: fitMiddle(r.node.name, Math.max(MIN_NAME_PX, room - widthOf(kept) - RIGHT_GAP_PX), { size: NAME_PX, isBold }), right: kept };
}
function nameColor(ctx, id, isHidden) {
  const { pal } = ctx;
  const status = statusOf(ctx, id);
  if (status === "D" || status === "U")
    return pal.roles.danger.fg;
  if (status)
    return pal.roles.warn.fg;
  return isHidden || underAny(id, ctx.ignored, ctx.t.root) ? pal.lo : pal.hi;
}
function desktopRow(ctx, r) {
  const { t } = ctx;
  const n = r.node;
  const isBright = ctx.bright.has(n.id);
  const isDim = !isBright && ctx.dimmed.has(n.id);
  const tone = t.flashTones[n.id] ?? "orange";
  const role = isBright ? roleOfTone(tone) : null;
  const isBold = isBright || isDim || n.id === t.selected;
  const { name, right } = fitRow(ctx, r, desktopRight(ctx, r, role), isBold);
  const status = statusOf(ctx, n.id);
  const label = isBright || isDim ? { t: name, sh: tone, dim: isDim, b: true } : { t: name, c: nameColor(ctx, n.id, n.hidden), b: n.id === t.selected, s: status === "D" && n.kind !== "dir" };
  return { id: n.id, left: clean([...desktopPrefix(ctx, r, role), label]), right: clean(right), ...role ? { bg: ctx.pal.roles[role].tint } : {} };
}

const TOOL_KEYS = { r: "refresh", c: "collapse", s: "size", u: "up", p: "cwd", ".": "hidden", x: "unselect" };
const MORE_KEYS = ["size", "hidden", "up", "cwd", "unselect"];
function toolLabels(t) {
  const { tools } = words();
  return {
    refresh: tools.refresh,
    collapse: tools.collapse,
    size: t.showSize ? tools.showDates : tools.showSizes,
    up: tools.up,
    cwd: tools.cwd,
    hidden: t.showHidden ? tools.hideHidden : tools.showHidden,
    unselect: tools.unselect,
    more: t.showTools ? tools.less : tools.more
  };
}
const SHORTCUT_KEYS = ["r", "c", "s", ".", "u", "p", "x"];
const shortcuts = () => SHORTCUT_KEYS.map((key, i) => [key, words().shortcuts[i] ?? ""]);
function drawFind(ui, bar) {
  const { Box, Button, Input } = ui;
  const { t } = bar;
  const w = words();
  return h(Box, {
    flexDirection: "row",
    gap: 1,
    alignItems: "center"
  }, h(Box, {
    flexGrow: 1,
    flexShrink: 1
  }, h(Input, {
    key: "q",
    placeholder: w.find,
    submitLabel: w.findOpen,
    autoFocus: true,
    value: t.query,
    onInput: bar.search.onInput,
    onSubmit: bar.search.onSubmit
  })), t.query ? h(Button, {
    key: "clear",
    plain: true,
    dimColor: true,
    label: w.clear,
    onPress: () => bar.search.onInput("")
  }) : null);
}
function drawActions(ui, bar) {
  const { Box, Button } = ui;
  const { t, act } = bar;
  const labels = toolLabels(t);
  return h(Box, {
    flexDirection: "row",
    flexShrink: 0,
    columnGap: 1,
    alignItems: "center"
  }, h(Button, {
    key: "collapse",
    plain: true,
    dimColor: true,
    label: labels.collapse,
    onPress: act.collapse
  }), h(Button, {
    key: "refresh",
    plain: true,
    dimColor: true,
    label: labels.refresh,
    onPress: act.refresh
  }), h(Button, {
    key: "more",
    plain: true,
    dimColor: !t.showTools,
    label: labels.more,
    onPress: act.more
  }));
}
function drawMore(ui, bar) {
  const { Box, Button, Text } = ui;
  const { t, act } = bar;
  if (!t.showTools)
    return null;
  const labels = toolLabels(t);
  const w = words();
  const more = MORE_KEYS.filter((k) => k !== "unselect" || t.selected);
  return h(Box, {
    flexDirection: "column",
    gap: 1
  }, h(Box, {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1
  }, more.map((k) => h(Button, {
    key: k,
    plain: true,
    dimColor: true,
    label: labels[k],
    onPress: act[k]
  }))), h(Box, {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 2
  }, h(Text, {
    dimColor: true
  }, w.whileFocused), shortcuts().map(([key, what]) => h(Text, {
    dimColor: true
  }, h(Text, {
    bold: true
  }, key), " ", what))));
}

const ROW_PX = 18;
const MIN_SVG_W = 240;
const MAX_SVG_W = 900;
const TOOLBAR_ROWS = 3;
const TOOLBAR_OPEN_ROWS = 9;
const FOOTER_ROWS = 2;
const MIN_BODY$1 = 5;
const ACTIONS_PX = 260;
const MIN_NAME_W = 90;
function gitRowOf(t) {
  if (!t.top || !t.branch)
    return null;
  const [add, del] = t.diff[t.root] ?? [0, 0];
  const changed = (t.counts[t.root] ?? [0, 0, 0]).reduce((a, b) => a + b, 0);
  return { branch: t.branch.head, upstream: t.branch.upstream, ahead: t.branch.ahead, behind: t.branch.behind, changed, add, del };
}
function costRowOf(s) {
  const total = s.readTotal;
  if (!total || total.reads === 0)
    return null;
  const turn = turnCost(s.turn);
  return { turn: turn ? costText(turn) : null, session: total.reads > (turn?.reads ?? 0) ? costText(total) : null };
}
function legendOf(s, git) {
  const tones = s.t.flashOn ? Object.values(s.t.flashTones).map(roleOfTone) : [];
  const has = (role) => s.turn.touches.some((x) => x.role === role) || tones.includes(role);
  const { legend } = words();
  return [
    ...has("read") ? [{ role: "read", label: legend.read }] : [],
    ...has("edit") ? [{ role: "edit", label: legend.edit }] : [],
    ...git?.changed ? [{ role: "warn", label: legend.warn }] : []
  ];
}
const motion = paneMotion();
function opening(open) {
  motion.reset();
  return open();
}
function cardsOf(s, w) {
  const { t, look } = s;
  const input = heroInput(s);
  const git = gitRowOf(t);
  const cost = costRowOf(s);
  const hero = heroOf(input);
  const legend = legendOf(s, git);
  const touchedList = touchedRows(input);
  const section = sectionLine({ label: words().allFiles, name: (t.top ? t.top : t.root).split("/").pop() ?? "" }, { look, w: w - ACTIONS_PX >= MIN_NAME_W ? w - ACTIONS_PX : w });
  return {
    hero: { drawn: heroCard(hero, { git, cost, legend }, { look, w }), shows: { hero, git, legend, isCounted: Boolean(cost?.turn), isSummed: Boolean(cost?.session), look, w } },
    touched: touchedList.length ? { drawn: touchedCard(touchedList, look, w), shows: { rows: touchedList.map(({ cost: c, ...row }) => ({ ...row, isCounted: c !== undefined })), look, w } } : null,
    section: { drawn: section }
  };
}
function drawDesktop(ui, frame, act) {
  const { Box, Client, Svg } = ui;
  const { s, room, home } = frame;
  const { t, look } = s;
  const pal = paletteOf(look.isLight);
  const { hero, touched, section } = cardsOf(s, Math.max(MIN_SVG_W, Math.min(MAX_SVG_W, room.width * PX_PER_COL)));
  const lines = (px) => Math.ceil(px / ROW_PX) + 1;
  const toolRows = t.showTools ? TOOLBAR_OPEN_ROWS : TOOLBAR_ROWS;
  const fixed = lines(hero.drawn.height) + (touched ? lines(touched.drawn.height) : 0) + lines(section.drawn.height) + toolRows + FOOTER_ROWS;
  const ctx = rowCtx(s, room.width - 1, true);
  const win = treeWindow(s, Math.max(MIN_BODY$1, room.bodyRows - fixed), { toSpec: (r) => desktopRow(ctx, r), colors: { thumb: pal.lineStrong, track: pal.line, note: pal.lo } });
  const bar = win.bar ? { ...win.bar, isOverlay: true } : null;
  if (t.showSize)
    act.sizes(unsized(t, win.rows));
  const chip = s.latest ? activityChip(ui, s.latest, { unicode: true, colorOf: (tone) => pal.roles[roleOfTone(tone)].fg }) : null;
  const svg = (key, card) => h(Svg, {
    key,
    ...motion.pic(key, card.drawn, { shows: card.shows })
  });
  const find = { onInput: act.find, onSubmit: act.jump };
  const rows = { rows: win.specs, active: t.cursor, activeBg: pal.line, hoverBg: mix(pal.line, pal.sheet, 0.5), tones: shimmerTones(pal, look.isLight), pointer: s.feel.pointer, ...bar ? { bar } : {} };
  const tools = { t, act: act.tool, search: find };
  return h(Box, {
    flexDirection: "column",
    gap: 1,
    minHeight: Math.max(1, room.bodyRows)
  }, home, svg("ft-hero", hero), drawFind(ui, tools), touched ? svg("ft-touched", touched) : null, h(Box, {
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between"
  }, svg("ft-section", section), drawActions(ui, tools)), drawMore(ui, tools), h(Client, {
    key: "rows",
    module: "./rows.tsx",
    props: rows
  })), h(Box, {
    flexGrow: 1
  }), footer(ui, s, chip) ?? h(Box, {
    height: 1
  }));
}

const HOME_LABEL = "← modz";
function HomeButton(ui, onPress) {
  const { Box, Button } = ui;
  return h(Box, {
    key: "modz-home-row",
    flexDirection: "row"
  }, h(Button, {
    key: "modz-home",
    label: HOME_LABEL,
    plain: true,
    dimColor: true,
    onPress
  }));
}

const PAGE = 10;
const STEPS = new Map([
  ["up", -1],
  ["k", -1],
  ["down", 1],
  ["j", 1],
  ["pageup", -PAGE],
  ["pagedown", PAGE]
]);
const MIN_SCROLL = 3;
async function pressed(h, t, data) {
  const n = t.nodes.find((x) => x.id === data.press);
  if (!n)
    return;
  if (t.scroll === null)
    await patch(h, () => ({ scroll: mem.view.from }));
  if (data.ctrl || data.shift)
    await openNode(h, n);
  else
    await press(h, n);
}
async function onNode(h, t, at) {
  const { cur, k } = at;
  const { key } = k;
  if (key === "y" || key === "Y")
    await copyPath(h, cur.id, { isAbsolute: key === "Y" || Boolean(k.shift), surface: k.surface });
  else if ((key === "right" || key === "l") && cur.kind === "dir" && !t.expanded.includes(cur.id))
    await toggle(h, cur);
  else if (key === "left" || key === "h") {
    if (cur.kind === "dir" && t.expanded.includes(cur.id))
      await toggle(h, cur);
    else if (cur.parent !== t.root)
      await patch(h, () => ({ cursor: cur.parent }));
  } else if (key === "return")
    await (cur.kind !== "dir" ? openNode(h, cur) : toggle(h, cur));
  else if (key === " ")
    await toggle(h, cur);
  else
    return false;
  return true;
}
async function onKey(h, t, k) {
  const rows = visibleRows(t);
  const at = rows.findIndex((r) => r.node.id === t.cursor);
  const cur = rows[at]?.node;
  const move = (d) => {
    const target = rows[Math.max(0, Math.min(rows.length - 1, (at < 0 ? 0 : at) + d))];
    return target ? patch(h, () => ({ cursor: target.node.id, scroll: null })) : Promise.resolve();
  };
  const step = STEPS.get(k.key);
  if (step !== undefined)
    await move(step);
  else if (k.key === "home")
    await move(-rows.length);
  else if (k.key === "end")
    await move(rows.length);
  else if (cur && await onNode(h, t, { cur, k }))
    return;
  else if (TOOL_KEYS[k.key] && !k.ctrl)
    actionsOf(h, t)[TOOL_KEYS[k.key]]();
}
async function onRows(h, data, surface) {
  sync(h);
  const t = await h.tree();
  if (typeof data.copy === "string")
    return copyPath(h, data.copy, { isAbsolute: Boolean(data.shift), surface });
  if (typeof data.scrollTo === "number") {
    const to = Math.round(Math.max(0, Math.min(1, data.scrollTo)) * mem.view.max);
    if (to !== t.scroll)
      await patch(h, () => ({ scroll: to }));
    return;
  }
  if (typeof data.press === "string")
    return pressed(h, t, data);
  if (typeof data.key === "string")
    await onKey(h, t, { key: data.key, ctrl: data.ctrl, shift: data.shift, surface });
}
async function scrollBy(h, by) {
  const t = await h.tree();
  const to = Math.max(0, Math.min(mem.view.max, (t.scroll ?? mem.view.from) + Math.sign(by) * Math.max(MIN_SCROLL, Math.abs(by))));
  if (to !== t.scroll)
    await patch(h, () => ({ scroll: to }));
}

const SIZE_ROWS = 60;
function actOf(value) {
  if (typeof value !== "object" || value === null)
    return null;
  const { page, action, arg } = value;
  if (page !== HUB_PANE || typeof action !== "string")
    return null;
  return { action, arg: typeof arg === "string" ? arg : "" };
}
function sentOf(arg) {
  try {
    const sent = JSON.parse(arg);
    return typeof sent === "object" && sent !== null ? sent : {};
  } catch {
    return {};
  }
}
function takeView(view) {
  const { from, max } = view ?? {};
  if (typeof from === "number" && typeof max === "number" && from >= 0 && max >= 0)
    mem.view = { from, max };
}
async function runAct(h, act) {
  const { action, arg } = act;
  const tools = toolWork(h, await h.tree());
  if (Object.hasOwn(tools, action))
    return tools[action]();
  if (action === "find") {
    await search(h, arg);
    return;
  }
  if (action === "jump")
    return jump(h, arg);
  if (action === "focus") {
    await sync(h);
    if (await h.look())
      await refreshLook(h);
    return;
  }
  const sent = sentOf(arg);
  takeView(sent.view);
  if (action === "rows" && typeof sent.data === "object" && sent.data !== null)
    await onRows(h, sent.data, typeof sent.surface === "string" ? sent.surface : undefined);
  else if (action === "scroll" && typeof sent.by === "number")
    await scrollBy(h, sent.by);
}
async function onHubAct(h, act) {
  await runAct(h, act);
  await saveFeel(h);
  const t = await h.tree();
  if (t.showSize)
    wantSizes(h, unsized(t, visibleRows(t).slice(mem.view.from, mem.view.from + SIZE_ROWS)));
}

const NO_REPO_DEPTH = 4;
const FIND_LIMIT = 200;
const READ_REVEAL_LIMIT = 12;
const RM_MS = 3000;
const BRANCH_VERBS = ["push", "pull", "fetch", "checkout", "switch", "branch", "merge", "rebase", "tag"];
const QUIET_VERBS = ["commit", "push", "add"];
let scanning = null;
let scanJobs = [];
function sinceOf(jobs) {
  const writers = jobs.filter((j) => !j.readOnly);
  const first = (writers[0] ?? jobs[0])?.since ?? { ms: 0, mark: "", os: "linux" };
  return (writers.length ? writers : jobs).reduce((a, j) => j.since.ms < a.ms ? j.since : a, first);
}
async function probeRepo(h, t, at) {
  if (at.jobs.some((j) => j.initRepo))
    await detectRepo(h);
  else if (!t.top && await exists(h, join(t.root, ".git")))
    await detectRepo(h);
  const probed = await h.tree();
  if (probed.top && (at.writes || probed.top !== t.top))
    await refreshGit(h);
  if (!at.writes)
    return;
  dropIndex();
  await staleSizes(h);
}
async function changed(h, pass, w) {
  const { t, fresh } = pass;
  if (fresh.top)
    return changedInRepo(h, { root: t.root, since: w.since, ignored: fresh.ignored }, w.before);
  return { hits: w.since.os === "win32" ? [] : await changedSince(h, { root: t.root, since: w.since, depth: NO_REPO_DEPTH }), gone: [] };
}
async function lightWrites(h, pass, w) {
  const { t, fresh, ignored, tones } = pass;
  const found = await changed(h, pass, w);
  const hits = found.hits.filter((x) => inside(t.root, x) && !underAny(x, ignored, t.root)).slice(0, FIND_LIMIT);
  await revealPaths(h, hits);
  const loaded = await h.tree();
  const dirs = [...new Set([loaded.root, ...openDirs(loaded), ...hits.map(dirname), ...found.gone.map(dirname)])].filter((d) => inside(loaded.root, d));
  const listed = await loadDirs(h, dirs);
  if (!fresh.top && w.since.os === "win32") {
    for (const kids of listed.values())
      for (const n of kids)
        if (n.mtime > w.since.ms && hits.length < FIND_LIMIT)
          hits.push(n.id);
  }
  await patch(h, (cur) => {
    const ids = new Set(cur.nodes.map((n) => n.id));
    return { expanded: cur.expanded.filter((id) => ids.has(id)) };
  });
  const present = new Set((await h.tree()).nodes.map((n) => n.id));
  const touchTone = w.actions.find((a) => !QUIET_VERBS.includes(a.verb))?.tone ?? "orange";
  if (mem.showWrites) {
    for (const id of hits)
      if (present.has(id))
        tones[id] = touchTone;
  }
  await noteTouches(h, hits.filter((id) => present.has(id)), "edit");
}
async function lightReads(h, pass, reads) {
  const { t, ignored, tones } = pass;
  const found = [];
  for (const r of reads) {
    if (found.length >= READ_REVEAL_LIMIT)
      break;
    if (r !== t.root && inside(t.root, r) && !underAny(r, ignored, t.root) && await exists(h, r))
      found.push(r);
  }
  if (!found.length)
    return;
  await revealPaths(h, found);
  const shown = new Set((await h.tree()).nodes.map((n) => n.id));
  for (const r of found)
    if (shown.has(r) && !tones[r])
      tones[r] = "purple";
  await noteTouches(h, found.filter((r) => shown.has(r)), "read");
}
async function lightGit(h, pass, actions) {
  const { ignored, tones } = pass;
  const final = await h.tree();
  const committed = actions.some((a) => a.verb === "commit");
  if ((committed || actions.some((a) => a.verb === "add")) && final.top) {
    const all = (await gitPaths(h, { root: final.root, prefix: final.prefix }, committed)).filter((x) => !underAny(x, ignored, final.root));
    const paths = all.slice(0, READ_REVEAL_LIMIT);
    await revealPaths(h, paths);
    const shown = new Set((await h.tree()).nodes.map((n) => n.id));
    for (const x of paths)
      if (shown.has(x))
        tones[x] = "green";
    if (committed) {
      await noteTouches(h, all, "commit");
      await noteCommit(h, { committed: all.length });
    }
  }
  const pushLike = actions.find((a) => BRANCH_VERBS.includes(a.verb) || a.kind.startsWith("gh "));
  if (pushLike)
    tones[BRANCH_ROW] = pushLike.tone;
  else if (committed)
    tones[BRANCH_ROW] = "green";
}
async function afterBash$1(h, jobs) {
  const reads = mem.queuedReads;
  mem.queuedReads = [];
  if (await followCwd(h))
    return;
  const t = await h.tree();
  if (!t.root)
    return;
  const actions = jobs.flatMap((j) => j.actions);
  const since = sinceOf(jobs);
  const writes = !jobs.every((j) => j.readOnly);
  const before = mem.dirty.root === t.root ? mem.dirty.files : {};
  await probeRepo(h, t, { jobs, writes });
  const fresh = await h.tree();
  const pass = { t, fresh, ignored: new Set(fresh.ignored), tones: {} };
  if (writes)
    await lightWrites(h, pass, { since, before, actions });
  if (mem.showReads)
    await lightReads(h, pass, reads);
  if (mem.showWrites && actions.length)
    await lightGit(h, pass, actions);
  await flash(h, pass.tones);
}
function dropMarks(h, marks) {
  return h.run(["rm", "-f", ...marks], { timeoutMs: RM_MS }).catch(() => {
    return;
  });
}
function scheduleScan(h, job) {
  scanJobs.push(job);
  if (scanning)
    return;
  scanning = (async () => {
    while (scanJobs.length) {
      const jobs = scanJobs;
      scanJobs = [];
      try {
        await afterBash$1(h, jobs);
      } finally {
        const marks = jobs.map((j) => j.since.mark).filter(Boolean);
        if (marks.length)
          await dropMarks(h, marks);
      }
    }
  })().finally(() => {
    scanning = null;
  });
}
async function touched(h, paths, how) {
  if (await followCwd(h))
    return;
  const t = await h.tree();
  if (!t.root)
    return;
  const within = paths.map(posix).filter((p) => inside(t.root, p));
  if (within.length === 0)
    return;
  if (how.tone !== "purple") {
    dropIndex();
    await staleSizes(h, within);
    await revealPaths(h, within.map(dirname));
    await loadDirs(h, [...new Set(within.map(dirname))].filter((d) => inside(t.root, d)));
    await refreshGit(h);
  } else
    await revealPaths(h, within);
  await noteTouches(h, within, how.tone === "purple" ? "read" : "edit");
  if (!how.isShown)
    return;
  const tones = {};
  for (const p of within)
    tones[p] = how.tone;
  await flash(h, tones);
}
async function readTouched(h, path) {
  if (!mem.isLooked)
    await noteTouches(h, [path], "read");
  else if (mem.showReads)
    await touched(h, [path], { tone: "purple", isShown: true });
}
async function settleBackground(h, text) {
  if (mem.background.size === 0 || !text.includes("<task-notification>"))
    return;
  for (const [id, status] of taskEnds(text)) {
    const task = mem.background.get(id);
    if (!task)
      continue;
    mem.background.delete(id);
    const ok = status === "completed";
    const results = task.p ? await outcomes(h, task.p, { ok, op: undefined, text: "" }) : [];
    if (task.p)
      await finishGit(h, task.p, results);
    if (mem.showReads)
      mem.queuedReads.push(...task.reads);
    scheduleScan(h, { ...task.job, actions: proven(task.p, results) });
  }
}

const PICK_FRESH_MS = 2 * 60000;
function mentionsOf(text, t) {
  return [...text.matchAll(/@([^\s"'`]+)/g)].map((m) => (m[1] ?? "").replace(/[.,;:!?)]+$/, "")).filter(Boolean).map((p) => resolve(t.root, p, mem.home)).filter((p) => inside(t.root, p));
}
async function revealMentions(h, mentions) {
  const found = [];
  for (const p of mentions) {
    try {
      await h.stat(p);
      found.push(p.replace(/\/$/, ""));
    } catch {
      continue;
    }
  }
  if (found.length)
    await reveal(h, found);
}
async function promptContext(h, e) {
  settleBackground(h, e.text);
  const context = [...e.context ?? []];
  if (!mem.isLooked)
    return context;
  followCwd(h).then((moved) => moved ? undefined : sync(h)).catch(() => {
    return;
  });
  const t = await h.tree();
  const isMoving = mem.follow && t.root !== await cwdOf(h);
  const pick = mem.freshPick;
  const isRecent = await h.now() - mem.freshPickAt <= PICK_FRESH_MS;
  mem.freshPick = "";
  if (!isMoving && isRecent && t.selected && pick === t.selected && await exists(h, t.selected))
    context.push(`The user has this file selected in the file tree; "this" or "it" in the prompt likely refers to it: ${t.selected}`);
  const mentions = mentionsOf(e.text, t);
  if (mentions.length)
    revealMentions(h, mentions);
  return context;
}

const keyOf = (agentId) => agentId ?? "";
function loopOf(agentId) {
  const key = keyOf(agentId);
  const loop = mem.loops.get(key) ?? { turnId: "", size: null, pending: [] };
  mem.loops.set(key, loop);
  return loop;
}
function noteRead(read) {
  if (!read.id)
    return;
  loopOf(read.agentId).pending.push({ id: read.id, file: posix(read.file), chars: read.text.length });
}
function takeReads(agentId) {
  const loop = loopOf(agentId);
  const reads = loop.pending;
  loop.pending = [];
  return reads;
}
async function measure(h, step) {
  const { reads, agentId, grown } = step;
  if (reads.length === 0)
    return;
  const added = grown > 0 ? addedOf(await h.messages(agentId), reads.map((r) => r.id)) : null;
  const costs = attribute({ reads, added, grown }, mem.rate);
  mem.rate = rateAfter(mem.rate, { added, grown });
  await noteCosts(h, costs);
}
function stepDone(h, step) {
  const loop = loopOf(step.agentId);
  const before = loop.turnId === step.turnId ? loop.size : null;
  const after = sizeOf(step.usage);
  loop.turnId = step.turnId;
  loop.size = after;
  return measure(h, { reads: step.reads, agentId: step.agentId, grown: growthOf(before, after) });
}
async function loopDone(h, agentId) {
  const reads = takeReads(agentId);
  mem.loops.delete(keyOf(agentId));
  await measure(h, { reads, agentId, grown: 0 });
}

const paneOf = (value) => {
  if (typeof value !== "object" || value === null)
    return null;
  const pane = value.pane;
  return typeof pane === "string" && pane !== "" ? pane : null;
};
const isAskedFor = (value, pane) => paneOf(value) === pane;
function isOffStage(value, pane) {
  const staged = paneOf(value);
  return staged !== null && staged !== pane;
}
const shownOf = (pane, at) => ({ pane, at });

const FIRST_PINNED = 1e9;
const pins = new Map;
function handleFor(id) {
  let handle = pins.get(id);
  if (handle === undefined) {
    handle = FIRST_PINNED + pins.size;
    pins.set(id, handle);
  }
  return handle;
}
const UNDRAWABLE = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\ud800-\udfff\u{10eeee}]/gu;
const drawable = (text) => text.replace(UNDRAWABLE, "");
function drawableProps(el) {
  const props = el.props;
  if (typeof props !== "object" || props === null)
    return el;
  const cleaned = Object.entries(props).filter(([name, value]) => name !== "key" && typeof value === "string" && drawable(value) !== value);
  if (cleaned.length === 0)
    return el;
  return { ...el, props: { ...props, ...Object.fromEntries(cleaned.map(([name, value]) => [name, drawable(value)])) } };
}
function pinNode(node, ctx) {
  if (typeof node === "string")
    return drawable(node);
  if (typeof node !== "object" || node === null)
    return node;
  const el = drawableProps(node);
  const children = el.children?.map((child) => pinNode(child, ctx));
  const withKids = children === undefined ? el : { ...el, children };
  if (el.press?.plugin !== "" || typeof el.props?.key !== "string")
    return withKids;
  const base = `${ctx.site}\x00${el.type}\x00${el.props.key}`;
  const nth = ctx.seen.get(base) ?? 0;
  ctx.seen.set(base, nth + 1);
  return { ...withKids, press: { plugin: "", handle: handleFor(`${base}\x00${nth}`) } };
}
function pinned(site, tree) {
  if (tree === null || tree === undefined)
    return tree;
  const ctx = { site: `${site.surface}\x00${site.component ?? ""}\x00${site.requestId ?? ""}`, seen: new Map };
  return pinNode(tree, ctx);
}

const THEME_POLL_MS = 2000;
const MIN_COLUMNS = 110;
const NERD_CHARSET = "f04eb";
async function settleTree(h) {
  const t = await h.tree();
  if (t.flashOn)
    await patch(h, unlit);
  await h.setActivities((cur) => cur.map((a) => a.state === "running" ? { ...a, state: "failed", label: words().cutShort(a.kind) } : a));
  const cwd = await cwdOf(h);
  if (!t.root || t.nodes.length === 0 || mem.follow && t.root !== cwd)
    await reset(h, cwd);
  else
    await showPane(h, false);
  await syncHub(h);
}
async function prepareLook(h) {
  if (mem.isLooked)
    return false;
  mem.isLooked = true;
  const env = mem.look;
  mem.pointer = await finePointerOk(h);
  try {
    const remote = await env.isRemote();
    mem.noNerd = !remote && (env.isWindows || await fontState(h, NERD_CHARSET) !== "ok");
  } catch {
    mem.noNerd = true;
  }
  await loadTheme(h);
  mem.themePoll?.cancel();
  mem.themePoll = mem.themeMtime ? h.every(THEME_POLL_MS, () => void loadTheme(h)) : null;
  return true;
}
async function startPane(h) {
  if (await prepareLook(h))
    await settleTree(h);
}
async function resumePane(h) {
  if (!mem.isLooked)
    return;
  await loadTheme(h);
  const root = mem.follow || !mem.lastRoot ? await cwdOf(h) : mem.lastRoot;
  const t = await h.tree();
  if (t.root !== root || t.nodes.length === 0)
    await reset(h, root);
}
async function openByCommand(h, e) {
  const isApp = await inApp(h);
  const w = words();
  if (!isApp && !e.presentation.isFullscreen)
    return w.needsFullscreen;
  if (!isApp && e.presentation.columns < MIN_COLUMNS)
    return w.needsColumns(MIN_COLUMNS);
  await prepareLook(h);
  mem.noDock = false;
  const arg = (e.args ?? "").trim();
  const cwd = await cwdOf(h);
  mem.follow = !arg;
  const root = arg ? resolve(cwd, arg, mem.home) : cwd;
  await reset(h, root, true);
  return w.opened(shortPath(root), mem.follow);
}
async function showInHub(h) {
  mem.noDock = false;
  if (await prepareLook(h))
    await settleTree(h);
  else if ((await h.tree()).nodes.length === 0)
    await reset(h, await cwdOf(h));
  await saveFeel(h);
}
async function openForHub(h) {
  await prepareLook(h);
  await openFromHub(h);
}

const TERMINAL_TONE = { purple: "blue", iris: "purple" };
const SHIMMER = Object.fromEntries(Object.keys(TONES).map((k) => {
  const v = TONES[TERMINAL_TONE[k] ?? k] ?? TONES[k];
  return [k, { bright: v?.bright ?? [], dim: v?.dim ?? [] }];
}));
const ADD_COLOR = "#98c379";
const DEL_COLOR = "#e06c75";
const HEAD_ROWS = 2;
const MIN_BODY = 5;
const FAINT_BASE = 38;
const FAINT_SHARE = 0.3;
const SESSION_COST_COLS = 70;
function faint(hex) {
  const v = parseInt(hex.slice(1), 16);
  const ch = (shift) => Math.round(FAINT_BASE + ((v >> shift & 255) - FAINT_BASE) * FAINT_SHARE);
  return `#${[16, 8, 0].map((x) => ch(x).toString(16).padStart(2, "0")).join("")}`;
}
function branchTotals(ui, s) {
  const { Box, Text } = ui;
  const { t, theme } = s;
  const totals = t.diff[t.root] ?? [0, 0];
  const rootCounts = countSegs(t.counts[t.root], theme);
  return h(Box, {
    flexDirection: "row",
    flexShrink: 0
  }, totals[0] > 0 && h(Text, {
    color: ADD_COLOR
  }, ` +${totals[0]}`), totals[1] > 0 && h(Text, {
    color: DEL_COLOR
  }, ` -${totals[1]}`), rootCounts.map((c) => h(Text, {
    color: c.c
  }, c.t)), rootCounts.length === 0 && totals[0] === 0 && totals[1] === 0 && h(Text, {
    color: theme.muted
  }, ` ${words().clean}`));
}
function terminalBranch(ui, s, unicode) {
  const { Box, Text } = ui;
  const { t, theme } = s;
  if (!t.top || !t.branch)
    return null;
  const b = t.branch;
  const isFlash = s.bright.has(BRANCH_ROW);
  const tone = TONES[t.flashTones[BRANCH_ROW] ?? "teal"]?.solid;
  return h(Box, {
    flexDirection: "row",
    height: 1,
    overflow: "hidden"
  }, h(Box, {
    flexDirection: "row",
    flexShrink: 0
  }, h(Text, {
    color: isFlash ? tone ?? theme.accent : theme.accent
  }, (unicode ? BRANCH_ICON.plain : BRANCH_ICON.nerd) + " "), h(Text, {
    bold: true,
    color: isFlash ? tone ?? (theme.fg || undefined) : theme.fg || undefined
  }, b.head), b.ahead > 0 && h(Text, {
    color: "success"
  }, ` ↑${b.ahead}`), b.behind > 0 && h(Text, {
    color: "warning"
  }, ` ↓${b.behind}`)), b.upstream && h(Box, {
    flexShrink: 1,
    overflow: "hidden"
  }, h(Text, {
    color: theme.muted,
    wrap: "truncate-end"
  }, ` ${b.upstream}`)), h(Box, {
    flexGrow: 1
  }), branchTotals(ui, s));
}
function searchRow(ui, at) {
  const { Box, Button, Input } = ui;
  const { t } = at;
  return h(Box, {
    flexDirection: "row",
    gap: 1
  }, h(Box, {
    flexGrow: 1
  }, h(Input, {
    key: "q",
    ...at.label ? { label: at.label } : {},
    placeholder: words().find,
    submitLabel: words().findGo,
    autoFocus: true,
    value: t.query,
    onInput: at.act.find,
    onSubmit: at.act.jump
  })), t.query ? h(Button, {
    key: "clear",
    plain: true,
    dimColor: true,
    label: at.clear,
    onPress: () => at.act.find("")
  }) : null);
}
function headRow(ui, at) {
  const { Box, Text, Button } = ui;
  const { t, theme, unicode, act } = at;
  const header = t.top ? [t.top.split("/").pop() ?? t.top, t.prefix.replace(/\/$/, "")].filter(Boolean).join("/") : t.root.split("/").pop() || t.root;
  const icon = (key, glyph, isDim = true) => h(Button, {
    key,
    plain: true,
    dimColor: isDim,
    label: unicode ? glyph.plain : glyph.nerd,
    onPress: act[key]
  });
  return h(Box, {
    flexDirection: "row"
  }, h(Text, {
    bold: true,
    color: theme.accent,
    wrap: "truncate-start"
  }, header), h(Box, {
    flexGrow: 1
  }), h(Box, {
    flexDirection: "row",
    gap: 2
  }, icon("up", { plain: "↑", nerd: "\uDB80\uDC5D" }), icon("cwd", { plain: "⌂", nerd: "\uDB80\uDEDC" }, !at.isFollowing), icon("refresh", { plain: "↻", nerd: "\uDB81\uDC50" }), icon("hidden", t.showHidden ? { plain: "◉", nerd: "\uDB80\uDE08" } : { plain: "○", nerd: "\uDB80\uDE09" }, !t.showHidden), icon("size", { plain: "Σ", nerd: "\uDB80\uDECA" }, !t.showSize), icon("collapse", { plain: "⊟", nerd: "" }), t.selected ? icon("unselect", { plain: "⊘", nerd: "\uDB81\uDF77" }, false) : null, h(Text, null, " ")));
}
function costLabel(s, width) {
  const turn = turnCost(s.turn);
  const total = s.readTotal;
  const said = words();
  const parts = [
    turn ? `${costText(turn)} ${said.tokUnit}` : "",
    total && total.reads > (turn?.reads ?? 0) && width >= SESSION_COST_COLS ? said.costSession(costText(total, true)) : ""
  ];
  return parts.filter(Boolean).join(" · ");
}
function nowLine(ui, s, width) {
  const { Box, Text } = ui;
  const hero = heroOf(heroInput(s));
  const cost = costLabel(s, width);
  return h(Box, {
    flexDirection: "row",
    height: 1,
    overflow: "hidden"
  }, h(Box, {
    flexDirection: "row",
    flexShrink: 1,
    overflow: "hidden"
  }, h(Text, {
    bold: true,
    dimColor: true
  }, `${hero.label}  `), h(Text, {
    wrap: "truncate-end"
  }, heroText(hero)), h(Text, {
    dimColor: true,
    wrap: "truncate-end"
  }, ` · ${subText(hero)}`)), h(Box, {
    flexGrow: 1
  }), cost ? h(Text, {
    color: "suggestion"
  }, ` ${cost}`) : null);
}
function fixedRows(s) {
  const { t } = s;
  return HEAD_ROWS + Number(!t.top || Boolean(t.branch)) + Number(Boolean(t.selected || s.latest)) + Number(s.turn.hasRun);
}
function drawTerminal(ui, frame, act) {
  const { Box, Text, Client } = ui;
  const { s, room, home } = frame;
  const { t, theme } = s;
  const { glyphs, noNerd } = s.feel;
  const unicode = glyphs === "plain" || glyphs === "auto" && noNerd;
  const ctx = rowCtx(s, room.width, unicode);
  const win = treeWindow(s, Math.max(MIN_BODY, room.bodyRows - fixedRows(s)), { toSpec: (r) => terminalRow(ctx, r), colors: { thumb: theme.accent, track: theme.muted, note: theme.muted } });
  if (t.showSize)
    act.sizes(unsized(t, win.rows));
  const chip = s.latest ? activityChip(ui, s.latest, { unicode, colorOf: (tone) => TONES[tone]?.solid ?? theme.accent }) : null;
  const rows = { rows: win.specs, active: t.cursor, activeBg: theme.selection, hoverBg: faint(theme.selection), tones: SHIMMER, pointer: s.feel.pointer, ...win.bar ? { bar: win.bar } : {} };
  return h(Box, {
    flexDirection: "column",
    minHeight: Math.max(1, room.bodyRows),
    backgroundColor: theme.bg || undefined
  }, home, headRow(ui, { t, theme, unicode, isFollowing: s.feel.follow, act: act.tool }), terminalBranch(ui, s, unicode), !t.top && h(Text, {
    color: theme.muted
  }, unicode ? "± " : " ", words().noRepo), s.turn.hasRun && nowLine(ui, s, room.width), searchRow(ui, { t, act, label: "/ ", clear: unicode ? "×" : "\uDB80\uDD56" }), h(Client, {
    key: "rows",
    module: "./rows.tsx",
    props: rows
  }), h(Box, {
    flexGrow: 1
  }), footer(ui, s, chip));
}

const WATCHED = ["Edit", "Write", "NotebookEdit", "Bash"];
const CD_FOLLOW_MS = 400;
const isWatched = (tool) => WATCHED.includes(tool);
function fileOf(e) {
  if ("file_path" in e && typeof e.file_path === "string")
    return e.file_path;
  return "notebook_path" in e && typeof e.notebook_path === "string" ? e.notebook_path : "";
}
async function beforeCall(h, e) {
  const command = e.tool === "Bash" ? e.command : "";
  const cwd = e.tool === "Bash" ? await cwdOf(h) : "";
  const actions = gitActions(command);
  const quiet = !actions.length && readOnly(command);
  const since = await sinceNow(h, mem.isLooked && e.tool === "Bash" && !quiet && !(await h.tree()).top);
  const pending = actions.length ? await pendingOf(h, { command, actions, cwd: e.agentId ? "" : cwd }) : null;
  return { tool: e.tool, command, cwd, file: fileOf(e), actions, quiet, since, pending };
}
async function callFailed(h, call) {
  if (call.pending)
    await finishGit(h, call.pending, failAll(call.pending));
  if (call.since.mark)
    dropMarks(h, [call.since.mark]);
}
async function settle(h, call, done) {
  const { pending } = call;
  const run = { ok: !done.result.isError, op: done.out.gitOperation, text: typeof done.result.text === "string" ? done.result.text : "" };
  const results = pending ? await outcomes(h, pending, run) : [];
  if (pending)
    await finishGit(h, pending, results);
  const sha = results.find((r, i) => r.state === "done" && pending?.actions[i]?.verb === "commit")?.detail;
  if (sha && pending?.place.isHere)
    await noteCommit(h, { sha });
  if (!mem.isLooked)
    return;
  mem.queuedReads.push(...done.reads);
  scheduleScan(h, { ...done.job, actions: proven(pending, results) });
}
function afterBash(h, call, result) {
  const { command, cwd, pending } = call;
  const out = !result.isError && result.result && typeof result.result === "object" ? result.result : {};
  const reads = mem.showReads ? readTargets(command, { cwd, stdout: typeof out.stdout === "string" ? out.stdout : "", home: mem.home }) : [];
  const job = { actions: [], since: call.since, initRepo: call.actions.some((a) => a.init), readOnly: call.quiet || result.isReadOnly === true };
  if (out.backgroundTaskId)
    mem.background.set(out.backgroundTaskId, { p: pending, job, reads });
  else
    settle(h, call, { result, out, job, reads });
  if (mem.isLooked && mem.follow && /(^|[;&|\s])(cd|pushd|popd)(\s|$)/.test(command))
    h.after(CD_FOLLOW_MS, () => void followCwd(h));
}
function afterCall(h, call, result) {
  const { pending, since } = call;
  if (pending && result.deny) {
    const ids = pending.ids;
    h.setActivities((cur) => cur.filter((a) => !ids.includes(a.id)));
  }
  if (result.deny || result.isError && call.tool !== "Bash") {
    if (since.mark)
      dropMarks(h, [since.mark]);
    return result;
  }
  if (call.tool === "Bash")
    afterBash(h, call, result);
  else if (call.file && mem.isLooked)
    touched(h, [call.file], { tone: "orange", isShown: mem.showWrites });
  else if (call.file)
    noteTouches(h, [posix(call.file)], "edit");
  return result;
}

const TREE = { plugin: "filetree", key: "tree" };
const THEME = { plugin: "filetree", key: "theme" };
const ACTIVITY = { plugin: "filetree", key: "activity" };
const TURN = { plugin: "filetree", key: "turn" };
const READS = { plugin: "filetree", key: "reads" };
const LOOK = { plugin: "filetree", key: "look" };
const HUB = { plugin: "filetree", key: "hub" };
const FEEL = { plugin: "filetree", key: "feel" };
const PANE = "filetree";
const ACTIVITY_KEEP = 6;
const GIT_SETTLE_MS = 300;
const MIN_WIDTH = 24;
const DEFAULT_ROWS = 40;
const HOME_ROWS = 2;
function stateOf($) {
  return {
    tree: async () => ({ ...emptyTree(""), ...(await $.state.get(TREE)).value }),
    putTree: async (fn) => {
      await update($, TREE, (cur) => fn({ ...emptyTree(""), ...cur }));
    },
    activities: async () => (await $.state.get(ACTIVITY)).value ?? [],
    setActivities: async (fn) => {
      await update($, ACTIVITY, (cur) => fn(cur ?? []).slice(-ACTIVITY_KEEP));
    },
    turn: async () => ({ ...NO_TURN, ...(await $.state.get(TURN)).value }),
    setTurn: async (fn) => {
      await update($, TURN, (cur) => fn({ ...NO_TURN, ...cur }));
    },
    readTotal: async () => (await $.state.get(READS)).value,
    setReadTotal: async (fn) => {
      await update($, READS, (cur) => fn(cur));
    },
    hubCard: async () => (await $.state.get(HUB)).value,
    setHubCard: async (card) => {
      await $.state.set(HUB, card);
    },
    look: async () => (await $.state.get(LOOK)).value,
    setLook: async (look) => {
      await update($, LOOK, () => look);
    },
    theme: async () => (await $.state.get(THEME)).value,
    setTheme: async (theme) => {
      await $.state.set(THEME, theme);
    },
    feel: async () => (await $.state.get(FEEL)).value,
    setFeel: async (feel) => {
      await $.state.set(FEEL, feel);
    },
    isHubOn: async () => (await $.state.get({ plugin: "modz", key: "isOn" })).value === true,
    isHubDrawing: async () => [(await $.state.get({ plugin: "modz", key: "drawn" })).value].flat().includes(HUB_PANE),
    goHome: (pane) => $.clock.now().then((at) => $.state.set({ plugin: "filetree", key: "home" }, { at, ...pane ? { pane } : {} })).then(() => {
      return;
    }, (error) => $.ui.log(`filetree: home failed (${String(error)})`, { to: "debug" })),
    reportShown: async () => {
      try {
        if ((await $.state.get({ plugin: "modz", key: "isOn" })).value !== true)
          return;
        await $.state.set({ plugin: "filetree", key: "shown" }, shownOf(HUB_PANE, await $.clock.now()));
      } catch (error) {
        $.ui.log(`filetree: shown failed (${String(error)})`, { to: "debug" });
      }
    }
  };
}
function ioOf($) {
  return {
    list: (path) => $.fs.list(path),
    stat: (path, options) => $.fs.stat(path, options),
    read: (path) => $.fs.read(path),
    run: (argv, init) => $.process.run(argv, init),
    now: () => $.clock.now(),
    after: (ms, fn) => $.clock.after(ms, fn),
    every: (ms, fn) => $.clock.every(ms, fn),
    cwd: () => $.session.cwd(),
    sessionId: () => $.session.id(),
    messages: async (agentId) => {
      const found = await $.session.messages(agentId ? { agentId, as: "api" } : { as: "api" });
      return Array.isArray(found) ? found : [];
    },
    tmpdir: () => $.env.get("TMPDIR"),
    osEnv: () => $.env.get("OS"),
    homeEnv: () => $.env.get("HOME"),
    herdrEnv: () => $.env.get("HERDR_ENV"),
    herdrBin: () => $.env.get("HERDR_BIN_PATH")
  };
}
function uiOf($) {
  return {
    toast: (text) => $.ui.toast(text),
    openPane: (isFocused) => opening(() => $.ui.open(isFocused ? { id: PANE, title: words().title, focus: true } : { id: PANE, title: words().title })),
    isPaneOpen: async () => {
      try {
        return (await $.ui.panes()).some((p) => p.id === PANE);
      } catch {
        return false;
      }
    },
    copy: (args) => $.ui.copy(args),
    surfaces: () => $.session.surfaces(),
    config: () => $.config.list()
  };
}
function hostOf($) {
  return { ...stateOf($), ...ioOf($), ...uiOf($) };
}
function onStart(on) {
  on("state.set", { plugin: "modz", key: "open" }, async ($, e, next) => {
    const done = await next(e);
    if (isOpenFor(e.value, HUB_PANE))
      await openForHub(hostOf($));
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "modz", key: "stage" }, async ($, e, next) => {
    const done = await next(e);
    const isInHub = isAskedFor(e.value, HUB_PANE) && await hostOf($).isHubDrawing();
    if (isOffStage(e.value, HUB_PANE) || isInHub)
      await $.ui.close({ id: PANE });
    if (isInHub)
      $.clock.after(0, () => void showInHub(hostOf($)));
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "modz", key: "act" }, async ($, e, next) => {
    const done = await next(e);
    const act = actOf(e.value);
    if (act !== null)
      $.clock.after(0, () => void onHubAct(hostOf($), act).catch((cause) => $.ui.log(`filetree: the hub's ${act.action} failed (${String(cause)})`, { to: "debug" })));
    return done;
  }).catch(($, e, next) => next(e));
  on("session.start", async ($, e, next) => {
    setLang(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    await $.command.register({ name: "filetree", description: words().command });
    const isWindows = await $.env.get("OS") === "Windows_NT";
    useDrives(isWindows);
    mem.home = posix((await $.env.get("HOME") || await $.env.get("USERPROFILE") || "").replace(/[\\/]+$/, ""));
    mem.activityId = Math.max(mem.activityId, ...(await hostOf($).activities()).map((a) => a.id));
    mem.look = { isWindows, isRemote: async () => Boolean(await $.env.get("SSH_CONNECTION") || await $.env.get("SSH_TTY")) };
    quickStatus(hostOf($));
    return next(e);
  });
  on("command.run", { command: "filetree" }, async ($, e) => ({ text: await openByCommand(hostOf($), e) }));
}
function onTools(on) {
  on("tool.call", async ($, e, next) => {
    if (!isWatched(e.tool))
      return next(e);
    const host = hostOf($);
    const call = await beforeCall(host, e);
    let result;
    try {
      result = await next(e);
    } catch (err) {
      await callFailed(host, call);
      throw err;
    }
    return afterCall(host, call, result);
  }).catch(($, e, next) => next(e));
  on("tool.call", { tool: "Read" }, async ($, e, next) => {
    const result = await next(e);
    if (result.deny || result.isError || e.tool !== "Read")
      return result;
    noteRead({ id: e.tool_use_id ?? "", file: e.file_path, text: result.text ?? "", agentId: e.agentId });
    readTouched(hostOf($), posix(e.file_path));
    return result;
  });
  on("turn.step", async function* ($, e, next) {
    const reads = takeReads(e.agentId);
    const step = yield* next(e);
    stepDone(hostOf($), { turnId: e.turnId, agentId: e.agentId, reads, usage: step.usage });
    return step;
  }).catch(async function* ($, e, next) {
    return yield* next(e);
  });
}
function onTurns(on) {
  on("turn.start", async ($, e, next) => {
    const host = hostOf($);
    await host.setTurn(() => ({ ...NO_TURN, isRunning: true, hasRun: true }));
    await syncHub(host);
    return next(e);
  });
  on("turn.complete", async ($, e, next) => {
    const result = await next(e);
    const host = hostOf($);
    await loopDone(host, e.agentId);
    if (!e.agentId)
      await host.setTurn((cur) => ({ ...NO_TURN, ...cur, isRunning: false }));
    if (!e.agentId)
      await hubAfterTurn(host);
    return result;
  });
  on("ui.message", async ($, e, next) => {
    if (e.requestId !== PANE || e.element !== "rows" || !e.data || typeof e.data !== "object")
      return next(e);
    await onRows(hostOf($), e.data, e.surface);
    return {};
  });
}
function onClassic(on) {
  on("classic.SessionStart", async ($, e, next) => {
    const result = await next(e);
    const host = hostOf($);
    if (e.source === "clear" || e.source === "resume" || e.source === "fork")
      resumePane(host);
    const gd = await gitDir(host, posix(e.cwd));
    return gd ? { ...result, watchPaths: [...result.watchPaths ?? [], join(gd, "index"), join(gd, "HEAD")] } : result;
  });
  on("classic.CwdChanged", async ($, e, next) => {
    const result = await next(e);
    if (mem.isLooked)
      followCwd(hostOf($));
    return result;
  });
  on("classic.FileChanged", async ($, e, next) => {
    const result = await next(e);
    if (mem.isLooked && /[\\/]\.git[\\/]|[\\/](index|HEAD)$/.test(e.file_path))
      $.clock.after(GIT_SETTLE_MS, () => void sync(hostOf($), true));
    return result;
  });
}
function onPane(on) {
  on("ui.focus", { component: "Pane", requestId: PANE }, async ($, e, next) => {
    const result = await next(e);
    const host = hostOf($);
    sync(host);
    if (await host.look())
      refreshLook(host);
    return result;
  });
  on("ui.scroll", { component: "Pane", requestId: PANE }, async ($, e) => {
    await scrollBy(hostOf($), e.by);
    return {};
  });
  on("prompt.submit", async ($, e, next) => {
    const context = await promptContext(hostOf($), e);
    return next(context.length ? { ...e, context } : e);
  }).catch(($, e, next) => next(e));
  on("prompt.attachment", async ($, e, next) => {
    settleBackground(hostOf($), e.text);
    return next(e);
  });
}
function onRender(on) {
  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e, next) => {
    if (e.surface !== "terminal" && e.surface !== "desktop")
      return next(e);
    if (e.surface === "terminal" && e.props.placement === "inline") {
      mem.noDock = true;
      $.ui.close({ id: PANE }).catch(() => {
        return;
      });
      const { Box: Empty } = $.ui.resolve(e);
      return h(Empty, null);
    }
    const host = hostOf($);
    if (!mem.isLooked)
      startPane(host);
    const s = await sceneOf(host, e.surface === "desktop");
    const isHubOn = await host.isHubOn();
    const room = { width: Math.max(MIN_WIDTH, e.props.bodyColumns), bodyRows: (e.props.scroll?.bodyRows ?? DEFAULT_ROWS) - (isHubOn ? HOME_ROWS : 0) };
    const act = filesActs(host, s.t);
    if (e.surface === "desktop") {
      const desk = $.ui.resolve(e);
      return pinned(e, drawDesktop(desk, { s, room, home: isHubOn ? HomeButton(desk, () => void host.goHome()) : null }, act));
    }
    const ui = $.ui.resolve(e);
    return pinned(e, drawTerminal(ui, { s, room, home: isHubOn ? HomeButton(ui, () => void host.goHome()) : null }, act));
  });
}
const register = (on, options) => {
  mem.glyphSetting = typeof options?.glyphs === "string" ? options.glyphs : "auto";
  const activity = typeof options?.activity === "string" ? options.activity : "reads and writes";
  mem.showReads = activity.includes("reads");
  mem.showWrites = activity.includes("writes");
  mem.followClaude = options?.follow !== "off";
  mem.sizeDefault = options?.column === "size";
  onStart(on);
  onTools(on);
  onTurns(on);
  onClassic(on);
  onPane(on);
  onRender(on);
};

export { register };
