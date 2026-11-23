// Built by `bin/modz build` from the files beside it. Never edited by hand.
import { atom, read, update } from 'claude-code';

const PATHS = {
  trash: "M4 6.5h16M9.5 6.5V5A1.5 1.5 0 0 1 11 3.5h2A1.5 1.5 0 0 1 14.5 5v1.5M6 6.5l.9 12.1a2 2 0 0 0 2 1.9h6.2a2 2 0 0 0 2-1.9L18 6.5M10 10.5v6M14 10.5v6",
  shield: "M12 3.5l7 2.6v5.3c0 4.4-2.9 7.6-7 9.1-4.1-1.5-7-4.7-7-9.1V6.1zM9 12l2.2 2.2L15.2 10",
  key: "M12 15a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM8 15h.01M10.9 12.1l8.6-8.6M16.5 6.5l2.2 2.2M13.9 9.1l1.7 1.7",
  eye: "M3 12c2-3.8 5.1-6 9-6s7 2.2 9 6c-2 3.8-5.1 6-9 6s-7-2.2-9-6zM14.75 12a2.75 2.75 0 1 1-5.5 0 2.75 2.75 0 0 1 5.5 0z",
  pencil: "M4.5 19.5l1-4.2L15.9 4.9a2.1 2.1 0 0 1 3 0l.2.2a2.1 2.1 0 0 1 0 3L8.7 18.5zM14 6.8l3.2 3.2",
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  clock: "M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0zM12 7.5V12l3 2",
  cube: "M12 3.5l7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7zM4.5 7.7L12 12l7.5-4.3M12 12v8.5",
  bookmark: "M7.5 3.5h9a1.5 1.5 0 0 1 1.5 1.5v15.5l-6-4-6 4V5a1.5 1.5 0 0 1 1.5-1.5zM12 7.5v5M9.5 10h5",
  bulb: "M8.6 14.3a6 6 0 1 1 6.8 0c-.6.5-.9 1.1-.9 1.9v1.3h-5v-1.3c0-.8-.3-1.4-.9-1.9zM10 20.5h4",
  play: "M8.5 5.5v13l10-6.5z",
  pause: "M9 5.5v13M15 5.5v13",
  folder: "M3.5 7.5a2 2 0 0 1 2-2h3.8l2.2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2zM3.5 10.5h17",
  file: "M6.5 3.5h7l4.5 4.5v10.5a2 2 0 0 1-2 2h-9.5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2zM13.5 3.5v4.5H18M8.5 12.5h7M8.5 16h4.5",
  branch: "M9 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8v8M17 9.5c0 3.6-2.6 5-6 5.5-1.2.2-2 .7-2.5 1.6",
  terminal: "M3.5 6.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2zM7.5 9.5l3 2.5-3 2.5M12.5 15h4",
  bell: "M5.5 17h13l-1.5-2.2V11a5 5 0 0 0-10 0v3.8zM10.2 19.8a2 2 0 0 0 3.6 0M12 3.5V6",
  sparkle: "M11 5.5c.6 4 3 6.4 7 7-4 .6-6.4 3-7 7-.6-4-3-6.4-7-7 4-.6 6.4-3 7-7zM18.5 3.5v3M17 5h3",
  list: "M9.5 7h10M9.5 12h10M9.5 17h10M5 7h.01M5 12h.01M5 17h.01",
  flag: "M5.5 20.5v-16M5.5 4.5h11.5l-2.5 4 2.5 4H5.5",
  bolt: "M13.5 3.5L5.5 13.5h6l-1 7 8-10h-6z",
  gauge: "M5.6 18.4a9 9 0 1 1 12.8 0M12 13.5l3.5-4.5M13 13.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z",
  rewind: "M11.5 6.5v11L4 12zM20 6.5v11L12.5 12z",
  plug: "M9 3.5v4M15 3.5v4M6.5 7.5h11v3a5.5 5.5 0 0 1-11 0zM12 16v4.5",
  layers: "M12 3.5l8.5 4.5L12 12.5 3.5 8zM3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5",
  search: "M16.5 10.5a6 6 0 1 1-12 0 6 6 0 0 1 12 0zM15 15l5.5 5.5",
  globe: "M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0zM3.5 12h17M12 3.5c2.4 2.6 3.6 5.4 3.6 8.5s-1.2 5.9-3.6 8.5c-2.4-2.6-3.6-5.4-3.6-8.5s1.2-5.9 3.6-8.5z",
  star: "M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 17l-5.4 3 1.2-6-4.5-4.2 6.1-.7z"
};
const ICON_NAMES = Object.keys(PATHS);
const GLYPH = {
  trash: "⌫",
  shield: "◈",
  key: "⚷",
  eye: "◉",
  pencil: "✎",
  check: "✓",
  x: "✕",
  clock: "◷",
  cube: "▣",
  layers: "≡",
  star: "★",
  search: "⌕",
  globe: "◍",
  bookmark: "❏",
  bulb: "✧",
  play: "▸",
  pause: "‖",
  folder: "▤",
  file: "▢",
  branch: "⑂",
  terminal: "❯",
  bell: "◬",
  sparkle: "✦",
  list: "≡",
  flag: "⚑",
  bolt: "ϟ",
  gauge: "◔",
  rewind: "«",
  plug: "⏚"
};

const EMPTY_LAYOUT = { hidden: [], order: [] };
const PANE_ID$1 = /^[\w-]{1,64}$/;
const MAX_PANES = 64;
const panesOf = (value) => Array.isArray(value) ? [...new Set(value.filter((pane) => typeof pane === "string" && PANE_ID$1.test(pane)))].slice(0, MAX_PANES) : [];
function layoutOf(value) {
  if (typeof value !== "object" || value === null)
    return EMPTY_LAYOUT;
  const raw = value;
  return { hidden: panesOf(raw.hidden), order: panesOf(raw.order) };
}
function arrange(items, layout) {
  const rank = (item) => {
    const at = layout.order.indexOf(item.pane);
    return at === -1 ? layout.order.length : at;
  };
  return items.map((item, i) => ({ item, i })).sort((a, b) => rank(a.item) - rank(b.item) || a.i - b.i).map(({ item }) => item);
}
function moveUp(layout, opts) {
  const panes = [...opts.panes];
  const at = panes.indexOf(opts.pane);
  if (at <= 0)
    return layout;
  const above = panes[at - 1];
  panes[at - 1] = opts.pane;
  panes[at] = above;
  const rest = layout.order.filter((pane) => !panes.includes(pane));
  return { ...layout, order: [...panes, ...rest] };
}
function setHidden(layout, opts) {
  const others = layout.hidden.filter((pane) => pane !== opts.pane);
  return { ...layout, hidden: opts.isHidden ? [...others, opts.pane] : others };
}
const isHidden = (layout, pane) => layout.hidden.includes(pane);

let current$2 = "en";
const langOf$1 = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang$1(value) {
  current$2 = langOf$1(value);
  return current$2;
}
const lang = () => current$2;
const pick$2 = (table) => table[current$2];

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const PANES = {
  en: {
    agents: { title: "Agents", hint: "Agent status, progress and cost" },
    files: { title: "Files", hint: "Files Claude touched" },
    plan: { title: "Plan", hint: "The plan's steps" },
    transceiver: { title: "Transceiver", hint: "Chat rooms with your team" },
    tests: { title: "Tests", hint: "How the last test run went" },
    checkpoints: { title: "Restore points", hint: "Take back what a turn changed" },
    replay: { title: "Replay", hint: "Watch what the last turn changed" },
    usage: { title: "Usage", hint: "Allowance used and what it cost" },
    effort: { title: "Thinking level", hint: "How hard Claude thinks each turn" },
    handoff: { title: "Handoff", hint: "A note for your next fresh chat" },
    skins: { title: "Look", hint: "Looks and colors" },
    "modz-mods": { title: "Mods", hint: "Every mod and whether it works" },
    "modz-links": { title: "Connections", hint: "Outside tools: working, waiting or broken" },
    "modz-weight": { title: "Dead weight", hint: "Installed, but you never use it" },
    "modz-updates": { title: "Updates", hint: "New MODZ versions, by hand or automatic" }
  },
  tr: {
    agents: { title: "Ajanlar", hint: "Ajanlar: durum, ilerleme, maliyet" },
    files: { title: "Dosyalar", hint: "Claude'un dokunduğu dosyalar" },
    plan: { title: "Plan", hint: "Planın adımları" },
    transceiver: { title: "Transceiver", hint: "Arkadaşlarla sohbet odaları" },
    tests: { title: "Testler", hint: "Testlerin son sonucu" },
    checkpoints: { title: "Geri dönüş noktaları", hint: "Bir turun yaptıklarını geri al" },
    replay: { title: "Tekrar", hint: "Son turun değiştirdiklerini izle" },
    usage: { title: "Kullanım", hint: "Harcanan kullanım hakkı ve maliyet" },
    effort: { title: "Düşünme düzeyi", hint: "Claude her turda ne kadar derin düşünüyor" },
    handoff: { title: "Devir", hint: "Bir sonraki temiz sohbet için not" },
    skins: { title: "Görünüm", hint: "Görünüm ve renkler" },
    "modz-mods": { title: "Modlar", hint: "Tüm modlar ve çalışıp çalışmadıkları" },
    "modz-links": { title: "Bağlantılar", hint: "Dış araçlar: çalışan, bekleyen, bozuk" },
    "modz-weight": { title: "Ölü ağırlık", hint: "Kurulu ama hiç kullanmadıkların" },
    "modz-updates": { title: "Güncellemeler", hint: "Yeni MODZ sürümleri: elle ya da otomatik" }
  }
};
function paneWords(pane) {
  const table = pick$2(PANES);
  return table[pane] ?? { title: pane, hint: "" };
}
const HUB = {
  en: {
    sections: { work: "Work", safety: "Safety", meter: "Meters & settings" },
    idleTitle: "All quiet",
    idleLine: "Agents, tests and plans show here when they move.",
    now: "Now",
    open: "Open",
    openPane: (title) => `Open ${title}`,
    modsOn: (n) => `${count(n, "mod", "mods")} on`,
    unreadable: "the mod list could not be read",
    updateReady: "update ready",
    updateToast: "A new MODZ is out. Open Updates in the modz panel to get it.",
    command: "Opens the modz hub: agents, files, plan, tests and every mod",
    opened: "Opened the modz panel.",
    customize: "Customize",
    done: "Done",
    up: "Up",
    hide: "Hide",
    show: "Show",
    reset: "Reset",
    hidden: "Hidden",
    editLine: "Move a row up or hide it. Hidden rows wait here.",
    noAnswer: "did not answer: its panel did not open",
    inBand: (title) => `${title} has no panel: its question waits above the message box.`,
    plain: "plain view: the drawing failed",
    more: (n) => `+${n} more`,
    ago: {
      now: "now",
      seconds: (n) => `${n}s`,
      minutes: (n) => `${n}m`,
      hours: (h, m) => `${h}h ${String(m).padStart(2, "0")}m`
    },
    firstRun: "Only the hub is installed. Each mod adds a row here.",
    addMods: "Add mods",
    helpTitle: "modz: commands and settings",
    helpHub: "/modz opens the hub · /modz help prints this list",
    helpNone: "No installed mod has a command or an option.",
    helpInstall: "Not installed:"
  },
  tr: {
    sections: { work: "Çalışma", safety: "Güvence", meter: "Ölçüm ve ayarlar" },
    idleTitle: "Sakin",
    idleLine: "Ajan, test ya da plan hareketlenince burada görünür.",
    now: "Şu an",
    open: "Aç",
    openPane: (title) => `${title} panelini aç`,
    modsOn: (n) => `${n} mod açık`,
    unreadable: "mod listesi okunamadı",
    updateReady: "güncelleme var",
    updateToast: "MODZ'un yeni sürümü çıktı. Almak için modz panelinde Güncellemeler'i aç.",
    command: "modz ana panelini açar: ajanlar, dosyalar, plan, testler ve tüm modlar",
    opened: "modz paneli açıldı.",
    customize: "Düzenle",
    done: "Bitti",
    up: "Yukarı",
    hide: "Gizle",
    show: "Göster",
    reset: "Sıfırla",
    hidden: "Gizli",
    editLine: "Bir satırı yukarı taşı ya da gizle. Gizlenenler burada bekler.",
    noAnswer: "yanıt vermedi: paneli açılmadı",
    inBand: (title) => `${title} modunun paneli yok: sorusu mesaj kutusunun üstünde bekliyor.`,
    plain: "düz görünüm: çizim başarısız",
    more: (n) => `+${n} tane daha`,
    ago: {
      now: "şimdi",
      seconds: (n) => `${n} sn`,
      minutes: (n) => `${n} dk`,
      hours: (h, m) => `${h} sa ${String(m).padStart(2, "0")} dk`
    },
    firstRun: "Yalnızca ana panel kurulu. Her mod buraya bir satır ekler.",
    addMods: "Mod ekle",
    helpTitle: "modz: komutlar ve ayarlar",
    helpHub: "/modz ana paneli açar · /modz help bu listeyi yazar",
    helpNone: "Kurulu hiçbir modun komutu ya da seçeneği yok.",
    helpInstall: "Kurulu değil:"
  }
};
const hubWords = () => pick$2(HUB);
const badgeWord = () => pick$2({ en: "Beta", tr: "Beta" });
const CATALOG = {
  en: {
    groups: { look: "Look", safety: "Safety", meter: "Meter", flow: "Flow", other: "Other" },
    surfaces: { desktop: "desktop", terminal: "terminal" },
    allMods: "All mods",
    mods: (n) => count(n, "mod", "mods"),
    allOn: "all on",
    on: (n) => `${n} on`,
    unknown: (n) => `${n} unknown`,
    allHealthy: "all healthy",
    broken: (n) => `${n} broken`,
    brokenWord: "broken",
    offWord: "off",
    onWord: "on",
    stateUnknown: "state unknown",
    from: (upstream) => `from ${upstream}`,
    unreadable: "its settings file (plugin.json) could not be read",
    invalid: "its line in the mod list is broken",
    remote: "kept in its own project",
    entry: (n) => `entry ${n}`,
    emptyTitle: "The mod list could not be read",
    emptyLine: "The list file (marketplace.json) is missing or lists no mods.",
    install: "Not installed",
    installLine: "Paste a line into the message box to install that mod.",
    copy: "Copy",
    copied: "Copied. Paste it into the message box.",
    notCopied: "Could not copy; select the line instead.",
    guide: "Commands and settings",
    options: (keys) => `Options under /plugin: ${keys}`,
    noCommand: "no command"
  },
  tr: {
    groups: { look: "Görünüm", safety: "Koruma", meter: "Ölçüm", flow: "Akış", other: "Diğer" },
    surfaces: { desktop: "masaüstü", terminal: "terminal" },
    allMods: "Tüm modlar",
    mods: (n) => `${n} mod`,
    allOn: "hepsi açık",
    on: (n) => `${n} açık`,
    unknown: (n) => `${n} bilinmiyor`,
    allHealthy: "hepsi sağlıklı",
    broken: (n) => `${n} sorunlu`,
    brokenWord: "sorunlu",
    offWord: "kapalı",
    onWord: "açık",
    stateUnknown: "durum bilinmiyor",
    from: (upstream) => `asıl: ${upstream}`,
    unreadable: "ayar dosyası (plugin.json) okunamadı",
    invalid: "mod listesindeki satırı bozuk",
    remote: "kendi projesinde tutuluyor",
    entry: (n) => `kayıt ${n}`,
    emptyTitle: "Mod listesi okunamadı",
    emptyLine: "Liste dosyası (marketplace.json) bulunamadı ya da içinde mod yok.",
    install: "Kurulu değil",
    installLine: "Bir satırı mesaj kutusuna yapıştır; o mod kurulur.",
    copy: "Kopyala",
    copied: "Kopyalandı. Mesaj kutusuna yapıştır.",
    notCopied: "Kopyalanamadı; satırı seçip kopyala.",
    guide: "Komutlar ve ayarlar",
    options: (keys) => `/plugin altındaki seçenekler: ${keys}`,
    noCommand: "komut yok"
  }
};
const catalogWords = () => pick$2(CATALOG);
function placeLine(mod) {
  const words = catalogWords();
  const source = mod.upstream === null ? "modz" : words.from(mod.upstream);
  return `${mod.surfaces.map((surface) => words.surfaces[surface]).join(" · ")} · ${source}`;
}

const SECTIONS = ["work", "safety", "meter"];
const MODS_PANE = "modz-mods";
const LINKS_PANE = "modz-links";
const WEIGHT_PANE = "modz-weight";
const UPDATES_PANE = "modz-updates";
const SIDE_PANES = [LINKS_PANE, WEIGHT_PANE, UPDATES_PANE];
const HOLD_PANE = "modz-hold";
const BASES = [
  { pane: "agents", mod: "savvy-progress", icon: "sparkle", role: "run", section: "work" },
  { pane: "files", mod: "filetree", icon: "folder", role: "read", section: "work" },
  { pane: "plan", mod: "plan-steps", icon: "list", role: "plan", section: "work" },
  { pane: "transceiver", mod: "transceiver", icon: "bell", role: "read", section: "work", isBeta: true },
  { pane: "replay", mod: "replay-theater", icon: "rewind", role: "plan", section: "work" },
  { pane: "tests", mod: "test-badge", icon: "check", role: "ok", section: "safety" },
  { pane: "checkpoints", mod: "checkpoint", icon: "bookmark", role: "ok", section: "safety" },
  { pane: "usage", mod: "hud-pro", icon: "gauge", role: "warn", section: "meter" },
  { pane: "effort", mod: "effort-router", icon: "bolt", role: "run", section: "meter" },
  { pane: "handoff", mod: "handoff", icon: "flag", role: "plan", section: "meter" },
  { pane: "skins", mod: "skins", icon: "eye", role: "edit", section: "meter" },
  { pane: MODS_PANE, mod: "modz", icon: "cube", role: "edit", section: "meter" },
  { pane: LINKS_PANE, mod: LINKS_PANE, icon: "plug", role: "read", section: "meter" },
  { pane: WEIGHT_PANE, mod: WEIGHT_PANE, icon: "trash", role: "warn", section: "meter" },
  { pane: UPDATES_PANE, mod: UPDATES_PANE, icon: "layers", role: "ok", section: "meter" }
];
const entries = () => BASES.map(({ isBeta, ...base }) => ({ ...base, ...paneWords(base.pane), badge: isBeta ? badgeWord() : null, isGuest: false }));
const KNOWN_MODS = new Set(BASES.map((base) => base.mod));
function guestEntry(mod, card) {
  const icon = ICON_NAMES.includes(card.icon) ? card.icon : "cube";
  const section = SECTIONS.includes(card.section) ? card.section : "work";
  return { pane: card.pane, mod, title: card.title ?? mod, hint: card.hint ?? "", icon, role: "edit", section, badge: card.badge ?? null, isGuest: true };
}
const TONES = ["idle", "live", "ok", "warn", "bad"];
const DETAIL_MAX = 60;
const TITLE_MAX$1 = 32;
const BADGE_MAX = 12;
const PANE_ID = /^[\w-]{1,64}$/;
const textOf$3 = (value, max) => typeof value === "string" && value.trim() !== "" ? value.trim().slice(0, max) : undefined;
const LINES_MAX$1 = 4;
const VALUE_MAX = 16;
function lineOf(value) {
  if (typeof value !== "object" || value === null)
    return null;
  const line = value;
  const label = textOf$3(line.label, DETAIL_MAX);
  if (label === undefined)
    return null;
  const short = textOf$3(line.value, VALUE_MAX);
  return { label, ...typeof line.since === "number" && Number.isFinite(line.since) ? { since: line.since } : {}, ...short === undefined ? {} : { value: short } };
}
function liveOf(value) {
  if (typeof value !== "object" || value === null)
    return;
  const live = value;
  const lines = (Array.isArray(live.lines) ? live.lines : []).map(lineOf).filter((line) => line !== null).slice(0, LINES_MAX$1);
  if (lines.length === 0)
    return;
  return typeof live.more === "number" && Number.isInteger(live.more) && live.more > 0 ? { lines, more: live.more } : { lines };
}
function cardOf(value) {
  if (typeof value !== "object" || value === null)
    return null;
  const card = value;
  if (typeof card.pane !== "string" || !PANE_ID.test(card.pane) || typeof card.detail !== "string" || !TONES.includes(card.tone))
    return null;
  const own = {
    title: textOf$3(card.title, TITLE_MAX$1),
    hint: textOf$3(card.hint, DETAIL_MAX),
    icon: textOf$3(card.icon, TITLE_MAX$1),
    section: SECTIONS.includes(card.section) ? card.section : undefined,
    badge: textOf$3(card.badge, BADGE_MAX),
    live: liveOf(card.live),
    isBandOnly: card.isBandOnly === true ? true : undefined
  };
  const named = Object.fromEntries(Object.entries(own).filter(([, v]) => v !== undefined));
  return { pane: card.pane, detail: card.detail.slice(0, DETAIL_MAX), tone: card.tone, at: Number(card.at) || 0, ...named };
}
const ROLE_OF_TONE = { idle: null, live: "run", ok: "ok", warn: "warn", bad: "danger" };
const RANK$2 = { bad: 4, warn: 3, live: 2, ok: 1, idle: 0 };
function presenceOf(market) {
  const listed = new Map(market.mods.map((mod) => [mod.name, mod.isEnabled]));
  return (name) => {
    const isEnabled = listed.get(name);
    if (isEnabled === false)
      return "off";
    return isEnabled === true ? "listed" : "unlisted";
  };
}
const HOSTED_IN_USAGE = new Set(["session-budget", "cache-tax", "effort-router"]);
const withHosted = (presence, isHosting) => (mod) => isHosting && HOSTED_IN_USAGE.has(mod) ? "off" : presence(mod);
const isSilentBand = (card) => card.isBandOnly === true && card.detail === "";
const HOTKEYS = "1234567890";
function candidates(cards, presence) {
  const own = (entry) => {
    const card = cards[entry.mod];
    return card !== undefined && card.pane === entry.pane ? card : null;
  };
  const known = entries().filter((entry) => {
    const state = presence(entry.mod);
    return entry.pane === MODS_PANE || state === "listed" || state === "unlisted" && own(entry) !== null;
  });
  const taken = new Set(entries().map((entry) => entry.pane));
  const guests = Object.entries(cards).filter(([mod, card]) => mod !== "modz" && !KNOWN_MODS.has(mod) && presence(mod) !== "off" && !taken.has(card.pane) && !isSilentBand(card)).map(([mod, card]) => guestEntry(mod, card));
  return [...known, ...guests].map((entry) => ({ entry, card: own(entry) }));
}
const panedOf = (rows) => rows.map((row) => ({ ...row, pane: row.entry.pane }));
function rowsOf(cards, presence, layout = EMPTY_LAYOUT) {
  const shown = arrange(panedOf(candidates(cards, presence)), layout).filter((row) => !isHidden(layout, row.pane));
  return shown.map(({ entry, card }, i) => ({ entry, card, hotkey: HOTKEYS[i] ?? null }));
}
function withUnanswered(rows, pane, detail) {
  return rows.map((row) => row.entry.pane === pane ? { ...row, card: { pane: row.entry.pane, detail, tone: "bad", at: 0 } } : row);
}
function hiddenRowsOf(cards, presence, layout) {
  return candidates(cards, presence).filter((row) => isHidden(layout, row.entry.pane)).map(({ entry, card }) => ({ entry, card, hotkey: null }));
}
function focusOf(rows) {
  const ranked = rows.filter((row) => row.card !== null && row.card.detail !== "" && RANK$2[row.card.tone] >= RANK$2.live).sort((a, b) => RANK$2[b.card.tone] - RANK$2[a.card.tone] || b.card.at - a.card.at);
  const top = ranked[0];
  return top === undefined || top.card === null ? null : { row: top, tone: top.card.tone };
}

function isSame(a, b) {
  if (Object.is(a, b))
    return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null)
    return false;
  if (Array.isArray(a) !== Array.isArray(b))
    return false;
  const left = a;
  const right = b;
  const keys = Object.keys(left);
  if (keys.length !== Object.keys(right).length)
    return false;
  return keys.every((key) => Object.prototype.hasOwnProperty.call(right, key) && isSame(left[key], right[key]));
}

const HUB_PANE = "modz";
const paneOf = (value) => {
  if (typeof value !== "object" || value === null)
    return null;
  const pane = value.pane;
  return typeof pane === "string" && pane !== "" ? pane : null;
};

const USAGE_PANE = "usage";
const SECOND$2 = 1000;
const MINUTE_S = 60;
const HOUR_M = 60;
const STEP_S = 10;
function elapsedText(ms) {
  const ago = hubWords().ago;
  const seconds = Math.max(0, Math.floor(ms / SECOND$2));
  if (seconds < STEP_S)
    return ago.now;
  if (seconds < MINUTE_S)
    return ago.seconds(Math.floor(seconds / STEP_S) * STEP_S);
  const minutes = Math.floor(seconds / MINUTE_S);
  return minutes < HOUR_M ? ago.minutes(minutes) : ago.hours(Math.floor(minutes / HOUR_M), minutes % HOUR_M);
}
const RANK_BAD = 4;
const RANK_WARN = 3;
const RANK_LIVE = 2;
const RANK_USAGE = 1;
function rankOf(card) {
  if (card.tone === "bad")
    return RANK_BAD;
  if (card.tone === "warn")
    return RANK_WARN;
  if (card.live !== undefined)
    return RANK_LIVE;
  return card.pane === USAGE_PANE ? RANK_USAGE : 0;
}
const isNow = (card) => card !== null && (card.detail !== "" || card.live !== undefined) && rankOf(card) > 0;
function linesOf$1(card, now) {
  return (card.live?.lines ?? []).map((line) => {
    const ran = line.since === undefined ? undefined : elapsedText(now - line.since);
    return { label: line.label, value: [ran, line.value].filter(Boolean).join(" · ") };
  });
}
function nowOf(rows, now) {
  return rows.flatMap((row) => isNow(row.card) ? [{ row, lines: linesOf$1(row.card, now), more: row.card.live?.more ?? 0, rank: rankOf(row.card) }] : []).sort((a, b) => b.rank - a.rank).map(({ row, lines, more }) => ({ row, lines, more }));
}
const hasRunningClock = (cards) => Object.values(cards).some((card) => card.live?.lines.some((line) => line.since !== undefined) === true);

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

const short = (tokens, point, unit) => tokens < 1000 ? String(tokens) : `${(tokens / 1000).toFixed(1).replace(".", point)}${unit}`;
const LINKS = {
  en: {
    lead: "Claude's doors to outside tools (MCP servers) in this chat.",
    failed: "Broken",
    failedNote: "Could not connect. Fix its address or remove it.",
    pending: "Connecting",
    waiting: "Waiting for sign-in",
    waitingNote: "Unusable until you sign in: Claude's connector settings, or /mcp.",
    connected: "Working",
    none: "No connections in this chat.",
    unread: "Not looked at yet.",
    check: "Look again",
    failedCount: (n) => `${n} broken`,
    waitingCount: (n) => `${n} waiting for sign-in`,
    connectedCount: (n) => `${n} working`
  },
  tr: {
    lead: "Claude'un bu sohbette dış araçlara açılan kapıları (MCP sunucuları).",
    failed: "Bozuk",
    failedNote: "Bağlanamadı. Adresini düzelt ya da kaldır.",
    pending: "Bağlanıyor",
    waiting: "Giriş bekliyor",
    waitingNote: "Giriş yapmadan kullanılamaz: Claude'un bağlantı ayarları ya da /mcp.",
    connected: "Çalışıyor",
    none: "Bu sohbette hiç bağlantı yok.",
    unread: "Henüz bakılmadı.",
    check: "Yeniden bak",
    failedCount: (n) => `${n} bozuk`,
    waitingCount: (n) => `${n} giriş bekliyor`,
    connectedCount: (n) => `${n} çalışıyor`
  }
};
const linkWords = () => pick$2(LINKS);
const WEIGHT$1 = {
  en: {
    lead: (days) => `Plugins and skills you have not used in ${days} days. Claude reads each one's listing in every chat.`,
    total: (tokens) => `Without them every chat starts about ${short(tokens, ".", "k")} tokens lighter.`,
    kinds: { plugin: "plugin", skill: "skill" },
    skills: (n) => `${n} ${n === 1 ? "skill" : "skills"}`,
    tokens: (tokens) => `~${short(tokens, ".", "k")} tokens`,
    never: "never used",
    idle: (days) => `not used for ${days} days`,
    how: "Copy a line and paste it into the message box to switch that plugin off. Your own skills are folders under ~/.claude/skills.",
    copy: "Copy",
    more: (n) => `+${n} more`,
    none: "No dead weight: everything installed gets used.",
    noneShort: "everything gets used",
    unread: "Not measured yet.",
    count: (n, tokens) => `${n} unused · ~${short(tokens, ".", "k")} tokens`
  },
  tr: {
    lead: (days) => `${days} gündür kullanmadığın eklentiler ve beceriler. Claude her sohbette hepsinin tanıtımını okur.`,
    total: (tokens) => `Bunlar olmasa her sohbet yaklaşık ${short(tokens, ",", " bin")} token hafif başlar.`,
    kinds: { plugin: "eklenti", skill: "beceri" },
    skills: (n) => `${n} beceri`,
    tokens: (tokens) => `~${short(tokens, ",", " bin")} token`,
    never: "hiç kullanılmadı",
    idle: (days) => `${days} gündür kullanılmadı`,
    how: "Bir satırı kopyalayıp mesaj kutusuna yapıştır; o eklenti kapanır. Kendi becerilerin ~/.claude/skills altındaki klasörlerdir.",
    copy: "Kopyala",
    more: (n) => `+${n} tane daha`,
    none: "Ölü ağırlık yok: kurulu her şey kullanılıyor.",
    noneShort: "her şey kullanılıyor",
    unread: "Henüz ölçülmedi.",
    count: (n, tokens) => `${n} kullanılmıyor · ~${short(tokens, ",", " bin")} token`
  }
};
const weightWords = () => pick$2(WEIGHT$1);
const UPDATES = {
  en: {
    lead: "New MODZ versions come from GitHub. Nothing new runs on your computer until you take it.",
    local: "This copy loads from a folder on your computer, so it is always the latest.",
    current: "You have the latest version.",
    fresh: "A new version is out.",
    autoOn: "Automatic updates are on: new versions download in the background and start with your next session.",
    autoOff: "Automatic updates are off: you take each new version yourself.",
    turnOn: "Turn on automatic updates",
    turnOff: "Turn off automatic updates",
    byHand: "To update now, paste these into a terminal, then start a new session:",
    copy: "Copy",
    check: "Look again",
    failed: "Could not change the setting.",
    cardNew: "new version out",
    cardAuto: "automatic · up to date",
    cardCurrent: "up to date"
  },
  tr: {
    lead: "Yeni MODZ sürümleri GitHub'dan gelir. Sen almadan bilgisayarında yeni hiçbir şey çalışmaz.",
    local: "Bu kopya bilgisayarındaki bir klasörden yükleniyor; hep en son sürüm.",
    current: "En son sürüm sende.",
    fresh: "Yeni bir sürüm çıktı.",
    autoOn: "Otomatik güncelleme açık: yeni sürümler arka planda iner, bir sonraki oturumda devreye girer.",
    autoOff: "Otomatik güncelleme kapalı: her yeni sürümü sen alırsın.",
    turnOn: "Otomatik güncellemeyi aç",
    turnOff: "Otomatik güncellemeyi kapat",
    byHand: "Şimdi güncellemek için bunları bir terminale yapıştır, sonra yeni bir oturum başlat:",
    copy: "Kopyala",
    check: "Yeniden bak",
    failed: "Ayar değiştirilemedi.",
    cardNew: "yeni sürüm var",
    cardAuto: "otomatik · güncel",
    cardCurrent: "güncel"
  }
};
const updateWords = () => pick$2(UPDATES);

const WAIT_FRESH_MS = 24 * 60 * 60 * 1000;
const ERROR_MAX = 80;
const wireName = (name) => name.replace(/[^\w-]/g, "_");
function linkName(name) {
  const match = /^plugin([:_])(.+?)\1(.+)$/.exec(name);
  if (match === null)
    return name;
  const [, , plugin, server] = match;
  return server === plugin ? String(server) : `${server} (${plugin})`;
}
const byName = (a, b) => linkName(a).localeCompare(linkName(b));
function waitingOf(cache, now) {
  if (typeof cache !== "object" || cache === null)
    return [];
  return Object.entries(cache).filter(([, entry]) => now - Number(entry?.timestamp) <= WAIT_FRESH_MS).map(([name]) => name);
}
function searchOf(search) {
  const result = search?.result;
  const failed = (Array.isArray(result?.failed_mcp_servers) ? result.failed_mcp_servers : []).filter((one) => typeof one?.name === "string").map((one) => ({ name: one.name, error: typeof one.error === "string" ? one.error.slice(0, ERROR_MAX) : "" }));
  const pending = (Array.isArray(result?.pending_mcp_servers) ? result.pending_mcp_servers : []).filter((name) => typeof name === "string");
  return { failed, pending };
}
function linksOf$1(facts) {
  const { failed, pending } = searchOf(facts.search);
  const told = new Set([...failed.map((one) => one.name), ...pending].map(wireName));
  const connected = [...new Set(facts.servers)].filter((name) => !told.has(wireName(name))).sort(byName);
  for (const name of connected)
    told.add(wireName(name));
  const waiting = waitingOf(facts.authCache, facts.now).filter((name) => !told.has(wireName(name))).sort(byName);
  return { connected, waiting, failed: failed.sort((a, b) => byName(a.name, b.name)), pending: pending.sort(byName) };
}
const hasLinks = (links) => links.connected.length + links.waiting.length + links.failed.length + links.pending.length > 0;
function linksCard(links, at) {
  const say = linkWords();
  const parts = [links.failed.length > 0 ? say.failedCount(links.failed.length) : "", links.waiting.length > 0 ? say.waitingCount(links.waiting.length) : ""].filter((part) => part !== "");
  const detail = parts.length > 0 ? parts.join(" · ") : say.connectedCount(links.connected.length);
  return { pane: LINKS_PANE, detail, tone: links.failed.length > 0 ? "warn" : "idle", at };
}

const diskOf = ($) => ({
  root: $.plugin.root,
  env: { home: () => $.env.get("HOME"), userProfile: () => $.env.get("USERPROFILE"), configDir: () => $.env.get("CLAUDE_CONFIG_DIR") },
  cwd: () => $.session.cwd(),
  settings: () => $.settings.read(),
  realPath: async (path) => (await $.fs.stat(path, { resolve: true })).realPath,
  read: (path) => $.fs.read(path),
  exists: (path) => $.fs.exists(path),
  write: (path, text) => $.fs.write(path, text),
  log: (text) => $.ui.log(text, { to: "debug" })
});

