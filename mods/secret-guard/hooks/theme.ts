// MODZ "Tidemark" tokens (DESIGN.md §2), one copy per mod until the shared kit lands.
// Svg picks its palette with prefers-color-scheme; Box and Text take hex from `palette(isLight)`.

export type Neutrals = { sheet: string; card: string; inset: string; line: string; lineStrong: string; track: string; hi: string; mid: string; lo: string }
export type Role = { fg: string; tint: string; line: string }
export type RoleName = 'read' | 'edit' | 'run' | 'ok' | 'warn' | 'danger' | 'plan'

const DARK: Neutrals = { sheet: '#191917', card: '#1F1F1C', inset: '#171715', line: '#2E2E2A', lineStrong: '#45443F', track: '#34332F', hi: '#F0EEE8', mid: '#C2BEB4', lo: '#8E8A80' }
const LIGHT: Neutrals = { sheet: '#F4F2EC', card: '#FFFFFF', inset: '#F6F4EF', line: '#E4E0D6', lineStrong: '#CFC9BC', track: '#ECE8DF', hi: '#1C1B19', mid: '#4F4B44', lo: '#77726A' }

const ROLES: Record<RoleName, { dark: Role; light: Role }> = {
  read: { dark: { fg: '#7FB6E8', tint: '#1E2B37', line: '#2F4A63' }, light: { fg: '#2464A0', tint: '#E7F0F9', line: '#B9D3EC' } },
  edit: { dark: { fg: '#E58A5F', tint: '#38251D', line: '#6A3E2D' }, light: { fg: '#A94A26', tint: '#FBEDE6', line: '#EFC6B4' } },
  run: { dark: { fg: '#B19CF3', tint: '#29243D', line: '#4A3F75' }, light: { fg: '#6243C4', tint: '#F0ECFC', line: '#CFC3F3' } },
  ok: { dark: { fg: '#6FC593', tint: '#1B2F25', line: '#2F5A42' }, light: { fg: '#1F6E43', tint: '#E4F4EA', line: '#B5DEC4' } },
  warn: { dark: { fg: '#E9B949', tint: '#332D19', line: '#66552A' }, light: { fg: '#8A6000', tint: '#FBF2D9', line: '#EBD48F' } },
  danger: { dark: { fg: '#F2727F', tint: '#3B2023', line: '#74343C' }, light: { fg: '#C0263A', tint: '#FCE8EA', line: '#F1B9C0' } },
  plan: { dark: { fg: '#E07BC0', tint: '#351F2E', line: '#6B3A5C' }, light: { fg: '#A8337F', tint: '#FBE9F4', line: '#EDBFDC' } },
}

// Terminal theme keys per role (DESIGN.md §2, terminal mapping).
export const TERMINAL_KEY: Record<RoleName, string> = {
  read: 'suggestion', edit: 'claude', run: 'permission', ok: 'success', warn: 'warning', danger: 'error', plan: 'merged',
}

export const palette = (isLight: boolean): Neutrals => (isLight ? LIGHT : DARK)
export const role = (name: RoleName, isLight: boolean): Role => ROLES[name][isLight ? 'light' : 'dark']

export const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`
export const MONO = `ui-monospace, 'SF Mono', Menlo, Consolas, monospace`

function vars(isLight: boolean): string {
  const n = palette(isLight)
  const roles = (Object.keys(ROLES) as RoleName[]).map(name => {
    const r = role(name, isLight)

    return `--${name}:${r.fg};--${name}-tint:${r.tint};--${name}-line:${r.line}`
  })

  return `--card:${n.card};--inset:${n.inset};--line:${n.line};--line-strong:${n.lineStrong};--track:${n.track};--hi:${n.hi};--mid:${n.mid};--lo:${n.lo};${roles.join(';')}`
}

// The <style> every Svg opens with: both palettes as custom properties, light first.
export function svgStyle(extra = ''): string {
  return [
    `<style>svg{${vars(true)}}`,
    `@media (prefers-color-scheme: dark){svg{${vars(false)}}}`,
    `text{font-family:${FONT}}.mono{font-family:${MONO}}.num{font-variant-numeric:tabular-nums}`,
    extra,
    '@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}</style>',
  ].join('')
}

// ---- Light or dark, for Box and Text (skins' resolveLight) ----------------

const named = (value: unknown): boolean | undefined => {
  const name = typeof value === 'string' ? value.trim().toLowerCase() : ''

  return name.includes('light') ? true : name.includes('dark') ? false : undefined
}

// `COLORFGBG` is `<fg>;<bg>`; background 7 or 15 is a light one.
const terminalLight = (colorfgbg: string | undefined): boolean | undefined => {
  const bg = Number(colorfgbg?.split(';').at(-1))

  return colorfgbg === undefined || Number.isNaN(bg) ? undefined : bg === 7 || bg === 15
}

export type ThemeHints = { override?: string; theme?: unknown; colorfgbg?: string; systemDark?: boolean }

// `MODZ_THEME` wins, then Claude's theme setting, then the terminal, then the system. Dark when nothing says.
export const resolveLight = (hints: ThemeHints): boolean =>
  named(hints.override) ?? named(hints.theme) ?? terminalLight(hints.colorfgbg) ?? (hints.systemDark === undefined ? false : !hints.systemDark)
