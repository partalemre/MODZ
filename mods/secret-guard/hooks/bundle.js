// Built by `bin/modz build` from the files beside it. Never edited by hand.
import { atom, read, update } from 'claude-code';

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const BITS_PER_CHAR = 6;
const BITS_PER_BYTE = 8;
const BYTE_MASK = 255;
const URL_TWIN = { "+": "-", "/": "_" };
function decodeBase64Url(text) {
  let buffer = 0;
  let bits = 0;
  let out = "";
  for (const char of text.replace(/=+$/, "")) {
    const value = ALPHABET.indexOf(URL_TWIN[char] ?? char);
    if (value < 0)
      return "";
    buffer = buffer << BITS_PER_CHAR | value;
    bits += BITS_PER_CHAR;
    if (bits >= BITS_PER_BYTE) {
      bits -= BITS_PER_BYTE;
      out += String.fromCharCode(buffer >> bits & BYTE_MASK);
    }
  }
  return out;
}
function isServiceRoleJwt(token) {
  const payload = token.split(".")[1];
  if (payload === undefined)
    return false;
  return /"role"\s*:\s*"service_role"/.test(decodeBase64Url(payload));
}

const ENTROPY_MIN = 3.5;
const GENERIC_MIN = 12;
const GENERIC_LONG = 24;
const MASK_KEEP = 4;
const SCAN_MAX_CHARS = 2000000;
const isMixed = (value) => /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
const isMixedCase = (value) => /[A-Z]/.test(value) && /[a-z]/.test(value);
const RULES = [
  { kind: "anthropic", label: "Anthropic API key", pattern: /sk-ant-[A-Za-z0-9_-]{20,}/g, envName: "ANTHROPIC_API_KEY" },
  { kind: "openai", label: "sk- API key", pattern: /\bsk-(?!ant-)[A-Za-z0-9_-]{20,}/g, envName: "OPENAI_API_KEY", isReal: isMixed },
  { kind: "stripe", label: "Stripe live key", pattern: /\b(?:sk|rk)_live_[0-9a-zA-Z]{16,}/g, envName: "STRIPE_SECRET_KEY" },
  { kind: "stripe", label: "Stripe test key", pattern: /\b(?:sk|rk)_test_[0-9a-zA-Z]{16,}/g, envName: "STRIPE_SECRET_KEY" },
  { kind: "aws-id", label: "AWS access key id", pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, envName: "AWS_ACCESS_KEY_ID" },
  {
    kind: "aws-secret",
    label: "AWS secret key",
    pattern: /aws_?secret_?access_?key["']?\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})/gi,
    envName: "AWS_SECRET_ACCESS_KEY",
    group: 1
  },
  { kind: "github", label: "GitHub token", pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})/g, envName: "GITHUB_TOKEN" },
  { kind: "gitlab", label: "GitLab token", pattern: /\bglpat-[0-9A-Za-z_-]{20,}/g, envName: "GITLAB_TOKEN" },
  { kind: "slack", label: "Slack token", pattern: /\bxox[abposr]-[0-9A-Za-z-]{20,}/g, envName: "SLACK_TOKEN", isReal: isMixed },
  { kind: "slack-webhook", label: "Slack webhook URL", pattern: /https:\/\/hooks\.slack\.com\/(?:services|workflows|triggers)\/[A-Za-z0-9_/-]{20,}/g, envName: "SLACK_WEBHOOK_URL" },
  { kind: "google", label: "Google API key", pattern: /\bAIza[0-9A-Za-z_-]{35}/g, envName: "GOOGLE_API_KEY" },
  { kind: "huggingface", label: "Hugging Face token", pattern: /\bhf_[A-Za-z0-9]{30,}/g, envName: "HF_TOKEN", isReal: isMixedCase },
  { kind: "sendgrid", label: "SendGrid API key", pattern: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/g, envName: "SENDGRID_API_KEY" },
  { kind: "supabase-secret", label: "Supabase secret key", pattern: /\bsb_secret_[A-Za-z0-9_-]{20,}/g, envName: "SUPABASE_SECRET_KEY" },
  {
    kind: "database-url",
    label: "database URL with a password",
    pattern: /\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|rediss?|amqps?):\/\/[^\s:@/'"`]+:[^\s@/'"`]+@[^\s'"`]+/g,
    envName: "DATABASE_URL",
    isReal: (url) => isRealPassword(url)
  },
  { kind: "bearer", label: "bearer token", pattern: /\bBearer\s+([A-Za-z0-9._~+/-]{16,}=*)/g, envName: "API_TOKEN", group: 1, isMovable: false, isReal: (value) => isRandomLooking(value) },
  { kind: "private-key", label: "private key", pattern: /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY(?: BLOCK)?-----/g, envName: "PRIVATE_KEY", isMovable: false }
];
const JWT = /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;
const GENERIC = /\b((?:[A-Za-z_][A-Za-z0-9_]*)?(?:SECRET|TOKEN|PASSWORD|PASSWD|PWD)|[A-Za-z_][A-Za-z0-9_]*(?:KEY|AUTH|CREDENTIALS?|_PASS))\b["']?\s*[:=]\s*(["'`]?)([^\s"'`;,()[\]{}]{12,})\2/gi;
const PLACEHOLDER = /⟦|process\.env|os\.environ|getenv|\$\{|<|>|your|xxx|example|changeme|placeholder|dummy|redacted|\*\*\*/i;
const MEMBER_ACCESS = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)+$/;
const DOTTED_NAME = /^[A-Za-z][A-Za-z0-9]*(?:[-.][A-Za-z][A-Za-z0-9]*)+$/;
const FILE_PATH = /^(?:(?:~|\.{1,2})?\/[\w.@-]+(?:\/[\w.@-]+)*\/?|[\w.@-]+(?:\/[\w.@-]+)+\.[A-Za-z][A-Za-z0-9]{0,4})$/;
const HEX = /^[0-9a-f]+$/i;
const GIT_SHA = /^[0-9a-f]{40}$/;
const HASH_NAME = /CACHE|HASH|SHA|DIGEST|ETAG|CHECKSUM|COMMIT|REVISION|INTEGRITY/i;
const SECRET_NAME = /SECRET|PASSWORD|PASSWD|PWD|PRIVATE|API|AUTH|ACCESS|SESSION|GITHUB|GH_/i;
const DEFAULT_PASSWORDS = /^(?:password|pass|postgres|root|secret|admin|test|mysql|redis|guest)$/i;
const TEST_PATH = /(^|\/)(tests?|__tests__|fixtures?|__mocks__)\/|\.(test|spec)\.[cm]?[jt]sx?$/;
const LENIENT_IN_TESTS = new Set(["generic", "private-key"]);
const FAKE_VALUE = /test|fake|dummy|mock|sample|example|fixture/i;
function isTestPath(path) {
  return TEST_PATH.test(path);
}
function mask(value) {
  return `${value.slice(0, MASK_KEEP)}****`;
}
function entropy(text) {
  const counts = new Map;
  for (const char of text)
    counts.set(char, (counts.get(char) ?? 0) + 1);
  let bits = 0;
  for (const count of counts.values()) {
    const share = count / text.length;
    bits -= share * Math.log2(share);
  }
  return bits;
}
function lineAt(text, index) {
  let line = 1;
  for (let at = 0;at < index; at += 1)
    if (text.charCodeAt(at) === 10)
      line += 1;
  return line;
}
function isRandomLooking(value) {
  if (value.length < GENERIC_MIN || PLACEHOLDER.test(value) || MEMBER_ACCESS.test(value) || DOTTED_NAME.test(value) || FILE_PATH.test(value))
    return false;
  const hasDigit = /\d/.test(value);
  return entropy(value) >= ENTROPY_MIN && (hasDigit || value.length >= GENERIC_LONG);
}
function isHashLike(name, value) {
  return HEX.test(value) && (HASH_NAME.test(name) || GIT_SHA.test(value) && !SECRET_NAME.test(name));
}
function isRealPassword(url) {
  const [, user = "", password = ""] = /:\/\/([^:]+):([^@]+)@/.exec(url) ?? [];
  return password !== user && !password.startsWith("$") && !PLACEHOLDER.test(password) && !DEFAULT_PASSWORDS.test(password);
}
function envNameOf(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^A-Za-z0-9_]/g, "_").toUpperCase();
}
function ruleHits(text) {
  const found = [];
  for (const rule of RULES) {
    for (const match of text.matchAll(rule.pattern)) {
      const value = match[rule.group ?? 0] ?? "";
      if (value === "" || rule.isReal?.(value) === false)
        continue;
      found.push({ kind: rule.kind, label: rule.label, value, envName: rule.envName, line: lineAt(text, match.index ?? 0), isMovable: rule.isMovable !== false });
    }
  }
  for (const match of text.matchAll(JWT)) {
    if (!isServiceRoleJwt(match[0]))
      continue;
    found.push({ kind: "supabase", label: "Supabase service_role key", value: match[0], envName: "SUPABASE_SERVICE_ROLE_KEY", line: lineAt(text, match.index ?? 0), isMovable: true });
  }
  return found;
}
function genericHits(text, known) {
  const found = [];
  for (const match of text.matchAll(GENERIC)) {
    const name = match[1] ?? "";
    const value = match[3] ?? "";
    if ([...known].some((secret) => secret.includes(value) || value.includes(secret)) || !isRandomLooking(value) || isHashLike(name, value))
      continue;
    found.push({ kind: "generic", label: `${name} value`, value, envName: envNameOf(name), line: lineAt(text, match.index ?? 0), isMovable: true });
  }
  return found;
}
function findSecrets(text, path = "") {
  const isTest = isTestPath(path);
  const scanned = text.length > SCAN_MAX_CHARS ? text.slice(0, SCAN_MAX_CHARS) : text;
  const specific = ruleHits(scanned);
  const all = [...specific, ...genericHits(scanned, new Set(specific.map((secret) => secret.value)))];
  const seen = new Set;
  return all.filter((secret) => {
    if (isTest && (LENIENT_IN_TESTS.has(secret.kind) || FAKE_VALUE.test(secret.value)))
      return false;
    if (seen.has(secret.value))
      return false;
    seen.add(secret.value);
    return true;
  });
}

