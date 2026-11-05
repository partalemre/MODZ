import { projectLabels, rowsOf } from './card'
import { agentCrab, bar, card, ease, enter, H, INNER, label, PAD, pixelText, pixelWidth, W } from './film-parts'
import type { SceneCtx } from './film-parts'
import { fitText, textWidth, wrapText } from './kit/svg'
import { compact, monthName, personaLine, personaName, shortDay, words } from './words'

// The film's scenes, each a function of the time inside it. One thought per scene, like a story: a big figure, then
// the crew that earned it. Crabs walk everywhere they appear, on the same two-step gait as the Agents pane.

const MID = W / 2
const CRAB_W = 30
const COUNT_UP_S = 1.2
// A big figure stays exact while it fits the stage.
const EXACT_BELOW = 10_000
const CREW_MAX = 42
const CREW_COLUMNS = 7
const BOARD_ROWS = 5
const FLOOR = 720

export function introScene({ w, t, step }: SceneCtx): string {
  const walkers = w.agents.slice(0, 5)
  const crabs = walkers.map((agent, index) => {
    const arrived = PAD + 18 + index * 86
    const x = arrived - (1 - ease(t, 0.15 * index, 1.1)) * W

    return agentCrab(agent.type, index, { x, y: FLOOR - 78, scale: 2.6, step: step + index })
  })

  return [
    enter(pixelText(String(w.year), { x: MID, y: 300, cell: 18, paint: 'hi', isCentered: true }), ease(t, 0)),
    enter(label(words().sceneIntro, { x: MID, y: 470, size: 26, weight: 620, paint: 'mid', anchor: 'middle' }), ease(t, 0.35)),
    crabs.join(''),
  ].join('')
}

// A figure that counts up to its real value and stops there.
function counted(value: number, t: number): string {
  const shown = Math.round(value * ease(t, 0, COUNT_UP_S))

  return value < EXACT_BELOW ? String(shown) : compact(shown)
}

function bigFigure(text: string, y: number, paint: string): string {
  const cell = Math.min(22, (INNER / Math.max(1, pixelWidth(text, 1))) | 0)

  return pixelText(text, { x: PAD, y, cell, paint })
}

export function volumeScene({ w, t }: SceneCtx): string {
  const t2 = words()
  const rows = [
    { value: compact(w.sessions), label: t2.sessions },
    { value: String(w.activeDays), label: t2.activeDays },
    { value: String(w.streak), label: t2.streak },
  ]

  return [
    enter(label(t2.sceneVolume, { x: PAD, y: 190, size: 22, weight: 600 }), ease(t, 0)),
    bigFigure(counted(w.prompts, t), 225, 'hi'),
    enter(label(t2.prompts, { x: PAD, y: 425, size: 24, weight: 620, paint: 'edit' }), ease(t, 0.6)),
    ...rows.map((row, index) => {
      const y = 510 + index * 86

      return enter(pixelText(row.value, { x: PAD, y, cell: 6, paint: 'hi' }) + label(row.label, { x: PAD + 190, y: y + 30, size: 19 }), ease(t, 1 + index * 0.35))
    }),
  ].join('')
}

export function crewScene({ w, t, step }: SceneCtx): string {
  const t2 = words()
  const each = Math.max(1, Math.ceil(w.agentRuns / CREW_MAX))
  const shown = Math.ceil(w.agentRuns / each)
  const size = INNER / CREW_COLUMNS
  const scale = (size - 8) / CRAB_W
  const crabs = Array.from({ length: Math.ceil(shown * ease(t, 0.7, 2.2)) }, (_, index) => {
    const x = PAD + (index % CREW_COLUMNS) * size
    const y = 395 + Math.floor(index / CREW_COLUMNS) * (size + 2)
    const agent = w.agents[index % Math.max(1, w.agents.length)]

    return agentCrab(agent?.type ?? 'agent', index, { x, y, scale, step: step + index })
  })
  const note = each > 1 ? t2.sceneCrewEach(each) : ''

  return [
    bigFigure(counted(w.agentRuns, t), 165, 'run'),
    enter(label(t2.sceneCrew, { x: PAD, y: 345, size: 26, weight: 620 }), ease(t, 0.5)),
    crabs.join(''),
    enter(label(t2.sceneCrewTools(w.agentTools, w.agentTokens), { x: PAD, y: 880, size: 15, paint: 'mid' }), ease(t, 2.4)),
    note === '' ? '' : enter(label(note, { x: W - PAD, y: 880, size: 13, paint: 'lo', anchor: 'end' }), ease(t, 2.4)),
  ].join('')
}

