import { isServiceRoleJwt } from './jwt'

export type Secret = {
  kind: string
  label: string
  // The raw value stays in memory for the rewrite; only `mask(value)` is ever shown or logged.
  value: string
  envName: string
  line: number
  isMovable: boolean
}

type Rule = { kind: string; label: string; pattern: RegExp; envName: string; group?: number; isMovable?: boolean; isReal?: (value: string) => boolean }

const ENTROPY_MIN = 3.5
const GENERIC_MIN = 12
const GENERIC_LONG = 24
const MASK_KEEP = 4
const SCAN_MAX_CHARS = 2_000_000

// Real keys are random base62: upper, lower and a digit. A slug or CSS class (`sk-spinner-...`) is not.
const isMixed = (value: string): boolean => /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value)
const isMixedCase = (value: string): boolean => /[A-Z]/.test(value) && /[a-z]/.test(value)

const RULES: Rule[] = [
  { kind: 'anthropic', label: 'Anthropic API key', pattern: /sk-ant-[A-Za-z0-9_-]{20,}/g, envName: 'ANTHROPIC_API_KEY' },
  { kind: 'openai', label: 'sk- API key', pattern: /\bsk-(?!ant-)[A-Za-z0-9_-]{20,}/g, envName: 'OPENAI_API_KEY', isReal: isMixed },
  { kind: 'stripe', label: 'Stripe live key', pattern: /\b(?:sk|rk)_live_[0-9a-zA-Z]{16,}/g, envName: 'STRIPE_SECRET_KEY' },
  { kind: 'stripe', label: 'Stripe test key', pattern: /\b(?:sk|rk)_test_[0-9a-zA-Z]{16,}/g, envName: 'STRIPE_SECRET_KEY' },
  { kind: 'aws-id', label: 'AWS access key id', pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, envName: 'AWS_ACCESS_KEY_ID' },
  {
    kind: 'aws-secret',
    label: 'AWS secret key',
    pattern: /aws_?secret_?access_?key["']?\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})/gi,
    envName: 'AWS_SECRET_ACCESS_KEY',
    group: 1,
  },
  { kind: 'github', label: 'GitHub token', pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})/g, envName: 'GITHUB_TOKEN' },
  { kind: 'gitlab', label: 'GitLab token', pattern: /\bglpat-[0-9A-Za-z_-]{20,}/g, envName: 'GITLAB_TOKEN' },
  { kind: 'slack', label: 'Slack token', pattern: /\bxox[abposr]-[0-9A-Za-z-]{20,}/g, envName: 'SLACK_TOKEN', isReal: isMixed },
  { kind: 'slack-webhook', label: 'Slack webhook URL', pattern: /https:\/\/hooks\.slack\.com\/(?:services|workflows|triggers)\/[A-Za-z0-9_/-]{20,}/g, envName: 'SLACK_WEBHOOK_URL' },
  { kind: 'google', label: 'Google API key', pattern: /\bAIza[0-9A-Za-z_-]{35}/g, envName: 'GOOGLE_API_KEY' },
  { kind: 'huggingface', label: 'Hugging Face token', pattern: /\bhf_[A-Za-z0-9]{30,}/g, envName: 'HF_TOKEN', isReal: isMixedCase },
  { kind: 'sendgrid', label: 'SendGrid API key', pattern: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/g, envName: 'SENDGRID_API_KEY' },
  { kind: 'supabase-secret', label: 'Supabase secret key', pattern: /\bsb_secret_[A-Za-z0-9_-]{20,}/g, envName: 'SUPABASE_SECRET_KEY' },
  {
    kind: 'database-url',
    label: 'database URL with a password',
    pattern: /\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|rediss?|amqps?):\/\/[^\s:@/'"`]+:[^\s@/'"`]+@[^\s'"`]+/g,
    envName: 'DATABASE_URL',
    isReal: url => isRealPassword(url),
  },
  // The token sits inside a header string, so moving it would break the string: Claude moves it.
  { kind: 'bearer', label: 'bearer token', pattern: /\bBearer\s+([A-Za-z0-9._~+/-]{16,}=*)/g, envName: 'API_TOKEN', group: 1, isMovable: false, isReal: value => isRandomLooking(value) },
  { kind: 'private-key', label: 'private key', pattern: /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY(?: BLOCK)?-----/g, envName: 'PRIVATE_KEY', isMovable: false },
]

const JWT = /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g
// `password:`, `token:` and `secret:` count bare; KEY, AUTH, CREDENTIALS and _PASS need a prefix (`key=` is not a secret).
const GENERIC = /\b((?:[A-Za-z_][A-Za-z0-9_]*)?(?:SECRET|TOKEN|PASSWORD|PASSWD|PWD)|[A-Za-z_][A-Za-z0-9_]*(?:KEY|AUTH|CREDENTIALS?|_PASS))\b["']?\s*[:=]\s*(["'`]?)([^\s"'`;,()[\]{}]{12,})\2/gi
const PLACEHOLDER = /⟦|process\.env|os\.environ|getenv|\$\{|<|>|your|xxx|example|changeme|placeholder|dummy|redacted|\*\*\*/i
const MEMBER_ACCESS = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)+$/
// Setting keys and slugs such as `done-ping.thresholdSeconds`: every segment starts with a letter.
const DOTTED_NAME = /^[A-Za-z][A-Za-z0-9]*(?:[-.][A-Za-z][A-Za-z0-9]*)+$/
// A file path (`~/.ssh/id_ed25519`, `/etc/ssl/server.key`, `keys/release.pem`) names where a key is, not the key.
const FILE_PATH = /^(?:(?:~|\.{1,2})?\/[\w.@-]+(?:\/[\w.@-]+)*\/?|[\w.@-]+(?:\/[\w.@-]+)+\.[A-Za-z][A-Za-z0-9]{0,4})$/
const HEX = /^[0-9a-f]+$/i
const GIT_SHA = /^[0-9a-f]{40}$/
const HASH_NAME = /CACHE|HASH|SHA|DIGEST|ETAG|CHECKSUM|COMMIT|REVISION|INTEGRITY/i
// shortcut: a 40-hex value is taken for a git SHA unless the name says secret; legacy 40-hex tokens under a plain *_TOKEN name pass.
const SECRET_NAME = /SECRET|PASSWORD|PASSWD|PWD|PRIVATE|API|AUTH|ACCESS|SESSION|GITHUB|GH_/i
const DEFAULT_PASSWORDS = /^(?:password|pass|postgres|root|secret|admin|test|mysql|redis|guest)$/i
const TEST_PATH = /(^|\/)(tests?|__tests__|fixtures?|__mocks__)\/|\.(test|spec)\.[cm]?[jt]sx?$/
// Test files hold fake values on purpose; only real key shapes are reported there.
const LENIENT_IN_TESTS = new Set(['generic', 'private-key'])
// A key-shaped value in a test file that says it is fake (`sk-test-...`, `ghp_fake...`) is a fixture.
const FAKE_VALUE = /test|fake|dummy|mock|sample|example|fixture/i

export function isTestPath(path: string): boolean {
  return TEST_PATH.test(path)
}

export function mask(value: string): string {
  return `${value.slice(0, MASK_KEEP)}****`
}

export function entropy(text: string): number {
  const counts = new Map<string, number>()
  for (const char of text) counts.set(char, (counts.get(char) ?? 0) + 1)
  let bits = 0
  for (const count of counts.values()) {
    const share = count / text.length
    bits -= share * Math.log2(share)
  }

  return bits
}

function lineAt(text: string, index: number): number {
  let line = 1
  for (let at = 0; at < index; at += 1) if (text.charCodeAt(at) === 10) line += 1

  return line
}

function isRandomLooking(value: string): boolean {
  if (value.length < GENERIC_MIN || PLACEHOLDER.test(value) || MEMBER_ACCESS.test(value) || DOTTED_NAME.test(value) || FILE_PATH.test(value)) return false
  const hasDigit = /\d/.test(value)

  return entropy(value) >= ENTROPY_MIN && (hasDigit || value.length >= GENERIC_LONG)
}

// A digest under a hash-like name, or a git SHA under a name that does not say secret.
function isHashLike(name: string, value: string): boolean {
  return HEX.test(value) && (HASH_NAME.test(name) || (GIT_SHA.test(value) && !SECRET_NAME.test(name)))
}

function isRealPassword(url: string): boolean {
  const [, user = '', password = ''] = /:\/\/([^:]+):([^@]+)@/.exec(url) ?? []

  return password !== user && !password.startsWith('$') && !PLACEHOLDER.test(password) && !DEFAULT_PASSWORDS.test(password)
}

function envNameOf(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9_]/g, '_')
    .toUpperCase()
}

