// Built by `bin/modz build` from the files beside it. Never edited by hand.
import { atom, read, update } from 'claude-code';

const SLUG_MAX = 120;
const SLUG_TAIL = 60;
const SEED_A = 3735928559;
const SEED_B = 1103547991;
const MIX_A = 2654435761;
const MIX_B = 1597334677;
const FOLD_A = 2246822507;
const FOLD_B = 3266489909;
const HIGH_BITS = 2097151;
const TWO_32 = 4294967296;
const RADIX = 36;
function slug(text) {
  return text.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, SLUG_MAX) || "root";
}
function hash53(text) {
  let a = SEED_A;
  let b = SEED_B;
  for (let i = 0;i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    a = Math.imul(a ^ code, MIX_A);
    b = Math.imul(b ^ code, MIX_B);
  }
  a = Math.imul(a ^ a >>> 16, FOLD_A) ^ Math.imul(b ^ b >>> 13, FOLD_B);
  b = Math.imul(b ^ b >>> 16, FOLD_A) ^ Math.imul(a ^ a >>> 13, FOLD_B);
  return TWO_32 * (HIGH_BITS & b) + (a >>> 0);
}
const keyOf = (path) => `${slug(path).slice(-SLUG_TAIL).replace(/^[-.]+/, "")}-${hash53(path).toString(RADIX)}`;
const scopeOf = (root, session) => `refs/checkpoints/${keyOf(root)}/${slug(session)}/`;

