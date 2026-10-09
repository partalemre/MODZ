// The Svg parts of a desktop agent row and its drawer: status and tier, progress and time,
// the current tool, and the last five calls. Each alt says in words what the drawing shows.
import { compact, elapsedText, roughText } from './format'
import { flagOf, moodOf } from './insight'
import { isLive } from './roster'
import { glyphOf } from './spans'
import { chip, esc, eyebrow, fit, measure, num, phaseDots, pill, signalBars, statusDot } from './svg-parts'
import type { DotState } from './svg-parts'
import { svgDoc } from './theme'
import type { Theme } from './theme'
import { stepOf } from './work'
import type { Drawing } from './desk-header'
import type { DeckAgent } from '../types'

type Spec = { agent: DeckAgent; nowMs: number; theme: Theme }

export const LEAD_WIDTH = 36
export const META_WIDTH = 300
const ROW = 22
const TOKENS_COL = 64
const ELAPSED_COL = 84
const COL_GAP = 12
const CALL_ROW = 24
const CALLS_HEAD = 26
const AGO_COL = 48
const TOOL_COL = 76
const MOOD_DOTS: Record<string, DotState> = { busy: 'running', stuck: 'stuck', resting: 'waiting', happy: 'done', hurt: 'failed' }
const TIERS: [RegExp, number, string][] = [[/haiku/i, 1, 'hafif'], [/sonnet/i, 2, 'orta'], [/opus|fable/i, 3, 'güçlü']]

export function tierOf(model: string | null): { level: number; word: string } {
  const found = TIERS.find(([pattern]) => pattern.test(model ?? ''))

  return found === undefined ? { level: 0, word: 'model bilinmiyor' } : { level: found[1], word: found[2] }
}

export function dotOf(agent: DeckAgent, nowMs: number): DotState {
  return MOOD_DOTS[moodOf(agent, nowMs)] ?? 'running'
}

// Status dot and three tier bars.
export function leadSvg(spec: Spec): Drawing {
  const tier = tierOf(spec.agent.model)
  const body = statusDot({ cx: 8, cy: ROW / 2, state: dotOf(spec.agent, spec.nowMs) }) + signalBars({ x: 20, baseline: 16, level: tier.level }).svg

  return { source: svgDoc({ width: LEAD_WIDTH, height: ROW, theme: spec.theme, body }), alt: `${tier.word} model`, height: ROW }
}

function progressPart(spec: Spec, right: number): { svg: string; text: string } {
  const step = stepOf(spec.agent)
  if (step !== null) {
    const text = `adım ${step.position}/${step.total}`

    return { svg: pill({ x: right, y: 1, text, role: 'run', anchor: 'end' }).svg, text }
  }
  const phase = spec.agent.phase
  if (phase === null) return { svg: '', text: '' }
  const label = { explore: 'keşif', edit: 'düzenleme', test: 'test', report: 'rapor' }[phase]
  const labelX = right - measure(label, 12)
  const dots = phaseDots({ x: labelX - 8 - 46, cy: ROW / 2, phase, isLive: isLive(spec.agent) })
  const marks = { explore: '●○○○', edit: '●●○○', test: '●●●○', report: '●●●●' }[phase]

  return { svg: `${dots.svg}<text x="${num(labelX)}" y="15" class="lb mid">${label}</text>`, text: `${marks} ${label}` }
}

// Right side of line one: progress (step pill or phase dots), elapsed, tokens.
export function metaSvg(spec: Spec): Drawing {
  const { agent, nowMs } = spec
  const elapsed = elapsedText((agent.endedAt ?? nowMs) - agent.startedAt)
  const tokens = agent.tokens > 0 ? `${compact(agent.tokens)} tok` : '—'
  const progress = progressPart(spec, META_WIDTH - TOKENS_COL - ELAPSED_COL - COL_GAP * 2)
  const body = [
    progress.svg,
    `<text x="${META_WIDTH - TOKENS_COL - COL_GAP}" y="15" text-anchor="end" class="lb num mid">${esc(elapsed)}</text>`,
    `<text x="${META_WIDTH}" y="15" text-anchor="end" class="lb num lo">${esc(tokens)}</text>`,
  ].join('')
  const alt = [progress.text, elapsed, tokens].filter(part => part !== '' && part !== '—').join(' · ')

  return { source: svgDoc({ width: META_WIDTH, height: ROW, theme: spec.theme, body }), alt, height: ROW }
}

