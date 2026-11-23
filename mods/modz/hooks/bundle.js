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
const GLYPH$2 = {
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
function layoutOf$1(value) {
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

let current$6 = "en";
const langOf$6 = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang$6(value) {
  current$6 = langOf$6(value);
  return current$6;
}
const lang$1 = () => current$6;
const pick$5 = (table) => table[current$6];

const count$2 = (n, one, many) => `${n} ${n === 1 ? one : many}`;
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
  const table = pick$5(PANES);
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
    modsOn: (n) => `${count$2(n, "mod", "mods")} on`,
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
const hubWords = () => pick$5(HUB);
const badgeWord = () => pick$5({ en: "Beta", tr: "Beta" });
const CATALOG = {
  en: {
    groups: { look: "Look", safety: "Safety", meter: "Meter", flow: "Flow", other: "Other" },
    surfaces: { desktop: "desktop", terminal: "terminal" },
    allMods: "All mods",
    mods: (n) => count$2(n, "mod", "mods"),
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
const catalogWords = () => pick$5(CATALOG);
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
const TONES$2 = ["idle", "live", "ok", "warn", "bad"];
const DETAIL_MAX = 60;
const TITLE_MAX$1 = 32;
const BADGE_MAX$1 = 12;
const PANE_ID = /^[\w-]{1,64}$/;
const textOf$3 = (value, max) => typeof value === "string" && value.trim() !== "" ? value.trim().slice(0, max) : undefined;
const LINES_MAX$1 = 4;
const VALUE_MAX = 16;
function lineOf$1(value) {
  if (typeof value !== "object" || value === null)
    return null;
  const line = value;
  const label = textOf$3(line.label, DETAIL_MAX);
  if (label === undefined)
    return null;
  const short = textOf$3(line.value, VALUE_MAX);
  return { label, ...typeof line.since === "number" && Number.isFinite(line.since) ? { since: line.since } : {}, ...short === undefined ? {} : { value: short } };
}
function liveOf$1(value) {
  if (typeof value !== "object" || value === null)
    return;
  const live = value;
  const lines = (Array.isArray(live.lines) ? live.lines : []).map(lineOf$1).filter((line) => line !== null).slice(0, LINES_MAX$1);
  if (lines.length === 0)
    return;
  return typeof live.more === "number" && Number.isInteger(live.more) && live.more > 0 ? { lines, more: live.more } : { lines };
}
function cardOf$2(value) {
  if (typeof value !== "object" || value === null)
    return null;
  const card = value;
  if (typeof card.pane !== "string" || !PANE_ID.test(card.pane) || typeof card.detail !== "string" || !TONES$2.includes(card.tone))
    return null;
  const own = {
    title: textOf$3(card.title, TITLE_MAX$1),
    hint: textOf$3(card.hint, DETAIL_MAX),
    icon: textOf$3(card.icon, TITLE_MAX$1),
    section: SECTIONS.includes(card.section) ? card.section : undefined,
    badge: textOf$3(card.badge, BADGE_MAX$1),
    live: liveOf$1(card.live),
    isBandOnly: card.isBandOnly === true ? true : undefined
  };
  const named = Object.fromEntries(Object.entries(own).filter(([, v]) => v !== undefined));
  return { pane: card.pane, detail: card.detail.slice(0, DETAIL_MAX), tone: card.tone, at: Number(card.at) || 0, ...named };
}
const ROLE_OF_TONE = { idle: null, live: "run", ok: "ok", warn: "warn", bad: "danger" };
const RANK$3 = { bad: 4, warn: 3, live: 2, ok: 1, idle: 0 };
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
  const ranked = rows.filter((row) => row.card !== null && row.card.detail !== "" && RANK$3[row.card.tone] >= RANK$3.live).sort((a, b) => RANK$3[b.card.tone] - RANK$3[a.card.tone] || b.card.at - a.card.at);
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
const SECOND$8 = 1000;
const MINUTE_S$1 = 60;
const HOUR_M = 60;
const STEP_S = 10;
function elapsedText(ms) {
  const ago = hubWords().ago;
  const seconds = Math.max(0, Math.floor(ms / SECOND$8));
  if (seconds < STEP_S)
    return ago.now;
  if (seconds < MINUTE_S$1)
    return ago.seconds(Math.floor(seconds / STEP_S) * STEP_S);
  const minutes = Math.floor(seconds / MINUTE_S$1);
  return minutes < HOUR_M ? ago.minutes(minutes) : ago.hours(Math.floor(minutes / HOUR_M), minutes % HOUR_M);
}
const RANK_BAD = 4;
const RANK_WARN = 3;
const RANK_LIVE = 2;
const RANK_USAGE = 1;
function rankOf$1(card) {
  if (card.tone === "bad")
    return RANK_BAD;
  if (card.tone === "warn")
    return RANK_WARN;
  if (card.live !== undefined)
    return RANK_LIVE;
  return card.pane === USAGE_PANE ? RANK_USAGE : 0;
}
const isNow = (card) => card !== null && (card.detail !== "" || card.live !== undefined) && rankOf$1(card) > 0;
function linesOf$1(card, now) {
  return (card.live?.lines ?? []).map((line) => {
    const ran = line.since === undefined ? undefined : elapsedText(now - line.since);
    return { label: line.label, value: [ran, line.value].filter(Boolean).join(" · ") };
  });
}
function nowOf$1(rows, now) {
  return rows.flatMap((row) => isNow(row.card) ? [{ row, lines: linesOf$1(row.card, now), more: row.card.live?.more ?? 0, rank: rankOf$1(row.card) }] : []).sort((a, b) => b.rank - a.rank).map(({ row, lines, more }) => ({ row, lines, more }));
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

const short$2 = (tokens, point, unit) => tokens < 1000 ? String(tokens) : `${(tokens / 1000).toFixed(1).replace(".", point)}${unit}`;
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
const linkWords = () => pick$5(LINKS);
const WEIGHT$1 = {
  en: {
    lead: (days) => `Plugins and skills you have not used in ${days} days. Claude reads each one's listing in every chat.`,
    total: (tokens) => `Without them every chat starts about ${short$2(tokens, ".", "k")} tokens lighter.`,
    kinds: { plugin: "plugin", skill: "skill" },
    skills: (n) => `${n} ${n === 1 ? "skill" : "skills"}`,
    tokens: (tokens) => `~${short$2(tokens, ".", "k")} tokens`,
    never: "never used",
    idle: (days) => `not used for ${days} days`,
    how: "Copy a line and paste it into the message box to switch that plugin off. Your own skills are folders under ~/.claude/skills.",
    copy: "Copy",
    more: (n) => `+${n} more`,
    none: "No dead weight: everything installed gets used.",
    noneShort: "everything gets used",
    unread: "Not measured yet.",
    count: (n, tokens) => `${n} unused · ~${short$2(tokens, ".", "k")} tokens`
  },
  tr: {
    lead: (days) => `${days} gündür kullanmadığın eklentiler ve beceriler. Claude her sohbette hepsinin tanıtımını okur.`,
    total: (tokens) => `Bunlar olmasa her sohbet yaklaşık ${short$2(tokens, ",", " bin")} token hafif başlar.`,
    kinds: { plugin: "eklenti", skill: "beceri" },
    skills: (n) => `${n} beceri`,
    tokens: (tokens) => `~${short$2(tokens, ",", " bin")} token`,
    never: "hiç kullanılmadı",
    idle: (days) => `${days} gündür kullanılmadı`,
    how: "Bir satırı kopyalayıp mesaj kutusuna yapıştır; o eklenti kapanır. Kendi becerilerin ~/.claude/skills altındaki klasörlerdir.",
    copy: "Kopyala",
    more: (n) => `+${n} tane daha`,
    none: "Ölü ağırlık yok: kurulu her şey kullanılıyor.",
    noneShort: "her şey kullanılıyor",
    unread: "Henüz ölçülmedi.",
    count: (n, tokens) => `${n} kullanılmıyor · ~${short$2(tokens, ",", " bin")} token`
  }
};
const weightWords = () => pick$5(WEIGHT$1);
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
const updateWords = () => pick$5(UPDATES);

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
function waitingOf$1(cache, now) {
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
  const waiting = waitingOf$1(facts.authCache, facts.now).filter((name) => !told.has(wireName(name))).sort(byName);
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
function headOf$1(lsRemote) {
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
const META$2 = {
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
  const location = isRecord(entry) ? text$2(entry.installLocation) : undefined;
  return (location ?? `${install.pluginsDir}/marketplaces/${install.market}`).replaceAll("\\", "/").replace(/\/+$/, "");
}
const SAFE_NAME = /^[\w.-]+$/;
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text$2(value) {
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
  return githubName(manifest?.repository) ?? githubName(manifest?.homepage) ?? META$2[name]?.upstream ?? githubName(manifest?.author?.url);
}
function infoOf(facts) {
  const { name, entry, manifest, problem } = facts;
  const meta = META$2[name];
  const summary = meta?.summary === undefined ? undefined : pick$5(meta.summary);
  return {
    name,
    version: text$2(manifest?.version) ?? text$2(entry.version) ?? null,
    description: problem ?? summary ?? text$2(manifest?.description) ?? text$2(entry.description) ?? facts.note ?? (manifest ? "" : catalogWords().unreadable),
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
  const repo = isRecord(source) ? text$2(source.repo) ?? githubName(source.url) ?? undefined : undefined;
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
  const name = text$2(entry.name);
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
  const name = text$2(market?.name) ?? "modz";
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
async function homeOf$1(disk) {
  const home = await disk.env.home().catch(() => {
    return;
  }) || await disk.env.userProfile().catch(() => {
    return;
  });
  return home ? home.replaceAll("\\", "/").replace(/\/+$/, "") : undefined;
}
async function skillLinks(disk) {
  const home = await homeOf$1(disk);
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
  const home = await homeOf$1(disk);
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
  const home = await homeOf$1(disk);
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
  return { ...known, hasNew: isNewer(installed, headOf$1((await ask.run(["git", "ls-remote", url, "HEAD"])).stdout)) };
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

function stableDrawings$6() {
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

const TITLE$4 = "modz";
const STAGE$2 = { plugin: "modz", key: "stage" };
const hubDrawings = stableDrawings$6();
const catalogDrawings = stableDrawings$6();
const hubKept = { isHeld: false };
const closeQuietly = ($, id) => $.ui.close({ id }).catch((cause) => $.ui.log(`modz: ${id} could not be closed: ${String(cause)}`, { to: "debug" }));
async function show($, pane, isFocused = true) {
  hubKept.isHeld = true;
  if (pane === HUB_PANE)
    hubDrawings.reset();
  if (pane === MODS_PANE)
    catalogDrawings.reset();
  const staged = paneOf((await $.state.get(STAGE$2)).value);
  if (staged !== pane && !(pane === HUB_PANE && staged === null))
    await $.state.set(STAGE$2, { pane, at: Date.now() });
  await $.ui.open(isFocused ? { id: HUB_PANE, title: TITLE$4, focus: true } : { id: HUB_PANE, title: TITLE$4 });
  const up = new Set((await $.ui.panes().catch(() => [])).map((each) => each.id));
  for (const own of [MODS_PANE, ...SIDE_PANES])
    if (up.has(own))
      await closeQuietly($, own);
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
  setLang$6(await $.env.get("MODZ_LANG").catch(() => {
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
async function linksPage($, e) {
  const onHome = () => void openHub($).catch(log($, "opening the hub"));
  const onCheck = () => void refreshLinks($, true).catch(log($, "reading the connections"));
  return pinned(e, linksTree($.ui.resolve(e), { links: await read($, linksAtom), onHome, onCheck }));
}
async function weightPage($, e) {
  const onHome = () => void openHub($).catch(log($, "opening the hub"));
  return pinned(e, weightTree($.ui.resolve(e), { weights: await read($, weightsAtom), now: await $.clock.now().catch(() => Date.now()), onHome, onCopy: (text, press) => copy($, text, press) }));
}
async function updatesPage($, e) {
  const onHome = () => void openHub($).catch(log($, "opening the hub"));
  const onCheck = () => void refreshUpdates($, true).catch(log($, "reading the updates"));
  const onAuto = (isOn) => void setAuto($, isOn).catch(log($, "setting auto-update"));
  const view = { updates: await read($, updatesAtom$1), isFailed: isAutoFailed, onHome, onCheck, onAuto, onCopy: (text, press) => copy($, text, press) };
  return pinned(e, updatesTree($.ui.resolve(e), view));
}
async function sidePage($, e, page) {
  if (page === LINKS_PANE)
    return linksPage($, e);
  if (page === WEIGHT_PANE)
    return weightPage($, e);
  if (page === UPDATES_PANE)
    return updatesPage($, e);
  return null;
}
function wireUpkeep(on) {
  on("ui.render", { component: "Pane", requestId: LINKS_PANE }, ($, e) => linksPage($, e));
  on("ui.render", { component: "Pane", requestId: WEIGHT_PANE }, ($, e) => weightPage($, e));
  on("ui.render", { component: "Pane", requestId: UPDATES_PANE }, ($, e) => updatesPage($, e));
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
    const card = cardOf$2(e.value);
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
const EN$6 = {
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
const WORDS$5 = {
  en: EN$6,
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
const line$2 = (label, probe) => `${probe.isOk ? "✓" : "✗"} ${label}: ${probe.said}`;
function checkText(facts) {
  const w = pick$5(WORDS$5);
  const probes = [line$2(w.version, facts.version), line$2(w.surfaces, facts.surfaces), line$2(w.cost, facts.cost), line$2(w.model, facts.model)];
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
  const w = pick$5(WORDS$5);
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
const BOLD$5 = [
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
const WIDE_EM$3 = 1;
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
function charEm$3(char, boldness) {
  const i = INDEX.get(char);
  if (i === undefined)
    return (char.codePointAt(0) ?? 0) >= FIRST_WIDE ? WIDE_EM$3 : UNKNOWN_EM;
  const regular = REGULAR[i] ?? UNKNOWN_EM * PER_MILLE;
  const bold = BOLD$5[i] ?? regular;
  return (regular + (bold - regular) * boldness) / PER_MILLE;
}
function textWidth$1(text, size, weight = WEIGHT_LOW) {
  const boldness = Math.max(0, Math.min(1, (weight - WEIGHT_LOW) / WEIGHT_SPAN));
  const chars = [...text];
  const advance = chars.reduce((sum, char) => sum + charEm$3(char, boldness), 0);
  return Math.max(0, (advance + chars.length * trackingAt(size)) * size);
}

const STAGGER_MS$6 = 45;
const EASE$6 = "cubic-bezier(.2,.8,.2,1)";
const RULES$6 = {
  "m-in": `.m-in{animation:m-in .42s ${EASE$6} both}@keyframes m-in{from{opacity:0;transform:translateY(8px)}}`,
  "m-fade": `.m-fade{animation:m-fade .5s ${EASE$6} both}@keyframes m-fade{from{opacity:0}}`,
  "m-grow": `.m-grow{transform-box:fill-box;transform-origin:left center;animation:m-grow .7s ${EASE$6} both}@keyframes m-grow{from{transform:scaleX(0)}}`,
  "m-px": `.m-px{transform-box:fill-box;transform-origin:center;animation:m-px .34s ${EASE$6} both}@keyframes m-px{from{opacity:0;transform:translateY(-10px) scale(.6)}}`,
  "m-flash": ".m-flash{opacity:0;animation:m-flash 1.6s ease-out both}@keyframes m-flash{from{opacity:.9}to{opacity:0}}",
  "m-from": `.m-from{transform-box:fill-box;transform-origin:left center;animation:m-from .32s ${EASE$6} both}@keyframes m-from{from{transform:scaleX(var(--m-from))}}`,
  "m-draw": `.m-draw{stroke-dasharray:1;animation:m-draw .32s ${EASE$6} .12s both}@keyframes m-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}`,
  "m-breathe": ".m-breathe{animation:m-breathe 1.8s ease-in-out infinite}@keyframes m-breathe{50%{opacity:.4}}",
  "m-ring": ".m-ring{transform-box:fill-box;transform-origin:center;animation:m-ring 1.8s ease-out infinite}@keyframes m-ring{from{opacity:.55;transform:scale(1)}to{opacity:0;transform:scale(2.8)}}",
  "m-wash": `.m-wash{fill:#8E8A80;opacity:0;transition:opacity .12s ${EASE$6}}svg:hover .m-wash{opacity:.12}`,
  "m-tile": `.m-tile{transform-box:fill-box;transform-origin:center;transition:transform .2s ${EASE$6}}svg:hover .m-tile{transform:translateY(-1px) scale(1.06)}`
};
const REDUCED$8 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function motionCss$6(body) {
  const used = Object.keys(RULES$6).filter((name) => new RegExp(`\\b${name}\\b`).test(body));
  return used.length === 0 ? "" : `${used.map((name) => RULES$6[name]).join("")}${REDUCED$8}`;
}
const MOTION_CSS$1 = Object.values(RULES$6).join("");
const isEntering$6 = (cue) => cue.phase === "enter";
function entering$6(body, cue, kind = "in") {
  if (!isEntering$6(cue))
    return body;
  return `<g class="m-${kind}" style="animation-delay:${cue.order * STAGGER_MS$6}ms">${body}</g>`;
}
const delayOf = (cue, step) => `animation-delay:${cue.order * STAGGER_MS$6 + step}ms`;

const DARK$5 = {
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
const LIGHT$5 = {
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
const ROLE_NAMES$2 = ["read", "edit", "run", "ok", "warn", "danger", "plan"];
const FONT$5 = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`;
const MONO$6 = `ui-monospace, 'SF Mono', Menlo, monospace`;
function varsOf$2(palette) {
  const base = ["sheet", "card", "inset", "line", "strong", "track", "hi", "mid", "lo"];
  const neutral = base.map((key) => `--${key}:${palette[key]}`);
  const roles = ROLE_NAMES$2.flatMap((name) => {
    const role = palette.roles[name];
    return [`--${name}:${role.fg}`, `--${name}-t:${role.tint}`, `--${name}-l:${role.line}`];
  });
  return [...neutral, ...roles].join(";");
}
function roleClasses() {
  return ROLE_NAMES$2.map((name) => `.fg-${name}{fill:var(--${name})}.bg-${name}{fill:var(--${name}-t)}.st-${name}{stroke:var(--${name})}.ln-${name}{stroke:var(--${name}-l)}`).join("");
}
const TYPE_CSS = [
  `text{font-family:${FONT$5}}`,
  `.num{font-family:${MONO$6};font-variant-numeric:tabular-nums}`,
  ".hi{fill:var(--hi)}.mid{fill:var(--mid)}.lo{fill:var(--lo)}",
  ".eb{font-size:10.5px;font-weight:700;letter-spacing:.1em}",
  ".hl{font-size:17px;font-weight:620}.ti{font-size:13px;font-weight:600}",
  ".lb{font-size:12px;font-weight:500}.mi{font-size:10.5px;font-weight:500}.dp{font-size:24px;font-weight:650}",
  ".card{fill:var(--card)}.inset{fill:var(--inset)}.track{fill:var(--track)}.line{stroke:var(--line)}.strong{stroke:var(--strong)}",
  ".f-line{fill:var(--line)}.f-strong{fill:var(--strong)}.f-mid{fill:var(--mid)}"
].join("");
const MOTION_CSS = ".breathe{animation:breathe 1.8s ease-in-out infinite}@keyframes breathe{50%{opacity:.45}}";
const REDUCED$7 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function styleOf() {
  const dark = varsOf$2(DARK$5);
  return `<style>svg{${varsOf$2(LIGHT$5)}}svg.t-dark{${dark}}@media (prefers-color-scheme: dark){svg.t-auto{${dark}}}${TYPE_CSS}${roleClasses()}${MOTION_CSS}${REDUCED$7}</style>`;
}
const SCHEME$7 = { light: "light", dark: "dark", auto: "light dark" };
function svgDoc$5(doc) {
  const width = Math.round(doc.width);
  const scheme = `:root{color-scheme:${SCHEME$7[doc.theme]}}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="t-${doc.theme}" width="${width}" height="${doc.height}" viewBox="0 0 ${width} ${doc.height}">${styleOf()}<style>${scheme}${doc.css ?? ""}</style>${doc.body}</svg>`;
}
function themeOf(value) {
  const name = String(value ?? "").toLowerCase();
  if (name.includes("light"))
    return "light";
  return name.includes("dark") ? "dark" : "auto";
}

const settled = (spec) => spec.cue === undefined ? svgDoc$5(spec) : svgDoc$5({ width: spec.width, height: spec.height, theme: spec.theme, body: entering$6(spec.body, spec.cue), css: MOTION_CSS$1 });
const HEAD$1 = 44;
const GROUP = 28;
const ROW$4 = 62;
const TEXT_X$1 = 16;
const GAP$4 = 6;
function esc$2(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
const MONO_EM$5 = 0.6;
const WEIGHT_BODY = 500;
function measure$5(text, size, weight = WEIGHT_BODY) {
  return textWidth$1(text, size, weight);
}
const monoMeasure = (text, size) => [...text].length * size * MONO_EM$5;
function fit$4(text, width, font) {
  const { size, weight = WEIGHT_BODY } = font;
  if (measure$5(text, size, weight) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 1 && measure$5(`${chars.join("").trimEnd()}…`, size, weight) > width)
    chars.pop();
  return `${chars.join("").trimEnd()}…`;
}
function headSvg$1(spec) {
  const meta = spec.meta === "" ? "" : `<text x="${spec.width - TEXT_X$1}" y="28" text-anchor="end" style="font-size:11.5px" class="num ${spec.metaRole === null ? "lo" : `fg-${spec.metaRole}`}">${esc$2(spec.meta)}</text>`;
  const title = fit$4(spec.title, spec.width - TEXT_X$1 * 2 - measure$5(spec.meta, 12) - GAP$4 * 2, { size: 16, weight: 600 });
  const body = `<text x="${TEXT_X$1}" y="28" style="font-size:16px;font-weight:600" class="hi">${esc$2(title)}</text>${meta}`;
  return { source: settled({ width: spec.width, height: HEAD$1, theme: spec.theme, body, cue: spec.cue }), alt: `${catalogWords().allMods}: ${spec.title}${spec.meta === "" ? "" : ` · ${spec.meta}`}`, height: HEAD$1 };
}
function labelSvg(spec) {
  const { label } = spec;
  const count = catalogWords().mods(spec.count);
  const body = `<text x="${TEXT_X$1}" y="${GROUP - 8}" style="font-size:11px;font-weight:600" class="lo">${esc$2(label)}</text><text x="${spec.width - TEXT_X$1}" y="${GROUP - 8}" text-anchor="end" style="font-size:11px" class="num lo">${esc$2(count)}</text>`;
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
  const name = fit$4(guide.mod, (right - TEXT_X$1) / 2, { size: 13, weight: 560 });
  const room = Math.floor((right - TEXT_X$1 - measure$5(name, 13, 560) - GAP$4 * 2) / (11.5 * MONO_EM$5));
  const all = commandsLine(guide);
  const commands = [...all].length <= room ? all : `${[...all].slice(0, Math.max(1, room - 1)).join("")}…`;
  const body = [
    `<text x="${TEXT_X$1}" y="19" style="font-size:13px;font-weight:560" class="hi">${esc$2(name)}</text>`,
    all === "" ? "" : `<text x="${right}" y="19" text-anchor="end" style="font-size:11.5px" class="num mid">${esc$2(commands)}</text>`,
    options === "" ? "" : `<text x="${TEXT_X$1}" y="36" style="font-size:11px" class="lo">${esc$2(fit$4(options, right - TEXT_X$1, { size: 11 }))}</text>`
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
function rowSvg$4(spec) {
  const { mod, width } = spec;
  const right = width - TEXT_X$1;
  const versionText = mod.version === null ? "" : `v${mod.version}`;
  const state = stateWord(mod);
  const edge = [state?.text, versionText].filter(Boolean).join(" · ");
  const name = fit$4(mod.name, right - TEXT_X$1 - monoMeasure(edge, 11.5) - GAP$4 * 2, { size: 13, weight: 560 });
  const isQuiet = mod.isEnabled === false;
  const lineRoom = right - TEXT_X$1;
  const body = [
    `<text x="${TEXT_X$1}" y="21" style="font-size:13px;font-weight:560" class="${isQuiet ? "lo" : "hi"}">${esc$2(name)}</text>`,
    edge === "" ? "" : `<text x="${right}" y="21" text-anchor="end" style="font-size:11.5px" class="num ${state?.ink ?? "lo"}">${esc$2(edge)}</text>`,
    `<text x="${TEXT_X$1}" y="39" style="font-size:12px" class="${mod.isHealthy ? isQuiet ? "lo" : "mid" : "fg-danger"}">${esc$2(fit$4(mod.description, lineRoom, { size: 12 }))}</text>`,
    `<text x="${TEXT_X$1}" y="55" style="font-size:11px" class="lo">${esc$2(fit$4(placeLine(mod), lineRoom, { size: 11 }))}</text>`
  ].join("");
  const alt = `${[mod.name, versionText].filter(Boolean).join(" ")} · ${placeLine(mod)} · ${stateLabel(mod)} · ${mod.description}`;
  return { source: settled({ width, height: ROW$4, theme: spec.theme, body, cue: spec.cue }), alt, height: ROW$4 };
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

const NARROW$2 = 280;
const WIDE$3 = 520;
const between = (k, from, to) => Math.round((from + (to - from) * k) * 10) / 10;
function sizesOf(width) {
  const k = Math.max(0, Math.min(1, (width - NARROW$2) / (WIDE$3 - NARROW$2)));
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
const doc = (spec) => svgDoc$5({ ...spec, css: motionCss$6(spec.body) || HUB_CSS });
const LIVE_DOT$2 = { r: 3, gap: 9 };
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
  const isDropping = isEntering$6(spec.cue);
  const cellAttrs = isDropping ? (at) => ` class="m-px" style="${delayOf(spec.cue, at.index * LETTER_MS + at.row * ROW_MS + at.col * COLUMN_MS)}"` : undefined;
  const z = sizesOf(spec.width);
  const mark = pixelWord("modz", { x: z.inset, y: (z.head - 7 * z.mark.pitch) / 2, ...z.mark, className: "fg-edit", cellAttrs });
  const meta = `<text x="${spec.width - z.inset}" y="${z.head / 2 + 4}" text-anchor="end" style="font-size:${z.meta}px" class="num lo">${esc$2(spec.meta)}</text>`;
  const body = mark.svg + entering$6(meta, { ...spec.cue, order: spec.cue.order + 4 }, "fade");
  const css = HUB_CSS + motionCss$6(body);
  return { source: svgDoc$5({ width: spec.width, height: z.head, theme: spec.theme, body, css }), alt: `modz · ${spec.meta}`, height: z.head };
}
function sectionSvg$1(spec) {
  const z = sizesOf(spec.width);
  const body = `<text x="${z.inset}" y="${z.section - 8}" style="font-size:${z.label}px;font-weight:600" class="lo">${esc$2(spec.label)}</text>`;
  return { source: doc({ width: spec.width, height: z.section, theme: spec.theme, body: entering$6(body, spec.cue, "fade") }), alt: spec.label, height: z.section };
}
function rowIcon(row, z) {
  const glyph = pixelGlyph(row.entry.icon, { x: z.inset, y: (z.row - z.icon) / 2, box: z.icon, ...z.glyph, className: glyphInk(row.card) });
  return isLive(row.card) ? `<g class="m-breathe">${glyph}</g>` : glyph;
}
const isLive = (card) => card !== null && card.detail !== "" && card.tone === "live";
function titleOf$1(row, z) {
  const title = row.entry.title;
  const titleEnd = z.textX + measure$5(title, z.title.size, z.title.weight);
  const text = `<text x="${z.textX}" y="${z.baseline}" style="font-size:${z.title.size}px;font-weight:500" class="hi">${esc$2(title)}</text>`;
  const badge = row.entry.badge;
  if (badge === null)
    return { svg: text, end: titleEnd };
  const word = badge.toLocaleLowerCase();
  const tag = `<text x="${titleEnd + BADGE_GAP}" y="${z.baseline}" style="font-size:${z.label}px;font-weight:500" class="lo">${esc$2(word)}</text>`;
  return { svg: text + tag, end: titleEnd + BADGE_GAP + measure$5(word, z.label, 500) };
}
const NARROW_VALUE = { size: 12, weight: 400 };
function shortValue(text, width, font = NARROW_VALUE) {
  const fits = (candidate) => measure$5(candidate, font.size, font.weight) <= width;
  if (fits(text))
    return text;
  const first = text.split(" · ")[0] ?? text;
  const words = first.split(" ");
  if (words.length === 1)
    return fit$4(first, width, font);
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
  const words = `<text x="${room.to}" y="${room.z.baseline}" text-anchor="end" style="font-size:${room.z.value.size}px;font-variant-numeric:tabular-nums" class="${value.ink}">${esc$2(text)}</text>`;
  if (!value.isLive)
    return words;
  const x = room.to - measure$5(text, room.z.value.size, room.z.value.weight) - LIVE_DOT$2.gap;
  const y = room.z.row / 2;
  const dot = (cls) => `<circle cx="${x}" cy="${y}" r="${LIVE_DOT$2.r}" class="fg-edit${cls}"/>`;
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
    valueSvg(value, { from: title.end + VALUE_GAP + (value?.isLive ? LIVE_DOT$2.gap + LIVE_DOT$2.r * 2 : 0), to: width - z.inset, z })
  ].join("");
  const alt = `${row.entry.title}${row.entry.badge === null ? "" : ` (${row.entry.badge})`}${value === null ? "" : `: ${value.text}`}`;
  return { source: doc({ width, height: z.row, theme: spec.theme, body: entering$6(body, spec.cue) }), alt, height: z.row };
}
function hubLineSvg(spec) {
  const z = sizesOf(spec.width);
  const right = spec.width - z.inset;
  const { value } = spec.line;
  const room = right - z.textX - (value === "" ? 0 : measure$5(value, z.label, 400) + VALUE_GAP);
  const label = fit$4(spec.line.label, room, { size: z.value.size, weight: 400 });
  const y = z.line / 2 + z.value.size * 0.35;
  const body = [
    `<text x="${z.textX}" y="${y}" style="font-size:${z.value.size}px" class="mid">${esc$2(label)}</text>`,
    value === "" ? "" : `<text x="${right}" y="${y}" text-anchor="end" style="font-size:${z.label}px;font-variant-numeric:tabular-nums" class="lo">${esc$2(value)}</text>`
  ].join("");
  return { source: doc({ width: spec.width, height: z.line, theme: spec.theme, body: entering$6(body, spec.cue) }), alt: [spec.line.label, value].filter(Boolean).join(": "), height: z.line };
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

const BLANK$3 = "ㅤ";
const CELL_PX$3 = 11.9;
const BUTTON_PX$4 = 28;
const RUN_SPAN$3 = 2;
const LINE_SPAN$3 = "400%";
function PressCover$3(ui, o) {
  const { Box, Button } = ui;
  const lines = Math.max(1, Math.floor(o.height / (BUTTON_PX$4 * 2)));
  const label = BLANK$3.repeat(Math.ceil(o.width * RUN_SPAN$3 / CELL_PX$3));
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
    width: LINE_SPAN$3,
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
const STILL$3 = "<style>*{animation:none!important;transition:none!important}</style>";
const stillSource$3 = (source) => source.replace(/<\/svg>\s*$/, `${STILL$3}</svg>`);
function stillSvg$3(ui, drawing) {
  if (drawing.type !== "Svg")
    return drawing;
  const { Svg } = ui;
  const { key, source, alt, width, height } = drawing.props;
  return h(Svg, {
    key,
    source: stillSource$3(source),
    alt,
    width,
    height
  });
}
const FALLBACK_PX$3 = 52;
const FALLBACK_WIDTH_PX$3 = 360;
function PressRow$3(ui, o) {
  const { Box } = ui;
  const props = o.drawing.type === "Svg" ? o.drawing.props : {};
  const width = props.width ?? FALLBACK_WIDTH_PX$3;
  const height = props.height ?? FALLBACK_PX$3;
  return h(Box, {
    key: o.box,
    alignSelf: "flex-start"
  }, stillSvg$3(ui, o.drawing), PressCover$3(ui, { key: o.key, width, height, hotkey: o.hotkey, onPress: o.onPress }));
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
  const eyebrow = tools.keep("eyebrow-now", { width, theme, label }, (cue) => sectionSvg$1({ width, theme, label, cue }));
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
  }, GLYPH$2[entry.icon]) : h(Text, {
    color
  }, GLYPH$2[entry.icon]), h(Text, {
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

const PX_PER_COLUMN$5 = 9;
const WIDTH_MIN$1 = 240;
const WIDTH_MAX$1 = 640;
const EDIT_BUTTON_ROOM = 136;
const INSET = 1;
const hubWidth = (columns) => Math.max(WIDTH_MIN$1, Math.min(WIDTH_MAX$1, columns * PX_PER_COLUMN$5 - PX_PER_COLUMN$5));
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
function groupsOf$2(view) {
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
  return PressRow$3(ui, { box: opts.box, key: opts.key, drawing: svg, onPress: () => view.actions.onOpen(pane) });
}
function desktopGroup(ui, view, opts) {
  const { Box } = ui;
  const { group, pen } = opts;
  const { width, theme } = pen;
  const buttonRoom = view.isEditing ? EDIT_BUTTON_ROOM : 0;
  const panes = group.isHiddenGroup ? null : group.rows.map((row) => row.entry.pane);
  const eyebrow = pen.keep(`eyebrow-${group.key}`, { width, theme, label: group.label }, (cue) => sectionSvg$1({ width, theme, label: group.label, cue }));
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
  }, pen.label(head, "head"), nowDesktop(ui, nowRows(view), pen), groupsOf$2(view).map((group) => desktopGroup(ui, view, { group, pen })), firstRunRow(ui, view, pen), editBar(ui, view));
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
function terminalRow$3(ui, view, opts) {
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
  }, GLYPH$2[row.entry.icon]) : h(Text, {
    color: glyphColor
  }, GLYPH$2[row.entry.icon]), h(Text, {
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
  }), nowTerminal(ui, now, (row) => terminalButtons(ui, view, { row, panes: [] })), groupsOf$2(view).map((group) => {
    const panes = group.isHiddenGroup ? null : group.rows.map((row) => row.entry.pane);
    return h(Box, {
      key: `section-${group.key}`,
      flexDirection: "column"
    }, h(Text, {
      bold: true,
      dimColor: true
    }, group.label), group.rows.map((row) => terminalRow$3(ui, view, { row, panes })));
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
function shareOf$1(words, profile) {
  const hits = words.filter((word) => profile.words.has(word) || profile.letters?.test(word) === true).length;
  return hits / words.length;
}
function needsReminder(opts) {
  const words = wordsOf$2(opts.text);
  if (words.length < MIN_WORDS || shareOf$1(words, ENGLISH) < PROSE_SHARE)
    return false;
  return opts.target.profile === undefined || shareOf$1(words, opts.target.profile) < PROSE_SHARE;
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
      armed = targetOf$1({ setting: await languageSetting($), uiLang: lang$1() });
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

const PX_PER_COLUMN$4 = 9;
const WIDTH_MIN = 320;
const WIDTH_MAX = 900;
function groupsOf$1(mods) {
  return GROUPS.map((group) => [group, mods.filter((mod) => mod.group === group)]).filter(([, list]) => list.length > 0);
}
function stateOf$2(mod) {
  const words = catalogWords();
  if (!mod.isHealthy)
    return { glyph: "✕", color: "error", word: words.brokenWord };
  if (mod.isEnabled === null)
    return { glyph: "◌", color: "subtle", word: "" };
  return mod.isEnabled ? { glyph: "●", color: "success", word: "" } : { glyph: "○", color: "subtle", word: words.offWord };
}
function terminalRow$2(ui, mod) {
  const { Box, Text } = ui;
  const state = stateOf$2(mod);
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
  }, `${words.guide} · ${guides.length}`), guides.map((guide) => terminalGuide(ui, guide))), groupsOf$1(view.market.mods).map(([group, list]) => h(Box, {
    key: `group-${group}`,
    flexDirection: "column"
  }, h(Text, {
    bold: true,
    dimColor: true
  }, `${words.groups[group]} · ${list.length}`), list.map((mod) => terminalRow$2(ui, mod)))));
}
function desktopTree(ui, view) {
  const { Box, Svg } = ui;
  const width = Math.max(WIDTH_MIN, Math.min(WIDTH_MAX, view.columns * PX_PER_COLUMN$4 - PX_PER_COLUMN$4));
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
  }, draw(`guide-row-${guide.mod}`, guide, (cue) => guideSvg({ width, theme: view.theme, guide, cue }))))), groupsOf$1(view.market.mods).map(([group, list]) => h(Box, {
    key: `group-${group}`,
    flexDirection: "column"
  }, draw(`eyebrow-${group}`, [group, list.length], (cue) => groupSvg({ width, theme: view.theme, group, count: list.length, cue })), list.map((mod) => h(Box, {
    key: `mod-${mod.name}`
  }, draw(`row-${mod.name}`, mod, (cue) => rowSvg$4({ width, theme: view.theme, mod, cue })))))));
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

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
function mix(a, b, t) {
  const from = channels(a);
  const to = channels(b);
  return `#${from.map((v, i) => Math.round(v + ((to[i] ?? v) - v) * t).toString(16).padStart(2, "0")).join("")}`;
}
const DARK_LO = "#8E8A80";
const LIGHT_LO = "#77726A";
const DARK$4 = {
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
const LIGHT$4 = {
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
const paletteOf = (isLight) => isLight ? LIGHT$4 : DARK$4;
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

const FONT$4 = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`;
const MONO$5 = `ui-monospace, 'SF Mono', Menlo, monospace`;
const BOLD_WIDTH = 1.07;
const escape$2 = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function measure$4(text, size, isBold = false) {
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
  if (measure$4(text, size, isBold) <= width)
    return text;
  const chars = [...text];
  let keep = chars.length - 1;
  while (keep > 2) {
    const head = Math.ceil(keep / 2);
    const cut = `${chars.slice(0, head).join("")}…${chars.slice(chars.length - (keep - head)).join("")}`;
    if (measure$4(cut, size, isBold) <= width)
      return cut;
    keep -= 1;
  }
  return `${chars[0] ?? ""}…`;
}
const ROLE_NAMES$1 = Object.keys(DARK$4.roles);
function rules$1(p) {
  const base = `.hi{fill:${p.hi}}.mid{fill:${p.mid}}.lo{fill:${p.lo}}.card{fill:${p.card};stroke:${p.line}}.track{fill:${p.track}}.s-mid{stroke:${p.mid}}`;
  const roles = ROLE_NAMES$1.map((r) => {
    const c = p.roles[r];
    return `.f-${r}{fill:${c.fg}}.t-${r}{fill:${c.tint}}.l-${r}{stroke:${c.line}}.s-${r}{stroke:${c.fg}}`;
  });
  return base + roles.join("");
}
function style(look) {
  const fonts = `text{font-family:${FONT$4}}.num{font-family:${MONO$5};font-variant-numeric:tabular-nums}`;
  const breathe = ".breathe{animation:breathe 1.8s ease-in-out infinite}@keyframes breathe{50%{opacity:.35}}";
  const motion = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
  const scheme = look.isAuto ? `@media (prefers-color-scheme: light){${rules$1(LIGHT$4)}}@media (prefers-color-scheme: dark){${rules$1(DARK$4)}}` : "";
  return `<style>${fonts}${breathe}${rules$1(paletteOf(look.isLight))}${scheme}${motion}</style>`;
}
const svgDoc$4 = ({ width, height }, look, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${style(look)}${body}</svg>`;
const ICONS$1 = {
  eye: '<path d="M2.5 12c2.2-4.3 5.4-6.5 9.5-6.5s7.3 2.2 9.5 6.5c-2.2 4.3-5.4 6.5-9.5 6.5S4.7 16.3 2.5 12z"/><circle cx="12" cy="12" r="3.2"/>',
  pencil: '<path d="M15.2 4.8l4 4L8.6 19.4 3.8 20.2l.8-4.8z"/><path d="M13 7l4 4"/>',
  check: '<path d="M4.5 12.8l4.6 4.4L19.5 6.8"/>',
  sparkle: '<path d="M12 3.5c.7 4.6 3 6.9 7.5 7.5-4.5.6-6.8 2.9-7.5 7.5-.7-4.6-3-6.9-7.5-7.5 4.5-.6 6.8-2.9 7.5-7.5z"/>',
  branch: '<circle cx="6.5" cy="5.5" r="2.2"/><circle cx="6.5" cy="18.5" r="2.2"/><circle cx="17.5" cy="7.5" r="2.2"/><path d="M6.5 7.7v8.6M17.5 9.7c0 4.6-5.2 4.2-9.6 7.2"/>'
};
function icon$1(name, { x, y, size }) {
  const scale = size / 24;
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" class="s-mid" stroke-width="${1.5 / scale}" stroke-linecap="round" stroke-linejoin="round">${ICONS$1[name]}</g>`;
}
const groupLabel$1 = (text, { x, y, anchor = "start" }) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="12" font-weight="600" class="lo">${escape$2(text)}</text>`;

let current$5 = "en";
const langOf$5 = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang$5(value) {
  current$5 = langOf$5(value);
  return current$5;
}
const pick$4 = (table) => table[current$5];

const count$1 = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const files = (n) => count$1(n, "file", "files");
const EN$5 = {
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
const TR$5 = {
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
const words$4 = () => pick$4({ en: EN$5, tr: TR$5 });

const PAD$4 = 2;
const GAP$3 = 12;
const TITLE$3 = 13;
const SUB$1 = 12;
const ROW$3 = 13;
const LINE$3 = 22;
const TITLE_Y$1 = 15;
const LINES_TOP = TITLE_Y$1;
const ICON_INDENT = 20;
const ICON$3 = 14;
const ICON_LIFT = 11.5;
const DOT_R$4 = 3;
const MIN_SUB = 56;
function fitEnd(text, width, font) {
  const { size, isBold = false } = font;
  if (measure$4(text, size, isBold) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 1 && measure$4(`${chars.join("")}…`, size, isBold) > width)
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
    used += measure$4(text, size, p.isBold);
    const weight = p.isBold ? ' font-weight="650"' : "";
    out.push(`<tspan class="${p.cls}${p.isNum ? " num" : ""}"${weight}>${escape$2(text)}</tspan>`);
    if (text !== p.text)
      break;
  }
  return out.join("");
}
function titleLine(hero, { x, y, width }) {
  const { lead, name, tail } = hero.title;
  const room = width - measure$4(lead + tail, TITLE$3, true);
  const fitted = name ? fitMiddle(name, Math.max(TITLE$3 * 3, room), { size: TITLE$3, isBold: true }) : "";
  const full = fitEnd(`${lead}${fitted}${tail}`, width, { size: TITLE$3, isBold: true });
  return `<text x="${x}" y="${y}" font-size="${TITLE$3}" font-weight="600" class="hi">${escape$2(full)}</text>`;
}
function gitLine(git, y, w) {
  const said = words$4();
  const status = git.changed ? [
    ...git.add ? [{ text: `+${git.add} `, cls: "f-ok", isNum: true }] : [],
    ...git.del ? [{ text: `−${git.del} `, cls: "f-danger", isNum: true }] : [],
    ...git.add || git.del ? [{ text: "· ", cls: "lo" }] : [],
    { text: said.changes(git.changed), cls: "f-warn" }
  ] : [{ text: said.cleanNoChanges, cls: "mid" }];
  const statusW = status.reduce((s, p) => s + measure$4(p.text, ROW$3, p.isBold), 0);
  const moves = `${git.ahead ? ` ↑${git.ahead}` : ""}${git.behind ? ` ↓${git.behind}` : ""}`;
  const nameRoom = w - 2 * PAD$4 - ICON_INDENT - statusW - measure$4(moves, ROW$3, true) - GAP$3;
  const name = fitMiddle(git.branch, Math.max(40, nameRoom), { size: ROW$3, isBold: true });
  const upRoom = nameRoom - measure$4(name, ROW$3, true) - 10;
  const upstream = git.upstream && upRoom > 40 ? `<tspan dx="8" font-size="12" class="lo">${escape$2(fitMiddle(git.upstream, upRoom, { size: 12 }))}</tspan>` : "";
  const branch = `<text x="${PAD$4 + ICON_INDENT}" y="${y}" font-size="${ROW$3}"><tspan font-weight="560" class="hi">${escape$2(name)}</tspan>${git.ahead ? `<tspan font-weight="650" class="mid"> ↑${git.ahead}</tspan>` : ""}${git.behind ? `<tspan font-weight="650" class="f-warn"> ↓${git.behind}</tspan>` : ""}${upstream}</text>`;
  const right = `<text x="${w - PAD$4}" y="${y}" text-anchor="end" font-size="${ROW$3}">${spans(status, statusW + 4, ROW$3)}</text>`;
  return `${icon$1("branch", { x: PAD$4, y: y - ICON_LIFT, size: ICON$3 })}${branch}${right}`;
}
function costLine(cost, y, w) {
  const said = words$4();
  const [lead = "", tail = ""] = said.costTurn;
  const left = cost.turn ? [{ text: lead, cls: "mid" }, { text: cost.turn, cls: "hi", isBold: true, isNum: true }, { text: tail, cls: "mid" }] : [{ text: said.costNone, cls: "lo" }];
  const leftW = left.reduce((s, p) => s + measure$4(p.text, ROW$3, p.isBold), 0);
  const room = w - 2 * PAD$4 - ICON_INDENT;
  const right = cost.session ? said.costSession(cost.session) : "";
  const rightW = right ? measure$4(right, 12) + GAP$3 : 0;
  const isRightShown = right !== "" && leftW + rightW <= room;
  const head = `<text x="${PAD$4 + ICON_INDENT}" y="${y}" font-size="${ROW$3}">${spans(left, room - (isRightShown ? rightW : 0), ROW$3)}</text>`;
  const tailText = isRightShown ? `<text x="${w - PAD$4}" y="${y}" text-anchor="end" font-size="12" class="lo">${escape$2(right)}</text>` : "";
  return `${icon$1("eye", { x: PAD$4, y: y - ICON_LIFT, size: ICON$3 })}${head}${tailText}`;
}
function legendLine(items, { y, w }) {
  let x = PAD$4 + ICON_INDENT;
  return items.map((item) => {
    if (x + 11 + measure$4(item.label, 12) > w - PAD$4)
      return "";
    const dot = `<circle cx="${x + 3}" cy="${y - 4}" r="3" class="f-${item.role}"/>`;
    const label = `<text x="${x + 11}" y="${y}" font-size="12" class="lo">${escape$2(item.label)}</text>`;
    x += 11 + measure$4(item.label, 12) + 14;
    return dot + label;
  }).join("");
}
const leadDot = (hero) => `<circle cx="${PAD$4 + ICON$3 / 2}" cy="${TITLE_Y$1 - 4.5}" r="${DOT_R$4}" class="${hero.isLive === true ? "f-edit breathe" : "lo"}"/>`;
function nowLine$2(hero, w) {
  const x = PAD$4 + ICON_INDENT;
  const width = w - x - PAD$4;
  const head = titleLine(hero, { x, y: TITLE_Y$1, width });
  const said = `${hero.title.lead}${hero.title.name}${hero.title.tail}`;
  const used = measure$4(said, TITLE$3, true) + 8;
  const room = width - used;
  const sub = hero.sub.length && room >= MIN_SUB ? `<text x="${x + used}" y="${TITLE_Y$1}" font-size="${SUB$1}">${spans(hero.sub, room, SUB$1)}</text>` : "";
  return head + sub;
}
function heroCard(hero, { git, cost, legend }, { look, w }) {
  const rows = [];
  let y = LINES_TOP;
  if (git)
    rows.push(gitLine(git, y += LINE$3, w));
  if (cost)
    rows.push(costLine(cost, y += LINE$3, w));
  if (legend.length)
    rows.push(legendLine(legend, { y: y += LINE$3, w }));
  const h = y + 8;
  const [lead = "", tail = ""] = words$4().costTurn;
  const costAlt = cost?.turn ? ` · ${lead}${cost.turn}${tail}` : "";
  const alt = `${hero.label}: ${hero.title.lead}${hero.title.name}${hero.title.tail}. ${hero.sub.map((p) => p.text).join("")}${costAlt}`;
  return { source: svgDoc$4({ width: w, height: h }, look, leadDot(hero) + nowLine$2(hero, w) + rows.join("")), width: w, height: h, alt };
}
const ROW_H$1 = 24;
const HEAD_H$2 = 22;
const MAX_ROWS = 6;
const ROW_BASE$1 = 16;
function touchedRow(r, y, w) {
  const wordW = measure$4(r.pill.text, 12);
  const diff = r.diff ? `${r.diff[0] ? `+${r.diff[0]}` : ""}${r.diff[0] && r.diff[1] ? " " : ""}${r.diff[1] ? `−${r.diff[1]}` : ""}` : "";
  const diffW = diff ? measure$4(diff, 12) + GAP$3 : 0;
  const unit = r.cost ? ` ${words$4().tokUnit}` : "";
  const costW = r.cost ? measure$4(`${r.cost}${unit}`, 12) + GAP$3 : 0;
  const room = w - 2 * PAD$4 - wordW - diffW - costW - GAP$3;
  const name = fitMiddle(r.name, Math.max(48, room * 0.7), { size: ROW$3 });
  const dirRoom = room - measure$4(name, ROW$3) - 8;
  const dir = r.dir && dirRoom > 24 ? fitMiddle(r.dir, dirRoom, { size: 12 }) : "";
  const base = y + ROW_BASE$1;
  const parts = [
    `<text x="${PAD$4}" y="${base}" font-size="${ROW$3}"><tspan class="hi">${escape$2(name)}</tspan>${dir ? `<tspan dx="8" font-size="12" class="lo">${escape$2(dir)}</tspan>` : ""}</text>`,
    `<text x="${w - PAD$4}" y="${base}" text-anchor="end" font-size="12" class="${r.pill.role ? `f-${r.pill.role}` : "lo"}">${escape$2(r.pill.text)}</text>`
  ];
  if (diff) {
    const [add = 0, del = 0] = r.diff ?? [];
    const plus = add ? `<tspan class="f-ok">+${add}</tspan>` : "";
    const minus = del ? `<tspan class="f-danger">${add ? " " : ""}−${del}</tspan>` : "";
    parts.push(`<text x="${w - PAD$4 - wordW - GAP$3}" y="${base}" text-anchor="end" font-size="12" class="num">${plus}${minus}</text>`);
  }
  if (r.cost) {
    const tokens = `<tspan class="num mid">${escape$2(r.cost)}</tspan><tspan class="lo">${escape$2(unit)}</tspan>`;
    parts.push(`<text x="${w - PAD$4 - wordW - diffW - GAP$3}" y="${base}" text-anchor="end" font-size="12">${tokens}</text>`);
  }
  return parts.join("");
}
function touchedCard(rows, look, w) {
  const said = words$4();
  const title = said.touchedTitle(rows.length);
  const shown = rows.slice(0, MAX_ROWS);
  const more = rows.length - shown.length;
  const body = shown.length ? shown.map((r, i) => touchedRow(r, HEAD_H$2 + i * ROW_H$1, w)).join("") : `<text x="2" y="${HEAD_H$2 + 16}" font-size="${SUB$1}" class="lo">${escape$2(said.noTouchThisTurn)}</text>`;
  const listH = shown.length ? HEAD_H$2 + shown.length * ROW_H$1 : HEAD_H$2 + 22;
  const moreLine = more > 0 ? `<text x="2" y="${listH + 14}" font-size="12" class="lo">${escape$2(said.moreFiles(more))}</text>` : "";
  const h = listH + (more > 0 ? 20 : 0);
  const head = groupLabel$1(title, { x: PAD$4, y: 15 });
  const alt = `${title}: ${rows.map((r) => `${r.name} ${r.pill.text}${r.cost ? ` ${r.cost} ${said.tokUnit}` : ""}`).join(", ") || said.noneYet}`;
  return { source: svgDoc$4({ width: w, height: h }, look, head + body + moreLine), width: w, height: h, alt };
}
function sectionLine({ label, name }, { look, w }) {
  const h = 22;
  const fitted = fitMiddle(name, w - 2 * PAD$4, { size: 12, isBold: true });
  return { source: svgDoc$4({ width: w, height: h }, look, groupLabel$1(fitted, { x: PAD$4, y: 15 })), width: w, height: h, alt: `${label} · ${name}` };
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

const DEFAULT_THEME = {
  fg: "",
  accent: "#5b9bd5",
  muted: "#808a96",
  urgent: "#d0605e",
  selection: "#6b7280",
  bg: ""
};
function emptyTree$1(root) {
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
function dirname(path) {
  const i = path.lastIndexOf("/");
  return i <= 0 ? "/" : path.slice(0, i);
}
function inside(root, path) {
  return path === root || path.startsWith(root.endsWith("/") ? root : `${root}/`);
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
function stamp$1(ms, now = Date.now()) {
  if (!ms)
    return "";
  const d = new Date(ms);
  const today = new Date(now);
  const p = (v) => String(v).padStart(2, "0");
  if (d.toDateString() === today.toDateString())
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
  const w = words$4();
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
  return `${v < 100 ? v.toFixed(1).replace(".", words$4().decimal) : Math.round(v)} ${units[i]}`;
}
const unsized = (t, rows) => rows.filter((r) => r.node.kind === "dir" && !(r.node.id in t.dirSizes)).map((r) => r.node.id);

function shortPath$1(path) {
  return path;
}

const relOrShort = (t, id) => id !== t.root && inside(t.root, id) ? id.slice(t.root.endsWith("/") ? t.root.length : t.root.length + 1) : shortPath$1(id);
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
  }, words$4().selected, relOrShort(s.t, s.t.selected))) : null, h(Box, {
    flexGrow: 1
  }), chip);
}

const RANK$2 = { exact: 0, share: 1, guess: 2 };
const NO_COST = { tokens: 0, kind: "exact", reads: 0 };
function merge(a, b) {
  if (!a)
    return b;
  return { tokens: a.tokens + b.tokens, kind: RANK$2[b.kind] > RANK$2[a.kind] ? b.kind : a.kind, reads: a.reads + b.reads };
}
const sumOf = (costs) => costs.reduce((acc, c) => merge(acc, c), NO_COST);

const MARK$1 = { exact: "", share: "≈", guess: "~" };
const THOUSAND$1 = 1000;
const DECIMAL_BELOW = 100;
const grouped = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, words$4().thousands);
function short$1(n) {
  if (n < THOUSAND$1)
    return String(Math.round(n));
  const k = n / THOUSAND$1;
  return k < DECIMAL_BELOW ? `${k.toFixed(1).replace(".", words$4().decimal)}k` : `${Math.round(k)}k`;
}
const costText$2 = (c, isShort = false) => `${MARK$1[c.kind]}${isShort ? short$1(c.tokens) : grouped(c.tokens)}`;
function turnCost(turn) {
  const all = Object.values(turn.costs ?? {});
  return all.length ? sumOf(all) : null;
}
function rowCost(turn, id) {
  const c = turn.costs?.[id];
  return c ? `${costText$2(c, true)} ${words$4().tokUnit}` : "";
}

const FILL$6 = /<rect\b[^>]*\bdata-m-fill\b[^>]*>/g;
const DONE$5 = /<path\b[^>]*\bdata-m-done\b[^>]*>/g;
const HAS_DONE$5 = /\bdata-m-done\b/;
const WIDTH$8 = /\swidth="([\d.]+)"/;
const CLASS$5 = /\sclass="([^"]*)"/;
const STYLE$5 = /\sstyle="([^"]*)"/;
const MIN_RATIO_STEP$5 = 0.02;
const RATIO_DIGITS$5 = 3;
const widthOf$6 = (tag) => Number(WIDTH$8.exec(tag)?.[1] ?? 0);
function withClass$5(tag, name, extra = "") {
  const tagged = CLASS$5.test(tag) ? tag.replace(CLASS$5, (_, classes) => ` class="${classes} ${name}"`) : tag.replace(/\s*\/?>$/, ` class="${name}"$&`);
  return tagged.replace(/\s*\/?>$/, `${extra}$&`);
}
function slideFills$5(before, now) {
  const old = before.match(FILL$6) ?? [];
  if (old.length !== (now.match(FILL$6) ?? []).length)
    return now;
  let index = 0;
  return now.replace(FILL$6, (tag) => {
    const was = old[index++];
    const from = was === undefined ? 0 : widthOf$6(was);
    const to = widthOf$6(tag);
    if (from <= 0 || to <= 0 || Math.abs(from - to) / to < MIN_RATIO_STEP$5)
      return tag;
    const slide = `--m-from:${(from / to).toFixed(RATIO_DIGITS$5)}`;
    const styled = STYLE$5.test(tag) ? tag.replace(STYLE$5, (_, rules) => ` style="${slide};${rules}"`) : tag.replace(/\s*\/?>$/, ` style="${slide}"$&`);
    return withClass$5(styled, "m-from");
  });
}
function drawDone$5(before, now) {
  if (HAS_DONE$5.test(before))
    return now;
  return now.replace(DONE$5, (tag) => withClass$5(tag, "m-draw", ' pathLength="1"'));
}
function markChanges$5(before, now) {
  return drawDone$5(before, slideFills$5(before, now));
}

const STAGGER_MS$5 = 45;
const EASE$5 = "cubic-bezier(.2,.8,.2,1)";
const SHEEN$5 = "#A39E93";
const RULES$5 = {
  "m-in": `.m-in{animation:m-in .42s ${EASE$5} both}@keyframes m-in{from{opacity:0;transform:translateY(8px)}}`,
  "m-fade": `.m-fade{animation:m-fade .5s ${EASE$5} both}@keyframes m-fade{from{opacity:0}}`,
  "m-grow": `.m-grow{transform-box:fill-box;transform-origin:left center;animation:m-grow .7s ${EASE$5} both}@keyframes m-grow{from{transform:scaleX(0)}}`,
  "m-px": `.m-px{transform-box:fill-box;transform-origin:center;animation:m-px .34s ${EASE$5} both}@keyframes m-px{from{opacity:0;transform:translateY(-10px) scale(.6)}}`,
  "m-flash": ".m-flash{opacity:0;animation:m-flash 1.6s ease-out both}@keyframes m-flash{from{opacity:.9}to{opacity:0}}",
  "m-from": `.m-from{transform-box:fill-box;transform-origin:left center;animation:m-from .32s ${EASE$5} both}@keyframes m-from{from{transform:scaleX(var(--m-from))}}`,
  "m-draw": `.m-draw{stroke-dasharray:1;animation:m-draw .32s ${EASE$5} .12s both}@keyframes m-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}`,
  "m-breathe": ".m-breathe{animation:m-breathe 1.8s ease-in-out infinite}@keyframes m-breathe{50%{opacity:.4}}",
  "m-ring": ".m-ring{transform-box:fill-box;transform-origin:center;animation:m-ring 1.8s ease-out infinite}@keyframes m-ring{from{opacity:.55;transform:scale(1)}to{opacity:0;transform:scale(2.8)}}",
  "m-wash": `.m-wash{fill:#8E8A80;opacity:0;transition:opacity .12s ${EASE$5}}svg:hover .m-wash{opacity:.12}`,
  "m-tile": `.m-tile{transform-box:fill-box;transform-origin:center;transition:transform .2s ${EASE$5}}svg:hover .m-tile{transform:translateY(-1px) scale(1.06)}`
};
const REDUCED$6 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function motionCss$5(body) {
  const used = Object.keys(RULES$5).filter((name) => new RegExp(`\\b${name}\\b`).test(body));
  return used.length === 0 ? "" : `${used.map((name) => RULES$5[name]).join("")}${REDUCED$6}`;
}
Object.values(RULES$5).join("");
const isEntering$5 = (cue) => cue.phase === "enter";
function entering$5(body, cue, kind = "in") {
  if (!isEntering$5(cue))
    return body;
  return `<g class="m-${kind}" style="animation-delay:${cue.order * STAGGER_MS$5}ms">${body}</g>`;
}
const FLASH$5 = `<rect x="0" y="0" width="100%" height="100%" rx="10" fill="${SHEEN$5}" fill-opacity=".22" class="m-flash"/>`;
const WASH$5 = '<rect x="0" y="0" width="100%" height="100%" rx="10" class="m-wash"/>';

function stableDrawings$5() {
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

const TAG_WIDTH$5 = /^[\s\S]*?<svg\b[^>]*?\swidth="([\d.]+)"/;
const SVG$5 = /^([\s\S]*?<svg\b[^>]*>)([\s\S]*)(<\/svg>\s*)$/;
const SCHEME$6 = "<style>:root{color-scheme:light dark}</style>";
const SAYS_SCHEME$5 = /(^|[^-\w])color-scheme\s*:/;
const PASS_MS$5 = 120;
const MAX_ORDER$5 = 12;
const LIVE_MS$5 = 30000;
function animate$5(source, spec) {
  const moved = spec.cue.phase === "change" && spec.before !== undefined ? markChanges$5(spec.before, source) : source;
  const parts = SVG$5.exec(moved);
  if (parts === null)
    return source;
  const [, open, inner = "", close] = parts;
  const scheme = SAYS_SCHEME$5.test(inner) ? "" : SCHEME$6;
  const lit = `${spec.isRow === true ? WASH$5 : ""}${spec.cue.phase === "change" && spec.isLive !== true ? FLASH$5 : ""}${inner}`;
  const body = entering$5(lit, spec.cue);
  const css = motionCss$5(body);
  return `${open}${scheme}${css === "" ? "" : `<style>${css}</style>`}${body}${close}`;
}
function paneMotion$5() {
  const drawings = stableDrawings$5();
  const shown = new Map;
  const pass = { at: Number.NEGATIVE_INFINITY, entered: 0 };
  const begin = () => {
    const now = Date.now();
    if (now - pass.at > PASS_MS$5)
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
      const now = { shows: opts.shows === undefined ? what : JSON.stringify(opts.shows), width: String(pic.width ?? TAG_WIDTH$5.exec(pic.source)?.[1]), source: pic.source };
      const source = drawings.draw(key, what, (built) => {
        const order = built === "enter" ? Math.min(MAX_ORDER$5, pass.entered++) : 0;
        const before = shown.get(key);
        const isQuiet = before !== undefined && (before.shows === now.shows || before.width !== now.width);
        const phase = built === "change" && isQuiet ? "still" : built;
        const lastChange = before?.changedAt ?? Number.NEGATIVE_INFINITY;
        const isLive = phase === "change" && pass.at - lastChange < LIVE_MS$5;
        shown.set(key, { ...now, changedAt: phase === "change" ? pass.at : lastChange });
        return animate$5(pic.source, { cue: { phase, order }, isRow: opts.isRow, before: before?.source, isLive });
      });
      return { ...pic, source, isInteractive: true };
    }
  };
}

const ROLE = { read: "read", edit: "edit", commit: "ok" };
const baseName$1 = (id) => id.slice(id.lastIndexOf("/") + 1);
function relDir(id, root) {
  const rel = id.startsWith(`${root}/`) ? id.slice(root.length + 1) : id;
  const cut = rel.lastIndexOf("/");
  return cut < 0 ? "" : rel.slice(0, cut);
}
const relPath = (id, root) => id.startsWith(`${root}/`) ? id.slice(root.length + 1) : id;
const where = (id, root) => {
  const dir = relDir(id, root);
  return { text: dir ? words$4().inDir(dir) : words$4().inRoot, cls: "mid" };
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
  const w = words$4();
  const parts = [
    count(turn, "read") ? w.openedFiles(count(turn, "read")) : "",
    count(turn, "edit") ? w.editedFiles(count(turn, "edit")) : ""
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : w.noTouchYet;
}
function liveHero(input, latest) {
  const same = input.turn.touches.filter((t) => t.role === latest.role && input.live.has(t.id));
  const w = words$4();
  const [lead = "", tail = ""] = w.liveOne[latest.role];
  const isMany = same.length > 1;
  const title = isMany ? { lead: w.liveMany[latest.role](same.length), name: "", tail: "" } : { lead, name: baseName$1(latest.id), tail };
  const sub = latest.role === "commit" ? shaParts(input) : [where(latest.id, input.root)];
  return { label: w.now, title, sub };
}
function shaParts(input) {
  const sha = input.turn.sha ? [{ text: input.turn.sha, cls: "mid", isNum: true }] : [];
  const branch = input.branch ? [{ text: `${sha.length ? " · " : ""}${words$4().onBranch(input.branch)}`, cls: "lo" }] : [];
  return [...sha, ...branch];
}
const quiet = (label, lead, sub) => ({
  label,
  title: { lead, name: "", tail: "" },
  sub: [{ text: sub, cls: "mid" }]
});
function names(touches) {
  return touches.map((t) => baseName$1(t.id)).join(", ");
}
function doneHero(input) {
  const { turn, root } = input;
  const w = words$4();
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
  const w = words$4();
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
    return quiet(words$4().now, words$4().waiting, words$4().waitingSub);
  return doneHero(input);
}
const heroText = (h) => `${h.title.lead}${h.title.name}${h.title.tail}`;
const subText = (h) => h.sub.map((p) => p.text).join("");
function touchedRows(input) {
  const { turn, root } = input;
  const w = words$4();
  return turn.touches.map((t) => {
    const isLive = turn.isRunning && input.live.has(t.id);
    const diff = t.role === "read" ? undefined : input.diff[t.id];
    const cost = turn.costs?.[t.id];
    return {
      name: baseName$1(t.id),
      dir: relDir(t.id, root),
      pill: { text: (isLive ? w.pillLive : w.pillDone)[t.role], role: isLive ? ROLE[t.role] : null },
      ...diff && (diff[0] || diff[1]) ? { diff } : {},
      ...cost ? { cost: costText$2(cost) } : {}
    };
  });
}

const ICON$2 = {
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
const TONES$1 = {
  orange: { bright: ["#f97316", "#fb923c", "#fdba74", "#ffedd5"], dim: ["#8a4316", "#a3562a", "#bd7444", "#d29267"], solid: "#f97316" },
  green: { bright: ["#22c55e", "#4ade80", "#86efac", "#dcfce7"], dim: ["#14532d", "#166534", "#2f7a47", "#4f9a66"], solid: "#4ade80" },
  teal: { bright: ["#14b8a6", "#2dd4bf", "#5eead4", "#ccfbf1"], dim: ["#0f5e57", "#16786f", "#2a9488", "#4fb3a8"], solid: "#2dd4bf" },
  blue: { bright: ["#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe"], dim: ["#1e3a8a", "#1d4ed8", "#3b6fd1", "#6b93dc"], solid: "#60a5fa" },
  iris: { bright: ["#a855f7", "#c084fc", "#d8b4fe", "#f3e8ff"], dim: ["#581c87", "#6b21a8", "#8b47c4", "#a874d6"], solid: "#c084fc" },
  purple: { bright: ["#a855f7", "#c084fc", "#d8b4fe", "#f3e8ff"], dim: ["#581c87", "#6b21a8", "#8b47c4", "#a874d6"], solid: "#c084fc" },
  cyan: { bright: ["#06b6d4", "#22d3ee", "#67e8f9", "#cffafe"], dim: ["#155e75", "#0e7490", "#2b8ea3", "#5aa9b8"], solid: "#22d3ee" },
  red: { bright: ["#ef4444", "#f87171", "#fca5a5", "#fee2e2"], dim: ["#7f1d1d", "#991b1b", "#b54040", "#c96a6a"], solid: "#f87171" }
};
const BRANCH_ICON = ICON$2.branch;

const cp = (n) => String.fromCodePoint(n);
const CHEVRON_OPEN = cp(62588);
const CHEVRON_CLOSED = cp(62560);
const NAMES$1 = {
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
  const named = NAMES$1[lower];
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

const ADD_COLOR$1 = "#98c379";
const DEL_COLOR$1 = "#e06c75";
const PX_PER_COL$1 = 9;
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
function metaOf$2(ctx, r) {
  const { t } = ctx;
  const n = r.node;
  if (t.showSize) {
    if (n.kind === "dir")
      return n.id in t.dirSizes ? formatSize(t.dirSizes[n.id] ?? -1) : "…";
    return n.kind === "file" || n.kind === "link" && n.size > 0 ? formatSize(n.size) : "";
  }
  return t.diff[n.id] || n.kind !== "file" ? "" : stamp$1(n.mtime, ctx.now);
}
const fit$3 = (name, cols) => name.length > cols ? name.slice(0, Math.max(1, cols - 1)) + "…" : name;
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
function glyphOf$2(ctx, r) {
  const n = r.node;
  if (!ctx.unicode)
    return fileIcon(n, r.open, n.kind === "dir" && n.id === ctx.t.top);
  return n.kind === "dir" ? "■" : "·";
}
function terminalRow$1(ctx, r) {
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
  const meta = metaOf$2(ctx, r);
  const cost = ctx.costOf(n.id);
  const locText = loc ? `${loc[0] ? ` +${loc[0]}` : ""}${loc[1] ? ` -${loc[1]}` : ""}` : "";
  const dirCounts = n.kind === "dir" ? countSegs(t.counts[n.id], theme) : [];
  const badge = badgeText(ctx, { status, isIgnored, hasCounts: dirCounts.length > 0 });
  const countsText = dirCounts.map((c) => c.t).join("");
  const cols = Math.max(4, ctx.width - r.depth * 2 - 6 - (meta ? meta.length + 1 : 0) - (cost ? cost.length + 1 : 0) - locText.length - badge.length - countsText.length);
  const caret = caretOf(r, unicode);
  const glyph = glyphOf$2(ctx, r);
  const lit = isBright || isDim;
  const left = [
    { t: "  ".repeat(r.depth) },
    { t: caret, c: theme.muted },
    lit ? { t: glyph + " ", sh: tone, dim: isDim, one: true } : { t: glyph + " ", c: colors.icon },
    lit ? { t: fit$3(n.name, cols), sh: tone, dim: isDim, b: isBright } : { t: fit$3(n.name, cols), c: colors.name, b: n.id === t.selected, s: status === "D" && n.kind !== "dir" }
  ];
  const right = [];
  if (cost)
    right.push({ t: ` ${cost}`, c: TONES$1.blue?.solid ?? theme.accent });
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
  const meta = metaOf$2(ctx, r);
  return { must, may: [...cost ? [{ t: ` ${cost}`, c: pal.mid }] : [], ...meta ? [{ t: ` ${meta}`, c: pal.lo }] : []] };
}
const widthOf$5 = (segs) => measure$4(segs.map((x) => x.t).join(""), NAME_PX);
function fitRow(ctx, r, right, isBold) {
  const room = (ctx.width - (r.depth + 1) * LEVEL_CELLS) * PX_PER_COL$1;
  const whole = measure$4(r.node.name, NAME_PX, isBold);
  const must = room - widthOf$5(right.must) < MIN_NAME_PX ? [] : right.must;
  const kept = [...must];
  for (const seg of right.may)
    if (whole + widthOf$5([...kept, seg]) + RIGHT_GAP_PX <= room)
      kept.push(seg);
  return { name: fitMiddle(r.node.name, Math.max(MIN_NAME_PX, room - widthOf$5(kept) - RIGHT_GAP_PX), { size: NAME_PX, isBold }), right: kept };
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

const BRANCH_ROW = "#branch";

const NO_TURN$1 = { isRunning: false, hasRun: false, touches: [], sha: "", committed: 0, costs: {} };

const ACTIVITY_TTL_MS = 45000;

const RUNNING_MAX_MS = 600000;
const LIVE_SPREAD_MS = 1500;
const PIN_SHARE = 3;
const MIN_REST = 3;
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
  const w = words$4();
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
function spanOf$2(s, rows, room) {
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
  const { from, pinned } = spanOf$2(s, rows, room);
  const max = Math.max(0, rows.length - room);
  mem.view = { from, max };
  const shown = rows.slice(from, from + room - pinned.length);
  const { toSpec, colors } = draw;
  const note = (text) => ({ id: "", left: [{ t: text, c: colors.note }], right: [] });
  const specs = [...rows.length === 0 ? [note(words$4().emptyFolder)] : [], ...pinned.map(toSpec), ...pinned.length > 0 ? [note("  ⋮")] : [], ...shown.map(toSpec)];
  const barSize = Math.max(1, Math.round(specs.length * shown.length / Math.max(1, rows.length)));
  const bar = { pos: max ? Math.round(from / max * (specs.length - barSize)) : 0, size: barSize, thumb: colors.thumb, track: colors.track };
  return { rows: [...pinned, ...shown], specs, ...rows.length > shown.length + pinned.length ? { bar } : {} };
}

const MORE_KEYS = ["size", "hidden", "up", "cwd", "unselect"];
function toolLabels(t) {
  const { tools } = words$4();
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
const shortcuts = () => SHORTCUT_KEYS.map((key, i) => [key, words$4().shortcuts[i] ?? ""]);
function drawFind(ui, bar) {
  const { Box, Button, Input } = ui;
  const { t } = bar;
  const w = words$4();
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
  const w = words$4();
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
  return { turn: turn ? costText$2(turn) : null, session: total.reads > (turn?.reads ?? 0) ? costText$2(total) : null };
}
function legendOf(s, git) {
  const tones = s.t.flashOn ? Object.values(s.t.flashTones).map(roleOfTone) : [];
  const has = (role) => s.turn.touches.some((x) => x.role === role) || tones.includes(role);
  const { legend } = words$4();
  return [
    ...has("read") ? [{ role: "read", label: legend.read }] : [],
    ...has("edit") ? [{ role: "edit", label: legend.edit }] : [],
    ...git?.changed ? [{ role: "warn", label: legend.warn }] : []
  ];
}
const motion$5 = paneMotion$5();
function cardsOf(s, w) {
  const { t, look } = s;
  const input = heroInput(s);
  const git = gitRowOf(t);
  const cost = costRowOf(s);
  const hero = heroOf(input);
  const legend = legendOf(s, git);
  const touchedList = touchedRows(input);
  const section = sectionLine({ label: words$4().allFiles, name: (t.top ? t.top : t.root).split("/").pop() ?? "" }, { look, w: w - ACTIONS_PX >= MIN_NAME_W ? w - ACTIONS_PX : w });
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
  const { hero, touched, section } = cardsOf(s, Math.max(MIN_SVG_W, Math.min(MAX_SVG_W, room.width * PX_PER_COL$1)));
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
    ...motion$5.pic(key, card.drawn, { shows: card.shows })
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

const TERMINAL_TONE = { purple: "blue", iris: "purple" };
const SHIMMER = Object.fromEntries(Object.keys(TONES$1).map((k) => {
  const v = TONES$1[TERMINAL_TONE[k] ?? k] ?? TONES$1[k];
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
  }, ` ${words$4().clean}`));
}
function terminalBranch(ui, s, unicode) {
  const { Box, Text } = ui;
  const { t, theme } = s;
  if (!t.top || !t.branch)
    return null;
  const b = t.branch;
  const isFlash = s.bright.has(BRANCH_ROW);
  const tone = TONES$1[t.flashTones[BRANCH_ROW] ?? "teal"]?.solid;
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
    placeholder: words$4().find,
    submitLabel: words$4().findGo,
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
  const said = words$4();
  const parts = [
    turn ? `${costText$2(turn)} ${said.tokUnit}` : "",
    total && total.reads > (turn?.reads ?? 0) && width >= SESSION_COST_COLS ? said.costSession(costText$2(total, true)) : ""
  ];
  return parts.filter(Boolean).join(" · ");
}
function nowLine$1(ui, s, width) {
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
  const win = treeWindow(s, Math.max(MIN_BODY, room.bodyRows - fixedRows(s)), { toSpec: (r) => terminalRow$1(ctx, r), colors: { thumb: theme.accent, track: theme.muted, note: theme.muted } });
  if (t.showSize)
    act.sizes(unsized(t, win.rows));
  const chip = s.latest ? activityChip(ui, s.latest, { unicode, colorOf: (tone) => TONES$1[tone]?.solid ?? theme.accent }) : null;
  const rows = { rows: win.specs, active: t.cursor, activeBg: theme.selection, hoverBg: faint(theme.selection), tones: SHIMMER, pointer: s.feel.pointer, ...win.bar ? { bar: win.bar } : {} };
  return h(Box, {
    flexDirection: "column",
    minHeight: Math.max(1, room.bodyRows),
    backgroundColor: theme.bg || undefined
  }, home, headRow(ui, { t, theme, unicode, isFollowing: s.feel.follow, act: act.tool }), terminalBranch(ui, s, unicode), !t.top && h(Text, {
    color: theme.muted
  }, unicode ? "± " : " ", words$4().noRepo), s.turn.hasRun && nowLine$1(ui, s, room.width), searchRow(ui, { t, act, label: "/ ", clear: unicode ? "×" : "\uDB80\uDD56" }), h(Client, {
    key: "rows",
    module: "./rows.tsx",
    props: rows
  }), h(Box, {
    flexGrow: 1
  }), footer(ui, s, chip));
}

const TREE = { plugin: "filetree", key: "tree" };
const THEME$1 = { plugin: "filetree", key: "theme" };
const ACTIVITY = { plugin: "filetree", key: "activity" };
const TURN$1 = { plugin: "filetree", key: "turn" };
const READS = { plugin: "filetree", key: "reads" };
const LOOK = { plugin: "filetree", key: "look" };
const FEEL = { plugin: "filetree", key: "feel" };
const STAGE$1 = { plugin: "modz", key: "stage" };
const ACT$1 = { plugin: "modz", key: "act" };
const PAGE = "files";
const MIN_WIDTH = 24;
const FEEL_DEFAULT = { glyphs: "auto", noNerd: false, pointer: true, followClaude: true, follow: true };
const shown = { at: -1, isLoaded: false };
async function filesPage($, ui, site, act) {
  setLang$5(lang$1());
  const t = { ...emptyTree$1(""), ...(await $.state.get(TREE)).value };
  const parts = {
    theme: (await $.state.get(THEME$1)).value,
    activities: (await $.state.get(ACTIVITY)).value ?? [],
    turn: { ...NO_TURN$1, ...(await $.state.get(TURN$1)).value },
    readTotal: (await $.state.get(READS)).value,
    look: (await $.state.get(LOOK)).value,
    feel: { ...FEEL_DEFAULT, ...(await $.state.get(FEEL)).value }
  };
  const staged = (await $.state.get(STAGE$1)).value;
  const at = typeof staged?.at === "number" ? staged.at : -1;
  const isLoaded = t.nodes.length > 0;
  if (at !== shown.at || isLoaded !== shown.isLoaded)
    motion$5.reset();
  Object.assign(shown, { at, isLoaded });
  const s = sceneFrom({ ...parts, t, now: await $.clock.now() });
  const tool = Object.fromEntries(Object.keys(toolLabels(t)).map((key) => [key, () => act(key)]));
  const acts = { tool, find: (v) => act("find", v), jump: (v) => act("jump", v), sizes: () => {
    return;
  } };
  const frame = { s, room: { width: Math.max(MIN_WIDTH, site.columns), bodyRows: site.rows }, home: null };
  return site.surface === "desktop" ? drawDesktop(ui, frame, acts) : drawTerminal(ui, frame, acts);
}
async function isFilesUp($) {
  return paneOf((await $.state.get(STAGE$1)).value) === PAGE;
}
async function handOn($, action, sent) {
  await $.state.set(ACT$1, { page: PAGE, action, arg: JSON.stringify({ ...sent, view: mem.view }), at: Date.now() });
}
function wireFilesPage(on) {
  on("ui.message", async ($, e, next) => {
    if (e.requestId !== HUB_PANE || e.element !== "rows" || !await isFilesUp($))
      return next(e);
    await handOn($, "rows", { data: e.data, surface: e.surface });
    return {};
  });
  on("ui.scroll", { component: "Pane", requestId: HUB_PANE }, async ($, e, next) => {
    if (!await isFilesUp($))
      return next(e);
    await handOn($, "scroll", { by: e.by });
    return {};
  });
  on("ui.focus", { component: "Pane", requestId: HUB_PANE }, async ($, e, next) => {
    const done = await next(e);
    if (await isFilesUp($))
      await handOn($, "focus", {});
    return done;
  });
}

let current$4 = "en";
const langOf$4 = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang$4(value) {
  current$4 = langOf$4(value);
  return current$4;
}
const upper$3 = (text) => text.toLocaleUpperCase(current$4);

const plural$4 = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const en = {
  pane: "Agents",
  command: "Open or close the Agents panel: running, done and planned helper agents; progress, cost, timeline, quiet-agent warning; message, stop and new task",
  cost: "Cost",
  tokens: "Tokens",
  time: "Time",
  collapse: "Collapse",
  expand: "Expand",
  running: "Running",
  finished: "Finished",
  planned: "Planned",
  emptyTitle: "No agents yet",
  paneFailed: "The pane could not be drawn; here is the plain list.",
  moreAgents: (n) => `+${n} more ${n === 1 ? "agent" : "agents"}`,
  empty: "Hand out a task and a crab gets to work: its status, progress and cost show here live.",
  round: "round",
  failed: "failed",
  aborted: "stopped",
  tokensWord: "tokens",
  agentsCount: "agents",
  isRunning: "running",
  isFinished: "done",
  isPlanned: "planned",
  opened: "Agents panel opened.",
  closed: "Agents panel closed.",
  done: "Done",
  plan: "Plan",
  design: "Design",
  tasks: "Tasks",
  review: "Review",
  agents: "Agents",
  busy: "running",
  total: "total",
  completed: "completed",
  starting: "starting",
  mainName: "Main session",
  mainType: "this chat",
  mainTask: "The work in this chat",
  dismiss: "Close",
  brief: "Task",
  history: "Work history",
  context: "memory",
  limit: "5h allowance",
  limitTile: "of 5h allowance",
  kinds: { read: "read", edit: "edit", run: "run", agent: "agent", other: "other" },
  efforts: { low: "light thinking", medium: "medium thinking", high: "deep thinking", xhigh: "very deep thinking", max: "deepest thinking" },
  cheerFailed: "(×_×) did not finish",
  show: "Show",
  hide: "Hide",
  details: "Details",
  current: "Now",
  thinking: "Thinking",
  lastStep: "Last step",
  doing: { read: "Reading", edit: "Editing", run: "Running a command", agent: "Working with an agent", other: "Using a tool" },
  files: "Files touched",
  moreFiles: (n) => `+${plural$4(n, "more file", "more files")}`,
  showAll: "Show all",
  showLess: "Show less",
  ago: (span) => `${span} ago`,
  timeline: "Timeline",
  now: "now",
  look: "Look",
  failedNow: "failed",
  newTask: "New task",
  agentLabel: "Agent",
  taskLabel: "Task",
  taskHint: "Describe the work, Enter starts it",
  start: "start",
  cancel: "Cancel",
  noTypes: "No agent types known yet.",
  noDescription: "No description.",
  spawnFailed: "Could not start the agent",
  builtins: { "general-purpose": "Research, search and multi-step work", Explore: "Scans the code fast, changes nothing", Plan: "Plans how the work will be done" },
  sources: { "built-in": "built-in", plugin: "plugin", project: "project", user: "user" },
  shareOf: (share) => `≈${share}% of the 5-hour usage allowance`,
  earlier: (n) => `${plural$4(n, "earlier step", "earlier steps")} hidden`,
  logOpen: (n) => `Show every step (${n})`,
  logClose: "Close the log",
  log: "Step-by-step log",
  because: "Why",
  after: (list) => `after ${list}`,
  tools: (n) => plural$4(n, "step", "steps"),
  errors: (n) => `${n} failed`,
  crew: (n) => plural$4(n, "agent", "agents"),
  stripCost: "cost",
  stripTokens: "tokens",
  stripTime: "agent time",
  stripLast: (cost) => `last turn ${cost}`,
  stripTurns: (n) => plural$4(n, "turn", "turns"),
  stripPerTurn: (span) => `${span} per turn`,
  stripDoing: { read: "reading", edit: "writing", run: "command", agent: "leading agents", other: "thinking" },
  rowDoing: { read: "reading", search: "searching", edit: "writing", run: "running a command", test: "checking", save: "saving a version", web: "on the internet", message: "sending word", agent: "leading agents", wait: "waiting", other: "thinking" },
  rowStep: (done, total) => `step ${done}/${total}`,
  rowPlan: (at, of, subject) => `plan step ${at}/${of}: ${subject}`,
  rowEnded: { done: "finished", failed: "did not finish" },
  stripPlan: "plan",
  stripPlanDone: "done",
  stripWeek: "week",
  stripFive: "5 hours",
  stripRunsOut: (when) => `runs out ${when}`,
  stripFull: "used up",
  stripDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  stripResting: { sleeping: "asleep", working: "working", happy: "pleased", worried: "uneasy" },
  stripStep: (n, subject) => `Step ${n}: ${subject}`,
  stripTeam: {
    fresh: (n) => `${n} new`,
    away: (name) => `${name} is not working right now`,
    working: "working now",
    isWorking: (name) => `${name} is working now`,
    worked: (name, ago) => `${name} worked ${ago}`,
    on: (branch) => `on the line of work ${branch}`,
    more: (n) => `and ${n} more on this project`,
    wrote: (name) => `${name} wrote`,
    aiWrote: (name) => `${name}'s AI wrote`
  },
  hubCrew: (n) => `${n} running`,
  pct: (n) => `${n}%`,
  minutes: (n) => `${n} min`,
  seconds: (n) => `${n}s`,
  hours: (n) => `${n} h`,
  quiet: (span) => `quiet ${span}`,
  longTool: (_tool, span) => `one step running ${span}`,
  stopWho: (name) => `Stop ${name}`,
  messageTo: (name) => `Message ${name}, Enter sends`,
  you: "You",
  answering: (name) => `${name} is answering…`,
  followUp: (name) => `Ask ${name} a follow-up, Enter sends`,
  launched: (name) => `${name} got to work`,
  denied: (reason) => `Refused: ${reason}`,
  decimal: ".",
  message: "Message",
  send: "send",
  stop: "Stop",
  delivered: "Message delivered",
  stopAsked: "Stop requested",
  stopRefused: "Stop refused",
  stopFailed: "Could not stop this agent",
  allDone: "All done",
  liveCount: (n) => `${n} running`,
  endedCount: (n) => `${n} done`,
  plannedCount: (n) => `${n} planned`,
  notDelivered: (reason) => `Not delivered: ${reason}`,
  chats: {
    title: "Other chats",
    waitingTitle: "Waiting on you",
    waiting: (span) => span ? `waiting ${span}` : "waiting",
    states: { working: "working", idle: "idle" },
    untitled: "New chat",
    more: (n) => `+${n} more`,
    agentsTitle: "Agents in other chats",
    emptyHere: "No agents in this chat",
    hubWaits: (n) => n === 1 ? "1 chat waits" : `${n} chats wait`,
    hubWorks: (n) => n === 1 ? "1 chat working" : `${n} chats working`
  },
  crab: {
    moods: { sleeping: "napping", working: "working", happy: "happy", worried: "worried" },
    level: (n) => `Lv ${n}`
  }
};

const ru = {
  ...en,
  pane: "Агенты",
  command: "Открыть или закрыть панель агентов: работающие, завершённые и запланированные субагенты; прогресс, стоимость, хронология, предупреждение о молчащем агенте; сообщение, остановка и новая задача",
  cost: "Стоимость",
  tokens: "Токены",
  time: "Время",
  collapse: "Свернуть",
  expand: "Развернуть",
  running: "Работают",
  finished: "Завершены",
  planned: "Запланированы",
  emptyTitle: "Агентов пока нет",
  paneFailed: "Панель не отрисовалась, вот простой список.",
  moreAgents: (n) => `ещё агентов: ${n}`,
  empty: "Дай задачу, и краб возьмётся за дело: статус, прогресс и стоимость появятся здесь.",
  round: "раунд",
  failed: "ошибка",
  aborted: "остановлен",
  tokensWord: "токенов",
  agentsCount: "агентов",
  isRunning: "работает",
  isFinished: "завершён",
  isPlanned: "запланирована",
  opened: "Панель агентов открыта.",
  closed: "Панель агентов закрыта.",
  done: "Готово",
  plan: "План",
  design: "Дизайн",
  tasks: "Задачи",
  review: "Ревью",
  agents: "Агенты",
  busy: "в работе",
  total: "всего",
  completed: "готово",
  starting: "запуск",
  mainName: "Главная сессия",
  mainType: "этот чат",
  mainTask: "Работа в этом чате",
  dismiss: "Закрыть",
  brief: "Задача",
  history: "История работы",
  context: "память",
  limit: "5ч",
  limitTile: "доля 5ч",
  current: "Сейчас",
  thinking: "Думает",
  lastStep: "Последний шаг",
  doing: { read: "Читает", edit: "Правит", run: "Выполняет команду", agent: "Работает с агентом", other: "Использует инструмент" },
  files: "Затронутые файлы",
  moreFiles: (n) => `ещё файлов: ${n}`,
  showAll: "Показать целиком",
  showLess: "Свернуть",
  ago: (span) => `${span} назад`,
  kinds: { read: "чтение", edit: "правка", run: "команда", agent: "агент", other: "другое" },
  efforts: { low: "лёгкое обдумывание", medium: "среднее обдумывание", high: "глубокое обдумывание", xhigh: "очень глубокое обдумывание", max: "самое глубокое обдумывание" },
  cheerFailed: "(×_×) не вышло",
  show: "Показать",
  hide: "Скрыть",
  details: "Подробнее",
  timeline: "Хронология",
  now: "сейчас",
  look: "Открыть",
  failedNow: "упал с ошибкой",
  newTask: "Новая задача",
  agentLabel: "Агент",
  taskLabel: "Задача",
  taskHint: "Опиши работу, Enter запустит",
  start: "запустить",
  cancel: "Отмена",
  noTypes: "Типы агентов пока не известны.",
  noDescription: "Без описания.",
  spawnFailed: "Не удалось запустить агента",
  builtins: { "general-purpose": "Исследование, поиск и многошаговая работа", Explore: "Быстрый поиск по коду, только чтение", Plan: "Составляет план реализации" },
  sources: { "built-in": "встроенный", plugin: "плагин", project: "проект", user: "пользователь" },
  shareOf: (share) => `≈${share}% лимита 5ч`,
  earlier: (n) => `скрыто ранних шагов: ${n}`,
  logOpen: (n) => `Показать все шаги (${n})`,
  logClose: "Закрыть журнал",
  log: "Пошаговый журнал",
  because: "Зачем",
  after: (list) => `после ${list}`,
  tools: (n) => `шагов: ${n}`,
  errors: (n) => `ошибок: ${n}`,
  crew: (n) => `агентов: ${n}`,
  stripCost: "стоимость",
  stripTokens: "токены",
  stripTime: "время агентов",
  stripLast: (cost) => `последний ход ${cost}`,
  stripTurns: (n) => `ходов: ${n}`,
  stripPerTurn: (span) => `${span} за ход`,
  stripDoing: { read: "читает", edit: "пишет", run: "команда", agent: "ведёт агентов", other: "думает" },
  rowDoing: { read: "читает", search: "ищет", edit: "пишет", run: "выполняет команду", test: "проверяет", save: "сохраняет версию", web: "в интернете", message: "передаёт сообщение", agent: "ведёт агентов", wait: "ждёт", other: "думает" },
  rowStep: (done, total) => `шаг ${done}/${total}`,
  rowPlan: (at, of, subject) => `шаг плана ${at}/${of}: ${subject}`,
  rowEnded: { done: "закончил", failed: "не закончил" },
  stripPlan: "план",
  stripPlanDone: "готов",
  stripWeek: "неделя",
  stripFive: "5 часов",
  stripRunsOut: (when) => `кончится ${when}`,
  stripFull: "исчерпан",
  stripDays: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
  stripResting: { sleeping: "спит", working: "работает", happy: "доволен", worried: "встревожен" },
  stripStep: (n, subject) => `Шаг ${n}: ${subject}`,
  stripTeam: {
    fresh: (n) => `новых: ${n}`,
    away: (name) => `${name} сейчас не работает`,
    working: "работает сейчас",
    isWorking: (name) => `${name} работает сейчас`,
    worked: (name, ago) => `${name} работал(а) ${ago}`,
    on: (branch) => `ветка работы ${branch}`,
    more: (n) => `и ещё ${n} в этом проекте`,
    wrote: (name) => `${name} написал(а)`,
    aiWrote: (name) => `ИИ пользователя ${name} написал`
  },
  hubCrew: (n) => `агентов: ${n}`,
  minutes: (n) => `${n} мин`,
  seconds: (n) => `${n} с`,
  hours: (n) => `${n} ч`,
  quiet: (span) => `молчит ${span}`,
  longTool: (_tool, span) => `один шаг идёт ${span}`,
  stopWho: (name) => `Остановить ${name}`,
  messageTo: (name) => `Написать ${name}, Enter отправит`,
  you: "Вы",
  answering: (name) => `${name} отвечает…`,
  followUp: (name) => `Задать ${name} ещё вопрос, Enter отправит`,
  launched: (name) => `${name} взялся за дело`,
  denied: (reason) => `Отклонено: ${reason}`,
  decimal: ",",
  message: "Сообщение",
  send: "отправить",
  stop: "Остановить",
  delivered: "Сообщение доставлено",
  stopAsked: "Остановка запрошена",
  stopRefused: "Остановка отклонена",
  stopFailed: "Не удалось остановить агента",
  allDone: "Всё готово",
  liveCount: (n) => `работают: ${n}`,
  endedCount: (n) => `завершено: ${n}`,
  plannedCount: (n) => `в плане: ${n}`,
  notDelivered: (reason) => `Не доставлено: ${reason}`,
  chats: {
    title: "Другие чаты",
    waitingTitle: "Ждут тебя",
    waiting: (span) => span ? `ждёт ${span}` : "ждёт",
    states: { working: "работает", idle: "свободен" },
    untitled: "Новый чат",
    more: (n) => `+${n} ещё`,
    agentsTitle: "Агенты в других чатах",
    emptyHere: "В этом чате агентов нет",
    hubWaits: (n) => `чатов ждёт: ${n}`,
    hubWorks: (n) => `чатов в работе: ${n}`
  },
  crab: {
    moods: { sleeping: "спит", working: "работает", happy: "доволен", worried: "волнуется" },
    level: (n) => `Ур ${n}`
  }
};

const VOWELS = "aeıioöuü";
const HARMONY = { a: "ı", ı: "ı", e: "i", i: "i", o: "u", u: "u", ö: "ü", ü: "ü" };
const BACK = "aıou";
const lastVowel = (lower) => [...lower].reverse().find((ch) => VOWELS.includes(ch)) ?? "i";
const suffixed = (name, pick) => {
  const lower = name.toLocaleLowerCase("tr");
  const buffer = VOWELS.includes(lower.at(-1) ?? "") ? "y" : "";
  return `${name}'${buffer}${pick(lastVowel(lower))}`;
};
const accusative = (name) => suffixed(name, (vowel) => HARMONY[vowel] ?? "i");
const dative = (name) => suffixed(name, (vowel) => BACK.includes(vowel) ? "a" : "e");
const tr = {
  pane: "Ajanlar",
  command: "Ajanlar panelini aç/kapat: çalışan, biten ve planlı yardımcı ajanlar; ilerleme, maliyet, zaman çizelgesi, sessiz ajan uyarısı; mesaj, durdur ve yeni görev",
  cost: "Maliyet",
  tokens: "Token",
  time: "Süre",
  collapse: "Daralt",
  expand: "Genişlet",
  running: "Çalışıyor",
  finished: "Bitti",
  planned: "Planlı",
  emptyTitle: "Henüz ajan yok",
  paneFailed: "Panel çizilemedi, düz liste gösteriliyor.",
  moreAgents: (n) => `+${n} ajan daha`,
  empty: "Bir görev ver, bir yengeç işe koyulsun: durumu, ilerlemesi ve maliyeti burada canlı görünür.",
  round: "tur",
  failed: "hata",
  aborted: "durduruldu",
  tokensWord: "token",
  agentsCount: "ajan",
  isRunning: "çalışıyor",
  isFinished: "bitti",
  isPlanned: "planlı",
  opened: "Ajanlar paneli açıldı.",
  closed: "Ajanlar paneli kapandı.",
  done: "Bitti",
  plan: "Plan",
  design: "Tasarım",
  tasks: "Görevler",
  review: "Gözden geçirme",
  agents: "Ajanlar",
  busy: "çalışıyor",
  total: "toplam",
  completed: "tamamlandı",
  starting: "başlıyor",
  mainName: "Ana oturum",
  mainType: "bu sohbet",
  mainTask: "Bu sohbetteki iş",
  dismiss: "Kapat",
  brief: "Görev",
  history: "İş geçmişi",
  context: "hafıza",
  limit: "5 saatlik hak",
  limitTile: "5 saatlik haktan",
  kinds: { read: "okuma", edit: "düzenleme", run: "komut", agent: "ajan", other: "diğer" },
  efforts: { low: "az düşünme", medium: "orta düşünme", high: "derin düşünme", xhigh: "çok derin düşünme", max: "en derin düşünme" },
  cheerFailed: "(×_×) olmadı",
  show: "Göster",
  hide: "Gizle",
  details: "Detay",
  current: "Şu an",
  thinking: "Düşünüyor",
  lastStep: "Son adım",
  doing: { read: "Okuyor", edit: "Düzenliyor", run: "Komut çalıştırıyor", agent: "Ajanla çalışıyor", other: "Araç kullanıyor" },
  files: "Dokunduğu dosyalar",
  moreFiles: (n) => `+${n} dosya daha`,
  showAll: "Tamamını göster",
  showLess: "Kısalt",
  ago: (span) => `${span} önce`,
  timeline: "Zaman çizelgesi",
  now: "şimdi",
  look: "Bak",
  failedNow: "hata verdi",
  newTask: "Yeni görev",
  agentLabel: "Ajan",
  taskLabel: "Görev",
  taskHint: "İşi anlat, Enter başlatır",
  start: "başlat",
  cancel: "Vazgeç",
  noTypes: "Henüz bilinen ajan türü yok.",
  noDescription: "Açıklama yok.",
  spawnFailed: "Ajan başlatılamadı",
  builtins: { "general-purpose": "Araştırma, arama ve çok adımlı iş", Explore: "Kodu hızlıca tarar, hiçbir şeyi değiştirmez", Plan: "İşin nasıl yapılacağını planlar" },
  sources: { "built-in": "yerleşik", plugin: "eklenti", project: "proje", user: "kullanıcı" },
  shareOf: (share) => `5 saatlik kullanım hakkının ≈%${share} kadarı`,
  earlier: (n) => `${n} önceki adım gizli`,
  logOpen: (n) => `Tüm adımları göster (${n})`,
  logClose: "Kaydı kapat",
  log: "Adım adım kayıt",
  because: "Neden",
  after: (list) => `${list} sonrası`,
  tools: (n) => `${n} adım`,
  errors: (n) => `${n} hata`,
  crew: (n) => `${n} ajan`,
  stripCost: "maliyet",
  stripTokens: "token",
  stripTime: "ajan süresi",
  stripLast: (cost) => `son tur ${cost}`,
  stripTurns: (n) => `${n} tur`,
  stripPerTurn: (span) => `tur başına ${span}`,
  stripDoing: { read: "okuyor", edit: "yazıyor", run: "komut", agent: "ajan yönetiyor", other: "düşünüyor" },
  rowDoing: { read: "okuyor", search: "arıyor", edit: "yazıyor", run: "komut çalıştırıyor", test: "kontrol ediyor", save: "sürüm kaydediyor", web: "internette", message: "haber gönderiyor", agent: "ajan yönetiyor", wait: "bekliyor", other: "düşünüyor" },
  rowStep: (done, total) => `adım ${done}/${total}`,
  rowPlan: (at, of, subject) => `planın ${at}/${of}. adımı: ${subject}`,
  rowEnded: { done: "işini bitirdi", failed: "işi yarıda kaldı" },
  stripPlan: "plan",
  stripPlanDone: "tamam",
  stripWeek: "hafta",
  stripFive: "5 saat",
  stripRunsOut: (when) => `${when} biter`,
  stripFull: "doldu",
  stripDays: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
  stripResting: { sleeping: "uyuyor", working: "çalışıyor", happy: "keyifli", worried: "tedirgin" },
  stripStep: (n, subject) => `${n}. adım: ${subject}`,
  stripTeam: {
    fresh: (n) => `${n} yeni`,
    away: (name) => `${name} şu an çalışmıyor`,
    working: "şimdi çalışıyor",
    isWorking: (name) => `${name} şimdi çalışıyor`,
    worked: (name, ago) => `${name} ${ago} çalıştı`,
    on: (branch) => `çalışma dalı ${branch}`,
    more: (n) => `bu projede ${n} kişi daha`,
    wrote: (name) => `${name} yazdı`,
    aiWrote: (name) => `${name} adlı kişinin yapay zekâsı yazdı`
  },
  hubCrew: (n) => `${n} ajan`,
  pct: (n) => `%${n}`,
  minutes: (n) => `${n} dk`,
  seconds: (n) => `${n} sn`,
  hours: (n) => `${n} sa`,
  quiet: (span) => `sessiz ${span}`,
  longTool: (_tool, span) => `tek adım ${span} sürüyor`,
  stopWho: (name) => `${accusative(name)} durdur`,
  messageTo: (name) => `${dative(name)} yaz, Enter gönderir`,
  you: "Sen",
  answering: (name) => `${name} yanıtlıyor…`,
  followUp: (name) => `${dative(name)} devam sorusu sor, Enter gönderir`,
  launched: (name) => `${name} işe koyuldu`,
  denied: (reason) => `Reddedildi: ${reason}`,
  decimal: ",",
  message: "Mesaj",
  send: "gönder",
  stop: "Durdur",
  delivered: "Mesaj iletildi",
  stopAsked: "Durdurma istendi",
  stopRefused: "Durdurma reddedildi",
  stopFailed: "Bu ajan durdurulamadı",
  allDone: "Hepsi bitti",
  liveCount: (n) => `${n} çalışıyor`,
  endedCount: (n) => `${n} bitti`,
  plannedCount: (n) => `${n} planlı`,
  notDelivered: (reason) => `İletilemedi: ${reason}`,
  chats: {
    title: "Diğer sohbetler",
    waitingTitle: "Seni bekliyor",
    waiting: (span) => span ? `${span} bekliyor` : "bekliyor",
    states: { working: "çalışıyor", idle: "boşta" },
    untitled: "Yeni sohbet",
    more: (n) => `+${n} daha`,
    agentsTitle: "Diğer sohbetlerdeki ajanlar",
    emptyHere: "Bu sohbette ajan yok",
    hubWaits: (n) => `${n} sohbet bekliyor`,
    hubWorks: (n) => `${n} sohbet çalışıyor`
  },
  crab: {
    moods: { sleeping: "uyuyor", working: "çalışıyor", happy: "mutlu", worried: "endişeli" },
    level: (n) => `Sv ${n}`
  }
};

const STRINGS = { tr, en, ru };
let lang = "en";
const t = () => STRINGS[lang];
const setLang$3 = (next) => {
  lang = next;
  setLang$4(next);
};
const langOf$3 = (value) => {
  if (typeof value !== "string" || !value.trim())
    return null;
  if (/^(tr|turk|türk)/i.test(value.trim()))
    return "tr";
  if (/^(ru|russian|рус)/i.test(value.trim()))
    return "ru";
  return "en";
};

const KILO = 1000;
const MEGA = 1e6;
const COST_WIDE = 10;
const SECOND$7 = 1000;
const MINUTE_S = 60;
const HOUR_S = 3600;
const EM_NARROW = 0.3;
const EM_WIDE = 0.72;
const EM_BODY = 0.56;
const EM_FULL = 1;
const WIDE$2 = /[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF01-\uFF60\uFFE0-\uFFE6\u{1F300}-\u{1FAFF}\u{20000}-\u{3FFFD}]/u;
const xml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
const clip$4 = (s, max) => s.length > max ? s.slice(0, Math.max(1, max - 1)) + "…" : s;
const charEm$2 = (ch) => {
  if (WIDE$2.test(ch))
    return EM_FULL;
  if (/[\s.,:;'|!il1ıİ()[\]]/.test(ch))
    return EM_NARROW;
  if (/[A-ZÇĞÖŞÜА-ЯЁmwшщжюМШЩЖЮ@%]/.test(ch))
    return EM_WIDE;
  return EM_BODY;
};
const textWidth = (s, size) => [...s].reduce((w, ch) => w + charEm$2(ch) * size, 0);
const fitText = (s, size, maxW) => {
  if (textWidth(s, size) <= maxW)
    return s;
  let out = "";
  for (const ch of s) {
    if (textWidth(out + ch + "…", size) > maxW)
      break;
    out += ch;
  }
  return out + "…";
};
const fitStart$2 = (s, size, maxW) => {
  if (textWidth(s, size) <= maxW)
    return s;
  const chars = [...s];
  while (chars.length && textWidth("…" + chars.join(""), size) > maxW)
    chars.shift();
  return chars.length ? "…" + chars.join("") : "";
};
const MONO_EM$4 = 0.62;
const monoWidth = (s, size) => [...s].length * MONO_EM$4 * size;
const fitMono = (s, opts) => {
  const room = Math.floor(opts.maxW / (MONO_EM$4 * opts.size));
  const chars = [...s];
  if (chars.length <= room)
    return s;
  if (room < 2)
    return "";
  return opts.isFromStart ? "…" + chars.slice(-(room - 1)).join("") : chars.slice(0, room - 1).join("") + "…";
};
const fixed = (n, digits) => n.toFixed(digits).replace(".", t().decimal);
const fmtTokens = (n) => {
  if (n >= MEGA)
    return `${fixed(n / MEGA, 1)}M`;
  if (n >= KILO)
    return `${Math.round(n / KILO)}k`;
  return `${Math.round(n)}`;
};
const fmtCost = (usd) => `$${usd < COST_WIDE ? fixed(usd, 2) : fixed(usd, 1)}`;
const fmtTime = (ms) => {
  const s = Math.max(0, Math.round(ms / SECOND$7));
  const h = Math.floor(s / HOUR_S);
  const m = Math.floor(s % HOUR_S / MINUTE_S);
  const ss = String(s % MINUTE_S).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};
const modelName = (id) => {
  const m = /(fable|mythos|opus|sonnet|haiku)-(\d+)(?:-(\d{1,2})(?!\d))?/i.exec(id);
  const [, family = "", major = "", minor] = m ?? [];
  if (!family)
    return id.replace(/^claude-/, "").replace(/\[.*\]$/, "") || "—";
  return `${family.charAt(0).toUpperCase()}${family.slice(1).toLowerCase()} ${major}${minor ? "." + minor : ""}`;
};
const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const PATH_DEPTH = 3;
const shortPath = (path, depth = PATH_DEPTH) => {
  const parts = path.split("/").filter(Boolean);
  const tail = parts.slice(-depth).join("/");
  return parts.length > depth ? `…/${tail}` : path;
};

const DEFAULT_TYPE = "general-purpose";
const BUILTIN_TYPES = [
  { name: DEFAULT_TYPE, description: "Research, search and multi-step work", source: "built-in" },
  { name: "Explore", description: "Fast, read-only code search", source: "built-in" },
  { name: "Plan", description: "Drafts an implementation plan", source: "built-in" }
];
const chosenOf = (types, draft) => types.find((type) => type.name === draft?.type) ?? types[0];
const describe = (type) => t().builtins[type.name] ?? (type.description || t().noDescription);
const sourceWord = (source) => t().sources[source] ?? source;

const LEVELS$1 = [10, 50, 200, 1000];
const restingCrab = (turns) => ({ mood: "sleeping", turns, endedAt: 0 });
const levelOf = (turns) => 1 + LEVELS$1.filter((threshold) => turns >= threshold).length;

const BARE = ["onCompact", "onDone", "onTimeline", "onChats", "onNewTask", "onCancelTask"];
const ONE = ["onToggle", "onLook", "onBrief", "onStop", "onLog", "onPickType", "onStartTask"];
const SEND = "onSend";
function pageHandlers(act) {
  const bare = Object.fromEntries(BARE.map((name) => [name, () => act(name)]));
  const one = Object.fromEntries(ONE.map((name) => [name, (arg) => act(name, arg)]));
  return { ...bare, ...one, onSend: (id, text) => act(SEND, JSON.stringify([id, text])) };
}

const SHELLS = ["#D97757", "#4FA3C7", "#6BB26F", "#B07CC6", "#E07A9A", "#7C93B8", "#4DB6A0", "#B8977A"];
const EYES = ["dot", "tall", "wide", "wink"];
const NAMES = ["Pip", "Mako", "Nori", "Kiko", "Sol", "Fenn", "Coral", "Rio", "Zuzu", "Moss", "Dune", "Juno", "Otto", "Lumi", "Skip", "Nemo"];
const CLAY = SHELLS[0] ?? "#D97757";
const hashOf = (id) => [...id].reduce((sum, ch) => sum * 31 + ch.charCodeAt(0) >>> 0, 7);
const lookAt = (slot) => ({
  shell: SHELLS[slot % SHELLS.length] ?? CLAY,
  eyes: EYES[Math.floor(slot / SHELLS.length) % EYES.length] ?? "dot",
  name: NAMES[slot % NAMES.length] ?? "Pip"
});
const lookOf$1 = (a) => {
  const look = lookAt(a.look ?? hashOf(a.id));
  return a.isMain === true ? { ...look, name: t().mainName } : look;
};

const PRICES_5 = {
  "fable-5-2": [8, 40, 0.2, 16],
  "mythos-5-2": [8, 40, 0.2, 16],
  "fable-5-1": [10, 50, 0.25, 20],
  "mythos-5-1": [10, 50, 0.25, 20],
  "fable-5": [10, 50, 1, 20],
  "mythos-5": [10, 50, 1, 20],
  "opus-5-5": [4, 20, 0.2, 8],
  "opus-5": [5, 25, 0.5, 10],
  "sonnet-5-5": [2, 10, 0.1, 4],
  "sonnet-5": [2, 10, 0.2, 4],
  "haiku-5-5": [0.1, 0.5, 0.01, 0.2]
};
const GEN_5 = /(fable|mythos|opus|sonnet|haiku)-((?:[5-9]|[1-9]\d)(?:-\d{1,2})?)(?!\d)/;
const EARLIER = [
  [/opus-4(?:-[01])?(?:$|[^-\d]|-20\d{6})/, [15, 75, 1.5, 30]],
  ["opus-4", [5, 25, 0.5, 10]],
  ["sonnet", [3, 15, 0.3, 6]],
  ["3-5-haiku", [0.8, 4, 0.08, 1.6]],
  ["haiku-3-5", [0.8, 4, 0.08, 1.6]],
  ["haiku", [1, 5, 0.1, 2]]
];
const LONG_PROMPT = 1e5;
const LONG_PRICES = { "haiku-5-5": [0.5, 2.5, 0.05, 1] };
const priceOf = (model, prompt) => {
  const id = model.toLowerCase().replace(/[\s.]+/g, "-");
  const gen5 = GEN_5.exec(id);
  if (gen5) {
    const key = `${gen5[1]}-${gen5[2]}`;
    return (prompt > LONG_PROMPT ? LONG_PRICES[key] : undefined) ?? PRICES_5[key] ?? null;
  }
  return EARLIER.find(([family]) => typeof family === "string" ? id.includes(family) : family.test(id))?.[1] ?? null;
};
const isPriced = (model) => priceOf(model, 0) !== null;
const costText$1 = (a) => isPriced(a.model) ? `≈${fmtCost(a.costUsd)}` : "";

const countTasks = (list) => ({
  done: list.filter((task) => task.status === "completed").length,
  active: list.filter((task) => task.status === "in_progress").length,
  total: list.length
});

const isRunning = (a) => a.status === "running";
const elapsed = (a, at) => (a.endedAt ?? Math.max(at, a.startedAt)) - a.startedAt;
const ctxOf = (a) => a.contextMax ? Math.min(100, Math.round(a.contextTokens / a.contextMax * 100)) : 0;
const totals = (list, at) => {
  if (!list.length)
    return { cost: 0, tokens: 0, time: 0 };
  const start = Math.min(...list.map((a) => a.startedAt));
  const end = Math.max(...list.map((a) => a.endedAt ?? Math.max(at, a.startedAt)));
  return {
    cost: list.reduce((sum, a) => sum + a.costUsd, 0),
    tokens: list.reduce((sum, a) => sum + a.tokens, 0),
    time: end - start
  };
};

const plannedOf = (f, list) => {
  if (!f || f.isFinished)
    return [];
  const started = new Set(list.map((a) => norm(a.description)));
  return (f.tasks ?? []).map((task, i) => ({ ...task, n: i + 1 })).filter((task) => !started.has(norm(task.title)));
};

const SECOND$6 = 1000;
const MINUTE$4 = 60 * SECOND$6;
const HOUR$3 = 60 * MINUTE$4;
const QUIET_MS = 2 * MINUTE$4;
const LONG_TOOL_MS = 15 * MINUTE$4;
const FAILURE_FRESH_MS = 10 * MINUTE$4;
const roughSpan = (ms) => {
  const s = t();
  if (ms < MINUTE$4)
    return s.seconds(Math.floor(ms / SECOND$6));
  if (ms < HOUR$3)
    return s.minutes(Math.floor(ms / MINUTE$4));
  return s.hours(Math.floor(ms / HOUR$3));
};
function stuckOf(a, at) {
  if (a.status !== "running" || a.isMain === true)
    return null;
  const open = (a.history ?? []).find((e) => e.endAt === undefined);
  if (open)
    return at - open.at >= LONG_TOOL_MS ? { reason: t().longTool(open.tool, roughSpan(at - open.at)), since: open.at } : null;
  if (a.stepAt !== undefined)
    return at - a.stepAt >= LONG_TOOL_MS ? { reason: t().quiet(roughSpan(at - a.stepAt)), since: a.stepAt } : null;
  const heard = Math.max(a.heardAt ?? 0, a.startedAt);
  return at - heard >= QUIET_MS ? { reason: t().quiet(roughSpan(at - heard)), since: heard } : null;
}
const attention = (a, reason, role) => ({
  agentId: a.id,
  name: lookOf$1(a).name,
  title: a.description || a.type,
  reason,
  role
});
const isFreshFailure = (a, at) => a.status === "failed" && a.endReason !== "aborted" && a.endedAt !== undefined && at - a.endedAt < FAILURE_FRESH_MS;
function attentionOf(list, at) {
  const stuck = list.map((a) => ({ a, why: stuckOf(a, at) })).filter((x) => x.why !== null).sort((x, y) => x.why.since - y.why.since)[0];
  if (stuck)
    return attention(stuck.a, stuck.why.reason, "warn");
  const failed = list.filter((a) => isFreshFailure(a, at)).sort((x, y) => (y.endedAt ?? 0) - (x.endedAt ?? 0))[0];
  return failed ? attention(failed, t().failedNow, "danger") : null;
}

const NEAR_DONE = 0.99;
const PERCENT$5 = 100;
const partialOf = (a) => {
  if (a.status !== "running")
    return null;
  if (a.stepTotal)
    return Math.min(1, (a.stepDone ?? 0) / a.stepTotal);
  const own = countTasks(a.todos ?? []);
  return own.total ? own.done / own.total : null;
};
const creditOf$1 = (list) => {
  const parts = list.map(partialOf).filter((p) => p !== null && p > 0);
  return { sum: parts.reduce((sum, p) => sum + p, 0), isEstimate: parts.length > 0 };
};
const NO_CREDIT = { sum: 0, isEstimate: false };
const ratioOf = ({ done, credit, total, isFinished }) => {
  if (isFinished)
    return 1;
  if (!total)
    return null;
  const ratio = Math.min(NEAR_DONE, (done + credit.sum) / total);
  return ratio > 0 ? ratio : null;
};
const jobAgents = (input) => {
  const { job } = input;
  if (!job || job.isHidden)
    return [];
  return input.agents.filter((a) => job.agentIds.includes(a.id));
};
const agentsTitle = (list) => {
  const first = list[0];
  const name = first ? first.description || first.type : t().agents;
  return list.length > 1 ? `${name} +${list.length - 1}` : name;
};
const reportLabel = (f, running) => {
  const s = t();
  if (f.isFinished)
    return s.done;
  if (f.phase === "plan")
    return s.plan;
  if (f.phase === "design")
    return s.design;
  const word = f.phase === "review" ? s.review : s.tasks;
  if (f.total)
    return `${word} ${f.done}/${f.total}`;
  return running ? `${word} · ${running} ${s.busy}` : word;
};
function reportView(f, list, input) {
  const running = list.filter((a) => a.status === "running");
  const credit = f.total ? creditOf$1(running) : NO_CREDIT;
  const handed = new Set(list.map((a) => norm(a.description))).size;
  const launched = f.total ? Math.min(f.total, Math.max(f.done + running.length, handed)) / f.total : 0;
  const done = f.isFinished ? f.total : Math.min(f.done, f.total);
  return {
    source: "report",
    title: f.title,
    label: reportLabel(f, running.length),
    ratio: ratioOf({ done: f.done, credit, total: f.total, isFinished: f.isFinished }),
    isEstimate: credit.isEstimate && !f.isFinished,
    launched: f.isFinished ? 1 : launched,
    units: f.total,
    done,
    active: f.isFinished ? 0 : Math.max(0, Math.round(launched * f.total) - done),
    isFinished: f.isFinished,
    isWorking: running.length > 0,
    crew: input.agents.length + plannedOf(f, input.agents).length,
    failed: 0
  };
}
function tasksView(tasks, list) {
  const count = countTasks(tasks);
  const running = list.filter((a) => a.status === "running").length;
  const isFinished = count.done === count.total && running === 0;
  return {
    source: "tasks",
    title: agentsTitle(list),
    label: isFinished ? t().done : `${t().tasks} ${count.done}/${count.total}`,
    ratio: ratioOf({ done: count.done, credit: NO_CREDIT, total: count.total, isFinished }),
    isEstimate: false,
    launched: isFinished ? 1 : (count.done + count.active) / count.total,
    units: count.total,
    done: count.done,
    active: isFinished ? 0 : count.active,
    isFinished,
    isWorking: running > 0,
    crew: list.length,
    failed: 0
  };
}
function agentsView(list) {
  const s = t();
  const running = list.filter((a) => a.status === "running");
  const ended = list.length - running.length;
  const failed = list.filter((a) => a.status === "failed").length;
  const isFinished = running.length === 0;
  const credit = creditOf$1(running);
  const done = failed ? `${s.done} · ${s.errors(failed)}` : s.done;
  return {
    source: "agents",
    title: agentsTitle(list),
    label: isFinished ? done : `${s.agents} ${ended}/${list.length}`,
    ratio: ratioOf({ done: ended, credit, total: list.length, isFinished }),
    isEstimate: credit.isEstimate && !isFinished,
    launched: 1,
    units: list.length,
    done: ended,
    active: running.length,
    isFinished,
    isWorking: !isFinished,
    crew: list.length,
    failed
  };
}
function deriveJob(input) {
  const list = jobAgents(input);
  if (input.flow)
    return reportView(input.flow, list, input);
  if (!list.length)
    return null;
  return input.tasks.length ? tasksView(input.tasks, list) : agentsView(list);
}
const percentText$1 = (view) => {
  if (view.ratio === null)
    return "—";
  const n = Math.max(1, Math.round(view.ratio * PERCENT$5));
  return `${view.isEstimate ? "~" : ""}${t().pct(n)}`;
};

const MIN_POINTS = 0.5;
const MIN_USD = 0.05;
const TENTH = 0.1;
const ONE_DECIMAL_BELOW = 10;
const rateBetween = (track) => {
  const points = track.percent - track.basePercent;
  const usd = track.usd - track.baseUsd;
  return points >= MIN_POINTS && usd >= MIN_USD ? points / usd : null;
};
const rateOf = (track) => track ? rateBetween(track) ?? track.carriedRate ?? null : null;
const shareOf = (costUsd, track) => {
  const rate = rateOf(track);
  return rate === null ? null : costUsd * rate;
};
const shareNumber = (points) => {
  if (points < TENTH)
    return `<${fixed(TENTH, 1)}`;
  return points < ONE_DECIMAL_BELOW ? fixed(points, 1) : String(Math.round(points));
};

const isMain = (a) => a.isMain === true;

const crewView = (list) => deriveJob({ flow: null, agents: list, job: { agentIds: list.map((a) => a.id), startedAt: 0, isSealed: true, isHidden: false }, tasks: [] });
const homeOf = (crab, running) => ({
  mood: crab.mood,
  level: t().crab.level(levelOf(crab.turns)),
  isMoving: running.length === 0
});
const DRAWN_STEP_MS = 1e4;
const lastEventOf = (a) => Math.max(a.startedAt, a.endedAt ?? 0, ...(a.history ?? []).map((e) => Math.max(e.at, e.endAt ?? 0)));
const drawnClockOf = (list, at) => Math.max(Math.floor(at / DRAWN_STEP_MS) * DRAWN_STEP_MS, ...list.map(lastEventOf));
function paneDataOf(state) {
  const { list } = state;
  const at = Math.max(state.now, ...list.map((a) => a.startedAt), 0);
  const view = deriveJob({ flow: state.flow, agents: list, job: state.job, tasks: state.tasks }) ?? crewView(list);
  const ended = (a) => a.endedAt ?? a.startedAt;
  const live = list.filter(isRunning).reverse();
  const running = [...live.filter(isMain), ...live.filter((a) => !isMain(a))];
  return {
    list,
    running,
    finished: list.filter((a) => !isRunning(a)).sort((a, b) => ended(b) - ended(a)),
    planned: plannedOf(state.flow, list),
    sum: totals(list, at),
    view,
    at,
    drawnAt: drawnClockOf(list, at),
    panel: state.panel,
    limit: state.limit,
    attention: attentionOf(list, at),
    types: state.types,
    home: homeOf(state.crab, running),
    chats: state.chats
  };
}
const summaryOf = (sum) => `≈${fmtCost(sum.cost)} · ${fmtTokens(sum.tokens)} ${t().tokensWord} · ${fmtTime(sum.time)}`;
const toneOf$1 = (d) => {
  if (d.running.length)
    return "run";
  if (!d.list.length)
    return "idle";
  return d.view && d.view.failed > 0 ? "warn" : "ok";
};
const countsOf$3 = (d) => {
  const s = t();
  const ended = d.list.length - d.running.length;
  return [d.running.length && s.liveCount(d.running.length), ended && s.endedCount(ended), d.planned.length && s.plannedCount(d.planned.length)].filter(Boolean).join(" · ");
};
function headerOf(d) {
  const s = t();
  const share = shareOf(d.sum.cost, d.limit);
  const view = d.view;
  return {
    eyebrow: s.pane,
    counts: countsOf$3(d),
    headline: view?.title || s.crew(d.list.length),
    percent: view ? percentText$1(view) : "—",
    tone: toneOf$1(d),
    meter: view,
    stats: [
      { label: s.cost, value: `≈${fmtCost(d.sum.cost)}` },
      { label: s.tokens, value: fmtTokens(d.sum.tokens) },
      { label: s.time, value: fmtTime(d.sum.time) },
      ...share === null ? [] : [{ label: s.limitTile, value: `≈${s.pct(shareNumber(share))}` }]
    ],
    home: d.home
  };
}
const drawnHeaderOf = (d) => headerOf({ ...d, sum: totals(d.list, d.drawnAt) });
const totalsLineOf = (data) => data.stats.map((stat) => `${stat.label} ${stat.value}`).join(" · ");

const waitingOf = (chats) => chats.filter((chat) => chat.state === "waiting");
const crewedOf = (chats) => chats.filter((chat) => (chat.agents?.length ?? 0) > 0);
const quietOf = (chats) => chats.filter((chat) => chat.state !== "waiting");
const CHATS_MAX = 8;
const CHAT_AGENTS_MAX = 6;
function listedChats(chats) {
  const listed = chats.slice(0, CHATS_MAX).map((chat) => chat.agents && chat.agents.length > CHAT_AGENTS_MAX ? { ...chat, agents: chat.agents.slice(0, CHAT_AGENTS_MAX) } : chat);
  return { chats: listed, more: chats.length - listed.length };
}

const TIER_COLOR = {
  fable: "#7F77DD",
  heavy: "#D85A30",
  careful: "#BA7517",
  medium: "#378ADD",
  light: "#1D9E75",
  other: "#888780"
};
const TIER_MODEL = {
  fable: "Fable · high",
  heavy: "Opus · xhigh",
  careful: "Opus · high",
  medium: "Opus · medium",
  light: "Opus · low"
};
const EFFORT_TIER = {
  max: "heavy",
  xhigh: "heavy",
  high: "careful",
  medium: "medium",
  low: "light"
};
const colorOf$1 = (tier) => TIER_COLOR[tier] ?? "#888780";
const savvyTierOf = (type) => {
  const bare = type.replace(/^[^:]*:/, "");
  const tier = bare.replace(/^savvy-/, "").toLowerCase();
  return bare.startsWith("savvy-") && Object.hasOwn(TIER_MODEL, tier) ? tier : null;
};
const effortTierOf = (effort = "") => Object.hasOwn(EFFORT_TIER, effort) ? EFFORT_TIER[effort] ?? null : null;
const tierOf = (a) => savvyTierOf(a.type) ?? effortTierOf(a.effort) ?? "other";
const costumeOf = (a) => savvyTierOf(a.type) ?? (a.type === "Explore" ? "explore" : tierOf(a));
const effortWord = (effort = "") => t().efforts[effort] ?? effort;
const tierWordOf = (a) => savvyTierOf(a.type) ?? (effortTierOf(a.effort) ? effortWord(a.effort) : a.type);
const plannedTierOf = (tier) => Object.hasOwn(TIER_MODEL, tier) ? tier : "other";

const INK = "#1F1E1D";
const stamp = (f, { x, y, rows, map, cls }) => rows.forEach((row, dy) => [...row].forEach((ch, dx) => map[ch] && f([x + dx, y + dy, 1, 1], map[ch] ?? "", cls)));
const eyesOf = (f, kind) => {
  const isWide = kind === "wide";
  const isTall = kind === "tall";
  const y = isTall ? 11 : 12;
  const h = isTall ? 3 : 2;
  f([isWide ? 8 : 9, y, 2, h], INK);
  if (kind === "wink")
    f([19, 13, 3, 1], INK);
  else
    f([isWide ? 20 : 19, y, 2, h], INK);
};
const crabBody = (f, arm, look) => {
  const c = look.shell;
  f([7, 10, 16, 12], c);
  f([3, 14, 4, 4], c);
  f([23, 14 + (arm.front ?? 0), 4, 4], c, arm.cls);
  if (arm.face)
    arm.face.forEach((box) => f(box, INK));
  else
    eyesOf(f, look.eyes);
  f([7, 22, 2, 4], c, "la");
  f([17, 22, 2, 4], c, "la");
  f([11, 22, 2, 4], c, "lb");
  f([21, 22, 2, 4], c, "lb");
};
const CRAB_CSS = `<style>
.run .la{animation:st .5s steps(1) infinite}.run .lb{animation:st .5s steps(1) infinite -.25s}
.run .bd{animation:bob .5s steps(1) infinite -.125s}
.run g{transform-box:fill-box}
@keyframes st{50%{transform:translateY(-1px)}}@keyframes bob{50%{transform:translateY(1px)}}
.c-fable.run{animation:float 1s ease-in-out infinite}
.c-fable.run .la,.c-fable.run .lb,.c-fable.run .bd{animation:none}
.c-fable.run .ant{animation:blink 1s steps(1) infinite}
.c-fable.run .star{animation:blink .5s steps(1) infinite -.25s}
@keyframes float{50%{transform:translateY(-2px)}}@keyframes blink{50%{opacity:.15}}
.c-heavy.run .it{animation:scan 1s steps(1) infinite}
.c-heavy.run .gl{animation:blink 1s steps(1) infinite -.5s}
@keyframes scan{25%{transform:translate(-1px,1px)}50%{transform:translate(-2px,2px)}75%{transform:translate(-1px,1px)}}
.c-careful.run .it{transform-origin:100% 100%;animation:twist .5s ease-in-out infinite}
@keyframes twist{50%{transform:rotate(-35deg)}}
.c-medium.run .pan{transform-origin:0 50%;animation:tilt 1s ease-in-out infinite}
.c-medium.run .egg{animation:flip 1s ease-in-out infinite}
@keyframes tilt{20%,40%{transform:rotate(-12deg)}}@keyframes flip{30%{transform:translateY(-5px) scaleY(-1)}60%{transform:translateY(0)}}
.c-light.run .la{animation-duration:.25s}.c-light.run .lb{animation-duration:.25s;animation-delay:-.125s}
.c-light.run .flag{transform-origin:0 50%;animation:wave .25s steps(1) infinite}
@keyframes wave{50%{transform:skewY(-12deg) scaleX(.85)}}
.c-explore.run .it{transform-origin:50% 100%;animation:fence .5s ease-in-out infinite}
@keyframes fence{50%{transform:rotate(25deg)}}
@media (prefers-reduced-motion: reduce){.run,.run g{animation:none!important}}
</style>`;
const COSTUMES = {
  fable: (f, t, look) => {
    crabBody(f, {}, look);
    f([6, 7, 18, 1], "#E6E8EE");
    f([5, 8, 1, 14], "#E6E8EE");
    f([24, 8, 1, 14], "#E6E8EE");
    f([6, 22, 18, 1], "#C9CCD2");
    f([6, 8, 18, 14], "rgba(169,214,245,.32)");
    f([8, 9, 2, 1], "#fff");
    f([8, 10, 1, 2], "#fff");
    f([14, 4, 2, 3], "#C9CCD2");
    f([14, 2, 2, 2], t, "ant");
    f([13, 18, 4, 2], t);
    f([27, 3, 1, 3], "#F5C542", "star");
    f([26, 4, 3, 1], "#F5C542", "star");
  },
  heavy: (f, t, look) => {
    crabBody(f, { front: -4, cls: "it" }, look);
    stamp(f, { x: 6, y: 3, rows: ["......bbbbbb......", "....bbcbbcbbbb....", "...bbbbbbbbbbbb...", "..bcbbcbbcbbcbbb..", ".bbbbbbbbbbbbbbbb.", "dddddddddddddddddd"], map: { b: "#7A4A26", c: "#A0703F", d: "#5A3519" } });
    f([6, 9, 18, 1], t);
    stamp(f, { x: 23, y: 1, rows: [".kkk.", "k...k", "k...k", "k...k", ".kkk."], map: { k: "#3A3A3C" }, cls: "it" });
    f([24, 2, 3, 3], "rgba(169,214,245,.7)", "it");
    f([25, 6, 1, 4], "#7A4A26", "it");
    f([24, 2, 1, 1], "#fff", "gl");
  },
  careful: (f, t, look) => {
    crabBody(f, {}, look);
    stamp(f, { x: 6, y: 4, rows: [".....yyyyyyyy.....", "...yyyyyhhyyyyy...", "..yyyyyyhhyyyyyy..", "..yyyyyyhhyyyyyy..", ".yyyyyyyhhyyyyyyy.", "dddddddddddddddddd"], map: { y: "#F5C542", h: "#FBE08A", d: "#C99A1E" } });
    f([13, 5, 4, 2], t);
    stamp(f, { x: 0, y: 10, rows: [".s.s", "sss.", ".s..", ".s.."], map: { s: "#8E929A" }, cls: "it" });
  },
  medium: (f, t, look) => {
    crabBody(f, { front: -4, cls: "pan" }, look);
    stamp(f, { x: 6, y: 0, rows: ["........lll.......", ".......lllll......", ".wwwwgwwwwwwgwwwww", "wwwwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwwwww", "wwwwwgwwwwwggwwwww", ".wwwwgwwwwwggwwwww", ".dddbbbbbbbbbbbbb.", ".dddbbbbbbbbbbbbb.", ".dddbbbbbbbbbbbbb."], map: { w: "#F4F3EE", l: "#F7F6F2", g: "#D2D1C8", b: t, d: "#B45F43" } });
    f([22, 8, 7, 2], "#4A4A48", "pan");
    f([26, 10, 1, 1], "#4A4A48", "pan");
    f([24, 7, 3, 1], "#F5B731", "egg");
  },
  light: (f, t, look) => {
    crabBody(f, { front: -4 }, look);
    stamp(f, { x: 6, y: 5, rows: ["....rrrrrrrrrr....", "..rrrrrrwwrrrrrr..", ".rrrrrrrwwrrrrrrr.", ".rrrrrrrwwrrrrrrr.", ".rrrrrrrwwrrrrrrr.", ".kkkkkkkkkkkkkkkkr"], map: { r: t, w: "#F8F6F1", k: INK } });
    f([25, 1, 1, 9], "#8E929A");
    stamp(f, { x: 26, y: 1, rows: ["wkwk", "kwkw", "wkwk"], map: { w: "#F8F6F1", k: INK }, cls: "flag" });
  },
  explore: (f, _t, look) => {
    crabBody(f, {}, look);
    stamp(f, { x: 5, y: 3, rows: [".kk..............kk.", ".kkk....kkkk....kkk.", "..kkkkkkkwwkkkkkkk..", "..kkkkkkkkkkkkkkkk..", ".gggggggggggggggggg."], map: { k: "#55514C", w: "#F8F6F1", g: "#F5C542" } });
    f([7, 11, 11, 1], INK);
    f([18, 11, 4, 3], INK);
    f([27, 6, 1, 9], "#C9CCD2", "it");
    f([26, 15, 3, 1], "#7A4A26", "it");
  },
  other: (f, _t, look) => crabBody(f, {}, look),
  mate: (f, _t, look) => {
    crabBody(f, {}, look);
    stamp(f, { x: 7, y: 3, rows: [".......ww.......", "......wwww......", "....bbbbbbbb....", "..bbbbbbbbbbbb..", ".bbbbbbbbbbbbbb.", ".bbbbbbbbbbbbbb.", "rrrrrrrrrrrrrrrr"], map: { w: "#F4F3EE", b: "#3E8E7E", r: "#2E6B5F" } });
  }
};
const FACES$1 = {
  sleeping: [[9, 13, 2, 1], [19, 13, 2, 1]],
  working: undefined,
  happy: [[9, 12, 2, 1], [8, 13, 1, 1], [11, 13, 1, 1], [19, 12, 2, 1], [18, 13, 1, 1], [21, 13, 1, 1]],
  worried: [[9, 13, 2, 2], [19, 13, 2, 2]]
};
const SWEAT = "#7FB6E8";
const HAPPY_CLAW = -4;
const moodBody = (f, look, mood) => {
  crabBody(f, { front: mood === "happy" ? HAPPY_CLAW : undefined, face: FACES$1[mood] }, look);
  if (mood !== "worried")
    return;
  f([4, 8, 1, 1], SWEAT);
  f([3, 9, 3, 2], SWEAT);
};
const CRAB_SCALE = 1.1;
const crab = (x, y, opts) => {
  const groups = new Map([["bd", []]]);
  const f = ([cx, cy, w, h], c, cls = "bd") => {
    if (!groups.has(cls))
      groups.set(cls, []);
    groups.get(cls)?.push(`<rect x="${cx}" y="${cy}" width="${w}" height="${h}" fill="${c}"/>`);
  };
  const look = opts.look ?? lookAt(0);
  const draw = COSTUMES[opts.costume] ?? ((g, _t, l) => crabBody(g, {}, l));
  const mood = opts.mood;
  if (mood)
    moodBody(f, look, mood);
  else
    draw(f, colorOf$1(opts.costume), look);
  const group = (cls) => `<g class="${cls}">${(groups.get(cls) ?? []).join("")}</g>`;
  const props = [...groups.keys()].filter((k) => k !== "bd" && k !== "la" && k !== "lb");
  const body = `<g class="bd">${(groups.get("bd") ?? []).join("")}${props.map(group).join("")}</g>`;
  const walk = opts.isWalking ? " run" : "";
  return `<g transform="translate(${x},${y}) scale(${opts.scale ?? CRAB_SCALE})" opacity="${opts.isDim ? 0.45 : 1}" shape-rendering="crispEdges"><g class="c-${opts.costume}${walk}">${body}${group("la")}${group("lb")}</g></g>`;
};

const FONT$3 = "-apple-system,BlinkMacSystemFont,'SF Pro Text',Inter,system-ui,sans-serif";
const MONO$4 = "ui-monospace,'SF Mono',Menlo,monospace";
const NEUTRALS$3 = {
  t: ["#1C1B19", "#F0EEE8"],
  s: ["#4F4B44", "#C2BEB4"],
  m: ["#706B63", "#8E8A80"],
  k: ["#ECE8DF", "#34332F"],
  card: ["#FFFFFF", "#1F1F1C"],
  chip: ["#F6F4EF", "#171715"]
};
const STROKES = {
  ln: ["#E4E0D6", "#2E2E2A"],
  "i-m": ["#706B63", "#8E8A80"],
  "i-s": ["#4F4B44", "#C2BEB4"],
  rk: ["#ECE8DF", "#34332F"]
};
const ROLES$5 = {
  read: { fg: ["#2464A0", "#7FB6E8"], tint: ["#E7F0F9", "#1E2B37"], line: ["#B9D3EC", "#2F4A63"] },
  edit: { fg: ["#A94A26", "#E58A5F"], tint: ["#FBEDE6", "#38251D"], line: ["#EFC6B4", "#6A3E2D"] },
  plan: { fg: ["#A8337F", "#E07BC0"], tint: ["#FBE9F4", "#351F2E"], line: ["#EDBFDC", "#6B3A5C"] },
  run: { fg: ["#6243C4", "#B19CF3"], tint: ["#F0ECFC", "#29243D"], line: ["#CFC3F3", "#4A3F75"] },
  ok: { fg: ["#1F6E43", "#6FC593"], tint: ["#E4F4EA", "#1B2F25"], line: ["#B5DEC4", "#2F5A42"] },
  warn: { fg: ["#8A6000", "#E9B949"], tint: ["#FBF2D9", "#332D19"], line: ["#EBD48F", "#66552A"] },
  danger: { fg: ["#C0263A", "#F2727F"], tint: ["#FCE8EA", "#3B2023"], line: ["#F1B9C0", "#74343C"] }
};
const rulesOf = (side) => {
  const fills = Object.entries(NEUTRALS$3).map(([cls, pair]) => `.${cls}{fill:${pair[side]}}`);
  const strokes = Object.entries(STROKES).map(([cls, pair]) => `.${cls}{stroke:${pair[side]}}`);
  const roles = Object.entries(ROLES$5).map(([role, c]) => `.f-${role}{fill:${c.fg[side]}}.b-${role}{fill:${c.tint[side]}}.l-${role}{stroke:${c.line[side]}}.i-${role}{stroke:${c.fg[side]}}`);
  return [...fills, ...strokes, ...roles].join("");
};
const TIDEMARK_CSS = `<style>
${rulesOf(0)}
@media (prefers-color-scheme: dark){${rulesOf(1)}}
.live{animation:p 1.8s ease-in-out infinite}@keyframes p{50%{opacity:.35}}
.chev{transition:transform .16s cubic-bezier(.2,.8,.2,1)}svg:hover .chev{transform:translateX(2px)}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
</style>`;
const paneSvg = (W, H, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${TIDEMARK_CSS}${CRAB_CSS}${body}</svg>`;

const CARD = { padX: 14, rx: 10, labelY: 24, firstRowY: 48, rowH: 22, bottom: 14 };
const LABEL$5 = { size: 12, weight: 600 };
const ROW$2 = { size: 13, waitSize: 12, gap: 10 };
const BOLD$4 = 1.06;
const rowSvg$3 = (row, y, W) => {
  const right = W - CARD.padX;
  const waitW = Math.ceil(textWidth(row.wait, ROW$2.waitSize) * BOLD$4);
  const room = right - waitW - ROW$2.gap - CARD.padX;
  const project = fitText(row.project, ROW$2.size * BOLD$4, room);
  const titleRoom = room - textWidth(project, ROW$2.size) * BOLD$4;
  const title = row.title ? fitText(` · ${row.title}`, ROW$2.size, titleRoom) : "";
  const titleSpan = title && title !== "…" ? `<tspan class="s" font-weight="400">${xml(title)}</tspan>` : "";
  return [
    `<text x="${CARD.padX}" y="${y}" font-family="${FONT$3}" font-size="${ROW$2.size}" font-weight="560"><tspan class="t">${xml(project)}</tspan>${titleSpan}</text>`,
    `<text class="f-warn" x="${right}" y="${y}" text-anchor="end" font-family="${FONT$3}" font-size="${ROW$2.waitSize}" font-weight="600">${xml(row.wait)}</text>`
  ].join("");
};
const chatsCardSvg = (W, card) => {
  const lines = card.rows.length + (card.more ? 1 : 0);
  const height = CARD.firstRowY + (lines - 1) * CARD.rowH + CARD.bottom;
  const rows = card.rows.map((row, i) => rowSvg$3(row, CARD.firstRowY + i * CARD.rowH, W));
  const moreY = CARD.firstRowY + card.rows.length * CARD.rowH;
  const more = card.more ? `<text class="m" x="${CARD.padX}" y="${moreY}" font-family="${FONT$3}" font-size="${ROW$2.waitSize}">${xml(card.more)}</text>` : "";
  const body = [
    `<rect class="card ln" x="0.5" y="0.5" width="${W - 1}" height="${height - 1}" rx="${CARD.rx}" stroke-width="1"/>`,
    `<text class="m" x="${CARD.padX}" y="${CARD.labelY}" font-family="${FONT$3}" font-size="${LABEL$5.size}" font-weight="${LABEL$5.weight}">${xml(fitText(card.title, LABEL$5.size * BOLD$4, W - CARD.padX * 2))}</text>`,
    ...rows,
    more
  ];
  const alt = [card.title, ...card.rows.map((row) => [row.project, row.title, row.wait].filter(Boolean).join(" · ")), card.more].filter(Boolean).join(", ");
  return { source: paneSvg(W, height, body.join("")), height, alt };
};
const LIST = { rowH: 24, size: 13, sizeSmall: 12, dot: 3, indent: 13, chipGap: 10 };
const lineSvg = (line, y, W) => {
  const base = y + LIST.rowH / 2 + LIST.size * 0.35;
  const x = line.kind === "agent" ? LIST.indent : LIST.dot * 2 + 7;
  const size = line.kind === "agent" ? LIST.sizeSmall : LIST.size;
  const endW = line.end ? Math.ceil(textWidth(line.end, LIST.sizeSmall)) + LIST.chipGap : 0;
  const room = W - x - endW;
  const lead = fitText(line.lead, size * BOLD$4, room);
  const rest = fitText(` · ${line.text}`, size, room - textWidth(lead, size) * BOLD$4);
  const dot = line.kind === "chat" ? `<circle class="${line.isLive ? "f-edit live" : "m"}" cx="${LIST.dot}" cy="${y + LIST.rowH / 2}" r="${LIST.dot}"/>` : "";
  const end = line.end ? `<text class="m" x="${W}" y="${base}" text-anchor="end" font-family="${FONT$3}" font-size="${LIST.sizeSmall}" font-variant-numeric="tabular-nums">${xml(line.end)}</text>` : "";
  const restSpan = line.text && rest !== "…" ? `<tspan class="m">${xml(rest)}</tspan>` : "";
  return `${dot}<text x="${x}" y="${base}" font-family="${FONT$3}" font-size="${size}"><tspan class="${line.kind === "chat" ? "t" : "s"}" font-weight="560">${xml(lead)}</tspan>${restSpan}</text>${end}`;
};
const chatLinesSvg = (W, lines) => {
  const height = lines.length * LIST.rowH;
  const alt = lines.map((line) => [line.lead, line.text, line.end].filter(Boolean).join(" · ")).join(", ");
  return { source: paneSvg(W, height, lines.map((line, i) => lineSvg(line, i * LIST.rowH, W)).join("")), height, alt };
};

const FILL$5 = /<rect\b[^>]*\bdata-m-fill\b[^>]*>/g;
const DONE$4 = /<path\b[^>]*\bdata-m-done\b[^>]*>/g;
const HAS_DONE$4 = /\bdata-m-done\b/;
const WIDTH$7 = /\swidth="([\d.]+)"/;
const CLASS$4 = /\sclass="([^"]*)"/;
const STYLE$4 = /\sstyle="([^"]*)"/;
const MIN_RATIO_STEP$4 = 0.02;
const RATIO_DIGITS$4 = 3;
const widthOf$4 = (tag) => Number(WIDTH$7.exec(tag)?.[1] ?? 0);
function withClass$4(tag, name, extra = "") {
  const tagged = CLASS$4.test(tag) ? tag.replace(CLASS$4, (_, classes) => ` class="${classes} ${name}"`) : tag.replace(/\s*\/?>$/, ` class="${name}"$&`);
  return tagged.replace(/\s*\/?>$/, `${extra}$&`);
}
function slideFills$4(before, now) {
  const old = before.match(FILL$5) ?? [];
  if (old.length !== (now.match(FILL$5) ?? []).length)
    return now;
  let index = 0;
  return now.replace(FILL$5, (tag) => {
    const was = old[index++];
    const from = was === undefined ? 0 : widthOf$4(was);
    const to = widthOf$4(tag);
    if (from <= 0 || to <= 0 || Math.abs(from - to) / to < MIN_RATIO_STEP$4)
      return tag;
    const slide = `--m-from:${(from / to).toFixed(RATIO_DIGITS$4)}`;
    const styled = STYLE$4.test(tag) ? tag.replace(STYLE$4, (_, rules) => ` style="${slide};${rules}"`) : tag.replace(/\s*\/?>$/, ` style="${slide}"$&`);
    return withClass$4(styled, "m-from");
  });
}
function drawDone$4(before, now) {
  if (HAS_DONE$4.test(before))
    return now;
  return now.replace(DONE$4, (tag) => withClass$4(tag, "m-draw", ' pathLength="1"'));
}
function markChanges$4(before, now) {
  return drawDone$4(before, slideFills$4(before, now));
}

const STAGGER_MS$4 = 45;
const EASE$4 = "cubic-bezier(.2,.8,.2,1)";
const SHEEN$4 = "#A39E93";
const RULES$4 = {
  "m-in": `.m-in{animation:m-in .42s ${EASE$4} both}@keyframes m-in{from{opacity:0;transform:translateY(8px)}}`,
  "m-fade": `.m-fade{animation:m-fade .5s ${EASE$4} both}@keyframes m-fade{from{opacity:0}}`,
  "m-grow": `.m-grow{transform-box:fill-box;transform-origin:left center;animation:m-grow .7s ${EASE$4} both}@keyframes m-grow{from{transform:scaleX(0)}}`,
  "m-px": `.m-px{transform-box:fill-box;transform-origin:center;animation:m-px .34s ${EASE$4} both}@keyframes m-px{from{opacity:0;transform:translateY(-10px) scale(.6)}}`,
  "m-flash": ".m-flash{opacity:0;animation:m-flash 1.6s ease-out both}@keyframes m-flash{from{opacity:.9}to{opacity:0}}",
  "m-from": `.m-from{transform-box:fill-box;transform-origin:left center;animation:m-from .32s ${EASE$4} both}@keyframes m-from{from{transform:scaleX(var(--m-from))}}`,
  "m-draw": `.m-draw{stroke-dasharray:1;animation:m-draw .32s ${EASE$4} .12s both}@keyframes m-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}`,
  "m-breathe": ".m-breathe{animation:m-breathe 1.8s ease-in-out infinite}@keyframes m-breathe{50%{opacity:.4}}",
  "m-ring": ".m-ring{transform-box:fill-box;transform-origin:center;animation:m-ring 1.8s ease-out infinite}@keyframes m-ring{from{opacity:.55;transform:scale(1)}to{opacity:0;transform:scale(2.8)}}",
  "m-wash": `.m-wash{fill:#8E8A80;opacity:0;transition:opacity .12s ${EASE$4}}svg:hover .m-wash{opacity:.12}`,
  "m-tile": `.m-tile{transform-box:fill-box;transform-origin:center;transition:transform .2s ${EASE$4}}svg:hover .m-tile{transform:translateY(-1px) scale(1.06)}`
};
const REDUCED$5 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function motionCss$4(body) {
  const used = Object.keys(RULES$4).filter((name) => new RegExp(`\\b${name}\\b`).test(body));
  return used.length === 0 ? "" : `${used.map((name) => RULES$4[name]).join("")}${REDUCED$5}`;
}
Object.values(RULES$4).join("");
const isEntering$4 = (cue) => cue.phase === "enter";
function entering$4(body, cue, kind = "in") {
  if (!isEntering$4(cue))
    return body;
  return `<g class="m-${kind}" style="animation-delay:${cue.order * STAGGER_MS$4}ms">${body}</g>`;
}
const FLASH$4 = `<rect x="0" y="0" width="100%" height="100%" rx="10" fill="${SHEEN$4}" fill-opacity=".22" class="m-flash"/>`;
const WASH$4 = '<rect x="0" y="0" width="100%" height="100%" rx="10" class="m-wash"/>';

function stableDrawings$4() {
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

const TAG_WIDTH$4 = /^[\s\S]*?<svg\b[^>]*?\swidth="([\d.]+)"/;
const SVG$4 = /^([\s\S]*?<svg\b[^>]*>)([\s\S]*)(<\/svg>\s*)$/;
const SCHEME$5 = "<style>:root{color-scheme:light dark}</style>";
const SAYS_SCHEME$4 = /(^|[^-\w])color-scheme\s*:/;
const PASS_MS$4 = 120;
const MAX_ORDER$4 = 12;
const LIVE_MS$4 = 30000;
function animate$4(source, spec) {
  const moved = spec.cue.phase === "change" && spec.before !== undefined ? markChanges$4(spec.before, source) : source;
  const parts = SVG$4.exec(moved);
  if (parts === null)
    return source;
  const [, open, inner = "", close] = parts;
  const scheme = SAYS_SCHEME$4.test(inner) ? "" : SCHEME$5;
  const lit = `${spec.isRow === true ? WASH$4 : ""}${spec.cue.phase === "change" && spec.isLive !== true ? FLASH$4 : ""}${inner}`;
  const body = entering$4(lit, spec.cue);
  const css = motionCss$4(body);
  return `${open}${scheme}${css === "" ? "" : `<style>${css}</style>`}${body}${close}`;
}
function paneMotion$4() {
  const drawings = stableDrawings$4();
  const shown = new Map;
  const pass = { at: Number.NEGATIVE_INFINITY, entered: 0 };
  const begin = () => {
    const now = Date.now();
    if (now - pass.at > PASS_MS$4)
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
      const now = { shows: opts.shows === undefined ? what : JSON.stringify(opts.shows), width: String(pic.width ?? TAG_WIDTH$4.exec(pic.source)?.[1]), source: pic.source };
      const source = drawings.draw(key, what, (built) => {
        const order = built === "enter" ? Math.min(MAX_ORDER$4, pass.entered++) : 0;
        const before = shown.get(key);
        const isQuiet = before !== undefined && (before.shows === now.shows || before.width !== now.width);
        const phase = built === "change" && isQuiet ? "still" : built;
        const lastChange = before?.changedAt ?? Number.NEGATIVE_INFINITY;
        const isLive = phase === "change" && pass.at - lastChange < LIVE_MS$4;
        shown.set(key, { ...now, changedAt: phase === "change" ? pass.at : lastChange });
        return animate$4(pic.source, { cue: { phase, order }, isRow: opts.isRow, before: before?.source, isLive });
      });
      return { ...pic, source, isInteractive: true };
    }
  };
}

const motion$4 = paneMotion$4();
function picture$2(ui, placed) {
  const { Svg } = ui;
  return h(Svg, {
    key: placed.key,
    ...motion$4.pic(placed.at, placed.pic, placed.opts)
  });
}

const PILL = { h: 20, padX: 9, size: 11, dot: 3, dotGap: 6 };
const BOLD$3 = 1.06;
const LABEL$4 = { size: 12, weight: 600 };
const HEAD = { h: 28, size: 13.5, gap: 10, nameGap: 7 };
const CHEVRON_ROOM$2 = 22;
const CHEVRON$1 = 4.5;
const STROKE$1 = 1.5;
const SECTION_H = 18;
const HEAD_H$1 = HEAD.h;
const PILL_INK = {
  run: { dot: "f-edit live", text: "f-edit" },
  ok: { dot: "m", text: "s" },
  warn: { dot: "f-warn", text: "f-warn" },
  danger: { dot: "f-danger", text: "f-danger" }
};
const pillPart = (pill, x, y) => {
  const width = Math.ceil(textWidth(pill.text, PILL.size) * BOLD$3 + PILL.padX * 2 + PILL.dot * 2 + PILL.dotGap);
  const mid = y + PILL.h / 2;
  const ink = PILL_INK[pill.role];
  const body = [
    `<rect class="k" x="${x}" y="${y}" width="${width}" height="${PILL.h}" rx="${PILL.h / 2}"/>`,
    `<circle class="${ink.dot}" cx="${x + PILL.padX + PILL.dot}" cy="${mid}" r="${PILL.dot}"/>`,
    `<text class="${ink.text}" x="${x + PILL.padX + PILL.dot * 2 + PILL.dotGap}" y="${mid + PILL.size * 0.35}" font-family="${FONT$3}" font-size="${PILL.size}" font-weight="600">${xml(pill.text)}</text>`
  ];
  return { body: body.join(""), width };
};
const chevronSvg = (x, y) => `<g class="chev"><path d="M${x} ${y - CHEVRON$1}l${CHEVRON$1} ${CHEVRON$1}-${CHEVRON$1} ${CHEVRON$1}" fill="none" stroke-width="${STROKE$1}" stroke-linecap="round" stroke-linejoin="round" class="i-m"/></g>`;
const cardHeadSvg = (W, head, inset = 0) => {
  const right = W - CHEVRON_ROOM$2;
  const probe = pillPart(head.pill, 0, 0);
  const pill = pillPart(head.pill, right - probe.width, (HEAD.h - PILL.h) / 2);
  const nameW = textWidth(head.name, HEAD.size) * BOLD$3;
  const title = fitText(head.title, HEAD.size, right - probe.width - HEAD.gap - nameW - HEAD.nameGap - inset);
  const titleSpan = title === "…" ? "" : `<tspan class="s" dx="${HEAD.nameGap}">${xml(title)}</tspan>`;
  const y = HEAD.h / 2 + HEAD.size * 0.35;
  const body = [
    `<text x="${inset}" y="${y}" font-family="${FONT$3}" font-size="${HEAD.size}"><tspan class="t" font-weight="620">${xml(head.name)}</tspan>${titleSpan}</text>`,
    pill.body,
    chevronSvg(W - CHEVRON_ROOM$2 / 2 - CHEVRON$1 / 2, HEAD.h / 2)
  ];
  return paneSvg(W, HEAD.h, body.join(""));
};
const sectionSvg = (W, section) => {
  const label = `<text class="m" x="0" y="${SECTION_H / 2 + LABEL$4.size * 0.36}" font-family="${FONT$3}" font-size="${LABEL$4.size}" font-weight="${LABEL$4.weight}">${xml(fitText(section.label, LABEL$4.size * BOLD$3, W))}</text>`;
  return paneSvg(W, SECTION_H, label);
};
const SECTION_SVG_H = SECTION_H;
const NOTICE = { h: 32, padX: 8, dot: 3, gap: 9, size: 13 };
const noticeSvg = (W, notice) => {
  const mid = NOTICE.h / 2;
  const x = NOTICE.padX + NOTICE.dot * 2 + NOTICE.gap;
  const lead = `${notice.name} `;
  const reason = notice.reason;
  const used = textWidth(lead, NOTICE.size) * BOLD$3 + textWidth(reason, NOTICE.size) * BOLD$3;
  const title = fitText(` · ${notice.title}`, NOTICE.size, Math.max(0, W - x - CHEVRON_ROOM$2 - used));
  const body = [
    `<circle class="f-${notice.role}" cx="${NOTICE.padX + NOTICE.dot}" cy="${mid}" r="${NOTICE.dot}"/>`,
    `<text x="${x}" y="${mid + NOTICE.size * 0.35}" font-family="${FONT$3}" font-size="${NOTICE.size}" font-weight="560"><tspan class="t">${xml(lead)}</tspan><tspan class="f-${notice.role}">${xml(reason)}</tspan><tspan class="s" font-weight="400">${xml(title === "…" ? "" : title)}</tspan></text>`,
    chevronSvg(W - CHEVRON_ROOM$2 / 2 - CHEVRON$1 / 2, mid)
  ];
  return paneSvg(W, NOTICE.h, body.join(""));
};
const NOTICE_H = NOTICE.h;

const GAP$2 = 3;
const MIN_SEG = 6;
const classOf = (view, i) => {
  const ok = view.done - view.failed;
  if (i < ok)
    return "m";
  if (i < view.done)
    return "f-danger";
  return i < view.done + view.active ? "f-edit" : "k";
};
const RUN_SHARE = 0.34;
const rect$2 = (track, { x, w, cls }) => `<rect class="${cls}" x="${x.toFixed(1)}" y="${track.y}" width="${Math.max(0, w).toFixed(1)}" height="${track.h}" rx="${track.h / 2}"/>`;
const solid = (view, track) => {
  const unit = track.w / Math.max(1, view.units);
  const ok = view.done - view.failed;
  const parts = [rect$2(track, { x: track.x, w: track.w, cls: "k" })];
  const spans = [[0, ok, "m"], [ok, view.done, "f-danger"], [view.done, view.done + view.active, "f-edit"]];
  for (const [from, to, cls] of spans)
    if (to > from)
      parts.push(rect$2(track, { x: track.x + from * unit, w: (to - from) * unit, cls }));
  return parts.join("");
};
const running = (track, x, w) => rect$2(track, { x, w, cls: "k" }) + rect$2(track, { x, w: w * RUN_SHARE, cls: "f-edit live" });
const meterSvg = (view, track) => {
  const units = view.units;
  if (units < 1)
    return rect$2(track, { x: track.x, w: track.w, cls: "k" });
  const seg = (track.w - GAP$2 * (units - 1)) / units;
  if (seg < MIN_SEG)
    return solid(view, track);
  return Array.from({ length: units }, (_, i) => {
    const x = track.x + i * (seg + GAP$2);
    const cls = classOf(view, i);
    return cls === "f-edit" ? running(track, x, seg) : rect$2(track, { x, w: seg, cls });
  }).join("");
};

const HOME_LOOK = lookAt(0);
const SNOOZE = { x1: 27, y1: 6, x2: 30, y2: 2.6, size1: 4.8, size2: 3.5, min1: 9, min2: 7 };
const snoozeSvg = (x, y, scale) => {
  const big = Math.max(SNOOZE.min1, SNOOZE.size1 * scale);
  const small = Math.max(SNOOZE.min2, SNOOZE.size2 * scale);
  const z = (zx, zy, size) => `<text class="m" x="${x + zx * scale}" y="${y + zy * scale}" font-family="${FONT$3}" font-size="${size}" font-weight="700">z</text>`;
  return z(SNOOZE.x1, SNOOZE.y1, big) + z(SNOOZE.x2, SNOOZE.y2, small);
};
const homeCrab = (x, y, opts) => {
  const { mood, isMoving } = opts.home;
  const body = crab(x, y, { costume: "other", look: HOME_LOOK, mood, isWalking: isMoving && mood === "working", scale: opts.scale });
  return mood === "sleeping" ? body + snoozeSvg(x, y, opts.scale) : body;
};
const LEVEL_PILL = { h: 16, padX: 7, size: 10 };
const BOLD$2 = 1.06;
const levelWidth = (text) => Math.ceil(textWidth(text, LEVEL_PILL.size) * BOLD$2 + LEVEL_PILL.padX * 2);
const levelPill = (text, x, y) => {
  const w = levelWidth(text);
  const r = (LEVEL_PILL.h - 1) / 2;
  return `<rect class="chip ln" x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${LEVEL_PILL.h - 1}" rx="${r}" stroke-width="1"/><text class="s" x="${x + w / 2}" y="${y + LEVEL_PILL.h / 2 + LEVEL_PILL.size * 0.35}" text-anchor="middle" font-family="${FONT$3}" font-size="${LEVEL_PILL.size}" font-weight="600" font-variant-numeric="tabular-nums">${xml(text)}</text>`;
};
const FACES = { sleeping: "(-_-) zz", working: "(•_•)", happy: "(^_^)", worried: "(°_°;)" };

const PAD$3 = 16;
const RADIUS = 10;
const LABEL$3 = { size: 12, weight: 600, y: 27 };
const HEADLINE = { size: 17, y: 56 };
const PERCENT$4 = { size: 26, y: 58 };
const MONO_EM$3 = 0.6;
const METER = { y: 70, h: 6 };
const DIVIDER_Y = 92;
const STATS = { top: 104, label: 11, value: 31, valueSize: 15, labelSize: 12, rule: 34, pitch: 46 };
const BOLD$1 = 1.06;
const DOT_R$3 = 3;
const GAP$1 = 12;
const HOME = { y: 11, scale: 1.5, room: 58 };
const PILL_GAP = 8;
const PILL_DROP = 4;
const PERCENT_CLASS = { run: "t", ok: "t", warn: "f-warn", idle: "m" };
const UNKNOWN = "—";
const needOf = (stat) => Math.max(textWidth(stat.label, STATS.labelSize), textWidth(stat.value, STATS.valueSize) * BOLD$1) + GAP$1 * 2;
const columnsOf = (inner, stats) => {
  const need = Math.max(0, ...stats.map(needOf));
  const fits = (cols) => inner / cols >= need;
  if (fits(stats.length))
    return stats.length;
  return fits(2) ? 2 : 1;
};
const statSvg = (stat, { x, y, w }) => `<text class="m" x="${x}" y="${y + STATS.label}" font-family="${FONT$3}" font-size="${STATS.labelSize}">${xml(fitText(stat.label, STATS.labelSize, w))}</text>
<text class="t" x="${x}" y="${y + STATS.value}" font-family="${FONT$3}" font-size="${STATS.valueSize}" font-weight="650" font-variant-numeric="tabular-nums">${xml(fitText(stat.value, STATS.valueSize, w))}</text>`;
const statsSvg$1 = (stats, inner) => {
  const cols = columnsOf(inner, stats);
  const rows = Math.ceil(stats.length / cols);
  const colW = inner / cols;
  const parts = stats.map((stat, i) => {
    const col = i % cols;
    const y = STATS.top + Math.floor(i / cols) * STATS.pitch;
    const x = PAD$3 + col * colW;
    return statSvg(stat, { x, y, w: colW - GAP$1 });
  });
  return { body: parts.join(`
`), height: STATS.top + (rows - 1) * STATS.pitch + STATS.rule + PAD$3 };
};
const homeParts = (data, eyebrowEnd) => {
  if (!data.home)
    return { body: "", room: 0 };
  const crab = homeCrab(PAD$3, HOME.y, { home: data.home, scale: HOME.scale });
  const pill = levelPill(data.home.level, eyebrowEnd + PILL_GAP, LABEL$3.y - LEVEL_PILL.h + PILL_DROP);
  return { body: crab + pill, room: PILL_GAP + levelWidth(data.home.level) };
};
const headerSvg$1 = (W, data) => {
  const inner = W - PAD$3 * 2;
  const left = PAD$3 + (data.home ? HOME.room : 0);
  const isLive = data.tone === "run";
  const eyebrowX = left + (isLive ? DOT_R$3 * 2 + 7 : 0);
  const eyebrowEnd = eyebrowX + textWidth(data.eyebrow, LABEL$3.size) * BOLD$1;
  const home = homeParts(data, eyebrowEnd);
  const isKnown = data.percent !== UNKNOWN;
  const percentW = isKnown ? Math.ceil(data.percent.length * PERCENT$4.size * MONO_EM$3) : 0;
  const isCountShown = textWidth(data.counts, LABEL$3.size) <= W - PAD$3 - eyebrowEnd - home.room - GAP$1;
  const headline = fitText(data.headline, HEADLINE.size * 1.06, W - PAD$3 - left - percentW - (isKnown ? GAP$1 : 0));
  const stats = statsSvg$1(data.stats, inner);
  const dot = isLive ? `<circle class="f-edit live" cx="${left + DOT_R$3}" cy="${LABEL$3.y - 4}" r="${DOT_R$3}"/>` : "";
  const body = [
    `<rect class="card ln" x="0.5" y="0.5" width="${W - 1}" height="${stats.height - 1}" rx="${RADIUS}" stroke-width="1"/>`,
    home.body,
    dot,
    `<text class="m" x="${eyebrowX}" y="${LABEL$3.y}" font-family="${FONT$3}" font-size="${LABEL$3.size}" font-weight="${LABEL$3.weight}">${xml(data.eyebrow)}</text>`,
    isCountShown ? `<text class="m" x="${W - PAD$3}" y="${LABEL$3.y}" text-anchor="end" font-family="${FONT$3}" font-size="${LABEL$3.size}" font-variant-numeric="tabular-nums">${xml(data.counts)}</text>` : "",
    `<text class="t" x="${left}" y="${HEADLINE.y}" font-family="${FONT$3}" font-size="${HEADLINE.size}" font-weight="620">${xml(headline)}</text>`,
    isKnown ? `<text class="${PERCENT_CLASS[data.tone]}" x="${W - PAD$3}" y="${PERCENT$4.y}" text-anchor="end" font-family="${MONO$4}" font-size="${PERCENT$4.size}" font-weight="650">${xml(data.percent)}</text>` : "",
    meterSvg(data.meter ?? { units: 0, done: 0, failed: 0, active: 0 }, { x: PAD$3, y: METER.y, w: inner, h: METER.h }),
    `<line class="ln" x1="${PAD$3}" x2="${W - PAD$3}" y1="${DIVIDER_Y}" y2="${DIVIDER_Y}" stroke-width="1"/>`,
    stats.body
  ];
  return { source: paneSvg(W, stats.height, body.join(`
`)), height: stats.height };
};

const BLANK$2 = "ㅤ";
const CELL_PX$2 = 11.9;
const BUTTON_PX$3 = 28;
const RUN_SPAN$2 = 2;
const LINE_SPAN$2 = "400%";
function PressCover$2(ui, o) {
  const { Box, Button } = ui;
  const lines = Math.max(1, Math.floor(o.height / (BUTTON_PX$3 * 2)));
  const label = BLANK$2.repeat(Math.ceil(o.width * RUN_SPAN$2 / CELL_PX$2));
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
    width: LINE_SPAN$2,
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
const STILL$2 = "<style>*{animation:none!important;transition:none!important}</style>";
const stillSource$2 = (source) => source.replace(/<\/svg>\s*$/, `${STILL$2}</svg>`);
function stillSvg$2(ui, drawing) {
  if (drawing.type !== "Svg")
    return drawing;
  const { Svg } = ui;
  const { key, source, alt, width, height } = drawing.props;
  return h(Svg, {
    key,
    source: stillSource$2(source),
    alt,
    width,
    height
  });
}
const FALLBACK_PX$2 = 52;
const FALLBACK_WIDTH_PX$2 = 360;
function PressRow$2(ui, o) {
  const { Box } = ui;
  const props = o.drawing.type === "Svg" ? o.drawing.props : {};
  const width = props.width ?? FALLBACK_WIDTH_PX$2;
  const height = props.height ?? FALLBACK_PX$2;
  return h(Box, {
    key: o.box,
    alignSelf: "flex-start"
  }, stillSvg$2(ui, o.drawing), PressCover$2(ui, { key: o.key, width, height, hotkey: o.hotkey, onPress: o.onPress }));
}

const COMPACT_H = 32;
const CRAB_PITCH = 36;
const MORE_ROOM = 40;
const LIVE_DOT$1 = { x: 32, y: 4, r: 3 };
const CRAB$1 = { w: 36, h: 32 };
const PULSE = 12;
const PULSE_CORE = 3;
const stepsOf$1 = (a) => {
  if (a.stepTotal)
    return `${a.stepDone ?? 0}/${a.stepTotal}${a.stepNote ? " · " + a.stepNote : ""}`;
  const own = countTasks(a.todos ?? []);
  if (!own.total)
    return "";
  const active = (a.todos ?? []).find((task) => task.status === "in_progress");
  return `${own.done}/${own.total}${active && a.status === "running" ? " · " + active.title : ""}`;
};
const activityOf = (a) => {
  const s = t();
  const steps = stepsOf$1(a);
  if (a.status === "failed")
    return [steps, a.endReason === "aborted" ? s.aborted : s.failed].filter(Boolean).join(" · ");
  if (a.status === "done")
    return steps || s.completed;
  const tool = a.lastTool ? `› ${a.lastPlain ?? `${a.lastTool}${a.lastTarget ? " " + a.lastTarget : ""}`}` : s.starting;
  return steps ? `${steps}  ${tool}` : tool;
};
const UNNAMED = ["", "inherit"];
const modelLine = (a) => {
  const round = a.round > 1 ? `${t().round} ${a.round}` : "";
  const model = UNNAMED.includes(a.model) ? "" : modelName(a.model);
  return [model, effortWord(a.effort), round].filter(Boolean).join(" · ");
};
const clockOf = (a, at) => {
  const time = fmtTime(elapsed(a, at));
  return a.status === "running" ? time : `${t().total} ${time}`;
};
const crabSvg = (opts) => paneSvg(CRAB$1.w, CRAB$1.h, crab(1, 0, opts));
const CARD_CRAB = { w: 30, h: 28, scale: 0.92 };
const cardCrabSvg = (opts) => paneSvg(CARD_CRAB.w, CARD_CRAB.h, crab(1, 0, { ...opts, scale: CARD_CRAB.scale }));
const HERO_CRAB = { w: 76, h: 88, scale: 2.3, crabH: 66, pillGap: 4 };
const GRID_MID = 15;
const heroCrabSvg = (home) => {
  const pillX = Math.max(0, Math.round(GRID_MID * HERO_CRAB.scale - levelWidth(home.level) / 2));
  const pill = levelPill(home.level, pillX, HERO_CRAB.crabH + HERO_CRAB.pillGap);
  return paneSvg(HERO_CRAB.w, HERO_CRAB.h, homeCrab(0, 2, { home, scale: HERO_CRAB.scale }) + pill);
};
const pulseSvg = () => {
  const c = PULSE / 2;
  return paneSvg(PULSE, PULSE, `<circle class="f-edit live" cx="${c}" cy="${c}" r="${PULSE_CORE}"/>`);
};
const plannedLine = (p) => {
  const tier = plannedTierOf(p.tier);
  const parts = [TIER_MODEL[tier] ?? ""];
  if (p.after.length)
    parts.push(t().after(p.after.join(", ")));
  return parts.filter(Boolean).join(" · ");
};
const compactSvg = (W, icons) => {
  const fit = Math.max(1, Math.floor((W - MORE_ROOM) / CRAB_PITCH));
  const shown = icons.slice(0, fit);
  const more = icons.length - shown.length;
  const body = shown.map((ic, i) => crab(i * CRAB_PITCH, 0, { costume: ic.costume, look: ic.look, isDim: ic.isDim, isWalking: ic.isRunning }) + (ic.isRunning ? `<circle class="f-edit live" cx="${i * CRAB_PITCH + LIVE_DOT$1.x}" cy="${LIVE_DOT$1.y}" r="${LIVE_DOT$1.r}"/>` : "")).join("");
  const plus = more ? `<text class="s" x="${shown.length * CRAB_PITCH + 4}" y="21" font-family="${FONT$3}" font-size="12">+${more}</text>` : "";
  return paneSvg(W, COMPACT_H, body + plus);
};

const READ$1 = ["Read", "Grep", "Glob", "LS", "WebFetch", "WebSearch", "NotebookRead"];
const EDIT$1 = ["Edit", "Write", "MultiEdit", "NotebookEdit"];
const RUN = ["Bash", "BashOutput", "KillShell", "Monitor"];
const AGENT = ["Agent", "Task", "SendMessage"];
const kindOf$1 = (tool) => {
  if (READ$1.includes(tool))
    return "read";
  if (EDIT$1.includes(tool))
    return "edit";
  if (RUN.includes(tool))
    return "run";
  return AGENT.includes(tool) ? "agent" : "other";
};
const KIND_GLYPH = { read: "◇", edit: "✎", run: "❯", agent: "◆", other: "•" };

const LANES_MAX = 8;
const MIN_SPAN_MS = 30000;
const laneOf = (a, at) => {
  const isLive = a.status === "running";
  const end = isLive ? at : a.endedAt ?? a.startedAt;
  const look = lookOf$1(a);
  return {
    id: a.id,
    name: look.name,
    shell: look.shell,
    title: a.description || a.type,
    status: a.status,
    isStuck: stuckOf(a, at) !== null,
    start: a.startedAt,
    end: Math.max(end, a.startedAt),
    segments: (a.history ?? []).map((e) => ({ from: e.at, to: e.endAt ?? (isLive ? at : e.at), kind: kindOf$1(e.tool) }))
  };
};
function timelineOf(list, at) {
  const lanes = [...list].sort((a, b) => a.startedAt - b.startedAt).slice(-LANES_MAX).map((a) => laneOf(a, at));
  if (lanes.length === 0)
    return null;
  const t0 = Math.min(...lanes.map((lane) => lane.start));
  const t1 = Math.max(...lanes.map((lane) => lane.end));
  return { lanes, t0, t1, span: Math.max(MIN_SPAN_MS, t1 - t0), isLive: lanes.some((lane) => lane.status === "running") };
}
const cellOf = (lane, from, to) => {
  if (to <= lane.start || from > lane.end)
    return { kind: "none" };
  let best = null;
  let most = 0;
  for (const seg of lane.segments) {
    const overlap = Math.min(to, Math.max(seg.to, seg.from + 1)) - Math.max(from, seg.from);
    if (overlap > most)
      [best, most] = [seg.kind, overlap];
  }
  return { kind: best ?? "idle" };
};
const laneCells = (lane, tl, width) => {
  const slice = tl.span / Math.max(1, width);
  return Array.from({ length: width }, (_, i) => cellOf(lane, tl.t0 + i * slice, tl.t0 + (i + 1) * slice));
};
const runsOf = (cells) => {
  const runs = [];
  for (const cell of cells) {
    const last = runs.at(-1);
    if (last && last.kind === cell.kind)
      last.length += 1;
    else
      runs.push({ kind: cell.kind, length: 1 });
  }
  return runs;
};

const TOP$1 = 6;
const LANE_H = 24;
const AXIS_H = 20;
const LABEL_W = 74;
const RIGHT_PAD = 10;
const NOW_ROOM = 44;
const SEG_H = 10;
const SEG_MIN = 3;
const TRACK_H$1 = 2;
const DOT_R$2 = 4;
const CAP_R = 3.5;
const NAME_SIZE$1 = 12;
const MICRO = 10.5;
const TICKS_MAX = 4;
const SECOND$5 = 1000;
const MINUTE$3 = 60 * SECOND$5;
const STEPS_MS = [10 * SECOND$5, 30 * SECOND$5, MINUTE$3, 2 * MINUTE$3, 5 * MINUTE$3, 10 * MINUTE$3, 15 * MINUTE$3, 30 * MINUTE$3, 60 * MINUTE$3];
const CAP = { running: "f-edit", done: "m", failed: "f-danger" };
const ENDED_OPACITY = 0.6;
const xOf = (scale, ms) => scale.x0 + (ms - scale.t0) / scale.span * (scale.x1 - scale.x0);
const n1 = (v) => v.toFixed(1);
function laneSvg(lane, y, scale) {
  const cy = y + LANE_H / 2;
  const isLive = lane.status === "running";
  const start = xOf(scale, lane.start);
  const end = Math.max(start + SEG_MIN, xOf(scale, lane.end));
  const label = `<circle cx="${DOT_R$2 + 1}" cy="${cy}" r="${DOT_R$2}" fill="${lane.shell}"/><text class="${isLive ? "t" : "s"}" x="${DOT_R$2 * 2 + 8}" y="${cy + 4}" font-family="${FONT$3}" font-size="${NAME_SIZE$1}" font-weight="600">${xml(fitText(lane.name, NAME_SIZE$1, LABEL_W - DOT_R$2 * 2 - 12))}</text>`;
  const track = `<rect class="k" x="${n1(start)}" y="${cy - TRACK_H$1 / 2}" width="${n1(end - start)}" height="${TRACK_H$1}" rx="1"/>`;
  const segs = lane.segments.map((seg) => {
    const x = xOf(scale, seg.from);
    const w = Math.max(SEG_MIN, xOf(scale, seg.to) - x);
    return `<rect class="s" x="${n1(x)}" y="${cy - SEG_H / 2}" width="${n1(w)}" height="${SEG_H}" rx="2.5"/>`;
  }).join("");
  const cap = `<circle class="${lane.isStuck ? "f-warn" : CAP[lane.status] ?? "f-edit"}" cx="${n1(end)}" cy="${cy}" r="${CAP_R}"/>`;
  const notch = lane.isStuck ? `<rect class="f-warn" x="${n1(end + CAP_R + 3)}" y="${cy - SEG_H / 2 - 2}" width="3" height="${SEG_H + 4}" rx="1.5"/>` : "";
  return `<g>${label}<g opacity="${isLive ? 1 : ENDED_OPACITY}">${track}${segs}</g>${cap}${notch}</g>`;
}
function axisSvg(scale, top, nowX) {
  const step = STEPS_MS.find((ms) => scale.span / ms <= TICKS_MAX) ?? STEPS_MS.at(-1) ?? MINUTE$3;
  const ticks = [];
  for (let ms = 0;ms <= scale.span; ms += step) {
    const x = xOf(scale, scale.t0 + ms);
    if (nowX !== null && Math.abs(x - nowX) < NOW_ROOM && ms > 0)
      continue;
    const anchor = ms === 0 ? "start" : "middle";
    ticks.push(`<rect class="k" x="${n1(x)}" y="${top}" width="1" height="4"/><text class="m" x="${n1(x)}" y="${top + 16}" text-anchor="${anchor}" font-family="${MONO$4}" font-size="${MICRO}">${fmtTime(ms)}</text>`);
  }
  return `<rect class="k" x="${scale.x0}" y="${top}" width="${n1(scale.x1 - scale.x0)}" height="1"/>${ticks.join("")}`;
}
const nowSvg$1 = (scale, at, rows) => {
  const x = xOf(scale, at);
  const anchor = x > scale.x1 - NOW_ROOM / 2 ? "end" : "middle";
  return `<rect class="s" x="${n1(x)}" y="${rows.top - 4}" width="1" height="${rows.bottom - rows.top + 8}" opacity=".55"/>` + `<text class="s" x="${n1(anchor === "end" ? scale.x1 : x)}" y="${rows.bottom + 18}" text-anchor="${anchor}" font-family="${FONT$3}" font-size="${MICRO}" font-weight="600">${xml(t().now)}</text>`;
};
const altOf$1 = (tl) => {
  const s = t();
  const words = { running: s.isRunning, done: s.isFinished, failed: s.failed };
  return `${s.timeline}: ${tl.lanes.map((lane) => `${lane.name} ${fmtTime(lane.end - lane.start)} ${words[lane.status] ?? ""}`.trim()).join(", ")}`;
};
function timelineSvg(W, tl) {
  const scale = { x0: LABEL_W, x1: W - RIGHT_PAD, t0: tl.t0, span: tl.span };
  const bottom = TOP$1 + tl.lanes.length * LANE_H;
  const height = bottom + AXIS_H + 4;
  const lanes = tl.lanes.map((lane, i) => laneSvg(lane, TOP$1 + i * LANE_H, scale)).join("");
  const nowX = tl.isLive ? xOf(scale, tl.t1) : null;
  const body = lanes + axisSvg(scale, bottom + 2, nowX) + (tl.isLive ? nowSvg$1(scale, tl.t1, { top: TOP$1, bottom }) : "");
  return { source: paneSvg(W, height, body), height, alt: altOf$1(tl) };
}

const BUTTON_PX$2 = 76;
const TERM_NAME = 6;
const TERM_CLOCK = 2;
const TIMELINE_MIN_AGENTS = 2;
const homeAlt = (home) => `${HOME_LOOK.name}, ${t().crab.moods[home.mood]}, ${home.level}`;
function deskHead$1(ui, d, layout) {
  const data = drawnHeaderOf(d);
  const { stats, ...shows } = data;
  const head = headerSvg$1(layout.W, data);
  const alt = [data.headline, data.percent, data.counts, totalsLineOf(data), homeAlt(d.home)].filter(Boolean).join(", ");
  return picture$2(ui, { key: "head", at: "head", pic: { source: head.source, alt, width: layout.W, height: head.height }, opts: { shows: { ...shows, labels: stats.map((stat) => stat.label) } } });
}
function headTree(ui, d, layout) {
  const { Box, Text } = ui;
  if (layout.isDesktop)
    return deskHead$1(ui, d, layout);
  const data = headerOf(d);
  const line = totalsLineOf(data);
  return h(Box, {
    flexDirection: "column"
  }, h(Text, {
    wrap: "truncate-end"
  }, h(Text, {
    dimColor: true
  }, `${FACES[d.home.mood]} `), h(Text, {
    bold: true
  }, data.headline), h(Text, {
    bold: true,
    dimColor: data.tone === "idle"
  }, `  ${data.percent}`)), h(Text, {
    dimColor: true
  }, [d.home.level, data.counts].filter(Boolean).join(" · ")), h(Text, {
    dimColor: true
  }, line));
}
function toolbarTree(ui, d, on) {
  const { Box, Button } = ui;
  const s = t();
  const isDrafting = d.panel.draft?.isOpen === true;
  return h(Box, {
    key: "toolbar",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  }, h(Button, {
    key: "new-task",
    plain: true,
    dimColor: isDrafting,
    label: `＋ ${s.newTask}`,
    onPress: on.onNewTask
  }), h(Button, {
    key: "compact",
    label: d.panel.isCompact ? s.expand : s.collapse,
    plain: true,
    dimColor: true,
    onPress: on.onCompact
  }));
}
function attentionTree(ui, view) {
  const { Box, Button, Text } = ui;
  const { layout, on } = view;
  const att = view.d.attention;
  if (!att)
    return null;
  const onPress = () => on.onLook(att.agentId);
  if (!layout.isDesktop) {
    return h(Box, {
      key: "attention",
      flexDirection: "row",
      columnGap: 1
    }, h(Text, {
      color: att.role === "warn" ? "warning" : "error",
      wrap: "truncate-end"
    }, `! ${att.name} ${att.reason}`, h(Text, {
      dimColor: true
    }, ` · ${att.title}`)), h(Button, {
      key: "look",
      plain: true,
      label: t().look,
      onPress
    }));
  }
  const pic = { source: noticeSvg(layout.W, att), alt: `${att.name} ${att.reason}: ${att.title} (${t().look})`, width: layout.W, height: NOTICE_H };
  const drawing = picture$2(ui, { key: "notice", at: "attention", pic, opts: { isRow: true } });
  return PressRow$2(ui, { box: "attention", key: "look", drawing, onPress });
}
function sectionHead(ui, layout, head) {
  const { Box, Button, Text } = ui;
  const s = t();
  const toggle = head.toggle;
  if (!layout.isDesktop) {
    if (!toggle)
      return h(Text, {
        key: `h-${head.label}`,
        bold: true
      }, head.label);
    return h(Box, {
      key: `h-${toggle.key}`,
      flexDirection: "row"
    }, h(Button, {
      key: toggle.key,
      plain: true,
      label: `${toggle.isOpen ? "▾" : "▸"} ${head.label}`,
      onPress: toggle.onPress
    }));
  }
  const width = toggle ? layout.W - BUTTON_PX$2 : layout.W;
  const svg = picture$2(ui, { key: "eyebrow", at: `eyebrow-${head.id}`, pic: { source: sectionSvg(width, head), alt: head.label, width, height: SECTION_SVG_H } });
  if (!toggle)
    return h(Box, {
      key: `h-${head.label}`,
      flexDirection: "row"
    }, svg);
  return h(Box, {
    key: `h-${toggle.key}`,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 1
  }, svg, h(Button, {
    key: toggle.key,
    plain: true,
    dimColor: true,
    label: toggle.isOpen ? s.hide : s.show,
    onPress: toggle.onPress
  }));
}
const RUN_GLYPH = { none: " ", idle: "─" };
function termLane(ui, runs, label) {
  const { Text } = ui;
  return h(Text, {
    key: `lane-${label.name}`,
    wrap: "truncate-end"
  }, h(Text, {
    bold: true
  }, label.name.padEnd(TERM_NAME)), runs.map((run, i) => h(Text, {
    key: `r${i}`,
    dimColor: run.kind === "idle"
  }, (RUN_GLYPH[run.kind] ?? "━").repeat(run.length))), h(Text, {
    color: label.key
  }, ` ${label.end}`));
}
const END_GLYPH = { running: "●", done: "✓", failed: "✗", stuck: "!" };
const END_KEY = { running: "claude", done: "subtle", failed: "error", stuck: "warning" };
function termTimeline(ui, tl, layout) {
  const { Box } = ui;
  const width = Math.max(TERM_NAME, layout.cols - TERM_NAME - TERM_CLOCK - 1);
  return h(Box, {
    key: "timeline",
    flexDirection: "column"
  }, tl.lanes.map((lane) => {
    const end = lane.isStuck ? "stuck" : lane.status;
    return termLane(ui, runsOf(laneCells(lane, tl, width)), { name: lane.name, end: END_GLYPH[end] ?? "●", key: END_KEY[end] ?? "subtle" });
  }));
}
function deskTimeline(ui, tl, layout) {
  const drawing = timelineSvg(layout.W, tl);
  const shows = { lanes: tl.lanes.map((lane) => [lane.id, lane.status, lane.isStuck]), isLive: tl.isLive };
  return picture$2(ui, { key: "timeline", at: "timeline", pic: { ...drawing, width: layout.W }, opts: { shows } });
}
function timelineTree(ui, view) {
  const { Box } = ui;
  const { d, layout, on } = view;
  const tl = d.list.length >= TIMELINE_MIN_AGENTS ? timelineOf(d.list, layout.isDesktop ? d.drawnAt : d.at) : null;
  if (!tl)
    return null;
  const isOpen = d.panel.isTimelineHidden !== true;
  const head = sectionHead(ui, layout, { id: "timeline", label: t().timeline, toggle: { key: "timeline", isOpen, onPress: on.onTimeline } });
  return h(Box, {
    key: "timeline-section",
    flexDirection: "column",
    rowGap: layout.isDesktop ? 1 : 0
  }, head, isOpen && layout.isDesktop && deskTimeline(ui, tl, layout), isOpen && !layout.isDesktop && termTimeline(ui, tl, layout));
}
const glyphKeyOf = (a) => {
  if (a.status === "failed")
    return "error";
  return a.status === "done" ? "subtle" : "claude";
};
const iconsOf = (d) => [
  ...[...d.running, ...d.finished].map((a) => ({ costume: costumeOf(a), look: lookOf$1(a), isRunning: a.status === "running" && !stuckOf(a, d.at), isDim: false })),
  ...d.planned.map((p, i) => ({ costume: plannedTierOf(p.tier), look: lookAt(i), isRunning: false, isDim: true }))
];
function compactTree(ui, d, layout) {
  const { Text } = ui;
  if (layout.isDesktop) {
    return picture$2(ui, { key: "compact-icons", at: "compact", pic: { source: compactSvg(layout.W, iconsOf(d)), alt: `${d.list.length} ${t().agentsCount}, ${summaryOf(d.sum)}`, width: layout.W, height: COMPACT_H } });
  }
  const glyphs = [...d.running, ...d.finished].map((a) => h(Text, {
    key: a.id,
    color: glyphKeyOf(a)
  }, `${a.status === "done" ? "✓" : "●"} `));
  return h(Text, {
    wrap: "truncate-end"
  }, glyphs, d.planned.length ? h(Text, {
    dimColor: true
  }, "○ ".repeat(d.planned.length)) : null);
}
function emptyTree(ui, view) {
  const { Box, Button, Text } = ui;
  const { layout, on } = view;
  const home = view.d.home;
  const s = t();
  const crab = layout.isDesktop && picture$2(ui, { key: "crab", at: "hero-crab", pic: { source: heroCrabSvg(home), alt: homeAlt(home), width: HERO_CRAB.w, height: HERO_CRAB.h } });
  return h(Box, {
    key: "empty",
    flexDirection: "row",
    columnGap: 2,
    alignItems: "center"
  }, crab, h(Box, {
    flexDirection: "column",
    rowGap: 1,
    flexShrink: 1
  }, !layout.isDesktop && h(Text, {
    dimColor: true
  }, `${FACES[home.mood]} · ${home.level}`), h(Text, {
    bold: true
  }, crewedOf(view.d.chats).length > 0 ? s.chats.emptyHere : s.emptyTitle), h(Text, {
    dimColor: true
  }, s.empty), h(Box, {
    flexDirection: "row"
  }, h(Button, {
    key: "new-task",
    variant: "primary",
    label: `＋ ${s.newTask}`,
    onPress: on.onNewTask
  }))));
}

const MAX_WAITING_ROWS = 3;
const MINUTES_PER_HOUR$1 = 60;
const spanOf$1 = (minutes) => {
  const s = t();
  if (minutes >= MINUTES_PER_HOUR$1)
    return s.hours(Math.floor(minutes / MINUTES_PER_HOUR$1));
  return minutes >= 1 ? s.minutes(minutes) : "";
};
const rowOf = (chat) => ({
  project: chat.project,
  title: chat.title || t().chats.untitled,
  wait: t().chats.waiting(spanOf$1(chat.minutes))
});
function waitingTree(ui, chats, layout) {
  const { Box, Text } = ui;
  const s = t().chats;
  const waiting = waitingOf(chats);
  if (!waiting.length)
    return null;
  const rows = waiting.slice(0, MAX_WAITING_ROWS).map(rowOf);
  const rest = waiting.length - rows.length;
  const more = rest > 0 ? s.more(rest) : "";
  if (layout.isDesktop) {
    const card = chatsCardSvg(layout.W, { title: s.waitingTitle, rows, more });
    return picture$2(ui, { key: "chats-waiting", at: "chats-waiting", pic: { ...card, width: layout.W } });
  }
  return h(Box, {
    key: "chats-waiting",
    flexDirection: "column"
  }, h(Text, {
    bold: true,
    dimColor: true
  }, s.waitingTitle), rows.map((row, i) => h(Text, {
    key: `wait-${i}`,
    wrap: "truncate-end"
  }, h(Text, {
    bold: true
  }, row.project), h(Text, {
    dimColor: true
  }, ` · ${row.title}  `), h(Text, {
    color: "warning"
  }, row.wait))), more !== "" && h(Text, {
    dimColor: true
  }, more));
}
const linesPicture = (ui, at, lines, W) => {
  const drawn = chatLinesSvg(W, lines);
  return picture$2(ui, { key: at, at, pic: { source: drawn.source, alt: drawn.alt, width: W, height: drawn.height } });
};
const chatLine = (chat) => ({
  kind: "chat",
  lead: chat.project,
  text: chat.title || t().chats.untitled,
  end: chat.state === "working" ? spanOf$1(chat.minutes) : t().chats.states.idle,
  isLive: chat.state === "working"
});
const agentChatLine = (agent) => ({
  kind: "agent",
  lead: agent.name,
  text: agent.title,
  end: [spanOf$1(agent.minutes), agent.costUsd > 0 ? `≈${fmtCost(agent.costUsd)}` : ""].filter(Boolean).join(" · "),
  isLive: true
});
const agentLine = (agent) => [agent.name, agent.title, spanOf$1(agent.minutes), agent.costUsd > 0 ? `≈${fmtCost(agent.costUsd)}` : ""].filter(Boolean).join(" · ");
function crewTree(ui, chats, layout) {
  const { Box, Text } = ui;
  const s = t().chats;
  const crewed = crewedOf(chats);
  if (!crewed.length)
    return null;
  const count = crewed.reduce((sum, chat) => sum + (chat.agents?.length ?? 0), 0);
  return h(Box, {
    key: "chats-crew",
    flexDirection: "column",
    rowGap: 0
  }, sectionHead(ui, layout, { id: "chats-crew", label: `${s.agentsTitle} · ${count}` }), layout.isDesktop && linesPicture(ui, "chats-crew-lines", crewed.flatMap((chat) => [chatLine(chat), ...(chat.agents ?? []).map(agentChatLine)]), layout.W), !layout.isDesktop && crewed.map((chat) => h(Box, {
    key: `crew-${chat.id}`,
    flexDirection: "column"
  }, h(Text, {
    wrap: "truncate-end"
  }, h(Text, {
    bold: true
  }, chat.project), h(Text, {
    dimColor: true
  }, ` · ${chat.title || s.untitled}`)), chat.agents?.map((agent) => h(Text, {
    key: `crew-${chat.id}-${agent.id}`,
    dimColor: true,
    wrap: "truncate-end"
  }, `  ${agentLine(agent)}`)))));
}
function quietTree(ui, view) {
  const { Box, Text } = ui;
  const s = t().chats;
  const quiet = quietOf(view.chats).filter((chat) => !chat.agents?.length);
  if (!quiet.length)
    return null;
  const shown = view.isOpen ? quiet : quiet.filter((chat) => chat.state === "working");
  const head = sectionHead(ui, view.layout, { id: "chats", label: `${s.title} · ${quiet.length}`, toggle: { key: "chats", isOpen: view.isOpen, onPress: view.onToggle } });
  return h(Box, {
    key: "chats-quiet",
    flexDirection: "column",
    rowGap: 0
  }, head, view.layout.isDesktop && shown.length > 0 && linesPicture(ui, "chats-quiet-lines", shown.map(chatLine), view.layout.W), !view.layout.isDesktop && shown.map((chat) => h(Text, {
    key: `chat-${chat.id}`,
    wrap: "truncate-end"
  }, h(Text, {
    bold: true
  }, chat.project), h(Text, {
    dimColor: true
  }, ` · ${chat.title || s.untitled} · ${s.states[chat.state === "working" ? "working" : "idle"]}`))));
}

function draftHead(ui, layout) {
  const { Text } = ui;
  const label = t().newTask;
  if (!layout.isDesktop)
    return h(Text, {
      bold: true,
      dimColor: true
    }, label);
  return picture$2(ui, { key: "draft-head", at: "draft-head", pic: { source: sectionSvg(layout.inner, { label }), alt: label, width: layout.inner, height: SECTION_SVG_H } });
}
function draftTree(ui, view, on) {
  const { Box, Button, Input, Select, Text } = ui;
  const s = t();
  const chosen = chosenOf(view.types, view.draft);
  const frame = view.layout.isDesktop ? { borderStyle: "round", paddingX: 2, paddingY: 1 } : {};
  return h(Box, {
    key: "draft",
    flexDirection: "column",
    rowGap: 1,
    ...frame
  }, draftHead(ui, view.layout), !chosen && h(Text, {
    dimColor: true
  }, s.noTypes), chosen && Select && h(Select, {
    key: "dispatch-type",
    label: s.agentLabel,
    options: view.types.map((type) => ({ value: type.name, label: type.name })),
    value: chosen.name,
    onSelect: on.onPickType
  }), chosen && h(Text, {
    dimColor: true,
    wrap: "truncate-end"
  }, `${sourceWord(chosen.source)} · ${describe(chosen)}`), chosen && Input && h(Input, {
    key: "dispatch-task",
    label: s.taskLabel,
    placeholder: s.taskHint,
    value: "",
    submitLabel: s.start,
    autoFocus: true,
    onSubmit: on.onStartTask
  }), view.draft?.notice && h(Text, {
    color: "warning"
  }, view.draft.notice), h(Box, {
    flexDirection: "row"
  }, h(Button, {
    key: "dispatch-cancel",
    plain: true,
    dimColor: true,
    label: s.cancel,
    onPress: on.onCancelTask
  })));
}

const BRIEF_SHOWN = 280;
const ANSWER_SHOWN = 900;
function saidTree(ui, said) {
  const { Box, Text } = ui;
  return h(Box, {
    key: said.key,
    flexDirection: "column"
  }, h(Text, {
    bold: true
  }, said.who), h(Box, {
    flexDirection: "column",
    borderStyle: "round",
    borderDimColor: true,
    paddingX: 1
  }, h(Text, null, said.text)));
}
function briefTree(ui, a, ctx) {
  const { Box, Button } = ui;
  if (!a.brief)
    return null;
  const s = t();
  const isLong = a.brief.length > BRIEF_SHOWN;
  const isWhole = !isLong || ctx.briefOpen === a.id;
  const text = isWhole ? a.brief : clip$4(a.brief, BRIEF_SHOWN);
  return h(Box, {
    key: `brief-box-${a.id}`,
    flexDirection: "column"
  }, saidTree(ui, { key: "asked", who: a.isAsked ? s.you : s.brief, text }), isLong && h(Box, {
    flexDirection: "row",
    justifyContent: "flex-end"
  }, h(Button, {
    key: `brief-${a.id}`,
    plain: true,
    dimColor: true,
    label: isWhole ? s.showLess : s.showAll,
    onPress: () => ctx.onBrief(a.id)
  })));
}
const turnsOf = (a) => a.thread ?? (a.answer && a.status === "done" ? [{ from: "agent", text: a.answer, at: a.endedAt ?? a.startedAt }] : []);
const turnTree = (ui, a, turn, i) => turn.from === "you" ? saidTree(ui, { key: `turn-${i}`, who: t().you, text: turn.text }) : saidTree(ui, { key: `turn-${i}`, who: lookOf$1(a).name, text: clip$4(turn.text, ANSWER_SHOWN) });
const isAwaited = (a, turns) => a.status === "running" || a.status === "done" && turns.at(-1)?.from === "you";
function tailTree$1(ui, a, turns) {
  const { Text } = ui;
  const s = t();
  if (isAwaited(a, turns))
    return h(Text, {
      color: "claude"
    }, `● ${s.answering(lookOf$1(a).name)}`);
  if (a.status !== "failed")
    return null;
  return h(Text, {
    color: "error"
  }, `${s.cheerFailed} · ${a.endReason === "aborted" ? s.aborted : s.failedNow}`);
}
function conversationTree(ui, a, ctx) {
  const { Box } = ui;
  const turns = turnsOf(a);
  return h(Box, {
    key: `talk-${a.id}`,
    flexDirection: "column",
    rowGap: 1
  }, briefTree(ui, a, ctx), turns.map((turn, i) => turnTree(ui, a, turn, i)), tailTree$1(ui, a, turns));
}

const filesShown = (files) => {
  const latest = [...files].sort((x, y) => y.at - x.at);
  return [...latest.filter((f) => f.edits > 0), ...latest.filter((f) => f.edits === 0)];
};
const EXT = /\.([a-z0-9]{1,5})$/i;
const extOf = (path) => (EXT.exec(path)?.[1] ?? "").toUpperCase();

const ICON$1 = {
  read: '<circle cx="7" cy="7" r="4.5"/><path d="M10.4 10.4L14 14"/>',
  edit: '<path d="M3 13l.8-3.2L10.6 3l2.4 2.4-6.8 6.8z"/><path d="M9.2 4.4l2.4 2.4"/>',
  run: '<path d="M3 4.5L6.5 8 3 11.5"/><path d="M8.5 12h5"/>',
  agent: '<path d="M8 2.5L13.5 8 8 13.5 2.5 8z"/>',
  other: '<circle cx="8" cy="8" r="5"/>',
  thinking: '<circle cx="3.5" cy="8" r=".9"/><circle cx="8" cy="8" r=".9"/><circle cx="12.5" cy="8" r=".9"/>',
  done: '<path d="M3 8.5l3.2 3.2L13 4.8"/>',
  failed: '<path d="M4 4l8 8M12 4l-8 8"/>'
};
const ICON_SIZE = 16;
const STROKE = 1.5;
const iconAt = (icon, opts) => `<g class="${opts.cls}" transform="translate(${opts.x} ${opts.y}) scale(${opts.scale ?? 1})" fill="none" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${ICON$1[icon]}</g>`;
const NOW = { h: 42, textX: 26, iconY: 3, label: 12, labelY: 15, lineY: 34, line2: 13.5, mono: 12.5 };
const BOLD = 1.06;
const MID_BASELINE = 0.36;
const lookOfNow = (now) => {
  if (now.state === "done")
    return { ink: "m", icon: "done" };
  if (now.state === "failed")
    return { ink: "f-danger", icon: "failed" };
  if (now.state === "call")
    return { ink: "f-edit", icon: now.kind };
  return { ink: "f-edit", icon: "thinking" };
};
const capital$1 = (s) => upper$3(s.charAt(0)) + s.slice(1);
const callLine = (now, x, room) => {
  const tool = now.tool ? `${fitText(now.tool, NOW.line2 * BOLD, room)} ` : "";
  const used = textWidth(tool, NOW.line2) * BOLD;
  const shown = fitMono(now.target, { size: NOW.mono, maxW: Math.max(0, room - used), isFromStart: now.isPath });
  return `<text x="${x}" y="${NOW.lineY}" font-family="${FONT$3}" font-size="${NOW.line2}" font-weight="620"><tspan class="t">${xml(tool)}</tspan><tspan class="s" font-family="${MONO$4}" font-size="${NOW.mono}" font-weight="450">${xml(shown)}</tspan></text>`;
};
const nowSvg = (W, now) => {
  const look = lookOfNow(now);
  const x = NOW.textX;
  const verb = fitText(capital$1(now.verb), NOW.label * BOLD, W - x);
  const body = [
    iconAt(look.icon, { x: 0, y: NOW.iconY, cls: "i-s" }),
    `<text class="${look.ink}" x="${x}" y="${NOW.labelY}" font-family="${FONT$3}" font-size="${NOW.label}" font-weight="600">${xml(verb)}</text>`,
    now.tool ? callLine(now, x, W - x) : ""
  ];
  return paneSvg(W, NOW.h, body.join(""));
};
const NOW_H = NOW.h;
const ROW$1 = { h: 26, badgeW: 34, badgeH: 17, badgeRx: 4, badge: 9, gap: 10, path: 12.5, count: 11.5, icon: 0.72, iconGap: 3, countGap: 10 };
const BADGE_MAX = 4;
const badgeOf = (path, y) => {
  const ext = extOf(path).slice(0, BADGE_MAX);
  const mid = y + ROW$1.h / 2;
  return `<rect class="k" x="0" y="${mid - ROW$1.badgeH / 2}" width="${ROW$1.badgeW}" height="${ROW$1.badgeH}" rx="${ROW$1.badgeRx}"/>` + `<text class="m" x="${ROW$1.badgeW / 2}" y="${mid + ROW$1.badge * MID_BASELINE}" text-anchor="middle" font-family="${MONO$4}" font-size="${ROW$1.badge}" font-weight="600">${xml(ext || "·")}</text>`;
};
const countsOf$2 = (f) => [{ n: f.edits, icon: "edit", ink: "s" }, { n: f.reads, icon: "read", ink: "m" }].filter((c) => c.n > 0);
const countW = (c) => ICON_SIZE * ROW$1.icon + ROW$1.iconGap + monoWidth(String(c.n), ROW$1.count);
const countsSvg = (counts, opts) => {
  let x = opts.right;
  const mid = opts.y + ROW$1.h / 2;
  const parts = [...counts].reverse().map((c) => {
    x -= countW(c);
    const part = iconAt(c.icon, { x, y: mid - ICON_SIZE * ROW$1.icon / 2, cls: `i-${c.ink}`, scale: ROW$1.icon }) + `<text class="${c.ink}" x="${x + ICON_SIZE * ROW$1.icon + ROW$1.iconGap}" y="${mid + ROW$1.count * MID_BASELINE}" font-family="${MONO$4}" font-size="${ROW$1.count}" font-weight="600">${c.n}</text>`;
    x -= ROW$1.countGap;
    return part;
  });
  return { body: parts.join(""), width: opts.right - x };
};
const pathSvg = (path, opts) => {
  const short = shortPath(path);
  const cut = short.lastIndexOf("/") + 1;
  const name = fitText(short.slice(cut), ROW$1.path * BOLD, opts.room);
  const dir = fitStart$2(short.slice(0, cut), ROW$1.path, opts.room - textWidth(name, ROW$1.path) * BOLD);
  const y = opts.y + ROW$1.h / 2 + ROW$1.path * MID_BASELINE;
  return `<text x="${ROW$1.badgeW + ROW$1.gap}" y="${y}" font-family="${FONT$3}" font-size="${ROW$1.path}"><tspan class="m">${xml(dir)}</tspan><tspan class="t" font-weight="560">${xml(name)}</tspan></text>`;
};
const filesSvg = (W, files) => {
  const rows = files.map((f, i) => {
    const y = i * ROW$1.h;
    const counts = countsSvg(countsOf$2(f), { right: W, y });
    const room = W - ROW$1.badgeW - ROW$1.gap - counts.width - ROW$1.gap;
    return badgeOf(f.path, y) + pathSvg(f.path, { y, room }) + counts.body;
  });
  const height = Math.max(ROW$1.h, files.length * ROW$1.h);
  return { source: paneSvg(W, height, rows.join("")), height };
};

const pad$1 = (n) => String(n).padStart(2, "0");
const timeOf = (at) => {
  const date = new Date(at);
  return `${pad$1(date.getHours())}:${pad$1(date.getMinutes())}:${pad$1(date.getSeconds())}`;
};
const nameOf$1 = (path) => path.split("/").filter(Boolean).at(-1) ?? path;
const hrefOf$1 = (path) => `file://${encodeURI(path)}`;
const linkOf = (path) => `[${nameOf$1(path).replace(/([\\`*_[\]<>])/g, "\\$1")}](<${hrefOf$1(path)}>)`;
const filesMarkdown = (paths) => paths.filter((path) => path.startsWith("/")).map(linkOf).join(" · ");
function fileLink(ui, e, key) {
  const { Markdown } = ui;
  if (!e.path || !Markdown)
    return null;
  return h(Markdown, {
    key,
    text: linkOf(e.path)
  });
}
const endOf$1 = (e, isLive) => {
  if (e.endAt !== undefined)
    return e.isError ? `✗ ${t().failedNow}` : "✓";
  return isLive ? "…" : "—";
};
function stepTree(ui, e, ctx) {
  const { Box, Text } = ui;
  const said = e.why ?? e.plain ?? e.tool;
  const because = e.because && e.because !== ctx.prev?.because ? e.because : undefined;
  const isFailed = e.endAt !== undefined && e.isError === true;
  return h(Box, {
    key: `log-${ctx.index}`,
    flexDirection: "column"
  }, because ? h(Text, {
    wrap: "wrap"
  }, h(Text, {
    bold: true
  }, `${t().because}: `), h(Text, null, because)) : null, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Box, {
    flexShrink: 0
  }, h(Text, {
    dimColor: true
  }, timeOf(e.at))), h(Box, {
    flexShrink: 0
  }, h(Text, {
    dimColor: true
  }, KIND_GLYPH[kindOf$1(e.tool)])), h(Box, {
    flexDirection: "column",
    flexGrow: 1,
    flexShrink: 1
  }, h(Text, {
    wrap: "wrap"
  }, said), h(Text, {
    dimColor: true,
    wrap: "wrap"
  }, [e.why && e.plain ? e.plain : "", `${e.tool}${e.path ? "" : ` ${e.target}`}`.trim()].filter(Boolean).join(" · ")), fileLink(ui, e, `log-file-${ctx.index}`)), h(Box, {
    flexShrink: 0
  }, h(Text, {
    color: isFailed ? "error" : "subtle"
  }, endOf$1(e, ctx.isLive)))));
}
function logTree(ui, a) {
  const { Box } = ui;
  const list = a.history ?? [];
  const isLive = a.status === "running";
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, list.map((e, index) => stepTree(ui, e, { isLive, index, prev: list[index - 1] })));
}
function logButton(ui, a, ctx) {
  const { Box, Button } = ui;
  const s = t();
  const label = ctx.logOpen === a.id ? s.logClose : s.logOpen(a.history?.length ?? 0);
  return h(Box, {
    flexDirection: "row"
  }, h(Button, {
    key: `log-${a.id}`,
    variant: "secondary",
    label,
    onPress: () => ctx.onLog(a.id)
  }));
}

const BAR_H$1 = 18;
const CHIPS_H = 22;
const MIX_H = 8;
const TRACK_H = 8;
const PCT_GAP = 8;
const PCT_W = 46;
const PCT_SIZE = 12.5;
const STRIPE = 8;
const CHIP_GAP$1 = 6;
const CHIP_PAD = 9;
const CHIP_TEXT = 11.5;
const RING_R$1 = 5.5;
const RING_W = 2.2;
const RING_SLOT = 17;
const MIX_GAP = 2;
const stripesOf = (filled, y, uid) => `<defs><pattern id="st${uid}" width="${STRIPE}" height="${STRIPE}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${STRIPE / 2}" height="${STRIPE}" fill="#fff" opacity=".28"/></pattern></defs><rect x="0" y="${y}" width="${filled}" height="${TRACK_H}" fill="url(#st${uid})"/>`;
const FILL$4 = { running: "f-edit", done: "m", failed: "f-danger" };
const LABEL$2 = { running: "s", done: "m", failed: "f-danger" };
const progressBarSvg = (W, a, opts) => {
  const y = (BAR_H$1 - TRACK_H) / 2;
  const barW = Math.max(TRACK_H, W - PCT_W - PCT_GAP);
  const filled = Math.max(TRACK_H, Math.round(barW * opts.progress.value));
  const uid = a.id.replace(/\W/g, "");
  const track = `<rect class="k" x="0" y="${y}" width="${barW}" height="${TRACK_H}" rx="${TRACK_H / 2}"/>`;
  const clip = `<clipPath id="cl${uid}"><rect x="0" y="${y}" width="${filled}" height="${TRACK_H}" rx="${TRACK_H / 2}"/></clipPath>`;
  const bar = `<rect data-m-fill="" class="${FILL$4[a.status] ?? "f-edit"}" x="0" y="${y}" width="${filled}" height="${TRACK_H}"/>`;
  const isRunning = a.status === "running";
  const stripes = isRunning && opts.progress.isEstimate ? stripesOf(filled, y, uid) : "";
  const label = `<text class="${LABEL$2[a.status] ?? "s"}" x="${barW + PCT_GAP}" y="${BAR_H$1 / 2 + PCT_SIZE * 0.34}" font-family="${MONO$4}" font-size="${PCT_SIZE}" font-weight="650">${xml(opts.label)}</text>`;
  return paneSvg(W, BAR_H$1, `${track}<defs>${clip}</defs><g clip-path="url(#cl${uid})">${bar}${stripes}</g>${label}`);
};
const ringOf = (x, ring) => {
  const c = 2 * Math.PI * RING_R$1;
  const dash = Math.max(0.6, Math.min(1, ring.ratio) * c);
  const cx = x + CHIP_PAD + RING_R$1 - 1;
  const cy = CHIPS_H / 2;
  return `<circle cx="${cx}" cy="${cy}" r="${RING_R$1}" fill="none" class="rk" stroke-width="${RING_W}"/>` + `<circle cx="${cx}" cy="${cy}" r="${RING_R$1}" fill="none" class="i-s" stroke-width="${RING_W}" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`;
};
const chipWidth = (chip) => Math.ceil(textWidth(chip.text, CHIP_TEXT)) + CHIP_PAD * 2 + (chip.ring ? RING_SLOT : 0);
const chipsSvg = (W, chips) => {
  let x = 0;
  let y = 0;
  const parts = [];
  for (const chip of chips) {
    const w = Math.min(W, chipWidth(chip));
    if (x > 0 && x + w > W) {
      x = 0;
      y += CHIPS_H + CHIP_GAP$1;
    }
    const tx = x + CHIP_PAD + (chip.ring ? RING_SLOT : 0);
    parts.push(`<rect class="chip" x="${x}" y="${y}" width="${w}" height="${CHIPS_H}" rx="${CHIPS_H / 2}"/>`);
    if (chip.ring)
      parts.push(`<g transform="translate(0,${y})">${ringOf(x, chip.ring)}</g>`);
    parts.push(`<text class="s" x="${tx}" y="${y + CHIPS_H / 2 + 4}" font-family="${FONT$3}" font-size="${CHIP_TEXT}" font-weight="500" font-variant-numeric="tabular-nums">${xml(chip.text)}</text>`);
    x += w + CHIP_GAP$1;
  }
  const height = y + CHIPS_H;
  return { source: paneSvg(W, height, parts.join("")), height };
};
const mixSvg = (W, parts) => {
  const total = parts.reduce((sum, p) => sum + p.count, 0);
  if (!total)
    return paneSvg(W, MIX_H, `<rect class="k" width="${W}" height="${MIX_H}" rx="${MIX_H / 2}"/>`);
  const room = W - MIX_GAP * (parts.length - 1);
  let x = 0;
  const segs = parts.map((p) => {
    const w = Math.max(MIX_H, room * p.count / total);
    const seg = `<rect class="m" x="${x.toFixed(1)}" width="${w.toFixed(1)}" height="${MIX_H}" rx="${MIX_H / 2}"/>`;
    x += w + MIX_GAP;
    return seg;
  });
  return paneSvg(W, MIX_H, segs.join(""));
};

const SECOND$4 = 1000;
const PATH$1 = /^[~.]?\//;
const agoOf = (ms) => ms < SECOND$4 ? t().now : t().ago(roughSpan(ms));
const stateOf$1 = (a, last) => {
  if (a.status !== "running")
    return a.status;
  if (!last)
    return "starting";
  return last.endAt === undefined ? "call" : "thinking";
};
const verbOf = (a, state, kind) => {
  const s = t();
  const last = a.history?.at(-1);
  if (state === "call")
    return last?.why ?? last?.plain ?? s.doing[kind];
  if (state === "thinking")
    return s.thinking;
  if (state === "starting")
    return s.starting;
  if (state === "done")
    return s.completed;
  return a.endReason === "aborted" ? s.aborted : s.failedNow;
};
function nowOf(a, at) {
  const last = a.history?.at(-1);
  const state = stateOf$1(a, last);
  const kind = last ? kindOf$1(last.tool) : "other";
  const isLatest = last !== undefined && last.tool === a.lastTool;
  const target = (isLatest ? a.lastDetail : undefined) ?? last?.target ?? "";
  const verb = verbOf(a, state, kind);
  if (!last)
    return { state, kind, verb, tool: "", target: "", isPath: false, span: "" };
  const span = state === "call" ? roughSpan(at - last.at) : agoOf(at - last.at);
  const said = state === "call" ? undefined : last.why ?? last.plain;
  if (said)
    return { state, kind, verb, tool: said, target: "", isPath: false, span };
  return { state, kind, verb, tool: last.tool, target, isPath: PATH$1.test(target), span };
}

const RECENT_SHOWN = 8;
const FILES_SHOWN$3 = 6;
const KIND_ORDER = ["read", "edit", "run", "agent", "other"];
const NOW_KEY = { call: "claude", thinking: "claude", starting: "claude", done: "subtle", failed: "error" };
const capital = (s) => upper$3(s.charAt(0)) + s.slice(1);
function nowText(ui, now) {
  const { Box, Text } = ui;
  const key = NOW_KEY[now.state];
  const glyph = now.state === "call" ? KIND_GLYPH[now.kind] : "●";
  return h(Box, {
    flexDirection: "column"
  }, h(Text, {
    wrap: "truncate-end"
  }, h(Text, {
    color: key
  }, `${glyph} `), h(Text, {
    bold: true,
    color: key
  }, capital(now.verb)), now.span ? h(Text, {
    dimColor: true
  }, ` · ${now.span}`) : null), now.tool ? h(Box, {
    flexDirection: "row",
    columnGap: 1,
    paddingLeft: 2
  }, h(Text, {
    bold: true
  }, now.tool), h(Box, {
    flexShrink: 1
  }, h(Text, {
    dimColor: true,
    wrap: now.isPath ? "truncate-start" : "truncate-end"
  }, now.target))) : null);
}
function deskNow(ui, a, now, ctx) {
  const alt = [now.verb, now.span, now.tool, now.target].filter(Boolean).join(" · ");
  return picture$2(ui, { key: "now", at: `now-${a.id}`, pic: { source: nowSvg(ctx.inner, now), alt, width: ctx.inner, height: NOW_H } });
}
function nowTree(ui, a, ctx) {
  const { Box, Text } = ui;
  const s = t();
  const now = nowOf(a, ctx.at);
  const steps = stepsOf$1(a);
  const heading = h(Text, {
    bold: true
  }, a.status === "running" ? s.current : s.lastStep);
  return h(Box, {
    flexDirection: "column",
    rowGap: ctx.isDesktop ? 1 : 0
  }, ctx.isDesktop && now.span ? h(Box, {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 1
  }, heading, h(Text, {
    dimColor: true
  }, now.span)) : heading, ctx.isDesktop ? deskNow(ui, a, now, ctx) : nowText(ui, now), steps ? h(Text, {
    dimColor: true,
    wrap: "truncate-end"
  }, `${s.tasks} ${steps}`) : null);
}
const outcomeOf = (e, isLive) => {
  if (e.endAt !== undefined)
    return e.isError ? { glyph: "✗", key: "error" } : { glyph: "✓", key: "subtle" };
  return { glyph: isLive ? "…" : "—", key: "subtle" };
};
function eventTree(ui, e, ctx) {
  const { Box, Text } = ui;
  const kind = kindOf$1(e.tool);
  const outcome = outcomeOf(e, ctx.isLive);
  const said = e.why ?? e.plain;
  const fine = e.why && e.plain ? ` · ${e.plain}` : `${said ? ` · ${e.tool}` : ""}${e.target ? ` ${e.target}` : ""}`;
  const pulse = { source: pulseSvg(), alt: t().isRunning, width: PULSE, height: PULSE };
  const end = e.endAt === undefined && ctx.isLive && ctx.isDesktop ? picture$2(ui, { key: "live", at: `live-${ctx.id}-${ctx.index}`, pic: pulse }) : h(Text, {
    color: outcome.key
  }, outcome.glyph);
  return h(Box, {
    key: `ev-${ctx.index}`,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 1
  }, h(Text, {
    dimColor: true
  }, KIND_GLYPH[kind]), h(Box, {
    flexGrow: 1,
    flexShrink: 1
  }, h(Text, {
    wrap: "truncate-end"
  }, said ? h(Text, null, said) : h(Text, {
    bold: true
  }, e.tool), fine ? h(Text, {
    dimColor: true
  }, fine) : null)), h(Box, {
    flexShrink: 0,
    flexDirection: "row",
    columnGap: 1,
    alignItems: "center"
  }, h(Text, {
    dimColor: true
  }, agoOf(ctx.at - e.at)), end));
}
const mixOf = (history) => KIND_ORDER.map((kind) => ({ kind, count: history.filter((e) => kindOf$1(e.tool) === kind).length })).filter((p) => p.count > 0);
function mixTree(ui, parts, ctx) {
  const { Box, Text } = ui;
  if (!parts.length)
    return null;
  const s = t();
  const words = parts.map((p) => `${s.kinds[p.kind]} ${p.count}`).join(" · ");
  const legend = parts.map((p, i) => h(Text, {
    key: `k-${p.kind}`
  }, h(Text, {
    dimColor: true
  }, `${KIND_GLYPH[p.kind]} `), h(Text, {
    dimColor: true
  }, `${s.kinds[p.kind]} ${p.count}${i < parts.length - 1 ? "   " : ""}`)));
  return h(Box, {
    flexDirection: "column",
    rowGap: ctx.isDesktop ? 1 : 0
  }, ctx.isDesktop && picture$2(ui, { key: "mix", at: `mix-${ctx.id}`, pic: { source: mixSvg(ctx.inner, parts), alt: words, width: ctx.inner, height: MIX_H } }), h(Text, {
    wrap: "truncate-end"
  }, legend));
}
function historyTree(ui, a, ctx) {
  const { Box, Text } = ui;
  const s = t();
  const list = a.history ?? [];
  const shown = list.slice(-RECENT_SHOWN);
  const hidden = list.length - shown.length;
  const isLive = a.status === "running";
  const isLog = ctx.logOpen === a.id;
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, h(Text, {
    bold: true
  }, `${isLog ? s.log : s.history} · ${s.tools(list.length)}`), mixTree(ui, mixOf(list), { ...ctx, id: a.id }), isLog ? logTree(ui, a) : h(Box, {
    flexDirection: "column"
  }, hidden > 0 && h(Text, {
    dimColor: true
  }, s.earlier(hidden)), shown.map((e, i) => eventTree(ui, e, { ...ctx, id: a.id, isLive, index: hidden + i }))), logButton(ui, a, ctx));
}
const fileWords = (f) => {
  const s = t();
  return [f.edits ? `${s.kinds.edit} ${f.edits}` : "", f.reads ? `${s.kinds.read} ${f.reads}` : ""].filter(Boolean).join(" · ");
};
function fileText(ui, f) {
  const { Text } = ui;
  const kind = f.edits ? "edit" : "read";
  const counts = [f.edits ? `${KIND_GLYPH.edit}${f.edits}` : "", f.reads ? `${KIND_GLYPH.read}${f.reads}` : ""].filter(Boolean).join(" ");
  return h(Text, {
    key: `file-${f.path}`,
    wrap: "truncate-middle"
  }, h(Text, {
    dimColor: true
  }, `${KIND_GLYPH[kind]} `), h(Text, null, shortPath(f.path)), h(Text, {
    dimColor: true
  }, `  ${counts}`));
}
function filesTree(ui, a, ctx) {
  const { Box, Text } = ui;
  const all = filesShown(a.files ?? []);
  if (!all.length)
    return null;
  const s = t();
  const shown = all.slice(0, FILES_SHOWN$3);
  const more = all.length - shown.length;
  const drawn = ctx.isDesktop ? filesSvg(ctx.inner, shown) : null;
  const alt = shown.map((f) => `${f.path} (${fileWords(f)})`).join(", ");
  const links = filesMarkdown(shown.map((f) => f.path));
  return h(Box, {
    flexDirection: "column",
    rowGap: ctx.isDesktop ? 1 : 0
  }, h(Text, {
    bold: true
  }, `${s.files} · ${all.length}`), drawn ? picture$2(ui, { key: "files", at: `files-${a.id}`, pic: { source: drawn.source, alt, width: ctx.inner, height: drawn.height } }) : shown.map((f) => fileText(ui, f)), ui.Markdown && links ? h(ui.Markdown, {
    key: `file-links-${a.id}`,
    dimColor: true,
    text: links
  }) : null, more > 0 && h(Text, {
    dimColor: true
  }, s.moreFiles(more)));
}

const PERCENT$3 = 100;
const limitShareOf = (a, limit) => shareOf(a.costUsd, limit);
const usageChipsOf = (a, limit) => {
  const s = t();
  const ctx = ctxOf(a);
  const cost = costText$1(a);
  const share = cost === "" ? null : limitShareOf(a, limit);
  const chips = [
    { text: `${s.context} ${s.pct(ctx)}`, ring: { ratio: ctx / PERCENT$3 } },
    { text: `${fmtTokens(a.tokens)} ${s.tokensWord}` },
    ...cost === "" ? [] : [{ text: cost }]
  ];
  if (share !== null)
    chips.push({ text: `${s.limit} ≈${s.pct(shareNumber(share))}`, ring: { ratio: share / PERCENT$3 } });
  return chips;
};
const chipsOf$1 = (a, facts) => [{ text: `${t().time} ${fmtTime(elapsed(a, facts.at))}` }, ...usageChipsOf(a, facts.limit)];
const metricsLine = (a, facts) => chipsOf$1(a, facts).map((chip) => chip.text).join(" · ");
const progressLabel = (p) => `${p.isEstimate ? "~" : ""}${t().pct(Math.round(p.value * PERCENT$3))}`;

const SIDE_BY_SIDE_PX = 480;
function metricsTree(ui, a, ctx) {
  const { Text } = ui;
  const facts = { limit: ctx.limit, at: ctx.at };
  const line = metricsLine(a, facts);
  if (!ctx.isDesktop)
    return h(Text, {
      dimColor: true,
      wrap: "truncate-end"
    }, line);
  const width = ctx.inner;
  const chips = chipsSvg(width, a.status === "running" ? usageChipsOf(a, ctx.limit) : chipsOf$1(a, facts));
  return picture$2(ui, { key: "chips", at: `chips-${a.id}`, pic: { source: chips.source, alt: line, width, height: chips.height } });
}
function actionsTree(ui, a, ctx) {
  const { Box, Button, Input } = ui;
  if (a.isMain === true)
    return null;
  const s = t();
  const name = lookOf$1(a).name;
  const isRunning = a.status === "running";
  const field = Input && h(Input, {
    key: `send-${a.id}`,
    label: s.message,
    placeholder: isRunning ? s.messageTo(name) : s.followUp(name),
    value: "",
    submitLabel: s.send,
    onSubmit: (text) => ctx.onSend(a.id, text)
  });
  if (!isRunning)
    return field ? h(Box, {
      key: `actions-${a.id}`,
      flexDirection: "column"
    }, field) : null;
  const stop = h(Button, {
    key: `stop-${a.id}`,
    variant: "secondary",
    label: s.stopWho(name),
    onPress: () => ctx.onStop(a.id)
  });
  if (!ctx.isDesktop || ctx.inner < SIDE_BY_SIDE_PX) {
    return h(Box, {
      key: `actions-${a.id}`,
      flexDirection: "column",
      rowGap: ctx.isDesktop ? 1 : 0
    }, field, h(Box, {
      flexDirection: "row",
      justifyContent: ctx.isDesktop ? "flex-end" : "flex-start"
    }, stop));
  }
  return h(Box, {
    key: `actions-${a.id}`,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 1
  }, field && h(Box, {
    flexDirection: "column",
    flexGrow: 1,
    flexShrink: 1
  }, field), stop);
}
function detailTree(ui, a, ctx) {
  const { Box } = ui;
  const hasWork = (a.history?.length ?? 0) > 0;
  return h(Box, {
    key: `detail-${a.id}`,
    flexDirection: "column",
    rowGap: 1,
    marginTop: 1
  }, conversationTree(ui, a, ctx), actionsTree(ui, a, ctx), hasWork && nowTree(ui, a, ctx), hasWork && historyTree(ui, a, ctx), filesTree(ui, a, ctx), metricsTree(ui, a, ctx));
}

const CURVE_CAP = 0.9;
const CURVE_CALLS = 8;
const EDIT_FLOOR = 0.45;
const TEST_FLOOR = 0.7;
const START = 0.04;
const TEST_WORDS = /\b(test|vitest|jest|pytest|lint|tsc|validate|check)\b/i;
const floorOf = (a) => {
  const history = a.history ?? [];
  const hasTest = history.some((e) => kindOf$1(e.tool) === "run" && TEST_WORDS.test(e.target));
  if (hasTest)
    return TEST_FLOOR;
  return history.some((e) => kindOf$1(e.tool) === "edit") ? EDIT_FLOOR : 0;
};
const estimateOf$1 = (a) => {
  const calls = Math.max(a.toolCount || 0, a.history?.length ?? 0);
  const curve = CURVE_CAP * (1 - Math.exp(-calls / CURVE_CALLS));
  return Math.min(CURVE_CAP, Math.max(START, floorOf(a), curve));
};
const agentProgress = (a) => {
  if (a.status !== "running")
    return { value: 1, isEstimate: false };
  const measured = partialOf(a);
  return measured === null ? { value: estimateOf$1(a), isEstimate: true } : { value: measured, isEstimate: false };
};

const FRAME_PX = 34;
const FRAME_COLS = 4;
const GAP_PX = 8;
const TERM_BAR_MAX = 24;
const PCT_COLS = 6;
const COST_COLS = 8;
const ANSWER_LINE = 120;
const BODY_PX = 14;
const GLYPH$1 = { running: "●", done: "✓", failed: "✗" };
const STATUS_KEY = { running: "claude", done: "subtle", failed: "error" };
const whoLine = (a) => {
  const tier = tierWordOf(a);
  return [tier, ...modelLine(a).split(" · ").filter((part) => part !== tier)].join(" · ");
};
const statusWord = (a) => {
  const s = t();
  if (a.status === "running")
    return s.isRunning;
  if (a.status === "done")
    return s.isFinished;
  return a.endReason === "aborted" ? s.aborted : s.failed;
};
const pillOf = (a, stuck) => {
  if (stuck)
    return { text: stuck.reason, role: "warn" };
  if (a.status === "running")
    return { text: statusWord(a), role: "run" };
  if (a.status === "done")
    return { text: statusWord(a), role: "ok" };
  return { text: statusWord(a), role: a.endReason === "aborted" ? "warn" : "danger" };
};
const headOf = (a, stuck) => ({
  name: lookOf$1(a).name,
  title: a.description || a.type,
  pill: pillOf(a, stuck)
});
const nowLine = (a, isOpen) => {
  const answer = a.status === "done" && !isOpen ? a.answer?.split(`
`).find((line) => line.trim()) : undefined;
  if (answer)
    return clip$4(answer.trim(), ANSWER_LINE);
  if (a.status === "failed" && a.lastTool)
    return `› ${a.lastPlain ?? `${a.lastTool}${a.lastTarget ? " " + a.lastTarget : ""}`}`;
  return activityOf(a);
};
const barLabel = (a, progress) => {
  if (a.status === "failed")
    return "✗";
  return progress.isEstimate && !a.toolCount ? "" : progressLabel(progress);
};
const termBar = (p, width) => {
  const filled = Math.round(width * p.value);
  return (p.isEstimate ? "╍" : "━").repeat(filled) + "─".repeat(Math.max(0, width - filled));
};
function termBarTree(ui, a, ctx) {
  const { Box, Text } = ui;
  const progress = agentProgress(a);
  const width = Math.max(6, Math.min(TERM_BAR_MAX, ctx.inner - PCT_COLS - COST_COLS));
  const key = STATUS_KEY[a.status] ?? "claude";
  return h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    color: key,
    dimColor: progress.isEstimate
  }, termBar(progress, width)), h(Text, {
    bold: true,
    color: key
  }, barLabel(a, progress)), h(Text, null, costText$1(a)));
}
function termStatus(ui, a, stuck) {
  const { Text } = ui;
  if (stuck)
    return h(Text, {
      color: "warning"
    }, `! ${stuck.reason}`);
  return h(Text, {
    color: STATUS_KEY[a.status] ?? "subtle"
  }, `${GLYPH$1[a.status] ?? "●"} ${statusWord(a)}`);
}
function termSummary(ui, a, ctx) {
  const { Box, Text, Button } = ui;
  const isOpen = ctx.selected === a.id;
  return h(Box, {
    flexDirection: "column",
    flexGrow: 1,
    flexShrink: 1
  }, h(Box, {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 1
  }, h(Button, {
    key: `open-${a.id}`,
    plain: true,
    label: `${isOpen ? "▾" : "▸"} ${a.description || a.type}`,
    hover: { color: "claude" },
    onPress: () => ctx.onToggle(a.id)
  }), termStatus(ui, a, stuckOf(a, ctx.at))), termBarTree(ui, a, ctx), h(Box, {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 1
  }, h(Text, {
    wrap: "truncate-end"
  }, h(Text, {
    bold: true
  }, lookOf$1(a).name), h(Text, {
    dimColor: true
  }, ` · ${[whoLine(a), t().tools(a.toolCount || 0)].filter(Boolean).join(" · ")}`)), h(Text, {
    dimColor: true
  }, clockOf(a, ctx.at))), a.status !== "done" && h(Text, {
    wrap: "truncate-end",
    dimColor: a.status !== "running"
  }, activityOf(a)));
}
function termCard(ui, a, ctx) {
  const { Box } = ui;
  const isOpen = ctx.selected === a.id;
  const frame = isOpen ? { borderStyle: "round", paddingX: 1 } : {};
  return h(Box, {
    key: a.id,
    flexDirection: "column",
    ...frame
  }, termSummary(ui, a, isOpen ? { ...ctx, inner: ctx.inner - FRAME_COLS } : ctx), isOpen && detailTree(ui, a, { ...ctx, inner: ctx.inner - FRAME_COLS }));
}
function deskHead(ui, a, ctx) {
  const { Box } = ui;
  const look = lookOf$1(a);
  const stuck = stuckOf(a, ctx.at);
  const isOpen = ctx.selected === a.id;
  const head = headOf(a, stuck);
  const headW = ctx.inner - CARD_CRAB.w;
  const crab = cardCrabSvg({ costume: costumeOf(a), look, isWalking: a.status === "running" && !stuck });
  const alt = `${head.title}: ${head.name} · ${whoLine(a)} · ${head.pill.text} (${isOpen ? t().hide : t().details})`;
  return h(Box, {
    flexDirection: "row",
    alignItems: "center"
  }, picture$2(ui, { key: "crab", at: `crab-${a.id}`, pic: { source: crab, alt: `${look.name}, ${tierWordOf(a)}`, width: CARD_CRAB.w, height: CARD_CRAB.h } }), picture$2(ui, { key: "head", at: `head-${a.id}`, pic: { source: cardHeadSvg(headW, head, GAP_PX), alt, width: headW, height: HEAD_H$1 } }));
}
function deskFoot(ui, a, ctx) {
  const { Box, Text } = ui;
  const isOpen = ctx.selected === a.id;
  const meta = [t().tools(a.toolCount || 0), clockOf(a, ctx.at), costText$1(a), whoLine(a)].filter(Boolean).join(" · ");
  return h(Box, {
    key: "foot",
    flexDirection: "column"
  }, h(Text, {
    wrap: "truncate-end",
    dimColor: a.status !== "running"
  }, fitText(nowLine(a, isOpen), BODY_PX, ctx.inner)), h(Text, {
    wrap: "truncate-end",
    dimColor: true
  }, fitText(meta, BODY_PX, ctx.inner)));
}
function deskBar(ui, a, ctx) {
  const progress = agentProgress(a);
  const label = barLabel(a, progress);
  const pic = { source: progressBarSvg(ctx.inner, a, { progress, label }), alt: label || t().starting, width: ctx.inner, height: BAR_H$1 };
  return picture$2(ui, { key: "bar", at: `bar-${a.id}`, pic, opts: { shows: { status: a.status, isEstimate: progress.isEstimate } } });
}
function deskCard(ui, a, ctx) {
  const { Box } = ui;
  const isOpen = ctx.selected === a.id;
  return h(Box, {
    key: a.id,
    flexDirection: "column"
  }, h(Box, {
    key: "row",
    flexDirection: "column",
    alignSelf: "flex-start"
  }, h(Box, {
    key: "head-row",
    alignSelf: "flex-start"
  }, deskHead(ui, a, ctx), PressCover$2(ui, { key: `open-${a.id}`, width: ctx.inner, height: HEAD_H$1, onPress: () => ctx.onToggle(a.id) })), deskBar(ui, a, ctx), deskFoot(ui, a, ctx)), isOpen && detailTree(ui, a, ctx));
}
const agentRow = (ui, a, ctx) => ctx.isDesktop ? deskCard(ui, a, ctx) : termCard(ui, a, ctx);
function plannedRow(ui, p, ctx) {
  const { Box, Text } = ui;
  const tier = plannedTierOf(p.tier);
  const crab = { source: crabSvg({ costume: tier, isDim: true }), alt: tier, width: CRAB$1.w, height: CRAB$1.h };
  return h(Box, {
    key: `plan-${p.n}`,
    flexDirection: "row",
    columnGap: 1,
    alignItems: "center"
  }, ctx.isDesktop ? picture$2(ui, { key: "crab", at: `plan-crab-${p.n}`, pic: crab }) : h(Text, {
    dimColor: true
  }, "○"), h(Box, {
    flexDirection: "column",
    flexGrow: 1
  }, h(Text, {
    dimColor: true,
    wrap: "truncate-end"
  }, `${p.n}. ${p.title}`), h(Text, {
    wrap: "truncate-end"
  }, h(Text, {
    dimColor: true
  }, [tier, plannedLine(p)].filter(Boolean).join(" · ")))));
}

const MIN_W = 240;
const MAX_W = 900;
const PX_PER_COL = 9;
const ROWS_MAX = 12;
const isDoneOpenIn = (shown, d) => shown.isDoneOpen ?? d.running.length === 0;
function listTree(ui, view) {
  const { Box, Text } = ui;
  const { d, layout, on } = view;
  const s = t();
  const ctx = { ...on, at: d.at, isDesktop: layout.isDesktop, inner: layout.isDesktop ? layout.W : layout.inner, limit: d.limit, selected: d.panel.selected, briefOpen: d.panel.briefOpen, logOpen: d.panel.logOpen };
  const isDoneOpen = isDoneOpenIn(d.panel, d);
  const running = d.running.slice(0, ROWS_MAX);
  const finished = isDoneOpen ? d.finished.slice(0, ROWS_MAX - running.length) : [];
  const planned = d.planned.slice(0, ROWS_MAX - running.length - finished.length);
  const more = d.running.length + (isDoneOpen ? d.finished.length : 0) + d.planned.length - running.length - finished.length - planned.length;
  return h(Box, {
    key: "list",
    flexDirection: "column",
    rowGap: 1
  }, d.running.length > 0 && sectionHead(ui, layout, { id: "running", label: `${s.running} · ${d.running.length}` }), running.map((a) => agentRow(ui, a, ctx)), d.finished.length > 0 && sectionHead(ui, layout, { id: "finished", label: `${s.finished} · ${d.finished.length}`, toggle: { key: "done", isOpen: isDoneOpen, onPress: on.onDone } }), finished.map((a) => agentRow(ui, a, ctx)), d.planned.length > 0 && sectionHead(ui, layout, { id: "planned", label: `${s.planned} · ${d.planned.length}` }), planned.map((p) => plannedRow(ui, p, ctx)), more > 0 && h(Text, {
    key: "more",
    dimColor: true
  }, s.moreAgents(more)));
}
function paneTree$3(ui, view) {
  const { Box } = ui;
  const { d, layout, on } = view;
  const isDrafting = d.panel.draft?.isOpen === true;
  const form = isDrafting && draftTree(ui, { draft: d.panel.draft, types: d.types, layout }, on);
  if (d.list.length === 0 && d.planned.length === 0) {
    return h(Box, {
      flexDirection: "column",
      rowGap: 2
    }, isDrafting ? form : emptyTree(ui, view));
  }
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, headTree(ui, d, layout), toolbarTree(ui, d, on), attentionTree(ui, view), form, d.panel.isCompact ? compactTree(ui, d, layout) : timelineTree(ui, view), !d.panel.isCompact && listTree(ui, view));
}
function agentsTree(ui, view) {
  const { Box, Text } = ui;
  const { d, layout, on } = view;
  const listed = listedChats(d.chats);
  const quiet = quietTree(ui, { chats: listed.chats, layout, isOpen: d.panel.isChatsOpen === true, onToggle: on.onChats });
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, waitingTree(ui, d.chats, layout), paneTree$3(ui, view), crewTree(ui, listed.chats, layout), quiet, listed.more > 0 && h(Text, {
    key: "chats-more",
    dimColor: true
  }, t().chats.more(listed.more)));
}
const layoutOf = (isDesktop, columns) => {
  if (!isDesktop)
    return { isDesktop, W: 0, inner: columns, cols: columns };
  const W = Math.max(MIN_W, Math.min(MAX_W, columns * PX_PER_COL));
  return { isDesktop, W, inner: W - FRAME_PX, cols: columns - FRAME_COLS };
};

const AGENTS = { plugin: "savvy-progress", key: "agents" };
const FLOW = { plugin: "savvy-progress", key: "flow" };
const JOB = { plugin: "savvy-progress", key: "job" };
const TASKS$1 = { plugin: "savvy-progress", key: "tasks" };
const PANEL = { plugin: "savvy-progress", key: "panel" };
const LIMIT = { plugin: "savvy-progress", key: "limit" };
const TYPES$1 = { plugin: "savvy-progress", key: "types" };
const CRAB = { plugin: "savvy-progress", key: "crab" };
const CHATS = { plugin: "savvy-progress", key: "chats" };
async function speakHubLang($) {
  setLang$3(langOf$3(await $.env.get("MODZ_LANG").catch(() => {
    return;
  })) ?? "en");
}
async function agentsPage($, ui, site, act) {
  await speakHubLang($);
  const kept = {
    list: (await $.state.get(AGENTS)).value ?? [],
    flow: (await $.state.get(FLOW)).value ?? null,
    job: (await $.state.get(JOB)).value ?? null,
    tasks: (await $.state.get(TASKS$1)).value ?? [],
    now: await $.clock.now(),
    panel: (await $.state.get(PANEL)).value ?? { isCompact: false },
    limit: (await $.state.get(LIMIT)).value ?? null,
    types: (await $.state.get(TYPES$1)).value ?? BUILTIN_TYPES,
    crab: (await $.state.get(CRAB)).value ?? restingCrab(0),
    chats: (await $.state.get(CHATS)).value ?? []
  };
  const isDesktop = site.surface === "desktop" && "Svg" in ui;
  return agentsTree(ui, { d: paneDataOf(kept), layout: layoutOf(isDesktop, site.columns), on: pageHandlers(act) });
}

let current$3 = "en";
const langOf$2 = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang$2(value) {
  current$3 = langOf$2(value);
  return current$3;
}
const pick$3 = (table) => table[current$3];
const upper$2 = (text) => text.toLocaleUpperCase(current$3);

const FILL$3 = /<rect\b[^>]*\bdata-m-fill\b[^>]*>/g;
const DONE$3 = /<path\b[^>]*\bdata-m-done\b[^>]*>/g;
const HAS_DONE$3 = /\bdata-m-done\b/;
const WIDTH$6 = /\swidth="([\d.]+)"/;
const CLASS$3 = /\sclass="([^"]*)"/;
const STYLE$3 = /\sstyle="([^"]*)"/;
const MIN_RATIO_STEP$3 = 0.02;
const RATIO_DIGITS$3 = 3;
const widthOf$3 = (tag) => Number(WIDTH$6.exec(tag)?.[1] ?? 0);
function withClass$3(tag, name, extra = "") {
  const tagged = CLASS$3.test(tag) ? tag.replace(CLASS$3, (_, classes) => ` class="${classes} ${name}"`) : tag.replace(/\s*\/?>$/, ` class="${name}"$&`);
  return tagged.replace(/\s*\/?>$/, `${extra}$&`);
}
function slideFills$3(before, now) {
  const old = before.match(FILL$3) ?? [];
  if (old.length !== (now.match(FILL$3) ?? []).length)
    return now;
  let index = 0;
  return now.replace(FILL$3, (tag) => {
    const was = old[index++];
    const from = was === undefined ? 0 : widthOf$3(was);
    const to = widthOf$3(tag);
    if (from <= 0 || to <= 0 || Math.abs(from - to) / to < MIN_RATIO_STEP$3)
      return tag;
    const slide = `--m-from:${(from / to).toFixed(RATIO_DIGITS$3)}`;
    const styled = STYLE$3.test(tag) ? tag.replace(STYLE$3, (_, rules) => ` style="${slide};${rules}"`) : tag.replace(/\s*\/?>$/, ` style="${slide}"$&`);
    return withClass$3(styled, "m-from");
  });
}
function drawDone$3(before, now) {
  if (HAS_DONE$3.test(before))
    return now;
  return now.replace(DONE$3, (tag) => withClass$3(tag, "m-draw", ' pathLength="1"'));
}
function markChanges$3(before, now) {
  return drawDone$3(before, slideFills$3(before, now));
}

const STAGGER_MS$3 = 45;
const EASE$3 = "cubic-bezier(.2,.8,.2,1)";
const SHEEN$3 = "#A39E93";
const RULES$3 = {
  "m-in": `.m-in{animation:m-in .42s ${EASE$3} both}@keyframes m-in{from{opacity:0;transform:translateY(8px)}}`,
  "m-fade": `.m-fade{animation:m-fade .5s ${EASE$3} both}@keyframes m-fade{from{opacity:0}}`,
  "m-grow": `.m-grow{transform-box:fill-box;transform-origin:left center;animation:m-grow .7s ${EASE$3} both}@keyframes m-grow{from{transform:scaleX(0)}}`,
  "m-px": `.m-px{transform-box:fill-box;transform-origin:center;animation:m-px .34s ${EASE$3} both}@keyframes m-px{from{opacity:0;transform:translateY(-10px) scale(.6)}}`,
  "m-flash": ".m-flash{opacity:0;animation:m-flash 1.6s ease-out both}@keyframes m-flash{from{opacity:.9}to{opacity:0}}",
  "m-from": `.m-from{transform-box:fill-box;transform-origin:left center;animation:m-from .32s ${EASE$3} both}@keyframes m-from{from{transform:scaleX(var(--m-from))}}`,
  "m-draw": `.m-draw{stroke-dasharray:1;animation:m-draw .32s ${EASE$3} .12s both}@keyframes m-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}`,
  "m-breathe": ".m-breathe{animation:m-breathe 1.8s ease-in-out infinite}@keyframes m-breathe{50%{opacity:.4}}",
  "m-ring": ".m-ring{transform-box:fill-box;transform-origin:center;animation:m-ring 1.8s ease-out infinite}@keyframes m-ring{from{opacity:.55;transform:scale(1)}to{opacity:0;transform:scale(2.8)}}",
  "m-wash": `.m-wash{fill:#8E8A80;opacity:0;transition:opacity .12s ${EASE$3}}svg:hover .m-wash{opacity:.12}`,
  "m-tile": `.m-tile{transform-box:fill-box;transform-origin:center;transition:transform .2s ${EASE$3}}svg:hover .m-tile{transform:translateY(-1px) scale(1.06)}`
};
const REDUCED$4 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function motionCss$3(body) {
  const used = Object.keys(RULES$3).filter((name) => new RegExp(`\\b${name}\\b`).test(body));
  return used.length === 0 ? "" : `${used.map((name) => RULES$3[name]).join("")}${REDUCED$4}`;
}
Object.values(RULES$3).join("");
const isEntering$3 = (cue) => cue.phase === "enter";
function entering$3(body, cue, kind = "in") {
  if (!isEntering$3(cue))
    return body;
  return `<g class="m-${kind}" style="animation-delay:${cue.order * STAGGER_MS$3}ms">${body}</g>`;
}
const FLASH$3 = `<rect x="0" y="0" width="100%" height="100%" rx="10" fill="${SHEEN$3}" fill-opacity=".22" class="m-flash"/>`;
const WASH$3 = '<rect x="0" y="0" width="100%" height="100%" rx="10" class="m-wash"/>';

function stableDrawings$3() {
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

const TAG_WIDTH$3 = /^[\s\S]*?<svg\b[^>]*?\swidth="([\d.]+)"/;
const SVG$3 = /^([\s\S]*?<svg\b[^>]*>)([\s\S]*)(<\/svg>\s*)$/;
const SCHEME$4 = "<style>:root{color-scheme:light dark}</style>";
const SAYS_SCHEME$3 = /(^|[^-\w])color-scheme\s*:/;
const PASS_MS$3 = 120;
const MAX_ORDER$3 = 12;
const LIVE_MS$3 = 30000;
function animate$3(source, spec) {
  const moved = spec.cue.phase === "change" && spec.before !== undefined ? markChanges$3(spec.before, source) : source;
  const parts = SVG$3.exec(moved);
  if (parts === null)
    return source;
  const [, open, inner = "", close] = parts;
  const scheme = SAYS_SCHEME$3.test(inner) ? "" : SCHEME$4;
  const lit = `${spec.isRow === true ? WASH$3 : ""}${spec.cue.phase === "change" && spec.isLive !== true ? FLASH$3 : ""}${inner}`;
  const body = entering$3(lit, spec.cue);
  const css = motionCss$3(body);
  return `${open}${scheme}${css === "" ? "" : `<style>${css}</style>`}${body}${close}`;
}
function paneMotion$3() {
  const drawings = stableDrawings$3();
  const shown = new Map;
  const pass = { at: Number.NEGATIVE_INFINITY, entered: 0 };
  const begin = () => {
    const now = Date.now();
    if (now - pass.at > PASS_MS$3)
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
      const now = { shows: opts.shows === undefined ? what : JSON.stringify(opts.shows), width: String(pic.width ?? TAG_WIDTH$3.exec(pic.source)?.[1]), source: pic.source };
      const source = drawings.draw(key, what, (built) => {
        const order = built === "enter" ? Math.min(MAX_ORDER$3, pass.entered++) : 0;
        const before = shown.get(key);
        const isQuiet = before !== undefined && (before.shows === now.shows || before.width !== now.width);
        const phase = built === "change" && isQuiet ? "still" : built;
        const lastChange = before?.changedAt ?? Number.NEGATIVE_INFINITY;
        const isLive = phase === "change" && pass.at - lastChange < LIVE_MS$3;
        shown.set(key, { ...now, changedAt: phase === "change" ? pass.at : lastChange });
        return animate$3(pic.source, { cue: { phase, order }, isRow: opts.isRow, before: before?.source, isLive });
      });
      return { ...pic, source, isInteractive: true };
    }
  };
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

const AUTO$1 = { mode: "auto", isLight: false };
const NEUTRALS$2 = ["card", "inset", "line", "strong", "track", "hi", "mid", "lo"];
const ROLES$4 = ["tide", "kiln", "iris", "moss", "amber", "flare", "orchid"];
const DARK$3 = {
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
const LIGHT$3 = {
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
const THEME_KEY$1 = {
  tide: "suggestion",
  kiln: "claude",
  iris: "permission",
  moss: "success",
  amber: "warning",
  flare: "error",
  orchid: "merged"
};
const varsOf$1 = (palette) => [
  ...NEUTRALS$2.map((name) => `--${name}:${palette[name]}`),
  ...ROLES$4.flatMap((role) => [`--${role}:${palette[role].fg}`, `--${role}-t:${palette[role].tint}`, `--${role}-l:${palette[role].line}`])
].join(";");
function themeCss$1() {
  return `svg,.t-dark{${varsOf$1(DARK$3)}}.t-light{${varsOf$1(LIGHT$3)}}@media (prefers-color-scheme: light){.t-auto{${varsOf$1(LIGHT$3)}}}`;
}
function boxColor(theme, role, part = "fg") {
  if (theme.mode === "auto")
    return THEME_KEY$1[role];
  return (theme.isLight ? LIGHT$3 : DARK$3)[role][part];
}

const SANS$1 = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`;
const MONO$3 = `ui-monospace, 'SF Mono', Menlo, monospace`;
const PX_PER_COLUMN$3 = 9;
const MONO_EM$2 = 0.6;
const BOLD_FROM$1 = 600;
const BOLD_WIDEN$2 = 1.06;
const ENTITIES$1 = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const MOTION$2 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
const esc$1 = (text) => text.replace(/[&<>"]/g, (ch) => ENTITIES$1[ch] ?? ch);
const px$1 = (value) => String(Math.round(value * 10) / 10);
const NARROW_CHAR = /[\s.,:;'|!il1()[\]ıjtf`]/;
const WIDE_CHAR = /[A-ZÇĞİÖŞÜmwMW@%]/;
const NARROW_EM$2 = 0.3;
const WIDE_EM$2 = 0.72;
const PLAIN_EM = 0.56;
function charEm$1(ch) {
  if (NARROW_CHAR.test(ch))
    return NARROW_EM$2;
  return WIDE_CHAR.test(ch) ? WIDE_EM$2 : PLAIN_EM;
}
function measure$3(text, font) {
  const chars = [...text];
  const em = font.isMono === true ? chars.length * MONO_EM$2 : chars.reduce((sum, ch) => sum + charEm$1(ch), 0);
  const widen = (font.weight ?? 0) >= BOLD_FROM$1 ? BOLD_WIDEN$2 : 1;
  return em * font.size * widen;
}
function cut(text, box) {
  const { width, font, isFromStart } = box;
  if (measure$3(text, font) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 1 && measure$3(`${chars.join("")}…`, font) > width) {
    if (isFromStart)
      chars.shift();
    else
      chars.pop();
  }
  return isFromStart ? `…${chars.join("")}` : `${chars.join("")}…`;
}
const fit$2 = (text, width, font) => cut(text, { width, font, isFromStart: false });
const fitStart$1 = (text, width, font) => cut(text, { width, font, isFromStart: true });
function wrap$1(text, width, spec) {
  const lines = [];
  let current = "";
  for (const word of text.split(/\s+/).filter((part) => part !== "")) {
    const next = current === "" ? word : `${current} ${word}`;
    if (current === "" || measure$3(next, spec.font) <= width)
      current = next;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current !== "")
    lines.push(current);
  if (lines.length <= spec.maxLines)
    return lines.map((line) => fit$2(line, width, spec.font));
  const kept = lines.slice(0, spec.maxLines);
  const last = kept.length - 1;
  return kept.map((line, index) => index === last ? fit$2(`${line} ${lines.slice(spec.maxLines).join(" ")}`, width, spec.font) : line);
}
function svgWidth$1(columns, range) {
  const room = (columns - (range.reserve ?? 0)) * PX_PER_COLUMN$3;
  return Math.round(Math.max(range.min, Math.min(range.max, room)));
}
function svgDoc$3(spec) {
  const { width, height } = spec;
  const style = `${themeCss$1()}text{font-family:${SANS$1};font-variant-numeric:tabular-nums}.mono{font-family:${MONO$3}}${MOTION$2}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="t-${spec.mode}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><style>${style}</style>${spec.body}</svg>`;
}
function text$1(spec) {
  const attrs = [`x="${px$1(spec.x)}"`, `y="${px$1(spec.y)}"`, `font-size="${spec.size}"`];
  if (spec.weight !== undefined)
    attrs.push(`font-weight="${spec.weight}"`);
  if (spec.anchor !== undefined && spec.anchor !== "start")
    attrs.push(`text-anchor="${spec.anchor}"`);
  if (spec.isMono === true)
    attrs.push('class="mono"');
  return `<text ${attrs.join(" ")} style="fill:var(--${spec.ink})">${esc$1(spec.text)}</text>`;
}
function runs$1(spec) {
  const spans = spec.parts.map((part) => {
    const weight = part.weight === undefined ? "" : ` font-weight="${part.weight}"`;
    const mono = part.isMono === true ? ' class="mono"' : "";
    return `<tspan${weight}${mono} style="fill:var(--${part.ink})">${esc$1(part.text)}</tspan>`;
  });
  return `<text x="${px$1(spec.x)}" y="${px$1(spec.y)}" font-size="${spec.size}">${spans.join("")}</text>`;
}
function rect$1(spec) {
  const fill = spec.fill === undefined ? "fill:none" : `fill:var(--${spec.fill})`;
  const stroke = spec.stroke === undefined ? "" : `;stroke:var(--${spec.stroke})`;
  const cls = spec.className === undefined ? "" : ` class="${spec.className}"`;
  return `<rect${cls} x="${px$1(spec.x)}" y="${px$1(spec.y)}" width="${px$1(spec.w)}" height="${px$1(spec.h)}" rx="${spec.rx ?? 0}" style="${fill}${stroke}"/>`;
}
function line$1(spec) {
  const dash = spec.dash === undefined ? "" : ` stroke-dasharray="${spec.dash}"`;
  return `<line x1="${px$1(spec.x1)}" y1="${px$1(spec.y1)}" x2="${px$1(spec.x2)}" y2="${px$1(spec.y2)}" stroke-width="1"${dash} style="stroke:var(--${spec.ink})"/>`;
}
function fileBadge$2(spec) {
  const name = spec.path.split("/").pop() ?? spec.path;
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1) : "";
  const label = upper$2(ext === "" ? "·" : ext.slice(0, 3));
  return rect$1({ x: spec.x, y: spec.y, w: 26, h: 16, rx: 4, fill: "track" }) + text$1({ size: 9.5, weight: 600, isMono: true, x: spec.x + 13, y: spec.y + 11.5, text: label, ink: "lo", anchor: "middle" });
}
function monogram(spec) {
  return rect$1({ x: spec.x, y: spec.y, w: 16, h: 16, rx: 4, fill: "track" }) + text$1({ size: 10, weight: 600, isMono: true, x: spec.x + 8, y: spec.y + 11.5, text: spec.glyph, ink: "lo", anchor: "middle" });
}
function bar$2(spec) {
  const radius = spec.height / 2;
  const track = rect$1({ x: spec.x, y: spec.y, w: spec.width, h: spec.height, rx: radius, fill: "track" });
  let left = spec.x;
  const fills = spec.parts.filter((part) => part.value > 0).map((part) => {
    const width = Math.max(spec.height, spec.width * part.value / Math.max(1, spec.total) - 2);
    const drawn = rect$1({ x: left, y: spec.y, w: width, h: spec.height, rx: radius, fill: part.ink });
    left += width + 2;
    return drawn;
  });
  return track + fills.join("");
}

const SECOND$3 = 1000;
const MINUTE$2 = 60 * SECOND$3;
const HOUR$2 = 60 * MINUTE$2;
const DAY = 24 * HOUR$2;
const plural$3 = (count, one, many) => `${count} ${count === 1 ? one : many}`;
function agoEn(ms) {
  if (ms < MINUTE$2)
    return "just now";
  if (ms < HOUR$2)
    return `${Math.round(ms / MINUTE$2)}m ago`;
  if (ms < DAY)
    return `${Math.round(ms / HOUR$2)}h ago`;
  return `${Math.round(ms / DAY)}d ago`;
}
function agoTr(ms) {
  if (ms < MINUTE$2)
    return `${Math.max(0, Math.round(ms / SECOND$3))} sn önce`;
  if (ms < HOUR$2)
    return `${Math.round(ms / MINUTE$2)} dk önce`;
  if (ms < DAY)
    return `${Math.round(ms / HOUR$2)} sa önce`;
  return `${Math.round(ms / DAY)} g önce`;
}
const EN$4 = {
  title: "Restore points",
  ago: agoEn,
  hubDetail: (count) => `${count} saved`,
  headerMeta: (count, ago) => `${count} saved · newest ${ago}`,
  newest: (ago) => `newest ${ago}`,
  emptyLead: "No restore points yet",
  emptyRest: "one is saved quietly before the first file change",
  turnsSaved: (turns) => `${plural$3(turns, "turn", "turns")} saved`,
  turn: (number) => `Turn ${number}`,
  saved: "Restore point",
  beforeUndo: "Before undo",
  safetyPrefix: "before undo: ",
  undo: "Undo",
  undoMeta: "the current state is saved first",
  question: (target) => `Go back to before ${target}?`,
  changed: (count) => `${plural$3(count, "file", "files")} will change`,
  confirm: (count) => ({ label: `Restore ${plural$3(count, "file", "files")}`, hotkey: "r" }),
  cancel: { label: "Cancel", hotkey: "c" },
  redo: "Redo",
  files: (count) => `+${plural$3(count, "file", "files")}`,
  undone: "undone",
  willDelete: "will be deleted",
  moreFiles: (count) => `+ ${plural$3(count, "more file", "more files")}`,
  more: (count) => `+ ${count} more`,
  toRestore: (count) => `${count} to restore`,
  toDelete: (count) => `${count} to delete`,
  lines: "lines",
  summary: (restore, remove) => [`${plural$3(restore, "file", "files")} will be restored`, remove > 0 ? `${plural$3(remove, "new file", "new files")} will be deleted` : ""].filter(Boolean).join(", ") + ". The current state is saved first.",
  checking: "Checking…",
  undoing: "Undoing…",
  noRepo: "This folder has no version history (git).",
  alreadyThere: "The files already match this restore point.",
  failed: "Couldn't undo; the reason is in Claude Code's log (debug log).",
  commitsKept: (count) => `${plural$3(count, "saved version", "saved versions")} (commits) made since this point stay in the history; the undo shows up as new changes on top.`,
  indexBack: "Files marked for the next saved version (staged) go back as they were too.",
  ignoredKept: "Files git is told to skip (such as the secrets file .env) are not covered and stay as they are.",
  restored: (count, target) => `Restored ${plural$3(count, "file", "files")} to before ${target}.`,
  toggled: (isOn) => `restore points ${isOn ? "on" : "off"}`,
  toggleLine: "Quietly saves a restore point before each turn's first file change: on/off",
  paneLine: "Lists the restore points; undoes a turn",
  promptFallback: "turn"
};
const TR$4 = {
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
const SAFETY_PREFIXES = [EN$4.safetyPrefix, TR$4.safetyPrefix];
const words$3 = () => pick$3({ en: EN$4, tr: TR$4 });

const HEAD_LEAD_Y = 18;
const HEAD_PAD_BOTTOM = 6;
const SUB_LINE_H = 18;
const LEAD = { size: 16, weight: 600 };
const SUB = { size: 12 };
const ROW_MIN_H = 48;
const ROW_PAD_BOTTOM = 10;
const DOT_X$3 = 8;
const DOT_Y = 15;
const TEXT_X = 26;
const TITLE_Y = 19;
const LABEL_Y$2 = 38;
const LABEL_LINE_H = 17;
const LABEL_LINES = 2;
const CHIP = 16;
const CHIP_GAP = 4;
const RIGHT_GAP = 12;
const FILES_GAP = 10;
const TITLE$2 = { size: 13, weight: 560 };
const WHEN = { size: 13 };
const LABEL$1 = { size: 12 };
const META$1 = { size: 11, isMono: true };
const STRIKE_FIT = 0.95;
const CHEVRON_ROOM$1 = 28;
const CHEVRON_INSET = 18;
const drawing = (frame, spec) => ({ source: svgDoc$3({ width: frame.width, height: spec.height, mode: frame.mode, body: spec.body }), width: frame.width, height: spec.height, alt: spec.alt });
function headLines(room, spec) {
  const joiner = spec.joiner ?? " ";
  const isRestInline = spec.rest === "" || measure$3(`${spec.lead}${joiner}${spec.rest}`, LEAD) <= room;
  const rest = isRestInline ? [] : wrap$1(spec.rest, room, { font: SUB, maxLines: LABEL_LINES }).map((part) => ({ text: part, ink: "mid" }));
  const meta = spec.meta === "" ? [] : [{ text: fit$2(spec.meta, room, SUB), ink: "lo" }];
  return { inline: isRestInline && spec.rest !== "" ? `${joiner}${spec.rest}` : "", sub: [...rest, ...meta] };
}
function headSvg(frame, spec) {
  const room = frame.width;
  const lines = headLines(room, spec);
  const lead = fit$2(spec.lead, room, LEAD);
  const subs = lines.sub.map((part, index) => text$1({ ...SUB, x: 0, y: HEAD_LEAD_Y + SUB_LINE_H * (index + 1), text: part.text, ink: part.ink }));
  const body = runs$1({ x: 0, y: HEAD_LEAD_Y, size: LEAD.size, parts: [{ text: lead, ink: "hi", weight: LEAD.weight }, { text: lines.inline, ink: "mid", weight: 500 }] }) + subs.join("");
  const height = HEAD_LEAD_Y + SUB_LINE_H * lines.sub.length + HEAD_PAD_BOTTOM;
  const meta = spec.meta === "" ? "" : ` · ${spec.meta}`;
  const rest = spec.rest === "" ? "" : `${spec.joiner ?? " "}${spec.rest}`;
  return drawing(frame, { height, body, alt: `${spec.label}: ${spec.lead}${rest}${meta}` });
}
function dotOf$1(spec) {
  const { meta } = spec;
  if (meta.isSafety === true)
    return rect$1({ x: DOT_X$3 - 3.5, y: DOT_Y - 3.5, w: 7, h: 7, rx: 1.5, fill: "card", stroke: "lo" });
  if (meta.isUndone === true)
    return `<circle cx="${DOT_X$3}" cy="${DOT_Y}" r="4" stroke-dasharray="2 1.6" style="fill:var(--card);stroke:var(--lo)"/>`;
  if (spec.isNewest)
    return `<circle cx="${DOT_X$3}" cy="${DOT_Y}" r="4" style="fill:var(--kiln)"/>`;
  return `<circle cx="${DOT_X$3}" cy="${DOT_Y}" r="4" style="fill:var(--strong)"/>`;
}
function railOf(spec, height) {
  const top = spec.isFirst ? DOT_Y : 0;
  const bottom = spec.isLast ? DOT_Y : height;
  return top === bottom ? "" : line$1({ x1: DOT_X$3, y1: top, x2: DOT_X$3, y2: bottom, ink: "line" });
}
const filesText$1 = (meta) => meta.files === undefined || meta.files === 0 ? "" : words$3().files(meta.files);
function factsOf(meta, at) {
  const tools = meta.tools ?? [];
  const chipsW = tools.length === 0 ? 0 : tools.length * (CHIP + CHIP_GAP) - CHIP_GAP;
  const files = filesText$1(meta);
  const filesW = files === "" ? 0 : measure$3(files, META$1);
  const gap = chipsW > 0 && filesW > 0 ? FILES_GAP : 0;
  const chipsX = at.isCountFirst ? at.x + filesW + gap : at.x;
  const filesX = at.isCountFirst ? at.x : at.x + chipsW + gap;
  const chips = tools.map((glyph, index) => monogram({ x: chipsX + index * (CHIP + CHIP_GAP), y: at.y, glyph }));
  const label = files === "" ? "" : text$1({ ...META$1, x: filesX, y: at.y + 12, text: files, ink: meta.isUndone === true ? "lo" : "mid" });
  return { svg: chips.join("") + label, width: chipsW + gap + filesW };
}
const factsWidth = (meta) => factsOf(meta, { x: 0, y: 0, isCountFirst: false }).width;
const headWidth = (spec) => measure$3(spec.title, TITLE$2) + measure$3(`  ${spec.when}`, WHEN);
function rowFits(frame, spec) {
  const facts = factsWidth(spec.meta);
  return facts === 0 || TEXT_X + headWidth(spec) + RIGHT_GAP + facts + CHEVRON_ROOM$1 <= frame.width;
}
function struck(spec) {
  const width = measure$3(spec.text, spec.font) * STRIKE_FIT;
  const y = spec.y - spec.font.size * 0.32;
  return line$1({ x1: spec.x - 1, y1: y, x2: spec.x + width + 1, y2: y, ink: "lo" });
}
const titleInkOf = (meta) => meta.isUndone === true ? "lo" : "hi";
const chevron = (x, y) => `<path d="M${x} ${y - 4.5}l4.5 4.5-4.5 4.5" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--lo)"/>`;
function rowSvg$2(frame, spec) {
  const { meta } = spec;
  const isUndone = meta.isUndone === true;
  const titleInk = titleInkOf(meta);
  const head = runs$1({ x: TEXT_X, y: TITLE_Y, size: TITLE$2.size, parts: [{ text: spec.title, ink: titleInk, weight: TITLE$2.weight }, { text: `  ${spec.when}`, ink: "lo", weight: 400 }] });
  const labels = wrap$1(spec.label, frame.width - TEXT_X - CHEVRON_ROOM$1, { font: LABEL$1, maxLines: LABEL_LINES });
  const labelY = (index) => LABEL_Y$2 + index * LABEL_LINE_H;
  const body = labels.map((part, index) => text$1({ ...LABEL$1, x: TEXT_X, y: labelY(index), text: part, ink: isUndone ? "lo" : "mid" })).join("");
  const lastY = labelY(Math.max(0, labels.length - 1));
  const hasFacts = factsWidth(meta) > 0;
  const factsTop = spec.isStacked ? lastY + ROW_PAD_BOTTOM - 2 : TITLE_Y - 15;
  const facts = factsOf(meta, { x: spec.isStacked ? TEXT_X : frame.width - CHEVRON_ROOM$1 - factsWidth(meta), y: factsTop, isCountFirst: !spec.isStacked });
  const bottom = spec.isStacked && hasFacts ? factsTop + CHIP : lastY;
  const height = Math.max(ROW_MIN_H, Math.ceil(bottom + ROW_PAD_BOTTOM));
  const strikes = isUndone ? [struck({ x: TEXT_X, y: TITLE_Y, text: spec.title, font: TITLE$2 }), ...labels.map((part, index) => struck({ x: TEXT_X, y: labelY(index), text: part, font: LABEL$1 }))].join("") : "";
  const all = railOf(spec, height) + dotOf$1(spec) + head + facts.svg + body + strikes + chevron(frame.width - CHEVRON_INSET, height / 2);
  const files = filesText$1(meta);
  return drawing(frame, { height, body: all, alt: `${words$3().undo}: ${spec.title}, ${spec.when}${isUndone ? `, ${words$3().undone}` : ""}${files === "" ? "" : `, ${files}`}: ${spec.label}` });
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
const countsOf$1 = (file) => `+${file.added} −${file.removed}`;
const rightOfFile = (file) => measure$3(countsOf$1(file), META$1) + (file.isRemoved ? measure$3(words$3().willDelete, TAG) + STAT_GAP : 0);
const fileFits = (frame, file) => FILE_X + measure$3(file.path, FILE_NAME) + STAT_GAP + rightOfFile(file) <= frame.width;
function fileRow$1(frame, file, at) {
  const countsW = measure$3(countsOf$1(file), META$1);
  const room = frame.width - FILE_X - STAT_GAP - rightOfFile(file);
  const cut = file.path.lastIndexOf("/");
  const name = at.isTall && cut >= 0 ? file.path.slice(cut + 1) : file.path;
  const folder = at.isTall && cut >= 0 ? file.path.slice(0, cut + 1) : "";
  const tag = file.isRemoved ? text$1({ ...TAG, x: frame.width - countsW - STAT_GAP, y: at.y + 15, text: words$3().willDelete, ink: "flare", anchor: "end" }) : "";
  const under = folder === "" ? "" : text$1({ ...FILE_DIR, x: FILE_X, y: at.y + 30, text: fitStart$1(folder, frame.width - FILE_X, FILE_DIR), ink: "lo" });
  return fileBadge$2({ x: 0, y: at.y + 3, path: file.path }) + text$1({ ...FILE_NAME, x: FILE_X, y: at.y + 15, text: fitStart$1(name, room, FILE_NAME), ink: "hi" }) + under + tag + runs$1({ x: frame.width - countsW, y: at.y + 15, size: META$1.size, parts: [{ text: `+${file.added}`, ink: countInk(file.added, "moss"), isMono: true }, { text: ` −${file.removed}`, ink: countInk(file.removed, "flare"), isMono: true }] });
}
const countInk = (count, ink) => count === 0 ? "lo" : ink;
const MORE_H$1 = 22;
function moreOf(pending, y) {
  const more = pending.restore + pending.remove - pending.files.length;
  if (more <= 0)
    return { svg: "", height: 0, text: "" };
  const said = words$3().moreFiles(more);
  return { svg: text$1({ size: 11.5, x: FILE_X, y: y + 15, text: said, ink: "lo" }), height: MORE_H$1, text: said };
}
function diffstatSvg(frame, pending) {
  const total = pending.added + pending.removed;
  const sumFont = { size: 13, isMono: true };
  const summary = runs$1({ x: 0, y: STAT_LINE_Y, size: sumFont.size, parts: [{ text: `+${pending.added}`, ink: "moss", weight: 650, isMono: true }, { text: ` −${pending.removed}`, ink: "flare", weight: 650, isMono: true }] });
  const sumW = measure$3(`+${pending.added} −${pending.removed}`, sumFont) + STAT_GAP;
  const blocks = bar$2({ x: sumW, y: STAT_LINE_Y - 8, width: STAT_BAR_W, height: 6, total: Math.max(1, total), parts: [{ value: pending.added, ink: "moss" }, { value: pending.removed, ink: "flare" }] });
  const parts = [words$3().toRestore(pending.restore), pending.remove > 0 ? words$3().toDelete(pending.remove) : ""].filter((part) => part !== "").join(" · ");
  const noteX = sumW + STAT_BAR_W + STAT_GAP;
  const isNoteBeside = noteX + measure$3(parts, { size: 11.5 }) <= frame.width;
  const note = text$1({ size: 11.5, x: isNoteBeside ? noteX : 0, y: isNoteBeside ? STAT_LINE_Y : STAT_NOTE_Y, text: parts, ink: "lo" });
  const statH = (isNoteBeside ? STAT_LINE_Y : STAT_NOTE_Y) + 13;
  const isTall = pending.files.some((file) => !fileFits(frame, file));
  const rowH = isTall ? FILE_ROW_TALL : FILE_ROW_H;
  const files = pending.files.map((file, index) => fileRow$1(frame, file, { y: statH + index * rowH, isTall }));
  const more = moreOf(pending, statH + pending.files.length * rowH);
  const height = statH + pending.files.length * rowH + more.height;
  const listed = [...pending.files.map((file) => file.path), ...more.text === "" ? [] : [more.text]].join(", ");
  return drawing(frame, { height, body: summary + blocks + note + files.join("") + more.svg, alt: `+${pending.added} −${pending.removed} ${words$3().lines}, ${parts}: ${listed}` });
}

const summaryText$1 = (pending) => words$3().summary(pending.restore, pending.remove);
function confirmText(ui, pending, opts) {
  const { Box, Text, Button } = ui;
  const more = pending.restore + pending.remove - pending.files.length;
  const said = words$3();
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
  }, `−${pending.removed}`), h(Text, null, summaryText$1(pending))), pending.files.map((file, index) => h(Text, {
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
function glyphOf$1(meta) {
  if (meta.isSafety === true)
    return "◆";
  return meta.isUndone === true ? "○" : "●";
}
function rowText$1(ui, view, spec) {
  const { Box, Text, Button } = ui;
  const entry = view.entries[spec.index];
  if (entry === undefined)
    return null;
  const meta = spec.opts.meta[entry.ref] ?? {};
  const named = titleOf(entry, spec.opts.meta);
  const isUndone = meta.isUndone === true;
  const glyph = glyphOf$1(meta);
  const facts = [ago$1(spec.opts.now - entry.at), meta.files ? words$3().files(meta.files) : "", (meta.tools ?? []).join(" ")].filter((part) => part !== "");
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
    label: words$3().undo,
    onPress: () => spec.opts.actions.onUndo(entry)
  }));
}
function textPane$1(ui, view, opts) {
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
  }, words$3().title), h(Text, {
    dimColor: true
  }, headerMeta(view, opts.now))), h(Text, null, " "), statusRow(ui, view, opts.actions), view.pending !== null && confirmText(ui, view.pending, opts), view.pending === null && view.entries.length === 0 && h(Text, {
    dimColor: true
  }, emptyText()), view.pending === null && view.entries.map((_, index) => rowText$1(ui, view, { index, opts })));
}

const LABEL_MAX = 60;
const WIDTH$5 = { min: 240, max: 860 };
const CARD_RESERVE = 6;
const ago$1 = (ms) => words$3().ago(ms);
function clip$3(text, max = LABEL_MAX) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
const changedText = (pending) => words$3().changed(pending.restore + pending.remove);
const confirmOf = (pending) => words$3().confirm(pending.restore + pending.remove);
function notesOf(pending) {
  const said = words$3();
  return [pending.commits > 0 ? said.commitsKept(pending.commits) : "", pending.isIndexMoved ? said.indexBack : "", said.ignoredKept].filter((note) => note !== "");
}
const emptyText = () => `${words$3().emptyLead} · ${words$3().emptyRest}`;
const targetOf = (turn, label, max = LABEL_MAX) => turn === null || turn === undefined ? `"${clip$3(label, max)}"` : words$3().turn(turn);
const QUESTION_LABEL_MAX = 40;
const questionOf = (pending) => words$3().question(targetOf(pending.turn, pending.entry.label, QUESTION_LABEL_MAX));
function titleOf(entry, meta) {
  const own = meta[entry.ref] ?? {};
  const prefix = SAFETY_PREFIXES.find((start) => entry.label.startsWith(start));
  if (own.isSafety === true || prefix !== undefined)
    return { title: words$3().beforeUndo, label: entry.label.slice((prefix ?? words$3().safetyPrefix).length) };
  return { title: own.turn === undefined ? words$3().saved : words$3().turn(own.turn), label: entry.label };
}
const headerMeta = (view, now) => view.entries[0] === undefined ? "" : words$3().headerMeta(view.entries.length, ago$1(now - view.entries[0].at));
const motion$3 = paneMotion$3();
function picture$1(ui, drawing, key, opts) {
  const { Svg } = ui;
  return h(Svg, {
    key,
    ...motion$3.pic(key, drawing, opts)
  });
}
function confirmCard(ui, pending, opts) {
  const { Box, Button } = ui;
  const frame = { width: svgWidth$1(opts.look.columns, { ...WIDTH$5, reserve: CARD_RESERVE }), mode: opts.look.theme.mode };
  const said = words$3();
  const head = headSvg(frame, { label: said.undo, meta: said.undoMeta, lead: questionOf(pending), rest: changedText(pending) });
  const confirm = confirmOf(pending);
  return h(Box, {
    flexDirection: "column",
    borderStyle: "single",
    borderColor: boxColor(opts.look.theme, "amber", "line"),
    paddingX: 2,
    paddingY: 1,
    rowGap: 1
  }, picture$1(ui, head, "cp-card-head"), picture$1(ui, diffstatSvg(frame, pending), "cp-card-stat"), notesOf(pending).map((note, index) => h(ui.Text, {
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
    when: ago$1(opts.now - entry.at),
    meta: opts.meta[entry.ref] ?? {},
    isNewest: index === 0,
    isFirst: index === 0,
    isLast: index === last
  }));
}
function rowPicture(ui, row) {
  const { when, ...shows } = row.spec;
  return picture$1(ui, rowSvg$2(row.frame, { ...row.spec, isStacked: row.isStacked }), `cp-svg-${row.ref}`, { isRow: true, shows: { ...shows, isStacked: row.isStacked, frame: row.frame, isAged: when !== "" } });
}
function timeline(ui, view, opts) {
  const { Box } = ui;
  const frame = { width: svgWidth$1(opts.look.columns, WIDTH$5), mode: opts.look.theme.mode };
  const specs = rowSpecs(view, opts);
  const isStacked = specs.some((spec) => !rowFits(frame, spec));
  return h(Box, {
    flexDirection: "column"
  }, view.entries.map((entry, index) => {
    const spec = specs[index];
    const drawing = rowPicture(ui, { frame, spec, isStacked, ref: entry.ref });
    return PressRow$1(ui, { box: `cp-row-${index}`, key: `cp-undo-${index}`, drawing, onPress: () => opts.actions.onUndo(entry) });
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
    label: words$3().redo,
    onPress: () => actions.onUndo(redo)
  }));
}
function paneTree$2(ui, view, opts) {
  const { Box } = ui;
  if (!opts.look.isRich)
    return textPane$1(ui, view, opts);
  const frame = { width: svgWidth$1(opts.look.columns, WIDTH$5), mode: opts.look.theme.mode };
  const count = view.entries.length;
  const said = words$3();
  const turns = view.entries.filter((entry) => titleOf(entry, opts.meta).title !== said.beforeUndo).length;
  const lead = count === 0 ? { lead: said.emptyLead, rest: said.emptyRest, joiner: " · " } : { lead: said.turnsSaved(turns), rest: "" };
  const newest = view.entries[0];
  const meta = newest !== undefined && turns === count ? said.newest(ago$1(opts.now - newest.at)) : headerMeta(view, opts.now);
  const head = headSvg(frame, { label: said.title, meta, ...lead });
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, picture$1(ui, head, "cp-head", { shows: { lead, turns, count, frame } }), statusRow(ui, view, opts.actions), view.pending !== null && confirmCard(ui, view.pending, opts), view.pending === null && count > 0 && timeline(ui, view, opts));
}

const CP_VIEW = { plugin: "checkpoint", key: "view" };
const CP_META = { plugin: "checkpoint", key: "meta" };
const CP_THEME = { plugin: "checkpoint", key: "theme" };
const EMPTY_VIEW = { entries: [], status: null, isBusy: false, pending: null };
async function checkpointsPage($, ui, site, act) {
  setLang$2(lang$1());
  const view = (await $.state.get(CP_VIEW)).value ?? EMPTY_VIEW;
  const meta = (await $.state.get(CP_META)).value ?? {};
  const theme = (await $.state.get(CP_THEME)).value ?? AUTO$1;
  const actions = {
    onUndo: (entry) => act("undo", entry.ref),
    onConfirm: () => act("confirm"),
    onCancel: () => act("cancel")
  };
  const look = { theme, columns: site.columns, isRich: site.surface !== "terminal" };
  return paneTree$2(ui, view, { now: await $.clock.now(), meta, look, actions });
}

let current$2 = "en";
const pick$2 = (table) => table[current$2];
const upper$1 = (text) => text.toLocaleUpperCase(current$2);

const plural$2 = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const EN$3 = {
  units: { second: "s", minute: "m", hour: "h" },
  left: (duration) => `≈${duration} left`,
  headline: (done, total) => `${done}/${plural$2(total, "step", "steps")}`,
  drawnCount: (done, total) => done === total ? `All ${plural$2(total, "step", "steps")} done` : `${done} of ${plural$2(total, "step", "steps")} done`,
  drawnPlanned: (total) => plural$2(total, "step", "steps"),
  hubDone: (total) => `${total} of ${total} done`,
  hubUnstarted: (total) => `${plural$2(total, "step", "steps")} · not started`,
  hubWaiting: (done, total) => `${done} of ${plural$2(total, "step", "steps")} · waiting`,
  hubLive: (done, total) => `${done} of ${plural$2(total, "step", "steps")}`,
  checks: (done, total) => `${done}/${plural$2(total, "item", "items")}`,
  files: (n) => plural$2(n, "file", "files"),
  agentsDone: (n) => `${plural$2(n, "helper agent", "helper agents")} done`,
  moreSteps: (n) => plural$2(n, "more step", "more steps"),
  earlierSteps: (n) => plural$2(n, "earlier step", "earlier steps"),
  moreFiles: (n) => `+${plural$2(n, "more file", "more files")}`,
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
  finishHeadline: (open, total) => `${open} of ${plural$2(total, "step", "steps")} still open`,
  finishNext: (title) => `Next: ${title}`,
  finishContinue: "Continue the plan",
  finishMarkDone: "Mark plan done",
  finishNotNow: "Not now",
  continuePrompt: (title) => `Continue the plan with the next open step: ${title}. Keep the task list current as you go.`
};
const TR$3 = {
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
const WORDS$4 = { en: EN$3, tr: TR$3 };
const words$2 = () => pick$2(WORDS$4);

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
  return { steps, source: words$2().tasksLabel };
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
  return { steps: fromDoc(doc, matched), source: `${doc.label} · ${words$2().tasksLabel}` };
}

const FILL$2 = /<rect\b[^>]*\bdata-m-fill\b[^>]*>/g;
const DONE$2 = /<path\b[^>]*\bdata-m-done\b[^>]*>/g;
const HAS_DONE$2 = /\bdata-m-done\b/;
const WIDTH$4 = /\swidth="([\d.]+)"/;
const CLASS$2 = /\sclass="([^"]*)"/;
const STYLE$2 = /\sstyle="([^"]*)"/;
const MIN_RATIO_STEP$2 = 0.02;
const RATIO_DIGITS$2 = 3;
const widthOf$2 = (tag) => Number(WIDTH$4.exec(tag)?.[1] ?? 0);
function withClass$2(tag, name, extra = "") {
  const tagged = CLASS$2.test(tag) ? tag.replace(CLASS$2, (_, classes) => ` class="${classes} ${name}"`) : tag.replace(/\s*\/?>$/, ` class="${name}"$&`);
  return tagged.replace(/\s*\/?>$/, `${extra}$&`);
}
function slideFills$2(before, now) {
  const old = before.match(FILL$2) ?? [];
  if (old.length !== (now.match(FILL$2) ?? []).length)
    return now;
  let index = 0;
  return now.replace(FILL$2, (tag) => {
    const was = old[index++];
    const from = was === undefined ? 0 : widthOf$2(was);
    const to = widthOf$2(tag);
    if (from <= 0 || to <= 0 || Math.abs(from - to) / to < MIN_RATIO_STEP$2)
      return tag;
    const slide = `--m-from:${(from / to).toFixed(RATIO_DIGITS$2)}`;
    const styled = STYLE$2.test(tag) ? tag.replace(STYLE$2, (_, rules) => ` style="${slide};${rules}"`) : tag.replace(/\s*\/?>$/, ` style="${slide}"$&`);
    return withClass$2(styled, "m-from");
  });
}
function drawDone$2(before, now) {
  if (HAS_DONE$2.test(before))
    return now;
  return now.replace(DONE$2, (tag) => withClass$2(tag, "m-draw", ' pathLength="1"'));
}
function markChanges$2(before, now) {
  return drawDone$2(before, slideFills$2(before, now));
}

const STAGGER_MS$2 = 45;
const EASE$2 = "cubic-bezier(.2,.8,.2,1)";
const SHEEN$2 = "#A39E93";
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
const REDUCED$3 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function motionCss$2(body) {
  const used = Object.keys(RULES$2).filter((name) => new RegExp(`\\b${name}\\b`).test(body));
  return used.length === 0 ? "" : `${used.map((name) => RULES$2[name]).join("")}${REDUCED$3}`;
}
Object.values(RULES$2).join("");
const isEntering$2 = (cue) => cue.phase === "enter";
function entering$2(body, cue, kind = "in") {
  if (!isEntering$2(cue))
    return body;
  return `<g class="m-${kind}" style="animation-delay:${cue.order * STAGGER_MS$2}ms">${body}</g>`;
}
const FLASH$2 = `<rect x="0" y="0" width="100%" height="100%" rx="10" fill="${SHEEN$2}" fill-opacity=".22" class="m-flash"/>`;
const WASH$2 = '<rect x="0" y="0" width="100%" height="100%" rx="10" class="m-wash"/>';

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

const TAG_WIDTH$2 = /^[\s\S]*?<svg\b[^>]*?\swidth="([\d.]+)"/;
const SVG$2 = /^([\s\S]*?<svg\b[^>]*>)([\s\S]*)(<\/svg>\s*)$/;
const SCHEME$3 = "<style>:root{color-scheme:light dark}</style>";
const SAYS_SCHEME$2 = /(^|[^-\w])color-scheme\s*:/;
const PASS_MS$2 = 120;
const MAX_ORDER$2 = 12;
const LIVE_MS$2 = 30000;
function animate$2(source, spec) {
  const moved = spec.cue.phase === "change" && spec.before !== undefined ? markChanges$2(spec.before, source) : source;
  const parts = SVG$2.exec(moved);
  if (parts === null)
    return source;
  const [, open, inner = "", close] = parts;
  const scheme = SAYS_SCHEME$2.test(inner) ? "" : SCHEME$3;
  const lit = `${spec.isRow === true ? WASH$2 : ""}${spec.cue.phase === "change" && spec.isLive !== true ? FLASH$2 : ""}${inner}`;
  const body = entering$2(lit, spec.cue);
  const css = motionCss$2(body);
  return `${open}${scheme}${css === "" ? "" : `<style>${css}</style>`}${body}${close}`;
}
function paneMotion$2() {
  const drawings = stableDrawings$2();
  const shown = new Map;
  const pass = { at: Number.NEGATIVE_INFINITY, entered: 0 };
  const begin = () => {
    const now = Date.now();
    if (now - pass.at > PASS_MS$2)
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
      const now = { shows: opts.shows === undefined ? what : JSON.stringify(opts.shows), width: String(pic.width ?? TAG_WIDTH$2.exec(pic.source)?.[1]), source: pic.source };
      const source = drawings.draw(key, what, (built) => {
        const order = built === "enter" ? Math.min(MAX_ORDER$2, pass.entered++) : 0;
        const before = shown.get(key);
        const isQuiet = before !== undefined && (before.shows === now.shows || before.width !== now.width);
        const phase = built === "change" && isQuiet ? "still" : built;
        const lastChange = before?.changedAt ?? Number.NEGATIVE_INFINITY;
        const isLive = phase === "change" && pass.at - lastChange < LIVE_MS$2;
        shown.set(key, { ...now, changedAt: phase === "change" ? pass.at : lastChange });
        return animate$2(pic.source, { cue: { phase, order }, isRow: opts.isRow, before: before?.source, isLive });
      });
      return { ...pic, source, isInteractive: true };
    }
  };
}

function baseName(path) {
  return path.split("/").pop() ?? path;
}

const SECOND$2 = 1000;
const MINUTE$1 = 60 * SECOND$2;
const HOUR$1 = 60 * MINUTE$1;
const PERCENT$2 = 100;
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
  const percent = total === 0 ? 0 : Math.round(credit / total * PERCENT$2);
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
  const unit = words$2().units;
  if (ms < MINUTE$1)
    return `${Math.max(1, Math.round(ms / SECOND$2))}${unit.second}`;
  if (ms < HOUR$1)
    return `${Math.round(ms / MINUTE$1)}${unit.minute}`;
  const hours = Math.floor(ms / HOUR$1);
  const minutes = Math.round(ms % HOUR$1 / MINUTE$1);
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
    return words$2().notStarted;
  if (state === "stale")
    return words$2().waitingSince(formatDuration(at.now - at.touchedAt));
  return "";
}

const NARROW$1 = "iljtf.,:;|!'` ()[]";
const WIDE$1 = "mwMW@%";
const NARROW_EM$1 = 0.3;
const WIDE_EM$1 = 0.82;
const CAPITAL_EM = 0.64;
const LOWER_EM = 0.55;
const MONO_EM$1 = 0.6;
const PX_PER_COLUMN$2 = 9;
function escape$1(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function measure$2(text, size, isMono = false) {
  if (isMono)
    return [...text].length * size * MONO_EM$1;
  return [...text].reduce((sum, char) => {
    if (NARROW$1.includes(char))
      return sum + size * NARROW_EM$1;
    if (WIDE$1.includes(char))
      return sum + size * WIDE_EM$1;
    return sum + size * (char >= "A" && char <= "Z" ? CAPITAL_EM : LOWER_EM);
  }, 0);
}
function fit$1(text, width, font) {
  const { size, isMono = false } = font;
  if (measure$2(text, size, isMono) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 0 && measure$2(`${chars.join("")}…`, size, isMono) > width)
    chars.pop();
  return chars.length === 0 ? "" : `${chars.join("").trimEnd()}…`;
}
function wrap(text, box) {
  const lines = [];
  let line = "";
  const words = text.split(/\s+/).filter(Boolean);
  for (const [index, word] of words.entries()) {
    const tried = line === "" ? word : `${line} ${word}`;
    if (measure$2(tried, box.size) <= box.width || line === "") {
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
  return lines.map((part) => fit$1(part, box.width, { size: box.size }));
}
function widthFor(columns, range) {
  const fromCells = Math.floor((columns ?? 0) * PX_PER_COLUMN$2);
  return Math.max(range.min, Math.min(range.max, fromCells));
}

const FILES_SHOWN$2 = 3;
const AGENTS_SHOWN$1 = 3;
const LINE$2 = 17;
const FILE_ROW = 22;
const BADGE$1 = { w: 26, h: 16, gap: 8 };
const NAME_SIZE = 12;
const META_SIZE$1 = 12;
const AGENT_INDENT = 14;
const LINES_MAX = 3;
const AGENT_DOT = { dx: 4, dy: 9, r: 3 };
const DETAIL_CSS = ".badge{font-size:9.5px;font-weight:700}";
function deskDetails(step, track) {
  const done = track?.agents.filter((agent) => !agent.isRunning).length ?? 0;
  const say = words$2();
  const meta = [step.checksTotal > 0 ? say.checks(step.checksDone, step.checksTotal) : "", done > 0 ? say.agentsDone(done) : ""];
  const running = (track?.agents ?? []).filter((agent) => agent.isRunning).map((agent) => agent.description);
  return { meta: meta.filter(Boolean).join(" · "), files: [...track?.files ?? []].reverse(), running: running.slice(0, AGENTS_SHOWN$1) };
}
function hasDetails(details) {
  return details.meta !== "" || details.files.length > 0 || details.running.length > 0;
}
function fileBadge$1(x, y, path) {
  const name = baseName(path);
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  const label = escape$1(upper$1(ext === "" ? "·" : ext.slice(0, 3)));
  return `<rect x="${x}" y="${y}" width="${BADGE$1.w}" height="${BADGE$1.h}" rx="4" fill="var(--track)"/><text x="${x + BADGE$1.w / 2}" y="${y + 11.5}" text-anchor="middle" class="mono badge lo">${label}</text>`;
}
function fileRow(path, frame) {
  const nameX = frame.x + BADGE$1.w + BADGE$1.gap;
  const room = frame.width - (nameX - frame.x);
  const name = fit$1(baseName(path), room, { size: NAME_SIZE });
  const folder = path.slice(0, path.length - baseName(path).length);
  const folderRoom = room - measure$2(name, NAME_SIZE);
  const kept = measure$2(folder, NAME_SIZE) <= folderRoom ? folder : "";
  const y = frame.top + 3;
  return `${fileBadge$1(frame.x, y, path)}<text x="${nameX}" y="${y + 12}" class="label"><tspan class="lo">${escape$1(kept)}</tspan><tspan class="hi">${escape$1(name)}</tspan></text>`;
}
function lines(texts, at) {
  return texts.map((line, n) => `<text x="${at.x}" y="${at.top + 13 + n * LINE$2}" class="${at.cls}">${escape$1(line)}</text>`).join("");
}
function filesBlock(files, frame) {
  const rows = files.slice(0, FILES_SHOWN$2).map((path, n) => fileRow(path, { ...frame, top: frame.top + n * FILE_ROW }));
  const shown = Math.min(files.length, FILES_SHOWN$2);
  const rest = files.length - shown;
  const more = rest > 0 ? `<text x="${frame.x + BADGE$1.w + BADGE$1.gap}" y="${frame.top + shown * FILE_ROW + 11}" class="micro lo">${words$2().moreFiles(rest)}</text>` : "";
  return { svg: rows.join("") + more, height: shown * FILE_ROW + (rest > 0 ? LINE$2 : 0) };
}
function agentBlock(agent, frame) {
  const texts = wrap(`${agent} · ${words$2().running}`, { width: frame.width - AGENT_INDENT, size: META_SIZE$1, maxLines: LINES_MAX });
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

const DARK$2 = {
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
const LIGHT$2 = {
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
const ROLES$3 = {
  run: { dark: { fg: "#B19CF3", tint: "#29243D", line: "#4A3F75" }, light: { fg: "#6243C4", tint: "#F0ECFC", line: "#CFC3F3" } },
  ok: { dark: { fg: "#6FC593", tint: "#1B2F25", line: "#2F5A42" }, light: { fg: "#1F6E43", tint: "#E4F4EA", line: "#B5DEC4" } },
  danger: { dark: { fg: "#F2727F", tint: "#3B2023", line: "#74343C" }, light: { fg: "#C0263A", tint: "#FCE8EA", line: "#F1B9C0" } },
  edit: { dark: { fg: "#E58A5F", tint: "#38251D", line: "#6A3E2D" }, light: { fg: "#A94A26", tint: "#FBEDE6", line: "#EFC6B4" } },
  amber: { dark: { fg: "#E9B949", tint: "#332D19", line: "#66552A" }, light: { fg: "#8A6000", tint: "#FBF2D9", line: "#EBD48F" } },
  tide: { dark: { fg: "#7FB6E8", tint: "#1E2B37", line: "#2F4A63" }, light: { fg: "#2464A0", tint: "#E7F0F9", line: "#B9D3EC" } }
};
const ROLE_NAMES = Object.keys(ROLES$3);
function palette$1(isLight) {
  const mode = isLight ? "light" : "dark";
  const roles = Object.fromEntries(ROLE_NAMES.map((role) => [role, ROLES$3[role][mode]]));
  return { ...isLight ? LIGHT$2 : DARK$2, ...roles };
}
function vars(p) {
  const tones = ROLE_NAMES.map((role) => `--${role}:${p[role].fg};--${role}-t:${p[role].tint};--${role}-l:${p[role].line}`);
  return [
    `--sheet:${p.sheet};--card:${p.card};--inset:${p.inset};--line:${p.line};--line2:${p.lineStrong};--track:${p.track}`,
    `--hi:${p.hi};--mid:${p.mid};--lo:${p.lo}`,
    ...tones
  ].join(";");
}
const FONT$2 = `-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif`;
const MONO_FONT = `ui-monospace,"SF Mono",Menlo,Consolas,monospace`;
const TYPE = [
  `text{font-family:${FONT$2};font-variant-numeric:tabular-nums}`,
  `.mono{font-family:${MONO_FONT}}`,
  ".headline{font-size:16px;font-weight:600}",
  ".title{font-size:13.5px;font-weight:600}",
  ".label{font-size:12px;font-weight:500}",
  ".micro{font-size:10.5px;font-weight:500}",
  ".hi{fill:var(--hi)}.mid{fill:var(--mid)}.lo{fill:var(--lo)}",
  ".f-edit{fill:var(--edit)}.f-ok{fill:var(--ok)}.f-danger{fill:var(--danger)}.f-run{fill:var(--run)}.f-amber{fill:var(--amber)}.f-tide{fill:var(--tide)}"
].join("");
const CALM = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function svgStyle$2(extra = "") {
  const dark = vars(palette$1(false));
  const light = vars(palette$1(true));
  return `<style>svg{${dark}}svg.t-light{${light}}@media (prefers-color-scheme: light){svg.t-auto{${light}}}${TYPE}${extra}${CALM}</style>`;
}
function svgDoc$2(size, body, extraCss = "") {
  const { width, height, theme } = size;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="t-${theme}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svgStyle$2(extraCss)}${body}</svg>`;
}

const LEAD_BASE = 16;
const HOW_BASE = 36;
const HOW_SIZE = 12;
const LINE$1 = 17;
const HOW_LINES_MAX = 4;
const GHOST_GAP = 18;
const GHOST_ROW = 30;
const GHOST_SHARES = [0.62, 0.46, 0.54];
const DOT_X$2 = 7;
const DOT_R$1 = 3.5;
const RAIL_GAP$1 = 10;
const BAR_X = 24;
const BAR_H = 6;
function sentence(width) {
  const say = words$2();
  const how = wrap(`${upper$1(say.emptyHow.slice(0, 1))}${say.emptyHow.slice(1)}`, { width, size: HOW_SIZE, maxLines: HOW_LINES_MAX });
  const lines = how.map((line, n) => `<text x="0" y="${HOW_BASE + n * LINE$1}" class="label lo">${escape$1(line)}</text>`);
  return { svg: `<text x="0" y="${LEAD_BASE}" class="headline hi">${escape$1(say.emptyLead)}</text>${lines.join("")}`, bottom: HOW_BASE + (how.length - 1) * LINE$1 };
}
function ghost(width, top) {
  return GHOST_SHARES.map((share, n) => {
    const cy = top + n * GHOST_ROW + DOT_R$1;
    const rail = n === 0 ? "" : `<line x1="${DOT_X$2}" y1="${cy - GHOST_ROW + RAIL_GAP$1}" x2="${DOT_X$2}" y2="${cy - RAIL_GAP$1}" stroke="var(--line)"/>`;
    const dot = `<circle cx="${DOT_X$2}" cy="${cy}" r="${DOT_R$1}" fill="none" stroke="var(--line2)" stroke-width="1.5"/>`;
    const bar = `<rect x="${BAR_X}" y="${cy - BAR_H / 2}" width="${Math.round((width - BAR_X) * share)}" height="${BAR_H}" rx="3" fill="var(--track)" opacity=".7"/>`;
    return rail + dot + bar;
  }).join("");
}
function emptySvg(theme, width) {
  const text = sentence(width);
  const top = text.bottom + GHOST_GAP;
  const height = top + (GHOST_SHARES.length - 1) * GHOST_ROW + 2 * DOT_R$1 + 2;
  const body = `${text.svg}${ghost(width, top)}`;
  return { source: svgDoc$2({ width, height, theme }, body), height, alt: `Plan: ${words$2().emptyLead} · ${words$2().emptyHow}` };
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
const DOT_X$1 = 7;
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
const METER_H$1 = 3;
const SEGMENT_GAP = 2;
const SEGMENT_MIN = 5;
const HEAD_H = 62;
const TIME_SIZE = 11;
const TIME_GAP = 12;
const CURRENT_SIZE = 13.5;
const TITLE_SIZE = 13;
const BOLD_WIDEN$1 = 1.06;
const CURRENT_LINES_MAX = 5;
const OTHER_LINES_MAX = 2;
const DETAIL_PAD = 8;
const CSS = `${DETAIL_CSS}.step{font-size:${TITLE_SIZE}px}.breathe{animation:br 1.8s ease-in-out infinite}@keyframes br{50%{opacity:.35}}`;
function headlineText(model) {
  const { plan, tracks } = model;
  const progress = progressOf(plan);
  const isUnstarted = progress.done === 0 && currentIndex(plan.steps, tracks) < 0;
  return isUnstarted ? words$2().drawnPlanned(progress.total) : words$2().drawnCount(progress.done, progress.total);
}
function rightOfMeta(model) {
  if (model.note !== "")
    return model.note;
  const eta = etaOf(model.plan, model.tracks);
  return eta === null ? "" : words$2().left(formatDuration(eta));
}
function segmentFill(model, step, isCurrent) {
  if (isCurrent && model.note === "")
    return "--edit";
  if (step.status === "completed")
    return model.plan.steps.every((one) => one.status === "completed") ? "--ok" : "--mid";
  return step.status === "in_progress" ? "--line2" : "--track";
}
function meter$1(model) {
  const { steps } = model.plan;
  const cell = (model.width - (steps.length - 1) * SEGMENT_GAP) / steps.length;
  const bar = (x, width, fill) => `<rect x="${x}" y="${METER_Y}" width="${width}" height="${METER_H$1}" rx="1.5" fill="var(${fill})"/>`;
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
  const room = model.width - (right === "" ? 0 : measure$2(right, META_SIZE) + META_GAP);
  const parts = [
    `<text x="0" y="${HEADLINE_Y}" class="headline hi">${escape$1(headlineText(model))}</text>`,
    `<text x="0" y="${META_Y}" class="label lo">${escape$1(fit$1(model.plan.source, room, { size: META_SIZE }))}</text>`,
    right === "" ? "" : `<text x="${model.width}" y="${META_Y}" text-anchor="end" class="label lo">${escape$1(right)}</text>`,
    meter$1(model)
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
function rowSvg$1(model, row) {
  const state = dotState(row);
  const right = rightText(model, row.step, row.isCurrent);
  const parts = [
    stepDot({ cx: DOT_X$1, cy: row.top + DOT_CY, state, isLive: model.note === "" }),
    ...row.title.map((line, n) => `<text x="${TITLE_X}" y="${row.top + TITLE_BASE + n * LINE}" class="${TITLE_CLASS[state]}">${escape$1(line)}</text>`),
    right.text === "" ? "" : `<text x="${model.width}" y="${row.top + TITLE_BASE}" text-anchor="end" class="mono ${right.cls}" font-size="${TIME_SIZE}">${right.text}</text>`,
    row.detail?.svg ?? ""
  ];
  return parts.join("");
}
function titleLines(model, step, isCurrent) {
  const right = rightText(model, step, isCurrent);
  const rightWidth = right.text === "" ? 0 : measure$2(right.text, TIME_SIZE, true) + TIME_GAP;
  const size = isCurrent ? CURRENT_SIZE * BOLD_WIDEN$1 : TITLE_SIZE;
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
  return `${glyph}<text x="${TITLE_X}" y="${top + MORE_BASE}" class="label lo">${escape$1(text)}</text>`;
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
  const above = hasAbove ? moreRow(head.height, checkMark(DOT_X$1, aboveCy), words$2().earlierSteps(shown.start)) : "";
  const below = hasBelow ? moreRow(bottom, hollowRing(DOT_X$1, belowCy), words$2().moreSteps(steps.length - shown.end)) : "";
  const stops = [
    ...hasAbove ? [{ cy: aboveCy, isDone: true }] : [],
    ...rows.map((row) => ({ cy: row.top + DOT_CY, isDone: row.step.status === "completed" })),
    ...hasBelow ? [{ cy: belowCy, isDone: false }] : []
  ];
  const rails = stops.slice(1).map((stop, n) => {
    const from = stops[n];
    return stepRail(DOT_X$1, { from: from.cy, to: stop.cy, isWalked: from.isDone });
  });
  const height = bottom + (hasBelow ? MORE_H : 4);
  const body = [head.svg, ...rails, above, ...rows.map((row) => rowSvg$1(model, row)), below].join("");
  return { source: svgDoc$2({ width: model.width, height, theme: model.theme }, body, CSS), height };
}

const SVG_RANGE = { min: 280, max: 640 };
const GUTTER_COLUMNS = 6;
const GLYPH_CELLS = 2;
const PAD$2 = 1;
const BAR_MIN$3 = 8;
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
function bar$1(ui, view) {
  const { Box, Text } = ui;
  const width = Math.max(BAR_MIN$3, view.columns - 2 * PAD$2 - (view.eta === "" ? 0 : view.eta.length + 2));
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
  return `${words$2().files(files.length)}: ${names}${more}`;
}
function detailLines(step, track) {
  const done = track?.agents.filter((agent) => !agent.isRunning).length ?? 0;
  const parts = [
    step.checksTotal > 0 ? words$2().checks(step.checksDone, step.checksTotal) : "",
    filesText(track?.files ?? []),
    done > 0 ? words$2().agentsDone(done) : ""
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
    out.push(more(ui, "more-above", `✓ ${words$2().moreSteps(shown.start)}`));
  steps.slice(shown.start, shown.end).forEach((step, offset) => {
    const isCurrent = shown.start + offset === current;
    out.push(stepRow$1(ui, step, lookOf(step, { track: view.tracks[step.key], now: view.now, isCurrent })));
    if (isCurrent)
      out.push(...details(ui, lines));
  });
  if (shown.end < steps.length)
    out.push(more(ui, "more-below", `+${words$2().moreSteps(steps.length - shown.end)}`));
  return out;
}
function headline(plan) {
  const progress = progressOf(plan);
  return `Plan · ${words$2().headline(progress.done, progress.total)}`;
}
function emptyPane(ui) {
  const { Box, Text } = ui;
  return h(Box, {
    flexDirection: "column",
    paddingX: PAD$2
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
  }, words$2().emptyLead), h(Text, {
    dimColor: true
  }, ` · ${words$2().emptyHow}`))));
}
const motion$2 = paneMotion$2();
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
      ...motion$2.pic("plan-empty", { ...empty, width })
    }));
  }
  const steps = plan.steps;
  const current = steps[currentIndex(steps, view.tracks)];
  const details = current === undefined ? { meta: "", files: [], running: [] } : deskDetails(current, view.tracks[current.key]);
  const drawing = planSvg({ plan, tracks: view.tracks, now: view.now, theme: view.theme, width, note: noteOf$1(view) }, details);
  const alt = `${headline(plan)}${current === undefined ? "" : ` · ${words$2().now}: ${current.title}`}`;
  const shows = { plan, tracks: view.tracks, theme: view.theme, width, state: planState(plan, { now: view.now, touchedAt: view.touchedAt }), details };
  return h(Box, {
    flexDirection: "column",
    paddingX: 1,
    paddingY: 1
  }, h(Svg, {
    key: "plan-svg",
    ...motion$2.pic("plan-svg", { source: drawing.source, alt, width, height: drawing.height }, { shows })
  }));
}
function noteOf$1(view) {
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
    paddingX: PAD$2
  }, header(ui, headline(plan), [plan.source, noteOf$1(view)].filter(Boolean).join(" · ")), bar$1(ui, { percent: progressOf(plan).percent, columns: layout.columns, eta: eta === null || noteOf$1(view) !== "" ? "" : words$2().left(formatDuration(eta)) }), h(Text, null, " "), stepList(ui, { ...view, plan }, layout.rows));
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

let current$1 = "en";
const langOf$1 = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang$1(value) {
  current$1 = langOf$1(value);
  return current$1;
}
const pick$1 = (table) => table[current$1];
const upper = (text) => text.toLocaleUpperCase(current$1);

const EMPTY = { tests: null, lint: null, root: null, finishedAt: null, durationMs: 0, isRunning: false };

const plural$1 = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const TR$2 = {
  ago: { s: (n) => `${n} sn önce`, m: (n) => `${n} dk önce`, h: (n) => `${n} sa önce` },
  took: (seconds) => `${seconds} sn sürdü`,
  seconds: (ms, second) => `${(ms / second).toFixed(1).replace(".", ",")} sn`,
  testsCount: (passed, total) => `testler ${passed}/${total}`,
  testsTimeout: "testler çok uzun sürdü",
  testsNotStarted: "testler başlamadı",
  testsPassed: "testler geçti",
  testsFailed: "testler kaldı",
  testsRunning: "testler çalışıyor…",
  runningTail: "çalışıyor…",
  running: "çalışıyor",
  testTimeout: "test çok uzun sürdü",
  testNotStarted: "test başlamadı",
  testPassed: "test geçti",
  testFailed: "test kaldı",
  testRunning: "test çalışıyor",
  passedOf: (passed, total) => `${passed}/${total} geçti`,
  failedOf: (failed, total) => `${failed}/${total} kaldı`,
  lintTimeout: "yazım kuralları çok uzun sürdü",
  lintNotStarted: "yazım kuralları başlamadı",
  lintClean: "yazım kuralları tamam",
  lintErrors: (errors) => `yazım kuralları: ${errors} hata`,
  lintFailed: "yazım kuralları kaldı",
  verdict: {
    running: "Testler çalışıyor…",
    notRun: "Henüz test çalıştırılmadı",
    noCommand: "Test komutu bulunamadı",
    everything: "Her şey yolunda",
    passHere: "Bu bilgisayarda tüm testler geçti",
    passGithubBusy: "Testler geçti, GitHub hâlâ kontrol ediyor",
    lintClean: "Yazım kuralları denetimi temiz",
    failing: (n) => `${n} test başarısız`,
    testsFailing: "Testler başarısız",
    testsTooLong: "Testler çok uzun sürdü, durduruldu",
    testsNoStart: "Testler başlatılamadı",
    lintProblems: (n) => `${n} yazım kuralı sorunu`,
    lintFailing: "Yazım kuralları denetimi sorun buldu",
    lintTooLong: "Yazım kuralları denetimi çok uzun sürdü, durduruldu",
    lintNoStart: "Yazım kuralları denetimi başlatılamadı",
    githubFailing: (n) => `GitHub'da ${n} otomatik kontrol başarısız`,
    both: (tests, checks) => `${tests} test ve GitHub'da ${checks} otomatik kontrol başarısız`
  },
  local: {
    title: "Bu bilgisayarda",
    tests: "Testler",
    lint: "Yazım kuralları denetimi (lint)",
    notRun: "henüz çalışmadı",
    running: "çalışıyor…",
    passed: "geçti",
    nPassed: (n) => `${n} test geçti`,
    nFailed: (failed, total) => `${failed}/${total} başarısız`,
    failed: "başarısız",
    failedYet: (passed) => `başarısız · ${passed} geçti`,
    clean: "temiz",
    problems: (n) => `${n} sorun`,
    tooLong: "çok uzun sürdü",
    noStart: "başlatılamadı",
    when: "Claude bir kaynak dosyayı değiştirince kendiliğinden çalışır.",
    none: "Bu projede test komutu yok. Bakılan yerler: package.json, pyproject.toml, go.mod, Cargo.toml, pubspec.yaml, phpunit.xml. Claude'dan test eklemesini isteyin ya da bu modun ayarlarına bir test komutu yazın.",
    runBoth: "Testleri ve yazım kuralları denetimini çalıştır",
    runTests: "Testleri çalıştır",
    runLint: "Yazım kuralları denetimini çalıştır",
    lookAgain: "Yeniden ara"
  },
  github: {
    title: "GitHub'da",
    checked: (when) => `${when} bakıldı`,
    pr: (n) => `Değişiklik isteği #${n}`,
    noPr: "Bu çalışma dalı için izlenen bir değişiklik isteği (pull request) yok. Biri açılınca GitHub'daki otomatik kontrolleri burada görünür.",
    asking: "GitHub'a soruluyor…",
    starting: "Henüz kontrol görünmüyor; GitHub başlatıyor olabilir.",
    noChecks: "GitHub bu değişiklik isteği için hiç otomatik kontrol bildirmedi. Yani orada hiçbir şey test edilmedi; geçerli olan yalnızca bu bilgisayardaki testler.",
    allSkipped: "GitHub bu değişiklik isteği için bütün kontrolleri atladı.",
    failing: (failing, total) => `${total} kontrolün ${failing} tanesi başarısız.`,
    running: (done, total) => `${total} kontrolün ${done} tanesi bitti, gerisi sürüyor.`,
    allPassed: (total) => `${total} kontrolün hepsi geçti.`,
    stopped: (passed, total) => `${total} kontrolün ${passed} tanesi geçti; 90 dakika sonra izleme durdu.`,
    merged: "Bu değişiklik isteği ana çalışma dalına katıldı.",
    closed: "Bu değişiklik isteği kapatıldı."
  },
  chips: { all: "Hepsi", unit: "Birim", e2e: "Akış", lint: "Yazım kuralları", typecheck: "Tür" },
  suites: { unit: "birim testi", e2e: "akış testi", lint: "yazım kuralları denetimi", typecheck: "tür denetimi" },
  checkNames: { tests: "testler", lint: "yazım kuralları denetimi" },
  whyTimeout: "zaman aşımına uğradı",
  whyNotStarted: "başlatılamadı",
  whyUnread: "kaldı; hata yeri okunamadı",
  noFile: "dosya belirtilmemiş",
  errorCount: (count) => `${count} hata`,
  details: "Ayrıntı",
  compileError: "kod derlenemedi",
  paneTitle: "Testler",
  openCopied: (place) => `Açılamadı, kopyalandı: ${place}`,
  openFailed: (place) => `Açılamadı: ${place}`,
  commandRunning: "test-badge: testler ve yazım kuralları denetimi çalışıyor",
  commandDetails: "test-badge: ayrıntılar açıldı",
  commandSwitched: (isOn) => `test-badge ${isOn ? "açık" : "kapalı"}`,
  commandHelp: "Claude kodu düzenleyince testleri ve yazım kuralları denetimini kendiliğinden çalıştırır: aç/kapa; run şimdi başlatır, details sonuçları gösterir",
  consent: {
    header: "Testler",
    question: (commands, root) => `Kod düzenlenen her turdan sonra ${root} içinde şunlar kendiliğinden çalışsın mı?
${commands.join(`
`)}`,
    yes: "Evet, çalıştır",
    no: "Hayır"
  },
  fixSuggestion: "test-badge’in bulduğu kalan testleri düzelt",
  fixContext: (command, root) => `test-badge, ${root} içinde \`${command}\` çalıştırdı ve kaldı. Çıktı:`,
  ci: {
    eyebrow: "GitHub",
    allPassed: (passed, total) => `GitHub ${passed}/${total} geçti`,
    failing: (passed, total, failing) => `GitHub ${passed}/${total} · ${failing} başarısız`,
    running: (passed, total, pending) => `GitHub ${passed}/${total} · ${pending} sürüyor`,
    ended: (passed, total) => `GitHub ${passed}/${total} · izleme durdu`,
    waiting: "GitHub bekleniyor",
    merged: (n) => `Değişiklik isteği #${n} birleşti`,
    closed: (n) => `Değişiklik isteği #${n} kapandı`,
    states: { pending: "sürüyor", pass: "geçti", fail: "başarısız", skipped: "atlandı" },
    newTalk: (count) => `${count} yeni inceleme/yorum`,
    logs: "Ayrıntı",
    openPr: "Değişiklik isteğini aç",
    askFix: "Claude düzeltsin",
    dismiss: "Kapat",
    cardHeadline: (names) => `GitHub'daki otomatik kontroller başarısız: ${names}`,
    more: (count) => `+${count}`,
    notifyPassed: (n, passed, total) => `GitHub'daki otomatik kontroller geçti · #${n} · ${passed}/${total}`,
    notifyFailed: (n, names) => `GitHub'daki otomatik kontroller başarısız: ${names} · #${n}`,
    fixPrompt: (n, url, lines) => `PR #${n} için CI kaldı (${url}). Kalan kontroller:
${lines}
Nedenini bul (örneğin gh pr checks ${n} ve gh run view --log-failed ile) ve düzelt.`
  }
};
const EN$2 = {
  ago: { s: (n) => `${n}s ago`, m: (n) => `${n}m ago`, h: (n) => `${n}h ago` },
  took: (seconds) => `took ${seconds}s`,
  seconds: (ms, second) => `${(ms / second).toFixed(1)} s`,
  testsCount: (passed, total) => `tests ${passed}/${total}`,
  testsTimeout: "tests took too long",
  testsNotStarted: "tests didn't start",
  testsPassed: "tests passed",
  testsFailed: "tests failed",
  testsRunning: "tests running…",
  runningTail: "running…",
  running: "running",
  testTimeout: "tests took too long",
  testNotStarted: "tests didn't start",
  testPassed: "tests passed",
  testFailed: "tests failed",
  testRunning: "tests running",
  passedOf: (passed, total) => `${passed}/${total} passed`,
  failedOf: (failed, total) => `${failed}/${total} failed`,
  lintTimeout: "style rules took too long",
  lintNotStarted: "style rules didn't start",
  lintClean: "style rules ok",
  lintErrors: (errors) => `style rules: ${plural$1(errors, "error", "errors")}`,
  lintFailed: "style rules failed",
  verdict: {
    running: "Running your tests…",
    notRun: "No tests run yet",
    noCommand: "No test command found",
    everything: "Everything passes",
    passHere: "All tests pass on this computer",
    passGithubBusy: "Tests pass, GitHub is still checking",
    lintClean: "The style-rule check is clean",
    failing: (n) => plural$1(n, "test", "tests") + " failing",
    testsFailing: "Tests are failing",
    testsTooLong: "Tests took too long and were stopped",
    testsNoStart: "Tests couldn't start",
    lintProblems: (n) => plural$1(n, "style-rule problem", "style-rule problems"),
    lintFailing: "The style-rule check found problems",
    lintTooLong: "The style-rule check took too long and was stopped",
    lintNoStart: "The style-rule check couldn't start",
    githubFailing: (n) => `${plural$1(n, "automatic check", "automatic checks")} failing on GitHub`,
    both: (tests, checks) => `${plural$1(tests, "test", "tests")} and ${plural$1(checks, "automatic check", "automatic checks")} on GitHub failing`
  },
  local: {
    title: "On this computer",
    tests: "Tests",
    lint: "Style-rule check (lint)",
    notRun: "not run yet",
    running: "running…",
    passed: "passed",
    nPassed: (n) => `${plural$1(n, "test", "tests")} passed`,
    nFailed: (failed, total) => `${failed} of ${total} failed`,
    failed: "failed",
    failedYet: (passed) => `failed · ${passed} passed`,
    clean: "clean",
    problems: (n) => plural$1(n, "problem", "problems"),
    tooLong: "took too long",
    noStart: "couldn't start",
    when: "Runs by itself after Claude changes a source file.",
    none: "This project has no test command. Looked in package.json, pyproject.toml, go.mod, Cargo.toml, pubspec.yaml and phpunit.xml. Ask Claude to add tests, or set a test command in this mod's settings.",
    runBoth: "Run tests and style-rule check",
    runTests: "Run tests",
    runLint: "Run style-rule check",
    lookAgain: "Look again"
  },
  github: {
    title: "On GitHub",
    checked: (when) => `checked ${when}`,
    pr: (n) => `Change request #${n}`,
    noPr: "No change request (pull request) is being followed for this line of work. Once one is open, its automatic checks on GitHub show up here.",
    asking: "Asking GitHub…",
    starting: "No checks yet; GitHub may still be starting them.",
    noChecks: "GitHub reported no automatic checks for this change request. So nothing was tested there; only the tests on this computer count.",
    allSkipped: "GitHub skipped every check on this change request.",
    failing: (failing, total) => `${failing} of ${total} checks failed.`,
    running: (done, total) => `${done} of ${total} checks done, the rest still running.`,
    allPassed: (total) => total === 1 ? "The one check passed." : `All ${total} checks passed.`,
    stopped: (passed, total) => `${passed} of ${total} checks passed; stopped watching after 90 minutes.`,
    merged: "This change request was merged into the main line of work.",
    closed: "This change request was closed."
  },
  chips: { all: "All", unit: "Unit", e2e: "Full-flow", lint: "Style rules", typecheck: "Types" },
  suites: { unit: "unit test", e2e: "full-flow test", lint: "style-rule check", typecheck: "type check" },
  checkNames: { tests: "tests", lint: "style-rule check" },
  whyTimeout: "timed out",
  whyNotStarted: "couldn't start",
  whyUnread: "failed; couldn't tell where",
  noFile: "no file given",
  errorCount: (count) => plural$1(count, "error", "errors"),
  details: "Details",
  compileError: "code wouldn't build",
  paneTitle: "Tests",
  openCopied: (place) => `Couldn't open it, so copied ${place}`,
  openFailed: (place) => `Couldn't open ${place}`,
  commandRunning: "test-badge: running the tests and the style-rule check",
  commandDetails: "test-badge: details opened",
  commandSwitched: (isOn) => `test-badge ${isOn ? "on" : "off"}`,
  commandHelp: "Runs the tests and the style-rule check by themselves after Claude edits code: on or off; run starts them now, details shows the results",
  consent: {
    header: "Tests",
    question: (commands, root) => `After each turn that edits code, run these on their own in ${root}?
${commands.join(`
`)}`,
    yes: "Yes, run them",
    no: "No"
  },
  fixSuggestion: "Fix the failing checks test-badge found",
  fixContext: (command, root) => `test-badge ran \`${command}\` in ${root} and it failed. Output:`,
  ci: {
    eyebrow: "GitHub",
    allPassed: (passed, total) => `GitHub ${passed}/${total} passed`,
    failing: (passed, total, failing) => `GitHub ${passed}/${total} · ${failing} failing`,
    running: (passed, total, pending) => `GitHub ${passed}/${total} · ${pending} running`,
    ended: (passed, total) => `GitHub ${passed}/${total} · stopped watching`,
    waiting: "Waiting for GitHub",
    merged: (n) => `Change request #${n} merged`,
    closed: (n) => `Change request #${n} closed`,
    states: { pending: "running", pass: "passed", fail: "failed", skipped: "skipped" },
    newTalk: (count) => `${count} new ${count === 1 ? "review or comment" : "reviews or comments"}`,
    logs: "Details",
    openPr: "Open change request",
    askFix: "Ask Claude to fix",
    dismiss: "Dismiss",
    cardHeadline: (names) => `Automatic checks on GitHub failed: ${names}`,
    more: (count) => `+${count}`,
    notifyPassed: (n, passed, total) => `Automatic checks on GitHub passed · #${n} · ${passed}/${total}`,
    notifyFailed: (n, names) => `Automatic checks on GitHub failed: ${names} · #${n}`,
    fixPrompt: (n, url, lines) => `CI failed on PR #${n} (${url}). Failing checks:
${lines}
Find the cause (for example with gh pr checks ${n} and gh run view --log-failed) and fix it.`
  }
};
const words$1 = () => pick$1({ en: EN$2, tr: TR$2 });

const SECOND$1 = 1000;
const MINUTE = 60 * SECOND$1;
const HOUR = 60 * MINUTE;
function ago(ms) {
  const { ago: says } = words$1();
  if (ms < MINUTE)
    return says.s(Math.max(0, Math.round(ms / SECOND$1)));
  if (ms < HOUR)
    return says.m(Math.round(ms / MINUTE));
  return says.h(Math.round(ms / HOUR));
}
function isFailing(badge) {
  return [badge.tests, badge.lint].some((outcome) => outcome !== null && outcome.status !== "pass");
}
function failuresOf(badge) {
  return [...badge.tests?.failures ?? [], ...badge.lint?.failures ?? []];
}

const AUTO = { mode: "auto", isLight: false };
const NEUTRALS$1 = ["card", "inset", "line", "strong", "track", "hi", "mid", "lo"];
const ROLES$2 = ["tide", "kiln", "iris", "moss", "amber", "flare", "orchid"];
const DARK$1 = {
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
const LIGHT$1 = {
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
  ...NEUTRALS$1.map((name) => `--${name}:${palette[name]}`),
  ...ROLES$2.flatMap((role) => [`--${role}:${palette[role].fg}`, `--${role}-t:${palette[role].tint}`, `--${role}-l:${palette[role].line}`])
].join(";");
function themeCss() {
  return `svg,.t-dark{${varsOf(DARK$1)}}.t-light{${varsOf(LIGHT$1)}}@media (prefers-color-scheme: light){.t-auto{${varsOf(LIGHT$1)}}}`;
}

function countsOf(checks) {
  const count = (state) => checks.filter((check) => check.state === state).length;
  const passed = count("pass");
  const failing = count("fail");
  const pending = count("pending");
  return { passed, failing, pending, total: passed + failing + pending };
}
const newTalkOf = (watch) => Math.max(0, watch.talk - watch.talkAtStart);

const CHECK_ROLE = { pending: "kiln", pass: "moss", fail: "flare", skipped: "lo" };

const SANS = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`;
const MONO$2 = `ui-monospace, 'SF Mono', Menlo, monospace`;
const PX_PER_COLUMN$1 = 7;
const PANE_PX_PER_COLUMN = 9;
const MONO_EM = 0.6;
const BOLD_FROM = 600;
const BOLD_WIDEN = 1.06;
const ICON_GRID = 24;
const LABEL_FONT = { size: 12, weight: 600 };
const LIVE_DOT = 3;
const LIVE_GAP = 8;
const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const MOTION$1 = [
  "@keyframes tm-breathe{0%,100%{opacity:1}50%{opacity:.45}}.breathe{animation:tm-breathe 1.8s ease-in-out infinite}",
  "@keyframes tm-shimmer{0%,100%{opacity:.5}50%{opacity:1}}.shimmer{animation:tm-shimmer 1.4s linear infinite}",
  "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}"
].join("");
const ICONS = {
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  bell: '<path d="M18 16.5V11a6 6 0 1 0-12 0v5.5l-1.5 2h15z"/><path d="M10 21.2a2.3 2.3 0 0 0 4 0"/>',
  history: '<path d="M4.6 12.4a7.5 7.5 0 1 0 2.3-5.6"/><path d="M4.5 4.2v4.3h4.3"/><path d="M12 8.2V12l2.8 1.8"/>',
  flask: '<path d="M9.5 3.5h5M10.5 3.5v6.2L5.3 18.4a1.5 1.5 0 0 0 1.3 2.1h10.8a1.5 1.5 0 0 0 1.3-2.1l-5.2-8.7V3.5"/><path d="M7.6 15h8.8"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.8V12l3 2"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  chevron: '<path d="M10 7l5 5-5 5"/>'
};
const esc = (text) => text.replace(/[&<>"]/g, (ch) => ENTITIES[ch] ?? ch);
const px = (value) => String(Math.round(value * 10) / 10);
const NARROW_EM = 0.3;
const WIDE_EM = 0.72;
const OTHER_EM = 0.56;
function charEm(ch) {
  if (/[\s.,:;'|!il1()[\]ıjtf`]/.test(ch))
    return NARROW_EM;
  return /[A-ZÇĞİÖŞÜmwMW@%]/.test(ch) ? WIDE_EM : OTHER_EM;
}
function measure$1(text, font) {
  const chars = [...text];
  const em = font.isMono === true ? chars.length * MONO_EM : chars.reduce((sum, ch) => sum + charEm(ch), 0);
  const widen = (font.weight ?? 0) >= BOLD_FROM ? BOLD_WIDEN : 1;
  return em * font.size * widen;
}
function fit(text, width, font) {
  if (measure$1(text, font) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 1 && measure$1(`${chars.join("")}…`, font) > width)
    chars.pop();
  return `${chars.join("")}…`;
}
function fitStart(text, width, font) {
  if (measure$1(text, font) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 1 && measure$1(`…${chars.join("")}`, font) > width)
    chars.shift();
  return `…${chars.join("")}`;
}
function breakWord(word, width, font) {
  const pieces = [];
  let piece = "";
  for (const ch of word) {
    if (piece !== "" && measure$1(piece + ch, font) > width) {
      pieces.push(piece);
      piece = "";
    }
    piece += ch;
  }
  return piece === "" ? pieces : [...pieces, piece];
}
function wrapText(text, box) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean).flatMap((part) => breakWord(part, box.width, box.font))) {
    const tried = line === "" ? word : `${line} ${word}`;
    if (line !== "" && measure$1(tried, box.font) > box.width) {
      lines.push(line);
      line = word;
    } else
      line = tried;
  }
  if (line !== "")
    lines.push(line);
  if (lines.length <= box.maxLines)
    return lines;
  const kept = lines.slice(0, box.maxLines);
  kept[box.maxLines - 1] = fit(`${kept[box.maxLines - 1]} ${lines[box.maxLines]}`, box.width, box.font);
  return kept;
}
function svgWidth(columns, range) {
  const room = (columns - (range.reserve ?? 0)) * (range.isBand === true ? PX_PER_COLUMN$1 : PANE_PX_PER_COLUMN);
  return Math.round(Math.max(range.min, Math.min(range.max, room)));
}
function svgDoc$1(spec) {
  const { width, height } = spec;
  const style = `${themeCss()}text{font-family:${SANS};font-variant-numeric:tabular-nums}.mono{font-family:${MONO$2}}${MOTION$1}`;
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
function icon(name, at) {
  const scale = at.size / ICON_GRID;
  const width = (at.stroke ?? 1.75) / scale;
  return `<g transform="translate(${px(at.x)} ${px(at.y)}) scale(${scale})" fill="none" stroke-width="${px(width)}" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--${at.ink})">${ICONS[name]}</g>`;
}
function eyebrow(spec) {
  const isLive = spec.isLive === true;
  const dot = isLive ? `<circle class="breathe" cx="${px(spec.x + LIVE_DOT)}" cy="${px(spec.y - 4)}" r="${LIVE_DOT}" style="fill:var(--kiln)"/>` : "";
  const meta = spec.meta ?? "";
  const right = meta === "" ? "" : text({ size: 12, x: spec.x + spec.width, y: spec.y, text: meta, ink: "lo", anchor: "end" });
  return dot + text({ ...LABEL_FONT, x: spec.x + (isLive ? LIVE_DOT * 2 + LIVE_GAP : 0), y: spec.y, text: spec.label, ink: "lo" }) + right;
}
const PART_H = 36;
const partHead = (spec) => line({ x1: 0, y1: 0.5, x2: spec.width, y2: 0.5, ink: "line" }) + eyebrow({ x: 0, y: 25, width: spec.width, label: spec.label, meta: spec.meta, isLive: spec.isLive });
function fileBadge(spec) {
  const name = spec.path.split("/").pop() ?? spec.path;
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  const label = upper(ext === "" ? "·" : ext.slice(0, 3));
  return rect({ x: spec.x, y: spec.y, w: 26, h: 16, rx: 4, fill: "track" }) + text({ size: 9.5, weight: 700, isMono: true, x: spec.x + 13, y: spec.y + 11.5, text: label, ink: "lo", anchor: "middle" });
}
function bar(spec) {
  const radius = spec.height / 2;
  const track = rect({ x: spec.x, y: spec.y, w: spec.width, h: spec.height, rx: radius, fill: "track" });
  if (spec.value <= 0)
    return track;
  const width = Math.max(spec.height, spec.width * Math.min(spec.value, spec.total) / Math.max(1, spec.total));
  return track + rect({ x: spec.x, y: spec.y, w: width, h: spec.height, rx: radius, fill: spec.ink }).replace("<rect", '<rect data-m-fill=""');
}

const SECOND = 1000;
const SUITE_ORDER = ["unit", "e2e", "typecheck", "lint"];
const CHIPS = ["all", "unit", "e2e", "lint", "typecheck"];
const suiteTag = (suite) => words$1().suites[suite];
function failedOf(outcome) {
  if (outcome.passed === null || outcome.total === null)
    return null;
  const failed = outcome.total - outcome.passed;
  return outcome.status === "fail" && failed <= 0 ? null : failed;
}
function runMeta(badge, now) {
  if (badge.isRunning || badge.finishedAt === null)
    return "";
  return `${ago(now - badge.finishedAt)} · ${words$1().took(Math.max(1, Math.round(badge.durationMs / SECOND)))}`;
}
function chipsOf(badge, current = "all") {
  const all = failuresOf(badge);
  const counted = CHIPS.map((filter) => ({ filter, label: words$1().chips[filter], count: filter === "all" ? all.length : all.filter((item) => item.suite === filter).length }));
  return counted.filter((chip) => chip.filter === "all" || chip.filter === current || chip.count > 0);
}
function groupsOf(badge, filter) {
  const kept = failuresOf(badge).filter((item) => filter === "all" || item.suite === filter);
  const sorted = [...kept].sort((a, b) => SUITE_ORDER.indexOf(a.suite) - SUITE_ORDER.indexOf(b.suite));
  const files = [...new Set(sorted.map((item) => item.file))];
  return files.map((file) => ({ file, failures: sorted.filter((item) => item.file === file) }));
}
function durationText(ms) {
  if (ms === null || ms === undefined)
    return "";
  if (ms < 1)
    return "<1 ms";
  return ms < SECOND ? `${Math.round(ms)} ms` : words$1().seconds(ms, SECOND);
}
function spanOf(failure) {
  const name = (failure.file ?? "").split("/").pop() ?? "";
  if (name === "")
    return failure.line === null ? "—" : `:${failure.line}`;
  return failure.line === null ? name : `${name}:${failure.line}`;
}

const hasNoCommand = (commands) => commands !== null && commands.test === null && commands.lint === null;
function commandText(argv) {
  if (argv === null)
    return null;
  return argv[0] === "/bin/sh" ? argv[2] ?? "" : argv.join(" ");
}
const isOver = (ci) => ci.phase === "merged" || ci.phase === "closed";
const failingOnGithub = (ci) => ci === null || isOver(ci) ? 0 : countsOf(ci.checks).failing;
function localTrouble({ tests, lint }) {
  const says = words$1().verdict;
  if (tests?.status === "timeout")
    return { sentence: says.testsTooLong, tone: "amber", failed: null };
  if (tests?.status === "error")
    return { sentence: says.testsNoStart, tone: "amber", failed: null };
  if (tests?.status === "fail") {
    const failed = failedOf(tests);
    return { sentence: failed === null ? says.testsFailing : says.failing(failed), tone: "flare", failed };
  }
  if (lint === null || lint.status === "pass")
    return null;
  if (lint.status === "timeout")
    return { sentence: says.lintTooLong, tone: "amber", failed: null };
  if (lint.status === "error")
    return { sentence: says.lintNoStart, tone: "amber", failed: null };
  return { sentence: lint.errors !== null && lint.errors > 0 ? says.lintProblems(lint.errors) : says.lintFailing, tone: "amber", failed: null };
}
function passing({ badge, ci }) {
  const says = words$1().verdict;
  if (ci !== null && (ci.phase === "passed" || ci.phase === "merged"))
    return { sentence: says.everything, tone: "moss" };
  if (ci !== null && countsOf(ci.checks).pending > 0)
    return { sentence: says.passGithubBusy, tone: "neutral" };
  return { sentence: badge.tests === null ? says.lintClean : says.passHere, tone: "moss" };
}
function verdictOf(state) {
  const says = words$1().verdict;
  const { badge, ci, commands } = state;
  if (badge.isRunning)
    return { sentence: says.running, tone: "kiln" };
  const onGithub = failingOnGithub(ci);
  const trouble = localTrouble(badge);
  if (trouble !== null)
    return trouble.failed !== null && onGithub > 0 ? { sentence: says.both(trouble.failed, onGithub), tone: "flare" } : { sentence: trouble.sentence, tone: trouble.tone };
  if (onGithub > 0)
    return { sentence: says.githubFailing(onGithub), tone: "flare" };
  if (badge.finishedAt === null)
    return { sentence: hasNoCommand(commands) ? says.noCommand : says.notRun, tone: "neutral" };
  return passing(state);
}
function testsResult(outcome) {
  const says = words$1().local;
  if (outcome.status === "timeout")
    return { result: says.tooLong, state: "fail", role: "amber" };
  if (outcome.status === "error")
    return { result: says.noStart, state: "fail", role: "amber" };
  if (outcome.status === "pass")
    return { result: outcome.total === null ? says.passed : says.nPassed(outcome.total), state: "pass", role: "moss" };
  const failed = failedOf(outcome);
  if (failed !== null)
    return { result: says.nFailed(failed, outcome.total), state: "fail", role: "flare" };
  return { result: outcome.passed === null ? says.failed : says.failedYet(outcome.passed), state: "fail", role: "flare" };
}
function lintResult(outcome) {
  const says = words$1().local;
  if (outcome.status === "timeout")
    return { result: says.tooLong, state: "fail", role: "amber" };
  if (outcome.status === "error")
    return { result: says.noStart, state: "fail", role: "amber" };
  if (outcome.status === "pass")
    return { result: says.clean, state: "pass", role: "moss" };
  return { result: outcome.errors !== null && outcome.errors > 0 ? says.problems(outcome.errors) : says.failed, state: "fail", role: "amber" };
}
const IDLE = () => ({ result: words$1().local.notRun, state: "skipped", role: "lo" });
const RUNNING = () => ({ result: words$1().local.running, state: "pending", role: "kiln" });
function localRowsOf({ badge, commands }) {
  const says = words$1().local;
  if (hasNoCommand(commands) && badge.finishedAt === null)
    return [];
  const testCommand = commandText(commands?.test ?? null);
  const lintCommand = commandText(commands?.lint ?? null);
  const hasLint = lintCommand !== null || badge.lint !== null;
  const hasTests = testCommand !== null || badge.tests !== null || commands === null;
  const tests = { name: says.tests, command: testCommand, ...badge.isRunning ? RUNNING() : badge.tests === null ? IDLE() : testsResult(badge.tests) };
  const lint = { name: says.lint, command: lintCommand, ...badge.isRunning ? RUNNING() : badge.lint === null ? IDLE() : lintResult(badge.lint) };
  return [...hasTests ? [tests] : [], ...hasLint ? [lint] : []];
}
function runLabelOf(commands) {
  const says = words$1().local;
  if (hasNoCommand(commands))
    return says.lookAgain;
  if (commands?.test === null)
    return says.runLint;
  return commands === null || commands.lint === null ? says.runTests : says.runBoth;
}
function checksSentence(ci) {
  const says = words$1().github;
  const { passed, failing, pending, total } = countsOf(ci.checks);
  if (ci.phase === "merged")
    return says.merged;
  if (ci.phase === "closed")
    return says.closed;
  if (ci.checks.length > 0 && total === 0)
    return says.allSkipped;
  if (total === 0) {
    if (ci.phase === "watching")
      return ci.checkedAt === null ? says.asking : says.starting;
    return says.noChecks;
  }
  if (failing > 0)
    return says.failing(failing, total);
  if (ci.phase === "ended")
    return says.stopped(passed, total);
  return pending > 0 ? says.running(total - pending, total) : says.allPassed(total);
}
function githubSentence(ci) {
  const talk = newTalkOf(ci);
  return talk > 0 ? `${checksSentence(ci)} ${words$1().ci.newTalk(talk)}.` : checksSentence(ci);
}

const NAME$1 = { size: 13, weight: 500 };
const STATE = { size: 12 };
const PR = { size: 13, weight: 560 };
const BODY = { size: 12 };
const BODY_LINE = 17;
const PR_BASE = 16;
const BODY_GAP = 19;
const TITLE_LINES = 2;
const SENTENCE_LINES = 6;
const BOTTOM$1 = 6;
const WRAP_SLACK$1 = 12;
const ROW_H = 24;
const DOT_X = 5;
const DOT_R = 4;
const NAME_X = 20;
const STATE_GAP = 12;
const wrapped = (lines, spec) => lines.map((one, n) => text({ ...BODY, x: 0, y: spec.y + n * BODY_LINE, text: one, ink: spec.ink })).join("");
function ciHeadSvg(frame, spec) {
  const { watch } = spec;
  const says = words$1().github;
  const meta = watch.checkedAt === null ? "" : says.checked(ago(spec.now - watch.checkedAt));
  const pr = says.pr(watch.number);
  const box = { width: frame.width - WRAP_SLACK$1, font: BODY };
  const titles = wrapText(watch.title, { ...box, maxLines: TITLE_LINES });
  const sentence = githubSentence(watch);
  const sentences = wrapText(sentence, { ...box, maxLines: SENTENCE_LINES });
  const titleY = PART_H + PR_BASE + BODY_GAP;
  const sentenceY = titleY + titles.length * BODY_LINE + (BODY_GAP - BODY_LINE);
  const height = sentenceY + (sentences.length - 1) * BODY_LINE + BOTTOM$1;
  const body = partHead({ width: frame.width, label: says.title, meta, isLive: watch.phase === "watching" }) + text({ ...PR, x: 0, y: PART_H + PR_BASE, text: pr, ink: "hi" }) + wrapped(titles, { y: titleY, ink: "mid" }) + wrapped(sentences, { y: sentenceY, ink: "mid" });
  return { source: svgDoc$1({ width: frame.width, height, mode: frame.mode, body }), width: frame.width, height, alt: `${says.title}. ${pr}: ${watch.title}. ${sentence}` };
}
function noPrSvg(frame) {
  const says = words$1().github;
  const lines = wrapText(says.noPr, { width: frame.width - WRAP_SLACK$1, font: BODY, maxLines: SENTENCE_LINES });
  const height = PART_H + PR_BASE + (lines.length - 1) * BODY_LINE + BOTTOM$1;
  const body = partHead({ width: frame.width, label: says.title }) + wrapped(lines, { y: PART_H + PR_BASE, ink: "lo" });
  return { source: svgDoc$1({ width: frame.width, height, mode: frame.mode, body }), width: frame.width, height, alt: `${says.title}. ${says.noPr}` };
}
function dotOf(state, at) {
  const mid = at.cy;
  const role = at.role ?? CHECK_ROLE[state];
  if (state === "pending") {
    return `<circle cx="${DOT_X}" cy="${mid}" r="${DOT_R - 0.75}" fill="none" stroke-width="1.5" style="stroke:var(--${role})"/>` + `<circle class="breathe" cx="${DOT_X}" cy="${mid}" r="1.75" style="fill:var(--${role})"/>`;
  }
  if (state === "skipped") {
    return `<circle cx="${DOT_X}" cy="${mid}" r="${DOT_R - 0.75}" fill="none" stroke-width="1.5" style="stroke:var(--strong)"/>` + line({ x1: DOT_X - 1.75, y1: mid, x2: DOT_X + 1.75, y2: mid, ink: "lo" });
  }
  const glyph = icon(state === "pass" ? "check" : "x", { x: DOT_X - 3, y: mid - 3, size: 6, ink: "card", stroke: 1.5 });
  return `<circle cx="${DOT_X}" cy="${mid}" r="${DOT_R}" style="fill:var(--${role})"/>${glyph}`;
}
function checkRowSvg(frame, spec) {
  const { check } = spec;
  const label = words$1().ci.states[check.state];
  const room = frame.width - NAME_X - measure$1(label, STATE) - STATE_GAP;
  const rails = [
    spec.isFirst ? "" : rect({ x: DOT_X - 0.5, y: 0, w: 1, h: ROW_H / 2 - DOT_R - 1, fill: "strong" }),
    spec.isLast ? "" : rect({ x: DOT_X - 0.5, y: ROW_H / 2 + DOT_R + 1, w: 1, h: ROW_H / 2 - DOT_R - 1, fill: "strong" })
  ].join("");
  const body = rails + dotOf(check.state, { cy: ROW_H / 2 }) + text({ ...NAME$1, x: NAME_X, y: 16.5, text: fit(check.name, room, NAME$1), ink: check.state === "skipped" ? "lo" : "hi" }) + text({ ...STATE, x: frame.width, y: 16.5, text: label, ink: check.state === "pass" ? "lo" : CHECK_ROLE[check.state], anchor: "end" });
  const source = svgDoc$1({ width: frame.width, height: ROW_H, mode: frame.mode, body });
  return { source, width: frame.width, height: ROW_H, alt: `${check.name}: ${label}` };
}

const FILL$1 = /<rect\b[^>]*\bdata-m-fill\b[^>]*>/g;
const DONE$1 = /<path\b[^>]*\bdata-m-done\b[^>]*>/g;
const HAS_DONE$1 = /\bdata-m-done\b/;
const WIDTH$3 = /\swidth="([\d.]+)"/;
const CLASS$1 = /\sclass="([^"]*)"/;
const STYLE$1 = /\sstyle="([^"]*)"/;
const MIN_RATIO_STEP$1 = 0.02;
const RATIO_DIGITS$1 = 3;
const widthOf$1 = (tag) => Number(WIDTH$3.exec(tag)?.[1] ?? 0);
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

const motion$1 = paneMotion$1();
function picture(ui, drawing, key, opts) {
  const { Svg } = ui;
  return h(Svg, {
    key,
    ...motion$1.pic(key, drawing, opts)
  });
}

const WIDTH$2 = { min: 300, max: 880 };
const ROW_WIDTH$1 = { min: 220, max: 860, reserve: 8 };
const GLYPH = { pending: "◐", pass: "✓", fail: "✕", skipped: "–" };
const look = (role) => role === "lo" ? { dimColor: true } : { color: THEME_KEY[role] };
const logsLink = (ui, check, index) => {
  const { Link } = ui;
  return check.link === null ? null : h(Link, {
    key: `tb-ci-link-${index}`,
    href: check.link,
    label: words$1().ci.logs
  });
};
const headShows = (ci, frame) => ({ frame, number: ci.number, title: ci.title, phase: ci.phase, checks: ci.checks, talk: newTalkOf(ci), isChecked: ci.checkedAt !== null });
function richSection(ui, view) {
  const { Box, Link } = ui;
  const frame = { width: svgWidth(view.columns, WIDTH$2), mode: view.theme.mode };
  const rowFrame = { width: svgWidth(view.columns, ROW_WIDTH$1), mode: view.theme.mode };
  const { checks } = view.ci;
  return h(Box, {
    key: "tb-ci",
    flexDirection: "column",
    rowGap: 1
  }, picture(ui, ciHeadSvg(frame, { watch: view.ci, now: view.now }), "tb-ci-head", { shows: headShows(view.ci, frame) }), checks.length > 0 && h(Box, {
    key: "tb-ci-checks",
    flexDirection: "column"
  }, checks.map((check, index) => h(Box, {
    key: `tb-ci-row-${index}`,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 1
  }, picture(ui, checkRowSvg(rowFrame, { check, isFirst: index === 0, isLast: index === checks.length - 1 }), `tb-ci-svg-${check.name}`), logsLink(ui, check, index)))), h(Box, {
    flexDirection: "row"
  }, h(Link, {
    key: "tb-ci-pr",
    href: view.ci.url,
    label: words$1().ci.openPr
  })));
}
function textSection(ui, view) {
  const { Box, Text, Link } = ui;
  const { ci } = view;
  const says = words$1().github;
  return h(Box, {
    key: "tb-ci",
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 1
  }, h(Text, {
    bold: true,
    dimColor: true
  }, `${ci.phase === "watching" ? "◐ " : ""}${says.title}`), h(Text, {
    dimColor: true
  }, ci.checkedAt === null ? "" : says.checked(ago(view.now - ci.checkedAt)))), h(Text, {
    bold: true
  }, says.pr(ci.number)), h(Text, {
    wrap: "truncate"
  }, ci.title), h(Text, {
    dimColor: true,
    wrap: "wrap"
  }, githubSentence(ci)), ci.checks.map((check, index) => h(Box, {
    key: `tb-ci-row-${index}`,
    flexDirection: "row",
    columnGap: 1,
    paddingLeft: 2
  }, h(Text, {
    ...look(CHECK_ROLE[check.state])
  }, GLYPH[check.state]), h(Box, {
    flexShrink: 1
  }, h(Text, {
    wrap: "truncate",
    dimColor: check.state === "skipped"
  }, check.name)), h(Text, {
    dimColor: true
  }, words$1().ci.states[check.state]), logsLink(ui, check, index))), h(Box, {
    flexDirection: "row"
  }, h(Link, {
    key: "tb-ci-pr",
    href: ci.url,
    label: words$1().ci.openPr
  })));
}
function ciPart(ui, view) {
  const { ci } = view;
  if (ci !== null)
    return view.isRich ? richSection(ui, { ...view, ci }) : textSection(ui, { ...view, ci });
  const { Box, Text } = ui;
  if (view.isRich)
    return picture(ui, noPrSvg({ width: svgWidth(view.columns, WIDTH$2), mode: view.theme.mode }), "tb-ci-none");
  return h(Box, {
    key: "tb-ci",
    flexDirection: "column"
  }, h(Text, {
    bold: true,
    dimColor: true
  }, words$1().github.title), h(Text, {
    dimColor: true,
    wrap: "wrap"
  }, words$1().github.noPr));
}

const VERDICT = { size: 16, weight: 600 };
const VERDICT_LINE = 22;
const VERDICT_BASE = 18;
const VERDICT_LINES = 3;
const NAME = { size: 13, weight: 500 };
const RESULT = { size: 12 };
const COMMAND = { size: 11.5, isMono: true };
const NOTE = { size: 12 };
const NOTE_LINE = 17;
const NOTE_LINES = 8;
const LOCAL_ROW_H = 42;
const BARE_ROW_H = 26;
const LOCAL_NAME_BASE = 16;
const LOCAL_COMMAND_BASE = 33;
const LOCAL_DOT_Y = 12;
const LOCAL_NAME_X = 20;
const LOCAL_GAP = 12;
const METER_H = 4;
const METER_ROOM = 10;
const WRAP_SLACK = 12;
const NOTE_GAP = 18;
const BOTTOM = 6;
const TITLE$1 = { size: 13, weight: 560 };
const SPAN = { size: 11.5, isMono: true };
const MESSAGE = { size: 11.5, isMono: true };
const META = { size: 12 };
const PATH = { size: 13, weight: 560 };
const FILE_H = 26;
const ROW_BASE = 17;
const NAME_LINE = 18;
const MESSAGE_GAP = 19;
const MESSAGE_LINE = 16;
const ROW_PAD = 9;
const ROW_TOP = 4;
const TEXT_INDENT = 16;
const SPAN_GAP = 10;
const CHEVRON = 14;
const CHEVRON_ROOM = 24;
const EDGE = 8;
const NAME_LINES = 4;
const MESSAGE_LINES = 8;
const inkOf = (tone) => tone === "neutral" ? "hi" : tone;
function verdictSvg(frame, verdict) {
  const lines = wrapText(verdict.sentence, { width: frame.width, font: VERDICT, maxLines: VERDICT_LINES });
  const body = lines.map((line, n) => text({ ...VERDICT, x: 0, y: VERDICT_BASE + n * VERDICT_LINE, text: line, ink: inkOf(verdict.tone) }));
  const height = VERDICT_BASE + (lines.length - 1) * VERDICT_LINE + BOTTOM;
  return { source: svgDoc$1({ width: frame.width, height, mode: frame.mode, body: body.join("") }), width: frame.width, height, alt: verdict.sentence };
}
function localRow(frame, row, spec) {
  const { top, meter } = spec;
  const room = frame.width - LOCAL_NAME_X - measure$1(row.result, RESULT) - LOCAL_GAP;
  const command = row.command === null ? "" : text({ ...COMMAND, x: LOCAL_NAME_X, y: top + LOCAL_COMMAND_BASE, text: fit(row.command, frame.width - LOCAL_NAME_X, COMMAND), ink: "lo" });
  const svg = dotOf(row.state, { cy: top + LOCAL_DOT_Y, role: row.role }) + text({ ...NAME, x: LOCAL_NAME_X, y: top + LOCAL_NAME_BASE, text: fit(row.name, room, NAME), ink: "hi" }) + text({ ...RESULT, x: frame.width, y: top + LOCAL_NAME_BASE, text: row.result, ink: row.role, anchor: "end" }) + command;
  const height = row.command === null ? BARE_ROW_H : LOCAL_ROW_H;
  if (meter === null)
    return { svg, height };
  const drawn = bar({ x: LOCAL_NAME_X, y: top + height - METER_H / 2, width: frame.width - LOCAL_NAME_X, height: METER_H, total: meter.total, value: meter.passed, ink: meter.passed === meter.total ? "moss" : "lo" });
  return { svg: svg + drawn, height: height + METER_ROOM };
}
function localPartSvg(frame, part) {
  const rows = [];
  let y = PART_H;
  for (const [index, row] of part.rows.entries()) {
    const drawn = localRow(frame, row, { top: y, meter: index === 0 ? part.meter : null });
    rows.push(drawn.svg);
    y += drawn.height;
  }
  const notes = wrapText(part.note, { width: frame.width - WRAP_SLACK, font: NOTE, maxLines: NOTE_LINES });
  const noteSvg = notes.map((line, n) => text({ ...NOTE, x: 0, y: y + NOTE_GAP + n * NOTE_LINE, text: line, ink: part.rows.length === 0 ? "mid" : "lo" }));
  const height = y + NOTE_GAP + (notes.length - 1) * NOTE_LINE + BOTTOM;
  const body = partHead({ width: frame.width, label: part.title, meta: part.meta, isLive: part.isLive }) + rows.join("") + noteSvg.join("");
  const said = part.rows.map((row) => `${row.name}${row.command === null ? "" : ` (${row.command})`}: ${row.result}`);
  return { source: svgDoc$1({ width: frame.width, height, mode: frame.mode, body }), width: frame.width, height, alt: [part.title, ...said, part.note].join(". ") };
}
function fileHeadSvg(frame, spec) {
  const count = words$1().errorCount(spec.count);
  const room = frame.width - 34 - measure$1(count, META) - CHEVRON_ROOM;
  const path = spec.file ?? words$1().noFile;
  const cut = path.lastIndexOf("/");
  const name = fit(path.slice(cut + 1), room, PATH);
  const dir = fitStart(path.slice(0, cut + 1), Math.max(0, room - measure$1(name, PATH)), { size: PATH.size });
  const body = fileBadge({ x: 0, y: 5, path }) + runs({ x: 34, y: 17.5, size: PATH.size, parts: [{ text: dir === "…" ? "" : dir, ink: "lo", weight: 500 }, { text: name, ink: "hi", weight: PATH.weight }] }) + text({ ...META, x: frame.width - CHEVRON_ROOM, y: 17.5, text: count, ink: "lo", anchor: "end" });
  return { source: svgDoc$1({ width: frame.width, height: FILE_H, mode: frame.mode, body }), width: frame.width, height: FILE_H, alt: `${path}: ${count}` };
}
function rowSvg(frame, failure, isPressable) {
  const right = frame.width - (isPressable ? CHEVRON_ROOM : EDGE);
  const base = ROW_TOP + ROW_BASE;
  const place = text({ ...SPAN, x: TEXT_INDENT, y: base, text: spanOf(failure), ink: "lo" });
  const meta = [suiteTag(failure.suite), durationText(failure.durationMs)].filter((part) => part !== "").join(" · ");
  const titleX = TEXT_INDENT + measure$1(spanOf(failure), SPAN) + SPAN_GAP;
  const isInline = measure$1(failure.name, TITLE$1) <= right - titleX - measure$1(meta, META) - 14;
  const names = isInline ? [failure.name] : wrapText(failure.name, { width: right - TEXT_INDENT * 2, font: TITLE$1, maxLines: NAME_LINES });
  const title = names.map((line, n) => text({ ...TITLE$1, x: isInline ? titleX : TEXT_INDENT, y: base + (isInline ? 0 : (n + 1) * NAME_LINE), text: line, ink: "hi" }));
  const metaText = text({ ...META, x: right, y: base, text: meta, ink: "lo", anchor: "end" });
  const nameBottom = base + (isInline ? 0 : names.length * NAME_LINE);
  const messages = failure.message === "" ? [] : wrapText(failure.message, { width: right - TEXT_INDENT * 2, font: MESSAGE, maxLines: MESSAGE_LINES });
  const message = messages.map((line, n) => text({ ...MESSAGE, x: TEXT_INDENT, y: nameBottom + MESSAGE_GAP + n * MESSAGE_LINE, text: line, ink: "mid" }));
  const height = (messages.length === 0 ? nameBottom : nameBottom + MESSAGE_GAP + (messages.length - 1) * MESSAGE_LINE) + ROW_PAD;
  const chevron = isPressable ? icon("chevron", { x: frame.width - CHEVRON - 4, y: (height - CHEVRON) / 2, size: CHEVRON, ink: "lo", stroke: 1.5 }) : "";
  const source = svgDoc$1({ width: frame.width, height, mode: frame.mode, body: place + title.join("") + metaText + message.join("") + chevron });
  return { source, width: frame.width, height, alt: `${spanOf(failure)} ${failure.name}${failure.message === "" ? "" : `: ${failure.message}`}` };
}
function tailHeadSvg(frame, title) {
  const body = icon("x", { x: 0, y: 5, size: 16, ink: "flare", stroke: 1.5 }) + text({ ...TITLE$1, x: 24, y: 16.5, text: fit(title, frame.width - 24, TITLE$1), ink: "hi" });
  return { source: svgDoc$1({ width: frame.width, height: FILE_H, mode: frame.mode, body }), width: frame.width, height: FILE_H, alt: title };
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

const LINE_WIDTH = 4;
const ROW_INDENT$1 = 4;
const ROW_GLYPH = "› ";
const NAME_GAP = "  ";
const MESSAGE_INDENT = ROW_GLYPH.length + LINE_WIDTH + NAME_GAP.length;
const BAR_MAX$2 = 40;
const BAR_MIN$2 = 8;
const colorOf = (tone) => tone === "neutral" ? { dimColor: true } : { color: THEME_KEY[tone] };
const clip$2 = (text, max) => text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text;
function unplacedOf(spec) {
  const { outcome } = spec;
  if (outcome === null || outcome.status === "pass" || outcome.failures.length > 0)
    return null;
  const says = words$1();
  const why = { timeout: says.whyTimeout, error: says.whyNotStarted };
  return { title: `${says.checkNames[spec.name]} ${why[outcome.status] ?? says.whyUnread}`, lines: outcome.tail };
}
function chipRow(ui, view) {
  const { Box, Button } = ui;
  return h(Box, {
    flexDirection: "row",
    columnGap: 1,
    flexWrap: "wrap"
  }, chipsOf(view.badge, view.filter).map((chip) => h(Button, {
    key: `tb-filter-${chip.filter}`,
    label: `${chip.label} ${chip.count}`,
    plain: true,
    dimColor: chip.filter !== view.filter,
    onPress: () => view.onFilter(chip.filter)
  })));
}
function rerunRow(ui, view) {
  const { Box, Button } = ui;
  return h(Box, {
    flexDirection: "row"
  }, h(Button, {
    key: "tb-rerun",
    variant: "secondary",
    hotkey: "r",
    label: runLabelOf(view.commands),
    onPress: view.onRerun
  }));
}
function barText(ui, view) {
  const { Box, Text } = ui;
  const tests = view.badge.tests;
  if (tests === null || tests.total === null || tests.passed === null || tests.total === 0)
    return null;
  const width = Math.max(BAR_MIN$2, Math.min(BAR_MAX$2, view.columns - 2));
  const passed = Math.round(width * tests.passed / tests.total);
  return h(Box, {
    flexDirection: "row"
  }, h(Text, {
    color: "success"
  }, "━".repeat(passed)), h(Text, {
    color: "error"
  }, "━".repeat(width - passed)));
}
function rowText(ui, view, failure) {
  const { Box, Text, Button } = ui;
  const index = failuresOf(view.badge).indexOf(failure);
  const line = failure.line === null ? "" : String(failure.line);
  const meta = [suiteTag(failure.suite), durationText(failure.durationMs)].filter((part) => part !== "").join(" · ");
  const label = clip$2(`${ROW_GLYPH}${line.padStart(LINE_WIDTH)}${NAME_GAP}${failure.name}`, view.columns - ROW_INDENT$1 - meta.length - 2);
  return h(Box, {
    key: `tb-row-${index}`,
    flexDirection: "column",
    paddingLeft: ROW_INDENT$1
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, failure.file === null ? h(Text, null, label) : h(Button, {
    key: `tb-open-${index}`,
    plain: true,
    label,
    onPress: () => view.onOpen(failure)
  }), h(Text, {
    dimColor: true
  }, meta)), failure.message !== "" && h(Box, {
    paddingLeft: MESSAGE_INDENT
  }, h(Text, {
    dimColor: true,
    wrap: "wrap"
  }, failure.message)));
}
function failuresText(ui, view) {
  const { Box, Text } = ui;
  return groupsOf(view.badge, view.filter).map((group) => h(Box, {
    key: `tb-file-${group.file ?? "-"}`,
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    bold: true,
    wrap: "truncate-start"
  }, `  ${group.file ?? words$1().noFile}`), h(Text, {
    dimColor: true
  }, `· ${words$1().errorCount(group.failures.length)}`)), group.failures.map((failure) => rowText(ui, view, failure))));
}
function tailText(ui, spec) {
  const { Box, Text } = ui;
  const unplaced = unplacedOf(spec);
  if (unplaced === null)
    return null;
  return h(Box, {
    key: `tb-tail-${spec.name}`,
    flexDirection: "column"
  }, h(Text, {
    bold: true
  }, unplaced.title), unplaced.lines.map((line, index) => h(Text, {
    key: `tb-tail-${spec.name}-${index}`,
    dimColor: true,
    wrap: "wrap"
  }, `   ${line}`)));
}
function textPane(ui, view) {
  const { Box, Text } = ui;
  const { badge } = view;
  const state = { badge, ci: view.ci, commands: view.commands };
  const verdict = verdictOf(state);
  const rows = localRowsOf(state);
  const says = words$1().local;
  return h(Box, {
    flexDirection: "column"
  }, h(Box, {
    key: "tb-verdict"
  }, h(Text, {
    bold: true,
    wrap: "wrap",
    ...verdict.tone === "neutral" ? {} : colorOf(verdict.tone)
  }, verdict.sentence)), h(Text, null, " "), h(Box, {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 1
  }, h(Text, {
    bold: true,
    dimColor: true
  }, `${badge.isRunning ? "◐ " : ""}${says.title}`), h(Text, {
    dimColor: true
  }, runMeta(badge, view.now))), rows.map((row) => h(Box, {
    key: `tb-local-${row.name}`,
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    ...look(row.role)
  }, GLYPH[row.state]), h(Text, null, row.name), h(Text, {
    ...look(row.role)
  }, row.result)), row.command !== null && h(Text, {
    dimColor: true,
    wrap: "truncate"
  }, `  ${row.command}`))), barText(ui, view), h(Text, {
    dimColor: true,
    wrap: "wrap"
  }, rows.length === 0 ? says.none : says.when), h(Text, null, " "), isFailing(badge) && chipRow(ui, view), isFailing(badge) && failuresText(ui, view), isFailing(badge) && view.filter === "all" && tailText(ui, { name: "tests", outcome: badge.tests }), isFailing(badge) && view.filter === "all" && tailText(ui, { name: "lint", outcome: badge.lint }), isFailing(badge) && h(Text, null, " "), rerunRow(ui, view), h(Text, null, " "), ciPart(ui, view));
}

const ROW_INDENT = 2;
const WIDTH$1 = { min: 300, max: 880 };
const ROW_WIDTH = { min: 220, max: 880, reserve: ROW_INDENT };
const failureKey = (failure) => `${failure.suite}:${failure.file ?? "-"}:${failure.line ?? "-"}:${failure.name}:${failure.message}`;
function failureRow(ui, view, spec) {
  const { failure, index } = spec;
  const isPressable = failure.file !== null;
  const frame = { width: spec.width, mode: view.theme.mode };
  const drawing = picture(ui, rowSvg(frame, failure, isPressable), `tb-svg-${failureKey(failure)}`, { isRow: isPressable });
  if (!isPressable)
    return drawing;
  return PressRow(ui, { box: `tb-press-${index}`, key: `tb-open-${index}`, drawing, onPress: () => view.onOpen(failure) });
}
function groupTree(ui, view, group) {
  const { Box } = ui;
  const all = failuresOf(view.badge);
  const width = svgWidth(view.columns, ROW_WIDTH);
  const head = fileHeadSvg({ width: svgWidth(view.columns, WIDTH$1), mode: view.theme.mode }, { file: group.file, count: group.failures.length });
  return h(Box, {
    key: `tb-file-${group.file ?? "-"}`,
    flexDirection: "column"
  }, picture(ui, head, `tb-head-${group.file ?? "-"}`), group.failures.map((failure) => {
    const index = all.indexOf(failure);
    return h(Box, {
      key: `tb-row-${index}`,
      flexDirection: "row",
      paddingLeft: ROW_INDENT
    }, failureRow(ui, view, { failure, index, width }));
  }));
}
function tailTree(ui, view, spec) {
  const { Box, Text } = ui;
  const unplaced = unplacedOf(spec);
  if (unplaced === null)
    return null;
  const drawing = tailHeadSvg({ width: svgWidth(view.columns, WIDTH$1), mode: view.theme.mode }, unplaced.title);
  return h(Box, {
    key: `tb-tail-${spec.name}`,
    flexDirection: "column"
  }, picture(ui, drawing, `tb-tail-head-${spec.name}`), unplaced.lines.map((line, index) => h(Text, {
    key: `tb-tail-${spec.name}-${index}`,
    dimColor: true,
    wrap: "wrap"
  }, `   ${line}`)));
}
function failuresTree(ui, view) {
  const { Box } = ui;
  if (!isFailing(view.badge))
    return null;
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, chipRow(ui, view), groupsOf(view.badge, view.filter).map((group) => groupTree(ui, view, group)), view.filter === "all" && tailTree(ui, view, { name: "tests", outcome: view.badge.tests }), view.filter === "all" && tailTree(ui, view, { name: "lint", outcome: view.badge.lint }));
}
function meterOf({ tests, ...badge }) {
  if (badge.isRunning || tests === null || tests.total === null || tests.passed === null)
    return null;
  return { passed: tests.passed, total: tests.total };
}
function localPart(ui, view, state) {
  const frame = { width: svgWidth(view.columns, WIDTH$1), mode: view.theme.mode };
  const says = words$1().local;
  const rows = localRowsOf(state);
  const part = { title: says.title, meta: runMeta(view.badge, view.now), isLive: view.badge.isRunning, rows, meter: meterOf(view.badge), note: rows.length === 0 ? says.none : says.when };
  return picture(ui, localPartSvg(frame, part), "tb-local", { shows: { frame, part: { ...part, meta: view.badge.finishedAt } } });
}
function paneTree$1(ui, view) {
  const { Box } = ui;
  if (!view.isRich)
    return textPane(ui, view);
  const state = { badge: view.badge, ci: view.ci, commands: view.commands };
  const frame = { width: svgWidth(view.columns, WIDTH$1), mode: view.theme.mode };
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, picture(ui, verdictSvg(frame, verdictOf(state)), "tb-verdict"), localPart(ui, view, state), failuresTree(ui, view), rerunRow(ui, view), ciPart(ui, view));
}

const BADGE = { plugin: "test-badge", key: "badge" };
const FILTER = { plugin: "test-badge", key: "filter" };
const THEME = { plugin: "test-badge", key: "theme" };
const CI = { plugin: "test-badge", key: "ci" };
const COMMANDS$1 = { plugin: "test-badge", key: "commands" };
async function testsPage($, ui, site, act) {
  setLang$1(lang$1());
  const badge = (await $.state.get(BADGE)).value ?? EMPTY;
  const view = {
    badge,
    now: await $.clock.now(),
    columns: site.columns,
    filter: (await $.state.get(FILTER)).value ?? "all",
    theme: (await $.state.get(THEME)).value ?? AUTO,
    isRich: site.surface !== "terminal",
    onOpen: (failure) => act("open", JSON.stringify([failuresOf(badge).indexOf(failure), site.surface])),
    onRerun: () => act("rerun"),
    onFilter: (filter) => act("filter", filter),
    ci: (await $.state.get(CI)).value ?? null,
    commands: (await $.state.get(COMMANDS$1)).value ?? null
  };
  return paneTree$1(ui, view);
}

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const pick = (table) => table[current];

const SHORT = {
  en: { five_hour: "5h", seven_day: "week", spend_limit: "spend", context: "memory" },
  tr: { five_hour: "5s", seven_day: "hafta", spend_limit: "harcama", context: "hafıza" }
};
const LONG = {
  en: { five_hour: "5-hour allowance", seven_day: "weekly allowance", spend_limit: "spend limit", context: "chat memory" },
  tr: { five_hour: "5 saatlik hak", seven_day: "haftalık hak", spend_limit: "harcama sınırı", context: "sohbet hafızası" }
};
const shortLabels = () => pick(SHORT);
const longLabels = () => pick(LONG);
const UNITS = {
  en: { decimalMark: ".", percent: (rounded) => `${rounded}%`, full: "full", day: "d", hour: "h", minute: "m", billion: "B" },
  tr: { decimalMark: ",", percent: (rounded) => `%${rounded}`, full: "dolu", day: "g", hour: "sa", minute: "dk", billion: "Mr" }
};
const units = () => pick(UNITS);
const WEEKDAYS = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  tr: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]
};
const weekdays = () => pick(WEEKDAYS);
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const nouns = (count, one) => count === 1 ? one : `${one}s`;
const EN$1 = {
  paneTitle: "Usage",
  limits: "Limits",
  compact: "Summarize",
  session: "session",
  sessionCost: "session cost",
  thisSession: "this session",
  noReadings: "Nothing measured yet; the numbers arrive with the first answer.",
  hidden: "Usage line hidden.",
  shown: "Usage line shown.",
  commandFailed: "The /hud command did not work.",
  commandDescription: 'Show or hide the usage line above your message box; "/hud full" opens the details; "/hud band auto|always|alerts" picks when it shows',
  bandSet: (mode) => `Usage line: ${mode}${mode === "auto" ? " (only warnings in the desktop app, which shows your allowances itself; the full line in the terminal)" : ""}.`,
  bandUsage: "Write one of: /hud band auto | always | alerts",
  timeToCompact: "worth summarizing now",
  readings: (count) => plural(count, "reading", "readings"),
  sessionAt: (cost) => `session ${cost}`,
  range: (low, high) => `range ${low}–${high}`,
  ahead: (points) => `${plural(points, "point", "points")} ahead of an even pace`,
  pace: (percent) => `even pace ${percent}`,
  free: (spec) => `room for ${spec.tokens} more ${nouns(spec.count, "token")}`,
  lastTurnTokens: (spec) => `last turn ${spec.tokens} ${nouns(spec.count, "token")}`,
  turn: (spec) => `last turn: read ${spec.input} · wrote ${spec.output} · ${spec.cache} reused · ${plural(spec.requests, "model call", "model calls")}`,
  resetsIn: (reset) => `refills in ${reset}`,
  resetsAfter: (reset) => `refills in ${reset}`,
  limitFull: (label) => `${label} used up`,
  limitAt: (label, value) => `${label}: ${value} used`,
  compactFailed: (message) => `Could not summarize the chat (compact): ${message}`,
  contextTitle: "Chat memory (context)",
  other: "Other",
  freeSpace: "Free",
  reserve: "Set aside",
  compactNow: "Summarize now",
  compacting: "Summarizing…",
  noBreakdown: "No breakdown yet.",
  compacted: "Summarized",
  compactedFrom: (spec) => `Summarized ${spec.before} → ${spec.after}`,
  estimate: (used, total) => `~${used} / ${total}`,
  fullAt: (time) => `~full at ${time}`,
  fullAtShort: (time) => `~full ${time}`,
  turnsLeft: (count) => `~${plural(count, "turn", "turns")} left`,
  turnsShort: (count) => `~${plural(count, "turn", "turns")}`,
  lastTurns: (count) => `last ${plural(count, "turn", "turns")}`,
  pastTitle: "History",
  activeDays: "active days",
  sessions: "sessions",
  tokens: "tokens",
  tokensApart: (cache) => `tokens · ${cache} kept ready`,
  topModel: "most used",
  rangeLabel: (days) => `${days} days`,
  lastDays: (days) => `last ${days} days`,
  pastLine: (spec) => [`${spec.active}/${spec.range} active days`, plural(spec.sessions, "session", "sessions"), `${spec.tokens} tokens read and written`, `${spec.cache} kept ready`, spec.model === null ? "" : `mostly ${spec.model}`].filter((part) => part !== "").join(" · "),
  dayTokens: (day, tokens) => `${day}: ${tokens} tokens`
};
const TR$1 = {
  paneTitle: "Kullanım",
  limits: "Limitler",
  compact: "Özetle",
  session: "oturum",
  sessionCost: "oturum maliyeti",
  thisSession: "bu oturum",
  noReadings: "Henüz ölçüm yok; sayılar ilk yanıtla gelir.",
  hidden: "Kullanım satırı gizlendi.",
  shown: "Kullanım satırı gösteriliyor.",
  commandFailed: "/hud komutu çalışmadı.",
  commandDescription: 'Mesaj kutusunun üstündeki kullanım satırını aç/kapat; "/hud full" ayrıntıları açar; "/hud band auto|always|alerts" ne zaman görüneceğini seçer',
  bandSet: (mode) => `Kullanım satırı: ${mode}${mode === "auto" ? " (masaüstü uygulamasında yalnızca uyarılar, kullanım haklarını uygulama zaten gösteriyor; terminalde tam satır)" : ""}.`,
  bandUsage: "Şunlardan biri: /hud band auto | always | alerts",
  timeToCompact: "özetlemek iyi olur",
  readings: (count) => `${count} ölçüm`,
  sessionAt: (cost) => `oturum ${cost}`,
  range: (low, high) => `aralık ${low}–${high}`,
  ahead: (points) => `eşit hızdan ${points} puan önde`,
  pace: (percent) => `eşit hızda ${percent}`,
  free: (spec) => `${spec.tokens} token daha sığar`,
  lastTurnTokens: (spec) => `son tur ${spec.tokens} token`,
  turn: (spec) => `son tur: okunan ${spec.input} · yazılan ${spec.output} · ${spec.cache} hazır sohbetten · ${spec.requests} model çağrısı`,
  resetsIn: (reset) => `yenilenme ${reset}`,
  resetsAfter: (reset) => `${reset} sonra yenilenir`,
  limitFull: (label) => `${label} doldu`,
  limitAt: (label, value) => `${label}: ${value} kullanıldı`,
  compactFailed: (message) => `Sohbet özetlenemedi (compact): ${message}`,
  contextTitle: "Sohbet hafızası (context)",
  other: "Diğer",
  freeSpace: "Boş",
  reserve: "Yedek pay",
  compactNow: "Şimdi özetle",
  compacting: "Özetleniyor…",
  noBreakdown: "Henüz döküm yok.",
  compacted: "Özetlendi",
  compactedFrom: (spec) => `Özetlendi: ${spec.before} → ${spec.after}`,
  estimate: (used, total) => `~${used} / ${total}`,
  fullAt: (time) => `~${time} civarında dolar`,
  fullAtShort: (time) => `~dolar ${time}`,
  turnsLeft: (count) => `~${count} tur kaldı`,
  turnsShort: (count) => `~${count} tur`,
  lastTurns: (count) => `son ${count} tur`,
  pastTitle: "Geçmiş",
  activeDays: "kullanılan gün",
  sessions: "oturum",
  tokens: "token",
  tokensApart: (cache) => `token · ${cache} hazır tutulan`,
  topModel: "en çok",
  rangeLabel: (days) => `${days} gün`,
  lastDays: (days) => `son ${days} gün`,
  pastLine: (spec) => [`${spec.active}/${spec.range} kullanılan gün`, `${spec.sessions} oturum`, `${spec.tokens} token okunup yazıldı`, `${spec.cache} hazır tutulan`, spec.model === null ? "" : `çoğunlukla ${spec.model}`].filter((part) => part !== "").join(" · "),
  dayTokens: (day, tokens) => `${day}: ${tokens} token`
};
const WORDS$3 = { en: EN$1, tr: TR$1 };
const words = () => pick(WORDS$3);

const THOUSAND = 1000;
const MILLION = 1e6;
const BILLION = 1e9;
const PERCENT$1 = 100;
const MS_PER_MINUTE = 60000;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440;
const MS_PER_HOUR = 3600000;
const HOURS_PER_DAY = 24;
const AHEAD_POINTS = 10;
const DANGER_PERCENT = 95;
const CONTEXT_WARN = 70;
const NO_PACE_WARN = 80;
const CONTEXT = "context";
const FIVE_HOUR = "five_hour";
const WINDOW_MS = {
  five_hour: 5 * MS_PER_HOUR,
  seven_day: 7 * HOURS_PER_DAY * MS_PER_HOUR
};
const labelOf = (id) => shortLabels()[id] ?? id.replace(/_/g, " ");
const longLabelOf = (id) => longLabels()[id] ?? id.replace(/_/g, " ");
function paceOf$1(gauge, nowMs) {
  const windowMs = WINDOW_MS[gauge.id];
  if (windowMs === undefined || gauge.resetsAt === null)
    return null;
  const resetMs = Date.parse(gauge.resetsAt);
  if (Number.isNaN(resetMs))
    return null;
  const elapsed = windowMs - Math.max(0, resetMs - nowMs);
  return Math.max(0, Math.min(PERCENT$1, elapsed / windowMs * PERCENT$1));
}
function toneOf(spec) {
  if (spec.percent >= DANGER_PERCENT)
    return "danger";
  if (spec.pace !== null)
    return spec.percent >= spec.pace + AHEAD_POINTS ? "warn" : "neutral";
  return spec.percent >= (spec.id === CONTEXT ? CONTEXT_WARN : NO_PACE_WARN) ? "warn" : "neutral";
}
const decimal = (value, digits) => value.toFixed(digits).replace(".", units().decimalMark);
const short = (value) => value.toFixed(1).replace(/\.0$/, "").replace(".", units().decimalMark);
const percentText = (percent) => units().percent(Math.round(percent));
const isFull = (percent) => percent >= PERCENT$1;
const valueText = (percent) => isFull(percent) ? units().full : percentText(percent);
const RESET_MARK = "↻";
const resetText = (reset) => `${RESET_MARK} ${reset}`;
const costText = (usd) => `≈$${decimal(usd, 2)}`;
function compact(count) {
  if (count >= BILLION)
    return `${short(count / BILLION)}${units().billion}`;
  if (count >= MILLION)
    return `${short(count / MILLION)}M`;
  if (count >= THOUSAND)
    return `${short(count / THOUSAND)}k`;
  return String(Math.round(count));
}
function cachePercent(turn) {
  if (turn.input === 0)
    return 0;
  return Math.round(turn.cacheRead / turn.input * PERCENT$1);
}
function filledCells(percent, width) {
  const clamped = Math.max(0, Math.min(PERCENT$1, percent));
  if (clamped === 0)
    return 0;
  return Math.max(1, Math.round(clamped / PERCENT$1 * width));
}
function untilReset(resetsAt, nowMs) {
  if (resetsAt === null)
    return "";
  const resetMs = Date.parse(resetsAt);
  if (Number.isNaN(resetMs))
    return "";
  const minutes = Math.max(0, Math.round((resetMs - nowMs) / MS_PER_MINUTE));
  const days = Math.floor(minutes / MINUTES_PER_DAY);
  const hours = Math.floor(minutes % MINUTES_PER_DAY / MINUTES_PER_HOUR);
  const unit = units();
  if (days > 0)
    return `${days}${unit.day} ${hours}${unit.hour}`;
  if (hours > 0)
    return `${hours}${unit.hour} ${minutes % MINUTES_PER_HOUR}${unit.minute}`;
  return `${minutes}${unit.minute}`;
}
const SPARK_CELLS = 16;
const SPARK$1 = "▁▂▃▄▅▆▇█";
function sparkText(series, max) {
  if (series.length < 2 || max <= 0)
    return "";
  return series.slice(-SPARK_CELLS).map((value) => SPARK$1[Math.max(0, Math.min(SPARK$1.length - 1, Math.round(value / max * (SPARK$1.length - 1))))]).join("");
}

const PACE_MIN_SAMPLES = 3;
const PACE_MIN_SPAN_MS = 10 * 60000;
const PACE_LOOKBACK_MS = 60 * 60000;
const FULL_WARN_MS = 60 * 60000;
const TURNS_MIN_SAMPLES = 3;
const TURNS_WARN = 5;
const TWO_DIGITS = 2;
function pointsOf(history, id) {
  return history.flatMap((sample) => {
    const value = sample.percents[id];
    return value === undefined ? [] : [{ t: sample.t, value }];
  });
}
function sinceLastDrop(items, valueOf) {
  let start = 0;
  for (let index = 1;index < items.length; index += 1) {
    const item = items[index];
    const before = items[index - 1];
    if (item !== undefined && before !== undefined && valueOf(item) < valueOf(before))
      start = index;
  }
  return items.slice(start);
}
function slopeOf(points) {
  const meanT = points.reduce((sum, point) => sum + point.t, 0) / points.length;
  const meanV = points.reduce((sum, point) => sum + point.value, 0) / points.length;
  const top = points.reduce((sum, point) => sum + (point.t - meanT) * (point.value - meanV), 0);
  const bottom = points.reduce((sum, point) => sum + (point.t - meanT) ** 2, 0);
  return bottom === 0 ? 0 : top / bottom;
}
const recentOf = (spec) => sinceLastDrop(spec.points.filter((point) => spec.nowMs - point.t <= (spec.lookbackMs ?? PACE_LOOKBACK_MS)), (point) => point.value);
function burnOf(spec) {
  const recent = recentOf(spec);
  const first = recent[0];
  const last = recent[recent.length - 1];
  if (first === undefined || last === undefined || recent.length < PACE_MIN_SAMPLES)
    return null;
  return last.t - first.t < PACE_MIN_SPAN_MS ? null : slopeOf(recent);
}
function fullAtOf(spec) {
  const resetMs = spec.resetsAt === null ? Number.NaN : Date.parse(spec.resetsAt);
  if (Number.isNaN(resetMs) || spec.percent >= PERCENT$1)
    return null;
  const slope = burnOf(spec);
  if (slope === null || slope <= 0)
    return null;
  const fullAt = spec.nowMs + (PERCENT$1 - spec.percent) / slope;
  return fullAt < resetMs ? Math.round(fullAt) : null;
}
function turnsLeftOf(turns, limit) {
  const recent = sinceLastDrop(turns, (tokens) => tokens);
  const first = recent[0];
  const last = recent[recent.length - 1];
  if (first === undefined || last === undefined || recent.length < TURNS_MIN_SAMPLES)
    return null;
  const growth = (last - first) / (recent.length - 1);
  if (growth <= 0 || last >= limit)
    return null;
  return Math.max(1, Math.floor((limit - last) / growth));
}
const pad = (value) => String(value).padStart(TWO_DIGITS, "0");
function clockText(atMs, nowMs) {
  const at = new Date(atMs);
  const time = `${pad(at.getHours())}:${pad(at.getMinutes())}`;
  if (at.toDateString() === new Date(nowMs).toDateString())
    return time;
  return `${weekdays()[at.getDay()] ?? ""} ${time}`;
}

let compactAt = null;
function forecastsFrom(input) {
  const limit = (input.compactAt === undefined ? compactAt : input.compactAt) ?? input.usage?.context?.window ?? null;
  return { history: input.history, turnsLeft: limit === null ? null : turnsLeftOf(input.turns, limit) };
}

const SEVEN_DAY = "seven_day";
const HOUR_MS = 3600000;
const DAY_HOURS = 24;
const WEEK_HOURS = 7 * DAY_HOURS;
const WEEK_MIN_EVEN_PERCENT = 5;
const LOOKBACK_MS = { [FIVE_HOUR]: HOUR_MS, [SEVEN_DAY]: DAY_HOURS * HOUR_MS };
function paceWindow(usage) {
  const gauges = usage?.gauges ?? [];
  return gauges.find((gauge) => gauge.id === FIVE_HOUR) ?? gauges.find((gauge) => gauge.id === SEVEN_DAY) ?? null;
}
function weekPaceOf(gauge, nowMs) {
  const even = paceOf$1(gauge, nowMs);
  if (even === null || even < WEEK_MIN_EVEN_PERCENT || gauge.resetsAt === null)
    return { perHour: null, fullAt: null };
  const perHour = gauge.percent / (even / PERCENT$1 * WEEK_HOURS);
  if (perHour <= 0 || gauge.percent >= PERCENT$1)
    return { perHour, fullAt: null };
  const fullAt = nowMs + (PERCENT$1 - gauge.percent) / perHour * HOUR_MS;
  return { perHour, fullAt: fullAt < Date.parse(gauge.resetsAt) ? Math.round(fullAt) : null };
}
function paceOf(spec) {
  const gauge = paceWindow(spec.usage);
  if (gauge === null)
    return null;
  const burn = { points: pointsOf(spec.history, gauge.id), nowMs: spec.nowMs, lookbackMs: LOOKBACK_MS[gauge.id] ?? HOUR_MS };
  const readings = recentOf(burn).length;
  if (gauge.id === SEVEN_DAY)
    return { gauge, readings, ...weekPaceOf(gauge, spec.nowMs) };
  const slope = burnOf(burn);
  return {
    gauge,
    readings,
    perHour: slope === null ? null : slope * HOUR_MS,
    fullAt: fullAtOf({ ...burn, percent: gauge.percent, resetsAt: gauge.resetsAt })
  };
}

const EN = {
  paceTitle: "Pace",
  rate: (window, percent, rate) => `${window} ${percent} used · rising ${rate} an hour`,
  fills: (time, reset) => `At this pace it runs out ${time}, before it refills at ${reset}`,
  lasts: (reset) => `At this pace it lasts until it refills at ${reset}`,
  tooFew: (count, needed, minutes) => `Not enough measurements to tell the pace yet: ${count} of ${needed}, over at least ${minutes} min. It shows after a few turns.`,
  lastTurn: (share, window) => `Last turn used ${share} of the ${window}`,
  before: (shares) => `Turns before, newest first: ${shares}`,
  sharesNote: "A share is how much of the allowance went while the turn ran; your other chats on the account count too.",
  noTurns: "How much each turn used shows here once a turn ends.",
  noWindow: "This account has no 5-hour or weekly allowance, so there is no pace to show. Cost shows under Limits.",
  listPrice: "estimate at list prices"
};
const TR = {
  paceTitle: "Hız",
  rate: (window, percent, rate) => `${window} ${percent} kullanıldı · saatte ${rate} artıyor`,
  fills: (time, reset) => `Bu hızla ${time} biter; yenilenme ${reset}`,
  lasts: (reset) => `Bu hızla yenilenmeye (${reset}) kadar yeter`,
  tooFew: (count, needed, minutes) => `Hızı söylemek için ölçüm az: ${needed} ölçümden ${count}, en az ${minutes} dk içinde. Birkaç turdan sonra görünür.`,
  lastTurn: (share, window) => `Son tur ${window}tan ${share} kullandı`,
  before: (shares) => `Önceki turlar, yeniden eskiye: ${shares}`,
  sharesNote: "Pay, tur sürerken kullanım hakkından ne kadar gittiğidir; hesaptaki öbür sohbetlerin de sayılır.",
  noTurns: "Bir tur bitince her turun ne kadar kullandığı burada görünür.",
  noWindow: "Bu hesapta 5 saatlik ya da haftalık kullanım hakkı yok; gösterilecek hız yok. Maliyet Limitler altında.",
  listPrice: "liste fiyatıyla tahmin"
};
const usageWords = () => pick({ en: EN, tr: TR });

const MINUTE_MS = 60000;
const TENTHS = 10;
const BEFORE_SEPARATOR = " · ";
function rateText(perHour) {
  const rate = Math.max(0, perHour);
  if (rate >= TENTHS)
    return percentText(rate);
  return units().percent(Math.round(rate * TENTHS) / TENTHS).replace(".", units().decimalMark);
}
function rateLines(pace, nowMs) {
  const says = usageWords();
  if (pace.perHour === null)
    return [says.tooFew(pace.readings, PACE_MIN_SAMPLES, PACE_MIN_SPAN_MS / MINUTE_MS)];
  const head = says.rate(longLabelOf(pace.gauge.id), percentText(pace.gauge.percent), rateText(pace.perHour));
  const resetMs = pace.gauge.resetsAt === null ? Number.NaN : Date.parse(pace.gauge.resetsAt);
  if (Number.isNaN(resetMs))
    return [head];
  const reset = clockText(resetMs, nowMs);
  return [head, pace.fullAt === null ? says.lasts(reset) : says.fills(clockText(pace.fullAt, nowMs), reset)];
}
function shareLines(pace, shares) {
  const says = usageWords();
  const mine = shares.filter((share) => share.window === pace.gauge.id);
  const last = mine[mine.length - 1];
  if (last === undefined)
    return [says.noTurns];
  const before = mine.slice(0, -1).reverse().map((share) => percentText(share.share));
  const head = says.lastTurn(percentText(last.share), longLabelOf(last.window));
  return [head, ...before.length === 0 ? [] : [says.before(before.join(BEFORE_SEPARATOR))], says.sharesNote];
}
function paceSection(spec) {
  const base = { id: "pace", title: usageWords().paceTitle, at: 0 };
  const pace = spec.pace;
  if (pace === null)
    return { ...base, lines: [usageWords().noWindow], tone: "neutral", isEmpty: true };
  const isEmpty = pace.perHour === null && !spec.shares.some((share) => share.window === pace.gauge.id);
  return { ...base, lines: [...rateLines(pace, spec.nowMs), ...shareLines(pace, spec.shares)], tone: pace.fullAt === null ? "neutral" : "warn", isEmpty };
}

function seriesOf(history, id) {
  return history.map((sample) => sample.percents[id]).filter((value) => value !== undefined);
}
function costSeries(history) {
  return history.map((sample) => sample.cost).filter((value) => value !== undefined);
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

const motion = paneMotion();

const NEUTRALS = {
  sheet: { dark: "#191917", light: "#F4F2EC" },
  card: { dark: "#1F1F1C", light: "#FFFFFF" },
  inset: { dark: "#171715", light: "#F6F4EF" },
  line: { dark: "#2E2E2A", light: "#E4E0D6" },
  strong: { dark: "#45443F", light: "#CFC9BC" },
  track: { dark: "#34332F", light: "#ECE8DF" },
  hi: { dark: "#F0EEE8", light: "#1C1B19" },
  mid: { dark: "#C2BEB4", light: "#4F4B44" },
  lo: { dark: "#8E8A80", light: "#77726A" }
};
const role$1 = (fg, tint, line) => ({
  fg: { dark: fg[0], light: fg[1] },
  tint: { dark: tint[0], light: tint[1] },
  line: { dark: line[0], light: line[1] }
});
const ROLES$1 = {
  read: role$1(["#7FB6E8", "#2464A0"], ["#1E2B37", "#E7F0F9"], ["#2F4A63", "#B9D3EC"]),
  edit: role$1(["#E58A5F", "#A94A26"], ["#38251D", "#FBEDE6"], ["#6A3E2D", "#EFC6B4"]),
  run: role$1(["#B19CF3", "#6243C4"], ["#29243D", "#F0ECFC"], ["#4A3F75", "#CFC3F3"]),
  ok: role$1(["#6FC593", "#1F6E43"], ["#1B2F25", "#E4F4EA"], ["#2F5A42", "#B5DEC4"]),
  warn: role$1(["#E9B949", "#8A6000"], ["#332D19", "#FBF2D9"], ["#66552A", "#EBD48F"]),
  danger: role$1(["#F2727F", "#C0263A"], ["#3B2023", "#FCE8EA"], ["#74343C", "#F1B9C0"]),
  plan: role$1(["#E07BC0", "#A8337F"], ["#351F2E", "#FBE9F4"], ["#6B3A5C", "#EDBFDC"])
};
const TERMINAL_KEY = {
  read: "suggestion",
  edit: "claude",
  run: "permission",
  ok: "success",
  warn: "warning",
  danger: "error",
  plan: "merged"
};
const FONT$1 = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`;
const MONO$1 = `ui-monospace, 'SF Mono', Menlo, monospace`;
function rules(scheme) {
  const neutral = Object.entries(NEUTRALS).map(([name, pair]) => `.f-${name}{fill:${pair[scheme]}}.s-${name}{stroke:${pair[scheme]}}`);
  const roles = Object.entries(ROLES$1).map(([name, colors]) => [
    `.f-${name}{fill:${colors.fg[scheme]}}.s-${name}{stroke:${colors.fg[scheme]}}`,
    `.f-${name}-t{fill:${colors.tint[scheme]}}.s-${name}-l{stroke:${colors.line[scheme]}}`
  ].join(""));
  return [...neutral, ...roles].join("");
}
function svgStyle$1(extra = "") {
  return [
    "<style>",
    `text{font-family:${FONT$1}}.num{font-family:${MONO$1};font-variant-numeric:tabular-nums}.tab{font-variant-numeric:tabular-nums}`,
    rules("dark"),
    `@media (prefers-color-scheme: light){${rules("light")}}`,
    extra,
    "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}",
    "</style>"
  ].join("");
}
const fillOf = (tone, neutral = "hi") => tone === "neutral" ? `f-${neutral}` : `f-${tone}`;
const strokeOf = (tone, neutral = "mid") => tone === "neutral" ? `s-${neutral}` : `s-${tone}`;
const terminalColor = (tone) => tone === "neutral" ? undefined : TERMINAL_KEY[tone];

const AREA_OPACITY = 0.12;
const LABEL_SIZE = 12;
const LABEL_WEIGHT = 600;
const PERCENT = 100;
const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const NARROW = "iljtf.,:;|!'` ·";
const WIDE = "mwMW@%";
const DIGIT_EM = 0.6;
function measure(text, size, isMono = false) {
  if (isMono)
    return [...text].length * size * 0.6;
  return [...text].reduce((sum, char) => {
    if (NARROW.includes(char))
      return sum + size * 0.3;
    if (WIDE.includes(char))
      return sum + size * 0.82;
    if (char >= "0" && char <= "9")
      return sum + size * DIGIT_EM;
    return sum + (char >= "A" && char <= "Z" ? size * 0.66 : size * 0.55);
  }, 0);
}
function svgDoc(spec) {
  const width = Math.ceil(spec.width);
  const height = Math.ceil(spec.height);
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  return { source: `${open}${svgStyle$1(spec.css)}${spec.body}</svg>`, alt: spec.alt, width, height };
}
const clampPercent = (value) => Math.max(0, Math.min(PERCENT, value));
const filledOf = (spec) => spec.percent <= 0 ? 0 : Math.max(spec.height, clampPercent(spec.percent) / PERCENT * spec.width);
function meter(spec) {
  const { x, y, width, height } = spec;
  const filled = filledOf(spec);
  const parts = [
    `<rect class="f-track" x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}"/>`,
    filled > 0 ? `<rect data-m-fill="" class="${fillOf(spec.tone, "mid")}" x="${x}" y="${y}" width="${filled.toFixed(1)}" height="${height}" rx="${height / 2}"/>` : ""
  ];
  if (spec.pace !== null) {
    const tickX = x + clampPercent(spec.pace) / PERCENT * width;
    parts.push(`<rect class="f-hi" x="${(tickX - 0.5).toFixed(1)}" y="${y - 2}" width="1.5" height="${height + 4}" rx=".75"/>`);
  }
  return parts.join("");
}
function sparkline(spec) {
  if (spec.values.length < 2 || spec.max <= 0)
    return "";
  const stepX = spec.width / (spec.values.length - 1);
  const points = spec.values.map((value, index) => {
    const ratio = Math.max(0, Math.min(1, value / spec.max));
    return `${(spec.x + index * stepX).toFixed(1)} ${(spec.y + spec.height - ratio * spec.height).toFixed(1)}`;
  });
  const bottom = spec.y + spec.height;
  const area = `M${spec.x} ${bottom} L${points.join(" L")} L${spec.x + spec.width} ${bottom} Z`;
  return [
    `<path class="${fillOf(spec.tone, "mid")}" fill-opacity="${AREA_OPACITY}" d="${area}"/>`,
    `<path class="${strokeOf(spec.tone)}" fill="none" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" d="M${points.join(" L")}"/>`
  ].join("");
}
function groupLabel(text, at) {
  return `<text class="f-lo" x="${at.x}" y="${at.y}" font-size="${LABEL_SIZE}" font-weight="${LABEL_WEIGHT}">${escape(text)}</text>`;
}

const PAD$1 = 0;
const LABEL_Y$1 = 13;
const BAR$2 = { y: 26, h: 8 };
const LEGEND = { top: 54, row: 18, size: 11.5, swatch: 8, gap: 16, inner: 6 };
const SPARK = { w: 120, h: 22, gap: 12 };
const NOTE_SIZE = 11.5;
const FOOT_H = 40;
const EMPTY_H = 22;
const BOTTOM_PAD$1 = 4;
const USED_OPACITY = [1, 0.72, 0.5, 0.34];
const OTHER_OPACITY = 0.2;
function paintOf(segment, rank, isSwatch = false) {
  if (segment.kind === "free")
    return isSwatch ? 'class="f-track s-strong"' : 'class="f-track"';
  if (segment.kind === "reserve")
    return 'class="f-strong"';
  const opacity = segment.kind === "other" ? OTHER_OPACITY : USED_OPACITY[rank] ?? OTHER_OPACITY;
  return `class="f-mid" fill-opacity="${opacity}"`;
}
function barSvg(view, width) {
  let x = PAD$1;
  const parts = view.segments.map((segment, rank) => {
    const share = segment.tokens / view.total * width;
    const drawn = `<rect ${paintOf(segment, rank)} x="${x.toFixed(1)}" y="${BAR$2.y}" width="${share.toFixed(1)}" height="${BAR$2.h}"/>`;
    x += share;
    return drawn;
  });
  const clip = `<clipPath id="ctx-bar"><rect x="${PAD$1}" y="${BAR$2.y}" width="${width}" height="${BAR$2.h}" rx="${BAR$2.h / 2}"/></clipPath>`;
  return `${clip}<g clip-path="url(#ctx-bar)"><rect class="f-track" x="${PAD$1}" y="${BAR$2.y}" width="${width}" height="${BAR$2.h}"/>${parts.join("")}</g>`;
}
function legendSvg(view, width) {
  let x = PAD$1;
  let row = 0;
  const body = view.segments.map((segment, rank) => {
    const label = `${segment.label} `;
    const value = compact(segment.tokens);
    const itemW = LEGEND.swatch + LEGEND.inner + measure(label, LEGEND.size) + measure(value, LEGEND.size, true);
    if (x > PAD$1 && x + itemW > PAD$1 + width) {
      row += 1;
      x = PAD$1;
    }
    const y = LEGEND.top + row * LEGEND.row;
    const swatch = `<rect ${paintOf(segment, rank, true)} x="${x + 0.5}" y="${y - LEGEND.swatch + 0.5}" width="${LEGEND.swatch - 1}" height="${LEGEND.swatch - 1}" rx="2"/>`;
    const textX = x + LEGEND.swatch + LEGEND.inner;
    const text = `<text x="${textX.toFixed(1)}" y="${y}" font-size="${LEGEND.size}"><tspan class="f-mid">${escape(label)}</tspan><tspan class="f-hi num">${value}</tspan></text>`;
    x += itemW + LEGEND.gap;
    return swatch + text;
  });
  return { body: body.join(""), rows: row + 1 };
}
function footSvg(spec, top) {
  const max = Math.max(...spec.turns, 1);
  const spark = sparkline({ x: PAD$1, y: top, width: SPARK.w, height: SPARK.h, values: spec.turns, max, tone: "neutral" });
  const hasSpark = spark !== "";
  const noteX = hasSpark ? PAD$1 + SPARK.w + SPARK.gap : PAD$1;
  const caption = spec.turns.length > 1 ? words().lastTurns(spec.turns.length) : "";
  const note = spec.forecast === "" ? "" : `<text class="f-hi" x="${noteX}" y="${top + 10}" font-size="${NOTE_SIZE}" font-weight="600">${escape(spec.forecast)}</text>`;
  const captionY = spec.forecast === "" ? top + 10 : top + SPARK.h + 2;
  const captionText = caption === "" ? "" : `<text class="f-lo" x="${noteX}" y="${captionY}" font-size="10.5">${escape(caption)}</text>`;
  return spark + note + captionText;
}
function contextSvg(spec) {
  const inner = spec.width - PAD$1 * 2;
  const head = [
    groupLabel(words().contextTitle, { x: PAD$1, y: LABEL_Y$1 }),
    `<text class="f-lo num" x="${spec.width - PAD$1}" y="${LABEL_Y$1}" font-size="10.5" text-anchor="end">${escape(spec.meta)}</text>`
  ].join("");
  const legend = spec.view === null ? null : legendSvg(spec.view, inner);
  const middle = spec.view === null || legend === null ? `<text class="f-lo" x="${PAD$1}" y="${BAR$2.y + BAR$2.h}" font-size="${NOTE_SIZE}">${escape(words().noBreakdown)}</text>` : barSvg(spec.view, inner) + legend.body;
  const footTop = legend === null ? BAR$2.y + EMPTY_H : LEGEND.top + (legend.rows - 1) * LEGEND.row + LEGEND.row;
  const hasFoot = spec.turns.length > 1 || spec.forecast !== "";
  const height = (hasFoot ? footTop + FOOT_H : footTop) + BOTTOM_PAD$1 - LEGEND.row / 2;
  const foot = hasFoot ? footSvg(spec, footTop) : "";
  const alt = [words().contextTitle, spec.meta, ...spec.view?.segments.map((segment) => `${segment.label} ${compact(segment.tokens)}`) ?? [], spec.forecast].filter((part) => part !== "").join(" · ");
  return svgDoc({ width: spec.width, height, body: head + middle + foot, alt });
}

const BAR_MIN$1 = 16;
const BAR_MAX$1 = 48;
const BAR_CHROME = 4;
const USED_GLYPHS = ["█", "▓", "▒", "░"];
const OTHER_GLYPH = "░";
const FREE_GLYPH = "─";
const RESERVE_GLYPH = "┄";
function glyphOf(segment, rank) {
  if (segment.kind === "free")
    return FREE_GLYPH;
  if (segment.kind === "reserve")
    return RESERVE_GLYPH;
  return segment.kind === "other" ? OTHER_GLYPH : USED_GLYPHS[rank] ?? OTHER_GLYPH;
}
function cellsOf(view, width) {
  const cells = view.segments.map((segment) => Math.max(1, Math.round(segment.tokens / view.total * width)));
  const largest = cells.indexOf(Math.max(...cells));
  const drift = width - cells.reduce((sum, count) => sum + count, 0);
  if (largest >= 0)
    cells[largest] = Math.max(1, (cells[largest] ?? 0) + drift);
  return cells;
}
const isAccent = (segment) => segment.kind === "used";
function terminalBar(ui, view, columns) {
  const { Box, Text } = ui;
  const width = Math.max(BAR_MIN$1, Math.min(BAR_MAX$1, columns - BAR_CHROME));
  const cells = cellsOf(view, width);
  return h(Box, {
    flexDirection: "row"
  }, view.segments.map((segment, rank) => {
    const glyphs = glyphOf(segment, rank).repeat(cells[rank] ?? 0);
    return isAccent(segment) ? h(Text, {
      key: `bar-${rank}`
    }, glyphs) : h(Text, {
      key: `bar-${rank}`,
      dimColor: true
    }, glyphs);
  }));
}
function legendLines(view) {
  const entries = view.segments.map((segment, rank) => ({ segment, text: `${glyphOf(segment, rank)} ${segment.label} ${compact(segment.tokens)}` }));
  const isFilled = (segment) => segment.kind === "used" || segment.kind === "other";
  return [entries.filter((entry) => isFilled(entry.segment)), entries.filter((entry) => !isFilled(entry.segment))].map((group) => group.map((entry) => entry.text).join(" · ")).filter((line) => line !== "");
}
function metaOf$1(card) {
  if (card.view !== null)
    return words().estimate(compact(card.view.usedTokens), compact(card.view.total));
  if (card.context !== null)
    return `${compact(card.context.tokens)} / ${compact(card.context.window)}`;
  return "";
}
function compactedText(last) {
  if (last === null)
    return "";
  if (last.before === null || last.after === null)
    return words().compacted;
  return words().compactedFrom({ before: compact(last.before), after: compact(last.after) });
}
function actions(ui, card) {
  const { Box, Button, Text } = ui;
  const result = compactedText(card.lastCompact);
  if (card.context === null && result === "")
    return null;
  return h(Box, {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 2,
    marginTop: 1
  }, card.context !== null && !card.isCompacting && h(Button, {
    key: "compact-now",
    label: words().compactNow,
    onPress: card.compact
  }), card.isCompacting && h(Text, {
    dimColor: true
  }, words().compacting), result !== "" && h(Text, {
    dimColor: true
  }, result));
}
function terminalCard$1(ui, card) {
  const { Box, Text } = ui;
  const spark = sparkText(card.turns, Math.max(...card.turns, 1));
  return h(Box, {
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    justifyContent: "space-between"
  }, h(Text, {
    bold: true
  }, words().contextTitle), h(Text, {
    dimColor: true
  }, metaOf$1(card))), card.view === null ? h(Text, {
    dimColor: true
  }, words().noBreakdown) : terminalBar(ui, card.view, card.columns), card.view !== null && legendLines(card.view).map((line, index) => h(Text, {
    key: `legend-${index}`,
    dimColor: true
  }, line)), (spark !== "" || card.forecast !== "") && h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, spark !== "" && h(Text, {
    dimColor: true
  }, `${words().lastTurns(card.turns.length)} ${spark}`), card.forecast !== "" && h(Text, null, card.forecast)));
}
function bodyOf(ui, card) {
  const Svg = card.svg;
  if (Svg === undefined || card.width === undefined)
    return terminalCard$1(ui, card);
  const spec = { view: card.view, turns: card.turns, forecast: card.forecast, meta: metaOf$1(card), width: card.width };
  return h(Svg, {
    key: "hud-context",
    ...motion.pic("hud-context", contextSvg(spec), { shows: spec })
  });
}
function contextCard(ui, card) {
  const { Box } = ui;
  return h(Box, {
    key: "context-card",
    flexDirection: "column",
    marginTop: 1
  }, bodyOf(ui, card), actions(ui, card));
}

const NO_ESTIMATE = { forecast: "", alert: "" };
function estimateOf(gauge, nowMs, forecasts) {
  if (gauge.id === CONTEXT) {
    const turns = forecasts.turnsLeft;
    if (turns === null)
      return NO_ESTIMATE;
    return { forecast: words().turnsLeft(turns), alert: turns <= TURNS_WARN ? words().turnsShort(turns) : "" };
  }
  if (gauge.id !== FIVE_HOUR)
    return NO_ESTIMATE;
  const fullAt = fullAtOf({ points: pointsOf(forecasts.history, gauge.id), percent: gauge.percent, resetsAt: gauge.resetsAt, nowMs });
  if (fullAt === null)
    return NO_ESTIMATE;
  const time = clockText(fullAt, nowMs);
  return { forecast: words().fullAt(time), alert: fullAt - nowMs <= FULL_WARN_MS ? words().fullAtShort(time) : "" };
}
function gaugeViews(usage, nowMs, forecasts) {
  return usage.gauges.map((gauge) => {
    const pace = paceOf$1(gauge, nowMs);
    return {
      id: gauge.id,
      short: labelOf(gauge.id),
      long: longLabelOf(gauge.id),
      percent: gauge.percent,
      pace,
      tone: toneOf({ id: gauge.id, percent: gauge.percent, pace }),
      reset: untilReset(gauge.resetsAt, nowMs),
      ...forecasts === undefined ? NO_ESTIMATE : estimateOf(gauge, nowMs, forecasts)
    };
  });
}

const BAR$1 = "━";
const TRACK = "─";
const TICK = "┊";
function toneText(ui, spec) {
  const { Text } = ui;
  const color = terminalColor(spec.tone);
  return color === undefined ? h(Text, {
    dimColor: true
  }, spec.text) : h(Text, {
    color
  }, spec.text);
}
function barTree(ui, spec) {
  const { Box, Text } = ui;
  const filled = filledCells(spec.gauge.percent, spec.width);
  const paceCell = spec.gauge.pace === null ? -1 : Math.min(spec.width - 1, Math.floor(spec.gauge.pace / 100 * spec.width));
  const track = Array.from({ length: spec.width - filled }, (_, index) => filled + index === paceCell ? TICK : TRACK).join("");
  return h(Box, {
    flexDirection: "row"
  }, filled > 0 && h(Text, {
    color: terminalColor(spec.gauge.tone)
  }, BAR$1.repeat(filled)), track !== "" && h(Text, {
    dimColor: true
  }, track));
}

const RANGES = [7, 30];
function pastViewOf(pasts, spec) {
  if (pasts === null)
    return null;
  return { past: spec.range === 30 ? pasts.month : pasts.week, choose: spec.choose };
}
const LEVELS = 4;

const PAD = 0;
const LABEL_Y = 13;
const TOP = 28;
const STAT = { w: 104, h: 48, value: 17, label: 10.5, labelY: 34 };
const STAT_COLUMNS = 2;
const CELL = { size: 11, gap: 3, radius: 2 };
const DAYS_PER_WEEK = 7;
const HEAT_GAP = 16;
const BOTTOM_PAD = 2;
const LEVEL_OPACITY = [0, 0.3, 0.5, 0.75, 1];
const stride = CELL.size + CELL.gap;
const weeksOf = (cells) => Math.ceil(((cells[0]?.weekday ?? 0) + cells.length) / DAYS_PER_WEEK);
function statsOf(past) {
  return [
    { value: `${past.activeDays}/${past.range}`, label: words().activeDays },
    { value: String(past.sessions), label: words().sessions },
    { value: compact(past.tokens), label: words().tokensApart(compact(past.cache)) },
    { value: past.model ?? "—", label: words().topModel }
  ];
}
function statsSvg(past, top) {
  return statsOf(past).map((stat, index) => {
    const x = PAD + index % STAT_COLUMNS * STAT.w;
    const y = top + Math.floor(index / STAT_COLUMNS) * STAT.h;
    const value = `<text class="f-hi num" x="${x}" y="${y + STAT.value + 2}" font-size="${STAT.value}" font-weight="620">${escape(stat.value)}</text>`;
    return `${value}<text class="f-lo" x="${x}" y="${y + STAT.labelY}" font-size="${STAT.label}">${escape(stat.label)}</text>`;
  }).join("");
}
function cellSvg(cell, at) {
  const paint = cell.level === 0 ? 'class="f-track"' : `class="f-mid" fill-opacity="${LEVEL_OPACITY[Math.min(LEVELS, cell.level)]}"`;
  const tip = escape(words().dayTokens(cell.day, compact(cell.tokens)));
  return `<rect ${paint} x="${at.x}" y="${at.y}" width="${CELL.size}" height="${CELL.size}" rx="${CELL.radius}"><title>${tip}</title></rect>`;
}
function heatSvg(cells, origin) {
  const first = cells[0]?.weekday ?? 0;
  return cells.map((cell, index) => {
    const place = first + index;
    const x = origin.x + Math.floor(place / DAYS_PER_WEEK) * stride;
    const y = origin.y + place % DAYS_PER_WEEK * stride;
    return cellSvg(cell, { x, y });
  }).join("");
}
function pastSvg(spec) {
  const { past, width } = spec;
  const statsW = STAT_COLUMNS * STAT.w;
  const heatW = weeksOf(past.cells) * stride - CELL.gap;
  const heatH = DAYS_PER_WEEK * stride - CELL.gap;
  const isBeside = PAD + statsW + HEAT_GAP + heatW + PAD <= width;
  const statsH = Math.ceil(statsOf(past).length / STAT_COLUMNS) * STAT.h;
  const heatAt = isBeside ? { x: width - PAD - heatW, y: TOP } : { x: PAD, y: TOP + statsH };
  const height = (isBeside ? TOP + Math.max(statsH, heatH) : heatAt.y + heatH) + BOTTOM_PAD;
  const range = words().lastDays(past.range);
  const head = [
    groupLabel(words().pastTitle, { x: PAD, y: LABEL_Y }),
    `<text class="f-lo" x="${width - PAD}" y="${LABEL_Y}" font-size="12" text-anchor="end">${escape(range)}</text>`
  ].join("");
  const alt = [words().pastTitle, range, ...statsOf(past).map((stat) => `${stat.label} ${stat.value}`)].join(" · ");
  return svgDoc({ width, height, body: head + statsSvg(past, TOP) + heatSvg(past.cells, heatAt), alt });
}

const LEVEL_GLYPHS = ["·", "░", "▒", "▓", "█"];
const lineOf = (past) => words().pastLine({ active: past.activeDays, range: past.range, sessions: past.sessions, tokens: compact(past.tokens), cache: compact(past.cache), model: past.model });
const stripOf = (past) => past.cells.map((cell) => LEVEL_GLYPHS[cell.level] ?? LEVEL_GLYPHS[0]).join("");
function switchOf(ui, card) {
  const { Box, Button } = ui;
  return h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, RANGES.map((range) => {
    const isShown = range === card.past.range;
    const look = isShown ? { variant: "secondary" } : { plain: true, dimColor: true };
    return h(Button, {
      key: `past-${range}`,
      label: words().rangeLabel(range),
      ...look,
      onPress: () => card.choose(range)
    });
  }));
}
function terminalCard(ui, card) {
  const { Box, Text } = ui;
  return h(Box, {
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    bold: true
  }, words().pastTitle), h(Text, {
    dimColor: true
  }, lineOf(card.past))), h(Box, {
    flexDirection: "row",
    columnGap: 2,
    alignItems: "center"
  }, h(Text, null, stripOf(card.past)), switchOf(ui, card)));
}
function pastCard(ui, card) {
  const { Box } = ui;
  const Svg = card.svg;
  if (Svg === undefined || card.width === undefined) {
    return h(Box, {
      key: "past-card",
      marginTop: 1
    }, terminalCard(ui, card));
  }
  const spec = { past: card.past, width: card.width };
  return h(Box, {
    key: "past-card",
    flexDirection: "column",
    marginTop: 1
  }, h(Svg, {
    key: "hud-past",
    ...motion.pic("hud-past", pastSvg(spec), { shows: spec })
  }), h(Box, {
    marginTop: 1
  }, switchOf(ui, card)));
}

const ORDER = ["pace", "budget", "cache", "effort"];
const rankOf = (section) => {
  const rank = ORDER.indexOf(section.id);
  return rank === -1 ? ORDER.length : rank;
};
const TONES = ["neutral", "warn", "danger"];
const isText = (value) => typeof value === "string";
function isSection(value) {
  if (typeof value !== "object" || value === null)
    return false;
  const section = value;
  const actions = section.actions ?? [];
  const isAction = (action) => typeof action === "object" && action !== null && isText(action.id) && isText(action.label);
  return isText(section.id) && isText(section.title) && Array.isArray(section.lines) && section.lines.every(isText) && TONES.includes(section.tone) && Array.isArray(actions) && actions.every(isAction);
}
const ordered = (sections) => [...sections].sort((a, b) => rankOf(a) - rankOf(b));
function actionsRow(ui, section, press) {
  const { Box, Button } = ui;
  const actions = section.actions ?? [];
  if (actions.length === 0)
    return null;
  return h(Box, {
    key: `usage-${section.id}-actions`,
    flexDirection: "row",
    columnGap: 1,
    marginTop: 1
  }, actions.map((action) => h(Button, {
    key: `usage-${section.id}-${action.id}`,
    label: action.label,
    variant: action.isOn === true ? "primary" : "secondary",
    onPress: () => press(section.id, action.id)
  })));
}
function sectionTree(ui, section, press) {
  const { Box, Text } = ui;
  const color = terminalColor(section.tone);
  return h(Box, {
    key: `usage-${section.id}`,
    flexDirection: "column",
    marginTop: 1
  }, color === undefined ? h(Text, {
    bold: true
  }, section.title) : h(Text, {
    bold: true,
    color
  }, section.title), section.lines.map((line, index) => h(Text, {
    key: `usage-${section.id}-${index}`,
    dimColor: section.isEmpty === true || index > 0,
    wrap: "wrap"
  }, line)), actionsRow(ui, section, press));
}
function sectionsTree(ui, view) {
  const { Box } = ui;
  return h(Box, {
    flexDirection: "column"
  }, ordered(view.sections).map((section) => sectionTree(ui, section, view.press)));
}

const TILE = { minW: 168, maxW: 260, h: 132, bareH: 80, gap: 28, rowGap: 24 };
const BAR = { top: 42, height: 6 };
const HEADER_H = 44;
const LIVE$1 = { r: 3, gap: 9 };
const BREATHE_CSS = ".breathe{animation:breathe 1.8s ease-in-out infinite}@keyframes breathe{50%{opacity:.35}}";
const SPARK_H = 30;
const COLUMN_CHOICES = [4, 2, 1];
function columnsFor(count, maxWidth) {
  const fits = (cols) => cols * TILE.minW + (cols - 1) * TILE.gap <= maxWidth;
  const cols = Math.min(count, COLUMN_CHOICES.find(fits) ?? 1);
  const tileW = Math.min(TILE.maxW, (maxWidth - (cols - 1) * TILE.gap) / cols);
  return { cols, tileW: Math.max(TILE.minW, Math.floor(tileW)) };
}
const textAt = (spec) => `<text class="${spec.cls}" x="${spec.x}" y="${spec.y}" font-size="${spec.size}" font-weight="${spec.weight ?? 500}"${spec.anchor === undefined ? "" : ` text-anchor="${spec.anchor}"`}>${escape(spec.value)}</text>`;
function valueAndMeter(tile, spec) {
  const value = textAt({ x: spec.x, y: spec.y + 28, cls: `${fillOf(tile.tone)} num`, size: 24, value: tile.value, weight: 650 });
  if (tile.arc === null)
    return value;
  const bar = { x: spec.x, y: spec.y + BAR.top, width: spec.width, height: BAR.height, percent: tile.arc.percent };
  return value + meter({ ...bar, tone: tile.tone, pace: tile.arc.pace });
}
const hasChart = (tile) => tile.series.length >= 2 && tile.seriesMax > 0;
function chartSvg(tile, box) {
  const { x, y, width } = box;
  const sparkTop = y + 84;
  return [
    sparkline({ x, y: sparkTop, width, height: SPARK_H, values: tile.series, max: tile.seriesMax, tone: tile.tone }),
    `<rect class="f-line" x="${x}" y="${sparkTop + SPARK_H}" width="${width}" height="1"/>`,
    textAt({ x, y: y + TILE.h - 4, cls: "f-lo", size: 10.5, value: tile.caption })
  ].join("");
}
function tileSvg(tile, box) {
  const { x, y, width } = box;
  const right = x + width;
  return [
    groupLabel(tile.label, { x, y: y + 10 }),
    textAt({ x: right, y: y + 10, cls: "f-lo num", size: 10.5, value: tile.meta, anchor: "end" }),
    valueAndMeter(tile, { x, y: y + 16, width }),
    textAt({ x, y: y + 76, cls: fillOf(tile.noteTone, "lo"), size: 11, value: tile.note }),
    hasChart(tile) ? chartSvg(tile, box) : ""
  ].join("");
}
function headerSvg(spec, width) {
  const isLive = spec.isLive === true;
  const titleX = isLive ? LIVE$1.r * 2 + LIVE$1.gap : 0;
  const dot = isLive ? `<circle class="f-edit breathe" cx="${LIVE$1.r}" cy="15" r="${LIVE$1.r}"/>` : "";
  return [
    dot,
    textAt({ x: titleX, y: 20, cls: "f-hi", size: 16, value: spec.title, weight: 600 }),
    textAt({ x: width, y: 20, cls: "f-lo", size: 12, value: spec.meta, anchor: "end" })
  ].join("");
}
function tilesSvg(spec) {
  const { cols, tileW } = columnsFor(spec.tiles.length, spec.maxWidth);
  const rows = Math.ceil(spec.tiles.length / cols);
  const width = cols * tileW + (cols - 1) * TILE.gap;
  const rowHeights = Array.from({ length: rows }, (_, row) => spec.tiles.slice(row * cols, (row + 1) * cols).some(hasChart) ? TILE.h : TILE.bareH);
  const rowTops = rowHeights.map((_, row) => HEADER_H + rowHeights.slice(0, row).reduce((sum, h) => sum + h + TILE.rowGap, 0));
  const tiles = spec.tiles.map((tile, index) => tileSvg(tile, { x: index % cols * (tileW + TILE.gap), y: rowTops[Math.floor(index / cols)] ?? HEADER_H, width: tileW }));
  const alt = [spec.title, ...spec.tiles.map((tile) => `${tile.label} ${tile.value} · ${tile.note} · ${tile.caption}`)].join("; ");
  return svgDoc({ width, height: (rowTops[rows - 1] ?? HEADER_H) + (rowHeights[rows - 1] ?? 0) + TILE.rowGap / 2, body: headerSvg(spec, width) + tiles.join(""), alt, css: BREATHE_CSS });
}

const PX_PER_COLUMN = 9;
const BAR_MAX = 24;
const BAR_MIN = 8;
const ROW_CHROME = 48;
const LABEL_WIDTH = 7;
const COST_HEADROOM = 1.15;
function rangeText(series) {
  if (series.length < 2)
    return "";
  return words().range(percentText(Math.min(...series)), percentText(Math.max(...series)));
}
function freeText(context) {
  const count = Math.max(0, context.window - context.tokens);
  return words().free({ tokens: compact(count), count });
}
function noteOf(gauge, context) {
  if (gauge.id !== CONTEXT && gauge.forecast !== "")
    return { note: gauge.forecast, noteTone: gauge.tone };
  if (gauge.pace !== null) {
    const ahead = Math.round(gauge.percent - gauge.pace);
    if (ahead >= AHEAD_POINTS)
      return { note: words().ahead(ahead), noteTone: gauge.tone };
    return { note: words().pace(percentText(gauge.pace)), noteTone: "neutral" };
  }
  if (gauge.id === CONTEXT && gauge.tone !== "neutral")
    return { note: words().timeToCompact, noteTone: gauge.tone };
  if (gauge.id === CONTEXT && context !== null)
    return { note: freeText(context), noteTone: "neutral" };
  return { note: "", noteTone: "neutral" };
}
function gaugeTile(gauge, view) {
  const series = seriesOf(view.history, gauge.id);
  const context = view.usage?.context ?? null;
  const reset = gauge.reset === "" ? "" : resetText(gauge.reset);
  const meta = gauge.id === CONTEXT && context !== null ? `${compact(context.tokens)} / ${compact(context.window)}` : reset;
  return {
    label: gauge.long,
    meta,
    value: valueText(gauge.percent),
    ...noteOf(gauge, context),
    tone: gauge.tone,
    arc: { percent: gauge.percent, pace: gauge.pace === null ? null : Math.round(gauge.pace) },
    series,
    seriesMax: 100,
    caption: rangeText(series)
  };
}
const isSubscriber = (view) => view.usage?.gauges.some((gauge) => gauge.id !== CONTEXT) === true;
function costTile(usd, view) {
  const series = costSeries(view.history);
  const turn = view.turn;
  const turnTokens = turn === null ? 0 : turn.input + turn.output;
  return {
    label: words().sessionCost,
    meta: "",
    value: costText(usd),
    note: turn === null ? "" : words().lastTurnTokens({ tokens: compact(turnTokens), count: turnTokens }),
    noteTone: "neutral",
    tone: "neutral",
    arc: null,
    series,
    seriesMax: Math.max(...series, usd) * COST_HEADROOM,
    caption: [isSubscriber(view) ? usageWords().listPrice : "", words().thisSession, series.length < 2 ? "" : words().readings(series.length)].filter((part) => part !== "").join(" · ")
  };
}
function stillTile(tile, gauge) {
  const isCountdown = gauge !== undefined && gauge.reset !== "";
  const isPaceNote = gauge !== undefined && gauge.pace !== null && tile.note !== gauge.forecast;
  return { ...tile, meta: isCountdown ? "" : tile.meta, note: isPaceNote ? "" : tile.note, arc: tile.arc?.percent ?? null };
}
function summaryText(view) {
  const cost = view.usage?.costUsd ?? null;
  return [words().readings(view.history.length), cost === null ? "" : words().sessionAt(costText(cost))].filter((part) => part !== "").join(" · ");
}
function turnText(turn) {
  return words().turn({ input: compact(turn.input), output: compact(turn.output), cache: percentText(cachePercent(turn)), requests: turn.requests });
}
function terminalRow(ui, gauge, view) {
  const { Box, Text } = ui;
  const width = Math.max(BAR_MIN, Math.min(BAR_MAX, view.columns - ROW_CHROME));
  const series = seriesOf(view.history, gauge.id);
  const forecast = gauge.id === CONTEXT ? "" : gauge.forecast;
  const extras = [forecast, gauge.reset === "" ? "" : words().resetsIn(gauge.reset), forecast === "" ? rangeText(series) : ""].filter((part) => part !== "");
  return h(Box, {
    key: `gauge-${gauge.id}`,
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    dimColor: true
  }, gauge.short.padEnd(LABEL_WIDTH)), barTree(ui, { gauge, width }), toneText(ui, { text: valueText(gauge.percent), tone: gauge.tone }), extras.length > 0 && h(Text, {
    dimColor: true
  }, `· ${extras.join(" · ")}`), series.length > 1 && h(Text, {
    dimColor: true
  }, sparkText(series, 100)));
}
function cardOf$1(view, gauges, width) {
  const forecast = gauges.find((gauge) => gauge.id === CONTEXT)?.forecast ?? "";
  return {
    ...view.card,
    forecast,
    context: view.usage?.context ?? null,
    columns: view.columns,
    ...width === undefined || view.svg === undefined ? {} : { width, svg: view.svg }
  };
}
function terminalBody(ui, view, gauges) {
  const { Box, Text } = ui;
  return h(Box, {
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    justifyContent: "space-between"
  }, h(Text, {
    bold: true
  }, words().limits), h(Text, {
    dimColor: true
  }, summaryText(view))), h(Box, {
    flexDirection: "column",
    marginTop: 1
  }, gauges.map((gauge) => terminalRow(ui, gauge, view))), sectionsTree(ui, restOf(view)), contextCard(ui, cardOf$1(view, gauges)), view.past !== null && pastCard(ui, view.past));
}
function body(ui, view, usage) {
  const { Box } = ui;
  const gauges = gaugeViews(usage, view.nowMs, view.forecasts);
  if (view.svg === undefined)
    return terminalBody(ui, view, gauges);
  const tiles = [...gauges.map((gauge) => gaugeTile(gauge, view)), ...usage.costUsd === null ? [] : [costTile(usage.costUsd, view)]];
  const spec = { title: words().limits, meta: summaryText(view), tiles, maxWidth: view.columns * PX_PER_COLUMN };
  const drawn = tilesSvg({ ...spec, isLive: view.isLive });
  const shows = { ...spec, tiles: tiles.map((tile, index) => stillTile(tile, gauges[index])) };
  const Svg = view.svg;
  return h(Box, {
    flexDirection: "column"
  }, h(Svg, {
    key: "hud-tiles",
    ...motion.pic("hud-tiles", drawn, { shows })
  }), sectionsTree(ui, restOf(view)), contextCard(ui, cardOf$1(view, gauges, drawn.width)), view.past !== null && pastCard(ui, { ...view.past, width: drawn.width, svg: Svg }));
}
const ledOf = (view) => view.sections.sections.find((section) => section.id === view.focus);
const restOf = (view) => ({ ...view.sections, sections: ordered(view.sections.sections).filter((section) => section !== ledOf(view)) });
function paneTree(ui, view) {
  const { Box, Text } = ui;
  const usage = view.usage;
  const led = ledOf(view);
  const isUnread = usage === null || usage.gauges.length === 0 && usage.costUsd === null;
  return h(Box, {
    flexDirection: "column"
  }, led !== undefined && sectionTree(ui, led, view.sections.press), isUnread || usage === null ? h(Text, {
    dimColor: true
  }, words().noReadings) : body(ui, view, usage), isUnread && sectionsTree(ui, restOf(view)), !isUnread && view.turn !== null && view.turn.requests > 0 && h(Box, {
    marginTop: 1
  }, h(Text, {
    dimColor: true
  }, turnText(view.turn))));
}

const BEAT$1 = { plugin: "hud-pro", key: "beat" };
const USAGE = { plugin: "hud-pro", key: "usage" };
const TURN = { plugin: "hud-pro", key: "turn" };
const LAST_TURN = { plugin: "hud-pro", key: "lastTurn" };
const HISTORY = { plugin: "hud-pro", key: "history" };
const COMPACTING = { plugin: "hud-pro", key: "isCompacting" };
const CONTEXT_TURNS = { plugin: "hud-pro", key: "contextTurns" };
const LAST_COMPACT = { plugin: "hud-pro", key: "lastCompact" };
const LIVE = { plugin: "hud-pro", key: "isLive" };
const PAST = { plugin: "hud-pro", key: "past" };
const RANGE = { plugin: "hud-pro", key: "pastRange" };
const SHARES = { plugin: "hud-pro", key: "shares" };
const FOCUS = { plugin: "hud-pro", key: "focus" };
const BREAKDOWN = { plugin: "hud-pro", key: "breakdown" };
const BUDGET = { plugin: "session-budget", key: "section" };
const CACHE = { plugin: "cache-tax", key: "section" };
const EFFORT = { plugin: "effort-router", key: "section" };
const NO_TURN = { requests: 0, input: 0, output: 0, cacheRead: 0 };
const WEEK = 7;
async function sectionsOf($, o) {
  const published = [(await $.state.get(BUDGET)).value, (await $.state.get(CACHE)).value, (await $.state.get(EFFORT)).value];
  const pace = paceOf({ usage: o.usage, history: o.history, nowMs: o.nowMs });
  const shares = (await $.state.get(SHARES)).value ?? [];
  const own = o.usage === null ? [] : [paceSection({ pace, shares, nowMs: o.nowMs })];
  return [...own, ...published.filter(isSection)];
}
async function cardOf($, act) {
  const breakdown = (await $.state.get(BREAKDOWN)).value ?? null;
  const card = {
    view: breakdown?.view ?? null,
    turns: (await $.state.get(CONTEXT_TURNS)).value ?? [],
    lastCompact: (await $.state.get(LAST_COMPACT)).value ?? null,
    isCompacting: (await $.state.get(COMPACTING)).value === true,
    compact: () => act("compact")
  };
  return { card, compactAt: breakdown?.compactAt ?? null };
}
async function usagePage($, ui, site, act) {
  setLang(lang$1());
  await $.state.get(BEAT$1);
  const nowMs = await $.clock.now();
  const usage = (await $.state.get(USAGE)).value ?? null;
  const history = (await $.state.get(HISTORY)).value ?? [];
  const turn = (await $.state.get(TURN)).value ?? NO_TURN;
  const { card, compactAt } = await cardOf($, act);
  const choose = (range) => act("range", String(range));
  const view = {
    usage,
    history,
    turn: turn.requests > 0 ? turn : (await $.state.get(LAST_TURN)).value ?? null,
    columns: site.columns,
    nowMs,
    card,
    isLive: (await $.state.get(LIVE)).value === true,
    forecasts: forecastsFrom({ history, turns: card.turns, usage, compactAt }),
    past: pastViewOf((await $.state.get(PAST)).value ?? null, { range: (await $.state.get(RANGE)).value ?? WEEK, choose }),
    sections: { sections: await sectionsOf($, { usage, history, nowMs }), press: (section, action) => act("press", JSON.stringify([section, action])) },
    focus: (await $.state.get(FOCUS)).value ?? null,
    ...site.surface !== "terminal" && "Svg" in ui ? { svg: ui.Svg } : {}
  };
  return paneTree(ui, view);
}

const HUB_DRAWN = ["plan", "agents", "checkpoints", "files", "tests", "usage"];
async function pageOf($, o) {
  switch (o.page) {
    case "plan":
      return planPage($, o.ui, o.site);
    case "agents":
      return agentsPage($, o.ui, o.site, o.act);
    case "checkpoints":
      return checkpointsPage($, o.ui, o.site, o.act);
    case "files":
      return filesPage($, o.ui, o.site, o.act);
    case "tests":
      return testsPage($, o.ui, o.site, o.act);
    case "usage":
      return usagePage($, o.ui, o.site, o.act);
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
const sans = (size, weight) => (text) => textWidth$1(text, size, weight);
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
  return toPic({ body, width: ICON, height: ICON, alt: kindWord(kind, lang$1()) });
}
function stopAt(stop, x) {
  const icon = glyphAt(stop.kind, stop.state, x, (HEIGHT - ICON) / 2);
  const word = kindWord(stop.kind, lang$1());
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
const altOf = (flow) => flow.map((stop) => stop.count > 1 ? `${kindWord(stop.kind, lang$1())} ×${stop.count}` : kindWord(stop.kind, lang$1())).join(" → ");
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
  const words = pick$5(WORDS);
  if (state === "failed")
    return `${MARK.failed} ${words.failed}`;
  return state === "stopped" ? `${MARK.stopped} ${words.stopped}` : MARK[state];
}
function stepOfCall(call) {
  const file = fileOf(call.input);
  return { kind: kindOf(call.tool, call.input), text: plainCall(call.tool, call.input, lang$1()), note: "", count: 1, state: stateOf(call), files: file === undefined ? [] : [file] };
}
function iconOf(draw, step) {
  const { Svg, Text } = draw.ui;
  if (draw.isText)
    return h(Text, {
      dimColor: true
    }, GLYPH$2[KIND_ICON[step.kind]]);
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
  const result = resultLine(call, lang$1());
  return [told, ...result === "" ? [] : [h(Text, {
    key: "plain-result",
    dimColor: true
  }, result)]];
}
function groupTrail(draw, calls) {
  const { Svg, Text } = draw.ui;
  const trail = trailOf(calls, lang$1());
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
    }, pick$5(WORDS).more(trail.more)) : null
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
  return { rows, hidden, focus: focusOf(rows), now: nowOf$1(rows, parts.now), meta: metaOf(parts.market, parts.hasUpdate === true), isEditing: parts.isEditing, ...frame };
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
    setLang$6(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    const started = await next(e);
    const saved = layoutOf$1(await $.store.get(LAYOUT_KEY).catch(() => {
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
    if (staged === MODS_PANE)
      return catalogPage($, e);
    if (staged !== null && SIDE_PANES.includes(staged))
      return sidePage($, e, staged);
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
  on("ui.render", { component: "Pane", requestId: MODS_PANE }, ($, e) => catalogPage($, e));
}
async function catalogPage($, e) {
  const ui = $.ui.resolve(e);
  const columns = e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS;
  const onHome = () => void openHub($).catch((cause) => $.ui.log(`modz: the hub could not be opened: ${String(cause)}`, { to: "debug" }));
  const market = await marketOf(diskOf($));
  keepMarket(market);
  const commands = await $.command.list().catch(() => []);
  return pinned(e, modzTree(ui, { market, commands, surface: e.surface, columns, theme: await themeNow($), onHome, onCopy: (text, press) => copy($, text, press), stable: catalogDrawings }));
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
  wireFilesPage(on);
  footerHooks(on);
  wireLanguageKeeper(on, options);
  wirePlainRows(on, options);
};

export { register };
