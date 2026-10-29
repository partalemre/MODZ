// Tidemark tokens (DESIGN.md §2) in one file, so the shared kit can replace it as a whole.
// Svg reads them as CSS variables of the root's theme class; Box and Text read them through
// `boxColor`, which falls back to the host's theme keys while the theme is not known.

export type Mode = 'dark' | 'light' | 'auto'
export type Role = 'tide' | 'kiln' | 'iris' | 'moss' | 'amber' | 'flare' | 'orchid'
export type Neutral = 'card' | 'inset' | 'line' | 'strong' | 'track' | 'hi' | 'mid' | 'lo'
export type Theme = { mode: Mode; isLight: boolean }

type Swatch = { fg: string; tint: string; line: string }
type Palette = Record<Neutral, string> & Record<Role, Swatch>

// `MODZ_THEME=light|dark` (read by each mod with a literal $.env.get) pins the theme;
// otherwise Svg follows the surface's color scheme.
export const AUTO: Theme = { mode: 'auto', isLight: false }

const NEUTRALS: Neutral[] = ['card', 'inset', 'line', 'strong', 'track', 'hi', 'mid', 'lo']
const ROLES: Role[] = ['tide', 'kiln', 'iris', 'moss', 'amber', 'flare', 'orchid']

const DARK: Palette = {
  card: '#1F1F1C', inset: '#171715', line: '#2E2E2A', strong: '#45443F', track: '#34332F',
  hi: '#F0EEE8', mid: '#C2BEB4', lo: '#8E8A80',
  tide: { fg: '#7FB6E8', tint: '#1E2B37', line: '#2F4A63' },
  kiln: { fg: '#E58A5F', tint: '#38251D', line: '#6A3E2D' },
  iris: { fg: '#B19CF3', tint: '#29243D', line: '#4A3F75' },
  moss: { fg: '#6FC593', tint: '#1B2F25', line: '#2F5A42' },
  amber: { fg: '#E9B949', tint: '#332D19', line: '#66552A' },
  flare: { fg: '#F2727F', tint: '#3B2023', line: '#74343C' },
  orchid: { fg: '#E07BC0', tint: '#351F2E', line: '#6B3A5C' },
}

const LIGHT: Palette = {
  card: '#FFFFFF', inset: '#F6F4EF', line: '#E4E0D6', strong: '#CFC9BC', track: '#ECE8DF',
  hi: '#1C1B19', mid: '#4F4B44', lo: '#77726A',
  tide: { fg: '#2464A0', tint: '#E7F0F9', line: '#B9D3EC' },
  kiln: { fg: '#A94A26', tint: '#FBEDE6', line: '#EFC6B4' },
  iris: { fg: '#6243C4', tint: '#F0ECFC', line: '#CFC3F3' },
  moss: { fg: '#1F6E43', tint: '#E4F4EA', line: '#B5DEC4' },
  amber: { fg: '#8A6000', tint: '#FBF2D9', line: '#EBD48F' },
  flare: { fg: '#C0263A', tint: '#FCE8EA', line: '#F1B9C0' },
  orchid: { fg: '#A8337F', tint: '#FBE9F4', line: '#EDBFDC' },
}

// The terminal's theme keys for each role (DESIGN.md §2, "Terminal eşlemesi").
export const THEME_KEY: Record<Role, string> = {
  tide: 'suggestion', kiln: 'claude', iris: 'permission', moss: 'success', amber: 'warning', flare: 'error', orchid: 'merged',
}

// A Box's fill and its quiet 1px edge, in hex (DESIGN.md §0.7): known only while the theme is pinned, so an
// `auto` card draws in the surface's own colors.
export function cardColors(theme: Theme): { card: string; line: string } | null {
  if (theme.mode === 'auto') return null
  const palette = theme.isLight ? LIGHT : DARK

  return { card: palette.card, line: palette.line }
}

export function themeFrom(value: unknown): Theme {
  const name = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (name === 'light') return { mode: 'light', isLight: true }
  if (name === 'dark') return { mode: 'dark', isLight: false }

  return AUTO
}

const varsOf = (palette: Palette): string => [
  ...NEUTRALS.map(name => `--${name}:${palette[name]}`),
  ...ROLES.flatMap(role => [`--${role}:${palette[role].fg}`, `--${role}-t:${palette[role].tint}`, `--${role}-l:${palette[role].line}`]),
].join(';')

// Dark by default; a pinned light theme, or an unpinned one on a light surface, swaps the set.
export function themeCss(): string {
  return `svg,.t-dark{${varsOf(DARK)}}.t-light{${varsOf(LIGHT)}}@media (prefers-color-scheme: light){.t-auto{${varsOf(LIGHT)}}}`
}
