import { ciPart } from './ci-view'
import { failuresOf, isFailing } from './parse'
import { picture } from './pane-pic'
import { emptySvg, fileHeadSvg, headerSvg, rowSvg, skeletonSvg, tailHeadSvg } from './pane-svg'
import { groupsOf } from './summary'
import { svgWidth } from './svg'
import type { Theme } from './tidemark'
import { PressRow } from './kit/press'
import { chipRow, rerunRow, textPane, unplacedOf } from './view-text'
import type { CheckName } from './view-text'
import { words } from './words'
import type { CheckOutcome, CiWatch, Failure, SuiteFilter, TestBadge } from '../types'

// The resolved element table of the surface that draws the tree.
type Ui = Record<string, any>

export type PaneView = {
  badge: TestBadge
  now: number
  columns: number
  filter: SuiteFilter
  theme: Theme
  isRich: boolean
  onOpen: (failure: Failure) => void
  onRerun: () => void
  onFilter: (filter: SuiteFilter) => void
  // The CI watch's last state, or null while no PR is watched.
  ci: CiWatch | null
}

// Columns a failure row is indented by under its file, and so narrower than the pane.
const ROW_INDENT = 2
const WIDTH = { min: 300, max: 880 }
const ROW_WIDTH = { min: 220, max: 880, reserve: ROW_INDENT }

// A failure row moves with its failure, not its place, so a fix above it leaves it still.
const failureKey = (failure: Failure): string => `${failure.suite}:${failure.file ?? '-'}:${failure.line ?? '-'}:${failure.name}:${failure.message}`

// A failure with a file is pressed as a whole (DESIGN.md §0.5): its drawing ends in a chevron, a clear button
// lies over it. One with no file to open is a plain drawing.
function failureRow(ui: Ui, view: PaneView, spec: { failure: Failure; index: number; width: number }) {
  const { failure, index } = spec
  const isPressable = failure.file !== null
  const frame = { width: spec.width, mode: view.theme.mode }
  const drawing = picture(ui, rowSvg(frame, failure, isPressable), `tb-svg-${failureKey(failure)}`, { isRow: isPressable })
  if (!isPressable) return drawing

  return PressRow(ui, { box: `tb-press-${index}`, key: `tb-open-${index}`, drawing, onPress: () => view.onOpen(failure) })
}

function groupTree(ui: Ui, view: PaneView, group: { file: string | null; failures: Failure[] }) {
  const { Box } = ui
  const all = failuresOf(view.badge)
  const width = svgWidth(view.columns, ROW_WIDTH)
  const head = fileHeadSvg({ width: svgWidth(view.columns, WIDTH), mode: view.theme.mode }, { file: group.file, count: group.failures.length })

  return (
    <Box key={`tb-file-${group.file ?? '-'}`} flexDirection="column">
      {picture(ui, head, `tb-head-${group.file ?? '-'}`)}
      {group.failures.map(failure => {
        const index = all.indexOf(failure)

        return (
          <Box key={`tb-row-${index}`} flexDirection="row" paddingLeft={ROW_INDENT}>
            {failureRow(ui, view, { failure, index, width })}
          </Box>
        )
      })}
    </Box>
  )
}

function tailTree(ui: Ui, view: PaneView, spec: { name: CheckName; outcome: CheckOutcome | null }) {
  const { Box, Text } = ui
  const unplaced = unplacedOf(spec)
  if (unplaced === null) return null
  const drawing = tailHeadSvg({ width: svgWidth(view.columns, WIDTH), mode: view.theme.mode }, unplaced.title)

  return (
    <Box key={`tb-tail-${spec.name}`} flexDirection="column">
      {picture(ui, drawing, `tb-tail-head-${spec.name}`)}
      {unplaced.lines.map((line, index) => <Text key={`tb-tail-${spec.name}-${index}`} dimColor wrap="wrap">{`   ${line}`}</Text>)}
    </Box>
  )
}

function bodyTree(ui: Ui, view: PaneView) {
  const { Box } = ui
  const { badge } = view
  if (badge.finishedAt === null) return picture(ui, skeletonSvg({ width: svgWidth(view.columns, WIDTH), mode: view.theme.mode }), 'tb-skeleton')
  if (!isFailing(badge)) return null

  return (
    <Box flexDirection="column" rowGap={1}>
      {chipRow(ui, view)}
      {groupsOf(badge, view.filter).map(group => groupTree(ui, view, group))}
      {view.filter === 'all' && tailTree(ui, view, { name: 'tests', outcome: badge.tests })}
      {view.filter === 'all' && tailTree(ui, view, { name: 'lint', outcome: badge.lint })}
    </Box>
  )
}

export function paneTree(ui: Ui, view: PaneView) {
  const { Box } = ui
  if (!view.isRich) return textPane(ui, view)
  const frame = { width: svgWidth(view.columns, WIDTH), mode: view.theme.mode }
  const isEmpty = view.badge.finishedAt === null && !view.badge.isRunning
  // The header's age ("12 sn önce") ticks on; only the run it shows is a change worth a sweep.
  const header = isEmpty ? emptySvg(frame) : headerSvg(frame, { badge: view.badge, now: view.now })

  return (
    <Box flexDirection="column" rowGap={1}>
      {picture(ui, header, 'tb-header', { shows: { frame, isEmpty, badge: view.badge } })}
      {!isEmpty && bodyTree(ui, view)}
      {rerunRow(ui, view)}
      {ciPart(ui, view)}
    </Box>
  )
}
