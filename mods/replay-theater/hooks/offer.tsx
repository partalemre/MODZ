import type { ReplayStep } from '../types'
import { baseName } from './pane-svg'
import { escape, eyebrow, fit, widthFor } from './ui/svg'
import { palette, svgDoc } from './ui/theme'
import type { Theme } from './ui/theme'

// The resolved element table of the surface that draws the band.
export type Ui = Record<string, any>

export type OfferModel = { steps: ReplayStep[]; quote: string; theme: Theme; columns: number; surface: string }
export type OfferHandlers = { onOpen: () => void; onDismiss: () => void }

const HEAD_H = 58
const TILE = 38
const TEXT_X = 52
const CARD_CHROME_COLUMNS = 8
// Below this the "/replay" hint would push the buttons into two lines; the buttons win.
const HINT_MIN_COLUMNS = 64

export function offerFacts(steps: ReplayStep[]): { title: string; files: string } {
  const names = [...new Set(steps.map(step => baseName(step.file)))]
  const fileCount = new Set(steps.map(step => step.file)).size

  return { title: `${steps.length} düzenleme · ${fileCount} dosya`, files: names.join(' · ') }
}

function playTile(): string {
  const tile = `<rect x="0.5" y="2.5" width="${TILE - 1}" height="${TILE - 1}" rx="10" fill="var(--plan-t)" stroke="var(--plan-l)"/>`
  const play = '<path d="M15.5 14.5L27 21.5L15.5 28.5Z" fill="var(--plan)" stroke="var(--plan)" stroke-width="1.75" stroke-linejoin="round"/>'

  return tile + play
}

export function offerSvg(model: OfferModel, width: number): string {
  const facts = offerFacts(model.steps)
  const room = width - TEXT_X
  const body = [
    playTile(),
    `<text x="${TEXT_X}" y="14" class="eyebrow f-plan">${eyebrow('Tekrar')}</text>`,
    `<text x="${TEXT_X}" y="36" class="headline hi">${escape(fit(facts.title, room, 17))}</text>`,
    `<text x="${TEXT_X}" y="54" class="label lo">${escape(fit(facts.files, room, 12))}</text>`,
  ]

  return svgDoc({ width, height: HEAD_H, theme: model.theme }, body.join(''))
}

function actions(ui: Ui, on: OfferHandlers, hasHint: boolean) {
  const { Box, Text, Button } = ui

  return (
    <Box key="rt-actions" flexDirection="row" columnGap={2} alignItems="center">
      <Button key="rt-open" variant="primary" hotkey="r" label="Düzenlemeleri izle" onPress={on.onOpen} />
      {hasHint && <Text dimColor>ya da /replay yaz</Text>}
      <Box flexGrow={1} />
      <Button key="rt-dismiss" plain label="Şimdi değil" onPress={on.onDismiss} />
    </Box>
  )
}

function desktopCard(ui: Ui, model: OfferModel, on: OfferHandlers) {
  const { Box, Text, Svg } = ui
  const width = widthFor(model.columns - CARD_CHROME_COLUMNS, { min: 260, max: 560 })
  const tone = model.theme === 'auto' ? null : palette(model.theme === 'light')

  return (
    <Box key="rt-offer" flexDirection="column" borderStyle="round" borderColor={tone?.plan.line} backgroundColor={tone?.card} paddingX={2} paddingY={1} gap={1}>
      <Svg source={offerSvg(model, width)} alt={`Tekrar: ${offerFacts(model.steps).title}`} width={width} height={HEAD_H} />
      {model.quote !== '' && (
        <Text key="rt-quote" wrap="wrap">
          <Text bold>{'Claude: '}</Text>
          <Text dimColor>{model.quote}</Text>
        </Text>
      )}
      {actions(ui, on, model.columns >= HINT_MIN_COLUMNS)}
    </Box>
  )
}

function terminalCard(ui: Ui, model: OfferModel, on: OfferHandlers) {
  const { Box, Text } = ui
  const facts = offerFacts(model.steps)

  return (
    <Box key="rt-offer" flexDirection="column" paddingX={1}>
      <Box key="rt-offer-head" flexDirection="row" columnGap={1}>
        <Text color="merged" bold>{'▶ TEKRAR'}</Text>
        <Text bold>{facts.title}</Text>
        <Box flexShrink={1}>
          <Text dimColor wrap="truncate-end">{facts.files}</Text>
        </Box>
      </Box>
      {actions(ui, on, model.columns >= HINT_MIN_COLUMNS)}
    </Box>
  )
}

export function offerCard(ui: Ui, model: OfferModel, on: OfferHandlers) {
  return model.surface === 'terminal' || !('Svg' in ui) ? terminalCard(ui, model, on) : desktopCard(ui, model, on)
}
