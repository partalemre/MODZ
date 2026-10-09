import { elapsedText, isFailed, isRunning, shortText } from './roster'
import type { DeckAgent } from '../types'

export type TimelineInput = {
  width: number
  agents: DeckAgent[]
  nowMs: number
  selected: string | null
  theme: 'light' | 'dark' | 'auto'
}

const LANE_HEIGHT = 22
const LANES_MAX = 7
const LABEL_WIDTH = 124
const VALUE_WIDTH = 64
const BAR_HEIGHT = 8
const BAR_RADIUS = 4
const MIN_BAR = 7
const MIN_SPAN_MS = 20_000
const LABEL_MAX = 17
const SHINE_WIDTH = 46
const SHINE_SECONDS = 1.5
const DONE_COLOR = '#38bdf8'
const FAILED_COLOR = '#f87171'
const RUN_FROM = '#34d399'
const RUN_TO = '#22d3ee'

function num(value: number): string {
  return value.toFixed(1)
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function styleBlock(): string {
  return `<style>
svg{--muted:#64748b;--strong:#0f172a;--track:rgba(100,116,139,.16);--sel:rgba(56,189,248,.12)}
svg.t-dark{--muted:#94a3b8;--strong:#e2e8f0;--track:rgba(148,163,184,.16);--sel:rgba(56,189,248,.16)}
@media (prefers-color-scheme: dark){svg.t-auto{--muted:#94a3b8;--strong:#e2e8f0;--track:rgba(148,163,184,.16);--sel:rgba(56,189,248,.16)}}
text{font-family:ui-sans-serif,system-ui,-apple-system,"SF Pro Text","Segoe UI",sans-serif;font-variant-numeric:tabular-nums}
.name{font-size:11.5px;font-weight:600;fill:var(--strong)}
.val{font-size:11px;fill:var(--muted)}
.now{font-size:9.5px;font-weight:650;letter-spacing:.08em;fill:var(--muted)}
.track{fill:var(--track)}
.sel{fill:var(--sel)}
</style>`
}

function defsBlock(): string {
  return `<defs><linearGradient id="run"><stop offset="0" stop-color="${RUN_FROM}"/><stop offset="1" stop-color="${RUN_TO}"/></linearGradient><linearGradient id="shine"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`
}

function barFill(agent: DeckAgent): string {
  if (isRunning(agent)) return 'url(#run)'

  return isFailed(agent) ? FAILED_COLOR : DONE_COLOR
}

function laneBlock(spec: { agent: DeckAgent; index: number; input: TimelineInput; t0: number; span: number }): string {
  const { agent, index, input, t0, span } = spec
  const barRegion = input.width - LABEL_WIDTH - VALUE_WIDTH
  const y = index * LANE_HEIGHT
  const mid = y + LANE_HEIGHT / 2
  const end = agent.endedAt ?? input.nowMs
  const x = LABEL_WIDTH + ((agent.startedAt - t0) / span) * barRegion
  const width = Math.max(MIN_BAR, ((end - agent.startedAt) / span) * barRegion)
  const barY = mid - BAR_HEIGHT / 2
  const selected = agent.id === input.selected ? `<rect class="sel" x="0" y="${y}" width="${num(input.width)}" height="${LANE_HEIGHT}" rx="6"/>` : ''
  const opacity = isRunning(agent) ? 1 : 0.85
  const bar = `<rect x="${num(x)}" y="${num(barY)}" width="${num(width)}" height="${BAR_HEIGHT}" rx="${BAR_RADIUS}" fill="${barFill(agent)}" opacity="${opacity}"/>`
  const live = isRunning(agent)
    ? `<clipPath id="c${index}"><rect x="${num(x)}" y="${num(barY)}" width="${num(width)}" height="${BAR_HEIGHT}" rx="${BAR_RADIUS}"/></clipPath><rect x="${num(x - SHINE_WIDTH)}" y="${num(barY)}" width="${SHINE_WIDTH}" height="${BAR_HEIGHT}" fill="url(#shine)" clip-path="url(#c${index})"><animate attributeName="x" from="${num(x - SHINE_WIDTH)}" to="${num(x + width)}" dur="${SHINE_SECONDS}s" begin="${(index * 0.2).toFixed(1)}s" repeatCount="indefinite"/></rect><circle cx="${num(x + width)}" cy="${num(mid)}" r="3" fill="${RUN_TO}"><animate attributeName="r" values="3;7;3" dur="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.2;1" dur="1.4s" repeatCount="indefinite"/></circle>`
    : ''
  const value = elapsedText(end - agent.startedAt)

  return `<g>${selected}<rect class="track" x="${LABEL_WIDTH}" y="${num(barY)}" width="${num(barRegion)}" height="${BAR_HEIGHT}" rx="${BAR_RADIUS}"/>${bar}${live}<text class="name" x="8" y="${num(mid + 4)}">${esc(shortText(agent.type, LABEL_MAX))}</text><text class="val" x="${num(input.width - 6)}" y="${num(mid + 4)}" text-anchor="end">${esc(value)}</text></g>`
}

export function timelineSvg(input: TimelineInput): { source: string; alt: string; height: number } | null {
  const lanes = [...input.agents].sort((a, b) => a.startedAt - b.startedAt).slice(-LANES_MAX)
  if (lanes.length === 0) return null

  const t0 = Math.min(...lanes.map(agent => agent.startedAt))
  const span = Math.max(MIN_SPAN_MS, input.nowMs - t0)
  const height = lanes.length * LANE_HEIGHT + 4
  const body = lanes.map((agent, index) => laneBlock({ agent, index, input, t0, span })).join('')
  const running = lanes.filter(isRunning).length
  const source = `<svg xmlns="http://www.w3.org/2000/svg" class="t-${input.theme}" width="${num(input.width)}" height="${height}" viewBox="0 0 ${num(input.width)} ${height}">${styleBlock()}${defsBlock()}${body}</svg>`

  return { source, alt: `${lanes.length} agents on a timeline, ${running} running`, height }
}
