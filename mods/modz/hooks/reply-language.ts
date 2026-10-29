// The reply-language keeper's judgement (anthropics/claude-code#96326): which language the person speaks, and
// whether a tool's output is English prose that could pull the next reply into English. Word tables only, no
// model call. Code and data carry few English function words, so they never count as prose.
import type { Lang } from './kit/lang'

export type Target = { name: string; profile?: Profile }

type Profile = { words: ReadonlySet<string>; letters?: RegExp }

const ENGLISH: Profile = {
  // Function words prose is full of and code rarely spells (no `for`, `if`, `from`, `this`, `new`, `return`).
  words: new Set('the a an and of to is are was were be been it its that which you your we they there their has have had will would can could should not but on at by our this these those than'.split(' ')),
}

const TURKISH: Profile = {
  words: new Set('ve bir bu şu o da de ki ile için gibi daha çok ama veya ya mi mı mu mü ne var yok olan olarak değil kadar sonra önce her en ben sen biz siz'.split(' ')),
  letters: /[çğıöşü]/,
}

// A setting may spell the language in English, in Turkish or as its code.
const NAMED: readonly { pattern: RegExp; target: Target | undefined }[] = [
  { pattern: /^(en|english|ingilizce)\b/i, target: undefined },
  { pattern: /^(tr|turkish|türkçe|turkce)\b/i, target: { name: 'Turkish', profile: TURKISH } },
]

// Fewer words than this is a status line or a short error: too little to sway a reply.
const MIN_WORDS = 30
// Only the head is read: enough to tell prose from code, cheap on a long file.
const SAMPLE_CHARS = 4000
// The share of words a profile must claim for the text to be in that language.
const PROSE_SHARE = 0.2

// Claude Code's own `language` setting wins; else the interface language, when it is not English.
export function targetOf(opts: { setting: unknown; uiLang: Lang }): Target | undefined {
  if (typeof opts.setting === 'string' && opts.setting.trim() !== '') {
    const name = opts.setting.trim()
    const named = NAMED.find(entry => entry.pattern.test(name))

    return named ? named.target : { name }
  }

  return opts.uiLang === 'tr' ? { name: 'Turkish', profile: TURKISH } : undefined
}

const wordsOf = (text: string): string[] => (text.slice(0, SAMPLE_CHARS).toLowerCase().match(/\p{L}+/gu) ?? [])

function shareOf(words: readonly string[], profile: Profile): number {
  const hits = words.filter(word => profile.words.has(word) || profile.letters?.test(word) === true).length

  return hits / words.length
}

// English prose that is not already the person's language; a target with no table is judged on the English alone.
export function needsReminder(opts: { text: string; target: Target }): boolean {
  const words = wordsOf(opts.text)
  if (words.length < MIN_WORDS || shareOf(words, ENGLISH) < PROSE_SHARE) return false

  return opts.target.profile === undefined || shareOf(words, opts.target.profile) < PROSE_SHARE
}

export const reminderOf = (target: Target): string =>
  `Reply in ${target.name}, the user's language; keep code, paths and identifiers as they are.`
