import type { Plan, Step } from './match'
import { baseName } from './parse'
import { anchorIndex, currentIndex, durationOf, etaOf, formatDuration, percentText, progressOf, windowOf } from './progress'
import type { Tracks } from './progress'
import type { StepTrack } from '../types'
import { planState, stateNote } from './freshness'
import { deskDetails } from './plan-detail'
import { EMPTY_HOW, EMPTY_LEAD, emptySvg } from './plan-empty'
import { planSvg } from './plan-svg'
import { widthFor } from './ui/svg'
import type { Theme } from './ui/theme'

// The resolved element table of the surface that draws the pane.
export type Ui = Record<string, any>

export type PaneView = { plan: Plan | null; tracks: Tracks; now: number; theme: Theme; touchedAt: number }
export type Layout = { columns: number; rows: number; surface: string }

const SVG_RANGE = { min: 280, max: 640 }
const GUTTER_COLUMNS = 3

const GLYPH_CELLS = 2
const PAD = 1
const BAR_MIN = 8
const CHROME_ROWS = 3
const FILES_SHOWN = 2
const AGENTS_SHOWN = 3
const MIN_STEP_ROWS = 3
const TITLE_MAX = 160

function header(ui: Ui, left: string, right: string) {
  const { Box, Text } = ui

  return (
    <Box key="head" flexDirection="row" justifyContent="space-between">
      <Text bold wrap="truncate-end">{left}</Text>
      <Box flexShrink={1} marginLeft={2}>
        <Text dimColor wrap="truncate-start">{right}</Text>
      </Box>
    </Box>
  )
}

function bar(ui: Ui, view: { percent: number; columns: number; eta: string }) {
  const { Box, Text } = ui
  const width = Math.max(BAR_MIN, view.columns - 2 * PAD - (view.eta === '' ? 0 : view.eta.length + 2))
  const filled = Math.round((width * view.percent) / 100)

  return (
    <Box key="bar" flexDirection="row">
      <Text color="success">{'━'.repeat(filled)}</Text>
      <Text dimColor>{'━'.repeat(width - filled)}</Text>
      {view.eta !== '' && <Text dimColor>{`  ${view.eta}`}</Text>}
    </Box>
  )
}

type RowLook = { glyph: string; glyphColor?: string; isDim: boolean; isBold: boolean; right: string; rightColor?: string }

function checksText(step: Step): string {
  return step.checksTotal > 0 ? `${step.checksDone}/${step.checksTotal}` : ''
}

function lookOf(step: Step, context: { track: StepTrack | undefined; now: number; isCurrent: boolean }): RowLook {
  const elapsed = durationOf(context.track, context.now)
  const time = elapsed === null ? '' : formatDuration(elapsed)
  if (step.status === 'completed') return { glyph: '✓', glyphColor: 'success', isDim: true, isBold: false, right: time }
  if (step.status === 'in_progress') {
    const right = context.isCurrent ? time : [checksText(step), time].filter(Boolean).join(' · ')

    return { glyph: '◐', glyphColor: 'claude', isDim: !context.isCurrent, isBold: context.isCurrent, right, rightColor: context.isCurrent ? 'claude' : undefined }
  }

  return { glyph: '○', isDim: false, isBold: false, right: checksText(step) }
}

function stepRow(ui: Ui, step: Step, look: RowLook) {
  const { Box, Text } = ui

  return (
    <Box key={`step-${step.key}`} flexDirection="row">
      <Box width={GLYPH_CELLS} flexShrink={0}>
        <Text color={look.glyphColor} dimColor={look.glyphColor === undefined && look.isDim}>{look.glyph}</Text>
      </Box>
      <Box flexGrow={1} flexShrink={1}>
        <Text wrap="truncate-end" bold={look.isBold} dimColor={look.isDim}>{step.title.slice(0, TITLE_MAX)}</Text>
      </Box>
      {look.right !== '' && (
        <Box flexShrink={0} marginLeft={1}>
          <Text color={look.rightColor} dimColor={look.rightColor === undefined}>{look.right}</Text>
        </Box>
      )}
    </Box>
  )
}

export function filesText(files: string[]): string {
  if (files.length === 0) return ''
  const names = files.slice(-FILES_SHOWN).reverse().map(baseName).join(', ')
  const more = files.length > FILES_SHOWN ? ` +${files.length - FILES_SHOWN}` : ''

  return `${files.length} dosya: ${names}${more}`
}

export function detailLines(step: Step, track: StepTrack | undefined): { summary: string; agents: string[] } {
  const done = track?.agents.filter(agent => !agent.isRunning).length ?? 0
  const parts = [
    step.checksTotal > 0 ? `${step.checksDone}/${step.checksTotal} madde` : '',
    filesText(track?.files ?? []),
    done > 0 ? `${done} ajan bitti` : '',
  ]
  const running = (track?.agents ?? []).filter(agent => agent.isRunning).map(agent => agent.description)

  return { summary: parts.filter(Boolean).join(' · '), agents: running.slice(0, AGENTS_SHOWN) }
}