const FILE_TOOLS = ["Write", "Edit", "MultiEdit", "NotebookEdit"];
function isFileTool(input) {
  return typeof input.tool === "string" && FILE_TOOLS.includes(input.tool);
}
function pathOf(input) {
  const path = input.file_path ?? input.notebook_path;
  return typeof path === "string" && path !== "" ? path : null;
}
function editsOf(input) {
  return Array.isArray(input.edits) ? input.edits : [];
}
function fileText(input) {
  if (input.tool === "Write")
    return String(input.content ?? "");
  if (input.tool === "Edit")
    return String(input.new_string ?? "");
  if (input.tool === "NotebookEdit")
    return String(input.new_source ?? "");
  return editsOf(input).map((edit) => String(edit.new_string ?? "")).join(`
`);
}
function patchedFields(input, change) {
  if (input.tool === "Write")
    return { content: change(String(input.content ?? "")) };
  if (input.tool === "Edit")
    return { new_string: change(String(input.new_string ?? "")) };
  if (input.tool === "NotebookEdit")
    return { new_source: change(String(input.new_source ?? "")) };
  return { edits: editsOf(input).map((edit) => ({ ...edit, new_string: change(String(edit.new_string ?? "")) })) };
}
function resolvePath(base, path) {
  if (path.startsWith("/"))
    return path;
  const parts = base.split("/");
  for (const part of path.split("/")) {
    if (part === "..")
      parts.pop();
    else if (part !== "." && part !== "")
      parts.push(part);
  }
  return parts.join("/") || "/";
}

const FILES_MAX = 300;
const UNPUSHED = ["HEAD", "--not", "--remotes", "--max-count=200"];
const SEPARATORS$1 = /&&|\|\||;|\n|\|/;
const ENV_FILE = /^\.env(\..+)?$/;
const ENV_TEMPLATE = /\.(example|sample|template|dist)$/i;
const GIT_VALUE_OPTIONS = ["-C", "-c", "--git-dir", "--work-tree", "--namespace"];
function words$1(segment) {
  const found = [];
  for (const match of segment.matchAll(/"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+)/g)) {
    found.push(match[1] ?? match[2] ?? match[3] ?? "");
  }
  return found;
}
function stepOf(tokens) {
  let at = 0;
  while (at < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[at] ?? ""))
    at += 1;
  if (tokens[at] !== "git")
    return null;
  at += 1;
  let cwd = null;
  while (at < tokens.length && (tokens[at] ?? "").startsWith("-")) {
    const option = tokens[at] ?? "";
    if (option === "-C")
      cwd = tokens[at + 1] ?? null;
    at += GIT_VALUE_OPTIONS.includes(option) ? 2 : 1;
  }
  const verb = tokens[at];
  const rest = tokens.slice(at + 1);
  if (verb === "add")
    return { kind: "add", cwd, args: rest };
  if (verb === "commit")
    return { kind: "commit", cwd, isAll: rest.some((word) => word === "--all" || /^-[a-zA-Z]*a[a-zA-Z]*$/.test(word)) };
  if (verb === "push")
    return { kind: "push", cwd };
  return null;
}
function gitSteps(command) {
  return command.split(SEPARATORS$1).map((segment) => stepOf(words$1(segment.trim()))).filter((step) => step !== null);
}
function baseName(path) {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}
function isEnvFile(path) {
  const name = baseName(path);
  return ENV_FILE.test(name) && !ENV_TEMPLATE.test(name);
}
function dryRunPaths(stdout) {
  return stdout.split(`
`).map((line) => /^add '(.*)'$/.exec(line.trim())?.[1]).filter((path) => path !== undefined);
}
function addedByFile(diff) {
  const files = new Map;
  let current = "";
  for (const line of diff.split(`
`)) {
    const header = /^\+\+\+ b\/(.*)$/.exec(line);
    if (header !== null) {
      current = header[1] ?? "";
      continue;
    }
    if (line.startsWith("+") && !line.startsWith("+++") && current !== "") {
      files.set(current, `${files.get(current) ?? ""}${line.slice(1)}
`);
    }
  }
  return files;
}
async function scanAdd(host, step, found) {
  const dir = step.cwd === null ? host.cwd : resolvePath(host.cwd, step.cwd);
  found.envFiles.push(...step.args.filter(isEnvFile));
  const paths = dryRunPaths(await host.git(["add", "-n", ...step.args], dir));
  found.envFiles.push(...paths.filter(isEnvFile));
  for (const path of paths.filter((entry) => !isEnvFile(entry)).slice(0, FILES_MAX)) {
    const text = await host.read(resolvePath(dir, path));
    found.secrets.push(...findSecrets(text, path).map((secret) => ({ ...secret, where: `${path}:${secret.line}` })));
  }
}
async function scanPush(host, dir, found) {
  const names = (await host.git(["log", "--name-only", "--format=", ...UNPUSHED], dir)).split(`
`).filter((name) => name !== "");
  found.envFiles.push(...names.filter(isEnvFile));
  for (const [path, added] of addedByFile(await host.git(["log", "-p", "-U0", "--no-color", "--format=", ...UNPUSHED], dir))) {
    found.secrets.push(...findSecrets(added, path).map((secret) => ({ ...secret, where: path })));
  }
}
async function scanStep(host, step, found) {
  if (step.kind === "add")
    return scanAdd(host, step, found);
  const dir = step.cwd === null ? host.cwd : resolvePath(host.cwd, step.cwd);
  if (step.kind === "push")
    return scanPush(host, dir, found);
  const scopes = step.isAll ? [["--cached"], []] : [["--cached"]];
  for (const scope of scopes) {
    const names = (await host.git(["diff", ...scope, "--name-only"], dir)).split(`
`).filter((name) => name !== "");
    found.envFiles.push(...names.filter(isEnvFile));
    for (const [path, added] of addedByFile(await host.git(["diff", ...scope, "-U0", "--no-color"], dir))) {
      found.secrets.push(...findSecrets(added, path).map((secret) => ({ ...secret, where: path })));
    }
  }
}

const TOKEN = /⟦secret:\d+⟧/g;
const PEM$1 = /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z]+ )*PRIVATE KEY-----/g;
const createVault = () => ({ byValue: new Map, byToken: new Map });
const sessionVault = createVault();
function clearVault(vault) {
  vault.byValue.clear();
  vault.byToken.clear();
}
function keep(vault, secret) {
  const known = vault.byValue.get(secret.value);
  if (known !== undefined)
    return known;
  const kept = { token: `⟦secret:${vault.byValue.size + 1}⟧`, value: secret.value, label: secret.label, envName: secret.envName };
  vault.byValue.set(kept.value, kept);
  vault.byToken.set(kept.token, kept);
  return kept;
}
function replaceAll(text, pairs) {
  return [...pairs].sort((a, b) => b[0].length - a[0].length).reduce((out, [from, to]) => out.split(from).join(to), text);
}
function hide(vault, text) {
  const pems = [...text.matchAll(PEM$1)].map((match) => ({ value: match[0], label: "private key", envName: "PRIVATE_KEY" }));
  const found = findSecrets(text).filter((secret) => secret.kind !== "private-key");
  const kept = [...pems, ...found].map((secret) => keep(vault, secret));
  return replaceAll(text, kept.map((entry) => [entry.value, entry.token]));
}
function reveal(vault, text) {
  const missing = [];
  const out = text.replace(TOKEN, (token) => {
    const kept = vault.byToken.get(token);
    if (kept === undefined)
      missing.push(token);
    return kept?.value ?? token;
  });
  return { text: out, missing: [...new Set(missing)] };
}
function scrub(vault, text) {
  if (vault.byValue.size === 0)
    return text;
  return replaceAll(text, [...vault.byValue.values()].map((entry) => [entry.value, entry.token]));
}
const hasTokens = (text) => text.match(TOKEN) !== null;
function tokenHits(vault, text) {
  const hits = [];
  text.split(`
`).forEach((row, index) => {
    for (const match of row.matchAll(TOKEN)) {
      const kept = vault.byToken.get(match[0]);
      if (kept === undefined)
        continue;
      hits.push({ kind: "placeholder", label: kept.label, value: kept.value, envName: kept.envName, line: index + 1, isMovable: kept.envName !== "PRIVATE_KEY", token: kept.token });
    }
  });
  return hits;
}

