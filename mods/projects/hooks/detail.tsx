import { spent } from './build'
import { agoText, foldText, isFaded, percentText, shortPath, spanText, tokensText } from './format'
import { PressRow } from './kit/press'
import { headerPic, isPlanTitleCut, nextPic, planPic, statsPic } from './svg-detail'
import { busyText, flush, groupLabel, rowWidth } from './view'
import type { PaneView, Ui } from './view'
import { words } from './words'
import type { PlanRow, Project } from '../types'

// One project: a compact head, the next step raised, then where it stopped, its plans and its figures, each folded to
// what a glance needs. Words stay plain Text so they wrap and can be selected; the drawings are for size and alignment.

const MAX_RUNS = 8
const PLANS_SHOWN = 5
const STORY_LINES = 4
// A pane's text runs about this many characters to a reported column: enough to fold near a line's end at any width.
const CHARS_PER_COLUMN = 1.2
const FOLD = { story: 'story', plans: 'plans', details: 'details' }

const foldButton = (ui: Ui, view: PaneView, spec: { name: string; closed: string; open: string }) => {
  const { Button } = ui
  const isOpen = view.unfolded.includes(spec.name)

  return flush(ui, `fold:${spec.name}:row`, <Button key={`fold:${spec.name}`} label={isOpen ? spec.open : spec.closed} plain dimColor onPress={() => view.acts.toggleFold(spec.name)} />)
}

const section = (ui: Ui, view: PaneView, spec: { key: string; title: string }, children: unknown) => {
  const { Box } = ui

  return (
    <Box key={spec.key} flexDirection="column" gap={1}>
      {groupLabel(ui, view, spec.title)}
      <Box key="body" flexDirection="column" gap={1} alignItems="flex-start">{children as never}</Box>
    </Box>
  )
}

function estimateControl(ui: Ui, view: PaneView, project: Project) {
  const { Button, Text } = ui
  const say = words()
  if (view.busy !== null) return <Text key="busy" dimColor>{busyText(view.busy)}</Text>
  const press = () => view.acts.estimateOne(project.root)
  // With no number yet it is the one thing to do here; otherwise a quiet link.
  if (project.percent.value === null) return <Button key="one" label={say.estimate} variant="secondary" onPress={press} />

  return flush(ui, 'one-row', <Button key="one" label={say.estimateAgain} plain dimColor onPress={press} />)
}

function headBlock(ui: Ui, view: PaneView, project: Project) {
  const { Box, Text, Svg } = ui
  const say = words()
  const { percent } = project
  const path = shortPath(project.root, view.homeDir)
  const basis = percent.kind === 'estimate'
    ? say.basisEstimate(agoText(percent.at, view.nowMs), percent.basis)
    : percent.kind === 'ticks' ? say.basisTicks(percent.basis) : say.noneHow
  const head = view.isText
    ? (
        <Box key="head" flexDirection="column">
          <Text bold>{project.name}{project.isLive ? ` · ${say.live}` : ''}</Text>
          <Text dimColor>{path}</Text>
          <Text bold>{percent.value === null ? say.none : percentText(percent)}</Text>
        </Box>
      )
    : <Svg key="head" {...view.motion.pic(`head:${project.root}`, headerPic(project, { width: rowWidth(view.columns), path }))} />

  return (
    <Box key="top" flexDirection="column" gap={1} alignItems="flex-start">
      {head}
      {(project.also ?? []).map(root => <Text key={`also:${root}`} dimColor>{say.alsoAt(shortPath(root, view.homeDir))}</Text>)}
      <Text key="basis" dimColor>{basis}</Text>
      {isFaded(percent, view.nowMs) ? <Text key="stale" color="warning">{percent.isStale ? say.basisStale : say.basisOld}</Text> : null}
      {estimateControl(ui, view, project)}
    </Box>
  )
}

// What to do next: the estimate's own step, else what the last task list left open.
const nextOf = (project: Project): string => {
  const tasks = project.leftOff?.tasks ?? []

  return project.estimate?.next || (tasks.find(task => task.status === 'in_progress') ?? tasks.find(task => task.status === 'pending'))?.subject || ''
}