const CARD = { h: 124, gap: 12, tile: 92 } as const

function boardRow(c: SceneCtx, index: number, most: number): string {
  const agent = c.w.agents[index]
  if (agent === undefined) return ''
  const t2 = words()
  const y = 170 + index * (CARD.h + CARD.gap)
  const textX = PAD + CARD.tile + 26
  const room = W - PAD - 16 - textX
  const shown = ease(c.t, 0.25 + index * 0.45)
  const fill = ease(c.t, 0.5 + index * 0.45, 1.1)
  const body = [
    card({ x: PAD, y, width: INNER, height: CARD.h }),
    agentCrab(agent.type, index, { x: PAD + 18, y: y + 26, scale: 2.5, step: c.step + index }),
    label(fitText(agent.type, room, text => textWidth(text, 19, 620)), { x: textX, y: y + 42, size: 19, weight: 620, paint: 'hi' }),
    label(t2.sceneBoardRuns(agent.runs), { x: W - PAD - 16, y: y + 42, size: 13, paint: 'lo', anchor: 'end' }),
    bar({ x: textX, y: y + 60, width: room, share: (agent.tools / most) * fill, paint: index === 0 ? 'ok' : 'run' }),
    label(t2.agentMeta(agent.tools, agent.tokens), { x: textX, y: y + 94, size: 14 }),
  ].join('')

  return enter(body, shown)
}

export function boardScene(c: SceneCtx): string {
  const most = Math.max(1, ...c.w.agents.map(agent => agent.tools))

  return [
    enter(label(words().sceneBoard, { x: PAD, y: 138, size: 28, weight: 650, paint: 'hi' }), ease(c.t, 0)),
    ...Array.from({ length: BOARD_ROWS }, (_, index) => boardRow(c, index, most)),
  ].join('')
}

export function hardestScene(c: SceneCtx): string {
  const { w, t, step, isNamed } = c
  const t2 = words()
  const hardest = w.hardest
  if (hardest === null) return ''
  const rank = Math.max(0, w.agents.findIndex(agent => agent.type === hardest.type))
  const scale = 7
  const lines = isNamed && hardest.description !== '' ? wrapText(hardest.description, { max: INNER, maxLines: 2, measure: text => textWidth(text, 21, 620) }) : [hardest.type]

  return [
    enter(label(t2.sceneHardest, { x: MID, y: 180, size: 26, weight: 650, paint: 'hi', anchor: 'middle' }), ease(t, 0)),
    enter(agentCrab(hardest.type, rank, { x: MID - (CRAB_W * scale) / 2, y: 230, scale, step }), ease(t, 0.2)),
    enter(lines.map((line, index) => label(line, { x: MID, y: 500 + index * 28, size: 21, weight: 620, paint: 'hi', anchor: 'middle' })).join(''), ease(t, 0.6)),
    pixelText(counted(hardest.tools, t), { x: MID, y: 585, cell: 12, paint: 'run', isCentered: true }),
    enter(label(t2.sceneHardestMeta(hardest.tools, hardest.tokens), { x: MID, y: 710, size: 17, anchor: 'middle' }), ease(t, 1.4)),
  ].join('')
}

const MONTH_BAR = { top: 30, floor: 16, max: 54, h: 8 } as const
const CRAB_H = 26