const LOCAL_SOURCES = new Set(["directory", "file"]);
function isRecord$2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parsed$1(text) {
  if (text === undefined || text.trim() === "")
    return {};
  try {
    const value = JSON.parse(text);
    return isRecord$2(value) ? value : undefined;
  } catch {
    return;
  }
}
function isRemote(source) {
  return isRecord$2(source) && typeof source.source === "string" && !LOCAL_SOURCES.has(source.source);
}
function entryOf(plan, declared) {
  if (isRecord$2(declared)) {
    if ("autoUpdate" in declared || !isRemote(declared.source))
      return;
    return { ...declared, autoUpdate: true };
  }
  const known = parsed$1(plan.knownText)?.[plan.market];
  const source = isRecord$2(known) ? known.source : undefined;
  return isRemote(source) ? { source, autoUpdate: true } : undefined;
}
function autoUpdateSettings(plan) {
  const settings = parsed$1(plan.settingsText);
  if (settings === undefined || plan.market === "")
    return;
  const markets = isRecord$2(settings.extraKnownMarketplaces) ? settings.extraKnownMarketplaces : {};
  const entry = entryOf(plan, markets[plan.market]);
  if (entry === undefined)
    return;
  return `${JSON.stringify({ ...settings, extraKnownMarketplaces: { ...markets, [plan.market]: entry } }, null, 2)}
`;
}
function sourceOf(plan, declared) {
  if (isRecord$2(declared) && isRemote(declared.source))
    return declared.source;
  const known = parsed$1(plan.knownText)?.[plan.market];
  const source = isRecord$2(known) ? known.source : undefined;
  return isRemote(source) ? source : undefined;
}
function isAutoOn(plan) {
  const markets = parsed$1(plan.settingsText)?.extraKnownMarketplaces;
  const declared = isRecord$2(markets) ? markets[plan.market] : undefined;
  if (isRecord$2(declared) && typeof declared.autoUpdate === "boolean")
    return declared.autoUpdate;
  const known = parsed$1(plan.knownText)?.[plan.market];
  return isRecord$2(known) && known.autoUpdate === true;
}
function settingsWithAuto(plan, isOn) {
  const settings = parsed$1(plan.settingsText);
  if (settings === undefined || plan.market === "")
    return;
  const markets = isRecord$2(settings.extraKnownMarketplaces) ? settings.extraKnownMarketplaces : {};
  const declared = markets[plan.market];
  const source = sourceOf(plan, declared);
  if (source === undefined)
    return;
  const entry = { ...isRecord$2(declared) ? declared : {}, source, autoUpdate: isOn };
  return `${JSON.stringify({ ...settings, extraKnownMarketplaces: { ...markets, [plan.market]: entry } }, null, 2)}
`;
}
const CACHED = /^(.*)\/cache\/([^/]+)\/[^/]+\/[^/]+\/?$/;
function installOf(root) {
  const match = CACHED.exec(root.replaceAll("\\", "/"));
  if (match?.[1] === undefined || match[2] === undefined)
    return;
  return { pluginsDir: match[1], market: match[2] };
}

const isRecord$1 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
function parsed(text) {
  if (text === undefined)
    return;
  try {
    const value = JSON.parse(text);
    return isRecord$1(value) ? value : undefined;
  } catch {
    return;
  }
}
function remoteOf(knownText, market) {
  const entry = parsed(knownText)?.[market];
  const source = isRecord$1(entry) ? entry.source : undefined;
  if (!isRecord$1(source))
    return;
  if (source.source === "github" && typeof source.repo === "string")
    return `https://github.com/${source.repo}.git`;
  if ((source.source === "git" || source.source === "url") && typeof source.url === "string")
    return source.url;
  return;
}
function installedCommit(installedText, key) {
  const plugins = parsed(installedText)?.plugins;
  const entries = isRecord$1(plugins) ? plugins[key] : undefined;
  const first = Array.isArray(entries) ? entries[0] : undefined;
  const sha = isRecord$1(first) ? first.gitCommitSha : undefined;
  return typeof sha === "string" ? sha : undefined;
}
function headOf(lsRemote) {
  return /^([0-9a-f]{40})\s+HEAD$/m.exec(lsRemote)?.[1];
}
const isNewer = (installed, head) => installed !== undefined && head !== undefined && installed !== head;
function installedFrom(installedText, market) {
  const plugins = parsed(installedText)?.plugins;
  const suffix = `@${market}`;
  return isRecord$1(plugins) ? Object.keys(plugins).filter((key) => key.endsWith(suffix)).map((key) => key.slice(0, -suffix.length)).sort() : [];
}
const updateCommands = (market, mods) => [`claude plugin marketplace update ${market}`, ...mods.map((mod) => `claude plugin update ${mod}@${market}`)].join(" && ");
function updatesCard(updates, at) {
  const say = updateWords();
  if (updates.hasNew)
    return { pane: UPDATES_PANE, detail: say.cardNew, tone: "warn", at };
  return { pane: UPDATES_PANE, detail: updates.isAuto ? say.cardAuto : say.cardCurrent, tone: "idle", at };
}

const GROUPS = ["look", "safety", "meter", "flow", "other"];
const BOTH = ["desktop", "terminal"];
const META$1 = {
  skins: { group: "look", summary: { en: "Themes the transcript; /skin switches it", tr: "Transkripti temalarla çizer; /skin ile değişir" } },
  filetree: { group: "look", summary: { en: "Files Claude touches and their git status", tr: "Claude'un dokunduğu dosyalar ve git durumu" } },
  "replay-theater": { group: "look", upstream: "anthropics/claude-code-playground", summary: { en: "Replays the last turn's edits step by step", tr: "Son turun düzenlemelerini adım adım oynatır" } },
  wrapped: { group: "look", summary: { en: "Your year with Claude Code: a card and a video", tr: "Claude Code ile yılın: kart ve video" } },
  "terminal-browser": { group: "look", surfaces: ["terminal"], summary: { en: "A browser that runs in the terminal", tr: "Terminalde çalışan tarayıcı" } },
  modz: { group: "look", summary: { en: "This pane: the hub and a catalog of every mod", tr: "Bu panel: ana sayfa ve tüm modların kataloğu" } },
  "blast-radius": { group: "safety", upstream: "anthropics/claude-code-playground", summary: { en: "Holds risky commands, shows what they'd delete", tr: "Riskli komutları tutar, neyi sileceğini gösterir" } },
  "secret-guard": { group: "safety", summary: { en: "Catches keys before they reach disk or git", tr: "Anahtarları diske ya da git'e düşmeden yakalar" } },
  checkpoint: { group: "safety", summary: { en: "A quiet git snapshot before every turn", tr: "Her turdan önce sessiz git anlık görüntüsü" } },
  "session-budget": { group: "safety", summary: { en: "Session budget: warns at 80%, asks at 100%", tr: "Oturum bütçesi: %80'de uyarır, %100'de sorar" } },
  "cache-tax": { group: "safety", upstream: "karanb192/cache-tax", summary: { en: "Keeps the cache warm on breaks, shows the cost", tr: "Molada önbelleği sıcak tutar, bedeli gösterir" } },
  "hud-pro": { group: "meter", summary: { en: "One line: 5h, 7d, context and cost", tr: "Tek satır: 5 saat, 7 gün, bağlam ve maliyet" } },
  "effort-router": { group: "meter", summary: { en: "Each turn's effort; can lower it for light asks", tr: "Her turun eforu; hafif işte düşürebilir" } },
  handoff: { group: "flow", summary: { en: "A handoff note before the context fills", tr: "Bağlam dolmadan bir devir notu" } },
  "test-badge": { group: "meter", summary: { en: "Runs tests and lint when source changes", tr: "Kaynak değişince test ve lint çalıştırır" } },
  "pr-card": { group: "meter", summary: { en: "A PR card with CI, review and merge state", tr: "CI, inceleme ve birleştirme durumlu PR kartı" } },
  "savvy-progress": { group: "meter", summary: { en: "Task band and Agents pane: progress, cost", tr: "Görev bandı ve Ajanlar paneli: ilerleme, maliyet" } },
  "savvy-flow": { group: "flow", summary: { en: "A planning model and five tiers of worker agents", tr: "Planlayan model ve beş katmanlı işçi ajan akışı" } },
  projects: { group: "flow", summary: { en: "Every project: percent, plans, tokens, agents", tr: "Tüm projeler: yüzde, plan, token, ajan" } },
  "plan-steps": { group: "flow", summary: { en: "The plan's steps and where the work is", tr: "Planın adımları ve işin nerede olduğu" } },
  "reflect-mod": { group: "flow", summary: { en: "Turns your corrections into CLAUDE.md rules", tr: "Düzeltmelerini CLAUDE.md kuralına çevirir" } },
  "done-ping": { group: "flow", summary: { en: "A ping when a long turn ends or Claude waits", tr: "Uzun tur bitince ya da Claude beklerken bildirim" } }
};
const GITHUB = /github\.com\/([\w.-]+)(?:\/([\w.-]+))?/;
function githubName(url) {
  const match = typeof url === "string" ? GITHUB.exec(url) : null;
  if (match === null)
    return null;
  return match[2] === undefined ? match[1] ?? null : `${match[1]}/${match[2].replace(/\.git$/, "")}`;
}

const SKILLS_DIR = ".claude/skills";
function linkedDir(spec) {
  const dirs = spec.roots.filter((root) => Boolean(root)).map((root) => `${root}/${SKILLS_DIR}`);
  return async (name) => {
    for (const dir of dirs)
      if (await spec.exists(`${dir}/${name}`).catch(() => false))
        return `${dir}/${name}`;
    return;
  };
}
function marketRoot(realPluginRoot) {
  return realPluginRoot.replaceAll("\\", "/").replace(/\/mods\/[^/]+\/?$/, "");
}
function installedMarketRoot(install, knownText) {
  let known;
  try {
    known = JSON.parse(knownText ?? "");
  } catch {
    known = undefined;
  }
  const entry = isRecord(known) ? known[install.market] : undefined;
  const location = isRecord(entry) ? text$1(entry.installLocation) : undefined;
  return (location ?? `${install.pluginsDir}/marketplaces/${install.market}`).replaceAll("\\", "/").replace(/\/+$/, "");
}
const SAFE_NAME = /^[\w.-]+$/;
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text$1(value) {
  return typeof value === "string" && value !== "" ? value : undefined;
}
async function readJson(read, path) {
  try {
    const value = JSON.parse(String(await read(path)));
    return isRecord(value) ? value : undefined;
  } catch {
    return;
  }
}
function upstreamOf(name, manifest) {
  return githubName(manifest?.repository) ?? githubName(manifest?.homepage) ?? META$1[name]?.upstream ?? githubName(manifest?.author?.url);
}
function infoOf(facts) {
  const { name, entry, manifest, problem } = facts;
  const meta = META$1[name];
  const summary = meta?.summary === undefined ? undefined : pick$2(meta.summary);
  return {
    name,
    version: text$1(manifest?.version) ?? text$1(entry.version) ?? null,
    description: problem ?? summary ?? text$1(manifest?.description) ?? text$1(entry.description) ?? facts.note ?? (manifest ? "" : catalogWords().unreadable),
    group: meta?.group ?? "other",
    surfaces: meta?.surfaces ?? BOTH,
    upstream: upstreamOf(name, manifest),
    isHealthy: (manifest !== undefined || facts.note !== undefined) && problem === undefined,
    isEnabled: facts.isEnabled,
    options: isRecord(manifest?.userConfig) ? Object.keys(manifest.userConfig) : []
  };
}
async function enabledOf(spec) {
  if (spec.flag === false)
    return false;
  if (spec.flag === true)
    return true;
  const isLinked = SAFE_NAME.test(spec.name) && await spec.hasLink(spec.name).catch(() => false);
  return isLinked ? true : null;
}
function remoteNote(source) {
  const repo = isRecord(source) ? text$1(source.repo) ?? githubName(source.url) ?? undefined : undefined;
  const remote = catalogWords().remote;
  return repo === undefined ? remote : `${remote} (${repo})`;
}
async function remoteInfo(spec) {
  const { name, entry, isEnabled, options } = spec;
  const dir = SAFE_NAME.test(name) ? await options.linkedDir?.(name).catch(() => {
    return;
  }) : undefined;
  const manifest = dir === undefined ? undefined : await readJson(options.read, `${dir}/.claude-plugin/plugin.json`);
  return infoOf({ name, entry, manifest, isEnabled, note: remoteNote(entry.source) });
}
async function entryInfo(spec) {
  const { index, options, enabled } = spec;
  const hasLink = options.hasLink ?? (async () => false);
  const entry = isRecord(spec.entry) ? spec.entry : {};
  const name = text$1(entry.name);
  const invalid = catalogWords().invalid;
  if (name === undefined)
    return infoOf({ name: catalogWords().entry(index + 1), entry, manifest: undefined, isEnabled: null, problem: invalid });
  const isEnabled = await enabledOf({ name, flag: enabled[name], hasLink });
  if (entry.source === undefined || entry.source === null)
    return infoOf({ name, entry, manifest: undefined, isEnabled, problem: invalid });
  if (typeof entry.source !== "string")
    return remoteInfo({ name, entry, isEnabled, options });
  const dir = `${options.root}/${entry.source.replace(/^\.\//, "")}`;
  return infoOf({ name, entry, manifest: await readJson(options.read, `${dir}/.claude-plugin/plugin.json`), isEnabled });
}
async function loadCatalog(options) {
  const market = await readJson(options.read, `${options.root}/.claude-plugin/marketplace.json`);
  const name = text$1(market?.name) ?? "modz";
  const plugins = market?.plugins;
  const entries = Array.isArray(plugins) ? plugins : [];
  const enabled = Object.fromEntries(Object.entries(options.enabledPlugins ?? {}).filter(([key]) => key.endsWith(`@${name}`)).map(([key, value]) => [key.slice(0, -name.length - 1), value]));
  const mods = await Promise.all(entries.map((entry, index) => entryInfo({ entry, index, options, enabled })));
  return { name, mods };
}
function headline$1(mods) {
  const words = catalogWords();
  const known = mods.filter((mod) => mod.isEnabled !== null);
  const total = words.mods(mods.length);
  if (known.length === 0)
    return total;
  const on = known.filter((mod) => mod.isEnabled === true).length;
  const state = on === known.length ? words.allOn : words.on(on);
  const unknown = mods.length - known.length;
  return unknown === 0 ? `${total} · ${state}` : `${total} · ${state} · ${words.unknown(unknown)}`;
}
function healthOf(mods) {
  const words = catalogWords();
  const bad = mods.filter((mod) => !mod.isHealthy).length;
  return bad === 0 ? { text: words.allHealthy, isBad: false } : { text: words.broken(bad), isBad: true };
}

async function enabledPlugins(disk) {
  try {
    const value = (await disk.settings()).enabledPlugins;
    return typeof value === "object" && value !== null ? value : {};
  } catch {
    disk.log("modz: settings could not be read; enabled state unknown");
    return {};
  }
}
async function homeOf(disk) {
  const home = await disk.env.home().catch(() => {
    return;
  }) || await disk.env.userProfile().catch(() => {
    return;
  });
  return home ? home.replaceAll("\\", "/").replace(/\/+$/, "") : undefined;
}
async function skillLinks(disk) {
  const home = await homeOf(disk);
  const cwd = await disk.cwd().catch(() => {
    return;
  });
  return linkedDir({ roots: [home, cwd], exists: (path) => disk.exists(path) });
}
async function linksOf(disk) {
  const dirOf = await skillLinks(disk);
  return { hasLink: async (name) => await dirOf(name) !== undefined, linkedDir: dirOf };
}
async function textOf$2(disk, path) {
  return await disk.exists(path) ? String(await disk.read(path)) : undefined;
}
async function marketOf(disk) {
  try {
    const real = await disk.realPath(disk.root).catch(() => {
      return;
    }) ?? disk.root;
    const install = installOf(real);
    const root = install === undefined ? marketRoot(real) : installedMarketRoot(install, await textOf$2(disk, `${install.pluginsDir}/known_marketplaces.json`).catch(() => {
      return;
    }));
    return await loadCatalog({ read: (path) => disk.read(path), root, enabledPlugins: await enabledPlugins(disk), ...await linksOf(disk) });
  } catch (cause) {
    disk.log(`modz: the catalog could not be read: ${String(cause)}`);
    return { name: "", mods: [] };
  }
}
const MARKET_TTL_MS = 15000;
let marketKept = null;
function marketSoon(disk) {
  const now = Date.now();
  if (marketKept === null || now - marketKept.at > MARKET_TTL_MS)
    marketKept = { at: now, market: marketOf(disk) };
  return marketKept.market;
}
function keepMarket(market) {
  marketKept = { at: Date.now(), market: Promise.resolve(market) };
}
async function keepUpdated(disk) {
  const install = installOf(disk.root);
  if (install === undefined)
    return;
  const home = await homeOf(disk);
  const configDir = await disk.env.configDir() ?? (home === undefined ? undefined : `${home}/.claude`);
  if (configDir === undefined)
    return;
  const settingsPath = `${configDir}/settings.json`;
  const next = autoUpdateSettings({
    market: install.market,
    settingsText: await textOf$2(disk, settingsPath),
    knownText: await textOf$2(disk, `${install.pluginsDir}/known_marketplaces.json`)
  });
  if (next === undefined)
    return;
  await disk.write(settingsPath, next);
  disk.log(`modz: auto-update turned on for the ${install.market} marketplace`);
}
async function settingsPathOf(disk) {
  const home = await homeOf(disk);
  const configDir = await disk.env.configDir() ?? (home === undefined ? undefined : `${home}/.claude`);
  return configDir === undefined ? undefined : `${configDir}/settings.json`;
}
async function updatesOf(disk, ask) {
  const install = installOf(disk.root);
  if (install === undefined)
    return { isInstalled: false, isAuto: false, hasNew: false, mods: [], market: "" };
  const settingsPath = await settingsPathOf(disk);
  const knownText = await textOf$2(disk, `${install.pluginsDir}/known_marketplaces.json`);
  const isAuto = isAutoOn({ market: install.market, settingsText: settingsPath === undefined ? undefined : await textOf$2(disk, settingsPath), knownText });
  const url = remoteOf(knownText, install.market);
  const installedText = await textOf$2(disk, `${install.pluginsDir}/installed_plugins.json`);
  const installed = installedCommit(installedText, `modz@${install.market}`);
  const known = { isInstalled: true, isAuto, mods: installedFrom(installedText, install.market), market: install.market };
  if (ask.run === undefined || url === undefined || installed === undefined)
    return { ...known, hasNew: ask.hadNew };
  return { ...known, hasNew: isNewer(installed, headOf((await ask.run(["git", "ls-remote", url, "HEAD"])).stdout)) };
}
async function setAutoUpdate(disk, isOn) {
  const install = installOf(disk.root);
  const settingsPath = await settingsPathOf(disk);
  if (install === undefined || settingsPath === undefined)
    return false;
  const next = settingsWithAuto({
    market: install.market,
    settingsText: await textOf$2(disk, settingsPath),
    knownText: await textOf$2(disk, `${install.pluginsDir}/known_marketplaces.json`)
  }, isOn);
  if (next === undefined)
    return false;
  await disk.write(settingsPath, next);
  return true;
}

function stableDrawings$2() {
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

const TITLE$2 = "modz";
const STAGE$1 = { plugin: "modz", key: "stage" };
const hubDrawings = stableDrawings$2();
const catalogDrawings = stableDrawings$2();
const hubKept = { isHeld: false };
const closeQuietly = ($, id) => $.ui.close({ id }).catch((cause) => $.ui.log(`modz: ${id} could not be closed: ${String(cause)}`, { to: "debug" }));
async function show($, pane, isFocused = true) {
  const title = pane === HUB_PANE ? TITLE$2 : paneWords(pane).title;
  hubKept.isHeld = true;
  if (pane === HUB_PANE)
    hubDrawings.reset();
  if (pane === MODS_PANE)
    catalogDrawings.reset();
  await $.ui.open(isFocused ? { id: pane, title, focus: true } : { id: pane, title });
  await $.state.set(STAGE$1, { pane, at: Date.now() });
  for (const other of [HUB_PANE, MODS_PANE])
    if (other !== pane)
      await closeQuietly($, other);
  const up = new Set((await $.ui.panes().catch(() => [])).map((each) => each.id));
  for (const side of SIDE_PANES)
    if (side !== pane && up.has(side))
      await closeQuietly($, side);
}
const openHub = ($) => show($, HUB_PANE);
async function copy($, text, press) {
  const surface = press?.surface;
  const words = catalogWords();
  try {
    $.ui.toast((await $.ui.copy(surface === undefined ? { text } : { text, surface })).isCopied ? words.copied : words.notCopied);
  } catch (cause) {
    $.ui.log(`modz: the line could not be copied: ${String(cause)}`, { to: "debug" });
  }
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
function withHome(ui, tree, onHome) {
  if (onHome === null)
    return tree;
  const { Box } = ui;
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, HomeButton(ui, onHome), tree);
}

const IDLE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const usageKey = (skill) => skill.name.includes(":") || skill.pluginName === undefined ? skill.name : `${skill.pluginName}:${skill.name}`;
function lastUsedOf(usage, skill) {
  const use = usage[usageKey(skill)];
  return Number(use?.usageCount) > 0 && typeof use?.lastUsedAt === "number" ? use.lastUsedAt : null;
}
function disableOf(plugin, enabled) {
  const id = Object.keys(enabled).find((key) => key.startsWith(`${plugin}@`) && enabled[key] === true);
  return id === undefined ? null : `/plugin disable ${id}`;
}
function weightsOf(facts) {
  if (typeof facts.usage !== "object" || facts.usage === null || facts.skills.length === 0)
    return null;
  const usage = facts.usage;
  const groups = new Map;
  for (const skill of facts.skills) {
    if (skill.source === "built-in")
      continue;
    const isPlugin = skill.pluginName !== undefined;
    const name = skill.pluginName ?? skill.name;
    const key = `${isPlugin ? "plugin" : "skill"}:${name}`;
    const kept = groups.get(key) ?? { name, kind: isPlugin ? "plugin" : "skill", skills: 0, tokens: 0, lastUsedAt: null, disable: isPlugin ? disableOf(name, facts.enabled) : null };
    const lastUsedAt = lastUsedOf(usage, skill);
    groups.set(key, { ...kept, skills: kept.skills + 1, tokens: kept.tokens + skill.tokens, lastUsedAt: lastUsedAt === null ? kept.lastUsedAt : Math.max(lastUsedAt, kept.lastUsedAt ?? 0) });
  }
  const items = [...groups.values()].filter((one) => one.lastUsedAt === null || facts.now - one.lastUsedAt > IDLE_DAYS * DAY_MS).sort((a, b) => b.tokens - a.tokens || a.name.localeCompare(b.name));
  return { items, tokens: items.reduce((sum, one) => sum + one.tokens, 0) };
}
const idleDays = (lastUsedAt, now) => Math.floor((now - lastUsedAt) / DAY_MS);
function weightCard(weights, at) {
  const say = weightWords();
  const detail = weights.items.length === 0 ? say.noneShort : say.count(weights.items.length, weights.tokens);
  return { pane: WEIGHT_PANE, detail, tone: "idle", at };
}

function group(ui, look, lines) {
  const { Box, Text } = ui;
  if (lines.length === 0)
    return null;
  return h(Box, {
    key: look.key,
    flexDirection: "column"
  }, h(Text, {
    bold: true,
    color: look.color
  }, `${look.title} · ${lines.length}`), look.note === undefined ? null : h(Text, {
    dimColor: true
  }, look.note), lines.map((line) => h(Text, {
    key: `${look.key}-${line}`,
    wrap: "truncate"
  }, line)));
}
function linksBody(ui, links) {
  const { Text } = ui;
  const say = linkWords();
  const failed = links.failed.map((one) => one.error === "" ? linkName(one.name) : `${linkName(one.name)}: ${one.error}`);
  const groups = [
    group(ui, { key: "failed", title: say.failed, color: "error", note: say.failedNote }, failed),
    group(ui, { key: "pending", title: say.pending }, links.pending.map(linkName)),
    group(ui, { key: "waiting", title: say.waiting, color: "warning", note: say.waitingNote }, links.waiting.map(linkName)),
    group(ui, { key: "connected", title: say.connected, color: "success" }, links.connected.map(linkName))
  ].filter((one) => one !== null);
  return groups.length === 0 ? [h(Text, {
    key: "none"
  }, say.none)] : groups;
}
function linksTree(ui, view) {
  const { Box, Button, Text } = ui;
  const say = linkWords();
  return withHome(ui, h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, h(Text, {
    dimColor: true
  }, say.lead), view.links === null ? [h(Text, {
    key: "unread"
  }, say.unread)] : linksBody(ui, view.links), h(Box, {
    flexDirection: "row"
  }, h(Button, {
    key: "links-check",
    label: say.check,
    plain: true,
    onPress: view.onCheck
  }))), view.onHome);
}
const MAX_ITEMS = 30;
function weightRow(ui, view, item) {
  const { Box, Button, Text } = ui;
  const say = weightWords();
  const key = `weight-${item.kind}-${item.name}`;
  const kind = item.kind === "plugin" ? `${say.kinds.plugin} · ${say.skills(item.skills)}` : say.kinds.skill;
  const idle = item.lastUsedAt === null ? say.never : say.idle(idleDays(item.lastUsedAt, view.now));
  const { disable } = item;
  return h(Box, {
    key,
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    bold: true
  }, item.name), h(Text, {
    dimColor: true
  }, kind), h(Box, {
    flexGrow: 1
  }), h(Text, null, say.tokens(item.tokens))), h(Text, {
    dimColor: true
  }, idle), disable === null ? null : h(Box, {
    flexDirection: "row",
    columnGap: 1,
    alignItems: "center"
  }, h(Button, {
    key: `${key}-copy`,
    label: say.copy,
    variant: "secondary",
    onPress: (press) => view.onCopy(disable, press)
  }), h(Text, null, disable)));
}
function weightBody(ui, view) {
  const { Text } = ui;
  const say = weightWords();
  const { weights } = view;
  if (weights === null)
    return [h(Text, {
      key: "unread"
    }, say.unread)];
  if (weights.items.length === 0)
    return [h(Text, {
      key: "none"
    }, say.none)];
  const more = weights.items.length - MAX_ITEMS;
  return [
    h(Text, {
      key: "total"
    }, say.total(weights.tokens)),
    ...weights.items.slice(0, MAX_ITEMS).map((item) => weightRow(ui, view, item)),
    ...more > 0 ? [h(Text, {
      key: "more",
      dimColor: true
    }, say.more(more))] : [],
    h(Text, {
      key: "how",
      dimColor: true
    }, say.how)
  ];
}
function weightTree(ui, view) {
  const { Box, Text } = ui;
  return withHome(ui, h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, h(Text, {
    dimColor: true
  }, weightWords().lead(IDLE_DAYS)), weightBody(ui, view)), view.onHome);
}
function updatesBody(ui, view, updates) {
  const { Box, Button, Text } = ui;
  const say = updateWords();
  if (!updates.isInstalled)
    return [h(Text, {
      key: "local"
    }, say.local)];
  const commands = updateCommands(updates.market, updates.mods);
  return [
    updates.hasNew ? h(Text, {
      key: "state",
      bold: true,
      color: "warning"
    }, say.fresh) : h(Text, {
      key: "state",
      color: "success"
    }, say.current),
    h(Box, {
      key: "auto",
      flexDirection: "column",
      rowGap: 1
    }, h(Text, null, updates.isAuto ? say.autoOn : say.autoOff), h(Box, {
      flexDirection: "row"
    }, h(Button, {
      key: "updates-auto",
      label: updates.isAuto ? say.turnOff : say.turnOn,
      variant: updates.isAuto ? "secondary" : "primary",
      onPress: () => view.onAuto(!updates.isAuto)
    })), view.isFailed ? h(Text, {
      color: "error"
    }, say.failed) : null),
    updates.hasNew ? h(Box, {
      key: "hand",
      flexDirection: "column"
    }, h(Text, {
      dimColor: true
    }, say.byHand), h(Box, {
      flexDirection: "row",
      columnGap: 1,
      alignItems: "center"
    }, h(Button, {
      key: "updates-copy",
      label: say.copy,
      variant: "secondary",
      onPress: (press) => view.onCopy(commands, press)
    }), h(Text, {
      wrap: "truncate"
    }, commands))) : null
  ].filter((one) => one !== null);
}
function updatesTree(ui, view) {
  const { Box, Button, Text } = ui;
  const say = updateWords();
  return withHome(ui, h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, h(Text, {
    dimColor: true
  }, say.lead), view.updates === null ? [h(Text, {
    key: "unread"
  }, linkWords().unread)] : updatesBody(ui, view, view.updates), h(Box, {
    flexDirection: "row"
  }, h(Button, {
    key: "updates-check",
    label: say.check,
    plain: true,
    onPress: view.onCheck
  }))), view.onHome);
}

const cardsAtom$2 = atom({ plugin: "modz", key: "cards" }, {});
const linksAtom = atom({ plugin: "modz", key: "links" }, null);
const weightsAtom = atom({ plugin: "modz", key: "weights" }, null);
const updatesAtom$1 = atom({ plugin: "modz", key: "updates" }, null);
const UPDATE_CHECK_MS = 1e4;
const TOAST_MS = 12000;
let isHeadAsked = false;
let isAutoFailed = false;
const FILL_GAP_MS = 60000;
let filledAt = 0;
const NO_MATCH = "zzqqxxjj";
const log = ($, what) => (cause) => $.ui.log(`modz: ${what} failed: ${String(cause)}`, { to: "debug" });
async function placesOf($) {
  const named = await $.env.get("CLAUDE_CONFIG_DIR").catch(() => {
    return;
  });
  if (named)
    return { dir: named, json: `${named}/.claude.json` };
  const home = await $.env.get("HOME").catch(() => {
    return;
  }) || await $.env.get("USERPROFILE").catch(() => {
    return;
  });
  return home ? { dir: `${home}/.claude`, json: `${home}/.claude.json` } : null;
}
async function jsonAt($, path) {
  if (path === undefined)
    return;
  try {
    return JSON.parse(String(await $.fs.read(path)));
  } catch {
    return;
  }
}
async function breakdownOf($) {
  return (await $.session.usage({ breakdown: "summary" }).catch(() => {
    return;
  }))?.context.breakdown;
}
async function keepCard($, card) {
  const kept = (await read($, cardsAtom$2))[card.pane];
  if (kept?.detail === card.detail && kept.tone === card.tone)
    return;
  await update($, cardsAtom$2, (cards) => ({ ...cards, [card.pane]: card }));
}
async function refreshLinks($, isAsking) {
  const places = await placesOf($);
  const servers = ((await breakdownOf($))?.mcpTools ?? []).map((tool) => tool.serverName);
  const search = isAsking ? await $.tool.call({ tool: "ToolSearch", query: NO_MATCH, max_results: 1 }).catch(() => {
    return;
  }) : undefined;
  const now = await $.clock.now().catch(() => Date.now());
  const links = linksOf$1({ servers, authCache: await jsonAt($, places === null ? undefined : `${places.dir}/mcp-needs-auth-cache.json`), search, now });
  if (isSame(await read($, linksAtom), links) || !hasLinks(links) && await read($, linksAtom) === null)
    return;
  await update($, linksAtom, () => links);
  await keepCard($, linksCard(links, now));
}
async function refreshWeights($) {
  const config = await jsonAt($, (await placesOf($))?.json);
  const enabled = (await $.settings.read().catch(() => ({}))).enabledPlugins;
  const now = await $.clock.now().catch(() => Date.now());
  const weights = weightsOf({
    skills: (await breakdownOf($))?.skills?.skillFrontmatter ?? [],
    usage: config?.skillUsage,
    enabled: typeof enabled === "object" && enabled !== null ? enabled : {},
    now
  });
  if (weights === null)
    return false;
  if (isSame(await read($, weightsAtom), weights))
    return true;
  await update($, weightsAtom, () => weights);
  await keepCard($, weightCard(weights, now));
  return true;
}
async function refreshUpdates($, isAsking) {
  const kept = await read($, updatesAtom$1);
  const isAskingNow = isAsking || !isHeadAsked;
  isHeadAsked = true;
  const run = isAskingNow ? (argv) => $.process.run(argv, { timeoutMs: UPDATE_CHECK_MS }) : undefined;
  const updates = await updatesOf(diskOf($), { run, hadNew: kept?.hasNew === true });
  if (!updates.isInstalled || isSame(kept, updates))
    return;
  await update($, updatesAtom$1, () => updates);
  await keepCard($, updatesCard(updates, await $.clock.now().catch(() => Date.now())));
  if (updates.hasNew && kept?.hasNew !== true)
    $.ui.toast(hubWords().updateToast, { timeoutMs: TOAST_MS });
}
async function setAuto($, isOn) {
  isAutoFailed = !await setAutoUpdate(diskOf($), isOn);
  await refreshUpdates($, false);
  await $.ui.invalidate("ui.render");
}
function refreshSide($, pane) {
  if (pane === HUB_PANE)
    fillSideRows($);
  if (pane === LINKS_PANE)
    refreshLinks($, true).catch(log($, "reading the connections"));
  if (pane === WEIGHT_PANE)
    refreshWeights($).catch(log($, "weighing the plugins"));
  if (pane === UPDATES_PANE)
    refreshUpdates($, false).catch(log($, "reading the updates"));
}
async function fill$1($) {
  setLang$1(await $.env.get("MODZ_LANG").catch(() => {
    return;
  }));
  await refreshLinks($, false);
  await refreshUpdates($, false).catch(log($, "reading the updates"));
  if (!await refreshWeights($))
    filledAt = 0;
}
function fillSideRows($) {
  const now = Date.now();
  if (now - filledAt < FILL_GAP_MS)
    return;
  filledAt = now;
  fill$1($).catch(log($, "filling the side rows"));
}
function wireUpkeep(on) {
  on("ui.render", { component: "Pane", requestId: LINKS_PANE }, async ($, e) => {
    const onHome = () => void openHub($).catch(log($, "opening the hub"));
    const onCheck = () => void refreshLinks($, true).catch(log($, "reading the connections"));
    return pinned(e, linksTree($.ui.resolve(e), { links: await read($, linksAtom), onHome, onCheck }));
  });
  on("ui.render", { component: "Pane", requestId: WEIGHT_PANE }, async ($, e) => {
    const onHome = () => void openHub($).catch(log($, "opening the hub"));
    return pinned(e, weightTree($.ui.resolve(e), { weights: await read($, weightsAtom), now: await $.clock.now().catch(() => Date.now()), onHome, onCopy: (text, press) => copy($, text, press) }));
  });
  on("ui.render", { component: "Pane", requestId: UPDATES_PANE }, async ($, e) => {
    const onHome = () => void openHub($).catch(log($, "opening the hub"));
    const onCheck = () => void refreshUpdates($, true).catch(log($, "reading the updates"));
    const onAuto = (isOn) => void setAuto($, isOn).catch(log($, "setting auto-update"));
    const view = { updates: await read($, updatesAtom$1), isFailed: isAutoFailed, onHome, onCheck, onAuto, onCopy: (text, press) => copy($, text, press) };
    return pinned(e, updatesTree($.ui.resolve(e), view));
  });
}

const cardsAtom$1 = atom({ plugin: "modz", key: "cards" }, {});
const beatAtom$1 = atom({ plugin: "modz", key: "beat" }, 0);
const BEAT_MS = 1e4;
let beat = null;
async function redrawShown($) {
  if ((await $.ui.panes()).some((pane) => pane.id === HUB_PANE && pane.isShown))
    await update($, beatAtom$1, (n) => n + 1);
}
function keepBeat($, cards) {
  if (!hasRunningClock(cards)) {
    beat?.cancel();
    beat = null;
    return;
  }
  beat ??= $.clock.every(BEAT_MS, () => void redrawShown($).catch((cause) => $.ui.log(`modz: the hub's beat failed: ${String(cause)}`, { to: "debug" })));
}
function wireCards(on) {
  on("state.set", { key: "hub" }, async ($, e, next) => {
    const done = await next(e);
    const card = cardOf(e.value);
    const from = e.plugin;
    if (card === null || from === "modz")
      return done;
    fillSideRows($);
    if (isSame((await read($, cardsAtom$1))[from], card))
      return done;
    keepBeat($, await update($, cardsAtom$1, (cards) => ({ ...cards, [from]: card })));
    return done;
  }).catch(($, e, next) => next(e));
}

