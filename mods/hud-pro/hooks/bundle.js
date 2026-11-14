// Built by `bin/modz build` from the files beside it. Never edited by hand.
import { atom, update, read } from 'claude-code';

const MODES = ["auto", "always", "alerts"];
const isBandMode = (value) => typeof value === "string" && MODES.includes(value);
const BAND_KEY = "hud-pro.band";
const band = { setting: "auto", chosen: null };
const isAlertsOnly = (mode, isDesktop) => mode === "alerts" || mode === "auto" && isDesktop;
function parseBand(args) {
  const [verb, mode, ...rest] = args.trim().toLowerCase().split(/\s+/);
  return verb === "band" && rest.length === 0 && isBandMode(mode) ? mode : null;
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
const CARD = {
  en: { five_hour: "5-hour", seven_day: "weekly", spend_limit: "spend", context: "memory" },
  tr: { five_hour: "5 saatlik", seven_day: "haftalık", spend_limit: "harcama", context: "hafıza" }
};
const shortLabels = () => pick(SHORT);
const cardLabels = () => pick(CARD);
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
const CATEGORY_EN = {
  "System prompt": "Built-in instructions",
  "System tools": "Built-in tools",
  "MCP tools": "Connected tools (MCP)",
  "Custom agents": "Your agents",
  "Slash commands": "Commands"
};
const CATEGORY_TR = {
  "System prompt": "Yerleşik talimatlar",
  "System tools": "Yerleşik araçlar",
  "MCP tools": "Bağlı araçlar (MCP)",
  "Custom agents": "Senin ajanların",
  "Memory files": "Hafıza dosyaları",
  Skills: "Beceriler",
  "Slash commands": "Komutlar",
  Messages: "Mesajlar"
};
const categoryLabel = (name) => pick({ en: CATEGORY_EN[name] ?? name, tr: CATEGORY_TR[name] ?? name });
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
const WORDS = { en: EN$1, tr: TR$1 };
const words = () => pick(WORDS);

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

const HUB_PANE = "usage";
const SEVEN_DAY$1 = "seven_day";
const HUB_GAUGES = [FIVE_HOUR, SEVEN_DAY$1];
const WARN_PERCENT = 80;
const BAD_PERCENT = 95;
const EMPTY_HUB = { pane: HUB_PANE, detail: "", tone: "idle", at: 0 };
function hubTone(fivePercent) {
  if (fivePercent >= BAD_PERCENT)
    return "bad";
  return fivePercent >= WARN_PERCENT ? "warn" : "idle";
}
function hubOf(usage) {
  const gauges = HUB_GAUGES.flatMap((id) => usage?.gauges.filter((gauge) => gauge.id === id) ?? []);
  const detail = gauges.map((gauge) => `${cardLabels()[gauge.id] ?? gauge.id.replace(/_/g, " ")} ${valueText(gauge.percent)}`).join(" · ");
  const five = gauges.find((gauge) => gauge.id === FIVE_HOUR)?.percent ?? 0;
  return { detail, tone: hubTone(five) };
}
const isOwnOpen = (value) => typeof value === "object" && value !== null && value.pane === HUB_PANE;

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

const motion = paneMotion();

const NOTICE_MS = 30000;
const LOUDER = ["reflect", "you-should-know", "cache-tax", "session-budget", "effort-router"];
const shownAt = new Map;
function isLive(notice, nowMs) {
  if (notice === undefined || notice === null)
    return false;
  const expiresAt = notice.expiresAt;
  return typeof expiresAt !== "number" || expiresAt <= 0 || expiresAt > nowMs;
}
function enqueue(queue, text) {
  const id = Math.max(0, ...queue.map((notice) => notice.id)) + 1;
  return [...queue, { id, text, expiresAt: 0 }];
}
function headToDraw(queue, nowMs) {
  const head = queue[0];
  if (head === undefined)
    return null;
  if (!shownAt.has(head.id))
    shownAt.set(head.id, nowMs);
  return head;
}
function expired(queue, nowMs) {
  const head = queue[0];
  const since = head === undefined ? undefined : shownAt.get(head.id);
  if (head === undefined || since === undefined || nowMs - since < NOTICE_MS)
    return queue;
  shownAt.delete(head.id);
  return queue.slice(1);
}
function resetSlot() {
  shownAt.clear();
}

const paneOf = (value) => {
  if (typeof value !== "object" || value === null)
    return null;
  const pane = value.pane;
  return typeof pane === "string" && pane !== "" ? pane : null;
};
function isOffStage(value, pane) {
  const staged = paneOf(value);
  return staged !== null && staged !== pane;
}
const shownOf = (pane, at) => ({ pane, at });

const PANE$1 = "hud-pro";
const HIDDEN_KEY = "hud-pro.hidden";
const hiddenAtom$2 = atom({ plugin: "hud-pro", key: "isHidden" }, false);
async function toggle($) {
  await update($, hiddenAtom$2, (isHidden) => !isHidden);
  const isHidden = await read($, hiddenAtom$2);
  await $.store.set(HIDDEN_KEY, isHidden);
  return { text: isHidden ? words().hidden : words().shown };
}
async function reportShown($) {
  try {
    if ((await $.state.get({ plugin: "modz", key: "isOn" })).value !== true)
      return;
    await $.state.set({ plugin: "hud-pro", key: "shown" }, shownOf(HUB_PANE, await $.clock.now()));
  } catch {
    $.ui.log("hud-pro: could not tell the hub the pane is shown", { to: "debug" });
  }
}
const focus = { section: null };
const SECTION_OF = { "session-budget": "budget", "cache-tax": "cache", "effort-router": "effort" };
const EFFORT_PANE = "effort";
async function openPane($, section = null) {
  focus.section = section;
  motion.reset();
  const opened = await $.ui.open({ id: PANE$1, title: words().paneTitle, focus: true, closeOnEscape: true });
  if (opened.isPlaced)
    await reportShown($);
}
async function setBand($, args) {
  const mode = parseBand(args);
  if (mode === null)
    return { text: words().bandUsage };
  band.chosen = mode;
  await $.store.set(BAND_KEY, mode);
  $.ui.invalidate("ui.render");
  return { text: words().bandSet(mode) };
}
async function runCommand($, args) {
  const arg = args.trim().toLowerCase();
  if (arg.startsWith("band"))
    return setBand($, args);
  if (arg !== "full")
    return toggle($);
  await openPane($);
  return {};
}
function onCommand(on) {
  on("command.run", { command: "hud" }, async ($, e) => {
    try {
      return await runCommand($, e.args);
    } catch {
      return { text: words().commandFailed };
    }
  });
  on("state.set", { plugin: "modz", key: "open" }, async ($, e, next) => {
    const done = await next(e);
    if (isOwnOpen(e.value))
      await openPane($);
    else if (e.value?.pane === EFFORT_PANE && (await $.state.get({ plugin: "effort-router", key: "section" })).value !== undefined) {
      await openPane($, "effort");
    }
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "modz", key: "stage" }, async ($, e, next) => {
    const done = await next(e);
    if (isOffStage(e.value, HUB_PANE))
      await $.ui.close({ id: PANE$1 });
    return done;
  }).catch(($, e, next) => next(e));
  onUsageAsks(on);
}
function onUsageAsks(on) {
  on("state.set", { key: "openUsage" }, async ($, e, next) => {
    const done = await next(e);
    const section = SECTION_OF[e.plugin];
    if (section !== undefined)
      await openPane($, section);
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { key: "section" }, async ($, e, next) => {
    const done = await next(e);
    if (SECTION_OF[e.plugin] !== undefined)
      $.ui.invalidate("ui.render");
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { key: "notice" }, async ($, e, next) => {
    const done = await next(e);
    if (LOUDER.includes(e.plugin))
      $.ui.invalidate("ui.render");
    return done;
  }).catch(($, e, next) => next(e));
}

const TOP_CATEGORIES = 4;
const sumOf = (rows) => rows.reduce((sum, row) => sum + row.tokens, 0);
function tailSegments(categories) {
  const free = sumOf(categories.filter((row) => row.kind === "free"));
  const reserve = sumOf(categories.filter((row) => row.kind === "buffer"));
  return [
    ...free > 0 ? [{ label: words().freeSpace, tokens: free, kind: "free" }] : [],
    ...reserve > 0 ? [{ label: words().reserve, tokens: reserve, kind: "reserve" }] : []
  ];
}
function contextView(breakdown) {
  const used = breakdown.categories.filter((row) => row.kind === "used" && row.tokens > 0).sort((left, right) => right.tokens - left.tokens);
  const top = used.slice(0, TOP_CATEGORIES).map((row) => ({ label: categoryLabel(row.name), tokens: row.tokens, kind: "used" }));
  const rest = sumOf(used.slice(TOP_CATEGORIES));
  const segments = [...top, ...rest > 0 ? [{ label: words().other, tokens: rest, kind: "other" }] : [], ...tailSegments(breakdown.categories)];
  const total = sumOf(segments);
  if (total <= 0)
    return null;
  const threshold = breakdown.isAutoCompactEnabled ? breakdown.autoCompactThreshold : undefined;
  return { segments, total, usedTokens: sumOf(used), compactAt: threshold ?? null };
}

const PACE_MIN_SAMPLES = 3;
const PACE_MIN_SPAN_MS = 10 * 60000;
const PACE_LOOKBACK_MS = 60 * 60000;
const FULL_WARN_MS = 60 * 60000;
const TURNS_KEPT = 12;
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
const addTurn = (turns, tokens) => [...turns, tokens].slice(-TURNS_KEPT);
const pad$1 = (value) => String(value).padStart(TWO_DIGITS, "0");
function clockText(atMs, nowMs) {
  const at = new Date(atMs);
  const time = `${pad$1(at.getHours())}:${pad$1(at.getMinutes())}`;
  if (at.toDateString() === new Date(nowMs).toDateString())
    return time;
  return `${weekdays()[at.getDay()] ?? ""} ${time}`;
}

const BREAKDOWN_REFRESH_MS = 20000;
let cached = null;
let compactAt = null;
function freshBreakdown(nowMs) {
  return cached !== null && nowMs - cached.at < BREAKDOWN_REFRESH_MS ? cached.view : undefined;
}
function keepBreakdown(nowMs, breakdown) {
  const view = breakdown === undefined ? null : contextView(breakdown);
  cached = { at: nowMs, view };
  if (view !== null)
    compactAt = view.compactAt;
  return view;
}
function forgetBreakdown() {
  cached = null;
}
function keepLast(nowMs) {
  cached = { at: nowMs, view: cached?.view ?? null };
  return cached.view;
}
function forecastsFrom(input) {
  const limit = compactAt ?? input.usage?.context?.window ?? null;
  return { history: input.history, turnsLeft: limit === null ? null : turnsLeftOf(input.turns, limit) };
}
function compactedOf(result, at) {
  if (result.skip !== undefined)
    return null;
  return { before: result.tokensBefore ?? null, after: result.tokensAfter ?? null, at };
}
const reasonOf = (error) => error instanceof Error ? error.message : String(error);

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
const isCritical = (gauge) => gauge.tone === "danger";
function hasReset(gauge, resets) {
  if (gauge.reset === "")
    return false;
  if (resets === "all" || isCritical(gauge))
    return true;
  return resets === "five" && gauge.id === FIVE_HOUR;
}

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
const role = (fg, tint, line) => ({
  fg: { dark: fg[0], light: fg[1] },
  tint: { dark: tint[0], light: tint[1] },
  line: { dark: line[0], light: line[1] }
});
const ROLES = {
  read: role(["#7FB6E8", "#2464A0"], ["#1E2B37", "#E7F0F9"], ["#2F4A63", "#B9D3EC"]),
  edit: role(["#E58A5F", "#A94A26"], ["#38251D", "#FBEDE6"], ["#6A3E2D", "#EFC6B4"]),
  run: role(["#B19CF3", "#6243C4"], ["#29243D", "#F0ECFC"], ["#4A3F75", "#CFC3F3"]),
  ok: role(["#6FC593", "#1F6E43"], ["#1B2F25", "#E4F4EA"], ["#2F5A42", "#B5DEC4"]),
  warn: role(["#E9B949", "#8A6000"], ["#332D19", "#FBF2D9"], ["#66552A", "#EBD48F"]),
  danger: role(["#F2727F", "#C0263A"], ["#3B2023", "#FCE8EA"], ["#74343C", "#F1B9C0"]),
  plan: role(["#E07BC0", "#A8337F"], ["#351F2E", "#FBE9F4"], ["#6B3A5C", "#EDBFDC"])
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
const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`;
const MONO = `ui-monospace, 'SF Mono', Menlo, monospace`;
function rules(scheme) {
  const neutral = Object.entries(NEUTRALS).map(([name, pair]) => `.f-${name}{fill:${pair[scheme]}}.s-${name}{stroke:${pair[scheme]}}`);
  const roles = Object.entries(ROLES).map(([name, colors]) => [
    `.f-${name}{fill:${colors.fg[scheme]}}.s-${name}{stroke:${colors.fg[scheme]}}`,
    `.f-${name}-t{fill:${colors.tint[scheme]}}.s-${name}-l{stroke:${colors.line[scheme]}}`
  ].join(""));
  return [...neutral, ...roles].join("");
}
function svgStyle(extra = "") {
  return [
    "<style>",
    `text{font-family:${FONT}}.num{font-family:${MONO};font-variant-numeric:tabular-nums}.tab{font-variant-numeric:tabular-nums}`,
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

const BAR$2 = "━";
const TRACK = "─";
const TICK = "┊";
const GROUP_GAP = 3;
const WIDE_COLUMNS = 96;
const MEDIUM_COLUMNS = 52;
const WIDE$1 = { barWidth: 6, resets: "all", hasCost: true, hasAlert: true };
const MEDIUM = { barWidth: 0, resets: "five", hasCost: true, hasAlert: true };
const NARROW$1 = { barWidth: 0, resets: "critical", hasCost: false, hasAlert: false };
function layoutFor(columns) {
  if (columns >= WIDE_COLUMNS)
    return WIDE$1;
  return columns >= MEDIUM_COLUMNS ? MEDIUM : NARROW$1;
}
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
  }, BAR$2.repeat(filled)), track !== "" && h(Text, {
    dimColor: true
  }, track));
}
function gaugeTree(ui, gauge, layout) {
  const { Box, Text } = ui;
  const showsReset = hasReset(gauge, layout.resets);
  const resetTone = isCritical(gauge) ? gauge.tone : "neutral";
  return h(Box, {
    key: `gauge-${gauge.id}`,
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    dimColor: true
  }, gauge.short), layout.barWidth > 0 && barTree(ui, { gauge, width: layout.barWidth }), toneText(ui, { text: valueText(gauge.percent), tone: gauge.tone }), layout.hasAlert && gauge.alert !== "" && h(Text, null, gauge.alert), showsReset && toneText(ui, { text: resetText(gauge.reset), tone: resetTone }));
}
function lineTree(ui, input) {
  const { Box, Text } = ui;
  const alertColumns = input.gauges.reduce((sum, gauge) => sum + (gauge.alert === "" ? 0 : gauge.alert.length + 1), 0);
  const layout = layoutFor(input.columns - alertColumns);
  const hasCost = layout.hasCost && input.costUsd !== null;
  if (input.gauges.length === 0 && !hasCost)
    return null;
  return h(Box, {
    key: "hud-pro",
    flexDirection: "row",
    columnGap: GROUP_GAP
  }, input.gauges.map((gauge) => gaugeTree(ui, gauge, layout)), hasCost && input.costUsd !== null && h(Text, {
    dimColor: true
  }, costText(input.costUsd)));
}

const AREA_OPACITY = 0.12;
const LABEL_SIZE$1 = 12;
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
  return { source: `${open}${svgStyle(spec.css)}${spec.body}</svg>`, alt: spec.alt, width, height };
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
  return `<text class="f-lo" x="${at.x}" y="${at.y}" font-size="${LABEL_SIZE$1}" font-weight="${LABEL_WEIGHT}">${escape(text)}</text>`;
}

const HEIGHT = 26;
const PILL = { y: 1, h: 24, padX: 12 };
const LEAD_X = 1;
const BASELINE = 17.5;
const LABEL_SIZE = 12;
const VALUE_SIZE = 12.5;
const METER = { long: 38, short: 24, height: 4 };
const GAP = { inner: 7, pill: 6 };
const EDGE = 1;
const SCALE = { regular: 1.05, bold: 1.15 };
const BOLD_WEIGHT = 600;
const VALUE_SLOT = "%00";
const LAYOUTS = [
  { isLong: true, meter: METER.long, resets: "all", hasCost: true, hasAlert: true },
  { isLong: true, meter: METER.long, resets: "five", hasCost: true, hasAlert: true },
  { isLong: true, meter: METER.short, resets: "five", hasCost: true, hasAlert: true },
  { isLong: false, meter: METER.short, resets: "five", hasCost: true, hasAlert: true },
  { isLong: false, meter: 0, resets: "five", hasCost: true, hasAlert: true },
  { isLong: false, meter: 0, resets: "critical", hasCost: true, hasAlert: true },
  { isLong: false, meter: 0, resets: "critical", hasCost: false, hasAlert: true },
  { isLong: false, meter: 0, resets: "critical", hasCost: false, hasAlert: false }
];
const widthOf = (value, spec) => measure(value, spec.size) * ((spec.weight ?? 0) >= BOLD_WEIGHT ? SCALE.bold : SCALE.regular);
const text = (spec) => {
  const width = Math.max(widthOf(spec.value, spec), spec.slot === undefined ? 0 : widthOf(spec.slot, spec));
  const isSlotted = spec.slot !== undefined;
  return {
    width,
    draw: (x) => `<text class="${spec.cls}" x="${(isSlotted ? x + width : x).toFixed(1)}" y="${BASELINE}" font-size="${spec.size}" font-weight="${spec.weight ?? 500}"${isSlotted ? ' text-anchor="end"' : ""}>${escape(spec.value)}</text>`
  };
};
const meterPiece = (gauge, width) => ({
  width,
  draw: (x) => meter({ x, y: PILL.y + (PILL.h - METER.height) / 2, width, height: METER.height, percent: gauge.percent, tone: gauge.tone, pace: gauge.pace })
});
function gaugePill(gauge, layout) {
  const isHot = isCritical(gauge);
  const label = text({ value: layout.isLong ? gauge.long : gauge.short, cls: isHot ? "f-hi" : "f-mid", size: LABEL_SIZE });
  const value = text({ value: valueText(gauge.percent), cls: `${fillOf(gauge.tone)} tab`, size: VALUE_SIZE, weight: 650, slot: VALUE_SLOT });
  const resetCls = isHot ? "f-danger tab" : "f-lo tab";
  const reset = hasReset(gauge, layout.resets) ? [text({ value: resetText(gauge.reset), cls: resetCls, size: LABEL_SIZE })] : [];
  const alert = layout.hasAlert && gauge.alert !== "" ? [text({ value: gauge.alert, cls: "f-mid tab", size: LABEL_SIZE })] : [];
  const meters = layout.meter > 0 ? [meterPiece(gauge, layout.meter)] : [];
  return { pieces: [label, ...meters, value, ...alert, ...reset], frame: "s-line", fill: "f-card" };
}
function costPill(usd) {
  return {
    pieces: [text({ value: costText(usd), cls: "f-hi tab", size: VALUE_SIZE, weight: 650 }), text({ value: words().session, cls: "f-lo", size: LABEL_SIZE })],
    frame: "s-line",
    fill: "f-card"
  };
}
const pillWidth = (pill) => pill.pieces.reduce((sum, piece) => sum + piece.width, 0) + GAP.inner * (pill.pieces.length - 1) + PILL.padX * 2;
function drawPill(pill, x) {
  const width = pillWidth(pill);
  let at = x + PILL.padX;
  const body = pill.pieces.map((piece) => {
    const drawn = piece.draw(at);
    at += piece.width + GAP.inner;
    return drawn;
  });
  const frame = `<rect class="${pill.fill} ${pill.frame}" x="${(x + 0.5).toFixed(1)}" y="${PILL.y + 0.5}" width="${(width - 1).toFixed(1)}" height="${PILL.h - 1}" rx="${(PILL.h - 1) / 2}"/>`;
  return `${frame}${body.join("")}`;
}
function place(pills) {
  let x = LEAD_X;
  const body = pills.map((pill) => {
    const drawn = drawPill(pill, x);
    x += pillWidth(pill) + GAP.pill;
    return drawn;
  });
  return { width: Math.max(0, x - GAP.pill), body: body.join("") };
}
function pillsFor(spec, layout) {
  const gauges = spec.gauges.map((gauge) => gaugePill(gauge, layout));
  return layout.hasCost && spec.costUsd !== null ? [...gauges, costPill(spec.costUsd)] : gauges;
}
function altOf(spec) {
  const gauges = spec.gauges.map((gauge) => [`${gauge.long} ${valueText(gauge.percent)}`, ...gauge.alert === "" ? [] : [gauge.alert], ...gauge.reset === "" ? [] : [words().resetsAfter(gauge.reset)]].join(", "));
  return [...gauges, ...spec.costUsd === null ? [] : [words().sessionAt(costText(spec.costUsd))]].join(" · ");
}
function lineSvg(spec) {
  if (spec.gauges.length === 0 && spec.costUsd === null)
    return null;
  const placed = LAYOUTS.map((layout) => place(pillsFor(spec, layout)));
  const fit = placed.find((candidate) => candidate.width + EDGE <= spec.maxWidth) ?? placed[placed.length - 1];
  if (fit === undefined || fit.width <= LEAD_X)
    return null;
  return svgDoc({ width: fit.width + EDGE, height: HEIGHT, body: fit.body, alt: altOf(spec) });
}

const needsLook = (gauge) => gauge.tone !== "neutral" || gauge.alert !== "";
function shownGauges$1(input) {
  const gauges = gaugeViews(input.usage, input.nowMs, input.forecasts);
  return input.isAlertsOnly === true ? gauges.filter(needsLook) : gauges;
}
const shownCost = (input) => input.isAlertsOnly === true ? null : input.usage.costUsd;
const PX_PER_COLUMN$1 = 6.4;
const BUTTON_PX = 104;
const COMPACT_HOTKEY = "s";
function desktopLine(ui, input, reserve) {
  const { Svg } = ui;
  const drawn = lineSvg({
    gauges: shownGauges$1(input),
    costUsd: shownCost(input),
    maxWidth: input.columns * PX_PER_COLUMN$1 - reserve
  });
  return drawn === null ? null : h(Svg, {
    source: drawn.source,
    alt: drawn.alt,
    width: drawn.width,
    height: drawn.height
  });
}
function bandRow(ui, input) {
  const { Box, Button } = ui;
  const context = input.usage.gauges.find((gauge) => gauge.id === CONTEXT);
  const showsCompact = input.canCompact && input.isAlertsOnly !== true && context !== undefined && context.percent >= CONTEXT_WARN;
  const line = input.isDesktop ? desktopLine(ui, input, showsCompact ? BUTTON_PX : 0) : lineTree(ui, { gauges: shownGauges$1(input), costUsd: shownCost(input), columns: input.columns });
  if (line === null && !showsCompact)
    return null;
  return h(Box, {
    key: "hud-pro-row",
    flexDirection: "row",
    alignItems: "center",
    columnGap: 2
  }, line, showsCompact && h(Button, {
    key: "compact",
    label: words().compact,
    hotkey: COMPACT_HOTKEY,
    onPress: input.compact,
    ...input.isDesktop ? {} : { plain: true }
  }));
}

const SEVEN_DAY = "seven_day";
const HOUR_MS = 3600000;
const DAY_HOURS = 24;
const WEEK_HOURS = 7 * DAY_HOURS;
const WEEK_MIN_EVEN_PERCENT = 5;
const LOOKBACK_MS = { [FIVE_HOUR]: HOUR_MS, [SEVEN_DAY]: DAY_HOURS * HOUR_MS };
const NOTABLE_SHARE = { [FIVE_HOUR]: 10, [SEVEN_DAY]: 3 };
const SHARES_KEPT = 5;
function paceWindow(usage) {
  const gauges = usage?.gauges ?? [];
  return gauges.find((gauge) => gauge.id === FIVE_HOUR) ?? gauges.find((gauge) => gauge.id === SEVEN_DAY) ?? null;
}
function shareOf(before, after) {
  const isSameWindow = before !== null && before.id === after.id && before.resetsAt === after.resetsAt;
  return Math.max(0, isSameWindow ? after.percent - before.percent : after.percent);
}
const isNotable = (share) => share.share >= (NOTABLE_SHARE[share.window] ?? Number.POSITIVE_INFINITY);
const addShare = (shares, share) => [...shares, share].slice(-SHARES_KEPT);
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
  shareNotice: (share, window, percent) => `That turn used ${share} of the ${window} (now ${percent}).`,
  fillNotice: ({ window, time, reset }) => `At this pace the ${window} runs out ${time}, before it refills at ${reset}.`,
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
  shareNotice: (share, window, percent) => `Bu tur ${window}tan ${share} kullandı (şimdi ${percent}).`,
  fillNotice: ({ window, time, reset }) => `Bu hızla ${window} ${time} biter, yenilenmeden (${reset}) önce.`,
  listPrice: "liste fiyatıyla tahmin"
};
const usageWords = () => pick({ en: EN, tr: TR });

const MINUTE_MS$1 = 60000;
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
    return [says.tooFew(pace.readings, PACE_MIN_SAMPLES, PACE_MIN_SPAN_MS / MINUTE_MS$1)];
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
function shareNotice(share) {
  if (!isNotable(share))
    return null;
  return usageWords().shareNotice(percentText(share.share), longLabelOf(share.window), percentText(share.percent));
}
function fillNotice(pace, nowMs) {
  if (pace === null || pace.fullAt === null || pace.gauge.resetsAt === null)
    return null;
  const reset = clockText(Date.parse(pace.gauge.resetsAt), nowMs);
  const text = usageWords().fillNotice({ window: longLabelOf(pace.gauge.id), time: clockText(pace.fullAt, nowMs), reset });
  return { key: `${pace.gauge.id}:${pace.gauge.resetsAt}`, text };
}

const HISTORY_MAX = 96;
const IDLE_SAMPLE_MS = 300000;
function percentsOf(usage) {
  const percents = {};
  for (const gauge of usage?.gauges ?? [])
    percents[gauge.id] = gauge.percent;
  return percents;
}
function isSame$2(left, right) {
  const keys = new Set([...Object.keys(left.percents), ...Object.keys(right.percents)]);
  return left.cost === right.cost && [...keys].every((key) => left.percents[key] === right.percents[key]);
}
function addSample(history, usage, nowMs) {
  const sample = { t: nowMs, percents: percentsOf(usage), ...usage.costUsd === null ? {} : { cost: usage.costUsd } };
  const last = history[history.length - 1];
  if (last !== undefined && isSame$2(last, sample) && nowMs - last.t < IDLE_SAMPLE_MS)
    return history;
  return [...history, sample].slice(-HISTORY_MAX);
}
function seriesOf(history, id) {
  return history.map((sample) => sample.percents[id]).filter((value) => value !== undefined);
}
function costSeries(history) {
  return history.map((sample) => sample.cost).filter((value) => value !== undefined);
}
function limitsOnly(sample) {
  const percents = Object.fromEntries(Object.entries(sample.percents).filter(([id]) => id !== CONTEXT));
  return Object.keys(percents).length === 0 ? null : { t: sample.t, percents };
}
const limitsOf = (history) => history.map(limitsOnly).filter((sample) => sample !== null);
const accountHistory = (saved) => limitsOf(saved);
function mergeHistory(stored, mine) {
  const byTime = new Map;
  for (const sample of [...limitsOf(stored), ...limitsOf(mine)])
    byTime.set(sample.t, sample);
  return [...byTime.values()].sort((a, b) => a.t - b.t).slice(-HISTORY_MAX);
}
function hasLimitsMoved(before, after) {
  const left = before === undefined ? null : limitsOnly(before);
  const right = after === undefined ? null : limitsOnly(after);
  if (right === null)
    return false;
  return left === null || !isSame$2(left, right);
}
function isHistory(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null && ("percents" in item) && ("t" in item));
}

const PAD$2 = 0;
const LABEL_Y$1 = 13;
const BAR$1 = { y: 26, h: 8 };
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
  let x = PAD$2;
  const parts = view.segments.map((segment, rank) => {
    const share = segment.tokens / view.total * width;
    const drawn = `<rect ${paintOf(segment, rank)} x="${x.toFixed(1)}" y="${BAR$1.y}" width="${share.toFixed(1)}" height="${BAR$1.h}"/>`;
    x += share;
    return drawn;
  });
  const clip = `<clipPath id="ctx-bar"><rect x="${PAD$2}" y="${BAR$1.y}" width="${width}" height="${BAR$1.h}" rx="${BAR$1.h / 2}"/></clipPath>`;
  return `${clip}<g clip-path="url(#ctx-bar)"><rect class="f-track" x="${PAD$2}" y="${BAR$1.y}" width="${width}" height="${BAR$1.h}"/>${parts.join("")}</g>`;
}
function legendSvg(view, width) {
  let x = PAD$2;
  let row = 0;
  const body = view.segments.map((segment, rank) => {
    const label = `${segment.label} `;
    const value = compact(segment.tokens);
    const itemW = LEGEND.swatch + LEGEND.inner + measure(label, LEGEND.size) + measure(value, LEGEND.size, true);
    if (x > PAD$2 && x + itemW > PAD$2 + width) {
      row += 1;
      x = PAD$2;
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
  const spark = sparkline({ x: PAD$2, y: top, width: SPARK.w, height: SPARK.h, values: spec.turns, max, tone: "neutral" });
  const hasSpark = spark !== "";
  const noteX = hasSpark ? PAD$2 + SPARK.w + SPARK.gap : PAD$2;
  const caption = spec.turns.length > 1 ? words().lastTurns(spec.turns.length) : "";
  const note = spec.forecast === "" ? "" : `<text class="f-hi" x="${noteX}" y="${top + 10}" font-size="${NOTE_SIZE}" font-weight="600">${escape(spec.forecast)}</text>`;
  const captionY = spec.forecast === "" ? top + 10 : top + SPARK.h + 2;
  const captionText = caption === "" ? "" : `<text class="f-lo" x="${noteX}" y="${captionY}" font-size="10.5">${escape(caption)}</text>`;
  return spark + note + captionText;
}
function contextSvg(spec) {
  const inner = spec.width - PAD$2 * 2;
  const head = [
    groupLabel(words().contextTitle, { x: PAD$2, y: LABEL_Y$1 }),
    `<text class="f-lo num" x="${spec.width - PAD$2}" y="${LABEL_Y$1}" font-size="10.5" text-anchor="end">${escape(spec.meta)}</text>`
  ].join("");
  const legend = spec.view === null ? null : legendSvg(spec.view, inner);
  const middle = spec.view === null || legend === null ? `<text class="f-lo" x="${PAD$2}" y="${BAR$1.y + BAR$1.h}" font-size="${NOTE_SIZE}">${escape(words().noBreakdown)}</text>` : barSvg(spec.view, inner) + legend.body;
  const footTop = legend === null ? BAR$1.y + EMPTY_H : LEGEND.top + (legend.rows - 1) * LEGEND.row + LEGEND.row;
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
function metaOf(card) {
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
  }, metaOf(card))), card.view === null ? h(Text, {
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
  const spec = { view: card.view, turns: card.turns, forecast: card.forecast, meta: metaOf(card), width: card.width };
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

const DAYS_KEPT = 30;
const LOG_VERSION = 2;
const EMPTY_LOG = { version: LOG_VERSION, at: 0, days: {}, files: {} };
const MESSAGE_ID = /^msg_[A-Za-z0-9]+$/;
const SESSION = /\/([^/]+?)(?:\/subagents\/[^/]+)?\.jsonl$/;
const SYNTHETIC = "<synthetic>";
const PAD$1 = 2;
const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;
const BASE36 = 36;
function hashOf(text) {
  let hash = FNV_OFFSET;
  for (let index = 0;index < text.length; index++)
    hash = Math.imul(hash ^ text.charCodeAt(index), FNV_PRIME) >>> 0;
  return hash.toString(BASE36);
}
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const count = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
function recordOf(json) {
  try {
    const value = JSON.parse(json);
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}
function parseLine(line) {
  const tab = line.indexOf("\t");
  const session = SESSION.exec(line.slice(0, Math.max(0, tab)))?.[1];
  const record = tab < 0 ? null : recordOf(line.slice(tab + 1));
  const usage = record?.usage;
  if (record === null || session === undefined || !isRecord(usage))
    return null;
  const { model, id } = record;
  const atMs = Date.parse(typeof record.timestamp === "string" ? record.timestamp : "");
  if (typeof model !== "string" || typeof id !== "string" || !MESSAGE_ID.test(id) || Number.isNaN(atMs))
    return null;
  const tokens = count(usage.input_tokens) + count(usage.output_tokens);
  const cache = count(usage.cache_creation_input_tokens) + count(usage.cache_read_input_tokens);
  if (model === SYNTHETIC || tokens + cache === 0)
    return null;
  return { session, model, id, atMs, tokens, cache };
}
const pad = (value) => String(value).padStart(PAD$1, "0");
function dayKey(ms) {
  const at = new Date(ms);
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}
function dayStart(ms, back) {
  const at = new Date(ms);
  at.setHours(0, 0, 0, 0);
  at.setDate(at.getDate() - back);
  return at.getTime();
}
function openLog(days) {
  const open = new Map;
  for (const [key, day] of Object.entries(days)) {
    open.set(key, { tokens: day.tokens, cache: day.cache, models: new Map(Object.entries(day.models)), sessions: new Set(day.sessions), seen: new Set(day.seen) });
  }
  return open;
}
function addRow(open, row) {
  const key = dayKey(row.atMs);
  const day = open.get(key) ?? { tokens: 0, cache: 0, models: new Map, sessions: new Set, seen: new Set };
  open.set(key, day);
  const id = hashOf(row.id);
  if (day.seen.has(id))
    return;
  day.seen.add(id);
  day.tokens += row.tokens;
  day.cache += row.cache;
  day.models.set(row.model, (day.models.get(row.model) ?? 0) + 1);
  day.sessions.add(hashOf(row.session));
}
function closeLog(open, oldest) {
  const days = {};
  for (const [key, day] of open) {
    if (key < oldest)
      continue;
    days[key] = { tokens: day.tokens, cache: day.cache, models: Object.fromEntries(day.models), sessions: [...day.sessions], seen: [...day.seen] };
  }
  return days;
}
const isDay = (day) => isRecord(day) && typeof day.tokens === "number" && typeof day.cache === "number" && isRecord(day.models) && Array.isArray(day.sessions) && Array.isArray(day.seen);
function isLog(value) {
  if (!isRecord(value) || value.version !== LOG_VERSION || typeof value.at !== "number" || !isRecord(value.files) || !isRecord(value.days))
    return false;
  return Object.values(value.days).every(isDay);
}

const RANGES = [7, 30];
const LEVELS = 4;
const MODEL = /^claude-([a-z]+)-(\d+(?:-\d{1,2})*)(?:-\d{8})?$/;
function modelName(id) {
  const found = MODEL.exec(id);
  if (found === null)
    return id;
  const family = found[1];
  return `${family.charAt(0).toUpperCase()}${family.slice(1)} ${found[2].replace(/-/g, ".")}`;
}
const rangeDays = (range, nowMs) => Array.from({ length: range }, (_, index) => dayStart(nowMs, range - 1 - index));
const levelOf = (tokens, max) => tokens <= 0 || max <= 0 ? 0 : Math.max(1, Math.ceil(tokens / max * LEVELS));
function topModel(counts) {
  const ranked = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return ranked[0] === undefined ? null : modelName(ranked[0][0]);
}
function pastOf(days, spec) {
  const starts = rangeDays(spec.range, spec.nowMs);
  const found = starts.map((start) => ({ start, key: dayKey(start), day: days[dayKey(start)] }));
  const max = Math.max(0, ...found.map((entry) => entry.day?.tokens ?? 0));
  const sessions = new Set;
  const models = new Map;
  for (const { day } of found) {
    for (const session of day?.sessions ?? [])
      sessions.add(session);
    for (const [model, count] of Object.entries(day?.models ?? {}))
      models.set(model, (models.get(model) ?? 0) + count);
  }
  const cells = found.map(({ start, key, day }) => ({ day: key, weekday: new Date(start).getDay(), tokens: day?.tokens ?? 0, level: levelOf(day?.tokens ?? 0, max) }));
  return {
    range: spec.range,
    activeDays: cells.filter((cell) => cell.tokens > 0).length,
    sessions: sessions.size,
    tokens: cells.reduce((sum, cell) => sum + cell.tokens, 0),
    cache: found.reduce((sum, entry) => sum + (entry.day?.cache ?? 0), 0),
    model: topModel(models),
    cells
  };
}
const pastsOf = (days, nowMs) => ({ week: pastOf(days, { range: 7, nowMs }), month: pastOf(days, { range: 30, nowMs }) });

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
const LIVE = { r: 3, gap: 9 };
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
  const titleX = isLive ? LIVE.r * 2 + LIVE.gap : 0;
  const dot = isLive ? `<circle class="f-edit breathe" cx="${LIVE.r}" cy="15" r="${LIVE.r}"/>` : "";
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
function cardOf(view, gauges, width) {
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
  }, gauges.map((gauge) => terminalRow(ui, gauge, view))), sectionsTree(ui, restOf(view)), contextCard(ui, cardOf(view, gauges)), view.past !== null && pastCard(ui, view.past));
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
  }), sectionsTree(ui, restOf(view)), contextCard(ui, cardOf(view, gauges, drawn.width)), view.past !== null && pastCard(ui, { ...view.past, width: drawn.width, svg: Svg }));
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
function withHome(ui, spec) {
  const { Box } = ui;
  return h(Box, {
    flexDirection: "column"
  }, HomeButton(ui, spec.goHome), spec.tree);
}

const JSONL = ".jsonl";
const BATCH = 200;
const AWK = [
  "function last(s, key,   at, i) { at = 0; while ((i = index(substr(s, at + 1), key)) > 0) at += i; return at }",
  'index($0, "\\"type\\":\\"assistant\\"") {',
  '  if (!match($0, /"message":\\{"model":"[^"]*","id":"msg_[A-Za-z0-9]+"/)) next; head = substr($0, RSTART + 11, RLENGTH - 11)',
  '  u = last($0, "\\"usage\\":{"); t = last($0, "\\"timestamp\\":\\""); if (u == 0 || t == 0) next',
  "  rest = substr($0, u + 8); depth = 0; n = length(rest)",
  '  for (i = 1; i <= n; i++) { c = substr(rest, i, 1); if (c == "{") depth++; else if (c == "}" && --depth == 0) break }',
  '  if (depth != 0 || !match(substr($0, t), /^"timestamp":"[^"]*"/)) next',
  '  print FILENAME "\\t{" head "," substr($0, t, RLENGTH) ",\\"usage\\":" substr(rest, 1, i) "}"',
  "}"
].join(`
`);
const isRecent = (entry, sinceMs) => entry.kind === "file" && entry.name.endsWith(JSONL) && entry.mtimeMs >= sinceMs;
const stampOf = (dir, entry) => ({ path: `${dir}/${entry.name}`, size: entry.size, mtimeMs: entry.mtimeMs });
async function projectFiles(io, dir, sinceMs) {
  const entries = await io.list(dir);
  const folders = new Set(entries.filter((entry) => entry.kind === "dir").map((entry) => entry.name));
  const sessions = entries.filter((entry) => isRecent(entry, sinceMs));
  const files = sessions.map((entry) => stampOf(dir, entry));
  for (const session of sessions) {
    const id = session.name.slice(0, -JSONL.length);
    if (!folders.has(id))
      continue;
    const agents = `${dir}/${id}/subagents`;
    const inside = await io.list(agents).catch(() => []);
    files.push(...inside.filter((entry) => isRecent(entry, sinceMs)).map((entry) => stampOf(agents, entry)));
  }
  return files;
}
async function transcriptFiles(io, root, sinceMs) {
  const projects = (await io.list(root)).filter((entry) => entry.kind === "dir");
  const files = [];
  for (const project of projects)
    files.push(...await projectFiles(io, `${root}/${project.name}`, sinceMs));
  return files;
}
async function extract(io, paths, onRow) {
  const stream = io.spawn(["awk", AWK, ...paths]);
  let rest = "";
  const take = (line) => {
    const row = parseLine(line);
    if (row !== null)
      onRow(row);
  };
  for await (const chunk of stream) {
    if (chunk.stream !== "stdout")
      continue;
    const lines = (rest + chunk.text).split(`
`);
    rest = lines.pop() ?? "";
    lines.forEach(take);
  }
  if (rest !== "")
    take(rest);
  const { code } = await stream.result;
  if (code !== 0)
    throw new Error(`awk ended with ${code ?? "a signal"}`);
}
const isSame$1 = (kept, file) => kept !== undefined && kept[0] === file.size && kept[1] === file.mtimeMs;
async function scanLog(io, spec) {
  const sinceMs = dayStart(spec.nowMs, DAYS_KEPT - 1);
  const files = await transcriptFiles(io, spec.root, sinceMs);
  const changed = files.filter((file) => !isSame$1(spec.log.files[file.path], file));
  const open = openLog(spec.log.days);
  for (let index = 0;index < changed.length; index += BATCH) {
    await extract(io, changed.slice(index, index + BATCH).map((file) => file.path), (row) => addRow(open, row));
  }
  return { version: LOG_VERSION, at: spec.nowMs, days: closeLog(open, dayKey(sinceMs)), files: Object.fromEntries(files.map((file) => [file.path, [file.size, file.mtimeMs]])) };
}

const PANE = "hud-pro";
const LOG_KEY = "hud-pro.past";
const PAST_REFRESH_MS = 300000;
const pastAtom$1 = atom({ plugin: "hud-pro", key: "past" }, null);
const rootAtom = atom({ plugin: "hud-pro", key: "pastRoot" }, "");
const kept = { log: null, isLoaded: false, isReading: false, isTicking: false, triedAt: Number.NEGATIVE_INFINITY };
const folderOf = (path) => path.slice(0, Math.max(0, Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"))));
const rootOf = (transcript) => transcript.endsWith(".jsonl") ? folderOf(folderOf(transcript)) : "";
const why = (error) => error instanceof Error ? error.message : String(error);
function scanIo($) {
  return { list: (dir) => $.fs.list(dir), spawn: (argv) => $.process.spawn({ argv }) };
}
async function loadLog($) {
  if (kept.isLoaded)
    return;
  kept.isLoaded = true;
  const saved = await $.store.get(LOG_KEY).catch(() => {
    return;
  });
  if (!isLog(saved))
    return;
  kept.log = saved;
  const nowMs = await $.clock.now();
  await update($, pastAtom$1, () => pastsOf(saved.days, nowMs));
}
async function readTranscripts($, root) {
  try {
    const nowMs = await $.clock.now();
    const log = await scanLog(scanIo($), { root, log: kept.log ?? EMPTY_LOG, nowMs });
    kept.log = log;
    await update($, pastAtom$1, () => pastsOf(log.days, nowMs));
    await $.store.set(LOG_KEY, log).catch((error) => $.ui.log(`hud-pro: history not kept (${why(error)})`, { to: "debug" }));
  } catch (error) {
    $.ui.log(`hud-pro: transcripts not readable (${why(error)})`, { to: "debug" });
  } finally {
    kept.isReading = false;
  }
}
async function readIfOld($) {
  await loadLog($);
  const root = await read($, rootAtom);
  const nowMs = await $.clock.now();
  const lastMs = Math.max(kept.log?.at ?? Number.NEGATIVE_INFINITY, kept.triedAt);
  if (root === "" || kept.isReading || nowMs - lastMs < PAST_REFRESH_MS)
    return;
  kept.isReading = true;
  kept.triedAt = nowMs;
  $.clock.after(1, () => readTranscripts($, root));
}
async function tick($) {
  try {
    if ((await $.ui.panes()).some((pane) => pane.id === PANE))
      await readIfOld($);
  } catch (error) {
    $.ui.log(`hud-pro: history tick failed (${why(error)})`, { to: "debug" });
  }
}
function pastViewOf(pasts, spec) {
  if (pasts === null)
    return null;
  return { past: spec.range === 30 ? pasts.month : pasts.week, choose: spec.choose };
}
function onPast(on) {
  on("classic.SessionStart", async ($, e, next) => {
    const root = rootOf(typeof e.transcript_path === "string" ? e.transcript_path : "");
    if (root !== "")
      await update($, rootAtom, () => root);
    return next(e);
  }).catch(($, e, next) => next(e));
  on("ui.open", async ($, e, next) => {
    const opened = await next(e);
    if (e.id !== PANE)
      return opened;
    try {
      await readIfOld($);
      if (!kept.isTicking)
        $.clock.every(PAST_REFRESH_MS, () => void tick($));
      kept.isTicking = true;
    } catch (error) {
      $.ui.log(`hud-pro: history read not started (${why(error)})`, { to: "debug" });
    }
    return opened;
  }).catch(($, e, next) => next(e));
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

const usageAtom$2 = atom({ plugin: "hud-pro", key: "usage" }, null);
const turnAtom$1 = atom({ plugin: "hud-pro", key: "turn" }, { requests: 0, input: 0, output: 0, cacheRead: 0 });
const lastTurnAtom$1 = atom({ plugin: "hud-pro", key: "lastTurn" }, null);
const hiddenAtom$1 = atom({ plugin: "hud-pro", key: "isHidden" }, false);
const historyAtom$1 = atom({ plugin: "hud-pro", key: "history" }, []);
const compactingAtom = atom({ plugin: "hud-pro", key: "isCompacting" }, false);
const contextTurnsAtom$2 = atom({ plugin: "hud-pro", key: "contextTurns" }, []);
const lastCompactAtom = atom({ plugin: "hud-pro", key: "lastCompact" }, null);
const liveAtom$1 = atom({ plugin: "hud-pro", key: "isLive" }, false);
const pastAtom = atom({ plugin: "hud-pro", key: "past" }, null);
const rangeAtom = atom({ plugin: "hud-pro", key: "pastRange" }, 7);
const sharesAtom$1 = atom({ plugin: "hud-pro", key: "shares" }, []);
const noticesAtom$2 = atom({ plugin: "hud-pro", key: "notices" }, []);
async function forecastsOf$1($, usage) {
  return forecastsFrom({ history: await read($, historyAtom$1), turns: await read($, contextTurnsAtom$2), usage });
}
async function breakdownView($) {
  const nowMs = await $.clock.now();
  const fresh = freshBreakdown(nowMs);
  if (fresh !== undefined)
    return fresh;
  try {
    return keepBreakdown(nowMs, (await $.session.usage({ breakdown: "summary" })).context.breakdown);
  } catch {
    $.ui.log("hud-pro: context breakdown failed", { to: "debug" });
    return keepLast(nowMs);
  }
}
function compactNow($) {
  update($, compactingAtom, () => true);
  $.clock.after(1, () => $.session.compact().then(async (result) => {
    forgetBreakdown();
    const done = compactedOf(result, await $.clock.now());
    if (done !== null)
      await update($, lastCompactAtom, () => done);
  }).catch((error) => $.ui.toast(words().compactFailed(reasonOf(error)))).finally(() => update($, compactingAtom, () => false)));
}
async function goHome($) {
  try {
    await $.state.set({ plugin: "hud-pro", key: "home" }, { at: await $.clock.now() });
  } catch {
    $.ui.log("hud-pro: could not go back to the hub", { to: "debug" });
  }
}
async function cardData($) {
  return {
    view: await breakdownView($),
    turns: await read($, contextTurnsAtom$2),
    lastCompact: await read($, lastCompactAtom),
    isCompacting: await read($, compactingAtom),
    compact: () => compactNow($)
  };
}
async function sectionsOf($, usage) {
  const nowMs = await $.clock.now();
  const published = [
    (await $.state.get({ plugin: "session-budget", key: "section" })).value,
    (await $.state.get({ plugin: "cache-tax", key: "section" })).value,
    (await $.state.get({ plugin: "effort-router", key: "section" })).value
  ];
  const pace = paceOf({ usage, history: await read($, historyAtom$1), nowMs });
  const own = usage === null ? [] : [paceSection({ pace, shares: await read($, sharesAtom$1), nowMs })];
  return [...own, ...published.filter(isSection)];
}
async function pressSection($, section, action) {
  try {
    await $.state.set({ plugin: "hud-pro", key: "press" }, { section, action, at: await $.clock.now() });
    $.ui.invalidate("ui.render");
  } catch {
    $.ui.log("hud-pro: a section press failed", { to: "debug" });
  }
}
function onPane(on) {
  on("ui.render", { component: "Pane", requestId: PANE$1 }, async ($, e) => {
    const turn = await read($, turnAtom$1);
    const ui = $.ui.resolve(e);
    const isHubOn = (await $.state.get({ plugin: "modz", key: "isOn" })).value === true;
    const usage = await read($, usageAtom$2);
    const tree = paneTree(ui, {
      usage,
      history: await read($, historyAtom$1),
      turn: turn.requests > 0 ? turn : await read($, lastTurnAtom$1),
      columns: e.props.bodyColumns,
      nowMs: await $.clock.now(),
      card: await cardData($),
      isLive: await read($, liveAtom$1),
      forecasts: await forecastsOf$1($, usage),
      past: pastViewOf(await read($, pastAtom), { range: await read($, rangeAtom), choose: (range) => void update($, rangeAtom, () => range) }),
      sections: { sections: await sectionsOf($, usage), press: (section, action) => void pressSection($, section, action) },
      focus: focus.section,
      ...e.surface !== "terminal" && "Svg" in ui ? { svg: ui.Svg } : {}
    });
    return pinned(e, isHubOn ? withHome(ui, { tree, goHome: () => void goHome($) }) : tree);
  });
}
async function isOutranked($) {
  const nowMs = await $.clock.now();
  const values = [
    (await $.state.get({ plugin: "reflect", key: "notice" })).value,
    (await $.state.get({ plugin: "you-should-know", key: "notice" })).value,
    (await $.state.get({ plugin: "cache-tax", key: "notice" })).value,
    (await $.state.get({ plugin: "session-budget", key: "notice" })).value,
    (await $.state.get({ plugin: "effort-router", key: "notice" })).value
  ];
  return values.some((value) => isLive(value, nowMs));
}
async function noticeRow($, ui) {
  const queue = await read($, noticesAtom$2);
  if (queue.length === 0 || await isOutranked($))
    return null;
  const head = headToDraw(queue, await $.clock.now());
  const { Box, Text } = ui;
  return head === null ? null : h(Box, {
    key: "hud-pro-notice"
  }, h(Text, {
    dimColor: true,
    wrap: "wrap"
  }, head.text));
}
async function hudRow($, site) {
  const usage = await read($, usageAtom$2);
  if (usage === null || await read($, hiddenAtom$1))
    return null;
  const isDesktop = site.surface !== "terminal" && "Svg" in site.ui;
  return bandRow(site.ui, {
    usage,
    columns: site.columns,
    nowMs: await $.clock.now(),
    forecasts: await forecastsOf$1($, usage),
    isDesktop,
    canCompact: !site.isWorking && !await read($, compactingAtom),
    compact: () => compactNow($),
    isAlertsOnly: isAlertsOnly(band.chosen ?? band.setting, isDesktop)
  });
}
function onBand(on) {
  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    const theirs = await next(e);
    try {
      if (e.props.hasSurvey)
        return theirs;
      const ui = $.ui.resolve(e);
      const notice = await noticeRow($, ui);
      const row = await hudRow($, { ui, surface: e.surface, columns: e.props.bodyColumns, isWorking: e.props.isWorking });
      if (notice === null && row === null)
        return theirs;
      const { Box } = ui;
      return h(Box, {
        flexDirection: "column"
      }, notice, theirs, row === null ? null : pinned(e, row));
    } catch {
      $.ui.log("hud-pro: band render failed", { to: "debug" });
      return theirs;
    }
  });
}
function onDraw(on) {
  onPane(on);
  onBand(on);
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

const NOTICE_PERCENT = 90;
function toUsage(measured) {
  const gauges = measured.rateLimits.map((limit) => ({
    id: limit.kind,
    label: labelOf(limit.kind),
    percent: limit.percentUsed,
    resetsAt: limit.resetsAt ?? null
  }));
  const { percent, tokens, window } = measured.context;
  if (percent !== undefined)
    gauges.push({ id: CONTEXT, label: labelOf(CONTEXT), percent, resetsAt: null });
  const context = tokens === undefined ? null : { tokens, window };
  return { gauges, costUsd: measured.cost?.usd ?? null, context };
}
function addUsage(turn, usage) {
  const inputSide = usage.input_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens;
  return {
    requests: turn.requests + 1,
    input: turn.input + inputSide,
    output: turn.output + usage.output_tokens,
    cacheRead: turn.cacheRead + usage.cache_read_input_tokens
  };
}
function newNotices(fresh, spec) {
  return fresh.gauges.filter((gauge) => gauge.id !== CONTEXT && gauge.percent >= NOTICE_PERCENT).flatMap((gauge) => {
    const id = `${gauge.id}:${gauge.resetsAt}`;
    if (spec.noticed.has(id))
      return [];
    spec.noticed.add(id);
    const reset = untilReset(gauge.resetsAt, spec.nowMs);
    const label = longLabelOf(gauge.id);
    const head = isFull(gauge.percent) ? words().limitFull(label) : words().limitAt(label, valueText(gauge.percent));
    return [reset === "" ? head : `${head} · ${resetText(reset)}`];
  });
}

const EMPTY_TURN = { requests: 0, input: 0, output: 0, cacheRead: 0 };
const turnAtom = atom({ plugin: "hud-pro", key: "turn" }, EMPTY_TURN);
const lastTurnAtom = atom({ plugin: "hud-pro", key: "lastTurn" }, null);
const contextTurnsAtom$1 = atom({ plugin: "hud-pro", key: "contextTurns" }, []);
const liveAtom = atom({ plugin: "hud-pro", key: "isLive" }, false);
const usageAtom$1 = atom({ plugin: "hud-pro", key: "usage" }, null);
const sharesAtom = atom({ plugin: "hud-pro", key: "shares" }, []);
const noticesAtom$1 = atom({ plugin: "hud-pro", key: "notices" }, []);
const running = { window: null };
async function recordShare($, measured) {
  const after = paceWindow(toUsage(measured));
  if (after === null)
    return;
  const share = { window: after.id, share: shareOf(running.window, after), percent: after.percent };
  await update($, sharesAtom, (shares) => addShare(shares, share));
  const text = shareNotice(share);
  if (text === null)
    return;
  await update($, noticesAtom$1, (queue) => enqueue(queue, text));
  $.ui.invalidate("ui.render");
}
function onTurns(on) {
  on("turn.start", async ($, e, next) => {
    const finished = await read($, turnAtom);
    if (finished.requests > 0)
      await update($, lastTurnAtom, () => finished);
    await update($, turnAtom, () => EMPTY_TURN);
    running.window = paceWindow(await read($, usageAtom$1));
    await update($, liveAtom, () => true);
    return next(e);
  });
  on("turn.complete", async ($, e, next) => {
    const done = await next(e);
    if (e.agentId !== undefined)
      return done;
    await update($, liveAtom, () => false);
    const measured = await $.session.usage();
    await recordShare($, measured);
    const tokens = measured.context.tokens;
    if (tokens === undefined)
      return done;
    await update($, contextTurnsAtom$1, (turns) => addTurn(turns, tokens));
    return done;
  });
  on("turn.step", async function* ($, e, next) {
    const result = yield* next(e);
    const usage = result.usage;
    if (usage !== null && e.agentId === undefined)
      await update($, turnAtom, (turn) => addUsage(turn, usage));
    return result;
  });
}

const HISTORY_KEY = "hud-pro.history";
const REFRESH_MS = 60000;
const MINUTE_MS = 60000;
const usageAtom = atom({ plugin: "hud-pro", key: "usage" }, null);
const hiddenAtom = atom({ plugin: "hud-pro", key: "isHidden" }, false);
const historyAtom = atom({ plugin: "hud-pro", key: "history" }, []);
const contextTurnsAtom = atom({ plugin: "hud-pro", key: "contextTurns" }, []);
const hubAtom = atom({ plugin: "hud-pro", key: "hub" }, EMPTY_HUB);
const noticesAtom = atom({ plugin: "hud-pro", key: "notices" }, []);
const paceAtom = atom({ plugin: "hud-pro", key: "pace" }, null);
const noticed = new Set;
const filled = new Set;
let shownGauges = null;
async function record($, fresh) {
  const nowMs = await $.clock.now();
  const before = await read($, historyAtom);
  const after = addSample(before, fresh, nowMs);
  if (after === before)
    return;
  await update($, historyAtom, () => after);
  if (!hasLimitsMoved(before.at(-1), after.at(-1)))
    return;
  const stored = await $.store.get(HISTORY_KEY);
  await $.store.set(HISTORY_KEY, mergeHistory(isHistory(stored) ? stored : [], after));
}
async function writeHub($, usage, isFirst = false) {
  const fresh = hubOf(usage);
  const current = await read($, hubAtom);
  if (!isFirst && current.detail === fresh.detail && current.tone === fresh.tone)
    return;
  const at = await $.clock.now();
  await update($, hubAtom, () => ({ pane: HUB_PANE, ...fresh, at }));
}
async function noticeHigh($, fresh) {
  for (const text of newNotices(fresh, { nowMs: await $.clock.now(), noticed }))
    $.ui.toast(text);
}
async function noticeFill($, fresh) {
  const nowMs = await $.clock.now();
  const pace = paceOf({ usage: fresh, history: await read($, historyAtom), nowMs });
  const told = pace === null ? null : { window: pace.gauge.id, fullAt: pace.fullAt === null ? null : Math.round(pace.fullAt / MINUTE_MS) * MINUTE_MS };
  const before = await read($, paceAtom);
  if (before?.window !== told?.window || before?.fullAt !== told?.fullAt)
    await update($, paceAtom, () => told);
  const fill = fillNotice(pace, nowMs);
  if (fill === null || filled.has(fill.key))
    return;
  filled.add(fill.key);
  await update($, noticesAtom, (queue) => enqueue(queue, fill.text));
  $.ui.invalidate("ui.render");
}
async function forecastsOf($, usage) {
  return forecastsFrom({ history: await read($, historyAtom), turns: await read($, contextTurnsAtom), usage });
}
async function redrawIfMoved($) {
  const nowMs = await $.clock.now();
  const queue = await read($, noticesAtom);
  const left = expired(queue, nowMs);
  if (left !== queue)
    await update($, noticesAtom, () => [...left]);
  const usage = await read($, usageAtom);
  const gauges = usage === null ? null : gaugeViews(usage, nowMs, await forecastsOf($, usage));
  if (isSame(gauges, shownGauges) && left === queue)
    return;
  shownGauges = gauges;
  $.ui.invalidate("ui.render");
}
async function setup($) {
  await $.state.set({ plugin: "hud-pro", key: "host" }, true);
  resetSlot();
  filled.clear();
  const current = toUsage(await $.session.usage());
  await update($, usageAtom, () => current);
  shownGauges = gaugeViews(current, await $.clock.now(), await forecastsOf($, current));
  await writeHub($, current, true);
  await update($, hiddenAtom, () => false);
  if (await $.store.get(HIDDEN_KEY) === true)
    await update($, hiddenAtom, () => true);
  const saved = await $.store.get(HISTORY_KEY);
  if (isHistory(saved))
    await update($, historyAtom, () => accountHistory(saved));
  const chosen = await $.store.get(BAND_KEY);
  band.chosen = isBandMode(chosen) ? chosen : null;
  $.clock.every(REFRESH_MS, () => void redrawIfMoved($));
  await $.command.register({ name: "hud", description: words().commandDescription });
}
function onUsage(on) {
  on("session.start", async ($, e, next) => {
    setLang(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    await setup($).catch(() => $.ui.log("hud-pro: start failed", { to: "debug" }));
    return next(e);
  });
  on("session.compact", async ($, e, next) => {
    const result = await next(e);
    if (e.agentId === undefined && e.trigger !== "precompute")
      forgetBreakdown();
    return result;
  });
  on("session.measure", async ($, e, next) => {
    try {
      const fresh = toUsage(e);
      if (!isSame(await read($, usageAtom), fresh))
        await update($, usageAtom, () => fresh);
      await writeHub($, fresh);
      await noticeHigh($, fresh);
      await record($, fresh);
      await noticeFill($, fresh);
    } catch {
      $.ui.log("hud-pro: measure failed", { to: "debug" });
    }
    return next(e);
  });
}
const register = (on, options) => {
  onUsage(on);
  onTurns(on);
  onPast(on);
  onCommand(on);
  band.setting = isBandMode(options?.band) ? options.band : "auto";
  onDraw(on);
};

export { register };
