// Tidemark tokens (DESIGN.md §2), one copy per mod until the shared kit lands: hooks/ui is the same in every mod.

export type Theme = 'light' | 'dark' | 'auto'

type Tone = { fg: string; tint: string; line: string }
type Base = { sheet: string; card: string; inset: string; line: string; lineStrong: string; track: string; hi: string; mid: string; lo: string }

const DARK: Base = {
  sheet: '#191917', card: '#1F1F1C', inset: '#171715', line: '#2E2E2A', lineStrong: '#45443F',
  track: '#34332F', hi: '#F0EEE8', mid: '#C2BEB4', lo: '#8E8A80',
}
const LIGHT: Base = {
  sheet: '#F4F2EC', card: '#FFFFFF', inset: '#F6F4EF', line: '#E4E0D6', lineStrong: '#CFC9BC',
  track: '#ECE8DF', hi: '#1C1B19', mid: '#4F4B44', lo: '#77726A',
}

const ROLES = {
  run: { dark: { fg: '#B19CF3', tint: '#29243D', line: '#4A3F75' }, light: { fg: '#6243C4', tint: '#F0ECFC', line: '#CFC3F3' } },
  ok: { dark: { fg: '#6FC593', tint: '#1B2F25', line: '#2F5A42' }, light: { fg: '#1F6E43', tint: '#E4F4EA', line: '#B5DEC4' } },
  danger: { dark: { fg: '#F2727F', tint: '#3B2023', line: '#74343C' }, light: { fg: '#C0263A', tint: '#FCE8EA', line: '#F1B9C0' } },
  plan: { dark: { fg: '#E07BC0', tint: '#351F2E', line: '#6B3A5C' }, light: { fg: '#A8337F', tint: '#FBE9F4', line: '#EDBFDC' } },
} satisfies Record<string, { dark: Tone; light: Tone }>

// The number on a filled plan circle: dark ink on the light Orchid of the dark theme, white on the deep one.
const ON_PLAN = { dark: '#2A0F21', light: '#FFFFFF' }

export type Palette = Base & { plan: Tone; ok: Tone; danger: Tone; run: Tone; onPlan: string }

export function palette(isLight: boolean): Palette {
  const mode = isLight ? 'light' : 'dark'

  return {
    ...(isLight ? LIGHT : DARK),
    plan: ROLES.plan[mode], ok: ROLES.ok[mode], danger: ROLES.danger[mode], run: ROLES.run[mode], onPlan: ON_PLAN[mode],
  }
}

// Claude Code's theme names say light or dark (`light-daltonized`, `dark-ansi`); anything else follows the system.
export function themeOf(value: unknown): Theme {
  const name = typeof value === 'string' ? value.toLowerCase() : ''
  if (name.includes('light')) return 'light'

  return name.includes('dark') ? 'dark' : 'auto'
}

function vars(p: Palette): string {
  const tones = (['plan', 'ok', 'danger', 'run'] as const).map(role => `--${role}:${p[role].fg};--${role}-t:${p[role].tint};--${role}-l:${p[role].line}`)

  return [
    `--sheet:${p.sheet};--card:${p.card};--inset:${p.inset};--line:${p.line};--line2:${p.lineStrong};--track:${p.track}`,
    `--hi:${p.hi};--mid:${p.mid};--lo:${p.lo};--on-plan:${p.onPlan}`,
    ...tones,
  ].join(';')
}

const FONT = `-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif`
export const MONO_FONT = `ui-monospace,"SF Mono",Menlo,Consolas,monospace`

const TYPE = [
  `text{font-family:${FONT};font-variant-numeric:tabular-nums}`,
  `.mono{font-family:${MONO_FONT}}`,
  '.eyebrow{font-size:10.5px;font-weight:700;letter-spacing:.1em}',
  '.headline{font-size:17px;font-weight:620}',
  '.title{font-size:13.5px;font-weight:600}',
  '.label{font-size:12px;font-weight:500}',
  '.micro{font-size:10.5px;font-weight:500}',
  '.hi{fill:var(--hi)}.mid{fill:var(--mid)}.lo{fill:var(--lo)}',
  '.f-plan{fill:var(--plan)}.f-ok{fill:var(--ok)}.f-danger{fill:var(--danger)}.f-run{fill:var(--run)}',
].join('')

const CALM = '@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}'

// Dark by default, light when the theme says so, and the system's choice for `auto`.
export function svgStyle(extra = ''): string {
  const dark = vars(palette(false))
  const light = vars(palette(true))

  return `<style>svg{${dark}}svg.t-light{${light}}@media (prefers-color-scheme: light){svg.t-auto{${light}}}${TYPE}${extra}${CALM}</style>`
}

export function svgDoc(size: { width: number; height: number; theme: Theme }, body: string, extraCss = ''): string {
  const { width, height, theme } = size

  return `<svg xmlns="http://www.w3.org/2000/svg" class="t-${theme}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svgStyle(extraCss)}${body}</svg>`
}
