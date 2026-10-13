// MODZ kit (Tidemark) — source of truth is kit/ in the MODZ repo; bin/kit-sync copies it
// into each mod's hooks/kit/. Edit there, never in a copy. Pure: no `$`, no state.

// ---------------------------------------------------------------------------
// Palettes: DESIGN.md §2, both themes, exactly.

export const ROLES = ['read', 'edit', 'run', 'ok', 'warn', 'danger', 'plan'] as const
export type Role = (typeof ROLES)[number]
export type RoleColors = { fg: string; tint: string; line: string }

export type Neutrals = {
  sheet: string
  card: string
  inset: string
  line: string
  lineStrong: string
  track: string
  hi: string
  mid: string
  lo: string
}

export type Palette = Neutrals & { roles: Record<Role, RoleColors> }

const role = (fg: string, tint: string, line: string): RoleColors => ({ fg, tint, line })

export const DARK: Palette = {
  sheet: '#191917',
  card: '#1F1F1C',
  inset: '#171715',
  line: '#2E2E2A',
  lineStrong: '#45443F',
  track: '#34332F',
  hi: '#F0EEE8',
  mid: '#C2BEB4',
  lo: '#8E8A80',
  roles: {
    read: role('#7FB6E8', '#1E2B37', '#2F4A63'),
    edit: role('#E58A5F', '#38251D', '#6A3E2D'),
    run: role('#B19CF3', '#29243D', '#4A3F75'),
    ok: role('#6FC593', '#1B2F25', '#2F5A42'),
    warn: role('#E9B949', '#332D19', '#66552A'),
    danger: role('#F2727F', '#3B2023', '#74343C'),
    plan: role('#E07BC0', '#351F2E', '#6B3A5C'),
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
  lo: '#77726A',
  roles: {
    read: role('#2464A0', '#E7F0F9', '#B9D3EC'),
    edit: role('#A94A26', '#FBEDE6', '#EFC6B4'),
    run: role('#6243C4', '#F0ECFC', '#CFC3F3'),
    ok: role('#1F6E43', '#E4F4EA', '#B5DEC4'),
    warn: role('#8A6000', '#FBF2D9', '#EBD48F'),
    danger: role('#C0263A', '#FCE8EA', '#F1B9C0'),
    plan: role('#A8337F', '#FBE9F4', '#EDBFDC'),
  },
}

export const palette = (isLight: boolean): Palette => (isLight ? LIGHT : DARK)

// ---------------------------------------------------------------------------
// File-type badges: soft, one colour per kind; the activity colour (read/edit) wins on a row.

export type FileKind = 'code' | 'py' | 'doc' | 'data' | 'pdf' | 'img' | 'misc'
export type BadgeColors = { fg: string; tint: string }

const KIND_ROLE: Record<FileKind, Role | null> = {
  code: 'warn',
  py: 'read',
  doc: null,
  data: 'ok',
  pdf: 'danger',
  img: 'plan',
  misc: null,
}

// Kinds with no role of their own: md/txt are a pale Iris, sh/git and the unknown are text.lo.
// Light misc uses text.mid on track: text.lo misses 4.5:1 on every light tint.
const OWN_BADGES: Record<'doc' | 'misc', { dark: BadgeColors; light: BadgeColors }> = {
  doc: { dark: { fg: '#B8AADA', tint: '#252230' }, light: { fg: '#5A4691', tint: '#F6F4FD' } },
  misc: { dark: { fg: DARK.lo, tint: DARK.inset }, light: { fg: LIGHT.mid, tint: LIGHT.track } },
}

const EXT_KIND: Record<string, FileKind> = {
  ts: 'code', tsx: 'code', js: 'code', jsx: 'code', mjs: 'code', cjs: 'code', mts: 'code', cts: 'code',
  py: 'py', pyi: 'py',
  md: 'doc', mdx: 'doc', txt: 'doc', rst: 'doc',
  json: 'data', csv: 'data', yaml: 'data', yml: 'data', toml: 'data', xml: 'data',
  pdf: 'pdf',
  png: 'img', jpg: 'img', jpeg: 'img', gif: 'img', svg: 'img', webp: 'img', ico: 'img',
}

const EXT_LABEL: Record<string, string> = { json: '{}', yaml: 'YML', jpeg: 'JPG' }
const BADGE_CHARS = 3

export type FileType = { kind: FileKind; label: string }

// `src/api/client.ts` → code "TS"; `.gitignore` → misc "GIT"; `Makefile` → misc "MAK".
export function fileType(name: string): FileType {
  const base = name.split('/').pop() ?? name
  const dot = base.lastIndexOf('.')
  const ext = (dot >= 0 ? base.slice(dot + 1) : base).toLowerCase()
  const isGit = base.toLowerCase().startsWith('.git')
  const kind = isGit ? 'misc' : EXT_KIND[ext] ?? 'misc'
  const label = isGit ? 'GIT' : EXT_LABEL[ext] ?? ext.slice(0, BADGE_CHARS).toUpperCase()

  return { kind, label: label || '·' }
}

export function badgeColors(kind: FileKind, isLight: boolean): BadgeColors {
  const owner = KIND_ROLE[kind]

  if (owner !== null) {
    const { fg, tint } = palette(isLight).roles[owner]
    return { fg, tint }
  }

  return OWN_BADGES[kind === 'doc' ? 'doc' : 'misc'][isLight ? 'light' : 'dark']
}

// The CSS variable names a badge paints with inside an Svg (see svgStyle).
export function badgePaints(kind: FileKind): { fg: string; tint: string } {
  const owner = KIND_ROLE[kind]
  const name = owner ?? `file-${kind === 'doc' ? 'doc' : 'misc'}`

  return { fg: name, tint: `${name}-tint` }
}

// ---------------------------------------------------------------------------
// Terminal: theme keys, never hex (DESIGN.md §2). Meta text is `dimColor`, not a key.

export type ThemeKey = 'suggestion' | 'claude' | 'permission' | 'success' | 'warning' | 'error' | 'merged' | 'subtle'

export const ROLE_KEY: Record<Role, ThemeKey> = {
  read: 'suggestion',
  edit: 'claude',
  run: 'permission',
  ok: 'success',
  warn: 'warning',
  danger: 'error',
  plan: 'merged',
}

export const LINE_KEY: ThemeKey = 'subtle'

// ---------------------------------------------------------------------------
// Motion (DESIGN.md §5).

export const MOTION = {
  quickMs: 120,
  stateMs: 200,
  travelMs: 320,
  ease: 'cubic-bezier(.2,.8,.2,1)',
  breatheS: 1.8,
  shimmerS: 1.4,
  breatheLow: 0.45,
} as const

// ---------------------------------------------------------------------------
// Svg style: every colour as a CSS variable for both schemes, a fill (`f-*`) and stroke
// (`s-*`) class per variable, the two loops, and the reduced-motion rule last.

const kebab = (name: string): string => name.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)

