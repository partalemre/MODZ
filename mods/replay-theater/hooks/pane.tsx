import { buttons } from './buttons'
import type { PaneHandlers } from './buttons'
import { diffSvg } from './diff-svg'
import type { Ui } from './offer'
import { baseName, detailSvg, overviewSvg, totals } from './pane-svg'
import type { PaneModel } from './pane-svg'
import { terminalView } from './terminal'
import { widthFor } from './ui/svg'

export type PaneSite = { surface: string; columns: number; inBand: boolean; maxRows: number }

const PANE_GUTTER_COLUMNS = 3

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

  return (
    <Box key="rt-pane" flexDirection="column" gap={1} paddingX={1} paddingY={1}>
      <Svg key="rt-overview" source={overview.source} alt={altOf(model)} width={model.width} height={overview.height} />
      <Svg key="rt-detail" source={detail.source} alt={step?.said ?? (step === undefined ? '' : step.file)} width={model.width} height={detail.height} />
      <Svg key="rt-diff" source={diff.source} alt="Değişiklik: silinen ve eklenen satırlar" width={model.width} height={diff.height} />
      {buttons(ui, model, on)}
    </Box>
  )
}

export function replayView(ui: Ui, model: Omit<PaneModel, 'width'>, site: PaneSite & { on: PaneHandlers }) {
  const { Text } = ui
  if (model.steps.length === 0) return <Text dimColor>{'Tekrar edilecek düzenleme yok.'}</Text>
  const index = Math.max(0, Math.min(model.index, model.steps.length - 1))
  const width = widthFor(site.columns - PANE_GUTTER_COLUMNS, { min: 280, max: 720 })
  const full = { ...model, index, width }
  if (site.surface === 'terminal' || site.inBand || !('Svg' in ui)) {
    return terminalView(ui, full, { isCompact: site.inBand, maxRows: site.maxRows, on: site.on })
  }

  return desktopView(ui, full, site.on)
}