const KEEP = 30;
const HEAD_TRAILER = "Checkpoint-Head";
const INDEX_TRAILER = "Checkpoint-Index";
const SHADOW_SKIP = ["node_modules/", ".venv/", "venv/", "__pycache__/", ".next/", ".nuxt/", "dist/", "build/", "target/", ".gradle/", ".dart_tool/", "Pods/", ".cache/", ".DS_Store"];
const BIG_FILE = "+5M";
const GIT_BINARIES = ["git", "/Library/Developer/CommandLineTools/usr/bin/git"];
const ARGV_CHUNK = 200;
const IDENTITY = {
  GIT_AUTHOR_NAME: "checkpoint",
  GIT_AUTHOR_EMAIL: "checkpoint@localhost",
  GIT_COMMITTER_NAME: "checkpoint",
  GIT_COMMITTER_EMAIL: "checkpoint@localhost"
};
function argvOf(repo, args) {
  return repo.isShadow ? [repo.bin, `--git-dir=${repo.gitDir}`, `--work-tree=${repo.root}`, ...args] : [repo.bin, ...args];
}
async function gitBinary(run, cwd) {
  for (const bin of GIT_BINARIES) {
    const out = await run([bin, "--version"], { cwd }).catch(() => null);
    if (out !== null && out.exitCode === 0)
      return bin;
  }
  return null;
}
async function gitWith(run, repo, call) {
  const { args, init } = call;
  const out = await run(argvOf(repo, args), { cwd: repo.root, ...init });
  if (out.exitCode !== 0)
    throw new Error(`git ${args[0]} failed: ${out.stderr.trim().slice(0, 200)}`);
  return out.stdout.trim();
}
const git = (run, repo, args) => gitWith(run, repo, { args, init: {} });
function chunks(items) {
  const out = [];
  for (let i = 0;i < items.length; i += ARGV_CHUNK)
    out.push(items.slice(i, i + ARGV_CHUNK));
  return out;
}
const literal = (path) => `:(literal)${path}`;
const BROAD = ["", "Downloads", "Desktop", "Documents"];
const STORE_DAYS = 30;
const storeOf = (home) => `${home}/.cache/claude-checkpoint`;
async function dropStale(run, home) {
  if (home === "")
    return;
  await run(["find", storeOf(home), "-mindepth", "1", "-maxdepth", "1", "-type", "d", "-name", "*.git", "-mtime", `+${STORE_DAYS}`, "-exec", "rm", "-rf", "{}", "+"], { cwd: home });
}
async function locate(run, opts) {
  const { cwd, home, bin } = opts;
  const found = await run([bin, "rev-parse", "--show-toplevel", "--absolute-git-dir"], { cwd });
  const [root, gitDir] = found.stdout.trim().split(`
`);
  if (found.exitCode === 0 && root !== undefined && gitDir !== undefined)
    return { root, gitDir, isShadow: false, bin };
  if (home === "" || cwd === "/" || BROAD.some((name) => cwd === (name === "" ? home : `${home}/${name}`)))
    return null;
  const repo = { root: cwd, gitDir: `${storeOf(home)}/${keyOf(cwd)}.git`, isShadow: true, bin };
  const probe = await run([bin, `--git-dir=${repo.gitDir}`, "rev-parse", "--git-dir"], { cwd });
  if (probe.exitCode !== 0 && opts.isProbeOnly === true)
    return null;
  if (probe.exitCode !== 0) {
    await git(run, { ...repo, isShadow: false }, ["init", "-q", "--bare", repo.gitDir]);
    await git(run, { ...repo, isShadow: false }, [`--git-dir=${repo.gitDir}`, "config", "core.bare", "false"]);
    await run(["sh", "-c", 'mkdir -p "$(dirname "$1")" && cat > "$1"', "sh", `${repo.gitDir}/info/exclude`], { cwd, stdin: SHADOW_SKIP.join(`
`) + `
` });
  }
  return repo;
}
async function bigFiles(run, repo, env) {
  const listed = await run(argvOf(repo, ["ls-files", "-o", "--exclude-standard", "-z"]), { cwd: repo.root, env });
  const untracked = listed.stdout.split("\x00").filter((path) => path !== "");
  const big = [];
  for (const part of chunks(untracked)) {
    const out = await run(["find", ...part.map((path) => `./${path}`), "-maxdepth", "0", "-type", "f", "-size", BIG_FILE, "-print"], { cwd: repo.root });
    big.push(...out.stdout.split(`
`).filter((line) => line !== "").map((line) => line.replace(/^\.\//, "")));
  }
  return big;
}
async function writeTree(run, repo) {
  const index = `${repo.gitDir}/checkpoint.index`;
  const env = { GIT_INDEX_FILE: index };
  await run(["rm", "-f", index], { cwd: repo.root });
  const copied = repo.isShadow ? null : await run(["cp", `${repo.gitDir}/index`, index], { cwd: repo.root });
  const staged = copied?.exitCode === 0 ? await run(argvOf(repo, ["write-tree"]), { cwd: repo.root, env }) : null;
  const big = await bigFiles(run, repo, env);
  await gitWith(run, repo, { args: ["add", "-A", "--", ".", ...big.map((path) => `:(exclude,literal)${path}`)], init: { env } });
  for (const part of chunks(big)) {
    await gitWith(run, repo, { args: ["rm", "--cached", "-q", "--ignore-unmatch", "--", ...part.map(literal)], init: { env } });
  }
  const tree = await gitWith(run, repo, { args: ["write-tree"], init: { env } });
  await run(["rm", "-f", index], { cwd: repo.root });
  return { tree, index: staged?.exitCode === 0 ? staged.stdout.trim() : null };
}
async function commitOf(run, repo, spec) {
  const found = await run(argvOf(repo, ["rev-parse", "--verify", "-q", "HEAD"]), { cwd: repo.root });
  const head = found.exitCode === 0 ? found.stdout.trim() : null;
  const commitTree = (args) => gitWith(run, repo, { args: ["commit-tree", ...args], init: { env: IDENTITY } });
  const staged = spec.index === null ? null : await commitTree([spec.index, "-m", "checkpoint index"]);
  const parents = [head, staged].flatMap((parent) => parent === null ? [] : ["-p", parent]);
  const trailers = [head === null ? "" : `${HEAD_TRAILER}: ${head}`, staged === null ? "" : `${INDEX_TRAILER}: ${spec.index}`].filter(Boolean);
  const message = trailers.length === 0 ? [] : ["-m", trailers.join(`
`)];
  return commitTree([spec.tree, ...parents, "-m", spec.label, ...message]);
}
async function snapshot(run, repo, opts) {
  const commit = await commitOf(run, repo, { label: opts.label, ...await writeTree(run, repo) });
  await git(run, repo, ["update-ref", `${repo.scope}${opts.ref}`, commit]);
  return commit;
}
async function takenWith(run, repo, commit) {
  const body = await run(argvOf(repo, ["log", "-1", "--format=%B", commit]), { cwd: repo.root });
  const trailer = (name) => new RegExp(`^${name}: ([0-9a-f]+)$`, "m").exec(body.stdout)?.[1] ?? null;
  return { head: trailer(HEAD_TRAILER), index: trailer(INDEX_TRAILER) };
}
async function madeSince(run, repo, head) {
  if (repo.isShadow)
    return 0;
  const out = await run(argvOf(repo, ["rev-list", "--count", head === null ? "HEAD" : `${head}..HEAD`]), { cwd: repo.root });
  return out.exitCode === 0 ? Number(out.stdout.trim()) || 0 : 0;
}
async function list(run, repo) {
  const format = "%(refname)%09%(objectname)%09%(committerdate:unix)%09%(subject)";
  const out = await git(run, repo, ["for-each-ref", "--sort=-committerdate", `--format=${format}`, repo.scope]);
  return out.split(`
`).filter((line) => line !== "").map((line) => {
    const [ref = "", commit = "", unix = "0", ...rest] = line.split("\t");
    return { ref, commit, at: Number(unix) * 1000, label: rest.join("\t") };
  });
}
async function prune(run, repo, keep = KEEP) {
  const all = await list(run, repo);
  const stale = all.slice(keep);
  if (stale.length === 0)
    return all;
  const stdin = stale.map((entry) => `delete ${entry.ref}
`).join("");
  await gitWith(run, repo, { args: ["update-ref", "--stdin"], init: { stdin } });
  if (repo.isShadow)
    await run(argvOf(repo, ["gc", "--auto", "--quiet"]), { cwd: repo.root });
  return all.slice(0, keep);
}
function parseNameStatus(out) {
  const parts = out.split("\x00").filter((part) => part !== "");
  const plan = { restore: [], remove: [] };
  for (let i = 0;i + 1 < parts.length; i += 2) {
    const path = parts[i + 1] ?? "";
    if (parts[i] === "A")
      plan.remove.push(path);
    else
      plan.restore.push(path);
  }
  return plan;
}
async function plan(run, repo, commit) {
  const now = await writeTree(run, repo);
  const out = await run(argvOf(repo, ["diff", "--name-status", "--no-renames", "-z", `${commit}^{tree}`, now.tree]), { cwd: repo.root });
  if (out.exitCode !== 0)
    throw new Error(`git diff failed: ${out.stderr.trim().slice(0, 200)}`);
  return { ...parseNameStatus(out.stdout), ...now };
}
function parseNumstat(out) {
  return out.split("\x00").flatMap((row) => {
    const found = /^(\d+|-)\t(\d+|-)\t(.+)$/.exec(row.replace(/^\n/, ""));
    if (found === null)
      return [];
    return [{ path: found[3] ?? "", added: Number(found[1]) || 0, removed: Number(found[2]) || 0 }];
  });
}
async function numstat(run, repo, spec) {
  const out = await run(argvOf(repo, ["diff", "--numstat", "--no-renames", "-z", spec.tree, `${spec.commit}^{tree}`]), { cwd: repo.root });
  return out.exitCode === 0 ? parseNumstat(out.stdout) : [];
}
async function apply(run, repo, opts) {
  for (const part of chunks(opts.plan.restore)) {
    await git(run, repo, ["restore", `--source=${opts.commit}`, "--worktree", "--", ...part.map(literal)]);
  }
  for (const part of chunks(opts.plan.remove)) {
    await run(["rm", "-f", "--", ...part.map((path) => `${repo.root}/${path}`)], { cwd: repo.root });
  }
  if (opts.index !== null && !repo.isShadow)
    await git(run, repo, ["read-tree", opts.index]);
}

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const pick = (table) => table[current];
const upper = (text) => text.toLocaleUpperCase(current);

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
function agoEn(ms) {
  if (ms < MINUTE)
    return "just now";
  if (ms < HOUR)
    return `${Math.round(ms / MINUTE)}m ago`;
  if (ms < DAY)
    return `${Math.round(ms / HOUR)}h ago`;
  return `${Math.round(ms / DAY)}d ago`;
}
function agoTr(ms) {
  if (ms < MINUTE)
    return `${Math.max(0, Math.round(ms / SECOND))} sn önce`;
  if (ms < HOUR)
    return `${Math.round(ms / MINUTE)} dk önce`;
  if (ms < DAY)
    return `${Math.round(ms / HOUR)} sa önce`;
  return `${Math.round(ms / DAY)} g önce`;
}
const EN = {
  title: "Restore points",
  ago: agoEn,
  hubDetail: (count) => `${count} saved`,
  headerMeta: (count, ago) => `${count} saved · newest ${ago}`,
  newest: (ago) => `newest ${ago}`,
  emptyLead: "No restore points yet",
  emptyRest: "one is saved quietly before the first file change",
  turnsSaved: (turns) => `${plural(turns, "turn", "turns")} saved`,
  turn: (number) => `Turn ${number}`,
  saved: "Restore point",
  beforeUndo: "Before undo",
  safetyPrefix: "before undo: ",
  undo: "Undo",
  undoMeta: "the current state is saved first",
  question: (target) => `Go back to before ${target}?`,
  changed: (count) => `${plural(count, "file", "files")} will change`,
  confirm: (count) => ({ label: `Restore ${plural(count, "file", "files")}`, hotkey: "r" }),
  cancel: { label: "Cancel", hotkey: "c" },
  redo: "Redo",
  files: (count) => `+${plural(count, "file", "files")}`,
  undone: "undone",
  willDelete: "will be deleted",
  moreFiles: (count) => `+ ${plural(count, "more file", "more files")}`,
  more: (count) => `+ ${count} more`,
  toRestore: (count) => `${count} to restore`,
  toDelete: (count) => `${count} to delete`,
  lines: "lines",
  summary: (restore, remove) => [`${plural(restore, "file", "files")} will be restored`, remove > 0 ? `${plural(remove, "new file", "new files")} will be deleted` : ""].filter(Boolean).join(", ") + ". The current state is saved first.",
  checking: "Checking…",
  undoing: "Undoing…",
  noRepo: "This folder has no version history (git).",
  alreadyThere: "The files already match this restore point.",
  failed: "Couldn't undo; the reason is in Claude Code's log (debug log).",
  commitsKept: (count) => `${plural(count, "saved version", "saved versions")} (commits) made since this point stay in the history; the undo shows up as new changes on top.`,
  indexBack: "Files marked for the next saved version (staged) go back as they were too.",
  ignoredKept: "Files git is told to skip (such as the secrets file .env) are not covered and stay as they are.",
  restored: (count, target) => `Restored ${plural(count, "file", "files")} to before ${target}.`,
  toggled: (isOn) => `restore points ${isOn ? "on" : "off"}`,
  toggleLine: "Quietly saves a restore point before each turn's first file change: on/off",
  paneLine: "Lists the restore points; undoes a turn",
  promptFallback: "turn"
};
const TR = {
  title: "Geri dönüş noktaları",
  ago: agoTr,
  hubDetail: (count) => `${count} nokta`,
  headerMeta: (count, ago) => `${count} nokta · en yenisi ${ago}`,
  newest: (ago) => `en yenisi ${ago}`,
  emptyLead: "Henüz geri dönüş noktası yok",
  emptyRest: "ilk dosya değişikliğinden önce sessizce alınır",
  turnsSaved: (turns) => `${turns} tur kayıtlı`,
  turn: (number) => `Tur ${number}`,
  saved: "Geri dönüş noktası",
  beforeUndo: "Geri almadan önce",
  safetyPrefix: "geri almadan önce: ",
  undo: "Geri al",
  undoMeta: "şimdiki hal önce kaydedilir",
  question: (target) => `${target} öncesine dönülsün mü?`,
  changed: (count) => `${count} dosya değişecek`,
  confirm: (count) => ({ label: `${count} dosyayı geri al`, hotkey: "g" }),
  cancel: { label: "Vazgeç", hotkey: "v" },
  redo: "Yinele",
  files: (count) => `+${count} dosya`,
  undone: "geri alındı",
  willDelete: "silinecek",
  moreFiles: (count) => `+${count} dosya daha`,
  more: (count) => `+${count} daha`,
  toRestore: (count) => `${count} geri yüklenecek`,
  toDelete: (count) => `${count} silinecek`,
  lines: "satır",
  summary: (restore, remove) => [`${restore} dosya geri yüklenecek`, remove > 0 ? `${remove} yeni dosya silinecek` : ""].filter(Boolean).join(", ") + ". Önce şimdiki hal kaydedilir.",
  checking: "Denetleniyor…",
  undoing: "Geri alınıyor…",
  noRepo: "Bu klasörün sürüm geçmişi (git) yok.",
  alreadyThere: "Dosyalar zaten bu noktadaki gibi.",
  failed: "Geri alınamadı; nedeni Claude Code günlüğünde (debug log).",
  commitsKept: (count) => `Bu noktadan sonraki ${count} kayıt (commit) geçmişte kalır; geri alma bunların üstüne yeni değişiklik olarak görünür.`,
  indexBack: "Sonraki kayda hazırlanan (staged) dosyalar da eski haline döner.",
  ignoredKept: "Git'in atladığı dosyalar (gizli ayar dosyası .env gibi) kapsanmaz, olduğu gibi kalır.",
  restored: (count, target) => `${count} dosya ${target} öncesine döndü.`,
  toggled: (isOn) => `geri dönüş noktaları ${isOn ? "açık" : "kapalı"}`,
  toggleLine: "Her turun ilk dosya değişikliğinden önce sessizce geri dönüş noktası alır: aç/kapa",
  paneLine: "Geri dönüş noktalarını listeler; bir turu geri alır",
  promptFallback: "tur"
};
const SAFETY_PREFIXES = [EN.safetyPrefix, TR.safetyPrefix];
const words = () => pick({ en: EN, tr: TR });

const HUB_PANE = "checkpoints";
function hubOf(entries) {
  if (entries.length === 0)
    return { detail: "", tone: "idle" };
  return { detail: words().hubDetail(entries.length), tone: "ok" };
}
function isOpenFor(value, pane) {
  return typeof value === "object" && value !== null && value.pane === pane;
}

const SAMPLE_MAX = 5;
const TOOL_GLYPH = {
  Edit: "E",
  MultiEdit: "E",
  NotebookEdit: "E",
  Write: "W",
  Bash: "$",
  Read: "R",
  Grep: "S",
  Glob: "S",
  WebFetch: "G",
  WebSearch: "G",
  Task: "A",
  Agent: "A",
  TodoWrite: "T"
};
const GLYPH_ORDER = ["E", "W", "$", "R", "S", "G", "A", "T"];
const glyphOf$1 = (tool) => TOOL_GLYPH[tool];
function sortGlyphs(glyphs) {
  return [...new Set(glyphs)].sort((a, b) => GLYPH_ORDER.indexOf(a) - GLYPH_ORDER.indexOf(b));
}
function keepListed(meta, entries) {
  return Object.fromEntries(entries.filter((entry) => meta[entry.ref] !== undefined).map((entry) => [entry.ref, meta[entry.ref]]));
}
function markUndone(meta, spec) {
  const out = { ...meta, [spec.safetyRef]: { ...meta[spec.safetyRef], isSafety: true } };
  for (const entry of spec.entries) {
    if (entry.ref === spec.safetyRef || out[entry.ref]?.isSafety === true)
      continue;
    out[entry.ref] = { ...out[entry.ref], isUndone: entry.at >= spec.target.at };
  }
  return out;
}
function pendingOf(entry, spec) {
  const { changes, stats } = spec;
  const statOf = (path) => stats.find((stat) => stat.path === path);
  const files = [...changes.restore.map((path) => ({ path, isRemoved: false })), ...changes.remove.map((path) => ({ path, isRemoved: true }))].slice(0, SAMPLE_MAX).map((file) => ({ ...file, added: statOf(file.path)?.added ?? 0, removed: statOf(file.path)?.removed ?? 0 }));
  const sum = (key) => stats.reduce((total, stat) => total + stat[key], 0);
  const counts = { restore: changes.restore.length, remove: changes.remove.length, added: sum("added"), removed: sum("removed") };
  return { entry, turn: spec.turn, ...counts, files, commits: spec.commits, isIndexMoved: spec.isIndexMoved };
}

const FILL = /<rect\b[^>]*\bdata-m-fill\b[^>]*>/g;
const DONE = /<path\b[^>]*\bdata-m-done\b[^>]*>/g;
const HAS_DONE = /\bdata-m-done\b/;
const WIDTH$1 = /\swidth="([\d.]+)"/;
const CLASS = /\sclass="([^"]*)"/;
const STYLE = /\sstyle="([^"]*)"/;
const MIN_RATIO_STEP = 0.02;
const RATIO_DIGITS = 3;
const widthOf = (tag) => Number(WIDTH$1.exec(tag)?.[1] ?? 0);
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
const THEME_KEY = {
  tide: "suggestion",
  kiln: "claude",
  iris: "permission",
  moss: "success",
  amber: "warning",
  flare: "error",
  orchid: "merged"
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
function boxColor(theme, role, part = "fg") {
  if (theme.mode === "auto")
    return THEME_KEY[role];
  return (theme.isLight ? LIGHT : DARK)[role][part];
}

const SANS = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`;
const MONO = `ui-monospace, 'SF Mono', Menlo, monospace`;
const PX_PER_COLUMN = 9;
const MONO_EM = 0.6;
const BOLD_FROM = 600;
const BOLD_WIDEN = 1.06;
const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const MOTION = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
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
  return em * font.size * widen;
}
function cut(text, box) {
  const { width, font, isFromStart } = box;
  if (measure(text, font) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 1 && measure(`${chars.join("")}…`, font) > width) {
    if (isFromStart)
      chars.shift();
    else
      chars.pop();
  }
  return isFromStart ? `…${chars.join("")}` : `${chars.join("")}…`;
}
const fit = (text, width, font) => cut(text, { width, font, isFromStart: false });
const fitStart = (text, width, font) => cut(text, { width, font, isFromStart: true });
function wrap(text, width, spec) {
  const lines = [];
  let current = "";
  for (const word of text.split(/\s+/).filter((part) => part !== "")) {
    const next = current === "" ? word : `${current} ${word}`;
    if (current === "" || measure(next, spec.font) <= width)
      current = next;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current !== "")
    lines.push(current);
  if (lines.length <= spec.maxLines)
    return lines.map((line) => fit(line, width, spec.font));
  const kept = lines.slice(0, spec.maxLines);
  const last = kept.length - 1;
  return kept.map((line, index) => index === last ? fit(`${line} ${lines.slice(spec.maxLines).join(" ")}`, width, spec.font) : line);
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
function text(spec) {
  const attrs = [`x="${px(spec.x)}"`, `y="${px(spec.y)}"`, `font-size="${spec.size}"`];
  if (spec.weight !== undefined)
    attrs.push(`font-weight="${spec.weight}"`);
  if (spec.anchor !== undefined && spec.anchor !== "start")
    attrs.push(`text-anchor="${spec.anchor}"`);
  if (spec.isMono === true)
    attrs.push('class="mono"');
  return `<text ${attrs.join(" ")} style="fill:var(--${spec.ink})">${esc(spec.text)}</text>`;
}
function runs(spec) {
  const spans = spec.parts.map((part) => {
    const weight = part.weight === undefined ? "" : ` font-weight="${part.weight}"`;
    const mono = part.isMono === true ? ' class="mono"' : "";
    return `<tspan${weight}${mono} style="fill:var(--${part.ink})">${esc(part.text)}</tspan>`;
  });
  return `<text x="${px(spec.x)}" y="${px(spec.y)}" font-size="${spec.size}">${spans.join("")}</text>`;
}
function rect(spec) {
  const fill = spec.fill === undefined ? "fill:none" : `fill:var(--${spec.fill})`;
  const stroke = spec.stroke === undefined ? "" : `;stroke:var(--${spec.stroke})`;
  const cls = spec.className === undefined ? "" : ` class="${spec.className}"`;
  return `<rect${cls} x="${px(spec.x)}" y="${px(spec.y)}" width="${px(spec.w)}" height="${px(spec.h)}" rx="${spec.rx ?? 0}" style="${fill}${stroke}"/>`;
}
function line(spec) {
  const dash = spec.dash === undefined ? "" : ` stroke-dasharray="${spec.dash}"`;
  return `<line x1="${px(spec.x1)}" y1="${px(spec.y1)}" x2="${px(spec.x2)}" y2="${px(spec.y2)}" stroke-width="1"${dash} style="stroke:var(--${spec.ink})"/>`;
}
function fileBadge(spec) {
  const name = spec.path.split("/").pop() ?? spec.path;
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1) : "";
  const label = upper(ext === "" ? "·" : ext.slice(0, 3));
  return rect({ x: spec.x, y: spec.y, w: 26, h: 16, rx: 4, fill: "track" }) + text({ size: 9.5, weight: 600, isMono: true, x: spec.x + 13, y: spec.y + 11.5, text: label, ink: "lo", anchor: "middle" });
}
function monogram(spec) {
  return rect({ x: spec.x, y: spec.y, w: 16, h: 16, rx: 4, fill: "track" }) + text({ size: 10, weight: 600, isMono: true, x: spec.x + 8, y: spec.y + 11.5, text: spec.glyph, ink: "lo", anchor: "middle" });
}
function bar(spec) {
  const radius = spec.height / 2;
  const track = rect({ x: spec.x, y: spec.y, w: spec.width, h: spec.height, rx: radius, fill: "track" });
  let left = spec.x;
  const fills = spec.parts.filter((part) => part.value > 0).map((part) => {
    const width = Math.max(spec.height, spec.width * part.value / Math.max(1, spec.total) - 2);
    const drawn = rect({ x: left, y: spec.y, w: width, h: spec.height, rx: radius, fill: part.ink });
    left += width + 2;
    return drawn;
  });
  return track + fills.join("");
}

const HEAD_LEAD_Y = 18;
const HEAD_PAD_BOTTOM = 6;
const SUB_LINE_H = 18;
const LEAD = { size: 16, weight: 600 };
const SUB = { size: 12 };
const ROW_MIN_H = 48;
const ROW_PAD_BOTTOM = 10;
const DOT_X = 8;
const DOT_Y = 15;
const TEXT_X = 26;
const TITLE_Y = 19;
const LABEL_Y = 38;
const LABEL_LINE_H = 17;
const LABEL_LINES = 2;
const CHIP = 16;
const CHIP_GAP = 4;
const RIGHT_GAP = 12;
const FILES_GAP = 10;
const TITLE = { size: 13, weight: 560 };
const WHEN = { size: 13 };
const LABEL = { size: 12 };
const META = { size: 11, isMono: true };
const STRIKE_FIT = 0.95;
const CHEVRON_ROOM = 28;
const CHEVRON_INSET = 18;
const drawing = (frame, spec) => ({ source: svgDoc({ width: frame.width, height: spec.height, mode: frame.mode, body: spec.body }), width: frame.width, height: spec.height, alt: spec.alt });
function headLines(room, spec) {
  const joiner = spec.joiner ?? " ";
  const isRestInline = spec.rest === "" || measure(`${spec.lead}${joiner}${spec.rest}`, LEAD) <= room;
  const rest = isRestInline ? [] : wrap(spec.rest, room, { font: SUB, maxLines: LABEL_LINES }).map((part) => ({ text: part, ink: "mid" }));
  const meta = spec.meta === "" ? [] : [{ text: fit(spec.meta, room, SUB), ink: "lo" }];
  return { inline: isRestInline && spec.rest !== "" ? `${joiner}${spec.rest}` : "", sub: [...rest, ...meta] };
}
function headSvg(frame, spec) {
  const room = frame.width;
  const lines = headLines(room, spec);
  const lead = fit(spec.lead, room, LEAD);
  const subs = lines.sub.map((part, index) => text({ ...SUB, x: 0, y: HEAD_LEAD_Y + SUB_LINE_H * (index + 1), text: part.text, ink: part.ink }));
  const body = runs({ x: 0, y: HEAD_LEAD_Y, size: LEAD.size, parts: [{ text: lead, ink: "hi", weight: LEAD.weight }, { text: lines.inline, ink: "mid", weight: 500 }] }) + subs.join("");
  const height = HEAD_LEAD_Y + SUB_LINE_H * lines.sub.length + HEAD_PAD_BOTTOM;
  const meta = spec.meta === "" ? "" : ` · ${spec.meta}`;
  const rest = spec.rest === "" ? "" : `${spec.joiner ?? " "}${spec.rest}`;
  return drawing(frame, { height, body, alt: `${spec.label}: ${spec.lead}${rest}${meta}` });
}
function dotOf(spec) {
  const { meta } = spec;
  if (meta.isSafety === true)
    return rect({ x: DOT_X - 3.5, y: DOT_Y - 3.5, w: 7, h: 7, rx: 1.5, fill: "card", stroke: "lo" });
  if (meta.isUndone === true)
    return `<circle cx="${DOT_X}" cy="${DOT_Y}" r="4" stroke-dasharray="2 1.6" style="fill:var(--card);stroke:var(--lo)"/>`;
  if (spec.isNewest)
    return `<circle cx="${DOT_X}" cy="${DOT_Y}" r="4" style="fill:var(--kiln)"/>`;
  return `<circle cx="${DOT_X}" cy="${DOT_Y}" r="4" style="fill:var(--strong)"/>`;
}
function railOf(spec, height) {
  const top = spec.isFirst ? DOT_Y : 0;
  const bottom = spec.isLast ? DOT_Y : height;
  return top === bottom ? "" : line({ x1: DOT_X, y1: top, x2: DOT_X, y2: bottom, ink: "line" });
}
const filesText = (meta) => meta.files === undefined || meta.files === 0 ? "" : words().files(meta.files);
function factsOf(meta, at) {
  const tools = meta.tools ?? [];
  const chipsW = tools.length === 0 ? 0 : tools.length * (CHIP + CHIP_GAP) - CHIP_GAP;
  const files = filesText(meta);
  const filesW = files === "" ? 0 : measure(files, META);
  const gap = chipsW > 0 && filesW > 0 ? FILES_GAP : 0;
  const chipsX = at.isCountFirst ? at.x + filesW + gap : at.x;
  const filesX = at.isCountFirst ? at.x : at.x + chipsW + gap;
  const chips = tools.map((glyph, index) => monogram({ x: chipsX + index * (CHIP + CHIP_GAP), y: at.y, glyph }));
  const label = files === "" ? "" : text({ ...META, x: filesX, y: at.y + 12, text: files, ink: meta.isUndone === true ? "lo" : "mid" });
  return { svg: chips.join("") + label, width: chipsW + gap + filesW };
}
const factsWidth = (meta) => factsOf(meta, { x: 0, y: 0, isCountFirst: false }).width;
const headWidth = (spec) => measure(spec.title, TITLE) + measure(`  ${spec.when}`, WHEN);
function rowFits(frame, spec) {
  const facts = factsWidth(spec.meta);
  return facts === 0 || TEXT_X + headWidth(spec) + RIGHT_GAP + facts + CHEVRON_ROOM <= frame.width;
}
function struck(spec) {
  const width = measure(spec.text, spec.font) * STRIKE_FIT;
  const y = spec.y - spec.font.size * 0.32;
  return line({ x1: spec.x - 1, y1: y, x2: spec.x + width + 1, y2: y, ink: "lo" });
}
const titleInkOf = (meta) => meta.isUndone === true ? "lo" : "hi";
const chevron = (x, y) => `<path d="M${x} ${y - 4.5}l4.5 4.5-4.5 4.5" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--lo)"/>`;
function rowSvg(frame, spec) {
  const { meta } = spec;
  const isUndone = meta.isUndone === true;
  const titleInk = titleInkOf(meta);
  const head = runs({ x: TEXT_X, y: TITLE_Y, size: TITLE.size, parts: [{ text: spec.title, ink: titleInk, weight: TITLE.weight }, { text: `  ${spec.when}`, ink: "lo", weight: 400 }] });
  const labels = wrap(spec.label, frame.width - TEXT_X - CHEVRON_ROOM, { font: LABEL, maxLines: LABEL_LINES });
  const labelY = (index) => LABEL_Y + index * LABEL_LINE_H;
  const body = labels.map((part, index) => text({ ...LABEL, x: TEXT_X, y: labelY(index), text: part, ink: isUndone ? "lo" : "mid" })).join("");
  const lastY = labelY(Math.max(0, labels.length - 1));
  const hasFacts = factsWidth(meta) > 0;
  const factsTop = spec.isStacked ? lastY + ROW_PAD_BOTTOM - 2 : TITLE_Y - 15;
  const facts = factsOf(meta, { x: spec.isStacked ? TEXT_X : frame.width - CHEVRON_ROOM - factsWidth(meta), y: factsTop, isCountFirst: !spec.isStacked });
  const bottom = spec.isStacked && hasFacts ? factsTop + CHIP : lastY;
  const height = Math.max(ROW_MIN_H, Math.ceil(bottom + ROW_PAD_BOTTOM));
  const strikes = isUndone ? [struck({ x: TEXT_X, y: TITLE_Y, text: spec.title, font: TITLE }), ...labels.map((part, index) => struck({ x: TEXT_X, y: labelY(index), text: part, font: LABEL }))].join("") : "";
  const all = railOf(spec, height) + dotOf(spec) + head + facts.svg + body + strikes + chevron(frame.width - CHEVRON_INSET, height / 2);
  const files = filesText(meta);
  return drawing(frame, { height, body: all, alt: `${words().undo}: ${spec.title}, ${spec.when}${isUndone ? `, ${words().undone}` : ""}${files === "" ? "" : `, ${files}`}: ${spec.label}` });
}
const STAT_LINE_Y = 17;
const STAT_NOTE_Y = 37;
const STAT_BAR_W = 60;
const STAT_GAP = 12;
const FILE_X = 34;
const FILE_ROW_H = 24;
const FILE_ROW_TALL = 38;
const FILE_NAME = { size: 12.5 };
const FILE_DIR = { size: 11 };
const TAG = { size: 11 };
const countsOf = (file) => `+${file.added} −${file.removed}`;
const rightOfFile = (file) => measure(countsOf(file), META) + (file.isRemoved ? measure(words().willDelete, TAG) + STAT_GAP : 0);
const fileFits = (frame, file) => FILE_X + measure(file.path, FILE_NAME) + STAT_GAP + rightOfFile(file) <= frame.width;
function fileRow(frame, file, at) {
  const countsW = measure(countsOf(file), META);
  const room = frame.width - FILE_X - STAT_GAP - rightOfFile(file);
  const cut = file.path.lastIndexOf("/");
  const name = at.isTall && cut >= 0 ? file.path.slice(cut + 1) : file.path;
  const folder = at.isTall && cut >= 0 ? file.path.slice(0, cut + 1) : "";
  const tag = file.isRemoved ? text({ ...TAG, x: frame.width - countsW - STAT_GAP, y: at.y + 15, text: words().willDelete, ink: "flare", anchor: "end" }) : "";
  const under = folder === "" ? "" : text({ ...FILE_DIR, x: FILE_X, y: at.y + 30, text: fitStart(folder, frame.width - FILE_X, FILE_DIR), ink: "lo" });
  return fileBadge({ x: 0, y: at.y + 3, path: file.path }) + text({ ...FILE_NAME, x: FILE_X, y: at.y + 15, text: fitStart(name, room, FILE_NAME), ink: "hi" }) + under + tag + runs({ x: frame.width - countsW, y: at.y + 15, size: META.size, parts: [{ text: `+${file.added}`, ink: countInk(file.added, "moss"), isMono: true }, { text: ` −${file.removed}`, ink: countInk(file.removed, "flare"), isMono: true }] });
}
const countInk = (count, ink) => count === 0 ? "lo" : ink;
const MORE_H = 22;
function moreOf(pending, y) {
  const more = pending.restore + pending.remove - pending.files.length;
  if (more <= 0)
    return { svg: "", height: 0, text: "" };
  const said = words().moreFiles(more);
  return { svg: text({ size: 11.5, x: FILE_X, y: y + 15, text: said, ink: "lo" }), height: MORE_H, text: said };
}
function diffstatSvg(frame, pending) {
  const total = pending.added + pending.removed;
  const sumFont = { size: 13, isMono: true };
  const summary = runs({ x: 0, y: STAT_LINE_Y, size: sumFont.size, parts: [{ text: `+${pending.added}`, ink: "moss", weight: 650, isMono: true }, { text: ` −${pending.removed}`, ink: "flare", weight: 650, isMono: true }] });
  const sumW = measure(`+${pending.added} −${pending.removed}`, sumFont) + STAT_GAP;
  const blocks = bar({ x: sumW, y: STAT_LINE_Y - 8, width: STAT_BAR_W, height: 6, total: Math.max(1, total), parts: [{ value: pending.added, ink: "moss" }, { value: pending.removed, ink: "flare" }] });
  const parts = [words().toRestore(pending.restore), pending.remove > 0 ? words().toDelete(pending.remove) : ""].filter((part) => part !== "").join(" · ");
  const noteX = sumW + STAT_BAR_W + STAT_GAP;
  const isNoteBeside = noteX + measure(parts, { size: 11.5 }) <= frame.width;
  const note = text({ size: 11.5, x: isNoteBeside ? noteX : 0, y: isNoteBeside ? STAT_LINE_Y : STAT_NOTE_Y, text: parts, ink: "lo" });
  const statH = (isNoteBeside ? STAT_LINE_Y : STAT_NOTE_Y) + 13;
  const isTall = pending.files.some((file) => !fileFits(frame, file));
  const rowH = isTall ? FILE_ROW_TALL : FILE_ROW_H;
  const files = pending.files.map((file, index) => fileRow(frame, file, { y: statH + index * rowH, isTall }));
  const more = moreOf(pending, statH + pending.files.length * rowH);
  const height = statH + pending.files.length * rowH + more.height;
  const listed = [...pending.files.map((file) => file.path), ...more.text === "" ? [] : [more.text]].join(", ");
  return drawing(frame, { height, body: summary + blocks + note + files.join("") + more.svg, alt: `+${pending.added} −${pending.removed} ${words().lines}, ${parts}: ${listed}` });
}

