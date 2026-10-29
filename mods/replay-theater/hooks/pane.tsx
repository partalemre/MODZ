import { buttons } from './buttons'
import type { PaneHandlers } from './buttons'
import { diffSvg } from './diff-svg'
import { paneMotion } from './kit/moving'
import type { Ui } from './offer'
import { baseName, detailSvg, overviewSvg, totals } from './pane-svg'
import type { PaneModel } from './pane-svg'
import type { ReplayStep } from '../types'
import { terminalView } from './terminal'
import { escape, widthFor, wrap } from './ui/svg'
import { svgDoc } from './ui/theme'
import type { Theme } from './ui/theme'
import { words } from './words'

export type PaneSite = { surface: string; columns: number; inBand: boolean; maxRows: number }

const PANE_GUTTER_COLUMNS = 3
// The sideways scrollbar of a diff wider than the pane takes this much under it.
const SCROLLBAR_ROOM = 12
// The replay outlives turns without edits, so an empty pane means none yet this session.
const emptyText = (): string => `${words().emptyLead}. ${words().emptyRest}`
const EMPTY_LEAD_Y = 20
const EMPTY_LINE_H = 19
const EMPTY_REST_SIZE = 13

function altOf(model: PaneModel): string {
  const sum = totals(model.steps)
  const step = model.steps[model.index]

  const w = words()

  return `${w.editsInFiles(model.steps.length, sum.files)}; ${w.nowOn(model.index + 1, step === undefined ? '' : baseName(step.file))}`
}

// The pane's drawings on the desktop (kit/moving.ts), its lists' too: reset as the pane opens, so they cascade in.
export const motion = paneMotion()

// A step's drawings follow the edit itself: its tool call, or the file and which edit of that file it is.
function stepKey(steps: ReplayStep[], index: number): string {
  const step = steps[index]
  if (step === undefined) return 'none'
  if (step.toolUseId !== undefined) return step.toolUseId
  const before = steps.slice(0, index).filter(other => other.file === step.file).length

  return `${step.file}#${before}`
}

function desktopView(ui: Ui, model: PaneModel, on: PaneHandlers) {
  const { Box, Svg } = ui
  const overview = overviewSvg(model)
  const detail = detailSvg(model)
  const step = model.steps[model.index]
  const id = stepKey(model.steps, model.index)
  const diff = diffSvg({ lines: step?.diff ?? [], width: model.width, theme: model.theme })
  // A wider diff scrolls sideways in its frame instead of cutting its lines, with room for the scrollbar under it.
  const isWide = diff.contentWidth > model.width
  const diffHeight = isWide ? diff.height + SCROLLBAR_ROOM : diff.height
  // "3m ago" reads on as time passes; only the replay itself is a change worth a sweep.
  const { age, ...shown } = model
  const overviewPic = motion.pic('rt-overview', { source: overview.source, alt: altOf(model), width: model.width, height: overview.height }, { shows: { ...shown, isAged: (age ?? '') !== '' } })
  const detailPic = motion.pic(`rt-detail-${id}`, { source: detail.source, alt: step?.said ?? (step === undefined ? '' : step.file), width: model.width, height: detail.height })
  const diffPic = motion.pic(`rt-diff-${id}`, { source: diff.source, alt: words().diffAlt, width: model.width, height: diffHeight })

  return (
    <Box key="rt-pane" flexDirection="column" gap={1} paddingX={1} paddingY={1}>
      <Svg key="rt-overview" {...overviewPic} />
      <Svg key={`rt-detail-${id}`} {...detailPic} />
      <Svg key={`rt-diff-${id}`} {...diffPic} />
      {buttons(ui, model, on)}
    </Box>
  )
}

// The lead and one sentence under it; the pane's own title already says whose it is.
function emptySvg(width: number, theme: Theme): { source: string; height: number } {
  const w = words()
  const rest = wrap(w.emptyRest, { width, size: EMPTY_REST_SIZE, maxLines: 2 })
  const lead = `<text x="0" y="${EMPTY_LEAD_Y}" class="headline hi">${escape(w.emptyLead)}</text>`
  const lines = rest.map((part, n) => `<text x="0" y="${EMPTY_LEAD_Y + (n + 1) * EMPTY_LINE_H + 2}" class="mid" font-size="${EMPTY_REST_SIZE}">${escape(part)}</text>`)
  const height = EMPTY_LEAD_Y + rest.length * EMPTY_LINE_H + 10
  const body = `${lead}${lines.join('')}`

  return { source: svgDoc({ width, height, theme }, body), height }
}

function emptyView(ui: Ui, spec: { surface: string; width: number; theme: Theme; on: PaneHandlers }) {
  const { Box, Text, Button, Svg } = ui
  const w = words()
  const close = <Button key="rt-close" plain dimColor hotkey="c" label={w.close} onPress={spec.on.onClose} />
  const sessions = <Button key="rt-sessions" variant="secondary" hotkey="s" label={w.pastSessions} onPress={spec.on.onSessions} />
  const actions = (
    <Box flexDirection="row" columnGap={2}>
      {sessions}
      <Box flexGrow={1} />
      {close}
    </Box>
  )
  if (spec.surface === 'terminal' || !('Svg' in ui)) {
    return (
      <Box key="rt-empty" flexDirection="column" gap={1} paddingX={1}>
        <Text bold dimColor>{w.title}</Text>
        <Text bold>{w.emptyLead}</Text>
        <Text dimColor>{w.emptyRest}</Text>
        {actions}
      </Box>
    )
  }
  const drawn = emptySvg(spec.width, spec.theme)

  return (
    <Box key="rt-empty" flexDirection="column" gap={1} paddingX={1} paddingY={1}>
      <Svg key="rt-empty-svg" {...motion.pic('rt-empty-svg', { source: drawn.source, alt: emptyText(), width: spec.width, height: drawn.height })} />
      {actions}
    </Box>
  )
}

export const paneWidth = (columns: number): number => widthFor(columns - PANE_GUTTER_COLUMNS, { min: 280, max: 720 })

export function replayView(ui: Ui, model: Omit<PaneModel, 'width'>, site: PaneSite & { on: PaneHandlers }) {
  const width = paneWidth(site.columns)
  if (model.steps.length === 0) return emptyView(ui, { surface: site.surface, width, theme: model.theme, on: site.on })
  const index = Math.max(0, Math.min(model.index, model.steps.length - 1))
  const full = { ...model, index, width }
  if (site.surface === 'terminal' || site.inBand || !('Svg' in ui)) {
    return terminalView(ui, full, { isCompact: site.inBand, maxRows: site.maxRows, on: site.on })
  }

  return desktopView(ui, full, site.on)
}
