// Built by `bin/modz build` from the files beside it. Never edited by hand.
const QUOTE_CHARS = 240;
function excerpt(text) {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > QUOTE_CHARS ? `${line.slice(0, QUOTE_CHARS - 1)}…` : line;
}
function feedbackLine(flag) {
  const quoted = excerpt(flag.request);
  const parts = [
    "/feedback False positive: the safeguards flagged a normal request and the turn stopped.",
    quoted === "" ? "" : `Request: "${quoted}"`,
    flag.category === null ? "" : `Category: ${flag.category}.`
  ];
  return parts.filter((part) => part !== "").join(" ");
}

const ICON_GRID = 24;
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
const icon = (name) => `<path d="${PATHS[name]}"${name === "check" ? ' data-m-done=""' : ""}/>`;

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
function fitText(text, max, measure) {
  if (measure(text) <= max)
    return text;
  const chars = [...text];
  while (chars.length > 0 && measure(`${chars.join("").trimEnd()}…`) > max)
    chars.pop();
  return chars.length === 0 ? "" : `${chars.join("").trimEnd()}…`;
}
function wrapText(text, o) {
  const { max, maxLines, measure } = o;
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const [i, word] of words.entries()) {
    const next = line ? `${line} ${word}` : word;
    if (measure(next) <= max || !line) {
      line = next;
      continue;
    }
    if (lines.length === maxLines - 1)
      return [...lines, fitText(`${line} ${words.slice(i).join(" ")}`, max, measure)];
    lines.push(line);
    line = word;
  }
  return line ? [...lines, fitText(line, max, measure)] : lines;
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
const ROLE_KEY = {
  read: "suggestion",
  edit: "claude",
  run: "permission",
  ok: "success",
  warn: "warning",
  danger: "error",
  plan: "merged"
};
const LINE_KEY = "subtle";
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
const LIGHT_ANSI_BACKGROUNDS = [7, 15];
const named = (value) => {
  const name = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (name.includes("light"))
    return true;
  return name.includes("dark") ? false : undefined;
};
const terminalLight = (colorfgbg) => {
  const background = Number(colorfgbg?.split(";").at(-1));
  return colorfgbg === undefined || Number.isNaN(background) ? undefined : LIGHT_ANSI_BACKGROUNDS.includes(background);
};
const resolveLight = (hints) => named(hints.override) ?? named(hints.theme) ?? terminalLight(hints.colorfgbg) ?? (hints.systemDark === undefined ? false : !hints.systemDark);

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const pick = (table) => table[current];

const STROKE = 1.75;
const CAP_EM = 0.7;
const DECIMALS = 100;
const SCALE_DIGITS = 4;
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
function iconEl(s) {
  const scale = s.size / ICON_GRID;
  return [
    `<g transform="translate(${num(s.x)} ${num(s.y)}) scale(${scale.toFixed(SCALE_DIGITS)})"`,
    ` class="s-${s.paint}" fill="none" stroke-width="${num(STROKE / scale)}" stroke-linecap="round" stroke-linejoin="round">`,
    `${icon(s.name)}</g>`
  ].join("");
}
const rectEl = (r, extra = "") => `<rect x="${num(r.x)}" y="${num(r.y)}" width="${num(Math.max(0, r.width))}" height="${num(r.height)}"${r.radius ? ` rx="${num(r.radius)}"` : ""} class="f-${r.paint}${r.className ? ` ${r.className}` : ""}"${extra}/>`;

