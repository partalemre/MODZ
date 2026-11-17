// Built by `bin/modz build` from the files beside it. Never edited by hand.
import { atom, read, update } from 'claude-code';

const MAX_LCS_LINES = 400;
const SPAN_SHARE_MAX = 0.7;
function splitLines(text) {
  if (text === undefined || text === null || text === "")
    return [];
  const lines = String(text).split(`
`);
  if (lines.length > 1 && lines[lines.length - 1] === "")
    lines.pop();
  return lines;
}
function lcsTable(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1;i >= 0; i--) {
    for (let j = b.length - 1;j >= 0; j--) {
      const row = dp[i];
      row[j] = a[i] === b[j] ? (dp[i + 1]?.[j + 1] ?? 0) + 1 : Math.max(dp[i + 1]?.[j] ?? 0, row[j + 1] ?? 0);
    }
  }
  return dp;
}
function diffLines(oldText, newText, around = 1) {
  const a = splitLines(oldText);
  const b = splitLines(newText);
  if (a.length > MAX_LCS_LINES || b.length > MAX_LCS_LINES) {
    return [...a.map((t) => ({ op: "-", t })), ...b.map((t) => ({ op: "+", t }))];
  }
  const dp = lcsTable(a, b);
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ op: " ", t: a[i] });
      i++;
      j++;
    } else if ((dp[i + 1]?.[j] ?? 0) >= (dp[i]?.[j + 1] ?? 0))
      out.push({ op: "-", t: a[i++] });
    else
      out.push({ op: "+", t: b[j++] });
  }
  while (i < a.length)
    out.push({ op: "-", t: a[i++] });
  while (j < b.length)
    out.push({ op: "+", t: b[j++] });
  return withSpans(trimContext(out, around));
}
const isChange = (line) => line !== undefined && line.op !== " ";
function trimContext(lines, around = 1) {
  if (!lines.some(isChange))
    return lines;
  const out = [];
  let skipped = false;
  lines.forEach((line, k) => {
    if (lines.slice(Math.max(0, k - around), k + around + 1).some(isChange)) {
      if (skipped && out.length > 0)
        out.push({ op: "~", t: "⋯" });
      out.push(line);
      skipped = false;
    } else
      skipped = true;
  });
  return out;
}
function countChanges(diff) {
  return {
    add: diff.filter((line) => line.op === "+").length,
    del: diff.filter((line) => line.op === "-").length
  };
}
const isWord = (char) => char !== undefined && /[\p{L}\p{N}_$]/u.test(char);
function changedSpans(before, after) {
  let head = 0;
  while (head < before.length && head < after.length && before[head] === after[head])
    head++;
  while (head > 0 && isWord(before[head - 1]) && (isWord(before[head]) || isWord(after[head])))
    head--;
  let tail = 0;
  const room = Math.min(before.length, after.length) - head;
  while (tail < room && before[before.length - 1 - tail] === after[after.length - 1 - tail])
    tail++;
  const endOf = (text) => text.length - tail;
  while (tail > 0 && isWord(before[endOf(before)]) && (isWord(before[endOf(before) - 1]) || isWord(after[endOf(after) - 1])))
    tail--;
  const longest = Math.max(before.length, after.length);
  const changed = Math.max(endOf(before) - head, endOf(after) - head);
  if (longest === 0 || changed / longest > SPAN_SHARE_MAX || head + tail === 0)
    return null;
  return { before: { start: head, end: endOf(before) }, after: { start: head, end: endOf(after) } };
}
function withSpans(lines) {
  const out = lines.map((line) => ({ ...line }));
  let k = 0;
  while (k < out.length) {
    let removed = 0;
    while (out[k + removed]?.op === "-")
      removed++;
    let added = 0;
    while (out[k + removed + added]?.op === "+")
      added++;
    if (removed > 0 && removed === added)
      pairSpans(out, { from: k, count: removed });
    k += Math.max(1, removed + added);
  }
  return out;
}
function pairSpans(lines, run) {
  for (let n = 0;n < run.count; n++) {
    const before = lines[run.from + n];
    const after = lines[run.from + run.count + n];
    const spans = changedSpans(before.t, after.t);
    if (spans === null)
      continue;
    before.span = spans.before;
    after.span = spans.after;
  }
}

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const lang = () => current;
const pick = (table) => table[current];
const upper = (text) => text.toLocaleUpperCase(current);

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const EN = {
  title: "Replay",
  command: 'Replay: step through the file edits of the last turn; "turns" or "sessions" to go back further',
  commandCount: (n) => `Replay: ${count(n, "edit", "edits")}`,
  commandEmpty: "Replay: no edits yet.",
  justNow: "just now",
  minutesAgo: (n) => `${n}m ago`,
  hoursAgo: (n) => `${n}h ago`,
  daysAgo: (n) => `${n}d ago`,
  prev: "Previous",
  next: "Next",
  finish: "Finish",
  close: "Close",
  unknownFile: "(unknown file)",
  replaceAll: "replace all",
  editOf: (k, total) => `edit ${k}/${total}`,
  newFile: "new file",
  rewrite: "rewrite",
  emptyLead: "No edits yet",
  emptyRest: "When Claude finishes a turn that edits files, its steps play here.",
  editsInFiles: (edits, files) => `${count(edits, "edit", "edits")} in ${count(files, "file", "files")}`,
  nowOn: (k, name) => `now on edit ${k}: ${name}`,
  diffAlt: "Change: removed and added lines",
  editsAndFiles: (edits, files) => `${count(edits, "edit", "edits")} · ${count(files, "file", "files")}`,
  byCommands: (n) => `${count(n, "command", "commands")} in this turn may have changed files; those changes cannot be replayed.`,
  explaining: "explaining",
  planStep: (index, total) => `Plan step ${index}/${total}`,
  projectRoot: "main project folder",
  editNumber: (k, total) => `Edit ${k} / ${total}`,
  moreLines: (n) => `… ${count(n, "more line", "more lines")}`,
  noLineChanges: "no line changes",
  removed: "Removed",
  added: "Added",
  changedWord: "Changed word",
  unchanged: "Unchanged",
  linesAdded: (n) => `${count(n, "line", "lines")} added`,
  removedCount: (n) => `${n} removed`,
  earlier: (n) => `↑ ${n} earlier`,
  moreEdits: (n) => `↓ ${count(n, "more edit", "more edits")}`,
  turns: "Turns",
  pastSessions: "Past sessions",
  thisSession: "This session",
  watchTurn: "Watch",
  openSession: "Open",
  more: "More",
  turnsTitle: "Turns with edits",
  sessionsTitle: "Past sessions",
  sessionsSub: (n) => `This project · ${count(n, "session", "sessions")}`,
  older: (n) => `${count(n, "older session", "older sessions")} not listed`,
  turnN: (n) => `Turn ${n}`,
  turnsAndEdits: (turns, edits) => `${count(turns, "turn", "turns")} · ${count(edits, "edit", "edits")}`,
  noEdits: "no edits",
  turnCount: (n) => count(n, "turn", "turns"),
  unreadable: "saved conversation not readable",
  reading: "Reading the saved conversation…",
  readingSessions: "Reading sessions…",
  unavailableLead: "No saved conversations to read",
  unavailableRest: "This session keeps no record of the conversation on this computer (transcript), so earlier turns and sessions cannot be read here.",
  noTurnsLead: "No edits in this session",
  noTurnsRest: "None of its turns changed a file.",
  cut: "only the newest part of a very long conversation was read",
  untitled: "(no message)",
  spanOnly: "edited part only",
  beforeUnknown: "whole file; earlier text not in the saved conversation",
  newCell: "new notebook cell",
  cellDeleted: "notebook cell deleted; its text not recorded",
  cellReplaced: "notebook cell replaced; old text not recorded",
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  date: (month, day, time) => `${month} ${day}, ${time}`,
  explainAsk: "Say what each file change does in one English sentence of at most 10 words.",
  explainForm: 'Write only "<number>: <explanation>" lines and nothing else.'
};
const TR = {
  title: "Tekrar",
  command: 'Tekrar: son turdaki dosya düzenlemelerini adım adım izle; daha gerisi için "turns" ya da "sessions"',
  commandCount: (n) => `Tekrar: ${n} düzenleme`,
  commandEmpty: "Tekrar: henüz düzenleme yok.",
  justNow: "az önce",
  minutesAgo: (n) => `${n} dk önce`,
  hoursAgo: (n) => `${n} sa önce`,
  daysAgo: (n) => `${n} gün önce`,
  prev: "Önceki",
  next: "Sonraki",
  finish: "Bitir",
  close: "Kapat",
  unknownFile: "(bilinmeyen dosya)",
  replaceAll: "tümünü değiştir",
  editOf: (k, total) => `düzenleme ${k}/${total}`,
  newFile: "yeni dosya",
  rewrite: "yeniden yazım",
  emptyLead: "Henüz düzenleme yok",
  emptyRest: "Claude dosya düzenleyen bir turu bitirince adımlar burada oynatılır.",
  editsInFiles: (edits, files) => `${files} dosyada ${edits} düzenleme`,
  nowOn: (k, name) => `şu an ${k}. düzenleme: ${name}`,
  diffAlt: "Değişiklik: silinen ve eklenen satırlar",
  editsAndFiles: (edits, files) => `${edits} düzenleme · ${files} dosya`,
  byCommands: (n) => `Bu turda ${n} komut dosyaları değiştirmiş olabilir; bu değişiklikler tekrar oynatılamaz.`,
  explaining: "açıklanıyor",
  planStep: (index, total) => `Plan adımı ${index}/${total}`,
  projectRoot: "proje ana klasörü",
  editNumber: (k, total) => `Düzenleme ${k} / ${total}`,
  moreLines: (n) => `… ${n} satır daha`,
  noLineChanges: "satır değişikliği yok",
  removed: "Silindi",
  added: "Eklendi",
  changedWord: "Değişen kelime",
  unchanged: "Değişmedi",
  linesAdded: (n) => `${n} satır eklendi`,
  removedCount: (n) => `${n} silindi`,
  earlier: (n) => `↑ ${n} önceki`,
  moreEdits: (n) => `↓ ${n} düzenleme daha`,
  turns: "Turlar",
  pastSessions: "Geçmiş oturumlar",
  thisSession: "Bu oturum",
  watchTurn: "İzle",
  openSession: "Aç",
  more: "Daha fazla",
  turnsTitle: "Düzenleme yapan turlar",
  sessionsTitle: "Geçmiş oturumlar",
  sessionsSub: (n) => `Bu proje · ${n} oturum`,
  older: (n) => `${n} eski oturum listelenmedi`,
  turnN: (n) => `Tur ${n}`,
  turnsAndEdits: (turns, edits) => `${turns} tur · ${edits} düzenleme`,
  noEdits: "düzenleme yok",
  turnCount: (n) => `${n} tur`,
  unreadable: "sohbet kaydı okunamadı",
  reading: "Sohbet kaydı okunuyor…",
  readingSessions: "Oturumlar okunuyor…",
  unavailableLead: "Okunacak sohbet kaydı yok",
  unavailableRest: "Bu oturum bu bilgisayarda sohbet kaydı (transcript) tutmuyor; önceki turlar ve oturumlar burada okunamıyor.",
  noTurnsLead: "Bu oturumda düzenleme yok",
  noTurnsRest: "Turlarının hiçbiri bir dosyayı değiştirmedi.",
  cut: "çok uzun sohbetin yalnızca son kısmı okundu",
  untitled: "(mesaj yok)",
  spanOnly: "yalnızca düzenlenen kısım",
  beforeUnknown: "tüm dosya; önceki metin sohbet kaydında yok",
  newCell: "yeni not defteri hücresi",
  cellDeleted: "not defteri hücresi silindi; metni kayıtlı değil",
  cellReplaced: "not defteri hücresi değişti; eski metni kayıtlı değil",
  months: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
  date: (month, day, time) => `${day} ${month} ${time}`,
  explainAsk: "Her dosya değişikliğinin ne işe yaradığını Türkçe, en fazla 10 kelimelik tek bir cümleyle yaz.",
  explainForm: 'Yalnızca "<numara>: <açıklama>" satırları yaz, başka hiçbir şey yazma.'
};
const words = () => pick({ en: EN, tr: TR });