const TOGGLE_KEY = "modz-toggle";
const TOGGLE_LABEL = "modz";
const JOINT = " & ";
const HUB_PANES = new Set([HUB_PANE, MODS_PANE, HOLD_PANE, ...SIDE_PANES]);
function footerTree(ui, view) {
  const { Box, Text, Button } = ui;
  const labels = view.modes.length > 0 ? [h(Text, {
    dimColor: true
  }, view.modes.join(JOINT))] : [];
  return h(Box, {
    flexDirection: "row",
    alignItems: "center",
    gap: 1
  }, ...labels, h(Button, {
    key: TOGGLE_KEY,
    label: TOGGLE_LABEL,
    plain: true,
    dimColor: true,
    onPress: view.onPress
  }));
}
const isHubShown = (panes) => panes.some((pane) => pane.isShown && HUB_PANES.has(pane.id));

const PROBE_MODEL = "haiku";
const PROBE_TIMEOUT_MS = 20000;
const PROBE_MAX_TOKENS = 8;
const EN$2 = {
  title: "MODZ check: what Claude Code answers in this chat",
  version: "Claude Code version",
  surfaces: "Where this chat draws",
  cost: "Cost reading",
  model: "Small model (rule and safety checks)",
  system: "System",
  mods: "Mods on",
  none: "none",
  noSurface: "nowhere: a background or remote chat, panels and cards stay empty here",
  noCost: "no reading yet: cost shows 0 until one arrives (send one message, then run this again)",
  allOk: "Everything answered. If a panel is still empty, send this text to the mod author.",
  someFailed: "The lines marked ✗ are why a panel shows 0 or stays quiet. Send this text to the mod author."
};
const WORDS$4 = {
  en: EN$2,
  tr: {
    title: "MODZ sınaması: Claude Code bu sohbette neye cevap veriyor",
    version: "Claude Code sürümü",
    surfaces: "Bu sohbetin çizildiği yer",
    cost: "Maliyet okuması",
    model: "Küçük model (kural ve güvenlik kontrolleri)",
    system: "Sistem",
    mods: "Açık modlar",
    none: "yok",
    noSurface: "hiçbir yer: arka plan ya da uzaktan sohbet, paneller ve kartlar burada boş kalır",
    noCost: "henüz okuma yok: gelene kadar maliyet 0 görünür (bir mesaj gönderip bunu yeniden çalıştır)",
    allOk: "Hepsi cevap verdi. Bir panel hâlâ boşsa bu metni modun yazarına gönder.",
    someFailed: "✗ işaretli satırlar bir panelin 0 göstermesinin ya da susmasının nedeni. Bu metni modun yazarına gönder."
  }
};
const line$1 = (label, probe) => `${probe.isOk ? "✓" : "✗"} ${label}: ${probe.said}`;
function checkText(facts) {
  const w = pick$2(WORDS$4);
  const probes = [line$1(w.version, facts.version), line$1(w.surfaces, facts.surfaces), line$1(w.cost, facts.cost), line$1(w.model, facts.model)];
  const isAllOk = [facts.version, facts.surfaces, facts.cost, facts.model].every((probe) => probe.isOk);
  return [w.title, "", ...probes, `  ${w.system}: ${facts.system}`, `  ${w.mods}: ${facts.mods.join(", ") || w.none}`, "", isAllOk ? w.allOk : w.someFailed].join(`
`);
}
const failed = (cause) => ({ isOk: false, said: String(cause) });
async function modelProbe($) {
  const reply = await $.model.complete({ model: PROBE_MODEL, prompt: "Reply with the single word: ok", maxTokens: PROBE_MAX_TOKENS, timeoutMs: PROBE_TIMEOUT_MS });
  if (reply.isAnswered)
    return { isOk: true, said: PROBE_MODEL };
  return { isOk: false, said: reply.reason === "api-error" ? `${reply.reason} ${reply.status ?? ""} ${reply.error ?? ""}`.trim() : reply.reason };
}
async function checkFacts($, mods) {
  const w = pick$2(WORDS$4);
  const [version, surfaces, cost, model, os] = await Promise.all([
    $.session.version().then((v) => ({ isOk: true, said: v.version }), failed),
    $.session.surfaces().then((list) => list.length > 0 ? { isOk: true, said: list.join(", ") } : { isOk: false, said: w.noSurface }, failed),
    $.session.usage().then((u) => u.cost === undefined ? { isOk: false, said: w.noCost } : { isOk: true, said: `$${u.cost.usd.toFixed(2)}` }, failed),
    modelProbe($).catch(failed),
    $.env.get("OS").catch(() => {
      return;
    })
  ]);
  return { version, surfaces, cost, model, system: os === "Windows_NT" ? "Windows" : "macOS / Linux", mods };
}

const CORE = ["modz", "savvy-progress", "plan-steps", "filetree", "blast-radius", "secret-guard", "checkpoint", "hud-pro"];
const ownerOf = (command) => command.plugin?.split("@")[0];
function guideOf(market, commands) {
  return market.mods.filter((mod) => mod.isEnabled === true).map((mod) => ({
    mod: mod.name,
    commands: commands.filter((command) => ownerOf(command) === mod.name).map(({ name, description }) => ({ name, description })),
    options: mod.options
  })).filter((guide) => guide.commands.length > 0 || guide.options.length > 0);
}
const coreRank = (mod) => CORE.includes(mod.name) ? CORE.indexOf(mod.name) : CORE.length;
function installsOf(market) {
  return market.mods.filter((mod) => mod.isEnabled === null && mod.isHealthy).sort((a, b) => coreRank(a) - coreRank(b)).map((mod) => ({ mod: mod.name, summary: mod.description, command: `/plugin install ${mod.name}@${market.name}` }));
}
const commandsLine = (guide) => guide.commands.map((command) => `/${command.name}`).join(" · ");
function guideLines(guide) {
  const commands = guide.commands.map((command) => `  /${command.name}: ${command.description}`);
  const options = guide.options.length === 0 ? [] : [`  ${catalogWords().options(guide.options.join(", "))}`];
  return [guide.mod, ...commands, ...options];
}
function helpText(market, commands) {
  const words = hubWords();
  const guides = guideOf(market, commands);
  const installs = installsOf(market);
  const body = guides.length === 0 ? [words.helpNone] : guides.flatMap(guideLines);
  const rest = installs.length === 0 ? [] : ["", words.helpInstall, ...installs.map((install) => `  ${install.command}`)];
  return [words.helpTitle, words.helpHub, "", ...body, ...rest].join(`
`);
}

const CHARS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~" + "çğıİöşüÇĞÖŞÜâîû·…—–≈−×’“”‘€₺°→←↑↓✓✕•";
const REGULAR = [
  275,
  305,
  472,
  624,
  624,
  919,
  706,
  291,
  376,
  376,
  466,
  624,
  291,
  466,
  291,
  299,
  624,
  458,
  598,
  621,
  638,
  612,
  631,
  563,
  633,
  631,
  291,
  291,
  624,
  624,
  624,
  507,
  912,
  668,
  651,
  710,
  721,
  590,
  566,
  741,
  736,
  262,
  532,
  653,
  562,
  868,
  736,
  766,
  629,
  766,
  647,
  631,
  628,
  731,
  668,
  962,
  673,
  649,
  656,
  376,
  299,
  376,
  624,
  578,
  494,
  546,
  608,
  554,
  608,
  565,
  356,
  604,
  583,
  241,
  241,
  537,
  247,
  864,
  578,
  585,
  604,
  604,
  375,
  518,
  357,
  578,
  536,
  769,
  519,
  537,
  533,
  376,
  253,
  376,
  624,
  554,
  604,
  241,
  262,
  585,
  518,
  578,
  710,
  741,
  766,
  631,
  731,
  546,
  241,
  578,
  291,
  799,
  868,
  578,
  624,
  624,
  624,
  291,
  453,
  453,
  291,
  624,
  624,
  466,
  900,
  900,
  775,
  775,
  860,
  762,
  466
];
const BOLD = [
  252,
  351,
  563,
  666,
  666,
  1030,
  739,
  342,
  423,
  423,
  479,
  666,
  342,
  479,
  342,
  329,
  679,
  506,
  637,
  663,
  681,
  658,
  678,
  599,
  688,
  678,
  342,
  342,
  666,
  666,
  666,
  551,
  921,
  727,
  688,
  735,
  742,
  616,
  592,
  754,
  777,
  313,
  595,
  704,
  589,
  901,
  762,
  781,
  668,
  781,
  688,
  669,
  654,
  754,
  715,
  1003,
  724,
  702,
  670,
  423,
  329,
  423,
  666,
  622,
  494,
  584,
  646,
  582,
  646,
  595,
  402,
  640,
  626,
  281,
  281,
  596,
  289,
  926,
  622,
  614,
  641,
  642,
  429,
  561,
  407,
  622,
  577,
  841,
  575,
  591,
  561,
  423,
  293,
  423,
  666,
  582,
  640,
  281,
  313,
  614,
  561,
  622,
  735,
  754,
  781,
  669,
  754,
  584,
  281,
  622,
  342,
  948,
  901,
  622,
  666,
  666,
  666,
  342,
  547,
  547,
  342,
  695,
  666,
  479,
  938,
  938,
  810,
  810,
  905,
  762,
  479
];
const PER_MILLE = 1000;
const WEIGHT_LOW = 400;
const WEIGHT_SPAN = 300;
const UNKNOWN_EM = 0.6;
const WIDE_EM$2 = 1;
const FIRST_WIDE = 11904;
const TRACKING = [
  [10.5, 0.0146],
  [13, 0],
  [17, -0.0195],
  [24, -0.039]
];
const INDEX = new Map([...CHARS].map((char, i) => [char, i]));
function trackingAt(size) {
  const first = TRACKING[0] ?? [size, 0];
  const last = TRACKING[TRACKING.length - 1] ?? first;
  if (size <= first[0])
    return first[1];
  if (size >= last[0])
    return last[1];
  const upper = TRACKING.findIndex(([at]) => at >= size);
  const [x0, y0] = TRACKING[upper - 1] ?? first;
  const [x1, y1] = TRACKING[upper] ?? last;
  return y0 + (y1 - y0) * (size - x0) / (x1 - x0);
}
function charEm$1(char, boldness) {
  const i = INDEX.get(char);
  if (i === undefined)
    return (char.codePointAt(0) ?? 0) >= FIRST_WIDE ? WIDE_EM$2 : UNKNOWN_EM;
  const regular = REGULAR[i] ?? UNKNOWN_EM * PER_MILLE;
  const bold = BOLD[i] ?? regular;
  return (regular + (bold - regular) * boldness) / PER_MILLE;
}
function textWidth(text, size, weight = WEIGHT_LOW) {
  const boldness = Math.max(0, Math.min(1, (weight - WEIGHT_LOW) / WEIGHT_SPAN));
  const chars = [...text];
  const advance = chars.reduce((sum, char) => sum + charEm$1(char, boldness), 0);
  return Math.max(0, (advance + chars.length * trackingAt(size)) * size);
}

const STAGGER_MS$2 = 45;
const EASE$2 = "cubic-bezier(.2,.8,.2,1)";
const RULES$2 = {
  "m-in": `.m-in{animation:m-in .42s ${EASE$2} both}@keyframes m-in{from{opacity:0;transform:translateY(8px)}}`,
  "m-fade": `.m-fade{animation:m-fade .5s ${EASE$2} both}@keyframes m-fade{from{opacity:0}}`,
  "m-grow": `.m-grow{transform-box:fill-box;transform-origin:left center;animation:m-grow .7s ${EASE$2} both}@keyframes m-grow{from{transform:scaleX(0)}}`,
  "m-px": `.m-px{transform-box:fill-box;transform-origin:center;animation:m-px .34s ${EASE$2} both}@keyframes m-px{from{opacity:0;transform:translateY(-10px) scale(.6)}}`,
  "m-flash": ".m-flash{opacity:0;animation:m-flash 1.6s ease-out both}@keyframes m-flash{from{opacity:.9}to{opacity:0}}",
  "m-from": `.m-from{transform-box:fill-box;transform-origin:left center;animation:m-from .32s ${EASE$2} both}@keyframes m-from{from{transform:scaleX(var(--m-from))}}`,
  "m-draw": `.m-draw{stroke-dasharray:1;animation:m-draw .32s ${EASE$2} .12s both}@keyframes m-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}`,
  "m-breathe": ".m-breathe{animation:m-breathe 1.8s ease-in-out infinite}@keyframes m-breathe{50%{opacity:.4}}",
  "m-ring": ".m-ring{transform-box:fill-box;transform-origin:center;animation:m-ring 1.8s ease-out infinite}@keyframes m-ring{from{opacity:.55;transform:scale(1)}to{opacity:0;transform:scale(2.8)}}",
  "m-wash": `.m-wash{fill:#8E8A80;opacity:0;transition:opacity .12s ${EASE$2}}svg:hover .m-wash{opacity:.12}`,
  "m-tile": `.m-tile{transform-box:fill-box;transform-origin:center;transition:transform .2s ${EASE$2}}svg:hover .m-tile{transform:translateY(-1px) scale(1.06)}`
};
const REDUCED$4 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function motionCss$2(body) {
  const used = Object.keys(RULES$2).filter((name) => new RegExp(`\\b${name}\\b`).test(body));
  return used.length === 0 ? "" : `${used.map((name) => RULES$2[name]).join("")}${REDUCED$4}`;
}
const MOTION_CSS$1 = Object.values(RULES$2).join("");
const isEntering$2 = (cue) => cue.phase === "enter";
function entering$2(body, cue, kind = "in") {
  if (!isEntering$2(cue))
    return body;
  return `<g class="m-${kind}" style="animation-delay:${cue.order * STAGGER_MS$2}ms">${body}</g>`;
}
const delayOf = (cue, step) => `animation-delay:${cue.order * STAGGER_MS$2 + step}ms`;

const DARK$3 = {
  sheet: "#191917",
  card: "#1F1F1C",
  inset: "#171715",
  line: "#2E2E2A",
  strong: "#45443F",
  track: "#34332F",
  hi: "#F0EEE8",
  mid: "#C2BEB4",
  lo: "#8E8A80",
  roles: {
    read: { fg: "#7FB6E8", tint: "#1E2B37", line: "#2F4A63" },
    edit: { fg: "#E58A5F", tint: "#38251D", line: "#6A3E2D" },
    run: { fg: "#B19CF3", tint: "#29243D", line: "#4A3F75" },
    ok: { fg: "#6FC593", tint: "#1B2F25", line: "#2F5A42" },
    warn: { fg: "#E9B949", tint: "#332D19", line: "#66552A" },
    danger: { fg: "#F2727F", tint: "#3B2023", line: "#74343C" },
    plan: { fg: "#E07BC0", tint: "#351F2E", line: "#6B3A5C" }
  }
};
const LIGHT$3 = {
  sheet: "#F4F2EC",
  card: "#FFFFFF",
  inset: "#F6F4EF",
  line: "#E4E0D6",
  strong: "#CFC9BC",
  track: "#ECE8DF",
  hi: "#1C1B19",
  mid: "#4F4B44",
  lo: "#77726A",
  roles: {
    read: { fg: "#2464A0", tint: "#E7F0F9", line: "#B9D3EC" },
    edit: { fg: "#A94A26", tint: "#FBEDE6", line: "#EFC6B4" },
    run: { fg: "#6243C4", tint: "#F0ECFC", line: "#CFC3F3" },
    ok: { fg: "#1F6E43", tint: "#E4F4EA", line: "#B5DEC4" },
    warn: { fg: "#8A6000", tint: "#FBF2D9", line: "#EBD48F" },
    danger: { fg: "#C0263A", tint: "#FCE8EA", line: "#F1B9C0" },
    plan: { fg: "#A8337F", tint: "#FBE9F4", line: "#EDBFDC" }
  }
};
const ROLE_NAMES$1 = ["read", "edit", "run", "ok", "warn", "danger", "plan"];
const FONT$2 = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`;
const MONO$2 = `ui-monospace, 'SF Mono', Menlo, monospace`;
function varsOf$1(palette) {
  const base = ["sheet", "card", "inset", "line", "strong", "track", "hi", "mid", "lo"];
  const neutral = base.map((key) => `--${key}:${palette[key]}`);
  const roles = ROLE_NAMES$1.flatMap((name) => {
    const role = palette.roles[name];
    return [`--${name}:${role.fg}`, `--${name}-t:${role.tint}`, `--${name}-l:${role.line}`];
  });
  return [...neutral, ...roles].join(";");
}
function roleClasses() {
  return ROLE_NAMES$1.map((name) => `.fg-${name}{fill:var(--${name})}.bg-${name}{fill:var(--${name}-t)}.st-${name}{stroke:var(--${name})}.ln-${name}{stroke:var(--${name}-l)}`).join("");
}
const TYPE_CSS = [
  `text{font-family:${FONT$2}}`,
  `.num{font-family:${MONO$2};font-variant-numeric:tabular-nums}`,
  ".hi{fill:var(--hi)}.mid{fill:var(--mid)}.lo{fill:var(--lo)}",
  ".eb{font-size:10.5px;font-weight:700;letter-spacing:.1em}",
  ".hl{font-size:17px;font-weight:620}.ti{font-size:13px;font-weight:600}",
  ".lb{font-size:12px;font-weight:500}.mi{font-size:10.5px;font-weight:500}.dp{font-size:24px;font-weight:650}",
  ".card{fill:var(--card)}.inset{fill:var(--inset)}.track{fill:var(--track)}.line{stroke:var(--line)}.strong{stroke:var(--strong)}",
  ".f-line{fill:var(--line)}.f-strong{fill:var(--strong)}.f-mid{fill:var(--mid)}"
].join("");
const MOTION_CSS = ".breathe{animation:breathe 1.8s ease-in-out infinite}@keyframes breathe{50%{opacity:.45}}";
const REDUCED$3 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function styleOf() {
  const dark = varsOf$1(DARK$3);
  return `<style>svg{${varsOf$1(LIGHT$3)}}svg.t-dark{${dark}}@media (prefers-color-scheme: dark){svg.t-auto{${dark}}}${TYPE_CSS}${roleClasses()}${MOTION_CSS}${REDUCED$3}</style>`;
}
const SCHEME$3 = { light: "light", dark: "dark", auto: "light dark" };
function svgDoc$2(doc) {
  const width = Math.round(doc.width);
  const scheme = `:root{color-scheme:${SCHEME$3[doc.theme]}}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="t-${doc.theme}" width="${width}" height="${doc.height}" viewBox="0 0 ${width} ${doc.height}">${styleOf()}<style>${scheme}${doc.css ?? ""}</style>${doc.body}</svg>`;
}
function themeOf(value) {
  const name = String(value ?? "").toLowerCase();
  if (name.includes("light"))
    return "light";
  return name.includes("dark") ? "dark" : "auto";
}

const settled = (spec) => spec.cue === undefined ? svgDoc$2(spec) : svgDoc$2({ width: spec.width, height: spec.height, theme: spec.theme, body: entering$2(spec.body, spec.cue), css: MOTION_CSS$1 });
const HEAD = 44;
const GROUP = 28;
const ROW$1 = 62;
const TEXT_X$1 = 16;
const GAP$1 = 6;
function esc$1(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
const MONO_EM$2 = 0.6;
const WEIGHT_BODY = 500;
function measure$2(text, size, weight = WEIGHT_BODY) {
  return textWidth(text, size, weight);
}
const monoMeasure = (text, size) => [...text].length * size * MONO_EM$2;
function fit$2(text, width, font) {
  const { size, weight = WEIGHT_BODY } = font;
  if (measure$2(text, size, weight) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 1 && measure$2(`${chars.join("").trimEnd()}…`, size, weight) > width)
    chars.pop();
  return `${chars.join("").trimEnd()}…`;
}
function headSvg$1(spec) {
  const meta = spec.meta === "" ? "" : `<text x="${spec.width - TEXT_X$1}" y="28" text-anchor="end" style="font-size:11.5px" class="num ${spec.metaRole === null ? "lo" : `fg-${spec.metaRole}`}">${esc$1(spec.meta)}</text>`;
  const title = fit$2(spec.title, spec.width - TEXT_X$1 * 2 - measure$2(spec.meta, 12) - GAP$1 * 2, { size: 16, weight: 600 });
  const body = `<text x="${TEXT_X$1}" y="28" style="font-size:16px;font-weight:600" class="hi">${esc$1(title)}</text>${meta}`;
  return { source: settled({ width: spec.width, height: HEAD, theme: spec.theme, body, cue: spec.cue }), alt: `${catalogWords().allMods}: ${spec.title}${spec.meta === "" ? "" : ` · ${spec.meta}`}`, height: HEAD };
}
function labelSvg(spec) {
  const { label } = spec;
  const count = catalogWords().mods(spec.count);
  const body = `<text x="${TEXT_X$1}" y="${GROUP - 8}" style="font-size:11px;font-weight:600" class="lo">${esc$1(label)}</text><text x="${spec.width - TEXT_X$1}" y="${GROUP - 8}" text-anchor="end" style="font-size:11px" class="num lo">${esc$1(count)}</text>`;
  return { source: settled({ width: spec.width, height: GROUP, theme: spec.theme, body, cue: spec.cue }), alt: `${label}: ${count}`, height: GROUP };
}
const groupSvg = (spec) => labelSvg({ ...spec, label: catalogWords().groups[spec.group] });
const GUIDE = { one: 28, two: 44 };
function guideSvg(spec) {
  const { guide, width } = spec;
  const right = width - TEXT_X$1;
  const words = catalogWords();
  const options = guide.options.length === 0 ? "" : words.options(guide.options.join(", "));
  const height = options === "" ? GUIDE.one : GUIDE.two;
  const name = fit$2(guide.mod, (right - TEXT_X$1) / 2, { size: 13, weight: 560 });
  const room = Math.floor((right - TEXT_X$1 - measure$2(name, 13, 560) - GAP$1 * 2) / (11.5 * MONO_EM$2));
  const all = commandsLine(guide);
  const commands = [...all].length <= room ? all : `${[...all].slice(0, Math.max(1, room - 1)).join("")}…`;
  const body = [
    `<text x="${TEXT_X$1}" y="19" style="font-size:13px;font-weight:560" class="hi">${esc$1(name)}</text>`,
    all === "" ? "" : `<text x="${right}" y="19" text-anchor="end" style="font-size:11.5px" class="num mid">${esc$1(commands)}</text>`,
    options === "" ? "" : `<text x="${TEXT_X$1}" y="36" style="font-size:11px" class="lo">${esc$1(fit$2(options, right - TEXT_X$1, { size: 11 }))}</text>`
  ].join("");
  const alt = [guide.mod, all === "" ? words.noCommand : all, options].filter(Boolean).join(" · ");
  return { source: settled({ width, height, theme: spec.theme, body, cue: spec.cue }), alt, height };
}
function stateWord(mod) {
  const words = catalogWords();
  if (!mod.isHealthy)
    return { text: words.brokenWord, ink: "fg-danger" };
  if (mod.isEnabled === false)
    return { text: words.offWord, ink: "lo" };
  return mod.isEnabled === null ? { text: words.stateUnknown, ink: "lo" } : null;
}
function stateLabel(mod) {
  const words = catalogWords();
  if (!mod.isHealthy)
    return words.brokenWord;
  if (mod.isEnabled === null)
    return words.stateUnknown;
  return mod.isEnabled ? words.onWord : words.offWord;
}
function rowSvg$2(spec) {
  const { mod, width } = spec;
  const right = width - TEXT_X$1;
  const versionText = mod.version === null ? "" : `v${mod.version}`;
  const state = stateWord(mod);
  const edge = [state?.text, versionText].filter(Boolean).join(" · ");
  const name = fit$2(mod.name, right - TEXT_X$1 - monoMeasure(edge, 11.5) - GAP$1 * 2, { size: 13, weight: 560 });
  const isQuiet = mod.isEnabled === false;
  const lineRoom = right - TEXT_X$1;
  const body = [
    `<text x="${TEXT_X$1}" y="21" style="font-size:13px;font-weight:560" class="${isQuiet ? "lo" : "hi"}">${esc$1(name)}</text>`,
    edge === "" ? "" : `<text x="${right}" y="21" text-anchor="end" style="font-size:11.5px" class="num ${state?.ink ?? "lo"}">${esc$1(edge)}</text>`,
    `<text x="${TEXT_X$1}" y="39" style="font-size:12px" class="${mod.isHealthy ? isQuiet ? "lo" : "mid" : "fg-danger"}">${esc$1(fit$2(mod.description, lineRoom, { size: 12 }))}</text>`,
    `<text x="${TEXT_X$1}" y="55" style="font-size:11px" class="lo">${esc$1(fit$2(placeLine(mod), lineRoom, { size: 11 }))}</text>`
  ].join("");
  const alt = `${[mod.name, versionText].filter(Boolean).join(" ")} · ${placeLine(mod)} · ${stateLabel(mod)} · ${mod.description}`;
  return { source: settled({ width, height: ROW$1, theme: spec.theme, body, cue: spec.cue }), alt, height: ROW$1 };
}

const LETTERS = {
  M: ["X...X", "XX.XX", "X.X.X", "X.X.X", "X...X", "X...X", "X...X"],
  O: [".XXX.", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
  D: ["XXXX.", "X...X", "X...X", "X...X", "X...X", "X...X", "XXXX."],
  Z: ["XXXXX", "....X", "...X.", "..X..", ".X...", "X....", "XXXXX"],
  m: [".....", ".....", "XX.X.", "X.X.X", "X.X.X", "X.X.X", "X.X.X"],
  o: [".....", ".....", ".XXX.", "X...X", "X...X", "X...X", ".XXX."],
  d: ["....X", "....X", ".XXXX", "X...X", "X...X", "X...X", ".XXXX"],
  z: [".....", ".....", "XXXXX", "...X.", "..X..", ".X...", "XXXXX"]
};
const PIXEL_GLYPHS = {
  sparkle: ["X.....X", "X.X.X.X", ".XXXXX.", "XXXXXXX", ".X.X.X."],
  folder: ["XXX....", "XXXXXXX", "X.....X", "X.....X", "XXXXXXX"],
  list: ["X.XXXXX", ".......", "X.XXXXX", ".......", "X.XXX.."],
  bell: ["X.....X", ".X...X.", "..X.X..", "...X...", "...X...", "..XXX.."],
  check: [".....XX", "....XX.", "XX.XX..", ".XXX...", "..X...."],
  bookmark: ["XXXXX", "XXXXX", "XXXXX", "XX.XX", "X...X"],
  rewind: ["..X..X", ".XX.XX", "XXXXXX", ".XX.XX", "..X..X"],
  gauge: ["....X..", "..X.X..", "..X.X.X", "X.X.X.X", "X.X.X.X"],
  bolt: ["...XX", "..XX.", ".XXXX", "..XX.", ".XX.."],
  flag: ["...X...", "....X..", "XXXXXX.", "....X..", "...X..."],
  eye: ["..XXX..", ".X...X.", "X..X..X", ".X...X.", "..XXX.."],
  cube: ["XX.XX", "XX.XX", ".....", "XX.XX", "XX.XX"],
  layers: ["..XXXXX", ".......", ".XXXXX.", ".......", "XXXXX.."],
  star: ["...X...", "...X...", "XXXXXXX", "..XXX..", ".XX.XX."],
  search: [".XXX...", "X...X..", "X...X..", "X...X..", ".XXXX..", "....XX.", ".....XX"],
  pencil: [".....XX", "....XXX", "...XXX.", "..XXX..", ".XXX...", "XX.....", "X......"],
  terminal: ["X......", ".X.....", "..X....", ".X.....", "X..XXXX"],
  shield: ["XXXXXXX", "XXXXX.X", "X.XX.XX", "XX..XXX", ".XXXXX.", "..XXX..", "...X..."],
  branch: ["X....X.", "X....X.", "X....X.", "X...X..", "XXXX...", "X......", "X......"],
  trash: ["..XXX..", "XXXXXXX", ".......", ".X.X.X.", ".X.X.X.", ".X.X.X.", ".XXXXX."],
  globe: ["..XXX..", ".X.X.X.", "X..X..X", "XXXXXXX", "X..X..X", ".X.X.X.", "..XXX.."],
  clock: ["..XXX..", ".X...X.", "X..X..X", "X..XX.X", "X.....X", ".X...X.", "..XXX.."],
  plug: [".X.X.", ".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X..", "..X.."]
};
const FALLBACK = PIXEL_GLYPHS.cube;
const ROUND = 0.22;
const num$1 = (value) => String(Math.round(value * 100) / 100);
function cells(grid, o, index = 0) {
  const rects = grid.flatMap((row, r) => [...row].map((c, col) => c === "X" ? `<rect x="${num$1(o.x + col * o.pitch)}" y="${num$1(o.y + r * o.pitch)}" width="${o.cell}" height="${o.cell}" rx="${num$1(o.cell * ROUND)}"${o.cellAttrs?.({ row: r, col, index }) ?? ""}/>` : ""));
  return `<g class="${o.className}">${rects.join("")}</g>`;
}
const sizeOf = (grid, pitch, cell) => ({
  width: Math.max(...grid.map((row) => row.length)) * pitch - (pitch - cell),
  height: grid.length * pitch - (pitch - cell)
});
function pixelGlyph(name, o) {
  const grid = PIXEL_GLYPHS[name] ?? FALLBACK;
  const size = sizeOf(grid, o.pitch, o.cell);
  return cells(grid, { ...o, x: o.x + (o.box - size.width) / 2, y: o.y + (o.box - size.height) / 2 });
}
function pixelWord(word, o) {
  let x = o.x;
  const parts = [...word].map((letter, index) => {
    const grid = LETTERS[letter] ?? LETTERS[letter.toUpperCase()] ?? LETTERS.M;
    const svg = cells(grid, { ...o, x }, index);
    x += sizeOf(grid, o.pitch, o.cell).width + o.gap;
    return svg;
  });
  return { svg: parts.join(""), width: x - o.gap - o.x };
}

const NARROW$1 = 280;
const WIDE$1 = 520;
const between = (k, from, to) => Math.round((from + (to - from) * k) * 10) / 10;
function sizesOf(width) {
  const k = Math.max(0, Math.min(1, (width - NARROW$1) / (WIDE$1 - NARROW$1)));
  const row = Math.round(between(k, 30, 38));
  const inset = between(k, 16, 22);
  const icon = between(k, 16, 20);
  const title = between(k, 13, 15);
  return {
    row,
    line: Math.round(between(k, 24, 28)),
    section: Math.round(between(k, 30, 38)),
    head: Math.round(between(k, 46, 58)),
    inset,
    icon,
    textX: inset + icon + between(k, 12, 14),
    baseline: row / 2 + title * 0.35,
    glyph: { cell: between(k, 2, 2.5), pitch: between(k, 2.5, 3.1) },
    mark: { cell: between(k, 2.6, 3.3), pitch: between(k, 3.1, 3.9), gap: between(k, 5, 6.2) },
    title: { size: title, weight: 500 },
    value: { size: between(k, 12, 13.5), weight: 400 },
    label: between(k, 11, 12),
    meta: between(k, 11, 12.5)
  };
}
const LETTER_MS = 70;
const ROW_MS = 32;
const COLUMN_MS = 8;
const VALUE_GAP = 16;
const BADGE_GAP = 6;
const HUB_CSS = [
  "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}"
].join("");
const doc = (spec) => svgDoc$2({ ...spec, css: motionCss$2(spec.body) || HUB_CSS });
const LIVE_DOT = { r: 3, gap: 9 };
function valueOf(card) {
  if (card === null || card.detail === "")
    return null;
  return { text: card.detail, ink: card.tone === "bad" ? "fg-danger" : "lo", isLive: card.tone === "live" };
}
function glyphInk(card) {
  if (card === null || card.detail === "")
    return "f-mid";
  const role = card.tone === "live" ? "edit" : card.tone === "warn" || card.tone === "bad" ? ROLE_OF_TONE[card.tone] : null;
  return role === null ? "f-mid" : `fg-${role}`;
}
function hubHeadSvg(spec) {
  const isDropping = isEntering$2(spec.cue);
  const cellAttrs = isDropping ? (at) => ` class="m-px" style="${delayOf(spec.cue, at.index * LETTER_MS + at.row * ROW_MS + at.col * COLUMN_MS)}"` : undefined;
  const z = sizesOf(spec.width);
  const mark = pixelWord("modz", { x: z.inset, y: (z.head - 7 * z.mark.pitch) / 2, ...z.mark, className: "fg-edit", cellAttrs });
  const meta = `<text x="${spec.width - z.inset}" y="${z.head / 2 + 4}" text-anchor="end" style="font-size:${z.meta}px" class="num lo">${esc$1(spec.meta)}</text>`;
  const body = mark.svg + entering$2(meta, { ...spec.cue, order: spec.cue.order + 4 }, "fade");
  const css = HUB_CSS + motionCss$2(body);
  return { source: svgDoc$2({ width: spec.width, height: z.head, theme: spec.theme, body, css }), alt: `modz · ${spec.meta}`, height: z.head };
}
function sectionSvg(spec) {
  const z = sizesOf(spec.width);
  const body = `<text x="${z.inset}" y="${z.section - 8}" style="font-size:${z.label}px;font-weight:600" class="lo">${esc$1(spec.label)}</text>`;
  return { source: doc({ width: spec.width, height: z.section, theme: spec.theme, body: entering$2(body, spec.cue, "fade") }), alt: spec.label, height: z.section };
}
function rowIcon(row, z) {
  const glyph = pixelGlyph(row.entry.icon, { x: z.inset, y: (z.row - z.icon) / 2, box: z.icon, ...z.glyph, className: glyphInk(row.card) });
  return isLive(row.card) ? `<g class="m-breathe">${glyph}</g>` : glyph;
}
const isLive = (card) => card !== null && card.detail !== "" && card.tone === "live";
function titleOf$1(row, z) {
  const title = row.entry.title;
  const titleEnd = z.textX + measure$2(title, z.title.size, z.title.weight);
  const text = `<text x="${z.textX}" y="${z.baseline}" style="font-size:${z.title.size}px;font-weight:500" class="hi">${esc$1(title)}</text>`;
  const badge = row.entry.badge;
  if (badge === null)
    return { svg: text, end: titleEnd };
  const word = badge.toLocaleLowerCase();
  const tag = `<text x="${titleEnd + BADGE_GAP}" y="${z.baseline}" style="font-size:${z.label}px;font-weight:500" class="lo">${esc$1(word)}</text>`;
  return { svg: text + tag, end: titleEnd + BADGE_GAP + measure$2(word, z.label, 500) };
}
const NARROW_VALUE = { size: 12, weight: 400 };
function shortValue(text, width, font = NARROW_VALUE) {
  const fits = (candidate) => measure$2(candidate, font.size, font.weight) <= width;
  if (fits(text))
    return text;
  const first = text.split(" · ")[0] ?? text;
  const words = first.split(" ");
  if (words.length === 1)
    return fit$2(first, width, font);
  for (let n = words.length;n >= 2; n--) {
    const kept = words.slice(0, n).join(" ");
    if (fits(kept))
      return kept;
  }
  return "";
}
function valueSvg(value, room) {
  if (value === null)
    return "";
  const text = shortValue(value.text, room.to - room.from, room.z.value);
  if (text === "")
    return "";
  const words = `<text x="${room.to}" y="${room.z.baseline}" text-anchor="end" style="font-size:${room.z.value.size}px;font-variant-numeric:tabular-nums" class="${value.ink}">${esc$1(text)}</text>`;
  if (!value.isLive)
    return words;
  const x = room.to - measure$2(text, room.z.value.size, room.z.value.weight) - LIVE_DOT.gap;
  const y = room.z.row / 2;
  const dot = (cls) => `<circle cx="${x}" cy="${y}" r="${LIVE_DOT.r}" class="fg-edit${cls}"/>`;
  return dot(" m-ring") + dot("") + words;
}
function hubRowSvg(spec) {
  const { width, row } = spec;
  const z = sizesOf(width);
  const title = titleOf$1(row, z);
  const value = spec.buttonRoom > 0 ? null : valueOf(row.card);
  const body = [
    rowIcon(row, z),
    title.svg,
    valueSvg(value, { from: title.end + VALUE_GAP + (value?.isLive ? LIVE_DOT.gap + LIVE_DOT.r * 2 : 0), to: width - z.inset, z })
  ].join("");
  const alt = `${row.entry.title}${row.entry.badge === null ? "" : ` (${row.entry.badge})`}${value === null ? "" : `: ${value.text}`}`;
  return { source: doc({ width, height: z.row, theme: spec.theme, body: entering$2(body, spec.cue) }), alt, height: z.row };
}
function hubLineSvg(spec) {
  const z = sizesOf(spec.width);
  const right = spec.width - z.inset;
  const { value } = spec.line;
  const room = right - z.textX - (value === "" ? 0 : measure$2(value, z.label, 400) + VALUE_GAP);
  const label = fit$2(spec.line.label, room, { size: z.value.size, weight: 400 });
  const y = z.line / 2 + z.value.size * 0.35;
  const body = [
    `<text x="${z.textX}" y="${y}" style="font-size:${z.value.size}px" class="mid">${esc$1(label)}</text>`,
    value === "" ? "" : `<text x="${right}" y="${y}" text-anchor="end" style="font-size:${z.label}px;font-variant-numeric:tabular-nums" class="lo">${esc$1(value)}</text>`
  ].join("");
  return { source: doc({ width: spec.width, height: z.line, theme: spec.theme, body: entering$2(body, spec.cue) }), alt: [spec.line.label, value].filter(Boolean).join(": "), height: z.line };
}

const DESKTOP_FOOT$1 = { paddingX: 2, marginTop: 1 };
const isFirstRun = (view) => !view.isEditing && view.hidden.length === 0 && view.rows.every((row) => row.entry.pane === MODS_PANE);
function firstRun(ui, view) {
  const { Box, Button, Text } = ui;
  if (!isFirstRun(view))
    return null;
  const words = hubWords();
  return h(Box, {
    key: "first-run",
    flexDirection: "column",
    rowGap: 1
  }, h(Text, {
    dimColor: true
  }, words.firstRun), h(Box, {
    flexDirection: "row"
  }, h(Button, {
    key: "add-mods",
    label: words.addMods,
    variant: "primary",
    onPress: () => view.actions.onOpen(MODS_PANE)
  })));
}
function firstRunRow(ui, view, pen) {
  const { Box, Text } = ui;
  if (!isFirstRun(view))
    return null;
  const words = hubWords();
  const { width, theme } = pen;
  const row = { entry: { pane: MODS_PANE, mod: "modz", title: words.addMods, icon: "layers", role: "edit", section: "meter", hint: "", badge: null, isGuest: false }, card: null, hotkey: null };
  const built = pen.keep("row-add-mods", { width, theme, title: words.addMods }, (cue) => hubRowSvg({ width, theme, row, buttonRoom: 0, cue }));
  return h(Box, {
    key: "first-run",
    flexDirection: "column"
  }, h(Box, {
    ...DESKTOP_FOOT$1,
    marginBottom: 1
  }, h(Text, {
    dimColor: true
  }, words.firstRun)), pen.press({ box: "row-add-mods", key: "add-mods", drawing: built, pane: MODS_PANE }));
}

const BLANK$1 = "ㅤ";
const CELL_PX$1 = 11.9;
const BUTTON_PX$1 = 28;
const RUN_SPAN$1 = 2;
const LINE_SPAN$1 = "400%";
function PressCover$1(ui, o) {
  const { Box, Button } = ui;
  const lines = Math.max(1, Math.floor(o.height / (BUTTON_PX$1 * 2)));
  const label = BLANK$1.repeat(Math.ceil(o.width * RUN_SPAN$1 / CELL_PX$1));
  const hotkey = o.hotkey === undefined ? {} : { hotkey: o.hotkey };
  return h(Box, {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "column",
    justifyContent: "center",
    overflow: "hidden"
  }, Array.from({ length: lines }, (_, i) => h(Box, {
    key: `${o.key}~line${i}`,
    flexDirection: "row",
    width: LINE_SPAN$1,
    marginLeft: -1,
    flexShrink: 0
  }, h(Button, {
    key: i === 0 ? o.key : `${o.key}~${i}`,
    label,
    plain: true,
    ...i === 0 ? hotkey : {},
    onPress: o.onPress
  }))));
}
const STILL$1 = "<style>*{animation:none!important;transition:none!important}</style>";
const stillSource$1 = (source) => source.replace(/<\/svg>\s*$/, `${STILL$1}</svg>`);
function stillSvg$1(ui, drawing) {
  if (drawing.type !== "Svg")
    return drawing;
  const { Svg } = ui;
  const { key, source, alt, width, height } = drawing.props;
  return h(Svg, {
    key,
    source: stillSource$1(source),
    alt,
    width,
    height
  });
}
const FALLBACK_PX$1 = 52;
const FALLBACK_WIDTH_PX$1 = 360;
function PressRow$1(ui, o) {
  const { Box } = ui;
  const props = o.drawing.type === "Svg" ? o.drawing.props : {};
  const width = props.width ?? FALLBACK_WIDTH_PX$1;
  const height = props.height ?? FALLBACK_PX$1;
  return h(Box, {
    key: o.box,
    alignSelf: "flex-start"
  }, stillSvg$1(ui, o.drawing), PressCover$1(ui, { key: o.key, width, height, hotkey: o.hotkey, onPress: o.onPress }));
}

const linesOf = (item) => item.more > 0 ? [...item.lines, { label: hubWords().more(item.more), value: "" }] : item.lines;
function desktopGroup$1(item, tools) {
  const { width, theme, keep, press } = tools;
  const { row } = item;
  const pane = row.entry.pane;
  const shows = { width, theme, entry: row.entry, detail: row.card?.detail, tone: row.card?.tone };
  const head = keep(`row-${pane}`, shows, (cue) => hubRowSvg({ width, theme, row, buttonRoom: 0, cue }));
  const lines = linesOf(item).map((line, i) => {
    const drawing = keep(`now-line-${pane}-${i}`, { width, theme, line }, (cue) => hubLineSvg({ width, theme, line, cue }));
    return press({ box: `now-${pane}-${i}`, key: `now-open-${pane}-${i}`, drawing, pane });
  });
  return [press({ box: `row-${pane}`, key: `open-${pane}`, drawing: head, pane }), ...lines];
}
function nowDesktop(ui, now, tools) {
  if (now.length === 0)
    return null;
  const { Box } = ui;
  const { width, theme } = tools;
  const label = hubWords().now;
  const eyebrow = tools.keep("eyebrow-now", { width, theme, label }, (cue) => sectionSvg({ width, theme, label, cue }));
  return h(Box, {
    key: "now",
    flexDirection: "column"
  }, tools.label(eyebrow, "eyebrow-now"), now.flatMap((item) => desktopGroup$1(item, tools)));
}
const GLYPH_COLOR = { live: "claude", warn: "warning", bad: "error" };
function detailText(ui, tone, detail) {
  const { Text } = ui;
  return tone === "bad" ? h(Text, {
    color: "error",
    wrap: "truncate"
  }, detail) : h(Text, {
    dimColor: true,
    wrap: "truncate"
  }, detail);
}
function terminalGroup(ui, item, button) {
  const { Box, Text } = ui;
  const { entry, card } = item.row;
  const tone = card?.tone ?? "idle";
  const color = GLYPH_COLOR[tone];
  return h(Box, {
    key: `row-${entry.pane}`,
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, color === undefined ? h(Text, {
    dimColor: true
  }, GLYPH[entry.icon]) : h(Text, {
    color
  }, GLYPH[entry.icon]), h(Text, {
    bold: true
  }, entry.title), detailText(ui, tone, card?.detail ?? ""), h(Box, {
    flexGrow: 1
  }), button(item.row)), linesOf(item).map((line, i) => h(Box, {
    key: `now-${entry.pane}-${i}`,
    flexDirection: "row",
    columnGap: 1,
    paddingLeft: 2
  }, h(Text, {
    wrap: "truncate"
  }, line.label), h(Box, {
    flexGrow: 1
  }), h(Text, {
    dimColor: true
  }, line.value))));
}
function nowTerminal(ui, now, button) {
  if (now.length === 0)
    return null;
  const { Box, Text } = ui;
  return h(Box, {
    key: "now",
    flexDirection: "column"
  }, h(Text, {
    bold: true,
    dimColor: true
  }, hubWords().now), now.map((item) => terminalGroup(ui, item, button)));
}

const PX_PER_COLUMN$3 = 9;
const WIDTH_MIN$1 = 240;
const WIDTH_MAX$1 = 640;
const EDIT_BUTTON_ROOM = 136;
const INSET = 1;
const hubWidth = (columns) => Math.max(WIDTH_MIN$1, Math.min(WIDTH_MAX$1, columns * PX_PER_COLUMN$3 - PX_PER_COLUMN$3));
const inSection = (rows, section) => rows.filter((row) => row.entry.section === section);
function rowControls(ui, view, opts) {
  const { Box, Button } = ui;
  const { row, panes } = opts;
  const pane = row.entry.pane;
  const words = hubWords();
  const edge = (controls) => h(Box, {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: INSET,
    alignItems: "center",
    flexDirection: "row",
    columnGap: 1
  }, controls);
  if (panes === null)
    return edge(h(Button, {
      key: `show-${pane}`,
      label: words.show,
      variant: "secondary",
      onPress: () => view.actions.onHide({ pane, isHidden: false })
    }));
  const up = panes.indexOf(pane) > 0 ? [h(Button, {
    key: `up-${pane}`,
    label: words.up,
    variant: "secondary",
    onPress: () => view.actions.onMove({ pane, panes })
  })] : [];
  return edge([...up, h(Button, {
    key: `hide-${pane}`,
    label: words.hide,
    variant: "secondary",
    onPress: () => view.actions.onHide({ pane, isHidden: true })
  })]);
}
const DESKTOP_FOOT = { paddingX: 2, marginTop: 1 };
function editBar(ui, view) {
  const { Box, Button, Text } = ui;
  const words = hubWords();
  if (!view.isEditing) {
    return h(Box, {
      key: "edit",
      flexDirection: "row",
      alignItems: "center",
      columnGap: 2,
      ...view.surface === "desktop" ? DESKTOP_FOOT : {}
    }, h(Box, {
      flexGrow: 1
    }), h(Button, {
      key: "customize",
      label: words.customize,
      plain: true,
      dimColor: true,
      onPress: () => view.actions.onEdit(true)
    }));
  }
  return h(Box, {
    key: "edit",
    flexDirection: "column",
    rowGap: 1
  }, h(Text, {
    key: "edit-line",
    dimColor: true
  }, words.editLine), h(Box, {
    key: "edit-buttons",
    flexDirection: "row",
    columnGap: 1
  }, h(Button, {
    key: "customize-done",
    label: words.done,
    variant: "primary",
    onPress: () => view.actions.onEdit(false)
  }), h(Button, {
    key: "customize-reset",
    label: words.reset,
    variant: "secondary",
    onPress: () => view.actions.onReset()
  })));
}
const nowRows = (view) => view.isEditing ? [] : view.now;
function sectionRows(view) {
  const lifted = new Set(nowRows(view).map((item) => item.row.entry.pane));
  return view.rows.filter((row) => !lifted.has(row.entry.pane));
}
function groupsOf$1(view) {
  const words = hubWords();
  const rows = sectionRows(view);
  const sections = SECTIONS.map((section) => ({ key: section, label: words.sections[section], rows: inSection(rows, section), isHiddenGroup: false }));
  const hidden = view.isEditing && view.hidden.length > 0 ? [{ key: "hidden", label: words.hidden, rows: view.hidden, isHiddenGroup: true }] : [];
  return [...sections, ...hidden].filter((group) => group.rows.length > 0);
}
function rowShows(row, look) {
  const card = row.card === null ? null : { detail: row.card.detail, tone: row.card.tone };
  return { ...look, entry: row.entry, card };
}
function overlaid(ui, opts) {
  const { Box } = ui;
  return h(Box, {
    key: opts.key,
    alignSelf: "flex-start"
  }, opts.drawing, opts.controls);
}
function pressRow(ui, view, opts) {
  const { Svg } = ui;
  const { drawing, width, pane } = opts;
  const svg = h(Svg, {
    source: drawing.source,
    alt: drawing.alt,
    width,
    height: drawing.height
  });
  return PressRow$1(ui, { box: opts.box, key: opts.key, drawing: svg, onPress: () => view.actions.onOpen(pane) });
}
function desktopGroup(ui, view, opts) {
  const { Box } = ui;
  const { group, pen } = opts;
  const { width, theme } = pen;
  const buttonRoom = view.isEditing ? EDIT_BUTTON_ROOM : 0;
  const panes = group.isHiddenGroup ? null : group.rows.map((row) => row.entry.pane);
  const eyebrow = pen.keep(`eyebrow-${group.key}`, { width, theme, label: group.label }, (cue) => sectionSvg({ width, theme, label: group.label, cue }));
  return h(Box, {
    key: `section-${group.key}`,
    flexDirection: "column"
  }, pen.label(eyebrow, `eyebrow-${group.key}`), group.rows.map((row) => {
    const pane = row.entry.pane;
    const built = pen.keep(`row-${pane}`, rowShows(row, { width, theme, buttonRoom }), (cue) => hubRowSvg({ width, theme, row, buttonRoom, cue }));
    if (!view.isEditing && panes !== null)
      return pen.press({ box: `row-${pane}`, key: `open-${pane}`, drawing: built, pane });
    return overlaid(ui, { key: `row-${pane}`, drawing: pen.label(built, `svg-${pane}`), controls: rowControls(ui, view, { row, panes }) });
  }));
}
function desktopTree$1(ui, view) {
  const { Box, Svg } = ui;
  const width = hubWidth(view.columns);
  const { theme } = view;
  let order = 0;
  const pen = {
    width,
    theme,
    keep: (key, what, build) => {
      const at = order++;
      return view.stable.draw(key, what, (phase) => build({ phase, order: at }));
    },
    label: (drawing, key) => h(Svg, {
      key,
      source: drawing.source,
      alt: drawing.alt,
      width,
      height: drawing.height,
      isInteractive: true
    }),
    press: (opts) => pressRow(ui, view, { ...opts, width })
  };
  const head = pen.keep("head", { width, theme, meta: view.meta }, (cue) => hubHeadSvg({ width, theme, meta: view.meta, cue }));
  return h(Box, {
    flexDirection: "column"
  }, pen.label(head, "head"), nowDesktop(ui, nowRows(view), pen), groupsOf$1(view).map((group) => desktopGroup(ui, view, { group, pen })), firstRunRow(ui, view, pen), editBar(ui, view));
}
function terminalButtons(ui, view, opts) {
  const { Button } = ui;
  const { row, panes } = opts;
  const pane = row.entry.pane;
  const words = hubWords();
  if (panes === null)
    return h(Button, {
      key: `show-${pane}`,
      label: words.show,
      variant: "secondary",
      onPress: () => view.actions.onHide({ pane, isHidden: false })
    });
  if (!view.isEditing) {
    const hotkey = row.hotkey === null ? {} : { hotkey: row.hotkey };
    return h(Button, {
      key: `open-${pane}`,
      label: words.open,
      variant: "secondary",
      ...hotkey,
      onPress: () => view.actions.onOpen(pane)
    });
  }
  const up = panes.indexOf(pane) > 0 ? [h(Button, {
    key: `up-${pane}`,
    label: words.up,
    variant: "secondary",
    onPress: () => view.actions.onMove({ pane, panes })
  })] : [];
  return [...up, h(Button, {
    key: `hide-${pane}`,
    label: words.hide,
    variant: "secondary",
    onPress: () => view.actions.onHide({ pane, isHidden: true })
  })];
}
function terminalRow$1(ui, view, opts) {
  const { Box, Text } = ui;
  const { row } = opts;
  const card = row.card;
  const hasDetail = card !== null && card.detail !== "";
  const glyphColor = hasDetail ? GLYPH_COLOR[card.tone] : undefined;
  return h(Box, {
    key: `row-${row.entry.pane}`,
    flexDirection: "row",
    columnGap: 1
  }, glyphColor === undefined ? h(Text, {
    dimColor: true
  }, GLYPH[row.entry.icon]) : h(Text, {
    color: glyphColor
  }, GLYPH[row.entry.icon]), h(Text, {
    bold: true
  }, row.entry.title), row.entry.badge === null ? null : h(Text, {
    color: "permission"
  }, row.entry.badge), hasDetail ? detailText(ui, card.tone, card.detail) : h(Text, {
    dimColor: true,
    wrap: "truncate"
  }, row.entry.hint), h(Box, {
    flexGrow: 1
  }), terminalButtons(ui, view, opts));
}
function terminalTree$1(ui, view) {
  const { Box, Button, Text } = ui;
  const now = nowRows(view);
  const focus = view.focus;
  const said = now.length > 0 ? null : focus;
  const words = hubWords();
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, h(Box, {
    flexDirection: "row",
    columnGap: 2
  }, h(Text, {
    color: "claude",
    bold: true
  }, "modz"), focus === null ? h(Text, {
    dimColor: true
  }, words.idleTitle) : null, said === null ? null : h(Text, {
    dimColor: true
  }, `${words.now} · ${said.row.entry.title}`), said === null ? null : detailText(ui, said.tone, said.row.card?.detail ?? ""), h(Box, {
    flexGrow: 1
  }), h(Text, {
    dimColor: true
  }, view.meta)), focus === null || view.isEditing ? null : h(Button, {
    key: "open-focus",
    label: words.openPane(focus.row.entry.title),
    variant: "primary",
    onPress: () => view.actions.onOpen(focus.row.entry.pane)
  }), nowTerminal(ui, now, (row) => terminalButtons(ui, view, { row, panes: [] })), groupsOf$1(view).map((group) => {
    const panes = group.isHiddenGroup ? null : group.rows.map((row) => row.entry.pane);
    return h(Box, {
      key: `section-${group.key}`,
      flexDirection: "column"
    }, h(Text, {
      bold: true,
      dimColor: true
    }, group.label), group.rows.map((row) => terminalRow$1(ui, view, { row, panes })));
  }), firstRun(ui, view), editBar(ui, view));
}
function hubTree(ui, view) {
  return view.surface === "desktop" && "Svg" in ui ? desktopTree$1(ui, view) : terminalTree$1(ui, view);
}

const ENGLISH = {
  words: new Set("the a an and of to is are was were be been it its that which you your we they there their has have had will would can could should not but on at by our this these those than".split(" "))
};
const TURKISH = {
  words: new Set("ve bir bu şu o da de ki ile için gibi daha çok ama veya ya mi mı mu mü ne var yok olan olarak değil kadar sonra önce her en ben sen biz siz".split(" ")),
  letters: /[çğıöşü]/
};
const NAMED = [
  { pattern: /^(en|english|ingilizce)\b/i, target: undefined },
  { pattern: /^(tr|turkish|türkçe|turkce)\b/i, target: { name: "Turkish", profile: TURKISH } }
];
const MIN_WORDS = 30;
const SAMPLE_CHARS = 4000;
const PROSE_SHARE = 0.2;
function targetOf$1(opts) {
  if (typeof opts.setting === "string" && opts.setting.trim() !== "") {
    const name = opts.setting.trim();
    const named = NAMED.find((entry) => entry.pattern.test(name));
    return named ? named.target : { name };
  }
  return opts.uiLang === "tr" ? { name: "Turkish", profile: TURKISH } : undefined;
}
const wordsOf$2 = (text) => text.slice(0, SAMPLE_CHARS).toLowerCase().match(/\p{L}+/gu) ?? [];
function shareOf(words, profile) {
  const hits = words.filter((word) => profile.words.has(word) || profile.letters?.test(word) === true).length;
  return hits / words.length;
}
function needsReminder(opts) {
  const words = wordsOf$2(opts.text);
  if (words.length < MIN_WORDS || shareOf(words, ENGLISH) < PROSE_SHARE)
    return false;
  return opts.target.profile === undefined || shareOf(words, opts.target.profile) < PROSE_SHARE;
}
const reminderOf = (target) => `Reply in ${target.name}, the user's language; keep code, paths and identifiers as they are. ` + `Write each tool call's description in ${target.name} too, in plain words.`;
const whyReminderOf = (target) => {
  const language = target === undefined ? "the user's language" : target.name;
  return `The person follows your work step by step and has never coded. Before each tool call or batch of calls, write ` + `one short sentence in ${language} (at most 15 words, no sizes or file lists) saying what you are about to do and why, in everyday words. ` + `Write each tool call's description the same way: what it does and what for. ` + `End the turn with a short summary they take in at a glance: at most four lines, each one fact (what you did, ` + `the result, what is left or needs them). When the work had three or more parts or used helper agents, put a ` + `small text tree above the summary: the job, its parts with ✓ or ✗, and who did each part.`;
};

