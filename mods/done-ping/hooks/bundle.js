// Built by `bin/modz build` from the files beside it. Never edited by hand.
import { atom, read, update } from 'claude-code';

const AUTO = { mode: "auto", isLight: false };
const NEUTRALS = ["card", "inset", "line", "strong", "track", "hi", "mid", "lo"];
const ROLES = ["tide", "kiln", "iris", "moss", "amber", "flare", "orchid"];
const DARK = {
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
const LIGHT = {
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
function themeFrom(value) {
  const name = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (name === "light")
    return { mode: "light", isLight: true };
  if (name === "dark")
    return { mode: "dark", isLight: false };
  return AUTO;
}
const varsOf = (palette) => [
  ...NEUTRALS.map((name) => `--${name}:${palette[name]}`),
  ...ROLES.flatMap((role) => [`--${role}:${palette[role].fg}`, `--${role}-t:${palette[role].tint}`, `--${role}-l:${palette[role].line}`])
].join(";");
function themeCss() {
  return `svg,.t-dark{${varsOf(DARK)}}.t-light{${varsOf(LIGHT)}}@media (prefers-color-scheme: light){.t-auto{${varsOf(LIGHT)}}}`;
}

const SANS = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`;
const MONO = `ui-monospace, 'SF Mono', Menlo, monospace`;
const PX_PER_COLUMN = 7;
const MONO_EM = 0.6;
const BOLD_FROM = 600;
const BOLD_WIDEN = 1.06;
const ICON_GRID = 24;
const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const MOTION = [
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
  play: '<path d="M8 5.5v13l10.5-6.5z"/>'
};
const esc = (text) => text.replace(/[&<>"]/g, (ch) => ENTITIES[ch] ?? ch);
const px = (value) => String(Math.round(value * 10) / 10);
const NARROW_CHAR = /[\s.,:;'|!il1()[\]ıjtf`]/;
const WIDE_CHAR = /[A-ZÇĞİÖŞÜmwMW@%]/;
const NARROW_EM = 0.3;
const WIDE_EM = 0.72;
const PLAIN_EM = 0.56;
function charEm(ch) {
  if (NARROW_CHAR.test(ch))
    return NARROW_EM;
  return WIDE_CHAR.test(ch) ? WIDE_EM : PLAIN_EM;
}
function measure(text, font) {
  const chars = [...text];
  const em = font.isMono === true ? chars.length * MONO_EM : chars.reduce((sum, ch) => sum + charEm(ch), 0);
  const widen = (font.weight ?? 0) >= BOLD_FROM ? BOLD_WIDEN : 1;
  return em * font.size * widen + chars.length * (font.spacing ?? 0);
}
function svgWidth(columns, range) {
  const room = (columns - (range.reserve ?? 0)) * PX_PER_COLUMN;
  return Math.round(Math.max(range.min, Math.min(range.max, room)));
}
function svgDoc(spec) {
  const { width, height } = spec;
  const style = `${themeCss()}text{font-family:${SANS};font-variant-numeric:tabular-nums}.mono{font-family:${MONO}}${MOTION}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="t-${spec.mode}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><style>${style}</style>${spec.body}</svg>`;
}
function runs(spec) {
  const spans = spec.parts.map((part) => {
    const weight = (part.weight === undefined ? "" : ` font-weight="${part.weight}"`) + (part.size === undefined ? "" : ` font-size="${part.size}"`);
    const mono = part.isMono === true ? ' class="mono"' : "";
    return `<tspan${weight}${mono} style="fill:var(--${part.ink})">${esc(part.text)}</tspan>`;
  });
  return `<text x="${px(spec.x)}" y="${px(spec.y)}" font-size="${spec.size}">${spans.join("")}</text>`;
}
function icon(name, at) {
  const scale = at.size / ICON_GRID;
  const width = (at.stroke ?? 1.75) / scale;
  return `<g transform="translate(${px(at.x)} ${px(at.y)}) scale(${scale})" fill="none" stroke-width="${px(width)}" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--${at.ink})">${ICONS[name]}</g>`;
}

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const pick = (table) => table[current];

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const TR = {
  hours: (hours, minutes) => `${hours}sa ${minutes}dk`,
  minutes: (minutes, seconds) => `${minutes}dk ${seconds}sn`,
  seconds: (seconds) => `${seconds}sn`,
  testsPassed: "testler geçti",
  testsFailed: "testler kaldı",
  files: (count) => `${count} dosya`,
  filesChanged: (count) => `${count} dosya değişti`,
  took: (duration) => `${duration} sürdü`,
  done: "Tur bitti",
  stoppedOnError: "Hatayla durdu",
  refused: "Claude reddetti",
  bannersOff: "done-ping: terminal-notifier bildirimleri Sistem Ayarları › Bildirimler bölümünde kapalı; macOS’un yerleşik yolu (osascript) kullanılıyor",
  bashCommand: "komut çalıştırma izni",
  toolPermission: (tool) => `${tool} izni`,
  tools: {
    Edit: "dosya düzenleme",
    MultiEdit: "dosya düzenleme",
    Write: "dosya yazma",
    Read: "dosya okuma",
    NotebookEdit: "not defteri düzenleme",
    Glob: "dosya arama",
    Grep: "dosya arama",
    WebFetch: "web sayfası",
    WebSearch: "web araması",
    Agent: "yardımcı ajan",
    Task: "yardımcı ajan"
  },
  waitingApproval: "Onay bekliyor",
  waitingAnswer: "Cevap bekliyor",
  hasQuestion: "Bir sorusu var",
  more: (count) => `ve ${count} sohbet daha`,
  testSent: "done-ping: deneme bildirimi gönderildi",
  usage: "Şöyle yazılır: /done-ping [saniye | 2m | test]",
  thresholdSet: (seconds) => `done-ping: ${seconds}sn’den uzun süren turlarda haber verir`,
  switched: (isOn, seconds) => `done-ping ${isOn ? "açık" : "kapalı"} · ${seconds}sn’den uzun turlarda`,
  help: 'Bildirimi aç/kapat; "/done-ping 90" bir turun en az ne kadar sürmesi gerektiğini ayarlar, "test" bir kez çalar'
};
const EN = {
  hours: (hours, minutes) => `${hours}h ${minutes}m`,
  minutes: (minutes, seconds) => `${minutes}m ${seconds}s`,
  seconds: (seconds) => `${seconds}s`,
  testsPassed: "tests passed",
  testsFailed: "tests failed",
  files: (count) => plural(count, "file", "files"),
  filesChanged: (count) => `${plural(count, "file", "files")} changed`,
  took: (duration) => `took ${duration}`,
  done: "Turn finished",
  stoppedOnError: "Stopped on an error",
  refused: "Claude declined",
  bannersOff: "done-ping: terminal-notifier notifications are turned off in System Settings › Notifications; using the built-in macOS way (osascript)",
  bashCommand: "permission to run a command",
  toolPermission: (tool) => `${tool} permission`,
  tools: {
    Edit: "file edit",
    MultiEdit: "file edit",
    Write: "file write",
    Read: "file read",
    NotebookEdit: "notebook edit",
    Glob: "file search",
    Grep: "file search",
    WebFetch: "web page",
    WebSearch: "web search",
    Agent: "helper agent",
    Task: "helper agent"
  },
  waitingApproval: "Waiting for approval",
  waitingAnswer: "Waiting for an answer",
  hasQuestion: "Has a question",
  more: (count) => `and ${plural(count, "more chat", "more chats")}`,
  testSent: "done-ping: test notification sent",
  usage: "Write it as: /done-ping [seconds | 2m | test]",
  thresholdSet: (seconds) => `done-ping: tells you when a turn runs longer than ${seconds}s`,
  switched: (isOn, seconds) => `done-ping ${isOn ? "on" : "off"} · for turns over ${seconds}s`,
  help: 'Turn the notification on or off; "/done-ping 90" sets how long a turn must run before it tells you, "test" rings once'
};
const words = () => pick({ en: EN, tr: TR });

const ROW_H = 28;
const BELL = 16;
const TEXT_X = 26;
const TITLE = { size: 13, weight: 560 };
const DETAIL = { size: 12 };
const DISMISS_RESERVE = 6;
const SEP = " · ";
const BELL_INK = { done: "mid", fail: "flare", wait: "amber" };
const MARK = { done: { glyph: "✓", color: "success" }, fail: { glyph: "✕", color: "error" }, wait: { glyph: "!", color: "warning" } };
function factsThatFit(detail, room) {
  const facts = detail === "" ? [] : detail.split(SEP);
  while (facts.length > 0 && measure(SEP + facts.join(SEP), DETAIL) > room)
    facts.pop();
  return facts.length === 0 ? "" : SEP + facts.join(SEP);
}
function rowSvg(band) {
  const { notice } = band;
  const room = svgWidth(band.columns, { reserve: DISMISS_RESERVE, min: 200, max: 1200 });
  const rest = factsThatFit(notice.detail, room - TEXT_X - measure(notice.title, TITLE));
  const width = Math.min(room, Math.ceil(TEXT_X + measure(notice.title, TITLE) + measure(rest, DETAIL) + 4));
  const body = icon("bell", { x: 0, y: (ROW_H - BELL) / 2, size: BELL, ink: BELL_INK[notice.kind], stroke: 1.5 }) + runs({ x: TEXT_X, y: 18.5, size: DETAIL.size, parts: [{ text: notice.title, ink: "hi", weight: TITLE.weight, size: TITLE.size }, { text: rest, ink: "lo" }] });
  return { source: svgDoc({ width, height: ROW_H, mode: band.theme.mode, body }), width };
}
function pingRow(ui, band, theirs) {
  const { Box, Text, Button, Svg } = ui;
  const { notice } = band;
  const mark = MARK[notice.kind];
  const text = notice.detail === "" ? notice.title : `${notice.title} · ${notice.detail}`;
  const drawn = band.isRich ? rowSvg(band) : null;
  return h(Box, {
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 1
  }, drawn === null && h(Text, {
    color: mark.color
  }, mark.glyph), drawn === null ? h(Text, {
    wrap: "truncate"
  }, text) : h(Svg, {
    source: drawn.source,
    alt: text,
    width: drawn.width,
    height: ROW_H
  }), h(Button, {
    key: "done-ping-dismiss",
    plain: true,
    dimColor: true,
    role: "dismiss",
    label: "✕",
    onPress: band.onDismiss
  })), theirs);
}
const OTHERS_SHOWN = 3;
function othersRow(ui, others, theirs) {
  const { Box, Text, Button } = ui;
  const w = words();
  const more = others.list.length - OTHERS_SHOWN;
  return h(Box, {
    flexDirection: "column"
  }, others.list.slice(0, OTHERS_SHOWN).map((need, index) => h(Box, {
    key: need.key,
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    color: MARK.wait.color
  }, MARK.wait.glyph), h(Text, {
    wrap: "truncate"
  }, need.where, " ", h(Text, {
    dimColor: true
  }, "· ", need.isApproval ? w.waitingApproval : w.waitingAnswer)), index === 0 && h(Button, {
    key: "done-ping-others-dismiss",
    plain: true,
    dimColor: true,
    role: "dismiss",
    label: "✕",
    onPress: others.onDismiss
  }))), more > 0 && h(Text, {
    dimColor: true
  }, w.more(more)), theirs);
}

