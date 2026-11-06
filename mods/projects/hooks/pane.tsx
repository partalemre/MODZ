
import { detailPane } from './detail'
import { spent } from './build'
import { percentText, tokensText } from './format'
import { PressRow } from './kit/press'
import { headPic, mapPic, rowPic, stoppedAt } from './svg-rows'
import { busyText, flush, rowWidth } from './view'
import type { PaneView, Ui } from './view'
import { words } from './words'
import type { Project } from '../types'

// The pane: the list, or one project (detail.tsx). A surface without Svg gets the same facts as text and its own buttons.

const MAX_ROWS = 40

// The way back and the count share one line, the count ending where the rows do.
function headLine(ui: Ui, view: PaneView, text: string) {
  const { Box, Text, Svg } = ui
  if (view.isText) return <Box key="line" flexDirection="column">{view.home as never}<Text dimColor>{text}</Text></Box>

  return (
    <Box key="line" alignSelf="flex-start">
      <Svg key="count" {...headPic(text, rowWidth(view.columns))} />
      {view.home === null ? null : <Box key="home" position="absolute" top={0} left={0}>{view.home as never}</Box>}
    </Box>
  )
}

function listHead(ui: Ui, view: PaneView) {
  const { Box, Button } = ui
  const say = words()
  const projects = view.snapshot?.projects ?? []
  const live = projects.filter(project => project.isLive).length
  const text = view.busy?.label === 'estimate' ? busyText(view.busy) : say.hubDetail(projects.length, live)

  return (
    <Box flexDirection="column" gap={1} key="head">
      {headLine(ui, view, text)}
      <Box flexDirection="row" flexWrap="wrap" marginLeft={-1}>
        {view.missing > 0 && view.busy === null ? <Button key="estimate" label={say.estimateAll(view.missing)} plain onPress={view.acts.estimate} /> : null}
        <Button key="board" label={say.openBoard} plain onPress={view.acts.openBoard} />
      </Box>
    </Box>
  )
}

function rowOf(ui: Ui, view: PaneView, project: Project, width: number) {
  const { Svg, Button, Box, Text } = ui
  const key = `row:${project.root}`
  const press = () => view.acts.select(project.root)
  if (view.isText) {
    return (
      <Box key={key} flexDirection="column">
        <Button key={`${key}:b`} label={`${percentText(project.percent).padStart(5)}  ${project.name}`} plain onPress={press} />
        <Text dimColor>{`       ${tokensText(spent(project.tokens))} · ${stoppedAt(project).slice(0, 60)}`}</Text>
      </Box>
    )
  }

  return PressRow(ui as never, { box: key, key: `${key}:b`, drawing: <Svg key={`${key}:s`} {...rowPic(project, { width, nowMs: view.nowMs })} />, onPress: press })
}

export function listPane(ui: Ui, view: PaneView) {
  const { Box, Text, Svg, Button } = ui
  const say = words()
  const width = rowWidth(view.columns)
  const snapshot = view.snapshot
  if (snapshot === null) {
    return (
      <Box flexDirection="column" gap={1}>
        {view.home as never}
        <Text>{say.scanning}</Text>
        <Text dimColor>{view.error === '' ? say.scanningFirst : say.failed(view.error)}</Text>
      </Box>
    )
  }
  const projects = snapshot.projects

  return (
    <Box flexDirection="column" gap={1}>
      {listHead(ui, view)}
      {view.error === '' ? null : <Text key="err" color="error">{say.failed(view.error)}</Text>}
      {projects.length === 0 ? <Text key="none" dimColor>{say.empty}</Text> : null}
      {!view.isText && projects.length > 1 ? <Svg key="map" {...view.motion.pic('map', mapPic(projects, width))} /> : null}
      <Box key="rows" flexDirection="column">{projects.slice(0, MAX_ROWS).map(project => rowOf(ui, view, project, width))}</Box>
      {snapshot.other.folders > 0 ? <Text key="other" dimColor>{say.other(snapshot.other.folders, tokensText(snapshot.other.tokens))}</Text> : null}
      {snapshot.hidden > 0 ? flush(ui, 'shown-row', <Button key="shown" label={say.showHidden(snapshot.hidden)} plain dimColor onPress={view.acts.showHidden} />) : null}
    </Box>
  )
}

export function paneTree(ui: Ui, view: PaneView) {
  const project = view.snapshot?.projects.find(one => one.root === view.selected)

  return project === undefined ? listPane(ui, view) : detailPane(ui, view, project)
}