let armed;
async function languageSetting($) {
  try {
    return (await $.settings.read()).language;
  } catch (cause) {
    $.ui.log(`modz: the language setting could not be read: ${String(cause)}`, { to: "debug" });
    return;
  }
}
const MAIN = "main";
const unasked = new Set;
function wireLanguageKeeper(on, options) {
  const keepsLanguage = options.keepReplyLanguage !== false;
  const asksWhy = options.sayWhy === true;
  if (!keepsLanguage && !asksWhy)
    return;
  on("turn.start", async ($, e, next) => {
    const agentId = e.agentId;
    if (asksWhy)
      unasked.add(agentId ?? MAIN);
    if (agentId === undefined)
      armed = targetOf$1({ setting: await languageSetting($), uiLang: lang() });
    return next(e);
  });
  on("tool.call", async (_$, e, next) => {
    const result = await next(e);
    if (next.origin.plugin !== "engine")
      return result;
    const why = asksWhy && unasked.delete(e.agentId ?? MAIN) ? [whyReminderOf(armed)] : [];
    const target = armed;
    const needsLanguage = keepsLanguage && target !== undefined && e.agentId === undefined && typeof result.text === "string" && needsReminder({ text: result.text, target });
    if (needsLanguage)
      armed = undefined;
    const added = [...why, ...needsLanguage && target !== undefined ? [reminderOf(target)] : []];
    if (added.length === 0 || result.deny !== undefined)
      return result;
    return { ...result, context: [...result.context ?? [], ...added] };
  });
}

const PX_PER_COLUMN$2 = 9;
const WIDTH_MIN = 320;
const WIDTH_MAX = 900;
function groupsOf(mods) {
  return GROUPS.map((group) => [group, mods.filter((mod) => mod.group === group)]).filter(([, list]) => list.length > 0);
}
function stateOf$1(mod) {
  const words = catalogWords();
  if (!mod.isHealthy)
    return { glyph: "✕", color: "error", word: words.brokenWord };
  if (mod.isEnabled === null)
    return { glyph: "◌", color: "subtle", word: "" };
  return mod.isEnabled ? { glyph: "●", color: "success", word: "" } : { glyph: "○", color: "subtle", word: words.offWord };
}
function terminalRow(ui, mod) {
  const { Box, Text } = ui;
  const state = stateOf$1(mod);
  return h(Box, {
    key: `mod-${mod.name}`,
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    color: state.color
  }, state.glyph), h(Text, {
    bold: true,
    dimColor: mod.isEnabled === false
  }, mod.name), mod.version === null ? null : h(Text, {
    dimColor: true
  }, `v${mod.version}`), state.word === "" ? null : h(Text, {
    color: state.color
  }, state.word), h(Box, {
    flexGrow: 1
  }), h(Text, {
    dimColor: true,
    wrap: "truncate"
  }, placeLine(mod))), h(Box, {
    paddingLeft: 2
  }, mod.isHealthy ? h(Text, {
    dimColor: true,
    wrap: "truncate"
  }, mod.description) : h(Text, {
    color: "error",
    wrap: "truncate"
  }, mod.description)));
}
function installRow(ui, view, install) {
  const { Box, Button, Text } = ui;
  return h(Box, {
    key: `install-${install.mod}`,
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    bold: true
  }, install.mod), h(Text, {
    dimColor: true,
    wrap: "truncate"
  }, install.summary)), h(Box, {
    flexDirection: "row",
    columnGap: 1,
    alignItems: "center"
  }, h(Button, {
    key: `copy-${install.mod}`,
    label: catalogWords().copy,
    variant: "secondary",
    onPress: (press) => view.onCopy(install.command, press)
  }), h(Text, null, install.command)));
}
const DESKTOP_INSET = { paddingX: 2 };
function installSection(ui, view, head) {
  const { Box, Text } = ui;
  const installs = installsOf(view.market);
  if (installs.length === 0)
    return null;
  return h(Box, {
    key: "install",
    flexDirection: "column"
  }, head, h(Box, {
    flexDirection: "column",
    rowGap: 1,
    ...view.surface === "desktop" ? DESKTOP_INSET : {}
  }, h(Text, {
    dimColor: true
  }, catalogWords().installLine), installs.map((install) => installRow(ui, view, install))));
}
function terminalGuide(ui, guide) {
  const { Box, Text } = ui;
  return h(Box, {
    key: `guide-${guide.mod}`,
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    bold: true
  }, guide.mod), h(Text, null, commandsLine(guide))), guide.options.length === 0 ? null : h(Box, {
    paddingLeft: 2
  }, h(Text, {
    dimColor: true,
    wrap: "truncate"
  }, catalogWords().options(guide.options.join(", ")))));
}
function terminalTree(ui, view) {
  const { Box, Text } = ui;
  const health = healthOf(view.market.mods);
  const words = catalogWords();
  const guides = guideOf(view.market, view.commands);
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, h(Box, {
    flexDirection: "row",
    columnGap: 2
  }, h(Text, {
    color: "claude",
    bold: true
  }, words.allMods), h(Text, null, headline$1(view.market.mods)), h(Box, {
    flexGrow: 1
  }), health.isBad ? h(Text, {
    color: "error"
  }, health.text) : h(Text, {
    dimColor: true
  }, health.text)), installSection(ui, view, h(Text, {
    bold: true,
    dimColor: true
  }, `${words.install} · ${installsOf(view.market).length}`)), guides.length === 0 ? null : h(Box, {
    key: "guide",
    flexDirection: "column"
  }, h(Text, {
    bold: true,
    dimColor: true
  }, `${words.guide} · ${guides.length}`), guides.map((guide) => terminalGuide(ui, guide))), groupsOf(view.market.mods).map(([group, list]) => h(Box, {
    key: `group-${group}`,
    flexDirection: "column"
  }, h(Text, {
    bold: true,
    dimColor: true
  }, `${words.groups[group]} · ${list.length}`), list.map((mod) => terminalRow(ui, mod)))));
}
function desktopTree(ui, view) {
  const { Box, Svg } = ui;
  const width = Math.max(WIDTH_MIN, Math.min(WIDTH_MAX, view.columns * PX_PER_COLUMN$2 - PX_PER_COLUMN$2));
  const health = healthOf(view.market.mods);
  let order = 0;
  const draw = (key, what, build) => {
    const at = order++;
    const drawing = view.stable.draw(key, { width, theme: view.theme, what }, (phase) => build({ phase, order: at }));
    return h(Svg, {
      key,
      source: drawing.source,
      alt: drawing.alt,
      width,
      height: drawing.height,
      isInteractive: true
    });
  };
  const title = headline$1(view.market.mods);
  const words = catalogWords();
  const guides = guideOf(view.market, view.commands);
  const label = (key, text, count) => draw(`eyebrow-${key}`, [text, count], (cue) => labelSvg({ width, theme: view.theme, label: text, count, cue }));
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, draw("head", [title, health], (cue) => headSvg$1({ width, theme: view.theme, title, meta: health.text, metaRole: health.isBad ? "danger" : null, cue })), installSection(ui, view, label("install", words.install, installsOf(view.market).length)), guides.length === 0 ? null : h(Box, {
    key: "guide",
    flexDirection: "column"
  }, label("guide", words.guide, guides.length), guides.map((guide) => h(Box, {
    key: `guide-${guide.mod}`
  }, draw(`guide-row-${guide.mod}`, guide, (cue) => guideSvg({ width, theme: view.theme, guide, cue }))))), groupsOf(view.market.mods).map(([group, list]) => h(Box, {
    key: `group-${group}`,
    flexDirection: "column"
  }, draw(`eyebrow-${group}`, [group, list.length], (cue) => groupSvg({ width, theme: view.theme, group, count: list.length, cue })), list.map((mod) => h(Box, {
    key: `mod-${mod.name}`
  }, draw(`row-${mod.name}`, mod, (cue) => rowSvg$2({ width, theme: view.theme, mod, cue })))))));
}
const modzTree = (ui, view) => withHome(ui, catalogTree(ui, view), view.onHome);
function catalogTree(ui, view) {
  const { Box, Text } = ui;
  if (view.market.mods.length === 0) {
    const words = catalogWords();
    return h(Box, {
      flexDirection: "column"
    }, h(Text, {
      color: "claude",
      bold: true
    }, words.allMods), h(Text, null, words.emptyTitle), h(Text, {
      dimColor: true
    }, words.emptyLine));
  }
  return view.surface === "desktop" ? desktopTree(ui, view) : terminalTree(ui, view);
}

let current$1 = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current$1 = langOf(value);
  return current$1;
}
const pick$1 = (table) => table[current$1];
const upper$1 = (text) => text.toLocaleUpperCase(current$1);

const FILL$1 = /<rect\b[^>]*\bdata-m-fill\b[^>]*>/g;
const DONE$1 = /<path\b[^>]*\bdata-m-done\b[^>]*>/g;
const HAS_DONE$1 = /\bdata-m-done\b/;
const WIDTH$2 = /\swidth="([\d.]+)"/;
const CLASS$1 = /\sclass="([^"]*)"/;
const STYLE$1 = /\sstyle="([^"]*)"/;
const MIN_RATIO_STEP$1 = 0.02;
const RATIO_DIGITS$1 = 3;
const widthOf$1 = (tag) => Number(WIDTH$2.exec(tag)?.[1] ?? 0);
function withClass$1(tag, name, extra = "") {
  const tagged = CLASS$1.test(tag) ? tag.replace(CLASS$1, (_, classes) => ` class="${classes} ${name}"`) : tag.replace(/\s*\/?>$/, ` class="${name}"$&`);
  return tagged.replace(/\s*\/?>$/, `${extra}$&`);
}
function slideFills$1(before, now) {
  const old = before.match(FILL$1) ?? [];
  if (old.length !== (now.match(FILL$1) ?? []).length)
    return now;
  let index = 0;
  return now.replace(FILL$1, (tag) => {
    const was = old[index++];
    const from = was === undefined ? 0 : widthOf$1(was);
    const to = widthOf$1(tag);
    if (from <= 0 || to <= 0 || Math.abs(from - to) / to < MIN_RATIO_STEP$1)
      return tag;
    const slide = `--m-from:${(from / to).toFixed(RATIO_DIGITS$1)}`;
    const styled = STYLE$1.test(tag) ? tag.replace(STYLE$1, (_, rules) => ` style="${slide};${rules}"`) : tag.replace(/\s*\/?>$/, ` style="${slide}"$&`);
    return withClass$1(styled, "m-from");
  });
}
function drawDone$1(before, now) {
  if (HAS_DONE$1.test(before))
    return now;
  return now.replace(DONE$1, (tag) => withClass$1(tag, "m-draw", ' pathLength="1"'));
}
function markChanges$1(before, now) {
  return drawDone$1(before, slideFills$1(before, now));
}

const STAGGER_MS$1 = 45;
const EASE$1 = "cubic-bezier(.2,.8,.2,1)";
const SHEEN$1 = "#A39E93";
const RULES$1 = {
  "m-in": `.m-in{animation:m-in .42s ${EASE$1} both}@keyframes m-in{from{opacity:0;transform:translateY(8px)}}`,
  "m-fade": `.m-fade{animation:m-fade .5s ${EASE$1} both}@keyframes m-fade{from{opacity:0}}`,
  "m-grow": `.m-grow{transform-box:fill-box;transform-origin:left center;animation:m-grow .7s ${EASE$1} both}@keyframes m-grow{from{transform:scaleX(0)}}`,
  "m-px": `.m-px{transform-box:fill-box;transform-origin:center;animation:m-px .34s ${EASE$1} both}@keyframes m-px{from{opacity:0;transform:translateY(-10px) scale(.6)}}`,
  "m-flash": ".m-flash{opacity:0;animation:m-flash 1.6s ease-out both}@keyframes m-flash{from{opacity:.9}to{opacity:0}}",
  "m-from": `.m-from{transform-box:fill-box;transform-origin:left center;animation:m-from .32s ${EASE$1} both}@keyframes m-from{from{transform:scaleX(var(--m-from))}}`,
  "m-draw": `.m-draw{stroke-dasharray:1;animation:m-draw .32s ${EASE$1} .12s both}@keyframes m-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}`,
  "m-breathe": ".m-breathe{animation:m-breathe 1.8s ease-in-out infinite}@keyframes m-breathe{50%{opacity:.4}}",
  "m-ring": ".m-ring{transform-box:fill-box;transform-origin:center;animation:m-ring 1.8s ease-out infinite}@keyframes m-ring{from{opacity:.55;transform:scale(1)}to{opacity:0;transform:scale(2.8)}}",
  "m-wash": `.m-wash{fill:#8E8A80;opacity:0;transition:opacity .12s ${EASE$1}}svg:hover .m-wash{opacity:.12}`,
  "m-tile": `.m-tile{transform-box:fill-box;transform-origin:center;transition:transform .2s ${EASE$1}}svg:hover .m-tile{transform:translateY(-1px) scale(1.06)}`
};
const REDUCED$2 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function motionCss$1(body) {
  const used = Object.keys(RULES$1).filter((name) => new RegExp(`\\b${name}\\b`).test(body));
  return used.length === 0 ? "" : `${used.map((name) => RULES$1[name]).join("")}${REDUCED$2}`;
}
Object.values(RULES$1).join("");
const isEntering$1 = (cue) => cue.phase === "enter";
function entering$1(body, cue, kind = "in") {
  if (!isEntering$1(cue))
    return body;
  return `<g class="m-${kind}" style="animation-delay:${cue.order * STAGGER_MS$1}ms">${body}</g>`;
}
const FLASH$1 = `<rect x="0" y="0" width="100%" height="100%" rx="10" fill="${SHEEN$1}" fill-opacity=".22" class="m-flash"/>`;
const WASH$1 = '<rect x="0" y="0" width="100%" height="100%" rx="10" class="m-wash"/>';

