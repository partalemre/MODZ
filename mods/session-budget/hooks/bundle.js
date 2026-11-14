// Built by `bin/modz build` from the files beside it. Never edited by hand.
import { atom, read, update } from 'claude-code';

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const pick = (table) => table[current];

const TR = {
  percent: (value) => `%${value}`,
  decimal: (fixed) => fixed.replace(".", ","),
  fiveHour: "5 saatlik",
  sevenDay: "haftalık",
  listPrice: (pair) => `${pair} liste fiyatıyla`,
  etaMinutes: (minutes) => `bu hızla ~${minutes} dk`,
  etaHours: (hours, rest) => `bu hızla ~${hours} sa${rest === 0 ? "" : ` ${rest} dk`}`,
  usage: "Şöyle yazılır: /budget <5 saatlik kullanım hakkından pay, ör. 20%> | <$tutar, ör. $5> | off",
  tooMuch: "5 saatlik haktan ayrılan bütçe en çok %100 olabilir.",
  notPositive: "Bütçe sıfırdan büyük olmalı.",
  stop: "Dur",
  goOn: "Devam et",
  header: "Bütçe",
  question: (said) => `Bu sohbete ayırdığın bütçe doldu: ${said}. Yine de devam edilsin mi?`,
  warned: (said) => `Bütçe uyarısı: ${said}`,
  stoppedNotice: (spend) => `Durduruldu: bütçe doldu · ${spend} · /budget ile artır`,
  dropped: (said) => `Bu sohbetin bütçesi doldu: ${said}. /budget ile artır ya da /budget off ile kaldır.`,
  removed: "Oturum bütçesi kaldırıldı.",
  none: "Oturum bütçesi yok. Kur: /budget 20% ya da /budget $5",
  status: (said) => `Oturum bütçesi: ${said}`,
  percentUnit: (limit, isWeekly) => `${isWeekly ? "haftalık" : "5 saatlik"} kullanım hakkının %${limit} kadarı`,
  estimateNote: " Abonelikte $ yalnızca liste fiyatıyla bir tahmindir; asıl ölçü kullanım hakkının yüzdesidir.",
  waitForData: " Sayım ilk kullanım ölçümüyle başlar (5 saatlik hak yalnızca abonelikte ölçülür).",
  set: (unit, wait) => `Oturum bütçesi kuruldu: ${unit}.${wait}`,
  switched: (isOn) => `session-budget ${isOn ? "açık" : "kapalı"}`,
  budgetHelp: "Bu sohbete bir harcama sınırı koy (5 saatlik kullanım hakkından pay ya da $tutar) ya da yardımcı ajan frenini ayarla",
  toggleHelp: "Bütçe uyarısını, devam sorusunu ve yardımcı ajan frenini aç/kapat",
  budget: "Bütçe",
  rowTitle: (percent) => `Bütçe ${percent}`,
  raiseHint: "/budget ile artır",
  stoppedTitle: "Durduruldu: bütçe doldu",
  eyebrow: "Oturum bütçesi",
  full: "Bütçe doldu",
  fullLine: (spend, percent) => `Bütçe doldu · ${spend} (${percent})`,
  held: (step) => `Mesajın bekletiliyor. Devam edersen bütçe ${step} artar.`,
  heldWrapped: (step) => `Mesajın bekletiliyor. Devam edersen bütçe ${step} artar.`,
  fullAlt: (spend, percent, step) => `Oturum bütçesi doldu: ${spend} · ${percent}. Mesajın bekletiliyor; devam edersen bütçe ${step} artar.`,
  brakeGo: "Devam et",
  brakeHeader: "Yardımcı ajan",
  brakeWhy: (percent, pace, reset) => `5 saatlik kullanım hakkı ${percent} dolu${pace}${reset}`,
  brakeWhyWeekly: (percent, pace, reset) => `haftalık kullanım hakkı ${percent} dolu${pace}${reset}`,
  brakePace: (time) => `, bu hızla ${time} biter`,
  brakeReset: (time) => `, yenilenme ${time}`,
  brakeQuestion: (why) => `${why}. Yine de bir yardımcı ajan (subagent) başlatılsın mı?`,
  brakeDenied: (why) => `yardımcı ajan freni: ${why}`,
  brakeState: (at) => at === null ? "Yardımcı ajan freni kapalı." : `Yardımcı ajan freni açık: 5 saatlik hak %${at} dolunca yardımcı ajan başlamadan önce sorar.`,
  brakeUsage: "Şöyle yazılır: /budget brake <yüzde, ör. 85> | brake off",
  sectionEmpty: "Bütçe yok. /budget 20% yazarsan, bu sohbet 5 saatlik kullanım hakkından 20 puan harcayınca (5 saatlik hak yoksa haftalıktan) sonraki mesajından önce sorar; /budget $5 dolar sayar, abonelikte bu liste fiyatıyla bir tahmindir.",
  sectionOff: "session-budget kapalı: uyarı, devam sorusu ve yardımcı ajan freni yok. /session-budget on ile açılır."
};
const EN = {
  percent: (value) => `${value}%`,
  decimal: (fixed) => fixed,
  fiveHour: "5-hour",
  sevenDay: "weekly",
  listPrice: (pair) => `${pair} at list price`,
  etaMinutes: (minutes) => `runs out in ≈${minutes}m at this pace`,
  etaHours: (hours, rest) => `runs out in ≈${hours}h${rest === 0 ? "" : ` ${rest}m`} at this pace`,
  usage: "Write it as: /budget <share of the 5-hour allowance, e.g. 20%> | <$amount, e.g. $5> | off",
  tooMuch: "A budget can take 100% of the 5-hour allowance at most.",
  notPositive: "A budget must be more than zero.",
  stop: "Stop",
  goOn: "Continue anyway",
  header: "Budget",
  question: (said) => `The budget you set for this chat is used up: ${said}. Continue anyway?`,
  warned: (said) => `Budget warning: ${said}`,
  stoppedNotice: (spend) => `Stopped: budget is full · ${spend} · raise it with /budget`,
  dropped: (said) => `This chat's budget is used up: ${said}. Raise it with /budget, or remove it with /budget off.`,
  removed: "Session budget removed.",
  none: "No session budget. Set one with /budget 20% or /budget $5",
  status: (said) => `Session budget: ${said}`,
  percentUnit: (limit, isWeekly) => `${limit}% of the ${isWeekly ? "weekly" : "5-hour"} usage allowance`,
  estimateNote: " On a subscription $ is only an estimate at list prices; the share of your allowance is what counts.",
  waitForData: " Counting starts with the first usage measurement (the 5-hour allowance is only measured on a subscription).",
  set: (unit, wait) => `Session budget set: ${unit}.${wait}`,
  switched: (isOn) => `session-budget ${isOn ? "on" : "off"}`,
  budgetHelp: "Put a spending cap on this chat (a share of the 5-hour usage allowance, or a dollar amount), or set the helper-agent brake",
  toggleHelp: "Turn the budget warning, the continue question and the helper-agent brake on or off",
  budget: "Budget",
  rowTitle: (percent) => `Budget ${percent}`,
  raiseHint: "raise it with /budget",
  stoppedTitle: "Stopped: budget is full",
  eyebrow: "Session budget",
  full: "Budget is full",
  fullLine: (spend, percent) => `Budget is full · ${spend} (${percent})`,
  held: (step) => `Your message is on hold. Continuing raises the budget by ${step}.`,
  heldWrapped: (step) => `Your message is on hold. Continuing raises the budget by ${step}.`,
  fullAlt: (spend, percent, step) => `Session budget is full: ${spend} · ${percent}. Your message is on hold; continuing raises the budget by ${step}.`,
  brakeGo: "Continue",
  brakeHeader: "Helper agent",
  brakeWhy: (percent, pace, reset) => `5-hour usage allowance ${percent} used${pace}${reset}`,
  brakeWhyWeekly: (percent, pace, reset) => `weekly usage allowance ${percent} used${pace}${reset}`,
  brakePace: (time) => `, runs out by ${time} at this pace`,
  brakeReset: (time) => `, refills ${time}`,
  brakeQuestion: (why) => `${why}. Start a helper agent (subagent) anyway?`,
  brakeDenied: (why) => `helper-agent brake: ${why}`,
  brakeState: (at) => at === null ? "Helper-agent brake off." : `Helper-agent brake on: once ${at}% of the 5-hour allowance is used, it asks before a helper agent starts.`,
  brakeUsage: "Write it as: /budget brake <percent, e.g. 85> | brake off",
  sectionEmpty: "No budget set. With /budget 20%, once this chat has used 20 points of the 5-hour usage allowance (the weekly one where there is no 5-hour one), it asks before your next message goes; /budget $5 counts dollars, an estimate at list prices on a subscription.",
  sectionOff: "session-budget is off: no warning, no continue question, no helper-agent brake. /session-budget on turns it back on."
};
const words = () => pick({ en: EN, tr: TR });

