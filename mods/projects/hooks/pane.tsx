
import { spent } from './build'
import { agoText, percentText, spanText, tokensText } from './format'
import { PressRow } from './kit/press'
import type { PaneMotion } from './kit/moving'
import { bigPic, headPic, mapPic, rowPic, stoppedAt } from './svg-rows'
import { words } from './words'
import type { Busy, Project, Snapshot } from '../types'

// The pane: the list, or one project. Plain text wherever words may need to wrap; the drawings only for what is a
// picture. A surface without Svg gets the same facts as text and its own buttons.

export type PaneActions = {
  select: (root: string) => void
  togglePlan: (path: string) => void
  openBoard: () => void
  estimate: () => void
  estimateOne: (root: string) => void
  hide: (root: string) => void
  showHidden: () => void
}

export type PaneView = { isText: boolean; snapshot: Snapshot | null; selected: string; openPlan: string; busy: Busy | null; error: string; nowMs: number; columns: number; motion: PaneMotion; acts: PaneActions; missing: number; home: unknown }

type Ui = Record<string, any>

const MAX_ROWS = 40
const MAX_PLANS = 12
const MAX_RUNS = 8
// A desktop pane reports about 9 px a column, its last one held back as slack (as the hub's rows do).
const PX_PER_COLUMN = 9
const WIDTH_MIN = 240
const WIDTH_MAX = 640

export const rowWidth = (columns: number): number => Math.max(WIDTH_MIN, Math.min(WIDTH_MAX, (columns - 1) * PX_PER_COLUMN))

const busyText = (busy: Busy): string => {
  const say = words()

  return busy.label === 'estimate' ? say.estimating(busy.done, busy.total) : say.scanning
}

// A plain button one cell back: its padding would indent its label from the text around it.
const flush = (ui: Ui, key: string, button: unknown) => {
  const { Box } = ui

  return <Box key={key} flexDirection="row" marginLeft={-1}>{button as never}</Box>
}

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
      <Box flexDirection="row" gap={1} flexWrap="wrap">
        <Button key="board" label={say.openBoard} variant="primary" onPress={view.acts.openBoard} />
        {view.missing > 0 && view.busy === null ? <Button key="estimate" label={say.estimateAll(view.missing)} variant="secondary" onPress={view.acts.estimate} /> : null}
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

function percentBlock(ui: Ui, view: PaneView, project: Project) {
  const { Box, Text, Button, Svg } = ui
  const say = words()
  const { percent } = project
  const basis = percent.kind === 'estimate'
    ? say.basisEstimate(agoText(percent.at, view.nowMs), percent.basis)
    : percent.kind === 'ticks' ? say.basisTicks(percent.basis) : say.noneHow

  return (
    <Box key="percent" flexDirection="column" gap={1} alignItems="flex-start">
      {view.isText || percent.value === null ? <Text bold>{percent.value === null ? say.none : percentText(percent)}</Text> : <Svg key="big" {...view.motion.pic(`big:${project.root}`, bigPic(project, rowWidth(view.columns)))} />}
      <Text dimColor>{basis}</Text>
      {percent.isStale ? <Text color="warning">{say.basisStale}</Text> : null}
      {view.busy === null ? <Button key="one" label={percent.kind === 'estimate' ? say.estimateAgain : say.estimateAll(1)} variant="secondary" onPress={() => view.acts.estimateOne(project.root)} /> : <Text dimColor>{busyText(view.busy)}</Text>}
    </Box>
  )
}

const section = (ui: Ui, key: string, title: string, children: unknown) => {
  const { Box, Text } = ui

  return (
    <Box key={key} flexDirection="column">
      <Text bold>{title}</Text>
      {children as never}
    </Box>
  )
}

function leftOffBlock(ui: Ui, view: PaneView, project: Project) {
  const { Box, Text } = ui
  const say = words()
  const left = project.leftOff
  const tasks = left?.tasks ?? []
  const done = tasks.filter(task => task.status === 'completed').length

  return section(ui, 'left', say.leftOff, (
    <Box flexDirection="column" gap={1}>
      <Text dimColor>{agoText(Date.parse(project.lastAt) || 0, view.nowMs)}{project.git === null ? '' : ` · ${say.branch(project.git.branch, project.git.dirty)}`}</Text>
      {left?.recap ? <Text key="r">{left.recap}</Text> : null}
      {!left?.recap && left?.reply ? <Text key="s">{left.reply}</Text> : null}
      {project.estimate ? <Text key="n"><Text bold>{say.next}: </Text>{project.estimate.next}</Text> : null}
      {left?.prompt ? <Text key="p" dimColor>{say.lastAsked}: {left.prompt}</Text> : null}
      {project.git ? <Text key="c" dimColor>{say.lastCommit}: {project.git.subject}</Text> : null}
      {tasks.length > 0 ? <Text key="t" dimColor>{say.taskList(done, tasks.length)}</Text> : null}
      {tasks.map((task, index) => <Text key={`t${index}`} dimColor={task.status !== 'in_progress'}>{task.status === 'completed' ? '✓' : task.status === 'in_progress' ? '●' : '○'} {task.subject}</Text>)}
    </Box>
  ))
}