const summaryText = (pending) => words().summary(pending.restore, pending.remove);
function confirmText(ui, pending, opts) {
  const { Box, Text, Button } = ui;
  const more = pending.restore + pending.remove - pending.files.length;
  const said = words();
  const confirm = confirmOf(pending);
  return h(Box, {
    flexDirection: "column",
    borderStyle: "single",
    borderColor: "warning",
    paddingX: 1
  }, h(Text, {
    color: "warning",
    bold: true,
    wrap: "truncate"
  }, `${questionOf(pending)} ${changedText(pending)}`), h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    color: "success"
  }, `+${pending.added}`), h(Text, {
    color: "error"
  }, `−${pending.removed}`), h(Text, null, summaryText(pending))), pending.files.map((file, index) => h(Text, {
    key: `cp-path-${index}`,
    dimColor: true,
    wrap: "truncate-start"
  }, `› ${file.path}${file.isRemoved ? ` (${said.willDelete})` : ""}`)), more > 0 && h(Text, {
    dimColor: true
  }, said.more(more)), notesOf(pending).map((note, index) => h(Text, {
    key: `cp-note-${index}`,
    dimColor: true,
    wrap: "wrap"
  }, note)), h(Box, {
    flexDirection: "row",
    columnGap: 1,
    marginTop: 1
  }, h(Button, {
    key: "cp-confirm",
    variant: "secondary",
    hotkey: confirm.hotkey,
    label: confirm.label,
    onPress: opts.actions.onConfirm
  }), h(Button, {
    key: "cp-cancel",
    variant: "secondary",
    hotkey: said.cancel.hotkey,
    label: said.cancel.label,
    autoFocus: true,
    onPress: opts.actions.onCancel
  })));
}
function glyphOf(meta) {
  if (meta.isSafety === true)
    return "◆";
  return meta.isUndone === true ? "○" : "●";
}
function rowText(ui, view, spec) {
  const { Box, Text, Button } = ui;
  const entry = view.entries[spec.index];
  if (entry === undefined)
    return null;
  const meta = spec.opts.meta[entry.ref] ?? {};
  const named = titleOf(entry, spec.opts.meta);
  const isUndone = meta.isUndone === true;
  const glyph = glyphOf(meta);
  const facts = [ago(spec.opts.now - entry.at), meta.files ? words().files(meta.files) : "", (meta.tools ?? []).join(" ")].filter((part) => part !== "");
  return h(Box, {
    key: `cp-row-${spec.index}`,
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    ...spec.index === 0 && !isUndone ? { color: "claude" } : { dimColor: true }
  }, glyph), h(Box, {
    flexDirection: "column",
    flexGrow: 1
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    bold: !isUndone,
    dimColor: isUndone,
    strikethrough: isUndone
  }, named.title), h(Text, {
    dimColor: true
  }, facts.join(" · "))), h(Text, {
    wrap: "truncate",
    dimColor: isUndone,
    strikethrough: isUndone
  }, named.label)), h(Button, {
    key: `cp-undo-${spec.index}`,
    variant: "secondary",
    dimColor: view.isBusy,
    label: words().undo,
    onPress: () => spec.opts.actions.onUndo(entry)
  }));
}
function textPane(ui, view, opts) {
  const { Box, Text } = ui;
  return h(Box, {
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 1
  }, h(Text, {
    bold: true,
    dimColor: true
  }, words().title), h(Text, {
    dimColor: true
  }, headerMeta(view, opts.now))), h(Text, null, " "), statusRow(ui, view, opts.actions), view.pending !== null && confirmText(ui, view.pending, opts), view.pending === null && view.entries.length === 0 && h(Text, {
    dimColor: true
  }, emptyText()), view.pending === null && view.entries.map((_, index) => rowText(ui, view, { index, opts })));
}