const BRAKE_DEFAULT = 85;
const ACK_POINTS = 5;
const MAX_PERCENT$1 = 100;
const PACE_FLOOR = 50;
const PACE_MIN_SAMPLES = 3;
const PACE_MIN_SPAN_MS = 10 * 60000;
const PACE_LOOKBACK_MS = 60 * 60000;
const DAY_MS = 24 * 60 * 60000;
const WEEK_MS = 7 * DAY_MS;
const TWO_DIGITS = 2;
const SAME_WINDOW_MS = 10 * 60000;
function parseBrake(arg) {
  if (arg === "")
    return { kind: "brakeStatus" };
  if (arg === "off")
    return { kind: "brake", at: null };
  const match = /^(\d+(?:\.\d+)?)%?$/.exec(arg);
  const at = match === null ? Number.NaN : Number(match[1]);
  return at > 0 && at <= MAX_PERCENT$1 ? { kind: "brake", at } : { kind: "error", text: words().brakeUsage };
}
function isNewWindow(before, after) {
  if (before === null || after === null)
    return false;
  const delta = Date.parse(after) - Date.parse(before);
  return Number.isNaN(delta) ? before !== after : delta > SAME_WINDOW_MS;
}
function addPoint(points, point) {
  const last = points[points.length - 1];
  const kept = last !== undefined && point.value < last.value ? [] : points.filter((p) => point.t - p.t <= PACE_LOOKBACK_MS);
  return [...kept, point];
}
function slopeOf(points) {
  const meanT = points.reduce((sum, p) => sum + p.t, 0) / points.length;
  const meanV = points.reduce((sum, p) => sum + p.value, 0) / points.length;
  const top = points.reduce((sum, p) => sum + (p.t - meanT) * (p.value - meanV), 0);
  const bottom = points.reduce((sum, p) => sum + (p.t - meanT) ** 2, 0);
  return bottom === 0 ? 0 : top / bottom;
}
function fullAtOf(points, resetsAt, isWeekly = false) {
  const first = points[0];
  const last = points[points.length - 1];
  const resetMs = resetsAt === null ? Number.NaN : Date.parse(resetsAt);
  if (first === undefined || last === undefined || Number.isNaN(resetMs))
    return null;
  if (points.length < PACE_MIN_SAMPLES || last.t - first.t < PACE_MIN_SPAN_MS)
    return null;
  const slope = slopeOf(points);
  if (slope <= 0)
    return null;
  const elapsed = last.t - (resetMs - WEEK_MS);
  const pace = isWeekly && elapsed > 0 ? Math.min(slope, last.value / elapsed) : slope;
  const fullAt = last.t + (MAX_PERCENT$1 - last.value) / pace;
  return fullAt < resetMs ? fullAt : null;
}
function brakeWhy(spec) {
  const last = spec.points[spec.points.length - 1];
  if (spec.at === null || last === undefined)
    return null;
  const { ack } = spec;
  if (ack !== null && !isNewWindow(ack.window, spec.resetsAt) && last.value < ack.percent + ACK_POINTS)
    return null;
  const fullAt = last.value < PACE_FLOOR ? null : fullAtOf(spec.points, spec.resetsAt, spec.isWeekly === true);
  if (last.value < spec.at && fullAt === null)
    return null;
  const says = words();
  const percent = says.percent(says.decimal(String(last.value)));
  const pace = fullAt === null ? "" : says.brakePace(clockOf(fullAt, last.t));
  const reset = spec.resetsAt === null ? "" : says.brakeReset(clockOf(Date.parse(spec.resetsAt), last.t));
  return (spec.isWeekly === true ? says.brakeWhyWeekly : says.brakeWhy)(percent, pace, reset);
}
const pad = (value) => String(value).padStart(TWO_DIGITS, "0");
function clockOf(atMs, nowMs = atMs) {
  const at = new Date(atMs);
  const time = `${pad(at.getHours())}:${pad(at.getMinutes())}`;
  return atMs - nowMs > DAY_MS ? `${time} ${pad(at.getDate())}.${pad(at.getMonth() + 1)}` : time;
}

