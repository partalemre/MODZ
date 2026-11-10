import type { RenderElement } from 'claude-code'

import { ButtonRow, Card, cardInnerWidth } from './kit/ui'
import type { ButtonSpec, DrawCtx } from './kit/ui'
import type { CardKind } from './gate'
import { TOKENS_PER_K } from './limits'
import { relativeTo } from './note'
import { ageText, howOf } from './pane'
import { words } from './words'
import type { CompactedLine, HandoffNote } from '../types'

// What this mod puts above the prompt (DESIGN.md §6, slot 2, a notification): one quiet line near auto-compaction,
// one after a compaction, and the cards of a handoff. It sits above `theirs`, which it never swallows.

export type BandActions = {
  onWrite: () => void
  onCompact: () => void
  onSnooze: () => void
  onShow: () => void
  onDismiss: () => void
  onContinue: () => void
  onDecline: () => void
  onRestore: () => void
  onForget: () => void
}

export type BandView = {
  kind: Exclude<CardKind, null>
  percent: number | null
  threshold: number
  autoAt: number | null
  compacted: CompactedLine | null
  note: HandoffNote | null
  failure: string | null
  columns: number
  actions: BandActions
  now: number
}

// One dim line and its buttons, no card: a question, not an alarm.
function quietLine(draw: DrawCtx, text: string, buttons: ButtonSpec[]): RenderElement {
  const { Box, Text } = draw.ui

  return (
    <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
      <Text key="handoff-line" dimColor>{text}</Text>
      {ButtonRow(draw, { buttons })}
    </Box>
  )
}

// Near auto-compaction, the one question. Either way the working notes are saved first.
function askLine(draw: DrawCtx, view: BandView): RenderElement {
  const says = words()
  const percent = view.percent ?? view.threshold
  const text = [says.askHeadline(percent), view.autoAt === null ? '' : says.askAuto(view.autoAt)].filter(part => part !== '').join(' · ')

  return quietLine(draw, text, [
    { key: 'handoff-compact', label: says.compactKeep, variant: 'primary', onPress: view.actions.onCompact },
    { key: 'handoff-write', label: says.handOff, onPress: view.actions.onWrite },
    { key: 'handoff-snooze', label: says.notNow, variant: 'plain', onPress: view.actions.onSnooze },
  ])
}

const kTokens = (n: number): string => `${Math.round(n / TOKENS_PER_K)}k`

// After a compaction: what happened, and the notes back on a press.
function compactedLine(draw: DrawCtx, line: CompactedLine, view: BandView): RenderElement {
  const says = words()
  const { tokensBefore: before, tokensAfter: after } = line
  const sizes = before === undefined || after === undefined ? '' : says.sizes(kTokens(before), kTokens(after))
  const text = [says.compactedHead(howOf(line.trigger)), sizes, says.notesSaved].filter(part => part !== '').join(' · ')

  return quietLine(draw, text, [
    { key: 'handoff-restore', label: says.restore, variant: 'primary', onPress: view.actions.onRestore },
    { key: 'handoff-forget', label: says.dismiss, variant: 'plain', onPress: view.actions.onForget },
  ])
}

// A note another conversation left: it reaches this one only if the person says so.
function offerCard(draw: DrawCtx, view: BandView, width: number): RenderElement {
  const says = words()
  const buttons: ButtonSpec[] = [
    { key: 'handoff-continue', label: says.continueFrom, variant: 'primary', onPress: view.actions.onContinue },
    { key: 'handoff-decline', label: says.notNow, variant: 'plain', onPress: view.actions.onDecline },
  ]
  const age = view.note === null ? '' : ageText(view.now - view.note.at)

  return Card(draw, {
    header: { icon: 'flag', eyebrow: says.eyebrow, meta: age, headline: says.offerHeadline, sub: says.offerSub, width },
    children: [ButtonRow(draw, { buttons })],
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
  if (view.kind === 'ask') return askLine(draw, view)
  if (view.kind === 'compacted' && view.compacted !== null) return compactedLine(draw, view.compacted, view)
  if (view.kind === 'offer') return offerCard(draw, view, width)
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
