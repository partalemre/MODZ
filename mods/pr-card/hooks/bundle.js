// Built by `bin/modz build` from the files beside it. Never edited by hand.
import { atom, read, update } from 'claude-code';

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const pick = (table) => table[current];

const EN = {
  state: { open: "Open", merged: "Merged", closed: "Closed" },
  draft: "Draft",
  files: (n) => n === 1 ? "1 file" : `${n} files`,
  checksLabel: "Checks",
  reviewLabel: "Review",
  mergeLabel: "Merge",
  failingLabel: "Failing",
  noChecks: "None",
  passed: (done, all) => `${done}/${all} passed`,
  failed: (n) => `${n} failed`,
  running: (n) => `${n} running`,
  review: { approved: "Approved", changes: "Changes asked", required: "Waiting", none: "Not asked" },
  merge: { ready: "Ready", conflict: "Conflicts", blocked: "Blocked", behind: "Out of date", draft: "Draft", unknown: "Checking" },
  moreFiles: (n) => `+${n}`,
  loading: "Reading the change request…",
  noGh: "The GitHub tool (gh) isn't installed, so only the link is known",
  failed1: "Couldn't read this change request from GitHub",
  stale: (ago) => `Could not refresh · last read ${ago}`,
  ago: (minutes) => minutes < 1 ? "just now" : minutes < 60 ? `${minutes} min ago` : `${Math.floor(minutes / 60)} h ago`,
  refresh: "Refresh"
};
const TR = {
  state: { open: "Açık", merged: "Birleşti", closed: "Kapalı" },
  draft: "Taslak",
  files: (n) => `${n} dosya`,
  checksLabel: "Kontroller",
  reviewLabel: "İnceleme",
  mergeLabel: "Birleştirme",
  failingLabel: "Başarısız",
  noChecks: "Yok",
  passed: (done, all) => `${done}/${all} geçti`,
  failed: (n) => `${n} başarısız`,
  running: (n) => `${n} çalışıyor`,
  review: { approved: "Onaylandı", changes: "Değişiklik istendi", required: "Bekliyor", none: "İstenmedi" },
  merge: { ready: "Hazır", conflict: "Çakışma var", blocked: "Engelli", behind: "Güncel değil", draft: "Taslak", unknown: "Bakılıyor" },
  moreFiles: (n) => `+${n}`,
  loading: "Değişiklik isteği okunuyor…",
  noGh: "GitHub aracı (gh) kurulu değil; yalnızca bağlantı biliniyor",
  failed1: "Bu değişiklik isteği GitHub’dan okunamadı",
  stale: (ago) => `Yenilenemedi · son okuma ${ago}`,
  ago: (minutes) => minutes < 1 ? "az önce" : minutes < 60 ? `${minutes} dk önce` : `${Math.floor(minutes / 60)} sa önce`,
  refresh: "Yenile"
};
const words = () => pick({ en: EN, tr: TR });

