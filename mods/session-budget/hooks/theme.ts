// Tidemark tokens (DESIGN.md §2): every color this mod draws lives here, so the shared kit can
// replace this file later. Svg gets both palettes through prefers-color-scheme; the terminal
// gets theme keys, which follow the person's own theme.

type Pair = { readonly dark: string; readonly light: string }
type RoleColors = { readonly fg: Pair; readonly tint: Pair; readonly line: Pair }

export type Role = 'read' | 'edit' | 'run' | 'ok' | 'warn' | 'danger' | 'plan'

const NEUTRALS = {
  sheet: { dark: '#191917', light: '#F4F2EC' },
  card: { dark: '#1F1F1C', light: '#FFFFFF' },
  inset: { dark: '#171715', light: '#F6F4EF' },
  line: { dark: '#2E2E2A', light: '#E4E0D6' },
  strong: { dark: '#45443F', light: '#CFC9BC' },
  track: { dark: '#34332F', light: '#ECE8DF' },
  hi: { dark: '#F0EEE8', light: '#1C1B19' },
  mid: { dark: '#C2BEB4', light: '#4F4B44' },
  lo: { dark: '#8E8A80', light: '#77726A' },
} as const satisfies Record<string, Pair>

const role = (fg: [string, string], tint: [string, string], line: [string, string]): RoleColors => ({
  fg: { dark: fg[0], light: fg[1] },
  tint: { dark: tint[0], light: tint[1] },
  line: { dark: line[0], light: line[1] },
})

const ROLES: Readonly<Record<Role, RoleColors>> = {
  read: role(['#7FB6E8', '#2464A0'], ['#1E2B37', '#E7F0F9'], ['#2F4A63', '#B9D3EC']),
  edit: role(['#E58A5F', '#A94A26'], ['#38251D', '#FBEDE6'], ['#6A3E2D', '#EFC6B4']),
  run: role(['#B19CF3', '#6243C4'], ['#29243D', '#F0ECFC'], ['#4A3F75', '#CFC3F3']),
  ok: role(['#6FC593', '#1F6E43'], ['#1B2F25', '#E4F4EA'], ['#2F5A42', '#B5DEC4']),
  warn: role(['#E9B949', '#8A6000'], ['#332D19', '#FBF2D9'], ['#66552A', '#EBD48F']),
  danger: role(['#F2727F', '#C0263A'], ['#3B2023', '#FCE8EA'], ['#74343C', '#F1B9C0']),
  plan: role(['#E07BC0', '#A8337F'], ['#351F2E', '#FBE9F4'], ['#6B3A5C', '#EDBFDC']),
}

export const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`
export const MONO = `ui-monospace, 'SF Mono', Menlo, monospace`

type Scheme = keyof Pair

// One class per use: `f-` fill, `s-` stroke; neutrals by name, roles as `<role>`, `<role>-t`, `<role>-l`.
function rules(scheme: Scheme): string {
  const neutral = Object.entries(NEUTRALS).map(([name, pair]) => `.f-${name}{fill:${pair[scheme]}}.s-${name}{stroke:${pair[scheme]}}`)
  const roles = Object.entries(ROLES).map(([name, colors]) =>
    [
      `.f-${name}{fill:${colors.fg[scheme]}}.s-${name}{stroke:${colors.fg[scheme]}}`,
      `.f-${name}-t{fill:${colors.tint[scheme]}}.s-${name}-l{stroke:${colors.line[scheme]}}`,
    ].join(''),
  )

  return [...neutral, ...roles].join('')
}

// The style block every Svg of this mod opens with: dark by default, light where the page is.
export function svgStyle(extra = ''): string {
  return [
    '<style>',
    `text{font-family:${FONT}}.num{font-family:${MONO};font-variant-numeric:tabular-nums}`,
    rules('dark'),
    `@media (prefers-color-scheme: light){${rules('light')}}`,
    extra,
    '@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}',
    '</style>',
  ].join('')
}