function nextBlock(ui: Ui, view: PaneView, project: Project) {
  const { Svg, Text } = ui
  const next = nextOf(project)
  if (next === '') return null
  if (view.isText) return <Text key="next"><Text bold>{words().next}: </Text>{next}</Text>

  return <Svg key="next" {...view.motion.pic(`next:${project.root}`, nextPic(next, rowWidth(view.columns)))} />
}

const taskMark = (status: string): string => (status === 'completed' ? '✓' : status === 'in_progress' ? '●' : '○')

function leftOffBlock(ui: Ui, view: PaneView, project: Project) {
  const { Box, Text } = ui
  const say = words()
  const left = project.leftOff
  const tasks = left?.tasks ?? []
  const done = tasks.filter(task => task.status === 'completed').length
  const isOpen = view.unfolded.includes(FOLD.story)
  const line = Math.round(view.columns * CHARS_PER_COLUMN)
  const story = foldText(left?.recap || left?.reply || '', line * STORY_LINES)
  const asked = foldText(left?.prompt ?? '', line)
  const running = tasks.filter(task => task.status === 'in_progress')
  const canFold = story.isCut || asked.isCut || running.length < tasks.length
  const age = project.isLive ? say.live : agoText(Date.parse(project.lastAt) || 0, view.nowMs)
  const shownTasks = isOpen ? tasks : running

  return section(ui, view, { key: 'left', title: say.leftOff }, [
    <Text key="when" dimColor>{age}{project.git === null ? '' : ` · ${say.branch(project.git.branch, project.git.dirty)}`}</Text>,
    story.text === '' ? null : <Text key="story">{isOpen ? (left?.recap || left?.reply) : story.text}</Text>,
    <Box key="traces" flexDirection="column">
      {asked.text === '' ? null : <Text key="asked" dimColor>{say.lastAsked}: {isOpen ? left?.prompt : asked.text}</Text>}
      {project.git === null ? null : <Text key="commit" dimColor>{say.lastCommit}: {project.git.subject}</Text>}
      {tasks.length === 0 ? null : <Text key="tasks" dimColor>{say.taskList(done, tasks.length)}</Text>}
      {shownTasks.map((task, index) => <Text key={`task${index}`} dimColor={task.status !== 'in_progress'}>{taskMark(task.status)} {task.subject}</Text>)}
    </Box>,
    canFold ? foldButton(ui, view, { name: FOLD.story, closed: say.readMore, open: say.readLess }) : null,
  ])
}

function planRow(ui: Ui, view: PaneView, plan: PlanRow) {
  const { Box, Button, Svg, Text } = ui
  const say = words()
  const width = rowWidth(view.columns)
  const isOpen = view.openPlan === plan.path
  const press = () => view.acts.togglePlan(plan.path)
  const count = plan.done > 0 ? `${plan.done}/${plan.total}` : `${plan.total} · ${say.unmarked}`
  const row = view.isText
    ? flush(ui, `${plan.path}:row`, <Button key={`${plan.path}:b`} label={`${isOpen ? '▾' : '▸'} ${plan.title} (${count})`} plain onPress={press} />)
    : PressRow(ui as never, { box: `${plan.path}:row`, key: `${plan.path}:b`, drawing: <Svg key={`${plan.path}:s`} {...planPic(plan, { width, isOpen })} />, onPress: press })

  return (
    <Box key={plan.path} flexDirection="column" alignItems="flex-start">
      {row}
      {isOpen && !view.isText && isPlanTitleCut(plan, width) ? <Text key="title">{plan.title}</Text> : null}
      {isOpen ? plan.steps.map((step, index) => <Text key={`${plan.path}:${index}`} dimColor={step.isDone}>{plan.done > 0 ? (step.isDone ? '✓ ' : '○ ') : '· '}{step.title}</Text>) : null}
    </Box>
  )
}