function ruleHits(text: string): Secret[] {
  const found: Secret[] = []
  for (const rule of RULES) {
    for (const match of text.matchAll(rule.pattern)) {
      const value = match[rule.group ?? 0] ?? ''
      if (value === '' || rule.isReal?.(value) === false) continue
      found.push({ kind: rule.kind, label: rule.label, value, envName: rule.envName, line: lineAt(text, match.index ?? 0), isMovable: rule.isMovable !== false })
    }
  }
  for (const match of text.matchAll(JWT)) {
    if (!isServiceRoleJwt(match[0])) continue
    found.push({ kind: 'supabase', label: 'Supabase service_role key', value: match[0], envName: 'SUPABASE_SERVICE_ROLE_KEY', line: lineAt(text, match.index ?? 0), isMovable: true })
  }

  return found
}

function genericHits(text: string, known: Set<string>): Secret[] {
  const found: Secret[] = []
  for (const match of text.matchAll(GENERIC)) {
    const name = match[1] ?? ''
    const value = match[3] ?? ''
    if ([...known].some(secret => secret.includes(value) || value.includes(secret)) || !isRandomLooking(value) || isHashLike(name, value)) continue
    found.push({ kind: 'generic', label: `${name} value`, value, envName: envNameOf(name), line: lineAt(text, match.index ?? 0), isMovable: true })
  }

  return found
}

export function findSecrets(text: string, path = ''): Secret[] {
  const isTest = isTestPath(path)
  const scanned = text.length > SCAN_MAX_CHARS ? text.slice(0, SCAN_MAX_CHARS) : text
  const specific = ruleHits(scanned)
  const all = [...specific, ...genericHits(scanned, new Set(specific.map(secret => secret.value)))]
  const seen = new Set<string>()

  return all.filter(secret => {
    if (isTest && (LENIENT_IN_TESTS.has(secret.kind) || FAKE_VALUE.test(secret.value))) return false
    if (seen.has(secret.value)) return false
    seen.add(secret.value)

    return true
  })
}
