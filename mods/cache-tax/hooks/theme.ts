// Tidemark tokens (DESIGN.md §2-3), both themes. Every colour the mod draws comes from here,
// so moving to the shared kit later is one import.

export type Role = 'read' | 'edit' | 'run' | 'ok' | 'warn' | 'danger' | 'plan'
export type Tone = { fg: string; tint: string; line: string }
export type Palette = {
  sheet: string
  card: string
  inset: string
  line: string
  lineStrong: string
  track: string
  hi: string
  mid: string
  lo: string
  role: Record<Role, Tone>
}

const DARK: Palette = {
  sheet: '#191917', card: '#1F1F1C', inset: '#171715', line: '#2E2E2A', lineStrong: '#45443F', track: '#34332F',
  hi: '#F0EEE8', mid: '#C2BEB4', lo: '#8E8A80',
  role: {
    read: { fg: '#7FB6E8', tint: '#1E2B37', line: '#2F4A63' },
    edit: { fg: '#E58A5F', tint: '#38251D', line: '#6A3E2D' },
    run: { fg: '#B19CF3', tint: '#29243D', line: '#4A3F75' },
    ok: { fg: '#6FC593', tint: '#1B2F25', line: '#2F5A42' },
    warn: { fg: '#E9B949', tint: '#332D19', line: '#66552A' },
    danger: { fg: '#F2727F', tint: '#3B2023', line: '#74343C' },
    plan: { fg: '#E07BC0', tint: '#351F2E', line: '#6B3A5C' },
  },
}

const LIGHT: Palette = {
  sheet: '#F4F2EC', card: '#FFFFFF', inset: '#F6F4EF', line: '#E4E0D6', lineStrong: '#CFC9BC', track: '#ECE8DF',
  hi: '#1C1B19', mid: '#4F4B44', lo: '#77726A',
  role: {
    read: { fg: '#2464A0', tint: '#E7F0F9', line: '#B9D3EC' },
    edit: { fg: '#A94A26', tint: '#FBEDE6', line: '#EFC6B4' },
    run: { fg: '#6243C4', tint: '#F0ECFC', line: '#CFC3F3' },
    ok: { fg: '#1F6E43', tint: '#E4F4EA', line: '#B5DEC4' },
    warn: { fg: '#8A6000', tint: '#FBF2D9', line: '#EBD48F' },
    danger: { fg: '#C0263A', tint: '#FCE8EA', line: '#F1B9C0' },
    plan: { fg: '#A8337F', tint: '#FBE9F4', line: '#EDBFDC' },
  },
}

export const palette = (isLight: boolean): Palette => (isLight ? LIGHT : DARK)

/** The terminal's theme keys for each role (DESIGN.md §2). */
export const TERMINAL: Record<Role, string> = {
  read: 'suggestion', edit: 'claude', run: 'permission', ok: 'success', warn: 'warning', danger: 'error', plan: 'merged',
}

/** Claude Code's theme names say light in them: `light`, `light-daltonized`, ... */
export const isLightTheme = (value: unknown): boolean => typeof value === 'string' && value.startsWith('light')

export const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`
export const MONO = `ui-monospace, 'SF Mono', Menlo, monospace`

/** Eyebrows are upper case the Turkish way: i → İ. */
export const upper = (text: string): string => text.toLocaleUpperCase('tr')