const EDIT_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);
function relPath(cwd, path) {
  if (path === undefined || path === "")
    return words().unknownFile;
  if (cwd !== "" && path.startsWith(`${cwd}/`))
    return path.slice(cwd.length + 1);
  return path;
}
function writeNote(old) {
  const w = words();
  if (old.isKnown === false)
    return w.beforeUnknown;
  return old.isNew ? w.newFile : w.rewrite;
}
function notebookNote(mode) {
  const w = words();
  if (mode === "insert")
    return w.newCell;
  return mode === "delete" ? w.cellDeleted : w.cellReplaced;
}
const AROUND = 3;
const lineOf = (text, at) => text.slice(0, at).split(`
`).length - 1;
function inFile(text, change) {
  const at = text === null || typeof change.old !== "string" || change.old === "" ? -1 : text.indexOf(change.old);
  if (text === null || at < 0 || typeof change.old !== "string")
    return { diff: diffLines(change.old, change.new), text: null };
  const after = `${text.slice(0, at)}${String(change.new ?? "")}${text.slice(at + change.old.length)}`;
  const first = Math.max(0, lineOf(text, at) - AROUND);
  const last = lineOf(text, at + change.old.length) + AROUND;
  const grown = lineOf(after, at + String(change.new ?? "").length) - lineOf(text, at + change.old.length);
  const window = (whole, end) => whole.split(`
`).slice(first, end + 1).join(`
`);
  return { diff: diffLines(window(text, last), window(after, last + grown), AROUND), text: after };
}
const knownText = (old) => old.isKnown === false || old.isNew ? null : old.text;
function multiSteps(base, edits, start) {
  let text = start;
  return edits.map((edit, k) => {
    const made = inFile(text, { old: edit.old_string, new: edit.new_string });
    text = made.text;
    return { ...base, diff: made.diff, note: words().editOf(k + 1, edits.length), hasContext: made.text !== null };
  });
}
async function stepsFor(io, e) {
  const file = relPath(io.cwd, e.tool === "NotebookEdit" ? e.notebook_path : e.file_path);
  const said = typeof e.description === "string" && e.description.trim() !== "" ? e.description.trim() : undefined;
  const base = { tool: e.tool, file, toolUseId: e.tool_use_id, agentId: e.agentId, ...said === undefined ? {} : { said } };
  const w = words();
  if (e.tool === "Edit") {
    const made = inFile(e.replace_all === true ? null : knownText(await io.before(e.file_path)), { old: e.old_string, new: e.new_string });
    return [{ ...base, diff: made.diff, note: e.replace_all === true ? w.replaceAll : "", hasContext: made.text !== null }];
  }
  if (e.tool === "MultiEdit" && Array.isArray(e.edits))
    return multiSteps(base, e.edits, knownText(await io.before(e.file_path)));
  if (e.tool === "Write") {
    const old = await io.before(e.file_path);
    return [{ ...base, diff: diffLines(old.text, e.content), note: writeNote(old) }];
  }
  if (e.tool === "NotebookEdit") {
    return [{ ...base, diff: e.edit_mode === "delete" ? [] : diffLines("", e.new_source), note: notebookNote(e.edit_mode) }];
  }
  return [];
}
const CHANGING = [
  />>?\s*(?!&|\/dev\/null)[^\s|&;]/,
  /(^|[\s;&|(])(sed|perl)\s+(-\w+\s+)*-\w*i/,
  /(^|[\s;&|(])(mv|cp|rm|touch|tee|patch|truncate|ln)\s/,
  /(^|[\s;&|(])git\s+(apply|checkout|restore|reset|stash|merge|rebase|cherry-pick|am|pull|mv|rm)\b/,
  /\s--(write|fix)\b/
];
const isChangingCommand = (command) => CHANGING.some((pattern) => pattern.test(command));
function isAnswered(result) {
  return result.deny === undefined && result.isError !== true;
}

const EXPLAIN_MODEL = "haiku";
const MAX_MODEL_STEPS = 20;
const NOTE_MAX = 90;
const DIFF_PER_STEP = 600;
const TOKENS_PER_STEP = 40;
function shortLine(text) {
  const line = text.split(`
`).map((part) => part.replace(/^[\s#>*-]+/, "").trim()).find((part) => part !== "") ?? "";
  const plain = line.replace(/[*_`]/g, "");
  const sentence = (plain.match(/^(.+?[.!?])(\s|$)/)?.[1] ?? plain).replace(/[.:;,]+$/, "").trim();
  return sentence.length > NOTE_MAX ? `${sentence.slice(0, NOTE_MAX - 1).trimEnd()}…` : sentence;
}
function isPrompt(message) {
  return message.role === "user" && message.text.trim() !== "" && (message.toolResults ?? []).length === 0;
}
function notesFromMessages(messages, ids) {
  const notes = new Map;
  let pending = "";
  for (const message of messages) {
    if (isPrompt(message))
      pending = "";
    if (message.role !== "assistant")
      continue;
    if (message.text.trim() !== "")
      pending = shortLine(message.text);
    for (const use of message.toolUses) {
      if (ids.has(use.tool_use_id) && pending !== "")
        notes.set(use.tool_use_id, pending);
    }
    if (message.toolUses.some((use) => !EDIT_TOOLS.has(use.tool)))
      pending = "";
  }
  return notes;
}
function idsOfLoop(steps, agentId) {
  return new Set(steps.flatMap((step) => step.agentId === agentId && step.toolUseId !== undefined ? [step.toolUseId] : []));
}
function unexplained(steps) {
  return steps.flatMap((step, index) => step.said === undefined && step.diff.length > 0 ? [index] : []).slice(0, MAX_MODEL_STEPS);
}
function diffText(step) {
  return step.diff.map((line) => `${line.op === "~" ? " " : line.op}${line.t}`).join(`
`).slice(0, DIFF_PER_STEP);
}
function buildPrompt(steps, indexes) {
  const blocks = indexes.map((index, n) => {
    const step = steps[index];
    return `### ${n + 1}: ${step.file}
${diffText(step)}`;
  });
  const w = words();
  const prompt = [
    w.explainAsk,
    w.explainForm,
    "",
    ...blocks
  ].join(`
`);
  return { prompt, maxTokens: TOKENS_PER_STEP * indexes.length };
}
function parseReply(text, indexes) {
  const notes = new Map;
  for (const line of text.split(`
`)) {
    const found = line.match(/^\s*(\d+)\s*[:.)-]\s*(.+)$/);
    const index = found === null ? undefined : indexes[Number(found[1]) - 1];
    const note = found === null ? "" : shortLine(found[2]);
    if (index !== undefined && note !== "")
      notes.set(index, note);
  }
  return notes;
}
function withNotes(steps, noteOf) {
  return steps.map((step, index) => {
    const said = step.said ?? noteOf(step, index);
    return said === undefined ? step : { ...step, said };
  });
}

const MODEL_TIMEOUT_MS = 20000;
function why(error) {
  return error instanceof Error ? error.message : "bilinmiyor";
}
async function transcriptNotes(io, steps) {
  const notes = new Map;
  for (const agentId of new Set(steps.map((step) => step.agentId))) {
    const ids = idsOfLoop(steps, agentId);
    if (ids.size === 0)
      continue;
    try {
      const found = await io.messages(agentId);
      if (Array.isArray(found))
        notesFromMessages(found, ids).forEach((note, id) => notes.set(id, note));
    } catch (error) {
      io.log(`replay-theater: transcript not readable (${why(error)})`);
    }
  }
  return notes;
}
async function modelNotes(io, steps) {
  const indexes = unexplained(steps);
  if (indexes.length === 0)
    return new Map;
  const { prompt, maxTokens } = buildPrompt(steps, indexes);
  const reply = await io.complete({ model: EXPLAIN_MODEL, prompt, maxTokens, effort: "low", timeoutMs: MODEL_TIMEOUT_MS });
  if (reply.isAnswered)
    return parseReply(reply.text, indexes);
  io.log(`replay-theater: no explanation from the model (${reply.reason})`);
  return new Map;
}
async function explainReplay(io, id) {
  const replay = await io.replay();
  if (replay === null || replay.id !== id || replay.explain !== "none")
    return;
  await io.change(id, (current) => ({ ...current, explain: "pending" }));
  try {
    const said = await transcriptNotes(io, replay.steps);
    await io.change(id, (current) => ({ ...current, steps: withNotes(current.steps, (step) => step.toolUseId === undefined ? undefined : said.get(step.toolUseId)) }));
    const fresh = await io.replay();
    const guessed = fresh === null || fresh.id !== id ? new Map : await modelNotes(io, fresh.steps);
    await io.change(id, (current) => ({ ...current, steps: withNotes(current.steps, (_, index) => guessed.get(index)) }));
  } catch (error) {
    io.log(`replay-theater: explaining failed (${why(error)})`);
  } finally {
    await io.change(id, (current) => ({ ...current, explain: "done" }));
  }
}

const PLAN_TOOLS = ["TodoWrite", "TaskCreate", "TaskUpdate", "TaskList"];
function asStatus(value) {
  return value === "pending" || value === "in_progress" || value === "completed" ? value : null;
}
function asItems(list, titleKey) {
  if (!Array.isArray(list))
    return [];
  return list.flatMap((raw, index) => {
    const status = asStatus(raw?.status);
    const title = raw?.[titleKey];
    if (status === null || typeof title !== "string")
      return [];
    const id = typeof raw.id === "string" ? raw.id : String(index + 1);
    return [{ id, title, status }];
  });
}
function created(items, input, result) {
  if (typeof input.subject !== "string")
    return items;
  const task = result?.task;
  const id = typeof task?.id === "string" ? task.id : String(items.length + 1);
  return [...items, { id, title: input.subject, status: "pending" }];
}
function updated(items, input) {
  if (input.status === "deleted")
    return items.filter((item) => item.id !== input.taskId);
  return items.map((item) => {
    if (item.id !== input.taskId)
      return item;
    const title = typeof input.subject === "string" ? input.subject : item.title;
    return { ...item, title, status: asStatus(input.status) ?? item.status };
  });
}
function planAfter(items, input, result) {
  const fields = result ?? undefined;
  switch (input.tool) {
    case "TodoWrite":
      return asItems(input.todos, "content");
    case "TaskCreate":
      return created(items, input, fields);
    case "TaskUpdate":
      return updated(items, input);
    case "TaskList":
      return Array.isArray(fields?.tasks) ? asItems(fields.tasks, "subject") : items;
    default:
      return items;
  }
}
function currentStep(items) {
  const index = items.findIndex((item) => item.status === "in_progress");
  const item = items[index];
  return item === undefined ? null : { index: index + 1, total: items.length, title: item.title };
}

const MAIN = "";
const AGENT_TOOLS = new Set(["Agent", "Task"]);
const KEPT_TOOLS = new Set([...EDIT_TOOLS, ...PLAN_TOOLS, ...AGENT_TOOLS]);
const ROLE = /"type":\s*"(user|assistant)"/;
const RESULT_ID = /"tool_use_id":\s*"([^"]+)"/g;
const COMMAND = /<command-name>([^<]*)<\/command-name>/;
const COMMAND_ARGS = /<command-args>([^<]*)<\/command-args>/;
const INTERRUPTED = "[Request interrupted";
const newReader = (agent) => ({ agent, wanted: new Set, lastAt: "", skipped: 0 });
const isFields = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const textOf$1 = (value) => typeof value === "string" ? value : "";
function promptText(raw) {
  const text = raw.trim();
  const command = text.match(COMMAND);
  if (command !== null)
    return [command[1], text.match(COMMAND_ARGS)?.[1] ?? ""].join(" ").trim();
  if (text.startsWith("<") || text.startsWith(INTERRUPTED))
    return "";
  return text;
}
function isWorthParsing(line, reader) {
  const role = line.match(ROLE)?.[1];
  if (role === undefined)
    return false;
  if (role === "assistant" || !line.includes('"tool_use_id"'))
    return true;
  return [...line.matchAll(RESULT_ID)].some((found) => reader.wanted.has(found[1]));
}
function assistantEvents({ record, at }, content, reader) {
  const agent = record.isSidechain === true && reader.agent === MAIN ? `side:${textOf$1(record.agentId)}` : reader.agent;
  return content.flatMap((block) => {
    if (!isFields(block))
      return [];
    if (block.type === "text" && textOf$1(block.text).trim() !== "")
      return [{ kind: "said", at, agent, text: textOf$1(block.text) }];
    const id = textOf$1(block.id);
    const tool = textOf$1(block.name);
    if (block.type !== "tool_use" || id === "" || !KEPT_TOOLS.has(tool) || !isFields(block.input))
      return [];
    reader.wanted.add(id);
    return [{ kind: "use", at, agent, id, tool, input: block.input }];
  });
}
function userEvents({ record, at }, content, reader) {
  const blocks = Array.isArray(content) ? content.filter(isFields) : [];
  const results = blocks.filter((block) => block.type === "tool_result" && reader.wanted.has(textOf$1(block.tool_use_id)));
  const detail = results.length === 1 && isFields(record.toolUseResult) ? record.toolUseResult : undefined;
  if (blocks.some((block) => block.type === "tool_result")) {
    return results.map((block) => ({ kind: "result", at, id: textOf$1(block.tool_use_id), isError: block.is_error === true, detail }));
  }
  if (record.isMeta === true || record.isSidechain === true || reader.agent !== MAIN)
    return [];
  const raw = typeof content === "string" ? content : blocks.map((block) => block.type === "text" ? textOf$1(block.text) : "").join(`
`);
  const text = promptText(raw);
  return text === "" ? [] : [{ kind: "prompt", at, text }];
}
function parsed(line, reader) {
  try {
    const record = JSON.parse(line);
    return isFields(record) ? record : null;
  } catch {
    reader.skipped += 1;
    return null;
  }
}
function eventsOfLine(line, reader) {
  if (line.trim() === "" || !isWorthParsing(line, reader))
    return [];
  const record = parsed(line, reader);
  const message = record === null ? undefined : record.message;
  if (record === null || !isFields(message))
    return [];
  const stamp = textOf$1(record.timestamp);
  const at = stamp === "" ? reader.lastAt : stamp;
  reader.lastAt = at;
  if (record.type === "assistant" && Array.isArray(message.content))
    return assistantEvents({ record, at }, message.content, reader);
  return record.type === "user" ? userEvents({ record, at }, message.content, reader) : [];
}

const stringOr = (value) => typeof value === "string" ? value : undefined;
const isPlanTool = (tool) => PLAN_TOOLS.includes(tool);
const timeOf = (at) => {
  const ms = Date.parse(at);
  return Number.isFinite(ms) ? ms : 0;
};
function earlier(a, b) {
  if (a.event.at === b.event.at)
    return a.k - b.k;
  return a.event.at < b.event.at ? -1 : 1;
}
function inTimeOrder(events) {
  return events.map((event, k) => ({ event, k })).sort(earlier).map((item) => item.event);
}
function beforeOf(tool, result) {
  if (tool !== "Write" && tool !== "Edit" && tool !== "MultiEdit")
    return;
  const detail = result?.detail;
  if (detail?.type === "create")
    return { text: "", isNew: true };
  if (typeof detail?.originalFile === "string")
    return { text: detail.originalFile, isNew: false };
  return { text: "", isNew: false, isKnown: false };
}
function turnFor(fold, agent) {
  const owner = fold.owners.get(agent);
  const owned = owner === undefined ? undefined : fold.turnOfUse.get(owner);
  return owned ?? fold.turns[fold.turns.length - 1];
}
function opened(fold, at, ask) {
  const turn = { n: fold.turns.length + 1, ask, at: timeOf(at), edits: [] };
  fold.turns.push(turn);
  return turn;
}
function onUse(fold, event) {
  const result = fold.results.get(event.id);
  const isAnswered = result === undefined || !result.isError;
  if (AGENT_TOOLS.has(event.tool))
    fold.turnOfUse.set(event.id, fold.turns[fold.turns.length - 1] ?? opened(fold, event.at, ""));
  if (isPlanTool(event.tool) && isAnswered && !(event.tool === "TodoWrite" && event.agent !== MAIN)) {
    fold.plan = planAfter(fold.plan, { ...event.input, tool: event.tool }, result?.detail);
  }
  if (!EDIT_TOOLS.has(event.tool)) {
    fold.said.delete(event.agent);
    return;
  }
  if (!isAnswered)
    return;
  const turn = turnFor(fold, event.agent) ?? opened(fold, event.at, "");
  const said = fold.said.get(event.agent);
  const plan = currentStep(fold.plan) ?? undefined;
  const before = beforeOf(event.tool, result);
  turn.edits.push({ id: event.id, agent: event.agent, tool: event.tool, input: event.input, ...said === undefined ? {} : { said }, ...plan === undefined ? {} : { plan }, ...before === undefined ? {} : { before } });
}
function foldSession(events, owners) {
  const results = new Map(events.flatMap((event) => event.kind === "result" ? [[event.id, event]] : []));
  const fold = { turns: [], plan: [], said: new Map, turnOfUse: new Map, owners, results };
  let prompts = 0;
  let title = "";
  for (const event of events) {
    if (event.kind === "prompt") {
      prompts += 1;
      title = title === "" ? shortLine(event.text) : title;
      opened(fold, event.at, shortLine(event.text));
      fold.said.clear();
    } else if (event.kind === "said")
      fold.said.set(event.agent, shortLine(event.text));
    else if (event.kind === "use")
      onUse(fold, event);
  }
  return { title, prompts, turns: fold.turns.filter((turn) => turn.edits.length > 0) };
}
const filesOf = (turn) => new Set(turn.edits.map((edit) => stringOr(edit.input.file_path) ?? stringOr(edit.input.notebook_path) ?? "")).size;
const editCount = (session) => session.turns.reduce((sum, turn) => sum + turn.edits.length, 0);
function turnRows(session) {
  return session.turns.map((turn) => ({ n: turn.n, ask: turn.ask, at: turn.at, edits: turn.edits.length, files: filesOf(turn) })).reverse();
}
function spanNote(step) {
  if (step.tool !== "Edit" && step.tool !== "MultiEdit" || step.hasContext === true)
    return step;
  return { ...step, note: [words().spanOnly, step.note].filter(Boolean).join(" · ") };
}
function callOf$1(edit) {
  const input = edit.input;
  const edits = Array.isArray(input.edits) ? input.edits.filter((one) => typeof one === "object" && one !== null) : undefined;
  return {
    tool: edit.tool,
    tool_use_id: edit.id,
    ...edit.agent === MAIN ? {} : { agentId: edit.agent },
    file_path: stringOr(input.file_path),
    notebook_path: stringOr(input.notebook_path),
    old_string: input.old_string,
    new_string: input.new_string,
    content: input.content,
    new_source: input.new_source,
    replace_all: input.replace_all === true,
    edit_mode: input.edit_mode,
    description: input.description,
    edits
  };
}
async function stepsOfTurn(turn, cwd) {
  const steps = [];
  for (const edit of turn.edits) {
    const call = callOf$1(edit);
    const unknown = { text: "", isNew: false, isKnown: false };
    const made = await stepsFor({ cwd, before: async () => edit.before ?? unknown }, call);
    const extra = { ...edit.said === undefined ? {} : { said: edit.said }, ...edit.plan === undefined ? {} : { plan: edit.plan } };
    steps.push(...made.map((step) => spanNote({ ...extra, ...step })));
  }
  return steps;
}

const MIB = 1024 * 1024;
const FS_READ_MAX = 4 * MIB;
const READ_CAP_BLOCKS = 48;
const KEPT_MAX = 3;
const SUBAGENTS_MAX = 64;
const SESSION_FILE = /^(.+)\.jsonl$/;
const AGENT_FILE = /^agent-(.+)\.jsonl$/;
async function* stdoutOf(stream) {
  let errors = "";
  let hasOutput = false;
  for await (const chunk of stream) {
    if (chunk.stream === "stdout") {
      hasOutput = true;
      yield chunk.text;
    } else
      errors += chunk.text;
  }
  if (!hasOutput && errors.trim() !== "")
    throw new Error(errors.trim());
}
const folderOf$1 = (path) => path.slice(0, Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")));
function whereOf(transcript, cwd) {
  const dir = transcript === "" ? "" : folderOf$1(transcript);
  return { dir, current: transcript.slice(dir.length + 1).replace(SESSION_FILE, "$1"), cwd };
}
async function sessionFiles(io, dir) {
  const entries = await io.list(dir);
  return entries.flatMap((entry) => {
    const found = entry.kind === "file" ? entry.name.match(SESSION_FILE) : null;
    return found === null ? [] : [{ id: found[1], path: `${dir}/${entry.name}`, size: entry.size, mtimeMs: entry.mtimeMs }];
  }).sort((a, b) => b.mtimeMs - a.mtimeMs);
}
async function streamLines(io, file, onLine) {
  const skip = Math.max(0, Math.ceil(file.size / MIB) - READ_CAP_BLOCKS);
  const isCut = skip > 0;
  let isHead = isCut;
  let rest = "";
  for await (const piece of io.pieces(["dd", `if=${file.path}`, `bs=${MIB}`, `skip=${skip}`])) {
    const parts = (rest + piece).split(`
`);
    rest = parts.pop() ?? "";
    for (const line of parts) {
      if (isHead)
        isHead = false;
      else
        onLine(line);
    }
  }
  if (rest !== "" && !isHead)
    onLine(rest);
  return isCut;
}
async function eachLine(io, file, onLine) {
  if (file.size <= FS_READ_MAX) {
    const text = await io.read(file.path).catch((error) => {
      io.log(`replay-theater: ${file.path} read whole failed, streaming it (${why(error)})`);
      return null;
    });
    if (text !== null) {
      for (const line of text.split(`
`))
        onLine(line);
      return false;
    }
  }
  return streamLines(io, file, onLine);
}
async function ownerOf(io, path) {
  try {
    const meta = JSON.parse(await io.read(path));
    const owner = typeof meta === "object" && meta !== null ? meta.toolUseId : undefined;
    return typeof owner === "string" ? owner : undefined;
  } catch (error) {
    io.log(`replay-theater: ${path} not readable (${why(error)})`);
    return;
  }
}
async function subagentFiles(io, dir, id) {
  const folder = `${dir}/${id}/subagents`;
  const entries = await io.list(folder).catch(() => []);
  const names = new Set(entries.map((entry) => entry.name));
  const files = entries.flatMap((entry) => {
    const found = entry.kind === "file" ? entry.name.match(AGENT_FILE) : null;
    return found === null ? [] : [{ agent: found[1], path: `${folder}/${entry.name}`, size: entry.size }];
  });
  const out = [];
  for (const file of files.slice(0, SUBAGENTS_MAX)) {
    const meta = `agent-${file.agent}.meta.json`;
    const owner = names.has(meta) ? await ownerOf(io, `${folder}/${meta}`) : undefined;
    out.push(owner === undefined ? file : { ...file, owner });
  }
  return out;
}
async function readEvents(io, file, reader) {
  const events = [];
  const isCut = await eachLine(io, file, (line) => {
    for (const event of eventsOfLine(line, reader))
      events.push(event);
  });
  if (reader.skipped > 0)
    io.log(`replay-theater: ${reader.skipped} unreadable lines skipped in ${file.path}`);
  return { events, isCut };
}
async function readSession$1(io, file, dir) {
  const { events, isCut } = await readEvents(io, file, newReader(MAIN));
  const owners = new Map;
  for (const sub of await subagentFiles(io, dir, file.id)) {
    try {
      events.push(...(await readEvents(io, sub, newReader(sub.agent))).events);
      if (sub.owner !== undefined)
        owners.set(sub.agent, sub.owner);
    } catch (error) {
      io.log(`replay-theater: subagent ${sub.agent} not readable (${why(error)})`);
    }
  }
  return { ...foldSession(inTimeOrder(events), owners), isCut };
}
async function sessionOf(io, file, dir) {
  const hit = io.kept.get(file.id);
  if (hit !== undefined && hit.size === file.size && hit.mtimeMs === file.mtimeMs)
    return hit.session;
  const session = await readSession$1(io, file, dir);
  io.kept.delete(file.id);
  io.kept.set(file.id, { size: file.size, mtimeMs: file.mtimeMs, session });
  const oldest = io.kept.keys().next().value;
  if (io.kept.size > KEPT_MAX && oldest !== undefined)
    io.kept.delete(oldest);
  return session;
}

const SESSIONS_MAX = 20;
const isCount = (n) => typeof n === "number" && Number.isFinite(n);
function isSummary(value) {
  const s = value;
  return typeof s === "object" && s !== null && isCount(s.size) && isCount(s.mtimeMs) && typeof s.title === "string" && isCount(s.turns) && isCount(s.edits) && typeof s.isCut === "boolean";
}
async function readKept(io) {
  const raw = await io.kept.get().catch((error) => {
    io.archive.log(`replay-theater: kept session lines not readable (${why(error)})`);
    return;
  });
  if (typeof raw !== "object" || raw === null)
    return {};
  return Object.fromEntries(Object.entries(raw).filter(([, value]) => isSummary(value)));
}
function rowOf(file, summary, current) {
  const isFresh = summary !== undefined && summary.size === file.size && summary.mtimeMs === file.mtimeMs;
  const base = { id: file.id, at: file.mtimeMs, isCurrent: file.id === current };
  if (!isFresh)
    return { ...base, title: "", turns: null, edits: null, isCut: false };
  return { ...base, title: summary.title, turns: summary.turns, edits: summary.edits, isCut: summary.isCut };
}
async function filesIn(io) {
  const dir = io.where().dir;
  if (dir === "")
    return null;
  try {
    return await sessionFiles(io.archive, dir);
  } catch (error) {
    io.archive.log(`replay-theater: transcripts not listable (${why(error)})`);
    return null;
  }
}
async function summarize(io, file) {
  try {
    const session = await sessionOf(io.archive, file, io.where().dir);
    return { size: file.size, mtimeMs: file.mtimeMs, title: session.title, turns: session.prompts, edits: editCount(session), isCut: session.isCut };
  } catch (error) {
    io.archive.log(`replay-theater: ${file.path} not readable (${why(error)})`);
    return null;
  }
}
async function listSessions(io) {
  await io.sessions.set((current) => ({ ...current, status: "loading" }));
  const files = await filesIn(io);
  if (files === null) {
    await io.sessions.set(() => ({ status: "unavailable", rows: [], older: 0 }));
    return;
  }
  const current = io.where().current;
  const listed = files.slice(0, SESSIONS_MAX);
  const kept = await readKept(io);
  const isKnown = (file) => rowOf(file, kept[file.id], current).turns !== null;
  await io.sessions.set(() => ({ status: "ready", rows: listed.map((file) => rowOf(file, kept[file.id], current)), older: files.length - listed.length }));
  const fresh = {};
  for (const file of listed) {
    const summary = isKnown(file) ? kept[file.id] : await summarize(io, file);
    if (summary !== null)
      fresh[file.id] = summary;
    const row = summary === null ? { ...rowOf(file, undefined, current), isUnreadable: true } : rowOf(file, summary, current);
    if (!isKnown(file))
      await io.sessions.set((list) => ({ ...list, rows: list.rows.map((one) => one.id === file.id ? row : one) }));
  }
  await io.kept.set(fresh).catch((error) => io.archive.log(`replay-theater: session lines not kept (${why(error)})`));
}
async function readSession(io, id) {
  const file = (await filesIn(io))?.find((one) => one.id === id);
  if (file === undefined)
    return null;
  try {
    return await sessionOf(io.archive, file, io.where().dir);
  } catch (error) {
    io.archive.log(`replay-theater: session ${id} not readable (${why(error)})`);
    return null;
  }
}
async function loadTurns(io, id) {
  const isCurrent = id === io.where().current;
  await io.turns.set(() => ({ session: id, status: "loading", title: "", isCurrent, isCut: false, prompts: 0, rows: [] }));
  const session = await readSession(io, id);
  await io.turns.set((turns) => {
    if (turns?.session !== id)
      return turns;
    if (session === null)
      return { ...turns, status: "unavailable" };
    return { ...turns, status: "ready", title: session.title, isCut: session.isCut, prompts: session.prompts, rows: turnRows(session) };
  });
}
async function loadPast(io, ref) {
  const session = await readSession(io, ref.session);
  const turn = session?.turns.find((one) => one.n === ref.turn);
  if (session === null || turn === undefined)
    return false;
  const steps = await stepsOfTurn(turn, io.where().cwd);
  const origin = { session: ref.session, turn: ref.turn, title: session.title };
  await io.past.set(() => ({ id: `${ref.session}:${ref.turn}`, steps, explain: "done", quote: "", ask: turn.ask, at: turn.at, origin }));
  await io.index.set(() => 0);
  return true;
}

const LIST_PAGE = 8;
const PANE_ROWS_MAX = 30;

const BAND_RELEASE_MS = 200;
const PANE_ROWS_BASE = 12;
const LIST_ROWS_MAX = 8;
const DIFF_ROWS_MAX = 13;
const EMPTY_ROWS = 8;
function paneRows(steps) {
  const longest = Math.max(0, ...steps.map((step) => step.diff.length));
  return Math.min(PANE_ROWS_MAX, PANE_ROWS_BASE + Math.min(steps.length, LIST_ROWS_MAX) + Math.min(longest, DIFF_ROWS_MAX));
}
async function openReplay(io) {
  const replay = await io.replay.get();
  const steps = replay?.steps ?? [];
  const hasEdits = steps.length > 0;
  await io.browse.set(() => ({ mode: "replay", source: "live", shown: LIST_PAGE }));
  if (hasEdits)
    await io.index.set(() => 0);
  await io.view.set((view) => ({ ...view, isOpen: true, inBand: false }));
  await io.sleep(BAND_RELEASE_MS);
  const isPlaced = await io.open(hasEdits ? paneRows(steps) : EMPTY_ROWS);
  if (!isPlaced)
    await io.view.set((view) => ({ ...view, isOpen: hasEdits, inBand: hasEdits }));
  if (hasEdits && replay !== null)
    io.explain(replay.id);
  return { hasEdits, isPlaced };
}
async function bringReplay(io) {
  const view = await io.view.get();
  if (view.isOpen && !view.inBand)
    await io.open();
  else
    await openReplay(io);
}
async function openList(io, list) {
  await io.browse.set(() => ({ mode: list.mode, source: "live", shown: LIST_PAGE }));
  const reading = list.mode === "sessions" ? listSessions(io) : loadTurns(io, list.session ?? io.where().current);
  reading.catch((error) => io.archive.log(`replay-theater: reading failed (${why(error)})`));
  if ((await io.view.get()).isOpen)
    return;
  await io.view.set((view) => ({ ...view, isOpen: true, inBand: false }));
  await io.sleep(BAND_RELEASE_MS);
  if (!await io.open(PANE_ROWS_MAX))
    await io.view.set((view) => ({ ...view, inBand: true }));
}
async function watchTurn(io, turn) {
  const session = (await io.turns.get())?.session ?? io.where().current;
  if (await loadPast(io, { session, turn }))
    await io.browse.set((browse) => ({ ...browse, mode: "replay", source: "past" }));
}
async function closeReplay(io) {
  const view = await io.view.get();
  await io.view.set((current) => ({ ...current, isOpen: false, inBand: false }));
  if (!view.inBand)
    await io.close();
}
async function step(io, delta) {
  const browse = await io.browse.get();
  const replay = browse.source === "past" ? await io.past.get() : await io.replay.get();
  const total = replay?.steps.length ?? 0;
  await io.index.set((index) => Math.max(0, Math.min(index + delta, total - 1)));
}
async function turnsOfShown(io) {
  const browse = await io.browse.get();
  const past = browse.source === "past" ? await io.past.get() : null;
  await openList(io, { mode: "turns", session: past?.origin?.session ?? io.where().current });
}
function handlersOf(io, browse) {
  const turns = () => void turnsOfShown(io);
  const close = () => void closeReplay(io);
  return {
    onPrev: () => void step(io, -1),
    onNext: () => void step(io, 1),
    onFinish: browse.source === "past" ? turns : close,
    onTurns: turns,
    onSessions: () => void openList(io, { mode: "sessions" }),
    onThisSession: () => void openList(io, { mode: "turns", session: io.where().current }),
    onSession: (id) => void openList(io, { mode: "turns", session: id }),
    onTurn: (n) => void watchTurn(io, n),
    onMore: () => void io.browse.set((current) => ({ ...current, shown: current.shown + LIST_PAGE })),
    onClose: close
  };
}

const pendingAtom$1 = atom({ plugin: "replay-theater", key: "pending" }, []);
const planAtom$1 = atom({ plugin: "replay-theater", key: "plan" }, []);
const commandsAtom$1 = atom({ plugin: "replay-theater", key: "commands" }, 0);
async function readBefore($, path) {
  try {
    if (path !== undefined && await $.fs.exists(path))
      return { text: await $.fs.read(path), isNew: false };
  } catch (error) {
    $.ui.log(`replay-theater: ${path} not readable, shown as new (${why(error)})`, { to: "debug" });
  }
  return { text: "", isNew: true };
}
async function recordEdit($, call, run) {
  const { e, where } = call;
  let steps = [];
  try {
    steps = await stepsFor({ cwd: where.cwd, before: (path) => readBefore($, path) }, e);
  } catch (error) {
    $.ui.log(`replay-theater: could not read an edit (${why(error)})`, { to: "debug" });
  }
  const result = await run();
  if (steps.length === 0 || !isAnswered(result))
    return result;
  const plan = currentStep(await read($, planAtom$1)) ?? undefined;
  await update($, pendingAtom$1, (pending) => [...pending, ...steps.map((one) => plan === undefined ? one : { ...one, plan })]);
  return result;
}
async function trackPlan($, e, run) {
  const result = await run();
  if (!isAnswered(result) || e.tool === "TodoWrite" && e.agentId !== undefined)
    return result;
  await update($, planAtom$1, (items) => planAfter(items, e, result.result));
  return result;
}
async function countCommand($, e, run) {
  const result = await run();
  if (isAnswered(result) && isChangingCommand(String(e.command ?? "")))
    await update($, commandsAtom$1, (n) => n + 1);
  return result;
}
function hookEdits(on, where) {
  on("tool.call", async ($, e, next) => {
    const call = e;
    if (EDIT_TOOLS.has(call.tool))
      return recordEdit($, { e: call, where }, () => next(e));
    if (call.tool === "Bash")
      return countCommand($, call, () => next(e));
    if (PLAN_TOOLS.includes(call.tool))
      return trackPlan($, call, () => next(e));
    return next(e);
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
function withHome(ui, tree, onHome) {
  if (onHome === null)
    return tree;
  const { Box } = ui;
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, HomeButton(ui, onHome), tree);
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

const STEPS_SHOWN = 2;
const NAME_MAX$1 = 40;
const WRAPPERS = new Set(["sudo", "time", "command", "exec", "nohup", "env", "then", "do", "else", "if", "while", "until", "!"]);
const SILENT = new Set(["cd", "export", "set", "unset", "source", ".", "for", "done", "fi", "true", "false", ":", "[", "[[", "test", "local", "shift", "wait"]);
const FILTERS = new Set(["grep", "rg", "sed", "awk", "head", "tail", "sort", "uniq", "wc", "cut", "tr", "tee", "xargs", "jq", "column", "less", "cat"]);
const FETCHERS = new Set(["npx", "bunx", "uvx", "pipx"]);
const PASS_ON = new Set(["run", "run-script", "exec", "x", "dlx", "-m", "plugin"]);
const INLINE = new Set(["-c", "-e", "-"]);
const PROPER = /^(GitHub|Git\b|Docker|Claude|Flutter|JSON|Python|iOS|Mac)/;
const base = (path) => path.split("/").filter(Boolean).at(-1) ?? path;
const clip$1 = (text) => text.length > NAME_MAX$1 ? `${text.slice(0, NAME_MAX$1 - 1)}…` : text;
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
function wordsOf(command) {
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
  const { kept, out } = splitRedirects(wordsOf(command));
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
  const shown = unique.slice(0, STEPS_SHOWN).map((text, i) => i === 0 ? text : lowerFirst(text, lang));
  const more = unique.length - shown.length;
  return shown.join(textOf(SHELL.then, lang)) + (more > 0 ? say(SHELL.more, lang, String(more)) : "");
}

const NAME_MAX = 48;
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
const clip = (text) => text.length > NAME_MAX ? `${text.slice(0, NAME_MAX - 1)}…` : text;
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

const NARROW = "iljtf.,:;|!'` ()[]";
const WIDE = "mwMW@%";
const NARROW_EM = 0.3;
const WIDE_EM = 0.82;
const CAPITAL_EM = 0.64;
const LOWER_EM = 0.55;
const MONO_EM = 0.6;
const PX_PER_COLUMN = 7.6;
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
function fit(text, width, size) {
  if (measure(text, size) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 0 && measure(`${chars.join("")}…`, size) > width)
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
  return lines.map((part) => fit(part, box.width, box.size));
}
function widthFor(columns, range) {
  const fromCells = Math.floor((columns ?? 0) * PX_PER_COLUMN);
  return Math.max(range.min, Math.min(range.max, fromCells));
}

const DOT_RADIUS = 11;
const CHECK = { left: 4.4, low: 3.3, right: 4.6, rise: 3.4, dip: 1.2 };
const NUMBER_DROP = 4;
function check(cx, cy, stroke) {
  const path = `M${cx - CHECK.left} ${cy + 0.2}L${cx - CHECK.dip} ${cy + CHECK.low}L${cx + CHECK.right} ${cy - CHECK.rise}`;
  return `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function number(dot, cls) {
  return `<text x="${dot.cx}" y="${dot.cy + NUMBER_DROP}" text-anchor="middle" class="${cls}">${dot.n}</text>`;
}
function stepDot(dot) {
  const { cx, cy, state } = dot;
  const r = DOT_RADIUS;
  if (state === "current") {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--hi)"/>${number(dot, "dot-n on-hi")}`;
  }
  if (state === "done" && dot.tone === "moss") {
    return `<circle cx="${cx}" cy="${cy}" r="${r - 0.5}" fill="var(--ok-t)" stroke="var(--ok-l)"/>${check(cx, cy, "var(--ok)")}`;
  }
  if (state === "done")
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--track)"/>${check(cx, cy, "var(--mid)")}`;
  return `<circle cx="${cx}" cy="${cy}" r="${r - 0.75}" fill="none" stroke="var(--line2)" stroke-width="1.5"/>${number(dot, "dot-n lo")}`;
}
function stepRail(cx, fromCy, toCy) {
  const top = fromCy + DOT_RADIUS + 1.5;
  const bottom = toCy - DOT_RADIUS - 1.5;
  if (bottom <= top)
    return "";
  return `<line x1="${cx}" y1="${top}" x2="${cx}" y2="${bottom}" stroke="var(--line2)" stroke-width="1.5" stroke-linecap="round"/>`;
}
const DOT_CSS = ".dot-n{font-size:11px;font-weight:700}.on-hi{fill:var(--sheet)}";

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
  danger: { dark: { fg: "#F2727F", tint: "#3B2023", line: "#74343C" }, light: { fg: "#C0263A", tint: "#FCE8EA", line: "#F1B9C0" } }
};
function palette(isLight) {
  const mode = isLight ? "light" : "dark";
  return {
    ...isLight ? LIGHT : DARK,
    ok: ROLES.ok[mode],
    danger: ROLES.danger[mode],
    run: ROLES.run[mode]
  };
}
function themeOf(value) {
  const name = typeof value === "string" ? value.toLowerCase() : "";
  if (name.includes("light"))
    return "light";
  return name.includes("dark") ? "dark" : "auto";
}
function vars(p) {
  const tones = ["ok", "danger", "run"].map((role) => `--${role}:${p[role].fg};--${role}-t:${p[role].tint};--${role}-l:${p[role].line}`);
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
  ".group{font-size:12px;font-weight:600}",
  ".headline{font-size:17px;font-weight:620}",
  ".title{font-size:13px;font-weight:560}",
  ".label{font-size:12px;font-weight:500}",
  ".micro{font-size:10.5px;font-weight:500}",
  ".hi{fill:var(--hi)}.mid{fill:var(--mid)}.lo{fill:var(--lo)}",
  ".f-ok{fill:var(--ok)}.f-danger{fill:var(--danger)}.f-run{fill:var(--run)}"
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

const ROW = 32;
const ROWS_MAX = 8;
const HEAD_TOP = 78;
const ASK_LINE = 24;
const DOT_X = 16;
const NAME_X = 38;
const COUNT_SIZE = 11.5;
const NOTE_SIZE$1 = 13;
const NOTE_LINE = 18;
const NOTE_LINES_MAX$1 = 3;
const META_LINE = 17;
const PILL_H = 24;
const CSS = `${DOT_CSS}.row-on{fill:var(--track)}.shimmer{animation:sh 1.4s ease-in-out infinite}@keyframes sh{50%{opacity:.45}}`;
const baseName = (file) => file.split("/").pop() ?? file;
const folderOf = (file) => file.includes("/") ? file.slice(0, file.lastIndexOf("/")) : "";
function totals(steps) {
  const counts = steps.map((step) => countChanges(step.diff));
  return {
    add: counts.reduce((sum, c) => sum + c.add, 0),
    del: counts.reduce((sum, c) => sum + c.del, 0),
    files: new Set(steps.map((step) => step.file)).size
  };
}
function windowOf(total, current) {
  if (total <= ROWS_MAX)
    return { start: 0, end: total };
  const start = Math.max(0, Math.min(current - 2, total - ROWS_MAX));
  return { start, end: start + ROWS_MAX };
}
function counts(step, right, cy) {
  const { add, del } = countChanges(step.diff);
  const minus = `−${del}`;
  const plus = `+${add}`;
  const plusEnd = right - measure(minus, COUNT_SIZE, true) - 8;
  const svg = `<text x="${plusEnd}" y="${cy + 4}" text-anchor="end" class="mono micro f-ok">${plus}</text><text x="${right}" y="${cy + 4}" text-anchor="end" class="mono micro f-danger">${minus}</text>`;
  return { svg, width: right - plusEnd + measure(plus, COUNT_SIZE, true) };
}
function stateOf(k, index) {
  if (k === index)
    return "current";
  return k < index ? "done" : "next";
}
function row(model, k, cy) {
  const step = model.steps[k];
  const state = stateOf(k, model.index);
  const right = counts(step, model.width - 10, cy);
  const room = model.width - NAME_X - right.width - 14;
  const name = fit(baseName(step.file), room, 13);
  const nameCls = state === "current" ? "title hi" : "label mid";
  const folder = folderOf(step.file);
  const folderRoom = room - measure(name, 13) - 10;
  const dim = folder === "" || folderRoom < 24 ? "" : `<tspan dx="8" class="label lo">${escape(fit(folder, folderRoom, 12))}</tspan>`;
  const label = `<text x="${NAME_X}" y="${cy + 4.5}"><tspan class="${nameCls}">${escape(name)}</tspan>${dim}</text>`;
  return `${stepDot({ cx: DOT_X, cy, n: k + 1, state })}${label}${right.svg}`;
}
function headOf(model) {
  const sum = totals(model.steps);
  const age = model.age ?? "";
  const ask = model.ask ?? "";
  const askLine = ask === "" ? "" : `<text x="0" y="62" class="mid" font-size="12.5" font-style="italic">${escape(fit(`“${ask}”`, model.width, 12.5))}</text>`;
  const listTop = HEAD_TOP - (ask === "" ? ASK_LINE : 0);
  const w = words();
  const facts = [`${w.linesAdded(sum.add)}, ${w.removedCount(sum.del)}`, age].filter(Boolean).join(" · ");
  return {
    svg: [
      `<text x="0" y="20" class="headline hi">${escape(fit(w.editsInFiles(model.steps.length, sum.files), model.width, 17))}</text>`,
      `<text x="0" y="40" class="label lo">${escape(fit(facts, model.width, 12))}</text>`,
      askLine
    ],
    listTop
  };
}
function overviewSvg(model) {
  const head = headOf(model);
  const shown = windowOf(model.steps.length, model.index);
  const centers = Array.from({ length: shown.end - shown.start }, (_, n) => head.listTop + n * ROW + ROW / 2);
  const rails = centers.slice(1).map((cy, n) => stepRail(DOT_X, centers[n], cy));
  const rows = centers.map((cy, n) => row(model, shown.start + n, cy));
  const at = model.index - shown.start;
  const tint = at >= 0 && at < centers.length ? `<rect x="0" y="${centers[at] - 15}" width="${model.width}" height="30" rx="8" class="row-on"/>` : "";
  const more = moreLines(model.steps.length, shown, head.listTop + centers.length * ROW);
  const height = head.listTop + centers.length * ROW + more.height + 4;
  return { source: svgDoc({ width: model.width, height, theme: model.theme }, [...head.svg, tint, ...rails, ...rows, more.svg].join(""), CSS), height };
}
function moreLines(total, shown, top) {
  const w = words();
  const parts = [shown.start > 0 ? w.earlier(shown.start) : "", shown.end < total ? w.moreEdits(total - shown.end) : ""].filter(Boolean);
  if (parts.length === 0)
    return { svg: "", height: 0 };
  return { svg: `<text x="${NAME_X}" y="${top + 14}" class="micro lo">${parts.join(" · ")}</text>`, height: 20 };
}
function noteBlock(model, step, top) {
  if (step.said === undefined && model.explain !== "pending")
    return { svg: "", height: 0 };
  if (step.said === undefined) {
    const bar = `<rect x="12" y="${top + 4}" width="${Math.round(model.width * 0.55)}" height="10" rx="5" fill="var(--track)" class="shimmer"/>`;
    return { svg: `<rect x="0" y="${top}" width="2.5" height="18" rx="1.25" fill="var(--line2)"/>${bar}`, height: 18 + 12 };
  }
  const lines = wrap(step.said, { width: model.width - 14, size: NOTE_SIZE$1, maxLines: NOTE_LINES_MAX$1 });
  const text = lines.map((line, n) => `<text x="12" y="${top + 13 + n * NOTE_LINE}" class="mid" font-size="${NOTE_SIZE$1}">${escape(line)}</text>`);
  const height = lines.length * NOTE_LINE;
  return { svg: `<rect x="0" y="${top}" width="2.5" height="${height}" rx="1.25" fill="var(--line2)"/>${text.join("")}`, height: height + 12 };
}
function planPill(model, step, top) {
  if (step.plan === undefined)
    return { svg: "", height: 0 };
  const lead = words().planStep(step.plan.index, step.plan.total);
  const leadWidth = measure(lead, 11.5) + 4;
  const title = fit(step.plan.title, model.width - leadWidth - 54, 11.5);
  const width = Math.min(model.width, 30 + leadWidth + (title === "" ? 0 : measure(` · ${title}`, 11.5) + 6) + 12);
  const flag = `<path d="M13 ${top + 7}v11M13 ${top + 7.5}h7l-1.6 2.6 1.6 2.6h-7" fill="none" stroke="var(--mid)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  const label = `<text x="28" y="${top + 16}" font-size="11.5"><tspan class="hi" font-weight="600">${escape(lead)}</tspan>${title === "" ? "" : `<tspan class="mid"> · ${escape(title)}</tspan>`}</text>`;
  return { svg: `<rect x="0.5" y="${top + 0.5}" width="${width - 1}" height="${PILL_H - 1}" rx="${PILL_H / 2}" fill="var(--track)"/>${flag}${label}`, height: PILL_H + 12 };
}
const doingOf = (step) => plainCall(step.tool, { file_path: step.file, notebook_path: step.file }, lang());
function detailSvg(model) {
  const step = model.steps[model.index];
  const { add, del } = countChanges(step.diff);
  const meta = [doingOf(step), step.file, step.note, step.tool].filter(Boolean).join(" · ");
  const metaLines = wrap(meta, { width: model.width, size: 12, maxLines: 2 });
  const head = [
    `<text x="0" y="22" class="group lo">${escape(words().editNumber(model.index + 1, model.steps.length))}</text>`,
    `<text x="${model.width}" y="22" text-anchor="end" class="mono micro"><tspan class="f-ok">+${add}</tspan><tspan dx="6" class="f-danger">−${del}</tspan></text>`,
    `<text x="0" y="46" class="headline hi">${escape(fit(baseName(step.file), model.width, 17))}</text>`,
    ...metaLines.map((part, n) => `<text x="0" y="${66 + n * META_LINE}" class="label lo">${escape(part)}</text>`)
  ];
  const top = 80 + Math.max(0, metaLines.length - 1) * META_LINE;
  const note = noteBlock(model, step, top);
  const pill = planPill(model, step, top + note.height);
  const height = top + note.height + pill.height;
  return { source: svgDoc({ width: model.width, height, theme: model.theme }, [...head, note.svg, pill.svg].join(""), CSS), height };
}

function editFacts(steps) {
  const names = [...new Set(steps.map((step) => baseName(step.file)))];
  const fileCount = new Set(steps.map((step) => step.file)).size;
  return { title: words().editsAndFiles(steps.length, fileCount), files: names.join(" · ") };
}

const HUB_PANE = "replay";
function hubOf(replay) {
  if (replay === null || replay.steps.length === 0)
    return { detail: "", tone: "idle" };
  return { detail: editFacts(replay.steps).title, tone: "ok" };
}
function isOpenFor(value, pane) {
  return typeof value === "object" && value !== null && value.pane === pane;
}

function buttons(ui, model, on) {
  const { Box, Button } = ui;
  const isFirst = model.index === 0;
  const isLast = model.index >= model.steps.length - 1;
  const w = words();
  return h(Box, {
    key: "rt-buttons",
    flexDirection: "row",
    columnGap: 2,
    alignItems: "center"
  }, h(Button, {
    key: "rt-prev",
    variant: "secondary",
    hotkey: "p",
    label: w.prev,
    dimColor: isFirst,
    onPress: on.onPrev
  }), h(Button, {
    key: "rt-next",
    variant: "primary",
    hotkey: "n",
    label: isLast ? w.finish : w.next,
    autoFocus: true,
    onPress: isLast ? on.onFinish : on.onNext
  }), h(Button, {
    key: "rt-turns",
    variant: "secondary",
    hotkey: "t",
    label: w.turns,
    onPress: on.onTurns
  }), h(Box, {
    flexGrow: 1
  }), h(Button, {
    key: "rt-close",
    plain: true,
    dimColor: true,
    hotkey: "c",
    label: w.close,
    onPress: on.onClose
  }));
}

const MAX_DIFF_LINES = 12;
const CODE_SIZE = 12.5;
const CHAR = CODE_SIZE * MONO_EM;
const ROW_H$1 = 20;
const PAD_Y = 6;
const SIGN_X = 12;
const CODE_X = 28;
const LEGEND_GAP = 18;
const SWATCH = 11;
const TAB = "  ";
const CODE_PAD_RIGHT = 12;
const LINE_CHARS_MAX = 400;
const TINT = { "-": "var(--danger-t)", "+": "var(--ok-t)" };
const WORD = { "-": "var(--danger-l)", "+": "var(--ok-l)" };
const SIGN = { "-": "−", "+": "+" };
const SIGN_CLS = { "-": "f-danger", "+": "f-ok" };
function clipLine(text, maxChars) {
  const plain = text.replace(/\t/g, TAB);
  if (plain.length <= maxChars)
    return { shown: plain, isCut: false };
  return { shown: `${plain.slice(0, Math.max(1, maxChars - 1))}…`, isCut: true };
}
function wordRect(line, y, maxChars) {
  if (line.span === undefined)
    return "";
  const start = Math.min(line.span.start, maxChars);
  const end = Math.min(line.span.end, maxChars);
  if (end <= start)
    return "";
  return `<rect x="${CODE_X + start * CHAR - 1}" y="${y + 2}" width="${(end - start) * CHAR + 2}" height="${ROW_H$1 - 4}" rx="3" fill="${WORD[line.op]}"/>`;
}
function diffRow$1(line, y, inner) {
  if (line.op === "~")
    return `<text x="${CODE_X}" y="${y + 14}" class="lo micro">⋯</text>`;
  const { shown } = clipLine(line.t, inner.maxChars);
  const code = `<text x="${CODE_X}" y="${y + 14.5}" class="mono ${line.op === " " ? "lo" : "hi"}" font-size="${CODE_SIZE}" xml:space="preserve">${escape(shown)}</text>`;
  if (line.op === " ")
    return code;
  const tint = `<rect x="1" y="${y}" width="${inner.width - 2}" height="${ROW_H$1}" fill="${TINT[line.op]}"/>`;
  const sign = `<text x="${SIGN_X}" y="${y + 14.5}" class="mono ${SIGN_CLS[line.op]}" font-size="${CODE_SIZE}">${SIGN[line.op]}</text>`;
  return `${tint}${wordRect(line, y, inner.maxChars)}${sign}${code}`;
}
const SWATCHES = [
  { label: (w) => w.removed, svg: (x, y) => `<rect x="${x + 0.5}" y="${y + 0.5}" width="${SWATCH - 1}" height="${SWATCH - 1}" rx="2.5" fill="var(--danger-t)" stroke="var(--danger-l)"/>` },
  { label: (w) => w.added, svg: (x, y) => `<rect x="${x + 0.5}" y="${y + 0.5}" width="${SWATCH - 1}" height="${SWATCH - 1}" rx="2.5" fill="var(--ok-t)" stroke="var(--ok-l)"/>` },
  {
    label: (w) => w.changedWord,
    svg: (x, y) => `<rect x="${x}" y="${y}" width="${SWATCH / 2}" height="${SWATCH}" fill="var(--danger-l)"/><rect x="${x + SWATCH / 2}" y="${y}" width="${SWATCH / 2}" height="${SWATCH}" fill="var(--ok-l)"/>`
  },
  { label: (w) => w.unchanged, svg: (x, y) => `<rect x="${x + 0.5}" y="${y + 0.5}" width="${SWATCH - 1}" height="${SWATCH - 1}" rx="2.5" fill="none" stroke="var(--line2)"/>` }
];
function legend(width, top) {
  let x = 0;
  let y = top;
  const w = words();
  const parts = SWATCHES.map((item) => {
    const label = item.label(w);
    const itemWidth = SWATCH + 6 + measure(label, 11.5);
    if (x > 0 && x + itemWidth > width) {
      x = 0;
      y += LEGEND_GAP;
    }
    const svg = `${item.svg(x, y)}<text x="${x + SWATCH + 6}" y="${y + 9.5}" class="lo" font-size="11.5">${escape(label)}</text>`;
    x += itemWidth + 16;
    return svg;
  });
  return { svg: parts.join(""), height: y - top + SWATCH };
}
const charsOf = (line) => line.op === "~" ? 0 : line.t.replace(/\t/g, TAB).length;
function noteOf$1(shownCount, hidden) {
  const w = words();
  if (shownCount === 0)
    return `${upper(w.noLineChanges.slice(0, 1))}${w.noLineChanges.slice(1)}.`;
  return hidden > 0 ? w.moreLines(hidden) : "";
}
function diffSvg(model) {
  const shown = model.lines.slice(0, MAX_DIFF_LINES);
  const hidden = model.lines.length - shown.length;
  const extra = hidden > 0 || shown.length === 0 ? 1 : 0;
  const boxH = PAD_Y * 2 + (shown.length + extra) * ROW_H$1;
  const longest = Math.min(LINE_CHARS_MAX, Math.max(0, ...shown.map(charsOf)));
  const contentWidth = Math.max(model.width, Math.ceil(CODE_X + longest * CHAR + CODE_PAD_RIGHT));
  const inner = { width: contentWidth, maxChars: Math.floor((contentWidth - CODE_X - CODE_PAD_RIGHT) / CHAR) };
  const rows = shown.map((line, n) => diffRow$1(line, PAD_Y + n * ROW_H$1, inner));
  const tail = PAD_Y + shown.length * ROW_H$1 + 14;
  const note = noteOf$1(shown.length, hidden);
  const noteSvg = note === "" ? "" : `<text x="${CODE_X}" y="${tail}" class="lo" font-size="11.5">${note}</text>`;
  const box = `<rect x="0.5" y="0.5" width="${contentWidth - 1}" height="${boxH - 1}" rx="8" fill="var(--inset)" stroke="var(--line)"/>`;
  const key = legend(model.width, boxH + 14);
  const height = boxH + 14 + key.height + 2;
  const body = `${box}<g>${rows.join("")}</g>${noteSvg}${key.svg}`;
  return { source: svgDoc({ width: contentWidth, height, theme: model.theme }, body), height, hidden, contentWidth };
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

const BAND_CHROME_ROWS = 7;
const MIN_DIFF_ROWS = 3;
const ROW_BG = { "-": "diffRemoved", "+": "diffAdded" };
const WORD_BG = { "-": "diffRemovedWord", "+": "diffAddedWord" };
function glyphOf(k, index) {
  if (k === index)
    return { glyph: "●" };
  return k < index ? { glyph: "✓", color: "subtle" } : { glyph: "○" };
}
function stepRow(ui, step, at) {
  const { Box, Text } = ui;
  const { add, del } = countChanges(step.diff);
  const look = glyphOf(at.k, at.index);
  const isCurrent = at.k === at.index;
  return h(Box, {
    key: `rt-row-${at.k}`,
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    color: look.color,
    bold: isCurrent,
    dimColor: look.color === undefined && !isCurrent
  }, look.glyph), h(Box, {
    flexShrink: 1
  }, h(Text, {
    bold: isCurrent,
    dimColor: at.k < at.index,
    wrap: "truncate-end"
  }, `${at.k + 1}. ${baseName(step.file)}`)), folderOf(step.file) !== "" && h(Text, {
    dimColor: true,
    wrap: "truncate-start"
  }, folderOf(step.file)), h(Box, {
    flexGrow: 1
  }), h(Text, {
    color: "success"
  }, `+${add}`), h(Text, {
    color: "error"
  }, `−${del}`));
}
function diffRow(ui, line, key) {
  const { Text } = ui;
  if (line.op === "~" || line.op === " ")
    return h(Text, {
      key,
      dimColor: true,
      wrap: "truncate-end"
    }, `  ${line.op === "~" ? "⋯" : line.t}`);
  const sign = line.op === "-" ? "−" : "+";
  const span = line.span;
  const parts = span === undefined ? [line.t] : [line.t.slice(0, span.start), line.t.slice(span.start, span.end), line.t.slice(span.end)];
  return h(Text, {
    key,
    backgroundColor: ROW_BG[line.op],
    wrap: "truncate-end"
  }, `${sign} ${parts[0]}`, parts.length > 1 && h(Text, {
    backgroundColor: WORD_BG[line.op]
  }, parts[1]), parts.length > 1 && parts[2]);
}
function contextRows(ui, step, isPending) {
  const { Text } = ui;
  const w = words();
  const rows = [];
  if (step.said !== undefined)
    rows.push(h(Text, {
      key: "rt-said",
      wrap: "wrap"
    }, `› ${step.said}`));
  else if (isPending)
    rows.push(h(Text, {
      key: "rt-said",
      dimColor: true
    }, `◐ ${w.explaining}`));
  if (step.plan !== undefined) {
    rows.push(h(Text, {
      key: "rt-plan",
      wrap: "truncate-end"
    }, h(Text, {
      bold: true
    }, `◆ ${w.planStep(step.plan.index, step.plan.total)}`), h(Text, {
      dimColor: true
    }, ` · ${step.plan.title}`)));
  }
  return rows;
}
function header(ui, model) {
  const { Box, Text } = ui;
  const sum = totals(model.steps);
  const ask = model.ask ?? "";
  return h(Box, {
    key: "rt-head",
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    bold: true
  }, words().editsInFiles(model.steps.length, sum.files)), (model.age ?? "") !== "" && h(Text, {
    dimColor: true
  }, `· ${model.age}`), h(Box, {
    flexGrow: 1
  }), h(Text, {
    color: "success"
  }, `+${sum.add}`), h(Text, {
    color: "error"
  }, `−${sum.del}`)), ask !== "" && h(Text, {
    dimColor: true,
    italic: true,
    wrap: "truncate-end"
  }, `“${ask}”`));
}
function terminalView(ui, model, site) {
  const { Box, Text } = ui;
  const step = model.steps[model.index];
  const shown = windowOf(model.steps.length, model.index);
  const maxDiff = site.isCompact ? Math.max(MIN_DIFF_ROWS, Math.min(MAX_DIFF_LINES, site.maxRows - BAND_CHROME_ROWS)) : MAX_DIFF_LINES;
  const lines = step.diff.slice(0, maxDiff);
  const w = words();
  const meta = [doingOf(step), folderOf(step.file) || w.projectRoot, step.note, step.tool].filter(Boolean).join(" · ");
  return h(Box, {
    key: "rt-pane",
    flexDirection: "column",
    paddingX: 1
  }, !site.isCompact && header(ui, model), !site.isCompact && model.steps.slice(shown.start, shown.end).map((one, n) => stepRow(ui, one, { k: shown.start + n, index: model.index })), h(Box, {
    key: "rt-label",
    marginTop: site.isCompact ? 0 : 1
  }, h(Text, {
    bold: true,
    dimColor: true
  }, w.editNumber(model.index + 1, model.steps.length))), h(Box, {
    key: "rt-file",
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    bold: true
  }, baseName(step.file)), h(Text, {
    dimColor: true,
    wrap: "truncate-end"
  }, meta)), contextRows(ui, step, model.explain === "pending"), h(Box, {
    key: "rt-diff",
    flexDirection: "column"
  }, lines.map((line, n) => diffRow(ui, line, `rt-d${n}`)), step.diff.length > maxDiff && h(Text, {
    key: "rt-more",
    dimColor: true
  }, `  ${w.moreLines(step.diff.length - maxDiff)}`), step.diff.length === 0 && h(Text, {
    key: "rt-empty",
    dimColor: true
  }, `  (${w.noLineChanges})`)), buttons(ui, model, site.on));
}

const PANE_GUTTER_COLUMNS = 3;
const SCROLLBAR_ROOM = 12;
const emptyText = () => `${words().emptyLead}. ${words().emptyRest}`;
const EMPTY_LEAD_Y = 20;
const EMPTY_LINE_H = 19;
const EMPTY_REST_SIZE = 13;
function altOf(model) {
  const sum = totals(model.steps);
  const step = model.steps[model.index];
  const w = words();
  return `${w.editsInFiles(model.steps.length, sum.files)}; ${w.nowOn(model.index + 1, step === undefined ? "" : baseName(step.file))}`;
}
const motion = paneMotion();
function stepKey(steps, index) {
  const step = steps[index];
  if (step === undefined)
    return "none";
  if (step.toolUseId !== undefined)
    return step.toolUseId;
  const before = steps.slice(0, index).filter((other) => other.file === step.file).length;
  return `${step.file}#${before}`;
}
function desktopView(ui, model, on) {
  const { Box, Svg } = ui;
  const overview = overviewSvg(model);
  const detail = detailSvg(model);
  const step = model.steps[model.index];
  const id = stepKey(model.steps, model.index);
  const diff = diffSvg({ lines: step?.diff ?? [], width: model.width, theme: model.theme });
  const isWide = diff.contentWidth > model.width;
  const diffHeight = isWide ? diff.height + SCROLLBAR_ROOM : diff.height;
  const { age, ...shown } = model;
  const overviewPic = motion.pic("rt-overview", { source: overview.source, alt: altOf(model), width: model.width, height: overview.height }, { shows: { ...shown, isAged: (age ?? "") !== "" } });
  const detailPic = motion.pic(`rt-detail-${id}`, { source: detail.source, alt: step?.said ?? (step === undefined ? "" : step.file), width: model.width, height: detail.height });
  const diffPic = motion.pic(`rt-diff-${id}`, { source: diff.source, alt: words().diffAlt, width: model.width, height: diffHeight });
  return h(Box, {
    key: "rt-pane",
    flexDirection: "column",
    gap: 1,
    paddingX: 1,
    paddingY: 1
  }, h(Svg, {
    key: "rt-overview",
    ...overviewPic
  }), h(Svg, {
    key: `rt-detail-${id}`,
    ...detailPic
  }), h(Svg, {
    key: `rt-diff-${id}`,
    ...diffPic
  }), buttons(ui, model, on));
}
function emptySvg(width, theme) {
  const w = words();
  const rest = wrap(w.emptyRest, { width, size: EMPTY_REST_SIZE, maxLines: 2 });
  const lead = `<text x="0" y="${EMPTY_LEAD_Y}" class="headline hi">${escape(w.emptyLead)}</text>`;
  const lines = rest.map((part, n) => `<text x="0" y="${EMPTY_LEAD_Y + (n + 1) * EMPTY_LINE_H + 2}" class="mid" font-size="${EMPTY_REST_SIZE}">${escape(part)}</text>`);
  const height = EMPTY_LEAD_Y + rest.length * EMPTY_LINE_H + 10;
  const body = `${lead}${lines.join("")}`;
  return { source: svgDoc({ width, height, theme }, body), height };
}
function emptyView(ui, spec) {
  const { Box, Text, Button, Svg } = ui;
  const w = words();
  const close = h(Button, {
    key: "rt-close",
    plain: true,
    dimColor: true,
    hotkey: "c",
    label: w.close,
    onPress: spec.on.onClose
  });
  const sessions = h(Button, {
    key: "rt-sessions",
    variant: "secondary",
    hotkey: "s",
    label: w.pastSessions,
    onPress: spec.on.onSessions
  });
  const actions = h(Box, {
    flexDirection: "row",
    columnGap: 2
  }, sessions, h(Box, {
    flexGrow: 1
  }), close);
  if (spec.surface === "terminal" || !("Svg" in ui)) {
    return h(Box, {
      key: "rt-empty",
      flexDirection: "column",
      gap: 1,
      paddingX: 1
    }, h(Text, {
      bold: true,
      dimColor: true
    }, w.title), h(Text, {
      bold: true
    }, w.emptyLead), h(Text, {
      dimColor: true
    }, w.emptyRest), actions);
  }
  const drawn = emptySvg(spec.width, spec.theme);
  return h(Box, {
    key: "rt-empty",
    flexDirection: "column",
    gap: 1,
    paddingX: 1,
    paddingY: 1
  }, h(Svg, {
    key: "rt-empty-svg",
    ...motion.pic("rt-empty-svg", { source: drawn.source, alt: emptyText(), width: spec.width, height: drawn.height })
  }), actions);
}
const paneWidth = (columns) => widthFor(columns - PANE_GUTTER_COLUMNS, { min: 280, max: 720 });
function replayView(ui, model, site) {
  const view = stepsView(ui, model, site);
  const count = model.byCommands ?? 0;
  if (count === 0)
    return view;
  const { Box, Text } = ui;
  return h(Box, {
    key: "rt-with-commands",
    flexDirection: "column",
    gap: 1
  }, h(Box, {
    key: "rt-commands",
    paddingX: 1
  }, h(Text, {
    color: "warning",
    wrap: "wrap"
  }, words().byCommands(count))), view);
}
function stepsView(ui, model, site) {
  const width = paneWidth(site.columns);
  if (model.steps.length === 0)
    return emptyView(ui, { surface: site.surface, width, theme: model.theme, on: site.on });
  const index = Math.max(0, Math.min(model.index, model.steps.length - 1));
  const full = { ...model, index, width };
  if (site.surface === "terminal" || site.inBand || !("Svg" in ui)) {
    return terminalView(ui, full, { isCompact: site.inBand, maxRows: site.maxRows, on: site.on });
  }
  return desktopView(ui, full, site.on);
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
function isOffStage(value, pane) {
  const staged = paneOf(value);
  return staged !== null && staged !== pane;
}
const shownOf = (pane, at) => ({ pane, at });

const MINUTE_MS = 60000;
const HOUR_MINUTES = 60;
const DAY_HOURS = 24;
function ageText(at, now) {
  if (at === undefined || !Number.isFinite(at) || now < at)
    return "";
  const minutes = Math.floor((now - at) / MINUTE_MS);
  const w = words();
  if (minutes < 1)
    return w.justNow;
  if (minutes < HOUR_MINUTES)
    return w.minutesAgo(minutes);
  const hours = Math.floor(minutes / HOUR_MINUTES);
  return hours < DAY_HOURS ? w.hoursAgo(hours) : w.daysAgo(Math.floor(hours / DAY_HOURS));
}
const twoDigits = (n) => String(n).padStart(2, "0");
function dateText(at) {
  if (!Number.isFinite(at) || at <= 0)
    return "";
  const day = new Date(at);
  const w = words();
  return w.date(w.months[day.getMonth()] ?? "", day.getDate(), `${twoDigits(day.getHours())}:${twoDigits(day.getMinutes())}`);
}

const ROW_H = 48;
const ROW_X = 12;
const CHEVRON_ROOM = 28;
const TITLE_SIZE = 13;
const META_SIZE = 12;
const LINE_H = 18;
const NOTE_SIZE = 13;
const NOTE_LINES_MAX = 3;
const CHEVRON_CSS = ".chev{transition:transform .16s cubic-bezier(.2,.8,.2,1)}svg:hover .chev{transform:translateX(2px)}";
function headSvg(head) {
  const metaWidth = head.meta === "" ? 0 : measure(head.meta, META_SIZE) + 12;
  const quote = head.quote === undefined || head.quote === "" ? "" : `<text x="0" y="42" class="mid" font-size="12.5" font-style="italic">${escape(fit(`“${head.quote}”`, head.width, 12.5))}</text>`;
  const top = quote === "" ? 40 : 62;
  const lines = head.lines.map((line, n) => `<text x="0" y="${top + n * LINE_H}" class="label lo">${escape(fit(line, head.width, META_SIZE))}</text>`);
  const body = [
    `<text x="0" y="20" class="headline hi">${escape(fit(head.title, head.width - metaWidth, 17))}</text>`,
    head.meta === "" ? "" : `<text x="${head.width}" y="20" text-anchor="end" class="label lo">${escape(head.meta)}</text>`,
    quote,
    ...lines
  ];
  const last = head.lines.length > 0 ? top + (head.lines.length - 1) * LINE_H : top - LINE_H - 2;
  const height = last + 8;
  return { source: svgDoc({ width: head.width, height, theme: head.theme }, body.join("")), height, alt: [head.title, head.quote ?? "", ...head.lines].filter(Boolean).join(". ") };
}
function noteSvg(note) {
  const rest = wrap(note.rest, { width: note.width, size: NOTE_SIZE, maxLines: NOTE_LINES_MAX });
  const lead = `<text x="0" y="16" class="title hi">${escape(fit(note.lead, note.width, TITLE_SIZE))}</text>`;
  const lines = rest.map((part, n) => `<text x="0" y="${16 + (n + 1) * LINE_H}" class="mid" font-size="${NOTE_SIZE}">${escape(part)}</text>`);
  const height = 22 + rest.length * LINE_H;
  return { source: svgDoc({ width: note.width, height, theme: note.theme }, lead + lines.join("")), height, alt: [note.lead, note.rest].filter(Boolean).join(". ") };
}
const chevron = (x, y) => `<g class="chev"><path d="M${x} ${y - 4.5}l4.5 4.5-4.5 4.5" fill="none" stroke="var(--lo)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
function rowSvg(spec) {
  const tag = spec.tag === undefined ? "" : `<tspan class="mid" font-weight="600">${escape(spec.tag)}</tspan><tspan class="lo"> · </tspan>`;
  const tagWidth = spec.tag === undefined ? 0 : measure(`${spec.tag} · `, META_SIZE);
  const room = spec.width - ROW_X - (spec.isPressable ? CHEVRON_ROOM : ROW_X);
  const title = `<text x="${ROW_X}" y="21" class="title hi">${escape(fit(spec.title, room, TITLE_SIZE))}</text>`;
  const meta = `<text x="${ROW_X}" y="37" class="label">${tag}<tspan class="lo">${escape(fit(spec.meta, room - tagWidth, META_SIZE))}</tspan></text>`;
  const body = `${title}${meta}${spec.isPressable ? chevron(spec.width - 18, ROW_H / 2) : ""}`;
  return svgDoc({ width: spec.width, height: ROW_H, theme: spec.theme }, body, spec.isPressable ? CHEVRON_CSS : "");
}
const turnTitle = (row) => row.ask === "" ? words().untitled : `“${row.ask}”`;
const turnMeta = (row, now) => [words().turnN(row.n), words().editsAndFiles(row.edits, row.files), ageText(row.at, now)].filter(Boolean).join(" · ");
function turnRowSvg(row, look) {
  const title = turnTitle(row);
  const meta = turnMeta(row, look.now);
  return { source: rowSvg({ width: look.width, theme: look.theme, title, meta, isPressable: true }), height: ROW_H, alt: `${title}. ${meta}` };
}
function sessionFacts(row) {
  const w = words();
  if (row.isUnreadable === true)
    return w.unreadable;
  if (row.turns === null || row.edits === null)
    return w.reading;
  const facts = row.edits === 0 ? `${w.turnCount(row.turns)} · ${w.noEdits}` : w.turnsAndEdits(row.turns, row.edits);
  return row.isCut ? `${facts} · ${w.cut}` : facts;
}
function sessionRowSvg(row, look) {
  const w = words();
  const title = row.title === "" ? w.untitled : row.title;
  const meta = [dateText(row.at), sessionFacts(row)].filter(Boolean).join(" · ");
  const tag = row.isCurrent ? w.thisSession : undefined;
  const source = rowSvg({ ...look, title, meta, ...tag === undefined ? {} : { tag } });
  return { source, height: ROW_H, alt: [tag, title, meta].filter(Boolean).join(". ") };
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

const HOTKEYS = 9;
const COMPACT_CHROME_ROWS = 4;
const isDesktop = (ui, site) => site.surface !== "terminal" && !site.isCompact && ("Svg" in ui);
function noteOf(status, notes) {
  const w = words();
  if (status === "loading")
    return { lead: notes.loading, rest: "" };
  if (status === "unavailable")
    return { lead: w.unavailableLead, rest: w.unavailableRest };
  return notes.isEmpty ? notes.empty : null;
}
function turnsBody(turns, view) {
  const w = words();
  const look = { width: view.site.width, theme: view.site.theme, now: view.now };
  const rows = turns.rows.slice(0, view.shown).map((row) => {
    const drawing = () => turnRowSvg(row, look);
    const text = { title: turnTitle(row), meta: turnMeta(row, view.now) };
    const { now, ...still } = look;
    return { key: `rt-turn-${row.n}`, drawing, shows: { row, look: still }, text, button: { label: w.watchTurn, onPress: () => view.site.on.onTurn(row.n) } };
  });
  const edits = turns.rows.reduce((sum, row) => sum + row.edits, 0);
  const facts = [turns.status === "ready" ? w.turnsAndEdits(turns.prompts, edits) : "", turns.isCut ? w.cut : ""].filter(Boolean);
  const head = { width: view.site.width, theme: view.site.theme, title: w.turnsTitle, meta: turns.isCurrent ? w.thisSession : "", quote: turns.title, lines: facts };
  const note = noteOf(turns.status, { loading: w.reading, empty: { lead: w.noTurnsLead, rest: w.noTurnsRest }, isEmpty: turns.rows.length === 0 });
  const other = { key: "rt-sessions", label: w.pastSessions, hotkey: "s", onPress: view.site.on.onSessions };
  return { head, note, rows, more: Math.max(0, turns.rows.length - view.shown), other };
}
function sessionsBody(sessions, view) {
  const w = words();
  const look = { width: view.site.width, theme: view.site.theme };
  const rows = sessions.rows.slice(0, view.shown).map((row) => {
    const hasEdits = row.edits === null || row.edits > 0;
    const drawing = () => sessionRowSvg(row, { ...look, isPressable: hasEdits });
    const button = hasEdits ? { label: w.openSession, onPress: () => view.site.on.onSession(row.id) } : null;
    const meta = [row.isCurrent ? w.thisSession : "", dateText(row.at), sessionFacts(row)].filter(Boolean).join(" · ");
    return { key: `rt-session-${row.id}`, drawing, text: { title: row.title === "" ? w.untitled : row.title, meta }, button };
  });
  const lines = [w.sessionsSub(sessions.rows.length + sessions.older), sessions.older > 0 ? w.older(sessions.older) : ""].filter(Boolean);
  const head = { width: view.site.width, theme: view.site.theme, title: w.sessionsTitle, meta: "", lines };
  const note = noteOf(sessions.status, { loading: w.readingSessions, empty: { lead: w.unavailableLead, rest: "" }, isEmpty: sessions.rows.length === 0 });
  const other = { key: "rt-this-session", label: w.thisSession, hotkey: "t", onPress: view.site.on.onThisSession };
  return { head, note, rows, more: Math.max(0, sessions.rows.length - view.shown), other };
}
function bottomRow(ui, body, on) {
  const { Box, Button } = ui;
  const w = words();
  return h(Box, {
    key: "rt-list-buttons",
    flexDirection: "row",
    columnGap: 2,
    alignItems: "center"
  }, h(Button, {
    key: body.other.key,
    variant: "secondary",
    hotkey: body.other.hotkey,
    label: body.other.label,
    onPress: body.other.onPress
  }), body.more > 0 && h(Button, {
    key: "rt-more",
    plain: true,
    dimColor: true,
    hotkey: "m",
    label: `${w.more} (${body.more})`,
    onPress: on.onMore
  }), h(Box, {
    flexGrow: 1
  }), h(Button, {
    key: "rt-close",
    plain: true,
    dimColor: true,
    hotkey: "c",
    label: w.close,
    onPress: on.onClose
  }));
}
const hotkeyOf = (k) => k < HOTKEYS ? { hotkey: String(k + 1) } : {};
function desktopRow(ui, row, at) {
  const { Box } = ui;
  const isPressable = row.button !== null;
  const drawing = at.draw(row.drawing(), `${row.key}-svg`, { isRow: isPressable, shows: row.shows });
  if (row.button === null)
    return h(Box, {
      key: row.key,
      alignSelf: "flex-start"
    }, drawing);
  return PressRow(ui, { box: row.key, key: `${row.key}-open`, onPress: row.button.onPress, drawing });
}
function desktopList(ui, body, site) {
  const { Box, Svg } = ui;
  const draw = (drawing, key, opts = {}) => {
    const { width = site.width, ...moves } = opts;
    return h(Svg, {
      key,
      ...motion.pic(key, { source: drawing.source, alt: drawing.alt, width, height: drawing.height }, moves)
    });
  };
  const head = headSvg(body.head);
  const note = body.note === null ? null : noteSvg({ width: site.width, theme: site.theme, ...body.note });
  return h(Box, {
    key: "rt-list",
    flexDirection: "column",
    gap: 1,
    paddingX: 1,
    paddingY: 1
  }, draw(head, "rt-list-head"), note !== null && draw(note, "rt-list-note"), body.rows.length > 0 && h(Box, {
    key: "rt-list-rows",
    flexDirection: "column"
  }, body.rows.map((row) => desktopRow(ui, row, { draw }))), bottomRow(ui, body, site.on));
}
function terminalRow(ui, row, k) {
  const { Box, Text, Button } = ui;
  return h(Box, {
    key: row.key,
    flexDirection: "row",
    columnGap: 1
  }, h(Box, {
    flexShrink: 1
  }, h(Text, {
    bold: true,
    wrap: "truncate-end"
  }, row.text.title)), h(Text, {
    dimColor: true,
    wrap: "truncate-end"
  }, row.text.meta), h(Box, {
    flexGrow: 1
  }), row.button !== null && h(Button, {
    key: `${row.key}-open`,
    variant: "secondary",
    label: row.button.label,
    onPress: row.button.onPress,
    ...hotkeyOf(k)
  }));
}
function terminalList(ui, body, site) {
  const { Box, Text } = ui;
  const rows = site.isCompact ? body.rows.slice(0, Math.max(1, site.maxRows - COMPACT_CHROME_ROWS)) : body.rows;
  const facts = [body.head.quote === undefined || body.head.quote === "" ? "" : `“${body.head.quote}”`, ...body.head.lines].filter(Boolean).join(" · ");
  return h(Box, {
    key: "rt-list",
    flexDirection: "column",
    paddingX: 1
  }, h(Box, {
    key: "rt-list-title",
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    bold: true,
    dimColor: true
  }, body.head.title), body.head.meta !== "" && h(Text, {
    dimColor: true
  }, `· ${body.head.meta}`)), facts !== "" && h(Text, {
    key: "rt-list-facts",
    dimColor: true,
    wrap: "truncate-end"
  }, facts), body.note !== null && h(Text, {
    key: "rt-list-lead",
    bold: true
  }, body.note.lead), body.note !== null && body.note.rest !== "" && h(Text, {
    key: "rt-list-rest",
    dimColor: true
  }, body.note.rest), rows.map((row, k) => terminalRow(ui, row, k)), bottomRow(ui, body, site.on));
}
function listView(ui, body, site) {
  return isDesktop(ui, site) ? desktopList(ui, body, site) : terminalList(ui, body, site);
}
function turnsView(ui, turns, view) {
  return listView(ui, turnsBody(turns, view), view.site);
}
function sessionsView(ui, sessions, view) {
  return listView(ui, sessionsBody(sessions, view), view.site);
}

const NO_TURNS = { session: "", status: "loading", title: "", isCurrent: true, isCut: false, prompts: 0, rows: [] };
function ageOf(replay, now) {
  const age = ageText(replay?.at, now);
  if (replay?.origin === undefined)
    return age;
  return [words().turnN(replay.origin.turn), age].filter(Boolean).join(" · ");
}
function bodyView(ui, snap, view) {
  const { site, on } = view;
  const { browse, now } = snap;
  const theme = snap.view.theme;
  if (browse.mode !== "replay") {
    const listSite = { surface: site.surface, width: paneWidth(site.columns), theme, isCompact: site.inBand, maxRows: site.maxRows, on };
    if (browse.mode === "sessions")
      return sessionsView(ui, snap.sessions, { shown: browse.shown, site: listSite });
    return turnsView(ui, snap.turns ?? NO_TURNS, { shown: browse.shown, now, site: listSite });
  }
  const replay = browse.source === "past" ? snap.past : snap.replay;
  const model = { steps: replay?.steps ?? [], index: snap.index, explain: replay?.explain ?? "none", theme, ask: replay?.ask ?? "", age: ageOf(replay, now), byCommands: replay?.byCommands ?? 0 };
  return replayView(ui, model, { ...site, on });
}

const pendingAtom = atom({ plugin: "replay-theater", key: "pending" }, []);
const replayAtom = atom({ plugin: "replay-theater", key: "replay" }, null);
const indexAtom = atom({ plugin: "replay-theater", key: "index" }, 0);
const commandsAtom = atom({ plugin: "replay-theater", key: "commands" }, 0);
const viewAtom = atom({ plugin: "replay-theater", key: "view" }, { isOpen: false, inBand: false, theme: "auto" });
const planAtom = atom({ plugin: "replay-theater", key: "plan" }, []);
const browseAtom = atom({ plugin: "replay-theater", key: "browse" }, { mode: "replay", source: "live", shown: LIST_PAGE });
const sessionsAtom = atom({ plugin: "replay-theater", key: "sessions" }, { status: "loading", rows: [], older: 0 });
const turnsAtom = atom({ plugin: "replay-theater", key: "turns" }, null);
const pastAtom = atom({ plugin: "replay-theater", key: "past" }, null);
const PANE_ID = "replay-theater";
const HUB = { plugin: "replay-theater", key: "hub" };
const HOME = { plugin: "replay-theater", key: "home" };
const KEPT_KEY = "sessions";
const PANE_COLUMNS = 64;
const flags = { cwd: "", ask: "", transcript: "" };
const kept = new Map;
function explainIo($) {
  return {
    replay: () => read($, replayAtom),
    change: (id, change) => update($, replayAtom, (replay) => replay !== null && replay.id === id ? change(replay) : replay),
    messages: (agentId) => $.session.messages(agentId === undefined ? {} : { agentId }),
    complete: (request) => $.model.complete(request),
    log: (line) => $.ui.log(line, { to: "debug" })
  };
}
function archiveIo($) {
  return { list: (dir) => $.fs.list(dir), read: (path) => $.fs.read(path), pieces: (argv) => stdoutOf($.process.spawn({ argv })), log: (line) => $.ui.log(line, { to: "debug" }), kept };
}
async function reportShown($) {
  try {
    if ((await $.state.get({ plugin: "modz", key: "isOn" })).value !== true)
      return;
    await $.state.set({ plugin: "replay-theater", key: "shown" }, shownOf(HUB_PANE, await $.clock.now()));
  } catch (error) {
    $.ui.log(`replay-theater: shown failed (${why(error)})`, { to: "debug" });
  }
}
function paneIo($) {
  const title = words().title;
  return {
    browse: { get: () => read($, browseAtom), set: (change) => update($, browseAtom, change) },
    view: { get: () => read($, viewAtom), set: (change) => update($, viewAtom, change) },
    index: { get: () => read($, indexAtom), set: (change) => update($, indexAtom, change) },
    replay: { get: () => read($, replayAtom), set: (change) => update($, replayAtom, change) },
    past: { get: () => read($, pastAtom), set: (change) => update($, pastAtom, change) },
    turns: { get: () => read($, turnsAtom), set: (change) => update($, turnsAtom, change) },
    sessions: { get: () => read($, sessionsAtom), set: (change) => update($, sessionsAtom, change) },
    kept: { get: () => $.store.get(KEPT_KEY), set: (value) => $.store.set(KEPT_KEY, value) },
    open: async (rows) => {
      const size = rows === undefined ? {} : { closeOnEscape: true, rows, columns: PANE_COLUMNS };
      motion.reset();
      const isPlaced = (await $.ui.open({ id: PANE_ID, title, focus: true, ...size })).isPlaced !== false;
      if (isPlaced)
        await reportShown($);
      return isPlaced;
    },
    close: () => $.ui.close({ id: PANE_ID }),
    sleep: (ms) => $.clock.sleep(ms),
    explain: (id) => void explainReplay(explainIo($), id),
    archive: archiveIo($),
    where: () => whereOf(flags.transcript, flags.cwd)
  };
}
async function drawn($, ui, site) {
  const snap = {
    browse: await read($, browseAtom),
    view: await read($, viewAtom),
    replay: await read($, replayAtom),
    past: await read($, pastAtom),
    index: await read($, indexAtom),
    sessions: await read($, sessionsAtom),
    turns: await read($, turnsAtom),
    now: await $.clock.now()
  };
  return bodyView(ui, snap, { site, on: handlersOf(paneIo($), snap.browse) });
}
async function refreshTheme($) {
  try {
    const rows = await $.config.list();
    const theme = themeOf(rows.find((row) => row.key === "theme")?.value);
    await update($, viewAtom, (view) => ({ ...view, theme }));
  } catch (error) {
    $.ui.log(`replay-theater: theme not readable (${why(error)})`, { to: "debug" });
  }
}
async function writeHub($) {
  const shown = hubOf(await read($, replayAtom));
  const { value } = await $.state.get(HUB);
  if (value !== undefined && value.detail === shown.detail && value.tone === shown.tone)
    return;
  const card = { pane: HUB_PANE, ...shown, section: "work", at: await $.clock.now() };
  await $.state.set(HUB, card);
}
function hookSession(on) {
  on("session.start", async ($, e, next) => {
    setLang(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    const r = await next(e);
    flags.cwd = e.cwd.replace(/\/$/, "");
    await $.command.register({ name: "replay", description: words().command, argumentHint: "[turns|sessions]" });
    await refreshTheme($);
    await writeHub($);
    return r;
  });
  on("session.end", async ($, e, next) => {
    if (e.reason === "clear")
      await update($, planAtom, () => []);
    return next(e);
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "modz", key: "open" }, async ($, e, next) => {
    const done = await next(e);
    if (isOpenFor(e.value, HUB_PANE))
      await bringReplay(paneIo($));
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "modz", key: "stage" }, async ($, e, next) => {
    const done = await next(e);
    const view = await read($, viewAtom);
    if (isOffStage(e.value, HUB_PANE) && view.isOpen && !view.inBand)
      await $.ui.close({ id: PANE_ID });
    return done;
  }).catch(($, e, next) => next(e));
}
function hookCommand(on) {
  on("classic.SessionStart", async ($, e, next) => {
    flags.transcript = typeof e.transcript_path === "string" ? e.transcript_path : "";
    return next(e);
  }).catch(($, e, next) => next(e));
  on("command.run", { command: "replay" }, async ($, e) => {
    const list = String(e.args ?? "").trim().toLowerCase();
    if (list === "turns" || list === "sessions") {
      await openList(paneIo($), { mode: list });
      return {};
    }
    const opened = await openReplay(paneIo($));
    const count = (await read($, replayAtom))?.steps.length ?? 0;
    if (opened.hasEdits)
      return { text: words().commandCount(count) };
    return opened.isPlaced ? {} : { text: words().commandEmpty };
  });
}
function hookRecording(on) {
  hookEdits(on, flags);
  on("turn.start", async ($, e, next) => {
    if (e.agentId === undefined) {
      flags.ask = typeof e.text === "string" ? e.text : "";
      await update($, pendingAtom, () => []);
      await update($, commandsAtom, () => 0);
    }
    return next(e);
  });
  on("turn.complete", async ($, e, next) => {
    const r = await next(e);
    const pending = await read($, pendingAtom);
    const byCommands = await read($, commandsAtom);
    if (e.agentId !== undefined || pending.length === 0 && byCommands === 0)
      return r;
    const turn = { quote: shortLine(e.answer ?? ""), ask: shortLine(flags.ask), at: await $.clock.now(), ...byCommands > 0 ? { byCommands } : {} };
    await update($, replayAtom, () => ({ id: e.turnId, steps: pending, explain: "none", ...turn }));
    await update($, pendingAtom, () => []);
    await update($, commandsAtom, () => 0);
    await update($, indexAtom, () => 0);
    await refreshTheme($);
    await writeHub($);
    return r;
  });
}
function hookBand(on) {
  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    if (e.props.hasSurvey)
      return next(e);
    const theirs = await next(e);
    const view = await read($, viewAtom);
    if (!view.isOpen || !view.inBand)
      return theirs;
    const ui = $.ui.resolve(e);
    const body = await drawn($, ui, { surface: e.surface, columns: e.props.bodyColumns, inBand: true, maxRows: e.props.maxRows });
    return pinned(e, h(ui.Box, {
      flexDirection: "column"
    }, body, theirs));
  });
}
function hookPane(on) {
  on("ui.render", { component: "Pane", requestId: PANE_ID }, async ($, e) => {
    const site = { surface: e.surface, columns: e.props.bodyColumns, inBand: false, maxRows: e.props.scroll?.bodyRows ?? PANE_ROWS_MAX };
    const isHubOn = (await $.state.get({ plugin: "modz", key: "isOn" })).value === true;
    const goHome = () => void $.clock.now().then((at) => $.state.set(HOME, { at })).catch(() => $.ui.log("replay-theater: could not go back to MODZ", { to: "debug" }));
    const ui = $.ui.resolve(e);
    return pinned(e, withHome(ui, await drawn($, ui, site), isHubOn ? goHome : null));
  });
  on("ui.close", { id: PANE_ID }, async ($, e, next) => {
    await update($, viewAtom, (view) => ({ ...view, isOpen: false, inBand: false }));
    return next(e);
  }).catch(($, e, next) => next(e));
}
const register = (on) => {
  hookSession(on);
  hookCommand(on);
  hookRecording(on);
  hookBand(on);
  hookPane(on);
};

export { register };