function stableDrawings$1() {
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

const TAG_WIDTH$1 = /^[\s\S]*?<svg\b[^>]*?\swidth="([\d.]+)"/;
const SVG$1 = /^([\s\S]*?<svg\b[^>]*>)([\s\S]*)(<\/svg>\s*)$/;
const SCHEME$2 = "<style>:root{color-scheme:light dark}</style>";
const SAYS_SCHEME$1 = /(^|[^-\w])color-scheme\s*:/;
const PASS_MS$1 = 120;
const MAX_ORDER$1 = 12;
const LIVE_MS$1 = 30000;
function animate$1(source, spec) {
  const moved = spec.cue.phase === "change" && spec.before !== undefined ? markChanges$1(spec.before, source) : source;
  const parts = SVG$1.exec(moved);
  if (parts === null)
    return source;
  const [, open, inner = "", close] = parts;
  const scheme = SAYS_SCHEME$1.test(inner) ? "" : SCHEME$2;
  const lit = `${spec.isRow === true ? WASH$1 : ""}${spec.cue.phase === "change" && spec.isLive !== true ? FLASH$1 : ""}${inner}`;
  const body = entering$1(lit, spec.cue);
  const css = motionCss$1(body);
  return `${open}${scheme}${css === "" ? "" : `<style>${css}</style>`}${body}${close}`;
}
function paneMotion$1() {
  const drawings = stableDrawings$1();
  const shown = new Map;
  const pass = { at: Number.NEGATIVE_INFINITY, entered: 0 };
  const begin = () => {
    const now = Date.now();
    if (now - pass.at > PASS_MS$1)
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
      const now = { shows: opts.shows === undefined ? what : JSON.stringify(opts.shows), width: String(pic.width ?? TAG_WIDTH$1.exec(pic.source)?.[1]), source: pic.source };
      const source = drawings.draw(key, what, (built) => {
        const order = built === "enter" ? Math.min(MAX_ORDER$1, pass.entered++) : 0;
        const before = shown.get(key);
        const isQuiet = before !== undefined && (before.shows === now.shows || before.width !== now.width);
        const phase = built === "change" && isQuiet ? "still" : built;
        const lastChange = before?.changedAt ?? Number.NEGATIVE_INFINITY;
        const isLive = phase === "change" && pass.at - lastChange < LIVE_MS$1;
        shown.set(key, { ...now, changedAt: phase === "change" ? pass.at : lastChange });
        return animate$1(pic.source, { cue: { phase, order }, isRow: opts.isRow, before: before?.source, isLive });
      });
      return { ...pic, source, isInteractive: true };
    }
  };
}

const BLANK = "ㅤ";
const CELL_PX = 11.9;
const BUTTON_PX = 28;
const RUN_SPAN = 2;
const LINE_SPAN = "400%";
function PressCover(ui, o) {
  const { Box, Button } = ui;
  const lines = Math.max(1, Math.floor(o.height / (BUTTON_PX * 2)));
  const label = BLANK.repeat(Math.ceil(o.width * RUN_SPAN / CELL_PX));
  const hotkey = o.hotkey === undefined ? {} : { hotkey: o.hotkey };
  return h(Box, {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "column",
    justifyContent: "center",
    overflow: "hidden"
  }, Array.from({ length: lines }, (_, i) => h(Box, {
    key: `${o.key}~line${i}`,
    flexDirection: "row",
    width: LINE_SPAN,
    marginLeft: -1,
    flexShrink: 0
  }, h(Button, {
    key: i === 0 ? o.key : `${o.key}~${i}`,
    label,
    plain: true,
    ...i === 0 ? hotkey : {},
    onPress: o.onPress
  }))));
}
const STILL = "<style>*{animation:none!important;transition:none!important}</style>";
const stillSource = (source) => source.replace(/<\/svg>\s*$/, `${STILL}</svg>`);
function stillSvg(ui, drawing) {
  if (drawing.type !== "Svg")
    return drawing;
  const { Svg } = ui;
  const { key, source, alt, width, height } = drawing.props;
  return h(Svg, {
    key,
    source: stillSource(source),
    alt,
    width,
    height
  });
}
const FALLBACK_PX = 52;
const FALLBACK_WIDTH_PX = 360;
function PressRow(ui, o) {
  const { Box } = ui;
  const props = o.drawing.type === "Svg" ? o.drawing.props : {};
  const width = props.width ?? FALLBACK_WIDTH_PX;
  const height = props.height ?? FALLBACK_PX;
  return h(Box, {
    key: o.box,
    alignSelf: "flex-start"
  }, stillSvg(ui, o.drawing), PressCover(ui, { key: o.key, width, height, hotkey: o.hotkey, onPress: o.onPress }));
}

const AUTO = { mode: "auto", isLight: false };
const NEUTRALS = ["card", "inset", "line", "strong", "track", "hi", "mid", "lo"];
const ROLES$2 = ["tide", "kiln", "iris", "moss", "amber", "flare", "orchid"];
const DARK$2 = {
  card: "#1F1F1C",
  inset: "#171715",
  line: "#2E2E2A",
  strong: "#45443F",
  track: "#34332F",
  hi: "#F0EEE8",
  mid: "#C2BEB4",
  lo: "#8E8A80",
  tide: { fg: "#7FB6E8", tint: "#1E2B37", line: "#2F4A63" },
  kiln: { fg: "#E58A5F", tint: "#38251D", line: "#6A3E2D" },
  iris: { fg: "#B19CF3", tint: "#29243D", line: "#4A3F75" },
  moss: { fg: "#6FC593", tint: "#1B2F25", line: "#2F5A42" },
  amber: { fg: "#E9B949", tint: "#332D19", line: "#66552A" },
  flare: { fg: "#F2727F", tint: "#3B2023", line: "#74343C" },
  orchid: { fg: "#E07BC0", tint: "#351F2E", line: "#6B3A5C" }
};
const LIGHT$2 = {
  card: "#FFFFFF",
  inset: "#F6F4EF",
  line: "#E4E0D6",
  strong: "#CFC9BC",
  track: "#ECE8DF",
  hi: "#1C1B19",
  mid: "#4F4B44",
  lo: "#77726A",
  tide: { fg: "#2464A0", tint: "#E7F0F9", line: "#B9D3EC" },
  kiln: { fg: "#A94A26", tint: "#FBEDE6", line: "#EFC6B4" },
  iris: { fg: "#6243C4", tint: "#F0ECFC", line: "#CFC3F3" },
  moss: { fg: "#1F6E43", tint: "#E4F4EA", line: "#B5DEC4" },
  amber: { fg: "#8A6000", tint: "#FBF2D9", line: "#EBD48F" },
  flare: { fg: "#C0263A", tint: "#FCE8EA", line: "#F1B9C0" },
  orchid: { fg: "#A8337F", tint: "#FBE9F4", line: "#EDBFDC" }
};
const THEME_KEY = {
  tide: "suggestion",
  kiln: "claude",
  iris: "permission",
  moss: "success",
  amber: "warning",
  flare: "error",
  orchid: "merged"
};
const varsOf = (palette) => [
  ...NEUTRALS.map((name) => `--${name}:${palette[name]}`),
  ...ROLES$2.flatMap((role) => [`--${role}:${palette[role].fg}`, `--${role}-t:${palette[role].tint}`, `--${role}-l:${palette[role].line}`])
].join(";");
function themeCss() {
  return `svg,.t-dark{${varsOf(DARK$2)}}.t-light{${varsOf(LIGHT$2)}}@media (prefers-color-scheme: light){.t-auto{${varsOf(LIGHT$2)}}}`;
}
function boxColor(theme, role, part = "fg") {
  if (theme.mode === "auto")
    return THEME_KEY[role];
  return (theme.isLight ? LIGHT$2 : DARK$2)[role][part];
}

const SANS = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`;
const MONO$1 = `ui-monospace, 'SF Mono', Menlo, monospace`;
const PX_PER_COLUMN$1 = 9;
const MONO_EM$1 = 0.6;
const BOLD_FROM = 600;
const BOLD_WIDEN$1 = 1.06;
const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const MOTION$1 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
const esc = (text) => text.replace(/[&<>"]/g, (ch) => ENTITIES[ch] ?? ch);
const px = (value) => String(Math.round(value * 10) / 10);
const NARROW_CHAR = /[\s.,:;'|!il1()[\]ıjtf`]/;
const WIDE_CHAR = /[A-ZÇĞİÖŞÜmwMW@%]/;
const NARROW_EM$1 = 0.3;
const WIDE_EM$1 = 0.72;
const PLAIN_EM = 0.56;
function charEm(ch) {
  if (NARROW_CHAR.test(ch))
    return NARROW_EM$1;
  return WIDE_CHAR.test(ch) ? WIDE_EM$1 : PLAIN_EM;
}
function measure$1(text, font) {
  const chars = [...text];
  const em = font.isMono === true ? chars.length * MONO_EM$1 : chars.reduce((sum, ch) => sum + charEm(ch), 0);
  const widen = (font.weight ?? 0) >= BOLD_FROM ? BOLD_WIDEN$1 : 1;
  return em * font.size * widen;
}
function cut(text, box) {
  const { width, font, isFromStart } = box;
  if (measure$1(text, font) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 1 && measure$1(`${chars.join("")}…`, font) > width) {
    if (isFromStart)
      chars.shift();
    else
      chars.pop();
  }
  return isFromStart ? `…${chars.join("")}` : `${chars.join("")}…`;
}
const fit$1 = (text, width, font) => cut(text, { width, font, isFromStart: false });
const fitStart = (text, width, font) => cut(text, { width, font, isFromStart: true });
function wrap$1(text, width, spec) {
  const lines = [];
  let current = "";
  for (const word of text.split(/\s+/).filter((part) => part !== "")) {
    const next = current === "" ? word : `${current} ${word}`;
    if (current === "" || measure$1(next, spec.font) <= width)
      current = next;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current !== "")
    lines.push(current);
  if (lines.length <= spec.maxLines)
    return lines.map((line) => fit$1(line, width, spec.font));
  const kept = lines.slice(0, spec.maxLines);
  const last = kept.length - 1;
  return kept.map((line, index) => index === last ? fit$1(`${line} ${lines.slice(spec.maxLines).join(" ")}`, width, spec.font) : line);
}
function svgWidth(columns, range) {
  const room = (columns - (range.reserve ?? 0)) * PX_PER_COLUMN$1;
  return Math.round(Math.max(range.min, Math.min(range.max, room)));
}
function svgDoc$1(spec) {
  const { width, height } = spec;
  const style = `${themeCss()}text{font-family:${SANS};font-variant-numeric:tabular-nums}.mono{font-family:${MONO$1}}${MOTION$1}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="t-${spec.mode}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><style>${style}</style>${spec.body}</svg>`;
}
function text(spec) {
  const attrs = [`x="${px(spec.x)}"`, `y="${px(spec.y)}"`, `font-size="${spec.size}"`];
  if (spec.weight !== undefined)
    attrs.push(`font-weight="${spec.weight}"`);
  if (spec.anchor !== undefined && spec.anchor !== "start")
    attrs.push(`text-anchor="${spec.anchor}"`);
  if (spec.isMono === true)
    attrs.push('class="mono"');
  return `<text ${attrs.join(" ")} style="fill:var(--${spec.ink})">${esc(spec.text)}</text>`;
}
function runs(spec) {
  const spans = spec.parts.map((part) => {
    const weight = part.weight === undefined ? "" : ` font-weight="${part.weight}"`;
    const mono = part.isMono === true ? ' class="mono"' : "";
    return `<tspan${weight}${mono} style="fill:var(--${part.ink})">${esc(part.text)}</tspan>`;
  });
  return `<text x="${px(spec.x)}" y="${px(spec.y)}" font-size="${spec.size}">${spans.join("")}</text>`;
}
function rect(spec) {
  const fill = spec.fill === undefined ? "fill:none" : `fill:var(--${spec.fill})`;
  const stroke = spec.stroke === undefined ? "" : `;stroke:var(--${spec.stroke})`;
  const cls = spec.className === undefined ? "" : ` class="${spec.className}"`;
  return `<rect${cls} x="${px(spec.x)}" y="${px(spec.y)}" width="${px(spec.w)}" height="${px(spec.h)}" rx="${spec.rx ?? 0}" style="${fill}${stroke}"/>`;
}
function line(spec) {
  const dash = spec.dash === undefined ? "" : ` stroke-dasharray="${spec.dash}"`;
  return `<line x1="${px(spec.x1)}" y1="${px(spec.y1)}" x2="${px(spec.x2)}" y2="${px(spec.y2)}" stroke-width="1"${dash} style="stroke:var(--${spec.ink})"/>`;
}
function fileBadge$1(spec) {
  const name = spec.path.split("/").pop() ?? spec.path;
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1) : "";
  const label = upper$1(ext === "" ? "·" : ext.slice(0, 3));
  return rect({ x: spec.x, y: spec.y, w: 26, h: 16, rx: 4, fill: "track" }) + text({ size: 9.5, weight: 600, isMono: true, x: spec.x + 13, y: spec.y + 11.5, text: label, ink: "lo", anchor: "middle" });
}
function monogram(spec) {
  return rect({ x: spec.x, y: spec.y, w: 16, h: 16, rx: 4, fill: "track" }) + text({ size: 10, weight: 600, isMono: true, x: spec.x + 8, y: spec.y + 11.5, text: spec.glyph, ink: "lo", anchor: "middle" });
}
function bar$1(spec) {
  const radius = spec.height / 2;
  const track = rect({ x: spec.x, y: spec.y, w: spec.width, h: spec.height, rx: radius, fill: "track" });
  let left = spec.x;
  const fills = spec.parts.filter((part) => part.value > 0).map((part) => {
    const width = Math.max(spec.height, spec.width * part.value / Math.max(1, spec.total) - 2);
    const drawn = rect({ x: left, y: spec.y, w: width, h: spec.height, rx: radius, fill: part.ink });
    left += width + 2;
    return drawn;
  });
  return track + fills.join("");
}

const SECOND$1 = 1000;
const MINUTE$1 = 60 * SECOND$1;
const HOUR$1 = 60 * MINUTE$1;
const DAY = 24 * HOUR$1;
const plural$1 = (count, one, many) => `${count} ${count === 1 ? one : many}`;
function agoEn(ms) {
  if (ms < MINUTE$1)
    return "just now";
  if (ms < HOUR$1)
    return `${Math.round(ms / MINUTE$1)}m ago`;
  if (ms < DAY)
    return `${Math.round(ms / HOUR$1)}h ago`;
  return `${Math.round(ms / DAY)}d ago`;
}
function agoTr(ms) {
  if (ms < MINUTE$1)
    return `${Math.max(0, Math.round(ms / SECOND$1))} sn önce`;
  if (ms < HOUR$1)
    return `${Math.round(ms / MINUTE$1)} dk önce`;
  if (ms < DAY)
    return `${Math.round(ms / HOUR$1)} sa önce`;
  return `${Math.round(ms / DAY)} g önce`;
}
const EN$1 = {
  title: "Restore points",
  ago: agoEn,
  hubDetail: (count) => `${count} saved`,
  headerMeta: (count, ago) => `${count} saved · newest ${ago}`,
  newest: (ago) => `newest ${ago}`,
  emptyLead: "No restore points yet",
  emptyRest: "one is saved quietly before the first file change",
  turnsSaved: (turns) => `${plural$1(turns, "turn", "turns")} saved`,
  turn: (number) => `Turn ${number}`,
  saved: "Restore point",
  beforeUndo: "Before undo",
  safetyPrefix: "before undo: ",
  undo: "Undo",
  undoMeta: "the current state is saved first",
  question: (target) => `Go back to before ${target}?`,
  changed: (count) => `${plural$1(count, "file", "files")} will change`,
  confirm: (count) => ({ label: `Restore ${plural$1(count, "file", "files")}`, hotkey: "r" }),
  cancel: { label: "Cancel", hotkey: "c" },
  redo: "Redo",
  files: (count) => `+${plural$1(count, "file", "files")}`,
  undone: "undone",
  willDelete: "will be deleted",
  moreFiles: (count) => `+ ${plural$1(count, "more file", "more files")}`,
  more: (count) => `+ ${count} more`,
  toRestore: (count) => `${count} to restore`,
  toDelete: (count) => `${count} to delete`,
  lines: "lines",
  summary: (restore, remove) => [`${plural$1(restore, "file", "files")} will be restored`, remove > 0 ? `${plural$1(remove, "new file", "new files")} will be deleted` : ""].filter(Boolean).join(", ") + ". The current state is saved first.",
  checking: "Checking…",
  undoing: "Undoing…",
  noRepo: "This folder has no version history (git).",
  alreadyThere: "The files already match this restore point.",
  failed: "Couldn't undo; the reason is in Claude Code's log (debug log).",
  commitsKept: (count) => `${plural$1(count, "saved version", "saved versions")} (commits) made since this point stay in the history; the undo shows up as new changes on top.`,
  indexBack: "Files marked for the next saved version (staged) go back as they were too.",
  ignoredKept: "Files git is told to skip (such as the secrets file .env) are not covered and stay as they are.",
  restored: (count, target) => `Restored ${plural$1(count, "file", "files")} to before ${target}.`,
  toggled: (isOn) => `restore points ${isOn ? "on" : "off"}`,
  toggleLine: "Quietly saves a restore point before each turn's first file change: on/off",
  paneLine: "Lists the restore points; undoes a turn",
  promptFallback: "turn"
};
const TR$1 = {
  title: "Geri dönüş noktaları",
  ago: agoTr,
  hubDetail: (count) => `${count} nokta`,
  headerMeta: (count, ago) => `${count} nokta · en yenisi ${ago}`,
  newest: (ago) => `en yenisi ${ago}`,
  emptyLead: "Henüz geri dönüş noktası yok",
  emptyRest: "ilk dosya değişikliğinden önce sessizce alınır",
  turnsSaved: (turns) => `${turns} tur kayıtlı`,
  turn: (number) => `Tur ${number}`,
  saved: "Geri dönüş noktası",
  beforeUndo: "Geri almadan önce",
  safetyPrefix: "geri almadan önce: ",
  undo: "Geri al",
  undoMeta: "şimdiki hal önce kaydedilir",
  question: (target) => `${target} öncesine dönülsün mü?`,
  changed: (count) => `${count} dosya değişecek`,
  confirm: (count) => ({ label: `${count} dosyayı geri al`, hotkey: "g" }),
  cancel: { label: "Vazgeç", hotkey: "v" },
  redo: "Yinele",
  files: (count) => `+${count} dosya`,
  undone: "geri alındı",
  willDelete: "silinecek",
  moreFiles: (count) => `+${count} dosya daha`,
  more: (count) => `+${count} daha`,
  toRestore: (count) => `${count} geri yüklenecek`,
  toDelete: (count) => `${count} silinecek`,
  lines: "satır",
  summary: (restore, remove) => [`${restore} dosya geri yüklenecek`, remove > 0 ? `${remove} yeni dosya silinecek` : ""].filter(Boolean).join(", ") + ". Önce şimdiki hal kaydedilir.",
  checking: "Denetleniyor…",
  undoing: "Geri alınıyor…",
  noRepo: "Bu klasörün sürüm geçmişi (git) yok.",
  alreadyThere: "Dosyalar zaten bu noktadaki gibi.",
  failed: "Geri alınamadı; nedeni Claude Code günlüğünde (debug log).",
  commitsKept: (count) => `Bu noktadan sonraki ${count} kayıt (commit) geçmişte kalır; geri alma bunların üstüne yeni değişiklik olarak görünür.`,
  indexBack: "Sonraki kayda hazırlanan (staged) dosyalar da eski haline döner.",
  ignoredKept: "Git'in atladığı dosyalar (gizli ayar dosyası .env gibi) kapsanmaz, olduğu gibi kalır.",
  restored: (count, target) => `${count} dosya ${target} öncesine döndü.`,
  toggled: (isOn) => `geri dönüş noktaları ${isOn ? "açık" : "kapalı"}`,
  toggleLine: "Her turun ilk dosya değişikliğinden önce sessizce geri dönüş noktası alır: aç/kapa",
  paneLine: "Geri dönüş noktalarını listeler; bir turu geri alır",
  promptFallback: "tur"
};
const SAFETY_PREFIXES = [EN$1.safetyPrefix, TR$1.safetyPrefix];
const words$1 = () => pick$1({ en: EN$1, tr: TR$1 });

const HEAD_LEAD_Y = 18;
const HEAD_PAD_BOTTOM = 6;
const SUB_LINE_H = 18;
const LEAD = { size: 16, weight: 600 };
const SUB = { size: 12 };
const ROW_MIN_H = 48;
const ROW_PAD_BOTTOM = 10;
const DOT_X$2 = 8;
const DOT_Y = 15;
const TEXT_X = 26;
const TITLE_Y = 19;
const LABEL_Y = 38;
const LABEL_LINE_H = 17;
const LABEL_LINES = 2;
const CHIP = 16;
const CHIP_GAP = 4;
const RIGHT_GAP = 12;
const FILES_GAP = 10;
const TITLE$1 = { size: 13, weight: 560 };
const WHEN = { size: 13 };
const LABEL$1 = { size: 12 };
const META = { size: 11, isMono: true };
const STRIKE_FIT = 0.95;
const CHEVRON_ROOM = 28;
const CHEVRON_INSET = 18;
const drawing = (frame, spec) => ({ source: svgDoc$1({ width: frame.width, height: spec.height, mode: frame.mode, body: spec.body }), width: frame.width, height: spec.height, alt: spec.alt });
function headLines(room, spec) {
  const joiner = spec.joiner ?? " ";
  const isRestInline = spec.rest === "" || measure$1(`${spec.lead}${joiner}${spec.rest}`, LEAD) <= room;
  const rest = isRestInline ? [] : wrap$1(spec.rest, room, { font: SUB, maxLines: LABEL_LINES }).map((part) => ({ text: part, ink: "mid" }));
  const meta = spec.meta === "" ? [] : [{ text: fit$1(spec.meta, room, SUB), ink: "lo" }];
  return { inline: isRestInline && spec.rest !== "" ? `${joiner}${spec.rest}` : "", sub: [...rest, ...meta] };
}
function headSvg(frame, spec) {
  const room = frame.width;
  const lines = headLines(room, spec);
  const lead = fit$1(spec.lead, room, LEAD);
  const subs = lines.sub.map((part, index) => text({ ...SUB, x: 0, y: HEAD_LEAD_Y + SUB_LINE_H * (index + 1), text: part.text, ink: part.ink }));
  const body = runs({ x: 0, y: HEAD_LEAD_Y, size: LEAD.size, parts: [{ text: lead, ink: "hi", weight: LEAD.weight }, { text: lines.inline, ink: "mid", weight: 500 }] }) + subs.join("");
  const height = HEAD_LEAD_Y + SUB_LINE_H * lines.sub.length + HEAD_PAD_BOTTOM;
  const meta = spec.meta === "" ? "" : ` · ${spec.meta}`;
  const rest = spec.rest === "" ? "" : `${spec.joiner ?? " "}${spec.rest}`;
  return drawing(frame, { height, body, alt: `${spec.label}: ${spec.lead}${rest}${meta}` });
}
function dotOf(spec) {
  const { meta } = spec;
  if (meta.isSafety === true)
    return rect({ x: DOT_X$2 - 3.5, y: DOT_Y - 3.5, w: 7, h: 7, rx: 1.5, fill: "card", stroke: "lo" });
  if (meta.isUndone === true)
    return `<circle cx="${DOT_X$2}" cy="${DOT_Y}" r="4" stroke-dasharray="2 1.6" style="fill:var(--card);stroke:var(--lo)"/>`;
  if (spec.isNewest)
    return `<circle cx="${DOT_X$2}" cy="${DOT_Y}" r="4" style="fill:var(--kiln)"/>`;
  return `<circle cx="${DOT_X$2}" cy="${DOT_Y}" r="4" style="fill:var(--strong)"/>`;
}
function railOf(spec, height) {
  const top = spec.isFirst ? DOT_Y : 0;
  const bottom = spec.isLast ? DOT_Y : height;
  return top === bottom ? "" : line({ x1: DOT_X$2, y1: top, x2: DOT_X$2, y2: bottom, ink: "line" });
}
const filesText$1 = (meta) => meta.files === undefined || meta.files === 0 ? "" : words$1().files(meta.files);
function factsOf(meta, at) {
  const tools = meta.tools ?? [];
  const chipsW = tools.length === 0 ? 0 : tools.length * (CHIP + CHIP_GAP) - CHIP_GAP;
  const files = filesText$1(meta);
  const filesW = files === "" ? 0 : measure$1(files, META);
  const gap = chipsW > 0 && filesW > 0 ? FILES_GAP : 0;
  const chipsX = at.isCountFirst ? at.x + filesW + gap : at.x;
  const filesX = at.isCountFirst ? at.x : at.x + chipsW + gap;
  const chips = tools.map((glyph, index) => monogram({ x: chipsX + index * (CHIP + CHIP_GAP), y: at.y, glyph }));
  const label = files === "" ? "" : text({ ...META, x: filesX, y: at.y + 12, text: files, ink: meta.isUndone === true ? "lo" : "mid" });
  return { svg: chips.join("") + label, width: chipsW + gap + filesW };
}
const factsWidth = (meta) => factsOf(meta, { x: 0, y: 0, isCountFirst: false }).width;
const headWidth = (spec) => measure$1(spec.title, TITLE$1) + measure$1(`  ${spec.when}`, WHEN);
function rowFits(frame, spec) {
  const facts = factsWidth(spec.meta);
  return facts === 0 || TEXT_X + headWidth(spec) + RIGHT_GAP + facts + CHEVRON_ROOM <= frame.width;
}
function struck(spec) {
  const width = measure$1(spec.text, spec.font) * STRIKE_FIT;
  const y = spec.y - spec.font.size * 0.32;
  return line({ x1: spec.x - 1, y1: y, x2: spec.x + width + 1, y2: y, ink: "lo" });
}
const titleInkOf = (meta) => meta.isUndone === true ? "lo" : "hi";
const chevron = (x, y) => `<path d="M${x} ${y - 4.5}l4.5 4.5-4.5 4.5" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--lo)"/>`;
function rowSvg$1(frame, spec) {
  const { meta } = spec;
  const isUndone = meta.isUndone === true;
  const titleInk = titleInkOf(meta);
  const head = runs({ x: TEXT_X, y: TITLE_Y, size: TITLE$1.size, parts: [{ text: spec.title, ink: titleInk, weight: TITLE$1.weight }, { text: `  ${spec.when}`, ink: "lo", weight: 400 }] });
  const labels = wrap$1(spec.label, frame.width - TEXT_X - CHEVRON_ROOM, { font: LABEL$1, maxLines: LABEL_LINES });
  const labelY = (index) => LABEL_Y + index * LABEL_LINE_H;
  const body = labels.map((part, index) => text({ ...LABEL$1, x: TEXT_X, y: labelY(index), text: part, ink: isUndone ? "lo" : "mid" })).join("");
  const lastY = labelY(Math.max(0, labels.length - 1));
  const hasFacts = factsWidth(meta) > 0;
  const factsTop = spec.isStacked ? lastY + ROW_PAD_BOTTOM - 2 : TITLE_Y - 15;
  const facts = factsOf(meta, { x: spec.isStacked ? TEXT_X : frame.width - CHEVRON_ROOM - factsWidth(meta), y: factsTop, isCountFirst: !spec.isStacked });
  const bottom = spec.isStacked && hasFacts ? factsTop + CHIP : lastY;
  const height = Math.max(ROW_MIN_H, Math.ceil(bottom + ROW_PAD_BOTTOM));
  const strikes = isUndone ? [struck({ x: TEXT_X, y: TITLE_Y, text: spec.title, font: TITLE$1 }), ...labels.map((part, index) => struck({ x: TEXT_X, y: labelY(index), text: part, font: LABEL$1 }))].join("") : "";
  const all = railOf(spec, height) + dotOf(spec) + head + facts.svg + body + strikes + chevron(frame.width - CHEVRON_INSET, height / 2);
  const files = filesText$1(meta);
  return drawing(frame, { height, body: all, alt: `${words$1().undo}: ${spec.title}, ${spec.when}${isUndone ? `, ${words$1().undone}` : ""}${files === "" ? "" : `, ${files}`}: ${spec.label}` });
}
const STAT_LINE_Y = 17;
const STAT_NOTE_Y = 37;
const STAT_BAR_W = 60;
const STAT_GAP = 12;
const FILE_X = 34;
const FILE_ROW_H = 24;
const FILE_ROW_TALL = 38;
const FILE_NAME = { size: 12.5 };
const FILE_DIR = { size: 11 };
const TAG = { size: 11 };
const countsOf = (file) => `+${file.added} −${file.removed}`;
const rightOfFile = (file) => measure$1(countsOf(file), META) + (file.isRemoved ? measure$1(words$1().willDelete, TAG) + STAT_GAP : 0);
const fileFits = (frame, file) => FILE_X + measure$1(file.path, FILE_NAME) + STAT_GAP + rightOfFile(file) <= frame.width;
function fileRow$1(frame, file, at) {
  const countsW = measure$1(countsOf(file), META);
  const room = frame.width - FILE_X - STAT_GAP - rightOfFile(file);
  const cut = file.path.lastIndexOf("/");
  const name = at.isTall && cut >= 0 ? file.path.slice(cut + 1) : file.path;
  const folder = at.isTall && cut >= 0 ? file.path.slice(0, cut + 1) : "";
  const tag = file.isRemoved ? text({ ...TAG, x: frame.width - countsW - STAT_GAP, y: at.y + 15, text: words$1().willDelete, ink: "flare", anchor: "end" }) : "";
  const under = folder === "" ? "" : text({ ...FILE_DIR, x: FILE_X, y: at.y + 30, text: fitStart(folder, frame.width - FILE_X, FILE_DIR), ink: "lo" });
  return fileBadge$1({ x: 0, y: at.y + 3, path: file.path }) + text({ ...FILE_NAME, x: FILE_X, y: at.y + 15, text: fitStart(name, room, FILE_NAME), ink: "hi" }) + under + tag + runs({ x: frame.width - countsW, y: at.y + 15, size: META.size, parts: [{ text: `+${file.added}`, ink: countInk(file.added, "moss"), isMono: true }, { text: ` −${file.removed}`, ink: countInk(file.removed, "flare"), isMono: true }] });
}
const countInk = (count, ink) => count === 0 ? "lo" : ink;
const MORE_H$1 = 22;
function moreOf(pending, y) {
  const more = pending.restore + pending.remove - pending.files.length;
  if (more <= 0)
    return { svg: "", height: 0, text: "" };
  const said = words$1().moreFiles(more);
  return { svg: text({ size: 11.5, x: FILE_X, y: y + 15, text: said, ink: "lo" }), height: MORE_H$1, text: said };
}
function diffstatSvg(frame, pending) {
  const total = pending.added + pending.removed;
  const sumFont = { size: 13, isMono: true };
  const summary = runs({ x: 0, y: STAT_LINE_Y, size: sumFont.size, parts: [{ text: `+${pending.added}`, ink: "moss", weight: 650, isMono: true }, { text: ` −${pending.removed}`, ink: "flare", weight: 650, isMono: true }] });
  const sumW = measure$1(`+${pending.added} −${pending.removed}`, sumFont) + STAT_GAP;
  const blocks = bar$1({ x: sumW, y: STAT_LINE_Y - 8, width: STAT_BAR_W, height: 6, total: Math.max(1, total), parts: [{ value: pending.added, ink: "moss" }, { value: pending.removed, ink: "flare" }] });
  const parts = [words$1().toRestore(pending.restore), pending.remove > 0 ? words$1().toDelete(pending.remove) : ""].filter((part) => part !== "").join(" · ");
  const noteX = sumW + STAT_BAR_W + STAT_GAP;
  const isNoteBeside = noteX + measure$1(parts, { size: 11.5 }) <= frame.width;
  const note = text({ size: 11.5, x: isNoteBeside ? noteX : 0, y: isNoteBeside ? STAT_LINE_Y : STAT_NOTE_Y, text: parts, ink: "lo" });
  const statH = (isNoteBeside ? STAT_LINE_Y : STAT_NOTE_Y) + 13;
  const isTall = pending.files.some((file) => !fileFits(frame, file));
  const rowH = isTall ? FILE_ROW_TALL : FILE_ROW_H;
  const files = pending.files.map((file, index) => fileRow$1(frame, file, { y: statH + index * rowH, isTall }));
  const more = moreOf(pending, statH + pending.files.length * rowH);
  const height = statH + pending.files.length * rowH + more.height;
  const listed = [...pending.files.map((file) => file.path), ...more.text === "" ? [] : [more.text]].join(", ");
  return drawing(frame, { height, body: summary + blocks + note + files.join("") + more.svg, alt: `+${pending.added} −${pending.removed} ${words$1().lines}, ${parts}: ${listed}` });
}

const summaryText = (pending) => words$1().summary(pending.restore, pending.remove);
function confirmText(ui, pending, opts) {
  const { Box, Text, Button } = ui;
  const more = pending.restore + pending.remove - pending.files.length;
  const said = words$1();
  const confirm = confirmOf(pending);
  return h(Box, {
    flexDirection: "column",
    borderStyle: "single",
    borderColor: "warning",
    paddingX: 1
  }, h(Text, {
    color: "warning",
    bold: true,
    wrap: "truncate"
  }, `${questionOf(pending)} ${changedText(pending)}`), h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    color: "success"
  }, `+${pending.added}`), h(Text, {
    color: "error"
  }, `−${pending.removed}`), h(Text, null, summaryText(pending))), pending.files.map((file, index) => h(Text, {
    key: `cp-path-${index}`,
    dimColor: true,
    wrap: "truncate-start"
  }, `› ${file.path}${file.isRemoved ? ` (${said.willDelete})` : ""}`)), more > 0 && h(Text, {
    dimColor: true
  }, said.more(more)), notesOf(pending).map((note, index) => h(Text, {
    key: `cp-note-${index}`,
    dimColor: true,
    wrap: "wrap"
  }, note)), h(Box, {
    flexDirection: "row",
    columnGap: 1,
    marginTop: 1
  }, h(Button, {
    key: "cp-confirm",
    variant: "secondary",
    hotkey: confirm.hotkey,
    label: confirm.label,
    onPress: opts.actions.onConfirm
  }), h(Button, {
    key: "cp-cancel",
    variant: "secondary",
    hotkey: said.cancel.hotkey,
    label: said.cancel.label,
    autoFocus: true,
    onPress: opts.actions.onCancel
  })));
}
function glyphOf(meta) {
  if (meta.isSafety === true)
    return "◆";
  return meta.isUndone === true ? "○" : "●";
}
function rowText(ui, view, spec) {
  const { Box, Text, Button } = ui;
  const entry = view.entries[spec.index];
  if (entry === undefined)
    return null;
  const meta = spec.opts.meta[entry.ref] ?? {};
  const named = titleOf(entry, spec.opts.meta);
  const isUndone = meta.isUndone === true;
  const glyph = glyphOf(meta);
  const facts = [ago(spec.opts.now - entry.at), meta.files ? words$1().files(meta.files) : "", (meta.tools ?? []).join(" ")].filter((part) => part !== "");
  return h(Box, {
    key: `cp-row-${spec.index}`,
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    ...spec.index === 0 && !isUndone ? { color: "claude" } : { dimColor: true }
  }, glyph), h(Box, {
    flexDirection: "column",
    flexGrow: 1
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    bold: !isUndone,
    dimColor: isUndone,
    strikethrough: isUndone
  }, named.title), h(Text, {
    dimColor: true
  }, facts.join(" · "))), h(Text, {
    wrap: "truncate",
    dimColor: isUndone,
    strikethrough: isUndone
  }, named.label)), h(Button, {
    key: `cp-undo-${spec.index}`,
    variant: "secondary",
    dimColor: view.isBusy,
    label: words$1().undo,
    onPress: () => spec.opts.actions.onUndo(entry)
  }));
}
function textPane(ui, view, opts) {
  const { Box, Text } = ui;
  return h(Box, {
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 1
  }, h(Text, {
    bold: true,
    dimColor: true
  }, words$1().title), h(Text, {
    dimColor: true
  }, headerMeta(view, opts.now))), h(Text, null, " "), statusRow(ui, view, opts.actions), view.pending !== null && confirmText(ui, view.pending, opts), view.pending === null && view.entries.length === 0 && h(Text, {
    dimColor: true
  }, emptyText()), view.pending === null && view.entries.map((_, index) => rowText(ui, view, { index, opts })));
}