const WARN_RATIO = 0.8;
const FIVE_HOUR = "five_hour";
const SEVEN_DAY = "seven_day";
const MAX_PERCENT = 100;
const BRAKE = "brake";
const PERCENT = 100;
const MS_PER_MINUTE = 60000;
const MINUTES_PER_HOUR = 60;
const MIN_PACE_MS = 60000;
const USD_STEP = 1;
const PERCENT_STEP_SHARE = 5;
function parseCommand(raw) {
  const arg = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (arg === "" || arg === "status")
    return { kind: "status" };
  if (arg === "off" || arg === "clear")
    return { kind: "off" };
  if (arg.startsWith(BRAKE))
    return parseBrake(arg.slice(BRAKE.length));
  const usd = /^(?:\$(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)(?:\$|usd))$/.exec(arg);
  if (usd !== null)
    return positive("usd", Number(usd[1] ?? usd[2]));
  const percent = /^(\d+(?:\.\d+)?)%?$/.exec(arg);
  if (percent !== null) {
    const limit = Number(percent[1]);
    if (limit > MAX_PERCENT)
      return { kind: "error", text: words().tooMuch };
    return positive("percent", limit);
  }
  return { kind: "error", text: words().usage };
}
function positive(kind, limit) {
  return limit > 0 ? { kind: "set", budget: { kind, limit } } : { kind: "error", text: words().notPositive };
}
function windowOf(rateLimits) {
  return rateLimits.find((limit) => limit.kind === FIVE_HOUR) ?? rateLimits.find((limit) => limit.kind === SEVEN_DAY);
}
function readingOf(rateLimits, usd) {
  const window = windowOf(rateLimits);
  return { percent: window?.percentUsed ?? null, resetsAt: window?.resetsAt ?? null, usd: usd ?? null, scope: window?.kind };
}
function valueOf(kind, reading) {
  return kind === "percent" ? reading.percent : reading.usd;
}
function startBudget(kind, limit, reading) {
  const value = valueOf(kind, reading);
  const budget = { kind, limit, base: value, carried: 0, last: value, window: reading.resetsAt, hasWarned: false, isAccepted: false };
  return withScope(budget, reading);
}
function withScope(budget, reading) {
  if (reading.percent === null)
    return budget;
  return { ...budget, scope: budget.scope ?? reading.scope, isEstimate: true };
}
function advance(budget, reading) {
  const value = valueOf(budget.kind, reading);
  if (value === null)
    return budget;
  if (budget.base === null)
    return withScope({ ...budget, base: value, last: value, window: reading.resetsAt }, reading);
  const hasReset = budget.kind === "percent" && isNewWindow(budget.window, reading.resetsAt);
  if (!hasReset)
    return withScope({ ...budget, last: value, window: reading.resetsAt ?? budget.window }, reading);
  const before = Math.max(0, (budget.last ?? budget.base) - budget.base);
  return { ...budget, base: 0, carried: budget.carried + before, last: value, window: reading.resetsAt };
}
function spentOf(budget) {
  if (budget.base === null || budget.last === null)
    return budget.carried;
  return budget.carried + Math.max(0, budget.last - budget.base);
}
function ratioOf(budget) {
  return spentOf(budget) / budget.limit;
}
function stepOf(budget) {
  return Math.max(budget.kind === "usd" ? USD_STEP : 1, Math.round(budget.limit / PERCENT_STEP_SHARE));
}
function raise(budget) {
  return { ...budget, limit: Math.max(budget.limit, spentOf(budget)) + stepOf(budget) };
}
const decimal = (value, digits) => words().decimal(value.toFixed(digits));
const trim = (value) => words().decimal(value.toFixed(1).replace(/\.0$/, ""));
const amountOf = (budget, value) => budget.kind === "usd" ? `$${decimal(value, 2)}` : words().percent(trim(value));
const stepText = (budget) => budget.kind === "usd" ? `+$${stepOf(budget)}` : `+${words().percent(String(stepOf(budget)))}`;
const percentOf = (budget) => words().percent(String(Math.round(ratioOf(budget) * PERCENT)));
function spendText(budget) {
  const pair = `${amountOf(budget, spentOf(budget))} / ${amountOf(budget, budget.limit)}`;
  if (budget.kind === "usd")
    return budget.isEstimate === true ? words().listPrice(pair) : pair;
  return `${budget.scope === SEVEN_DAY ? words().sevenDay : words().fiveHour} ${pair}`;
}
const isWeekly = (scope) => scope === SEVEN_DAY;
function describe(budget) {
  return `${spendText(budget)} (${percentOf(budget)})`;
}
function etaMinutes(budget, nowMs) {
  const spent = spentOf(budget);
  const elapsed = budget.setAt === undefined ? 0 : nowMs - budget.setAt;
  if (spent <= 0 || elapsed < MIN_PACE_MS || spent >= budget.limit)
    return null;
  return Math.max(1, Math.round((budget.limit - spent) / spent * (elapsed / MS_PER_MINUTE)));
}
function etaText(minutes) {
  if (minutes === null)
    return "";
  if (minutes < MINUTES_PER_HOUR)
    return words().etaMinutes(minutes);
  return words().etaHours(Math.floor(minutes / MINUTES_PER_HOUR), minutes % MINUTES_PER_HOUR);
}

