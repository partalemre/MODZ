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

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const lang = () => current;
const pick = (table) => table[current];

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
    "modz-mods": { title: "Mods", hint: "Every mod and whether it works" }
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
    "modz-mods": { title: "Modlar", hint: "Tüm modlar ve çalışıp çalışmadıkları" }
  }
};
function paneWords(pane) {
  const table = pick(PANES);
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
const hubWords = () => pick(HUB);
const badgeWord = () => pick({ en: "Beta", tr: "Beta" });
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
    remote: "kept elsewhere: no details on this computer",
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
    remote: "başka yerde tutuluyor: bu bilgisayarda ayrıntısı yok",
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
const catalogWords = () => pick(CATALOG);
function placeLine(mod) {
  const words = catalogWords();
  const source = mod.upstream === null ? "modz" : words.from(mod.upstream);
  return `${mod.surfaces.map((surface) => words.surfaces[surface]).join(" · ")} · ${source}`;
}

const SECTIONS = ["work", "safety", "meter"];
const MODS_PANE = "modz-mods";
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
  { pane: MODS_PANE, mod: "modz", icon: "cube", role: "edit", section: "meter" }
];
const entries = () => BASES.map(({ isBeta, ...base }) => ({ ...base, ...paneWords(base.pane), badge: isBeta ? badgeWord() : null, isGuest: false }));
const KNOWN_MODS = new Set(BASES.map((base) => base.mod));
function guestEntry(mod, card) {
  const icon = ICON_NAMES.includes(card.icon) ? card.icon : "cube";
  const section = SECTIONS.includes(card.section) ? card.section : "work";
  return { pane: card.pane, mod, title: card.title ?? mod, hint: card.hint ?? "", icon, role: "edit", section, badge: card.badge ?? null, isGuest: true };
}
const modsTitle = () => paneWords(MODS_PANE).title;
const TONES = ["idle", "live", "ok", "warn", "bad"];
const DETAIL_MAX = 60;
const TITLE_MAX = 32;
const BADGE_MAX = 12;
const PANE_ID = /^[\w-]{1,64}$/;
const textOf$2 = (value, max) => typeof value === "string" && value.trim() !== "" ? value.trim().slice(0, max) : undefined;
const LINES_MAX = 4;
const VALUE_MAX = 16;
function lineOf(value) {
  if (typeof value !== "object" || value === null)
    return null;
  const line = value;
  const label = textOf$2(line.label, DETAIL_MAX);
  if (label === undefined)
    return null;
  const short = textOf$2(line.value, VALUE_MAX);
  return { label, ...typeof line.since === "number" && Number.isFinite(line.since) ? { since: line.since } : {}, ...short === undefined ? {} : { value: short } };
}
function liveOf(value) {
  if (typeof value !== "object" || value === null)
    return;
  const live = value;
  const lines = (Array.isArray(live.lines) ? live.lines : []).map(lineOf).filter((line) => line !== null).slice(0, LINES_MAX);
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
    title: textOf$2(card.title, TITLE_MAX),
    hint: textOf$2(card.hint, DETAIL_MAX),
    icon: textOf$2(card.icon, TITLE_MAX),
    section: SECTIONS.includes(card.section) ? card.section : undefined,
    badge: textOf$2(card.badge, BADGE_MAX),
    live: liveOf(card.live),
    isBandOnly: card.isBandOnly === true ? true : undefined
  };
  const named = Object.fromEntries(Object.entries(own).filter(([, v]) => v !== undefined));
  return { pane: card.pane, detail: card.detail.slice(0, DETAIL_MAX), tone: card.tone, at: Number(card.at) || 0, ...named };
}
const ROLE_OF_TONE = { idle: null, live: "run", ok: "ok", warn: "warn", bad: "danger" };
const RANK$1 = { bad: 4, warn: 3, live: 2, ok: 1, idle: 0 };
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
  const ranked = rows.filter((row) => row.card !== null && row.card.detail !== "" && RANK$1[row.card.tone] >= RANK$1.live).sort((a, b) => RANK$1[b.card.tone] - RANK$1[a.card.tone] || b.card.at - a.card.at);
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
const SECOND = 1000;
const MINUTE_S = 60;
const HOUR_M = 60;
const STEP_S = 10;
function elapsedText(ms) {
  const ago = hubWords().ago;
  const seconds = Math.max(0, Math.floor(ms / SECOND));
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

const cardsAtom$1 = atom({ plugin: "modz", key: "cards" }, {});
const BEAT_MS = 1e4;
let beat = null;
async function redrawShown($) {
  if ((await $.ui.panes()).some((pane) => pane.id === HUB_PANE && pane.isShown))
    $.ui.invalidate("ui.render");
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
    if (isSame((await read($, cardsAtom$1))[from], card))
      return done;
    keepBeat($, await update($, cardsAtom$1, (cards) => ({ ...cards, [from]: card })));
    return done;
  }).catch(($, e, next) => next(e));
}

