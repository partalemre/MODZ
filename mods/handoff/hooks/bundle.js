// Built by `bin/modz build` from the files beside it. Never edited by hand.
import { atom, update, read } from 'claude-code';

const PANE = "handoff";
const COMMAND = "handoff";
const SECTION_ID = "handoff:note";
const DEFAULT_THRESHOLD = 80;
const MIN_THRESHOLD = 50;
const MAX_THRESHOLD = 99;
const SNOOZE_POINTS = 10;
const MAX_NOTE_AGE_MS = 24 * 60 * 60 * 1000;
const NOTES_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const NOTES_MAX = 12;
const AUTO_LEAD_POINTS = 5;
const TOKENS_PER_K = 1000;
const GOAL_PROMPTS = 3;
const GOAL_CHARS = 280;
const FILES_MAX = 40;
const GIT_LINES_MAX = 30;
const PROCESS_TIMEOUT_MS = 5000;
const ERROR_CHARS = 200;
const NOTE_MAX_CHARS = 8000;
const SUMMARY_MODEL = "haiku";
const SUMMARY_MESSAGES = 30;
const SUMMARY_INPUT_CHARS = 12000;
const SUMMARY_MAX_TOKENS = 500;
const SUMMARY_LINES = 12;
const SUMMARY_TIMEOUT_MS = 30000;
const PREVIEW_LINES = 24;
const HUB_DETAIL_MAX = 40;
const NOTICE_PRIORITY = 3;
const NOTICE_FOREVER = 0;
const LOUDER_WAIT_MS = 10 * 60000;
const MS_PER_MINUTE = 60000;
const MINUTES_PER_HOUR = 60;
function settingsOf(options) {
  const raw = Number(options.threshold);
  const isInRange = Number.isFinite(raw) && raw >= MIN_THRESHOLD && raw <= MAX_THRESHOLD;
  const threshold = isInRange ? Math.round(raw) : DEFAULT_THRESHOLD;
  return { threshold, isSummarizing: options.summarize !== false };
}

const PERCENT$2 = 100;
function autoPercentOf(auto) {
  if (auto.tokens === null || auto.window <= 0)
    return null;
  return Math.round(auto.tokens / auto.window * PERCENT$2);
}
function askPointOf(facts) {
  const autoAt = typeof facts.autoAt === "number" ? facts.autoAt : null;
  return autoAt === null ? facts.threshold : Math.max(1, Math.min(facts.threshold, autoAt - AUTO_LEAD_POINTS));
}
function isAskDue(facts) {
  if (facts.percent === null || facts.stage !== "idle")
    return false;
  if (facts.percent < askPointOf(facts))
    return false;
  return facts.snoozeUntil === null || facts.percent >= facts.snoozeUntil;
}
const snoozeFrom = (percent) => percent + SNOOZE_POINTS;
function rearmed(facts) {
  const isBelow = facts.percent !== null && facts.percent < askPointOf(facts);
  if (!isBelow)
    return { snoozeUntil: facts.snoozeUntil, stage: facts.stage };
  return { snoozeUntil: null, stage: facts.stage === "done" ? "idle" : facts.stage };
}
const isBandQuiet = (facts) => facts.isWorking || facts.hasSurvey;
function cardOf(facts) {
  if (facts.stage === "writing" || facts.stage === "saved" || facts.stage === "failed")
    return facts.stage;
  if (isAskDue(facts))
    return "ask";
  return facts.hasCompacted === true ? "compacted" : null;
}
function isLouderNow(since, seen) {
  const first = since.get(seen.key) ?? seen.now;
  since.set(seen.key, first);
  return seen.now - first < LOUDER_WAIT_MS;
}

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const pick = (table) => table[current];

