// MODZ kit — the interface language: English, or Turkish when the person sets MODZ_LANG=tr (the "env" of
// ~/.claude/settings.json). One value per mod: its register file reads the variable at session.start with
// `setLang(await $.env.get('MODZ_LANG'))` (the engine only admits an env read whose name is a literal), and every
// drawing reads it back through `pick` and `upper`.
export type Lang = 'en' | 'tr'

let current: Lang = 'en'

export const langOf = (value: unknown): Lang => (typeof value === 'string' && /^tr/i.test(value.trim()) ? 'tr' : 'en')

export function setLang(value: unknown): Lang {
  current = langOf(value)

  return current
}

export const lang = (): Lang => current

// The current language's entry of a table that fills in both: `pick({ en: 'Open', tr: 'Aç' })`.
export const pick = <T>(table: Readonly<Record<Lang, T>>): T => table[current]

// Capitals for eyebrows and labels: Turkish keeps its dotted İ, English never gets one.
export const upper = (text: string): string => text.toLocaleUpperCase(current)
