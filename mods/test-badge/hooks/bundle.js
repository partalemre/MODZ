// Built by `bin/modz build` from the files beside it. Never edited by hand.
import { atom, read, update } from 'claude-code';

const ANSI = /\u001b\[[0-9;?]*[A-Za-z]/g;
const MAX_FAILURES = 50;
const MESSAGE_MAX = 160;
const E2E_PATH = /(^|\/)(e2e|integration_test|integration-tests|cypress|playwright)(\/|$)|\.e2e\.|\.cy\.|\.pw\./;
const clean = (output) => output.replace(ANSI, "").replace(/\r/g, "");
function firstLine(text) {
  const line = text.trim().split(`
`)[0]?.trim() ?? "";
  return line.length > MESSAGE_MAX ? `${line.slice(0, MESSAGE_MAX - 1)}…` : line;
}
function relative(path, ctx) {
  const bare = path.replace(/\\/g, "/").replace(/^file:\/\//, "").replace(/^\.\//, "");
  const prefix = `${ctx.root.replace(/\\/g, "/").replace(/\/$/, "")}/`;
  return bare.startsWith(prefix) ? bare.slice(prefix.length) : bare;
}
function testSuite(file) {
  return file !== null && E2E_PATH.test(file) ? "e2e" : "unit";
}
function failure(spec, ctx) {
  const file = spec.file === null ? null : relative(spec.file, ctx);
  return { suite: spec.suite ?? testSuite(file), file, line: spec.line, name: firstLine(spec.name), message: firstLine(spec.message), durationMs: spec.durationMs ?? null };
}
function sections(lines, start) {
  const out = [];
  for (const line of lines) {
    const head = start.exec(line);
    if (head !== null)
      out.push({ head, body: [] });
    else
      out.at(-1)?.body.push(line);
  }
  return out;
}
const firstText = (body) => body.find((line) => line.trim() !== "")?.trim() ?? "";
function firstMatch(body, re) {
  for (const line of body) {
    const found = re.exec(line);
    if (found !== null)
      return found;
  }
  return null;
}
const lineNumber = (text) => text === undefined ? null : Number(text);
const MS_PER_SECOND = 1000;
function durationOf(value, unit) {
  if (value === undefined)
    return null;
  return unit === "s" ? Number(value) * MS_PER_SECOND : Number(value);
}

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const pick = (table) => table[current];
const upper = (text) => text.toLocaleUpperCase(current);

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const TR = {
  ago: { s: (n) => `${n} sn önce`, m: (n) => `${n} dk önce`, h: (n) => `${n} sa önce` },
  took: (seconds) => `${seconds} sn sürdü`,
  seconds: (ms, second) => `${(ms / second).toFixed(1).replace(".", ",")} sn`,
  testsCount: (passed, total) => `testler ${passed}/${total}`,
  testsTimeout: "testler çok uzun sürdü",
  testsNotStarted: "testler başlamadı",
  testsPassed: "testler geçti",
  testsFailed: "testler kaldı",
  testsRunning: "testler çalışıyor…",
  runningTail: "çalışıyor…",
  running: "çalışıyor",
  testTimeout: "test çok uzun sürdü",
  testNotStarted: "test başlamadı",
  testPassed: "test geçti",
  testFailed: "test kaldı",
  testRunning: "test çalışıyor",
  passedOf: (passed, total) => `${passed}/${total} geçti`,
  failedOf: (failed, total) => `${failed}/${total} kaldı`,
  lintTimeout: "yazım kuralları çok uzun sürdü",
  lintNotStarted: "yazım kuralları başlamadı",
  lintClean: "yazım kuralları tamam",
  lintErrors: (errors) => `yazım kuralları: ${errors} hata`,
  lintFailed: "yazım kuralları kaldı",
  verdict: {
    running: "Testler çalışıyor…",
    notRun: "Henüz test çalıştırılmadı",
    noCommand: "Test komutu bulunamadı",
    everything: "Her şey yolunda",
    passHere: "Bu bilgisayarda tüm testler geçti",
    passGithubBusy: "Testler geçti, GitHub hâlâ kontrol ediyor",
    lintClean: "Yazım kuralları denetimi temiz",
    failing: (n) => `${n} test başarısız`,
    testsFailing: "Testler başarısız",
    testsTooLong: "Testler çok uzun sürdü, durduruldu",
    testsNoStart: "Testler başlatılamadı",
    lintProblems: (n) => `${n} yazım kuralı sorunu`,
    lintFailing: "Yazım kuralları denetimi sorun buldu",
    lintTooLong: "Yazım kuralları denetimi çok uzun sürdü, durduruldu",
    lintNoStart: "Yazım kuralları denetimi başlatılamadı",
    githubFailing: (n) => `GitHub'da ${n} otomatik kontrol başarısız`,
    both: (tests, checks) => `${tests} test ve GitHub'da ${checks} otomatik kontrol başarısız`
  },
  local: {
    title: "Bu bilgisayarda",
    tests: "Testler",
    lint: "Yazım kuralları denetimi (lint)",
    notRun: "henüz çalışmadı",
    running: "çalışıyor…",
    passed: "geçti",
    nPassed: (n) => `${n} test geçti`,
    nFailed: (failed, total) => `${failed}/${total} başarısız`,
    failed: "başarısız",
    failedYet: (passed) => `başarısız · ${passed} geçti`,
    clean: "temiz",
    problems: (n) => `${n} sorun`,
    tooLong: "çok uzun sürdü",
    noStart: "başlatılamadı",
    when: "Claude bir kaynak dosyayı değiştirince kendiliğinden çalışır.",
    none: "Bu projede test komutu yok. Bakılan yerler: package.json, pyproject.toml, go.mod, Cargo.toml, pubspec.yaml, phpunit.xml. Claude'dan test eklemesini isteyin ya da bu modun ayarlarına bir test komutu yazın.",
    runBoth: "Testleri ve yazım kuralları denetimini çalıştır",
    runTests: "Testleri çalıştır",
    runLint: "Yazım kuralları denetimini çalıştır",
    lookAgain: "Yeniden ara"
  },
  github: {
    title: "GitHub'da",
    checked: (when) => `${when} bakıldı`,
    pr: (n) => `Değişiklik isteği #${n}`,
    noPr: "Bu çalışma dalı için izlenen bir değişiklik isteği (pull request) yok. Biri açılınca GitHub'daki otomatik kontrolleri burada görünür.",
    asking: "GitHub'a soruluyor…",
    starting: "Henüz kontrol görünmüyor; GitHub başlatıyor olabilir.",
    noChecks: "GitHub bu değişiklik isteği için hiç otomatik kontrol bildirmedi. Yani orada hiçbir şey test edilmedi; geçerli olan yalnızca bu bilgisayardaki testler.",
    allSkipped: "GitHub bu değişiklik isteği için bütün kontrolleri atladı.",
    failing: (failing, total) => `${total} kontrolün ${failing} tanesi başarısız.`,
    running: (done, total) => `${total} kontrolün ${done} tanesi bitti, gerisi sürüyor.`,
    allPassed: (total) => `${total} kontrolün hepsi geçti.`,
    stopped: (passed, total) => `${total} kontrolün ${passed} tanesi geçti; 90 dakika sonra izleme durdu.`,
    merged: "Bu değişiklik isteği ana çalışma dalına katıldı.",
    closed: "Bu değişiklik isteği kapatıldı."
  },
  chips: { all: "Hepsi", unit: "Birim", e2e: "Akış", lint: "Yazım kuralları", typecheck: "Tür" },
  suites: { unit: "birim testi", e2e: "akış testi", lint: "yazım kuralları denetimi", typecheck: "tür denetimi" },
  checkNames: { tests: "testler", lint: "yazım kuralları denetimi" },
  whyTimeout: "zaman aşımına uğradı",
  whyNotStarted: "başlatılamadı",
  whyUnread: "kaldı; hata yeri okunamadı",
  noFile: "dosya belirtilmemiş",
  errorCount: (count) => `${count} hata`,
  details: "Ayrıntı",
  compileError: "kod derlenemedi",
  paneTitle: "Testler",
  openCopied: (place) => `Açılamadı, kopyalandı: ${place}`,
  openFailed: (place) => `Açılamadı: ${place}`,
  commandRunning: "test-badge: testler ve yazım kuralları denetimi çalışıyor",
  commandDetails: "test-badge: ayrıntılar açıldı",
  commandSwitched: (isOn) => `test-badge ${isOn ? "açık" : "kapalı"}`,
  commandHelp: "Claude kodu düzenleyince testleri ve yazım kuralları denetimini kendiliğinden çalıştırır: aç/kapa; run şimdi başlatır, details sonuçları gösterir",
  consent: {
    header: "Testler",
    question: (commands, root) => `Kod düzenlenen her turdan sonra ${root} içinde şunlar kendiliğinden çalışsın mı?
${commands.join(`
`)}`,
    yes: "Evet, çalıştır",
    no: "Hayır"
  },
  fixSuggestion: "test-badge’in bulduğu kalan testleri düzelt",
  fixContext: (command, root) => `test-badge, ${root} içinde \`${command}\` çalıştırdı ve kaldı. Çıktı:`,
  ci: {
    eyebrow: "GitHub",
    allPassed: (passed, total) => `GitHub ${passed}/${total} geçti`,
    failing: (passed, total, failing) => `GitHub ${passed}/${total} · ${failing} başarısız`,
    running: (passed, total, pending) => `GitHub ${passed}/${total} · ${pending} sürüyor`,
    ended: (passed, total) => `GitHub ${passed}/${total} · izleme durdu`,
    waiting: "GitHub bekleniyor",
    merged: (n) => `Değişiklik isteği #${n} birleşti`,
    closed: (n) => `Değişiklik isteği #${n} kapandı`,
    states: { pending: "sürüyor", pass: "geçti", fail: "başarısız", skipped: "atlandı" },
    newTalk: (count) => `${count} yeni inceleme/yorum`,
    logs: "Ayrıntı",
    openPr: "Değişiklik isteğini aç",
    askFix: "Claude düzeltsin",
    dismiss: "Kapat",
    cardHeadline: (names) => `GitHub'daki otomatik kontroller başarısız: ${names}`,
    more: (count) => `+${count}`,
    notifyPassed: (n, passed, total) => `GitHub'daki otomatik kontroller geçti · #${n} · ${passed}/${total}`,
    notifyFailed: (n, names) => `GitHub'daki otomatik kontroller başarısız: ${names} · #${n}`,
    fixPrompt: (n, url, lines) => `PR #${n} için CI kaldı (${url}). Kalan kontroller:
${lines}
Nedenini bul (örneğin gh pr checks ${n} ve gh run view --log-failed ile) ve düzelt.`
  }
};
const EN = {
  ago: { s: (n) => `${n}s ago`, m: (n) => `${n}m ago`, h: (n) => `${n}h ago` },
  took: (seconds) => `took ${seconds}s`,
  seconds: (ms, second) => `${(ms / second).toFixed(1)} s`,
  testsCount: (passed, total) => `tests ${passed}/${total}`,
  testsTimeout: "tests took too long",
  testsNotStarted: "tests didn't start",
  testsPassed: "tests passed",
  testsFailed: "tests failed",
  testsRunning: "tests running…",
  runningTail: "running…",
  running: "running",
  testTimeout: "tests took too long",
  testNotStarted: "tests didn't start",
  testPassed: "tests passed",
  testFailed: "tests failed",
  testRunning: "tests running",
  passedOf: (passed, total) => `${passed}/${total} passed`,
  failedOf: (failed, total) => `${failed}/${total} failed`,
  lintTimeout: "style rules took too long",
  lintNotStarted: "style rules didn't start",
  lintClean: "style rules ok",
  lintErrors: (errors) => `style rules: ${plural(errors, "error", "errors")}`,
  lintFailed: "style rules failed",
  verdict: {
    running: "Running your tests…",
    notRun: "No tests run yet",
    noCommand: "No test command found",
    everything: "Everything passes",
    passHere: "All tests pass on this computer",
    passGithubBusy: "Tests pass, GitHub is still checking",
    lintClean: "The style-rule check is clean",
    failing: (n) => plural(n, "test", "tests") + " failing",
    testsFailing: "Tests are failing",
    testsTooLong: "Tests took too long and were stopped",
    testsNoStart: "Tests couldn't start",
    lintProblems: (n) => plural(n, "style-rule problem", "style-rule problems"),
    lintFailing: "The style-rule check found problems",
    lintTooLong: "The style-rule check took too long and was stopped",
    lintNoStart: "The style-rule check couldn't start",
    githubFailing: (n) => `${plural(n, "automatic check", "automatic checks")} failing on GitHub`,
    both: (tests, checks) => `${plural(tests, "test", "tests")} and ${plural(checks, "automatic check", "automatic checks")} on GitHub failing`
  },
  local: {
    title: "On this computer",
    tests: "Tests",
    lint: "Style-rule check (lint)",
    notRun: "not run yet",
    running: "running…",
    passed: "passed",
    nPassed: (n) => `${plural(n, "test", "tests")} passed`,
    nFailed: (failed, total) => `${failed} of ${total} failed`,
    failed: "failed",
    failedYet: (passed) => `failed · ${passed} passed`,
    clean: "clean",
    problems: (n) => plural(n, "problem", "problems"),
    tooLong: "took too long",
    noStart: "couldn't start",
    when: "Runs by itself after Claude changes a source file.",
    none: "This project has no test command. Looked in package.json, pyproject.toml, go.mod, Cargo.toml, pubspec.yaml and phpunit.xml. Ask Claude to add tests, or set a test command in this mod's settings.",
    runBoth: "Run tests and style-rule check",
    runTests: "Run tests",
    runLint: "Run style-rule check",
    lookAgain: "Look again"
  },
  github: {
    title: "On GitHub",
    checked: (when) => `checked ${when}`,
    pr: (n) => `Change request #${n}`,
    noPr: "No change request (pull request) is being followed for this line of work. Once one is open, its automatic checks on GitHub show up here.",
    asking: "Asking GitHub…",
    starting: "No checks yet; GitHub may still be starting them.",
    noChecks: "GitHub reported no automatic checks for this change request. So nothing was tested there; only the tests on this computer count.",
    allSkipped: "GitHub skipped every check on this change request.",
    failing: (failing, total) => `${failing} of ${total} checks failed.`,
    running: (done, total) => `${done} of ${total} checks done, the rest still running.`,
    allPassed: (total) => total === 1 ? "The one check passed." : `All ${total} checks passed.`,
    stopped: (passed, total) => `${passed} of ${total} checks passed; stopped watching after 90 minutes.`,
    merged: "This change request was merged into the main line of work.",
    closed: "This change request was closed."
  },
  chips: { all: "All", unit: "Unit", e2e: "Full-flow", lint: "Style rules", typecheck: "Types" },
  suites: { unit: "unit test", e2e: "full-flow test", lint: "style-rule check", typecheck: "type check" },
  checkNames: { tests: "tests", lint: "style-rule check" },
  whyTimeout: "timed out",
  whyNotStarted: "couldn't start",
  whyUnread: "failed; couldn't tell where",
  noFile: "no file given",
  errorCount: (count) => plural(count, "error", "errors"),
  details: "Details",
  compileError: "code wouldn't build",
  paneTitle: "Tests",
  openCopied: (place) => `Couldn't open it, so copied ${place}`,
  openFailed: (place) => `Couldn't open ${place}`,
  commandRunning: "test-badge: running the tests and the style-rule check",
  commandDetails: "test-badge: details opened",
  commandSwitched: (isOn) => `test-badge ${isOn ? "on" : "off"}`,
  commandHelp: "Runs the tests and the style-rule check by themselves after Claude edits code: on or off; run starts them now, details shows the results",
  consent: {
    header: "Tests",
    question: (commands, root) => `After each turn that edits code, run these on their own in ${root}?
${commands.join(`
`)}`,
    yes: "Yes, run them",
    no: "No"
  },
  fixSuggestion: "Fix the failing checks test-badge found",
  fixContext: (command, root) => `test-badge ran \`${command}\` in ${root} and it failed. Output:`,
  ci: {
    eyebrow: "GitHub",
    allPassed: (passed, total) => `GitHub ${passed}/${total} passed`,
    failing: (passed, total, failing) => `GitHub ${passed}/${total} · ${failing} failing`,
    running: (passed, total, pending) => `GitHub ${passed}/${total} · ${pending} running`,
    ended: (passed, total) => `GitHub ${passed}/${total} · stopped watching`,
    waiting: "Waiting for GitHub",
    merged: (n) => `Change request #${n} merged`,
    closed: (n) => `Change request #${n} closed`,
    states: { pending: "running", pass: "passed", fail: "failed", skipped: "skipped" },
    newTalk: (count) => `${count} new ${count === 1 ? "review or comment" : "reviews or comments"}`,
    logs: "Details",
    openPr: "Open change request",
    askFix: "Ask Claude to fix",
    dismiss: "Dismiss",
    cardHeadline: (names) => `Automatic checks on GitHub failed: ${names}`,
    more: (count) => `+${count}`,
    notifyPassed: (n, passed, total) => `Automatic checks on GitHub passed · #${n} · ${passed}/${total}`,
    notifyFailed: (n, names) => `Automatic checks on GitHub failed: ${names} · #${n}`,
    fixPrompt: (n, url, lines) => `CI failed on PR #${n} (${url}). Failing checks:
${lines}
Find the cause (for example with gh pr checks ${n} and gh run view --log-failed) and fix it.`
  }
};
const words = () => pick({ en: EN, tr: TR });

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const endsWithFile = (path, file) => file !== null && (path === file || path.endsWith(`/${file}`) || file.endsWith(`/${path}`));
const jest = (lines, ctx) => {
  const out = [];
  const times = new Map(lines.flatMap((row) => {
    const timed = /^\s*✕ (.+?) \((\d+) ms\)$/.exec(row);
    return timed === null ? [] : [[timed[1] ?? "", Number(timed[2])]];
  }));
  let file = null;
  for (const { head, body } of sections(lines, /^\s*(?:FAIL\s+(\S+)(?:\s+\([\d.]+ m?s\))?\s*|● (.+))$/)) {
    if (head[1] !== undefined)
      file = head[1];
    const name = head[2];
    if (name === undefined || name.startsWith("Console"))
      continue;
    const frame = firstMatch(body, /^\s*>\s*(\d+)\s*\|/);
    const at = firstMatch(body, /\(?([^\s()]+):(\d+):\d+\)?\s*$/);
    const line = frame?.[1] ?? (at !== null && endsWithFile(at[1] ?? "", file) ? at[2] : undefined);
    const durationMs = times.get(name.split(" › ").at(-1) ?? "") ?? null;
    out.push(failure({ file, line: lineNumber(line), name, message: firstText(body), durationMs }, ctx));
  }
  return out;
};
const vitest = (lines, ctx) => sections(lines, /^\s*FAIL\s+(\S+) > (.+?)(?:\s+(\d+(?:\.\d+)?)(m?s))?$/).map(({ head, body }) => {
  const file = head[1] ?? null;
  const at = firstMatch(body, /❯ (\S+?):(\d+):\d+/);
  const line = at !== null && endsWithFile(at[1] ?? "", file) ? at[2] : undefined;
  const message = firstText(body.filter((row) => !row.includes("⎯")));
  return failure({ file, line: lineNumber(line), name: head[2] ?? "", message, durationMs: durationOf(head[3], head[4]) }, ctx);
});
const pytest$1 = (lines, ctx) => {
  const bodies = new Map(sections(lines, /^_{3,} (.+?) _{3,}$/).map(({ head, body }) => [head[1] ?? "", body]));
  const out = [];
  for (const row of lines) {
    const found = /^(?:FAILED|ERROR) (\S+?)::(\S+)(?: - (.*))?$/.exec(row);
    if (found === null)
      continue;
    const [, file = "", id = "", summary = ""] = found;
    const key = id.replace(/::/g, ".");
    const body = bodies.get(key) ?? [...bodies.entries()].find(([name]) => name.endsWith(key))?.[1] ?? [];
    const at = firstMatch(body, new RegExp(`^${escape(file)}:(\\d+): `));
    const message = summary || (firstMatch(body, /^E\s+(.*)$/)?.[1] ?? "");
    out.push(failure({ file, line: lineNumber(at?.[1]), name: id.replace(/::/g, " › "), message }, ctx));
  }
  return out;
};
function goFile(base, pkg, ctx) {
  if (pkg === undefined || ctx.goModule === null || !pkg.startsWith(ctx.goModule))
    return base;
  const dir = pkg.slice(ctx.goModule.length).replace(/^\//, "");
  return dir === "" ? base : `${dir}/${base}`;
}
const goTest = (lines, ctx) => {
  const out = [];
  lines.forEach((row, index) => {
    const head = /^\s*--- FAIL: (\S+)(?: \((\d+(?:\.\d+)?)s\))?/.exec(row);
    if (head === null)
      return;
    const rest = lines.slice(index + 1);
    const end = rest.findIndex((next) => /^\s*--- |^\S/.test(next));
    const at = firstMatch(end === -1 ? rest : rest.slice(0, end), /^\s+(\S+\.go):(\d+): (.*)$/);
    const pkg = firstMatch(rest, /^FAIL\s+(\S+)\s/)?.[1];
    const file = at === null ? null : goFile(at[1] ?? "", pkg, ctx);
    out.push(failure({ file, line: lineNumber(at?.[2]), name: head[1] ?? "", message: at?.[3] ?? "", durationMs: durationOf(head[2], "s") }, ctx));
  });
  return out.filter((item) => item.file !== null || !out.some((other) => other.name.startsWith(`${item.name}/`)));
};
const dartTest = (lines, ctx) => sections(lines, /^\d+:\d+ \+\d+(?: ~\d+)?(?: -\d+)?: (.*)$/).filter(({ head }) => (head[1] ?? "").endsWith(" [E]")).map(({ head, body }) => {
  const title = (head[1] ?? "").replace(/ \[E\]$/, "");
  const split = /^(\S+\.dart): (.*)$/.exec(title);
  const file = split?.[1] ?? null;
  const at = firstMatch(body, /^\s*(\S+\.dart) (\d+):\d+\s/);
  const line = at !== null && endsWithFile(at[1] ?? "", file) ? at[2] : undefined;
  return failure({ file, line: lineNumber(line), name: split?.[2] ?? title, message: firstText(body) }, ctx);
});
const bunTest = (lines, ctx) => {
  const out = [];
  let state = { file: null, message: "", at: null };
  for (const row of lines) {
    const header = /^(\S+\.\w+):$/.exec(row);
    const error = /^error: (.*)$/.exec(row);
    const fail = /^\(fail\) (.+?)(?: \[([\d.]+)(m?s)\])?$/.exec(row);
    if (header !== null)
      state = { file: header[1] ?? null, message: "", at: null };
    else if (error !== null)
      state = { ...state, message: error[1] ?? "", at: null };
    else if (state.at === null && /:\d+:\d+\)?$/.test(row))
      state.at = /([^\s(]+):(\d+):\d+\)?$/.exec(row);
    const durationMs = fail === null ? null : durationOf(fail[2], fail[3]);
    if (fail !== null)
      out.push(failure({ file: state.at?.[1] ?? state.file, line: lineNumber(state.at?.[2]), name: fail[1] ?? "", message: state.message, durationMs }, ctx));
    if (fail !== null || /^\((pass|skip|todo)\)/.test(row))
      state = { ...state, message: "", at: null };
  }
  return out;
};
const cargoTest = (lines, ctx) => sections(lines, /^---- (\S+) stdout ----$/).map(({ head, body }) => {
  const index = body.findIndex((row) => /panicked at /.test(row));
  const row = body[index] ?? "";
  const modern = /panicked at (\S+?):(\d+):\d+:?\s*$/.exec(row);
  const legacy = /panicked at '(.*)', (\S+?):(\d+):\d+/.exec(row);
  const file = modern?.[1] ?? legacy?.[2] ?? null;
  const message = modern !== null ? firstText(body.slice(index + 1)) : legacy?.[1] ?? "";
  return failure({ file, line: lineNumber(modern?.[2] ?? legacy?.[3]), name: head[1] ?? "", message }, ctx);
});
const compileErrors = (lines, ctx) => lines.flatMap((row) => {
  const found = /^(\S+\.go):(\d+):\d+: (.+)$/.exec(row) ?? /^(\S+\.dart):(\d+):\d+: Error: (.+)$/.exec(row);
  return found === null ? [] : [failure({ file: found[1] ?? null, line: lineNumber(found[2]), name: found[3] ?? "", message: words().compileError, suite: "typecheck" }, ctx)];
});
const PARSERS = [jest, vitest, pytest$1, goTest, dartTest, bunTest, cargoTest, compileErrors];
function dedupe(items) {
  const seen = new Set;
  return items.filter((item) => {
    const key = `${item.suite}|${item.file}|${item.line}|${item.name}`;
    if (seen.has(key))
      return false;
    seen.add(key);
    return true;
  }).slice(0, MAX_FAILURES);
}
function testFailures(text, ctx) {
  const lines = text.split(`
`);
  return dedupe(PARSERS.flatMap((parse) => parse(lines, ctx)));
}

const eslint = (lines, ctx) => {
  const out = [];
  let file = null;
  for (const row of lines) {
    const entry = /^\s+(\d+):\d+\s+error\s+(.+?)(?:\s{2,}(\S+))?\s*$/.exec(row);
    if (entry !== null)
      out.push(failure({ file, line: lineNumber(entry[1]), name: entry[2] ?? "", message: entry[3] ?? "", suite: "lint" }, ctx));
    else if (/^(?:[A-Za-z]:)?[\\/]?[^\s:]+\.\w+$/.test(row))
      file = row;
  }
  return out;
};
const tsc = (lines, ctx) => lines.flatMap((row) => {
  const found = /^(\S.*?)\((\d+),\d+\): error (TS\d+): (.*)$/.exec(row) ?? /^(\S.*?):(\d+):\d+ - error (TS\d+): (.*)$/.exec(row);
  return found === null ? [] : [failure({ file: found[1] ?? null, line: lineNumber(found[2]), name: found[4] ?? "", message: found[3] ?? "", suite: "typecheck" }, ctx)];
});
const dartAnalyze = (lines, ctx) => lines.flatMap((row) => {
  const bullet = /^\s*error • (.+?) • (\S+?):(\d+):\d+ • (\S+)\s*$/.exec(row);
  const dash = /^\s*error - (\S+?):(\d+):\d+ - (.+?) - (\S+)\s*$/.exec(row);
  if (bullet !== null)
    return [failure({ file: bullet[2] ?? null, line: lineNumber(bullet[3]), name: bullet[1] ?? "", message: bullet[4] ?? "", suite: "lint" }, ctx)];
  if (dash !== null)
    return [failure({ file: dash[1] ?? null, line: lineNumber(dash[2]), name: dash[3] ?? "", message: dash[4] ?? "", suite: "lint" }, ctx)];
  return [];
});
function lintFailures(text, ctx) {
  const lines = text.split(`
`);
  return dedupe([eslint, tsc, dartAnalyze].flatMap((parse) => parse(lines, ctx)));
}

const TAIL_LINES = 6;
const SECOND$1 = 1000;
const MINUTE = 60 * SECOND$1;
const HOUR = 60 * MINUTE;
const num = (text, re) => Number(re.exec(text)?.[1] ?? 0);
const cargo = (text) => {
  const lines = [...text.matchAll(/test result: \w+\. (\d+) passed; (\d+) failed/g)];
  if (lines.length === 0)
    return null;
  return lines.reduce((sum, m) => ({ passed: sum.passed + Number(m[1]), failed: sum.failed + Number(m[2]) }), { passed: 0, failed: 0 });
};
const jestLike = (text) => {
  const line = text.split(`
`).reverse().find((row) => /^\s*Tests:?\s/.test(row) && /\d+ (passed|failed)/.test(row));
  return line === undefined ? null : { passed: num(line, /(\d+) passed/), failed: num(line, /(\d+) failed/) };
};
const pytest = (text) => {
  const line = text.split(`
`).reverse().find((row) => /\d+ (passed|failed)/.test(row) && /\bin \d+(\.\d+)?s\b/.test(row));
  return line === undefined ? null : { passed: num(line, /(\d+) passed/), failed: num(line, /(\d+) failed/) + num(line, /(\d+) errors?/) };
};
const mocha = (text) => /\d+ passing/.test(text) ? { passed: num(text, /(\d+) passing/), failed: num(text, /(\d+) failing/) } : null;
const tap = (text) => {
  const pass = /^(?:#|ℹ)\s*pass (\d+)$|^\s*(\d+) pass$/m.exec(text);
  if (pass === null)
    return null;
  const fail = /^(?:#|ℹ)\s*fail (\d+)$|^\s*(\d+) fail$/m.exec(text);
  return { passed: Number(pass[1] ?? pass[2]), failed: Number(fail?.[1] ?? fail?.[2] ?? 0) };
};
const phpunit = (text) => {
  const ok = /OK \((\d+) tests?/.exec(text);
  if (ok !== null)
    return { passed: Number(ok[1]), failed: 0 };
  const line = /Tests: (\d+),.*$/m.exec(text);
  if (line === null)
    return null;
  const failed = num(line[0], /Failures: (\d+)/) + num(line[0], /Errors: (\d+)/);
  return { passed: Number(line[1]) - failed, failed };
};
const goPackages = (text) => {
  const passed = (text.match(/^ok\s+\S+/gm) ?? []).length;
  const failed = (text.match(/^FAIL\s+\S+/gm) ?? []).length;
  return passed + failed === 0 ? null : { passed, failed };
};
const dart = (text) => {
  const line = [...text.matchAll(/^\d+:\d+ \+(\d+)(?: ~\d+)?(?: -(\d+))?:/gm)].at(-1);
  return line === undefined ? null : { passed: Number(line[1]), failed: Number(line[2] ?? 0) };
};
const rspec = (text) => {
  const line = [...text.matchAll(/(\d+) examples?, (\d+) failures?/g)].at(-1);
  return line === undefined ? null : { passed: Number(line[1]) - Number(line[2]), failed: Number(line[2]) };
};
const xctest = (text) => {
  const line = [...text.matchAll(/Executed (\d+) tests?, with (\d+) failures?/g)].at(-1);
  return line === undefined ? null : { passed: Number(line[1]) - Number(line[2]), failed: Number(line[2]) };
};
const unittest = (text) => {
  const ran = /^Ran (\d+) tests? in /m.exec(text);
  if (ran === null)
    return null;
  const failed = num(text, /FAILED \(.*?failures=(\d+)/) + num(text, /FAILED \(.*?errors=(\d+)/);
  return { passed: Number(ran[1]) - failed, failed };
};
const deno = (text) => {
  const line = /^(?:ok|FAILED) \| (\d+) passed(?: \(\d+ steps?\))? \| (\d+) failed/m.exec(text);
  return line === null ? null : { passed: Number(line[1]), failed: Number(line[2]) };
};
const maven = (text) => {
  const line = [...text.matchAll(/Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+)/g)].at(-1);
  if (line === undefined)
    return null;
  const failed = Number(line[2]) + Number(line[3]);
  return { passed: Number(line[1]) - failed - Number(line[4]), failed };
};
const EXTRACTORS = [cargo, jestLike, pytest, dart, mocha, tap, phpunit, rspec, xctest, unittest, deno, maven, goPackages];
function tailOf(text, isFailing, failures) {
  if (!isFailing || failures.length > 0)
    return [];
  return text.split(`
`).map((line) => line.trimEnd()).filter((line) => line.trim() !== "").slice(-TAIL_LINES);
}
function parseTests(output, exitCode, ctx) {
  const text = clean(output);
  const counts = EXTRACTORS.reduce((found, extract) => found ?? extract(text), null);
  const status = exitCode === 0 ? "pass" : "fail";
  const failures = status === "fail" ? testFailures(text, ctx) : [];
  const tail = tailOf(text, status === "fail", failures);
  if (counts === null)
    return { status, passed: null, total: null, errors: null, failures, tail };
  return { status, passed: counts.passed, total: counts.passed + counts.failed, errors: null, failures, tail };
}
function countOf$1(match, exitCode) {
  if (match !== null)
    return Number(match[1]);
  return exitCode === 0 ? 0 : null;
}
function parseLint(output, exitCode, ctx) {
  const text = clean(output);
  const failures = lintFailures(text, ctx);
  const match = /\((\d+) errors?/.exec(text) ?? /Found (\d+) errors?/.exec(text) ?? /^(\d+) errors?\b/m.exec(text);
  const counted = countOf$1(match, exitCode);
  const errors = failures.length > 0 ? Math.max(failures.length, counted ?? 0) : counted;
  const status = exitCode === 0 && (errors ?? 0) === 0 ? "pass" : "fail";
  return { status, passed: null, total: null, errors, failures, tail: tailOf(text, status === "fail", failures) };
}
function ago(ms) {
  const { ago: says } = words();
  if (ms < MINUTE)
    return says.s(Math.max(0, Math.round(ms / SECOND$1)));
  if (ms < HOUR)
    return says.m(Math.round(ms / MINUTE));
  return says.h(Math.round(ms / HOUR));
}
function testsText(outcome) {
  const says = words();
  if (outcome.status === "timeout")
    return says.testsTimeout;
  if (outcome.status === "error")
    return says.testsNotStarted;
  if (outcome.total !== null)
    return says.testsCount(outcome.passed, outcome.total);
  return outcome.status === "pass" ? says.testsPassed : says.testsFailed;
}
function lintText(outcome) {
  const says = words();
  if (outcome.status === "timeout")
    return says.lintTimeout;
  if (outcome.status === "error")
    return says.lintNotStarted;
  if (outcome.status === "pass")
    return says.lintClean;
  return outcome.errors !== null && outcome.errors > 0 ? says.lintErrors(outcome.errors) : says.lintFailed;
}
function badgeText(badge, now) {
  const parts = [];
  if (badge.tests !== null)
    parts.push(testsText(badge.tests));
  if (badge.lint !== null)
    parts.push(lintText(badge.lint));
  if (badge.isRunning)
    return parts.length === 0 ? words().testsRunning : `${parts.join(" · ")} · ${words().runningTail}`;
  if (parts.length === 0 || badge.finishedAt === null)
    return;
  return `${parts.join(" · ")} · ${ago(now - badge.finishedAt)}`;
}
function isFailing(badge) {
  return [badge.tests, badge.lint].some((outcome) => outcome !== null && outcome.status !== "pass");
}
function failuresOf(badge) {
  return [...badge.tests?.failures ?? [], ...badge.lint?.failures ?? []];
}

const SECOND = 1000;
const SUITE_ORDER = ["unit", "e2e", "typecheck", "lint"];
const CHIPS = ["all", "unit", "e2e", "lint", "typecheck"];
const suiteTag = (suite) => words().suites[suite];
function failedOf(outcome) {
  if (outcome.passed === null || outcome.total === null)
    return null;
  const failed = outcome.total - outcome.passed;
  return outcome.status === "fail" && failed <= 0 ? null : failed;
}
function testsPill(outcome) {
  const says = words();
  if (outcome.status === "timeout")
    return { tone: "amber", glyph: "x", label: says.testTimeout };
  if (outcome.status === "error")
    return { tone: "amber", glyph: "x", label: says.testNotStarted };
  const failed = failedOf(outcome);
  if (outcome.status === "pass")
    return { tone: "moss", glyph: "check", label: failed === null ? says.testPassed : says.passedOf(outcome.passed, outcome.total) };
  return { tone: "flare", glyph: "x", label: failed === null ? says.testFailed : says.failedOf(failed, outcome.total) };
}
function lintPill(outcome) {
  const says = words();
  if (outcome.status === "timeout")
    return { tone: "amber", label: says.lintTimeout };
  if (outcome.status === "error")
    return { tone: "amber", label: says.lintNotStarted };
  if (outcome.status === "pass")
    return { tone: "neutral", label: says.lintClean };
  return { tone: "amber", label: outcome.errors !== null && outcome.errors > 0 ? says.lintErrors(outcome.errors) : says.lintFailed };
}
function bandParts(badge, now) {
  if (badge.isRunning)
    return { pills: [{ tone: "kiln", glyph: "pulse", label: words().testRunning }], meta: "" };
  const pills = [];
  if (badge.tests !== null)
    pills.push(testsPill(badge.tests));
  if (badge.lint !== null)
    pills.push(lintPill(badge.lint));
  return { pills, meta: badge.finishedAt === null ? "" : ago(now - badge.finishedAt) };
}
function runMeta(badge, now) {
  if (badge.isRunning || badge.finishedAt === null)
    return "";
  return `${ago(now - badge.finishedAt)} · ${words().took(Math.max(1, Math.round(badge.durationMs / SECOND)))}`;
}
function chipsOf(badge, current = "all") {
  const all = failuresOf(badge);
  const counted = CHIPS.map((filter) => ({ filter, label: words().chips[filter], count: filter === "all" ? all.length : all.filter((item) => item.suite === filter).length }));
  return counted.filter((chip) => chip.filter === "all" || chip.filter === current || chip.count > 0);
}
function groupsOf(badge, filter) {
  const kept = failuresOf(badge).filter((item) => filter === "all" || item.suite === filter);
  const sorted = [...kept].sort((a, b) => SUITE_ORDER.indexOf(a.suite) - SUITE_ORDER.indexOf(b.suite));
  const files = [...new Set(sorted.map((item) => item.file))];
  return files.map((file) => ({ file, failures: sorted.filter((item) => item.file === file) }));
}
function durationText(ms) {
  if (ms === null || ms === undefined)
    return "";
  if (ms < 1)
    return "<1 ms";
  return ms < SECOND ? `${Math.round(ms)} ms` : words().seconds(ms, SECOND);
}
function spanOf(failure) {
  const name = (failure.file ?? "").split("/").pop() ?? "";
  if (name === "")
    return failure.line === null ? "—" : `:${failure.line}`;
  return failure.line === null ? name : `${name}:${failure.line}`;
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
function cardColors(theme) {
  if (theme.mode === "auto")
    return null;
  const palette = theme.isLight ? LIGHT : DARK;
  return { card: palette.card, line: palette.line };
}
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
const PANE_PX_PER_COLUMN = 9;
const MONO_EM = 0.6;
const BOLD_FROM = 600;
const BOLD_WIDEN = 1.06;
const ICON_GRID = 24;
const PILL_H = 20;
const PILL_PAD = 9;
const PILL_GLYPH = 10;
const PILL_FONT = { size: 11, weight: 600 };
const LABEL_FONT = { size: 12, weight: 600 };
const LIVE_DOT = 3;
const LIVE_GAP = 8;
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
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  chevron: '<path d="M10 7l5 5-5 5"/>'
};
const esc = (text) => text.replace(/[&<>"]/g, (ch) => ENTITIES[ch] ?? ch);
const px = (value) => String(Math.round(value * 10) / 10);
const NARROW_EM = 0.3;
const WIDE_EM = 0.72;
const OTHER_EM = 0.56;
function charEm(ch) {
  if (/[\s.,:;'|!il1()[\]ıjtf`]/.test(ch))
    return NARROW_EM;
  return /[A-ZÇĞİÖŞÜmwMW@%]/.test(ch) ? WIDE_EM : OTHER_EM;
}
function measure(text, font) {
  const chars = [...text];
  const em = font.isMono === true ? chars.length * MONO_EM : chars.reduce((sum, ch) => sum + charEm(ch), 0);
  const widen = (font.weight ?? 0) >= BOLD_FROM ? BOLD_WIDEN : 1;
  return em * font.size * widen;
}
function fit(text, width, font) {
  if (measure(text, font) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 1 && measure(`${chars.join("")}…`, font) > width)
    chars.pop();
  return `${chars.join("")}…`;
}
function fitStart(text, width, font) {
  if (measure(text, font) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 1 && measure(`…${chars.join("")}`, font) > width)
    chars.shift();
  return `…${chars.join("")}`;
}
function breakWord(word, width, font) {
  const pieces = [];
  let piece = "";
  for (const ch of word) {
    if (piece !== "" && measure(piece + ch, font) > width) {
      pieces.push(piece);
      piece = "";
    }
    piece += ch;
  }
  return piece === "" ? pieces : [...pieces, piece];
}
function wrapText(text, box) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean).flatMap((part) => breakWord(part, box.width, box.font))) {
    const tried = line === "" ? word : `${line} ${word}`;
    if (line !== "" && measure(tried, box.font) > box.width) {
      lines.push(line);
      line = word;
    } else
      line = tried;
  }
  if (line !== "")
    lines.push(line);
  if (lines.length <= box.maxLines)
    return lines;
  const kept = lines.slice(0, box.maxLines);
  kept[box.maxLines - 1] = fit(`${kept[box.maxLines - 1]} ${lines[box.maxLines]}`, box.width, box.font);
  return kept;
}
function svgWidth(columns, range) {
  const room = (columns - (range.reserve ?? 0)) * (range.isBand === true ? PX_PER_COLUMN : PANE_PX_PER_COLUMN);
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
function icon(name, at) {
  const scale = at.size / ICON_GRID;
  const width = (at.stroke ?? 1.75) / scale;
  return `<g transform="translate(${px(at.x)} ${px(at.y)}) scale(${scale})" fill="none" stroke-width="${px(width)}" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--${at.ink})">${ICONS[name]}</g>`;
}
function pill(spec) {
  const fg = spec.role === "neutral" ? "mid" : spec.role;
  const lead = spec.glyph === undefined ? PILL_PAD : PILL_PAD + PILL_GLYPH + 5;
  const width = Math.round(lead + measure(spec.label, PILL_FONT) + PILL_PAD);
  const mid = spec.y + PILL_H / 2;
  const shell = rect({ x: spec.x, y: spec.y, w: width, h: PILL_H, rx: PILL_H / 2, fill: "track" });
  let glyph = "";
  if (spec.glyph === "pulse")
    glyph = `<circle class="breathe" cx="${px(spec.x + PILL_PAD + 4)}" cy="${px(mid)}" r="${LIVE_DOT}" style="fill:var(--${fg})"/>`;
  else if (spec.glyph !== undefined)
    glyph = icon(spec.glyph, { x: spec.x + PILL_PAD - 1, y: mid - 6, size: 12, ink: fg, stroke: 1.75 });
  const label = text({ ...PILL_FONT, x: spec.x + lead, y: mid + 4, text: spec.label, ink: fg });
  return { svg: shell + glyph + label, width };
}
function eyebrow(spec) {
  const isLive = spec.isLive === true;
  const dot = isLive ? `<circle class="breathe" cx="${px(spec.x + LIVE_DOT)}" cy="${px(spec.y - 4)}" r="${LIVE_DOT}" style="fill:var(--kiln)"/>` : "";
  const meta = spec.meta ?? "";
  const right = meta === "" ? "" : text({ size: 12, x: spec.x + spec.width, y: spec.y, text: meta, ink: "lo", anchor: "end" });
  return dot + text({ ...LABEL_FONT, x: spec.x + (isLive ? LIVE_DOT * 2 + LIVE_GAP : 0), y: spec.y, text: spec.label, ink: "lo" }) + right;
}
const PART_H = 36;
const partHead = (spec) => line({ x1: 0, y1: 0.5, x2: spec.width, y2: 0.5, ink: "line" }) + eyebrow({ x: 0, y: 25, width: spec.width, label: spec.label, meta: spec.meta, isLive: spec.isLive });
function fileBadge(spec) {
  const name = spec.path.split("/").pop() ?? spec.path;
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  const label = upper(ext === "" ? "·" : ext.slice(0, 3));
  return rect({ x: spec.x, y: spec.y, w: 26, h: 16, rx: 4, fill: "track" }) + text({ size: 9.5, weight: 700, isMono: true, x: spec.x + 13, y: spec.y + 11.5, text: label, ink: "lo", anchor: "middle" });
}
function bar(spec) {
  const radius = spec.height / 2;
  const track = rect({ x: spec.x, y: spec.y, w: spec.width, h: spec.height, rx: radius, fill: "track" });
  if (spec.value <= 0)
    return track;
  const width = Math.max(spec.height, spec.width * Math.min(spec.value, spec.total) / Math.max(1, spec.total));
  return track + rect({ x: spec.x, y: spec.y, w: width, h: spec.height, rx: radius, fill: spec.ink }).replace("<rect", '<rect data-m-fill=""');
}

const ROW_H$1 = 24;
const PILL_GAP = 6;
const META_FONT = { size: 11.5 };
const GLYPH$1 = { check: "✓", x: "✕", pulse: "●" };
const BUTTONS_RESERVE = 20;
const pillText = (part) => part.glyph === undefined ? part.label : `${GLYPH$1[part.glyph]} ${part.label}`;
function bandAlt(badge, now) {
  const parts = bandParts(badge, now);
  return [...parts.pills.map(pillText), parts.meta].filter((part) => part !== "").join(" · ");
}
function pillsSvg(view) {
  const parts = bandParts(view.badge, view.now);
  const body = [];
  let x = 0;
  for (const part of parts.pills) {
    const drawn = pill({ x, y: 2, label: part.label, role: part.tone, glyph: part.glyph });
    body.push(drawn.svg);
    x += drawn.width + PILL_GAP;
  }
  const room = svgWidth(view.columns, { reserve: BUTTONS_RESERVE, min: 160, max: 1200, isBand: true });
  if (parts.meta !== "" && x + measure(parts.meta, META_FONT) + 4 <= room) {
    body.push(text({ ...META_FONT, x: x + 2, y: 16, text: parts.meta, ink: "lo" }));
    x += measure(parts.meta, META_FONT) + 4;
  }
  const width = Math.min(Math.ceil(x), room);
  return { source: svgDoc({ width, height: ROW_H$1, mode: view.theme.mode, body: body.join("") }), width };
}
function pillTexts(ui, view) {
  const { Text } = ui;
  const parts = bandParts(view.badge, view.now);
  const pills = parts.pills.map((part, index) => {
    const look = part.tone === "neutral" ? { dimColor: true } : { color: THEME_KEY[part.tone] };
    return h(Text, {
      key: `tb-pill-${index}`,
      ...look,
      wrap: "truncate"
    }, pillText(part));
  });
  return parts.meta === "" ? pills : [...pills, h(Text, {
    key: "tb-meta",
    dimColor: true
  }, parts.meta)];
}
function bandTree(ui, view, theirs) {
  const { Box, Button, Svg } = ui;
  const drawn = view.isRich ? pillsSvg(view) : null;
  return h(Box, {
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 1,
    flexWrap: "wrap"
  }, drawn === null ? pillTexts(ui, view) : h(Svg, {
    source: drawn.source,
    alt: bandAlt(view.badge, view.now),
    width: drawn.width,
    height: ROW_H$1
  }), view.hasDetails && h(Button, {
    key: "tb-details",
    variant: "secondary",
    hotkey: "t",
    label: words().details,
    onPress: view.onDetails
  }), view.onDismiss !== undefined && h(Button, {
    key: "tb-dismiss",
    plain: true,
    dimColor: true,
    role: "dismiss",
    label: "✕",
    onPress: view.onDismiss
  })), theirs);
}

const WRITE_TOOLS = new Set(["Write", "Edit", "MultiEdit"]);
const DEBOUNCE_MS = 5000;
const TIMEOUT_MS = 120000;
const TIMEOUT_SLACK_MS = 1000;
const REFRESH_MS = 15000;
const DISMISS_AFTER_MS = 20000;
const PRIORITY = 1;
const NICE = ["nice", "-n", "10"];
const OPEN_TIMEOUT_MS = 1e4;
const VENDOR_TOOLS = ["phpunit", "phpstan"];
const EMPTY = { tests: null, lint: null, root: null, finishedAt: null, durationMs: 0, isRunning: false };
const CI_POLL_MS = 60000;
const CI_SLOW_POLL_MS = 180000;
const CI_BACKOFF_AFTER_POLLS = 10;
const CI_MAX_WATCH_MS = 90 * 60000;
const CI_GRACE_POLLS = 3;
const CI_NO_CHECKS_POLLS = 5;
const GH_TIMEOUT_MS = 20000;

function newWatch(pr, spec) {
  return {
    number: pr.number,
    url: pr.url,
    title: pr.title,
    checks: [],
    phase: "watching",
    talkAtStart: 0,
    talk: 0,
    startedAt: spec.now,
    checkedAt: null,
    polls: 0,
    isFreshRun: spec.isFreshRun,
    hasSeenPending: false
  };
}
function countsOf(checks) {
  const count = (state) => checks.filter((check) => check.state === state).length;
  const passed = count("pass");
  const failing = count("fail");
  const pending = count("pending");
  return { passed, failing, pending, total: passed + failing + pending };
}
const intervalOf = (polls) => CI_POLL_MS ;
const isBackoffPoll = (polls) => polls === CI_BACKOFF_AFTER_POLLS;
const done = (watch, phase, heard = null) => ({ watch: { ...watch, phase }, isDone: true, heard });
function finished(watch) {
  const counts = countsOf(watch.checks);
  if (watch.checks.length === 0 || counts.pending > 0)
    return null;
  const canFinish = watch.hasSeenPending || !watch.isFreshRun || watch.polls >= CI_GRACE_POLLS;
  if (!canFinish)
    return null;
  const outcome = counts.failing > 0 ? "fail" : "pass";
  return done(watch, outcome === "fail" ? "failed" : "passed", watch.hasSeenPending ? outcome : null);
}
function stepOf(watch, poll) {
  const checks = poll.checks ?? watch.checks;
  const isFirst = watch.checkedAt === null;
  const talk = poll.pr?.talk ?? watch.talk;
  const next = {
    ...watch,
    checks,
    polls: watch.polls + 1,
    checkedAt: poll.now,
    talk,
    talkAtStart: isFirst ? talk : watch.talkAtStart,
    title: poll.pr !== null && poll.pr.title !== "" ? poll.pr.title : watch.title,
    hasSeenPending: watch.hasSeenPending || checks.some((check) => check.state === "pending")
  };
  if (poll.pr?.state === "merged" || poll.pr?.state === "closed")
    return done(next, poll.pr.state);
  const finish = finished(next);
  if (finish !== null)
    return finish;
  if (checks.length === 0 && next.polls >= CI_NO_CHECKS_POLLS)
    return done(next, "none");
  if (poll.now - watch.startedAt >= CI_MAX_WATCH_MS)
    return done(next, "ended");
  return { watch: { ...next, phase: "watching" }, isDone: false, heard: null };
}
const newTalkOf = (watch) => Math.max(0, watch.talk - watch.talkAtStart);

const NAMED = 2;
const TONE = { watching: "live", passed: "ok", failed: "bad", merged: "ok", closed: "idle", ended: "warn", none: "idle" };
const CHECK_ROLE = { pending: "kiln", pass: "moss", fail: "flare", skipped: "lo" };
function ciLine(watch) {
  const says = words().ci;
  if (watch.phase === "merged")
    return says.merged(watch.number);
  if (watch.phase === "closed")
    return says.closed(watch.number);
  if (watch.phase === "none")
    return "";
  const { passed, failing, pending, total } = countsOf(watch.checks);
  if (total === 0)
    return watch.phase === "watching" ? says.waiting : "";
  if (failing > 0)
    return says.failing(passed, total, failing);
  if (watch.phase === "ended")
    return says.ended(passed, total);
  return pending > 0 ? says.running(passed, total, pending) : says.allPassed(passed, total);
}
const ciTone = (watch) => TONE[watch.phase];
function namesOf(failing) {
  const named = failing.slice(0, NAMED).map((check) => check.name).join(", ");
  const rest = failing.length - NAMED;
  return rest > 0 ? `${named} ${words().ci.more(rest)}` : named;
}
const cardHeadline = (card) => words().ci.cardHeadline(namesOf(card.failing));
function notifyText(watch, heard) {
  const says = words().ci;
  if (heard === "fail")
    return says.notifyFailed(watch.number, namesOf(watch.checks.filter((check) => check.state === "fail")));
  const { passed, total } = countsOf(watch.checks);
  return says.notifyPassed(watch.number, passed, total);
}
function fixPrompt(card) {
  const lines = card.failing.map((check) => check.link === null ? `- ${check.name}` : `- ${check.name}: ${check.link}`).join(`
`);
  return words().ci.fixPrompt(card.number, card.url, lines);
}

const hasNoCommand = (commands) => commands !== null && commands.test === null && commands.lint === null;
function commandText$1(argv) {
  if (argv === null)
    return null;
  return argv[0] === "/bin/sh" ? argv[2] ?? "" : argv.join(" ");
}
const isOver = (ci) => ci.phase === "merged" || ci.phase === "closed";
const failingOnGithub = (ci) => ci === null || isOver(ci) ? 0 : countsOf(ci.checks).failing;
function localTrouble({ tests, lint }) {
  const says = words().verdict;
  if (tests?.status === "timeout")
    return { sentence: says.testsTooLong, tone: "amber", failed: null };
  if (tests?.status === "error")
    return { sentence: says.testsNoStart, tone: "amber", failed: null };
  if (tests?.status === "fail") {
    const failed = failedOf(tests);
    return { sentence: failed === null ? says.testsFailing : says.failing(failed), tone: "flare", failed };
  }
  if (lint === null || lint.status === "pass")
    return null;
  if (lint.status === "timeout")
    return { sentence: says.lintTooLong, tone: "amber", failed: null };
  if (lint.status === "error")
    return { sentence: says.lintNoStart, tone: "amber", failed: null };
  return { sentence: lint.errors !== null && lint.errors > 0 ? says.lintProblems(lint.errors) : says.lintFailing, tone: "amber", failed: null };
}
function passing({ badge, ci }) {
  const says = words().verdict;
  if (ci !== null && (ci.phase === "passed" || ci.phase === "merged"))
    return { sentence: says.everything, tone: "moss" };
  if (ci !== null && countsOf(ci.checks).pending > 0)
    return { sentence: says.passGithubBusy, tone: "neutral" };
  return { sentence: badge.tests === null ? says.lintClean : says.passHere, tone: "moss" };
}
function verdictOf(state) {
  const says = words().verdict;
  const { badge, ci, commands } = state;
  if (badge.isRunning)
    return { sentence: says.running, tone: "kiln" };
  const onGithub = failingOnGithub(ci);
  const trouble = localTrouble(badge);
  if (trouble !== null)
    return trouble.failed !== null && onGithub > 0 ? { sentence: says.both(trouble.failed, onGithub), tone: "flare" } : { sentence: trouble.sentence, tone: trouble.tone };
  if (onGithub > 0)
    return { sentence: says.githubFailing(onGithub), tone: "flare" };
  if (badge.finishedAt === null)
    return { sentence: hasNoCommand(commands) ? says.noCommand : says.notRun, tone: "neutral" };
  return passing(state);
}
function testsResult(outcome) {
  const says = words().local;
  if (outcome.status === "timeout")
    return { result: says.tooLong, state: "fail", role: "amber" };
  if (outcome.status === "error")
    return { result: says.noStart, state: "fail", role: "amber" };
  if (outcome.status === "pass")
    return { result: outcome.total === null ? says.passed : says.nPassed(outcome.total), state: "pass", role: "moss" };
  const failed = failedOf(outcome);
  if (failed !== null)
    return { result: says.nFailed(failed, outcome.total), state: "fail", role: "flare" };
  return { result: outcome.passed === null ? says.failed : says.failedYet(outcome.passed), state: "fail", role: "flare" };
}
function lintResult(outcome) {
  const says = words().local;
  if (outcome.status === "timeout")
    return { result: says.tooLong, state: "fail", role: "amber" };
  if (outcome.status === "error")
    return { result: says.noStart, state: "fail", role: "amber" };
  if (outcome.status === "pass")
    return { result: says.clean, state: "pass", role: "moss" };
  return { result: outcome.errors !== null && outcome.errors > 0 ? says.problems(outcome.errors) : says.failed, state: "fail", role: "amber" };
}
const IDLE = () => ({ result: words().local.notRun, state: "skipped", role: "lo" });
const RUNNING = () => ({ result: words().local.running, state: "pending", role: "kiln" });
function localRowsOf({ badge, commands }) {
  const says = words().local;
  if (hasNoCommand(commands) && badge.finishedAt === null)
    return [];
  const testCommand = commandText$1(commands?.test ?? null);
  const lintCommand = commandText$1(commands?.lint ?? null);
  const hasLint = lintCommand !== null || badge.lint !== null;
  const hasTests = testCommand !== null || badge.tests !== null || commands === null;
  const tests = { name: says.tests, command: testCommand, ...badge.isRunning ? RUNNING() : badge.tests === null ? IDLE() : testsResult(badge.tests) };
  const lint = { name: says.lint, command: lintCommand, ...badge.isRunning ? RUNNING() : badge.lint === null ? IDLE() : lintResult(badge.lint) };
  return [...hasTests ? [tests] : [], ...hasLint ? [lint] : []];
}
function runLabelOf(commands) {
  const says = words().local;
  if (hasNoCommand(commands))
    return says.lookAgain;
  if (commands?.test === null)
    return says.runLint;
  return commands === null || commands.lint === null ? says.runTests : says.runBoth;
}
function checksSentence(ci) {
  const says = words().github;
  const { passed, failing, pending, total } = countsOf(ci.checks);
  if (ci.phase === "merged")
    return says.merged;
  if (ci.phase === "closed")
    return says.closed;
  if (ci.checks.length > 0 && total === 0)
    return says.allSkipped;
  if (total === 0) {
    if (ci.phase === "watching")
      return ci.checkedAt === null ? says.asking : says.starting;
    return says.noChecks;
  }
  if (failing > 0)
    return says.failing(failing, total);
  if (ci.phase === "ended")
    return says.stopped(passed, total);
  return pending > 0 ? says.running(total - pending, total) : says.allPassed(total);
}
function githubSentence(ci) {
  const talk = newTalkOf(ci);
  return talk > 0 ? `${checksSentence(ci)} ${words().ci.newTalk(talk)}.` : checksSentence(ci);
}

const HEADLINE = { size: 16, weight: 600 };
const NAME$1 = { size: 13, weight: 500 };
const STATE = { size: 12 };
const CARD_SUB = { size: 12 };
const PR = { size: 13, weight: 560 };
const BODY = { size: 12 };
const BODY_LINE = 17;
const PR_BASE = 16;
const BODY_GAP = 19;
const TITLE_LINES = 2;
const SENTENCE_LINES = 6;
const BOTTOM$1 = 6;
const WRAP_SLACK$1 = 12;
const ROW_H = 24;
const DOT_X = 5;
const DOT_R = 4;
const NAME_X = 20;
const STATE_GAP = 12;
const CARD_ICON = 16;
const CARD_TEXT_X = 26;
const CARD_H = 60;
const prTag = (n) => `${words().ci.eyebrow} · #${n}`;
const wrapped = (lines, spec) => lines.map((one, n) => text({ ...BODY, x: 0, y: spec.y + n * BODY_LINE, text: one, ink: spec.ink })).join("");
function ciHeadSvg(frame, spec) {
  const { watch } = spec;
  const says = words().github;
  const meta = watch.checkedAt === null ? "" : says.checked(ago(spec.now - watch.checkedAt));
  const pr = says.pr(watch.number);
  const box = { width: frame.width - WRAP_SLACK$1, font: BODY };
  const titles = wrapText(watch.title, { ...box, maxLines: TITLE_LINES });
  const sentence = githubSentence(watch);
  const sentences = wrapText(sentence, { ...box, maxLines: SENTENCE_LINES });
  const titleY = PART_H + PR_BASE + BODY_GAP;
  const sentenceY = titleY + titles.length * BODY_LINE + (BODY_GAP - BODY_LINE);
  const height = sentenceY + (sentences.length - 1) * BODY_LINE + BOTTOM$1;
  const body = partHead({ width: frame.width, label: says.title, meta, isLive: watch.phase === "watching" }) + text({ ...PR, x: 0, y: PART_H + PR_BASE, text: pr, ink: "hi" }) + wrapped(titles, { y: titleY, ink: "mid" }) + wrapped(sentences, { y: sentenceY, ink: "mid" });
  return { source: svgDoc({ width: frame.width, height, mode: frame.mode, body }), width: frame.width, height, alt: `${says.title}. ${pr}: ${watch.title}. ${sentence}` };
}
function noPrSvg(frame) {
  const says = words().github;
  const lines = wrapText(says.noPr, { width: frame.width - WRAP_SLACK$1, font: BODY, maxLines: SENTENCE_LINES });
  const height = PART_H + PR_BASE + (lines.length - 1) * BODY_LINE + BOTTOM$1;
  const body = partHead({ width: frame.width, label: says.title }) + wrapped(lines, { y: PART_H + PR_BASE, ink: "lo" });
  return { source: svgDoc({ width: frame.width, height, mode: frame.mode, body }), width: frame.width, height, alt: `${says.title}. ${says.noPr}` };
}
function dotOf(state, at) {
  const mid = at.cy;
  const role = at.role ?? CHECK_ROLE[state];
  if (state === "pending") {
    return `<circle cx="${DOT_X}" cy="${mid}" r="${DOT_R - 0.75}" fill="none" stroke-width="1.5" style="stroke:var(--${role})"/>` + `<circle class="breathe" cx="${DOT_X}" cy="${mid}" r="1.75" style="fill:var(--${role})"/>`;
  }
  if (state === "skipped") {
    return `<circle cx="${DOT_X}" cy="${mid}" r="${DOT_R - 0.75}" fill="none" stroke-width="1.5" style="stroke:var(--strong)"/>` + line({ x1: DOT_X - 1.75, y1: mid, x2: DOT_X + 1.75, y2: mid, ink: "lo" });
  }
  const glyph = icon(state === "pass" ? "check" : "x", { x: DOT_X - 3, y: mid - 3, size: 6, ink: "card", stroke: 1.5 });
  return `<circle cx="${DOT_X}" cy="${mid}" r="${DOT_R}" style="fill:var(--${role})"/>${glyph}`;
}
function checkRowSvg(frame, spec) {
  const { check } = spec;
  const label = words().ci.states[check.state];
  const room = frame.width - NAME_X - measure(label, STATE) - STATE_GAP;
  const rails = [
    spec.isFirst ? "" : rect({ x: DOT_X - 0.5, y: 0, w: 1, h: ROW_H / 2 - DOT_R - 1, fill: "strong" }),
    spec.isLast ? "" : rect({ x: DOT_X - 0.5, y: ROW_H / 2 + DOT_R + 1, w: 1, h: ROW_H / 2 - DOT_R - 1, fill: "strong" })
  ].join("");
  const body = rails + dotOf(check.state, { cy: ROW_H / 2 }) + text({ ...NAME$1, x: NAME_X, y: 16.5, text: fit(check.name, room, NAME$1), ink: check.state === "skipped" ? "lo" : "hi" }) + text({ ...STATE, x: frame.width, y: 16.5, text: label, ink: check.state === "pass" ? "lo" : CHECK_ROLE[check.state], anchor: "end" });
  const source = svgDoc({ width: frame.width, height: ROW_H, mode: frame.mode, body });
  return { source, width: frame.width, height: ROW_H, alt: `${check.name}: ${label}` };
}
function cardHeadSvg(frame, spec) {
  const headline = cardHeadline(spec.card);
  const room = frame.width - CARD_TEXT_X;
  const body = icon("x", { x: 0, y: 13 - CARD_ICON + 3, size: CARD_ICON, ink: "flare", stroke: 1.5 }) + eyebrow({ x: CARD_TEXT_X, y: 13, width: room, label: prTag(spec.card.number) }) + text({ ...HEADLINE, x: CARD_TEXT_X, y: 36, text: fit(headline, room, HEADLINE), ink: "hi" }) + text({ ...CARD_SUB, x: CARD_TEXT_X, y: 54, text: fit(spec.title, room, CARD_SUB), ink: "lo" });
  const source = svgDoc({ width: frame.width, height: CARD_H, mode: frame.mode, body });
  return { source, width: frame.width, height: CARD_H, alt: `${prTag(spec.card.number)}: ${headline}` };
}

const FILL = /<rect\b[^>]*\bdata-m-fill\b[^>]*>/g;
const DONE = /<path\b[^>]*\bdata-m-done\b[^>]*>/g;
const HAS_DONE = /\bdata-m-done\b/;
const WIDTH$2 = /\swidth="([\d.]+)"/;
const CLASS = /\sclass="([^"]*)"/;
const STYLE = /\sstyle="([^"]*)"/;
const MIN_RATIO_STEP = 0.02;
const RATIO_DIGITS = 3;
const widthOf = (tag) => Number(WIDTH$2.exec(tag)?.[1] ?? 0);
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

const motion = paneMotion();
function picture(ui, drawing, key, opts) {
  const { Svg } = ui;
  return h(Svg, {
    key,
    ...motion.pic(key, drawing, opts)
  });
}

const WIDTH$1 = { min: 300, max: 880 };
const ROW_WIDTH$1 = { min: 220, max: 860, reserve: 8 };
const CARD_WIDTH = { min: 260, max: 1200, reserve: 8 };
const GLYPH = { pending: "◐", pass: "✓", fail: "✕", skipped: "–" };
const look = (role) => role === "lo" ? { dimColor: true } : { color: THEME_KEY[role] };
function plainPicture(ui, drawing, key) {
  const { Svg } = ui;
  return h(Svg, {
    key,
    source: drawing.source,
    alt: drawing.alt,
    width: drawing.width,
    height: drawing.height
  });
}
const logsLink = (ui, check, index) => {
  const { Link } = ui;
  return check.link === null ? null : h(Link, {
    key: `tb-ci-link-${index}`,
    href: check.link,
    label: words().ci.logs
  });
};
const headShows = (ci, frame) => ({ frame, number: ci.number, title: ci.title, phase: ci.phase, checks: ci.checks, talk: newTalkOf(ci), isChecked: ci.checkedAt !== null });
function richSection(ui, view) {
  const { Box, Link } = ui;
  const frame = { width: svgWidth(view.columns, WIDTH$1), mode: view.theme.mode };
  const rowFrame = { width: svgWidth(view.columns, ROW_WIDTH$1), mode: view.theme.mode };
  const { checks } = view.ci;
  return h(Box, {
    key: "tb-ci",
    flexDirection: "column",
    rowGap: 1
  }, picture(ui, ciHeadSvg(frame, { watch: view.ci, now: view.now }), "tb-ci-head", { shows: headShows(view.ci, frame) }), checks.length > 0 && h(Box, {
    key: "tb-ci-checks",
    flexDirection: "column"
  }, checks.map((check, index) => h(Box, {
    key: `tb-ci-row-${index}`,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 1
  }, picture(ui, checkRowSvg(rowFrame, { check, isFirst: index === 0, isLast: index === checks.length - 1 }), `tb-ci-svg-${check.name}`), logsLink(ui, check, index)))), h(Box, {
    flexDirection: "row"
  }, h(Link, {
    key: "tb-ci-pr",
    href: view.ci.url,
    label: words().ci.openPr
  })));
}
function textSection(ui, view) {
  const { Box, Text, Link } = ui;
  const { ci } = view;
  const says = words().github;
  return h(Box, {
    key: "tb-ci",
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 1
  }, h(Text, {
    bold: true,
    dimColor: true
  }, `${ci.phase === "watching" ? "◐ " : ""}${says.title}`), h(Text, {
    dimColor: true
  }, ci.checkedAt === null ? "" : says.checked(ago(view.now - ci.checkedAt)))), h(Text, {
    bold: true
  }, says.pr(ci.number)), h(Text, {
    wrap: "truncate"
  }, ci.title), h(Text, {
    dimColor: true,
    wrap: "wrap"
  }, githubSentence(ci)), ci.checks.map((check, index) => h(Box, {
    key: `tb-ci-row-${index}`,
    flexDirection: "row",
    columnGap: 1,
    paddingLeft: 2
  }, h(Text, {
    ...look(CHECK_ROLE[check.state])
  }, GLYPH[check.state]), h(Box, {
    flexShrink: 1
  }, h(Text, {
    wrap: "truncate",
    dimColor: check.state === "skipped"
  }, check.name)), h(Text, {
    dimColor: true
  }, words().ci.states[check.state]), logsLink(ui, check, index))), h(Box, {
    flexDirection: "row"
  }, h(Link, {
    key: "tb-ci-pr",
    href: ci.url,
    label: words().ci.openPr
  })));
}
function ciPart(ui, view) {
  const { ci } = view;
  if (ci !== null)
    return view.isRich ? richSection(ui, { ...view, ci }) : textSection(ui, { ...view, ci });
  const { Box, Text } = ui;
  if (view.isRich)
    return picture(ui, noPrSvg({ width: svgWidth(view.columns, WIDTH$1), mode: view.theme.mode }), "tb-ci-none");
  return h(Box, {
    key: "tb-ci",
    flexDirection: "column"
  }, h(Text, {
    bold: true,
    dimColor: true
  }, words().github.title), h(Text, {
    dimColor: true,
    wrap: "wrap"
  }, words().github.noPr));
}
function cardActions(ui, view) {
  const { Box, Button, Link } = ui;
  return h(Box, {
    key: "tb-ci-actions",
    flexDirection: "row",
    columnGap: 2,
    alignItems: "center",
    flexWrap: "wrap"
  }, h(Button, {
    key: "tb-ci-ask",
    variant: "primary",
    hotkey: "f",
    label: words().ci.askFix,
    onPress: view.onAsk
  }), h(Link, {
    key: "tb-ci-open",
    href: view.card.url,
    label: words().ci.openPr
  }), h(Box, {
    flexGrow: 1
  }), h(Button, {
    key: "tb-ci-dismiss",
    plain: true,
    dimColor: true,
    label: words().ci.dismiss,
    onPress: view.onDismiss
  }));
}
function ciCardTree(ui, view, theirs) {
  const { Box, Text } = ui;
  const colors = cardColors(view.theme);
  const frame = { width: svgWidth(view.columns, CARD_WIDTH), mode: view.theme.mode };
  const head = view.isRich ? plainPicture(ui, cardHeadSvg(frame, { card: view.card, title: view.title }), "tb-ci-card-head") : h(Box, {
    key: "tb-ci-card-head",
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    color: THEME_KEY.flare
  }, "✕"), h(Text, {
    bold: true,
    dimColor: true
  }, `${words().ci.eyebrow} · #${view.card.number}`), h(Text, {
    bold: true,
    wrap: "truncate"
  }, cardHeadline(view.card)));
  const frameProps = view.isRich ? { borderColor: colors?.line, backgroundColor: colors?.card, paddingX: 2, paddingY: 1 } : { borderDimColor: true, paddingX: 1 };
  return h(Box, {
    flexDirection: "column"
  }, h(Box, {
    key: "tb-ci-card",
    flexDirection: "column",
    borderStyle: "round",
    gap: 1,
    ...frameProps
  }, head, cardActions(ui, view)), theirs);
}

const HUB_PANE = "tests";
function testsPart(tests) {
  const says = words();
  if (tests.status === "timeout")
    return says.testTimeout;
  if (tests.status === "error")
    return says.testNotStarted;
  const isCounted = tests.passed !== null && tests.total !== null && !(tests.status === "fail" && tests.passed >= tests.total);
  if (isCounted)
    return says.passedOf(tests.passed, tests.total);
  return tests.status === "pass" ? says.testsPassed : says.testsFailed;
}
function lintPart(lint) {
  const says = words();
  if (lint.status === "pass")
    return "";
  if (lint.status === "timeout")
    return says.lintTimeout;
  if (lint.status === "error")
    return says.lintNotStarted;
  return lint.errors !== null && lint.errors > 0 ? says.lintErrors(lint.errors) : says.lintFailed;
}
function toneOf(badge) {
  const outcomes = [badge.tests, badge.lint].filter((one) => one !== null);
  if (outcomes.some((one) => one.status === "fail"))
    return "bad";
  return outcomes.some((one) => one.status !== "pass") ? "warn" : "ok";
}
function hubOf(badge) {
  if (badge.isRunning)
    return { detail: words().running, tone: "live" };
  if (badge.finishedAt === null)
    return { detail: "", tone: "idle" };
  const parts = [badge.tests === null ? "" : testsPart(badge.tests), badge.lint === null ? "" : lintPart(badge.lint)];
  const detail = parts.filter((part) => part !== "").join(" · ");
  return { detail: detail === "" ? words().lintClean : detail, tone: toneOf(badge) };
}
const DETAIL_MAX = 40;
const SEP = " · ";
const TONE_RANK = { idle: 0, ok: 1, live: 2, warn: 3, bad: 4 };
function hubWith(badge, ci) {
  const local = hubOf(badge);
  const line = ci === null ? "" : ciLine(ci);
  if (ci === null || line === "")
    return local;
  const both = local.detail === "" ? line : `${local.detail}${SEP}${line}`;
  const tone = TONE_RANK[ciTone(ci)] > TONE_RANK[local.tone] ? ciTone(ci) : local.tone;
  return { detail: both.length <= DETAIL_MAX ? both : line, tone };
}
function hubCardOf(spec) {
  const shown = hubWith(spec.badge, spec.ci);
  const { standing } = spec;
  if (standing !== undefined && standing.detail === shown.detail && standing.tone === shown.tone)
    return null;
  return { pane: HUB_PANE, ...shown, at: spec.at };
}
function isOpenFor(value, pane) {
  return typeof value === "object" && value !== null && value.pane === pane;
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

const badgeAtom$3 = atom({ plugin: "test-badge", key: "badge" }, EMPTY);
const ciAtom$3 = atom({ plugin: "test-badge", key: "ci" }, null);
const ciCardAtom$1 = atom({ plugin: "test-badge", key: "ciCard" }, null);
const noticeAtom$2 = atom({ plugin: "test-badge", key: "notice" }, null);
const themeAtom$2 = atom({ plugin: "test-badge", key: "theme" }, AUTO);
const PANE$1 = "test-badge";
const cacheTaxNotice = { plugin: "cache-tax", key: "notice" };
const knowNotice = { plugin: "you-should-know", key: "notice" };
const budgetNotice = { plugin: "session-budget", key: "notice" };
const reflectNotice = { plugin: "reflect", key: "notice" };
const handoffNotice = { plugin: "handoff", key: "notice" };
async function isOutranked($) {
  const nowMs = await $.clock.now();
  const others = [
    await $.state.get(cacheTaxNotice),
    await $.state.get(knowNotice),
    await $.state.get(budgetNotice),
    await $.state.get(reflectNotice),
    await $.state.get(handoffNotice)
  ];
  return others.some((other) => isLive(other.value, nowMs));
}
async function bandOf($, now) {
  const badge = await read($, badgeAtom$3);
  const notice = await read($, noticeAtom$2);
  const isNotice = notice !== null && isLive(notice, now);
  if (!badge.isRunning && !isNotice)
    return null;
  return await isOutranked($) ? null : { badge, isNotice };
}
async function clearCard$1($) {
  if (await read($, ciCardAtom$1) !== null)
    await update($, ciCardAtom$1, () => null);
}
async function askFix($, card) {
  await clearCard$1($);
  await $.prompt.submit({ text: fixPrompt(card) }).catch((error) => $.ui.log(`test-badge: could not send the CI prompt (${String(error)})`, { to: "debug" }));
}
async function openDetails($) {
  motion.reset();
  const opened = await $.ui.open({ id: PANE$1, title: words().paneTitle, focus: true });
  try {
    if (!opened.isPlaced || (await $.state.get({ plugin: "modz", key: "isOn" })).value !== true)
      return;
    await $.state.set({ plugin: "test-badge", key: "shown" }, shownOf(HUB_PANE, await $.clock.now()));
  } catch (error) {
    $.ui.log(`test-badge: shown failed (${String(error)})`, { to: "debug" });
  }
}
function hookBand(on) {
  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    const theirs = await next(e);
    if (e.props.hasSurvey)
      return theirs;
    const ui = $.ui.resolve(e);
    const view = { columns: e.props.bodyColumns, theme: await read($, themeAtom$2), isRich: e.surface !== "terminal" };
    const card = await read($, ciCardAtom$1);
    if (card !== null && !await isOutranked($)) {
      const title = (await read($, ciAtom$3))?.title ?? "";
      return pinned(e, ciCardTree(ui, { ...view, card, title, onAsk: () => void askFix($, card), onDismiss: () => void clearCard$1($) }, theirs));
    }
    const now = await $.clock.now();
    const shown = await bandOf($, now);
    if (shown === null)
      return theirs;
    const { badge, isNotice } = shown;
    return pinned(e, bandTree(ui, {
      ...view,
      badge,
      now,
      hasDetails: !badge.isRunning && isFailing(badge),
      onDetails: () => void openDetails($),
      onDismiss: badge.isRunning || !isNotice ? undefined : () => void update($, noticeAtom$2, () => null)
    }, theirs));
  });
}

const PR_URL = /https:\/\/[^\s/]+\/[^\s/]+\/[^\s/]+\/pull\/(\d+)/;
const PR_CREATE = /(^|[\s;&|(])gh\s+pr\s+create\b/;
const GIT_PUSH = /(^|[\s;&|(])git\s+(?:-C\s+\S+\s+)?push\b/;
const STATES = { OPEN: "open", MERGED: "merged", CLOSED: "closed" };
const BUCKETS = { pass: "pass", fail: "fail", cancel: "fail", pending: "pending", skipping: "skipped" };
const MAX_NAME = 120;
const isPrCreate = (command) => PR_CREATE.test(command);
const isGitPush = (command) => GIT_PUSH.test(command);
function prRefOf(output) {
  const found = output.split(`
`).map((line) => PR_URL.exec(line)).filter((match) => match !== null);
  const last = found.at(-1);
  if (last === undefined)
    return null;
  return { number: Number(last[1]), url: last[0] };
}
function jsonOf(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const countOf = (value) => Array.isArray(value) ? value.length : 0;
function prInfoOf(text) {
  const json = jsonOf(text);
  if (!isRecord(json) || typeof json.number !== "number" || typeof json.url !== "string")
    return null;
  const state = STATES[String(json.state)];
  if (state === undefined)
    return null;
  return { number: json.number, url: json.url, title: typeof json.title === "string" ? json.title : "", state };
}
function prPollOf(text) {
  const json = jsonOf(text);
  if (!isRecord(json))
    return null;
  const state = STATES[String(json.state)];
  if (state === undefined)
    return null;
  return { title: typeof json.title === "string" ? json.title : "", state, talk: countOf(json.reviews) + countOf(json.comments) };
}
function checkOf(item) {
  if (!isRecord(item) || typeof item.name !== "string")
    return null;
  const link = typeof item.link === "string" && item.link.startsWith("https://") ? item.link : null;
  return { name: item.name.slice(0, MAX_NAME), state: BUCKETS[String(item.bucket)] ?? "pending", link };
}
function checksOf(text) {
  const json = jsonOf(text);
  if (!Array.isArray(json))
    return null;
  return json.map(checkOf).filter((check) => check !== null);
}

const badgeAtom$2 = atom({ plugin: "test-badge", key: "badge" }, EMPTY);
const ciAtom$2 = atom({ plugin: "test-badge", key: "ci" }, null);
const ciCardAtom = atom({ plugin: "test-badge", key: "ciCard" }, null);
const enabledAtom$2 = atom({ plugin: "test-badge", key: "isEnabled" }, true);
const hubRef$1 = { plugin: "test-badge", key: "hub" };
const GH_ENV = { GH_PROMPT_DISABLED: "1", GH_NO_UPDATE_NOTIFIER: "1", NO_COLOR: "1" };
const PR_FIELDS = "number,url,headRefName,state,title";
const CHECK_FIELDS = "name,state,bucket,link";
const POLL_FIELDS = "state,title,reviews,comments";
const live$1 = { timer: null, generation: 0, isPolling: false, cardId: 0 };
const debug$1 = ($, text) => $.ui.log(`test-badge: ${text}`, { to: "debug" });
async function run($, argv, cwd) {
  return $.process.run(argv, { cwd, env: GH_ENV, timeoutMs: GH_TIMEOUT_MS }).catch(() => null);
}
async function isGitRepo($, cwd) {
  const out = await run($, ["git", "rev-parse", "--is-inside-work-tree"], cwd);
  return out !== null && out.exitCode === 0 && out.stdout.trim() === "true";
}
function stop() {
  live$1.timer?.cancel();
  live$1.timer = null;
}
function every($, spec) {
  stop();
  live$1.timer = $.clock.every(spec.ms, () => void poll($, spec).catch((error) => debug$1($, `CI poll failed (${String(error)})`)));
}
async function writeHub$1($) {
  const standing = (await $.state.get(hubRef$1)).value;
  const card = hubCardOf({ badge: await read($, badgeAtom$2), ci: await read($, ciAtom$2), standing, at: await $.clock.now() });
  if (card !== null)
    await $.state.set(hubRef$1, card);
}
async function clearCard($) {
  if (await read($, ciCardAtom) !== null)
    await update($, ciCardAtom, () => null);
}
async function startWatch($, start) {
  if (!await read($, enabledAtom$2))
    return;
  const cwd = await $.session.cwd();
  if (!await isGitRepo($, cwd))
    return;
  const argv = ["gh", "pr", "view", ...start.selector === null ? [] : [start.selector], "--json", PR_FIELDS];
  const out = await run($, argv, cwd);
  const pr = out === null || out.exitCode !== 0 ? null : prInfoOf(out.stdout);
  if (pr === null || pr.state !== "open")
    return;
  live$1.generation += 1;
  const generation = live$1.generation;
  const watch = newWatch(pr, { now: await $.clock.now(), isFreshRun: start.isFreshRun });
  await update($, ciAtom$2, () => watch);
  await writeHub$1($);
  await clearCard($);
  every($, { ms: intervalOf(), generation, cwd });
  if (!start.isFreshRun)
    await poll($, { generation, cwd });
}
async function finish$1($, step) {
  if (step.heard === null)
    return;
  if (step.heard === "fail") {
    live$1.cardId += 1;
    const card = { id: live$1.cardId, number: step.watch.number, url: step.watch.url, failing: step.watch.checks.filter((check) => check.state === "fail") };
    await update($, ciCardAtom, () => card);
  }
  const sent = await $.ui.notify(notifyText(step.watch, step.heard), { title: words().ci.eyebrow }).catch(() => null);
  if (sent === null || !sent.isSent)
    debug$1($, "CI notification not sent");
}
async function answers($, watch, cwd) {
  const n = String(watch.number);
  const checks = await run($, ["gh", "pr", "checks", n, "--json", CHECK_FIELDS], cwd);
  const pr = await run($, ["gh", "pr", "view", n, "--json", POLL_FIELDS], cwd);
  return { checks: checks === null ? null : checksOf(checks.stdout), pr: pr === null || pr.exitCode !== 0 ? null : prPollOf(pr.stdout) };
}
async function poll($, spec) {
  if (live$1.isPolling)
    return;
  live$1.isPolling = true;
  try {
    const watch = await read($, ciAtom$2);
    if (watch === null || watch.phase !== "watching" || spec.generation !== live$1.generation)
      return;
    if (!await read($, enabledAtom$2))
      return stop();
    const got = await answers($, watch, spec.cwd);
    if (spec.generation !== live$1.generation)
      return;
    const step = stepOf(watch, { ...got, now: await $.clock.now() });
    await update($, ciAtom$2, () => step.watch);
    await writeHub$1($);
    if (step.isDone)
      stop();
    else if (isBackoffPoll(step.watch.polls))
      every($, { generation: spec.generation, cwd: spec.cwd, ms: CI_SLOW_POLL_MS });
    await finish$1($, step);
  } finally {
    live$1.isPolling = false;
  }
}
function outputOf(result) {
  const record = result.result;
  const stdout = typeof record?.stdout === "string" ? record.stdout : "";
  return `${result.text ?? ""}
${stdout}`;
}
function startQuietly($, start) {
  startWatch($, start).catch((error) => debug$1($, `CI watch did not start (${String(error)})`));
}
function hookCi(on) {
  on("state.set", { plugin: "test-badge", key: "isEnabled" }, async ($, e, next) => {
    const done = await next(e);
    if (e.value === true)
      startQuietly($, { selector: null, isFreshRun: false });
    else
      stop();
    return done;
  }).catch(($, e, next) => next(e));
  on("tool.call", { tool: "Bash" }, async ($, e, next) => {
    const result = await next(e);
    const command = String(e.command ?? "");
    if (result.deny !== undefined || result.isError === true)
      return result;
    const ref = isPrCreate(command) ? prRefOf(outputOf(result)) : null;
    if (isPrCreate(command) || isGitPush(command)) {
      startQuietly($, { selector: ref === null ? null : String(ref.number), isFreshRun: true });
    }
    return result;
  }).catch(($, e, next) => next(e));
}

function pathOf(failure, root) {
  if (failure.file === null)
    return null;
  return /^([A-Za-z]:)?\//.test(failure.file) ? failure.file : `${root}/${failure.file}`;
}
function placeOf(failure) {
  return failure.line === null ? failure.file ?? "" : `${failure.file}:${failure.line}`;
}
function openCandidates(template, target, isWindows = false) {
  const line = String(target.line ?? 1);
  if (template.trim() !== "")
    return [template.trim().split(/\s+/).map((arg) => arg.replace("{file}", target.path).replace("{line}", line))];
  if (isWindows)
    return /[&|<>^"%]/.test(target.path) ? [] : [["cmd", "/c", "code", "-g", `${target.path}:${line}`], ["cmd", "/c", "start", "", target.path]];
  return [["code", "-g", `${target.path}:${line}`], ["open", target.path], ["xdg-open", target.path]];
}

const MAX_LINES = 20;
const live = { offer: null };
function outcomeLines(outcome) {
  const failures = outcome.failures.slice(0, MAX_LINES).map((failure) => `${placeOf(failure)} ${failure.name} — ${failure.message}`.trim());
  return failures.length > 0 ? failures : outcome.tail;
}
function contextOf(badge, commands) {
  const root = badge.root ?? ".";
  const runs = [[badge.tests, commands.test], [badge.lint, commands.lint]];
  const parts = runs.flatMap(([outcome, argv]) => outcome === null || outcome.status === "pass" || argv === null ? [] : [[words().fixContext(argv.join(" "), root), ...outcomeLines(outcome)].join(`
`)]);
  return parts.join(`

`);
}
async function offerFix(suggest, run) {
  const context = contextOf(run.badge, run.commands);
  if (context === "") {
    live.offer = null;
    return;
  }
  live.offer = { text: words().fixSuggestion, context };
  await suggest(live.offer.text);
}
function hookHandoff(on) {
  on("prompt.submit", async ($, e, next) => {
    const offer = live.offer;
    if (offer === null || e.text.trim() !== offer.text)
      return next(e);
    live.offer = null;
    return next({ ...e, context: [...e.context ?? [], offer.context] });
  }).catch(($, e, next) => next(e));
}

function overridesOf(options) {
  return { test: String(options.testCommand ?? ""), lint: String(options.lintCommand ?? ""), open: String(options.openCommand ?? "") };
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

const dismissed = new Set;
const commandText = (argv) => argv.join(" ");
async function isAllowed(io, asked) {
  const key = `${asked.root}
${asked.commands.map(commandText).join(`
`)}`;
  const saved = await io.get();
  const answers = typeof saved === "object" && saved !== null ? saved : {};
  if (typeof answers[key] === "boolean")
    return answers[key];
  if (dismissed.has(key))
    return false;
  const says = words().consent;
  let answer;
  try {
    answer = await io.ask(says.question(asked.commands.map(commandText), asked.root), { options: [says.yes, says.no], header: says.header });
  } catch (error) {
    dismissed.add(key);
    io.log(`test-badge: the run question went unanswered (${String(error)})`);
    return false;
  }
  const isYes = answer === says.yes;
  await io.set({ ...answers, [key]: isYes });
  return isYes;
}

const NPM_DEFAULT_TEST = "no test specified";
const SOURCE_EXT = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "mts",
  "cts",
  "vue",
  "svelte",
  "py",
  "go",
  "rs",
  "php",
  "rb",
  "java",
  "kt",
  "kts",
  "swift",
  "dart",
  "c",
  "h",
  "cc",
  "cpp",
  "hpp",
  "cs",
  "scala",
  "ex",
  "exs",
  "lua"
]);
const PROBED_TEXTS = ["package.json", "pyproject.toml", "setup.cfg", "tox.ini", "go.mod", "pubspec.yaml"];
const PYTHON_MARKS = ["pyproject.toml", "setup.py", "setup.cfg"];
function isSource(path) {
  const name = path.split(/[\\/]/).pop() ?? "";
  const dot = name.lastIndexOf(".");
  return dot > 0 && SOURCE_EXT.has(name.slice(dot + 1).toLowerCase());
}
function runnerOf(names) {
  if (names.has("pnpm-lock.yaml"))
    return ["pnpm"];
  if (names.has("yarn.lock"))
    return ["yarn"];
  if (names.has("bun.lockb") || names.has("bun.lock"))
    return ["bun", "run"];
  return ["npm", "run", "--silent"];
}
function scriptsOf(text) {
  if (text === undefined)
    return {};
  try {
    const parsed = JSON.parse(text);
    const scripts = parsed?.scripts;
    return typeof scripts === "object" && scripts !== null ? scripts : {};
  } catch {
    return {};
  }
}
function hasPytest(root) {
  if (root.names.has("pytest.ini") || root.names.has("conftest.py"))
    return true;
  return ["pyproject.toml", "setup.cfg", "tox.ini"].some((name) => (root.texts[name] ?? "").includes("pytest"));
}
function phpTool(root, tool) {
  return root.hasVendorBin(tool) ? `vendor/bin/${tool}` : tool;
}
function pythonOf(names) {
  if (names.has(".venv"))
    return [".venv/bin/python"];
  if (names.has("venv"))
    return ["venv/bin/python"];
  return names.has("poetry.lock") ? ["poetry", "run", "python"] : ["python3"];
}
const has = (root, ...names) => names.some((name) => root.names.has(name));
function pythonTest(root) {
  if (hasPytest(root))
    return [...pythonOf(root.names), "-m", "pytest", "-q"];
  const folder = ["tests", "test"].find((name) => root.names.has(name));
  return has(root, ...PYTHON_MARKS) && folder !== undefined ? [...pythonOf(root.names), "-m", "unittest", "discover", "-s", folder, "-t", "."] : null;
}
function buildTest(root) {
  if (has(root, "build.gradle", "build.gradle.kts"))
    return [has(root, "gradlew") ? "./gradlew" : "gradle", "test", "-q"];
  if (has(root, "pom.xml"))
    return [has(root, "mvnw") ? "./mvnw" : "mvn", "-q", "test"];
  if (has(root, "Package.swift"))
    return ["swift", "test"];
  if (has(root, ".rspec", "spec") && has(root, "Gemfile"))
    return ["bundle", "exec", "rspec"];
  return null;
}
function detectTest(root, scripts) {
  const test = scripts.test;
  if (typeof test === "string" && !test.includes(NPM_DEFAULT_TEST))
    return [...runnerOf(root.names), "test"];
  if (has(root, "deno.json", "deno.jsonc"))
    return ["deno", "test"];
  const python = pythonTest(root);
  if (python !== null)
    return python;
  if (root.names.has("go.mod"))
    return ["go", "test", "./..."];
  if (root.names.has("Cargo.toml"))
    return ["cargo", "test", "-q"];
  if (root.names.has("pubspec.yaml") && root.names.has("test"))
    return /sdk:\s*flutter/.test(root.texts["pubspec.yaml"] ?? "") ? ["flutter", "test"] : ["dart", "test"];
  if (root.names.has("phpunit.xml") || root.names.has("phpunit.xml.dist"))
    return [phpTool(root, "phpunit")];
  return buildTest(root);
}
function detectLint(root, scripts) {
  if (typeof scripts.lint === "string")
    return [...runnerOf(root.names), "lint"];
  if (root.names.has("phpstan.neon") || root.names.has("phpstan.neon.dist"))
    return [phpTool(root, "phpstan"), "analyse", "--no-progress", "--no-ansi"];
  return null;
}
function goModuleOf(root) {
  return /^module\s+(\S+)/m.exec(root.texts["go.mod"] ?? "")?.[1] ?? null;
}
function detect(root, overrides) {
  const scripts = scriptsOf(root.texts["package.json"]);
  const shell = (command) => ["/bin/sh", "-c", command];
  return {
    test: overrides.test.trim() !== "" ? shell(overrides.test) : detectTest(root, scripts),
    lint: overrides.lint.trim() !== "" ? shell(overrides.lint) : detectLint(root, scripts)
  };
}
function spawnArgv(argv, isWindows) {
  if (!isWindows)
    return [...NICE, ...argv];
  const [head = "", ...rest] = argv;
  if (head === "/bin/sh")
    return ["cmd", "/c", rest[1] ?? ""];
  const tool = head === "python3" ? "python" : head.replace(/\/bin\/python$/, "/Scripts/python").replace(/\//g, "\\");
  return ["cmd", "/c", tool, ...rest];
}

const NO_OVERRIDES = { test: "", lint: "" };
const DART_TEST = /_test\.dart$/;
async function rootInfo(fs, dir) {
  const names = new Set(await fs.list(dir));
  const texts = {};
  for (const name of PROBED_TEXTS.filter((file) => names.has(file)))
    texts[name] = await fs.read(`${dir}/${name}`);
  const vendor = new Set;
  for (const tool of VENDOR_TOOLS)
    if (await fs.exists(`${dir}/vendor/bin/${tool}`))
      vendor.add(tool);
  return { names, texts, hasVendorBin: (tool) => vendor.has(tool) };
}
function foldersUp(file, cwd) {
  const top = cwd.replace(/[\\/]$/, "");
  const path = file.replace(/\\/g, "/");
  if (!path.startsWith(`${top.replace(/\\/g, "/")}/`))
    return [];
  const parts = path.slice(top.length + 1).split("/").slice(0, -1);
  return parts.map((_, k) => `${top}/${parts.slice(0, parts.length - k).join("/")}`);
}
const hasChecks = (info) => {
  const found = detect(info, NO_OVERRIDES);
  return found.test !== null || found.lint !== null;
};
async function scopeOf(fs, spec) {
  const isConfigured = spec.overrides.test.trim() !== "" || spec.overrides.lint.trim() !== "";
  const folders = spec.file === null || isConfigured ? [] : foldersUp(spec.file, spec.cwd);
  for (const dir of folders) {
    const info = await rootInfo(fs, dir);
    if (hasChecks(info))
      return { root: dir, info };
  }
  return { root: spec.cwd, info: await rootInfo(fs, spec.cwd) };
}
async function focusedDart(fs, spec) {
  const isDart = spec.argv.length === 2 && (spec.argv[0] === "flutter" || spec.argv[0] === "dart") && spec.argv[1] === "test";
  if (!isDart)
    return spec.argv;
  const files = new Set;
  for (const path of spec.edited.filter((file) => file.startsWith(`${spec.root}/`))) {
    const rel = path.slice(spec.root.length + 1);
    if (rel.startsWith("test/") && DART_TEST.test(rel))
      files.add(rel);
    const mirror = rel.startsWith("lib/") ? `test/${rel.slice("lib/".length).replace(/\.dart$/, "_test.dart")}` : null;
    if (mirror !== null && await fs.exists(`${spec.root}/${mirror}`))
      files.add(mirror);
  }
  return [...spec.argv, ...files];
}

const badgeAtom$1 = atom({ plugin: "test-badge", key: "badge" }, EMPTY);
const ciAtom$1 = atom({ plugin: "test-badge", key: "ci" }, null);
const enabledAtom$1 = atom({ plugin: "test-badge", key: "isEnabled" }, true);
const filterAtom$1 = atom({ plugin: "test-badge", key: "filter" }, "all");
const noticeAtom$1 = atom({ plugin: "test-badge", key: "notice" }, null);
const commandsAtom$1 = atom({ plugin: "test-badge", key: "commands" }, null);
const themeAtom$1 = atom({ plugin: "test-badge", key: "theme" }, AUTO);
const hubRef = { plugin: "test-badge", key: "hub" };
const COMMAND$2 = "test-badge";
const STORE_KEY$1 = "test-badge.enabled";
const ALLOWED_KEY = "test-badge.allowed";
const NOT_FOUND_EXIT = 127;
const NOT_INSTALLED = /is not recognized as an internal or external command|No module named pytest/;
const flags = {
  edited: [],
  lastEdited: [],
  isRunning: false,
  queued: null,
  debounce: null,
  noticeId: 0,
  isWindows: false,
  status: null
};
const debug = ($, line) => $.ui.log(line, { to: "debug" });
function fsIo($) {
  return { list: async (dir) => (await $.fs.list(dir)).map((entry) => entry.name), read: (path) => $.fs.read(path), exists: (path) => $.fs.exists(path) };
}
function consentIo($) {
  return { get: () => $.store.get(ALLOWED_KEY), set: (value) => $.store.set(ALLOWED_KEY, value), ask: (question, options) => $.ui.ask(question, options), log: (line) => debug($, line) };
}
async function learnCommands($, overrides) {
  const info = await rootInfo(fsIo($), await $.session.cwd());
  await update($, commandsAtom$1, () => detect(info, overrides));
}
async function check($, argv, how) {
  const started = await $.clock.now();
  try {
    const out = await $.process.run(spawnArgv(argv, flags.isWindows), { cwd: how.ctx.root, timeoutMs: TIMEOUT_MS, env: { CI: "1", FORCE_COLOR: "0" } });
    const text = `${out.stdout}
${out.stderr}`;
    if (out.exitCode === NOT_FOUND_EXIT || out.exitCode !== 0 && NOT_INSTALLED.test(text))
      return null;
    return how.parse(text, out.exitCode, how.ctx);
  } catch {
    const isTimeout = await $.clock.now() - started >= TIMEOUT_MS - TIMEOUT_SLACK_MS;
    return { status: isTimeout ? "timeout" : "error", passed: null, total: null, errors: null, failures: [], tail: [] };
  }
}
async function showStatus($) {
  const badge = await read($, badgeAtom$1);
  const isShown = await read($, enabledAtom$1) && isFailing(badge);
  const text = isShown ? badgeText(badge, await $.clock.now()) : undefined;
  if (text === flags.status)
    return;
  flags.status = text;
  $.ui.status(text);
}
async function notify($, badge) {
  flags.noticeId += 1;
  const id = flags.noticeId;
  const now = await $.clock.now();
  const text = badgeText(badge, now) ?? "";
  const expiresAt = now + DISMISS_AFTER_MS;
  await update($, noticeAtom$1, () => ({ id, text, isFailing: isFailing(badge), hasDetails: isFailing(badge), priority: PRIORITY, expiresAt }));
  $.clock.after(DISMISS_AFTER_MS, () => {
    update($, noticeAtom$1, (current) => current !== null && current.id === id ? null : current);
  });
}
async function writeHub($) {
  const standing = (await $.state.get(hubRef)).value;
  const card = hubCardOf({ badge: await read($, badgeAtom$1), ci: await read($, ciAtom$1), standing, at: await $.clock.now() });
  if (card !== null)
    await $.state.set(hubRef, card);
}
async function planOf($, overrides, request) {
  const scope = await scopeOf(fsIo($), { file: request.edited.at(-1) ?? null, cwd: await $.session.cwd(), overrides });
  const found = detect(scope.info, overrides);
  const isFound = found.test !== null || found.lint !== null;
  const asked = { root: scope.root, commands: [found.test, found.lint].filter((argv) => argv !== null) };
  const isOk = isFound && (!request.isAuto || await isAllowed(consentIo($), asked));
  const test = found.test === null ? null : await focusedDart(fsIo($), { argv: found.test, root: scope.root, edited: request.edited });
  return { ...scope, commands: { test, lint: found.lint }, isFound, isOk };
}
async function finish($, run) {
  await update($, commandsAtom$1, () => run.commands);
  await update($, badgeAtom$1, () => run.badge);
  await writeHub($);
  await update($, filterAtom$1, () => "all");
  await showStatus($);
  await offerFix((text) => $.prompt.suggest({ text }).catch((error) => debug($, `test-badge: no suggestion (${String(error)})`)), run);
  if (run.badge.finishedAt !== null)
    await notify($, run.badge);
}
async function runChecks($, overrides, request) {
  const { root, info, commands, isFound, isOk } = await planOf($, overrides, request);
  await update($, commandsAtom$1, () => commands);
  if (!isFound)
    debug($, "test-badge: no test or lint command found here");
  if (!isOk)
    return;
  const ctx = { root, goModule: goModuleOf(info) };
  const started = await $.clock.now();
  await update($, badgeAtom$1, (badge) => ({ ...badge, isRunning: true }));
  await writeHub($);
  await showStatus($);
  const tests = commands.test === null ? null : await check($, commands.test, { parse: parseTests, ctx });
  const lint = commands.lint === null ? null : await check($, commands.lint, { parse: parseLint, ctx });
  const finishedAt = await $.clock.now();
  const ran = { test: tests === null ? null : commands.test, lint: lint === null ? null : commands.lint };
  const isNone = tests === null && lint === null;
  await finish($, { badge: isNone ? EMPTY : { tests, lint, root, finishedAt, durationMs: finishedAt - started, isRunning: false }, commands: ran });
}
async function runAll($, overrides, request) {
  if (flags.isRunning) {
    flags.queued = request;
    return;
  }
  flags.isRunning = true;
  try {
    await runChecks($, overrides, request);
  } catch (error) {
    debug($, `test-badge: run failed (${error instanceof Error ? error.message : "unknown"})`);
    await update($, badgeAtom$1, (badge) => ({ ...badge, isRunning: false }));
    await writeHub($);
  } finally {
    flags.isRunning = false;
  }
  const queued = flags.queued;
  flags.queued = null;
  if (queued !== null)
    await runAll($, overrides, queued);
}
function schedule($, overrides) {
  flags.debounce?.cancel();
  flags.debounce = $.clock.after(DEBOUNCE_MS, () => {
    flags.debounce = null;
    const request = { edited: flags.edited, isAuto: true };
    flags.lastEdited = flags.edited;
    flags.edited = [];
    runAll($, overrides, request).catch((error) => debug($, `test-badge: run failed (${String(error)})`));
  });
}
async function startSession($, overrides) {
  setLang(await $.env.get("MODZ_LANG").catch(() => {
    return;
  }));
  flags.isWindows = await $.env.get("OS").catch(() => {
    return;
  }) === "Windows_NT";
  flags.status = null;
  await learnCommands($, overrides).catch(() => debug($, "test-badge: could not look for commands"));
  try {
    const saved = await $.store.get(STORE_KEY$1);
    await update($, enabledAtom$1, () => saved !== false);
    const pinned = await $.env.get("MODZ_THEME").catch(() => {
      return;
    });
    await update($, themeAtom$1, () => themeFrom(pinned));
    await writeHub($);
    await $.command.register({ name: COMMAND$2, description: words().commandHelp, argumentHint: "[on|off|run|details]" });
    $.clock.every(REFRESH_MS, () => {
      read($, badgeAtom$1).then((badge) => badge.finishedAt === null ? undefined : showStatus($));
    });
  } catch {
    debug($, "test-badge: could not load settings");
  }
}
function hookTurns(on, overrides) {
  on("tool.call", async ($, e, next) => {
    const result = await next(e);
    const path = e.file_path;
    const isEdit = WRITE_TOOLS.has(String(e.tool)) && typeof path === "string" && isSource(path);
    if (isEdit && result.deny === undefined && result.isError !== true)
      flags.edited.push(path);
    return result;
  }).catch(($, e, next) => next(e));
  on("turn.start", async ($, e, next) => {
    if (e.agentId === undefined) {
      flags.debounce?.cancel();
      flags.debounce = null;
    }
    return next(e);
  });
  on("turn.complete", async ($, e, next) => {
    if (e.agentId === undefined && flags.edited.length > 0 && await read($, enabledAtom$1))
      schedule($, overrides);
    return next(e);
  });
}
function hookRuns(on, overrides) {
  on("session.start", async ($, e, next) => {
    await startSession($, overrides);
    return next(e);
  });
  hookTurns(on, overrides);
  on("state.set", { plugin: "test-badge", key: "rerun" }, async ($, e, next) => {
    const done = await next(e);
    runAll($, overrides, { edited: flags.lastEdited, isAuto: false }).catch((error) => debug($, `test-badge: run failed (${String(error)})`));
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "test-badge", key: "isEnabled" }, async ($, e, next) => {
    const done = await next(e);
    await showStatus($);
    return done;
  }).catch(($, e, next) => next(e));
}

const VERDICT = { size: 16, weight: 600 };
const VERDICT_LINE = 22;
const VERDICT_BASE = 18;
const VERDICT_LINES = 3;
const NAME = { size: 13, weight: 500 };
const RESULT = { size: 12 };
const COMMAND$1 = { size: 11.5, isMono: true };
const NOTE = { size: 12 };
const NOTE_LINE = 17;
const NOTE_LINES = 8;
const LOCAL_ROW_H = 42;
const BARE_ROW_H = 26;
const LOCAL_NAME_BASE = 16;
const LOCAL_COMMAND_BASE = 33;
const LOCAL_DOT_Y = 12;
const LOCAL_NAME_X = 20;
const LOCAL_GAP = 12;
const METER_H = 4;
const METER_ROOM = 10;
const WRAP_SLACK = 12;
const NOTE_GAP = 18;
const BOTTOM = 6;
const TITLE = { size: 13, weight: 560 };
const SPAN = { size: 11.5, isMono: true };
const MESSAGE = { size: 11.5, isMono: true };
const META = { size: 12 };
const PATH = { size: 13, weight: 560 };
const FILE_H = 26;
const ROW_BASE = 17;
const NAME_LINE = 18;
const MESSAGE_GAP = 19;
const MESSAGE_LINE = 16;
const ROW_PAD = 9;
const ROW_TOP = 4;
const TEXT_INDENT = 16;
const SPAN_GAP = 10;
const CHEVRON = 14;
const CHEVRON_ROOM = 24;
const EDGE = 8;
const NAME_LINES = 4;
const MESSAGE_LINES = 8;
const inkOf = (tone) => tone === "neutral" ? "hi" : tone;
function verdictSvg(frame, verdict) {
  const lines = wrapText(verdict.sentence, { width: frame.width, font: VERDICT, maxLines: VERDICT_LINES });
  const body = lines.map((line, n) => text({ ...VERDICT, x: 0, y: VERDICT_BASE + n * VERDICT_LINE, text: line, ink: inkOf(verdict.tone) }));
  const height = VERDICT_BASE + (lines.length - 1) * VERDICT_LINE + BOTTOM;
  return { source: svgDoc({ width: frame.width, height, mode: frame.mode, body: body.join("") }), width: frame.width, height, alt: verdict.sentence };
}
function localRow(frame, row, spec) {
  const { top, meter } = spec;
  const room = frame.width - LOCAL_NAME_X - measure(row.result, RESULT) - LOCAL_GAP;
  const command = row.command === null ? "" : text({ ...COMMAND$1, x: LOCAL_NAME_X, y: top + LOCAL_COMMAND_BASE, text: fit(row.command, frame.width - LOCAL_NAME_X, COMMAND$1), ink: "lo" });
  const svg = dotOf(row.state, { cy: top + LOCAL_DOT_Y, role: row.role }) + text({ ...NAME, x: LOCAL_NAME_X, y: top + LOCAL_NAME_BASE, text: fit(row.name, room, NAME), ink: "hi" }) + text({ ...RESULT, x: frame.width, y: top + LOCAL_NAME_BASE, text: row.result, ink: row.role, anchor: "end" }) + command;
  const height = row.command === null ? BARE_ROW_H : LOCAL_ROW_H;
  if (meter === null)
    return { svg, height };
  const drawn = bar({ x: LOCAL_NAME_X, y: top + height - METER_H / 2, width: frame.width - LOCAL_NAME_X, height: METER_H, total: meter.total, value: meter.passed, ink: meter.passed === meter.total ? "moss" : "lo" });
  return { svg: svg + drawn, height: height + METER_ROOM };
}
function localPartSvg(frame, part) {
  const rows = [];
  let y = PART_H;
  for (const [index, row] of part.rows.entries()) {
    const drawn = localRow(frame, row, { top: y, meter: index === 0 ? part.meter : null });
    rows.push(drawn.svg);
    y += drawn.height;
  }
  const notes = wrapText(part.note, { width: frame.width - WRAP_SLACK, font: NOTE, maxLines: NOTE_LINES });
  const noteSvg = notes.map((line, n) => text({ ...NOTE, x: 0, y: y + NOTE_GAP + n * NOTE_LINE, text: line, ink: part.rows.length === 0 ? "mid" : "lo" }));
  const height = y + NOTE_GAP + (notes.length - 1) * NOTE_LINE + BOTTOM;
  const body = partHead({ width: frame.width, label: part.title, meta: part.meta, isLive: part.isLive }) + rows.join("") + noteSvg.join("");
  const said = part.rows.map((row) => `${row.name}${row.command === null ? "" : ` (${row.command})`}: ${row.result}`);
  return { source: svgDoc({ width: frame.width, height, mode: frame.mode, body }), width: frame.width, height, alt: [part.title, ...said, part.note].join(". ") };
}
function fileHeadSvg(frame, spec) {
  const count = words().errorCount(spec.count);
  const room = frame.width - 34 - measure(count, META) - CHEVRON_ROOM;
  const path = spec.file ?? words().noFile;
  const cut = path.lastIndexOf("/");
  const name = fit(path.slice(cut + 1), room, PATH);
  const dir = fitStart(path.slice(0, cut + 1), Math.max(0, room - measure(name, PATH)), { size: PATH.size });
  const body = fileBadge({ x: 0, y: 5, path }) + runs({ x: 34, y: 17.5, size: PATH.size, parts: [{ text: dir === "…" ? "" : dir, ink: "lo", weight: 500 }, { text: name, ink: "hi", weight: PATH.weight }] }) + text({ ...META, x: frame.width - CHEVRON_ROOM, y: 17.5, text: count, ink: "lo", anchor: "end" });
  return { source: svgDoc({ width: frame.width, height: FILE_H, mode: frame.mode, body }), width: frame.width, height: FILE_H, alt: `${path}: ${count}` };
}
function rowSvg(frame, failure, isPressable) {
  const right = frame.width - (isPressable ? CHEVRON_ROOM : EDGE);
  const base = ROW_TOP + ROW_BASE;
  const place = text({ ...SPAN, x: TEXT_INDENT, y: base, text: spanOf(failure), ink: "lo" });
  const meta = [suiteTag(failure.suite), durationText(failure.durationMs)].filter((part) => part !== "").join(" · ");
  const titleX = TEXT_INDENT + measure(spanOf(failure), SPAN) + SPAN_GAP;
  const isInline = measure(failure.name, TITLE) <= right - titleX - measure(meta, META) - 14;
  const names = isInline ? [failure.name] : wrapText(failure.name, { width: right - TEXT_INDENT * 2, font: TITLE, maxLines: NAME_LINES });
  const title = names.map((line, n) => text({ ...TITLE, x: isInline ? titleX : TEXT_INDENT, y: base + (isInline ? 0 : (n + 1) * NAME_LINE), text: line, ink: "hi" }));
  const metaText = text({ ...META, x: right, y: base, text: meta, ink: "lo", anchor: "end" });
  const nameBottom = base + (isInline ? 0 : names.length * NAME_LINE);
  const messages = failure.message === "" ? [] : wrapText(failure.message, { width: right - TEXT_INDENT * 2, font: MESSAGE, maxLines: MESSAGE_LINES });
  const message = messages.map((line, n) => text({ ...MESSAGE, x: TEXT_INDENT, y: nameBottom + MESSAGE_GAP + n * MESSAGE_LINE, text: line, ink: "mid" }));
  const height = (messages.length === 0 ? nameBottom : nameBottom + MESSAGE_GAP + (messages.length - 1) * MESSAGE_LINE) + ROW_PAD;
  const chevron = isPressable ? icon("chevron", { x: frame.width - CHEVRON - 4, y: (height - CHEVRON) / 2, size: CHEVRON, ink: "lo", stroke: 1.5 }) : "";
  const source = svgDoc({ width: frame.width, height, mode: frame.mode, body: place + title.join("") + metaText + message.join("") + chevron });
  return { source, width: frame.width, height, alt: `${spanOf(failure)} ${failure.name}${failure.message === "" ? "" : `: ${failure.message}`}` };
}
function tailHeadSvg(frame, title) {
  const body = icon("x", { x: 0, y: 5, size: 16, ink: "flare", stroke: 1.5 }) + text({ ...TITLE, x: 24, y: 16.5, text: fit(title, frame.width - 24, TITLE), ink: "hi" });
  return { source: svgDoc({ width: frame.width, height: FILE_H, mode: frame.mode, body }), width: frame.width, height: FILE_H, alt: title };
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

const LINE_WIDTH = 4;
const ROW_INDENT$1 = 4;
const ROW_GLYPH = "› ";
const NAME_GAP = "  ";
const MESSAGE_INDENT = ROW_GLYPH.length + LINE_WIDTH + NAME_GAP.length;
const BAR_MAX = 40;
const BAR_MIN = 8;
const colorOf = (tone) => tone === "neutral" ? { dimColor: true } : { color: THEME_KEY[tone] };
const clip = (text, max) => text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text;
function unplacedOf(spec) {
  const { outcome } = spec;
  if (outcome === null || outcome.status === "pass" || outcome.failures.length > 0)
    return null;
  const says = words();
  const why = { timeout: says.whyTimeout, error: says.whyNotStarted };
  return { title: `${says.checkNames[spec.name]} ${why[outcome.status] ?? says.whyUnread}`, lines: outcome.tail };
}
function chipRow(ui, view) {
  const { Box, Button } = ui;
  return h(Box, {
    flexDirection: "row",
    columnGap: 1,
    flexWrap: "wrap"
  }, chipsOf(view.badge, view.filter).map((chip) => h(Button, {
    key: `tb-filter-${chip.filter}`,
    label: `${chip.label} ${chip.count}`,
    plain: true,
    dimColor: chip.filter !== view.filter,
    onPress: () => view.onFilter(chip.filter)
  })));
}
function rerunRow(ui, view) {
  const { Box, Button } = ui;
  return h(Box, {
    flexDirection: "row"
  }, h(Button, {
    key: "tb-rerun",
    variant: "secondary",
    hotkey: "r",
    label: runLabelOf(view.commands),
    onPress: view.onRerun
  }));
}
function barText(ui, view) {
  const { Box, Text } = ui;
  const tests = view.badge.tests;
  if (tests === null || tests.total === null || tests.passed === null || tests.total === 0)
    return null;
  const width = Math.max(BAR_MIN, Math.min(BAR_MAX, view.columns - 2));
  const passed = Math.round(width * tests.passed / tests.total);
  return h(Box, {
    flexDirection: "row"
  }, h(Text, {
    color: "success"
  }, "━".repeat(passed)), h(Text, {
    color: "error"
  }, "━".repeat(width - passed)));
}
function rowText(ui, view, failure) {
  const { Box, Text, Button } = ui;
  const index = failuresOf(view.badge).indexOf(failure);
  const line = failure.line === null ? "" : String(failure.line);
  const meta = [suiteTag(failure.suite), durationText(failure.durationMs)].filter((part) => part !== "").join(" · ");
  const label = clip(`${ROW_GLYPH}${line.padStart(LINE_WIDTH)}${NAME_GAP}${failure.name}`, view.columns - ROW_INDENT$1 - meta.length - 2);
  return h(Box, {
    key: `tb-row-${index}`,
    flexDirection: "column",
    paddingLeft: ROW_INDENT$1
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, failure.file === null ? h(Text, null, label) : h(Button, {
    key: `tb-open-${index}`,
    plain: true,
    label,
    onPress: () => view.onOpen(failure)
  }), h(Text, {
    dimColor: true
  }, meta)), failure.message !== "" && h(Box, {
    paddingLeft: MESSAGE_INDENT
  }, h(Text, {
    dimColor: true,
    wrap: "wrap"
  }, failure.message)));
}
function failuresText(ui, view) {
  const { Box, Text } = ui;
  return groupsOf(view.badge, view.filter).map((group) => h(Box, {
    key: `tb-file-${group.file ?? "-"}`,
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    bold: true,
    wrap: "truncate-start"
  }, `  ${group.file ?? words().noFile}`), h(Text, {
    dimColor: true
  }, `· ${words().errorCount(group.failures.length)}`)), group.failures.map((failure) => rowText(ui, view, failure))));
}
function tailText(ui, spec) {
  const { Box, Text } = ui;
  const unplaced = unplacedOf(spec);
  if (unplaced === null)
    return null;
  return h(Box, {
    key: `tb-tail-${spec.name}`,
    flexDirection: "column"
  }, h(Text, {
    bold: true
  }, unplaced.title), unplaced.lines.map((line, index) => h(Text, {
    key: `tb-tail-${spec.name}-${index}`,
    dimColor: true,
    wrap: "wrap"
  }, `   ${line}`)));
}
function textPane(ui, view) {
  const { Box, Text } = ui;
  const { badge } = view;
  const state = { badge, ci: view.ci, commands: view.commands };
  const verdict = verdictOf(state);
  const rows = localRowsOf(state);
  const says = words().local;
  return h(Box, {
    flexDirection: "column"
  }, h(Box, {
    key: "tb-verdict"
  }, h(Text, {
    bold: true,
    wrap: "wrap",
    ...verdict.tone === "neutral" ? {} : colorOf(verdict.tone)
  }, verdict.sentence)), h(Text, null, " "), h(Box, {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 1
  }, h(Text, {
    bold: true,
    dimColor: true
  }, `${badge.isRunning ? "◐ " : ""}${says.title}`), h(Text, {
    dimColor: true
  }, runMeta(badge, view.now))), rows.map((row) => h(Box, {
    key: `tb-local-${row.name}`,
    flexDirection: "column"
  }, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    ...look(row.role)
  }, GLYPH[row.state]), h(Text, null, row.name), h(Text, {
    ...look(row.role)
  }, row.result)), row.command !== null && h(Text, {
    dimColor: true,
    wrap: "truncate"
  }, `  ${row.command}`))), barText(ui, view), h(Text, {
    dimColor: true,
    wrap: "wrap"
  }, rows.length === 0 ? says.none : says.when), h(Text, null, " "), isFailing(badge) && chipRow(ui, view), isFailing(badge) && failuresText(ui, view), isFailing(badge) && view.filter === "all" && tailText(ui, { name: "tests", outcome: badge.tests }), isFailing(badge) && view.filter === "all" && tailText(ui, { name: "lint", outcome: badge.lint }), isFailing(badge) && h(Text, null, " "), rerunRow(ui, view), h(Text, null, " "), ciPart(ui, view));
}

const ROW_INDENT = 2;
const WIDTH = { min: 300, max: 880 };
const ROW_WIDTH = { min: 220, max: 880, reserve: ROW_INDENT };
const failureKey = (failure) => `${failure.suite}:${failure.file ?? "-"}:${failure.line ?? "-"}:${failure.name}:${failure.message}`;
function failureRow(ui, view, spec) {
  const { failure, index } = spec;
  const isPressable = failure.file !== null;
  const frame = { width: spec.width, mode: view.theme.mode };
  const drawing = picture(ui, rowSvg(frame, failure, isPressable), `tb-svg-${failureKey(failure)}`, { isRow: isPressable });
  if (!isPressable)
    return drawing;
  return PressRow(ui, { box: `tb-press-${index}`, key: `tb-open-${index}`, drawing, onPress: () => view.onOpen(failure) });
}
function groupTree(ui, view, group) {
  const { Box } = ui;
  const all = failuresOf(view.badge);
  const width = svgWidth(view.columns, ROW_WIDTH);
  const head = fileHeadSvg({ width: svgWidth(view.columns, WIDTH), mode: view.theme.mode }, { file: group.file, count: group.failures.length });
  return h(Box, {
    key: `tb-file-${group.file ?? "-"}`,
    flexDirection: "column"
  }, picture(ui, head, `tb-head-${group.file ?? "-"}`), group.failures.map((failure) => {
    const index = all.indexOf(failure);
    return h(Box, {
      key: `tb-row-${index}`,
      flexDirection: "row",
      paddingLeft: ROW_INDENT
    }, failureRow(ui, view, { failure, index, width }));
  }));
}
function tailTree(ui, view, spec) {
  const { Box, Text } = ui;
  const unplaced = unplacedOf(spec);
  if (unplaced === null)
    return null;
  const drawing = tailHeadSvg({ width: svgWidth(view.columns, WIDTH), mode: view.theme.mode }, unplaced.title);
  return h(Box, {
    key: `tb-tail-${spec.name}`,
    flexDirection: "column"
  }, picture(ui, drawing, `tb-tail-head-${spec.name}`), unplaced.lines.map((line, index) => h(Text, {
    key: `tb-tail-${spec.name}-${index}`,
    dimColor: true,
    wrap: "wrap"
  }, `   ${line}`)));
}
function failuresTree(ui, view) {
  const { Box } = ui;
  if (!isFailing(view.badge))
    return null;
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, chipRow(ui, view), groupsOf(view.badge, view.filter).map((group) => groupTree(ui, view, group)), view.filter === "all" && tailTree(ui, view, { name: "tests", outcome: view.badge.tests }), view.filter === "all" && tailTree(ui, view, { name: "lint", outcome: view.badge.lint }));
}
function meterOf({ tests, ...badge }) {
  if (badge.isRunning || tests === null || tests.total === null || tests.passed === null)
    return null;
  return { passed: tests.passed, total: tests.total };
}
function localPart(ui, view, state) {
  const frame = { width: svgWidth(view.columns, WIDTH), mode: view.theme.mode };
  const says = words().local;
  const rows = localRowsOf(state);
  const part = { title: says.title, meta: runMeta(view.badge, view.now), isLive: view.badge.isRunning, rows, meter: meterOf(view.badge), note: rows.length === 0 ? says.none : says.when };
  return picture(ui, localPartSvg(frame, part), "tb-local", { shows: { frame, part: { ...part, meta: view.badge.finishedAt } } });
}
function paneTree(ui, view) {
  const { Box } = ui;
  if (!view.isRich)
    return textPane(ui, view);
  const state = { badge: view.badge, ci: view.ci, commands: view.commands };
  const frame = { width: svgWidth(view.columns, WIDTH), mode: view.theme.mode };
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, picture(ui, verdictSvg(frame, verdictOf(state)), "tb-verdict"), localPart(ui, view, state), failuresTree(ui, view), rerunRow(ui, view), ciPart(ui, view));
}