const EN = {
  eyebrow: "Handoff",
  title: "Handoff",
  hint: "A note for your next fresh chat",
  percent: (n) => `${n}%`,
  askHeadline: (n) => `The chat's memory is ${n}% full`,
  askAuto: (n) => `summarized automatically at ${n}%`,
  compactKeep: "Summarize now, keep notes",
  handOff: "Hand off to a fresh chat",
  notNow: "Not now",
  how: { manual: "/compact", auto: "automatic", plugin: "from the button" },
  compactedHead: (how) => `Chat summarized (${how})`,
  sizes: (before, after) => `${before} → ${after} tokens`,
  notesSaved: "working notes saved",
  restore: "Restore working notes",
  dismiss: "Dismiss",
  restoreIntro: "Working notes the handoff mod saved just before the chat was last summarized (compacted). Read them, then carry on.",
  context: "Chat memory",
  writingHeadline: "Writing the handoff note…",
  savedHeadline: "Handoff saved",
  savedSub: "Start fresh with /clear: the next chat in this project offers to continue from it.",
  showNote: "Show note",
  gotIt: "Got it",
  failedEyebrow: "Error",
  failedHeadline: "The note could not be written",
  tryAgain: "Try again",
  offerHeadline: "A handoff note is waiting",
  offerSub: "The last chat in this project left it. Continue to give it to this chat; other chats then skip it.",
  continueFrom: "Continue from handoff",
  latest: "Latest note",
  emptyLine: (threshold) => `No note yet. When the chat's memory is ${threshold}% full you are offered one, so a fresh chat can continue from it; or run /handoff.`,
  writeNow: "Write handoff now",
  injectOn: "The next chat here offers to continue from it",
  injectOff: "Not handed to the next chat",
  consumed: "A later chat already took it in",
  stale: "Older than a day: not handed on",
  turnOff: "Don't hand it on",
  turnOn: "Hand it to the next chat",
  delete: "Delete note",
  aboutEyebrow: "What it does",
  aboutLines: (askAt, autoAt, days) => [
    "Before the chat is summarized to free its memory (compact: by you, automatically or when idle) it saves working notes here, with no model call.",
    "Afterwards it offers to put them back in this chat; nothing goes in until you press.",
    `When the chat's memory is ${askAt}% full${autoAt === null ? "" : ` (it is summarized automatically at ${autoAt}%)`} it asks once: summarize now, or hand off to a fresh chat.`,
    `Notes older than ${days} days are deleted.`
  ],
  notesEyebrow: "Saved notes",
  notesEmpty: "No other notes yet.",
  kindHandoff: "handoff",
  kindCompact: (how) => `before summarizing (${how})`,
  drop: "Delete",
  summarized: "with summary",
  plain: "no summary",
  ago: { now: "just now", m: (n) => `${n} min ago`, h: (n) => `${n} h ago` },
  hubContext: (n) => `Memory ${n}%`,
  hubReady: "note ready",
  noteTitle: (stamp) => `Handoff · ${stamp}`,
  compactTitle: (stamp) => `Working notes · ${stamp}`,
  noteRepo: "Project",
  noteContext: (n) => `Chat memory ${n}% full`,
  noteWhere: "Where we are",
  noteGoal: "Goal (your latest messages)",
  noteSteps: "Open plan steps",
  noteFiles: "Files touched",
  noteGit: "Changes not yet saved (git status)",
  noteError: "Last error",
  noteMore: (n) => `…and ${n} more`,
  noteIntro: "A handoff note from the previous conversation in this project. Read it, then carry on from it.",
  commandHelp: "Write a handoff note now (show: open the Handoff panel)",
  commandSaved: (path) => `handoff: saved ${path}. Start fresh with /clear; the next chat offers to continue from it.`,
  commandFailed: (why) => `handoff: could not write the note (${why})`,
  commandShown: "handoff: panel opened",
  noRoot: "no project folder"
};
const TR = {
  eyebrow: "Devir",
  title: "Devir",
  hint: "Bir sonraki temiz sohbet için not",
  percent: (n) => `%${n}`,
  askHeadline: (n) => `Sohbetin hafızası %${n} dolu`,
  askAuto: (n) => `%${n} olunca kendiliğinden özetlenir`,
  compactKeep: "Şimdi özetle, notları koru",
  handOff: "Temiz bir sohbete devret",
  notNow: "Şimdi değil",
  how: { manual: "/compact", auto: "otomatik", plugin: "düğmeden" },
  compactedHead: (how) => `Sohbet özetlendi (${how})`,
  sizes: (before, after) => `${before} → ${after} token`,
  notesSaved: "çalışma notları kaydedildi",
  restore: "Çalışma notlarını geri yükle",
  dismiss: "Kapat",
  restoreIntro: "Devir modunun sohbet son kez özetlenmeden (compact) hemen önce kaydettiği çalışma notları. Oku, sonra devam et.",
  context: "Sohbetin hafızası",
  writingHeadline: "Devir notu yazılıyor…",
  savedHeadline: "Devir notu kaydedildi",
  savedSub: "/clear ile temiz başla: bu projedeki bir sonraki sohbet nottan devam etmeyi önerir.",
  showNote: "Notu göster",
  gotIt: "Tamam",
  failedEyebrow: "Hata",
  failedHeadline: "Not yazılamadı",
  tryAgain: "Tekrar dene",
  offerHeadline: "Bir devir notu bekliyor",
  offerSub: "Bu projedeki son sohbet bıraktı. Devam et ile bu sohbete ver; diğer sohbetler sonra atlar.",
  continueFrom: "Devir notundan devam et",
  latest: "Son not",
  emptyLine: (threshold) => `Henüz not yok. Sohbetin hafızası %${threshold} dolunca bir not yazmak önerilir, temiz bir sohbet ondan devam edebilir; ya da /handoff çalıştır.`,
  writeNow: "Şimdi devir notu yaz",
  injectOn: "Buradaki bir sonraki sohbet ondan devam etmeyi önerir",
  injectOff: "Bir sonraki sohbete verilmez",
  consumed: "Sonraki bir sohbet zaten aldı",
  stale: "Bir günden eski: aktarılmaz",
  turnOff: "Aktarma",
  turnOn: "Sonraki sohbete aktar",
  delete: "Notu sil",
  aboutEyebrow: "Ne yapar",
  aboutLines: (askAt, autoAt, days) => [
    "Sohbet hafızayı boşaltmak için her özetlenmeden önce (compact: senin isteğinle, kendiliğinden ya da boşta) çalışma notlarını buraya kaydeder; model çağrısı yok.",
    "Sonrasında onları bu sohbete geri koymayı önerir; sen basmadan hiçbir şey eklenmez.",
    `Sohbetin hafızası %${askAt} dolunca${autoAt === null ? "" : ` (%${autoAt} olunca kendiliğinden özetlenir)`} bir kez sorar: şimdi özetle ya da temiz bir sohbete devret.`,
    `${days} günden eski notlar silinir.`
  ],
  notesEyebrow: "Kayıtlı notlar",
  notesEmpty: "Başka not yok.",
  kindHandoff: "devir",
  kindCompact: (how) => `özetlemeden önce (${how})`,
  drop: "Sil",
  summarized: "özetli",
  plain: "özetsiz",
  ago: { now: "az önce", m: (n) => `${n} dk önce`, h: (n) => `${n} sa önce` },
  hubContext: (n) => `Hafıza %${n}`,
  hubReady: "not hazır",
  noteTitle: (stamp) => `Devir · ${stamp}`,
  compactTitle: (stamp) => `Çalışma notları · ${stamp}`,
  noteRepo: "Proje",
  noteContext: (n) => `Sohbetin hafızası %${n} dolu`,
  noteWhere: "Neredeyiz",
  noteGoal: "Hedef (son mesajların)",
  noteSteps: "Açık plan adımları",
  noteFiles: "Dokunulan dosyalar",
  noteGit: "Henüz kaydedilmemiş değişiklikler (git status)",
  noteError: "Son hata",
  noteMore: (n) => `…ve ${n} tane daha`,
  noteIntro: "Bu projedeki önceki sohbetten bir devir notu. Oku, sonra buradan devam et.",
  commandHelp: "Şimdi bir devir notu yaz (show: Devir panelini aç)",
  commandSaved: (path) => `handoff: ${path} kaydedildi. /clear ile temiz başla; sonraki sohbet ondan devam etmeyi önerir.`,
  commandFailed: (why) => `handoff: not yazılamadı (${why})`,
  commandShown: "handoff: panel açıldı",
  noRoot: "proje klasörü yok"
};
const words = () => pick({ en: EN, tr: TR });

const isTooOld = (note, now) => now - note.at > MAX_NOTE_AGE_MS;
const isReady = (note, now) => note !== null && note.consumedBy === null && note.isInjectOn && !isTooOld(note, now);
function injectMove(facts) {
  const { note, sessionId, now } = facts;
  if (note === null)
    return "skip";
  if (note.consumedBy === sessionId)
    return "inject";
  if (!isReady(note, now) || note.writtenBy === sessionId)
    return "skip";
  return "claim";
}
const sectionText = (note) => `${words().noteIntro}

${note.text}`;

const HUB_ICON = "flag";
const HUB_SECTION = "meter";
function toneOf(facts) {
  if (facts.stage === "writing")
    return "live";
  if (facts.stage === "failed")
    return "bad";
  if (facts.percent !== null && facts.percent >= facts.threshold)
    return "warn";
  return isReady(facts.note, facts.now) ? "ok" : "idle";
}
function hubOf(facts) {
  const says = words();
  const parts = [facts.percent === null ? "" : says.hubContext(facts.percent), isReady(facts.note, facts.now) ? says.hubReady : ""];
  const detail = parts.filter((part) => part !== "").join(" · ").slice(0, HUB_DETAIL_MAX);
  return { detail, tone: toneOf(facts) };
}
const hubCard = (shown, at) => ({
  pane: PANE,
  ...shown,
  at,
  title: words().title,
  hint: words().hint,
  icon: HUB_ICON,
  section: HUB_SECTION
});
function isOpenFor(value, pane) {
  return typeof value === "object" && value !== null && value.pane === pane;
}

const reasonOf = (error) => error instanceof Error ? error.message : "unknown";