const SPAWN_TOOLS = /^(Agent|Task)$/;
const enabledAtom$1 = atom({ plugin: "session-budget", key: "isEnabled" }, true);
const brakeAtom$1 = atom({ plugin: "session-budget", key: "brakeAt" }, BRAKE_DEFAULT);
const ackAtom = atom({ plugin: "session-budget", key: "brakeAck" }, null);
const paceAtom$1 = atom({ plugin: "session-budget", key: "pace" }, { points: [], resetsAt: null });
const run$1 = { brake: null };
async function askBrake($, why) {
  const says = words();
  let answer = null;
  try {
    answer = await $.ui.ask(says.brakeQuestion(why), { options: [says.stop, says.brakeGo], header: says.brakeHeader });
  } catch {
    $.ui.log("session-budget: spawn brake not answered; spawn let through", { to: "debug" });
  }
  if (answer === says.stop)
    return false;
  const pace = await read($, paceAtom$1);
  const percent = pace.points[pace.points.length - 1]?.value ?? 0;
  await update($, ackAtom, () => ({ percent, window: pace.resetsAt }));
  return true;
}
async function heldWhy($) {
  if (!await read($, enabledAtom$1))
    return null;
  const pace = await read($, paceAtom$1);
  const ack = await read($, ackAtom);
  return brakeWhy({ at: await read($, brakeAtom$1), points: pace.points, resetsAt: pace.resetsAt, ack, isWeekly: isWeekly(pace.scope) });
}
function registerBrake(on) {
  on("tool.call", { tool: SPAWN_TOOLS }, async ($, e, next) => {
    const why = await heldWhy($);
    if (why === null)
      return next(e);
    run$1.brake ??= askBrake($, why).finally(() => {
      run$1.brake = null;
    });
    return await run$1.brake ? next(e) : { deny: words().brakeDenied(why) };
  }).catch(($, e, next) => next(e));
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
    `text{font-family:${FONT}}.num{font-family:${MONO};font-variant-numeric:tabular-nums}`,
    rules("dark"),
    `@media (prefers-color-scheme: light){${rules("light")}}`,
    extra,
    "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}",
    "</style>"
  ].join("");
}

const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const NARROW = "iljtf.,:;|!'` ·";
const WIDE = "mwMW@%";
function measure(text, size, isMono = false) {
  if (isMono)
    return [...text].length * size * 0.6;
  return [...text].reduce((sum, char) => {
    if (NARROW.includes(char))
      return sum + size * 0.3;
    if (WIDE.includes(char))
      return sum + size * 0.82;
    return sum + (char >= "A" && char <= "Z" ? size * 0.66 : size * 0.55);
  }, 0);
}
function svgDoc(spec) {
  const width = Math.ceil(spec.width);
  const height = Math.ceil(spec.height);
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  return { source: `${open}${svgStyle(spec.css)}${spec.body}</svg>`, alt: spec.alt, width, height };
}