const POLL_MS = 4000;
const PS_TIMEOUT_MS = 5000;
function whereOf(s) {
  const folder = (typeof s.cwd === "string" ? s.cwd : "").split(/[\\/]/).filter(Boolean).pop() ?? "Claude";
  const isNamed = typeof s.name === "string" && s.name !== "" && s.nameSource !== "derived";
  return isNamed ? `${folder} · ${s.name}` : folder;
}
function isWaiting(s, self) {
  const isOther = typeof s.sessionId === "string" && s.sessionId !== self;
  const isProgram = s.entrypoint === "sdk-cli";
  return isOther && !isProgram && s.status === "waiting" && s.waitingFor !== "dialog open";
}
async function sessionsDir(io) {
  return `${(await io.configDir()).replace(/[\\/]+$/, "")}/sessions`;
}
async function statuses(io, dir) {
  const entries = await io.list(dir).catch(() => []);
  const names = entries.filter((f) => f.kind === "file" && /^\d+\.json$/.test(f.name)).map((f) => f.name);
  const rows = await Promise.all(names.map((name) => io.read(`${dir}/${name}`).then((text) => JSON.parse(String(text))).catch(() => null)));
  return rows.filter((row) => row !== null && typeof row === "object");
}
async function alive(io, pids) {
  if (pids.length === 0)
    return new Set;
  try {
    const { exitCode, stdout, stderr } = await io.run(["ps", "-o", "pid=", "-p", pids.join(",")], { timeoutMs: PS_TIMEOUT_MS });
    if (exitCode !== 0 && (exitCode !== 1 || stderr.trim() !== ""))
      return new Set(pids);
    return new Set(stdout.split(/\s+/).filter(Boolean).map(Number));
  } catch {
    return new Set(pids);
  }
}
async function waitingOthers(io, dir) {
  const self = await io.sessionId();
  const waiting = (await statuses(io, dir)).filter((s) => isWaiting(s, self));
  const live = await alive(io, waiting.map((s) => Number(s.pid)).filter((pid) => Number.isInteger(pid) && pid > 0));
  return waiting.filter((s) => live.has(Number(s.pid))).map((s) => ({ key: `${String(s.sessionId)}:${String(s.waitingFor)}`, where: whereOf(s), isApproval: s.waitingFor === "permission prompt" }));
}
function othersWatcher(io) {
  let dir = null;
  let looks = 0;
  let applied = 0;
  let hidden = new Set;
  return {
    look: async () => {
      const mine = ++looks;
      dir ??= await sessionsDir(io);
      const list = await waitingOthers(io, dir);
      if (mine < applied)
        return null;
      applied = mine;
      hidden = new Set([...hidden].filter((key) => list.some((need) => need.key === key)));
      return list.filter((need) => !hidden.has(need.key));
    },
    hide: (list) => {
      hidden = new Set([...hidden, ...list.map((need) => need.key)]);
    }
  };
}