const EYEBROW_H = 16;
const DOT = 6;
const DOT_GAP = 7;
const META_GAP = 12;
const META = TYPE.label;
const eyebrowTracking = () => TYPE.eyebrow.size * TYPE.eyebrow.tracking;
const eyebrowWidth = (label) => sans(TYPE.eyebrow.size, TYPE.eyebrow.weight)(label) + [...label].length * eyebrowTracking();
function eyebrowPart(o) {
  const y = baseline(0, EYEBROW_H, TYPE.eyebrow.size);
  const left = o.hasDot ? DOT + DOT_GAP : 0;
  const meta = o.meta ? fitText(o.meta, o.width / 2, sans(META.size, META.weight)) : "";
  const metaW = meta ? sans(META.size, META.weight)(meta) + META_GAP : 0;
  const label = fitText(o.text, o.width - left - metaW, eyebrowWidth);
  const parts = [
    o.hasDot ? `<circle cx="${DOT / 2}" cy="${EYEBROW_H / 2}" r="${DOT / 2}" class="f-${o.role ?? "lo"}"/>` : "",
    textEl({ x: left, y, text: label, paint: "lo", ...TYPE.eyebrow, tracking: eyebrowTracking() }),
    meta ? textEl({ x: o.width, y, text: meta, paint: "lo", ...META, anchor: "end" }) : ""
  ];
  return { body: parts.join(""), width: o.width, height: EYEBROW_H, alt: [label, meta].filter(Boolean).join(" · ") };
}
const MARK_PAD = 3;
const MARK_RADIUS = 4;
const MARK_INSET = 1;
const LINE_RATIO = 1.3;
function markSpans(lines, text, mark) {
  const flat = text.split(/\s+/).filter(Boolean).join(" ");
  const start = mark ? flat.indexOf(mark.trim()) : -1;
  const end = start + (mark?.trim().length ?? 0);
  let offset = 0;
  return lines.map((line) => {
    const visible = line.endsWith("…") ? line.length - 1 : line.length;
    const from = Math.max(start, offset) - offset;
    const to = Math.min(end, offset + visible) - offset;
    offset += line.length + 1;
    return start >= 0 && to > from ? { from, to } : null;
  });
}
function lineMarkup(o) {
  const { line, span, top, opts } = o;
  const measure = sans(opts.size, opts.weight);
  const y = baseline(top, opts.lineHeight, opts.size);
  const role = opts.markRole ?? "warn";
  const font = `font-size="${opts.size}" font-weight="${opts.weight}"`;
  if (span === null)
    return textEl({ x: 0, y, text: line, size: opts.size, weight: opts.weight, paint: opts.paint });
  const x0 = measure(line.slice(0, span.from));
  const x1 = measure(line.slice(0, span.to));
  const rect = rectEl({ x: x0 - MARK_PAD, y: top + MARK_INSET, width: x1 - x0 + MARK_PAD * 2, height: opts.lineHeight - MARK_INSET * 2, radius: MARK_RADIUS, paint: `${role}-tint` });
  const pieces = [line.slice(0, span.from), line.slice(span.from, span.to), line.slice(span.to)].map(escapeXml);
  return `${rect}<text x="0" y="${y}" class="f-${opts.paint}" ${font}>${pieces[0]}<tspan class="f-${role}">${pieces[1]}</tspan>${pieces[2]}</text>`;
}
function linesPart(o) {
  const size = o.size ?? TYPE.headline.size;
  const opts = {
    ...o,
    size,
    weight: o.weight ?? TYPE.headline.weight,
    lineHeight: o.lineHeight ?? Math.round(size * LINE_RATIO),
    paint: o.paint ?? "hi",
    maxLines: o.maxLines ?? 2
  };
  const lines = wrapText(o.text, { max: o.width - MARK_PAD, maxLines: opts.maxLines, measure: sans(size, opts.weight) });
  const spans = markSpans(lines, o.text, o.mark);
  const body = lines.map((line, i) => lineMarkup({ line, span: spans[i] ?? null, top: i * opts.lineHeight, opts })).join("");
  return { body, width: o.width, height: lines.length * opts.lineHeight, alt: o.text };
}
const bodyPart = (o) => linesPart({ size: TYPE.body.size, weight: TYPE.body.weight, lineHeight: TYPE.body.line, paint: "mid", ...o });

const TILE$1 = 36;
const TILE_ICON = 18;
const SMALL_TILE = 32;
const SMALL_ICON_RATIO = 0.5;
function iconTilePart(o) {
  const size = o.size ?? TILE$1;
  const glyph = size >= SMALL_TILE ? TILE_ICON : Math.round(size * SMALL_ICON_RATIO);
  const body = iconEl({ name: o.icon, x: (size - glyph) / 2, y: (size - glyph) / 2, size: glyph, paint: "mid" });
  return { body, width: size, height: size, alt: o.icon };
}

const TILE = 36;
const TILE_GAP = 12;
const EYEBROW_TO_HEADLINE = 4;
const HEADLINE_TO_SUB = 4;
function headerPart(o) {
  const textX = o.icon ? TILE + TILE_GAP : 0;
  const textW = o.width - textX;
  const tile = o.icon ? iconTilePart({ icon: o.icon, role: o.role, size: TILE }) : null;
  const eyebrow = eyebrowPart({ text: o.eyebrow, width: textW, role: o.role, meta: o.meta, hasDot: o.hasDot });
  const headlineTop = EYEBROW_H + EYEBROW_TO_HEADLINE;
  const title = o.headline ? linesPart({ text: o.headline, width: textW, mark: o.mark, markRole: o.role }) : null;
  const subTop = headlineTop + (title ? title.height + HEADLINE_TO_SUB : 0);
  const sub = o.sub ? bodyPart({ text: o.sub, width: textW }) : null;
  const titleBottom = title ? headlineTop + title.height : EYEBROW_H;
  const bottom = sub ? subTop + sub.height : titleBottom;
  const body = [
    tile ? tile.body : "",
    place(eyebrow.body, textX, 0),
    title ? place(title.body, textX, headlineTop) : "",
    sub ? place(sub.body, textX, subTop) : ""
  ];
  const alt = [eyebrow.alt, o.headline, o.sub].filter(Boolean).join(" — ");
  return { body: body.join(""), width: o.width, height: Math.max(tile ? TILE : 0, bottom), alt };
}
const headerSvg = (o) => toPic(headerPart(o));

