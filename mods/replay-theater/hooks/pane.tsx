import { buttons } from './buttons'
import type { PaneHandlers } from './buttons'
import { diffSvg } from './diff-svg'
import type { Ui } from './offer'
import { baseName, detailSvg, overviewSvg, totals } from './pane-svg'
import type { PaneModel } from './pane-svg'
import { terminalView } from './terminal'
import { escape, eyebrow, widthFor, wrap } from './ui/svg'
import { svgDoc } from './ui/theme'
import type { Theme } from './ui/theme'

export type PaneSite = { surface: string; columns: number; inBand: boolean; maxRows: number }

const PANE_GUTTER_COLUMNS = 3
// The sideways scrollbar of a diff wider than the pane takes this much under it.
const SCROLLBAR_ROOM = 12
// The replay outlives turns without edits, so an empty pane means none yet this session.
const EMPTY_LEAD = 'Henüz düzenleme yok'
const EMPTY_REST = 'Claude dosya düzenleyen bir turu bitirince adımlar burada oynatılır.'
export const EMPTY_TEXT = `${EMPTY_LEAD}. ${EMPTY_REST}`
const EMPTY_LEAD_Y = 40
const EMPTY_LINE_H = 19
const EMPTY_REST_SIZE = 13

function altOf(model: PaneModel): string {
  const sum = totals(model.steps)
  const step = model.steps[model.index]

  return `${sum.files} dosyada ${model.steps.length} düzenleme; şu an ${model.index + 1}. düzenleme: ${step === undefined ? '' : baseName(step.file)}`
}

function desktopView(ui: Ui, model: PaneModel, on: PaneHandlers) {
  const { Box, Svg } = ui
  const overview = overviewSvg(model)
  const detail = detailSvg(model)
  const step = model.steps[model.index]
  const diff = diffSvg({ lines: step?.diff ?? [], width: model.width, theme: model.theme })
  // A wider diff is drawn live in its own frame, which scrolls it sideways instead of cutting its lines.
  const isWide = diff.contentWidth > model.width
  const wide = isWide ? { isInteractive: true, height: diff.height + SCROLLBAR_ROOM } : { height: diff.height }

  return (
    <Box key="rt-pane" flexDirection="column" gap={1} paddingX={1} paddingY={1}>
      <Svg key="rt-overview" source={overview.source} alt={altOf(model)} width={model.width} height={overview.height} />
      <Svg key="rt-detail" source={detail.source} alt={step?.said ?? (step === undefined ? '' : step.file)} width={model.width} height={detail.height} />
      <Svg key="rt-diff" source={diff.source} alt="Değişiklik: silinen ve eklenen satırlar" width={model.width} {...wide} />
      {buttons(ui, model, on)}
    </Box>
  )
}

// The eyebrow, the lead and one sentence under it.
function emptySvg(width: number, theme: Theme): { source: string; height: number } {
  const rest = wrap(EMPTY_REST, { width, size: EMPTY_REST_SIZE, maxLines: 2 })
  const lead = `<text x="0" y="${EMPTY_LEAD_Y}" class="headline hi">${EMPTY_LEAD}</text>`
  const lines = rest.map((part, n) => `<text x="0" y="${EMPTY_LEAD_Y + (n + 1) * EMPTY_LINE_H + 2}" class="mid" font-size="${EMPTY_REST_SIZE}">${escape(part)}</text>`)
  const height = EMPTY_LEAD_Y + rest.length * EMPTY_LINE_H + 10
  const body = `<rect x="0" y="5" width="6" height="6" rx="1.5" fill="var(--plan)"/><text x="13" y="12" class="eyebrow f-plan">${eyebrow('Tekrar')}</text>${lead}${lines.join('')}`

  return { source: svgDoc({ width, height, theme }, body), height }
}

function emptyView(ui: Ui, spec: { surface: string; width: number; theme: Theme; on: PaneHandlers }) {
  const { Box, Text, Button, Svg } = ui
  const close = <Button key="rt-close" plain hotkey="c" label="Kapat" onPress={spec.on.onClose} />
  if (spec.surface === 'terminal' || !('Svg' in ui)) {
    return (
      <Box key="rt-empty" flexDirection="column" gap={1} paddingX={1}>
        <Text color="merged" bold>{'● TEKRAR'}</Text>
        <Text bold>{EMPTY_LEAD}</Text>
        <Text dimColor>{EMPTY_REST}</Text>
        <Box flexDirection="row">{close}</Box>
      </Box>
    )
  }
  const drawn = emptySvg(spec.width, spec.theme)

  return (
    <Box key="rt-empty" flexDirection="column" gap={1} paddingX={1} paddingY={1}>
      <Svg key="rt-empty-svg" source={drawn.source} alt={EMPTY_TEXT} width={spec.width} height={drawn.height} />
      <Box flexDirection="row">{close}</Box>
    </Box>
  )
}

export function replayView(ui: Ui, model: Omit<PaneModel, 'width'>, site: PaneSite & { on: PaneHandlers }) {
  const width = widthFor(site.columns - PANE_GUTTER_COLUMNS, { min: 280, max: 720 })
  if (model.steps.length === 0) return emptyView(ui, { surface: site.surface, width, theme: model.theme, on: site.on })
  const index = Math.max(0, Math.min(model.index, model.steps.length - 1))
  const full = { ...model, index, width }
  if (site.surface === 'terminal' || site.inBand || !('Svg' in ui)) {
    return terminalView(ui, full, { isCompact: site.inBand, maxRows: site.maxRows, on: site.on })
  }

  return desktopView(ui, full, site.on)
}
