import { ciPart } from './ci-view'
import { failuresOf, isFailing } from './parse'
import { picture } from './pane-pic'
import { fileHeadSvg, localPartSvg, rowSvg, tailHeadSvg, verdictSvg } from './pane-svg'
import { groupsOf, runMeta } from './summary'
import { svgWidth } from './svg'
import type { Theme } from './tidemark'
import { PressRow } from './kit/press'
import { chipRow, rerunRow, textPane, unplacedOf } from './view-text'
import type { CheckName } from './view-text'
import { localRowsOf, verdictOf } from './verdict'
import type { PaneState } from './verdict'
import type { Commands } from './detect'
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
  // What this project would run; null until it was looked for.
  commands: Commands | null
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

function failuresTree(ui: Ui, view: PaneView) {
  const { Box } = ui
  if (!isFailing(view.badge)) return null

  return (
    <Box flexDirection="column" rowGap={1}>
      {chipRow(ui, view)}
      {groupsOf(view.badge, view.filter).map(group => groupTree(ui, view, group))}
      {view.filter === 'all' && tailTree(ui, view, { name: 'tests', outcome: view.badge.tests })}
      {view.filter === 'all' && tailTree(ui, view, { name: 'lint', outcome: view.badge.lint })}
    </Box>
  )
}

// How many passed, where the runner counted them and a run is not still going.
function meterOf({ tests, ...badge }: PaneView['badge']): { passed: number; total: number } | null {
  if (badge.isRunning || tests === null || tests.total === null || tests.passed === null) return null

  return { passed: tests.passed, total: tests.total }
}

function localPart(ui: Ui, view: PaneView, state: PaneState) {
  const frame = { width: svgWidth(view.columns, WIDTH), mode: view.theme.mode }
  const says = words().local
  const rows = localRowsOf(state)
  const part = { title: says.title, meta: runMeta(view.badge, view.now), isLive: view.badge.isRunning, rows, meter: meterOf(view.badge), note: rows.length === 0 ? says.none : says.when }

  // The age ("12 sn önce") ticks on; only what the run says is a change worth a sweep.
  return picture(ui, localPartSvg(frame, part), 'tb-local', { shows: { frame, part: { ...part, meta: view.badge.finishedAt } } })
}

export function paneTree(ui: Ui, view: PaneView) {
  const { Box } = ui
  if (!view.isRich) return textPane(ui, view)
  const state: PaneState = { badge: view.badge, ci: view.ci, commands: view.commands }
  const frame = { width: svgWidth(view.columns, WIDTH), mode: view.theme.mode }

  return (
    <Box flexDirection="column" rowGap={1}>
      {picture(ui, verdictSvg(frame, verdictOf(state)), 'tb-verdict')}
      {localPart(ui, view, state)}
      {failuresTree(ui, view)}
      {rerunRow(ui, view)}
      {ciPart(ui, view)}
    </Box>
  )
}