const SOUND_PACKS = ["off", "chime", "soft", "retro"];
function packOf(value) {
  return SOUND_PACKS.find((pack) => pack === value) ?? "off";
}
function packAsset(pack, kind) {
  if (pack === "off")
    return null;
  return `sounds/${pack}/${kind === "wait" ? "wait" : "done"}.wav`;
}

const MS_PER_SECOND$1 = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const DEFAULT_THRESHOLD = 60;
const DEFAULT_SOUND = "Glass";
const SILENT$1 = "none";
const BODY_CHARS = 80;
const EDIT_TOOLS = ["Edit", "Write", "MultiEdit", "NotebookEdit"];
const PATH_KEYS = ["file_path", "notebook_path", "path"];
const FILE_KEYS = ["file_path", "notebook_path", "path"];
const TEST_COMMAND = /\b(?:(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test|vitest|jest|pytest|mocha|playwright\s+test|go\s+test|cargo\s+test|flutter\s+test|dart\s+test|phpunit|rspec)\b/;
function configFrom(options) {
  const threshold = Number(options.thresholdSeconds);
  const soundPack = packOf(options.soundPack);
  const banner = typeof options.sound === "string" ? options.sound.trim() : DEFAULT_SOUND;
  const sound = soundPack === "off" ? banner : SILENT$1;
  return {
    thresholdSeconds: Number.isFinite(threshold) && threshold >= 0 ? threshold : DEFAULT_THRESHOLD,
    isPermissionPing: options.pingOnPermission !== false,
    sound,
    soundPack,
    isQuietWhenFocused: options.quietWhenFocused !== false,
    isAppNotification: options.appNotification !== false
  };
}
function durationText(ms) {
  const seconds = Math.max(0, Math.round(ms / MS_PER_SECOND$1));
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  if (hours > 0)
    return words().hours(hours, minutes % MINUTES_PER_HOUR);
  if (minutes > 0)
    return words().minutes(minutes, seconds % SECONDS_PER_MINUTE);
  return words().seconds(seconds);
}
function projectOf(cwd) {
  const parts = cwd.split("/").filter((part) => part !== "");
  return parts[parts.length - 1] ?? "Claude";
}
function editedPath(input) {
  if (typeof input.tool !== "string" || !EDIT_TOOLS.includes(input.tool))
    return null;
  for (const key of PATH_KEYS) {
    const value = input[key];
    if (typeof value === "string" && value !== "")
      return value;
  }
  return null;
}
function clip(text, max = BODY_CHARS) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}
function plainSnippet(markdown) {
  const text = markdown.replace(/```[\s\S]*?(```|$)/g, " ").replace(/`[^`\n]*`/g, " ").replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/^\s{0,3}(#{1,6}|[-*+>]|\d+\.)\s+/gm, "").replace(/[*_`~|]/g, "");
  return clip(text);
}
const isTestCommand = (command) => typeof command === "string" && TEST_COMMAND.test(command);
function testsText(tests) {
  if (tests === null)
    return "";
  return tests === "pass" ? words().testsPassed : words().testsFailed;
}
function donePing(spec) {
  const took = durationText(spec.durationMs);
  const tests = testsText(spec.tests);
  const says = words();
  const hasFiles = spec.files > 0;
  const body = [tests, hasFiles ? says.files(spec.files) : ""].filter((part) => part !== "").join(" · ") || says.took(took);
  const detail = [tests, hasFiles ? says.filesChanged(spec.files) : "", took].filter((part) => part !== "").join(" · ");
  const kind = spec.tests === "fail" ? "fail" : "done";
  return { kind, project: spec.project, title: says.done, subtitle: spec.project, body, detail };
}
function endPing(e) {
  const { project, durationMs } = e;
  if (e.reason === "error" || e.reason === "refusal")
    return stoppedPing({ project, durationMs, reason: e.reason, answer: e.answer ?? "" });
  return donePing({ project, durationMs, files: e.files, tests: e.tests });
}
function stoppedPing(spec) {
  const says = words();
  const title = spec.reason === "error" ? says.stoppedOnError : says.refused;
  const body = plainSnippet(spec.answer) || says.took(durationText(spec.durationMs));
  return { kind: "fail", project: spec.project, title, subtitle: spec.project, body, detail: body };
}
function baseName(path) {
  return path.split("/").filter((part) => part !== "").pop() ?? path;
}
function toolName(tool) {
  const known = words().tools[tool];
  if (known !== undefined)
    return known;
  const mcp = /^mcp__.+?__(.+)$/.exec(tool)?.[1];
  return mcp === undefined ? tool : mcp.replace(/[_-]+/g, " ").trim() || tool;
}
function toolDetail(tool, input) {
  if (tool === "Bash")
    return words().bashCommand;
  const name = toolName(tool);
  for (const key of FILE_KEYS) {
    const value = input[key];
    if (typeof value === "string" && value.trim() !== "")
      return `${name} · ${clip(baseName(value), BODY_CHARS)}`;
  }
  const host = typeof input.url === "string" ? /^https?:\/\/([^/?#]+)/.exec(input.url)?.[1] : undefined;
  return host === undefined ? words().toolPermission(name) : `${name} · ${host}`;
}
function questionOf(input) {
  const questions = Array.isArray(input.questions) ? input.questions : [];
  const first = questions[0];
  return typeof first?.question === "string" ? plainSnippet(first.question) : "";
}
function permissionPing(project, tool, input) {
  const body = toolDetail(tool, input);
  return { kind: "wait", project, title: words().waitingApproval, subtitle: project, body, detail: body };
}
function questionPing(project, input) {
  const body = questionOf(input) || words().hasQuestion;
  return { kind: "wait", project, title: words().waitingAnswer, subtitle: project, body, detail: body };
}
function parseSeconds(text) {
  const match = /^(\d+)\s*(s|sn|sec|secs|seconds|m|dk|min|mins|minutes)?$/i.exec(text.trim());
  if (match === null)
    return null;
  const value = Number(match[1]);
  const unit = (match[2] ?? "").toLowerCase();
  const isMinutes = unit.startsWith("m") || unit === "dk";
  return isMinutes ? value * SECONDS_PER_MINUTE : value;
}

const SYSTEM_SOUNDS = /^\/System\/Library\/Sounds\/([A-Za-z]+)\.aiff$/;
const SILENT = ["", "none", "off", "yok", "sessiz"];
const NOTIFIER_PATHS = ["/opt/homebrew/bin/terminal-notifier", "/usr/local/bin/terminal-notifier"];
function soundOf(setting) {
  const text = setting.trim();
  if (SILENT.includes(text.toLowerCase()))
    return { kind: "none" };
  const system = SYSTEM_SOUNDS.exec(text);
  if (system?.[1] !== undefined)
    return { kind: "name", name: system[1] };
  if (text.includes("/"))
    return { kind: "file", path: text };
  return { kind: "name", name: text };
}
function osascriptArgv(ping, sound) {
  const withSound = sound.kind === "name" ? " sound name (item 4 of argv)" : "";
  const script = `display notification (item 1 of argv) with title (item 2 of argv) subtitle (item 3 of argv)${withSound}`;
  const argv = ["osascript", "-e", "on run argv", "-e", script, "-e", "end run", ping.body, ping.title, ping.subtitle];
  return sound.kind === "name" ? [...argv, sound.name] : argv;
}
function terminalNotifierArgv(spec) {
  const { ping, sound, sender } = spec;
  const argv = [spec.path, "-title", ping.title, "-subtitle", ping.subtitle, "-message", ping.body, "-group", `done-ping:${ping.project}`];
  if (sender !== null)
    argv.push("-sender", sender, "-activate", sender);
  if (sound.kind === "name")
    argv.push("-sound", sound.name);
  return argv;
}
function afplayArgv(sound) {
  return sound.kind === "file" ? ["afplay", sound.path] : null;
}
function frontBundleOf(lsappinfo) {
  const match = /(?:"CFBundleIdentifier"|bundleID)\s*=\s*"([^"]+)"/i.exec(lsappinfo);
  return match?.[1] ?? null;
}
function asnOf(front) {
  const match = /ASN:[0-9a-fx-]+/i.exec(front);
  return match?.[0] ?? null;
}

