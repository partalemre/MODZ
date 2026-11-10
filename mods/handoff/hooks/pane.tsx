import type { RenderElement } from 'claude-code'

import { paneMotion } from './kit/moving'
import { ButtonRow, Card, Meter, paneInnerWidth } from './kit/ui'
import type { ButtonSpec, DrawCtx } from './kit/ui'
import { askPointOf } from './gate'
import { isTooOld } from './inject'
import { MINUTES_PER_HOUR, MS_PER_MINUTE, NOTES_MAX_AGE_MS, PREVIEW_LINES } from './limits'
import { words } from './words'
import type { HandoffNote, HandoffStage, NoteEntry } from '../types'

// The small "Handoff" pane: the latest note of this repo, its age, whether the next chat gets it, and a way to
// write a new one, stop handing it on, or delete it; then what the mod does and when, and every other note it keeps.
// Opened only by a press or a command, never by itself.

const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE

const PERCENT = 100
const FENCE = '```'

// The pane's drawings on the desktop (kit/moving.ts), handed to the kit through the pane's DrawCtx: reset as the
// pane opens, so they cascade in each time. The band above the prompt draws without it.
export const motion = paneMotion()

export type PaneActions = { onWrite: () => void; onToggle: () => void; onDelete: () => void; onDrop: (path: string) => void }

export type PaneView = {
  note: HandoffNote | null
  now: number
  percent: number | null
  threshold: number
  autoAt: number | null
  notes: readonly NoteEntry[]
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

// `automatic` for `auto`; a trigger the words do not know stands as the engine names it.
export const howOf = (trigger: string): string => words().how[trigger] ?? trigger

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
    header: { icon: 'flag', eyebrow: says.latest, sub: says.emptyLine(askPointOf(view)), width },
    children: [...contextMeter(draw, view, width), ButtonRow(draw, { buttons })],
  })
}

function noteCard(draw: DrawCtx, view: PaneView, note: HandoffNote, width: number): RenderElement {
  const says = words()
  const { Box, Markdown } = draw.ui
  const kind = note.isSummarized ? says.summarized : says.plain

  return Card(draw, {
    header: {
      icon: 'flag', eyebrow: says.latest, meta: ageText(view.now - note.at), headline: fileName(note.path),
      sub: `${statusOf(note, view.now)} · ${kind}`, width,
    },
    children: [
      ...contextMeter(draw, view, width),
      <Box key="handoff-preview" flexDirection="column"><Markdown key="handoff-note" text={previewOf(note.text)} /></Box>,
      ButtonRow(draw, { buttons: noteButtons(view, note) }),
    ],
  })
}

// The pane is titled "Handoff", so its label names the note, not the mod; live work takes the accent dot.
function writingCard(draw: DrawCtx, width: number): RenderElement {
  return Card(draw, { header: { icon: 'pencil', role: 'edit', hasDot: true, eyebrow: words().latest, headline: words().writingHeadline, width } })
}

// Plain words for what happens and when, at this conversation's numbers.
function aboutCard(draw: DrawCtx, view: PaneView, width: number): RenderElement {
  const { Text } = draw.ui
  const lines = words().aboutLines(askPointOf(view), view.autoAt, Math.round(NOTES_MAX_AGE_MS / MS_PER_DAY))

  return Card(draw, {
    header: { icon: 'flag', eyebrow: words().aboutEyebrow, width },
    children: lines.map((line, index) => <Text key={`handoff-about-${index}`} wrap="wrap">{line}</Text>),
  })
}

function noteRow(draw: DrawCtx, view: PaneView, entry: NoteEntry, index: number): RenderElement {
  const says = words()
  const { Box, Text } = draw.ui
  const kind = entry.kind === 'compact' ? says.kindCompact(howOf(entry.trigger ?? '')) : says.kindHandoff
  const button: ButtonSpec = { key: `handoff-drop-${index}`, label: says.drop, variant: 'plain', isDestructive: true, onPress: () => view.actions.onDrop(entry.path) }

  return (
    <Box key={`handoff-row-${index}`} flexDirection="column">
      <Text wrap="truncate-middle">{fileName(entry.path)}</Text>
      <Text dimColor wrap="wrap">{`${kind} · ${ageText(view.now - entry.at)}`}</Text>
      {ButtonRow(draw, { buttons: [button] })}
    </Box>
  )
}

// Every note kept but the one shown above, newest first, each with its own Delete.
function notesCard(draw: DrawCtx, view: PaneView, width: number): RenderElement {
  const { Text } = draw.ui
  const others = view.notes.filter(entry => entry.path !== view.note?.path)
  const rows = others.length === 0 ? [<Text key="handoff-notes-empty" dimColor>{words().notesEmpty}</Text>] : others.map((entry, index) => noteRow(draw, view, entry, index))

  return Card(draw, { header: { icon: 'flag', eyebrow: words().notesEyebrow, width }, children: rows })
}

function latestCard(draw: DrawCtx, view: PaneView, width: number): RenderElement {
  if (view.stage === 'writing') return writingCard(draw, width)

  return view.note === null ? emptyCard(draw, view, width) : noteCard(draw, view, view.note, width)
}

export function paneTree(draw: DrawCtx, view: PaneView): RenderElement {
  const width = paneInnerWidth(view.columns)
  const { Box } = draw.ui

  return (
    <Box flexDirection="column" gap={1}>
      {latestCard(draw, view, width)}
      {aboutCard(draw, view, width)}
      {notesCard(draw, view, width)}
    </Box>
  )
}