const ROW = { h: 28, glyph: 16, textX: 24, baseline: 18.5 };
const TITLE = { size: 13, weight: 560 };
const DETAIL = 12;
const BOLD_SLACK = 1.06;
const SEP = " · ";
const METER = { width: 72, height: 6, gap: 12, scale: 1.25 };
const ICON_GRID = 24;
const ICON_STROKE = 1.5;
const GLYPHS = {
  gauge: '<path d="M4.6 16.8a8 8 0 1 1 14.8 0"/><path d="M12 14.2l3.6-4.2"/><circle cx="12" cy="14.6" r="1.1"/>',
  x: '<path d="M7 7l10 10M17 7L7 17"/>'
};
function mark(m) {
  const scale = m.size / ICON_GRID;
  return `<g class="s-mid" transform="translate(${m.x} ${m.y}) scale(${scale})" fill="none" stroke-width="${ICON_STROKE / scale}" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[m.icon]}</g>`;
}
const partWidth = (part) => measure(part.text, DETAIL, part.isMono);
const detailWidth = (parts) => parts.reduce((sum, part) => sum + measure(SEP, DETAIL) + partWidth(part), 0);
function detailRuns(parts) {
  return parts.map((part) => `<tspan class="f-lo">${SEP}</tspan><tspan class="f-mid${part.isMono === true ? " num" : ""}">${escape(part.text)}</tspan>`).join("");
}
function rowDoc(row) {
  const titleW = measure(row.title, TITLE.size) * BOLD_SLACK;
  const meterW = row.meter === undefined ? 0 : METER.gap + METER.width;
  const parts = [...row.parts];
  while (parts.length > 0 && ROW.textX + titleW + detailWidth(parts) + meterW > row.room) {
    const loose = parts.map((part) => part.isKept === true).lastIndexOf(false);
    parts.splice(loose >= 0 ? loose : parts.length - 1, 1);
  }
  const textEnd = ROW.textX + titleW + detailWidth(parts);
  const body = [
    mark({ x: 0, y: (ROW.h - ROW.glyph) / 2, size: ROW.glyph, icon: row.icon }),
    `<text x="${ROW.textX}" y="${ROW.baseline}" font-size="${DETAIL}"><tspan class="f-${row.ink}" font-size="${TITLE.size}" font-weight="${TITLE.weight}">${escape(row.title)}</tspan>${detailRuns(parts)}</text>`,
    row.meter === undefined ? "" : tidemarkMeter(textEnd + METER.gap, row.meter)
  ];
  return svgDoc({ width: textEnd + meterW + 2, height: ROW.h, body: body.join(""), alt: row.alt });
}
function tidemarkMeter(x, ratio) {
  const y = (ROW.h - METER.height) / 2;
  const mark = METER.width / METER.scale;
  const fill = Math.min(METER.width, Math.max(METER.height, ratio * mark));
  const r = METER.height / 2;
  return [
    `<rect class="f-track" x="${x}" y="${y}" width="${METER.width}" height="${METER.height}" rx="${r}"/>`,
    `<rect class="f-warn-t" x="${x + mark}" y="${y}" width="${METER.width - mark}" height="${METER.height}" rx="${r}"/>`,
    `<rect class="f-warn" x="${x}" y="${y}" width="${fill.toFixed(1)}" height="${METER.height}" rx="${r}"/>`,
    `<rect class="f-hi" x="${x + mark - 0.75}" y="${y - 4}" width="1.5" height="${METER.height + 8}" rx=".75"/>`
  ].join("");
}
function warnRowSvg(row) {
  const parts = [{ text: row.spend, isMono: true }, ...row.eta === "" ? [] : [{ text: row.eta }]];
  const alt = [words().budget, row.percent, row.spend, row.eta].filter((part) => part !== "").join(" · ");
  return rowDoc({ ink: "hi", icon: "gauge", title: words().rowTitle(row.percent), parts, room: row.room, meter: row.ratio, alt });
}
function stoppedRowSvg(spend, room) {
  const hint = words().raiseHint;
  const parts = [...spend === "" ? [] : [{ text: spend, isMono: true }], { text: hint, isKept: true }];
  const title = words().stoppedTitle;
  return rowDoc({ ink: "danger", icon: "x", title, parts, room, alt: `${title} · ${spend} · ${hint}` });
}
const CARD = { padX: 17, padTop: 9, padBottom: 12, radius: 10, glyph: 16, textX: 26 };
const CARD_Y = { icon: 7, headline: 20, body: 42, step: 18 };
const HEADLINE = 16;
const BODY = 12.5;
const META = 12;
const META_GAP = 24;
function wrapWords(text, width) {
  const lines = [];
  for (const word of text.split(" ")) {
    const last = lines[lines.length - 1];
    if (last !== undefined && measure(`${last} ${word}`, BODY) <= width)
      lines[lines.length - 1] = `${last} ${word}`;
    else
      lines.push(word);
  }
  return lines;
}
function cardMeta(card, room) {
  const headline = measure(words().full, HEADLINE) * BOLD_SLACK;
  return [`${card.spend} · ${card.percent}`, card.spend].find((text) => headline + measure(text, META, true) + META_GAP <= room) ?? "";
}
function fullCardSvg(card) {
  const inner = card.width - 2 * CARD.padX;
  const room = inner - CARD.textX;
  const says = words();
  const meta = cardMeta(card, room);
  const lines = wrapWords(says.heldWrapped(card.step), room);
  const height = CARD.padTop + CARD_Y.body + (lines.length - 1) * CARD_Y.step + CARD.padBottom;
  const x = (at) => CARD.padX + at;
  const y = (at) => CARD.padTop + at;
  const body = [
    `<rect class="f-card s-line" x=".5" y=".5" width="${card.width - 1}" height="${height - 1}" rx="${CARD.radius}"/>`,
    mark({ x: x(0), y: y(CARD_Y.icon), size: CARD.glyph, icon: "gauge" }),
    `<text class="f-hi" x="${x(CARD.textX)}" y="${y(CARD_Y.headline)}" font-size="${HEADLINE}" font-weight="600">${escape(says.full)}</text>`,
    meta === "" ? "" : `<text class="f-warn num" x="${x(inner)}" y="${y(CARD_Y.headline)}" font-size="${META}" text-anchor="end">${escape(meta)}</text>`,
    ...lines.map((line, i) => `<text class="f-mid" x="${x(CARD.textX)}" y="${y(CARD_Y.body + i * CARD_Y.step)}" font-size="${BODY}">${escape(line)}</text>`)
  ].join("");
  return svgDoc({ width: card.width, height, body, alt: says.fullAlt(card.spend, card.percent, card.step) });
}