const LABEL_MAX = 60;
const WIDTH$1 = { min: 240, max: 860 };
const CARD_RESERVE = 6;
const ago = (ms) => words$1().ago(ms);
function clip$2(text, max = LABEL_MAX) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
const changedText = (pending) => words$1().changed(pending.restore + pending.remove);
const confirmOf = (pending) => words$1().confirm(pending.restore + pending.remove);
function notesOf(pending) {
  const said = words$1();
  return [pending.commits > 0 ? said.commitsKept(pending.commits) : "", pending.isIndexMoved ? said.indexBack : "", said.ignoredKept].filter((note) => note !== "");
}
const emptyText = () => `${words$1().emptyLead} · ${words$1().emptyRest}`;
const targetOf = (turn, label, max = LABEL_MAX) => turn === null || turn === undefined ? `"${clip$2(label, max)}"` : words$1().turn(turn);
const QUESTION_LABEL_MAX = 40;
const questionOf = (pending) => words$1().question(targetOf(pending.turn, pending.entry.label, QUESTION_LABEL_MAX));
function titleOf(entry, meta) {
  const own = meta[entry.ref] ?? {};
  const prefix = SAFETY_PREFIXES.find((start) => entry.label.startsWith(start));
  if (own.isSafety === true || prefix !== undefined)
    return { title: words$1().beforeUndo, label: entry.label.slice((prefix ?? words$1().safetyPrefix).length) };
  return { title: own.turn === undefined ? words$1().saved : words$1().turn(own.turn), label: entry.label };
}
const headerMeta = (view, now) => view.entries[0] === undefined ? "" : words$1().headerMeta(view.entries.length, ago(now - view.entries[0].at));
const motion$1 = paneMotion$1();
function picture(ui, drawing, key, opts) {
  const { Svg } = ui;
  return h(Svg, {
    key,
    ...motion$1.pic(key, drawing, opts)
  });
}
function confirmCard(ui, pending, opts) {
  const { Box, Button } = ui;
  const frame = { width: svgWidth(opts.look.columns, { ...WIDTH$1, reserve: CARD_RESERVE }), mode: opts.look.theme.mode };
  const said = words$1();
  const head = headSvg(frame, { label: said.undo, meta: said.undoMeta, lead: questionOf(pending), rest: changedText(pending) });
  const confirm = confirmOf(pending);
  return h(Box, {
    flexDirection: "column",
    borderStyle: "single",
    borderColor: boxColor(opts.look.theme, "amber", "line"),
    paddingX: 2,
    paddingY: 1,
    rowGap: 1
  }, picture(ui, head, "cp-card-head"), picture(ui, diffstatSvg(frame, pending), "cp-card-stat"), notesOf(pending).map((note, index) => h(ui.Text, {
    key: `cp-note-${index}`,
    dimColor: true,
    wrap: "wrap"
  }, note)), h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Button, {
    key: "cp-confirm",
    variant: "secondary",
    hotkey: confirm.hotkey,
    label: confirm.label,
    onPress: opts.actions.onConfirm
  }), h(Button, {
    key: "cp-cancel",
    variant: "secondary",
    hotkey: said.cancel.hotkey,
    label: said.cancel.label,
    autoFocus: true,
    onPress: opts.actions.onCancel
  })));
}
function rowSpecs(view, opts) {
  const last = view.entries.length - 1;
  return view.entries.map((entry, index) => ({
    ...titleOf(entry, opts.meta),
    when: ago(opts.now - entry.at),
    meta: opts.meta[entry.ref] ?? {},
    isNewest: index === 0,
    isFirst: index === 0,
    isLast: index === last
  }));
}
function rowPicture(ui, row) {
  const { when, ...shows } = row.spec;
  return picture(ui, rowSvg$1(row.frame, { ...row.spec, isStacked: row.isStacked }), `cp-svg-${row.ref}`, { isRow: true, shows: { ...shows, isStacked: row.isStacked, frame: row.frame, isAged: when !== "" } });
}
function timeline(ui, view, opts) {
  const { Box } = ui;
  const frame = { width: svgWidth(opts.look.columns, WIDTH$1), mode: opts.look.theme.mode };
  const specs = rowSpecs(view, opts);
  const isStacked = specs.some((spec) => !rowFits(frame, spec));
  return h(Box, {
    flexDirection: "column"
  }, view.entries.map((entry, index) => {
    const spec = specs[index];
    const drawing = rowPicture(ui, { frame, spec, isStacked, ref: entry.ref });
    return PressRow(ui, { box: `cp-row-${index}`, key: `cp-undo-${index}`, drawing, onPress: () => opts.actions.onUndo(entry) });
  }));
}
const STATUS_LOOK = {
  busy: { dimColor: true },
  success: { color: "success" },
  error: { color: "error" },
  info: { dimColor: true }
};
function statusRow(ui, view, actions) {
  const { Box, Text, Button } = ui;
  const status = view.status;
  if (status === null)
    return null;
  const look = STATUS_LOOK[status.tone];
  const glyph = { busy: "◐", success: "✓", error: "✕", info: "›" }[status.tone];
  const redo = status.redo;
  return h(Box, {
    flexDirection: "row",
    columnGap: 1,
    alignItems: "center"
  }, h(Text, {
    ...look
  }, glyph), h(Text, null, status.text), redo !== undefined && h(Button, {
    key: "cp-redo",
    plain: true,
    hotkey: "y",
    label: words$1().redo,
    onPress: () => actions.onUndo(redo)
  }));
}
function paneTree(ui, view, opts) {
  const { Box } = ui;
  if (!opts.look.isRich)
    return textPane(ui, view, opts);
  const frame = { width: svgWidth(opts.look.columns, WIDTH$1), mode: opts.look.theme.mode };
  const count = view.entries.length;
  const said = words$1();
  const turns = view.entries.filter((entry) => titleOf(entry, opts.meta).title !== said.beforeUndo).length;
  const lead = count === 0 ? { lead: said.emptyLead, rest: said.emptyRest, joiner: " · " } : { lead: said.turnsSaved(turns), rest: "" };
  const newest = view.entries[0];
  const meta = newest !== undefined && turns === count ? said.newest(ago(opts.now - newest.at)) : headerMeta(view, opts.now);
  const head = headSvg(frame, { label: said.title, meta, ...lead });
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, picture(ui, head, "cp-head", { shows: { lead, turns, count, frame } }), statusRow(ui, view, opts.actions), view.pending !== null && confirmCard(ui, view.pending, opts), view.pending === null && count > 0 && timeline(ui, view, opts));
}

const CP_VIEW = { plugin: "checkpoint", key: "view" };
const CP_META = { plugin: "checkpoint", key: "meta" };
const CP_THEME = { plugin: "checkpoint", key: "theme" };
const EMPTY_VIEW = { entries: [], status: null, isBusy: false, pending: null };
async function checkpointsPage($, ui, site, act) {
  setLang(lang());
  const view = (await $.state.get(CP_VIEW)).value ?? EMPTY_VIEW;
  const meta = (await $.state.get(CP_META)).value ?? {};
  const theme = (await $.state.get(CP_THEME)).value ?? AUTO;
  const actions = {
    onUndo: (entry) => act("undo", entry.ref),
    onConfirm: () => act("confirm"),
    onCancel: () => act("cancel")
  };
  const look = { theme, columns: site.columns, isRich: site.surface !== "terminal" };
  return paneTree(ui, view, { now: await $.clock.now(), meta, look, actions });
}

let current = "en";
const pick = (table) => table[current];
const upper = (text) => text.toLocaleUpperCase(current);

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const EN = {
  units: { second: "s", minute: "m", hour: "h" },
  left: (duration) => `≈${duration} left`,
  headline: (done, total) => `${done}/${plural(total, "step", "steps")}`,
  drawnCount: (done, total) => done === total ? `All ${plural(total, "step", "steps")} done` : `${done} of ${plural(total, "step", "steps")} done`,
  drawnPlanned: (total) => plural(total, "step", "steps"),
  hubDone: (total) => `${total} of ${total} done`,
  hubUnstarted: (total) => `${plural(total, "step", "steps")} · not started`,
  hubWaiting: (done, total) => `${done} of ${plural(total, "step", "steps")} · waiting`,
  hubLive: (done, total) => `${done} of ${plural(total, "step", "steps")}`,
  checks: (done, total) => `${done}/${plural(total, "item", "items")}`,
  files: (n) => plural(n, "file", "files"),
  agentsDone: (n) => `${plural(n, "helper agent", "helper agents")} done`,
  moreSteps: (n) => plural(n, "more step", "more steps"),
  earlierSteps: (n) => plural(n, "earlier step", "earlier steps"),
  moreFiles: (n) => `+${plural(n, "more file", "more files")}`,
  notStarted: "not started",
  waitingSince: (duration) => `waiting · ${duration} ago`,
  allDone: "done",
  now: "now",
  running: "running",
  paneFailed: "The plan could not be drawn; here is the plain list.",
  emptyLead: "No plan yet",
  emptyHow: "steps show up here once a task list or an approved plan arrives",
  tasksLabel: "task list",
  approvedLabel: "approved plan",
  subagent: "helper agent",
  stepTitle: (n) => `Step ${n}`,
  command: "Open the panel that shows the plan steps and where the work is",
  finishEyebrow: "Plan",
  finishHeadline: (open, total) => `${open} of ${plural(total, "step", "steps")} still open`,
  finishNext: (title) => `Next: ${title}`,
  finishContinue: "Continue the plan",
  finishMarkDone: "Mark plan done",
  finishNotNow: "Not now",
  continuePrompt: (title) => `Continue the plan with the next open step: ${title}. Keep the task list current as you go.`
};
const TR = {
  units: { second: "sn", minute: "dk", hour: "sa" },
  left: (duration) => `kalan ~${duration}`,
  headline: (done, total) => `${done}/${total} adım`,
  drawnCount: (done, total) => done === total ? `${total} adımın hepsi bitti` : `${done}/${total} adım bitti`,
  drawnPlanned: (total) => `${total} adım`,
  hubDone: (total) => `${total}/${total} bitti`,
  hubUnstarted: (total) => `${total} adım · başlamadı`,
  hubWaiting: (done, total) => `${done}/${total} adım · bekliyor`,
  hubLive: (done, total) => `${done}/${total} adım`,
  checks: (done, total) => `${done}/${total} madde`,
  files: (n) => `${n} dosya`,
  agentsDone: (n) => `${n} yardımcı ajan bitti`,
  moreSteps: (n) => `${n} adım daha`,
  earlierSteps: (n) => `Önceki ${n} adım`,
  moreFiles: (n) => `+${n} dosya daha`,
  notStarted: "başlamadı",
  waitingSince: (duration) => `bekliyor · ${duration} önce`,
  allDone: "tamam",
  now: "şimdi",
  running: "çalışıyor",
  paneFailed: "Plan çizilemedi, düz liste gösteriliyor.",
  emptyLead: "Henüz plan yok",
  emptyHow: "görev listesi ya da onaylı bir plan gelince adımlar burada belirir",
  tasksLabel: "görev listesi",
  approvedLabel: "onaylı plan",
  subagent: "yardımcı ajan",
  stepTitle: (n) => `Adım ${n}`,
  command: "Plandaki adımları ve işin nerede olduğunu gösteren paneli aç",
  finishEyebrow: "Plan",
  finishHeadline: (open, total) => `${open}/${total} adım hâlâ açık`,
  finishNext: (title) => `Sıradaki: ${title}`,
  finishContinue: "Plana devam et",
  finishMarkDone: "Planı bitti say",
  finishNotNow: "Şimdi değil",
  continuePrompt: (title) => `Plana sıradaki açık adımla devam et: ${title}. Görev listesini ilerledikçe güncel tut.`
};
const WORDS$3 = { en: EN, tr: TR };
const words = () => pick(WORDS$3);

