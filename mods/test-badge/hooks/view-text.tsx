import { failuresOf, isFailing } from './parse'
import { chipsOf, durationText, eyebrowRole, groupsOf, headlineOf, runMeta, suiteTag } from './summary'
import type { Tone } from './summary'
import { upper } from './svg'
import { THEME_KEY } from './tidemark'
import { ciPart } from './ci-view'
import type { PaneView } from './view'
import { words } from './words'
import type { CheckOutcome, Failure } from '../types'

// The pane in text (terminal): the same parts as the desktop's, in theme colors and glyphs.
type Ui = Record<string, any>

const LINE_WIDTH = 4
const ROW_INDENT = 4
const ROW_GLYPH = '› '
const NAME_GAP = '  '
const MESSAGE_INDENT = ROW_GLYPH.length + LINE_WIDTH + NAME_GAP.length
const BAR_MAX = 40
const BAR_MIN = 8

const colorOf = (tone: Tone): { color?: string; dimColor?: boolean } => (tone === 'neutral' ? { dimColor: true } : { color: THEME_KEY[tone] })
const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text)

// A failing check whose output no parser could place: say so, and keep the output's last lines.
export type CheckName = 'tests' | 'lint'

export function unplacedOf(spec: { name: CheckName; outcome: CheckOutcome | null }): { title: string; lines: string[] } | null {
  const { outcome } = spec
  if (outcome === null || outcome.status === 'pass' || outcome.failures.length > 0) return null
  const says = words()
  const why: Partial<Record<CheckOutcome['status'], string>> = { timeout: says.whyTimeout, error: says.whyNotStarted }

  return { title: `${says.checkNames[spec.name]} ${why[outcome.status] ?? says.whyUnread}`, lines: outcome.tail }
}

export function chipRow(ui: Ui, view: PaneView) {
  const { Box, Button } = ui

  return (
    <Box flexDirection="row" columnGap={1} flexWrap="wrap">
      {chipsOf(view.badge, view.filter).map(chip => {
        const isOn = chip.filter === view.filter
        const look = isOn ? { variant: 'secondary' } : { plain: true, dimColor: chip.count === 0 }

        return <Button key={`tb-filter-${chip.filter}`} label={`${chip.label} ${chip.count}`} {...look} onPress={() => view.onFilter(chip.filter)} />
      })}
    </Box>
  )
}

export function rerunRow(ui: Ui, view: PaneView) {
  const { Box, Button } = ui
  const label = view.badge.finishedAt === null ? words().runNow : words().runAgain

  return (
    <Box flexDirection="row">
      <Button key="tb-rerun" variant="secondary" hotkey="r" label={label} onPress={view.onRerun} />
    </Box>
  )
}

function barText(ui: Ui, view: PaneView) {
  const { Box, Text } = ui
  const tests = view.badge.tests
  if (tests === null || tests.total === null || tests.passed === null || tests.total === 0) return null
  const width = Math.max(BAR_MIN, Math.min(BAR_MAX, view.columns - 2))
  const passed = Math.round((width * tests.passed) / tests.total)

  return (
    <Box flexDirection="row">
      <Text color="success">{'━'.repeat(passed)}</Text>
      <Text color="error">{'━'.repeat(width - passed)}</Text>
    </Box>
  )
}

function rowText(ui: Ui, view: PaneView, failure: Failure) {
  const { Box, Text, Button } = ui
  const index = failuresOf(view.badge).indexOf(failure)
  const line = failure.line === null ? '' : String(failure.line)
  const meta = [suiteTag(failure.suite), durationText(failure.durationMs)].filter(part => part !== '').join(' · ')
  const label = clip(`${ROW_GLYPH}${line.padStart(LINE_WIDTH)}${NAME_GAP}${failure.name}`, view.columns - ROW_INDENT - meta.length - 2)

  return (
    <Box key={`tb-row-${index}`} flexDirection="column" paddingLeft={ROW_INDENT}>
      <Box flexDirection="row" columnGap={1}>
        {failure.file === null ? <Text>{label}</Text> : <Button key={`tb-open-${index}`} plain label={label} onPress={() => view.onOpen(failure)} />}
        <Text dimColor>{meta}</Text>
      </Box>
      {failure.message !== '' && (
        <Box paddingLeft={MESSAGE_INDENT}>
          <Text dimColor wrap="wrap">{failure.message}</Text>
        </Box>
      )}
    </Box>
  )
}

function failuresText(ui: Ui, view: PaneView) {
  const { Box, Text } = ui

  return groupsOf(view.badge, view.filter).map(group => (
    <Box key={`tb-file-${group.file ?? '-'}`} flexDirection="column">
      <Box flexDirection="row" columnGap={1}>
        <Text bold wrap="truncate-start">{`  ${group.file ?? words().noFile}`}</Text>
        <Text dimColor>{`· ${words().errorCount(group.failures.length)}`}</Text>
      </Box>
      {group.failures.map(failure => rowText(ui, view, failure))}
    </Box>
  ))
}

function tailText(ui: Ui, spec: { name: CheckName; outcome: CheckOutcome | null }) {
  const { Box, Text } = ui
  const unplaced = unplacedOf(spec)
  if (unplaced === null) return null

  return (
    <Box key={`tb-tail-${spec.name}`} flexDirection="column">
      <Text bold>{unplaced.title}</Text>
      {unplaced.lines.map((line, index) => <Text key={`tb-tail-${spec.name}-${index}`} dimColor wrap="wrap">{`   ${line}`}</Text>)}
    </Box>
  )
}

// No run yet: the eyebrow, one sentence and the one action.
function emptyText(ui: Ui, view: PaneView) {
  const { Box, Text } = ui

  return (
    <Box flexDirection="column">
      <Text color={THEME_KEY.tide} bold>{`● ${upper(words().eyebrowTests)}`}</Text>
      <Box key="tb-empty">
        <Text wrap="wrap">
          <Text bold>{words().emptyLead}</Text>
          <Text dimColor>{` · ${words().emptyHow}`}</Text>
        </Text>
      </Box>
      <Text> </Text>
      {rerunRow(ui, view)}
      {view.ci !== null && <Text> </Text>}
      {ciPart(ui, view)}
    </Box>
  )
}

export function textPane(ui: Ui, view: PaneView) {
  const { Box, Text } = ui
  const { badge } = view
  if (badge.finishedAt === null && !badge.isRunning) return emptyText(ui, view)
  const head = headlineOf(badge)
  const role = eyebrowRole(badge)

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" justifyContent="space-between" columnGap={1}>
        <Text color={THEME_KEY[role]} bold>{`${badge.isRunning ? '◐' : '●'} ${upper(words().eyebrowResults)}`}</Text>
        <Text dimColor>{runMeta(badge, view.now)}</Text>
      </Box>
      <Box flexDirection="row">
        <Text bold {...colorOf(head.tone)}>{head.lead}</Text>
        <Text bold>{head.rest}</Text>
      </Box>
      {barText(ui, view)}
      <Text> </Text>
      {isFailing(badge) && chipRow(ui, view)}
      {isFailing(badge) && failuresText(ui, view)}
      {isFailing(badge) && view.filter === 'all' && tailText(ui, { name: 'tests', outcome: badge.tests })}
      {isFailing(badge) && view.filter === 'all' && tailText(ui, { name: 'lint', outcome: badge.lint })}
      <Text> </Text>
      {rerunRow(ui, view)}
      {view.ci !== null && <Text> </Text>}
      {ciPart(ui, view)}
    </Box>
  )
}