const PX_PER_COLUMN = 8;
const CARD_CHROME = 6;
const DISMISS_RESERVE = 6;
const BOX_FRAME_PX = 34;
const CARD_MAX_PX = 560;
const CARD_MIN_PX = 300;
const ROW_MIN_PX = 240;
const TERMINAL_CELLS = 10;
const TERMINAL_MARK = 8;
const rowRoom = (columns) => Math.max(ROW_MIN_PX, (columns - DISMISS_RESERVE) * PX_PER_COLUMN);
const isDesktop = (ui, surface) => surface !== "terminal" && ("Svg" in ui);
const svgOf = (ui, drawn) => {
  const { Svg } = ui;
  return h(Svg, {
    source: drawn.source,
    alt: drawn.alt,
    width: drawn.width,
    height: drawn.height
  });
};
function noticeAbove(ui, row, spec) {
  const { Box, Button } = ui;
  return h(Box, {
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 1
  }, row, h(Button, {
    key: "sb-dismiss",
    plain: true,
    dimColor: true,
    role: "dismiss",
    onPress: spec.dismiss
  }, "✕")), spec.theirs);
}
function cellAt(index, filled) {
  if (index === TERMINAL_MARK)
    return "┃";
  return index < filled ? "━" : "─";
}
function terminalMeter(ui, ratio) {
  const { Text } = ui;
  const filled = Math.min(TERMINAL_CELLS, Math.max(1, Math.round(ratio * TERMINAL_MARK)));
  const cells = Array.from({ length: TERMINAL_CELLS }, (_, index) => cellAt(index, filled));
  return h(Text, null, h(Text, {
    color: "warning"
  }, cells.slice(0, filled).join("")), h(Text, {
    dimColor: true
  }, cells.slice(filled).join("")));
}
function warnRow(ui, spec) {
  const { Box, Text } = ui;
  const { budget } = spec;
  const eta = etaText(etaMinutes(budget, spec.nowMs));
  if (isDesktop(ui, spec.surface))
    return svgOf(ui, warnRowSvg({ percent: percentOf(budget), spend: spendText(budget), eta, ratio: ratioOf(budget), room: rowRoom(spec.columns) }));
  const text = [words().rowTitle(percentOf(budget)), spendText(budget), eta].filter((part) => part !== "").join(" · ");
  return h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    color: "warning"
  }, "!"), terminalMeter(ui, ratioOf(budget)), h(Text, {
    color: "warning",
    wrap: "truncate"
  }, text));
}
function stoppedRow(ui, spec) {
  const { Box, Text } = ui;
  if (isDesktop(ui, spec.surface))
    return svgOf(ui, stoppedRowSvg(spec.spend, rowRoom(spec.columns)));
  return h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    color: "error"
  }, "✕"), h(Text, {
    color: "error",
    wrap: "truncate"
  }, spec.text));
}
function fullCard(ui, spec) {
  const { Box, Text } = ui;
  const { budget } = spec;
  const width = Math.max(CARD_MIN_PX, Math.min(CARD_MAX_PX, (spec.columns - CARD_CHROME) * PX_PER_COLUMN + BOX_FRAME_PX));
  const card = isDesktop(ui, spec.surface) ? svgOf(ui, fullCardSvg({ spend: spendText(budget), percent: percentOf(budget), step: stepText(budget), width })) : h(Box, {
    flexDirection: "column",
    borderStyle: "round",
    borderColor: "warning",
    paddingX: 1
  }, h(Text, {
    bold: true,
    dimColor: true
  }, words().eyebrow), h(Text, {
    bold: true
  }, words().fullLine(spendText(budget), percentOf(budget))), h(Text, {
    dimColor: true
  }, words().held(stepText(budget))));
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, card, spec.theirs);
}
function isLive(notice, nowMs) {
  if (notice === undefined || notice === null)
    return false;
  const expiresAt = notice.expiresAt;
  return typeof expiresAt !== "number" || expiresAt <= 0 || expiresAt > nowMs;
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

function toneOf(budget) {
  if (budget === null)
    return "neutral";
  const ratio = ratioOf(budget);
  if (ratio >= 1)
    return "danger";
  return ratio >= WARN_RATIO ? "warn" : "neutral";
}
function budgetSection(spec) {
  const says = words();
  const base = { id: "budget", title: says.eyebrow, at: 0 };
  if (!spec.isEnabled)
    return { ...base, lines: [says.sectionOff], tone: "neutral", isEmpty: true };
  const brake = says.brakeState(spec.brakeAt);
  if (spec.budget === null)
    return { ...base, lines: [says.sectionEmpty, brake], tone: "neutral", isEmpty: true };
  const eta = etaText(etaMinutes(spec.budget, spec.nowMs));
  const head = says.status(describe(spec.budget));
  return { ...base, lines: [eta === "" ? head : `${head} · ${eta}`, brake], tone: toneOf(spec.budget) };
}

const BUDGET = "budget";
const TOGGLE = "session-budget";
const STORE_KEY = "session-budget.enabled";
const BRAKE_KEY = "session-budget.brake";
const PRIORITY = 1;
const DISMISS_AFTER_MS = 20000;
const RESTORE_AFTER_MS = 300;
const TYPED_ORIGINS = new Set(["composer", "bridge"]);
const budgetAtom = atom({ plugin: "session-budget", key: "budget" }, null);
const readingAtom = atom({ plugin: "session-budget", key: "reading" }, { percent: null, resetsAt: null, usd: null });
const noticeAtom = atom({ plugin: "session-budget", key: "notice" }, null);
const enabledAtom = atom({ plugin: "session-budget", key: "isEnabled" }, true);
const brakeAtom = atom({ plugin: "session-budget", key: "brakeAt" }, BRAKE_DEFAULT);
const paceAtom = atom({ plugin: "session-budget", key: "pace" }, { points: [], resetsAt: null });
const cacheTaxNotice = { plugin: "cache-tax", key: "notice" };
const knowNotice = { plugin: "you-should-know", key: "notice" };
const reflectNotice = { plugin: "reflect", key: "notice" };
const run = { nextId: 0, shownId: 0, section: "" };
async function publish($) {
  const spec = { budget: await read($, budgetAtom), brakeAt: await read($, brakeAtom), isEnabled: await read($, enabledAtom), nowMs: await $.clock.now() };
  const section = budgetSection(spec);
  const said = JSON.stringify(section);
  if (said === run.section)
    return;
  run.section = said;
  await $.state.set({ plugin: "session-budget", key: "section" }, section);
}
async function openUsage($) {
  if ((await $.state.get({ plugin: "hud-pro", key: "host" })).value !== true)
    return;
  await $.state.set({ plugin: "session-budget", key: "openUsage" }, { section: "budget", at: await $.clock.now() });
}
async function notify($, kind, text) {
  run.nextId += 1;
  const id = run.nextId;
  const expiresAt = await $.clock.now() + DISMISS_AFTER_MS;
  await update($, noticeAtom, () => ({ id, kind, text, isAlert: kind === "stopped", priority: PRIORITY, expiresAt }));
  dismissLater($, id);
}
function dismissLater($, id) {
  $.clock.after(DISMISS_AFTER_MS, () => {
    (async () => {
      const notice = await read($, noticeAtom);
      if (notice === null || notice.id !== id)
        return;
      const isPending = notice.kind === "warn" && run.shownId !== id && await read($, budgetAtom) !== null;
      if (!isPending)
        return update($, noticeAtom, () => null);
      const expiresAt = await $.clock.now() + DISMISS_AFTER_MS;
      await update($, noticeAtom, (current) => current?.id === id ? { ...current, expiresAt } : current);
      dismissLater($, id);
    })().catch(() => $.ui.log("session-budget: could not clear the notice", { to: "debug" }));
  });
}
async function checkWarn($, budget) {
  if (budget.hasWarned || ratioOf(budget) < WARN_RATIO || ratioOf(budget) >= 1)
    return;
  await update($, budgetAtom, (current) => current === null ? null : { ...current, hasWarned: true });
  await notify($, "warn", words().warned(describe(budget)));
}
async function setBudget($, args) {
  const command = parseCommand(args);
  if (command.kind === "error")
    return command.text;
  if (command.kind === "brake") {
    await update($, brakeAtom, () => command.at);
    await $.store.set(BRAKE_KEY, command.at ?? false);
  }
  if (command.kind === "brake" || command.kind === "brakeStatus")
    return words().brakeState(await read($, brakeAtom));
  if (command.kind === "off") {
    await update($, budgetAtom, () => null);
    return words().removed;
  }
  if (command.kind === "status") {
    const budget = await read($, budgetAtom);
    await openUsage($);
    return budget === null ? words().none : words().status(describe(budget));
  }
  const reading = await read($, readingAtom);
  const { kind, limit } = command.budget;
  const hasData = kind === "percent" ? reading.percent !== null : reading.usd !== null;
  const setAt = await $.clock.now();
  await update($, budgetAtom, () => ({ ...startBudget(kind, limit, reading), setAt }));
  const unit = kind === "percent" ? words().percentUnit(limit, isWeekly(reading.scope)) : `$${limit}`;
  const note = kind === "usd" && reading.percent !== null ? words().estimateNote : "";
  return words().set(unit, hasData ? note : words().waitForData);
}
async function confirm($, budget) {
  const says = words();
  const goOn = `${says.goOn} (${stepText(budget)})`;
  let answer = null;
  try {
    answer = await $.ui.ask(says.question(describe(budget)), { options: [says.stop, goOn], header: says.header });
  } catch {
    $.ui.log("session-budget: confirm dismissed; prompt let through", { to: "debug" });
  }
  if (answer === says.stop)
    return false;
  const accept = (current) => answer === null ? { ...current, isAccepted: true } : raise(current);
  await update($, budgetAtom, (current) => current === null ? null : accept(current));
  return true;
}
function restoreDraft($, text) {
  $.clock.after(RESTORE_AFTER_MS, () => {
    (async () => {
      const box = await $.prompt.read();
      if (box.text.trim() === "" && text.trim() !== "")
        await $.prompt.fill({ text });
    })().catch(() => $.ui.log("session-budget: could not put the prompt back", { to: "debug" }));
  });
}
async function isPersonTyped($, origin) {
  if (TYPED_ORIGINS.has(origin.kind))
    return true;
  return origin.kind === "sdk" && (await $.session.surfaces()).length > 0;
}
async function isOutranked($) {
  const nowMs = await $.clock.now();
  const cacheTax = await $.state.get(cacheTaxNotice);
  const know = await $.state.get(knowNotice);
  const reflect = await $.state.get(reflectNotice);
  return [cacheTax.value, know.value, reflect.value].some((value) => isLive(value, nowMs));
}
function registerSetup(on) {
  on("session.start", async ($, e, next) => {
    setLang(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    try {
      const saved = await $.store.get(STORE_KEY);
      await update($, enabledAtom, () => saved !== false);
      const brake = await $.store.get(BRAKE_KEY);
      if (brake === false || typeof brake === "number")
        await update($, brakeAtom, () => brake === false ? null : brake);
      const usage = await $.session.usage();
      await update($, readingAtom, () => readingOf(usage.rateLimits, usage.cost?.usd));
      await $.command.register({ name: BUDGET, description: words().budgetHelp, argumentHint: "<20% | $5 | off | brake 85 | brake off>" });
      await $.command.register({ name: TOGGLE, description: words().toggleHelp, argumentHint: "[on|off]" });
      await publish($);
    } catch {
      $.ui.log("session-budget: could not load settings", { to: "debug" });
    }
    return next(e);
  });
  on("command.run", { command: BUDGET }, async ($, e) => {
    const text = await setBudget($, e.args);
    await publish($);
    return { text };
  });
  on("command.run", { command: TOGGLE }, async ($, e) => {
    const arg = e.args.trim().toLowerCase();
    const isOn = arg === "on" || arg !== "off" && !await read($, enabledAtom);
    await update($, enabledAtom, () => isOn);
    await $.store.set(STORE_KEY, isOn);
    if (!isOn)
      await update($, noticeAtom, () => null);
    await publish($);
    return { text: words().switched(isOn) };
  });
}
function registerFlow(on) {
  on("session.measure", async ($, e, next) => {
    try {
      const reading = readingOf(e.rateLimits, e.cost?.usd);
      await update($, readingAtom, () => reading);
      await recordPace($, e.rateLimits);
      const budget = await read($, budgetAtom);
      if (budget !== null) {
        const advanced = advance(budget, reading);
        await update($, budgetAtom, () => advanced);
        if (await read($, enabledAtom))
          await checkWarn($, advanced);
      }
      await publish($);
    } catch {
      $.ui.log("session-budget: could not read usage", { to: "debug" });
    }
    return next(e);
  });
  on("prompt.submit", async ($, e, next) => {
    const budget = await read($, budgetAtom);
    const isOver = budget !== null && !budget.isAccepted && ratioOf(budget) >= 1;
    if (!isOver || !await read($, enabledAtom) || !await isPersonTyped($, e.origin))
      return next(e);
    if (await confirm($, budget))
      return next(e);
    await notify($, "stopped", words().stoppedNotice(spendText(budget)));
    restoreDraft($, e.text);
    return { drop: words().dropped(describe(budget)) };
  }).catch(($, e, next) => next(e));
}
function registerBand(on) {
  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    const theirs = await next(e);
    const notice = await read($, noticeAtom);
    if (notice === null || e.props.hasSurvey || !isLive(notice, await $.clock.now()))
      return theirs;
    if (await isOutranked($))
      return theirs;
    const ui = $.ui.resolve(e);
    const budget = await read($, budgetAtom);
    const dismiss = () => void update($, noticeAtom, () => null);
    if (notice.kind === "stopped") {
      const spend = budget === null ? "" : spendText(budget);
      return pinned(e, noticeAbove(ui, stoppedRow(ui, { text: notice.text, spend, surface: e.surface, columns: e.props.bodyColumns }), { theirs, dismiss }));
    }
    if (budget === null)
      return theirs;
    run.shownId = notice.id;
    return pinned(e, noticeAbove(ui, warnRow(ui, { budget, nowMs: await $.clock.now(), surface: e.surface, columns: e.props.bodyColumns }), { theirs, dismiss }));
  });
  on("ui.render", { component: "AskUserQuestion" }, async ($, e, next) => {
    const theirs = await next(e);
    const first = e.props.questions[0];
    const budget = await read($, budgetAtom);
    if (first?.header !== words().header || budget === null)
      return theirs;
    return pinned(e, fullCard($.ui.resolve(e), { budget, columns: e.viewport?.columns ?? 100, surface: e.surface, theirs }));
  });
}
async function recordPace($, rateLimits) {
  const window = windowOf(rateLimits);
  if (window === undefined)
    return;
  const point = { t: await $.clock.now(), value: window.percentUsed };
  await update($, paceAtom, (pace) => ({ points: addPoint(pace.points, point), resetsAt: window.resetsAt ?? null, scope: window.kind }));
}
const register = (on) => {
  registerSetup(on);
  registerFlow(on);
  registerBand(on);
  registerBrake(on);
};

export { register };