const ELLIPSIS = "…";
const PAD = 2;
const pad = (n) => String(n).padStart(PAD, "0");
const oneLine = (text) => text.replace(/\s+/g, " ").trim();
const cut = (text, max) => text.length <= max ? text : `${text.slice(0, max - 1)}${ELLIPSIS}`;
function stampOf(ms) {
  const at = new Date(ms);
  const day = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
  const hour = pad(at.getHours());
  const minute = pad(at.getMinutes());
  return { file: `${day}-${hour}${minute}`, label: `${day} ${hour}:${minute}` };
}
const noteDir = (root) => `${root}/.claude/handoff`;
const notePath = (root, ms, isCompaction = false) => `${noteDir(root)}/${stampOf(ms).file}${isCompaction ? "-compact" : ""}.md`;
function goalsOf(messages) {
  const typed = messages.filter((m) => m.role === "user" && (m.toolResults ?? []).length === 0);
  const texts = typed.map((m) => oneLine(m.text)).filter((text) => text !== "" && !text.startsWith("<"));
  return texts.slice(-GOAL_PROMPTS).map((text) => cut(text, GOAL_CHARS));
}
function openSteps(tasks) {
  return tasks.filter((task) => task.status !== "completed").map((task) => task.status === "in_progress" ? `[>] ${task.subject}` : `[ ] ${task.subject}`);
}
function relativeTo(root, path) {
  const prefix = `${root}/`;
  return path.startsWith(prefix) ? path.slice(prefix.length) : path;
}
function capped(lines, max) {
  if (lines.length <= max)
    return [...lines];
  return [...lines.slice(0, max), words().noteMore(lines.length - max)];
}
function section(heading, body) {
  return body.length === 0 ? [] : ["", `## ${heading}`, ...body];
}
function buildNote(facts) {
  const says = words();
  const title = facts.isCompaction === true ? says.compactTitle(facts.stamp) : says.noteTitle(facts.stamp);
  const head = [`# ${title}`, "", `${says.noteRepo}: ${facts.root}`];
  if (facts.percent !== null)
    head.push(says.noteContext(facts.percent));
  const git = facts.git.length === 0 ? [] : ["```", ...capped(facts.git, GIT_LINES_MAX), "```"];
  const lines = [
    ...head,
    ...section(says.noteWhere, facts.summary === null ? [] : [facts.summary]),
    ...section(says.noteGoal, facts.goals.map((goal) => `- ${goal}`)),
    ...section(says.noteSteps, facts.steps.map((step) => `- ${step}`)),
    ...section(says.noteFiles, capped(facts.files, FILES_MAX).map((file) => `- ${file}`)),
    ...section(says.noteGit, git),
    ...section(says.noteError, facts.lastError === null ? [] : [facts.lastError])
  ];
  return cut(`${lines.join(`
`)}
`, NOTE_MAX_CHARS);
}
function rowOf(message) {
  const tools = message.toolUses.map((use) => use.tool).filter((tool) => tool !== "");
  const said = oneLine(message.text);
  const toolPart = tools.length === 0 ? "" : ` [tools: ${tools.join(", ")}]`;
  return `${message.role === "user" ? "User" : "Claude"}: ${said}${toolPart}`;
}
function transcriptOf(messages) {
  const rows = messages.slice(-SUMMARY_MESSAGES).map(rowOf).filter((row) => !/^(User|Claude): $/.test(row));
  const text = rows.join(`
`);
  return text.length <= SUMMARY_INPUT_CHARS ? text : text.slice(text.length - SUMMARY_INPUT_CHARS);
}
const SUMMARY_SYSTEM = [
  'You write the "where we are" part of a handoff note for a coding session that will continue in a fresh conversation.',
  `Answer in at most ${SUMMARY_LINES} short lines of plain markdown: what is done, what is in progress, and the next step.`,
  "No preamble, no headings, no closing line. Never repeat secrets, keys or tokens that appear in the transcript."
].join(" ");
function cleanSummary(text) {
  const lines = text.split(`
`).map((line) => line.trimEnd()).filter((line) => line.trim() !== "");
  const kept = lines.slice(0, SUMMARY_LINES).join(`
`).trim();
  return kept === "" ? null : kept;
}