export function paintVars(isLight: boolean): Record<string, string> {
  const p = palette(isLight)
  const vars: Record<string, string> = {}
  const { roles, ...neutrals } = p

  for (const [name, hex] of Object.entries(neutrals)) vars[kebab(name)] = hex
  for (const name of ROLES) {
    vars[name] = roles[name].fg
    vars[`${name}-tint`] = roles[name].tint
    vars[`${name}-line`] = roles[name].line
  }
  for (const kind of ['doc', 'misc'] as const) {
    const own = OWN_BADGES[kind][isLight ? 'light' : 'dark']
    vars[`file-${kind}`] = own.fg
    vars[`file-${kind}-tint`] = own.tint
  }

  return vars
}

export const PAINTS = Object.keys(paintVars(false))

const LOOPS: Record<string, string> = {
  breathe: `@keyframes breathe{50%{opacity:${MOTION.breatheLow}}}.breathe{animation:breathe ${MOTION.breatheS}s ease-in-out infinite}`,
  shimmer: `@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}.shimmer{animation:shimmer ${MOTION.shimmerS}s linear infinite}`,
}

export const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, 'Segoe UI', system-ui, sans-serif`
export const MONO = `ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace`

const REDUCED = '@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}'

const varBlock = (vars: Record<string, string>, names: readonly string[]): string =>
  `svg{${names.map(name => `--${name}:${vars[name]}`).join(';')}}`

// The <style> body for an Svg. Given the markup it styles, only the paints it names are
// written, so a small pill does not carry the whole palette.
export function svgStyle(body?: string): string {
  const used = body === undefined ? PAINTS : PAINTS.filter(name => new RegExp(`[fs]-${name}\\b(?!-)`).test(body))
  const rules = used.map(name => `.f-${name}{fill:var(--${name})}.s-${name}{stroke:var(--${name})}`).join('')
  const loops = Object.keys(LOOPS)
    .filter(name => body === undefined || body.includes(name))
    .map(name => LOOPS[name])
    .join('')

  return [
    varBlock(paintVars(false), used),
    `@media (prefers-color-scheme: light){${varBlock(paintVars(true), used)}}`,
    `text{font-family:${FONT}}.mono{font-family:${MONO};font-variant-numeric:tabular-nums}`,
    rules,
    loops,
    REDUCED,
  ].join('')
}

// ---------------------------------------------------------------------------
// Light or dark, for Box/Text hex. Adapted from skins' light.ts (mods/skins/hooks/light.ts,
// MODZ): an override (`MODZ_THEME`) wins, then a theme name that says light or dark, then
// for `auto` the terminal's COLORFGBG, then the system's appearance. Dark when nothing says.

export type ThemeHints = {
  override?: string
  theme?: unknown
  colorfgbg?: string
  systemDark?: boolean
}

const LIGHT_ANSI_BACKGROUNDS = [7, 15]

const named = (value: unknown): boolean | undefined => {
  const name = typeof value === 'string' ? value.trim().toLowerCase() : ''

  if (name.includes('light')) return true

  return name.includes('dark') ? false : undefined
}

const terminalLight = (colorfgbg: string | undefined): boolean | undefined => {
  const background = Number(colorfgbg?.split(';').at(-1))

  return colorfgbg === undefined || Number.isNaN(background) ? undefined : LIGHT_ANSI_BACKGROUNDS.includes(background)
}

export const resolveLight = (hints: ThemeHints): boolean =>
  named(hints.override) ??
  named(hints.theme) ??
  terminalLight(hints.colorfgbg) ??
  (hints.systemDark === undefined ? false : !hints.systemDark)