const badgeAtom = atom({ plugin: "test-badge", key: "badge" }, EMPTY);
const ciAtom = atom({ plugin: "test-badge", key: "ci" }, null);
const enabledAtom = atom({ plugin: "test-badge", key: "isEnabled" }, true);
const filterAtom = atom({ plugin: "test-badge", key: "filter" }, "all");
const noticeAtom = atom({ plugin: "test-badge", key: "notice" }, null);
const commandsAtom = atom({ plugin: "test-badge", key: "commands" }, null);
const themeAtom = atom({ plugin: "test-badge", key: "theme" }, AUTO);
const rerunAtom = atom({ plugin: "test-badge", key: "rerun" }, 0);
const COMMAND = "test-badge";
const PANE = "test-badge";
const STORE_KEY = "test-badge.enabled";
const SWITCH_ARGS = new Map([["on", true], ["off", false]]);
const homeRef = { plugin: "test-badge", key: "home" };
async function openFailure($, failure, where) {
  const path = pathOf(failure, where.root);
  if (path === null)
    return;
  const isWindows = await $.env.get("OS").catch(() => {
    return;
  }) === "Windows_NT";
  for (const argv of openCandidates(where.template, { path, line: failure.line }, isWindows)) {
    const out = await $.process.run(argv, { timeoutMs: OPEN_TIMEOUT_MS }).catch(() => null);
    if (out !== null && out.exitCode === 0)
      return;
  }
  const place = placeOf(failure);
  const copied = await $.ui.copy({ text: place, surface: where.surface });
  $.ui.toast(copied.isCopied ? words().openCopied(place) : words().openFailed(place));
}
async function reportShown($) {
  try {
    if ((await $.state.get({ plugin: "modz", key: "isOn" })).value !== true)
      return;
    await $.state.set({ plugin: "test-badge", key: "shown" }, shownOf(HUB_PANE, await $.clock.now()));
  } catch (error) {
    $.ui.log(`test-badge: shown failed (${String(error)})`, { to: "debug" });
  }
}
async function openPane($) {
  motion.reset();
  const opened = await $.ui.open({ id: PANE, title: words().paneTitle, focus: true });
  if (opened.isPlaced)
    await reportShown($);
}
async function runCommand($, arg) {
  if (arg === "run") {
    await update($, rerunAtom, (count) => count + 1);
    return words().commandRunning;
  }
  if (arg === "details") {
    await openPane($);
    return words().commandDetails;
  }
  const isOn = SWITCH_ARGS.get(arg) ?? !await read($, enabledAtom);
  await update($, enabledAtom, () => isOn);
  await $.store.set(STORE_KEY, isOn);
  if (!isOn)
    await update($, noticeAtom, () => null);
  return words().commandSwitched(isOn);
}
function hookHub(on) {
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
}
function hookPane(on, overrides) {
  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) => {
    const badge = await read($, badgeAtom);
    const where = { root: badge.root ?? await $.session.cwd(), template: overrides.open, surface: e.surface };
    const isHubOn = (await $.state.get({ plugin: "modz", key: "isOn" })).value === true;
    const goHome = () => void $.clock.now().then((at) => $.state.set(homeRef, { at })).catch(() => $.ui.log("test-badge: could not go back to MODZ", { to: "debug" }));
    const ui = $.ui.resolve(e);
    const tree = paneTree(ui, {
      badge,
      now: await $.clock.now(),
      columns: e.props.bodyColumns,
      filter: await read($, filterAtom),
      theme: await read($, themeAtom),
      isRich: e.surface !== "terminal",
      onOpen: (failure) => void openFailure($, failure, where),
      onRerun: () => void update($, rerunAtom, (count) => count + 1),
      onFilter: (filter) => void update($, filterAtom, () => filter),
      ci: await read($, ciAtom),
      commands: await read($, commandsAtom)
    });
    return pinned(e, withHome(ui, tree, isHubOn ? goHome : null));
  });
}
const register = (on, options) => {
  const overrides = overridesOf(options);
  hookRuns(on, overrides);
  on("command.run", { command: COMMAND }, async ($, e) => ({ text: await runCommand($, e.args.trim().toLowerCase()) }));
  hookHub(on);
  hookBand(on);
  hookPane(on, overrides);
  hookCi(on);
  hookHandoff(on);
};

export { register };
