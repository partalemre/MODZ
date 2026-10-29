import type { ReplayStep } from '../types'
import { baseName } from './pane-svg'
import { escape, fit, widthFor } from './ui/svg'
import { palette, svgDoc } from './ui/theme'
import type { Theme } from './ui/theme'
import { words } from './words'

// The resolved element table of the surface that draws the band.
export type Ui = Record<string, any>

export type OfferModel = { steps: ReplayStep[]; quote: string; theme: Theme; columns: number; surface: string }
export type OfferHandlers = { onOpen: () => void; onDismiss: () => void }

const HEAD_H = 46
const TEXT_X = 26
const CARD_CHROME_COLUMNS = 8
// Below this the "/replay" hint would push the buttons into two lines; the buttons win.
const HINT_MIN_COLUMNS = 64

export function offerFacts(steps: ReplayStep[]): { title: string; files: string } {
  const names = [...new Set(steps.map(step => baseName(step.file)))]
  const fileCount = new Set(steps.map(step => step.file)).size

  return { title: words().editsAndFiles(steps.length, fileCount), files: names.join(' · ') }
}

// A bare play mark beside the headline: a line icon in body ink, no tile.
const PLAY = '<path d="M4 5.5L14.5 12L4 18.5Z" fill="none" stroke="var(--mid)" stroke-width="1.5" stroke-linejoin="round"/>'

// "2 edits · 2 files", then whose card it is and the files it touched, quiet.
export function offerSvg(model: OfferModel, width: number): string {
  const facts = offerFacts(model.steps)
  const room = width - TEXT_X
  const meta = [words().title, facts.files].filter(Boolean).join(' · ')
  const body = [
    PLAY,
    `<text x="${TEXT_X}" y="18" class="headline hi">${escape(fit(facts.title, room, 17))}</text>`,
    `<text x="${TEXT_X}" y="38" class="label lo">${escape(fit(meta, room, 12))}</text>`,
  ]

  return svgDoc({ width, height: HEAD_H, theme: model.theme }, body.join(''))
}

function actions(ui: Ui, on: OfferHandlers, hasHint: boolean) {
  const { Box, Text, Button } = ui
  const w = words()

  return (
    <Box key="rt-actions" flexDirection="row" columnGap={2} alignItems="center">
      <Button key="rt-open" variant="primary" hotkey="r" label={w.watch} onPress={on.onOpen} />
      {hasHint && <Text dimColor>{w.orType}</Text>}
      <Box flexGrow={1} />
      <Button key="rt-dismiss" plain dimColor label={w.notNow} onPress={on.onDismiss} />
    </Box>
  )
}

function desktopCard(ui: Ui, model: OfferModel, on: OfferHandlers) {
  const { Box, Text, Svg } = ui
  const width = widthFor(model.columns - CARD_CHROME_COLUMNS, { min: 260, max: 560 })
  const tone = model.theme === 'auto' ? null : palette(model.theme === 'light')

  return (
    <Box key="rt-offer" flexDirection="column" borderStyle="round" borderColor={tone?.line} backgroundColor={tone?.card} paddingX={2} paddingY={1} gap={1}>
      <Svg source={offerSvg(model, width)} alt={`${words().title}: ${offerFacts(model.steps).title}`} width={width} height={HEAD_H} />
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
        <Text bold dimColor>{words().title}</Text>
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
