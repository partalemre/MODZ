import { failuresOf, isFailing } from './parse'
import { fileHeadSvg, headerSvg, rowSvg, skeletonSvg, tailHeadSvg } from './pane-svg'
import type { Drawing } from './pane-svg'
import { groupsOf } from './summary'
import { svgWidth } from './svg'
import type { Theme } from './tidemark'
import { chipRow, rerunRow, textPane, unplacedOf } from './view-text'
import type { CheckOutcome, Failure, SuiteFilter, TestBadge } from '../types'

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
}

// Room the "Aç" button and the row indent take beside a failure row, in columns.
const ROW_RESERVE = 12
const WIDTH = { min: 300, max: 880 }

function picture(ui: Ui, drawing: Drawing, key: string) {
  const { Svg } = ui

  return <Svg key={key} source={drawing.source} alt={drawing.alt} width={drawing.width} height={drawing.height} />
}

function groupTree(ui: Ui, view: PaneView, group: { file: string | null; failures: Failure[] }) {
  const { Box, Button } = ui
  const all = failuresOf(view.badge)
  const frame = { width: svgWidth(view.columns, { ...WIDTH, reserve: ROW_RESERVE }), mode: view.theme.mode }
  const head = fileHeadSvg({ width: svgWidth(view.columns, WIDTH), mode: view.theme.mode }, { file: group.file, count: group.failures.length })

  return (
    <Box key={`tb-file-${group.file ?? '-'}`} flexDirection="column">
      {picture(ui, head, `tb-head-${group.file ?? '-'}`)}
      {group.failures.map(failure => {
        const index = all.indexOf(failure)

        return (
          <Box key={`tb-row-${index}`} flexDirection="row" alignItems="center" columnGap={1} paddingLeft={4}>
            {picture(ui, rowSvg(frame, failure), `tb-svg-${index}`)}
            {failure.file !== null && <Button key={`tb-open-${index}`} plain dimColor label="Aç" onPress={() => view.onOpen(failure)} />}
          </Box>
        )
      })}
    </Box>
  )
}

function tailTree(ui: Ui, view: PaneView, spec: { name: string; outcome: CheckOutcome | null }) {
  const { Box, Text } = ui
  const unplaced = unplacedOf(spec)
  if (unplaced === null) return null
  const drawing = tailHeadSvg({ width: svgWidth(view.columns, WIDTH), mode: view.theme.mode }, unplaced.title)

  return (
    <Box key={`tb-tail-${spec.name}`} flexDirection="column">
      {picture(ui, drawing, `tb-tail-head-${spec.name}`)}
      {unplaced.lines.map((line, index) => <Text key={`tb-tail-${spec.name}-${index}`} dimColor wrap="truncate">{`   ${line}`}</Text>)}
    </Box>
  )
}

function bodyTree(ui: Ui, view: PaneView) {
  const { Box, Text } = ui
  const { badge } = view
  if (badge.finishedAt === null && badge.isRunning) return picture(ui, skeletonSvg({ width: svgWidth(view.columns, WIDTH), mode: view.theme.mode }), 'tb-skeleton')
  if (badge.finishedAt === null) return <Text dimColor>Kaynak dosya düzenleyen bir turdan sonra kendiliğinden çalışır.</Text>
  if (!isFailing(badge)) return null

  return (
    <Box flexDirection="column" rowGap={1}>
      {chipRow(ui, view)}
      {groupsOf(badge, view.filter).map(group => groupTree(ui, view, group))}
      {view.filter === 'all' && tailTree(ui, view, { name: 'testler', outcome: badge.tests })}
      {view.filter === 'all' && tailTree(ui, view, { name: 'lint', outcome: badge.lint })}
    </Box>
  )
}

export function paneTree(ui: Ui, view: PaneView) {
  const { Box } = ui
  if (!view.isRich) return textPane(ui, view)
  const header = headerSvg({ width: svgWidth(view.columns, WIDTH), mode: view.theme.mode }, { badge: view.badge, now: view.now })

  return (
    <Box flexDirection="column" rowGap={1}>
      {picture(ui, header, 'tb-header')}
      {bodyTree(ui, view)}
      {rerunRow(ui, view)}
    </Box>
  )
}
