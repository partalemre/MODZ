import type { RenderElement } from 'claude-code'

import { ButtonRow, Card, cardInnerWidth, isTextSurface } from './kit/ui'
import type { DrawCtx } from './kit/ui'
import { stepDots } from './kit/svg-steps'
import { clip } from './progress'
import { words } from './words'
import type { FinishNotice, StepMark } from '../types'

// The finish card above the prompt (DESIGN.md §6, a notification): a quiet "Plan" label, how many steps are still
// open, the next one, the plan's steps as dots, and three ways on. The terminal draws the dots as text.
// A neutral card: an open plan is not a state that asks for colour (DESIGN.md §0.1).

export type FinishActions = { onContinue: () => void; onMarkDone: () => void; onNotNow: () => void }

export type FinishView = { notice: FinishNotice; columns: number; actions: FinishActions }

const NEXT_MAX = 72
// Terminal cells a card's border and padding take.
const CARD_CELLS = 6
const DOT_DONE = '●'
const DOT_OPEN = '○'
const LINK = '─'

type Run = { mark: StepMark; text: string }

// Consecutive marks of one kind as one run, so a long plan is a handful of Texts.
function runsOf(marks: readonly StepMark[], link: string): Run[] {
  const runs: Run[] = []
  for (const [k, mark] of marks.entries()) {
    const text = `${k === 0 ? '' : link}${mark === 'done' ? DOT_DONE : DOT_OPEN}`
    const last = runs[runs.length - 1]
    if (last !== undefined && last.mark === mark) last.text += text
    else runs.push({ mark, text })
  }

  return runs
}

function textDots(draw: DrawCtx, notice: FinishNotice, room: number): RenderElement | null {
  const { Box, Text } = draw.ui
  const caption = ` ${notice.done}/${notice.total}`
  const linked = notice.marks.length * 2 - 1 + caption.length <= room
  if (!linked && notice.marks.length + caption.length > room) return null
  const runs = runsOf(notice.marks, linked ? LINK : '')

  return (
    <Box key="plan-dots" flexDirection="row">
      {runs.map((run, k) => (
        <Text key={`dots-${k}`} dimColor={run.mark === 'open' ? true : undefined}>{run.text}</Text>
      ))}
      <Text dimColor>{caption}</Text>
    </Box>
  )
}

function svgDots(draw: DrawCtx, notice: FinishNotice, width: number): RenderElement | null {
  if (!('Svg' in draw.ui)) return null
  const { Svg } = draw.ui
  const pic = stepDots({ steps: notice.marks.map(mark => (mark === 'done' ? 'done' : 'pending')), caption: `${notice.done}/${notice.total}` })

  return pic.width > width ? null : <Svg key="plan-dots" {...pic} />
}

export function finishCard(draw: DrawCtx, view: FinishView): RenderElement {
  const say = words()
  const { notice, actions } = view
  const isText = isTextSurface(draw.ui, draw.surface)
  const width = cardInnerWidth(view.columns)
  const dots = isText ? textDots(draw, notice, view.columns - CARD_CELLS) : svgDots(draw, notice, width)
  const buttons = ButtonRow(draw, {
    buttons: [
      { key: 'plan-continue', label: say.finishContinue, variant: 'primary', onPress: actions.onContinue },
      { key: 'plan-done', label: say.finishMarkDone, variant: 'secondary', onPress: actions.onMarkDone },
      { key: 'plan-later', label: say.finishNotNow, variant: 'plain', onPress: actions.onNotNow },
    ],
  })
  const header = {
    icon: 'list' as const,
    eyebrow: say.finishEyebrow,
    meta: notice.source,
    headline: say.finishHeadline(notice.total - notice.done, notice.total),
    sub: notice.next === '' ? undefined : say.finishNext(clip(notice.next, NEXT_MAX)),
    width,
  }

  return Card(draw, { header, children: dots === null ? [buttons] : [dots, buttons] })
}