const TOGGLE_KEY = "modz-toggle";
const TOGGLE_LABEL = "modz";
const JOINT = " & ";
const HUB_PANES = new Set([HUB_PANE, MODS_PANE, HOLD_PANE]);
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
const WIDE_EM = 1;
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
function charEm(char, boldness) {
  const i = INDEX.get(char);
  if (i === undefined)
    return (char.codePointAt(0) ?? 0) >= FIRST_WIDE ? WIDE_EM : UNKNOWN_EM;
  const regular = REGULAR[i] ?? UNKNOWN_EM * PER_MILLE;
  const bold = BOLD[i] ?? regular;
  return (regular + (bold - regular) * boldness) / PER_MILLE;
}
function textWidth(text, size, weight = WEIGHT_LOW) {
  const boldness = Math.max(0, Math.min(1, (weight - WEIGHT_LOW) / WEIGHT_SPAN));
  const chars = [...text];
  const advance = chars.reduce((sum, char) => sum + charEm(char, boldness), 0);
  return Math.max(0, (advance + chars.length * trackingAt(size)) * size);
}

const STAGGER_MS = 45;
const EASE = "cubic-bezier(.2,.8,.2,1)";
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
const REDUCED$2 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function motionCss(body) {
  const used = Object.keys(RULES).filter((name) => new RegExp(`\\b${name}\\b`).test(body));
  return used.length === 0 ? "" : `${used.map((name) => RULES[name]).join("")}${REDUCED$2}`;
}
const MOTION_CSS$1 = Object.values(RULES).join("");
const isEntering = (cue) => cue.phase === "enter";
function entering(body, cue, kind = "in") {
  if (!isEntering(cue))
    return body;
  return `<g class="m-${kind}" style="animation-delay:${cue.order * STAGGER_MS}ms">${body}</g>`;
}
const delayOf = (cue, step) => `animation-delay:${cue.order * STAGGER_MS + step}ms`;