const LABEL_MAX = 60;
const WIDTH = { min: 240, max: 860 };
const CARD_RESERVE = 6;
const ago = (ms) => words().ago(ms);
function clip(text, max = LABEL_MAX) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
const changedText = (pending) => words().changed(pending.restore + pending.remove);
const confirmOf = (pending) => words().confirm(pending.restore + pending.remove);
function notesOf(pending) {
  const said = words();
  return [pending.commits > 0 ? said.commitsKept(pending.commits) : "", pending.isIndexMoved ? said.indexBack : "", said.ignoredKept].filter((note) => note !== "");
}
const emptyText = () => `${words().emptyLead} · ${words().emptyRest}`;
const targetOf = (turn, label, max = LABEL_MAX) => turn === null || turn === undefined ? `"${clip(label, max)}"` : words().turn(turn);
const QUESTION_LABEL_MAX = 40;
const questionOf = (pending) => words().question(targetOf(pending.turn, pending.entry.label, QUESTION_LABEL_MAX));
function titleOf(entry, meta) {
  const own = meta[entry.ref] ?? {};
  const prefix = SAFETY_PREFIXES.find((start) => entry.label.startsWith(start));
  if (own.isSafety === true || prefix !== undefined)
    return { title: words().beforeUndo, label: entry.label.slice((prefix ?? words().safetyPrefix).length) };
  return { title: own.turn === undefined ? words().saved : words().turn(own.turn), label: entry.label };
}
const headerMeta = (view, now) => view.entries[0] === undefined ? "" : words().headerMeta(view.entries.length, ago(now - view.entries[0].at));
const motion = paneMotion();
function picture(ui, drawing, key, opts) {
  const { Svg } = ui;
  return h(Svg, {
    key,
    ...motion.pic(key, drawing, opts)
  });
}
function confirmCard(ui, pending, opts) {
  const { Box, Button } = ui;
  const frame = { width: svgWidth(opts.look.columns, { ...WIDTH, reserve: CARD_RESERVE }), mode: opts.look.theme.mode };
  const said = words();
  const head = headSvg(frame, { label: said.undo, meta: said.undoMeta, lead: questionOf(pending), rest: changedText(pending) });
  const confirm = confirmOf(pending);
  return h(Box, {
    flexDirection: "column",
    borderStyle: "single",
    borderColor: boxColor(opts.look.theme, "amber", "line"),
    paddingX: 2,
    paddingY: 1,
    rowGap: 1
  }, picture(ui, head, "cp-card-head"), picture(ui, diffstatSvg(frame, pending), "cp-card-stat"), notesOf(pending).map((note, index) => h(ui.Text, {
    key: `cp-note-${index}`,
    dimColor: true,
    wrap: "wrap"
  }, note)), h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Button, {
    key: "cp-confirm",
    variant: "secondary",
    hotkey: confirm.hotkey,
    label: confirm.label,
    onPress: opts.actions.onConfirm
  }), h(Button, {
    key: "cp-cancel",
    variant: "secondary",
    hotkey: said.cancel.hotkey,
    label: said.cancel.label,
    autoFocus: true,
    onPress: opts.actions.onCancel
  })));
}
function rowSpecs(view, opts) {
  const last = view.entries.length - 1;
  return view.entries.map((entry, index) => ({
    ...titleOf(entry, opts.meta),
    when: ago(opts.now - entry.at),
    meta: opts.meta[entry.ref] ?? {},
    isNewest: index === 0,
    isFirst: index === 0,
    isLast: index === last
  }));
}
function rowPicture(ui, row) {
  const { when, ...shows } = row.spec;
  return picture(ui, rowSvg(row.frame, { ...row.spec, isStacked: row.isStacked }), `cp-svg-${row.ref}`, { isRow: true, shows: { ...shows, isStacked: row.isStacked, frame: row.frame, isAged: when !== "" } });
}
function timeline(ui, view, opts) {
  const { Box } = ui;
  const frame = { width: svgWidth(opts.look.columns, WIDTH), mode: opts.look.theme.mode };
  const specs = rowSpecs(view, opts);
  const isStacked = specs.some((spec) => !rowFits(frame, spec));
  return h(Box, {
    flexDirection: "column"
  }, view.entries.map((entry, index) => {
    const spec = specs[index];
    const drawing = rowPicture(ui, { frame, spec, isStacked, ref: entry.ref });
    return PressRow(ui, { box: `cp-row-${index}`, key: `cp-undo-${index}`, drawing, onPress: () => opts.actions.onUndo(entry) });
  }));
}
const STATUS_LOOK = {
  busy: { dimColor: true },
  success: { color: "success" },
  error: { color: "error" },
  info: { dimColor: true }
};
function statusRow(ui, view, actions) {
  const { Box, Text, Button } = ui;
  const status = view.status;
  if (status === null)
    return null;
  const look = STATUS_LOOK[status.tone];
  const glyph = { busy: "◐", success: "✓", error: "✕", info: "›" }[status.tone];
  const redo = status.redo;
  return h(Box, {
    flexDirection: "row",
    columnGap: 1,
    alignItems: "center"
  }, h(Text, {
    ...look
  }, glyph), h(Text, null, status.text), redo !== undefined && h(Button, {
    key: "cp-redo",
    plain: true,
    hotkey: "y",
    label: words().redo,
    onPress: () => actions.onUndo(redo)
  }));
}
function paneTree(ui, view, opts) {
  const { Box } = ui;
  if (!opts.look.isRich)
    return textPane(ui, view, opts);
  const frame = { width: svgWidth(opts.look.columns, WIDTH), mode: opts.look.theme.mode };
  const count = view.entries.length;
  const said = words();
  const turns = view.entries.filter((entry) => titleOf(entry, opts.meta).title !== said.beforeUndo).length;
  const lead = count === 0 ? { lead: said.emptyLead, rest: said.emptyRest, joiner: " · " } : { lead: said.turnsSaved(turns), rest: "" };
  const newest = view.entries[0];
  const meta = newest !== undefined && turns === count ? said.newest(ago(opts.now - newest.at)) : headerMeta(view, opts.now);
  const head = headSvg(frame, { label: said.title, meta, ...lead });
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, picture(ui, head, "cp-head", { shows: { lead, turns, count, frame } }), statusRow(ui, view, opts.actions), view.pending !== null && confirmCard(ui, view.pending, opts), view.pending === null && count > 0 && timeline(ui, view, opts));
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