function details(ui: Ui, lines: { summary: string; agents: string[] }) {
  const { Box, Text } = ui

  return [
    lines.summary !== '' && (
      <Box key="detail-summary" flexDirection="row" paddingLeft={GLYPH_CELLS}>
        <Text dimColor wrap="truncate-end">{`› ${lines.summary}`}</Text>
      </Box>
    ),
    ...lines.agents.map((agent, index) => (
      <Box key={`detail-agent-${index}`} flexDirection="row" paddingLeft={GLYPH_CELLS}>
        <Text color="claude">{'● '}</Text>
        <Text dimColor wrap="truncate-end">{agent}</Text>
      </Box>
    )),
  ]
}

function more(ui: Ui, key: string, text: string) {
  const { Box, Text } = ui

  return (
    <Box key={key}>
      <Text dimColor>{`  ${text}`}</Text>
    </Box>
  )
}

function detailCount(lines: { summary: string; agents: string[] }): number {
  return (lines.summary === '' ? 0 : 1) + lines.agents.length
}

function stepList(ui: Ui, view: PaneView & { plan: Plan }, rows: number) {
  const { steps } = view.plan
  const current = currentIndex(steps, view.tracks)
  const currentStep = steps[current]
  const lines = currentStep === undefined ? { summary: '', agents: [] } : detailLines(currentStep, view.tracks[currentStep.key])
  const room = Math.max(MIN_STEP_ROWS, rows - CHROME_ROWS - detailCount(lines))
  const shown = windowOf(steps.length, anchorIndex(steps, view.tracks), room)
  const out: unknown[] = []
  if (shown.start > 0) out.push(more(ui, 'more-above', `✓ ${shown.start} adım daha`))
  steps.slice(shown.start, shown.end).forEach((step, offset) => {
    const isCurrent = shown.start + offset === current
    out.push(stepRow(ui, step, lookOf(step, { track: view.tracks[step.key], now: view.now, isCurrent })))
    if (isCurrent) out.push(...details(ui, lines))
  })
  if (shown.end < steps.length) out.push(more(ui, 'more-below', `+${steps.length - shown.end} adım daha`))

  return out
}

export function headline(plan: Plan): string {
  const progress = progressOf(plan)

  return `Plan · ${progress.done}/${progress.total} adım · ${percentText(progress)}`
}

function emptyPane(ui: Ui) {
  const { Box, Text } = ui

  return (
    <Box flexDirection="column" paddingX={PAD}>
      <Text bold>{'Plan'}</Text>
      <Box key="empty" flexDirection="row" flexWrap="wrap">
        <Text wrap="wrap">
          <Text bold>{EMPTY_LEAD}</Text>
          <Text dimColor>{` · ${EMPTY_HOW}`}</Text>
        </Text>
      </Box>
    </Box>
  )
}

function desktopPane(ui: Ui, view: PaneView, layout: Layout) {
  const { Box, Svg } = ui
  const width = widthFor(layout.columns - GUTTER_COLUMNS, SVG_RANGE)
  const plan = view.plan
  if (plan === null || plan.steps.length === 0) {
    const empty = emptySvg(view.theme, width)

    return (
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Svg key="plan-svg" source={empty.source} alt={empty.alt} width={width} height={empty.height} />
      </Box>
    )
  }
  const steps = plan.steps
  const current = steps[currentIndex(steps, view.tracks)]
  const details = current === undefined ? { meta: '', files: [], running: [] } : deskDetails(current, view.tracks[current.key])
  const note = noteOf(view)
  const drawing = planSvg({ plan, tracks: view.tracks, now: view.now, theme: view.theme, width, note }, details)

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Svg key="plan-svg" source={drawing.source} alt={`${headline(plan)}${current === undefined ? '' : ` · şimdi: ${current.title}`}`} width={width} height={drawing.height} />
    </Box>
  )
}

// "başlamadı" or "bekliyor · 45dk önce" for a plan that is not under way, else nothing.
function noteOf(view: PaneView): string {
  const at = { now: view.now, touchedAt: view.touchedAt }

  return stateNote(planState(view.plan, at), at)
}

export function planPane(ui: Ui, view: PaneView, layout: Layout) {
  if (layout.surface !== 'terminal' && 'Svg' in ui) return desktopPane(ui, view, layout)
  const { Box, Text } = ui
  const plan = view.plan
  if (plan === null || plan.steps.length === 0) return emptyPane(ui)
  const eta = etaOf(plan, view.tracks)

  return (
    <Box flexDirection="column" paddingX={PAD}>
      {header(ui, headline(plan), [plan.source, noteOf(view)].filter(Boolean).join(' · '))}
      {bar(ui, { percent: progressOf(plan).percent, columns: layout.columns, eta: eta === null || noteOf(view) !== '' ? '' : `kalan ~${formatDuration(eta)}` })}
      <Text>{' '}</Text>
      {stepList(ui, { ...view, plan }, layout.rows)}
    </Box>
  )
}
