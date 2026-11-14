// Built by `bin/modz build` from the files beside it. Never edited by hand.
import { atom, update, read } from 'claude-code';

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

const WEB_DEPENDENCY = /"(next|react|vue|svelte|astro|nuxt|vite|@remix-run\/[a-z-]+)"\s*:/;
const GAME_WORD = /\b(game|oyun|oyunu|unity|godot|gameplay)\b/gi;
const GAME_MENTIONS = 3;
const GAME_DENSITY = 1 / 1000;
const README = "README.md";
const WRITING = /\.(md|mdx|txt|docx?|pdf|pptx?|xlsx?|csv|canvas)$/i;
const CODE = /\.(ts|tsx|js|jsx|py|go|rs|swift|dart|kt|java|cs|c|cpp|rb|sh|html)$/i;
const RULES = [
  ["claude", /^\.claude-plugin$/],
  ["game", /^(project\.godot|.+\.uproject|ProjectSettings|.+\.unity)$/],
  ["mobile", /^(pubspec\.yaml|.+\.xcodeproj|.+\.xcworkspace|android|ios)$/],
  ["web", /^((next|vite|astro|nuxt|svelte|tailwind)\.config\.[a-z]+|wrangler\.(toml|jsonc?)|supabase)$/],
  ["tool", /^(package\.json|Cargo\.toml|go\.mod|pyproject\.toml|requirements\.txt|setup\.py|Package\.swift|.+\.slnx?|Makefile|bin|src)$/]
];
const isAboutGame = (readme) => {
  const mentions = (readme.match(GAME_WORD) ?? []).length;
  return mentions >= GAME_MENTIONS && mentions / readme.length >= GAME_DENSITY;
};
function projectKindOf(names, { packageText = "", readmeText = "" } = {}) {
  const isLaid = (rule) => names.some((name) => rule.test(name));
  const found = RULES.find(([, rule]) => isLaid(rule))?.[0];
  if (found !== "tool" && found !== undefined)
    return found;
  if (names.includes("game") && names.includes("assets"))
    return "game";
  if (isAboutGame(readmeText))
    return "game";
  if (WEB_DEPENDENCY.test(packageText))
    return "web";
  if (found === "tool")
    return "tool";
  const shown = names.filter((name) => !name.startsWith("."));
  const writing = shown.filter((name) => WRITING.test(name)).length;
  if (writing > 0 && writing * 2 >= shown.length)
    return "writing";
  if (names.includes("index.html"))
    return "web";
  if (names.some((name) => CODE.test(name)))
    return "tool";
  return writing > 0 ? "writing" : "other";
}
const baseOf = (path) => path.split(/[\\/]+/).filter(Boolean).pop() ?? path;
async function projectKinds(paths, shown, io) {
  const kinds = {};
  for (const path of paths) {
    const name = baseOf(path);
    if (!shown.has(name) || kinds[name] !== undefined)
      continue;
    const names = await io.list(path).then((entries) => entries.map((entry) => entry.name)).catch(() => []);
    const textOf = (file) => names.includes(file) ? io.read(`${path}/${file}`).catch(() => "") : Promise.resolve("");
    kinds[name] = projectKindOf(names, { packageText: await textOf("package.json"), readmeText: await textOf(README) });
  }
  return kinds;
}
const LANGUAGES = {
  ts: "TypeScript",
  tsx: "React",
  js: "JavaScript",
  jsx: "React",
  py: "Python",
  go: "Go",
  rs: "Rust",
  swift: "Swift",
  dart: "Dart",
  kt: "Kotlin",
  java: "Java",
  cs: "C#",
  c: "C",
  cpp: "C++",
  rb: "Ruby",
  vue: "Vue",
  svelte: "Svelte",
  html: "HTML",
  gd: "GDScript",
  sql: "SQL",
  php: "PHP"
};
function fileKindOf(name) {
  const lower = name.toLowerCase();
  const extension = lower.includes(".") ? lower.split(".").pop() : "";
  const look = (kind) => ({ kind, language: null });
  if (/(^|[._-])(test|spec)([._-]|$)/.test(lower) || lower.startsWith("test_"))
    return look("test");
  if (/^(claude|agents|skill|memory|gemini)\.md$/.test(lower))
    return look("agent");
  if (/^(md|mdx|txt|rst|pdf|docx?)$/.test(extension))
    return look("doc");
  if (/^(css|scss|sass|less)$/.test(extension))
    return look("style");
  if (/^(csv|tsv|xlsx?|parquet|ipynb)$/.test(extension))
    return look("data");
  if (/^(sh|zsh|bash|ps1|bat)$/.test(extension))
    return look("script");
  if (/^(json|jsonc|ya?ml|toml|ini|lock|env|plist|xml)$/.test(extension) || lower.startsWith(".") || /^(dockerfile|makefile)$/.test(lower))
    return look("config");
  return { kind: "code", language: LANGUAGES[extension] ?? null };
}

const NIGHT_END_HOUR = 5;
const DAY_MS$1 = 86400000;
const PAD$1 = 2;
const NOVEL_TOKENS = 130000;
const SCRATCH = /^(\/private)?\/tmp\/|\/scratchpad\//;
const AGENT_TOOLS = new Set(["Agent", "Task"]);
const LIMITS = { commander: 0.25, owl: 0.3, marathoner: 25, director: 0.1, sprinter: 3 };
const pad$1 = (value) => String(value).padStart(PAD$1, "0");
function dayKey(ms) {
  const at = new Date(ms);
  return `${at.getFullYear()}-${pad$1(at.getMonth() + 1)}-${pad$1(at.getDate())}`;
}
function hourMs(key) {
  return Date.parse(`${key}:00:00Z`);
}
function topOf(table) {
  let top = null;
  for (const [name, count] of Object.entries(table))
    if (top === null || count > top.count)
      top = { name, count };
  return top;
}
const baseName = (path) => path.split(/[\\/]+/).filter(Boolean).pop() ?? path;
const foldName = (name) => name.normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
function projectNamer(places) {
  const best = new Map;
  for (const [path, count] of Object.entries(places)) {
    const name = baseName(path);
    const held = best.get(foldName(name));
    if (held === undefined || count > held.count)
      best.set(foldName(name), { name, count });
  }
  return (path) => best.get(foldName(baseName(path)))?.name ?? baseName(path);
}
function namedFrom(table, isKept) {
  const top = topOf(Object.fromEntries(Object.entries(table).filter(([path]) => isKept(path))));
  return top === null ? null : { ...top, name: baseName(top.name) };
}
function longestStreak(days) {
  const sorted = days.map((day) => Date.parse(`${day}T12:00:00Z`)).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let last = Number.NaN;
  for (const ms of sorted) {
    run = Math.round((ms - last) / DAY_MS$1) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    last = ms;
  }
  return best;
}
function personaOf(facts) {
  if (facts.nightShare >= LIMITS.owl)
    return "owl";
  if (facts.agentCalls / Math.max(1, facts.prompts) >= LIMITS.commander)
    return "commander";
  if (facts.stops / Math.max(1, facts.prompts) >= LIMITS.director)
    return "director";
  if (facts.average >= LIMITS.marathoner)
    return "marathoner";
  if (facts.average <= LIMITS.sprinter)
    return "sprinter";
  return "builder";
}
function clocked(promptsByHour) {
  const days = {};
  const hours = Array.from({ length: 24 }, () => 0);
  let night = 0;
  for (const [key, count] of Object.entries(promptsByHour)) {
    const ms = hourMs(key);
    if (Number.isNaN(ms))
      continue;
    const day = dayKey(ms);
    const hour = new Date(ms).getHours();
    days[day] = (days[day] ?? 0) + count;
    hours[hour] = (hours[hour] ?? 0) + count;
    if (hour < NIGHT_END_HOUR)
      night += count;
  }
  return { days, hours, night };
}
const AGENT_ROWS = 6;
const TOP_ROWS = 5;
const MONDAY_FIRST = 6;
const topRows = (table, name = (key) => key) => {
  const merged = {};
  for (const [key, count] of Object.entries(table))
    merged[name(key)] = (merged[name(key)] ?? 0) + count;
  return Object.entries(merged).map(([key, count]) => ({ name: key, count })).sort((a, b) => b.count - a.count).slice(0, TOP_ROWS);
};
function weekdaysOf(days) {
  const week = Array.from({ length: 7 }, () => 0);
  for (const [day, count] of Object.entries(days)) {
    const place = (new Date(`${day}T12:00:00Z`).getUTCDay() + MONDAY_FIRST) % 7;
    week[place] = (week[place] ?? 0) + count;
  }
  return week;
}
function modelLabel(id) {
  const parts = /^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?:-\d{8})?/.exec(id);
  if (parts === null)
    return id;
  const family = parts[1] ?? "";
  return `${family.charAt(0).toUpperCase()}${family.slice(1)} ${parts[2]}${parts[3] === undefined ? "" : `.${parts[3]}`}`;
}
function agentRows(raw) {
  return [...raw.agents].sort((a, b) => b.tools - a.tools || b.runs - a.runs).slice(0, AGENT_ROWS);
}
function topIn(rows, month) {
  let top = null;
  for (const row of rows)
    if (row.month === month && (top === null || row.count > top.count))
      top = row;
  return top?.name ?? null;
}
function monthsOf(raw) {
  const months = [...new Set([...raw.monthProjects, ...raw.monthAgents].map((row) => row.month))].sort();
  const nameOf = projectNamer(raw.places);
  return months.map((month) => {
    const project = topIn(raw.monthProjects, month);
    const inMonth = (rows) => sumOf(rows.filter((row) => row.month === month).map((row) => row.count));
    return { month, prompts: inMonth(raw.monthProjects), runs: inMonth(raw.monthAgents), project: project === null ? null : nameOf(project), agent: topIn(raw.monthAgents, month) };
  });
}
const sumOf = (values) => values.reduce((sum, value) => sum + value, 0);
function wrappedOf(raw, spec) {
  const { days, hours, night } = clocked(raw.promptsByHour);
  const prompts = sumOf(Object.values(days));
  if (prompts === 0)
    return null;
  const dayNames = Object.keys(days).sort();
  const sessions = raw.chats.length;
  const agentCalls = sumOf(Object.entries(raw.tools).filter(([name]) => AGENT_TOOLS.has(name)).map(([, count]) => count));
  const nightShare = night / prompts;
  const peak = Math.max(...hours);
  return {
    ...spec,
    firstDay: dayNames[0],
    lastDay: dayNames[dayNames.length - 1],
    prompts,
    sessions,
    replies: sumOf(Object.values(raw.repliesByHour)),
    outputTokens: raw.outputTokens,
    activeDays: dayNames.length,
    streak: longestStreak(dayNames),
    busiestDay: topOf(days),
    topHour: hours.indexOf(peak),
    nightShare,
    stops: raw.stops,
    rightCount: raw.rightCount,
    toolCalls: sumOf(Object.values(raw.tools)),
    agentCalls,
    topTool: topOf(raw.tools),
    topFile: namedFrom(raw.files, (path) => !SCRATCH.test(path)),
    topProject: topRows(raw.places, projectNamer(raw.places))[0] ?? null,
    longestChat: Math.max(0, ...raw.chats),
    linesAdded: raw.linesAdded,
    costUsd: raw.costUsd,
    days,
    hours,
    weekdays: weekdaysOf(days),
    projects: topRows(raw.places, projectNamer(raw.places)),
    tools: topRows(raw.tools),
    files: topRows(Object.fromEntries(Object.entries(raw.files).filter(([path]) => !SCRATCH.test(path))), baseName),
    models: topRows(raw.models, modelLabel),
    agentRuns: sumOf(raw.agents.map((agent) => agent.runs)),
    agentTools: sumOf(raw.agents.map((agent) => agent.tools)),
    agentTokens: sumOf(raw.agents.map((agent) => agent.tokens)),
    agents: agentRows(raw),
    hardest: raw.hardest,
    months: monthsOf(raw),
    projectKinds: {},
    persona: personaOf({ prompts, agentCalls, nightShare, average: prompts / Math.max(1, sessions), stops: raw.stops })
  };
}
function isWrapped(value) {
  const w = value;
  return typeof w === "object" && w !== null && typeof w.year === "number" && typeof w.prompts === "number" && typeof w.persona === "string" && typeof w.days === "object" && w.days !== null && Array.isArray(w.agents) && Array.isArray(w.months) && Array.isArray(w.projects) && Array.isArray(w.hours) && Array.isArray(w.models) && typeof w.projectKinds === "object" && w.projectKinds !== null;
}

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const pick = (table) => table[current];