const MINUTE_MS = 60000;
const REVIEW_TONE = { approved: "ok", changes: "danger", required: "warn", none: "lo" };
const MERGE_TONE = { ready: "ok", conflict: "danger", blocked: "warn", behind: "warn", draft: "lo", unknown: "lo" };
function stateOf(view) {
  const said = words();
  if (view === null)
    return { text: said.state.open, tone: "lo" };
  if (view.state === "merged")
    return { text: said.state.merged, tone: "run" };
  if (view.state === "closed")
    return { text: said.state.closed, tone: "danger" };
  return view.isDraft ? { text: said.draft, tone: "lo" } : { text: said.state.open, tone: "ok" };
}
function checksFact(checks) {
  const said = words();
  const counted = checks.passed + checks.failed + checks.pending;
  const label = said.checksLabel;
  if (checks.failed > 0)
    return { label, value: said.failed(checks.failed), tone: "danger" };
  if (checks.pending > 0)
    return { label, value: said.running(checks.pending), tone: "read" };
  if (counted === 0)
    return { label, value: said.noChecks, tone: "lo" };
  return { label, value: said.passed(checks.passed, counted), tone: "ok" };
}
function factsOf(view) {
  const said = words();
  const merge = view.state === "open" ? { label: said.mergeLabel, value: said.merge[view.merge], tone: MERGE_TONE[view.merge] } : { label: said.mergeLabel, value: "—", tone: "lo" };
  return [checksFact(view.checks), { label: said.reviewLabel, value: said.review[view.review], tone: REVIEW_TONE[view.review] }, merge];
}
function noteOf(entry, now) {
  const said = words();
  if (entry.problem === "no-gh")
    return said.noGh;
  if (entry.problem === "failed") {
    return entry.checkedAt === null ? said.failed1 : said.stale(said.ago(Math.floor((now - entry.checkedAt) / MINUTE_MS)));
  }
  return entry.view === null ? said.loading : null;
}
const shortName = (path) => path.split("/").at(-1) ?? path;
const biggestFirst = (view) => [...view.files].sort((a, b) => b.additions + b.deletions - (a.additions + a.deletions));
const MAX_FAILING$1 = 5;
const LEFT = { merged: "merged", closed: "closed" };
function withCi(entry, ci) {
  const view = entry.view;
  const isNewer = ci !== null && ci.url === entry.url && ci.checkedAt !== null && (entry.checkedAt === null || ci.checkedAt > entry.checkedAt);
  if (view === null || !isNewer)
    return entry;
  const count = (state) => ci.checks.filter((check) => check.state === state).length;
  const failing = ci.checks.filter((check) => check.state === "fail").map((check) => check.name).slice(0, MAX_FAILING$1);
  const checks = { passed: count("pass"), failed: count("fail"), pending: count("pending"), skipped: count("skipped"), failing };
  return { ...entry, view: { ...view, checks, state: LEFT[ci.phase] ?? view.state } };
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
const MONO_EM = 0.6;
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
const monoWidth = (text, size) => [...text].length * size * MONO_EM;
function fitText(text, max, measure) {
  if (measure(text) <= max)
    return text;
  const chars = [...text];
  while (chars.length > 0 && measure(`${chars.join("").trimEnd()}…`) > max)
    chars.pop();
  return chars.length === 0 ? "" : `${chars.join("").trimEnd()}…`;
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
const EXT_KIND = {
  ts: "code",
  tsx: "code",
  js: "code",
  jsx: "code",
  mjs: "code",
  cjs: "code",
  mts: "code",
  cts: "code",
  py: "py",
  pyi: "py",
  md: "doc",
  mdx: "doc",
  txt: "doc",
  rst: "doc",
  json: "data",
  csv: "data",
  yaml: "data",
  yml: "data",
  toml: "data",
  xml: "data",
  pdf: "pdf",
  png: "img",
  jpg: "img",
  jpeg: "img",
  gif: "img",
  svg: "img",
  webp: "img",
  ico: "img"
};
const EXT_LABEL = { json: "{}", yaml: "YML", jpeg: "JPG" };
const BADGE_CHARS = 3;
function fileType(name) {
  const base = name.split("/").pop() ?? name;
  const dot = base.lastIndexOf(".");
  const ext = (dot >= 0 ? base.slice(dot + 1) : base).toLowerCase();
  const isGit = base.toLowerCase().startsWith(".git");
  const kind = isGit ? "misc" : EXT_KIND[ext] ?? "misc";
  const label = isGit ? "GIT" : EXT_LABEL[ext] ?? ext.slice(0, BADGE_CHARS).toUpperCase();
  return { kind, label: label || "·" };
}
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
const TYPE = {
  display: { size: 24, weight: 650 },
  headline: { size: 17, weight: 620, line: 22 },
  title: { size: 14, weight: 600, line: 20 },
  body: { size: 13, weight: 400, line: 18 },
  eyebrow: { size: 12, weight: 600, tracking: 0 },
  label: { size: 12, weight: 500 },
  micro: { size: 10.5, weight: 500 }
};
const num = (value) => String(Math.round(value * DECIMALS) / DECIMALS);
const escapeXml = (text) => text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const sans = (size, weight) => (text) => textWidth(text, size, weight);
const mono = (size) => (text) => monoWidth(text, size);
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
const place = (body, x, y) => x === 0 && y === 0 ? body : `<g transform="translate(${num(x)} ${num(y)})">${body}</g>`;
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
const outlineEl = (r, opacity = 1) => `<rect x="${num(r.x + 0.5)}" y="${num(r.y + 0.5)}" width="${num(r.width - 1)}" height="${num(r.height - 1)}"${r.radius ? ` rx="${num(r.radius - 0.5)}"` : ""} fill="none" class="s-${r.paint}"${opacity < 1 ? ` stroke-opacity="${opacity}"` : ""}/>`;

const BADGE_W$1 = 26;
const BADGE_H = 16;
const BADGE_RADIUS = 4;
const BADGE_TEXT = { size: 9.5, weight: 700 };
function fileBadgePart(o) {
  const type = fileType(o.name);
  const paints = o.activity ? { fg: o.activity, tint: `${o.activity}-tint` } : { fg: "lo", tint: "track" };
  const body = [
    rectEl({ x: 0, y: 0, width: BADGE_W$1, height: BADGE_H, radius: BADGE_RADIUS, paint: paints.tint }),
    textEl({ x: BADGE_W$1 / 2, y: baseline(0, BADGE_H, BADGE_TEXT.size), text: type.label, paint: paints.fg, ...BADGE_TEXT, anchor: "middle", isMono: true })
  ];
  return { body: body.join(""), width: BADGE_W$1, height: BADGE_H, alt: `${type.label} ${o.name}` };
}

const PAD = 14;
const RADIUS = 10;
const META = 12;
const LINE_H = 18;
const HEAD_H = 20;
const FILE_H = 20;
const GAP = 10;
const BADGE_W = 26;
const CHIP_GAP = 14;
const COUNT_SIZE = 11.5;
const ALT_FILES = 5;
const fit = (text, max, size, weight) => fitText(text, max, sans(size, weight));
function headRow(entry, view, width) {
  const tail = words().files(view.changedFiles);
  const plus = `+${view.additions}`;
  const minus = `−${view.deletions}`;
  const stats = mono(COUNT_SIZE);
  const minusW = stats(minus);
  const plusW = stats(plus);
  const tailW = sans(META)(tail);
  const right = width - PAD;
  const repoMax = right - tailW - plusW - minusW - 24 - PAD;
  return {
    height: HEAD_H,
    draw: (y) => {
      const line = baseline(y, HEAD_H, META);
      return [
        textEl({ x: PAD, y: line, text: fit(`${entry.repo} #${entry.number}`, repoMax, META, TYPE.eyebrow.weight), size: META, weight: TYPE.eyebrow.weight, paint: "mid" }),
        textEl({ x: right, y: line, text: minus, size: COUNT_SIZE, paint: "mid", anchor: "end", isMono: true }),
        textEl({ x: right - minusW - 6, y: line, text: plus, size: COUNT_SIZE, paint: "mid", anchor: "end", isMono: true }),
        textEl({ x: right - minusW - plusW - 18, y: line, text: tail, size: META, paint: "lo", anchor: "end" })
      ].join("");
    }
  };
}
function filesRow(view, width) {
  const measure = sans(META);
  const more = words().moreFiles;
  const end = width - PAD;
  return {
    height: FILE_H,
    draw: (y) => {
      const parts = [];
      let x = PAD;
      const files = biggestFirst(view);
      for (const [i, file] of files.entries()) {
        const name = shortName(file.path);
        const chip = BADGE_W + 6 + measure(name);
        const left = view.changedFiles - i - 1;
        const reserve = left > 0 ? measure(more(left)) + CHIP_GAP : 0;
        if (x + chip + reserve > end) {
          parts.push(textEl({ x, y: baseline(y, FILE_H, META), text: more(view.changedFiles - i), size: META, paint: "lo" }));
          return parts.join("");
        }
        parts.push(place(fileBadgePart({ name: file.path }).body, x, y + 2));
        parts.push(textEl({ x: x + BADGE_W + 6, y: baseline(y, FILE_H, META), text: name, size: META, paint: "mid" }));
        x += chip + CHIP_GAP;
      }
      return parts.join("");
    }
  };
}
function noteRow(text, width) {
  return {
    height: LINE_H,
    draw: (y) => textEl({ x: PAD, y: baseline(y, LINE_H, META), text: fit(text, width - PAD * 2, META), size: META, paint: "lo" })
  };
}
function rowsOf(entry, view, opts) {
  const note = noteOf(entry, opts.now);
  const rows = [headRow(entry, view, opts.width)];
  if (view.files.length > 0)
    rows.push(filesRow(view, opts.width));
  if (note !== null)
    rows.push(noteRow(note, opts.width));
  return rows;
}
function altOf(entry, view, now) {
  const counts = `${words().files(view.changedFiles)} +${view.additions} −${view.deletions}`;
  const names = biggestFirst(view).slice(0, ALT_FILES).map((file) => shortName(file.path));
  return [`${entry.repo} #${entry.number}`, counts, ...names, noteOf(entry, now)].filter(Boolean).join(" · ");
}
function cardSvg(entry, opts) {
  const { width, now } = opts;
  const rows = rowsOf(entry, entry.view, opts);
  const height = rows.reduce((sum, row) => sum + row.height + GAP, PAD * 2 - GAP);
  const box = { x: 0, y: 0, width, height, radius: RADIUS, paint: "card" };
  let y = PAD;
  const body = rows.map((row) => {
    const drawn = row.draw(y);
    y += row.height + GAP;
    return drawn;
  });
  return toPic({ body: [rectEl(box), outlineEl({ ...box, paint: "line" }), ...body].join(""), width, height, alt: altOf(entry, entry.view, now) });
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

const PR_URL = /https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)/;
const PR_CREATE = /(^|[\s;&|(])gh\s+pr\s+create\b/;
const MCP_CREATE = /(^|__)create_pull_request$/;
const STATES = { OPEN: "open", MERGED: "merged", CLOSED: "closed" };
const REVIEWS = { APPROVED: "approved", CHANGES_REQUESTED: "changes", REVIEW_REQUIRED: "required" };
const MERGE_STATES = {
  CLEAN: "ready",
  HAS_HOOKS: "ready",
  UNSTABLE: "ready",
  DIRTY: "conflict",
  BLOCKED: "blocked",
  BEHIND: "behind",
  DRAFT: "draft"
};
const FAILED = new Set(["FAILURE", "TIMED_OUT", "CANCELLED", "ACTION_REQUIRED", "STARTUP_FAILURE", "ERROR"]);
const SKIPPED = new Set(["NEUTRAL", "SKIPPED", "STALE"]);
const MAX_NAME = 80;
const MAX_FAILING = 5;
const MAX_FILES = 100;
const VIEW_FIELDS = "url,title,state,isDraft,additions,deletions,changedFiles,files,statusCheckRollup,reviewDecision,mergeable,mergeStateStatus";
const isPrCreate = (command) => PR_CREATE.test(command);
const commandOf = (input) => String(input?.command ?? "");
const isPrCall = (tool, input) => tool === "Bash" && isPrCreate(commandOf(input)) || MCP_CREATE.test(tool);
function prRefOf(output) {
  const found = output.split(`
`).map((line) => PR_URL.exec(line)).filter((match) => match !== null);
  const last = found.at(-1);
  return last === undefined ? null : { url: last[0], repo: last[1] ?? "", number: Number(last[2]) };
}
function outputText(output) {
  if (typeof output === "string")
    return output;
  if (output === null || output === undefined)
    return "";
  const stdout = output.stdout;
  return typeof stdout === "string" ? stdout : JSON.stringify(output);
}
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const count = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
const listOf = (value) => Array.isArray(value) ? value : [];
function fileOf(item) {
  if (!isRecord(item) || typeof item.path !== "string")
    return null;
  return { path: item.path, additions: count(item.additions), deletions: count(item.deletions) };
}
function bucketOf(item) {
  const outcome = String(item.conclusion || item.state || "");
  if (FAILED.has(outcome))
    return "failed";
  if (SKIPPED.has(outcome))
    return "skipped";
  const isSettled = outcome === "SUCCESS" && (item.status === undefined || item.status === "COMPLETED");
  return isSettled ? "passed" : "pending";
}
function checksOf(rollup) {
  const checks = { passed: 0, failed: 0, pending: 0, skipped: 0, failing: [] };
  for (const item of listOf(rollup).filter(isRecord)) {
    const bucket = bucketOf(item);
    checks[bucket] += 1;
    const name = String(item.name ?? item.context ?? "").slice(0, MAX_NAME);
    if (bucket === "failed" && name !== "" && checks.failing.length < MAX_FAILING)
      checks.failing.push(name);
  }
  return checks;
}
function mergeOf(json) {
  if (json.mergeable === "CONFLICTING")
    return "conflict";
  return MERGE_STATES[String(json.mergeStateStatus)] ?? "unknown";
}
function viewOf(text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(json))
    return null;
  const state = STATES[String(json.state)];
  if (state === undefined)
    return null;
  const files = listOf(json.files).slice(0, MAX_FILES).map(fileOf).filter((file) => file !== null);
  return {
    title: typeof json.title === "string" ? json.title : "",
    state,
    isDraft: json.isDraft === true,
    additions: count(json.additions),
    deletions: count(json.deletions),
    changedFiles: count(json.changedFiles),
    files,
    checks: checksOf(json.statusCheckRollup),
    review: REVIEWS[String(json.reviewDecision)] ?? "none",
    merge: mergeOf(json)
  };
}

const prsAtom = atom({ plugin: "pr-card", key: "prs" }, {});
const ciRef = { plugin: "test-badge", key: "ci" };
const GH_ENV = { GH_PROMPT_DISABLED: "1", GH_NO_UPDATE_NOTIFIER: "1", NO_COLOR: "1" };
const GH_TIMEOUT_MS = 20000;
const live = { asking: new Set };
const debug = ($, text) => $.ui.log(`pr-card: ${text}`, { to: "debug" });
async function gh($, selector) {
  const argv = ["gh", "pr", "view", ...selector, "--json", VIEW_FIELDS];
  return $.process.run(argv, { cwd: await $.session.cwd(), env: GH_ENV, timeoutMs: GH_TIMEOUT_MS }).catch(() => null);
}
async function ask($, url) {
  const run = await gh($, [url]);
  if (run === null)
    return { view: null, problem: "no-gh" };
  const view = run.exitCode === 0 ? viewOf(run.stdout) : null;
  return { view, problem: view === null ? "failed" : null };
}
async function refresh($, url) {
  if (live.asking.has(url))
    return;
  live.asking.add(url);
  try {
    const got = await ask($, url);
    const now = await $.clock.now();
    await update($, prsAtom, (prs) => {
      const entry = prs[url];
      if (entry === undefined)
        return prs;
      return { ...prs, [url]: { ...entry, view: got.view ?? entry.view, problem: got.problem, checkedAt: got.view === null ? entry.checkedAt : now } };
    });
  } finally {
    live.asking.delete(url);
  }
}
async function track($, ref, callId) {
  const entry = { ...ref, callId: callId ?? null, view: null, problem: null, checkedAt: null };
  await update($, prsAtom, (prs) => prs[ref.url] === undefined ? { ...prs, [ref.url]: entry } : prs);
  await refresh($, ref.url);
}
async function pickUp($) {
  const run = await gh($, []);
  if (run === null || run.exitCode !== 0)
    return;
  const view = viewOf(run.stdout);
  const ref = prRefOf(run.stdout);
  if (view === null || ref === null || view.state !== "open")
    return;
  const entry = { ...ref, callId: null, view, problem: null, checkedAt: await $.clock.now() };
  await update($, prsAtom, (prs) => prs[ref.url] === undefined ? { ...prs, [ref.url]: entry } : prs);
}
const pickUpQuietly = ($) => void pickUp($).catch((error) => debug($, `could not look for the branch's PR (${String(error)})`));
async function sharedCi($) {
  try {
    return (await $.state.get(ciRef)).value ?? null;
  } catch {
    return null;
  }
}
const CARD_MAX_PX = 560;
const CARD_MIN_PX = 320;
const PX_PER_COLUMN = 8;
const TERMINAL_FILES = 5;
const urlsOf = (calls) => calls.flatMap((call) => {
  const ref = isPrCall(call.tool, call.input) ? prRefOf(outputText(call.output)) : null;
  return ref === null ? [] : [ref.url];
});
const widthOf = (site) => Math.max(CARD_MIN_PX, Math.min(CARD_MAX_PX, (site.viewport?.columns ?? CARD_MAX_PX) * PX_PER_COLUMN));
function terminalCard(Text, Box, entry, now) {
  const state = stateOf(entry.view);
  const view = entry.view;
  const note = noteOf(entry, now);
  const files = view === null ? [] : biggestFirst(view).slice(0, TERMINAL_FILES).map((file) => shortName(file.path));
  return h(Box, {
    key: `t-${entry.url}`,
    flexDirection: "column"
  }, h(Text, {
    bold: true
  }, state.text, " ", entry.repo, " #", entry.number, view === null ? "" : ` · ${view.title}`), view === null ? null : h(Text, {
    dimColor: true
  }, factsOf(view).map((fact) => `${fact.label}: ${fact.value}`).join(" · ")), view === null || view.checks.failing.length === 0 ? null : h(Text, {
    color: "error"
  }, words().failingLabel, ": ", view.checks.failing.join(" · ")), files.length === 0 || view === null ? null : h(Text, {
    dimColor: true
  }, words().files(view.changedFiles), " +", view.additions, " −", view.deletions, ": ", files.join(" · ")), note === null ? null : h(Text, {
    dimColor: true
  }, note));
}
async function entriesOf($, urls, isDesktop) {
  const prs = await read($, prsAtom);
  const ci = isDesktop ? null : await sharedCi($);
  const known = urls.flatMap((url) => prs[url] === undefined ? [] : [withCi(prs[url], ci)]);
  return isDesktop ? known.filter((entry) => entry.view !== null) : known;
}
function desktopCard(ui, $, card) {
  const { Box, Button, Svg } = ui;
  const { entry } = card;
  return h(Box, {
    key: `c-${entry.url}`,
    flexDirection: "column",
    gap: 1
  }, h(Svg, {
    key: `p-${entry.url}`,
    ...cardSvg(entry, { now: card.now, width: card.width })
  }), h(Box, {
    flexDirection: "row"
  }, h(Button, {
    key: `r-${entry.url}`,
    label: words().refresh,
    plain: true,
    dimColor: true,
    onPress: () => void refresh($, entry.url)
  })));
}
async function drawn($, e, urls, under) {
  const isDesktop = e.surface === "desktop";
  const entries = await entriesOf($, urls, isDesktop);
  if (entries.length === 0)
    return under;
  const ui = $.ui.resolve(e);
  const now = await $.clock.now();
  const cards = entries.map((entry) => isDesktop && entry.view !== null ? desktopCard(ui, $, { entry: { ...entry, view: entry.view }, now, width: widthOf(e) }) : terminalCard(ui.Text, ui.Box, entry, now));
  return pinned(e, h(ui.Box, {
    flexDirection: "column",
    gap: 1
  }, under, cards));
}
const register = (on) => {
  on("session.start", async ($, e, next) => {
    const result = await next(e);
    setLang(await $.env.get("MODZ_LANG"));
    pickUpQuietly($);
    return result;
  });
  on("classic.SessionStart", async ($, e, next) => {
    if (e.source === "resume")
      pickUpQuietly($);
    return next(e);
  }).catch(($, e, next) => next(e));
  on("tool.call", async ($, e, next) => {
    const result = await next(e);
    if (result.deny !== undefined || result.isError === true || !isPrCall(String(e.tool), e))
      return result;
    const ref = prRefOf(`${result.text ?? ""}
${outputText(result.result)}`);
    if (ref !== null)
      track($, ref, e.tool_use_id).catch((error) => debug($, `could not read the PR (${String(error)})`));
    return result;
  }).catch(($, e, next) => next(e));
  on("ui.render", { component: "ToolGroup" }, async ($, e, next) => {
    const under = await next(e);
    const urls = urlsOf(e.props.calls);
    return urls.length === 0 ? under : drawn($, e, urls, under);
  });
  on("ui.render", { component: "ToolResult" }, async ($, e, next) => {
    const under = await next(e);
    const prs = await read($, prsAtom);
    const url = Object.values(prs).find((entry) => entry.callId !== null && entry.callId === e.props.tool_use_id)?.url;
    return url === undefined ? under : drawn($, e, [url], under);
  });
};

export { register };
