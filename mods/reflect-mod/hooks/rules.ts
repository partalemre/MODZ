// Pure rule logic: the cheap prefilter (trivial, secret, trigger words), the model's policy and
// verdict, rule similarity, and the marked CLAUDE.md section a rule is written into.

/** Longer prompts are task briefs and pastes, not corrections (unless they say "remember:"). */
export const MAX_PROMPT = 500
const MAX_RULE = 200
/** What the card quotes back of the person's own words. */
export const MAX_SAID = 200
export const START = '<!-- claude-reflect: learned rules (saved from the band; edit freely) -->'
export const END = '<!-- end claude-reflect -->'
/** Two rules this alike (ordered word pairs) are the same rule. */
export const SAME = 0.6
const SAME_BULLET = 0.8

/** Acknowledgements and go-aheads: nothing to learn, so no model call. English, Turkish, Russian. */
const TRIVIAL = new RegExp('^(y|yes|yep|ok|okay|k|go|go on|go ahead|continue|proceed|next|done|thanks|thank you|ty|great|nice|' +
  'cool|lgtm|tamam|tamamdır|tmm|evet|olur|peki|devam|devam et|sağol|sağ ol|teşekkürler|teşekkür ederim|eyvallah|harika|' +
  'süper|güzel|anladım|aynen|okey|да|ок|окей|ага|го|давай|дальше|продолжай|спасибо|отлично|\\d{1,3})[\\s.!)]*$', 'i')

/** Words a correction or a standing preference is said with. English and Russian as whole words. */
const TRIGGER_WORDS = new RegExp('(?<![\\p{L}\\p{N}])(no|not|don\'?t|do not|never|always|instead|wrong|stop|prefer|should|' +
  'must|use|avoid|remember|rather|actually|from now on|i wish|in this (repo|project)|нет|не|используй|всегда|никогда|' +
  'вместо)(?![\\p{L}\\p{N}])', 'iu')
/** Turkish ones as stems, so their suffixes match too: kullanma, kullanın, yapmayın, değildi. */
const TRIGGER_STEMS = new RegExp('(?<![\\p{L}\\p{N}])(hayır|değil|yapma|etme|kullan|yerine|asla|hiçbir zaman|her zaman|hep|' +
  'daima|bundan sonra|artık|yanlış|olmaz|istemiyorum|tercih|keşke|lütfen|unutma|hatırla|sakın|bu repo|bu proje)', 'iu')

const SECRET = [
  /\b(sk|pk|rk|ghp|gho|ghs|github_pat|xox[abprs]|glpat)[-_][A-Za-z0-9_-]{8,}/i,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{20,}/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, // a JWT
  /(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{32,}/, // a long token: letters and digits, no path or dots
  /(password|passwd|passphrase|secret|token|api[ _-]?key|şifre|parola|пароль|токен|ключ)\s*(\bis\b|:|=)\s*\S{4,}/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
]

export const looksSecret = (s: string): boolean => SECRET.some(re => re.test(s))

export const isTrivial = (text: string): boolean => TRIVIAL.test(text.trim())

/** Turkish lower case first (İ → i, I → ı), then the plain one, so both spellings meet the lists. */
export const hasTrigger = (text: string): boolean =>
  [text.toLocaleLowerCase('tr'), text.toLowerCase()].some(t => TRIGGER_WORDS.test(t) || TRIGGER_STEMS.test(t))

export const remembered = (text: string): string | undefined =>
  /^\s*(remember|hatırla|unutma)\s*:\s*([\s\S]+)$/i.exec(text)?.[2]?.trim()

/** Ordered word pairs, short words kept: "pnpm, not npm" and "npm, not pnpm" share none. */
export function pairs(s: string): Set<string> {
  const words = s.toLowerCase().replace(/[^\p{L}\p{N}+#.\s]/gu, ' ').split(/\s+/).filter(Boolean)
  const out = new Set<string>()
  if (words.length === 1) out.add(words[0] ?? '')
  for (let i = 0; i + 1 < words.length; i += 1) out.add(`${words[i]} ${words[i + 1]}`)
  return out
}

/** Overlap of two rules' ordered word pairs: 1 the same, 0 nothing in common. */
export function similarity(a: string, b: string): number {
  const x = pairs(a)
  const y = pairs(b)
  if (x.size === 0 || y.size === 0) return 0
  let both = 0
  for (const p of x) if (y.has(p)) both += 1
  return both / (x.size + y.size - both)
}

const bulletsOf = (file: string): string[] =>
  file.split('\n').filter(line => /^\s*[-*] /.test(line)).map(line => line.replace(/^\s*[-*]\s+/, ''))

/** Whether any bullet of `file` already says `rule`. */
export const isKnownIn = (file: string, rule: string, threshold = SAME): boolean =>
  bulletsOf(file).some(line => similarity(line, rule) >= threshold)

/** The one check every rule passes before it is kept or written, whoever wrote it. */
export function cleanRule(raw: string): string | undefined {
  const rule = raw.trim().replace(/^[-*]\s+/, '')
  if (rule === '' || rule.length > MAX_RULE) return undefined
  if (/[\r\n\u0000-\u001f\u007f]/.test(rule) || rule.includes('<!--') || rule.includes('-->')) return undefined
  if (looksSecret(rule)) return undefined
  return rule
}

function separator(file: string): string {
  if (file === '' || file.endsWith('\n\n')) return ''
  return file.endsWith('\n') ? '\n' : '\n\n'
}

/**
 * `file` with `rule` added as a bullet inside the marked section; the file unchanged when a similar bullet is there;
 * undefined when the markers are broken (one without the other, out of order, or repeated) - never guess where to write.
 */
export function withRule(file: string, rule: string): string | undefined {
  if (isKnownIn(file, rule, SAME_BULLET)) return file
  const starts = file.split(START).length - 1
  const ends = file.split(END).length - 1
  if (starts === 0 && ends === 0) {
    return `${file}${separator(file)}${START}\n## Learned rules\n- ${rule}\n${END}\n`
  }
  const start = file.indexOf(START)
  const end = file.indexOf(END)
  if (starts !== 1 || ends !== 1 || end < start) return undefined
  return `${file.slice(0, end)}- ${rule}\n${file.slice(end)}`
}