const PANE$1 = "checkpoints";
function hookStage(on) {
  on("state.set", { plugin: "modz", key: "stage" }, async ($, e, next) => {
    const done = await next(e);
    if (isOffStage(e.value, HUB_PANE))
      await $.ui.close({ id: PANE$1 });
    return done;
  }).catch(($, e, next) => next(e));
}

const READERS = new Set([
  "ls",
  "cat",
  "head",
  "tail",
  "less",
  "wc",
  "grep",
  "rg",
  "ag",
  "pwd",
  "echo",
  "printf",
  "which",
  "type",
  "file",
  "stat",
  "du",
  "df",
  "tree",
  "diff",
  "cmp",
  "jq",
  "date",
  "env",
  "whoami",
  "uname",
  "true",
  "test",
  "[",
  "realpath",
  "dirname",
  "basename",
  "sort",
  "uniq",
  "cut",
  "column",
  "nl",
  "od",
  "xxd",
  "hexdump",
  "shasum",
  "md5",
  "sha256sum",
  "ps",
  "cd",
  "sleep"
]);
const GIT_READERS = new Set(["status", "log", "diff", "show", "rev-parse", "ls-files", "ls-tree", "blame", "grep", "describe", "shortlog", "cat-file", "for-each-ref", "reflog", "remote", "config", "branch"]);
const SEPARATORS = /&&|\|\||;|\||\n/;
const FILE_REDIRECT = /(?<!>)>>?(?!>|\s*(?:&|\/dev\/null))/;
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;
const FIND_WRITES = /\s-(?:delete|exec|execdir|ok|fprint)\b/;
const SED_IN_PLACE = /\s(?:-[a-zA-Z]*i|--in-place)/;
function isReadingSegment(segment) {
  if (FILE_REDIRECT.test(segment.replace(/\d>&\d/g, "")))
    return false;
  const words = segment.trim().split(/\s+/).filter((word) => !ASSIGNMENT.test(word));
  const [name = "", verb = ""] = words;
  if (name === "")
    return true;
  if (name === "git")
    return GIT_READERS.has(words.find((word, index) => index > 0 && !word.startsWith("-")) ?? verb);
  if (name === "find")
    return !FIND_WRITES.test(segment);
  if (name === "sed")
    return !SED_IN_PLACE.test(segment);
  return READERS.has(name);
}
const isReadOnly = (command) => command.split(SEPARATORS).every(isReadingSegment);

