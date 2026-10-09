import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeKey } from 'claude-code'

import { BAND_H, bandSvg } from './band-svg'
import { t } from './i18n'
import type { JobView } from './job'
import { deriveJob, percentText } from './job'
import { PANE } from './state'

// State refs live in each file that reads them: the scan follows literals, not imports.
const agents = atom({ plugin: 'savvy-progress', key: 'agents' } as const, [])
const flow = atom({ plugin: 'savvy-progress', key: 'flow' } as const, null)
const job = atom({ plugin: 'savvy-progress', key: 'job' } as const, null)
const now = atom({ plugin: 'savvy-progress', key: 'now' } as const, 0)
const tasks = atom({ plugin: 'savvy-progress', key: 'tasks' } as const, [])

type On = Parameters<Register>[0]
type Ui = Record<string, any>

// About 8 CSS px per reported column; the rest is the crew count, the dismiss and their gaps.
const PX_PER_COL = 8
const BUTTONS_PX = 96
const MIN_W = 180
const MAX_W = 1600
const TERM_TITLE_MAX = 30
const TERM_BAR_MAX = 40
const TERM_FIXED = 36

// Opens the agents pane, or closes it when it is up; true when it ends up open.
async function togglePane($: EngineInterface): Promise<boolean> {
  const isOpen = (await $.ui.panes()).some(p => p.id === PANE)
  if (isOpen) {
    await $.ui.close({ id: PANE })
    return false
  }
  const at = await $.clock.now()
  await update($, now, () => at)
  await $.ui.open({ id: PANE, title: t().pane })
  return true
}

// Hides the band until the next request launches agents or reports progress.
async function dismiss($: EngineInterface): Promise<void> {
  await update($, flow, () => null)
  await update($, job, prev => (prev ? { ...prev, isSealed: true, isHidden: true } : prev))
}

const keyOfView = (view: JobView): ThemeKey => {
  if (!view.isFinished) return 'suggestion'
  return view.failed ? 'warning' : 'success'
}

function buttons(ui: Ui, $: EngineInterface, view: JobView) {
  const { Button } = ui
  return [
    <Button key="savvy-agents" label={`×${view.crew}`} plain onPress={() => void togglePane($)} />,
    <Button key="savvy-dismiss" label="✕" plain role="dismiss" onPress={() => dismiss($)} />,
  ]
}

function desktopBand(ui: Ui, $: EngineInterface, view: JobView, cols: number) {
  const { Box, Svg } = ui
  const width = Math.max(MIN_W, Math.min(MAX_W, (cols || 100) * PX_PER_COL - BUTTONS_PX))
  return (
    <Box key="savvy-band" flexDirection="row" alignItems="center" gap={1}>
      <Svg source={bandSvg(view, width)} alt={`${view.title}: ${view.label}, ${percentText(view)}`} width={width} height={BAND_H} />
      {buttons(ui, $, view)}
    </Box>
  )
}

// `━` done, `┄` handed out, `─` still to come.
const termTrack = (view: JobView, width: number): [string, string] => {
  const filled = Math.round(width * (view.ratio ?? 0))
  const handed = Math.max(filled, Math.round(width * view.launched))
  return ['━'.repeat(filled), '┄'.repeat(handed - filled) + '─'.repeat(Math.max(0, width - handed))]
}

function terminalBand(ui: Ui, $: EngineInterface, view: JobView, cols: number) {
  const { Box, Text } = ui
  const titleW = Math.max(8, Math.min(TERM_TITLE_MAX, view.title.length + 2, Math.floor(cols / 3)))
  const [done, rest] = termTrack(view, Math.max(6, Math.min(TERM_BAR_MAX, cols - titleW - TERM_FIXED)))
  const key = keyOfView(view)
  return (
    <Box key="savvy-band" flexDirection="row" gap={1}>
      <Box width={titleW} flexShrink={0}>
        <Text color={key}>● </Text>
        <Text wrap="truncate-end">{view.title}</Text>
      </Box>
      <Text>
        <Text color={key}>{done}</Text>
        <Text dimColor>{rest}</Text>
      </Text>
      <Text bold>{view.label}</Text>
      <Text dimColor>{`· ${percentText(view)}`}</Text>
      {buttons(ui, $, view)}
    </Box>
  )
}

async function viewOf($: EngineInterface): Promise<JobView | null> {
  return deriveJob({ flow: await read($, flow), agents: await read($, agents), job: await read($, job), tasks: await read($, tasks) })
}

// The band contract: the engine's and other plugins' rows are drawn first and kept;
// progress stacks above them, and a survey gets the band to itself.
export function onBand(on: On): void {
  on('command.run', { command: 'agents-info' }, async $ => {
    const isOpen = await togglePane($)
    return { text: isOpen ? t().opened : t().closed }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const theirs = await next(e)
    const view = await viewOf($)
    if (!view) return theirs
    const ui = $.ui.resolve(e) as Ui
    const { Box } = ui
    const mine = e.surface !== 'terminal' && 'Svg' in ui ? desktopBand(ui, $, view, e.props.bodyColumns) : terminalBand(ui, $, view, e.props.bodyColumns)
    return (
      <Box flexDirection="column">
        {mine}
        {theirs}
      </Box>
    )
  })
}