function plansBlock(ui: Ui, view: PaneView, project: Project) {
  const { Box, Text, Button } = ui
  const say = words()
  if (project.plans.length === 0) return section(ui, 'plans', say.plans(0), <Text dimColor>{say.noPlans}</Text>)

  return section(ui, 'plans', say.plans(project.plans.length), (
    <Box flexDirection="column">
      {project.plans.slice(0, MAX_PLANS).map(plan => {
        const count = plan.done > 0 ? `${plan.done}/${plan.total}` : `${plan.total} · ${say.unmarked}`
        const isOpen = view.openPlan === plan.path

        return (
          <Box key={plan.path} flexDirection="column" alignItems="flex-start">
            {flush(ui, `${plan.path}:row`, <Button key={`${plan.path}:b`} label={`${isOpen ? '▾' : '▸'} ${plan.title} (${count})`} plain onPress={() => view.acts.togglePlan(plan.path)} />)}
            {isOpen ? plan.steps.map((step, index) => <Text key={`${plan.path}:${index}`} dimColor={step.isDone}>{plan.done > 0 ? (step.isDone ? '✓ ' : '○ ') : '· '}{step.title}</Text>) : null}
          </Box>
        )
      })}
    </Box>
  ))
}

function tokensBlock(ui: Ui, project: Project) {
  const { Box, Text } = ui
  const say = words()
  const models = Object.entries(project.byModel).sort((a, b) => spent(b[1]) - spent(a[1]))
  const line = (label: string, value: string) => <Text key={label}><Text dimColor>{label}: </Text>{value}</Text>

  return section(ui, 'tokens', say.tokens, (
    <Box flexDirection="column">
      {line(say.spent, tokensText(spent(project.tokens)))}
      {line(say.week, tokensText(project.week))}
      {line(say.output, tokensText(project.tokens.output))}
      {line(say.cacheReads, tokensText(project.tokens.cacheRead))}
      {line(say.sessions, String(project.sessions))}
      {models.map(([model, sum]) => line(model, tokensText(spent(sum))))}
    </Box>
  ))
}

function agentsBlock(ui: Ui, project: Project) {
  const { Box, Text } = ui
  const say = words()
  if (project.kinds.length === 0) return section(ui, 'agents', say.agents, <Text dimColor>{say.noAgents}</Text>)

  return section(ui, 'agents', say.agents, (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column">
        {project.kinds.map(kind => <Text key={kind.type}>{kind.type} <Text dimColor>{say.agentLine(kind.runs, tokensText(kind.tokens), spanText(kind.ms))}</Text></Text>)}
      </Box>
      <Box flexDirection="column">
        <Text dimColor>{say.recent}</Text>
        {project.runs.slice(0, MAX_RUNS).map((run, index) => <Text key={`r${index}`} color={run.isLive ? 'claude' : undefined} dimColor={!run.isLive}>{run.isLive ? '● ' : ''}{run.description || run.type} · {tokensText(run.tokens)}</Text>)}
      </Box>
    </Box>
  ))
}

export function detailPane(ui: Ui, view: PaneView, project: Project) {
  const { Box, Text, Button } = ui
  const say = words()

  return (
    <Box flexDirection="column" gap={1} alignItems="flex-start">
      {view.error === '' ? null : <Text key="err" color="error">{say.failed(view.error)}</Text>}
      {view.home as never}
      {flush(ui, 'back-row', <Button key="back" label={say.back} plain dimColor onPress={() => view.acts.select('')} />)}
      <Box key="name" flexDirection="column">
        <Text bold>{project.name}{project.isLive ? ` · ${say.live}` : ''}</Text>
        <Text dimColor>{project.root}</Text>
        {(project.also ?? []).map(root => <Text key={`also:${root}`} dimColor>{say.alsoAt(root)}</Text>)}
      </Box>
      {percentBlock(ui, view, project)}
      {leftOffBlock(ui, view, project)}
      {plansBlock(ui, view, project)}
      {tokensBlock(ui, project)}
      {agentsBlock(ui, project)}
      {flush(ui, 'hide-row', <Button key="hide" label={say.hide} plain dimColor onPress={() => view.acts.hide(project.root)} />)}
    </Box>
  )
}

export function paneTree(ui: Ui, view: PaneView) {
  const project = view.snapshot?.projects.find(one => one.root === view.selected)

  return project === undefined ? listPane(ui, view) : detailPane(ui, view, project)
}
