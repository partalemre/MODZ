// The Tidemark tokens (DESIGN.md §2) in one place: hex for Box/Text, CSS variables for every Svg.
// An Svg cannot read the theme, so each carries both palettes and picks by class or system appearance.

export type Theme = 'light' | 'dark' | 'auto'

export type RoleName = 'read' | 'edit' | 'run' | 'ok' | 'warn' | 'danger' | 'plan'

export type Role = { fg: string; tint: string; line: string }

export type Palette = {
  sheet: string
  card: string
  inset: string
  line: string
  strong: string
  track: string
  hi: string
  mid: string
  lo: string
  roles: Record<RoleName, Role>
}

export const DARK: Palette = {
  sheet: '#191917', card: '#1F1F1C', inset: '#171715', line: '#2E2E2A', strong: '#45443F', track: '#34332F',
  hi: '#F0EEE8', mid: '#C2BEB4', lo: '#8E8A80',
  roles: {
    read: { fg: '#7FB6E8', tint: '#1E2B37', line: '#2F4A63' },
    edit: { fg: '#E58A5F', tint: '#38251D', line: '#6A3E2D' },
    run: { fg: '#B19CF3', tint: '#29243D', line: '#4A3F75' },
    ok: { fg: '#6FC593', tint: '#1B2F25', line: '#2F5A42' },
    warn: { fg: '#E9B949', tint: '#332D19', line: '#66552A' },
    danger: { fg: '#F2727F', tint: '#3B2023', line: '#74343C' },
    plan: { fg: '#E07BC0', tint: '#351F2E', line: '#6B3A5C' },
  },
}

export const LIGHT: Palette = {
  sheet: '#F4F2EC', card: '#FFFFFF', inset: '#F6F4EF', line: '#E4E0D6', strong: '#CFC9BC', track: '#ECE8DF',
  hi: '#1C1B19', mid: '#4F4B44', lo: '#77726A',
  roles: {
    read: { fg: '#2464A0', tint: '#E7F0F9', line: '#B9D3EC' },
    edit: { fg: '#A94A26', tint: '#FBEDE6', line: '#EFC6B4' },
    run: { fg: '#6243C4', tint: '#F0ECFC', line: '#CFC3F3' },
    ok: { fg: '#1F6E43', tint: '#E4F4EA', line: '#B5DEC4' },
    warn: { fg: '#8A6000', tint: '#FBF2D9', line: '#EBD48F' },
    danger: { fg: '#C0263A', tint: '#FCE8EA', line: '#F1B9C0' },
    plan: { fg: '#A8337F', tint: '#FBE9F4', line: '#EDBFDC' },
  },
}

export const ROLE_NAMES: RoleName[] = ['read', 'edit', 'run', 'ok', 'warn', 'danger', 'plan']

export const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`
export const MONO = `ui-monospace, 'SF Mono', Menlo, monospace`

function varsOf(palette: Palette): string {
  const base = ['sheet', 'card', 'inset', 'line', 'strong', 'track', 'hi', 'mid', 'lo'] as const
  const neutral = base.map(key => `--${key}:${palette[key]}`)
  const roles = ROLE_NAMES.flatMap(name => {
    const role = palette.roles[name]

    return [`--${name}:${role.fg}`, `--${name}-t:${role.tint}`, `--${name}-l:${role.line}`]
  })

  return [...neutral, ...roles].join(';')
}

function roleClasses(): string {
  return ROLE_NAMES.map(name => `.fg-${name}{fill:var(--${name})}.bg-${name}{fill:var(--${name}-t)}.st-${name}{stroke:var(--${name})}.ln-${name}{stroke:var(--${name}-l)}`).join('')
}

const TYPE_CSS = [
  `text{font-family:${FONT}}`,
  `.num{font-family:${MONO};font-variant-numeric:tabular-nums}`,
  '.hi{fill:var(--hi)}.mid{fill:var(--mid)}.lo{fill:var(--lo)}',
  '.eb{font-size:10.5px;font-weight:700;letter-spacing:.1em}',
  '.hl{font-size:17px;font-weight:620}.ti{font-size:13px;font-weight:600}',
  '.lb{font-size:12px;font-weight:500}.mi{font-size:10.5px;font-weight:500}.dp{font-size:24px;font-weight:650}',
  '.card{fill:var(--card)}.inset{fill:var(--inset)}.track{fill:var(--track)}.line{stroke:var(--line)}.strong{stroke:var(--strong)}',
  '.f-line{fill:var(--line)}.f-strong{fill:var(--strong)}.f-mid{fill:var(--mid)}',
].join('')

// Breathing marks a live thing; DESIGN.md §5 allows one loop per surface, and it settles when work stops.
const MOTION_CSS = '.breathe{animation:breathe 1.8s ease-in-out infinite}@keyframes breathe{50%{opacity:.45}}'
const REDUCED = '@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}'

export function styleOf(): string {
  const dark = varsOf(DARK)

  return `<style>svg{${varsOf(LIGHT)}}svg.t-dark{${dark}}@media (prefers-color-scheme: dark){svg.t-auto{${dark}}}${TYPE_CSS}${roleClasses()}${MOTION_CSS}${REDUCED}</style>`
}

export type SvgDoc = { width: number; height: number; theme: Theme; body: string }

export function svgDoc(doc: SvgDoc): string {
  const width = Math.round(doc.width)

  return `<svg xmlns="http://www.w3.org/2000/svg" class="t-${doc.theme}" width="${width}" height="${doc.height}" viewBox="0 0 ${width} ${doc.height}">${styleOf()}${doc.body}</svg>`
}