const THOUSAND = 1000;
const MILLION = 1e6;
function compact(value) {
  if (value >= MILLION)
    return `${(value / MILLION).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 10 * THOUSAND)
    return `${Math.round(value / THOUSAND)}k`;
  if (value >= THOUSAND)
    return `${(value / THOUSAND).toFixed(1).replace(/\.0$/, "")}k`;
  return String(Math.round(value));
}
const MONTHS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  tr: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
};
function shortDay(day) {
  const [, month, date] = day.split("-");
  const name = pick(MONTHS)[Number(month) - 1] ?? "";
  return pick({ en: `${name} ${Number(date)}`, tr: `${Number(date)} ${name}` });
}
const PERSONAS = {
  commander: {
    en: ["The Commander", "I rarely go alone. I send agents."],
    tr: ["Komutan", "Tek başıma gitmiyorum. Ajan gönderiyorum."]
  },
  owl: {
    en: ["The Night Owl", "My best work starts after midnight."],
    tr: ["Gece Kuşu", "En iyi işlerim gece yarısından sonra başlıyor."]
  },
  marathoner: {
    en: ["The Marathoner", "I stay in one chat until it is done."],
    tr: ["Maratoncu", "Bir sohbete girince iş bitmeden çıkmıyorum."]
  },
  director: {
    en: ["The Director", "Cut. Again. My hand stays on the stop button."],
    tr: ["Yönetmen", "Kestik, baştan. Elim hep durdur düğmesinde."]
  },
  sprinter: {
    en: ["The Sprinter", "Ask, get it, close the chat. Next."],
    tr: ["Sprinter", "Sor, al, sohbeti kapat. Sıradaki."]
  },
  builder: {
    en: ["The Builder", "Steady chats, steady work. Things get shipped."],
    tr: ["Yapıcı", "Düzenli sohbet, düzenli iş. Bir şeyler çıkıyor."]
  }
};
const personaName = (persona) => pick(PERSONAS[persona])[0];
const personaLine = (persona) => pick(PERSONAS[persona])[1];
const hourText = (hour) => `${String(hour).padStart(2, "0")}:00`;
const longMonths = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
};
const monthName = (month) => pick(longMonths)[Number(month.split("-")[1]) - 1] ?? month;
const shortMonth = (month) => pick(MONTHS)[Number(month.split("-")[1]) - 1] ?? month;
const words = () => pick({
  en: {
    agentsTitle: "Agents",
    agentsLine: (runs, tools) => `${compact(runs)} runs, ${compact(tools)} tool calls`,
    agentRun: (runs) => `${compact(runs)} runs`,
    agentMeta: (tools, tokens) => `${compact(tools)} tools · ${compact(tokens)} tokens`,
    monthsTitle: "Month by month",
    monthMeta: (prompts, runs) => `${compact(prompts)} prompts · ${compact(runs)} agents`,
    projectKind: (kind) => ({ claude: "Claude tool", game: "Game", mobile: "Mobile app", web: "Web app", tool: "Code tool", writing: "Research", other: "Project" })[kind],
    fileKind: ({ kind, language }) => language !== null ? `${language} file` : { test: "Test file", agent: "Agent instructions", doc: "Document", config: "Settings file", style: "Stylesheet", data: "Data file", script: "Shell script", code: "Code file" }[kind],
    filmMake: "Make the video",
    filmMaking: (made, total) => `Making the video: ${made}/${total} frames…`,
    filmReady: (path) => `Video saved: ${path}`,
    filmFailed: (reason) => `No video: ${reason}`,
    filmNoFfmpeg: "ffmpeg is needed (brew install ffmpeg); macOS draws the frames.",
    paneTitle: "Wrapped",
    commandHelp: "Your year with Claude Code: a card and a video. /wrapped 2025 picks a year",
    hubHint: "Your year with Claude Code on one card",
    hubDetail: (w) => `${w.year}: ${personaName(w.persona)}, ${compact(w.prompts)} prompts`,
    opened: "Wrapped pane opened.",
    badYear: "Give a year like 2026, or nothing for this one.",
    reading: (year) => `Reading your ${year} transcripts…`,
    readingHint: "A few minutes at most on a big archive. You can keep working.",
    idle: "Nothing read yet.",
    empty: (year) => `No prompts from ${year} in the transcripts on this machine.`,
    emptyHint: "Claude Code removes old transcripts after 30 days unless cleanupPeriodDays in settings keeps them.",
    failed: "The transcripts could not be read",
    noRoot: "Their folder is not known yet: send a prompt, then try again.",
    title: (year) => `My ${year} with Claude Code`,
    range: (w) => `${shortDay(w.firstDay)} to ${shortDay(w.lastDay)}, from the transcripts on my machine`,
    prompts: "prompts",
    sessions: "chats",
    activeDays: "active days",
    streak: "day streak",
    linesAdded: "lines added",
    apiValue: "at API prices",
    rightRow: "Claude said I was right",
    rightValue: (count) => `${compact(count)} times`,
    stopsRow: "I stopped Claude",
    stopsValue: (count) => `${compact(count)} times`,
    hourRow: "Busiest hour",
    hourValue: hourText,
    nightRow: "Prompts after midnight",
    percent: (value) => `${value}%`,
    toolRow: "Favorite tool",
    toolValue: (name, count) => `${name}, ${compact(count)} times`,
    novelsRow: "Claude wrote about",
    novelsValue: (count) => `${compact(count)} novels`,
    fileRow: "Most-edited file",
    fileValue: (name, count) => `${name}, ${compact(count)} edits`,
    projectRow: "Top project",
    projectValue: (name, count) => `${name}, ${compact(count)} prompts`,
    chatRow: "Longest chat",
    chatValue: (count) => `${compact(count)} prompts`,
    made: "made with MODZ",
    showNames: "Show real names",
    hideNames: "Back to categories",
    readAgain: "Read again",
    readAt: (when) => `Read on ${when}.`
  },
  tr: {
    agentsTitle: "Ajanlar",
    agentsLine: (runs, tools) => `${compact(runs)} çalıştırma, ${compact(tools)} araç çağrısı`,
    agentRun: (runs) => `${compact(runs)} görev`,
    agentMeta: (tools, tokens) => `${compact(tools)} araç · ${compact(tokens)} token`,
    monthsTitle: "Ay ay",
    monthMeta: (prompts, runs) => `${compact(prompts)} mesaj · ${compact(runs)} ajan`,
    projectKind: (kind) => ({ claude: "Claude aracı", game: "Oyun", mobile: "Mobil uygulama", web: "Web uygulaması", tool: "Kod aracı", writing: "Araştırma", other: "Proje" })[kind],
    fileKind: ({ kind, language }) => language !== null ? `${language} dosyası` : { test: "Test dosyası", agent: "Ajan talimatı", doc: "Doküman", config: "Ayar dosyası", style: "Stil dosyası", data: "Veri dosyası", script: "Kabuk betiği", code: "Kod dosyası" }[kind],
    filmMake: "Video yap",
    filmMaking: (made, total) => `Video yapılıyor: ${made}/${total} kare…`,
    filmReady: (path) => `Video kaydedildi: ${path}`,
    filmFailed: (reason) => `Video yok: ${reason}`,
    filmNoFfmpeg: "ffmpeg gerekiyor (brew install ffmpeg); kareleri macOS çiziyor.",
    paneTitle: "Wrapped",
    commandHelp: "Claude Code ile yılın: kart ve video. /wrapped 2025 başka bir yılı seçer",
    hubHint: "Claude Code ile yılın tek kartta",
    hubDetail: (w) => `${w.year}: ${personaName(w.persona)}, ${compact(w.prompts)} mesaj`,
    opened: "Wrapped paneli açıldı.",
    badYear: "Yılı 2026 gibi yaz; bu yıl için boş bırak.",
    reading: (year) => `${year} kayıtların okunuyor…`,
    readingHint: "Büyük arşivde en fazla birkaç dakika sürer. Çalışmaya devam edebilirsin.",
    idle: "Henüz okunmadı.",
    empty: (year) => `Bu makinedeki kayıtlarda ${year} yılına ait mesaj yok.`,
    emptyHint: "Claude Code eski kayıtları 30 gün sonra siler; ayarlardaki cleanupPeriodDays bunu uzatır.",
    failed: "Kayıtlar okunamadı",
    noRoot: "Klasörleri henüz bilinmiyor: bir mesaj gönderip yeniden dene.",
    title: (year) => `Claude Code ile ${year} yılım`,
    range: (w) => `${shortDay(w.firstDay)} – ${shortDay(w.lastDay)}, makinemdeki kayıtlardan`,
    prompts: "mesaj",
    sessions: "sohbet",
    activeDays: "aktif gün",
    streak: "gün üst üste",
    linesAdded: "satır eklendi",
    apiValue: "API fiyatıyla",
    rightRow: "Claude bana hak verdi",
    rightValue: (count) => `${compact(count)} kez`,
    stopsRow: "Claude'u durdurdum",
    stopsValue: (count) => `${compact(count)} kez`,
    hourRow: "En yoğun saat",
    hourValue: hourText,
    nightRow: "Gece yarısından sonra",
    percent: (value) => `%${value}`,
    toolRow: "En sevilen araç",
    toolValue: (name, count) => `${name}, ${compact(count)} kez`,
    novelsRow: "Claude şu kadar yazdı",
    novelsValue: (count) => `${compact(count)} roman`,
    fileRow: "En çok düzenlenen dosya",
    fileValue: (name, count) => `${name}, ${compact(count)} düzenleme`,
    projectRow: "Başlıca proje",
    projectValue: (name, count) => `${name}, ${compact(count)} mesaj`,
    chatRow: "En uzun sohbet",
    chatValue: (count) => `${compact(count)} mesaj`,
    made: "MODZ ile yapıldı",
    showNames: "Gerçek adları göster",
    hideNames: "Kategorilere dön",
    readAgain: "Yeniden oku",
    readAt: (when) => `${when} tarihinde okundu.`
  }
});

const PERCENT = 100;
const CARD_AGENTS = 4;
function namedRows(spec) {
  const { wrapped: w, isNamed } = spec;
  const t = words();
  const file = w.topFile;
  const project = w.topProject;
  const rows = [];
  if (file !== null)
    rows.push({ label: t.fileRow, value: t.fileValue(fileLabel(file.name, isNamed), file.count) });
  if (project !== null)
    rows.push({ label: t.projectRow, value: t.projectValue(projectLabels(w, isNamed).get(project.name) ?? project.name, project.count) });
  return rows;
}
function rowsOf(spec) {
  const { wrapped: w } = spec;
  const t = words();
  const rows = [
    { label: t.rightRow, value: t.rightValue(w.rightCount) },
    { label: t.stopsRow, value: t.stopsValue(w.stops) }
  ];
  if (w.topHour !== null)
    rows.push({ label: t.hourRow, value: t.hourValue(w.topHour) });
  rows.push({ label: t.nightRow, value: t.percent(Math.round(w.nightShare * PERCENT)) });
  if (w.topTool !== null)
    rows.push({ label: t.toolRow, value: t.toolValue(w.topTool.name, w.topTool.count) });
  if (w.outputTokens > 0)
    rows.push({ label: t.novelsRow, value: `~${t.novelsValue(Math.max(1, Math.round(w.outputTokens / NOVEL_TOKENS)))}` });
  rows.push({ label: t.chatRow, value: t.chatValue(w.longestChat) }, ...namedRows(spec));
  return rows;
}
function statsOf(w) {
  const t = words();
  const stats = [
    { value: compact(w.prompts), label: t.prompts },
    { value: compact(w.sessions), label: t.sessions },
    { value: String(w.activeDays), label: t.activeDays },
    { value: String(w.streak), label: t.streak }
  ];
  if (w.linesAdded > 0)
    stats.push({ value: compact(w.linesAdded), label: t.linesAdded });
  if (w.costUsd > 0)
    stats.push({ value: `~$${compact(w.costUsd)}`, label: t.apiValue });
  return stats;
}
const fileLabel = (name, isNamed) => isNamed ? name : words().fileKind(fileKindOf(name));
function projectLabels(w, isNamed) {
  const labels = new Map;
  const seen = new Map;
  for (const name of [w.topProject?.name ?? null, ...w.projects.map((row) => row.name), ...w.months.map((month) => month.project)]) {
    if (name === null || labels.has(name))
      continue;
    const kind = words().projectKind(w.projectKinds[name] ?? "other");
    const nth = (seen.get(kind) ?? 0) + 1;
    seen.set(kind, nth);
    labels.set(name, isNamed ? name : nth === 1 ? kind : `${kind} ${nth}`);
  }
  return labels;
}
function standalone(pic) {
  const vars = paintVars(false);
  const noStyle = pic.source.replace(/<style>[\s\S]*?<\/style>/, "").replace("<svg ", `<svg font-family="${FONT.replaceAll("'", "")}" `);
  return noStyle.replace(/class="f-([a-z-]+)( mono)?"/g, (whole, name) => vars[name] === undefined ? whole : `fill="${vars[name]}"`);
}
function cardText(spec) {
  const { wrapped: w } = spec;
  const t = words();
  const stats = statsOf(w).map((stat) => `${stat.value} ${stat.label}`).join(" · ");
  const rows = rowsOf(spec).map((row) => `${row.label}: ${row.value}`);
  const agents = w.agents.slice(0, CARD_AGENTS).map((row) => `${row.type}: ${t.agentRun(row.runs)}, ${t.agentMeta(row.tools, row.tokens)}`);
  const labels = projectLabels(w, spec.isNamed);
  const months = w.months.map((month) => `${monthName(month.month)}: ${month.project === null ? "—" : labels.get(month.project) ?? "—"}, ${t.monthMeta(month.prompts, month.runs)}`);
  const crew = w.agentRuns === 0 ? [] : [`${t.agentsTitle}: ${t.agentsLine(w.agentRuns, w.agentTools)}`, ...agents, ""];
  return [t.title(w.year), `${personaName(w.persona)}: ${personaLine(w.persona)}`, "", stats, "", ...rows, "", ...crew, t.monthsTitle, ...months, "", t.range(w)].join(`
`);
}