const MATCH_MIN = 0.6;
const MIN_WORD = 3;
const FOLD = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
const NUMBER_REF = /\b(?:task|step|adım|görev|phase|aşama)\s*(\d+)\b/i;
const NUMBER_LEAD = /^\s*(\d+)[.):]\s/;
const RANK$1 = { pending: 0, in_progress: 1, completed: 2 };
function normalize(text) {
  return text.toLocaleLowerCase("tr").replace(/[çğıöşüâîû]/g, (char) => FOLD[char] ?? char).replace(/\b(?:task|step|adim|gorev|phase|asama)\s*\d+\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
}
function wordSet(text) {
  return new Set(normalize(text).split(" ").filter((word) => word.length >= MIN_WORD));
}
function numberOf(text) {
  const found = NUMBER_REF.exec(text) ?? NUMBER_LEAD.exec(text);
  return found === null ? null : Number(found[1]);
}
function similarity(a, b) {
  const left = wordSet(a);
  const right = wordSet(b);
  const smaller = Math.min(left.size, right.size);
  if (smaller === 0)
    return normalize(a) !== "" && normalize(a) === normalize(b) ? 1 : 0;
  let shared = 0;
  for (const word of left)
    if (right.has(word))
      shared += 1;
  return shared / smaller;
}
function score(step, task) {
  const taskNumber = numberOf(task.subject);
  if (step.number !== null && taskNumber === step.number)
    return 1;
  return similarity(step.title, task.subject);
}
function matchTasks(steps, tasks) {
  const pairs = [];
  steps.forEach((step, stepIndex) => tasks.forEach((task, taskIndex) => {
    const value = score(step, task);
    if (value >= MATCH_MIN)
      pairs.push({ step: stepIndex, task: taskIndex, value });
  }));
  pairs.sort((a, b) => b.value - a.value);
  const matched = new Map;
  const usedTasks = new Set;
  for (const pair of pairs) {
    const task = tasks[pair.task];
    if (matched.has(pair.step) || usedTasks.has(pair.task) || task === undefined)
      continue;
    matched.set(pair.step, task);
    usedTasks.add(pair.task);
  }
  return matched;
}
function slug(text) {
  return text.toLocaleLowerCase("tr").replace(/[çğıöşüâîû]/g, (char) => FOLD[char] ?? char).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function uniqueKey(title, seen) {
  const base = slug(title) || "step";
  let key = base;
  for (let index = 2;seen.has(key); index += 1)
    key = `${base}-${index}`;
  seen.add(key);
  return key;
}
function docStatus(step) {
  if (step.isChecked || step.checksTotal > 0 && step.checksDone === step.checksTotal)
    return "completed";
  return step.checksDone > 0 ? "in_progress" : "pending";
}
function creditOf(status, step) {
  if (status === "completed")
    return 1;
  return status === "in_progress" && step.checksTotal > 0 ? step.checksDone / step.checksTotal : 0;
}
function fromTasks(tasks) {
  const seen = new Set;
  const steps = tasks.map((task) => ({
    key: uniqueKey(task.subject, seen),
    title: task.subject,
    status: task.status,
    credit: creditOf(task.status, { checksDone: 0, checksTotal: 0 }),
    checksDone: 0,
    checksTotal: 0
  }));
  return { steps, source: words().tasksLabel };
}
function fromDoc(doc, matched) {
  const seen = new Set;
  return doc.steps.map((step, index) => {
    const fromTask = matched.get(index)?.status ?? "pending";
    const fromDocument = docStatus(step);
    const status = RANK$1[fromTask] >= RANK$1[fromDocument] ? fromTask : fromDocument;
    const checks = { checksDone: step.checksDone, checksTotal: step.checksTotal };
    return { key: uniqueKey(step.title, seen), title: step.title, status, credit: creditOf(status, checks), ...checks };
  });
}
function resolvePlan(tasks, doc) {
  if (doc === null || doc.steps.length === 0)
    return tasks.length === 0 ? null : fromTasks(tasks);
  if (tasks.length === 0)
    return { steps: fromDoc(doc, new Map), source: doc.label };
  const matched = matchTasks(doc.steps, tasks);
  const needed = Math.ceil(Math.min(doc.steps.length, tasks.length) / 2);
  if (matched.size < needed)
    return fromTasks(tasks);
  return { steps: fromDoc(doc, matched), source: `${doc.label} · ${words().tasksLabel}` };
}

const FILL = /<rect\b[^>]*\bdata-m-fill\b[^>]*>/g;
const DONE = /<path\b[^>]*\bdata-m-done\b[^>]*>/g;
const HAS_DONE = /\bdata-m-done\b/;
const WIDTH = /\swidth="([\d.]+)"/;
const CLASS = /\sclass="([^"]*)"/;
const STYLE = /\sstyle="([^"]*)"/;
const MIN_RATIO_STEP = 0.02;
const RATIO_DIGITS = 3;
const widthOf = (tag) => Number(WIDTH.exec(tag)?.[1] ?? 0);
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
    const from = was === undefined ? 0 : widthOf(was);
    const to = widthOf(tag);
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
const REDUCED$1 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function motionCss(body) {
  const used = Object.keys(RULES).filter((name) => new RegExp(`\\b${name}\\b`).test(body));
  return used.length === 0 ? "" : `${used.map((name) => RULES[name]).join("")}${REDUCED$1}`;
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
const SCHEME$1 = "<style>:root{color-scheme:light dark}</style>";
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
  const scheme = SAYS_SCHEME.test(inner) ? "" : SCHEME$1;
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

function baseName(path) {
  return path.split("/").pop() ?? path;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const PERCENT = 100;
const ETA_MIN_DONE = 3;
function currentIndex(steps, tracks) {
  let best = -1;
  let bestStart = -1 / 0;
  steps.forEach((step, index) => {
    const start = tracks[step.key]?.startedAt ?? 0;
    if (step.status === "in_progress" && start > bestStart) {
      best = index;
      bestStart = start;
    }
  });
  return best;
}
function anchorIndex(steps, tracks) {
  const current = currentIndex(steps, tracks);
  if (current >= 0)
    return current;
  const next = steps.findIndex((step) => step.status !== "completed");
  return next >= 0 ? next : Math.max(0, steps.length - 1);
}
function progressOf(plan) {
  const total = plan.steps.length;
  const done = plan.steps.filter((step) => step.status === "completed").length;
  const credit = plan.steps.reduce((sum, step) => sum + step.credit, 0);
  const percent = total === 0 ? 0 : Math.round(credit / total * PERCENT);
  return { done, total, percent };
}
function durationOf(track, now) {
  if (track === undefined || track.startedAt === null)
    return null;
  const end = track.status === "completed" ? track.finishedAt : now;
  return end === null ? null : Math.max(0, end - track.startedAt);
}
function etaOf(plan, tracks) {
  const measured = plan.steps.filter((step) => step.status === "completed").map((step) => durationOf(tracks[step.key], 0)).filter((ms) => ms !== null);
  const remaining = plan.steps.filter((step) => step.status !== "completed").length;
  if (measured.length < ETA_MIN_DONE || remaining === 0)
    return null;
  const average = measured.reduce((sum, ms) => sum + ms, 0) / measured.length;
  return average * remaining;
}
function formatDuration(ms) {
  const unit = words().units;
  if (ms < MINUTE)
    return `${Math.max(1, Math.round(ms / SECOND))}${unit.second}`;
  if (ms < HOUR)
    return `${Math.round(ms / MINUTE)}${unit.minute}`;
  const hours = Math.floor(ms / HOUR);
  const minutes = Math.round(ms % HOUR / MINUTE);
  return minutes === 0 ? `${hours}${unit.hour}` : `${hours}${unit.hour} ${minutes}${unit.minute}`;
}
function windowOf(total, anchor, room) {
  if (total <= room)
    return { start: 0, end: total };
  const inner = Math.max(1, room - 2);
  const lead = Math.min(anchor, Math.max(1, Math.floor(inner / 4)));
  const end = Math.min(total, anchor - lead + inner);
  const start = Math.max(0, end - inner);
  return { start, end };
}

const STALE_MS = 30 * 60000;
function planState(plan, at) {
  if (plan === null || plan.steps.length === 0)
    return "none";
  if (plan.steps.every((step) => step.status === "completed"))
    return "done";
  if (plan.steps.every((step) => step.status === "pending"))
    return "unstarted";
  return at.now - at.touchedAt >= STALE_MS ? "stale" : "live";
}
function stateNote(state, at) {
  if (state === "unstarted")
    return words().notStarted;
  if (state === "stale")
    return words().waitingSince(formatDuration(at.now - at.touchedAt));
  return "";
}

const NARROW = "iljtf.,:;|!'` ()[]";
const WIDE = "mwMW@%";
const NARROW_EM = 0.3;
const WIDE_EM = 0.82;
const CAPITAL_EM = 0.64;
const LOWER_EM = 0.55;
const MONO_EM = 0.6;
const PX_PER_COLUMN = 9;
function escape(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function measure(text, size, isMono = false) {
  if (isMono)
    return [...text].length * size * MONO_EM;
  return [...text].reduce((sum, char) => {
    if (NARROW.includes(char))
      return sum + size * NARROW_EM;
    if (WIDE.includes(char))
      return sum + size * WIDE_EM;
    return sum + size * (char >= "A" && char <= "Z" ? CAPITAL_EM : LOWER_EM);
  }, 0);
}
function fit(text, width, font) {
  const { size, isMono = false } = font;
  if (measure(text, size, isMono) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 0 && measure(`${chars.join("")}…`, size, isMono) > width)
    chars.pop();
  return chars.length === 0 ? "" : `${chars.join("").trimEnd()}…`;
}
function wrap(text, box) {
  const lines = [];
  let line = "";
  const words = text.split(/\s+/).filter(Boolean);
  for (const [index, word] of words.entries()) {
    const tried = line === "" ? word : `${line} ${word}`;
    if (measure(tried, box.size) <= box.width || line === "") {
      line = tried;
      continue;
    }
    lines.push(line);
    line = word;
    if (lines.length === box.maxLines - 1) {
      line = words.slice(index).join(" ");
      break;
    }
  }
  if (line !== "")
    lines.push(line);
  return lines.map((part) => fit(part, box.width, { size: box.size }));
}
function widthFor(columns, range) {
  const fromCells = Math.floor((columns ?? 0) * PX_PER_COLUMN);
  return Math.max(range.min, Math.min(range.max, fromCells));
}

const FILES_SHOWN$2 = 3;
const AGENTS_SHOWN$1 = 3;
const LINE$2 = 17;
const FILE_ROW = 22;
const BADGE = { w: 26, h: 16, gap: 8 };
const NAME_SIZE = 12;
const META_SIZE$1 = 12;
const AGENT_INDENT = 14;
const LINES_MAX = 3;
const AGENT_DOT = { dx: 4, dy: 9, r: 3 };
const DETAIL_CSS = ".badge{font-size:9.5px;font-weight:700}";
function deskDetails(step, track) {
  const done = track?.agents.filter((agent) => !agent.isRunning).length ?? 0;
  const say = words();
  const meta = [step.checksTotal > 0 ? say.checks(step.checksDone, step.checksTotal) : "", done > 0 ? say.agentsDone(done) : ""];
  const running = (track?.agents ?? []).filter((agent) => agent.isRunning).map((agent) => agent.description);
  return { meta: meta.filter(Boolean).join(" · "), files: [...track?.files ?? []].reverse(), running: running.slice(0, AGENTS_SHOWN$1) };
}
function hasDetails(details) {
  return details.meta !== "" || details.files.length > 0 || details.running.length > 0;
}
function fileBadge(x, y, path) {
  const name = baseName(path);
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  const label = escape(upper(ext === "" ? "·" : ext.slice(0, 3)));
  return `<rect x="${x}" y="${y}" width="${BADGE.w}" height="${BADGE.h}" rx="4" fill="var(--track)"/><text x="${x + BADGE.w / 2}" y="${y + 11.5}" text-anchor="middle" class="mono badge lo">${label}</text>`;
}
function fileRow(path, frame) {
  const nameX = frame.x + BADGE.w + BADGE.gap;
  const room = frame.width - (nameX - frame.x);
  const name = fit(baseName(path), room, { size: NAME_SIZE });
  const folder = path.slice(0, path.length - baseName(path).length);
  const folderRoom = room - measure(name, NAME_SIZE);
  const kept = measure(folder, NAME_SIZE) <= folderRoom ? folder : "";
  const y = frame.top + 3;
  return `${fileBadge(frame.x, y, path)}<text x="${nameX}" y="${y + 12}" class="label"><tspan class="lo">${escape(kept)}</tspan><tspan class="hi">${escape(name)}</tspan></text>`;
}
function lines(texts, at) {
  return texts.map((line, n) => `<text x="${at.x}" y="${at.top + 13 + n * LINE$2}" class="${at.cls}">${escape(line)}</text>`).join("");
}
function filesBlock(files, frame) {
  const rows = files.slice(0, FILES_SHOWN$2).map((path, n) => fileRow(path, { ...frame, top: frame.top + n * FILE_ROW }));
  const shown = Math.min(files.length, FILES_SHOWN$2);
  const rest = files.length - shown;
  const more = rest > 0 ? `<text x="${frame.x + BADGE.w + BADGE.gap}" y="${frame.top + shown * FILE_ROW + 11}" class="micro lo">${words().moreFiles(rest)}</text>` : "";
  return { svg: rows.join("") + more, height: shown * FILE_ROW + (rest > 0 ? LINE$2 : 0) };
}
function agentBlock(agent, frame) {
  const texts = wrap(`${agent} · ${words().running}`, { width: frame.width - AGENT_INDENT, size: META_SIZE$1, maxLines: LINES_MAX });
  const at = { cx: frame.x + AGENT_DOT.dx, cy: frame.top + AGENT_DOT.dy, r: AGENT_DOT.r };
  const dot = `<circle cx="${at.cx}" cy="${at.cy}" r="${at.r}" class="f-edit breathe"/>`;
  return { svg: dot + lines(texts, { x: frame.x + AGENT_INDENT, top: frame.top, cls: "label mid" }), height: texts.length * LINE$2 };
}
function detailBlock(details, frame) {
  const parts = [];
  let top = frame.top;
  const push = (block) => {
    parts.push(block);
    top += block.height;
  };
  if (details.meta !== "") {
    const texts = wrap(details.meta, { width: frame.width, size: META_SIZE$1, maxLines: LINES_MAX });
    push({ svg: lines(texts, { x: frame.x, top, cls: "label lo" }), height: texts.length * LINE$2 + 2 });
  }
  if (details.files.length > 0)
    push(filesBlock(details.files, { ...frame, top }));
  for (const agent of details.running)
    push(agentBlock(agent, { ...frame, top }));
  return { svg: parts.map((part) => part.svg).join(""), height: top - frame.top };
}

const DARK$1 = {
  sheet: "#191917",
  card: "#1F1F1C",
  inset: "#171715",
  line: "#2E2E2A",
  lineStrong: "#45443F",
  track: "#34332F",
  hi: "#F0EEE8",
  mid: "#C2BEB4",
  lo: "#8E8A80"
};
const LIGHT$1 = {
  sheet: "#F4F2EC",
  card: "#FFFFFF",
  inset: "#F6F4EF",
  line: "#E4E0D6",
  lineStrong: "#CFC9BC",
  track: "#ECE8DF",
  hi: "#1C1B19",
  mid: "#4F4B44",
  lo: "#77726A"
};
const ROLES$1 = {
  run: { dark: { fg: "#B19CF3", tint: "#29243D", line: "#4A3F75" }, light: { fg: "#6243C4", tint: "#F0ECFC", line: "#CFC3F3" } },
  ok: { dark: { fg: "#6FC593", tint: "#1B2F25", line: "#2F5A42" }, light: { fg: "#1F6E43", tint: "#E4F4EA", line: "#B5DEC4" } },
  danger: { dark: { fg: "#F2727F", tint: "#3B2023", line: "#74343C" }, light: { fg: "#C0263A", tint: "#FCE8EA", line: "#F1B9C0" } },
  edit: { dark: { fg: "#E58A5F", tint: "#38251D", line: "#6A3E2D" }, light: { fg: "#A94A26", tint: "#FBEDE6", line: "#EFC6B4" } },
  amber: { dark: { fg: "#E9B949", tint: "#332D19", line: "#66552A" }, light: { fg: "#8A6000", tint: "#FBF2D9", line: "#EBD48F" } },
  tide: { dark: { fg: "#7FB6E8", tint: "#1E2B37", line: "#2F4A63" }, light: { fg: "#2464A0", tint: "#E7F0F9", line: "#B9D3EC" } }
};
const ROLE_NAMES = Object.keys(ROLES$1);
function palette$1(isLight) {
  const mode = isLight ? "light" : "dark";
  const roles = Object.fromEntries(ROLE_NAMES.map((role) => [role, ROLES$1[role][mode]]));
  return { ...isLight ? LIGHT$1 : DARK$1, ...roles };
}
function vars(p) {
  const tones = ROLE_NAMES.map((role) => `--${role}:${p[role].fg};--${role}-t:${p[role].tint};--${role}-l:${p[role].line}`);
  return [
    `--sheet:${p.sheet};--card:${p.card};--inset:${p.inset};--line:${p.line};--line2:${p.lineStrong};--track:${p.track}`,
    `--hi:${p.hi};--mid:${p.mid};--lo:${p.lo}`,
    ...tones
  ].join(";");
}
const FONT$1 = `-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif`;
const MONO_FONT = `ui-monospace,"SF Mono",Menlo,Consolas,monospace`;
const TYPE = [
  `text{font-family:${FONT$1};font-variant-numeric:tabular-nums}`,
  `.mono{font-family:${MONO_FONT}}`,
  ".headline{font-size:16px;font-weight:600}",
  ".title{font-size:13.5px;font-weight:600}",
  ".label{font-size:12px;font-weight:500}",
  ".micro{font-size:10.5px;font-weight:500}",
  ".hi{fill:var(--hi)}.mid{fill:var(--mid)}.lo{fill:var(--lo)}",
  ".f-edit{fill:var(--edit)}.f-ok{fill:var(--ok)}.f-danger{fill:var(--danger)}.f-run{fill:var(--run)}.f-amber{fill:var(--amber)}.f-tide{fill:var(--tide)}"
].join("");
const CALM = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function svgStyle$1(extra = "") {
  const dark = vars(palette$1(false));
  const light = vars(palette$1(true));
  return `<style>svg{${dark}}svg.t-light{${light}}@media (prefers-color-scheme: light){svg.t-auto{${light}}}${TYPE}${extra}${CALM}</style>`;
}
function svgDoc(size, body, extraCss = "") {
  const { width, height, theme } = size;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="t-${theme}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svgStyle$1(extraCss)}${body}</svg>`;
}

const LEAD_BASE = 16;
const HOW_BASE = 36;
const HOW_SIZE = 12;
const LINE$1 = 17;
const HOW_LINES_MAX = 4;
const GHOST_GAP = 18;
const GHOST_ROW = 30;
const GHOST_SHARES = [0.62, 0.46, 0.54];
const DOT_X$1 = 7;
const DOT_R = 3.5;
const RAIL_GAP$1 = 10;
const BAR_X = 24;
const BAR_H = 6;
function sentence(width) {
  const say = words();
  const how = wrap(`${upper(say.emptyHow.slice(0, 1))}${say.emptyHow.slice(1)}`, { width, size: HOW_SIZE, maxLines: HOW_LINES_MAX });
  const lines = how.map((line, n) => `<text x="0" y="${HOW_BASE + n * LINE$1}" class="label lo">${escape(line)}</text>`);
  return { svg: `<text x="0" y="${LEAD_BASE}" class="headline hi">${escape(say.emptyLead)}</text>${lines.join("")}`, bottom: HOW_BASE + (how.length - 1) * LINE$1 };
}
function ghost(width, top) {
  return GHOST_SHARES.map((share, n) => {
    const cy = top + n * GHOST_ROW + DOT_R;
    const rail = n === 0 ? "" : `<line x1="${DOT_X$1}" y1="${cy - GHOST_ROW + RAIL_GAP$1}" x2="${DOT_X$1}" y2="${cy - RAIL_GAP$1}" stroke="var(--line)"/>`;
    const dot = `<circle cx="${DOT_X$1}" cy="${cy}" r="${DOT_R}" fill="none" stroke="var(--line2)" stroke-width="1.5"/>`;
    const bar = `<rect x="${BAR_X}" y="${cy - BAR_H / 2}" width="${Math.round((width - BAR_X) * share)}" height="${BAR_H}" rx="3" fill="var(--track)" opacity=".7"/>`;
    return rail + dot + bar;
  }).join("");
}
function emptySvg(theme, width) {
  const text = sentence(width);
  const top = text.bottom + GHOST_GAP;
  const height = top + (GHOST_SHARES.length - 1) * GHOST_ROW + 2 * DOT_R + 2;
  const body = `${text.svg}${ghost(width, top)}`;
  return { source: svgDoc({ width, height, theme }, body), height, alt: `Plan: ${words().emptyLead} · ${words().emptyHow}` };
}

const CHECK = { left: 4.5, low: 3.5, right: 5, rise: 3.5, dip: 1.5 };
const SMALL_R = 3.5;
const LIVE_R = 3;
const RING_R = 6.5;
const RAIL_GAP = 9;
function checkMark(cx, cy) {
  const path = `M${cx - CHECK.left} ${cy + 0.25}L${cx - CHECK.dip} ${cy + CHECK.low}L${cx + CHECK.right} ${cy - CHECK.rise}`;
  return `<path d="${path}" fill="none" stroke="var(--lo)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function hollowRing(cx, cy) {
  return `<circle cx="${cx}" cy="${cy}" r="${SMALL_R}" fill="none" stroke="var(--line2)" stroke-width="1.5"/>`;
}
function stepDot(dot) {
  const { cx, cy, state } = dot;
  if (state === "done")
    return checkMark(cx, cy);
  if (state === "next")
    return hollowRing(cx, cy);
  if (dot.isLive === false)
    return `<circle cx="${cx}" cy="${cy}" r="${SMALL_R}" fill="var(--lo)"/>`;
  return `<circle cx="${cx}" cy="${cy}" r="${RING_R}" fill="none" stroke="var(--edit-l)"/><circle cx="${cx}" cy="${cy}" r="${LIVE_R}" class="f-edit breathe"/>`;
}
function stepRail(cx, span) {
  const top = span.from + RAIL_GAP;
  const bottom = span.to - RAIL_GAP;
  if (bottom <= top)
    return "";
  return `<line x1="${cx}" y1="${top}" x2="${cx}" y2="${bottom}" stroke="var(${span.isWalked ? "--line2" : "--line"})"/>`;
}

const ROW = 30;
const LINE = 17;
const DOT_X = 7;
const DOT_CY = 15;
const TITLE_X = 24;
const TITLE_BASE = 19.5;
const MORE_H = 28;
const MORE_BASE = 18.5;
const ROOM_STEPS = 12;
const HEADLINE_Y = 16;
const META_Y = 36;
const META_SIZE = 12;
const META_GAP = 12;
const METER_Y = 48;
const METER_H = 3;
const SEGMENT_GAP = 2;
const SEGMENT_MIN = 5;
const HEAD_H = 62;
const TIME_SIZE = 11;
const TIME_GAP = 12;
const CURRENT_SIZE = 13.5;
const TITLE_SIZE = 13;
const BOLD_WIDEN = 1.06;
const CURRENT_LINES_MAX = 5;
const OTHER_LINES_MAX = 2;
const DETAIL_PAD = 8;
const CSS = `${DETAIL_CSS}.step{font-size:${TITLE_SIZE}px}.breathe{animation:br 1.8s ease-in-out infinite}@keyframes br{50%{opacity:.35}}`;
function headlineText(model) {
  const { plan, tracks } = model;
  const progress = progressOf(plan);
  const isUnstarted = progress.done === 0 && currentIndex(plan.steps, tracks) < 0;
  return isUnstarted ? words().drawnPlanned(progress.total) : words().drawnCount(progress.done, progress.total);
}
function rightOfMeta(model) {
  if (model.note !== "")
    return model.note;
  const eta = etaOf(model.plan, model.tracks);
  return eta === null ? "" : words().left(formatDuration(eta));
}
function segmentFill(model, step, isCurrent) {
  if (isCurrent && model.note === "")
    return "--edit";
  if (step.status === "completed")
    return model.plan.steps.every((one) => one.status === "completed") ? "--ok" : "--mid";
  return step.status === "in_progress" ? "--line2" : "--track";
}
function meter(model) {
  const { steps } = model.plan;
  const cell = (model.width - (steps.length - 1) * SEGMENT_GAP) / steps.length;
  const bar = (x, width, fill) => `<rect x="${x}" y="${METER_Y}" width="${width}" height="${METER_H}" rx="1.5" fill="var(${fill})"/>`;
  if (cell >= SEGMENT_MIN) {
    const current = currentIndex(steps, model.tracks);
    return steps.map((step, n) => bar(n * (cell + SEGMENT_GAP), cell, segmentFill(model, step, n === current))).join("");
  }
  const { percent } = progressOf(model.plan);
  const fill = Math.round(model.width * percent / 100);
  return bar(0, model.width, "--track") + (fill > 0 ? bar(0, fill, percent >= 100 ? "--ok" : "--mid") : "");
}
function header$1(model) {
  const right = rightOfMeta(model);
  const room = model.width - (right === "" ? 0 : measure(right, META_SIZE) + META_GAP);
  const parts = [
    `<text x="0" y="${HEADLINE_Y}" class="headline hi">${escape(headlineText(model))}</text>`,
    `<text x="0" y="${META_Y}" class="label lo">${escape(fit(model.plan.source, room, { size: META_SIZE }))}</text>`,
    right === "" ? "" : `<text x="${model.width}" y="${META_Y}" text-anchor="end" class="label lo">${escape(right)}</text>`,
    meter(model)
  ];
  return { svg: parts.join(""), height: HEAD_H };
}
function rightText(model, step, isCurrent) {
  const elapsed = durationOf(model.tracks[step.key], model.now);
  const time = elapsed === null ? "" : formatDuration(elapsed);
  if (step.status === "completed")
    return { text: time, cls: "lo" };
  if (isCurrent)
    return { text: time, cls: model.note === "" ? "mid" : "lo" };
  const checks = step.checksTotal > 0 ? `${step.checksDone}/${step.checksTotal}` : "";
  return { text: [checks, step.status === "in_progress" ? time : ""].filter(Boolean).join(" · "), cls: "lo" };
}
const TITLE_CLASS = { current: "title hi", done: "step lo", next: "step mid" };
function dotState(row) {
  if (row.isCurrent)
    return "current";
  return row.step.status === "completed" ? "done" : "next";
}
function rowSvg(model, row) {
  const state = dotState(row);
  const right = rightText(model, row.step, row.isCurrent);
  const parts = [
    stepDot({ cx: DOT_X, cy: row.top + DOT_CY, state, isLive: model.note === "" }),
    ...row.title.map((line, n) => `<text x="${TITLE_X}" y="${row.top + TITLE_BASE + n * LINE}" class="${TITLE_CLASS[state]}">${escape(line)}</text>`),
    right.text === "" ? "" : `<text x="${model.width}" y="${row.top + TITLE_BASE}" text-anchor="end" class="mono ${right.cls}" font-size="${TIME_SIZE}">${right.text}</text>`,
    row.detail?.svg ?? ""
  ];
  return parts.join("");
}
function titleLines(model, step, isCurrent) {
  const right = rightText(model, step, isCurrent);
  const rightWidth = right.text === "" ? 0 : measure(right.text, TIME_SIZE, true) + TIME_GAP;
  const size = isCurrent ? CURRENT_SIZE * BOLD_WIDEN : TITLE_SIZE;
  return wrap(step.title, { width: model.width - TITLE_X - rightWidth, size, maxLines: isCurrent ? CURRENT_LINES_MAX : OTHER_LINES_MAX });
}
function place(model, details, at) {
  const { steps } = model.plan;
  const { shown } = at;
  const current = currentIndex(steps, model.tracks);
  let y = at.top;
  return steps.slice(shown.start, shown.end).map((step, offset) => {
    const index = shown.start + offset;
    const isCurrent = index === current;
    const title = titleLines(model, step, isCurrent);
    const titleHeight = ROW + (title.length - 1) * LINE;
    const frame = { x: TITLE_X, top: y + titleHeight - 4, width: model.width - TITLE_X };
    const detail = isCurrent && hasDetails(details) ? detailBlock(details, frame) : null;
    const height = titleHeight + (detail === null ? 0 : detail.height + DETAIL_PAD);
    const placed = { step, index, top: y, height, isCurrent, title, detail };
    y += height;
    return placed;
  });
}
function moreRow(top, glyph, text) {
  return `${glyph}<text x="${TITLE_X}" y="${top + MORE_BASE}" class="label lo">${escape(text)}</text>`;
}
function planSvg(model, details) {
  const { steps } = model.plan;
  const head = header$1(model);
  const shown = windowOf(steps.length, anchorIndex(steps, model.tracks), ROOM_STEPS);
  const rows = place(model, details, { top: head.height + (shown.start > 0 ? MORE_H : 0), shown });
  const last = rows[rows.length - 1];
  const bottom = last === undefined ? head.height : last.top + last.height;
  const aboveCy = head.height + MORE_H / 2;
  const belowCy = bottom + MORE_H / 2;
  const hasAbove = shown.start > 0;
  const hasBelow = shown.end < steps.length;
  const above = hasAbove ? moreRow(head.height, checkMark(DOT_X, aboveCy), words().earlierSteps(shown.start)) : "";
  const below = hasBelow ? moreRow(bottom, hollowRing(DOT_X, belowCy), words().moreSteps(steps.length - shown.end)) : "";
  const stops = [
    ...hasAbove ? [{ cy: aboveCy, isDone: true }] : [],
    ...rows.map((row) => ({ cy: row.top + DOT_CY, isDone: row.step.status === "completed" })),
    ...hasBelow ? [{ cy: belowCy, isDone: false }] : []
  ];
  const rails = stops.slice(1).map((stop, n) => {
    const from = stops[n];
    return stepRail(DOT_X, { from: from.cy, to: stop.cy, isWalked: from.isDone });
  });
  const height = bottom + (hasBelow ? MORE_H : 4);
  const body = [head.svg, ...rails, above, ...rows.map((row) => rowSvg(model, row)), below].join("");
  return { source: svgDoc({ width: model.width, height, theme: model.theme }, body, CSS), height };
}

const SVG_RANGE = { min: 280, max: 640 };
const GUTTER_COLUMNS = 6;
const GLYPH_CELLS = 2;
const PAD = 1;
const BAR_MIN = 8;
const CHROME_ROWS = 3;
const FILES_SHOWN$1 = 2;
const AGENTS_SHOWN = 3;
const MIN_STEP_ROWS = 3;
const TITLE_MAX = 160;
function header(ui, left, right) {
  const { Box, Text } = ui;
  return h(Box, {
    key: "head",
    flexDirection: "row",
    justifyContent: "space-between"
  }, h(Text, {
    bold: true,
    wrap: "truncate-end"
  }, left), h(Box, {
    flexShrink: 1,
    marginLeft: 2
  }, h(Text, {
    dimColor: true,
    wrap: "truncate-start"
  }, right)));
}
function bar(ui, view) {
  const { Box, Text } = ui;
  const width = Math.max(BAR_MIN, view.columns - 2 * PAD - (view.eta === "" ? 0 : view.eta.length + 2));
  const filled = Math.round(width * view.percent / 100);
  return h(Box, {
    key: "bar",
    flexDirection: "row"
  }, h(Text, {
    color: view.percent >= 100 ? "success" : undefined
  }, "━".repeat(filled)), h(Text, {
    dimColor: true
  }, "━".repeat(width - filled)), view.eta !== "" && h(Text, {
    dimColor: true
  }, `  ${view.eta}`));
}
function checksText(step) {
  return step.checksTotal > 0 ? `${step.checksDone}/${step.checksTotal}` : "";
}
function lookOf(step, context) {
  const elapsed = durationOf(context.track, context.now);
  const time = elapsed === null ? "" : formatDuration(elapsed);
  if (step.status === "completed")
    return { glyph: "✓", isDim: true, isBold: false, right: time };
  if (step.status === "in_progress") {
    const right = context.isCurrent ? time : [checksText(step), time].filter(Boolean).join(" · ");
    return { glyph: "◐", glyphColor: "claude", isDim: !context.isCurrent, isBold: context.isCurrent, right, rightColor: context.isCurrent ? "claude" : undefined };
  }
  return { glyph: "○", isDim: false, isBold: false, right: checksText(step) };
}
function stepRow$1(ui, step, look) {
  const { Box, Text } = ui;
  return h(Box, {
    key: `step-${step.key}`,
    flexDirection: "row"
  }, h(Box, {
    width: GLYPH_CELLS,
    flexShrink: 0
  }, h(Text, {
    color: look.glyphColor,
    dimColor: look.glyphColor === undefined && look.isDim
  }, look.glyph)), h(Box, {
    flexGrow: 1,
    flexShrink: 1
  }, h(Text, {
    wrap: "truncate-end",
    bold: look.isBold,
    dimColor: look.isDim
  }, step.title.slice(0, TITLE_MAX))), look.right !== "" && h(Box, {
    flexShrink: 0,
    marginLeft: 1
  }, h(Text, {
    color: look.rightColor,
    dimColor: look.rightColor === undefined
  }, look.right)));
}
function filesText(files) {
  if (files.length === 0)
    return "";
  const names = files.slice(-FILES_SHOWN$1).reverse().map(baseName).join(", ");
  const more = files.length > FILES_SHOWN$1 ? ` +${files.length - FILES_SHOWN$1}` : "";
  return `${words().files(files.length)}: ${names}${more}`;
}
function detailLines(step, track) {
  const done = track?.agents.filter((agent) => !agent.isRunning).length ?? 0;
  const parts = [
    step.checksTotal > 0 ? words().checks(step.checksDone, step.checksTotal) : "",
    filesText(track?.files ?? []),
    done > 0 ? words().agentsDone(done) : ""
  ];
  const running = (track?.agents ?? []).filter((agent) => agent.isRunning).map((agent) => agent.description);
  return { summary: parts.filter(Boolean).join(" · "), agents: running.slice(0, AGENTS_SHOWN) };
}
function details(ui, lines) {
  const { Box, Text } = ui;
  return [
    lines.summary !== "" && h(Box, {
      key: "detail-summary",
      flexDirection: "row",
      paddingLeft: GLYPH_CELLS
    }, h(Text, {
      dimColor: true,
      wrap: "truncate-end"
    }, `› ${lines.summary}`)),
    ...lines.agents.map((agent, index) => h(Box, {
      key: `detail-agent-${index}`,
      flexDirection: "row",
      paddingLeft: GLYPH_CELLS
    }, h(Text, {
      color: "claude"
    }, "● "), h(Text, {
      dimColor: true,
      wrap: "truncate-end"
    }, agent)))
  ];
}
function more(ui, key, text) {
  const { Box, Text } = ui;
  return h(Box, {
    key
  }, h(Text, {
    dimColor: true
  }, `  ${text}`));
}
function detailCount(lines) {
  return (lines.summary === "" ? 0 : 1) + lines.agents.length;
}
function stepList(ui, view, rows) {
  const { steps } = view.plan;
  const current = currentIndex(steps, view.tracks);
  const currentStep = steps[current];
  const lines = currentStep === undefined ? { summary: "", agents: [] } : detailLines(currentStep, view.tracks[currentStep.key]);
  const room = Math.max(MIN_STEP_ROWS, rows - CHROME_ROWS - detailCount(lines));
  const shown = windowOf(steps.length, anchorIndex(steps, view.tracks), room);
  const out = [];
  if (shown.start > 0)
    out.push(more(ui, "more-above", `✓ ${words().moreSteps(shown.start)}`));
  steps.slice(shown.start, shown.end).forEach((step, offset) => {
    const isCurrent = shown.start + offset === current;
    out.push(stepRow$1(ui, step, lookOf(step, { track: view.tracks[step.key], now: view.now, isCurrent })));
    if (isCurrent)
      out.push(...details(ui, lines));
  });
  if (shown.end < steps.length)
    out.push(more(ui, "more-below", `+${words().moreSteps(steps.length - shown.end)}`));
  return out;
}
function headline(plan) {
  const progress = progressOf(plan);
  return `Plan · ${words().headline(progress.done, progress.total)}`;
}
function emptyPane(ui) {
  const { Box, Text } = ui;
  return h(Box, {
    flexDirection: "column",
    paddingX: PAD
  }, h(Text, {
    bold: true
  }, "Plan"), h(Box, {
    key: "empty",
    flexDirection: "row",
    flexWrap: "wrap"
  }, h(Text, {
    wrap: "wrap"
  }, h(Text, {
    bold: true
  }, words().emptyLead), h(Text, {
    dimColor: true
  }, ` · ${words().emptyHow}`))));
}
const motion = paneMotion();
function desktopPane(ui, view, layout) {
  const { Box, Svg } = ui;
  const width = widthFor(layout.columns - GUTTER_COLUMNS, SVG_RANGE);
  const plan = view.plan;
  if (plan === null || plan.steps.length === 0) {
    const empty = emptySvg(view.theme, width);
    return h(Box, {
      flexDirection: "column",
      paddingX: 1,
      paddingY: 1
    }, h(Svg, {
      key: "plan-empty",
      ...motion.pic("plan-empty", { ...empty, width })
    }));
  }
  const steps = plan.steps;
  const current = steps[currentIndex(steps, view.tracks)];
  const details = current === undefined ? { meta: "", files: [], running: [] } : deskDetails(current, view.tracks[current.key]);
  const drawing = planSvg({ plan, tracks: view.tracks, now: view.now, theme: view.theme, width, note: noteOf(view) }, details);
  const alt = `${headline(plan)}${current === undefined ? "" : ` · ${words().now}: ${current.title}`}`;
  const shows = { plan, tracks: view.tracks, theme: view.theme, width, state: planState(plan, { now: view.now, touchedAt: view.touchedAt }), details };
  return h(Box, {
    flexDirection: "column",
    paddingX: 1,
    paddingY: 1
  }, h(Svg, {
    key: "plan-svg",
    ...motion.pic("plan-svg", { source: drawing.source, alt, width, height: drawing.height }, { shows })
  }));
}
function noteOf(view) {
  const at = { now: view.now, touchedAt: view.touchedAt };
  return stateNote(planState(view.plan, at), at);
}
function planPane(ui, view, layout) {
  if (layout.surface !== "terminal" && "Svg" in ui)
    return desktopPane(ui, view, layout);
  const { Box, Text } = ui;
  const plan = view.plan;
  if (plan === null || plan.steps.length === 0)
    return emptyPane(ui);
  const eta = etaOf(plan, view.tracks);
  return h(Box, {
    flexDirection: "column",
    paddingX: PAD
  }, header(ui, headline(plan), [plan.source, noteOf(view)].filter(Boolean).join(" · ")), bar(ui, { percent: progressOf(plan).percent, columns: layout.columns, eta: eta === null || noteOf(view) !== "" ? "" : words().left(formatDuration(eta)) }), h(Text, null, " "), stepList(ui, { ...view, plan }, layout.rows));
}

const PLAN_TASKS = { plugin: "plan-steps", key: "tasks" };
const PLAN_DOC = { plugin: "plan-steps", key: "doc" };
const PLAN_TRACKS = { plugin: "plan-steps", key: "tracks" };
async function planPage($, ui, site) {
  const tasks = (await $.state.get(PLAN_TASKS)).value ?? [];
  const doc = (await $.state.get(PLAN_DOC)).value ?? null;
  const tracks = (await $.state.get(PLAN_TRACKS)).value ?? {};
  const view = { plan: resolvePlan(tasks, doc), tracks, now: await $.clock.now(), theme: "auto", touchedAt: 0 };
  return planPane(ui, view, site);
}

const HUB_DRAWN = ["plan", "checkpoints"];
async function pageOf($, o) {
  switch (o.page) {
    case "plan":
      return planPage($, o.ui, o.site);
    case "checkpoints":
      return checkpointsPage($, o.ui, o.site, o.act);
    default:
      return null;
  }
}
const BEAT = { plugin: "modz", key: "beat" };
const ACT = { plugin: "modz", key: "act" };
const HOME_ROWS = 1;
const DEFAULT_ROWS = 24;
async function pageTree($, e, o) {
  await $.state.get(BEAT);
  const rows = e.props.scroll?.bodyRows || e.viewport?.rows || DEFAULT_ROWS;
  const site = { columns: o.columns, rows: Math.max(rows - HOME_ROWS, 1), surface: o.surface };
  const act = (action, arg) => void $.state.set(ACT, { page: o.page, action, ...arg === undefined ? {} : { arg }, at: Date.now() }).catch((cause) => $.ui.log(`modz: the ${o.page} page's ${action} could not be handed on: ${String(cause)}`, { to: "debug" }));
  const page = await pageOf($, { page: o.page, ui: o.ui, site, act });
  const { Box } = o.ui;
  return h(Box, {
    flexDirection: "column"
  }, HomeButton(o.ui, o.onHome), page);
}

const textOf$1 = (entry, lang) => entry[lang === "tr" ? 1 : 0];
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

const STEPS_SHOWN$1 = 2;
const NAME_MAX$2 = 40;
const WRAPPERS = new Set(["sudo", "time", "command", "exec", "nohup", "env", "then", "do", "else", "if", "while", "until", "!"]);
const SILENT = new Set(["cd", "export", "set", "unset", "source", ".", "for", "done", "fi", "true", "false", ":", "[", "[[", "test", "local", "shift", "wait"]);
const FILTERS = new Set(["grep", "rg", "sed", "awk", "head", "tail", "sort", "uniq", "wc", "cut", "tr", "tee", "xargs", "jq", "column", "less", "cat"]);
const FETCHERS = new Set(["npx", "bunx", "uvx", "pipx"]);
const PASS_ON = new Set(["run", "run-script", "exec", "x", "dlx", "-m", "plugin"]);
const INLINE = new Set(["-c", "-e", "-"]);
const PROPER = /^(GitHub|Git\b|Docker|Claude|Flutter|JSON|Python|iOS|Mac)/;
const base = (path) => path.split("/").filter(Boolean).at(-1) ?? path;
const clip$1 = (text) => text.length > NAME_MAX$2 ? `${text.slice(0, NAME_MAX$2 - 1)}…` : text;
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
function wordsOf$1(command) {
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
  const { kept, out } = splitRedirects(wordsOf$1(command));
  const words = kept.map((word) => word.replace(/^[({]+/, ""));
  while (words.length > 0 && GLUE.has(words[0] ?? ""))
    words.shift();
  while (words.length > 0 && (WRAPPERS.has(words[0] ?? "") || /^\w+\+?=/.test(words[0] ?? "")))
    words.shift();
  const [first, ...args] = words;
  return first === undefined || first.startsWith("#") ? null : { name: first, args, out };
}
const namedOf$1 = (kind, args) => {
  const plain = args.filter((arg) => !isFlag(arg) && !/^\d+$/.test(arg));
  if (kind === "first")
    return clip$1(base(plain[0] ?? ""));
  if (kind === "host")
    return /^[a-z]+:\/\/([^/?#]+)/i.exec(plain.find((arg) => arg.includes("://")) ?? "")?.[1] ?? "";
  if (kind === "file")
    return clip$1(base(plain.at(-1) ?? ""));
  return kind === "arg" ? clip$1(plain[0] ?? "") : "";
};
const say = (entry, lang, x = "") => fill(textOf$1(entry, lang), x);
function familySay(family, args, lang) {
  const words = args.filter((arg) => !isFlag(arg) || arg === "-m");
  const at = words.findIndex((word) => !PASS_ON.has(word));
  const sub = words[at] ?? words[0] ?? "";
  const entry = family.sub[sub] ?? family.sub[words[0] ?? ""] ?? family.rest;
  return say(entry, lang, entry === family.rest ? clip$1(sub) : namedOf$1(entry[2], words.slice(at + 1)));
}
function specialSay(call, lang) {
  const { name, args } = call;
  const has = (...flags) => args.some((arg) => flags.includes(arg));
  const combined = (letter) => args.some((arg) => /^-[a-zA-Z]+$/.test(arg) && arg.includes(letter));
  const second = args.filter((arg) => !isFlag(arg))[1] ?? "";
  if (name === "git" && (args[0] === "checkout" || args[0] === "switch") && has("-b", "-B", "-c"))
    return say(SHELL.newBranch, lang, clip$1(args.filter((arg) => !isFlag(arg))[1] ?? ""));
  if (name === "git" && args[0] === "reset" && has("--hard", "--merge", "--keep"))
    return say(SHELL.hardReset, lang);
  if (name === "git" && args[0] === "checkout" && (has("--", ".") || has("-f", "--force")))
    return say(SHELL.discard, lang);
  if (name === "git" && args[0] === "stash" && (second === "drop" || second === "clear"))
    return say(SHELL.dropStash, lang);
  if (name === "git" && args[0] === "branch" && (has("-D", "--delete") || combined("d")))
    return say(SHELL.deleteBranch, lang, clip$1(args.filter((arg) => !isFlag(arg))[1] ?? ""));
  if (name === "git" && args[0] === "push" && (has("--force", "--force-with-lease") || combined("f")))
    return say(SHELL.forcePush, lang);
  if (name === "gh" && args[0] === "pr" && second === "create")
    return say(SHELL.prCreate, lang);
  if (name === "gh" && args[0] === "pr" && second === "merge")
    return say(SHELL.prMerge, lang);
  if (name === "rm" && (combined("r") || combined("R") || has("--recursive")))
    return say(SHELL.deleteFolder, lang, namedOf$1("file", args));
  if (name === "find" && has("-delete"))
    return say(SHELL.findDelete, lang);
  if (name === "sed" && (has("-i", "--in-place") || args.some((arg) => arg.startsWith("-i"))))
    return say(SHELL.editInPlace, lang, namedOf$1("file", args));
  if (call.out !== "" && (name === "echo" || name === "printf" || name === "cat"))
    return say(SHELL.writeFile, lang, clip$1(base(call.out)));
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
    return known === say(SHELL.unknown, lang, clip$1(base(tool))) ? say(SHELL.fetchedTool, lang, clip$1(tool)) : known;
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
    return say(entry, lang, entry === SERVICE ? name : namedOf$1(entry[2], call.args));
  if (call.name.includes("/"))
    return say(SHELL.ownScript, lang, clip$1([name, ...call.args.filter((arg) => !isFlag(arg)).slice(0, 1)].join(" ")));
  return say(SHELL.unknown, lang, clip$1(name));
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
  const shown = unique.slice(0, STEPS_SHOWN$1).map((text, i) => i === 0 ? text : lowerFirst(text, lang));
  const more = unique.length - shown.length;
  return shown.join(textOf$1(SHELL.then, lang)) + (more > 0 ? say(SHELL.more, lang, String(more)) : "");
}

const KIND_ICON = {
  read: "eye",
  search: "search",
  edit: "pencil",
  run: "terminal",
  test: "shield",
  save: "bookmark",
  github: "branch",
  install: "cube",
  delete: "trash",
  web: "globe",
  agent: "sparkle",
  wait: "clock",
  ask: "bell",
  plan: "list",
  service: "plug"
};
const WORDS$2 = {
  read: ["look", "inceleme"],
  search: ["search", "arama"],
  edit: ["change", "değişiklik"],
  run: ["command", "komut"],
  test: ["check", "kontrol"],
  save: ["saved version", "sürüm kaydı"],
  github: ["GitHub", "GitHub"],
  install: ["install", "kurulum"],
  delete: ["delete", "silme"],
  web: ["internet", "internet"],
  agent: ["helper agent", "yardımcı ajan"],
  wait: ["wait", "bekleme"],
  ask: ["question", "soru"],
  plan: ["plan", "plan"],
  service: ["connected service", "bağlı servis"]
};
const kindWord = (kind, lang) => WORDS$2[kind][lang === "tr" ? 1 : 0];
const TOOL_KIND = {
  Read: "read",
  NotebookRead: "read",
  Skill: "read",
  BashOutput: "read",
  TaskOutput: "read",
  Monitor: "read",
  Glob: "search",
  Grep: "search",
  LS: "search",
  ToolSearch: "search",
  Write: "edit",
  Edit: "edit",
  MultiEdit: "edit",
  NotebookEdit: "edit",
  WebSearch: "web",
  WebFetch: "web",
  Artifact: "web",
  Agent: "agent",
  Task: "agent",
  SendMessage: "agent",
  SubagentHandback: "agent",
  TodoWrite: "plan",
  TaskCreate: "plan",
  TaskUpdate: "plan",
  TaskList: "plan",
  TaskGet: "plan",
  EnterPlanMode: "plan",
  ExitPlanMode: "plan",
  AskUserQuestion: "ask",
  ScheduleWakeup: "wait",
  CronCreate: "wait"
};
const LOOKS = new Set(["cat", "head", "tail", "less", "ls", "wc", "stat", "file", "tree", "du", "which", "pwd", "echo", "diff"]);
const SEARCHES = new Set(["grep", "rg", "find", "fd", "ag"]);
const GIT_LOOKS = new Set(["status", "log", "diff", "show", "branch", "ls-files", "remote", "blame", "worktree", "rev-parse", "fetch"]);
const INSTALLERS = new Set(["npm", "pnpm", "yarn", "bun", "pip", "pip3", "brew", "cargo", "gem", "apt", "apt-get", "flutter", "dart"]);
const INSTALL_VERBS = new Set(["install", "add", "i", "ci", "get", "upgrade"]);
const CHECK_WORD = /^(tests?|check|validate|lint|tsc|jest|vitest|pytest|typecheck|analyze)$/;
const WEIGHT = ["wait", "read", "search", "run", "web", "test", "install", "github", "save", "delete"];
const last = (path) => path.split("/").filter(Boolean).at(-1) ?? path;
function commandKind(call) {
  const name = last(call.name);
  const verb = call.args.find((arg) => !arg.startsWith("-")) ?? "";
  if (name === "sleep")
    return "wait";
  if (name === "gh")
    return "github";
  if (name === "git")
    return GIT_LOOKS.has(verb) ? "read" : "save";
  if (name === "rm" || name === "rmdir" || name === "find" && call.args.includes("-delete"))
    return "delete";
  if (name === "curl" || name === "wget")
    return "web";
  if ([name, ...call.args].some((word) => CHECK_WORD.test(last(word))))
    return "test";
  if (INSTALLERS.has(name) && call.args.some((arg) => INSTALL_VERBS.has(arg)))
    return "install";
  if (SEARCHES.has(name))
    return "search";
  return LOOKS.has(name) ? "read" : "run";
}
function shellKind(command) {
  const kinds = leadsOf(command).map(commandKind);
  return kinds.reduce((top, kind) => WEIGHT.indexOf(kind) > WEIGHT.indexOf(top) ? kind : top, kinds[0] ?? "run");
}
function serviceKind(tool) {
  if (/browser|chrome|playwright|web_|exa|fetch/i.test(tool))
    return "web";
  return /github/i.test(tool) ? "github" : "service";
}
const fieldOf = (input, name) => {
  const value = typeof input === "object" && input !== null ? input[name] : undefined;
  return typeof value === "string" ? value.trim() : "";
};
function kindOf(tool, input) {
  if (tool === "Bash" || tool === "PowerShell")
    return shellKind(fieldOf(input, "command"));
  if (tool.startsWith("mcp__"))
    return serviceKind(tool);
  return TOOL_KIND[tool] ?? "service";
}
const PURPOSE_MAX = 96;
function purposeOf(input) {
  const text = (fieldOf(input, "description") || fieldOf(input, "action_summary")).split(`
`)[0]?.trim() ?? "";
  return text.length > PURPOSE_MAX ? `${text.slice(0, PURPOSE_MAX - 1)}…` : text;
}

const NAME_MAX$1 = 48;
const EDIT = [["Changing the file {x}", "{x} dosyasını değiştiriyor"], "file_path", "file"];
const TASKS = [["Updating its to-do list", "Yapılacaklar listesini güncelliyor"]];
const HELPER = [["Handing a job to a helper agent[: {x}]", "Bir yardımcı ajana iş veriyor[: {x}]"], "description"];
const BACKGROUND = [["Checking on a command running in the background", "Arka planda çalışan komutun durumuna bakıyor"]];
const STOP = [["Stopping a command running in the background", "Arka planda çalışan komutu durduruyor"]];
const TIMER = [["Setting up work to run later", "Daha sonra çalışacak bir iş ayarlıyor"]];
const TOOLS = {
  Read: [["Reading the file {x}", "{x} dosyasını okuyor"], "file_path", "file"],
  Write: [["Writing the file {x}", "{x} dosyasını yazıyor"], "file_path", "file"],
  Edit: EDIT,
  MultiEdit: EDIT,
  NotebookEdit: [["Changing the notebook {x}", "{x} not defterini değiştiriyor"], "notebook_path", "file"],
  Glob: [["Looking for files named like “{x}”", "Adı “{x}” kalıbına uyan dosyaları arıyor"], "pattern"],
  Grep: [["Searching inside files for “{x}”", "Dosyaların içinde “{x}” arıyor"], "pattern"],
  LS: [["Listing the files in a folder", "Bir klasördeki dosyaları listeliyor"]],
  WebSearch: [["Searching the web for “{x}”", "İnternette “{x}” arıyor"], "query"],
  WebFetch: [["Reading a web page[: {x}]", "Bir internet sayfasını okuyor[: {x}]"], "url", "host"],
  Agent: HELPER,
  Task: HELPER,
  SubagentHandback: [["Handing its finished report back to the chat that started it", "Bitirdiği işin raporunu kendisini başlatan sohbete teslim ediyor"]],
  SendMessage: [["Sending a message to another agent", "Başka bir ajana mesaj gönderiyor"]],
  TodoWrite: TASKS,
  TaskCreate: TASKS,
  TaskUpdate: TASKS,
  TaskList: TASKS,
  TaskGet: TASKS,
  update_plan: TASKS,
  Skill: [["Loading a ready-made set of instructions[: {x}]", "Hazır bir talimat paketini (skill) yüklüyor[: {x}]"], "skill"],
  ToolSearch: [["Looking for a tool it needs[: {x}]", "İhtiyaç duyduğu aracı arıyor[: {x}]"], "query", "tools"],
  AskUserQuestion: [["Asking you a question", "Sana bir soru soruyor"]],
  EnterPlanMode: [["Starting to write a plan before it acts", "İşe başlamadan önce plan yazmaya geçiyor"]],
  ExitPlanMode: [["Showing you its plan for approval", "Hazırladığı planı onayına sunuyor"]],
  BashOutput: BACKGROUND,
  TaskOutput: BACKGROUND,
  Monitor: BACKGROUND,
  KillShell: STOP,
  TaskStop: STOP,
  Artifact: [["Publishing a page you can open", "Açabileceğin bir sayfa yayımlıyor"]],
  ScheduleWakeup: TIMER,
  CronCreate: TIMER,
  EnterWorktree: [["Making a separate copy of the project to work in", "Çalışmak için projenin ayrı bir kopyasını açıyor"]]
};
const BROWSER = ["Using the browser", "Tarayıcıyı kullanıyor"];
const SERVERS = [
  [/browser|chrome|playwright/i, BROWSER],
  [/computer/i, ["Using the mouse and keyboard on this computer", "Bu bilgisayarda fareyi ve klavyeyi kullanıyor"]],
  [/github/i, ["Working on GitHub", "GitHub üzerinde çalışıyor"]],
  [/context7/i, ["Reading a library’s up-to-date manual", "Bir kütüphanenin güncel kılavuzunu okuyor"]],
  [/\brea\b/i, ["Taking an app apart to see how it works", "Bir uygulamanın içini açıp nasıl çalıştığına bakıyor"]],
  [/simulator/i, ["Using the iPhone simulator", "iPhone simülatörünü kullanıyor"]],
  [/terminal/i, ["Looking at your terminal", "Terminaline bakıyor"]],
  [/ccd_|savvy|modz|skins|transceiver/i, ["Updating what the app shows you", "Uygulamanın sana gösterdiklerini güncelliyor"]]
];
const BROWSER_ACTS = [
  [/navigate|open_url|preview_start/, ["Opening a page in the browser", "Tarayıcıda bir sayfa açıyor"]],
  [/screenshot/, ["Taking a picture of the page", "Sayfanın görüntüsünü alıyor"]],
  [/read_page|get_page|page_text|snapshot|find/, ["Reading the page in the browser", "Tarayıcıdaki sayfayı okuyor"]],
  [/click|press|hover|drag/, ["Clicking on the page", "Sayfada bir yere tıklıyor"]],
  [/type|fill|form_input|select/, ["Typing into the page", "Sayfaya yazı yazıyor"]],
  [/console|network|javascript|evaluate/, ["Checking how the page runs", "Sayfanın nasıl çalıştığını denetliyor"]]
];
const OTHER = {
  service: ["Using the connected “{x}” service", "Bağlı “{x}” servisini kullanıyor"],
  tool: ["Using the “{x}” tool", "“{x}” aracını kullanıyor"],
  command: ["Running a terminal command", "Bir terminal komutu çalıştırıyor"]
};
const fieldsOf$1 = (input) => typeof input === "object" && input !== null ? input : {};
const clip = (text) => text.length > NAME_MAX$1 ? `${text.slice(0, NAME_MAX$1 - 1)}…` : text;
const firstLine = (text) => text.split(`
`)[0]?.trim() ?? "";
function namedOf(value, as) {
  const text = typeof value === "string" ? firstLine(value) : "";
  if (as === "file")
    return text.split("/").filter(Boolean).at(-1) ?? "";
  if (as === "host")
    return /^[a-z]+:\/\/([^/?#]+)/i.exec(text)?.[1] ?? "";
  if (as === "tools")
    return clip(text.replace(/^select:/, "").split(",").map((name) => (name.split("__").at(-1) ?? name).replace(/_+/g, " ").trim()).join(", "));
  return clip(text);
}
function serviceSay(tool, lang) {
  const [, server = "", ...rest] = tool.split("__");
  const name = rest.join(" ");
  const known = SERVERS.find(([pattern]) => pattern.test(server))?.[1];
  if (known === BROWSER)
    return textOf$1(BROWSER_ACTS.find(([pattern]) => pattern.test(name))?.[1] ?? BROWSER, lang);
  if (known !== undefined)
    return textOf$1(known, lang);
  const isId = /^[0-9a-f-]{20,}$/i.test(server);
  return fill(textOf$1(isId ? OTHER.tool : OTHER.service, lang), clip((isId ? name : server).replace(/[_-]+/g, " ")));
}
function plainCall(tool, input, lang) {
  const fields = fieldsOf$1(input);
  if (tool === "Bash" || tool === "PowerShell") {
    const command = typeof fields.command === "string" ? fields.command : "";
    return command.trim() === "" ? textOf$1(OTHER.command, lang) : plainShell(command, lang);
  }
  if (tool.startsWith("mcp__"))
    return serviceSay(tool, lang);
  const known = TOOLS[tool];
  if (known === undefined)
    return fill(textOf$1(OTHER.tool, lang), clip(tool));
  const [entry, field, as] = known;
  const named = field === undefined ? "" : namedOf(fields[field], as);
  const template = textOf$1(entry, lang);
  return named === "" && /(^|[^[])\{x\}/.test(template.replace(/\[[^\]]*\]/g, "")) ? fill(textOf$1(OTHER.tool, lang), tool) : fill(template, named);
}

const FILES_MAX = 4;
const RESULT_MAX = 110;
const FILE_WORD = /(?:~|\.{1,2})?\/?[\w@.-]+(?:\/[\w@.-]+)*\.(?:tsx?|jsx?|mjs|cjs|json|md|py|sh|html|css|ya?ml|toml|swift|dart|cs|go|rs|txt|svg|png)\b/g;
const LEADING_CD = /^\s*cd\s+("([^"]+)"|'([^']+)'|(\/\S+))/;
const fieldsOf = (value) => typeof value === "object" && value !== null ? value : {};
function folderOf(command) {
  const moved = LEADING_CD.exec(command);
  const folder = moved?.[2] ?? moved?.[3] ?? moved?.[4];
  return folder?.startsWith("/") === true ? folder.replace(/[;&]+$/, "").replace(/\/$/, "") : undefined;
}
function commandFiles(input) {
  const command = fieldsOf(input).command;
  if (typeof command !== "string")
    return [];
  const folder = folderOf(command);
  const files = (command.match(FILE_WORD) ?? []).flatMap((word) => {
    const path = word.startsWith("/") ? word : folder === undefined || word.startsWith("~") ? undefined : `${folder}/${word.replace(/^\.\//, "")}`;
    return path === undefined ? [] : [{ name: path.split("/").at(-1) ?? path, path }];
  });
  return files.filter((file, i) => files.findIndex((other) => other.path === file.path) === i).slice(0, FILES_MAX);
}
function textOf(output) {
  if (typeof output === "string")
    return output;
  if (Array.isArray(output))
    return output.map(textOf).join(`
`);
  const fields = fieldsOf(output);
  return ["stdout", "stderr", "text", "content", "output", "result"].map((key) => fields[key] === undefined ? "" : textOf(fields[key])).filter(Boolean).join(`
`);
}
const WORDS$1 = {
  en: { none: "found nothing", more: (n) => `(+${n} more ${n === 1 ? "line" : "lines"})` },
  tr: { none: "hiçbir şey bulamadı", more: (n) => `(+${n} satır daha)` }
};
function resultLine(call, lang) {
  const isSearch = call.tool === "Grep" || call.tool === "Glob";
  if (call.tool !== "Bash" && !isSearch || call.output === undefined)
    return "";
  const words = WORDS$1[lang === "tr" ? "tr" : "en"];
  const lines = textOf(call.output).split(`
`).map((line) => line.trim()).filter((line) => line !== "");
  const first = lines[0];
  if (first === undefined)
    return isSearch ? `→ ${words.none}` : "";
  const shown = first.length > RESULT_MAX ? `${first.slice(0, RESULT_MAX - 1)}…` : first;
  return `→ ${shown}${lines.length > 1 ? ` ${words.more(lines.length - 1)}` : ""}`;
}

const ROLES = ["read", "edit", "run", "ok", "warn", "danger", "plan"];
const role = (fg, tint, line) => ({ fg, tint, line });
const DARK = {
  sheet: "#191917",
  card: "#1F1F1C",
  inset: "#171715",
  line: "#2E2E2A",
  lineStrong: "#45443F",
  track: "#34332F",
  hi: "#F0EEE8",
  mid: "#C2BEB4",
  lo: "#8E8A80",
  roles: {
    read: role("#7FB6E8", "#1E2B37", "#2F4A63"),
    edit: role("#E58A5F", "#38251D", "#6A3E2D"),
    run: role("#B19CF3", "#29243D", "#4A3F75"),
    ok: role("#6FC593", "#1B2F25", "#2F5A42"),
    warn: role("#E9B949", "#332D19", "#66552A"),
    danger: role("#F2727F", "#3B2023", "#74343C"),
    plan: role("#E07BC0", "#351F2E", "#6B3A5C")
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
  lo: "#77726A",
  roles: {
    read: role("#2464A0", "#E7F0F9", "#B9D3EC"),
    edit: role("#A94A26", "#FBEDE6", "#EFC6B4"),
    run: role("#6243C4", "#F0ECFC", "#CFC3F3"),
    ok: role("#1F6E43", "#E4F4EA", "#B5DEC4"),
    warn: role("#8A6000", "#FBF2D9", "#EBD48F"),
    danger: role("#C0263A", "#FCE8EA", "#F1B9C0"),
    plan: role("#A8337F", "#FBE9F4", "#EDBFDC")
  }
};
const palette = (isLight) => isLight ? LIGHT : DARK;
const OWN_BADGES = {
  doc: { dark: { fg: "#B8AADA", tint: "#252230" }, light: { fg: "#5A4691", tint: "#F6F4FD" } },
  misc: { dark: { fg: DARK.lo, tint: DARK.inset }, light: { fg: LIGHT.mid, tint: LIGHT.track } }
};
const MOTION = {
  quickMs: 120,
  stateMs: 200,
  travelMs: 320,
  ease: "cubic-bezier(.2,.8,.2,1)",
  breatheS: 1.8,
  shimmerS: 1.4,
  breatheLow: 0.45
};
const kebab = (name) => name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
function paintVars(isLight) {
  const p = palette(isLight);
  const vars = {};
  const { roles, ...neutrals } = p;
  for (const [name, hex] of Object.entries(neutrals))
    vars[kebab(name)] = hex;
  for (const name of ROLES) {
    vars[name] = roles[name].fg;
    vars[`${name}-tint`] = roles[name].tint;
    vars[`${name}-line`] = roles[name].line;
  }
  for (const kind of ["doc", "misc"]) {
    const own = OWN_BADGES[kind][isLight ? "light" : "dark"];
    vars[`file-${kind}`] = own.fg;
    vars[`file-${kind}-tint`] = own.tint;
  }
  return vars;
}
const PAINTS = Object.keys(paintVars(false));
const LOOPS = {
  breathe: `@keyframes breathe{50%{opacity:${MOTION.breatheLow}}}.breathe{animation:breathe ${MOTION.breatheS}s ease-in-out infinite}`,
  shimmer: `@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}.shimmer{animation:shimmer ${MOTION.shimmerS}s linear infinite}`
};
const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, 'Segoe UI', system-ui, sans-serif`;
const MONO = `ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace`;
const REDUCED = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
const varBlock = (vars, names) => `svg{${names.map((name) => `--${name}:${vars[name]}`).join(";")}}`;
function svgStyle(body) {
  const used = body === undefined ? PAINTS : PAINTS.filter((name) => new RegExp(`[fs]-${name}\\b(?!-)`).test(body));
  const rules = used.map((name) => `.f-${name}{fill:var(--${name})}.s-${name}{stroke:var(--${name})}`).join("");
  const loops = Object.keys(LOOPS).filter((name) => body === undefined || body.includes(name)).map((name) => LOOPS[name]).join("");
  return [
    varBlock(paintVars(false), used),
    `@media (prefers-color-scheme: light){${varBlock(paintVars(true), used)}}`,
    `text{font-family:${FONT}}.mono{font-family:${MONO};font-variant-numeric:tabular-nums}`,
    rules,
    loops,
    REDUCED
  ].join("");
}

const CAP_EM = 0.7;
const DECIMALS = 100;
const num = (value) => String(Math.round(value * DECIMALS) / DECIMALS);
const escapeXml = (text) => text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const sans = (size, weight) => (text) => textWidth(text, size, weight);
const baseline = (top, height, size) => Math.round(top + height / 2 + size * CAP_EM / 2);
const SCHEME = ":root{color-scheme:light dark}";
function toPic(part) {
  const { width, height } = part;
  const source = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`,
    ` role="img" aria-label="${escapeXml(part.alt)}"><style>${SCHEME}${svgStyle(part.body)}</style>${part.body}</svg>`
  ].join("");
  return { source, width, height, alt: part.alt };
}
function textEl(t) {
  const classes = [`f-${t.paint}`, t.isMono ? "mono" : "", t.className ?? ""].filter(Boolean).join(" ");
  const attrs = [
    `x="${num(t.x)}" y="${num(t.y)}" class="${classes}" font-size="${t.size}"`,
    t.weight === undefined ? "" : ` font-weight="${t.weight}"`,
    t.anchor === undefined || t.anchor === "start" ? "" : ` text-anchor="${t.anchor}"`,
    t.tracking === undefined ? "" : ` letter-spacing="${num(t.tracking)}"`
  ].join("");
  return `<text ${attrs}>${escapeXml(t.text)}</text>`;
}
const rectEl = (r, extra = "") => `<rect x="${num(r.x)}" y="${num(r.y)}" width="${num(Math.max(0, r.width))}" height="${num(r.height)}"${r.radius ? ` rx="${num(r.radius)}"` : ""} class="f-${r.paint}${r.className ? ` ${r.className}` : ""}"${extra}/>`;

const ICON = 16;
const HEIGHT = 20;
const JOIN = 10;
const GAP = 6;
const LABEL = { size: 11.5, weight: 500 };
const COUNT = { size: 11, weight: 600 };
const LABEL_GAP = 4;
const STOPS_SHOWN = 6;
const PAINT = { done: "mid", live: "edit", failed: "danger", stopped: "lo" };
const CELLS = { cell: 1.8, pitch: 2.2 };
const glyphAt = (kind, state, x, y) => pixelGlyph(KIND_ICON[kind], { x, y, box: ICON, ...CELLS, className: `f-${PAINT[state]}` });
function kindPic(kind, state) {
  const body = glyphAt(kind, state, 0, 0);
  return toPic({ body, width: ICON, height: ICON, alt: kindWord(kind, lang()) });
}
function stopAt(stop, x) {
  const icon = glyphAt(stop.kind, stop.state, x, (HEIGHT - ICON) / 2);
  const word = kindWord(stop.kind, lang());
  const wordX = x + ICON + LABEL_GAP;
  const label = textEl({ x: wordX, y: baseline(0, HEIGHT, LABEL.size), text: word, paint: "mid", ...LABEL });
  const end = wordX + sans(LABEL.size, LABEL.weight)(word);
  if (stop.count < 2)
    return { body: icon + label, x: end };
  const times = `×${stop.count}`;
  const count = textEl({ x: end + LABEL_GAP, y: baseline(0, HEIGHT, COUNT.size), text: times, paint: "lo", ...COUNT });
  return { body: icon + label + count, x: end + LABEL_GAP + sans(COUNT.size, COUNT.weight)(times) };
}
const joinAt = (x) => ({
  body: rectEl({ x: x + GAP, y: HEIGHT / 2 - 0.5, width: JOIN, height: 1, paint: "line-strong" }),
  x: x + GAP + JOIN + GAP
});
const altOf = (flow) => flow.map((stop) => stop.count > 1 ? `${kindWord(stop.kind, lang())} ×${stop.count}` : kindWord(stop.kind, lang())).join(" → ");
function flowPic(flow) {
  if (flow.length < 2)
    return null;
  const shown = flow.slice(0, STOPS_SHOWN);
  const drawn = shown.reduce((sofar, stop, i) => {
    const from = i === 0 ? sofar : joinAt(sofar.x);
    const at = stopAt(stop, from.x);
    return { body: sofar.body + (i === 0 ? "" : from.body) + at.body, x: at.x };
  }, { body: "", x: 0 });
  const rest = flow.length - shown.length;
  const more = rest > 0 ? textEl({ x: drawn.x + GAP * 2, y: baseline(0, HEIGHT, COUNT.size), text: `+${rest}`, paint: "lo", ...COUNT }) : "";
  const width = Math.ceil(drawn.x + (rest > 0 ? GAP * 2 + sans(COUNT.size, COUNT.weight)(`+${rest}`) : 0));
  return toPic({ body: drawn.body + more, width, height: HEIGHT, alt: altOf(flow) });
}

const HOUSEKEEPING = /^mcp__(ccd_|savvy-progress__)/;
const STEPS_SHOWN = 8;
const NAMES_SHOWN = 3;
const NAME_MAX = 28;
const NAMED_BY = ["file_path", "notebook_path", "pattern", "query", "url"];
const MANY = {
  read: { en: (n) => `Reading ${n} files`, tr: (n) => `${n} dosya okuyor` },
  edit: { en: (n) => `Changing ${n} files`, tr: (n) => `${n} dosyayı değiştiriyor` },
  search: { en: (n) => `Searching the files ${n} times`, tr: (n) => `Dosyalarda ${n} arama yapıyor` },
  web: { en: (n) => `Looking on the internet ${n} times`, tr: (n) => `İnternette ${n} kez bakıyor` }
};
const RANK = ["done", "live", "stopped", "failed"];
const isTold = (tool) => !HOUSEKEEPING.test(tool);
function stateOf(call) {
  if (call.isInterrupted === true)
    return "stopped";
  if (call.isErrored === true)
    return "failed";
  return call.isRunning === true ? "live" : "done";
}
const worst = (states) => states.reduce((top, state) => RANK.indexOf(state) > RANK.indexOf(top) ? state : top, "done");
const unique = (list) => list.filter((item, i) => list.indexOf(item) === i);
function nameOf(input) {
  const fields = typeof input === "object" && input !== null ? input : {};
  const field = NAMED_BY.find((key) => typeof fields[key] === "string" && fields[key] !== "");
  if (field === undefined)
    return "";
  const value = String(fields[field]);
  if (field === "url")
    return value.replace(/^\w+:\/\//, "").split("/")[0] ?? value;
  const name = field === "pattern" || field === "query" ? `“${value}”` : value.split("/").filter(Boolean).at(-1) ?? value;
  return name.length > NAME_MAX ? `${name.slice(0, NAME_MAX - 1)}…` : name;
}
function fileOf(input) {
  const fields = typeof input === "object" && input !== null ? input : {};
  const path = fields.file_path ?? fields.notebook_path;
  if (typeof path !== "string" || !path.startsWith("/"))
    return;
  return { name: path.split("/").filter(Boolean).at(-1) ?? path, path };
}
const toldOf = (call, lang) => ({
  kind: kindOf(call.tool, call.input),
  why: purposeOf(call.input),
  said: plainCall(call.tool, call.input, lang),
  name: nameOf(call.input),
  file: fileOf(call.input),
  state: stateOf(call)
});
const keyOf = (told) => {
  if (told.why !== "")
    return `why:${told.why}`;
  return MANY[told.kind] === undefined ? `said:${told.said}` : `kind:${told.kind}`;
};
const listOf = (names) => names.slice(0, NAMES_SHOWN).join(", ") + (names.length > NAMES_SHOWN ? ` +${names.length - NAMES_SHOWN}` : "");
function stepOf(bucket, lang) {
  const first = bucket[0];
  const state = worst(bucket.map((told) => told.state));
  const files = bucket.flatMap((told) => told.file === undefined ? [] : [told.file]).filter((file, i, all) => all.findIndex((other) => other.path === file.path) === i);
  if (first.why !== "")
    return { kind: first.kind, text: first.why, note: "", count: bucket.length, state, files };
  const names = unique(bucket.map((told) => told.name).filter((name) => name !== ""));
  const many = MANY[first.kind];
  if (many !== undefined && names.length > 1)
    return { kind: first.kind, text: many[lang](names.length), note: listOf(names), count: 1, state, files };
  return { kind: first.kind, text: first.said, note: "", count: bucket.length, state, files };
}
function flowOf(told) {
  const flow = [];
  for (const { kind, state } of told) {
    const stop = flow.at(-1);
    if (stop?.kind === kind)
      Object.assign(stop, { count: stop.count + 1, state: worst([stop.state, state]) });
    else
      flow.push({ kind, count: 1, state });
  }
  return flow;
}
function trailOf(calls, lang) {
  const all = calls.filter((call) => isTold(call.tool)).map((call) => toldOf(call, lang));
  const working = all.filter((told) => told.kind !== "wait");
  const told = working.length > 0 ? working : all;
  const keys = unique(told.map(keyOf));
  const steps = keys.map((key) => stepOf(told.filter((item) => keyOf(item) === key), lang));
  return { steps: steps.slice(0, STEPS_SHOWN), more: Math.max(0, steps.length - STEPS_SHOWN), flow: flowOf(told) };
}

const WORDS = {
  en: { failed: "did not work", stopped: "stopped halfway", more: (n) => `+${n} more ${n === 1 ? "step" : "steps"}` },
  tr: { failed: "başarısız oldu", stopped: "yarıda kesildi", more: (n) => `+${n} adım daha` }
};
const MARK = { done: "✓", live: "●", failed: "✗", stopped: "—" };
const MARK_KEY = { done: undefined, live: "claude", failed: "error", stopped: undefined };
function endOf(state) {
  const words = pick$2(WORDS);
  if (state === "failed")
    return `${MARK.failed} ${words.failed}`;
  return state === "stopped" ? `${MARK.stopped} ${words.stopped}` : MARK[state];
}
function stepOfCall(call) {
  const file = fileOf(call.input);
  return { kind: kindOf(call.tool, call.input), text: plainCall(call.tool, call.input, lang()), note: "", count: 1, state: stateOf(call), files: file === undefined ? [] : [file] };
}
function iconOf(draw, step) {
  const { Svg, Text } = draw.ui;
  if (draw.isText)
    return h(Text, {
      dimColor: true
    }, GLYPH[KIND_ICON[step.kind]]);
  const pic = kindPic(step.kind, step.state);
  return h(Svg, {
    source: pic.source,
    alt: pic.alt,
    width: pic.width,
    height: pic.height
  });
}
const FILES_SHOWN = 3;
const MARKDOWN_MARKS = /([\\`*_{}[\]<>#|~])/g;
const hrefOf = (file) => `file://${encodeURI(file.path)}`;
const escaped = (text) => text.replace(MARKDOWN_MARKS, "\\$1");
const markdownLink = (file) => `[${escaped(file.name)}](<${hrefOf(file)}>)`;
function linkedWords(text, file) {
  const at = file === undefined ? -1 : text.indexOf(file.name);
  if (file === undefined || at < 0)
    return escaped(text);
  return escaped(text.slice(0, at)) + markdownLink(file) + escaped(text.slice(at + file.name.length));
}
function stepMarkdown(step) {
  if (step.files.length > 1) {
    const rest = step.files.length - FILES_SHOWN;
    return `${escaped(step.text)} · ${step.files.slice(0, FILES_SHOWN).map(markdownLink).join(", ")}${rest > 0 ? ` +${rest}` : ""}`;
  }
  const file = step.files[0];
  const line = [step.text, step.note].filter((part) => part !== "").map((part) => linkedWords(part, file)).join(" · ");
  return file === undefined || line.includes("](<") ? line : `${line} · ${markdownLink(file)}`;
}
function named(draw, text, step) {
  const { Link } = draw.ui;
  const file = step.files.length === 1 ? step.files[0] : undefined;
  const at = file === undefined || !draw.isText || Link === undefined ? -1 : text.indexOf(file.name);
  if (file === undefined || at < 0)
    return [text];
  return [text.slice(0, at), h(Link, {
    key: `file-${at}`,
    href: hrefOf(file)
  }, file.name), text.slice(at + file.name.length)];
}
function wordsOf(draw, step, key) {
  const { Markdown, Text } = draw.ui;
  if (!draw.isText && step.files.length > 0 && Markdown !== undefined)
    return h(Markdown, {
      key: `${key}-words`,
      text: stepMarkdown(step)
    });
  if (draw.isText) {
    return h(Text, {
      wrap: "truncate-end"
    }, h(Text, null, named(draw, step.text, step)), step.note === "" ? null : h(Text, {
      dimColor: true
    }, " · ", named(draw, step.note, step)));
  }
  const { Box } = draw.ui;
  return h(Box, {
    flexDirection: "column"
  }, h(Text, null, step.text), step.note === "" ? null : h(Text, {
    dimColor: true
  }, step.note));
}
function stepRow(draw, step, key, hasEnd) {
  const { Box, Text } = draw.ui;
  const tail = [step.count > 1 ? `×${step.count}` : "", hasEnd ? endOf(step.state) : ""].filter(Boolean).join(" ");
  return h(Box, {
    key,
    flexDirection: "row",
    alignItems: draw.isText ? "center" : "flex-start",
    columnGap: 1
  }, iconOf(draw, step), h(Box, {
    flexShrink: 1
  }, wordsOf(draw, step, key)), tail === "" ? null : h(Box, {
    flexShrink: 0
  }, h(Text, {
    color: MARK_KEY[step.state],
    dimColor: MARK_KEY[step.state] === undefined
  }, tail)));
}
function under(draw, row, trail) {
  const { Box } = draw.ui;
  return h(Box, {
    flexDirection: "column"
  }, row, trail);
}
function callTrail(draw, call) {
  const { Text } = draw.ui;
  const step = stepOfCall(call);
  const hasEnd = step.state === "failed" || step.state === "stopped";
  const why = purposeOf(call.input);
  const files = step.files.length > 0 ? step.files : commandFiles(call.input);
  const told = stepRow(draw, { ...step, text: why === "" ? step.text : why, note: "", files }, "plain-0", hasEnd);
  const result = resultLine(call, lang());
  return [told, ...result === "" ? [] : [h(Text, {
    key: "plain-result",
    dimColor: true
  }, result)]];
}
function groupTrail(draw, calls) {
  const { Svg, Text } = draw.ui;
  const trail = trailOf(calls, lang());
  const flow = draw.isText ? null : flowPic(trail.flow);
  return [
    flow === null ? null : h(Svg, {
      key: "plain-flow",
      source: flow.source,
      alt: flow.alt,
      width: flow.width,
      height: flow.height
    }),
    ...trail.steps.map((step, i) => stepRow(draw, step, `plain-${i}`, true)),
    trail.more > 0 ? h(Text, {
      key: "plain-more",
      dimColor: true
    }, pick$2(WORDS).more(trail.more)) : null
  ].filter((part) => part !== null);
}
const drawOf = ($, e) => {
  const ui = $.ui.resolve(e);
  return { ui, isText: e.surface === "terminal" || !("Svg" in ui) };
};
function wirePlainRows(on, options) {
  if (options.plainWords === false)
    return;
  on("ui.render", { component: "ToolUse" }, async ($, e, next) => {
    const row = await next(e);
    const draw = drawOf($, e);
    return isTold(e.props.tool) ? under(draw, row, callTrail(draw, e.props)) : row;
  }).catch(($, e, next) => next(e));
  on("ui.render", { component: "ToolGroup" }, async ($, e, next) => {
    const row = await next(e);
    const draw = drawOf($, e);
    const trail = e.props.isExpanded ? [] : groupTrail(draw, e.props.calls);
    return trail.length === 0 ? row : under(draw, row, trail);
  }).catch(($, e, next) => next(e));
}

const ANSWER_MS = 1500;
let answered = null;
let asked = null;
function noteAnswer(pane) {
  answered = pane ?? answered;
}
const closeSides = async (io) => {
  const up = new Set((await io.panes()).map((each) => each.id));
  for (const side of SIDE_PANES)
    if (up.has(side))
      await io.close(side);
};
const clearUnanswered = async (io) => {
  if (await io.unanswered.read() !== null)
    await io.unanswered.write(null);
};
async function stepAside(io, pane) {
  answered = null;
  await io.stage.write(pane);
  await io.close(HUB_PANE);
  await io.close(MODS_PANE);
  await closeSides(io);
  await clearUnanswered(io);
}
async function watchAnswer(io, ask) {
  if (asked !== ask || paneOf(await io.stage.read()) !== HUB_PANE)
    return;
  await io.unanswered.write(ask.pane);
  if (!isHubShown(await io.panes()))
    await io.show(HUB_PANE, false);
}
async function openPane(io, pane) {
  if (pane === MODS_PANE || SIDE_PANES.includes(pane))
    return io.show(pane);
  const ask = { pane };
  asked = ask;
  await clearUnanswered(io);
  await io.stage.write(HUB_PANE);
  const isHeld = (await io.panes()).some((up) => up.id === HUB_PANE && up.isFocused);
  if (isHeld)
    await io.hold();
  answered = null;
  await io.ask(pane);
  if (isHeld)
    await io.close(HUB_PANE);
  if (answered !== null || !isHubShown(await io.panes()))
    await stepAside(io, answered ?? pane);
  else {
    if (isHeld)
      await io.show(HUB_PANE);
    io.later(ANSWER_MS, () => void watchAnswer(io, ask).catch((cause) => io.log(`the watch on ${pane} failed: ${String(cause)}`)));
  }
  if (isHeld)
    await io.close(HOLD_PANE);
}
async function toggleHub(io) {
  if (!isHubShown(await io.panes()))
    return io.show(HUB_PANE, false);
  await io.close(HUB_PANE);
  await io.close(MODS_PANE);
  await closeSides(io);
}

function metaOf(market, hasUpdate) {
  if (market.mods.length === 0)
    return hubWords().unreadable;
  const on = hubWords().modsOn(market.mods.filter((mod) => mod.isEnabled === true).length);
  return hasUpdate ? `${on} · ${hubWords().updateReady}` : on;
}
function viewOf(parts, frame) {
  const presence = withHosted(presenceOf(parts.market), parts.isUsageHosting);
  const rows = withUnanswered(rowsOf(parts.cards, presence, parts.layout), parts.unanswered, hubWords().noAnswer);
  const hidden = hiddenRowsOf(parts.cards, presence, parts.layout);
  return { rows, hidden, focus: focusOf(rows), now: nowOf(rows, parts.now), meta: metaOf(parts.market, parts.hasUpdate === true), isEditing: parts.isEditing, ...frame };
}
function plainViewOf(parts, frame) {
  const rows = rowsOf(parts.cards, withHosted(presenceOf(parts.market), parts.isUsageHosting));
  return { rows, hidden: [], focus: null, now: [], meta: hubWords().plain, isEditing: false, ...frame, surface: "plain", theme: "auto" };
}

const PANE = HUB_PANE;
const TITLE = "modz";
const OPEN = { plugin: "modz", key: "open" };
const STAGE = { plugin: "modz", key: "stage" };
const OWN_PANES = [PANE, MODS_PANE, ...SIDE_PANES];
const cardsAtom = atom({ plugin: "modz", key: "cards" }, {});
const layoutAtom = atom({ plugin: "modz", key: "layout" }, EMPTY_LAYOUT);
const editingAtom = atom({ plugin: "modz", key: "isEditing" }, false);
const beatAtom = atom({ plugin: "modz", key: "beat" }, 0);
const updatesAtom = atom({ plugin: "modz", key: "updates" }, null);
const unansweredAtom = atom({ plugin: "modz", key: "unanswered" }, null);
const ON = { plugin: "modz", key: "isOn" };
const DRAWN = { plugin: "modz", key: "drawn" };
const LAYOUT_KEY = "layout";
const DEFAULT_COLUMNS = 80;
async function themeNow($) {
  return themeOf(await $.env.get("MODZ_THEME").catch(() => {
    return;
  }));
}
const swapOf = ($) => ({
  panes: () => $.ui.panes(),
  show: (pane, isFocused) => show($, pane, isFocused).then(() => refreshSide($, pane)),
  hold: () => $.ui.open({ id: HOLD_PANE, title: TITLE }),
  close: (id) => closeQuietly($, id),
  stage: { read: async () => (await $.state.get(STAGE)).value, write: (pane) => $.state.set(STAGE, { pane, at: Date.now() }) },
  ask: (pane) => $.state.set(OPEN, { pane, at: Date.now() }).catch((cause) => $.ui.log(`modz: asking for ${pane} failed: ${String(cause)}`, { to: "debug" })),
  unanswered: { read: () => read($, unansweredAtom), write: (pane) => update($, unansweredAtom, () => pane) },
  later: (ms, work) => $.clock.after(ms, work),
  log: (text) => $.ui.log(`modz: ${text}`, { to: "debug" })
});
async function saveLayout($, change) {
  const next = change(await read($, layoutAtom));
  await update($, layoutAtom, () => next);
  await $.store.set(LAYOUT_KEY, next);
}
async function showPage($, page) {
  hubKept.isHeld = true;
  await $.state.set(STAGE, { pane: page, at: Date.now() });
  await $.ui.open({ id: PANE, title: TITLE, focus: true });
  const up = new Set((await $.ui.panes().catch(() => [])).map((each) => each.id));
  for (const own of OWN_PANES)
    if (own !== PANE && up.has(own))
      await closeQuietly($, own);
}
async function openOrPoint($, pane) {
  const [mod, card] = Object.entries(await read($, cardsAtom)).find(([, each]) => each.pane === pane && each.isBandOnly === true) ?? [];
  if (HUB_DRAWN.includes(pane))
    return showPage($, pane);
  if (card === undefined)
    return openPane(swapOf($), pane);
  $.ui.toast(hubWords().inBand(card.title ?? String(mod)));
}
function actionsOf($) {
  const run = (what, work) => work().catch((cause) => $.ui.log(`modz: ${what} failed: ${String(cause)}`, { to: "debug" }));
  return {
    onOpen: (pane) => run(`opening ${pane}`, () => openOrPoint($, pane)),
    onEdit: (isEditing) => run("customizing", () => update($, editingAtom, () => isEditing)),
    onMove: (opts) => run("moving a row", () => saveLayout($, (layout) => moveUp(layout, opts))),
    onHide: (opts) => run("hiding a row", () => saveLayout($, (layout) => setHidden(layout, opts))),
    onReset: () => run("resetting the hub", () => saveLayout($, () => EMPTY_LAYOUT))
  };
}
const frameOf = async ($, site) => ({ ...site, theme: await themeNow($), actions: actionsOf($), stable: hubDrawings });
async function partsOf($) {
  await read($, beatAtom);
  const [cards, layout, isEditing] = [await read($, cardsAtom), await read($, layoutAtom), await read($, editingAtom)];
  const host = await $.state.get({ plugin: "hud-pro", key: "host" }).catch(() => ({ value: false }));
  return { market: await marketSoon(diskOf($)), cards, layout, isEditing, unanswered: await read($, unansweredAtom), now: await $.clock.now().catch(() => Date.now()), isUsageHosting: host.value === true, hasUpdate: (await read($, updatesAtom))?.hasNew === true };
}
function startHooks(on, options) {
  on("session.start", async ($, e, next) => {
    setLang$1(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    const started = await next(e);
    const saved = layoutOf(await $.store.get(LAYOUT_KEY).catch(() => {
      return;
    }));
    await update($, layoutAtom, () => saved);
    await $.state.set(ON, true);
    await $.state.set(DRAWN, HUB_DRAWN);
    await $.command.register({ name: "modz", description: hubWords().command });
    fillSideRows($);
    if (options.openOnStart === true) {
      hubDrawings.reset();
      hubKept.isHeld = true;
      await $.ui.open({ id: PANE, title: TITLE });
    }
    if (options.keepUpdated === true) {
      keepUpdated(diskOf($)).catch((cause) => $.ui.log(`modz: auto-update could not be turned on: ${String(cause)}`, { to: "debug" }));
    }
    return started;
  });
  on("session.attach", async ($, e, next) => {
    const done = await next(e);
    const isDesktop = e.surface === "desktop";
    const staged = paneOf((await $.state.get(STAGE)).value);
    const isModStaged = staged !== null && !OWN_PANES.includes(staged);
    if (isDesktop && options.openOnStart === true && !isModStaged && (await $.ui.panes()).length === 0)
      await show($, PANE, false);
    if (isDesktop)
      $.ui.invalidate("ui.render");
    return done;
  }).catch(($, e, next) => next(e));
}
function stageHooks(on) {
  on("state.set", { key: "home" }, async ($, e, next) => {
    const done = await next(e);
    const from = e.plugin;
    if (from !== "modz") {
      const pane = paneOf(e.value);
      const go = () => pane === null ? openHub($) : openOrPoint($, pane);
      $.clock.after(0, () => void go().catch((cause) => $.ui.log(`modz: the hub could not come back: ${String(cause)}`, { to: "debug" })));
    }
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { key: "shown" }, async ($, e, next) => {
    const done = await next(e);
    const from = e.plugin;
    const pane = paneOf(e.value);
    if (from !== "modz" && pane !== null)
      await stepAside(swapOf($), pane);
    return done;
  }).catch(($, e, next) => {
    const from = e.plugin;
    if (next.error.kind === "re-entry" && from !== "modz")
      noteAnswer(paneOf(e.value));
    return next(e);
  });
  on("command.run", { command: "modz" }, async ($, e) => {
    const arg = e.args.trim().toLowerCase();
    if (arg === "help")
      return { text: helpText(await marketOf(diskOf($)), await $.command.list().catch(() => [])) };
    if (arg === "check") {
      const market = await marketOf(diskOf($)).catch(() => ({ mods: [] }));
      return { text: checkText(await checkFacts($, market.mods.filter((mod) => mod.isEnabled === true).map((mod) => mod.name))) };
    }
    await openHub($);
    return { text: hubWords().opened };
  });
}
async function reopenKept($) {
  const staged = paneOf((await $.state.get(STAGE)).value);
  if (staged !== null && !OWN_PANES.includes(staged))
    return;
  if ((await $.ui.panes()).length === 0)
    await show($, PANE, false);
}
function paneHooks(on) {
  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) => {
    const staged = paneOf((await $.state.get(STAGE)).value);
    if (staged !== null && HUB_DRAWN.includes(staged)) {
      const onHome = () => void openHub($).catch((cause) => $.ui.log(`modz: the hub could not come back: ${String(cause)}`, { to: "debug" }));
      return pinned(e, await pageTree($, e, { page: staged, ui: $.ui.resolve(e), columns: e.props.bodyColumns || DEFAULT_COLUMNS, surface: e.surface, onHome }));
    }
    if (!hubKept.isHeld) {
      hubKept.isHeld = true;
      $.clock.after(0, () => void reopenKept($).catch((cause) => $.ui.log(`modz: the kept hub tab could not be opened: ${String(cause)}`, { to: "debug" })));
    }
    const columns = e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS;
    return pinned(e, hubTree($.ui.resolve(e), viewOf(await partsOf($), await frameOf($, { surface: e.surface, columns }))));
  }).catch(async ($, e, next) => {
    if (next.error.kind === "re-entry")
      return next(e);
    $.ui.log(`modz: the hub fell back to its plain rows: ${next.error.message ?? next.error.kind}`, { to: "debug" });
    const columns = e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS;
    return pinned(e, hubTree($.ui.resolve(e), plainViewOf(await partsOf($), await frameOf($, { surface: e.surface, columns }))));
  });
  on("ui.render", { component: "Pane", requestId: HOLD_PANE }, async ($, e) => {
    const { Box } = $.ui.resolve(e);
    return h(Box, null);
  });
  on("ui.render", { component: "Pane", requestId: MODS_PANE }, async ($, e) => {
    const ui = $.ui.resolve(e);
    const columns = e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS;
    const onHome = () => void openHub($).catch((cause) => $.ui.log(`modz: the hub could not be opened: ${String(cause)}`, { to: "debug" }));
    const market = await marketOf(diskOf($));
    keepMarket(market);
    const commands = await $.command.list().catch(() => []);
    return pinned(e, modzTree(ui, { market, commands, surface: e.surface, columns, theme: await themeNow($), onHome, onCopy: (text, press) => copy($, text, press), stable: catalogDrawings }));
  });
}
function footerHooks(on) {
  on("ui.render", { component: "SessionMode" }, async ($, e, next) => {
    if (e.surface !== "desktop")
      return next(e);
    const onPress = () => void toggleHub(swapOf($)).catch((cause) => $.ui.log(`modz: the footer toggle failed: ${String(cause)}`, { to: "debug" }));
    return pinned(e, footerTree($.ui.resolve(e), { modes: e.props.modes, onPress }));
  });
}
const register = (on, options) => {
  startHooks(on, options);
  stageHooks(on);
  wireCards(on);
  wireUpkeep(on);
  paneHooks(on);
  footerHooks(on);
  wireLanguageKeeper(on, options);
  wirePlainRows(on, options);
};

export { register };