const HEREDOC = /<<-?[ \t]*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1([^\n]*)\n([\s\S]*?)\n[ \t]*\2[ \t]*(?=\n|$)/g;
const SEPARATORS = /&&|\|\||;|\n/;
const REDIRECT = /(?:^|[^\d&>])1?>>?(?!&)[ \t]*("[^"]*"|'[^']*'|[^\s|;&<>]+)/;
const TEE = /\btee\s+(?:-\S+\s+)*("[^"]*"|'[^']*'|[^\s|;&<>-][^\s|;&<>]*)/;
const PRINTERS = new Set(["echo", "printf"]);
const DEVICES = /^\/dev\//;
const unquote = (word) => word.replace(/^(["'])(.*)\1$/, "$2");
function targetOf(segment) {
  const raw = REDIRECT.exec(segment)?.[1] ?? TEE.exec(segment)?.[1];
  if (raw === undefined)
    return null;
  const path = unquote(raw);
  return DEVICES.test(path) ? null : path;
}
function printed(segment) {
  const command = segment.split(/\|(?!\|)/)[0] ?? "";
  const before = command.replace(/(?:^|[^\d&>])1?>>?(?!&)[\s\S]*$/, "");
  const tokens = words$1(before.trim());
  if (!PRINTERS.has(tokens[0] ?? ""))
    return null;
  return tokens.slice(1).filter((word) => !/^-[neE]+$/.test(word)).join(" ");
}
function bashWrites(command) {
  const writes = [];
  const rest = command.replace(HEREDOC, (match, _quote, _tag, after, body, offset) => {
    const lineStart = command.lastIndexOf(`
`, offset) + 1;
    const path = targetOf(`${command.slice(lineStart, offset)} ${after}`);
    if (path !== null)
      writes.push({ path, text: body });
    return after;
  });
  for (const segment of rest.split(SEPARATORS)) {
    const path = targetOf(segment);
    const text = path === null ? null : printed(segment);
    if (path !== null && text !== null)
      writes.push({ path, text });
  }
  return writes;
}
function bashWriteHits(command, vault) {
  return bashWrites(command).filter((write) => !isEnvFile(write.path)).flatMap((write) => [...findSecrets(write.text, write.path), ...tokenHits(vault, write.text)].map((secret) => ({ ...secret, where: `${write.path}:${secret.line}` })));
}
function isGuarded(input) {
  if (isFileTool(input)) {
    const path = pathOf(input);
    return path !== null && !isEnvFile(path);
  }
  if (input.tool !== "Bash" || typeof input.command !== "string")
    return false;
  return gitSteps(input.command).length > 0 || bashWrites(input.command).length > 0;
}
function isRiskyAsIs(input, vault) {
  if (!isGuarded(input))
    return false;
  if (isFileTool(input))
    return findSecrets(fileText(input), pathOf(input) ?? "").length + tokenHits(vault, fileText(input)).length > 0;
  const command = String(input.command);
  return gitSteps(command).length > 0 || bashWriteHits(command, vault).length > 0;
}

let current = "en";
const langOf = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang(value) {
  current = langOf(value);
  return current;
}
const pick = (table) => table[current];

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const EN_SOURCE = { write: "This write has", add: "The files about to be saved have", commit: "This saved version has" };
const TR_SOURCE = { write: "Bu yazımda", add: "Kayda eklenen dosyalarda", commit: "Bu kayıtta" };
const EN = {
  allow: "Allow once",
  cancel: "Cancel",
  question: "How do you want to go on?",
  hubWaiting: (subject) => `A secret key in ${subject} is waiting for you`,
  move: (count) => count === 1 ? "Move key to the secrets file" : "Move keys to the secrets file",
  privateKey: "Private key",
  allowLine: "It goes ahead as it is; the key stays readable to anyone who gets these files.",
  cancelLine: "It is stopped, nothing is written or saved, and Claude is told why.",
  moveLine: (isMovable) => isMovable ? "Recommended. The keys move to the secrets file (.env), which is kept out of saved versions; the code reads them from there." : "Recommended. This step stops; Claude moves the keys to the secrets file (.env) and tries again.",
  envFile: "secrets file",
  toGit: "about to be saved",
  line: (line) => `line ${line}`,
  leakEyebrow: "Leak blocked",
  envEyebrow: "Secrets file",
  leakTitle: (source, count) => `${EN_SOURCE[source]} ${plural(count, "secret key", "secret keys")}`,
  envTitle: (envFiles) => envFiles.length === 1 ? `${envFiles[0] ?? ".env"} is about to go into a saved version` : `${envFiles.length} secrets files are about to go into a saved version`,
  moreFindings: (count) => `+ ${plural(count, "more finding", "more findings")}`,
  moreRows: (count) => `+ ${count} more`,
  commandLine: "Turn on or off the check for secret keys before a file is written or a version is saved",
  toggled: (isOn) => `secret-guard ${isOn ? "on" : "off"}`,
  keptOut: (count) => `${plural(count, "secret", "secrets")} kept out of the chat`,
  rec: "REC",
  recCommandLine: "Recording mode: hide keys, secret settings and e-mail addresses on screen",
  recToggled: (isOn) => isOn ? "Recording mode on: keys, secret settings and e-mail addresses are hidden on screen" : "Recording mode off"
};
const TR = {
  allow: "Bir kez izin ver",
  cancel: "Vazgeç",
  question: "Nasıl devam edilsin?",
  hubWaiting: (subject) => `${subject} içindeki gizli anahtar seni bekliyor`,
  move: (count) => count === 1 ? "Anahtarı gizli ayar dosyasına taşı" : "Anahtarları gizli ayar dosyasına taşı",
  privateKey: "Özel anahtar",
  allowLine: "Olduğu gibi devam eder; anahtar bu dosyaları alan herkesin okuyabileceği hâlde kalır.",
  cancelLine: "Durdurulur, hiçbir şey yazılmaz ya da kaydedilmez; Claude'a nedeni söylenir.",
  moveLine: (isMovable) => isMovable ? "Önerilen. Anahtarlar gizli ayar dosyasına (.env) taşınır; bu dosya kayıtlara girmez, kod anahtarları oradan okur." : "Önerilen. Bu adım durur; Claude anahtarları gizli ayar dosyasına (.env) taşıyıp yeniden dener.",
  envFile: "gizli ayar dosyası",
  toGit: "kayda giriyor",
  line: (line) => `satır ${line}`,
  leakEyebrow: "Sızıntı engellendi",
  envEyebrow: "Gizli ayar dosyası",
  leakTitle: (source, count) => `${TR_SOURCE[source]} ${count} gizli anahtar var`,
  envTitle: (envFiles) => `${envFiles.length === 1 ? envFiles[0] ?? ".env" : `${envFiles.length} gizli ayar dosyası`} kayda giriyor`,
  moreFindings: (count) => `+${count} bulgu daha`,
  moreRows: (count) => `+${count} daha`,
  commandLine: "Dosya yazılmadan ya da sürüm kaydedilmeden önce gizli anahtar kontrolünü aç/kapat",
  toggled: (isOn) => `secret-guard ${isOn ? "açık" : "kapalı"}`,
  keptOut: (count) => `${count} gizli anahtar sohbetin dışında tutuldu`,
  rec: "REC",
  recCommandLine: "Kayıt modu: anahtarları, gizli ayarları ve e-posta adreslerini ekranda gizle",
  recToggled: (isOn) => isOn ? "Kayıt modu açık: anahtarlar, gizli ayarlar ve e-posta adresleri ekranda gizlenir" : "Kayıt modu kapalı"
};
const WORDS = { en: EN, tr: TR };
const words = () => pick(WORDS);

const ROWS_MAX$1 = 5;
const INDENT = 2;
const GAP = 2;
const FIRST_MIN = 12;
const SUBJECT_MIN = 8;
const SUBJECT_GLUE = " · ";
function clipMiddle(text, width) {
  if (text.length <= width)
    return text;
  if (width <= 1)
    return "…".slice(0, width);
  const head = Math.ceil((width - 1) / 2);
  return `${text.slice(0, head)}…${text.slice(text.length - (width - 1 - head))}`;
}
function columnWidths(rows, columns, width) {
  const widths = Array.from({ length: columns }, (_, index) => Math.max(0, ...rows.map((row) => (row[index] ?? "").length)));
  const rest = widths.slice(1).reduce((sum, item) => sum + item + GAP, 0);
  const room = Math.max(FIRST_MIN, width - INDENT - rest);
  return [Math.min(widths[0] ?? 0, room), ...widths.slice(1)];
}
function padCell(text, column, width) {
  const shown = clipMiddle(text, width);
  return column.align === "right" ? shown.padStart(width) : shown.padEnd(width);
}
function lookOf(column, tone) {
  if (column.isToned === true)
    return { color: tone };
  return column.isDim ? { dimColor: true } : {};
}
function cellOf(ui, cell, width) {
  const { Text } = ui;
  const look = lookOf(cell.column, cell.tone);
  return h(Text, {
    ...look
  }, padCell(cell.text, cell.column, width));
}
function rowOf(ui, line) {
  const { cells, model, widths } = line;
  const { Text } = ui;
  const gap = " ".repeat(GAP);
  const shown = model.columns.map((column, index) => ({ column, index })).filter(({ index }) => (widths[index] ?? 0) > 0);
  return h(Text, {
    wrap: "truncate-end"
  }, shown.flatMap(({ column, index }, place) => [place === 0 ? null : gap, cellOf(ui, { text: cells[index] ?? "", column, tone: model.tone }, widths[index] ?? 0)]));
}
function detailsOf(ui, model, width) {
  const { Box, Text } = ui;
  const rows = model.rows.slice(0, ROWS_MAX$1);
  const widths = columnWidths(rows, model.columns.length, width);
  const more = model.total - rows.length;
  return h(Box, {
    flexDirection: "column",
    paddingLeft: INDENT
  }, rows.map((row) => rowOf(ui, { cells: row, model, widths })), more > 0 && h(Text, {
    dimColor: true
  }, words().moreRows(more)));
}
function confirmCard(ui, model, width) {
  const { Box, Text } = ui;
  const head = model.eyebrow;
  const subject = clipMiddle(model.subject.split(`
`)[0] ?? "", Math.max(SUBJECT_MIN, width - head.length - SUBJECT_GLUE.length));
  return h(Box, {
    flexDirection: "column"
  }, h(Text, {
    wrap: "truncate-end"
  }, h(Text, {
    color: model.tone,
    bold: true
  }, head), h(Text, {
    dimColor: true
  }, `${SUBJECT_GLUE}${subject}`)), h(Text, {
    bold: true,
    wrap: "truncate-end"
  }, model.headline), detailsOf(ui, model, width));
}

const DARK = { sheet: "#191917", card: "#1F1F1C", inset: "#171715", line: "#2E2E2A", lineStrong: "#45443F", track: "#34332F", hi: "#F0EEE8", mid: "#C2BEB4", lo: "#8E8A80" };
const LIGHT = { sheet: "#F4F2EC", card: "#FFFFFF", inset: "#F6F4EF", line: "#E4E0D6", lineStrong: "#CFC9BC", track: "#ECE8DF", hi: "#1C1B19", mid: "#4F4B44", lo: "#77726A" };
const ROLES = {
  read: { dark: { fg: "#7FB6E8", tint: "#1E2B37", line: "#2F4A63" }, light: { fg: "#2464A0", tint: "#E7F0F9", line: "#B9D3EC" } },
  edit: { dark: { fg: "#E58A5F", tint: "#38251D", line: "#6A3E2D" }, light: { fg: "#A94A26", tint: "#FBEDE6", line: "#EFC6B4" } },
  run: { dark: { fg: "#B19CF3", tint: "#29243D", line: "#4A3F75" }, light: { fg: "#6243C4", tint: "#F0ECFC", line: "#CFC3F3" } },
  ok: { dark: { fg: "#6FC593", tint: "#1B2F25", line: "#2F5A42" }, light: { fg: "#1F6E43", tint: "#E4F4EA", line: "#B5DEC4" } },
  warn: { dark: { fg: "#E9B949", tint: "#332D19", line: "#66552A" }, light: { fg: "#8A6000", tint: "#FBF2D9", line: "#EBD48F" } },
  danger: { dark: { fg: "#F2727F", tint: "#3B2023", line: "#74343C" }, light: { fg: "#C0263A", tint: "#FCE8EA", line: "#F1B9C0" } },
  plan: { dark: { fg: "#E07BC0", tint: "#351F2E", line: "#6B3A5C" }, light: { fg: "#A8337F", tint: "#FBE9F4", line: "#EDBFDC" } }
};
const palette = (isLight) => isLight ? LIGHT : DARK;
const role = (name, isLight) => ROLES[name][isLight ? "light" : "dark"];
const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`;
const MONO = `ui-monospace, 'SF Mono', Menlo, Consolas, monospace`;
function vars(isLight) {
  const n = palette(isLight);
  const roles = Object.keys(ROLES).map((name) => {
    const r = role(name, isLight);
    return `--${name}:${r.fg};--${name}-tint:${r.tint};--${name}-line:${r.line}`;
  });
  return `--card:${n.card};--inset:${n.inset};--line:${n.line};--line-strong:${n.lineStrong};--track:${n.track};--hi:${n.hi};--mid:${n.mid};--lo:${n.lo};${roles.join(";")}`;
}
function svgStyle(extra = "") {
  return [
    `<style>svg{${vars(true)}}`,
    `@media (prefers-color-scheme: dark){svg{${vars(false)}}}`,
    `text{font-family:${FONT}}.mono{font-family:${MONO}}.num{font-variant-numeric:tabular-nums}`,
    extra,
    "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}</style>"
  ].join("");
}
const named = (value) => {
  const name = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (name.includes("light"))
    return true;
  return name.includes("dark") ? false : undefined;
};
const terminalLight = (colorfgbg) => {
  const bg = Number(colorfgbg?.split(";").at(-1));
  return colorfgbg === undefined || Number.isNaN(bg) ? undefined : bg === 7 || bg === 15;
};
const resolveLight = (hints) => named(hints.override) ?? named(hints.theme) ?? terminalLight(hints.colorfgbg) ?? (hints.systemDark === undefined ? false : !hints.systemDark);

const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const NARROW = "iljtfrI.,:;|!'` ·";
const WIDE = "mwMWğĞ@%";
const MONO_ADVANCE = 0.6;
const NARROW_ADVANCE = 0.3;
const WIDE_ADVANCE = 0.82;
const CAP_ADVANCE = 0.64;
const BODY_ADVANCE = 0.54;
const BOLD_GAIN = 1.06;
function measure(text, spec) {
  const gain = spec.isBold ? BOLD_GAIN : 1;
  if (spec.isMono)
    return [...text].length * spec.size * MONO_ADVANCE * gain;
  const width = [...text].reduce((sum, char) => {
    if (NARROW.includes(char))
      return sum + spec.size * NARROW_ADVANCE;
    if (WIDE.includes(char))
      return sum + spec.size * WIDE_ADVANCE;
    return sum + spec.size * (char >= "A" && char <= "Z" ? CAP_ADVANCE : BODY_ADVANCE);
  }, 0);
  return width * gain;
}
function fit(text, width, spec) {
  if (measure(text, spec) <= width)
    return text;
  const chars = [...text];
  while (chars.length > 1 && measure(`${chars.join("")}…`, spec) > width)
    chars.pop();
  return `${chars.join("")}…`;
}
function fitMiddle(text, width, spec) {
  if (measure(text, spec) <= width)
    return text;
  const chars = [...text];
  let head = Math.ceil(chars.length / 2);
  let tail = chars.length - head;
  while (head + tail > 2 && measure(`${chars.slice(0, head).join("")}…${chars.slice(chars.length - tail).join("")}`, spec) > width) {
    if (head >= tail)
      head -= 1;
    else
      tail -= 1;
  }
  return `${chars.slice(0, head).join("")}…${chars.slice(chars.length - tail).join("")}`;
}
const ICONS = {
  trash: '<path d="M4.5 6.8h15"/><path d="M9.6 6.8V5.1c0-.6.5-1.1 1.1-1.1h2.6c.6 0 1.1.5 1.1 1.1v1.7"/><path d="M6.4 6.8l.85 11.5c.08 1.1 1 1.9 2.1 1.9h5.3c1.1 0 2-.8 2.1-1.9l.85-11.5"/><path d="M10.3 10.8v5.4M13.7 10.8v5.4"/>',
  shield: '<path d="M12 3.3l6.6 2.5v5.3c0 4.2-2.7 7.7-6.6 9.3-3.9-1.6-6.6-5.1-6.6-9.3V5.8z"/><path d="M12 8.4v4.4"/><path d="M12 15.8v.2"/>',
  folder: '<path d="M3.6 7.3c0-.95.75-1.7 1.7-1.7h3.9l1.9 2.1h7.6c.95 0 1.7.75 1.7 1.7v8.1c0 .95-.75 1.7-1.7 1.7H5.3c-.95 0-1.7-.75-1.7-1.7z"/>',
  file: '<path d="M6.6 3.6h6.9l4 4v11.1c0 .95-.75 1.7-1.7 1.7H6.6c-.95 0-1.7-.75-1.7-1.7V5.3c0-.95.75-1.7 1.7-1.7z"/><path d="M13.4 3.8v3.9h3.9"/>',
  rewind: '<circle cx="12" cy="12" r="2.4"/><path d="M5.4 8.6a7.6 7.6 0 1 1-.9 4.7"/><path d="M4.6 4.9v3.9h3.9"/>',
  branch: '<circle cx="7" cy="5.8" r="2"/><circle cx="7" cy="18.2" r="2"/><circle cx="17" cy="8.6" r="2"/><path d="M7 7.8v8.4"/><path d="M17 10.6c0 3.4-3.3 4.4-8.4 5.9"/>',
  push: '<path d="M12 20.2V9"/><path d="M7.6 13.2L12 8.8l4.4 4.4"/><path d="M7.6 7.6L12 3.2l4.4 4.4"/>',
  database: '<ellipse cx="12" cy="6.2" rx="6.8" ry="2.7"/><path d="M5.2 6.2v11.6c0 1.5 3 2.7 6.8 2.7s6.8-1.2 6.8-2.7V6.2"/><path d="M5.2 12c0 1.5 3 2.7 6.8 2.7s6.8-1.2 6.8-2.7"/>',
  commit: '<circle cx="12" cy="12" r="3.2"/><path d="M3.5 12h5.3M15.2 12h5.3"/>',
  key: '<circle cx="8.2" cy="15.6" r="3.9"/><path d="M11 12.8l8-8"/><path d="M16.1 7.7l2.4 2.4"/><path d="M13.7 10.1l1.8 1.8"/>',
  check: '<path d="M5.5 12.5l4.2 4.2 8.8-9.2"/>'
};
const STROKE = 1.75;
const GRID = 24;
function icon(name, at) {
  const scale = at.size / GRID;
  return `<g transform="translate(${at.x} ${at.y}) scale(${scale})" fill="none" style="stroke:${at.color}" stroke-width="${STROKE / scale > 2.4 ? 2.4 : STROKE / scale}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</g>`;
}
const svgOpen = (width, height) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

const ROWS_MAX = 5;
const HEAD_ICON = 20;
const HEAD_X = 30;
const HEAD_H = 46;
const ROW_H = 32;
const ROW_TOP_GAP = 12;
const CHIP_H = 20;
const CHIP_PAD = 9;
const CARD_CHROME = 6;
const PX_PER_COLUMN = 8;
const MIN_WIDTH = 300;
const META_GAP = 24;
const MAX_WIDTH = 640;
const ALT_MAX = 200;
const svgWidth = (columns) => Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, (columns - CARD_CHROME) * PX_PER_COLUMN));
function headlineOf(pending) {
  const said = words();
  const secrets = pending.secrets.length;
  if (secrets > 0)
    return { eyebrow: said.leakEyebrow, title: said.leakTitle(pending.source, secrets), tone: "danger" };
  return { eyebrow: said.envEyebrow, title: said.envTitle(pending.envFiles), tone: "warn" };
}
function subjectOf(pending, width) {
  const eyebrowW = measure(headlineOf(pending).eyebrow, { size: 12, isBold: true });
  const line = pending.subject.split(`
`)[0] ?? "";
  return measure(line, { size: 11.5, isMono: true }) <= width - HEAD_X - eyebrowW - META_GAP ? line : "";
}
function findingsOf(pending, isSubjectShown) {
  const isLineEnough = pending.source === "write" && isSubjectShown;
  const env = pending.envFiles.map((path) => ({ chip: ".env", where: path, value: words().toGit, tone: "warn" }));
  const secrets = pending.secrets.map((secret) => ({ chip: secret.chip, where: isLineEnough ? secret.where : secret.at, value: secret.masked, tone: "danger" }));
  return [...env, ...secrets];
}
function headerSvg(pending, width) {
  const head = headlineOf(pending);
  const subject = subjectOf(pending, width);
  return [
    icon(head.tone === "danger" ? "key" : "shield", { x: 0, y: 19, size: HEAD_ICON, color: "var(--mid)" }),
    `<text x="${HEAD_X}" y="13" font-size="12" font-weight="600" style="fill:var(--lo)">${escape(head.eyebrow)}</text>`,
    `<text x="${width}" y="13" text-anchor="end" class="mono" font-size="11.5" style="fill:var(--lo)">${escape(subject)}</text>`,
    `<text x="${HEAD_X}" y="35" font-size="16" font-weight="600" style="fill:var(--hi)">${escape(fit(head.title, width - HEAD_X, { size: 16, isBold: true }))}</text>`
  ].join("");
}
const chipTextOf = (finding) => fit(finding.chip, 120, { size: 11, isBold: true });
const chipWidthOf = (finding) => measure(chipTextOf(finding), { size: 11, isBold: true }) + CHIP_PAD * 2;
function findingSvg(finding, spec) {
  const { top, width } = spec;
  const chipText = chipTextOf(finding);
  const chipW = chipWidthOf(finding);
  const valueW = measure(finding.value, { size: 12, isMono: true });
  const chipY = top + (ROW_H - CHIP_H) / 2;
  const base = top + ROW_H / 2 + 4.5;
  const whereX = spec.column + 12;
  const where = fitMiddle(finding.where, width - whereX - valueW - 16, { size: 12.5, isMono: true });
  const tone = finding.tone;
  return [
    `<path d="M0 ${top + 0.5}H${width}" style="stroke:var(--line)"/>`,
    `<rect x="0" y="${chipY}" width="${chipW}" height="${CHIP_H}" rx="${CHIP_H / 2}" style="fill:var(--track)"/>`,
    `<text x="${chipW / 2}" y="${chipY + 14}" text-anchor="middle" font-size="11" font-weight="600" style="fill:var(--mid)">${escape(chipText)}</text>`,
    `<text x="${whereX}" y="${base}" class="mono" font-size="12.5" style="fill:var(--mid)">${escape(where)}</text>`,
    `<text x="${width}" y="${base}" text-anchor="end" class="mono" font-size="12" style="fill:var(--${tone})">${escape(finding.value)}</text>`
  ].join("");
}
function leakSvg(pending, width) {
  const findings = findingsOf(pending, subjectOf(pending, width) !== "");
  const shown = findings.slice(0, ROWS_MAX);
  const more = findings.length - shown.length;
  const top = HEAD_H + ROW_TOP_GAP;
  const height = top + shown.length * ROW_H + (more > 0 ? ROW_H - 6 : 0) + 2;
  const column = Math.max(0, ...shown.map(chipWidthOf));
  const rows = shown.map((finding, index) => findingSvg(finding, { top: top + index * ROW_H, width, column }));
  const moreRow = more > 0 ? `<text x="0" y="${top + shown.length * ROW_H + 18}" font-size="12.5" style="fill:var(--lo)">${escape(words().moreFindings(more))}</text>` : "";
  const head = headlineOf(pending);
  const said = `${head.title}: ${findingsOf(pending, false).map((finding) => `${finding.chip} ${finding.where} ${finding.value}`).join("; ")}`;
  return {
    height,
    alt: said.length > ALT_MAX ? `${said.slice(0, ALT_MAX - 1)}…` : said,
    source: [svgOpen(width, height), svgStyle(), headerSvg(pending, width), ...rows, moreRow, "</svg>"].join("")
  };
}
function desktopCard(ui, pending, spec) {
  const { Box, Svg } = ui;
  const width = svgWidth(spec.width);
  const card = leakSvg(pending, width);
  const tone = headlineOf(pending).tone;
  return h(Box, {
    flexDirection: "column",
    borderStyle: "single",
    borderColor: role(tone, spec.isLight).line,
    backgroundColor: palette(spec.isLight).card,
    paddingX: 2,
    paddingY: 1
  }, h(Svg, {
    source: card.source,
    alt: card.alt,
    width,
    height: card.height
  }));
}

const HEADER = "secret-guard";
const DETECTOR_CHIPS = [
  [/^Anthropic/, "Anthropic"],
  [/^sk- /, "OpenAI"],
  [/^Stripe/, "Stripe"],
  [/^AWS/, "AWS"],
  [/^GitHub/, "GitHub"],
  [/^Supabase/, "Supabase"]
];
const PRIVATE_KEY = /^private key/;
function chipOf(label) {
  if (PRIVATE_KEY.test(label))
    return words().privateKey;
  return DETECTOR_CHIPS.find(([pattern]) => pattern.test(label))?.[1] ?? label.replace(/ value$/, "");
}
function optionsOf(found) {
  const said = words();
  const allow = { label: said.allow, description: said.allowLine };
  const cancel = { label: said.cancel, description: said.cancelLine };
  if (found.secretCount === 0)
    return [cancel, allow];
  return [{ label: said.move(found.secretCount), description: said.moveLine(found.isMovable) }, allow, cancel];
}
function rowsOf(pending) {
  const isAlone = pending.secrets.length === 0;
  const said = words();
  const env = pending.envFiles.map((path) => isAlone ? [said.envFile, "", path] : [path, said.toGit, ""]);
  const secrets = pending.secrets.map((secret) => [secret.label, secret.masked, secret.where]);
  return [...env, ...secrets];
}
function cardModel(pending) {
  const rows = rowsOf(pending);
  const head = headlineOf(pending);
  return {
    tone: pending.secrets.length === 0 ? "warning" : "error",
    eyebrow: head.eyebrow,
    subject: pending.subject,
    headline: head.title,
    columns: [{ align: "left", isDim: false }, { align: "left", isDim: false, isToned: true }, { align: "left", isDim: true }],
    rows,
    total: rows.length
  };
}
function cardTree(ui, pending, spec) {
  if (spec.surface !== "terminal" && "Svg" in ui)
    return desktopCard(ui, pending, spec);
  return confirmCard(ui, cardModel(pending), spec.width);
}
function described(questions, pending) {
  const lineOf = new Map(pending.options.map((option) => [option.label, option.description]));
  return questions.map((question) => {
    const asked = question;
    if (asked.question !== words().question || !Array.isArray(asked.options))
      return question;
    const options = asked.options.map((option) => {
      const label = option.label;
      return typeof label === "string" && lineOf.has(label) ? { ...option, description: lineOf.get(label) } : option;
    });
    return { ...asked, options };
  });
}

function relative(path, cwd) {
  return cwd !== "" && path.startsWith(`${cwd}/`) ? path.slice(cwd.length + 1) : path;
}
function sourceOf(found) {
  if (found.path !== null)
    return "write";
  const steps = gitSteps(found.command);
  if (steps.some((step) => step.kind === "commit" || step.kind === "push"))
    return "commit";
  return steps.length > 0 ? "add" : "write";
}
const isMovable = (found) => found.path !== null && !isTestPath(found.path) && found.secrets.every((secret) => secret.isMovable);
const shownOf = (secret) => secret.token ?? mask(secret.value);
function pendingOf(found, cwd) {
  const where = (secret) => found.path === null ? secret.where : words().line(secret.line);
  const atOf = (secret) => found.path === null ? relative(secret.where, cwd) : `${relative(found.path, cwd)}:${secret.line}`;
  const secrets = [...found.secrets].sort((a, b) => a.line - b.line);
  return {
    subject: found.path === null ? found.command : relative(found.path, cwd),
    source: sourceOf(found),
    envFiles: found.envFiles,
    secrets: secrets.map((secret) => ({ label: secret.label, chip: chipOf(secret.label), masked: shownOf(secret), where: where(secret), at: atOf(secret) })),
    options: optionsOf({ secretCount: found.secrets.length, isMovable: isMovable(found) })
  };
}
function summary(found) {
  return found.secrets.map((secret) => `${secret.label} ${shownOf(secret)} (${secret.where})`).join(", ");
}
const exposed = (found) => summary(found) || found.envFiles.join(", ");
const unattendedDeny = (found) => `secret-guard blocked this call: it would expose ${exposed(found)}, and nobody can answer its question here, so nothing was moved. Keep secrets in .env (git-ignored) and read them from the environment, or leave this change to the main conversation.`;
const blockedDeny = (found) => `The user blocked this call: it would expose ${exposed(found)}. Keep secrets in .env (git-ignored) and read them from the environment.`;
const moveYourselfDeny = (found) => `The user chose to move ${summary(found)} into .env. Move each secret into the project's .env (git-ignored), reference it from the environment, then retry.`;
const failedDeny = (why) => `secret-guard could not check this call for secrets (${why}), so it was blocked to keep a key from leaking. Retry it; if this keeps happening, the user can turn the scan off with /secret-guard.`;

const FILE_MAX_BYTES = 1e6;
async function scanFile($, path) {
  try {
    const stat = await $.fs.stat(path);
    if (stat.kind !== "file" || stat.size > FILE_MAX_BYTES)
      return "";
    return await $.fs.read(path);
  } catch {
    return "";
  }
}
function gitHost($, cwd) {
  const git = async (argv, dir) => {
    const ran = await $.process.run(["git", ...argv], { cwd: dir });
    if (ran.isStdoutTruncated)
      throw new Error(`git ${argv[0] ?? ""} printed more than secret-guard can read`);
    return ran.exitCode === 0 ? ran.stdout : "";
  };
  return { cwd, git, read: (path) => scanFile($, path) };
}

const DOTS = "●●●●";
const REVEAL_FROM = 8;
const REVEAL_KEEP = 2;
const PEM = /(-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----)[\s\S]*?(-----END (?:[A-Z]+ )*PRIVATE KEY-----)/g;
const ENV_ASSIGNMENT = /(^|[\s;(`'"])((?:export\s+)?[A-Z][A-Z0-9_]+)=(["']?)([^\s"'`;)]+)\3/gm;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
function maskValue(value) {
  return value.length >= REVEAL_FROM ? `${DOTS}${value.slice(-REVEAL_KEEP)}` : DOTS;
}
const isMasked = (value) => value.startsWith(DOTS) || value.startsWith("⟦");
function replaceValues(text, values) {
  return [...new Set(values)].filter((value) => value !== "").sort((a, b) => b.length - a.length).reduce((out, value) => out.split(value).join(maskValue(value)), text);
}
function maskText(text, known = []) {
  if (text === "")
    return text;
  let out = replaceValues(text, [...known]);
  out = out.replace(PEM, (_, begin, end) => `${begin}${DOTS}${end}`);
  out = replaceValues(out, findSecrets(out).filter((secret) => secret.kind !== "private-key").map((secret) => secret.value));
  out = out.replace(ENV_ASSIGNMENT, (whole, lead, name, quote, value) => isMasked(value) ? whole : `${lead}${name}=${quote}${maskValue(value)}${quote}`);
  return out.replace(EMAIL, maskValue);
}
const isPlainObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
function maskDeep(value, known) {
  if (typeof value === "string")
    return maskText(value, known);
  if (Array.isArray(value)) {
    const items = value.map((item) => maskDeep(item, known));
    return items.some((item, index) => item !== value[index]) ? items : value;
  }
  if (!isPlainObject(value))
    return value;
  const entries = Object.entries(value).map(([key, item]) => [key, maskDeep(item, known)]);
  return entries.some(([key, item]) => item !== value[key]) ? Object.fromEntries(entries) : value;
}
const TEXT_PROPS = { Markdown: ["text"], Code: ["source"], Svg: ["alt", "source"] };
function maskElement(node, known) {
  const keys = TEXT_PROPS[String(node.type)] ?? [];
  const props = node.props === undefined ? undefined : { ...node.props };
  let isChanged = false;
  for (const key of keys) {
    const before = props?.[key];
    if (props === undefined || typeof before !== "string")
      continue;
    props[key] = maskText(before, known);
    isChanged ||= props[key] !== before;
  }
  const children = node.children?.map((child) => maskTree(child, known));
  isChanged ||= children?.some((child, index) => child !== node.children?.[index]) ?? false;
  if (!isChanged)
    return node;
  return { ...node, ...props === undefined ? {} : { props }, ...children === undefined ? {} : { children } };
}
function maskTree(node, known) {
  if (typeof node === "string")
    return maskText(node, known);
  if (!isPlainObject(node) || node.type === "engine")
    return node;
  return maskElement(node, known);
}

const CODE_REFS = {
  js: (name) => `process.env.${name}`,
  py: (name) => `os.environ["${name}"]`,
  dart: (name) => `Platform.environment['${name}']`,
  go: (name) => `os.Getenv("${name}")`,
  rb: (name) => `ENV["${name}"]`,
  php: (name) => `getenv('${name}')`
};
const EXTENSION_LANG = {
  js: "js",
  jsx: "js",
  ts: "js",
  tsx: "js",
  mjs: "js",
  cjs: "js",
  mts: "js",
  cts: "js",
  py: "py",
  dart: "dart",
  go: "go",
  rb: "rb",
  php: "php"
};
const NEEDS_QUOTES = /[\s#"'$`\\]/;
function extensionOf(path) {
  const dot = path.lastIndexOf(".");
  return dot < 0 ? "" : path.slice(dot + 1).toLowerCase();
}
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function parseEnv(text) {
  const entries = new Map;
  for (const line of text.split(`
`)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (match === null)
      continue;
    entries.set(match[1] ?? "", (match[2] ?? "").trim().replace(/^(["'])(.*)\1$/, "$2"));
  }
  return entries;
}
function planEntries(secrets, existing) {
  const taken = new Map(existing);
  const plan = [];
  for (const secret of secrets) {
    const same = [...taken.entries()].find(([, value]) => value === secret.value);
    if (same !== undefined) {
      plan.push({ name: same[0], value: secret.value, isNew: false });
      continue;
    }
    let name = secret.envName;
    for (let suffix = 2;taken.has(name); suffix += 1)
      name = `${secret.envName}_${suffix}`;
    taken.set(name, secret.value);
    plan.push({ name, value: secret.value, isNew: true });
  }
  return plan;
}
function envLines(entries) {
  return entries.filter((entry) => entry.isNew).map((entry) => `${entry.name}=${NEEDS_QUOTES.test(entry.value) ? JSON.stringify(entry.value) : entry.value}
`).join("");
}
function appendText(existing, addition) {
  if (addition === "")
    return existing;
  const glue = existing === "" || existing.endsWith(`
`) ? "" : `
`;
  return `${existing}${glue}${addition}`;
}
function rewrite(text, spec) {
  const lang = EXTENSION_LANG[extensionOf(spec.path)];
  const toRef = lang === undefined ? undefined : CODE_REFS[lang];
  let out = text;
  for (const entry of spec.entries) {
    const literal = escapeRegExp(entry.value);
    if (toRef !== undefined) {
      out = out.replace(new RegExp(`(["'\`])${literal}\\1`, "g"), toRef(entry.name));
      out = out.split(entry.value).join(toRef(entry.name));
    } else {
      out = out.split(entry.value).join(`\${${entry.name}}`);
    }
  }
  return out;
}
function hasEnvIgnore(gitignore) {
  return gitignore.split(`
`).some((line) => /^\/?\.env(\*|\.\*)?\s*$/.test(line.trim()));
}
function withTokens(entries, tokens) {
  const spelled = entries.flatMap((entry, index) => {
    const token = tokens[index];
    return token === undefined ? [] : [{ ...entry, value: token }];
  });
  return [...entries, ...spelled];
}
const dirOf = (path) => path.slice(0, path.lastIndexOf("/")) || "/";
async function envRootOf(spec) {
  const start = dirOf(resolvePath(spec.cwd, spec.path));
  for (let dir = start;; dir = dirOf(dir)) {
    if (await spec.exists(`${dir}/.git`))
      return { root: dir, isRepo: true };
    if (dir === "/")
      break;
  }
  const isInSession = spec.cwd !== "" && `${start}/`.startsWith(`${spec.cwd}/`);
  return { root: isInSession ? spec.cwd : start, isRepo: false };
}

const SECTION_ID = "secret-guard:placeholders";
const TOOL_DOORS = new Set(["tool-result", "tool-message"]);
const NOTE = [
  "Some values in this conversation appear as ⟦secret:N⟧ placeholders. Each stands for a real secret the person shared; secret-guard keeps the value out of the chat.",
  "In a Bash command write the placeholder verbatim, quoted as you would quote the value: it is replaced with the real value just before the command runs, and output that echoes the value shows the placeholder again.",
  "Never ask the person for the value. Files get the placeholder as written, not the value: code should read the secret from the environment (.env)."
].join(" ");
const TOKEN_NOTE = "secret-guard: the file keeps each ⟦secret:N⟧ placeholder as written; real values are put in only for Bash commands.";
function withNote(sections) {
  const rest = sections.filter((section) => section.id !== SECTION_ID);
  return sessionVault.byValue.size === 0 ? rest : [...rest, { id: SECTION_ID, text: NOTE, scope: "session" }];
}
function withTokenNote(input, ran) {
  if (ran.deny !== undefined || !isFileTool(input) || !hasTokens(fileText(input)))
    return ran;
  return { ...ran, context: [...ran.context ?? [], TOKEN_NOTE] };
}
function bashCommand(command) {
  const { text, missing } = reveal(sessionVault, command);
  if (missing.length === 0)
    return { command: text };
  return { deny: `secret-guard no longer holds ${missing.join(", ")} (the mod reloaded or the chat was cleared), so the command did not run. Ask the person to paste the secret again.` };
}
function scrubBlock(block) {
  if (block.type === "text" && typeof block.text === "string")
    return { ...block, text: scrub(sessionVault, block.text) };
  if (block.type !== "tool_result")
    return block;
  const content = block.content;
  if (typeof content === "string")
    return { ...block, content: scrub(sessionVault, content) };
  return Array.isArray(content) ? { ...block, content: content.map((item) => scrubBlock(item)) } : block;
}
function scrubbedContent(row) {
  if (sessionVault.byValue.size === 0 || !TOOL_DOORS.has(row.door))
    return null;
  return row.content.map((block) => scrubBlock(block));
}

const SITES = {
  UserMessage: ["text"],
  AssistantMessage: ["text"],
  ToolUse: ["input", "output"],
  ToolResult: ["output"]
};
function maskedProps(component, props, known) {
  let out = props;
  for (const key of SITES[component] ?? []) {
    if (!(key in props))
      continue;
    const before = props[key];
    const masked = maskDeep(before, known);
    if (masked !== before)
      out = { ...out, [key]: masked };
  }
  return out;
}

const EVENT = "PreSkillShellCommand";
const enabledAtom$1 = atom({ plugin: "secret-guard", key: "isEnabled" }, true);
function skillGitCommand(e) {
  const input = e;
  const command = input.hook_event_name === EVENT ? input.tool_input?.command : undefined;
  return typeof command === "string" && gitSteps(command).length > 0 ? command : null;
}
function hookSkillShell(on) {
  on("classic.*", async ($, e, next) => {
    const command = skillGitCommand(e);
    if (command === null || !await read($, enabledAtom$1))
      return next(e);
    const found = { secrets: [], envFiles: [], path: null, command };
    const host = gitHost($, await $.session.cwd().catch(() => "") || "");
    for (const step of gitSteps(command))
      await scanStep(host, step, found);
    if (found.secrets.length + found.envFiles.length === 0)
      return next(e);
    return { block: unattendedDeny({ ...found, envFiles: [...new Set(found.envFiles)] }) };
  }).catch(($, e, next) => {
    if (next.called || skillGitCommand(e) === null)
      return next(e);
    return { block: failedDeny(next.error.message ?? next.error.kind) };
  });
}

const SEPARATOR = " · ";
let shown = null;
function statusText(spec) {
  const said = words();
  const parts = [spec.isRecording ? said.rec : "", spec.keptCount > 0 ? said.keptOut(spec.keptCount) : ""];
  return parts.filter((part) => part !== "").join(SEPARATOR) || undefined;
}
function isNewStatus(text) {
  if (text === shown)
    return false;
  shown = text;
  return true;
}

const COMMAND = "secret-guard";
const REC_COMMAND = "rec";
const STORE_KEY = "secret-guard.enabled";
const DEFAULT_COLUMNS = 100;
const pendingAtom = atom({ plugin: "secret-guard", key: "pending" }, null);
const enabledAtom = atom({ plugin: "secret-guard", key: "isEnabled" }, true);
const recordingAtom = atom({ plugin: "secret-guard", key: "isRecording" }, false);
const session = { cwd: "", isLight: false, isEnabled: true };
async function inspect($, input) {
  const found = { secrets: [], envFiles: [], path: null, command: String(input.command ?? "") };
  session.cwd = await $.session.cwd().catch(() => "") || session.cwd;
  if (isFileTool(input)) {
    const path = pathOf(input);
    if (path === null || isEnvFile(path))
      return null;
    found.path = path;
    const text = fileText(input);
    found.secrets = [...findSecrets(text, path), ...tokenHits(sessionVault, text)].map((secret) => ({ ...secret, where: `${path}:${secret.line}` }));
  } else if (input.tool === "Bash" && typeof input.command === "string") {
    for (const step of gitSteps(input.command))
      await scanStep(gitHost($, session.cwd), step, found);
    found.secrets.push(...bashWriteHits(input.command, sessionVault));
  }
  found.envFiles = [...new Set(found.envFiles)];
  found.secrets = [...new Map(found.secrets.map((secret) => [secret.token ?? secret.value, secret])).values()];
  return found.secrets.length + found.envFiles.length === 0 ? null : found;
}
const HUB = { plugin: "secret-guard", key: "hub" };
const HUB_SUBJECT_CHARS = 30;
async function tellHub($, subject) {
  const short = subject !== null && subject.length > HUB_SUBJECT_CHARS ? `${subject.slice(0, HUB_SUBJECT_CHARS)}…` : subject;
  const said = short === null ? { detail: "", tone: "idle" } : { detail: words().hubWaiting(short), tone: "warn" };
  try {
    await $.state.set(HUB, { pane: "secret-guard", ...said, at: await $.clock.now().catch(() => Date.now()), title: "Secret Guard", icon: "key", section: "safety", isBandOnly: true });
  } catch {
    $.ui.log("secret-guard: could not tell the MODZ panel", { to: "debug" });
  }
}
async function askUser($, found) {
  const pending = pendingOf(found, session.cwd);
  const options = pending.options.map((option) => option.label);
  await update($, pendingAtom, () => pending);
  await tellHub($, pending.subject);
  let answer = "";
  try {
    answer = await $.ui.ask(words().question, { options, header: HEADER });
  } catch {
    $.ui.log("secret-guard: question dismissed, call cancelled", { to: "debug" });
  }
  await update($, pendingAtom, () => null);
  await tellHub($, null);
  return answer;
}
async function writeEnv($, found) {
  const { root, isRepo } = await envRootOf({ path: found.path ?? session.cwd, cwd: session.cwd, exists: (path) => $.fs.exists(path) });
  const envPath = `${root}/.env`;
  const existing = await $.fs.exists(envPath) ? await $.fs.read(envPath) : "";
  const entries = planEntries(found.secrets, parseEnv(existing));
  await $.fs.write(envPath, appendText(existing, envLines(entries)));
  if (isRepo) {
    const ignorePath = `${root}/.gitignore`;
    const ignore = await $.fs.exists(ignorePath) ? await $.fs.read(ignorePath) : "";
    if (!hasEnvIgnore(ignore))
      await $.fs.write(ignorePath, appendText(ignore, `.env
`));
  }
  return { entries, envPath };
}
async function isUnattended($, e) {
  return e.agentId !== undefined || (await $.session.surfaces()).length === 0;
}
async function showStatus($) {
  const text = statusText({ isRecording: await read($, recordingAtom), keptCount: sessionVault.byValue.size });
  if (isNewStatus(text))
    $.ui.status(text);
}
async function refreshTheme($) {
  const rows = await $.config.list();
  const hints = { override: await $.env.get("MODZ_THEME"), theme: rows.find((row) => row.key === "theme")?.value, colorfgbg: await $.env.get("COLORFGBG") };
  if (resolveLight(hints) === resolveLight({ ...hints, systemDark: false })) {
    session.isLight = resolveLight(hints);
    return;
  }
  const mac = await $.process.run(["defaults", "read", "-g", "AppleInterfaceStyle"], { timeoutMs: 2000 });
  session.isLight = resolveLight({ ...hints, systemDark: mac.exitCode === 0 ? mac.stdout.trim() === "Dark" : false });
}
function hookSession(on) {
  on("session.start", async ($, e, next) => {
    setLang(await $.env.get("MODZ_LANG").catch(() => {
      return;
    }));
    try {
      session.cwd = e.cwd;
      const saved = await $.store.get(STORE_KEY);
      session.isEnabled = saved !== false;
      await update($, enabledAtom, () => session.isEnabled);
      await $.command.register({ name: COMMAND, description: words().commandLine });
      await $.command.register({ name: REC_COMMAND, description: words().recCommandLine });
      await showStatus($);
    } catch {
      $.ui.log("secret-guard: could not load settings", { to: "debug" });
    }
    await refreshTheme($).catch(() => $.ui.log("secret-guard: could not read the theme, drawing dark", { to: "debug" }));
    return next(e);
  });
  on("session.end", async ($, e, next) => {
    if (e.reason === "clear") {
      clearVault(sessionVault);
      await showStatus($);
    }
    return next(e);
  });
}
function hookCommand(on) {
  on("command.run", { command: COMMAND }, async ($) => {
    const isOn = !await read($, enabledAtom);
    session.isEnabled = isOn;
    await update($, enabledAtom, () => isOn);
    await $.store.set(STORE_KEY, isOn);
    return { text: words().toggled(isOn) };
  });
  on("command.run", { command: REC_COMMAND }, async ($) => {
    const isOn = !await read($, recordingAtom);
    await update($, recordingAtom, () => isOn);
    await showStatus($);
    return { text: words().recToggled(isOn) };
  });
}
function hookCall(on) {
  on("tool.call", async ($, e, next) => {
    if (!await read($, enabledAtom))
      return next(e);
    const input = e;
    const found = await inspect($, input);
    if (found === null)
      return withTokenNote(input, await next(e));
    if (await isUnattended($, e)) {
      if (found.envFiles.length > 0 || found.secrets.some((secret) => secret.token === undefined))
        return { deny: unattendedDeny(found) };
      return withTokenNote(input, await next(e));
    }
    const answer = await askUser($, found);
    if (answer === words().allow)
      return withTokenNote(input, await next(e));
    if (found.secrets.length === 0 || answer !== words().move(found.secrets.length))
      return { deny: blockedDeny(found) };
    if (!isMovable(found))
      return { deny: moveYourselfDeny(found) };
    const { entries, envPath } = await writeEnv($, found);
    const path = found.path ?? "";
    const spelled = withTokens(entries, found.secrets.map((secret) => secret.token));
    const ran = await next({ ...e, ...patchedFields(input, (text) => rewrite(text, { path, entries: spelled })) });
    const note = `secret-guard moved ${entries.length} secret(s) from ${path} into ${envPath} as ${entries.map((entry) => entry.name).join(", ")}; the file now reads them from the environment. Make sure the program loads .env.`;
    return ran.deny === undefined ? { ...ran, context: [...ran.context ?? [], note] } : ran;
  }).catch(($, e, next) => {
    if (next.error.kind !== "re-entry" && next.called)
      return next(e);
    const input = e;
    let isRisky = true;
    try {
      isRisky = session.isEnabled && (next.error.kind === "re-entry" ? isRiskyAsIs(input, sessionVault) : isGuarded(input));
    } catch {}
    return isRisky ? { deny: failedDeny(next.error.message ?? next.error.kind) } : next(e);
  });
}
function hookPlaceholders(on) {
  on("prompt.submit", async ($, e, next) => {
    if (!await read($, enabledAtom))
      return next(e);
    const text = hide(sessionVault, e.text);
    if (text === e.text)
      return next(e);
    const entered = await next({ ...e, text });
    await showStatus($);
    return entered;
  });
  on("prompt.compose", async ($, e, next) => {
    const composed = await next(e);
    return { ...composed, sections: withNote(composed.sections) };
  });
  on("tool.call", { tool: "Bash" }, async ($, e, next) => {
    if (e.tool !== "Bash" || !hasTokens(e.command))
      return next(e);
    const revealed = bashCommand(e.command);
    return "deny" in revealed ? revealed : next({ ...e, command: revealed.command });
  });
  on("session.append", async ($, e, next) => {
    const content = scrubbedContent({ door: e.door, content: e.message.content });
    return content === null ? next(e) : next({ ...e, message: { ...e.message, content } });
  });
}
function hookRender(on) {
  on("ui.render", { component: "AskUserQuestion" }, async ($, e, next) => {
    const pending = await read($, pendingAtom);
    if (pending === null)
      return next(e);
    const ui = $.ui.resolve(e);
    const { Box } = ui;
    const theirs = await next({ ...e, props: { ...e.props, questions: described(e.props.questions, pending) } });
    const spec = { width: e.viewport?.columns ?? DEFAULT_COLUMNS, isLight: session.isLight, surface: e.surface };
    return h(Box, {
      flexDirection: "column",
      rowGap: 1
    }, cardTree(ui, pending, spec), theirs);
  });
  on("ui.render", { component: ["UserMessage", "AssistantMessage", "ToolUse", "ToolResult"] }, async ($, e, next) => {
    if (!await read($, recordingAtom))
      return next(e);
    const known = [...sessionVault.byValue.keys()];
    const props = maskedProps(e.component, e.props, known);
    const tree = await next(props === e.props ? e : { ...e, props });
    return maskTree(tree, known);
  });
}
const register = (on) => {
  hookSession(on);
  hookCommand(on);
  hookCall(on);
  hookSkillShell(on);
  hookPlaceholders(on);
  hookRender(on);
};

export { register };
