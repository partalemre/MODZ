// Tidemark colors (DESIGN.md §2), the one place this mod keeps hex for Box, Text and Svg.

export type Role = 'read' | 'edit' | 'run' | 'ok' | 'warn' | 'danger' | 'plan' | 'note' | 'neutral'
export type RoleColors = { fg: string; tint: string; line: string }
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
  roles: Record<Role, RoleColors>
}

const channels = (hex: string): number[] => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))

// `t` of the way from `a` to `b`.
export function mix(a: string, b: string, t: number): string {
  const from = channels(a)
  const to = channels(b)
  return `#${from.map((v, i) => Math.round(v + ((to[i] ?? v) - v) * t).toString(16).padStart(2, '0')).join('')}`
}

const DARK_LO = '#8E8A80'
const LIGHT_LO = '#77726A'

export const DARK: Palette = {
  sheet: '#191917',
  card: '#1F1F1C',
  inset: '#171715',
  line: '#2E2E2A',
  lineStrong: '#45443F',
  track: '#34332F',
  hi: '#F0EEE8',
  mid: '#C2BEB4',
  lo: DARK_LO,
  roles: {
    read: { fg: '#7FB6E8', tint: '#1E2B37', line: '#2F4A63' },
    edit: { fg: '#E58A5F', tint: '#38251D', line: '#6A3E2D' },
    run: { fg: '#B19CF3', tint: '#29243D', line: '#4A3F75' },
    ok: { fg: '#6FC593', tint: '#1B2F25', line: '#2F5A42' },
    warn: { fg: '#E9B949', tint: '#332D19', line: '#66552A' },
    danger: { fg: '#F2727F', tint: '#3B2023', line: '#74343C' },
    plan: { fg: '#E07BC0', tint: '#351F2E', line: '#6B3A5C' },
    note: { fg: mix('#B19CF3', DARK_LO, 0.4), tint: '#25222F', line: '#3B3650' },
    neutral: { fg: DARK_LO, tint: '#2A2A27', line: '#3A3935' },
  },
}

export const LIGHT: Palette = {
  sheet: '#F4F2EC',
  card: '#FFFFFF',
  inset: '#F6F4EF',
  line: '#E4E0D6',
  lineStrong: '#CFC9BC',
  track: '#ECE8DF',
  hi: '#1C1B19',
  mid: '#4F4B44',
  lo: LIGHT_LO,
  roles: {
    read: { fg: '#2464A0', tint: '#E7F0F9', line: '#B9D3EC' },
    edit: { fg: '#A94A26', tint: '#FBEDE6', line: '#EFC6B4' },
    run: { fg: '#6243C4', tint: '#F0ECFC', line: '#CFC3F3' },
    ok: { fg: '#1F6E43', tint: '#E4F4EA', line: '#B5DEC4' },
    warn: { fg: '#8A6000', tint: '#FBF2D9', line: '#EBD48F' },
    danger: { fg: '#C0263A', tint: '#FCE8EA', line: '#F1B9C0' },
    plan: { fg: '#A8337F', tint: '#FBE9F4', line: '#EDBFDC' },
    note: { fg: mix('#6243C4', LIGHT_LO, 0.35), tint: '#F2EFFA', line: '#D9D2EE' },
    neutral: { fg: LIGHT_LO, tint: '#EFECE5', line: '#DCD7CC' },
  },
}

export const paletteOf = (isLight: boolean): Palette => (isLight ? LIGHT : DARK)

// Upstream names its shimmer tones by hue; each stands for one Tidemark role here.
export const TONE_ROLE: Record<string, Role> = {
  purple: 'read',
  blue: 'read',
  cyan: 'read',
  orange: 'edit',
  green: 'ok',
  teal: 'ok',
  iris: 'run',
  red: 'danger',
}

export const roleOfTone = (tone: string | undefined): Role => TONE_ROLE[tone ?? ''] ?? 'edit'

const SHIMMER_STEPS = [0, 0.3, 0.58, 0.85]
const LIGHT_STEPS = [0, 0.22, 0.4, 0.55]
const DIM_MIX = 0.55

// Four steps from the role color to its glint, as the Client's shimmer reads them.
export function shimmerTones(p: Palette, isLight: boolean): Record<string, { bright: string[]; dim: string[] }> {
  const steps = isLight ? LIGHT_STEPS : SHIMMER_STEPS
  const out: Record<string, { bright: string[]; dim: string[] }> = {}
  for (const [tone, role] of Object.entries(TONE_ROLE)) {
    const fg = p.roles[role].fg
    const bright = steps.map(s => mix(fg, '#FFFFFF', s))
    out[tone] = { bright, dim: bright.map(c => mix(c, p.lo, DIM_MIX)) }
  }
  return out
}

// The folder glyph: a quiet steel blue, so the read color stays a signal.
export const folderColor = (p: Palette): string => mix(p.roles.read.fg, p.lo, 0.55)

// Light, dark, or undefined when Claude's theme name says neither (`auto`).
export function lightByName(value: unknown): boolean | undefined {
  const name = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return name.includes('light') ? true : name.includes('dark') ? false : undefined
}
