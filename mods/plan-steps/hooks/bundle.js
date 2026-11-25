// Built by `bin/modz build` from the files beside it. Never edited by hand.
import { atom, read, update } from 'claude-code';

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
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
  waiting: "waiting",
  tickedAtOnce: "ticked at once",
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
  waiting: "bekliyor",
  tickedAtOnce: "toplu işaretlendi",
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
const WORDS = { en: EN, tr: TR };
const words = () => pick(WORDS);

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const PERCENT = 100;
const ETA_MIN_DONE = 3;
const FILES_MAX = 50;
const AGENTS_MAX = 20;
function emptyTrack(status) {
  return { status, startedAt: null, finishedAt: null, files: [], agents: [] };
}
function moved(track, status, now) {
  if (status === "in_progress")
    return { ...track, status, startedAt: track.startedAt ?? now, finishedAt: null };
  if (status === "completed")
    return { ...track, status, finishedAt: now };
  return { ...track, status, startedAt: null, finishedAt: null };
}
const isTickedUnseen = (track) => track !== undefined && track.status === "completed" && track.startedAt === null && track.finishedAt !== null;
function observe(tracks, steps, now) {
  const next = { ...tracks };
  for (const step of steps) {
    const track = next[step.key];
    if (track === undefined) {
      next[step.key] = step.status === "in_progress" ? moved(emptyTrack("pending"), "in_progress", now) : emptyTrack(step.status);
    } else if (track.status !== step.status) {
      next[step.key] = moved(track, step.status, now);
    }
  }
  return next;
}
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
function addFile(track, path) {
  const files = [...track.files.filter((file) => file !== path), path].slice(-FILES_MAX);
  return { ...track, files };
}
function addAgent(track, agent) {
  return { ...track, agents: [...track.agents.filter((one) => one.key !== agent.key), agent].slice(-AGENTS_MAX) };
}
function settleAgents(tracks, isMatch, patch) {
  const next = {};
  for (const [key, track] of Object.entries(tracks)) {
    next[key] = { ...track, agents: track.agents.map((agent) => isMatch(agent) ? { ...agent, ...patch } : agent) };
  }
  return next;
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
const WORD_CUT_SHARE = 0.6;
function clip(text, max) {
  if (text.length <= max)
    return text;
  const cut = text.slice(0, Math.max(1, max - 1));
  const space = cut.lastIndexOf(" ");
  return `${(space >= max * WORD_CUT_SHARE ? cut.slice(0, space) : cut).trimEnd()}…`;
}

const STALE_MS = 30 * 60000;
function planState(plan, at) {
  if (plan === null || plan.steps.length === 0)
    return "none";
  if (plan.steps.every((step) => step.status === "completed"))
    return "done";
  if (plan.steps.every((step) => step.status === "pending"))
    return "unstarted";
  if (at.isBusy === true)
    return "live";
  return at.now - at.touchedAt >= STALE_MS ? "stale" : "live";
}
const hasRunningAgent = (tracks) => Object.values(tracks).some((track) => track.agents.some((agent) => agent.isRunning));
const isShown = (state) => state === "live" || state === "done";
function stateNote(state, at) {
  if (state === "unstarted")
    return words().notStarted;
  if (state === "stale")
    return at.touchedAt < 0 ? words().waiting : words().waitingSince(formatDuration(at.now - at.touchedAt));
  return "";
}

const MAX_AGE_MS = 24 * 60 * 60000;
const SECTION_MAX = 600;
const SECTION_ID = "plan-steps:open-plan";
const STORE_KEY = "plans";
const STEP_TITLE_MAX = 80;
const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;
const HEX = 16;
const RESTORED = "stored-";
const LEAD = {
  compact: "The conversation was just compacted, so the plan it was following is no longer in view.",
  clear: "The conversation was cleared while a plan in this project was still open.",
  fresh: "A plan from an earlier session in this project is still open."
};
const TAIL = "Pick up from the first open step unless the person asks for something else, and keep the task list current.";
function signatureOf(steps) {
  let hash = FNV_OFFSET;
  for (const char of steps.map((step) => step.title.trim().toLowerCase()).join(`
`)) {
    hash = Math.imul(hash ^ (char.codePointAt(0) ?? 0), FNV_PRIME) >>> 0;
  }
  return hash.toString(HEX);
}
const isOpen = (steps) => steps.some((step) => step.status !== "completed");
const stepsOf = (plan) => plan.steps.map((step) => ({ title: step.title, status: step.status }));
const sameSteps = (a, b) => a.length === b.length && a.every((step, k) => step.title === b[k]?.title && step.status === b[k]?.status);
const plansOf = (value) => typeof value === "object" && value !== null ? value : {};
function withoutPlan(plans, root) {
  return Object.fromEntries(Object.entries(plans).filter(([at]) => at !== root));
}
function pruned(plans, now) {
  return Object.fromEntries(Object.entries(plans).filter(([, kept]) => now - kept.at <= MAX_AGE_MS));
}
function keptPlans(plans, seen) {
  const next = pruned(plans, seen.now);
  const { plan, root } = seen;
  if (plan === null || plan.steps.length === 0)
    return next;
  const steps = stepsOf(plan);
  const before = next[root];
  if (seen.dismissed === signatureOf(steps) || !isOpen(steps)) {
    delete next[root];
    return next;
  }
  if (before !== undefined && sameSteps(before.steps, steps))
    return next;
  return { ...next, [root]: { title: plan.source, steps, at: seen.now } };
}
function freshPlan(plans, at) {
  const kept = plans[at.root];
  if (kept === undefined || at.now - kept.at > MAX_AGE_MS || !isOpen(kept.steps))
    return null;
  return kept;
}
function stepLine(step) {
  return `
- ${clip(step.title, STEP_TITLE_MAX)}${step.status === "in_progress" ? " (in progress)" : ""}`;
}
function sectionText(plan, cause) {
  const done = plan.steps.filter((step) => step.status === "completed").length;
  const open = plan.steps.filter((step) => step.status !== "completed");
  const head = `${LEAD[cause]}
Plan: ${clip(plan.title, STEP_TITLE_MAX)}, ${done} of ${plan.steps.length} steps done. Open steps:`;
  const tail = `
${TAIL}`;
  const lines = [];
  for (const [k, step] of open.entries()) {
    const more = `
- and ${open.length - k - 1} more`;
    const line = stepLine(step);
    const reserve = k === open.length - 1 ? 0 : more.length;
    if (head.length + lines.join("").length + line.length + reserve + tail.length > SECTION_MAX) {
      lines.push(`
- and ${open.length - k} more`);
      break;
    }
    lines.push(line);
  }
  return head + lines.join("") + tail;
}
function restoredTasks(plan) {
  return plan.steps.map((step, k) => ({ id: `${RESTORED}${k}`, subject: step.title, status: step.status }));
}
const withoutRestored = (tasks) => tasks.filter((task) => !task.id.startsWith(RESTORED));

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

const carriedAtom$1 = atom({ plugin: "plan-steps", key: "carried" }, null);
const dismissedAtom$1 = atom({ plugin: "plan-steps", key: "dismissed" }, null);
const docAtom$4 = atom({ plugin: "plan-steps", key: "doc" }, null);
const tasksAtom$4 = atom({ plugin: "plan-steps", key: "tasks" }, []);
const reason$1 = (error) => error instanceof Error ? error.message : "unknown";
const isOpenPlan = (plan) => plan !== null && plan.steps.some((step) => step.status !== "completed");
async function currentPlan$3($) {
  return resolvePlan(await read($, tasksAtom$4), await read($, docAtom$4));
}
async function rootOf($) {
  try {
    return await $.session.root();
  } catch (error) {
    $.ui.log(`plan-steps: no project root (${reason$1(error)})`, { to: "debug" });
    return null;
  }
}
async function readPlans($) {
  return plansOf(await $.store.get(STORE_KEY));
}
async function keepPlan($, written) {
  const root = await rootOf($);
  if (root === null)
    return;
  try {
    const before = await readPlans($);
    const plan = resolvePlan(written.tasks ?? await read($, tasksAtom$4), written.doc === undefined ? await read($, docAtom$4) : written.doc);
    const next = keptPlans(before, { root, plan, dismissed: await read($, dismissedAtom$1), now: await $.clock.now() });
    if (!isSame(before, next))
      await $.store.set(STORE_KEY, next);
  } catch (error) {
    $.ui.log(`plan-steps: could not keep the plan (${reason$1(error)})`, { to: "debug" });
  }
}
async function arm($, plan, cause) {
  const signature = signatureOf(plan.steps);
  if (await read($, dismissedAtom$1) === signature)
    return;
  const carried = { text: sectionText(plan, cause), signature, at: await $.clock.now() };
  await update($, carriedAtom$1, () => carried);
}
async function restore($, cause) {
  const root = await rootOf($);
  if (root === null)
    return;
  try {
    const kept = freshPlan(await readPlans($), { root, now: await $.clock.now() });
    if (kept === null || await read($, dismissedAtom$1) === signatureOf(kept.steps))
      return;
    await update($, tasksAtom$4, () => restoredTasks(kept));
    await arm($, kept, cause);
  } catch (error) {
    $.ui.log(`plan-steps: could not bring the plan back (${reason$1(error)})`, { to: "debug" });
  }
}
async function isEmptyConversation($) {
  try {
    return await $.session.turns() === 0 && await currentPlan$3($) === null;
  } catch (error) {
    $.ui.log(`plan-steps: turns not readable (${reason$1(error)})`, { to: "debug" });
    return false;
  }
}
function keeping(on) {
  on("state.set", { plugin: "plan-steps", key: "tasks" }, async ($, e, next) => {
    const done = await next(e);
    await keepPlan($, { tasks: e.value });
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "plan-steps", key: "doc" }, async ($, e, next) => {
    const done = await next(e);
    await keepPlan($, { doc: e.value });
    return done;
  }).catch(($, e, next) => next(e));
}
function bringingBack(on) {
  on("session.start", { isInteractive: true }, async ($, e, next) => {
    const done = await next(e);
    if (await isEmptyConversation($))
      await restore($, "fresh");
    return done;
  }).catch(($, e, next) => next(e));
  on("session.end", { reason: "clear" }, async ($, e, next) => {
    const done = await next(e);
    await restore($, "clear");
    return done;
  }).catch(($, e, next) => next(e));
  on("session.compact", async ($, e, next) => {
    const result = await next(e);
    if (e.agentId !== undefined || e.trigger === "precompute" || result.messages === undefined)
      return result;
    const plan = await currentPlan$3($);
    if (isOpenPlan(plan))
      await arm($, { title: plan.source, steps: plan.steps }, "compact");
    return result;
  }).catch(($, e, next) => next(e));
}
function wireCarry(on) {
  keeping(on);
  bringingBack(on);
  on("prompt.compose", async ($, e, next) => {
    const composed = await next(e);
    const carried = await read($, carriedAtom$1);
    if (carried === null)
      return composed;
    const plan = await currentPlan$3($);
    if (!isOpenPlan(plan) || signatureOf(plan.steps) !== carried.signature)
      return composed;
    if (await read($, dismissedAtom$1) === carried.signature)
      return composed;
    return { sections: [...composed.sections, { id: SECTION_ID, text: carried.text, scope: "session" }] };
  }).catch(($, e, next) => next(e));
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
const WIDE_EM$1 = 1;
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
    return (char.codePointAt(0) ?? 0) >= FIRST_WIDE ? WIDE_EM$1 : UNKNOWN_EM;
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

const ROLES$1 = ["read", "edit", "run", "ok", "warn", "danger", "plan"];
const role = (fg, tint, line) => ({ fg, tint, line });
const DARK$1 = {
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
const LIGHT$1 = {
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
const palette$1 = (isLight) => isLight ? LIGHT$1 : DARK$1;
const OWN_BADGES = {
  doc: { dark: { fg: "#B8AADA", tint: "#252230" }, light: { fg: "#5A4691", tint: "#F6F4FD" } },
  misc: { dark: { fg: DARK$1.lo, tint: DARK$1.inset }, light: { fg: LIGHT$1.mid, tint: LIGHT$1.track } }
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
  const p = palette$1(isLight);
  const vars = {};
  const { roles, ...neutrals } = p;
  for (const [name, hex] of Object.entries(neutrals))
    vars[kebab(name)] = hex;
  for (const name of ROLES$1) {
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
const FONT$1 = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, 'Segoe UI', system-ui, sans-serif`;
const MONO = `ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace`;
const REDUCED$1 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
const varBlock = (vars, names) => `svg{${names.map((name) => `--${name}:${vars[name]}`).join(";")}}`;
function svgStyle$1(body) {
  const used = body === undefined ? PAINTS : PAINTS.filter((name) => new RegExp(`[fs]-${name}\\b(?!-)`).test(body));
  const rules = used.map((name) => `.f-${name}{fill:var(--${name})}.s-${name}{stroke:var(--${name})}`).join("");
  const loops = Object.keys(LOOPS).filter((name) => body === undefined || body.includes(name)).map((name) => LOOPS[name]).join("");
  return [
    varBlock(paintVars(false), used),
    `@media (prefers-color-scheme: light){${varBlock(paintVars(true), used)}}`,
    `text{font-family:${FONT$1}}.mono{font-family:${MONO};font-variant-numeric:tabular-nums}`,
    rules,
    loops,
    REDUCED$1
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

const STROKE = 1.75;
const CAP_EM = 0.7;
const DECIMALS = 100;
const SCALE_DIGITS = 4;
const TYPE$1 = {
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
const SCHEME$1 = ":root{color-scheme:light dark}";
function toPic(part) {
  const { width, height } = part;
  const source = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`,
    ` role="img" aria-label="${escapeXml(part.alt)}"><style>${SCHEME$1}${svgStyle$1(part.body)}</style>${part.body}</svg>`
  ].join("");
  return { source, width, height, alt: part.alt };
}
const place$1 = (body, x, y) => x === 0 && y === 0 ? body : `<g transform="translate(${num(x)} ${num(y)})">${body}</g>`;
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
const DOT$1 = 6;
const DOT_GAP = 7;
const META_GAP$1 = 12;
const META = TYPE$1.label;
const eyebrowTracking = () => TYPE$1.eyebrow.size * TYPE$1.eyebrow.tracking;
const eyebrowWidth = (label) => sans(TYPE$1.eyebrow.size, TYPE$1.eyebrow.weight)(label) + [...label].length * eyebrowTracking();
function eyebrowPart(o) {
  const y = baseline(0, EYEBROW_H, TYPE$1.eyebrow.size);
  const left = o.hasDot ? DOT$1 + DOT_GAP : 0;
  const meta = o.meta ? fitText(o.meta, o.width / 2, sans(META.size, META.weight)) : "";
  const metaW = meta ? sans(META.size, META.weight)(meta) + META_GAP$1 : 0;
  const label = fitText(o.text, o.width - left - metaW, eyebrowWidth);
  const parts = [
    o.hasDot ? `<circle cx="${DOT$1 / 2}" cy="${EYEBROW_H / 2}" r="${DOT$1 / 2}" class="f-${o.role ?? "lo"}"/>` : "",
    textEl({ x: left, y, text: label, paint: "lo", ...TYPE$1.eyebrow, tracking: eyebrowTracking() }),
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
  const size = o.size ?? TYPE$1.headline.size;
  const opts = {
    ...o,
    size,
    weight: o.weight ?? TYPE$1.headline.weight,
    lineHeight: o.lineHeight ?? Math.round(size * LINE_RATIO),
    paint: o.paint ?? "hi",
    maxLines: o.maxLines ?? 2
  };
  const lines = wrapText(o.text, { max: o.width - MARK_PAD, maxLines: opts.maxLines, measure: sans(size, opts.weight) });
  const spans = markSpans(lines, o.text, o.mark);
  const body = lines.map((line, i) => lineMarkup({ line, span: spans[i] ?? null, top: i * opts.lineHeight, opts })).join("");
  return { body, width: o.width, height: lines.length * opts.lineHeight, alt: o.text };
}
const bodyPart = (o) => linesPart({ size: TYPE$1.body.size, weight: TYPE$1.body.weight, lineHeight: TYPE$1.body.line, paint: "mid", ...o });

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
    place$1(eyebrow.body, textX, 0),
    title ? place$1(title.body, textX, headlineTop) : "",
    sub ? place$1(sub.body, textX, subTop) : ""
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
  const p = palette$1(isLight);
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

const DOT = 8;
const PITCH = 24;
const DOTS_H = 12;
const RING_STROKE = 1.5;
const CORE_R = 1.75;
const LINK_GAP = 3;
const LINK_DONE_OPACITY = 0.55;
const DASH = "1.6 1.6";
const CAPTION_GAP = 12;
const MARK$1 = 3;
const ringR = DOT / 2 - RING_STROKE / 2;
function dot(state, cx, role) {
  const cy = DOTS_H / 2;
  const ring = (paint, extra = "") => `<circle cx="${cx}" cy="${cy}" r="${ringR}" class="s-${paint}" stroke-width="${RING_STROKE}" fill="none"${extra}/>`;
  if (state === "done")
    return `<circle cx="${cx}" cy="${cy}" r="${DOT / 2}" class="f-mid"/>`;
  if (state === "active")
    return ring(role) + `<circle cx="${cx}" cy="${cy}" r="${CORE_R}" class="f-${role} breathe"/>`;
  if (state === "pending")
    return ring("line-strong");
  if (state === "skipped")
    return ring("line-strong", ` stroke-dasharray="${DASH}"`);
  return `<path d="M${cx - MARK$1} ${cy - MARK$1}l${MARK$1 * 2} ${MARK$1 * 2}M${cx + MARK$1} ${cy - MARK$1}l${-MARK$1 * 2} ${MARK$1 * 2}" class="s-danger" stroke-width="${RING_STROKE + 0.25}" stroke-linecap="round"/>`;
}
function link(from, isDone) {
  const x = from + DOT / 2 + LINK_GAP;
  const width = PITCH - DOT - LINK_GAP * 2;
  return rectEl({ x, y: DOTS_H / 2, width, height: 1, paint: isDone ? "mid" : "line-strong" }, isDone ? ` fill-opacity="${LINK_DONE_OPACITY}"` : "");
}
function stepDotsPart(o) {
  const role = o.role ?? "run";
  const centers = o.steps.map((_, i) => DOT / 2 + i * PITCH);
  const links = centers.slice(1).map((_, i) => link(centers[i] ?? 0, o.steps[i] === "done" && o.steps[i + 1] === "done"));
  const dots = o.steps.map((state, i) => dot(state, centers[i] ?? 0, role));
  const end = (centers[centers.length - 1] ?? 0) + DOT / 2;
  const caption = o.caption ?? "";
  const captionX = end + CAPTION_GAP;
  const width = Math.ceil(caption ? captionX + sans(TYPE$1.label.size, TYPE$1.label.weight)(caption) : end);
  const text = caption ? textEl({ x: captionX, y: baseline(0, DOTS_H, TYPE$1.label.size), text: caption, paint: "mid", ...TYPE$1.label }) : "";
  const done = o.steps.filter((state) => state === "done").length;
  return { body: links.join("") + dots.join("") + text, width, height: DOTS_H, alt: `${done}/${o.steps.length}${caption ? ` · ${caption}` : ""}` };
}
const stepDots = (o) => toPic(stepDotsPart(o));

const NEXT_MAX = 72;
const CARD_CELLS = 6;
const DOT_DONE = "●";
const DOT_OPEN = "○";
const LINK = "─";
function runsOf(marks, link) {
  const runs = [];
  for (const [k, mark] of marks.entries()) {
    const text = `${k === 0 ? "" : link}${mark === "done" ? DOT_DONE : DOT_OPEN}`;
    const last = runs[runs.length - 1];
    if (last !== undefined && last.mark === mark)
      last.text += text;
    else
      runs.push({ mark, text });
  }
  return runs;
}
function textDots(draw, notice, room) {
  const { Box, Text } = draw.ui;
  const caption = ` ${notice.done}/${notice.total}`;
  const linked = notice.marks.length * 2 - 1 + caption.length <= room;
  if (!linked && notice.marks.length + caption.length > room)
    return null;
  const runs = runsOf(notice.marks, linked ? LINK : "");
  return h(Box, {
    key: "plan-dots",
    flexDirection: "row"
  }, runs.map((run, k) => h(Text, {
    key: `dots-${k}`,
    dimColor: run.mark === "open" ? true : undefined
  }, run.text)), h(Text, {
    dimColor: true
  }, caption));
}
function svgDots(draw, notice, width) {
  if (!("Svg" in draw.ui))
    return null;
  const { Svg } = draw.ui;
  const pic = stepDots({ steps: notice.marks.map((mark) => mark === "done" ? "done" : "pending"), caption: `${notice.done}/${notice.total}` });
  return pic.width > width ? null : h(Svg, {
    key: "plan-dots",
    ...pic
  });
}
function finishCard(draw, view) {
  const say = words();
  const { notice, actions } = view;
  const isText = isTextSurface(draw.ui, draw.surface);
  const width = cardInnerWidth(view.columns);
  const dots = isText ? textDots(draw, notice, view.columns - CARD_CELLS) : svgDots(draw, notice, width);
  const buttons = ButtonRow(draw, {
    buttons: [
      { key: "plan-continue", label: say.finishContinue, variant: "primary", onPress: actions.onContinue },
      { key: "plan-done", label: say.finishMarkDone, variant: "secondary", onPress: actions.onMarkDone },
      { key: "plan-later", label: say.finishNotNow, variant: "plain", onPress: actions.onNotNow }
    ]
  });
  const header = {
    icon: "list",
    eyebrow: say.finishEyebrow,
    meta: notice.source,
    headline: say.finishHeadline(notice.total - notice.done, notice.total),
    sub: notice.next === "" ? undefined : say.finishNext(clip(notice.next, NEXT_MAX)),
    width
  };
  return Card(draw, { header, children: dots === null ? [buttons] : [dots, buttons] });
}

const MAX_AUTO_CONTINUES = 2;
const openSteps = (plan) => plan.steps.filter((step) => step.status !== "completed");
function isGuarded(facts) {
  const { plan } = facts;
  if (plan === null || !facts.isTouched || openSteps(plan).length === 0)
    return false;
  if (plan.steps.every((step) => step.status === "pending"))
    return false;
  return facts.dismissed !== signatureOf(plan.steps);
}
const heldKey = (plan) => `${signatureOf(plan.steps)}:${plan.steps.length - openSteps(plan).length}`;
function heldCount(held, signature) {
  return held !== null && held.signature === signature ? held.count : 0;
}
function finishCall(facts) {
  if (!isGuarded(facts))
    return "none";
  if (!facts.isStrict)
    return "card";
  return heldCount(facts.held, heldKey(facts.plan)) < MAX_AUTO_CONTINUES ? "continue" : "card";
}
const LIVE_AGENT$1 = ["pending", "running", "waiting"];
const isAgentLive = (status) => LIVE_AGENT$1.includes(String(status));
const notifiedIds = (text) => typeof text === "string" ? [...text.matchAll(/<task-id>\s*([^<\s]+)\s*<\/task-id>/g)].map((found) => found[1] ?? "") : [];
const SHELL_DEFAULT_MS = 30 * 60 * 1000;
const shellBudget = (timeout) => typeof timeout === "number" && timeout > 0 ? timeout : SHELL_DEFAULT_MS;
function nextStep(plan) {
  const open = openSteps(plan);
  return (open.find((step) => step.status === "in_progress") ?? open[0])?.title ?? "";
}
function noticeOf(plan, at) {
  return {
    signature: signatureOf(plan.steps),
    done: plan.steps.length - openSteps(plan).length,
    total: plan.steps.length,
    marks: plan.steps.map((step) => step.status === "completed" ? "done" : "open"),
    next: nextStep(plan),
    source: plan.source,
    at
  };
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

const carriedAtom = atom({ plugin: "plan-steps", key: "carried" }, null);
const dismissedAtom = atom({ plugin: "plan-steps", key: "dismissed" }, null);
const docAtom$3 = atom({ plugin: "plan-steps", key: "doc" }, null);
const heldAtom = atom({ plugin: "plan-steps", key: "held" }, null);
const noticeAtom = atom({ plugin: "plan-steps", key: "notice" }, null);
const tasksAtom$3 = atom({ plugin: "plan-steps", key: "tasks" }, []);
const cacheTaxNotice = { plugin: "cache-tax", key: "notice" };
const knowNotice = { plugin: "you-should-know", key: "notice" };
const reflectNotice = { plugin: "reflect", key: "notice" };
const budgetNotice = { plugin: "session-budget", key: "notice" };
const testBadgeNotice = { plugin: "test-badge", key: "notice" };
const handoffNotice = { plugin: "handoff", key: "notice" };
const turn = { startedAt: 0, isLight: false };
const reason = (error) => error instanceof Error ? error.message : "unknown";
async function currentPlan$2($) {
  return resolvePlan(await read($, tasksAtom$3), await read($, docAtom$3));
}
async function hasLouderNotice($) {
  const others = [
    await $.state.get(cacheTaxNotice),
    await $.state.get(knowNotice),
    await $.state.get(reflectNotice),
    await $.state.get(budgetNotice),
    await $.state.get(testBadgeNotice),
    await $.state.get(handoffNotice)
  ];
  return others.some((other) => other.value !== undefined && other.value !== null);
}
async function clearNotice($) {
  if (await read($, noticeAtom) !== null)
    await update($, noticeAtom, () => null);
}
function submit($, title) {
  $.prompt.submit({ text: words().continuePrompt(title) }).catch((error) => {
    $.ui.log(`plan-steps: could not continue the plan (${reason(error)})`, { to: "debug" });
  });
}
async function refreshLook($) {
  try {
    turn.isLight = resolveLight({ theme: (await $.config.list()).find((row) => row.key === "theme")?.value });
  } catch (error) {
    $.ui.log(`plan-steps: theme not readable (${reason(error)})`, { to: "debug" });
  }
}
const background = { stopTasks: 0, shells: new Map };
async function hasBackgroundWork($) {
  if (background.stopTasks > 0)
    return true;
  const now = await $.clock.now();
  if ([...background.shells.values()].some((until) => until > now))
    return true;
  try {
    return (await $.agent.list()).some((agent) => isAgentLive(agent.status));
  } catch (error) {
    $.ui.log(`plan-steps: the agents could not be listed (${reason(error)})`, { to: "debug" });
    return false;
  }
}
async function guard($, ctx) {
  if (await hasBackgroundWork($))
    return;
  const plan = await currentPlan$2($);
  const facts = { plan, isTouched: ctx.touchedAt() >= turn.startedAt, dismissed: await read($, dismissedAtom), held: await read($, heldAtom), isStrict: ctx.isStrict };
  const call = finishCall(facts);
  if (call === "none" || plan === null)
    return;
  if (call === "card") {
    await refreshLook($);
    const notice = noticeOf(plan, await $.clock.now());
    await update($, noticeAtom, () => notice);
    return;
  }
  const signature = heldKey(plan);
  await update($, heldAtom, (held) => ({ signature, count: heldCount(held, signature) + 1 }));
  submit($, nextStep(plan));
}
async function markDone($, signature) {
  await update($, dismissedAtom, () => signature);
  if (await read($, carriedAtom) !== null)
    await update($, carriedAtom, () => null);
  try {
    const root = await $.session.root();
    const plans = plansOf(await $.store.get(STORE_KEY));
    if (plans[root] !== undefined)
      await $.store.set(STORE_KEY, withoutPlan(plans, root));
  } catch (error) {
    $.ui.log(`plan-steps: could not drop the kept plan (${reason(error)})`, { to: "debug" });
  }
}
function actionsFor($) {
  return {
    onContinue: () => void (async () => {
      const notice = await read($, noticeAtom);
      await clearNotice($);
      if (notice !== null)
        submit($, notice.next);
    })(),
    onMarkDone: () => void (async () => {
      const notice = await read($, noticeAtom);
      await clearNotice($);
      if (notice !== null)
        await markDone($, notice.signature);
    })(),
    onNotNow: () => void clearNotice($)
  };
}
function wireFinish(on, ctx) {
  on("turn.start", async ($, e, next) => {
    turn.startedAt = await $.clock.now();
    background.stopTasks = 0;
    for (const id of notifiedIds(e.text))
      background.shells.delete(id);
    await clearNotice($);
    return next(e);
  }).catch(($, e, next) => next(e));
  on("tool.call", { tool: "Bash" }, async ($, e, next) => {
    const ran = await next(e);
    const id = ran.result?.backgroundTaskId;
    if (typeof id === "string")
      background.shells.set(id, await $.clock.now() + shellBudget(e.timeout));
    return ran;
  }).catch(($, e, next) => next(e));
  on("classic.Stop", async ($, e, next) => {
    background.stopTasks = e.background_tasks?.length ?? 0;
    return next(e);
  }).catch(($, e, next) => next(e));
  on("turn.complete", { reason: "answer" }, async ($, e, next) => {
    const done = await next(e);
    if (e.agentId === undefined)
      await guard($, ctx);
    return done;
  }).catch(($, e, next) => next(e));
  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    if (e.props.hasSurvey)
      return next(e);
    const theirs = await next(e);
    const notice = await read($, noticeAtom);
    if (notice === null || e.props.isWorking || await hasLouderNotice($))
      return theirs;
    const ui = $.ui.resolve(e);
    const card = finishCard({ ui, surface: e.surface, isLight: turn.isLight }, { notice, columns: e.props.bodyColumns, actions: actionsFor($) });
    const { Box } = ui;
    return pinned(e, h(Box, {
      flexDirection: "column",
      gap: 1
    }, card, theirs));
  });
}

const HUB_PANE = "plan";
const STEP_MAX = 60;
function hubOf(progress, state, current = null) {
  if (progress === null || progress.total === 0)
    return { detail: "", tone: "idle" };
  const say = words();
  if (progress.done >= progress.total)
    return { detail: say.hubDone(progress.total), tone: "ok" };
  if (state === "unstarted")
    return { detail: say.hubUnstarted(progress.total), tone: "idle" };
  if (state === "stale")
    return { detail: say.hubWaiting(progress.done, progress.total), tone: "idle" };
  const shown = { detail: say.hubLive(progress.done, progress.total), tone: "live" };
  if (current === null)
    return shown;
  const line = { label: clip(current.title, STEP_MAX), ...current.startedAt === null ? {} : { since: current.startedAt } };
  return { ...shown, live: { lines: [line] } };
}
const isShowing = (card, shown) => card !== undefined && card.detail === shown.detail && card.tone === shown.tone && JSON.stringify(card.live) === JSON.stringify(shown.live);
function isOpenFor(value, pane) {
  return typeof value === "object" && value !== null && value.pane === pane;
}

const NUDGE_CALLS = 15;
const DESK_PLAN$1 = "mcp__ccd_turn__update_plan";
const docAtom$2 = atom({ plugin: "plan-steps", key: "doc" }, null);
const tasksAtom$2 = atom({ plugin: "plan-steps", key: "tasks" }, []);
let calls = 0;
let dueId = null;
async function currentPlan$1($) {
  return resolvePlan(await read($, tasksAtom$2), await read($, docAtom$2));
}
const resetNudge = () => {
  calls = 0;
  dueId = null;
};
async function noteCall($, call) {
  if (call.tool === DESK_PLAN$1 || typeof call.tool_use_id !== "string")
    return;
  const plan = await currentPlan$1($).catch(() => null);
  const isOpen = plan !== null && plan.steps.some((step) => step.status !== "completed");
  if (countCall(call.agentId === undefined, isOpen))
    dueId = call.tool_use_id;
}
const NUDGE_TEXT = `Plan check: ${NUDGE_CALLS} tool calls since your task list last moved. If a step is finished, tick it now ` + "(update_plan with advance, or done/start), one step at a time, so the person sees the plan as it really stands.";
function countCall(isMainLoop, isOpenPlan) {
  if (!isMainLoop || !isOpenPlan)
    return false;
  calls += 1;
  return calls % NUDGE_CALLS === 0;
}
function wireNudge(on) {
  on("classic.PostToolUse", async ($, e, next) => {
    const result = await next(e);
    if (dueId === null || e.tool_use_id !== dueId)
      return result;
    dueId = null;
    return { ...result, additionalContext: [...result.additionalContext ?? [], NUDGE_TEXT] };
  }).catch(($, e, next) => next(e));
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

const paneKept = () => ({ isHeld: false, needsDraw: true });
const NOTE_PREFIX = "pane-open/";
const noteKey = (sessionId) => `${NOTE_PREFIX}${sessionId}`;
const DAY_MS = 24 * 60 * 60 * 1000;
const NOTE_FRESH_MS = DAY_MS;
const NOTE_TTL_MS = 7 * DAY_MS;
const isNoted = (value) => value === true || typeof value === "number";
async function drawSafely(kept, o) {
  try {
    const drawn = await o.draw();
    kept.needsDraw = false;
    return drawn;
  } catch (cause) {
    kept.needsDraw = true;
    o.log(`the pane fell back to its plain list (${String(cause)})`);
    return o.plain(cause);
  }
}
const PLAIN_MAX = 20;
function plainPane(ui, o) {
  const { Box, Text } = ui;
  const shown = o.lines.slice(0, PLAIN_MAX);
  return h(Box, {
    flexDirection: "column"
  }, o.head, h(Text, {
    dimColor: true
  }, o.notice), shown.map((line, i) => h(Text, {
    key: `plain-${i}`,
    wrap: "truncate-end"
  }, line)), o.lines.length > shown.length && h(Text, {
    dimColor: true
  }, "…"));
}
function reopenKeptTab(kept, nouns) {
  if (kept.isHeld)
    return;
  kept.isHeld = true;
  nouns.soon(() => {
    (async () => {
      if (!await nouns.isListed())
        await nouns.reopen();
    })().catch((cause) => nouns.log(`could not reopen the pane (${String(cause)})`));
  });
}
async function restorePane(kept, nouns) {
  try {
    if (isNoted(await nouns.note.read())) {
      kept.isHeld = true;
      if (!await nouns.isListed())
        await nouns.reopen();
    }
  } catch (cause) {
    nouns.log(`could not restore the pane (${String(cause)})`);
  }
  nouns.redraw();
}
async function watchPane(kept, nouns, isBeat = false) {
  try {
    const isOpen = await nouns.isListed();
    kept.isHeld ||= isOpen;
    if (!isOpen)
      kept.needsDraw = true;
    const noted = await nouns.note.read();
    const now = await nouns.now();
    const isFresh = typeof noted === "number" && now - noted < NOTE_FRESH_MS;
    if (isOpen && !isFresh)
      await nouns.note.write(now);
    if (!isOpen && isNoted(noted))
      await nouns.note.write(undefined);
    if (isOpen && (kept.needsDraw || isBeat))
      nouns.redraw();
  } catch (cause) {
    nouns.log(`could not look at the pane (${String(cause)})`);
  }
}
function staleNotes(entries, o) {
  return entries.filter(([key, value]) => key.startsWith(NOTE_PREFIX) && key !== o.own && !(typeof value === "number" && o.now - value < NOTE_TTL_MS)).map(([key]) => key);
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

const PLAN_PATH = /(^|\/)(docs\/(.+\/)?plans\/[^/]+\.md|PLAN\.md|[^/]+\.plan\.md)$/i;
const MARKDOWN = /\.(md|markdown)$/i;
const FENCE = /^\s*(```|~~~)/;
const STEP_HEADING = /^#{2,4}\s+(?:(?:task|step|adım|görev|phase|aşama)\s*(\d+)\b\s*[:.)\-–—]?\s*(.*)|(\d+)[.)]\s+(.+))$/i;
const CHECKBOX = /^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/;
const NUMBERED = /^(\d+)[.)]\s+(.+)$/;
const NESTED_INDENT = 2;
const MIN_STEPS = 2;
const MIN_LOOSE_CHECKBOXES = 3;
function isPlanPath(path) {
  return PLAN_PATH.test(path);
}
function isMarkdownPath(path) {
  return MARKDOWN.test(path);
}
function cleanTitle(text) {
  return text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`]+/g, "").replace(/\s+/g, " ").trim().replace(/[:.]$/, "").trim();
}
function visibleLines(markdown) {
  const lines = [];
  let isInFence = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (FENCE.test(line))
      isInFence = !isInFence;
    else if (!isInFence)
      lines.push(line);
  }
  return lines;
}
function newStep(title, number) {
  return { title, number, isChecked: false, checksDone: 0, checksTotal: 0 };
}
function count(step, mark) {
  step.checksTotal += 1;
  if (mark !== " ")
    step.checksDone += 1;
}
function fromHeadings(lines) {
  const steps = [];
  let current = null;
  for (const line of lines) {
    const heading = STEP_HEADING.exec(line.trim());
    if (heading !== null) {
      const number = Number(heading[1] ?? heading[3]);
      const title = cleanTitle(heading[2] ?? heading[4] ?? "");
      current = newStep(title === "" ? words().stepTitle(number) : title, number);
      steps.push(current);
    } else if (/^#{1,3}\s/.test(line.trim())) {
      current = null;
    } else if (current !== null) {
      const box = CHECKBOX.exec(line);
      if (box !== null)
        count(current, box[2] ?? " ");
    }
  }
  return steps;
}
function fromCheckboxes(lines) {
  const steps = [];
  for (const line of lines) {
    const box = CHECKBOX.exec(line);
    if (box === null)
      continue;
    const indent = (box[1] ?? "").replace(/\t/g, "  ").length;
    const mark = box[2] ?? " ";
    const parent = steps[steps.length - 1];
    if (indent >= NESTED_INDENT && parent !== undefined) {
      count(parent, mark);
    } else {
      const step = newStep(cleanTitle(box[3] ?? ""), null);
      step.isChecked = mark !== " ";
      steps.push(step);
    }
  }
  return steps;
}
function fromNumbered(lines) {
  let best = [];
  let run = [];
  for (const line of lines) {
    const item = NUMBERED.exec(line);
    if (item === null) {
      if (/^#{1,6}\s/.test(line.trim()))
        run = [];
      continue;
    }
    const number = Number(item[1]);
    if (number === 1)
      run = [];
    else if (number !== run.length + 1)
      continue;
    run.push(newStep(cleanTitle(item[2] ?? ""), number));
    if (run.length > best.length)
      best = run;
  }
  return best;
}
function parsePlan(markdown) {
  const lines = visibleLines(markdown);
  const headed = fromHeadings(lines);
  if (headed.length >= MIN_STEPS)
    return { steps: headed, isStructured: true };
  const boxed = fromCheckboxes(lines);
  const boxCount = boxed.reduce((sum, step) => sum + 1 + step.checksTotal, 0);
  if (boxed.length >= MIN_STEPS) {
    return { steps: boxed, isStructured: boxCount >= MIN_LOOSE_CHECKBOXES };
  }
  const numbered = fromNumbered(lines);
  return numbered.length >= MIN_STEPS ? { steps: numbered, isStructured: false } : null;
}
function baseName(path) {
  return path.split("/").pop() ?? path;
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

const FILES_SHOWN$1 = 3;
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
  const rows = files.slice(0, FILES_SHOWN$1).map((path, n) => fileRow(path, { ...frame, top: frame.top + n * FILE_ROW }));
  const shown = Math.min(files.length, FILES_SHOWN$1);
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

const DARK = {
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
const LIGHT = {
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
const ROLES = {
  run: { dark: { fg: "#B19CF3", tint: "#29243D", line: "#4A3F75" }, light: { fg: "#6243C4", tint: "#F0ECFC", line: "#CFC3F3" } },
  ok: { dark: { fg: "#6FC593", tint: "#1B2F25", line: "#2F5A42" }, light: { fg: "#1F6E43", tint: "#E4F4EA", line: "#B5DEC4" } },
  danger: { dark: { fg: "#F2727F", tint: "#3B2023", line: "#74343C" }, light: { fg: "#C0263A", tint: "#FCE8EA", line: "#F1B9C0" } },
  edit: { dark: { fg: "#E58A5F", tint: "#38251D", line: "#6A3E2D" }, light: { fg: "#A94A26", tint: "#FBEDE6", line: "#EFC6B4" } },
  amber: { dark: { fg: "#E9B949", tint: "#332D19", line: "#66552A" }, light: { fg: "#8A6000", tint: "#FBF2D9", line: "#EBD48F" } },
  tide: { dark: { fg: "#7FB6E8", tint: "#1E2B37", line: "#2F4A63" }, light: { fg: "#2464A0", tint: "#E7F0F9", line: "#B9D3EC" } }
};
const ROLE_NAMES = Object.keys(ROLES);
function palette(isLight) {
  const mode = isLight ? "light" : "dark";
  const roles = Object.fromEntries(ROLE_NAMES.map((role) => [role, ROLES[role][mode]]));
  return { ...isLight ? LIGHT : DARK, ...roles };
}
function themeOf(value) {
  const name = typeof value === "string" ? value.toLowerCase() : "";
  if (name.includes("light"))
    return "light";
  return name.includes("dark") ? "dark" : "auto";
}
function vars(p) {
  const tones = ROLE_NAMES.map((role) => `--${role}:${p[role].fg};--${role}-t:${p[role].tint};--${role}-l:${p[role].line}`);
  return [
    `--sheet:${p.sheet};--card:${p.card};--inset:${p.inset};--line:${p.line};--line2:${p.lineStrong};--track:${p.track}`,
    `--hi:${p.hi};--mid:${p.mid};--lo:${p.lo}`,
    ...tones
  ].join(";");
}
const FONT = `-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif`;
const MONO_FONT = `ui-monospace,"SF Mono",Menlo,Consolas,monospace`;
const TYPE = [
  `text{font-family:${FONT};font-variant-numeric:tabular-nums}`,
  `.mono{font-family:${MONO_FONT}}`,
  ".headline{font-size:16px;font-weight:600}",
  ".title{font-size:13.5px;font-weight:600}",
  ".label{font-size:12px;font-weight:500}",
  ".micro{font-size:10.5px;font-weight:500}",
  ".hi{fill:var(--hi)}.mid{fill:var(--mid)}.lo{fill:var(--lo)}",
  ".f-edit{fill:var(--edit)}.f-ok{fill:var(--ok)}.f-danger{fill:var(--danger)}.f-run{fill:var(--run)}.f-amber{fill:var(--amber)}.f-tide{fill:var(--tide)}"
].join("");
const CALM = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function svgStyle(extra = "") {
  const dark = vars(palette(false));
  const light = vars(palette(true));
  return `<style>svg{${dark}}svg.t-light{${light}}@media (prefers-color-scheme: light){svg.t-auto{${light}}}${TYPE}${extra}${CALM}</style>`;
}
function svgDoc(size, body, extraCss = "") {
  const { width, height, theme } = size;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="t-${theme}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svgStyle(extraCss)}${body}</svg>`;
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
    return { text: isTickedUnseen(model.tracks[step.key]) ? words().tickedAtOnce : time, cls: "lo" };
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
const FILES_SHOWN = 2;
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
    return { glyph: "✓", isDim: true, isBold: false, right: isTickedUnseen(context.track) ? words().tickedAtOnce : time };
  if (step.status === "in_progress") {
    const right = context.isCurrent ? time : [checksText(step), time].filter(Boolean).join(" · ");
    return { glyph: "◐", glyphColor: "claude", isDim: !context.isCurrent, isBold: context.isCurrent, right, rightColor: context.isCurrent ? "claude" : undefined };
  }
  return { glyph: "○", isDim: false, isBold: false, right: checksText(step) };
}
function stepRow(ui, step, look) {
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
  const names = files.slice(-FILES_SHOWN).reverse().map(baseName).join(", ");
  const more = files.length > FILES_SHOWN ? ` +${files.length - FILES_SHOWN}` : "";
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
    out.push(stepRow(ui, step, lookOf(step, { track: view.tracks[step.key], now: view.now, isCurrent })));
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
  const shows = { plan, tracks: view.tracks, theme: view.theme, width, state: planState(plan, { now: view.now, touchedAt: view.touchedAt, isBusy: hasRunningAgent(view.tracks) }), details };
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
  const at = { now: view.now, touchedAt: view.touchedAt, isBusy: hasRunningAgent(view.tracks) };
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

const docAtom$1 = atom({ plugin: "plan-steps", key: "doc" }, null);
const tasksAtom$1 = atom({ plugin: "plan-steps", key: "tasks" }, []);
const tickAtom = atom({ plugin: "plan-steps", key: "tick" }, 0);
const tracksAtom$1 = atom({ plugin: "plan-steps", key: "tracks" }, {});
const PANE = "plan-steps";
const PANE_TITLE = "Plan";
const TICK_MS = 30000;
const WATCH_MS = 5000;
const BEAT_LOOKS = 6;
const DEFAULT_ROWS = 24;
const DEFAULT_COLUMNS = 48;
const HOME_ROWS = 1;
const MARK = { completed: "✓", in_progress: "▸", pending: "○" };
const pane = { ticker: null, theme: "auto", isWatched: false };
const kept = paneKept();
const logOf = ($) => (text) => $.ui.log(`plan-steps: ${text}`, { to: "debug" });
async function goHome($) {
  try {
    await $.state.set({ plugin: "plan-steps", key: "home" }, { at: await $.clock.now() });
  } catch (error) {
    logOf($)(`home failed (${String(error)})`);
  }
}
async function reportShown($) {
  try {
    if ((await $.state.get({ plugin: "modz", key: "isOn" })).value !== true)
      return;
    await $.state.set({ plugin: "plan-steps", key: "shown" }, shownOf(HUB_PANE, await $.clock.now()));
  } catch (error) {
    logOf($)(`shown failed (${String(error)})`);
  }
}
async function refreshTheme($) {
  try {
    pane.theme = themeOf((await $.config.list()).find((row) => row.key === "theme")?.value);
  } catch (error) {
    logOf($)(`theme not readable (${error instanceof Error ? error.message : "unknown"})`);
  }
}
async function openPane($, focus = true) {
  kept.isHeld = true;
  await refreshTheme($);
  motion.reset();
  const opened = await $.ui.open(focus ? { id: PANE, title: PANE_TITLE, focus: true } : { id: PANE, title: PANE_TITLE });
  if (opened.isPlaced)
    await reportShown($);
  pane.ticker ??= $.clock.every(TICK_MS, () => void update($, tickAtom, (tick) => tick + 1));
}
async function askForPage($) {
  const drawn = (await $.state.get({ plugin: "modz", key: "drawn" })).value;
  if (!Array.isArray(drawn) || !drawn.includes(HUB_PANE))
    return openPane($);
  await $.state.set({ plugin: "plan-steps", key: "home" }, { pane: HUB_PANE, at: await $.clock.now() });
}
const keepNouns = ($) => ({
  isListed: async () => (await $.ui.panes()).some((up) => up.id === PANE),
  reopen: () => openPane($, false),
  redraw: () => $.ui.invalidate("ui.render"),
  soon: (work) => $.clock.after(0, work),
  note: {
    read: async () => $.store.get(noteKey(await $.session.id())),
    write: async (at) => {
      const key = noteKey(await $.session.id());
      return at === undefined ? $.store.delete(key) : $.store.set(key, at);
    }
  },
  now: () => $.clock.now(),
  log: logOf($)
});
async function startWatch($) {
  if (pane.isWatched)
    return;
  pane.isWatched = true;
  try {
    const entries = [];
    for (const key of await $.store.keys())
      if (key.startsWith(NOTE_PREFIX))
        entries.push([key, await $.store.get(key)]);
    for (const key of staleNotes(entries, { own: noteKey(await $.session.id()), now: await $.clock.now() }))
      await $.store.delete(key);
  } catch (error) {
    logOf($)(`could not drop old pane notes (${String(error)})`);
  }
  let looks = 0;
  $.clock.every(WATCH_MS, () => void watchPane(kept, keepNouns($), ++looks % BEAT_LOOKS === 0));
}
function opening(on) {
  on("command.run", { command: "steps" }, async ($) => {
    await askForPage($);
    return {};
  });
  on("session.attach", async ($, e, next) => {
    const done = await next(e);
    if (e.surface !== "desktop")
      return done;
    await restorePane(kept, keepNouns($));
    await startWatch($);
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "modz", key: "open" }, async ($, e, next) => {
    const done = await next(e);
    if (isOpenFor(e.value, HUB_PANE))
      await openPane($);
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "modz", key: "stage" }, async ($, e, next) => {
    const done = await next(e);
    if (isOffStage(e.value, HUB_PANE))
      await $.ui.close({ id: PANE });
    return done;
  }).catch(($, e, next) => next(e));
  on("ui.close", { id: PANE }, ($, e, next) => {
    kept.isHeld = true;
    pane.ticker?.cancel();
    pane.ticker = null;
    return next(e);
  }).catch(($, e, next) => next(e));
}
async function drawnPane($, ui, o) {
  await read($, tickAtom);
  const plan = resolvePlan(await read($, tasksAtom$1), await read($, docAtom$1));
  const view = { plan, tracks: await read($, tracksAtom$1), now: await $.clock.now(), theme: pane.theme, touchedAt: o.touchedAt };
  const isHubOn = (await $.state.get({ plugin: "modz", key: "isOn" })).value === true;
  if (!isHubOn)
    return planPane(ui, view, o.room);
  const { Box } = ui;
  return h(Box, {
    flexDirection: "column"
  }, HomeButton(ui, () => void goHome($)), planPane(ui, view, { ...o.room, rows: o.room.rows - HOME_ROWS }));
}
async function plainOf($, ui) {
  const plan = await (async () => resolvePlan(await read($, tasksAtom$1), await read($, docAtom$1)))().catch(() => null);
  return plainPane(ui, { notice: words().paneFailed, lines: (plan?.steps ?? []).map((step) => `${MARK[step.status]} ${step.title}`) });
}
function wirePane(on, ctx) {
  opening(on);
  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e);
    const nouns = keepNouns($);
    reopenKeptTab(kept, nouns);
    const room = { columns: e.props.bodyColumns || DEFAULT_COLUMNS, rows: e.props.scroll?.bodyRows || e.viewport?.rows || DEFAULT_ROWS, surface: e.surface };
    return pinned(e, await drawSafely(kept, { draw: () => drawnPane($, ui, { room, touchedAt: ctx.touchedAt() }), plain: () => plainOf($, ui), log: nouns.log }));
  }).catch(async ($, e, next) => {
    if (next.error.kind === "re-entry")
      return next(e);
    kept.needsDraw = true;
    return pinned(e, await plainOf($, $.ui.resolve(e)));
  });
}

const STATUS_TITLE_MAX = 36;
const STRONG = 2;
const WEAK = 1;
function statusText(plan, tracks) {
  if (plan === null || plan.steps.length === 0)
    return;
  const progress = progressOf(plan);
  const head = `plan ${progress.done}/${progress.total}`;
  if (progress.done === progress.total)
    return `${head} · ${words().allDone}`;
  const current = plan.steps[currentIndex(plan.steps, tracks)];
  return current === undefined ? head : `${head} · ${clip(current.title, STATUS_TITLE_MAX)}`;
}
function mayHoldPlan(path) {
  return isPlanPath(path) || isMarkdownPath(path);
}
function fileDoc(path, text) {
  const isNamed = isPlanPath(path);
  const parsed = parsePlan(text);
  if (parsed === null || !isNamed && !parsed.isStructured)
    return null;
  return { kind: "file", label: baseName(path), path, strength: isNamed ? STRONG : WEAK, steps: parsed.steps };
}
function approvedDoc(result) {
  const record = result;
  if (typeof record?.plan !== "string")
    return null;
  const parsed = parsePlan(record.plan);
  if (parsed === null)
    return null;
  const path = typeof record.filePath === "string" ? record.filePath : null;
  return { kind: "approved", label: words().approvedLabel, path, strength: STRONG, steps: parsed.steps };
}
function isReplacing(before, doc) {
  const isSamePath = before !== null && before.path !== null && before.path === doc.path;
  return before === null || isSamePath || doc.strength >= before.strength;
}

const STATUSES = ["pending", "in_progress", "completed"];
function statusOf(value) {
  return STATUSES.includes(value) ? value : null;
}
function fromTodos(todos) {
  if (!Array.isArray(todos))
    return [];
  return todos.flatMap((todo, index) => {
    const status = statusOf(todo.status);
    const subject = typeof todo.content === "string" ? todo.content.trim() : "";
    return status === null || subject === "" ? [] : [{ id: `todo-${index}`, subject, status }];
  });
}
function createTask(tasks, task) {
  return [...tasks.filter((one) => one.id !== task.id), { id: task.id, subject: task.subject.trim(), status: "pending" }];
}
function updateTask(tasks, patch) {
  const id = String(patch.taskId ?? "");
  if (patch.status === "deleted")
    return tasks.filter((task) => task.id !== id);
  const status = statusOf(patch.status);
  const subject = typeof patch.subject === "string" && patch.subject.trim() !== "" ? patch.subject.trim() : null;
  return tasks.map((task) => task.id === id ? { ...task, status: status ?? task.status, subject: subject ?? task.subject } : task);
}
function createdId(result, tasks) {
  const id = result?.task?.id;
  if (typeof id === "string" || typeof id === "number")
    return String(id);
  return String(tasks.length + 1);
}
function steps(value) {
  return new Set(Array.isArray(value) ? value.filter(Number.isInteger).map((n) => n - 1) : []);
}
function advanced(tasks) {
  const current = tasks.findIndex((task) => task.status === "in_progress");
  const next = tasks.findIndex((task, index) => index > current && task.status === "pending");
  return tasks.map((task, index) => {
    if (index === current)
      return { ...task, status: "completed" };
    return index === next ? { ...task, status: "in_progress" } : task;
  });
}
function fromDeskPlan(tasks, plan) {
  if (Array.isArray(plan.items))
    return fromTodos(plan.items);
  if (plan.advance === true)
    return advanced(tasks);
  const done = steps(plan.done);
  const start = Number.isInteger(plan.start) ? plan.start - 1 : -1;
  return tasks.map((task, index) => {
    if (done.has(index))
      return { ...task, status: "completed" };
    if (index === start)
      return { ...task, status: "in_progress" };
    return start !== -1 && task.status === "in_progress" ? { ...task, status: "pending" } : task;
  });
}
function finished(tasks) {
  return tasks.map((task) => ({ ...task, status: "completed" }));
}
function replayDesk(calls) {
  return calls.reduce((tasks, call) => call.isWrapUp ? finished(tasks) : fromDeskPlan(tasks, call.plan), []);
}

const docAtom = atom({ plugin: "plan-steps", key: "doc" }, null);
const tasksAtom = atom({ plugin: "plan-steps", key: "tasks" }, []);
const tracksAtom = atom({ plugin: "plan-steps", key: "tracks" }, {});
const EDIT_TOOLS = ["Edit", "Write", "MultiEdit", "NotebookEdit"];
const FILE_TOOLS = ["Read", ...EDIT_TOOLS];
const LIVE_AGENT = ["async_launched", "teammate_spawned"];
const DESK_PLAN = "mcp__ccd_turn__update_plan";
const DESK_WRAP_UP = "mcp__ccd_turn__wrap_up";
const hubRef = { plugin: "plan-steps", key: "hub" };
const flags = { cwd: "", isStatusLine: false, isSettled: false, touchedAt: -1, quiet: null, status: null };
function showStatus($, text) {
  if (text === flags.status)
    return;
  flags.status = text;
  $.ui.status(text);
}
function isOk(ran) {
  return ran.deny === undefined && ran.isError !== true;
}
function relative(path) {
  return flags.cwd !== "" && path.startsWith(`${flags.cwd}/`) ? path.slice(flags.cwd.length + 1) : path;
}
async function currentPlan($) {
  return resolvePlan(await read($, tasksAtom), await read($, docAtom));
}
function currentStep(plan, tracks) {
  const step = plan.steps[currentIndex(plan.steps, tracks)];
  return step === undefined ? null : { title: step.title, startedAt: tracks[step.key]?.startedAt ?? null };
}
async function writeHub($, shown) {
  if (isShowing((await $.state.get(hubRef)).value, shown))
    return;
  const card = { pane: HUB_PANE, ...shown, at: await $.clock.now() };
  await $.state.set(hubRef, card);
}
async function sync($) {
  const plan = await currentPlan($);
  const now = await $.clock.now();
  const tracks = await update($, tracksAtom, (before) => plan === null ? before : observe(before, plan.steps, now));
  const progress = plan === null ? null : progressOf(plan);
  const state = planState(plan, { now, touchedAt: flags.touchedAt, isBusy: hasRunningAgent(tracks) });
  if (progress === null || progress.done < progress.total)
    flags.isSettled = false;
  showStatus($, !flags.isStatusLine || flags.isSettled || !isShown(state) ? undefined : statusText(plan, tracks));
  await writeHub($, hubOf(progress, state, plan === null ? null : currentStep(plan, tracks)));
}
async function touch($) {
  flags.touchedAt = await $.clock.now();
  flags.quiet?.cancel();
  flags.quiet = $.clock.after(STALE_MS, () => void sync($));
}
async function setTasks($, change) {
  await update($, tasksAtom, change);
  resetNudge();
  await touch($);
  await sync($);
}
async function offerDoc($, doc) {
  if (doc === null || !isReplacing(await read($, docAtom), doc))
    return;
  await update($, docAtom, () => doc);
  await touch($);
  await sync($);
}
async function onCurrent($, change) {
  const plan = await currentPlan($);
  if (plan === null)
    return;
  let isMoved = false;
  await update($, tracksAtom, (tracks) => {
    const step = plan.steps[currentIndex(plan.steps, tracks)];
    const track = step === undefined ? undefined : tracks[step.key];
    if (step === undefined || track === undefined)
      return tracks;
    isMoved = true;
    return { ...tracks, [step.key]: change(track) };
  });
  if (isMoved)
    await revive($);
}
async function revive($) {
  const wasStale = await $.clock.now() - flags.touchedAt >= STALE_MS;
  await touch($);
  if (wasStale)
    await sync($);
}
async function afterFile($, call) {
  const path = call.file_path ?? call.notebook_path;
  if (typeof path !== "string")
    return;
  if (EDIT_TOOLS.includes(call.tool))
    await onCurrent($, (track) => addFile(track, relative(path)));
  if (!mayHoldPlan(path))
    return;
  try {
    await offerDoc($, fileDoc(path, await $.fs.read(path)));
  } catch (error) {
    $.ui.log(`plan-steps: could not read ${baseName(path)} (${error instanceof Error ? error.message : "unknown"})`, { to: "debug" });
  }
}
async function deskTasks($, skipId) {
  try {
    const uses = (await $.session.messages()).flatMap((message) => message.role === "assistant" ? message.toolUses ?? [] : []);
    const calls = uses.filter((use) => (use.tool === DESK_PLAN || use.tool === DESK_WRAP_UP) && use.tool_use_id !== skipId && use.isError !== true);
    return replayDesk(calls.map((use) => ({ isWrapUp: use.tool === DESK_WRAP_UP, plan: use.input })));
  } catch (error) {
    $.ui.log(`plan-steps: transcript not readable (${error instanceof Error ? error.message : "unknown"})`, { to: "debug" });
    return [];
  }
}
async function afterTasks($, call, ran) {
  const isMainLoop = call.agentId === undefined;
  if (call.tool === "TodoWrite" && isMainLoop)
    await setTasks($, () => fromTodos(call.todos));
  if (call.tool === DESK_PLAN && isMainLoop) {
    const before = await deskTasks($, call.tool_use_id);
    await setTasks($, (tasks) => fromDeskPlan(before.length > 0 ? before : tasks, call));
  }
  if (call.tool === DESK_WRAP_UP && isMainLoop && (await read($, tasksAtom)).length > 0)
    await setTasks($, finished);
  if (call.tool === "TaskCreate") {
    const subject = String(call.subject ?? "");
    await setTasks($, (tasks) => createTask(withoutRestored(tasks), { id: createdId(ran.result, withoutRestored(tasks)), subject }));
  }
  if (call.tool === "TaskUpdate")
    await setTasks($, (tasks) => updateTask(tasks, { taskId: call.taskId, subject: call.subject, status: call.status }));
}
async function startAgent($, call) {
  const description = String(call.description ?? call.subagent_type ?? words().subagent);
  await onCurrent($, (track) => addAgent(track, { key: call.tool_use_id, description, isRunning: true, agentId: null }));
}
async function endAgent($, call, ran) {
  const record = ran.result;
  const id = record?.agentId ?? record?.agent_id;
  const isLive = isOk(ran) && LIVE_AGENT.includes(String(record?.status));
  const patch = { isRunning: isLive, agentId: typeof id === "string" ? id : null };
  await update($, tracksAtom, (tracks) => settleAgents(tracks, (agent) => agent.key === call.tool_use_id, patch));
}
async function onToolCall($, call, run) {
  if (call.tool === "Agent")
    await startAgent($, call);
  await noteCall($, call);
  const ran = await run();
  if (call.tool === "Agent")
    await endAgent($, call, ran);
  if (!isOk(ran))
    return ran;
  if (FILE_TOOLS.includes(call.tool))
    await afterFile($, call);
  else if (call.tool === "ExitPlanMode")
    await offerDoc($, approvedDoc(ran.result));
  else
    await afterTasks($, call, ran);
  return ran;
}
async function reset($) {
  await update($, tasksAtom, () => []);
  await update($, docAtom, () => null);
  await update($, tracksAtom, () => ({}));
  flags.isSettled = false;
  flags.quiet?.cancel();
  flags.quiet = null;
  showStatus($, undefined);
  await writeHub($, hubOf(null, "none"));
}
function lifecycle(on) {
  on("session.start", async ($, e, next) => {
    setLang(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    flags.cwd = e.cwd.replace(/\/$/, "");
    flags.status = null;
    if ((await read($, tasksAtom)).length === 0 && await $.session.turns().catch(() => 0) > 0) {
      const rebuilt = await deskTasks($);
      if (rebuilt.length > 0) {
        await update($, tasksAtom, () => rebuilt);
        await touch($);
      }
    }
    const plan = await currentPlan($);
    const state = planState(plan, { now: await $.clock.now(), touchedAt: flags.touchedAt });
    await writeHub($, hubOf(plan === null ? null : progressOf(plan), state, plan === null ? null : currentStep(plan, await read($, tracksAtom))));
    try {
      await $.command.register({ name: "steps", description: words().command });
    } catch {
      $.ui.log("plan-steps: could not register /steps", { to: "debug" });
    }
    return next(e);
  });
  on("session.end", async ($, e, next) => {
    if (e.reason === "clear")
      await reset($);
    return next(e);
  }).catch(($, e, next) => next(e));
}
function tracking(on) {
  on("tool.call", ($, e, next) => onToolCall($, e, () => next(e))).catch(($, e, next) => next(e));
  on("turn.complete", async ($, e, next) => {
    const agentId = e.agentId;
    if (agentId !== undefined) {
      await update($, tracksAtom, (tracks) => settleAgents(tracks, (agent) => agent.agentId === agentId, { isRunning: false }));
    }
    return next(e);
  }).catch(($, e, next) => next(e));
  on("prompt.submit", async ($, e, next) => {
    flags.isSettled = (await currentPlan($))?.steps.every((step) => step.status === "completed") ?? false;
    if (flags.isSettled)
      await sync($);
    return next(e);
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "plan-steps", key: "carried" }, async ($, e, next) => {
    const done = await next(e);
    if (e.value !== null)
      await sync($);
    return done;
  }).catch(($, e, next) => next(e));
}
const register = (on, options) => {
  flags.isStatusLine = options.statusLine === true;
  lifecycle(on);
  tracking(on);
  wireCarry(on);
  wireFinish(on, { touchedAt: () => flags.touchedAt, isStrict: options.holdFinish === true });
  wirePane(on, { touchedAt: () => flags.touchedAt });
  wireNudge(on);
};

export { register };
