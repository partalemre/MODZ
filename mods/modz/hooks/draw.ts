// The catalog pane's Svg: the head, a group's label and one row per mod, set as the hub is: no tiles, no pills, no
// dot on every healthy row. A row is the name with its version in the mono at the right, then what it does, then a
// quiet line of where it runs and where it came from. Only what is unusual is marked: a broken mod in red, a
// switched-off one dimmed with the word, an unknown state with the word.
import type { ModInfo } from './catalog'
import { textWidth } from './kit/svg-metrics'
import type { Group } from './meta'
import { entering, MOTION_CSS } from './kit/motion'
import type { Cue } from './kit/motion'
import { svgDoc } from './theme'
import type { RoleName, Theme } from './theme'
import { catalogWords, placeLine } from './words'

export type Drawing = { source: string; alt: string; height: number }

// A catalog drawing's cue as the catalog opens (motion.ts); absent, it is drawn still.
const settled = (spec: { width: number; height: number; theme: Theme; body: string; cue?: Cue }) =>
  spec.cue === undefined
    ? svgDoc(spec)
    : svgDoc({ width: spec.width, height: spec.height, theme: spec.theme, body: entering(spec.body, spec.cue), css: MOTION_CSS })

const HEAD = 44
const GROUP = 28
const ROW = 62
const TEXT_X = 16
const GAP = 6

export function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const MONO_EM = 0.6
const WEIGHT_BODY = 500

// Measured SF Pro advances (the kit's table), so a badge sits right after the name it follows.
export function measure(text: string, size: number, weight = WEIGHT_BODY): number {
  return textWidth(text, size, weight)
}

const monoMeasure = (text: string, size: number): number => [...text].length * size * MONO_EM

export function fit(text: string, width: number, font: { size: number; weight?: number }): string {
  const { size, weight = WEIGHT_BODY } = font
  if (measure(text, size, weight) <= width) return text
  const chars = [...text]
  while (chars.length > 1 && measure(`${chars.join('').trimEnd()}…`, size, weight) > width) chars.pop()

  return `${chars.join('').trimEnd()}…`
}

// A group's label: sentence case, quiet ink, its count at the right. `role` is kept for callers and draws
// nothing: a coloured label over a list is decoration.
// The head: how many mods and whether all are on, the health at the right. The pane's tab already says "Mods".
export function headSvg(spec: { width: number; theme: Theme; title: string; meta: string; metaRole: RoleName | null; cue?: Cue }): Drawing {
  const meta = spec.meta === '' ? '' : `<text x="${spec.width - TEXT_X}" y="28" text-anchor="end" style="font-size:11.5px" class="num ${spec.metaRole === null ? 'lo' : `fg-${spec.metaRole}`}">${esc(spec.meta)}</text>`
  const title = fit(spec.title, spec.width - TEXT_X * 2 - measure(spec.meta, 12) - GAP * 2, { size: 16, weight: 600 })
  const body = `<text x="${TEXT_X}" y="28" style="font-size:16px;font-weight:600" class="hi">${esc(title)}</text>${meta}`

  return { source: settled({ width: spec.width, height: HEAD, theme: spec.theme, body, cue: spec.cue }), alt: `${catalogWords().allMods}: ${spec.title}${spec.meta === '' ? '' : ` · ${spec.meta}`}`, height: HEAD }
}

export function groupSvg(spec: { width: number; theme: Theme; group: Group; count: number; cue?: Cue }): Drawing {
  const words = catalogWords()
  const label = words.groups[spec.group]
  const count = words.mods(spec.count)
  const body = `<text x="${TEXT_X}" y="${GROUP - 8}" style="font-size:11px;font-weight:600" class="lo">${esc(label)}</text><text x="${spec.width - TEXT_X}" y="${GROUP - 8}" text-anchor="end" style="font-size:11px" class="num lo">${esc(count)}</text>`

  return { source: settled({ width: spec.width, height: GROUP, theme: spec.theme, body, cue: spec.cue }), alt: `${label}: ${count}`, height: GROUP }
}

// The right edge says only what is unusual, in words: broken, off, or a state that could not be read. An on mod
// shows its version alone.
function stateWord(mod: ModInfo): { text: string; ink: string } | null {
  const words = catalogWords()
  if (!mod.isHealthy) return { text: words.brokenWord, ink: 'fg-danger' }
  if (mod.isEnabled === false) return { text: words.offWord, ink: 'lo' }

  return mod.isEnabled === null ? { text: words.stateUnknown, ink: 'lo' } : null
}

function stateLabel(mod: ModInfo): string {
  const words = catalogWords()
  if (!mod.isHealthy) return words.brokenWord
  if (mod.isEnabled === null) return words.stateUnknown

  return mod.isEnabled ? words.onWord : words.offWord
}

export function rowSvg(spec: { width: number; theme: Theme; mod: ModInfo; cue?: Cue }): Drawing {
  const { mod, width } = spec
  const right = width - TEXT_X
  // A mod that tracks commits has no version to show.
  const versionText = mod.version === null ? '' : `v${mod.version}`
  const state = stateWord(mod)
  const edge = [state?.text, versionText].filter(Boolean).join(' · ')
  const name = fit(mod.name, right - TEXT_X - monoMeasure(edge, 11.5) - GAP * 2, { size: 13, weight: 560 })
  const isQuiet = mod.isEnabled === false
  const lineRoom = right - TEXT_X
  const body = [
    `<text x="${TEXT_X}" y="21" style="font-size:13px;font-weight:560" class="${isQuiet ? 'lo' : 'hi'}">${esc(name)}</text>`,
    edge === '' ? '' : `<text x="${right}" y="21" text-anchor="end" style="font-size:11.5px" class="num ${state?.ink ?? 'lo'}">${esc(edge)}</text>`,
    `<text x="${TEXT_X}" y="39" style="font-size:12px" class="${mod.isHealthy ? (isQuiet ? 'lo' : 'mid') : 'fg-danger'}">${esc(fit(mod.description, lineRoom, { size: 12 }))}</text>`,
    `<text x="${TEXT_X}" y="55" style="font-size:11px" class="lo">${esc(fit(placeLine(mod), lineRoom, { size: 11 }))}</text>`,
  ].join('')
  const alt = `${[mod.name, versionText].filter(Boolean).join(' ')} · ${placeLine(mod)} · ${stateLabel(mod)} · ${mod.description}`

  return { source: settled({ width, height: ROW, theme: spec.theme, body, cue: spec.cue }), alt, height: ROW }
}