const RANK = { primary: 0, secondary: 1, plain: 2 };
const ASCII = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
function letterFor(label, taken) {
  for (const char of label.toLocaleLowerCase("tr")) {
    const letter = ASCII[char] ?? char;
    if (/^[a-z]$/.test(letter) && !taken.has(letter))
      return letter;
  }
  return;
}
function demote(buttons, isDanger) {
  let hasPrimary = false;
  return buttons.map((button) => {
    const wantsPrimary = (button.variant ?? "secondary") === "primary" && !(isDanger && button.isDestructive);
    const fallback = button.variant === "plain" ? "plain" : "secondary";
    const variant = wantsPrimary && !hasPrimary ? "primary" : fallback;
    hasPrimary = hasPrimary || variant === "primary";
    return { ...button, variant };
  });
}
function focusIndex(buttons, isDanger) {
  if (!isDanger)
    return -1;
  const safe = buttons.findIndex((button) => button.isSafe);
  return safe >= 0 ? safe : buttons.findIndex((button) => !button.isDestructive);
}
function planButtons(buttons, isDanger = false) {
  const ordered = demote(buttons, isDanger).map((button, i) => ({ button, i })).sort((a, b) => RANK[a.button.variant ?? "secondary"] - RANK[b.button.variant ?? "secondary"] || a.i - b.i).map(({ button }) => button);
  const focus = focusIndex(ordered, isDanger);
  const taken = new Set(ordered.map((button) => button.hotkey).filter((key) => key !== undefined));
  return ordered.map((button, i) => {
    const hotkey = button.hotkey ?? (isDanger && button.isDestructive ? letterFor(button.label, taken) : undefined);
    if (hotkey)
      taken.add(hotkey);
    return { ...button, variant: button.variant ?? "secondary", hotkey, isFocused: i === focus };
  });
}

const PX_PER_CELL = 8;
const CARD_PAD_X = 2;
const CARD_PAD_Y = 1;
const CARD_BORDER_CELLS = 2;
const MIN_INNER = 160;
const isTextSurface = (ui, surface) => surface === "terminal" || !("Svg" in ui);
const cardInnerWidth = (columns) => Math.max(MIN_INNER, (columns - CARD_PAD_X * 2 - CARD_BORDER_CELLS) * PX_PER_CELL);
function svgOf(draw, site, pic) {
  const { ui, motion } = draw;
  if (!("Svg" in ui))
    return null;
  const { Svg } = ui;
  if (motion !== undefined)
    return h(Svg, {
      ...motion.pic(site.key, pic, { shows: site.shows })
    });
  return h(Svg, {
    source: pic.source,
    alt: pic.alt,
    width: pic.width,
    height: pic.height
  });
}
function HeaderBlock(draw, o) {
  const { ui, surface } = draw;
  const { Box, Text } = ui;
  if (!isTextSurface(ui, surface))
    return svgOf(draw, { key: `header:${o.eyebrow}`, shows: { ...o, meta: o.meta !== undefined } }, headerSvg(o)) ?? h(Box, null);
  return h(Box, {
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    justifyContent: "space-between"
  }, h(Text, {
    dimColor: true,
    bold: true
  }, o.eyebrow), o.meta ? h(Text, {
    dimColor: true
  }, o.meta) : null), o.headline ? h(Text, {
    bold: true
  }, o.headline) : null, o.sub ? h(Text, null, o.sub) : null);
}
function borderOf(isText, p, role) {
  if (isText)
    return role ? ROLE_KEY[role] : LINE_KEY;
  return role ? p.roles[role].line : p.line;
}
function Card(draw, o) {
  const { ui, surface, isLight } = draw;
  const { Box } = ui;
  const isText = isTextSurface(ui, surface);
  const p = palette(isLight);
  const role = o.isDanger ? "danger" : o.role;
  const borderColor = borderOf(isText, p, role);
  const header = o.header ? HeaderBlock(draw, { role, ...o.header }) : null;
  return h(Box, {
    flexDirection: "column",
    borderStyle: o.isDanger ? "single" : "round",
    borderColor,
    backgroundColor: isText ? undefined : p.card,
    paddingX: CARD_PAD_X,
    paddingY: CARD_PAD_Y,
    gap: 1
  }, header, o.children);
}
const BUTTON_VARIANT = { primary: "primary", secondary: "secondary", plain: undefined };
function ButtonRow(draw, o) {
  const { Box, Button } = draw.ui;
  const planned = planButtons(o.buttons, o.isDanger);
  return h(Box, {
    flexDirection: "row",
    gap: 1,
    flexWrap: "wrap"
  }, planned.map((b) => h(Button, {
    key: b.key ?? b.label,
    label: b.label,
    onPress: b.onPress,
    variant: BUTTON_VARIANT[b.variant],
    plain: b.variant === "plain" ? true : undefined,
    dimColor: b.variant === "plain" ? true : undefined,
    hotkey: b.hotkey,
    autoFocus: b.isFocused ? true : undefined
  })));
}