// A month's line: its top project, how much happened, and its busiest agent walking along the bar with its name.
function monthRow(c: SceneCtx, o: { index: number; y: number; rowH: number; start: number; most: number; project: string }): string {
  const t2 = words()
  const month = c.w.months[o.index]
  if (month === undefined) return ''
  const reach = INNER
  const share = (month.prompts / o.most) * ease(c.t, o.start, 0.7)
  const barY = Math.min(MONTH_BAR.max, o.rowH - MONTH_BAR.floor)
  const scale = Math.max(0.45, (barY - MONTH_BAR.top + 4) / CRAB_H)
  const crabW = CRAB_W * scale
  const crabX = PAD + Math.min(reach - crabW, Math.max(0, reach * share - crabW / 2))
  const meta = t2.monthMeta(month.prompts, month.runs)
  const room = INNER - 100 - textWidth(meta, 12.5) - 10
  const agent = month.agent
  const rank = agent === null ? o.index : c.w.agents.findIndex(row => row.type === agent)
  const isLeft = crabX > MID
  const name = agent === null ? '' : label(agent, { x: isLeft ? crabX - 6 : crabX + crabW + 6, y: o.y + barY - 5, size: 11.5, paint: 'lo', anchor: isLeft ? 'end' : 'start' })

  return enter(
    [
      label(monthName(month.month), { x: PAD, y: o.y + 16, size: 15, weight: 620, paint: 'hi' }),
      label(fitText(o.project, room, text => textWidth(text, 14)), { x: PAD + 100, y: o.y + 16, size: 14 }),
      label(meta, { x: W - PAD, y: o.y + 16, size: 12.5, paint: 'lo', anchor: 'end' }),
      bar({ x: PAD, y: o.y + barY, width: reach, share, paint: 'edit', height: MONTH_BAR.h }),
      agent === null ? '' : agentCrab(agent, Math.max(0, rank), { x: crabX, y: o.y + barY - CRAB_H * scale + 1, scale, step: c.step + o.index }),
      name,
    ].join(''),
    ease(c.t, o.start - 0.1),
  )
}

export function monthsScene(c: SceneCtx): string {
  const { w, t, isNamed } = c
  const labels = projectLabels(w, isNamed)
  const most = Math.max(1, ...w.months.map(month => month.prompts))
  const rowH = Math.min(100, 720 / Math.max(1, w.months.length))
  const span = (c.dur - 1.6) / Math.max(1, w.months.length)
  const rows = w.months.map((month, index) =>
    monthRow(c, { index, y: 170 + index * rowH, rowH, start: 0.4 + index * span, most, project: month.project === null ? '—' : (labels.get(month.project) ?? '—') }),
  )

  return [enter(label(words().sceneMonths, { x: PAD, y: 138, size: 28, weight: 650, paint: 'hi' }), ease(t, 0)), ...rows].join('')
}

// The funny rows the card opens with: figure first, big.
export function funScene(c: SceneCtx): string {
  const rows = rowsOf({ wrapped: c.w, isNamed: c.isNamed }).slice(0, 4)
  const body = rows.map((row, index) => {
    const y = 170 + index * 178

    return enter(
      card({ x: PAD, y, width: INNER, height: 158 }) +
        label(fitText(row.value, INNER - 44, text => textWidth(text, 40, 680)), { x: PAD + 22, y: y + 72, size: 40, weight: 680, paint: 'hi' }) +
        label(row.label, { x: PAD + 22, y: y + 118, size: 19 }),
      ease(c.t, 0.15 + index * 0.65),
    )
  })

  return body.join('')
}

export function personaScene({ w, t, step }: SceneCtx): string {
  const t2 = words()
  const lead = w.agents[0]?.type ?? 'agent'
  const scale = 6.4

  return [
    enter(label(t2.scenePersona, { x: MID, y: 190, size: 22, weight: 600, anchor: 'middle' }), ease(t, 0)),
    enter(label(personaName(w.persona), { x: MID, y: 262, size: 56, weight: 700, paint: 'edit', anchor: 'middle' }), ease(t, 0.25)),
    enter(agentCrab(lead, 0, { x: MID - (CRAB_W * scale) / 2, y: 310, scale, step }), ease(t, 0.5)),
    enter(label(personaLine(w.persona), { x: MID, y: 545, size: 20, anchor: 'middle' }), ease(t, 0.8)),
    enter(pixelText('MODZ x CLAUDE', { x: MID, y: 640, cell: 4.6, paint: 'hi', isCentered: true }), ease(t, 1.2)),
    enter(label(`${shortDay(w.firstDay)} – ${shortDay(w.lastDay)}`, { x: MID, y: H - 150, size: 14, paint: 'lo', anchor: 'middle' }), ease(t, 1.5)),
    enter(label('/wrapped', { x: MID, y: H - 122, size: 14, paint: 'lo', anchor: 'middle' }), ease(t, 1.5)),
  ].join('')
}