function toolPart(agent: DeckAgent, spec: { x: number; room: number; words: string }): string {
  if (agent.tool === null || agent.status !== 'running') return `<text x="${num(spec.x)}" y="15" class="lb lo">${esc(fit(spec.words, spec.room, 12))}</text>`
  const kind = agent.calls[agent.calls.length - 1]?.kind ?? 'run'
  const mark = chip({ x: spec.x, y: 3, glyph: glyphOf(agent.tool), role: kind })
  const toolX = spec.x + mark.width + 7
  const toolWidth = measure(agent.tool, 12) + 8
  const detail = fit(agent.detail ?? '', spec.room - mark.width - toolWidth - 7, 11.5, true)

  return `${mark.svg}<text x="${num(toolX)}" y="15" class="lb mid">${esc(agent.tool)}</text><text x="${num(toolX + toolWidth)}" y="15" class="lb num lo" style="font-size:11.5px">${esc(detail)}</text>`
}

export type Activity = { words: string; stats: string }

// Line two: the step it is on, the tool it runs and on what; a flag pill and its counts on the right.
export function activitySvg(spec: Spec & { width: number; activity: Activity }): Drawing {
  const { agent, nowMs, width, activity } = spec
  const flag = flagOf(agent, nowMs)
  const statsWidth = measure(activity.stats, 12)
  const flagPill = flag === null ? null : pill({ x: width - statsWidth - (statsWidth > 0 ? 10 : 0), y: 1, text: flag.text, role: flag.color === 'error' ? 'danger' : 'warn', anchor: 'end' })
  const room = width - statsWidth - (flagPill === null ? 0 : flagPill.width + 10) - 16
  const current = stepOf(agent)?.current ?? null
  const lead = current === null ? '' : `<text x="0" y="15" class="lb hi">${esc(fit(`› ${current}`, room * 0.45, 12))}</text>`
  const toolX = current === null ? 0 : Math.min(room * 0.45, measure(`› ${current}`, 12)) + 14
  const body = [
    lead,
    isLive(agent) ? toolPart(agent, { x: toolX, room: room - toolX, words: activity.words }) : '',
    flagPill?.svg ?? '',
    `<text x="${num(width)}" y="15" text-anchor="end" class="lb lo">${esc(activity.stats)}</text>`,
  ].join('')
  const alt = [`› ${activity.words}`, flag?.text ?? '', activity.stats].filter(part => part !== '').join(' · ')

  return { source: svgDoc({ width, height: ROW, theme: spec.theme, body }), alt, height: ROW }
}

function callRow(spec: Spec & { index: number; width: number }): string {
  const call = spec.agent.calls[spec.agent.calls.length - 1 - spec.index]
  if (call === undefined) return ''
  const y = CALLS_HEAD + spec.index * CALL_ROW
  const cy = y + CALL_ROW / 2
  const mark = call.isOk === null ? statusDot({ cx: spec.width - 6, cy, state: 'running' }) : statusDot({ cx: spec.width - 6, cy, state: call.isOk ? 'done' : 'failed' })
  const detail = fit(call.detail, spec.width - AGO_COL - TOOL_COL - 48, 11.5, true)
  const rule = spec.index === 0 ? '' : `<rect x="0" y="${y}" width="${num(spec.width)}" height="1" class="f-line"/>`

  return [
    rule,
    `<text x="${AGO_COL - 8}" y="${num(cy + 4)}" text-anchor="end" class="mi num lo">${esc(roughText(spec.nowMs - call.at))}</text>`,
    chip({ x: AGO_COL, y: cy - 8, glyph: glyphOf(call.tool), role: call.kind }).svg,
    `<text x="${AGO_COL + 24}" y="${num(cy + 4)}" class="lb mid">${esc(fit(call.tool, TOOL_COL - 24, 12))}</text>`,
    `<text x="${AGO_COL + TOOL_COL + 4}" y="${num(cy + 4)}" class="lb num hi" style="font-size:11.5px">${esc(detail)}</text>`,
    mark,
  ].join('')
}

// The drawer's head: its last five calls, newest first, each with how long ago and how it came back.
export function callsSvg(spec: Spec & { width: number; meta: string }): Drawing {
  const count = spec.agent.calls.length
  const rows = Array.from({ length: count }, (_, index) => callRow({ ...spec, index })).join('')
  const empty = count === 0 ? `<text x="0" y="${CALLS_HEAD + 14}" class="lb lo">Henüz araç çağrısı yok.</text>` : ''
  const height = CALLS_HEAD + Math.max(1, count) * CALL_ROW
  const body = eyebrow({ x: 0.5, y: 12, width: spec.width - 1, label: 'Son araçlar', role: 'run', meta: spec.meta }) + rows + empty
  const alt = spec.agent.calls.map(call => `${call.tool} ${call.detail}`.trim()).reverse().join(', ')

  return { source: svgDoc({ width: spec.width, height, theme: spec.theme, body }), alt: alt === '' ? 'Henüz araç çağrısı yok' : `Son araçlar: ${alt}`, height }
}