const WRITE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);
const PROMPT_LABEL_MAX = 100;
const turn = { isArmed: false, label: "", pending: null, number: 0, ref: null, files: new Set, tools: new Set };
function armTurn(text) {
  Object.assign(turn, { isArmed: true, label: clip(text.split(`
`)[0]?.trim() || words().promptFallback, PROMPT_LABEL_MAX), ref: null });
  turn.number += 1;
  turn.files.clear();
  turn.tools.clear();
}
function isWrite(e) {
  const call = e;
  const path = call.file_path ?? call.notebook_path;
  if (WRITE_TOOLS.has(String(call.tool))) {
    if (typeof path === "string")
      turn.files.add(path);
    return true;
  }
  return call.tool === "Bash" && !isReadOnly(String(call.command ?? ""));
}

const PANE = "checkpoints";
const TOGGLE = "checkpoint";
const STORE_KEY = "checkpoint.enabled";
const META_KEY = "checkpoint.meta";
const GIT_TIMEOUT_MS = 60000;
const EMPTY_VIEW = { entries: [], status: null, isBusy: false, pending: null };
const failed = () => ({ text: words().failed, tone: "error" });
const viewAtom = atom({ plugin: "checkpoint", key: "view" }, EMPTY_VIEW);
const enabledAtom = atom({ plugin: "checkpoint", key: "isEnabled" }, true);
const metaAtom = atom({ plugin: "checkpoint", key: "meta" }, {});
const HUB = { plugin: "checkpoint", key: "hub" };
const HOME = { plugin: "checkpoint", key: "home" };
const themeAtom = atom({ plugin: "checkpoint", key: "theme" }, AUTO);
const tools = { git: undefined };
function runnerOf($) {
  return (argv, init) => $.process.run(argv, { timeoutMs: GIT_TIMEOUT_MS, ...init });
}
const repos = new Map;
async function repoOf($, isProbeOnly = false) {
  const cwd = await $.session.cwd();
  let repo = repos.get(cwd) ?? null;
  if (repo === null) {
    const home = await $.env.get("HOME") || await $.env.get("USERPROFILE") || "";
    tools.git ??= await gitBinary(runnerOf($), cwd);
    if (tools.git === null)
      return null;
    repo = await locate(runnerOf($), { cwd, home, bin: tools.git, isProbeOnly });
    if (repo !== null)
      repos.set(cwd, repo);
  }
  return repo === null ? null : { ...repo, scope: scopeOf(repo.root, await $.session.id()) };
}
async function writeHub($, entries) {
  const now = await $.clock.now();
  const shown = hubOf(entries);
  const { value } = await $.state.get(HUB);
  if (value !== undefined && value.detail === shown.detail && value.tone === shown.tone)
    return;
  const card = { pane: HUB_PANE, ...shown, at: now };
  await $.state.set(HUB, card);
}
async function greetHub($) {
  try {
    const repo = await repoOf($, true);
    await writeHub($, repo === null ? [] : await list(runnerOf($), repo));
  } catch (error) {
    $.ui.log(`checkpoint: could not count checkpoints (${error instanceof Error ? error.message : "unknown"})`, { to: "debug" });
  }
}
const refName = async ($) => String(await $.clock.now());
async function setView($, change) {
  await update($, viewAtom, (view) => ({ ...view, ...change }));
}
async function saveMeta($, change) {
  await update($, metaAtom, (meta) => change(meta ?? {}));
  await $.store.set(META_KEY, await read($, metaAtom));
}
async function take($, label) {
  try {
    const repo = await repoOf($);
    if (repo === null) {
      $.ui.log("checkpoint: no working git, or folder too broad for a shadow copy; skipped", { to: "debug" });
      return null;
    }
    const ref = await refName($);
    await snapshot(runnerOf($), repo, { ref, label });
    const full = `${repo.scope}${ref}`;
    const entries = await prune(runnerOf($), repo);
    const number = turn.number;
    await saveMeta($, (meta) => ({ ...keepListed(meta, entries), [full]: { turn: number } }));
    await setView($, { entries });
    await writeHub($, entries);
    return full;
  } catch (error) {
    $.ui.log(`checkpoint: snapshot failed (${error instanceof Error ? error.message : "unknown"})`, { to: "debug" });
    return null;
  }
}
async function ask($, entry) {
  if ((await read($, viewAtom)).isBusy)
    return;
  await setView($, { isBusy: true, pending: null, status: { text: words().checking, tone: "busy" } });
  let change = { status: failed() };
  try {
    const repo = await repoOf($);
    const changes = repo === null ? null : await plan(runnerOf($), repo, entry.commit);
    const taken = repo === null ? null : await takenWith(runnerOf($), repo, entry.commit);
    const isIndexMoved = taken !== null && taken.index !== null && taken.index !== changes?.index;
    if (repo === null || changes === null)
      change = { status: { text: words().noRepo, tone: "error" } };
    else if (changes.restore.length + changes.remove.length === 0 && !isIndexMoved)
      change = { status: { text: words().alreadyThere, tone: "info" } };
    else {
      const stats = await numstat(runnerOf($), repo, { tree: changes.tree, commit: entry.commit });
      const turnOf = (await read($, metaAtom))[entry.ref]?.turn ?? null;
      const commits = await madeSince(runnerOf($), repo, taken?.head ?? null);
      change = { status: null, pending: pendingOf(entry, { changes, stats, turn: turnOf, commits, isIndexMoved }) };
    }
  } catch (error) {
    $.ui.log(`checkpoint: undo check failed (${error instanceof Error ? error.message : "unknown"})`, { to: "debug" });
  }
  await setView($, { isBusy: false, ...change });
}
async function restore($, entry) {
  const repo = await repoOf($);
  if (repo === null)
    return { text: words().noRepo, tone: "error" };
  const run = runnerOf($);
  const changes = await plan(run, repo, entry.commit);
  const { index } = await takenWith(run, repo, entry.commit);
  const total = changes.restore.length + changes.remove.length;
  if (total === 0 && (index === null || index === changes.index))
    return { text: words().alreadyThere, tone: "info" };
  const safety = await refName($);
  const label = `${words().safetyPrefix}${clip(entry.label)}`;
  const commit = await snapshot(run, repo, { ref: safety, label });
  await apply(run, repo, { commit: entry.commit, plan: changes, index });
  const entries = await prune(run, repo);
  const safetyRef = `${repo.scope}${safety}`;
  await saveMeta($, (meta) => keepListed(markUndone(meta, { entries, target: entry, safetyRef }), entries));
  await setView($, { entries });
  await writeHub($, entries);
  const number = (await read($, metaAtom))[entry.ref]?.turn;
  const redo = entries.find((item) => item.ref === safetyRef) ?? { ref: safetyRef, commit, at: await $.clock.now(), label };
  return { text: words().restored(total, targetOf(number, entry.label)), tone: "success", redo };
}
async function confirm($) {
  const view = await read($, viewAtom);
  if (view.isBusy || view.pending === null)
    return;
  await setView($, { isBusy: true, status: { text: words().undoing, tone: "busy" } });
  let status = failed();
  try {
    status = await restore($, view.pending.entry);
  } catch (error) {
    $.ui.log(`checkpoint: undo failed (${error instanceof Error ? error.message : "unknown"})`, { to: "debug" });
  }
  await setView($, { isBusy: false, pending: null, status });
}
async function wantedOn($, arg) {
  if (arg === "on")
    return true;
  if (arg === "off")
    return false;
  return !await read($, enabledAtom);
}
async function toggle($, arg) {
  const isOn = await wantedOn($, arg);
  await update($, enabledAtom, () => isOn);
  await $.store.set(STORE_KEY, isOn);
  $.ui.toast(words().toggled(isOn));
}
async function refresh($) {
  try {
    const repo = await repoOf($);
    const entries = repo === null ? [] : await list(runnerOf($), repo);
    await setView($, { entries, status: null, pending: null });
    await writeHub($, entries);
  } catch {
    $.ui.log("checkpoint: could not list checkpoints", { to: "debug" });
  }
}
async function openPane($, isFocused = false) {
  await refresh($);
  motion.reset();
  const opened = await $.ui.open({ id: PANE, title: words().title, ...isFocused ? { focus: true } : {} });
  try {
    const isHubOn = (await $.state.get({ plugin: "modz", key: "isOn" })).value === true;
    if (opened.isPlaced && isHubOn)
      await $.state.set({ plugin: "checkpoint", key: "shown" }, shownOf(HUB_PANE, await $.clock.now()));
  } catch (error) {
    $.ui.log(`checkpoint: shown failed (${String(error)})`, { to: "debug" });
  }
}
async function askForPage($, isFocused = false) {
  const drawn = (await $.state.get({ plugin: "modz", key: "drawn" })).value;
  if (!Array.isArray(drawn) || !drawn.includes(HUB_PANE))
    return openPane($, isFocused);
  await $.state.set(HOME, { pane: HUB_PANE, at: await $.clock.now() });
}
async function onAct($, value) {
  const press = value ?? {};
  if (press.page !== HUB_PANE)
    return;
  if (press.action === "confirm")
    return confirm($);
  if (press.action === "cancel")
    return setView($, { pending: null, status: null });
  if (press.action !== "undo")
    return;
  const view = await read($, viewAtom);
  const entry = [...view.entries, ...view.status?.redo === undefined ? [] : [view.status.redo]].find((each) => each.ref === press.arg);
  if (entry !== undefined)
    await ask($, entry);
}
function hookCommands(on) {
  on("session.start", async ($, e, next) => {
    setLang(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    try {
      const saved = await $.store.get(STORE_KEY);
      await update($, enabledAtom, () => saved !== false);
      const meta = await $.store.get(META_KEY);
      if (typeof meta === "object" && meta !== null)
        await update($, metaAtom, () => meta);
      const pinned = await $.env.get("MODZ_THEME").catch(() => {
        return;
      });
      await update($, themeAtom, () => themeFrom(pinned));
      await $.command.register({ name: TOGGLE, description: words().toggleLine, argumentHint: "[on|off]" });
      await $.command.register({ name: PANE, description: words().paneLine });
    } catch {
      $.ui.log("checkpoint: could not load settings", { to: "debug" });
    }
    const done = await next(e);
    await greetHub($);
    const home = await $.env.get("HOME") || await $.env.get("USERPROFILE") || "";
    dropStale(runnerOf($), home).catch((cause) => $.ui.log(`checkpoint: old stores could not be dropped (${String(cause)})`, { to: "debug" }));
    return done;
  });
  on("command.run", { command: TOGGLE }, async ($, e) => (await toggle($, e.args.trim().toLowerCase()), {}));
  on("command.run", { command: PANE }, async ($) => (await askForPage($), {}));
}
function hookTurns(on) {
  on("prompt.submit", async ($, e, next) => (armTurn(e.text), next(e))).catch(($, e, next) => next(e));
  on("tool.call", async ($, e, next) => {
    const glyph = glyphOf$1(String(e.tool));
    if (glyph !== undefined)
      turn.tools.add(glyph);
    if (!isWrite(e))
      return next(e);
    if (turn.isArmed && await read($, enabledAtom)) {
      turn.isArmed = false;
      turn.pending = take($, turn.label).then((ref) => void (turn.ref = ref));
    }
    if (turn.pending !== null)
      await turn.pending;
    return next(e);
  }).catch(($, e, next) => next(e));
  on("turn.complete", async ($, e, next) => {
    const ref = turn.ref;
    if (e.agentId === undefined && ref !== null) {
      const done = { files: turn.files.size, tools: sortGlyphs(turn.tools) };
      await saveMeta($, (meta) => ({ ...meta, [ref]: { ...meta[ref], ...done } })).catch(() => $.ui.log("checkpoint: could not keep turn notes", { to: "debug" }));
    }
    return next(e);
  });
}
const register = (on) => {
  hookCommands(on);
  hookTurns(on);
  hookStage(on);
  on("state.set", { plugin: "modz", key: "open" }, async ($, e, next) => {
    const done = await next(e);
    if (isOpenFor(e.value, HUB_PANE))
      await askForPage($, true);
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "modz", key: "stage" }, async ($, e, next) => {
    const done = await next(e);
    const drawn = (await $.state.get({ plugin: "modz", key: "drawn" })).value;
    if (isOpenFor(e.value, HUB_PANE) && Array.isArray(drawn) && drawn.includes(HUB_PANE))
      await refresh($);
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "modz", key: "act" }, async ($, e, next) => {
    const done = await next(e);
    const value = e.value;
    $.clock.after(0, () => void onAct($, value).catch((cause) => $.ui.log(`checkpoint: a press on the hub's page failed (${String(cause)})`, { to: "debug" })));
    return done;
  }).catch(($, e, next) => next(e));
  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) => {
    const actions = {
      onUndo: (entry) => void ask($, entry),
      onConfirm: () => void confirm($),
      onCancel: () => void setView($, { pending: null, status: null })
    };
    const look = { theme: await read($, themeAtom), columns: e.props.bodyColumns, isRich: e.surface !== "terminal" };
    const isHubOn = (await $.state.get({ plugin: "modz", key: "isOn" })).value === true;
    const goHome = () => void $.clock.now().then((at) => $.state.set(HOME, { at })).catch(() => $.ui.log("checkpoint: could not go back to MODZ", { to: "debug" }));
    const ui = $.ui.resolve(e);
    const tree = paneTree(ui, await read($, viewAtom), { now: await $.clock.now(), meta: await read($, metaAtom), look, actions });
    return pinned(e, withHome(ui, tree, isHubOn ? goHome : null));
  });
};

export { register };
