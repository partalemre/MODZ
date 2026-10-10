import { buttons } from './buttons'
import type { PaneHandlers } from './buttons'
import { countChanges } from './diff'
import { MAX_DIFF_LINES } from './diff-svg'
import type { Ui } from './offer'
import { baseName, folderOf, totals, windowOf } from './pane-svg'
import type { PaneModel } from './pane-svg'
import type { ReplayDiffLine, ReplayStep } from '../types'

const BAND_CHROME_ROWS = 7
const MIN_DIFF_ROWS = 3
const ROW_BG: Record<string, string> = { '-': 'diffRemoved', '+': 'diffAdded' }
const WORD_BG: Record<string, string> = { '-': 'diffRemovedWord', '+': 'diffAddedWord' }

type TerminalSite = { isCompact: boolean; maxRows: number; on: PaneHandlers }

function glyphOf(k: number, index: number): { glyph: string; color?: string } {
  if (k === index) return { glyph: '●', color: 'merged' }

  return k < index ? { glyph: '✓', color: 'subtle' } : { glyph: '○' }
}

function stepRow(ui: Ui, step: ReplayStep, at: { k: number; index: number }) {
  const { Box, Text } = ui
  const { add, del } = countChanges(step.diff)
  const look = glyphOf(at.k, at.index)
  const isCurrent = at.k === at.index

  return (
    <Box key={`rt-row-${at.k}`} flexDirection="row" columnGap={1}>
      <Text color={look.color} dimColor={look.color === undefined}>{look.glyph}</Text>
      <Box flexShrink={1}>
        <Text bold={isCurrent} dimColor={at.k < at.index} wrap="truncate-end">{`${at.k + 1}. ${baseName(step.file)}`}</Text>
      </Box>
      {folderOf(step.file) !== '' && <Text dimColor wrap="truncate-start">{folderOf(step.file)}</Text>}
      <Box flexGrow={1} />
      <Text color="success">{`+${add}`}</Text>
      <Text color="error">{`−${del}`}</Text>
    </Box>
  )
}

function diffRow(ui: Ui, line: ReplayDiffLine, key: string) {
  const { Text } = ui
  if (line.op === '~' || line.op === ' ') return <Text key={key} dimColor wrap="truncate-end">{`  ${line.op === '~' ? '⋯' : line.t}`}</Text>
  const sign = line.op === '-' ? '−' : '+'
  const span = line.span
  const parts = span === undefined ? [line.t] : [line.t.slice(0, span.start), line.t.slice(span.start, span.end), line.t.slice(span.end)]

  return (
    <Text key={key} backgroundColor={ROW_BG[line.op]} wrap="truncate-end">
      {`${sign} ${parts[0]}`}
      {parts.length > 1 && <Text backgroundColor={WORD_BG[line.op]}>{parts[1]}</Text>}
      {parts.length > 1 && parts[2]}
    </Text>
  )
}

function contextRows(ui: Ui, step: ReplayStep, isPending: boolean) {
  const { Text } = ui
  const rows = []
  if (step.said !== undefined) rows.push(<Text key="rt-said" wrap="wrap">{`› ${step.said}`}</Text>)
  else if (isPending) rows.push(<Text key="rt-said" dimColor>{'◐ açıklanıyor'}</Text>)
  if (step.plan !== undefined) {
    rows.push(
      <Text key="rt-plan" wrap="truncate-end">
        <Text color="merged">{`◆ Plan adımı ${step.plan.index}/${step.plan.total}`}</Text>
        <Text dimColor>{` · ${step.plan.title}`}</Text>
      </Text>,
    )
  }

  return rows
}

function header(ui: Ui, model: PaneModel) {
  const { Box, Text } = ui
  const sum = totals(model.steps)
  const ask = model.ask ?? ''

  return (
    <Box key="rt-head" flexDirection="column">
      <Box flexDirection="row" columnGap={1}>
        <Text bold>{`${sum.files} dosyada ${model.steps.length} düzenleme`}</Text>
        {(model.age ?? '') !== '' && <Text dimColor>{`· ${model.age}`}</Text>}
        <Box flexGrow={1} />
        <Text color="success">{`+${sum.add}`}</Text>
        <Text color="error">{`−${sum.del}`}</Text>
      </Box>
      {ask !== '' && <Text dimColor italic wrap="truncate-end">{`“${ask}”`}</Text>}
    </Box>
  )
}

export function terminalView(ui: Ui, model: PaneModel, site: TerminalSite) {
  const { Box, Text } = ui
  const step = model.steps[model.index] as ReplayStep
  const shown = windowOf(model.steps.length, model.index)
  const maxDiff = site.isCompact ? Math.max(MIN_DIFF_ROWS, Math.min(MAX_DIFF_LINES, site.maxRows - BAND_CHROME_ROWS)) : MAX_DIFF_LINES
  const lines = step.diff.slice(0, maxDiff)
  const meta = [folderOf(step.file) || 'proje kökü', step.tool, step.note].filter(Boolean).join(' · ')

  return (
    <Box key="rt-pane" flexDirection="column" paddingX={1}>
      {!site.isCompact && header(ui, model)}
      {!site.isCompact && model.steps.slice(shown.start, shown.end).map((one, n) => stepRow(ui, one, { k: shown.start + n, index: model.index }))}
      <Box key="rt-eyebrow" marginTop={site.isCompact ? 0 : 1}>
        <Text color="merged" bold>{`● DÜZENLEME ${model.index + 1} / ${model.steps.length}`}</Text>
      </Box>
      <Box key="rt-file" flexDirection="row" columnGap={1}>
        <Text bold>{baseName(step.file)}</Text>
        <Text dimColor wrap="truncate-start">{meta}</Text>
      </Box>
      {contextRows(ui, step, model.explain === 'pending')}
      <Box key="rt-diff" flexDirection="column">
        {lines.map((line, n) => diffRow(ui, line, `rt-d${n}`))}
        {step.diff.length > maxDiff && <Text key="rt-more" dimColor>{`  … ${step.diff.length - maxDiff} satır daha`}</Text>}
        {step.diff.length === 0 && <Text key="rt-empty" dimColor>{'  (satır değişikliği yok)'}</Text>}
      </Box>
      {buttons(ui, model, site.on)}
    </Box>
  )
}
