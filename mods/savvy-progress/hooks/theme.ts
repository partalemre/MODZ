import { CRAB_CSS } from './crabs'

// Tidemark (DESIGN.md §2): every colour the drawings use, light first and dark under the media
// query, in one place. Drawings name classes, never hex, so both themes read right.

export const FONT = "-apple-system,BlinkMacSystemFont,'SF Pro Text',Inter,system-ui,sans-serif"
export const MONO = "ui-monospace,'SF Mono',Menlo,monospace"

type Pair = readonly [light: string, dark: string]

const NEUTRALS: Record<string, Pair> = {
  t: ['#1C1B19', '#F0EEE8'],
  s: ['#4F4B44', '#C2BEB4'],
  m: ['#706B63', '#8E8A80'],
  k: ['#ECE8DF', '#34332F'],
  card: ['#FFFFFF', '#1F1F1C'],
  chip: ['#F6F4EF', '#171715'],
}

const STROKES: Record<string, Pair> = {
  ln: ['#E4E0D6', '#2E2E2A'],
  'i-m': ['#706B63', '#8E8A80'],
  'i-s': ['#4F4B44', '#C2BEB4'],
  rk: ['#ECE8DF', '#34332F'],
}

// Role colours: `f-<role>` the fill (fg), `b-<role>` its tint, `l-<role>` its line as a stroke,
// `i-<role>` the fg as a stroke for line icons.
const ROLES: Record<string, { fg: Pair; tint: Pair; line: Pair }> = {
  read: { fg: ['#2464A0', '#7FB6E8'], tint: ['#E7F0F9', '#1E2B37'], line: ['#B9D3EC', '#2F4A63'] },
  edit: { fg: ['#A94A26', '#E58A5F'], tint: ['#FBEDE6', '#38251D'], line: ['#EFC6B4', '#6A3E2D'] },
  plan: { fg: ['#A8337F', '#E07BC0'], tint: ['#FBE9F4', '#351F2E'], line: ['#EDBFDC', '#6B3A5C'] },
  run: { fg: ['#6243C4', '#B19CF3'], tint: ['#F0ECFC', '#29243D'], line: ['#CFC3F3', '#4A3F75'] },
  ok: { fg: ['#1F6E43', '#6FC593'], tint: ['#E4F4EA', '#1B2F25'], line: ['#B5DEC4', '#2F5A42'] },
  warn: { fg: ['#8A6000', '#E9B949'], tint: ['#FBF2D9', '#332D19'], line: ['#EBD48F', '#66552A'] },
  danger: { fg: ['#C0263A', '#F2727F'], tint: ['#FCE8EA', '#3B2023'], line: ['#F1B9C0', '#74343C'] },
}

const rulesOf = (side: 0 | 1): string => {
  const fills = Object.entries(NEUTRALS).map(([cls, pair]) => `.${cls}{fill:${pair[side]}}`)
  const strokes = Object.entries(STROKES).map(([cls, pair]) => `.${cls}{stroke:${pair[side]}}`)
  const roles = Object.entries(ROLES).map(([role, c]) => `.f-${role}{fill:${c.fg[side]}}.b-${role}{fill:${c.tint[side]}}.l-${role}{stroke:${c.line[side]}}.i-${role}{stroke:${c.fg[side]}}`)
  return [...fills, ...strokes, ...roles].join('')
}

export const TIDEMARK_CSS = `<style>
${rulesOf(0)}
@media (prefers-color-scheme: dark){${rulesOf(1)}}
.live{animation:p 1.8s ease-in-out infinite}@keyframes p{50%{opacity:.35}}
.chev{transition:transform .16s cubic-bezier(.2,.8,.2,1)}svg:hover .chev{transform:translateX(2px)}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
</style>`

export const paneSvg = (W: number, H: number, body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${TIDEMARK_CSS}${CRAB_CSS}${body}</svg>`