const SHELLS = ["#D97757", "#4FA3C7", "#6BB26F", "#B07CC6", "#E07A9A", "#7C93B8", "#4DB6A0", "#B8977A"];
const EYES = ["dot", "tall", "wide", "wink"];
const NAMES = ["Pip", "Mako", "Nori", "Kiko", "Sol", "Fenn", "Coral", "Rio", "Zuzu", "Moss", "Dune", "Juno", "Otto", "Lumi", "Skip", "Nemo"];
const TIER_COLOR = { fable: "#7F77DD", heavy: "#D85A30", careful: "#BA7517", medium: "#378ADD", light: "#1D9E75", other: "#888780" };
const colorOf = (tier) => TIER_COLOR[tier] ?? "#888780";
const lookAt = (slot) => ({
  shell: SHELLS[slot % SHELLS.length] ?? "#D97757",
  eyes: EYES[Math.floor(slot / SHELLS.length) % EYES.length] ?? "dot",
  name: NAMES[slot % NAMES.length] ?? "Pip"
});
const BY_RANK = ["careful", "medium", "heavy", "light", "fable", "other"];
function costumeFor(type, rank) {
  const bare = type.replace(/^[^:]*:/, "");
  if (bare === "Explore")
    return "explore";
  const tier = bare.replace(/^savvy-/, "").toLowerCase();
  if (bare.startsWith("savvy-") && Object.hasOwn(COSTUMES, tier))
    return tier;
  return BY_RANK[rank % BY_RANK.length] ?? "other";
}
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
  other: (f, _t, look) => crabBody(f, {}, look)
};
const CELL_ROW = 'shape-rendering="crispEdges"';
function crab(x, y, o) {
  const groups = { bd: [], la: [], lb: [] };
  const f = ([cx, cy, w, h], c, cls = "bd") => {
    const name = cls === "la" || cls === "lb" ? cls : "bd";
    groups[name]?.push(`<rect x="${cx}" y="${cy}" width="${w}" height="${h}" fill="${c}"/>`);
  };
  const draw = COSTUMES[o.costume] ?? COSTUMES.other;
  draw?.(f, colorOf(o.costume), o.look);
  const isOdd = (o.step ?? 0) % 2 === 1;
  const shift = (cls, by) => `<g transform="translate(0 ${by})">${(groups[cls] ?? []).join("")}</g>`;
  return `<g transform="translate(${x} ${y}) scale(${o.scale})" ${CELL_ROW}>${shift("bd", isOdd ? 1 : 0)}${shift("la", isOdd ? -1 : 0)}${shift("lb", isOdd ? 0 : -1)}</g>`;
}

const CHARS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~" + "çğıİöşüÇĞÖŞÜâîû·…—–≈−×’“”‘€₺°→←↑↓✓✕•";
new Map([...CHARS].map((char, i) => [char, i]));