const EN = {
  eyebrow: "Safeguards flagged this turn",
  headline: "The model stopped on your last request",
  noRequest: "Your last request could not be read.",
  report: "Report a false positive",
  dismiss: "Dismiss",
  draftTaken: "The prompt box has a draft. Clear it, then press Report again.",
  filled: "The report is in the prompt box. Read it, then press Enter to open /feedback."
};
const TR = {
  eyebrow: "Güvenlik filtresi bu turu durdurdu",
  headline: "Model son isteğinde durdu",
  noRequest: "Son isteğin okunamadı.",
  report: "Yanlış alarmı bildir",
  dismiss: "Kapat",
  draftTaken: "İstem kutusunda bir taslak var. Onu silip Bildir’e yeniden bas.",
  filled: "Bildirim istem kutusunda. Okuyup /feedback’i açmak için Enter’a bas."
};
const words = () => pick({ en: EN, tr: TR });

const state = { request: "", flag: null, isLight: false };
async function isLightNow($) {
  const override = await $.env.get("MODZ_THEME").catch(() => {
    return;
  });
  const rows = await $.config.list().catch(() => []);
  return resolveLight({ override, theme: rows.find((row) => row.key === "theme")?.value });
}
function clear($) {
  state.flag = null;
  $.ui.invalidate("ui.render");
}
async function report($, flag) {
  const box = await $.prompt.read();
  if (box.text.trim() !== "") {
    $.ui.toast(words().draftTaken);
    return;
  }
  const filled = await $.prompt.fill({ text: feedbackLine(flag) });
  if (!filled.isFilled)
    return;
  $.ui.toast(words().filled);
  clear($);
}
function hookTurns(on) {
  on("session.start", async ($, e, next) => {
    setLang(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    state.isLight = await isLightNow($);
    state.request = "";
    state.flag = null;
    return next(e);
  });
  on("turn.start", async ($, e, next) => {
    if (e.agentId !== undefined)
      return next(e);
    if (e.text.trim() !== "")
      state.request = e.text;
    if (state.flag !== null)
      clear($);
    return next(e);
  });
  on("turn.complete", async ($, e, next) => {
    const result = await next(e);
    if (e.agentId === undefined && e.reason === "refusal") {
      state.flag = { request: state.request, category: e.refusal.category, explanation: e.refusal.explanation };
      $.ui.invalidate("ui.render");
    }
    return result;
  });
}
function hookCard(on) {
  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    const flag = state.flag;
    if (flag === null || e.props.hasSurvey)
      return next(e);
    const theirs = await next(e);
    const draw = { ui: $.ui.resolve(e), surface: e.surface, isLight: state.isLight };
    const says = words();
    const quoted = excerpt(flag.request);
    const pressed = () => void report($, flag).catch((cause) => $.ui.log(`refusal-card: could not fill the prompt: ${String(cause)}`, { to: "debug" }));
    const card = Card(draw, {
      role: "warn",
      header: { icon: "flag", eyebrow: says.eyebrow, headline: says.headline, sub: quoted === "" ? says.noRequest : `“${quoted}”`, width: cardInnerWidth(e.props.bodyColumns) },
      children: [
        ButtonRow(draw, {
          buttons: [
            { key: "refusal-card-report", label: says.report, variant: "primary", onPress: pressed },
            { key: "refusal-card-dismiss", label: says.dismiss, variant: "plain", onPress: () => clear($) }
          ]
        })
      ]
    });
    const { Box } = draw.ui;
    return h(Box, {
      flexDirection: "column"
    }, card, theirs);
  });
}
const register = (on) => {
  hookTurns(on);
  hookCard(on);
};

export { register };