const PUSH_TOOL = "PushNotification";
const DESKTOP_BUNDLE = "com.anthropic.claudefordesktop";
const RUN_TIMEOUT_MS = 5000;
function appMessage(ping) {
  return `${ping.title} · ${ping.project}
${ping.body}`;
}
async function appNotify(io, spec) {
  const surfaces = await io.surfaces();
  if (!surfaces.includes("desktop"))
    return "unavailable";
  if (!(await io.toolNames()).includes(PUSH_TOOL))
    return "unavailable";
  const input = { message: appMessage(spec.ping), status: "proactive" };
  if (await io.checkTool(PUSH_TOOL, input) !== "allow")
    return "unavailable";
  const ran = await io.callTool(PUSH_TOOL, input);
  const result = ran?.result ?? {};
  if (result.localSent === true || result.pushSent === true)
    return "sent";
  if (result.disabledReason === "user_present" && !spec.isForced)
    return "present";
  return "unavailable";
}
async function hostBundle(io) {
  const value = await io.hostBundle();
  return value === undefined || value.trim() === "" ? null : value.trim();
}
async function isDesktop(io) {
  try {
    const surfaces = await io.surfaces();
    if (surfaces.includes("desktop"))
      return true;
    if (surfaces.includes("terminal"))
      return false;
    return await hostBundle(io) === DESKTOP_BUNDLE;
  } catch {
    return false;
  }
}
async function isHostFrontmost(io, host) {
  if (host === null)
    return false;
  const front = await io.run(["lsappinfo", "front"], { timeoutMs: RUN_TIMEOUT_MS });
  const asn = asnOf(front.stdout);
  if (front.exitCode !== 0 || asn === null)
    return false;
  const info = await io.run(["lsappinfo", "info", "-only", "bundleid", asn], { timeoutMs: RUN_TIMEOUT_MS });
  return frontBundleOf(info.stdout) === host;
}
async function notifierPath(io) {
  for (const path of NOTIFIER_PATHS) {
    if (await io.exists(path))
      return path;
  }
  return null;
}
async function banner(io, note) {
  const { ping, sound, host } = note;
  const notifier = await notifierPath(io);
  if (notifier !== null) {
    const argv = terminalNotifierArgv({ path: notifier, ping, sound, sender: host });
    const shown = await io.run(argv, { timeoutMs: RUN_TIMEOUT_MS });
    if (shown.exitCode === 0)
      return true;
    io.notifierOff();
  }
  if (note.isDesktop)
    return false;
  const shown = await io.run(osascriptArgv(ping, sound), { timeoutMs: RUN_TIMEOUT_MS });
  return shown.exitCode === 0;
}
async function tryApp(io, spec) {
  if (!spec.config.isAppNotification)
    return "unavailable";
  try {
    return await appNotify(io, spec);
  } catch (error) {
    io.log(`done-ping: app notification unavailable (${error instanceof Error ? error.message : "unknown"})`);
    return "unavailable";
  }
}
async function ring(io, spec) {
  const app = await tryApp(io, spec);
  if (app === "sent")
    return "app";
  if (app === "present")
    return "quiet";
  const host = await hostBundle(io);
  const shouldCheckFocus = spec.config.isQuietWhenFocused && !spec.isForced;
  if (shouldCheckFocus && await isHostFrontmost(io, host).catch(() => false))
    return "quiet";
  const sound = soundOf(spec.config.sound);
  const isShown = await banner(io, { ping: spec.ping, sound, host, isDesktop: await isDesktop(io) }).catch(() => false);
  const play = afplayArgv(sound);
  if (isShown && play !== null) {
    await io.run(play, { timeoutMs: RUN_TIMEOUT_MS }).catch(() => io.log("done-ping: afplay failed"));
  }
  return isShown ? "system" : "failed";
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

const COMMAND = "done-ping";
const ENABLED_KEY = `${COMMAND}.enabled`;
const THRESHOLD_KEY = `${COMMAND}.thresholdSeconds`;
const MS_PER_SECOND = 1000;
const WAIT_GAP_MS = 15000;
const PING_GAP_MS = 1e4;
const DISMISS_AFTER_MS = 20000;
const SAMPLE = { durationMs: 134000, files: 3, tests: "pass" };
const cacheTaxNotice = { plugin: "cache-tax", key: "notice" };
const knowNotice = { plugin: "you-should-know", key: "notice" };
const reflectNotice = { plugin: "reflect", key: "notice" };
const budgetNotice = { plugin: "session-budget", key: "notice" };
const testBadgeNotice = { plugin: "test-badge", key: "notice" };
const handoffNotice = { plugin: "handoff", key: "notice" };
const planNotice = { plugin: "plan-steps", key: "notice" };
const enabledAtom = atom({ plugin: "done-ping", key: "isEnabled" }, true);
const thresholdAtom = atom({ plugin: "done-ping", key: "thresholdSeconds" }, null);
const noticeAtom = atom({ plugin: "done-ping", key: "notice" }, null);
const themeAtom = atom({ plugin: "done-ping", key: "theme" }, AUTO);
const othersAtom = atom({ plugin: "done-ping", key: "others" }, []);
const session = {
  project: "Claude",
  lastWaitAt: -WAIT_GAP_MS,
  lastPingAt: -PING_GAP_MS,
  files: new Set,
  tests: null,
  noticeId: 0,
  isBannersOffSaid: false
};
async function showNotice($, ping) {
  session.noticeId += 1;
  const id = session.noticeId;
  const expiresAt = await $.clock.now() + DISMISS_AFTER_MS;
  await update($, noticeAtom, () => ({ id, kind: ping.kind, title: ping.title, detail: ping.detail, expiresAt }));
  $.clock.after(DISMISS_AFTER_MS, () => {
    update($, noticeAtom, (current) => current !== null && current.id === id ? null : current);
  });
}
const others = { watcher: null };
async function lookAtOthers($) {
  if (!await read($, enabledAtom))
    return;
  const shown = await others.watcher?.look();
  if (shown == null)
    return;
  await update($, othersAtom, (current) => JSON.stringify(current) === JSON.stringify(shown) ? current : shown);
}
async function watchOthers($) {
  others.watcher = othersWatcher({
    configDir: async () => await $.env.get("CLAUDE_CONFIG_DIR") || `${await $.env.get("HOME") || await $.env.get("USERPROFILE") || ""}/.claude`,
    list: (path) => $.fs.list(path),
    read: (path) => $.fs.read(path),
    run: (argv, init) => $.process.run(argv, init),
    sessionId: () => $.session.id()
  });
  await lookAtOthers($);
  $.clock.every(POLL_MS, () => void lookAtOthers($).catch(() => $.ui.log("done-ping: could not read other sessions", { to: "debug" })));
}
function ioOf($) {
  return {
    surfaces: () => $.session.surfaces(),
    toolNames: async () => (await $.tool.list()).map((tool) => tool.name),
    checkTool: async (tool, input) => (await $.tool.check({ tool, input })).decision,
    callTool: (tool, input) => $.tool.call({ tool, ...input }),
    hostBundle: () => $.env.get("__CFBundleIdentifier"),
    run: (argv, init) => $.process.run(argv, init),
    exists: (path) => $.fs.exists(path),
    log: (text) => $.ui.log(text, { to: "debug" }),
    notifierOff: () => {
      if (session.isBannersOffSaid)
        return;
      session.isBannersOffSaid = true;
      $.ui.log(words().bannersOff, { to: "transcript" });
    }
  };
}
async function playPack($, ping, config) {
  const asset = packAsset(config.soundPack, ping.kind);
  if (asset === null)
    return;
  try {
    await $.audio.play({ asset });
  } catch (error) {
    $.ui.log(`done-ping: sound did not play (${error instanceof Error ? error.message : "unknown"})`, { to: "debug" });
  }
}
async function deliver($, ping, spec) {
  let rung = "failed";
  try {
    rung = await ring(ioOf($), { ping, ...spec });
  } catch (error) {
    $.ui.log(`done-ping: ping failed (${error instanceof Error ? error.message : "unknown"})`, { to: "debug" });
  }
  if (rung === "quiet" && session.lastPingAt === spec.at)
    session.lastPingAt = spec.before;
  if (rung === "failed")
    await showNotice($, ping);
  if (rung !== "quiet")
    await playPack($, ping, spec.config);
}
async function later($, ping, spec) {
  const nowMs = await $.clock.now();
  if (!spec.isForced && nowMs - session.lastPingAt < PING_GAP_MS)
    return;
  const before = session.lastPingAt;
  session.lastPingAt = nowMs;
  $.clock.after(1, () => void deliver($, ping, { ...spec, at: nowMs, before }));
}
async function waitingOnUser($, ping, config) {
  if (!config.isPermissionPing || !await read($, enabledAtom))
    return;
  if (await isDesktop(ioOf($)))
    return;
  const nowMs = await $.clock.now();
  if (nowMs - session.lastWaitAt < WAIT_GAP_MS)
    return;
  session.lastWaitAt = nowMs;
  await later($, ping, { config, isForced: false });
}
async function thresholdOf($, config) {
  return await read($, thresholdAtom) ?? config.thresholdSeconds;
}
async function runCommand($, args, config) {
  const word = args.trim().toLowerCase();
  if (word === "test") {
    const ping = donePing({ project: session.project, ...SAMPLE });
    await later($, ping, { config, isForced: true });
    return { text: words().testSent };
  }
  const seconds = word === "" ? null : parseSeconds(word);
  if (word !== "" && seconds === null)
    return { text: words().usage };
  if (seconds !== null) {
    await update($, thresholdAtom, () => seconds);
    await $.store.set(THRESHOLD_KEY, seconds);
    return { text: words().thresholdSet(seconds) };
  }
  const isOn = !await read($, enabledAtom);
  await update($, enabledAtom, () => isOn);
  await $.store.set(ENABLED_KEY, isOn);
  return { text: words().switched(isOn, await thresholdOf($, config)) };
}
async function hasLouderNotice($) {
  const others = [
    await $.state.get(cacheTaxNotice),
    await $.state.get(knowNotice),
    await $.state.get(reflectNotice),
    await $.state.get(budgetNotice),
    await $.state.get(testBadgeNotice),
    await $.state.get(handoffNotice),
    await $.state.get(planNotice)
  ];
  return others.some((other) => other.value !== undefined && other.value !== null);
}
async function loadSettings($, cwd) {
  session.project = projectOf(cwd);
  const saved = await $.store.get(ENABLED_KEY);
  await update($, enabledAtom, () => saved !== false);
  const threshold = await $.store.get(THRESHOLD_KEY);
  if (typeof threshold === "number")
    await update($, thresholdAtom, () => threshold);
  const pinned = await $.env.get("MODZ_THEME").catch(() => {
    return;
  });
  await update($, themeAtom, () => themeFrom(pinned));
  await $.command.register({ name: COMMAND, description: words().help });
}
async function turnEnded($, e, config) {
  const isLong = e.durationMs >= await thresholdOf($, config) * MS_PER_SECOND;
  if (e.agentId !== undefined || e.isAborted || !isLong || !await read($, enabledAtom))
    return;
  const ping = endPing({ ...e, project: session.project, files: session.files.size, tests: session.tests });
  if (ping.kind !== "fail" && await isDesktop(ioOf($)))
    return;
  await later($, ping, { config, isForced: false });
}
function registerWaiting(on, config) {
  on("tool.call", async ($, e, next) => {
    if (e.tool === "AskUserQuestion") {
      const ping = questionPing(session.project, e);
      await waitingOnUser($, ping, config).catch(() => $.ui.log("done-ping: question ping failed", { to: "debug" }));
    }
    const ran = await next(e);
    const path = editedPath(e);
    const isRun = ran.deny === undefined;
    if (path !== null && isRun && ran.isError !== true)
      session.files.add(path);
    if (e.tool === "Bash" && isRun && isTestCommand(e.command))
      session.tests = ran.isError === true ? "fail" : "pass";
    return ran;
  }).catch(async ($, e, next) => next(e));
  on("tool.check", async ($, e, next) => {
    const verdict = await next(e);
    if (verdict.decision === "ask" && e.tool_use_id !== undefined) {
      const ping = permissionPing(session.project, String(e.tool), e.input ?? {});
      await waitingOnUser($, ping, config).catch(() => $.ui.log("done-ping: permission ping failed", { to: "debug" }));
    }
    return verdict;
  }).catch(async ($, e, next) => next(e));
}
const register = (on, options) => {
  const config = configFrom(options);
  on("session.start", async ($, e, next) => {
    setLang(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    await loadSettings($, e.cwd).catch(() => $.ui.log("done-ping: could not load settings", { to: "debug" }));
    if (config.isPermissionPing && !await isDesktop(ioOf($)))
      await watchOthers($).catch(() => $.ui.log("done-ping: could not watch other sessions", { to: "debug" }));
    return next(e);
  });
  on("command.run", { command: COMMAND }, async ($, e) => runCommand($, e.args, config));
  on("turn.start", async ($, e, next) => {
    session.files.clear();
    session.tests = null;
    return next(e);
  });
  registerWaiting(on, config);
  on("turn.complete", async ($, e, next) => {
    await turnEnded($, e, config).catch(() => $.ui.log("done-ping: done ping failed", { to: "debug" }));
    return next(e);
  });
  registerBand(on);
};
function registerBand(on) {
  on("prompt.submit", async ($, e, next) => {
    if (await read($, noticeAtom) !== null)
      await update($, noticeAtom, () => null);
    return next(e);
  }).catch(($, e, next) => next(e));
  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    const theirs = await next(e);
    const notice = await read($, noticeAtom);
    if (e.props.hasSurvey || await hasLouderNotice($))
      return theirs;
    if (notice === null)
      return othersBand($, e, theirs);
    const band = {
      notice,
      columns: e.props.bodyColumns,
      theme: await read($, themeAtom),
      isRich: e.surface !== "terminal",
      onDismiss: () => void update($, noticeAtom, () => null)
    };
    const ui = $.ui.resolve(e);
    return pinned(e, pingRow(ui, band, theirs));
  });
}
async function othersBand($, e, theirs) {
  const list = await read($, othersAtom);
  if (list.length === 0 || !await read($, enabledAtom))
    return theirs;
  const onDismiss = () => {
    others.watcher?.hide(list);
    update($, othersAtom, () => []);
  };
  return pinned(e, othersRow($.ui.resolve(e), { list, onDismiss }, theirs));
}

export { register };