const DECIMALS = 100;
const num = (value) => String(Math.round(value * DECIMALS) / DECIMALS);
const escapeXml = (text) => text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const SCHEME = ":root{color-scheme:light dark}";
function toPic(part) {
  const { width, height } = part;
  const source = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`,
    ` role="img" aria-label="${escapeXml(part.alt)}"><style>${SCHEME}${svgStyle(part.body)}</style>${part.body}</svg>`
  ].join("");
  return { source, width, height, alt: part.alt };
}
const rectEl = (r, extra = "") => `<rect x="${num(r.x)}" y="${num(r.y)}" width="${num(Math.max(0, r.width))}" height="${num(r.height)}"${r.radius ? ` rx="${num(r.radius)}"` : ""} class="f-${r.paint}${r.className ? ` ${r.className}` : ""}"${extra}/>`;

const W = 540;
const H = 960;
const PAD = 40;
const INNER = W - 2 * PAD;
const SETTLED = 100;
const C = { ink: "#16140F", clay: "#E2653A", violet: "#4B2FD6", moss: "#0E6B4A", sky: "#1677C9", amber: "#F5B81F", rose: "#E8467C", cream: "#F4EEDF", white: "#FFFFFF" };
const DISPLAY = "Arial Black,Arial,sans-serif";
const BODY = "Helvetica Neue,Helvetica,Arial,sans-serif";
const DISPLAY_EM = 0.74;
const BODY_EM = 0.54;
function txt(text, o) {
  const face = o.isDisplay === true ? DISPLAY : BODY;
  const bold = o.isBold === true ? ` stroke="${o.fill}" stroke-width="${(o.size * 0.022).toFixed(2)}"` : "";
  const opacity = o.opacity === undefined ? "" : ` fill-opacity="${o.opacity}"`;
  return `<text x="${o.x.toFixed(1)}" y="${o.y.toFixed(1)}" font-family="${face}" font-size="${o.size.toFixed(1)}" fill="${o.fill}"${opacity}${bold} text-anchor="${o.anchor ?? "start"}">${escapeXml(text)}</text>`;
}
const fitSize = (text, max, room) => Math.min(max, room / Math.max(1, [...text].length * DISPLAY_EM));
function fitBody(text, size, room) {
  const most = Math.floor(room / (size * BODY_EM));
  return [...text].length <= most ? text : `${[...text].slice(0, Math.max(1, most - 1)).join("")}…`;
}
function wrapBody(text, o) {
  const most = Math.floor(o.room / (o.size * BODY_EM));
  const out = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line !== "" && [...`${line} ${word}`].length > most) {
      out.push(line);
      line = word;
    } else
      line = line === "" ? word : `${line} ${word}`;
  }
  out.push(line);
  return [...out.slice(0, o.lines - 1), fitBody(out.slice(o.lines - 1).join(" "), o.size, o.room)].filter((part) => part !== "");
}
const sheet = (fill) => `<rect width="${W}" height="${H}" fill="${fill}"/>`;
const circle = (x, y, r, fill, opacity = 1) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(0, r).toFixed(1)}" fill="${fill}" fill-opacity="${opacity}"/>`;
const box = (o) => `<rect x="${o.x.toFixed(1)}" y="${o.y.toFixed(1)}" width="${Math.max(0, o.w).toFixed(1)}" height="${Math.max(0, o.h).toFixed(1)}" rx="${o.r ?? 0}" fill="${o.fill}" fill-opacity="${o.opacity ?? 1}"/>`;
function rise(body, amount) {
  return `<g opacity="${amount.toFixed(3)}" transform="translate(0 ${((1 - amount) * 34).toFixed(2)})">${body}</g>`;
}
const GLYPHS = {
  "0": [".XXX.", "X...X", "X..XX", "X.X.X", "XX..X", "X...X", ".XXX."],
  "1": ["..X..", ".XX..", "..X..", "..X..", "..X..", "..X..", ".XXX."],
  "2": [".XXX.", "X...X", "....X", "...X.", "..X..", ".X...", "XXXXX"],
  "3": ["XXXX.", "....X", "....X", ".XXX.", "....X", "....X", "XXXX."],
  "4": ["...X.", "..XX.", ".X.X.", "X..X.", "XXXXX", "...X.", "...X."],
  "5": ["XXXXX", "X....", "XXXX.", "....X", "....X", "X...X", ".XXX."],
  "6": [".XXX.", "X....", "X....", "XXXX.", "X...X", "X...X", ".XXX."],
  "7": ["XXXXX", "....X", "...X.", "..X..", "..X..", "..X..", "..X.."],
  "8": [".XXX.", "X...X", "X...X", ".XXX.", "X...X", "X...X", ".XXX."],
  "9": [".XXX.", "X...X", "X...X", ".XXXX", "....X", "....X", ".XXX."],
  ".": [".", ".", ".", ".", ".", ".", "X"],
  k: ["X....", "X....", "X..X.", "X.X..", "XX...", "X.X..", "X..X."],
  K: ["X...X", "X..X.", "X.X..", "XX...", "X.X..", "X..X.", "X...X"],
  M: ["X...X", "XX.XX", "X.X.X", "X.X.X", "X...X", "X...X", "X...X"],
  m: [".....", ".....", "XX.X.", "X.X.X", "X.X.X", "X.X.X", "X.X.X"],
  o: [".....", ".....", ".XXX.", "X...X", "X...X", "X...X", ".XXX."],
  d: ["....X", "....X", ".XXXX", "X...X", "X...X", "X...X", ".XXXX"],
  z: [".....", ".....", "XXXXX", "...X.", "..X..", ".X...", "XXXXX"],
  O: [".XXX.", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
  D: ["XXXX.", "X...X", "X...X", "X...X", "X...X", "X...X", "XXXX."],
  Z: ["XXXXX", "....X", "...X.", "..X..", ".X...", "X....", "XXXXX"],
  C: [".XXXX", "X....", "X....", "X....", "X....", "X....", ".XXXX"],
  L: ["X....", "X....", "X....", "X....", "X....", "X....", "XXXXX"],
  A: [".XXX.", "X...X", "X...X", "XXXXX", "X...X", "X...X", "X...X"],
  U: ["X...X", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
  E: ["XXXXX", "X....", "X....", "XXXX.", "X....", "X....", "XXXXX"],
  x: [".....", ".....", "X...X", ".X.X.", "..X..", ".X.X.", "X...X"],
  " ": ["...", "...", "...", "...", "...", "...", "..."]
};
const GLYPH_GAP = 1;
const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
function ease(t, start, span = 0.45) {
  const raw = clamp((t - start) / span);
  return 1 - (1 - raw) ** 3;
}
const glyphOf = (char) => GLYPHS[char] ?? GLYPHS[" "] ?? [];
function pixelWidth(text, cell) {
  const columns = [...text].reduce((sum, char) => sum + (glyphOf(char)[0]?.length ?? 0) + GLYPH_GAP, -GLYPH_GAP);
  return Math.max(0, columns) * cell;
}
function pixelText(text, o) {
  const size = o.cell * 0.88;
  let x = o.isCentered ? o.x - pixelWidth(text, o.cell) / 2 : o.x;
  let body = "";
  for (const char of text) {
    const glyph = glyphOf(char);
    glyph.forEach((row, rowAt) => {
      [...row].forEach((mark, columnAt) => {
        if (mark === "X")
          body += rectEl({ x: x + columnAt * o.cell, y: o.y + rowAt * o.cell, width: size, height: size, radius: o.cell * 0.18, paint: o.paint });
      });
    });
    x += ((glyph[0]?.length ?? 0) + GLYPH_GAP) * o.cell;
  }
  return body;
}
function agentCrab(type, rank, o) {
  return crab(o.x, o.y, { costume: costumeFor(type, rank), look: lookAt(rank), scale: o.scale, step: o.step });
}

const WEEKDAYS = {
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  tr: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
};
const DAY_SHORT = { en: ["M", "T", "W", "T", "F", "S", "S"], tr: ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"] };
const weekdayName = (index) => pick(WEEKDAYS)[index] ?? "";
const weekdayShort = (index) => pick(DAY_SHORT)[index] ?? "";
const storyWords = () => pick({
  en: {
    intro: "with Claude Code",
    introSub: (chats) => `${compact(chats)} chats later, here is your year.`,
    prompts: "prompts you sent this year",
    promptsSub: (perDay) => `About ${compact(perDay)} a day. Claude never got bored.`,
    replies: (count) => `Claude answered ${compact(count)} times.`,
    day: "Your busiest day",
    dayCount: (count) => `${compact(count)} prompts`,
    daySub: (count) => count >= 200 ? "Did you eat that day?" : "A good day to have a good day.",
    weekday: "Your favorite day to build",
    streak: (days) => `${days} days in a row`,
    active: (days) => `${days} active days in all`,
    hour: "Your busiest hour",
    night: (share) => `${share}% of your prompts came after midnight.`,
    projects: "Where you spent your year",
    promptsCount: (count) => `${compact(count)} prompts`,
    months: "How the year went",
    monthPeak: (project, count) => `${project}, ${compact(count)} prompts`,
    tools: "Your favorite tool",
    times: (count) => `${compact(count)} times`,
    lines: "lines added",
    file: "The file you could not leave alone",
    fileCount: (count) => `${compact(count)} edits`,
    novels: (count) => `Claude wrote about ${compact(count)} novels of text.`,
    crew: "agents went to work",
    crewEach: (each) => `each crab is ${compact(each)} agents`,
    crewMeta: (tools) => `${compact(tools)} tool calls between them`,
    runs: (count) => `${compact(count)} runs`,
    hardest: "Hardest single shift",
    hardestMeta: (tokens) => `tool calls, ${compact(tokens)} tokens, one agent`,
    model: "Who you talked to most",
    modelShare: (share) => `${share}% of all replies`,
    funRight: "times Claude said you were right",
    funStops: "times you stopped Claude",
    funChat: "prompts in your longest chat",
    funCost: "at API prices",
    persona: "This year you were",
    shareTitle: (year) => `My ${year} with Claude Code`,
    shareProjects: "Top projects",
    shareTools: "Top tools",
    stats: { prompts: "prompts", chats: "chats", days: "active days", streak: "day streak", lines: "lines added", agents: "agents" }
  },
  tr: {
    intro: "Claude Code ile",
    introSub: (chats) => `${compact(chats)} sohbet sonra, işte yılın.`,
    prompts: "mesaj gönderdin bu yıl",
    promptsSub: (perDay) => `Günde yaklaşık ${compact(perDay)} mesaj. Claude hiç sıkılmadı.`,
    replies: (count) => `Claude ${compact(count)} kez cevap verdi.`,
    day: "En yoğun günün",
    dayCount: (count) => `${compact(count)} mesaj`,
    daySub: (count) => count >= 200 ? "O gün yemek yedin mi?" : "İyi bir gün olmuş.",
    weekday: "En çok çalıştığın gün",
    streak: (days) => `${days} gün üst üste`,
    active: (days) => `toplam ${days} aktif gün`,
    hour: "En yoğun saatin",
    night: (share) => `Mesajlarının %${share} kadarı gece yarısından sonra.`,
    projects: "Yılın nereye gitti",
    promptsCount: (count) => `${compact(count)} mesaj`,
    months: "Yıl nasıl geçti",
    monthPeak: (project, count) => `${project}, ${compact(count)} mesaj`,
    tools: "En sevdiğin araç",
    times: (count) => `${compact(count)} kez`,
    lines: "satır eklendi",
    file: "Peşini bırakmadığın dosya",
    fileCount: (count) => `${compact(count)} düzenleme`,
    novels: (count) => `Claude yaklaşık ${compact(count)} roman yazdı.`,
    crew: "ajan işe çıktı",
    crewEach: (each) => `her yengeç ${compact(each)} ajan`,
    crewMeta: (tools) => `aralarında ${compact(tools)} araç çağrısı`,
    runs: (count) => `${compact(count)} görev`,
    hardest: "En uzun tek mesai",
    hardestMeta: (tokens) => `araç çağrısı, ${compact(tokens)} token, tek ajan`,
    model: "En çok kiminle konuştun",
    modelShare: (share) => `tüm cevapların %${share} kadarı`,
    funRight: "kez Claude sana hak verdi",
    funStops: "kez Claude'u durdurdun",
    funChat: "mesaj en uzun sohbetinde",
    funCost: "API fiyatıyla",
    persona: "Bu yıl şuydun",
    shareTitle: (year) => `Claude Code ile ${year} yılım`,
    shareProjects: "Başlıca projeler",
    shareTools: "Başlıca araçlar",
    stats: { prompts: "mesaj", chats: "sohbet", days: "aktif gün", streak: "gün üst üste", lines: "satır", agents: "ajan" }
  }
});
const panelWords = () => pick({
  en: {
    copyImage: "Copy image",
    shareX: "Share on X",
    back: "Back",
    next: "Next",
    page: (at, of) => `${at} / ${of}`,
    namesShown: "Real project and file names show on the pages and in what you share.",
    namesHidden: "Only kinds show, like Game or TypeScript file, in the video and the image too. Real names stay on this computer.",
    copiedImage: (path) => `Copied: paste it anywhere. Also at ${path}`,
    copyFailed: (path) => `Could not copy; the image is at ${path}`,
    sharedX: "The post is ready in your browser: press Cmd+V there to add the image.",
    reveal: "Show in Finder",
    post: (year, persona, prompts, days, agents) => `My ${year} with Claude Code: ${persona}. ${compact(prompts)} prompts, ${days} active days, ${compact(agents)} agents. Made with /wrapped from MODZ`
  },
  tr: {
    copyImage: "Görseli kopyala",
    shareX: "X'te paylaş",
    back: "Geri",
    next: "İleri",
    page: (at, of) => `${at} / ${of}`,
    namesShown: "Gerçek proje ve dosya adları sayfalarda ve paylaştığında görünür.",
    namesHidden: "Yalnızca tür görünür, Oyun ya da TypeScript dosyası gibi; video ve görselde de. Gerçek adlar bu bilgisayarda kalır.",
    copiedImage: (path) => `Kopyalandı, istediğin yere yapıştır. Ayrıca: ${path}`,
    copyFailed: (path) => `Kopyalanamadı; görsel burada: ${path}`,
    sharedX: "Gönderi tarayıcıda hazır: görseli eklemek için orada Cmd+V yap.",
    reveal: "Finder'da göster",
    post: (year, persona, prompts, days, agents) => `Claude Code ile ${year} yılım: ${persona}. ${compact(prompts)} mesaj, ${days} aktif gün, ${compact(agents)} ajan. MODZ /wrapped ile yapıldı`
  }
});

const MID$2 = W / 2;
const COUNT_S = 1.3;
const DAY_MS = 86400000;
const CELL_MAX = 30;
const DAYS = 7;
const INTRO_RADIUS = 250;
function counted(value, t, span = COUNT_S) {
  return Math.round(value * ease(t, 0.2, span)).toLocaleString("en-US").replaceAll(",", ".");
}
function quote(text, o) {
  const size = o.size ?? 25;
  const x = o.anchor === "middle" ? MID$2 : PAD;
  return wrapBody(text, { size, room: INNER, lines: o.lines ?? 2 }).map((line, index) => txt(line, { x, y: o.y + index * size * 1.28, size, fill: o.fill, anchor: o.anchor })).join("");
}
function introSlide({ w, t, step }) {
  const s = storyWords();
  const walkers = w.agents.slice(0, 4).map((agent, index) => {
    const x = PAD + 6 + index * 118 - (1 - ease(t, 0.5 + 0.14 * index, 1)) * W;
    return agentCrab(agent.type, index, { x, y: 760, scale: 3.3, step: step + index });
  });
  return [
    sheet(C.ink),
    circle(MID$2, 370, INTRO_RADIUS * ease(t, 0, 0.9) + Math.sin(t * 1.1) * 8, C.clay),
    rise(txt(String(w.year), { x: MID$2, y: 420, size: fitSize(String(w.year), 190, INNER), fill: C.ink, isDisplay: true, anchor: "middle" }), ease(t, 0.25)),
    rise(txt(s.intro, { x: MID$2, y: 480, size: 38, fill: C.ink, isBold: true, anchor: "middle" }), ease(t, 0.5)),
    rise(quote(s.introSub(w.sessions), { y: 720, fill: C.cream, anchor: "middle" }), ease(t, 0.8)),
    walkers.join("")
  ].join("");
}
function rings(cx, cy, t, fill) {
  return [0, 1, 2, 3].map((index) => `<circle cx="${cx}" cy="${cy}" r="${(120 + index * 110 + Math.sin(t * 0.9 + index) * 12).toFixed(1)}" fill="none" stroke="${fill}" stroke-opacity="0.22" stroke-width="30"/>`).join("");
}
function promptsSlide({ w, t }) {
  const s = storyWords();
  const total = counted(w.prompts, t);
  return [
    sheet(C.clay),
    rings(W, H, t, C.ink),
    txt(total, { x: PAD, y: 400, size: fitSize(w.prompts.toLocaleString("en-US"), 170, INNER), fill: C.ink, isDisplay: true }),
    rise(txt(s.prompts, { x: PAD, y: 462, size: 34, fill: C.ink, isBold: true }), ease(t, 0.5)),
    rise(quote(s.promptsSub(Math.round(w.prompts / Math.max(1, w.activeDays))), { y: 590, fill: C.ink }), ease(t, 1.2)),
    rise(quote(s.replies(w.replies), { y: 680, fill: C.ink }), ease(t, 1.6))
  ].join("");
}
function calendar(c, o) {
  const { w, t } = c;
  const firstMs = Date.parse(`${w.firstDay}T12:00:00Z`);
  const lastMs = Date.parse(`${w.lastDay}T12:00:00Z`);
  const lead = (new Date(firstMs).getUTCDay() + 6) % DAYS;
  const weeks = Math.ceil(((lastMs - firstMs) / DAY_MS + lead + 1) / DAYS);
  const stride = Math.min(INNER / weeks, CELL_MAX);
  const most = w.busiestDay?.count ?? 1;
  let body = "";
  for (let place = lead;place < weeks * DAYS; place += 1) {
    const at = firstMs + (place - lead) * DAY_MS;
    if (at > lastMs)
      break;
    const key = new Date(at).toISOString().slice(0, 10);
    const count = w.days[key] ?? 0;
    const week = Math.floor(place / DAYS);
    const isPeak = key === w.busiestDay?.name;
    const shade = isPeak ? 1 : count === 0 ? 0.14 : 0.4 + 0.6 * Math.min(1, count / most);
    body += box({ x: PAD + week * stride, y: o.y + place % DAYS * stride, w: stride - 2, h: stride - 2, r: 2.5, fill: isPeak ? o.peak : o.on, opacity: shade * ease(t, 0.3 + week * 0.03, 0.3) });
  }
  return body;
}
function daySlide(c) {
  const { w, t } = c;
  const s = storyWords();
  const best = w.busiestDay;
  if (best === null)
    return sheet(C.violet);
  const day = shortDay(best.name);
  return [
    sheet(C.violet),
    circle(W - 40, 170, 150 + Math.sin(t) * 10, C.rose, 0.9),
    rise(txt(s.day, { x: PAD, y: 250, size: 34, fill: C.cream, isBold: true }), ease(t, 0)),
    rise(txt(day, { x: PAD, y: 400, size: fitSize(day, 128, INNER), fill: C.cream, isDisplay: true }), ease(t, 0.3)),
    rise(txt(s.dayCount(best.count), { x: PAD, y: 480, size: 54, fill: C.amber, isDisplay: true }), ease(t, 0.7)),
    rise(quote(s.daySub(best.count), { y: 545, fill: C.cream }), ease(t, 1.1)),
    calendar(c, { y: 620, on: C.cream, peak: C.amber })
  ].join("");
}
function weekdaySlide({ w, t }) {
  const s = storyWords();
  const peak = Math.max(1, ...w.weekdays);
  const best = w.weekdays.indexOf(Math.max(...w.weekdays));
  const name = weekdayName(best);
  const barW = INNER / DAYS;
  const bars = w.weekdays.map((count, index) => {
    const height = 230 * (count / peak) * ease(t, 0.5 + index * 0.08, 0.7);
    const fill = index === best ? C.amber : C.cream;
    return box({ x: PAD + index * barW, y: 640 - height, w: barW - 8, h: height, r: 6, fill }) + txt(weekdayShort(index), { x: PAD + index * barW + (barW - 8) / 2, y: 672, size: 21, fill: C.cream, anchor: "middle" });
  });
  return [
    sheet(C.moss),
    rise(txt(s.weekday, { x: PAD, y: 160, size: 32, fill: C.cream, isBold: true }), ease(t, 0)),
    rise(txt(name, { x: PAD, y: 280, size: fitSize(name, 96, INNER), fill: C.amber, isDisplay: true }), ease(t, 0.25)),
    bars.join(""),
    rise(txt(s.streak(w.streak), { x: PAD, y: 790, size: fitSize(s.streak(w.streak), 50, INNER), fill: C.cream, isDisplay: true }), ease(t, 1.3)),
    rise(txt(s.active(w.activeDays), { x: PAD, y: 840, size: 26, fill: C.cream }), ease(t, 1.5))
  ].join("");
}
const pad2 = (value) => String(value).padStart(2, "0");
const CLOCK = { x: MID$2, y: 450, inner: 112, reach: 128, width: 17 };
function hourSlide({ w, t }) {
  const s = storyWords();
  const peak = Math.max(1, ...w.hours);
  const best = w.hours.indexOf(Math.max(...w.hours));
  const spokes = w.hours.map((count, hour) => {
    const turn = hour / 24 * 2 * Math.PI - Math.PI / 2;
    const length = (10 + CLOCK.reach * (count / peak)) * ease(t, 0.3 + hour * 0.03, 0.6);
    const cos = Math.cos(turn);
    const sin = Math.sin(turn);
    const from = CLOCK.inner;
    const to = from + length;
    return `<line x1="${(CLOCK.x + cos * from).toFixed(1)}" y1="${(CLOCK.y + sin * from).toFixed(1)}" x2="${(CLOCK.x + cos * to).toFixed(1)}" y2="${(CLOCK.y + sin * to).toFixed(1)}" stroke="${hour === best ? C.amber : C.cream}" stroke-opacity="${hour === best ? 1 : 0.55}" stroke-width="${CLOCK.width}" stroke-linecap="round"/>`;
  });
  return [
    sheet(C.ink),
    rise(txt(s.hour, { x: PAD, y: 130, size: 34, fill: C.cream, isBold: true }), ease(t, 0)),
    spokes.join(""),
    rise(txt(`${pad2(best)}:00`, { x: CLOCK.x, y: CLOCK.y + 20, size: 58, fill: C.amber, isDisplay: true, anchor: "middle" }), ease(t, 0.9)),
    rise(quote(s.night(Math.round(w.nightShare * 100)), { y: 800, fill: C.cream, size: 27 }), ease(t, 1.5))
  ].join("");
}

const MID$1 = W / 2;
const CRAB_W$1 = 30;
const toolName = (name) => name.split("__").at(-1) ?? name;
function rankedRows(rows, t, o) {
  return rows.map((row, index) => {
    const y = o.y + index * o.rowH;
    const body = [
      txt(String(index + 1), { x: PAD, y: y + 40, size: 56, fill: o.rank, isDisplay: true }),
      txt(fitBody(row.title, 31, INNER - 76), { x: PAD + 76, y: y + 18, size: 31, fill: o.title, isBold: true }),
      txt(row.meta, { x: PAD + 76, y: y + 52, size: 23, fill: o.meta })
    ].join("");
    return rise(body, ease(t, o.start + index * 0.3));
  }).join("");
}
function projectsSlide({ w, t, isNamed }) {
  const s = storyWords();
  const labels = projectLabels(w, isNamed);
  const rows = w.projects.map((row) => ({ title: labels.get(row.name) ?? row.name, meta: s.promptsCount(row.count) }));
  return [
    sheet(C.cream),
    circle(W, 90, 170 + Math.sin(t) * 10, C.clay),
    rise(txt(s.projects, { x: PAD, y: 200, size: fitSize(s.projects, 46, INNER), fill: C.ink, isDisplay: true }), ease(t, 0)),
    rankedRows(rows, t, { y: 275, rowH: 122, title: C.ink, meta: C.ink, rank: C.clay, start: 0.4 })
  ].join("");
}
function monthsSlide({ w, t, isNamed }) {
  const s = storyWords();
  const labels = projectLabels(w, isNamed);
  const most = Math.max(1, ...w.months.map((month) => month.prompts));
  const peak = w.months.find((month) => month.prompts === most);
  const each = INNER / Math.max(1, w.months.length);
  const bars = w.months.map((month, index) => {
    const height = 370 * (month.prompts / most) * ease(t, 0.4 + index * 0.1, 0.7);
    const x = PAD + index * each;
    return box({ x, y: 810 - height, w: each - 8, h: height, r: 8, fill: month === peak ? C.amber : C.cream }) + txt(shortMonth(month.month), { x: x + (each - 8) / 2, y: 846, size: 20, fill: C.cream, anchor: "middle" });
  });
  const name = peak === undefined ? "" : monthName(peak.month);
  const project = peak?.project === null || peak === undefined ? "—" : labels.get(peak.project) ?? "—";
  return [
    sheet(C.sky),
    rise(txt(s.months, { x: PAD, y: 130, size: 34, fill: C.cream, isBold: true }), ease(t, 0)),
    rise(txt(name, { x: PAD, y: 245, size: fitSize(name, 92, INNER), fill: C.amber, isDisplay: true }), ease(t, 0.25)),
    rise(txt(fitBody(s.monthPeak(project, peak?.prompts ?? 0), 27, INNER), { x: PAD, y: 300, size: 27, fill: C.cream }), ease(t, 0.5)),
    bars.join("")
  ].join("");
}
function toolsSlide({ w, t }) {
  const s = storyWords();
  const top = w.tools[0];
  const most = Math.max(1, w.tools[1]?.count ?? 1);
  const rows = w.tools.slice(1).map((row, index) => {
    const y = 470 + index * 92;
    const width = INNER * (row.count / most) * ease(t, 0.7 + index * 0.2, 0.7);
    return rise(txt(fitBody(toolName(row.name), 28, INNER - 110), { x: PAD, y, size: 28, fill: C.ink, isBold: true }) + txt(compact(row.count), { x: W - PAD, y, size: 25, fill: C.ink, anchor: "end" }), ease(t, 0.6 + index * 0.2)) + box({ x: PAD, y: y + 16, w: INNER, h: 16, r: 8, fill: C.ink, opacity: 0.15 }) + box({ x: PAD, y: y + 16, w: width, h: 16, r: 8, fill: C.ink });
  });
  const name = toolName(top?.name ?? "—");
  return [
    sheet(C.amber),
    rise(txt(s.tools, { x: PAD, y: 150, size: 34, fill: C.ink, isBold: true }), ease(t, 0)),
    rise(txt(name, { x: PAD, y: 280, size: fitSize(name, 112, INNER), fill: C.ink, isDisplay: true }), ease(t, 0.25)),
    rise(txt(s.times(top?.count ?? 0), { x: PAD, y: 345, size: 36, fill: C.ink }), ease(t, 0.5)),
    rows.join("")
  ].join("");
}
function codeSlide({ w, t, isNamed }) {
  const s = storyWords();
  const file = w.files[0];
  const fileName = file === undefined ? "" : fileLabel(file.name, isNamed);
  return [
    sheet(C.rose),
    circle(0, H, 170 + Math.sin(t) * 12, C.violet),
    txt(counted(w.linesAdded, t), { x: PAD, y: 300, size: fitSize(w.linesAdded.toLocaleString("en-US"), 120, INNER), fill: C.ink, isDisplay: true }),
    rise(txt(s.lines, { x: PAD, y: 360, size: 36, fill: C.ink, isBold: true }), ease(t, 0.6)),
    file === undefined ? "" : rise(txt(s.file, { x: PAD, y: 490, size: 28, fill: C.ink }) + txt(fitBody(fileName, 40, INNER), { x: PAD, y: 545, size: 40, fill: C.cream, isBold: true }) + txt(s.fileCount(file.count), { x: PAD, y: 590, size: 28, fill: C.ink }), ease(t, 1)),
    rise(quote(s.novels(Math.max(1, Math.round(w.outputTokens / NOVEL_TOKENS))), { y: 700, fill: C.ink, size: 27 }), ease(t, 1.5))
  ].join("");
}
const CREW = { max: 40, columns: 8 };
function crewSlide({ w, t, step }) {
  const s = storyWords();
  const each = Math.max(1, Math.ceil(w.agentRuns / CREW.max));
  const shown = Math.ceil(w.agentRuns / each);
  const size = INNER / CREW.columns;
  const crabs = Array.from({ length: Math.ceil(shown * ease(t, 0.7, 1.8)) }, (_, index) => {
    const agent = w.agents[index % Math.max(1, w.agents.length)];
    return agentCrab(agent?.type ?? "agent", index, { x: PAD + index % CREW.columns * size, y: 350 + Math.floor(index / CREW.columns) * size, scale: (size - 6) / CRAB_W$1, step: step + index });
  });
  const top = w.agents.slice(0, 3).map((agent, index) => txt(fitBody(`${agent.type}: ${s.runs(agent.runs)}`, 25, INNER), { x: PAD, y: 700 + index * 38, size: 25, fill: index === 0 ? C.amber : C.cream }));
  return [
    sheet(C.ink),
    txt(counted(w.agentRuns, t), { x: PAD, y: 220, size: fitSize(w.agentRuns.toLocaleString("en-US"), 120, INNER), fill: C.amber, isDisplay: true }),
    rise(txt(s.crew, { x: PAD, y: 280, size: 36, fill: C.cream, isBold: true }), ease(t, 0.5)),
    crabs.join(""),
    rise(top.join(""), ease(t, 2)),
    rise(txt(each > 1 ? `${s.crewEach(each)} · ${s.crewMeta(w.agentTools)}` : s.crewMeta(w.agentTools), { x: PAD, y: 860, size: 21, fill: C.cream, opacity: 0.7 }), ease(t, 2.2))
  ].join("");
}
function hardestSlide({ w, t, step, isNamed }) {
  const s = storyWords();
  const hardest = w.hardest;
  if (hardest === null)
    return sheet(C.clay);
  const rank = Math.max(0, w.agents.findIndex((agent) => agent.type === hardest.type));
  const scale = 8;
  const title = isNamed && hardest.description !== "" ? hardest.description : hardest.type;
  return [
    sheet(C.clay),
    circle(MID$1, 370, 190 + Math.sin(t * 1.4) * 10, C.amber),
    rise(txt(s.hardest, { x: MID$1, y: 130, size: 34, fill: C.ink, isBold: true, anchor: "middle" }), ease(t, 0)),
    rise(agentCrab(hardest.type, rank, { x: MID$1 - CRAB_W$1 * scale / 2, y: 262, scale, step }), ease(t, 0.2)),
    txt(counted(hardest.tools, t), { x: MID$1, y: 700, size: 110, fill: C.ink, isDisplay: true, anchor: "middle" }),
    rise(txt(s.hardestMeta(hardest.tokens), { x: MID$1, y: 755, size: 25, fill: C.ink, anchor: "middle" }), ease(t, 1.2)),
    rise(quote(title, { y: 815, fill: C.ink, size: 25, anchor: "middle" }), ease(t, 1.5))
  ].join("");
}
function modelSlide({ w, t }) {
  const s = storyWords();
  const total = Math.max(1, w.models.reduce((sum, row) => sum + row.count, 0));
  const top = w.models[0];
  const share = Math.round((top?.count ?? 0) / total * 100);
  const paints = [C.ink, C.clay, C.violet, C.moss, C.sky];
  let x = PAD;
  const stack = w.models.map((row, index) => {
    const width = INNER * row.count / total;
    const part = box({ x, y: 500, w: Math.max(0, width * ease(t, 0.7, 0.8) - 3), h: 54, fill: paints[index % paints.length], r: 6 });
    x += width;
    return part;
  });
  const rows = w.models.slice(0, 4).map((row, index) => txt(`${row.name} · %${Math.round(row.count / total * 100)}`, { x: PAD, y: 625 + index * 44, size: 26, fill: C.ink }));
  return [
    sheet(C.cream),
    rise(txt(s.model, { x: PAD, y: 160, size: 34, fill: C.ink, isBold: true }), ease(t, 0)),
    rise(txt(top?.name ?? "—", { x: PAD, y: 300, size: fitSize(top?.name ?? "—", 92, INNER), fill: C.violet, isDisplay: true }), ease(t, 0.25)),
    rise(txt(s.modelShare(share), { x: PAD, y: 365, size: 30, fill: C.ink }), ease(t, 0.5)),
    stack.join(""),
    rise(rows.join(""), ease(t, 1.3))
  ].join("");
}

const MID = W / 2;
const CRAB_W = 30;
const SEGMENT = { y: 24, h: 5, gap: 4 };
function funSlide({ w, t }) {
  const s = storyWords();
  const rows = [
    { value: compact(w.rightCount), label: s.funRight, on: w.rightCount > 0 },
    { value: compact(w.stops), label: s.funStops, on: w.stops > 0 },
    { value: compact(w.longestChat), label: s.funChat, on: true },
    { value: `~$${compact(w.costUsd)}`, label: s.funCost, on: w.costUsd > 0 }
  ].filter((row) => row.on);
  const body = rows.map((row, index) => {
    const y = 120 + index * 200;
    return rise(txt(row.value, { x: PAD, y: y + 100, size: fitSize(row.value, 96, INNER), fill: index % 2 === 0 ? C.amber : C.cream, isDisplay: true }) + txt(fitBody(row.label, 27, INNER), { x: PAD, y: y + 145, size: 27, fill: C.cream }), ease(t, 0.15 + index * 0.55));
  });
  return [sheet(C.violet), circle(W, H, 130 + Math.sin(t) * 10, C.rose), body.join("")].join("");
}
function personaSlide({ w, t, step }) {
  const s = storyWords();
  const scale = 8;
  const name = personaName(w.persona);
  return [
    sheet(C.ink),
    circle(MID, 540, 480 * ease(t, 0.5, 1) + Math.sin(t) * 8, C.clay),
    rise(txt(s.persona, { x: MID, y: 90, size: 32, fill: C.cream, isBold: true, anchor: "middle" }), ease(t, 0)),
    rise(txt(name, { x: MID, y: 270, size: fitSize(name, 90, INNER), fill: C.ink, isDisplay: true, anchor: "middle" }), ease(t, 1.1)),
    rise(agentCrab(w.agents[0]?.type ?? "agent", 1, { x: MID - CRAB_W * scale / 2, y: 345, scale, step }), ease(t, 1.3)),
    rise(quote(personaLine(w.persona), { y: 690, fill: C.ink, size: 30, lines: 3, anchor: "middle" }), ease(t, 1.7))
  ].join("");
}
function statGrid(w, y) {
  const s = storyWords().stats;
  const stats = [
    { value: compact(w.prompts), label: s.prompts },
    { value: compact(w.sessions), label: s.chats },
    { value: String(w.activeDays), label: s.days },
    { value: String(w.streak), label: s.streak },
    { value: compact(w.linesAdded), label: s.lines },
    { value: compact(w.agentRuns), label: s.agents }
  ];
  return stats.map((stat, index) => {
    const x = PAD + index % 3 * (INNER / 3);
    const top = y + Math.floor(index / 3) * 104;
    return txt(stat.value, { x, y: top + 44, size: fitSize(stat.value, 44, INNER / 3 - 12), fill: C.amber, isDisplay: true }) + txt(stat.label, { x, y: top + 76, size: 21, fill: C.cream });
  }).join("");
}
function topList(o) {
  const room = INNER / 2 - 14;
  const rows = o.rows.map((row, index) => txt(fitBody(`${index + 1}  ${row}`, 24, room), { x: o.x, y: o.y + 40 + index * 36, size: 24, fill: C.cream, isBold: index === 0 }));
  return txt(o.title, { x: o.x, y: o.y, size: 21, fill: C.cream, opacity: 0.65 }) + rows.join("");
}
function summarySlide({ w, t, isNamed, step }) {
  const s = storyWords();
  const labels = projectLabels(w, isNamed);
  const name = personaName(w.persona);
  const crabX = W - PAD - CRAB_W * 3.4;
  return [
    sheet(C.ink),
    box({ x: 0, y: 0, w: W, h: 330, fill: C.clay }),
    rise(txt(s.shareTitle(w.year), { x: PAD, y: 110, size: 27, fill: C.ink, isBold: true }), ease(t, 0)),
    rise(txt(name, { x: PAD, y: 205, size: fitSize(name, 72, INNER - 60), fill: C.ink, isDisplay: true }), ease(t, 0.2)),
    rise(quote(personaLine(w.persona), { y: 256, fill: C.ink, size: 23 }), ease(t, 0.4)),
    agentCrab(w.agents[0]?.type ?? "agent", 1, { x: crabX, y: 50, scale: 3.4, step }),
    rise(statGrid(w, 365), ease(t, 0.6)),
    rise(topList({ x: PAD, y: 625, title: s.shareProjects, rows: w.projects.slice(0, 3).map((row) => labels.get(row.name) ?? row.name) }) + topList({ x: PAD + INNER / 2 + 14, y: 625, title: s.shareTools, rows: w.tools.slice(0, 3).map((row) => toolName(row.name)) }), ease(t, 0.9)),
    rise(pixelText("modz", { x: PAD, y: 860, cell: 4, paint: "edit" }) + txt("/wrapped", { x: W - PAD, y: 885, size: 25, fill: C.cream, anchor: "end" }), ease(t, 1.2))
  ].join("");
}
const hasAgents = (w) => w.agentRuns > 0;
const SLIDES = [
  { key: "intro", draw: introSlide, dur: 3.4 },
  { key: "prompts", draw: promptsSlide, dur: 3.6 },
  { key: "day", draw: daySlide, dur: 3.8, isFor: (w) => w.busiestDay !== null },
  { key: "weekday", draw: weekdaySlide, dur: 3.6 },
  { key: "hour", draw: hourSlide, dur: 3.6 },
  { key: "projects", isLight: true, draw: projectsSlide, dur: 3.8, isFor: (w) => w.projects.length > 0 },
  { key: "months", draw: monthsSlide, dur: 3.8, isFor: (w) => w.months.length > 1 },
  { key: "tools", isLight: true, draw: toolsSlide, dur: 3.6, isFor: (w) => w.tools.length > 0 },
  { key: "code", draw: codeSlide, dur: 3.6, isFor: (w) => w.linesAdded > 0 },
  { key: "crew", draw: crewSlide, dur: 4.2, isFor: hasAgents },
  { key: "hardest", draw: hardestSlide, dur: 3.4, isFor: (w) => w.hardest !== null },
  { key: "model", isLight: true, draw: modelSlide, dur: 3.4, isFor: (w) => w.models.length > 0 },
  { key: "fun", draw: funSlide, dur: 3.6 },
  { key: "persona", draw: personaSlide, dur: 3.8 },
  { key: "summary", draw: summarySlide, dur: 4.6 }
];
const slidesFor = (w) => SLIDES.filter((slide) => slide.isFor === undefined || slide.isFor(w));
function segments(slides, at, share) {
  const count = slides.length;
  const width = (W - 2 * 16 - (count - 1) * SEGMENT.gap) / count;
  const fill = slides[at]?.isLight === true ? C.ink : C.white;
  let body = "";
  for (let index = 0;index < count; index += 1) {
    const x = 16 + index * (width + SEGMENT.gap);
    const done = index < at ? 1 : index === at ? share : 0;
    body += box({ x, y: SEGMENT.y, w: width, h: SEGMENT.h, r: 2.5, fill, opacity: 0.3 });
    if (done > 0)
      body += box({ x, y: SEGMENT.y, w: width * done, h: SEGMENT.h, r: 2.5, fill });
  }
  return body;
}
const PX_PER_COLUMN = 9;
const PX_PER_ROW = 18;
const UNSAID_ROOM_PX = 590;
const CONTROLS_PX = 190;
const PAGE_MIN = 180;
const PAGE_MAX = 400;
function pageWidth(columns, rows) {
  const across = Math.min(PAGE_MAX, columns * PX_PER_COLUMN);
  const room = (rows > 0 ? rows * PX_PER_ROW : UNSAID_ROOM_PX) - CONTROLS_PX;
  return Math.round(Math.min(across, Math.max(PAGE_MIN, room * W / H)));
}
function pagePic(spec, index, width) {
  const slides = slidesFor(spec.wrapped);
  const at = Math.max(0, Math.min(slides.length - 1, index));
  const slide = slides[at];
  const body = slide.draw({ w: spec.wrapped, isNamed: spec.isNamed, t: SETTLED, step: 0 }) + segments(slides, at, 1);
  const pic = toPic({ body, width: W, height: H, alt: words().title(spec.wrapped.year) });
  const height = Math.round(width * H / W);
  return { ...pic, width, height, source: pic.source.replace(`width="${W}" height="${H}"`, `width="${width}" height="${height}"`) };
}
const summaryPic = (spec) => toPic({ body: summarySlide({ w: spec.wrapped, isNamed: spec.isNamed, t: SETTLED, step: 0 }), width: W, height: H, alt: words().title(spec.wrapped.year) });

const FPS = 60;
const STEP_FPS = 8;
const SLIDE_S = 0.45;
const frameCount = (slides) => Math.round(slides.reduce((sum, slide) => sum + slide.dur, 0) * FPS);
function pageBody(spec, slide, t, step) {
  return slide.draw({ w: spec.wrapped, isNamed: spec.isNamed, t, step });
}
function frameBody(spec, slides, at) {
  const slide = slides[at.index];
  const page = pageBody(spec, slide, at.t, at.step);
  const before = slides[at.index - 1];
  const moved = before === undefined ? 1 : ease(at.t, 0, SLIDE_S);
  const layers = moved >= 1 || before === undefined ? page : `<g transform="translate(0 ${(-(H * 0.25) * moved).toFixed(2)})">${pageBody(spec, before, before.dur + at.t, at.step)}</g><g transform="translate(0 ${(H * (1 - moved)).toFixed(2)})">${page}</g>`;
  return layers + segments(slides, at.index, at.t / slide.dur);
}
function frameAt(spec, slides, frame) {
  let t = frame / FPS;
  let index = 0;
  while (index < slides.length - 1 && t >= slides[index].dur) {
    t -= slides[index].dur;
    index += 1;
  }
  const body = frameBody(spec, slides, { index, t: Math.min(t, slides[index].dur), step: Math.floor(frame * STEP_FPS / FPS) });
  return standalone(toPic({ body, width: W, height: H, alt: "" }));
}
const BATCH = 120;
const SCALE$1 = 2;
const pad = (value) => String(value).padStart(5, "0");
function fail(what, ran) {
  if (ran.exitCode !== 0)
    throw new Error(`${what}: ${ran.stderr.trim().slice(-160) || `exit ${ran.exitCode}`}`);
}
function* holdsOf(spec) {
  const slides = slidesFor(spec.wrapped);
  let last = null;
  for (let frame = 0;frame < frameCount(slides); frame += 1) {
    const source = frameAt(spec, slides, frame);
    if (last !== null && last.source === source) {
      last.frames += 1;
      continue;
    }
    if (last !== null)
      yield last;
    last = { source, frames: 1 };
  }
  if (last !== null)
    yield last;
}
async function flush(io, dir, paths) {
  if (paths.length > 0)
    fail("sips", await io.run(["sips", "-s", "format", "png", "-z", String(H * SCALE$1), String(W * SCALE$1), ...paths, "--out", dir]));
}
async function drawFrames(io, spec, dir) {
  const holds = [];
  const total = frameCount(slidesFor(spec.wrapped));
  let made = 0;
  const batch = { paths: [], start: 0 };
  for (const hold of holdsOf(spec)) {
    const path = `${dir}/f${pad(holds.length)}.svg`;
    await io.write(path, hold.source);
    holds.push({ frames: hold.frames });
    batch.paths.push(path);
    made += hold.frames;
    if (batch.paths.length < BATCH)
      continue;
    await flush(io, dir, batch.paths);
    batch.paths = [];
    await io.progress(made, total);
  }
  await flush(io, dir, batch.paths);
  return holds;
}
function concatList(dir, holds) {
  const lines = holds.flatMap((hold, index) => [`file '${dir}/f${pad(index)}.png'`, `duration ${(hold.frames / FPS).toFixed(5)}`]);
  const last = holds.length - 1;
  return [...lines, `file '${dir}/f${pad(last)}.png'`, ""].join(`
`);
}
async function makeFilm(io, spec, where) {
  const holds = await drawFrames(io, spec, where.dir);
  const list = `${where.dir}/list.txt`;
  await io.write(list, concatList(where.dir, holds));
  const argv = ["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-vf", `fps=${FPS},format=yuv420p`, "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-movflags", "+faststart", where.out];
  fail("ffmpeg", await io.run(argv));
}

function filmLine(film) {
  const t = words();
  if (film.status === "making")
    return t.filmMaking(film.made, film.total);
  return film.status === "ready" ? t.filmReady(film.path) : t.filmFailed(film.reason);
}

function stateTree(ui, lines) {
  const { Box, Text } = ui;
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, h(Text, {
    bold: true
  }, lines.title), lines.hint !== undefined && h(Text, {
    dimColor: true
  }, lines.hint));
}
function linesOf(view) {
  const t = words();
  if (view.status === "reading")
    return { title: t.reading(view.year), hint: t.readingHint };
  if (view.status === "empty")
    return { title: t.empty(view.year), hint: t.emptyHint };
  if (view.status === "failed")
    return { title: t.failed, hint: view.reason };
  return { title: t.idle };
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

const SCALE = 2;
const TIMEOUT_MS = 30000;
const REPO = "https://github.com/partalemre/MODZ";
const POST_URL = "https://x.com/intent/post";
const why$1 = (error) => error instanceof Error ? error.message : String(error);
async function savedImage(io, spec) {
  const home = await io.home();
  if (typeof home !== "string" || home === "")
    throw new Error("HOME is not set");
  const stem = `${home}/Downloads/wrapped-${spec.wrapped.year}`;
  await io.write(`${stem}.svg`, standalone(summaryPic(spec)));
  const ran = await io.run(["sips", "-s", "format", "png", "-z", String(H * SCALE), String(W * SCALE), `${stem}.svg`, "--out", `${stem}.png`], TIMEOUT_MS).catch(() => null);
  return ran?.exitCode === 0 ? `${stem}.png` : `${stem}.svg`;
}
async function toClipboard(io, path) {
  if (!path.endsWith(".png"))
    return false;
  const script = `set the clipboard to (read (POSIX file ${JSON.stringify(path)}) as «class PNGf»)`;
  const ran = await io.run(["osascript", "-e", script], TIMEOUT_MS).catch(() => null);
  return ran?.exitCode === 0;
}
function postUrl(spec) {
  const w = spec.wrapped;
  const text = panelWords().post(w.year, personaName(w.persona), w.prompts, w.activeDays, w.agentRuns);
  return `${POST_URL}?text=${encodeURIComponent(text)}&url=${encodeURIComponent(REPO)}`;
}
async function copyImage(io, spec) {
  try {
    const path = await savedImage(io, spec);
    return { kind: await toClipboard(io, path) ? "copied" : "copyFailed", path };
  } catch (error) {
    return { kind: "failed", reason: why$1(error) };
  }
}
async function shareOnX(io, spec) {
  const copied = await copyImage(io, spec);
  if (copied.kind === "failed")
    return copied;
  const ran = await io.run(["open", postUrl(spec)], TIMEOUT_MS).catch(() => null);
  return ran?.exitCode === 0 ? { kind: "posted", path: copied.path } : copied;
}
function sharedLine(shared) {
  const t = panelWords();
  if (shared.kind === "failed")
    return shared.reason;
  if (shared.kind === "copied")
    return t.copiedImage(shared.path);
  return shared.kind === "posted" ? t.sharedX : t.copyFailed(shared.path);
}

const JSONL = ".jsonl";
const META = ".meta.json";
const AWK = String.raw`
function grab(re, line) { return match(line, re) ? substr(line, RSTART, RLENGTH) : "" }
function value(frag) { sub(/^"[^"]*":"?/, "", frag); sub(/"$/, "", frag); return frag }
function hour(line) { return substr(value(grab("\"timestamp\":\"[^\"]*\"", line)), 1, 13) }
function isStop(line) { return index(line, "\"text\":\"[Request interrupted by user") || index(line, "\"content\":\"[Request interrupted by user") }
function isRight(line) { return index(line, "absolutely right") || index(line, "You\047re right") || index(line, "akl\304\261s\304\261n") }
BEGIN { FS = "\n"; while ((getline path < "-") > 0) ARGV[ARGC++] = path }
FNR == 1 { inAgent = FILENAME ~ /\/subagents\// }
FILENAME ~ /\.meta\.json$/ {
  key = FILENAME; sub(/\.meta\.json$/, ".jsonl", key)
  typeOf[key] = value(grab("\"agentType\":\"[^\"]*\"", $0))
  d = grab("\"description\":\"([^\"\\\\]|\\\\.)*\"", $0); sub(/^"description":"/, "", d); sub(/"$/, "", d); descOf[key] = d
  next
}
index($0, "\"type\":\"cost-state\"") {
  start = value(grab("\"startTime\":[0-9]+", $0)); if (start == "") start = FILENAME
  cost = value(grab("\"totalCostUSD\":[0-9.]+", $0)) + 0; if (cost > costOf[start]) costOf[start] = cost
  add = value(grab("\"totalLinesAdded\":[0-9]+", $0)) + 0; if (add > addOf[start]) addOf[start] = add
  fileOf[start] = FILENAME
  next
}
index($0, "\"type\":\"user\"") {
  h = hour($0); if (substr(h, 1, 4) != YEAR) next
  if (inAgent) { if (!(FILENAME in runMonth)) runMonth[FILENAME] = substr(h, 1, 7); next }
  if (index($0, "\"isSidechain\":true") || index($0, "\"isMeta\":true")) next
  id = value(grab("\"uuid\":\"[^\"]*\"", $0)); if (id != "" && seen[id]++) next
  if (isStop($0)) { stops++; next }
  if (index($0, "\"toolUseResult\"") || index($0, "\"tool_result\"") || index($0, "\"promptSource\":\"system\"")) next
  if (index($0, "\"origin\":{\"kind\":\"") && !index($0, "\"origin\":{\"kind\":\"human\"")) next
  prompts[h]++; promptsOf[FILENAME]++
  c = value(grab("\"cwd\":\"[^\"]*\"", $0)); if (c != "") { sub(/\/\.claude\/worktrees\/.*/, "", c); place[c]++; monthPlace[substr(h, 1, 7) SUBSEP c]++ }
  next
}
index($0, "\"type\":\"assistant\"") {
  h = hour($0); if (substr(h, 1, 4) != YEAR) next
  isActive[FILENAME] = 1
  id = value(grab("\"id\":\"msg_[A-Za-z0-9]+\"", $0))
  if (id != "" && !seen[id]++) { replies[h]++; m = value(grab("\"model\":\"claude-[^\"]*\"", $0)); if (m != "") models[m]++; k = value(grab("\"output_tokens\":[0-9]+", $0)) + 0; out += k; if (inAgent) workTokens[FILENAME] += k }
  if (index($0, "\"content\":[{\"type\":\"text\",\"text\":\"") && isRight($0) && !said[id]++) right++
  rest = $0
  while (match(rest, /"type":"tool_use","id":"toolu_[A-Za-z0-9_-]+","name":"[^"]+"/)) {
    use = substr(rest, RSTART, RLENGTH); rest = substr(rest, RSTART + RLENGTH)
    t = use; sub(/^.*"id":"/, "", t); sub(/".*$/, "", t)
    if (seen[t]++) continue
    n = use; sub(/^.*"name":"/, "", n); sub(/"$/, "", n)
    tools[n]++
    if (inAgent) workTools[FILENAME]++
    if ((n == "Edit" || n == "Write" || n == "MultiEdit") && match(rest, /"file_path":"[^"]+"/) && RSTART < 60) files[value(substr(rest, RSTART, RLENGTH))]++
  }
}
END {
  for (s in costOf) if (isActive[fileOf[s]]) { cost += costOf[s]; added += addOf[s] }
  print "X\t" stops + 0 "\t" right + 0 "\t" cost + 0 "\t" added + 0 "\t" out + 0
  for (f in runMonth) {
    t = typeOf[f]; if (t == "") t = "agent"
    runs[t]++; typeTools[t] += workTools[f]; typeTokens[t] += workTokens[f]; monthRuns[runMonth[f] SUBSEP t]++
    if (best == "" || workTools[f] > workTools[best]) best = f
  }
  if (best != "") { t = typeOf[best]; if (t == "") t = "agent"; print "B\t" t "\t" workTools[best] + 0 "\t" workTokens[best] + 0 "\t" descOf[best] }
  for (t in runs) print "G\t" t "\t" runs[t] "\t" typeTools[t] + 0 "\t" typeTokens[t] + 0
  for (m in monthRuns) { split(m, part, SUBSEP); print "N\t" part[1] "\t" part[2] "\t" monthRuns[m] }
  for (m in monthPlace) { split(m, part, SUBSEP); print "M\t" part[1] "\t" part[2] "\t" monthPlace[m] }
  for (h in prompts) print "P\t" h "\t" prompts[h]
  for (h in replies) print "R\t" h "\t" replies[h]
  for (n in tools) print "T\t" n "\t" tools[n]
  for (n in models) print "O\t" n "\t" models[n]
  for (c in place) print "C\t" c "\t" place[c]
  for (f in promptsOf) print "S\t" promptsOf[f]
  for (f in files) if (files[f] > 1) print "F\t" f "\t" files[f]
}
`;
async function projectFiles(list, dir, sinceMs) {
  const entries = await list(dir);
  const paths = [];
  for (const entry of entries) {
    if (entry.kind === "file" && entry.name.endsWith(JSONL) && entry.mtimeMs >= sinceMs)
      paths.push(`${dir}/${entry.name}`);
    if (entry.kind !== "dir")
      continue;
    const inside = await list(`${dir}/${entry.name}/subagents`).catch(() => []);
    for (const agent of inside)
      if ((agent.name.endsWith(JSONL) || agent.name.endsWith(META)) && agent.mtimeMs >= sinceMs)
        paths.push(`${dir}/${entry.name}/subagents/${agent.name}`);
  }
  return paths;
}
async function transcriptPaths(list, root, sinceMs) {
  const paths = [];
  for (const project of await list(root))
    if (project.kind === "dir")
      paths.push(...await projectFiles(list, `${root}/${project.name}`, sinceMs));
  return [...paths.filter((path) => path.endsWith(META)), ...paths.filter((path) => !path.endsWith(META))];
}
const count = (text) => {
  const value = Number(text);
  return Number.isFinite(value) && value > 0 ? value : 0;
};
function unescaped(text) {
  try {
    return String(JSON.parse(`"${text}"`));
  } catch {
    return text;
  }
}
function readAgentLine(raw, [kind, first, second, third, fourth]) {
  if (first === undefined || first === "")
    return;
  if (kind === "G")
    raw.agents.push({ type: first, runs: count(second), tools: count(third), tokens: count(fourth) });
  if (kind === "B")
    raw.hardest = { type: first, tools: count(second), tokens: count(third), description: unescaped(fourth ?? "") };
  if (kind === "N" && second !== undefined)
    raw.monthAgents.push({ month: first, name: second, count: count(third) });
  if (kind === "M" && second !== undefined)
    raw.monthProjects.push({ month: first, name: second, count: count(third) });
}
function parseOutput(output) {
  const raw = { promptsByHour: {}, repliesByHour: {}, outputTokens: 0, tools: {}, files: {}, places: {}, chats: [], agents: [], hardest: null, monthProjects: [], monthAgents: [], stops: 0, rightCount: 0, costUsd: 0, linesAdded: 0, models: {} };
  const tables = { P: raw.promptsByHour, R: raw.repliesByHour, T: raw.tools, C: raw.places, F: raw.files, O: raw.models };
  for (const line of output.split(`
`)) {
    const [kind, first, second, third, fourth, fifth] = line.split("\t");
    if (kind === undefined)
      continue;
    readAgentLine(raw, line.split("\t"));
    const table = tables[kind];
    if (table !== undefined && first !== undefined && first !== "")
      table[first] = count(second);
    if (kind === "S")
      raw.chats.push(count(first));
    if (kind === "X")
      Object.assign(raw, { stops: count(first), rightCount: count(second), costUsd: count(third), linesAdded: count(fourth), outputTokens: count(fifth) });
  }
  return raw;
}
function rootOf(transcript) {
  if (!transcript.endsWith(JSONL))
    return "";
  const folder = transcript.slice(0, Math.max(0, transcript.lastIndexOf("/")));
  return folder.slice(0, Math.max(0, folder.lastIndexOf("/")));
}

const PANE = "wrapped";
const IDLE = { status: "idle" };
const SCAN_TIMEOUT_MS = 600000;
const FILM_STEP_TIMEOUT_MS = 180000;
const YEAR = /^20\d\d$/;
const DEFAULT_COLUMNS = 40;
const viewAtom = atom({ plugin: "wrapped", key: "view" }, IDLE, { shape: "view-1" });
const rootAtom = atom({ plugin: "wrapped", key: "root" }, "");
const namedAtom = atom({ plugin: "wrapped", key: "isNamed" }, false, { shape: "names-2" });
const pageAtom = atom({ plugin: "wrapped", key: "page" }, 0);
const sharedAtom = atom({ plugin: "wrapped", key: "shared" }, null);
const filmAtom = atom({ plugin: "wrapped", key: "film" }, null);
const keyOf = (year) => `wrapped.${year}`;
const why = (error) => error instanceof Error ? error.message : String(error);
const yearOf = (ms) => new Date(ms).getFullYear();
async function writeHub($, wrapped) {
  const t = words();
  await $.state.set({ plugin: "wrapped", key: "hub" }, { pane: PANE, detail: wrapped === null ? "" : t.hubDetail(wrapped), tone: wrapped === null ? "idle" : "ok", at: await $.clock.now(), title: t.paneTitle, hint: t.hubHint, icon: "star", section: "meter" });
}
async function scanYear($, year) {
  const root = await read($, rootAtom);
  if (root === "")
    throw new Error(words().noRoot);
  const paths = await transcriptPaths((dir) => $.fs.list(dir), root, Date.UTC(year, 0, 1));
  const ran = await $.process.run(["awk", "-v", `YEAR=${year}`, AWK], { stdin: paths.join(`
`), timeoutMs: SCAN_TIMEOUT_MS });
  if (ran.exitCode !== 0)
    throw new Error(ran.stderr.trim().slice(0, 200) || `awk ended with ${ran.exitCode}`);
  const raw = parseOutput(ran.stdout);
  const wrapped = wrappedOf(raw, { year, readAt: await $.clock.now() });
  if (wrapped === null)
    return null;
  const shown = new Set([...wrapped.projects.map((row) => row.name), ...wrapped.months.flatMap((month) => month.project === null ? [] : [month.project])]);
  const places = [...new Set([...Object.keys(raw.places), ...raw.monthProjects.map((row) => row.name)])];
  return { ...wrapped, projectKinds: await projectKinds(places, shown, { list: (dir) => $.fs.list(dir), read: (path) => $.fs.read(path) }) };
}
function readYear($, year) {
  $.clock.after(1, async () => {
    try {
      const wrapped = await scanYear($, year);
      if (wrapped === null) {
        await update($, viewAtom, () => ({ status: "empty", year }));
        return;
      }
      await $.store.set(keyOf(year), wrapped).catch((error) => $.ui.log(`wrapped: reading not kept (${why(error)})`, { to: "debug" }));
      await update($, viewAtom, () => ({ status: "ready", wrapped }));
      await writeHub($, wrapped);
    } catch (error) {
      await update($, viewAtom, () => ({ status: "failed", year, reason: why(error) }));
    }
  });
}
async function hubFromStore($) {
  await writeHub($, await kept($, yearOf(await $.clock.now())));
}
async function kept($, year) {
  const saved = await $.store.get(keyOf(year)).catch(() => {
    return;
  });
  return isWrapped(saved) ? saved : null;
}
async function clearNotes($) {
  await update($, sharedAtom, () => null);
  await update($, pageAtom, () => 0);
  await update($, filmAtom, (film) => film?.status === "making" ? film : null);
}
async function showYear($, year) {
  const current = await read($, viewAtom);
  if (current.status === "reading")
    return;
  await clearNotes($);
  const wrapped = await kept($, year);
  if (wrapped !== null) {
    await update($, viewAtom, () => ({ status: "ready", wrapped }));
    return;
  }
  await update($, viewAtom, () => ({ status: "reading", year }));
  readYear($, year);
}
async function openPane($, year) {
  await showYear($, year);
  await $.ui.open({ id: PANE, title: words().paneTitle });
  try {
    if ((await $.state.get({ plugin: "modz", key: "isOn" })).value === true)
      await $.state.set({ plugin: "wrapped", key: "shown" }, shownOf(PANE, await $.clock.now()));
  } catch {
    $.ui.log("wrapped: could not tell the hub the pane is shown", { to: "debug" });
  }
}
function filmIo($) {
  return {
    write: (path, text) => $.fs.write(path, text),
    run: (argv) => $.process.run(argv, { timeoutMs: FILM_STEP_TIMEOUT_MS }),
    progress: (made, total) => update($, filmAtom, () => ({ status: "making", made, total }))
  };
}
async function runFilm($, spec) {
  const home = await $.env.get("HOME");
  const temp = await $.env.get("TMPDIR");
  const dir = `${(typeof temp === "string" && temp !== "" ? temp : "/tmp").replace(/\/+$/, "")}/wrapped-film-${spec.wrapped.year}`;
  const out = `${home}/Downloads/wrapped-${spec.wrapped.year}.mp4`;
  try {
    await $.process.run(["ffmpeg", "-version"]).catch(() => {
      throw new Error(words().filmNoFfmpeg);
    });
    await makeFilm(filmIo($), spec, { dir, out });
    await update($, filmAtom, () => ({ status: "ready", path: out }));
    await $.process.run(["open", out]).catch(() => $.ui.log("wrapped: the video did not open by itself", { to: "debug" }));
  } catch (error) {
    await update($, filmAtom, () => ({ status: "failed", reason: why(error) }));
  } finally {
    await $.process.run(["rm", "-rf", dir]).catch(() => $.ui.log("wrapped: film frames not removed", { to: "debug" }));
  }
}
async function startFilm($, spec) {
  if ((await read($, filmAtom))?.status === "making")
    return;
  await update($, filmAtom, () => ({ status: "making", made: 0, total: 1 }));
  $.clock.after(1, () => runFilm($, spec));
}
const ENTER = "<style>:root{color-scheme:dark}body{margin:0}svg{display:block;animation:m-in .32s cubic-bezier(.22,1,.36,1)}@keyframes m-in{from{opacity:0;transform:translateY(10px)}}@media (prefers-reduced-motion: reduce){svg{animation:none}}</style>";
function navTree($, ui, view, count) {
  const { Box, Text, Button } = ui;
  const t = panelWords();
  const move = (by) => () => update($, pageAtom, (page) => Math.max(0, Math.min(count - 1, page + by)));
  return h(Box, {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 1
  }, h(Button, {
    key: "back",
    label: `‹ ${t.back}`,
    variant: "secondary",
    onPress: move(-1)
  }), h(Button, {
    key: "next",
    label: `${t.next} ›`,
    variant: "primary",
    onPress: move(1)
  }), h(Text, {
    dimColor: true
  }, t.page(view.page + 1, count)));
}
const shareIo = ($) => ({
  home: () => $.env.get("HOME"),
  write: (path, text) => $.fs.write(path, text),
  run: (argv, timeoutMs) => $.process.run(argv, { timeoutMs })
});
function shareTree($, ui, view) {
  const { Box, Text, Button } = ui;
  const { spec, shared, film } = view;
  const t = words();
  const p = panelWords();
  const note = (press) => async () => {
    const done = await press(spec);
    await update($, sharedAtom, () => done);
  };
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1,
    flexWrap: "wrap"
  }, h(Button, {
    key: "copy-image",
    label: p.copyImage,
    variant: "secondary",
    onPress: note((s) => copyImage(shareIo($), s))
  }), h(Button, {
    key: "share-x",
    label: p.shareX,
    variant: "secondary",
    onPress: note((s) => shareOnX(shareIo($), s))
  }), h(Button, {
    key: "film",
    label: t.filmMake,
    variant: "secondary",
    onPress: () => startFilm($, spec)
  })), h(Box, {
    flexDirection: "row",
    columnGap: 1,
    flexWrap: "wrap"
  }, h(Button, {
    key: "names",
    label: spec.isNamed ? t.hideNames : t.showNames,
    plain: true,
    dimColor: true,
    onPress: () => update($, namedAtom, (is) => !is)
  }), h(Button, {
    key: "again",
    label: t.readAgain,
    plain: true,
    dimColor: true,
    onPress: () => rereadYear($, spec.wrapped.year)
  })), h(Text, {
    dimColor: true
  }, spec.isNamed ? p.namesShown : p.namesHidden), shared !== null && h(Text, {
    dimColor: true
  }, sharedLine(shared)), film !== null && h(Text, {
    dimColor: true
  }, filmLine(film)));
}
function readyTree($, ui, view) {
  const { Box, Text, Svg } = ui;
  const { spec, surface, columns, rows } = view;
  const canDraw = Svg !== undefined && surface !== "terminal";
  const count = slidesFor(spec.wrapped).length;
  const pic = pagePic(spec, view.page, pageWidth(columns || DEFAULT_COLUMNS, rows));
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, canDraw ? h(Svg, {
    key: "wrapped-page",
    ...pic,
    source: pic.source.replace(/(<svg[^>]*>)/, `$1${ENTER}`),
    isInteractive: true
  }) : h(Text, null, cardText(spec)), canDraw && navTree($, ui, view, count), shareTree($, ui, view), h(Text, {
    dimColor: true
  }, words().readAt(dayKey(spec.wrapped.readAt))));
}
async function rereadYear($, year) {
  await clearNotes($);
  await update($, viewAtom, () => ({ status: "reading", year }));
  readYear($, year);
}
async function goHome($) {
  try {
    await $.state.set({ plugin: "wrapped", key: "home" }, { at: await $.clock.now() });
  } catch {
    $.ui.log("wrapped: could not go back to the hub", { to: "debug" });
  }
}
const register = (on) => {
  on("session.start", async ($, e, next) => {
    setLang(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    await $.command.register({ name: "wrapped", description: words().commandHelp });
    await hubFromStore($).catch(() => $.ui.log("wrapped: no hub card", { to: "debug" }));
    return next(e);
  });
  on("classic.SessionStart", async ($, e, next) => {
    const root = rootOf(typeof e.transcript_path === "string" ? e.transcript_path : "");
    if (root !== "")
      await update($, rootAtom, () => root);
    return next(e);
  }).catch(($, e, next) => next(e));
  on("command.run", { command: "wrapped" }, async ($, e) => {
    const asked = e.args.trim();
    if (asked !== "" && !YEAR.test(asked))
      return { text: words().badYear };
    await openPane($, asked === "" ? yearOf(await $.clock.now()) : Number(asked));
    return { text: words().opened };
  });
  on("state.set", { plugin: "modz", key: "open" }, async ($, e, next) => {
    const done = await next(e);
    if (isAskedFor(e.value, PANE))
      await openPane($, yearOf(await $.clock.now()));
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "modz", key: "stage" }, async ($, e, next) => {
    const done = await next(e);
    if (isOffStage(e.value, PANE))
      await $.ui.close({ id: PANE });
    return done;
  }).catch(($, e, next) => next(e));
  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e);
    const view = await read($, viewAtom);
    const isHubOn = (await $.state.get({ plugin: "modz", key: "isOn" }).catch(() => ({ value: false }))).value === true;
    const tree = view.status === "ready" ? readyTree($, ui, { spec: { wrapped: view.wrapped, isNamed: await read($, namedAtom) }, page: await read($, pageAtom), shared: await read($, sharedAtom), film: await read($, filmAtom), surface: e.surface, columns: e.props.bodyColumns, rows: e.props.scroll?.bodyRows ?? 0 }) : stateTree(ui, linesOf(view));
    return pinned(e, withHome(ui, tree, isHubOn ? () => goHome($) : null));
  });
};

export { register };