function plansBlock(ui: Ui, view: PaneView, project: Project) {
  const { Box, Text } = ui
  const say = words()
  const { plans } = project
  if (plans.length === 0) return section(ui, view, { key: 'plans', title: say.plans(0) }, <Text key="none" dimColor>{say.noPlans}</Text>)
  const isAll = view.unfolded.includes(FOLD.plans)
  const shown = isAll ? plans : plans.slice(0, PLANS_SHOWN)

  return section(ui, view, { key: 'plans', title: say.plans(plans.length) }, [
    <Box key="rows" flexDirection="column" alignItems="flex-start">{shown.map(plan => planRow(ui, view, plan))}</Box>,
    plans.length > PLANS_SHOWN ? foldButton(ui, view, { name: FOLD.plans, closed: say.allPlans(plans.length), open: say.fewerPlans }) : null,
  ])
}

function detailsBlock(ui: Ui, project: Project) {
  const { Box, Text } = ui
  const say = words()
  const models = Object.entries(project.byModel).sort((a, b) => spent(b[1]) - spent(a[1]))
  const line = (label: string, value: string) => <Text key={label}><Text dimColor>{label}: </Text>{value}</Text>

  return (
    <Box key="details" flexDirection="column" gap={1}>
      <Box key="tokens" flexDirection="column">
        {line(say.output, tokensText(project.tokens.output))}
        {line(say.cacheReads, tokensText(project.tokens.cacheRead))}
        {models.map(([model, sum]) => line(model, tokensText(spent(sum))))}
      </Box>
      {project.kinds.length === 0 ? <Text key="none" dimColor>{say.noAgents}</Text> : (
        <Box key="kinds" flexDirection="column">
          {project.kinds.map(kind => <Text key={kind.type}>{kind.type} <Text dimColor>{say.agentLine(kind.runs, tokensText(kind.tokens), spanText(kind.ms))}</Text></Text>)}
        </Box>
      )}
      {project.runs.length === 0 ? null : (
        <Box key="runs" flexDirection="column">
          <Text dimColor>{say.recent}</Text>
          {project.runs.slice(0, MAX_RUNS).map((run, index) => <Text key={`r${index}`} color={run.isLive ? 'claude' : undefined} dimColor={!run.isLive}>{run.isLive ? '● ' : ''}{run.description || run.type} · {tokensText(run.tokens)}</Text>)}
        </Box>
      )}
    </Box>
  )
}

function usageBlock(ui: Ui, view: PaneView, project: Project) {
  const { Svg, Text } = ui
  const say = words()
  const stats = [
    { label: say.spent, value: tokensText(spent(project.tokens)) },
    { label: say.week, value: tokensText(project.week) },
    { label: say.sessions, value: String(project.sessions) },
    { label: say.agentRuns, value: String(project.kinds.reduce((sum, kind) => sum + kind.runs, 0)) },
  ]

  return section(ui, view, { key: 'usage', title: say.usage }, [
    view.isText
      ? <Text key="stats">{stats.map(stat => `${stat.label} ${stat.value}`).join(' · ')}</Text>
      : <Svg key="stats" {...view.motion.pic(`stats:${project.root}`, statsPic(stats, rowWidth(view.columns)))} />,
    view.unfolded.includes(FOLD.details) ? detailsBlock(ui, project) : null,
    foldButton(ui, view, { name: FOLD.details, closed: say.moreDetails, open: say.lessDetails }),
  ])
}

export function detailPane(ui: Ui, view: PaneView, project: Project) {
  const { Box, Text, Button } = ui
  const say = words()

  return (
    <Box flexDirection="column" gap={3} alignItems="flex-start">
      {view.error === '' ? null : <Text key="err" color="error">{say.failed(view.error)}</Text>}
      {flush(ui, 'back-row', <Button key="back" label={say.back} plain dimColor onPress={() => view.acts.select('')} />)}
      {headBlock(ui, view, project)}
      {nextBlock(ui, view, project)}
      {leftOffBlock(ui, view, project)}
      {plansBlock(ui, view, project)}
      {usageBlock(ui, view, project)}
      {flush(ui, 'hide-row', <Button key="hide" label={say.hide} plain dimColor onPress={() => view.acts.hide(project.root)} />)}
    </Box>
  )
}