const DARK$1 = {
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
const LIGHT$1 = {
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
const ROLE_NAMES = ["read", "edit", "run", "ok", "warn", "danger", "plan"];
const FONT$1 = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`;
const MONO$1 = `ui-monospace, 'SF Mono', Menlo, monospace`;
function varsOf(palette) {
  const base = ["sheet", "card", "inset", "line", "strong", "track", "hi", "mid", "lo"];
  const neutral = base.map((key) => `--${key}:${palette[key]}`);
  const roles = ROLE_NAMES.flatMap((name) => {
    const role = palette.roles[name];
    return [`--${name}:${role.fg}`, `--${name}-t:${role.tint}`, `--${name}-l:${role.line}`];
  });
  return [...neutral, ...roles].join(";");
}
function roleClasses() {
  return ROLE_NAMES.map((name) => `.fg-${name}{fill:var(--${name})}.bg-${name}{fill:var(--${name}-t)}.st-${name}{stroke:var(--${name})}.ln-${name}{stroke:var(--${name}-l)}`).join("");
}
const TYPE_CSS = [
  `text{font-family:${FONT$1}}`,
  `.num{font-family:${MONO$1};font-variant-numeric:tabular-nums}`,
  ".hi{fill:var(--hi)}.mid{fill:var(--mid)}.lo{fill:var(--lo)}",
  ".eb{font-size:10.5px;font-weight:700;letter-spacing:.1em}",
  ".hl{font-size:17px;font-weight:620}.ti{font-size:13px;font-weight:600}",
  ".lb{font-size:12px;font-weight:500}.mi{font-size:10.5px;font-weight:500}.dp{font-size:24px;font-weight:650}",
  ".card{fill:var(--card)}.inset{fill:var(--inset)}.track{fill:var(--track)}.line{stroke:var(--line)}.strong{stroke:var(--strong)}",
  ".f-line{fill:var(--line)}.f-strong{fill:var(--strong)}.f-mid{fill:var(--mid)}"
].join("");
const MOTION_CSS = ".breathe{animation:breathe 1.8s ease-in-out infinite}@keyframes breathe{50%{opacity:.45}}";
const REDUCED$1 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function styleOf() {
  const dark = varsOf(DARK$1);
  return `<style>svg{${varsOf(LIGHT$1)}}svg.t-dark{${dark}}@media (prefers-color-scheme: dark){svg.t-auto{${dark}}}${TYPE_CSS}${roleClasses()}${MOTION_CSS}${REDUCED$1}</style>`;
}
const SCHEME$1 = { light: "light", dark: "dark", auto: "light dark" };
function svgDoc(doc) {
  const width = Math.round(doc.width);
  const scheme = `:root{color-scheme:${SCHEME$1[doc.theme]}}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="t-${doc.theme}" width="${width}" height="${doc.height}" viewBox="0 0 ${width} ${doc.height}">${styleOf()}<style>${scheme}${doc.css ?? ""}</style>${doc.body}</svg>`;
}
function themeOf(value) {
  const name = String(value ?? "").toLowerCase();
  if (name.includes("light"))
    return "light";
  return name.includes("dark") ? "dark" : "auto";
}

const settled = (spec) => spec.cue === undefined ? svgDoc(spec) : svgDoc({ width: spec.width, height: spec.height, theme: spec.theme, body: entering(spec.body, spec.cue), css: MOTION_CSS$1 });
const HEAD = 44;
const GROUP = 28;
const ROW = 62;
const TEXT_X = 16;
const GAP$1 = 6;
function esc(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
const MONO_EM = 0.6;
const WEIGHT_BODY = 500;
function measure(text, size, weight = WEIGHT_BODY) {
  return textWidth(text, size, weight);
}
const monoMeasure = (text, size) => [...text].length * size * MONO_EM;
function fit(text, width, font) {
  const { size, weight = WEIGHT_BODY } = font;
  if (measure(text, size, weight) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 1 && measure(`${chars.join("").trimEnd()}…`, size, weight) > width)
    chars.pop();
  return `${chars.join("").trimEnd()}…`;
}
function headSvg(spec) {
  const meta = spec.meta === "" ? "" : `<text x="${spec.width - TEXT_X}" y="28" text-anchor="end" style="font-size:11.5px" class="num ${spec.metaRole === null ? "lo" : `fg-${spec.metaRole}`}">${esc(spec.meta)}</text>`;
  const title = fit(spec.title, spec.width - TEXT_X * 2 - measure(spec.meta, 12) - GAP$1 * 2, { size: 16, weight: 600 });
  const body = `<text x="${TEXT_X}" y="28" style="font-size:16px;font-weight:600" class="hi">${esc(title)}</text>${meta}`;
  return { source: settled({ width: spec.width, height: HEAD, theme: spec.theme, body, cue: spec.cue }), alt: `${catalogWords().allMods}: ${spec.title}${spec.meta === "" ? "" : ` · ${spec.meta}`}`, height: HEAD };
}
function labelSvg(spec) {
  const { label } = spec;
  const count = catalogWords().mods(spec.count);
  const body = `<text x="${TEXT_X}" y="${GROUP - 8}" style="font-size:11px;font-weight:600" class="lo">${esc(label)}</text><text x="${spec.width - TEXT_X}" y="${GROUP - 8}" text-anchor="end" style="font-size:11px" class="num lo">${esc(count)}</text>`;
  return { source: settled({ width: spec.width, height: GROUP, theme: spec.theme, body, cue: spec.cue }), alt: `${label}: ${count}`, height: GROUP };
}
const groupSvg = (spec) => labelSvg({ ...spec, label: catalogWords().groups[spec.group] });
const GUIDE = { one: 28, two: 44 };
function guideSvg(spec) {
  const { guide, width } = spec;
  const right = width - TEXT_X;
  const words = catalogWords();
  const options = guide.options.length === 0 ? "" : words.options(guide.options.join(", "));
  const height = options === "" ? GUIDE.one : GUIDE.two;
  const name = fit(guide.mod, (right - TEXT_X) / 2, { size: 13, weight: 560 });
  const room = Math.floor((right - TEXT_X - measure(name, 13, 560) - GAP$1 * 2) / (11.5 * MONO_EM));
  const all = commandsLine(guide);
  const commands = [...all].length <= room ? all : `${[...all].slice(0, Math.max(1, room - 1)).join("")}…`;
  const body = [
    `<text x="${TEXT_X}" y="19" style="font-size:13px;font-weight:560" class="hi">${esc(name)}</text>`,
    all === "" ? "" : `<text x="${right}" y="19" text-anchor="end" style="font-size:11.5px" class="num mid">${esc(commands)}</text>`,
    options === "" ? "" : `<text x="${TEXT_X}" y="36" style="font-size:11px" class="lo">${esc(fit(options, right - TEXT_X, { size: 11 }))}</text>`
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
function rowSvg(spec) {
  const { mod, width } = spec;
  const right = width - TEXT_X;
  const versionText = mod.version === null ? "" : `v${mod.version}`;
  const state = stateWord(mod);
  const edge = [state?.text, versionText].filter(Boolean).join(" · ");
  const name = fit(mod.name, right - TEXT_X - monoMeasure(edge, 11.5) - GAP$1 * 2, { size: 13, weight: 560 });
  const isQuiet = mod.isEnabled === false;
  const lineRoom = right - TEXT_X;
  const body = [
    `<text x="${TEXT_X}" y="21" style="font-size:13px;font-weight:560" class="${isQuiet ? "lo" : "hi"}">${esc(name)}</text>`,
    edge === "" ? "" : `<text x="${right}" y="21" text-anchor="end" style="font-size:11.5px" class="num ${state?.ink ?? "lo"}">${esc(edge)}</text>`,
    `<text x="${TEXT_X}" y="39" style="font-size:12px" class="${mod.isHealthy ? isQuiet ? "lo" : "mid" : "fg-danger"}">${esc(fit(mod.description, lineRoom, { size: 12 }))}</text>`,
    `<text x="${TEXT_X}" y="55" style="font-size:11px" class="lo">${esc(fit(placeLine(mod), lineRoom, { size: 11 }))}</text>`
  ].join("");
  const alt = `${[mod.name, versionText].filter(Boolean).join(" ")} · ${placeLine(mod)} · ${stateLabel(mod)} · ${mod.description}`;
  return { source: settled({ width, height: ROW, theme: spec.theme, body, cue: spec.cue }), alt, height: ROW };
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

const NARROW = 280;
const WIDE = 520;
const between = (k, from, to) => Math.round((from + (to - from) * k) * 10) / 10;
function sizesOf(width) {
  const k = Math.max(0, Math.min(1, (width - NARROW) / (WIDE - NARROW)));
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
const doc = (spec) => svgDoc({ ...spec, css: motionCss(spec.body) || HUB_CSS });
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
  const isDropping = isEntering(spec.cue);
  const cellAttrs = isDropping ? (at) => ` class="m-px" style="${delayOf(spec.cue, at.index * LETTER_MS + at.row * ROW_MS + at.col * COLUMN_MS)}"` : undefined;
  const z = sizesOf(spec.width);
  const mark = pixelWord("modz", { x: z.inset, y: (z.head - 7 * z.mark.pitch) / 2, ...z.mark, className: "fg-edit", cellAttrs });
  const meta = `<text x="${spec.width - z.inset}" y="${z.head / 2 + 4}" text-anchor="end" style="font-size:${z.meta}px" class="num lo">${esc(spec.meta)}</text>`;
  const body = mark.svg + entering(meta, { ...spec.cue, order: spec.cue.order + 4 }, "fade");
  const css = HUB_CSS + motionCss(body);
  return { source: svgDoc({ width: spec.width, height: z.head, theme: spec.theme, body, css }), alt: `modz · ${spec.meta}`, height: z.head };
}
function sectionSvg(spec) {
  const z = sizesOf(spec.width);
  const body = `<text x="${z.inset}" y="${z.section - 8}" style="font-size:${z.label}px;font-weight:600" class="lo">${esc(spec.label)}</text>`;
  return { source: doc({ width: spec.width, height: z.section, theme: spec.theme, body: entering(body, spec.cue, "fade") }), alt: spec.label, height: z.section };
}
function rowIcon(row, z) {
  const glyph = pixelGlyph(row.entry.icon, { x: z.inset, y: (z.row - z.icon) / 2, box: z.icon, ...z.glyph, className: glyphInk(row.card) });
  return isLive(row.card) ? `<g class="m-breathe">${glyph}</g>` : glyph;
}
const isLive = (card) => card !== null && card.detail !== "" && card.tone === "live";
function titleOf(row, z) {
  const title = row.entry.title;
  const titleEnd = z.textX + measure(title, z.title.size, z.title.weight);
  const text = `<text x="${z.textX}" y="${z.baseline}" style="font-size:${z.title.size}px;font-weight:500" class="hi">${esc(title)}</text>`;
  const badge = row.entry.badge;
  if (badge === null)
    return { svg: text, end: titleEnd };
  const word = badge.toLocaleLowerCase();
  const tag = `<text x="${titleEnd + BADGE_GAP}" y="${z.baseline}" style="font-size:${z.label}px;font-weight:500" class="lo">${esc(word)}</text>`;
  return { svg: text + tag, end: titleEnd + BADGE_GAP + measure(word, z.label, 500) };
}
const NARROW_VALUE = { size: 12, weight: 400 };
function shortValue(text, width, font = NARROW_VALUE) {
  const fits = (candidate) => measure(candidate, font.size, font.weight) <= width;
  if (fits(text))
    return text;
  const first = text.split(" · ")[0] ?? text;
  const words = first.split(" ");
  if (words.length === 1)
    return fit(first, width, font);
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
  const words = `<text x="${room.to}" y="${room.z.baseline}" text-anchor="end" style="font-size:${room.z.value.size}px;font-variant-numeric:tabular-nums" class="${value.ink}">${esc(text)}</text>`;
  if (!value.isLive)
    return words;
  const x = room.to - measure(text, room.z.value.size, room.z.value.weight) - LIVE_DOT.gap;
  const y = room.z.row / 2;
  const dot = (cls) => `<circle cx="${x}" cy="${y}" r="${LIVE_DOT.r}" class="fg-edit${cls}"/>`;
  return dot(" m-ring") + dot("") + words;
}
function hubRowSvg(spec) {
  const { width, row } = spec;
  const z = sizesOf(width);
  const title = titleOf(row, z);
  const value = spec.buttonRoom > 0 ? null : valueOf(row.card);
  const body = [
    rowIcon(row, z),
    title.svg,
    valueSvg(value, { from: title.end + VALUE_GAP + (value?.isLive ? LIVE_DOT.gap + LIVE_DOT.r * 2 : 0), to: width - z.inset, z })
  ].join("");
  const alt = `${row.entry.title}${row.entry.badge === null ? "" : ` (${row.entry.badge})`}${value === null ? "" : `: ${value.text}`}`;
  return { source: doc({ width, height: z.row, theme: spec.theme, body: entering(body, spec.cue) }), alt, height: z.row };
}
function hubLineSvg(spec) {
  const z = sizesOf(spec.width);
  const right = spec.width - z.inset;
  const { value } = spec.line;
  const room = right - z.textX - (value === "" ? 0 : measure(value, z.label, 400) + VALUE_GAP);
  const label = fit(spec.line.label, room, { size: z.value.size, weight: 400 });
  const y = z.line / 2 + z.value.size * 0.35;
  const body = [
    `<text x="${z.textX}" y="${y}" style="font-size:${z.value.size}px" class="mid">${esc(label)}</text>`,
    value === "" ? "" : `<text x="${right}" y="${y}" text-anchor="end" style="font-size:${z.label}px;font-variant-numeric:tabular-nums" class="lo">${esc(value)}</text>`
  ].join("");
  return { source: doc({ width: spec.width, height: z.line, theme: spec.theme, body: entering(body, spec.cue) }), alt: [spec.line.label, value].filter(Boolean).join(": "), height: z.line };
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

const PX_PER_COLUMN$1 = 9;
const WIDTH_MIN$1 = 240;
const WIDTH_MAX$1 = 640;
const EDIT_BUTTON_ROOM = 136;
const INSET = 1;
const hubWidth = (columns) => Math.max(WIDTH_MIN$1, Math.min(WIDTH_MAX$1, columns * PX_PER_COLUMN$1 - PX_PER_COLUMN$1));
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
  return PressRow(ui, { box: opts.box, key: opts.key, drawing: svg, onPress: () => view.actions.onOpen(pane) });
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

const LOCAL_SOURCES = new Set(["directory", "file"]);
function isRecord$1(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parsed(text) {
  if (text === undefined || text.trim() === "")
    return {};
  try {
    const value = JSON.parse(text);
    return isRecord$1(value) ? value : undefined;
  } catch {
    return;
  }
}
function isRemote(source) {
  return isRecord$1(source) && typeof source.source === "string" && !LOCAL_SOURCES.has(source.source);
}
function entryOf(plan, declared) {
  if (isRecord$1(declared)) {
    if ("autoUpdate" in declared || !isRemote(declared.source))
      return;
    return { ...declared, autoUpdate: true };
  }
  const known = parsed(plan.knownText)?.[plan.market];
  const source = isRecord$1(known) ? known.source : undefined;
  return isRemote(source) ? { source, autoUpdate: true } : undefined;
}
function autoUpdateSettings(plan) {
  const settings = parsed(plan.settingsText);
  if (settings === undefined || plan.market === "")
    return;
  const markets = isRecord$1(settings.extraKnownMarketplaces) ? settings.extraKnownMarketplaces : {};
  const entry = entryOf(plan, markets[plan.market]);
  if (entry === undefined)
    return;
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

const GROUPS = ["look", "safety", "meter", "flow", "other"];
const BOTH = ["desktop", "terminal"];
const META = {
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
function linkCheck(spec) {
  const dirs = spec.roots.filter((root) => Boolean(root)).map((root) => `${root}/${SKILLS_DIR}`);
  return async (name) => {
    for (const dir of dirs)
      if (await spec.exists(`${dir}/${name}`).catch(() => false))
        return true;
    return false;
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
  const location = isRecord(entry) ? text(entry.installLocation) : undefined;
  return (location ?? `${install.pluginsDir}/marketplaces/${install.market}`).replaceAll("\\", "/").replace(/\/+$/, "");
}
const SAFE_NAME = /^[\w.-]+$/;
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text(value) {
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
  return githubName(manifest?.repository) ?? githubName(manifest?.homepage) ?? META[name]?.upstream ?? githubName(manifest?.author?.url);
}
function infoOf(facts) {
  const { name, entry, manifest, problem } = facts;
  const meta = META[name];
  const summary = meta?.summary === undefined ? undefined : pick(meta.summary);
  return {
    name,
    version: text(manifest?.version) ?? text(entry.version) ?? null,
    description: problem ?? summary ?? text(manifest?.description) ?? text(entry.description) ?? (manifest ? "" : catalogWords().unreadable),
    group: meta?.group ?? "other",
    surfaces: meta?.surfaces ?? BOTH,
    upstream: upstreamOf(name, manifest),
    isHealthy: manifest !== undefined && problem === undefined,
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
function remoteProblem(source) {
  const repo = isRecord(source) ? text(source.repo) ?? text(source.url) : undefined;
  const remote = catalogWords().remote;
  return repo === undefined ? remote : `${remote} (${repo})`;
}
async function entryInfo(spec) {
  const { index, options, enabled } = spec;
  const hasLink = options.hasLink ?? (async () => false);
  const entry = isRecord(spec.entry) ? spec.entry : {};
  const name = text(entry.name);
  const invalid = catalogWords().invalid;
  if (name === undefined)
    return infoOf({ name: catalogWords().entry(index + 1), entry, manifest: undefined, isEnabled: null, problem: invalid });
  const isEnabled = await enabledOf({ name, flag: enabled[name], hasLink });
  if (typeof entry.source !== "string")
    return infoOf({ name, entry, manifest: undefined, isEnabled, problem: entry.source === undefined ? invalid : remoteProblem(entry.source) });
  const dir = `${options.root}/${entry.source.replace(/^\.\//, "")}`;
  return infoOf({ name, entry, manifest: await readJson(options.read, `${dir}/.claude-plugin/plugin.json`), isEnabled });
}
async function loadCatalog(options) {
  const market = await readJson(options.read, `${options.root}/.claude-plugin/marketplace.json`);
  const name = text(market?.name) ?? "modz";
  const plugins = market?.plugins;
  const entries = Array.isArray(plugins) ? plugins : [];
  const enabled = Object.fromEntries(Object.entries(options.enabledPlugins ?? {}).filter(([key]) => key.endsWith(`@${name}`)).map(([key, value]) => [key.slice(0, -name.length - 1), value]));
  const mods = await Promise.all(entries.map((entry, index) => entryInfo({ entry, index, options, enabled })));
  return { name, mods };
}
function headline(mods) {
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
  return linkCheck({ roots: [home, cwd], exists: (path) => disk.exists(path) });
}
async function textOf$1(disk, path) {
  return await disk.exists(path) ? String(await disk.read(path)) : undefined;
}
async function marketOf(disk) {
  try {
    const real = await disk.realPath(disk.root).catch(() => {
      return;
    }) ?? disk.root;
    const install = installOf(real);
    const root = install === undefined ? marketRoot(real) : installedMarketRoot(install, await textOf$1(disk, `${install.pluginsDir}/known_marketplaces.json`).catch(() => {
      return;
    }));
    return await loadCatalog({ read: (path) => disk.read(path), root, enabledPlugins: await enabledPlugins(disk), hasLink: await skillLinks(disk) });
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
    settingsText: await textOf$1(disk, settingsPath),
    knownText: await textOf$1(disk, `${install.pluginsDir}/known_marketplaces.json`)
  });
  if (next === undefined)
    return;
  await disk.write(settingsPath, next);
  disk.log(`modz: auto-update turned on for the ${install.market} marketplace`);
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
function targetOf(opts) {
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
  const asksWhy = options.sayWhy !== false;
  if (!keepsLanguage && !asksWhy)
    return;
  on("turn.start", async ($, e, next) => {
    const agentId = e.agentId;
    if (asksWhy)
      unasked.add(agentId ?? MAIN);
    if (agentId === undefined)
      armed = targetOf({ setting: await languageSetting($), uiLang: lang() });
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

const HOME_LABEL = "← modz";
function HomeButton(ui, onPress) {
  const { Box, Button } = ui;
  return h(Box, {
    key: "modz-home-row",
    flexDirection: "row",
    marginLeft: -1
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

const PX_PER_COLUMN = 9;
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
  }, words.allMods), h(Text, null, headline(view.market.mods)), h(Box, {
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
  const width = Math.max(WIDTH_MIN, Math.min(WIDTH_MAX, view.columns * PX_PER_COLUMN - PX_PER_COLUMN));
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
  const title = headline(view.market.mods);
  const words = catalogWords();
  const guides = guideOf(view.market, view.commands);
  const label = (key, text, count) => draw(`eyebrow-${key}`, [text, count], (cue) => labelSvg({ width, theme: view.theme, label: text, count, cue }));
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, draw("head", [title, health], (cue) => headSvg({ width, theme: view.theme, title, meta: health.text, metaRole: health.isBad ? "danger" : null, cue })), installSection(ui, view, label("install", words.install, installsOf(view.market).length)), guides.length === 0 ? null : h(Box, {
    key: "guide",
    flexDirection: "column"
  }, label("guide", words.guide, guides.length), guides.map((guide) => h(Box, {
    key: `guide-${guide.mod}`
  }, draw(`guide-row-${guide.mod}`, guide, (cue) => guideSvg({ width, theme: view.theme, guide, cue }))))), groupsOf(view.market.mods).map(([group, list]) => h(Box, {
    key: `group-${group}`,
    flexDirection: "column"
  }, draw(`eyebrow-${group}`, [group, list.length], (cue) => groupSvg({ width, theme: view.theme, group, count: list.length, cue })), list.map((mod) => h(Box, {
    key: `mod-${mod.name}`
  }, draw(`row-${mod.name}`, mod, (cue) => rowSvg({ width, theme: view.theme, mod, cue })))))));
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
function callOf(command) {
  const { kept, out } = splitRedirects(wordsOf$1(command));
  const words = [...kept];
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
const say = (entry, lang, x = "") => fill(textOf(entry, lang), x);
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
  return shown.join(textOf(SHELL.then, lang)) + (more > 0 ? say(SHELL.more, lang, String(more)) : "");
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
const WORDS$1 = {
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
const kindWord = (kind, lang) => WORDS$1[kind][lang === "tr" ? 1 : 0];
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
const fieldsOf = (input) => typeof input === "object" && input !== null ? input : {};
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
    return textOf(BROWSER_ACTS.find(([pattern]) => pattern.test(name))?.[1] ?? BROWSER, lang);
  if (known !== undefined)
    return textOf(known, lang);
  const isId = /^[0-9a-f-]{20,}$/i.test(server);
  return fill(textOf(isId ? OTHER.tool : OTHER.service, lang), clip((isId ? name : server).replace(/[_-]+/g, " ")));
}
function plainCall(tool, input, lang) {
  const fields = fieldsOf(input);
  if (tool === "Bash" || tool === "PowerShell") {
    const command = typeof fields.command === "string" ? fields.command : "";
    return command.trim() === "" ? textOf(OTHER.command, lang) : plainShell(command, lang);
  }
  if (tool.startsWith("mcp__"))
    return serviceSay(tool, lang);
  const known = TOOLS[tool];
  if (known === undefined)
    return fill(textOf(OTHER.tool, lang), clip(tool));
  const [entry, field, as] = known;
  const named = field === undefined ? "" : namedOf(fields[field], as);
  const template = textOf(entry, lang);
  return named === "" && /(^|[^[])\{x\}/.test(template.replace(/\[[^\]]*\]/g, "")) ? fill(textOf(OTHER.tool, lang), tool) : fill(template, named);
}
function partsOf$1(tool, input, lang) {
  const command = tool === "Bash" || tool === "PowerShell" ? fieldsOf(input).command : undefined;
  const parts = typeof command === "string" ? leadsOf(command).map((call) => ({ kind: commandKind(call), text: callSay(call, lang) ?? "" })) : [];
  const unique = parts.filter((part, i) => part.text !== "" && parts.findIndex((other) => other.text === part.text) === i);
  return unique.length > 1 ? unique : [{ kind: kindOf(tool, input), text: plainCall(tool, input, lang) }];
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
    return { kind: first.kind, text: first.why, note: first.said, count: bucket.length, state, files };
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
  const words = pick(WORDS);
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
  return h(Text, {
    wrap: "truncate-end"
  }, h(Text, null, named(draw, step.text, step)), step.note === "" ? null : h(Text, {
    dimColor: true
  }, " · ", named(draw, step.note, step)));
}
function stepRow(draw, step, key, hasEnd) {
  const { Box, Text } = draw.ui;
  const tail = [step.count > 1 ? `×${step.count}` : "", hasEnd ? endOf(step.state) : ""].filter(Boolean).join(" ");
  return h(Box, {
    key,
    flexDirection: "row",
    alignItems: "center",
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
  const step = stepOfCall(call);
  const hasEnd = step.state === "failed" || step.state === "stopped";
  const parts = partsOf$1(call.tool, call.input, lang());
  if (parts.length < 2)
    return [stepRow(draw, step, "plain-0", hasEnd)];
  return parts.map((part, i) => stepRow(draw, { ...step, kind: part.kind, text: `${i + 1}. ${part.text}`, files: [] }, `plain-${i}`, hasEnd && i === parts.length - 1));
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
    }, pick(WORDS).more(trail.more)) : null
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
const clearUnanswered = async (io) => {
  if (await io.unanswered.read() !== null)
    await io.unanswered.write(null);
};
async function stepAside(io, pane) {
  answered = null;
  await io.stage.write(pane);
  await io.close(HUB_PANE);
  await io.close(MODS_PANE);
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
  if (pane === MODS_PANE)
    return io.show(MODS_PANE);
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
}

function metaOf(market) {
  if (market.mods.length === 0)
    return hubWords().unreadable;
  return hubWords().modsOn(market.mods.filter((mod) => mod.isEnabled === true).length);
}
function viewOf(parts, frame) {
  const presence = withHosted(presenceOf(parts.market), parts.isUsageHosting);
  const rows = withUnanswered(rowsOf(parts.cards, presence, parts.layout), parts.unanswered, hubWords().noAnswer);
  const hidden = hiddenRowsOf(parts.cards, presence, parts.layout);
  return { rows, hidden, focus: focusOf(rows), now: nowOf(rows, parts.now), meta: metaOf(parts.market), isEditing: parts.isEditing, ...frame };
}
function plainViewOf(parts, frame) {
  const rows = rowsOf(parts.cards, withHosted(presenceOf(parts.market), parts.isUsageHosting));
  return { rows, hidden: [], focus: null, now: [], meta: hubWords().plain, isEditing: false, ...frame, surface: "plain", theme: "auto" };
}

const PANE = HUB_PANE;
const TITLE = "modz";
const OPEN = { plugin: "modz", key: "open" };
const STAGE = { plugin: "modz", key: "stage" };
const cardsAtom = atom({ plugin: "modz", key: "cards" }, {});
const layoutAtom = atom({ plugin: "modz", key: "layout" }, EMPTY_LAYOUT);
const editingAtom = atom({ plugin: "modz", key: "isEditing" }, false);
const unansweredAtom = atom({ plugin: "modz", key: "unanswered" }, null);
const ON = { plugin: "modz", key: "isOn" };
const LAYOUT_KEY = "layout";
const DEFAULT_COLUMNS = 80;
async function themeNow($) {
  const rows = await $.config.list().catch(() => []);
  return themeOf(rows.find((row) => row.key === "theme")?.value);
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
const hubDrawings = stableDrawings();
const catalogDrawings = stableDrawings();
const closeQuietly = ($, id) => $.ui.close({ id }).catch((cause) => $.ui.log(`modz: ${id} could not be closed: ${String(cause)}`, { to: "debug" }));
async function show($, pane, isFocused = true) {
  const title = pane === PANE ? TITLE : modsTitle();
  const drawings = pane === PANE ? hubDrawings : catalogDrawings;
  drawings.reset();
  await $.ui.open(isFocused ? { id: pane, title, focus: true } : { id: pane, title });
  await $.state.set(STAGE, { pane, at: Date.now() });
  await closeQuietly($, pane === PANE ? MODS_PANE : PANE);
}
const openHub = ($) => show($, PANE);
const swapOf = ($) => ({
  panes: () => $.ui.panes(),
  show: (pane, isFocused) => show($, pane, isFocused),
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
async function openOrPoint($, pane) {
  const [mod, card] = Object.entries(await read($, cardsAtom)).find(([, each]) => each.pane === pane && each.isBandOnly === true) ?? [];
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
  const [cards, layout, isEditing] = [await read($, cardsAtom), await read($, layoutAtom), await read($, editingAtom)];
  const host = await $.state.get({ plugin: "hud-pro", key: "host" }).catch(() => ({ value: false }));
  return { market: await marketSoon(diskOf($)), cards, layout, isEditing, unanswered: await read($, unansweredAtom), now: await $.clock.now().catch(() => Date.now()), isUsageHosting: host.value === true };
}
function startHooks(on, options) {
  on("session.start", async ($, e, next) => {
    setLang(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    const started = await next(e);
    const saved = layoutOf(await $.store.get(LAYOUT_KEY).catch(() => {
      return;
    }));
    await update($, layoutAtom, () => saved);
    await $.state.set(ON, true);
    await $.command.register({ name: "modz", description: hubWords().command });
    if (options.openOnStart !== false) {
      hubDrawings.reset();
      await $.ui.open({ id: PANE, title: TITLE });
    }
    if (options.keepUpdated !== false) {
      keepUpdated(diskOf($)).catch((cause) => $.ui.log(`modz: auto-update could not be turned on: ${String(cause)}`, { to: "debug" }));
    }
    return started;
  });
  on("session.attach", async ($, e, next) => {
    const done = await next(e);
    const isDesktop = e.surface === "desktop";
    const staged = paneOf((await $.state.get(STAGE)).value);
    const isModStaged = staged !== null && staged !== PANE && staged !== MODS_PANE;
    if (isDesktop && options.openOnStart !== false && !isModStaged && (await $.ui.panes()).length === 0)
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
      const go = () => pane === null ? openHub($) : openPane(swapOf($), pane);
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
    if (e.args.trim().toLowerCase() === "help")
      return { text: helpText(await marketOf(diskOf($)), await $.command.list().catch(() => [])) };
    await openHub($);
    return { text: hubWords().opened };
  });
}
function paneHooks(on) {
  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) => {
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
async function copy($, text, press) {
  const surface = press?.surface;
  const words = catalogWords();
  try {
    $.ui.toast((await $.ui.copy(surface === undefined ? { text } : { text, surface })).isCopied ? words.copied : words.notCopied);
  } catch (cause) {
    $.ui.log(`modz: the install line could not be copied: ${String(cause)}`, { to: "debug" });
  }
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
  paneHooks(on);
  footerHooks(on);
  wireLanguageKeeper(on, options);
  wirePlainRows(on, options);
};

export { register };
