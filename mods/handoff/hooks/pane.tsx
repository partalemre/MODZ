import type { RenderElement } from 'claude-code'

import { paneMotion } from './kit/moving'
import { ButtonRow, Card, Meter, paneInnerWidth } from './kit/ui'
import type { ButtonSpec, DrawCtx } from './kit/ui'
import { isTooOld } from './inject'
import { MINUTES_PER_HOUR, MS_PER_MINUTE, PREVIEW_LINES } from './limits'
import { words } from './words'
import type { HandoffNote, HandoffStage } from '../types'

// The small "Handoff" pane: the latest note of this repo, its age, whether the next chat gets it, and a way to
// write a new one, stop handing it on, or delete it. Opened only by a press or a command, never by itself.

const PERCENT = 100
const FENCE = '```'

// The pane's drawings on the desktop (kit/moving.ts), handed to the kit through the pane's DrawCtx: reset as the
// pane opens, so they cascade in each time. The band above the prompt draws without it.
export const motion = paneMotion()

export type PaneActions = { onWrite: () => void; onToggle: () => void; onDelete: () => void }

export type PaneView = {
  note: HandoffNote | null
  now: number
  percent: number | null
  threshold: number
  stage: HandoffStage
  columns: number
  actions: PaneActions
}

export function ageText(ms: number): string {
  const says = words()
  const minutes = Math.floor(ms / MS_PER_MINUTE)
  if (minutes < 1) return says.ago.now

  return minutes < MINUTES_PER_HOUR ? says.ago.m(minutes) : says.ago.h(Math.floor(minutes / MINUTES_PER_HOUR))
}

// The note's head, cut by lines; a fence left open by the cut is closed so the rest does not read as code.
export function previewOf(text: string): string {
  const lines = text.trimEnd().split('\n')
  const kept = lines.slice(0, PREVIEW_LINES)
  const fences = kept.filter(line => line.startsWith(FENCE)).length
  const isCut = kept.length < lines.length

  return [...kept, ...(fences % 2 === 1 ? [FENCE] : []), ...(isCut ? ['…'] : [])].join('\n')
}

export function statusOf(note: HandoffNote, now: number): string {
  const says = words()
  if (note.consumedBy !== null) return says.consumed
  if (isTooOld(note, now)) return says.stale

  return note.isInjectOn ? says.injectOn : says.injectOff
}

const fileName = (path: string): string => path.slice(path.lastIndexOf('/') + 1)

function noteButtons(view: PaneView, note: HandoffNote): ButtonSpec[] {
  const says = words()
  const canToggle = note.consumedBy === null && !isTooOld(note, view.now)
  const toggle: ButtonSpec[] = canToggle ? [{ key: 'handoff-toggle', label: note.isInjectOn ? says.turnOff : says.turnOn, onPress: view.actions.onToggle }] : []

  return [
    ...toggle,
    { key: 'handoff-write-now', label: says.writeNow, onPress: view.actions.onWrite },
    { key: 'handoff-delete', label: says.delete, variant: 'plain', isDestructive: true, onPress: view.actions.onDelete },
  ]
}

function contextMeter(draw: DrawCtx, view: PaneView, width: number): RenderElement[] {
  return view.percent === null ? [] : [Meter(draw, { label: words().context, value: view.percent / PERCENT, width })]
}

function emptyCard(draw: DrawCtx, view: PaneView, width: number): RenderElement {
  const says = words()
  const buttons: ButtonSpec[] = [{ key: 'handoff-write-now', label: says.writeNow, variant: 'primary', onPress: view.actions.onWrite }]

  return Card(draw, {
    header: { icon: 'flag', role: 'read', eyebrow: says.title, sub: says.emptyLine(view.threshold), width },
    children: [...contextMeter(draw, view, width), ButtonRow(draw, { buttons })],
  })
}

function noteCard(draw: DrawCtx, view: PaneView, note: HandoffNote, width: number): RenderElement {
  const says = words()
  const { Box, Markdown } = draw.ui
  const kind = note.isSummarized ? says.summarized : says.plain

  return Card(draw, {
    header: {
      icon: 'flag', role: 'read', eyebrow: says.latest, meta: ageText(view.now - note.at), headline: fileName(note.path),
      sub: `${statusOf(note, view.now)} · ${kind}`, width,
    },
    children: [
      ...contextMeter(draw, view, width),
      <Box key="handoff-preview" flexDirection="column"><Markdown key="handoff-note" text={previewOf(note.text)} /></Box>,
      ButtonRow(draw, { buttons: noteButtons(view, note) }),
    ],
  })
}

function writingCard(draw: DrawCtx, width: number): RenderElement {
  return Card(draw, { role: 'run', header: { icon: 'pencil', eyebrow: words().title, headline: words().writingHeadline, width } })
}

export function paneTree(draw: DrawCtx, view: PaneView): RenderElement {
  const width = paneInnerWidth(view.columns)
  if (view.stage === 'writing') return writingCard(draw, width)

  return view.note === null ? emptyCard(draw, view, width) : noteCard(draw, view, view.note, width)
}
