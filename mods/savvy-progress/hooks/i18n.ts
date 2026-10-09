// Turkish by default; `auto` follows Claude Code's `language` setting, then the locale.
import { en } from './lang-en'
import { ru } from './lang-ru'
import { tr } from './lang-tr'
import type { Lang, Strings } from './strings'

export type { Lang, Strings } from './strings'

const STRINGS: Record<Lang, Strings> = { tr, en, ru }

// Module scope is fine here: session.start sets it again on every (re)load.
let lang: Lang = 'tr'

export const t = (): Strings => STRINGS[lang]

export const setLang = (next: Lang): void => {
  lang = next
}

export const langOf = (value: unknown): Lang | null => {
  if (typeof value !== 'string' || !value.trim()) return null
  if (/^(tr|turk|türk)/i.test(value.trim())) return 'tr'
  if (/^(ru|russian|рус)/i.test(value.trim())) return 'ru'
  return 'en'
}

export const isLang = (v: unknown): v is Lang => v === 'tr' || v === 'en' || v === 'ru'

/** Every language's strings, for a test that checks none is missing a word. */
export const ALL_STRINGS: Readonly<Record<Lang, Strings>> = STRINGS