const repos = new Map;
const GIT_DIR = "/.git";
async function repoOf(io) {
  const root = await io.root();
  const known = repos.get(root);
  if (known !== undefined)
    return known;
  const out = await io.run(["git", "rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: root, timeoutMs: PROCESS_TIMEOUT_MS }).catch(() => null);
  const common = out?.exitCode === 0 ? out.stdout.trim() : "";
  const repo = common.endsWith(GIT_DIR) ? common.slice(0, -GIT_DIR.length) : root;
  repos.set(root, repo);
  return repo;
}
const storeKey = (root) => `latest:${root}`;
const isText = (value) => typeof value === "string";
function asNote(value) {
  if (typeof value !== "object" || value === null)
    return null;
  const v = value;
  const hasTexts = isText(v.path) && isText(v.root) && isText(v.text) && isText(v.writtenBy);
  const hasFlags = typeof v.at === "number" && typeof v.isInjectOn === "boolean" && typeof v.isSummarized === "boolean";
  const hasConsumer = v.consumedBy === null || isText(v.consumedBy);
  return hasTexts && hasFlags && hasConsumer ? v : null;
}
async function loadNote(io, root) {
  const note = asNote(await io.store.get(storeKey(root)));
  await io.put("latest", note);
  return note;
}
async function saveNote(io, note) {
  await io.store.set(storeKey(note.root), note);
  await io.put("latest", note);
}
async function forgetNote(io, root) {
  await io.store.delete(storeKey(root));
  await io.put("latest", null);
}

const listKey = (repo) => `notes:${repo}`;
const isEntry = (value) => {
  if (typeof value !== "object" || value === null)
    return false;
  const v = value;
  return typeof v.path === "string" && typeof v.at === "number" && typeof v.text === "string" && (v.kind === "handoff" || v.kind === "compact");
};
const withEntry = (entries, entry) => [entry, ...entries.filter((e) => e.path !== entry.path)].slice(0, NOTES_MAX);
function pruned(entries, now) {
  const isFresh = (e) => now - e.at <= NOTES_MAX_AGE_MS;
  return { kept: entries.filter(isFresh), dropped: entries.filter((e) => !isFresh(e)) };
}
async function readList(io, repo) {
  const raw = await io.store.get(listKey(repo));
  return Array.isArray(raw) ? raw.filter(isEntry) : [];
}
async function deleteFile(io, repo, path) {
  const isOurs = path.startsWith(`${noteDir(repo)}/`) && path.endsWith(".md") && !path.includes("/../");
  if (!isOurs)
    return;
  const out = await io.run(["rm", "-f", "--", path], { timeoutMs: PROCESS_TIMEOUT_MS });
  if (out.exitCode !== 0)
    io.log(`note file kept (rm exited ${out.exitCode})`);
}
async function saveList(io, repo, entries) {
  await io.store.set(listKey(repo), entries);
  await io.put("notes", entries);
}
async function loadNotes(io, repo) {
  const { kept, dropped } = pruned(await readList(io, repo), await io.now());
  for (const entry of dropped)
    await deleteFile(io, repo, entry.path);
  if (dropped.length > 0)
    await io.store.set(listKey(repo), kept);
  await io.put("notes", kept);
  return kept;
}
async function addEntry(io, repo, entry) {
  await saveList(io, repo, withEntry(await readList(io, repo), entry));
}
async function dropEntry(io, repo, path) {
  await deleteFile(io, repo, path).catch((error) => io.log(`note file kept (${reasonOf(error)})`));
  await saveList(io, repo, (await readList(io, repo)).filter((e) => e.path !== path));
  if ((await io.get("latest"))?.path === path)
    await forgetNote(io, repo);
}

async function gitLines(io, root) {
  try {
    const out = await io.run(["git", "status", "--short", "--branch"], { cwd: root, timeoutMs: PROCESS_TIMEOUT_MS });
    return out.exitCode === 0 ? out.stdout.split(`
`).filter((line) => line.trim() !== "") : [];
  } catch (error) {
    io.log(`git status skipped (${reasonOf(error)})`);
    return [];
  }
}
const isTask = (value) => typeof value === "object" && value !== null && typeof value.subject === "string" && typeof value.status === "string";
async function planSteps(io) {
  try {
    const value = await io.tasks();
    return Array.isArray(value) ? openSteps(value.filter(isTask)) : [];
  } catch (error) {
    io.log(`plan steps skipped (${reasonOf(error)})`);
    return [];
  }
}
async function summarize(io, messages) {
  const transcript = transcriptOf(messages);
  if (transcript === "")
    return null;
  try {
    const reply = await io.complete({
      model: SUMMARY_MODEL,
      system: SUMMARY_SYSTEM,
      prompt: transcript,
      maxTokens: SUMMARY_MAX_TOKENS,
      effort: "low",
      timeoutMs: SUMMARY_TIMEOUT_MS
    });
    if (!reply.isAnswered)
      io.log(`summary skipped (${reply.reason})`);
    return reply.isAnswered ? cleanSummary(reply.text) : null;
  } catch (error) {
    io.log(`summary skipped (${reasonOf(error)})`);
    return null;
  }
}
async function messagesOf(io) {
  try {
    return await io.messages();
  } catch (error) {
    io.log(`transcript unread (${reasonOf(error)})`);
    return [];
  }
}
async function writeNoteFile(io, input) {
  const { messages, summary, isCompaction } = input;
  const root = await io.root();
  const now = await io.now();
  const text = buildNote({
    isCompaction,
    stamp: stampOf(now).label,
    root,
    percent: await io.get("percent"),
    goals: goalsOf(messages),
    steps: await planSteps(io),
    files: (await io.get("files")).map((path) => relativeTo(root, path)),
    git: await gitLines(io, root),
    lastError: await io.get("lastError"),
    summary
  });
  const repo = await repoOf(io);
  const path = notePath(repo, now, isCompaction);
  await io.writeFile(path, text);
  return { repo, path, text, at: now };
}
async function writeHandoff(io, settings) {
  const messages = await messagesOf(io);
  const summary = settings.isSummarizing ? await summarize(io, messages) : null;
  const { repo, path, text, at } = await writeNoteFile(io, { messages, summary, isCompaction: false });
  const note = { path, root: repo, text, at, writtenBy: await io.sessionId(), isInjectOn: true, consumedBy: null, isSummarized: summary !== null };
  await saveNote(io, note);
  await addEntry(io, repo, { path, at, kind: "handoff", text });
  return note;
}
async function writeWorkingNotes(io, trigger) {
  const { repo, path, text, at } = await writeNoteFile(io, { messages: await messagesOf(io), summary: null, isCompaction: true });
  const entry = { path, at, kind: "compact", trigger, text };
  await addEntry(io, repo, entry);
  return entry;
}

async function writeHub(io, settings) {
  const shown = hubOf({
    percent: await io.get("percent"),
    threshold: settings.threshold,
    note: await io.get("latest"),
    stage: await io.get("stage"),
    now: await io.now()
  });
  const before = await io.hub.get();
  const isUnchanged = before !== undefined && before.detail === shown.detail && before.tone === shown.tone && before.title === words().title;
  if (!isUnchanged)
    await io.hub.set(hubCard(shown, await io.now()));
}
const askFactsOf = async (io, settings) => ({
  percent: await io.get("percent"),
  threshold: settings.threshold,
  snoozeUntil: await io.get("snoozeUntil"),
  stage: await io.get("stage"),
  autoAt: await io.get("autoAt")
});
async function syncNotice(io, settings) {
  const isDue = isAskDue(await askFactsOf(io, settings));
  await io.put("notice", isDue ? { priority: NOTICE_PRIORITY, expiresAt: NOTICE_FOREVER } : null);
}
async function readAutoAt(io) {
  if (await io.get("autoAt") !== null)
    return;
  try {
    await io.put("autoAt", autoPercentOf(await io.autoCompact()) ?? "off");
  } catch (error) {
    io.log(`auto-compaction point unread (${reasonOf(error)})`);
  }
}
async function measured(io, settings, percent) {
  await io.put("percent", percent);
  if (percent !== null)
    await readAutoAt(io);
  const next = rearmed({ ...await askFactsOf(io, settings), percent });
  await io.put("snoozeUntil", next.snoozeUntil);
  await io.put("stage", next.stage);
  await syncNotice(io, settings);
  await writeHub(io, settings);
}
async function resetConversation(io, settings) {
  await io.put("percent", null);
  await io.put("snoozeUntil", null);
  await io.put("stage", "idle");
  await io.put("failure", null);
  await io.put("files", []);
  await io.put("lastError", null);
  await io.put("notice", null);
  await io.put("declined", null);
  await io.put("compacted", null);
  await io.put("autoAt", null);
  await writeHub(io, settings);
}
async function write(io, settings) {
  if (await io.get("stage") === "writing")
    return null;
  await io.put("stage", "writing");
  await syncNotice(io, settings);
  await writeHub(io, settings);
  try {
    const note = await writeHandoff(io, settings);
    await io.put("failure", null);
    await io.put("stage", "saved");
    return note.path;
  } catch (error) {
    io.log(`note not written (${reasonOf(error)})`);
    await io.put("failure", reasonOf(error));
    await io.put("stage", "failed");
    throw new Error(reasonOf(error), { cause: error });
  } finally {
    await writeHub(io, settings);
  }
}
async function snooze(io, settings) {
  await io.put("snoozeUntil", snoozeFrom(await io.get("percent") ?? settings.threshold));
  await io.put("stage", "idle");
  await syncNotice(io, settings);
}
let isCompactingHere = false;
const isOwnCompaction = () => isCompactingHere;
async function notesBefore(io, trigger) {
  try {
    return await writeWorkingNotes(io, trigger);
  } catch (error) {
    io.log(`working notes not written (${reasonOf(error)})`);
    return null;
  }
}
async function noteCompacted(io, done) {
  const { trigger, result, entry } = done;
  if (result.messages === undefined || entry === null)
    return;
  const sizes = { ...result.tokensBefore === undefined ? {} : { tokensBefore: result.tokensBefore }, ...result.tokensAfter === undefined ? {} : { tokensAfter: result.tokensAfter } };
  await io.put("compacted", { at: await io.now(), trigger, path: entry.path, ...sizes });
  const stage = await io.get("stage");
  if (stage === "saved" || stage === "failed")
    await io.put("stage", "done");
}
async function compact(io, settings) {
  await dismiss(io, settings);
  isCompactingHere = true;
  try {
    const entry = await notesBefore(io, "plugin");
    await noteCompacted(io, { trigger: "plugin", result: await io.compact(), entry });
  } catch (error) {
    io.log(`compaction refused (${reasonOf(error)})`);
  } finally {
    isCompactingHere = false;
  }
}
async function restore(io) {
  const shown = await io.get("compacted");
  if (shown === null)
    return;
  await io.put("compacted", null);
  const entry = (await io.get("notes")).find((e) => e.path === shown.path);
  if (entry !== undefined)
    await io.append(`${words().restoreIntro}

${entry.text}`);
}
const forgetCompacted = (io) => io.put("compacted", null);
async function dismiss(io, settings) {
  await io.put("stage", "done");
  await syncNotice(io, settings);
}
async function toggleInject(io, settings) {
  const note = await io.get("latest");
  if (note === null)
    return;
  await saveNote(io, { ...note, isInjectOn: !note.isInjectOn });
  await writeHub(io, settings);
}
async function remove(io, settings) {
  const note = await io.get("latest");
  if (note === null)
    return;
  await dropEntry(io, note.root, note.path);
  await writeHub(io, settings);
}
async function drop(io, settings, path) {
  await dropEntry(io, await repoOf(io), path);
  await writeHub(io, settings);
}
const canTake = async (io) => injectMove({ note: await io.get("latest"), sessionId: await io.sessionId(), now: await io.now() }) === "claim";
async function isOffered(io) {
  const note = await io.get("latest");
  return note !== null && await io.get("declined") !== note.at && await canTake(io);
}
async function decline(io) {
  await io.put("declined", (await io.get("latest"))?.at ?? null);
}
async function take(io, settings) {
  const note = await loadNote(io, await repoOf(io));
  if (note === null || !await canTake(io))
    return;
  await saveNote(io, { ...note, consumedBy: await io.sessionId() });
  await writeHub(io, settings);
}
async function noteSection(io) {
  const note = await loadNote(io, await repoOf(io));
  const move = injectMove({ note, sessionId: await io.sessionId(), now: await io.now() });
  if (note === null || move !== "inject")
    return null;
  return { id: SECTION_ID, text: sectionText(note), scope: "session" };
}
async function runCommand(io, settings, arg) {
  if (arg === "show") {
    await io.openPane();
    return words().commandShown;
  }
  try {
    const path = await write(io, settings);
    return path === null ? words().writingHeadline : words().commandSaved(path);
  } catch (error) {
    return words().commandFailed(reasonOf(error));
  }
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
const REDUCED$1 = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
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
const SCHEME$1 = ":root{color-scheme:light dark}";
function toPic(part) {
  const { width, height } = part;
  const source = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`,
    ` role="img" aria-label="${escapeXml(part.alt)}"><style>${SCHEME$1}${svgStyle(part.body)}</style>${part.body}</svg>`
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

const AHEAD_OF_PACE = 0.1;
const NEAR_FULL = 0.95;
const PERCENT$1 = 100;
const fullText = () => pick({ en: "full", tr: "dolu" });
function meterTone(ratio, pace, role) {
  if (ratio >= NEAR_FULL)
    return "danger";
  if (pace !== undefined && ratio - pace > AHEAD_OF_PACE)
    return "warn";
  return role ?? "mid";
}
const clampRatio = (value, max = 1) => max > 0 && !Number.isNaN(value) ? Math.max(0, Math.min(1, value / max)) : 0;
function percentText(value, max = 1) {
  if (max > 0 && value >= max)
    return fullText();
  const percent = Math.round(clampRatio(value, max) * PERCENT$1);
  return pick({ en: `${percent}%`, tr: `%${percent}` });
}
const TRACK_H = 4;
const HERO_H = 6;
const TICK_H = 10;
const TICK_HALO = 3;
const BAR_ONLY_H = 12;
const LABELLED_H = 28;
const LABEL_BOX = 16;
const BAR_CENTER_LABELLED = 22;
function meterGeometry(o) {
  const ratio = clampRatio(o.value, o.max);
  const height = o.isHero ? HERO_H : TRACK_H;
  const fill = ratio > 0 ? Math.min(o.width, Math.max(height, Math.round(o.width * ratio))) : 0;
  const pace = o.pace === undefined ? null : Math.max(0, Math.min(1, o.pace));
  const paceX = pace === null ? null : Math.round(Math.min(o.width - 1, pace * o.width));
  return { ratio, fill, track: o.width, height, paceX, tone: meterTone(ratio, o.pace, o.role) };
}
function meterBar(o, g, centerY) {
  const top = centerY - g.height / 2;
  const bar = { x: 0, y: top, height: g.height, radius: g.height / 2 };
  const tick = g.paceX === null ? "" : rectEl({ x: g.paceX - 1, y: top, width: TICK_HALO, height: g.height, paint: o.bg ?? "card" }) + rectEl({ x: g.paceX, y: centerY - TICK_H / 2, width: 1, height: TICK_H, paint: "mid" });
  return [
    rectEl({ ...bar, width: g.track, paint: "track" }),
    g.fill > 0 ? rectEl({ ...bar, width: g.fill, paint: g.tone }, ' data-m-fill=""') : "",
    tick
  ].join("");
}
function meterPart(o) {
  const g = meterGeometry(o);
  const shown = o.valueText ?? percentText(o.value, o.max);
  const isLabelled = o.label !== undefined || o.valueText !== undefined;
  const height = isLabelled ? LABELLED_H : BAR_ONLY_H;
  const y = baseline(0, LABEL_BOX, TYPE.label.size);
  const texts = isLabelled ? [
    o.label ? textEl({ x: 0, y, text: o.label, paint: "mid", ...TYPE.label }) : "",
    textEl({ x: o.width, y, text: shown, paint: g.ratio >= NEAR_FULL ? "danger" : "hi", size: TYPE.label.size, weight: 600, anchor: "end", isMono: true })
  ].join("") : "";
  const bar = meterBar(o, g, isLabelled ? BAR_CENTER_LABELLED : BAR_ONLY_H / 2);
  return { body: texts + bar, width: o.width, height, alt: `${o.label ? `${o.label}: ` : ""}${shown}` };
}
const meter = (o) => toPic(meterPart(o));

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
const PANE_PX_PER_CELL = 9;
const CARD_PAD_X = 2;
const CARD_PAD_Y = 1;
const CARD_BORDER_CELLS = 2;
const MIN_INNER = 160;
const isTextSurface = (ui, surface) => surface === "terminal" || !("Svg" in ui);
const cardInnerWidth = (columns) => Math.max(MIN_INNER, (columns - CARD_PAD_X * 2 - CARD_BORDER_CELLS) * PX_PER_CELL);
const paneInnerWidth = (columns) => Math.max(MIN_INNER, (columns - CARD_PAD_X * 2 - CARD_BORDER_CELLS) * PANE_PX_PER_CELL);
const isRole = (paint) => ROLES.includes(paint);
const toneKey = (paint) => isRole(paint) ? ROLE_KEY[paint] : undefined;
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
const DEFAULT_CELLS = 20;
function headOf(filled, cells) {
  if (filled <= 0)
    return "";
  return filled < cells ? "╸" : "━";
}
function meterGlyphs(ratio, cells = DEFAULT_CELLS, pace) {
  const filled = Math.round(Math.max(0, Math.min(1, ratio)) * cells);
  const fill = "━".repeat(Math.max(0, filled - 1)) + headOf(filled, cells);
  const at = pace === undefined ? -1 : Math.round(Math.max(0, Math.min(1, pace)) * cells);
  const empty = cells - filled;
  if (at < filled || at >= cells)
    return { fill, rest: "─".repeat(empty), pace: "", after: "" };
  return { fill, rest: "─".repeat(at - filled), pace: "┊", after: "─".repeat(empty - (at - filled) - 1) };
}
function Meter(draw, o) {
  const { ui, surface } = draw;
  const { Box, Text } = ui;
  if (!isTextSurface(ui, surface))
    return svgOf(draw, { key: `meter:${o.label ?? ""}` }, meter(o)) ?? h(Box, null);
  const ratio = clampRatio(o.value, o.max);
  const g = meterGlyphs(ratio, o.cells, o.pace);
  const key = toneKey(meterTone(ratio, o.pace, o.role));
  return h(Text, null, o.label ? h(Text, null, `${o.label} `) : null, h(Text, {
    color: key
  }, g.fill), h(Text, {
    dimColor: true
  }, g.rest), h(Text, {
    dimColor: true
  }, g.pace), h(Text, {
    dimColor: true
  }, g.after), h(Text, {
    bold: true,
    color: ratio >= 1 ? "error" : undefined
  }, ` ${o.valueText ?? percentText(o.value, o.max)}`));
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

const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;
const PERCENT = 100;
const FENCE = "```";
const motion = paneMotion();
function ageText(ms) {
  const says = words();
  const minutes = Math.floor(ms / MS_PER_MINUTE);
  if (minutes < 1)
    return says.ago.now;
  return minutes < MINUTES_PER_HOUR ? says.ago.m(minutes) : says.ago.h(Math.floor(minutes / MINUTES_PER_HOUR));
}
function previewOf(text) {
  const lines = text.trimEnd().split(`
`);
  const kept = lines.slice(0, PREVIEW_LINES);
  const fences = kept.filter((line) => line.startsWith(FENCE)).length;
  const isCut = kept.length < lines.length;
  return [...kept, ...fences % 2 === 1 ? [FENCE] : [], ...isCut ? ["…"] : []].join(`
`);
}
function statusOf(note, now) {
  const says = words();
  if (note.consumedBy !== null)
    return says.consumed;
  if (isTooOld(note, now))
    return says.stale;
  return note.isInjectOn ? says.injectOn : says.injectOff;
}
const howOf = (trigger) => words().how[trigger] ?? trigger;
const fileName = (path) => path.slice(path.lastIndexOf("/") + 1);
function noteButtons(view, note) {
  const says = words();
  const canToggle = note.consumedBy === null && !isTooOld(note, view.now);
  const toggle = canToggle ? [{ key: "handoff-toggle", label: note.isInjectOn ? says.turnOff : says.turnOn, onPress: view.actions.onToggle }] : [];
  return [
    ...toggle,
    { key: "handoff-write-now", label: says.writeNow, onPress: view.actions.onWrite },
    { key: "handoff-delete", label: says.delete, variant: "plain", isDestructive: true, onPress: view.actions.onDelete }
  ];
}
function contextMeter(draw, view, width) {
  return view.percent === null ? [] : [Meter(draw, { label: words().context, value: view.percent / PERCENT, width })];
}
function emptyCard(draw, view, width) {
  const says = words();
  const buttons = [{ key: "handoff-write-now", label: says.writeNow, variant: "primary", onPress: view.actions.onWrite }];
  return Card(draw, {
    header: { icon: "flag", eyebrow: says.latest, sub: says.emptyLine(askPointOf(view)), width },
    children: [...contextMeter(draw, view, width), ButtonRow(draw, { buttons })]
  });
}
function noteCard(draw, view, note, width) {
  const says = words();
  const { Box, Markdown } = draw.ui;
  const kind = note.isSummarized ? says.summarized : says.plain;
  return Card(draw, {
    header: {
      icon: "flag",
      eyebrow: says.latest,
      meta: ageText(view.now - note.at),
      headline: fileName(note.path),
      sub: `${statusOf(note, view.now)} · ${kind}`,
      width
    },
    children: [
      ...contextMeter(draw, view, width),
      h(Box, {
        key: "handoff-preview",
        flexDirection: "column"
      }, h(Markdown, {
        key: "handoff-note",
        text: previewOf(note.text)
      })),
      ButtonRow(draw, { buttons: noteButtons(view, note) })
    ]
  });
}
function writingCard$1(draw, width) {
  return Card(draw, { header: { icon: "pencil", role: "edit", hasDot: true, eyebrow: words().latest, headline: words().writingHeadline, width } });
}
function aboutCard(draw, view, width) {
  const { Text } = draw.ui;
  const lines = words().aboutLines(askPointOf(view), view.autoAt, Math.round(NOTES_MAX_AGE_MS / MS_PER_DAY));
  return Card(draw, {
    header: { icon: "flag", eyebrow: words().aboutEyebrow, width },
    children: lines.map((line, index) => h(Text, {
      key: `handoff-about-${index}`,
      wrap: "wrap"
    }, line))
  });
}
function noteRow(draw, view, entry, index) {
  const says = words();
  const { Box, Text } = draw.ui;
  const kind = entry.kind === "compact" ? says.kindCompact(howOf(entry.trigger ?? "")) : says.kindHandoff;
  const button = { key: `handoff-drop-${index}`, label: says.drop, variant: "plain", isDestructive: true, onPress: () => view.actions.onDrop(entry.path) };
  return h(Box, {
    key: `handoff-row-${index}`,
    flexDirection: "column"
  }, h(Text, {
    wrap: "truncate-middle"
  }, fileName(entry.path)), h(Text, {
    dimColor: true,
    wrap: "wrap"
  }, `${kind} · ${ageText(view.now - entry.at)}`), ButtonRow(draw, { buttons: [button] }));
}
function notesCard(draw, view, width) {
  const { Text } = draw.ui;
  const others = view.notes.filter((entry) => entry.path !== view.note?.path);
  const rows = others.length === 0 ? [h(Text, {
    key: "handoff-notes-empty",
    dimColor: true
  }, words().notesEmpty)] : others.map((entry, index) => noteRow(draw, view, entry, index));
  return Card(draw, { header: { icon: "flag", eyebrow: words().notesEyebrow, width }, children: rows });
}
function latestCard(draw, view, width) {
  if (view.stage === "writing")
    return writingCard$1(draw, width);
  return view.note === null ? emptyCard(draw, view, width) : noteCard(draw, view, view.note, width);
}
function paneTree(draw, view) {
  const width = paneInnerWidth(view.columns);
  const { Box } = draw.ui;
  return h(Box, {
    flexDirection: "column",
    gap: 1
  }, latestCard(draw, view, width), aboutCard(draw, view, width), notesCard(draw, view, width));
}

function quietLine(draw, text, buttons) {
  const { Box, Text } = draw.ui;
  return h(Box, {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 2
  }, h(Text, {
    key: "handoff-line",
    dimColor: true
  }, text), ButtonRow(draw, { buttons }));
}
function askLine(draw, view) {
  const says = words();
  const percent = view.percent ?? view.threshold;
  const text = [says.askHeadline(percent), view.autoAt === null ? "" : says.askAuto(view.autoAt)].filter((part) => part !== "").join(" · ");
  return quietLine(draw, text, [
    { key: "handoff-compact", label: says.compactKeep, variant: "primary", onPress: view.actions.onCompact },
    { key: "handoff-write", label: says.handOff, onPress: view.actions.onWrite },
    { key: "handoff-snooze", label: says.notNow, variant: "plain", onPress: view.actions.onSnooze }
  ]);
}
const kTokens = (n) => `${Math.round(n / TOKENS_PER_K)}k`;
function compactedLine(draw, line, view) {
  const says = words();
  const { tokensBefore: before, tokensAfter: after } = line;
  const sizes = before === undefined || after === undefined ? "" : says.sizes(kTokens(before), kTokens(after));
  const text = [says.compactedHead(howOf(line.trigger)), sizes, says.notesSaved].filter((part) => part !== "").join(" · ");
  return quietLine(draw, text, [
    { key: "handoff-restore", label: says.restore, variant: "primary", onPress: view.actions.onRestore },
    { key: "handoff-forget", label: says.dismiss, variant: "plain", onPress: view.actions.onForget }
  ]);
}
function offerCard(draw, view, width) {
  const says = words();
  const buttons = [
    { key: "handoff-continue", label: says.continueFrom, variant: "primary", onPress: view.actions.onContinue },
    { key: "handoff-decline", label: says.notNow, variant: "plain", onPress: view.actions.onDecline }
  ];
  const age = view.note === null ? "" : ageText(view.now - view.note.at);
  return Card(draw, {
    header: { icon: "flag", eyebrow: says.eyebrow, meta: age, headline: says.offerHeadline, sub: says.offerSub, width },
    children: [ButtonRow(draw, { buttons })]
  });
}
function savedCard(draw, view, width) {
  const says = words();
  const { Text } = draw.ui;
  const path = view.note === null ? "" : relativeTo(view.note.root, view.note.path);
  const buttons = [
    { key: "handoff-show", label: says.showNote, variant: "primary", onPress: view.actions.onShow },
    { key: "handoff-dismiss", label: says.gotIt, variant: "plain", onPress: view.actions.onDismiss }
  ];
  return Card(draw, {
    header: { icon: "check", eyebrow: says.eyebrow, headline: says.savedHeadline, sub: says.savedSub, width },
    children: [h(Text, {
      key: "handoff-path",
      dimColor: true,
      wrap: "truncate-middle"
    }, path), ButtonRow(draw, { buttons })]
  });
}
function failedCard(draw, view, width) {
  const says = words();
  const buttons = [
    { key: "handoff-retry", label: says.tryAgain, variant: "primary", onPress: view.actions.onWrite },
    { key: "handoff-snooze", label: says.notNow, variant: "plain", onPress: view.actions.onSnooze }
  ];
  return Card(draw, {
    role: "danger",
    header: { icon: "x", eyebrow: says.failedEyebrow, headline: says.failedHeadline, sub: view.failure ?? undefined, width },
    children: [ButtonRow(draw, { buttons })]
  });
}
function writingCard(draw, width) {
  return Card(draw, { header: { icon: "pencil", role: "edit", hasDot: true, eyebrow: words().eyebrow, headline: words().writingHeadline, width } });
}
function bandCard(draw, view) {
  const width = cardInnerWidth(view.columns);
  if (view.kind === "ask")
    return askLine(draw, view);
  if (view.kind === "compacted" && view.compacted !== null)
    return compactedLine(draw, view.compacted, view);
  if (view.kind === "offer")
    return offerCard(draw, view, width);
  if (view.kind === "saved")
    return savedCard(draw, view, width);
  if (view.kind === "failed")
    return failedCard(draw, view, width);
  return writingCard(draw, width);
}
function withTheirs(draw, card, theirs) {
  const { Box } = draw.ui;
  return h(Box, {
    flexDirection: "column"
  }, card, theirs);
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

const WRITE_FIELDS = { Write: "file_path", Edit: "file_path", NotebookEdit: "notebook_path" };
function touchedPath(tool, input) {
  const field = WRITE_FIELDS[tool];
  if (field === undefined || typeof input !== "object" || input === null)
    return null;
  const path = input[field];
  return typeof path === "string" && path !== "" ? path : null;
}
const withFile = (files, path) => files.includes(path) ? [...files] : [...files, path];
function errorLine(tool, text) {
  const first = (text ?? "").split(`
`).map((line) => line.trim()).find((line) => line !== "") ?? "";
  const line = first === "" ? tool : `${tool}: ${first}`;
  return line.length <= ERROR_CHARS ? line : `${line.slice(0, ERROR_CHARS - 1)}…`;
}

const percentAtom = atom({ plugin: "handoff", key: "percent" }, null);
const snoozeAtom = atom({ plugin: "handoff", key: "snoozeUntil" }, null);
const stageAtom = atom({ plugin: "handoff", key: "stage" }, "idle");
const failureAtom = atom({ plugin: "handoff", key: "failure" }, null);
const latestAtom = atom({ plugin: "handoff", key: "latest" }, null);
const filesAtom = atom({ plugin: "handoff", key: "files" }, []);
const errorAtom = atom({ plugin: "handoff", key: "lastError" }, null);
const noticeAtom = atom({ plugin: "handoff", key: "notice" }, null);
const declinedAtom = atom({ plugin: "handoff", key: "declined" }, null);
const notesAtom = atom({ plugin: "handoff", key: "notes" }, []);
const compactedAtom = atom({ plugin: "handoff", key: "compacted" }, null);
const autoAtAtom = atom({ plugin: "handoff", key: "autoAt" }, null);
const hubRef = { plugin: "handoff", key: "hub" };
const homeRef = { plugin: "handoff", key: "home" };
const hubOnRef = { plugin: "modz", key: "isOn" };
const tasksRef = { plugin: "plan-steps", key: "tasks" };
const cacheTaxNotice = { plugin: "cache-tax", key: "notice" };
const knowNotice = { plugin: "you-should-know", key: "notice" };
const reflectNotice = { plugin: "reflect", key: "notice" };
const budgetNotice = { plugin: "session-budget", key: "notice" };
function cellsOf($) {
  return {
    percent: { get: () => read($, percentAtom), set: (value) => update($, percentAtom, () => value) },
    snoozeUntil: { get: () => read($, snoozeAtom), set: (value) => update($, snoozeAtom, () => value) },
    stage: { get: () => read($, stageAtom), set: (value) => update($, stageAtom, () => value) },
    failure: { get: () => read($, failureAtom), set: (value) => update($, failureAtom, () => value) },
    latest: { get: () => read($, latestAtom), set: (value) => update($, latestAtom, () => value) },
    files: { get: () => read($, filesAtom), set: (value) => update($, filesAtom, () => value) },
    lastError: { get: () => read($, errorAtom), set: (value) => update($, errorAtom, () => value) },
    notice: { get: () => read($, noticeAtom), set: (value) => update($, noticeAtom, () => value) },
    declined: { get: () => read($, declinedAtom), set: (value) => update($, declinedAtom, () => value) },
    notes: { get: () => read($, notesAtom), set: (value) => update($, notesAtom, () => value) },
    compacted: { get: () => read($, compactedAtom), set: (value) => update($, compactedAtom, () => value) },
    autoAt: { get: () => read($, autoAtAtom), set: (value) => update($, autoAtAtom, () => value) }
  };
}
async function openPane($) {
  motion.reset();
  const opened = await $.ui.open({ id: PANE, title: words().title, focus: true });
  try {
    if (!opened.isPlaced || (await $.state.get({ plugin: "modz", key: "isOn" })).value !== true)
      return;
    await $.state.set({ plugin: "handoff", key: "shown" }, shownOf(PANE, await $.clock.now()));
  } catch (error) {
    $.ui.log(`handoff: shown failed (${reasonOf(error)})`, { to: "debug" });
  }
}
function ioOf($) {
  const cells = cellsOf($);
  return {
    get: (key) => cells[key].get(),
    put: async (key, value) => {
      if (!isSame(await cells[key].get(), value))
        await cells[key].set(value);
    },
    hub: { get: async () => (await $.state.get(hubRef)).value, set: async (card) => void await $.state.set(hubRef, card) },
    tasks: async () => (await $.state.get(tasksRef)).value,
    store: { get: (key) => $.store.get(key), set: (key, note) => $.store.set(key, note), delete: (key) => $.store.delete(key) },
    now: () => $.clock.now(),
    root: () => $.session.root(),
    sessionId: () => $.session.id(),
    messages: () => $.session.messages(),
    complete: (request) => $.model.complete(request),
    run: (argv, options) => $.process.run(argv, options),
    writeFile: (path, text) => $.fs.write(path, text),
    compact: () => $.session.compact(),
    autoCompact: async () => {
      const { context } = await $.session.usage({ breakdown: "summary" });
      const isOn = context.breakdown?.isAutoCompactEnabled === true;
      return { tokens: isOn ? context.breakdown?.autoCompactThreshold ?? null : null, window: context.window };
    },
    append: (text) => $.session.append({ message: { type: "user", content: [{ type: "text", text }] } }),
    openPane: () => openPane($),
    log: (text) => $.ui.log(`handoff: ${text}`, { to: "debug" })
  };
}
async function isLightNow($) {
  const override = await $.env.get("MODZ_THEME").catch(() => {
    return;
  });
  const rows = await $.config.list().catch(() => []);
  return resolveLight({ override, theme: rows.find((row) => row.key === "theme")?.value });
}
function hookSession(on, settings) {
  on("session.start", async ($, e, next) => {
    setLang(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    const io = ioOf($);
    try {
      await $.command.register({ name: COMMAND, description: words().commandHelp, argumentHint: "[show]" });
      const repo = await repoOf(io);
      await loadNote(io, repo);
      await loadNotes(io, repo);
      await writeHub(io, settings);
    } catch (error) {
      io.log(`could not start (${reasonOf(error)})`);
    }
    return next(e);
  });
  on("session.end", async ($, e, next) => {
    const io = ioOf($);
    if (e.reason === "clear")
      await resetConversation(io, settings).catch((error) => io.log(`reset skipped (${reasonOf(error)})`));
    return next(e);
  });
  on("session.measure", async ($, e, next) => {
    const done = await next(e);
    if (e.changed.includes("context"))
      await measured(ioOf($), settings, e.context.percent === undefined ? null : Math.round(e.context.percent));
    return done;
  }).catch(($, e, next) => next(e));
}
function hookCompaction(on) {
  on("session.compact", async ($, e, next) => {
    if (e.agentId !== undefined || e.trigger === "precompute" || isOwnCompaction())
      return next(e);
    const io = ioOf($);
    const entry = await notesBefore(io, e.trigger);
    const result = await next(e);
    await noteCompacted(io, { trigger: e.trigger, result, entry }).catch((error) => io.log(`after compaction (${reasonOf(error)})`));
    return result;
  }).catch(($, e, next) => next(e));
}
function hookTools(on) {
  on("tool.call", async ($, e, next) => {
    const result = await next(e);
    if (result.deny !== undefined)
      return result;
    const tool = String(e.tool);
    const path = touchedPath(tool, e);
    if (result.isError === true)
      await ioOf($).put("lastError", errorLine(tool, result.text));
    else if (path !== null)
      await update($, filesAtom, (files) => withFile(files, path));
    return result;
  }).catch(($, e, next) => next(e));
}
function hookCommands(on, settings) {
  on("command.run", { command: COMMAND }, async ($, e) => ({ text: await runCommand(ioOf($), settings, e.args.trim().toLowerCase()) }));
  on("state.set", { plugin: "modz", key: "open" }, async ($, e, next) => {
    const done = await next(e);
    if (isOpenFor(e.value, PANE))
      await ioOf($).openPane();
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "modz", key: "stage" }, async ($, e, next) => {
    const done = await next(e);
    if (isOffStage(e.value, PANE))
      await $.ui.close({ id: PANE });
    return done;
  }).catch(($, e, next) => next(e));
  on("prompt.compose", async ($, e, next) => {
    const composed = await next(e);
    const section = await noteSection(ioOf($));
    return section === null ? composed : { sections: [...composed.sections, section] };
  }).catch(($, e, next) => next(e));
}
const louderSince = new Map;
async function hasLouderNotice($) {
  const now = await $.clock.now();
  const others = [
    await $.state.get(cacheTaxNotice),
    await $.state.get(knowNotice),
    await $.state.get(reflectNotice),
    await $.state.get(budgetNotice)
  ];
  const values = others.map((other) => other.value);
  return values.some((value, index) => value !== undefined && value !== null && isLouderNow(louderSince, { key: `${index}:${JSON.stringify(value)}`, now }));
}
const pressed = (io, run) => () => void run().catch((error) => io.log(`press failed (${reasonOf(error)})`));
function hookBand(on, settings) {
  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    const theirs = await next(e);
    if (isBandQuiet({ isWorking: e.props.isWorking, hasSurvey: e.props.hasSurvey }))
      return theirs;
    const io = ioOf($);
    const percent = await io.get("percent");
    const compacted = await io.get("compacted");
    const autoAt = await io.get("autoAt");
    const asked = cardOf({ percent, threshold: settings.threshold, snoozeUntil: await io.get("snoozeUntil"), stage: await io.get("stage"), autoAt, hasCompacted: compacted !== null });
    const kind = asked ?? (await isOffered(io) ? "offer" : null);
    if (kind === null || await hasLouderNotice($))
      return theirs;
    const draw = { ui: $.ui.resolve(e), surface: e.surface, isLight: await isLightNow($) };
    const card = bandCard(draw, {
      kind,
      percent,
      threshold: settings.threshold,
      autoAt: typeof autoAt === "number" ? autoAt : null,
      compacted,
      note: await io.get("latest"),
      failure: await io.get("failure"),
      columns: e.props.bodyColumns,
      actions: {
        onWrite: pressed(io, () => write(io, settings)),
        onCompact: pressed(io, () => compact(io, settings)),
        onSnooze: pressed(io, () => snooze(io, settings)),
        onShow: pressed(io, () => io.openPane()),
        onDismiss: pressed(io, () => dismiss(io, settings)),
        onContinue: pressed(io, () => take(io, settings)),
        onDecline: pressed(io, () => decline(io)),
        onRestore: pressed(io, () => restore(io)),
        onForget: pressed(io, () => forgetCompacted(io))
      },
      now: await io.now()
    });
    return pinned(e, withTheirs(draw, card, theirs));
  });
}
function hookPane(on, settings) {
  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) => {
    const io = ioOf($);
    const draw = { ui: $.ui.resolve(e), surface: e.surface, isLight: await isLightNow($), motion };
    const isHubOn = (await $.state.get(hubOnRef)).value === true;
    const goHome = pressed(io, async () => $.state.set(homeRef, { at: await $.clock.now() }));
    const autoAt = await io.get("autoAt");
    const tree = paneTree(draw, {
      note: await io.get("latest"),
      now: await io.now(),
      percent: await io.get("percent"),
      threshold: settings.threshold,
      autoAt: typeof autoAt === "number" ? autoAt : null,
      notes: await io.get("notes"),
      stage: await io.get("stage"),
      columns: e.props.bodyColumns,
      actions: {
        onWrite: pressed(io, () => write(io, settings)),
        onToggle: pressed(io, () => toggleInject(io, settings)),
        onDelete: pressed(io, () => remove(io, settings)),
        onDrop: (path) => pressed(io, () => drop(io, settings, path))()
      }
    });
    return pinned(e, withHome(draw.ui, tree, isHubOn ? goHome : null));
  });
}
const register = (on, options) => {
  const settings = settingsOf(options);
  hookSession(on, settings);
  hookCompaction(on);
  hookTools(on);
  hookCommands(on, settings);
  hookBand(on, settings);
  hookPane(on, settings);
};

export { register };
