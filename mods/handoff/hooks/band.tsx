import type { RenderElement } from 'claude-code'

import { ButtonRow, Card, Meter, cardInnerWidth } from './kit/ui'
import type { ButtonSpec, DrawCtx } from './kit/ui'
import type { CardKind } from './gate'
import { relativeTo } from './note'
import { words } from './words'
import type { HandoffNote } from '../types'

// The one card this mod puts above the prompt (DESIGN.md §6, slot 2, a notification): the ask at the threshold,
// then what became of it. It sits above `theirs`, which it never swallows.

const PERCENT = 100

export type BandActions = {
  onWrite: () => void
  onCompact: () => void
  onSnooze: () => void
  onShow: () => void
  onDismiss: () => void
}

export type BandView = {
  kind: Exclude<CardKind, null>
  percent: number | null
  threshold: number
  note: HandoffNote | null
  failure: string | null
  columns: number
  actions: BandActions
}

function askCard(draw: DrawCtx, view: BandView, width: number): RenderElement {
  const says = words()
  const percent = view.percent ?? view.threshold
  const buttons: ButtonSpec[] = [
    { key: 'handoff-write', label: says.write, variant: 'primary', onPress: view.actions.onWrite },
    { key: 'handoff-compact', label: says.compact, onPress: view.actions.onCompact },
    { key: 'handoff-snooze', label: says.notNow, variant: 'plain', onPress: view.actions.onSnooze },
  ]

  // An offer, not an alarm: the card stays neutral and the meter alone turns red near full. The headline says the
  // percent, so the meter carries no label of its own.
  return Card(draw, {
    header: { icon: 'flag', eyebrow: says.eyebrow, meta: says.askMeta(view.threshold), headline: says.askHeadline(percent), sub: says.askSub, width },
    children: [
      Meter(draw, { value: percent / PERCENT, width }),
      ButtonRow(draw, { buttons }),
    ],
  })
}

function savedCard(draw: DrawCtx, view: BandView, width: number): RenderElement {
  const says = words()
  const { Text } = draw.ui
  const path = view.note === null ? '' : relativeTo(view.note.root, view.note.path)
  const buttons: ButtonSpec[] = [
    { key: 'handoff-show', label: says.showNote, variant: 'primary', onPress: view.actions.onShow },
    { key: 'handoff-dismiss', label: says.gotIt, variant: 'plain', onPress: view.actions.onDismiss },
  ]

  return Card(draw, {
    header: { icon: 'check', eyebrow: says.eyebrow, headline: says.savedHeadline, sub: says.savedSub, width },
    children: [<Text key="handoff-path" dimColor wrap="truncate-middle">{path}</Text>, ButtonRow(draw, { buttons })],
  })
}

function failedCard(draw: DrawCtx, view: BandView, width: number): RenderElement {
  const says = words()
  const buttons: ButtonSpec[] = [
    { key: 'handoff-retry', label: says.tryAgain, variant: 'primary', onPress: view.actions.onWrite },
    { key: 'handoff-snooze', label: says.notNow, variant: 'plain', onPress: view.actions.onSnooze },
  ]

  return Card(draw, {
    role: 'danger',
    header: { icon: 'x', eyebrow: says.failedEyebrow, headline: says.failedHeadline, sub: view.failure ?? undefined, width },
    children: [ButtonRow(draw, { buttons })],
  })
}

// Live work: a neutral card, the accent only on the label's dot.
function writingCard(draw: DrawCtx, width: number): RenderElement {
  return Card(draw, { header: { icon: 'pencil', role: 'edit', hasDot: true, eyebrow: words().eyebrow, headline: words().writingHeadline, width } })
}

export function bandCard(draw: DrawCtx, view: BandView): RenderElement {
  const width = cardInnerWidth(view.columns)
  if (view.kind === 'ask') return askCard(draw, view, width)
  if (view.kind === 'saved') return savedCard(draw, view, width)
  if (view.kind === 'failed') return failedCard(draw, view, width)

  return writingCard(draw, width)
}

// The card above whatever the other mods drew.
export function withTheirs(draw: DrawCtx, card: RenderElement, theirs: RenderElement | null): RenderElement {
  const { Box } = draw.ui

  return (
    <Box flexDirection="column">
      {card}
      {theirs}
    </Box>
  )
}
