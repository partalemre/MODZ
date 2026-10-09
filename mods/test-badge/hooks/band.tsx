import { bandParts } from './summary'
import type { BadgePill } from './summary'
import { measure, pill, svgDoc, svgWidth, text } from './svg'
import { THEME_KEY } from './tidemark'
import type { Theme } from './tidemark'
import type { TestBadge } from '../types'

// The badge's row above the prompt: Moss "✓ test 42/42", Amber "lint 2", "4 sn önce" in text.lo;
// an Iris pill with a breathing dot while running; Flare "✕ 3/42" and "Ayrıntı" on failure.
type Ui = Record<string, any>

export type BandView = {
  badge: TestBadge
  now: number
  columns: number
  theme: Theme
  isRich: boolean
  hasDetails: boolean
  onDetails: () => void
  // Absent while a run is going: there is no result to dismiss yet.
  onDismiss?: () => void
}

const ROW_H = 24
const PILL_GAP = 6
const META_FONT = { size: 11.5 }
const GLYPH: Record<string, string> = { check: '✓', x: '✕', pulse: '●' }
// Columns the Ayrıntı and ✕ buttons take beside the row.
const BUTTONS_RESERVE = 20

const pillText = (part: BadgePill): string => (part.glyph === undefined ? part.label : `${GLYPH[part.glyph]} ${part.label}`)

export function bandAlt(badge: TestBadge, now: number): string {
  const parts = bandParts(badge, now)

  return [...parts.pills.map(pillText), parts.meta].filter(part => part !== '').join(' · ')
}

function pillsSvg(view: BandView): { source: string; width: number } {
  const parts = bandParts(view.badge, view.now)
  const body: string[] = []
  let x = 0
  for (const part of parts.pills) {
    const drawn = pill({ x, y: 2, label: part.label, role: part.tone, glyph: part.glyph })
    body.push(drawn.svg)
    x += drawn.width + PILL_GAP
  }
  const room = svgWidth(view.columns, { reserve: BUTTONS_RESERVE, min: 160, max: 1200 })
  // "4 sn önce" is the first thing a narrow band leaves out: whole or not at all, never cut.
  if (parts.meta !== '' && x + measure(parts.meta, META_FONT) + 4 <= room) {
    body.push(text({ ...META_FONT, x: x + 2, y: 16, text: parts.meta, ink: 'lo' }))
    x += measure(parts.meta, META_FONT) + 4
  }
  const width = Math.min(Math.ceil(x), room)

  return { source: svgDoc({ width, height: ROW_H, mode: view.theme.mode, body: body.join('') }), width }
}

function pillTexts(ui: Ui, view: BandView) {
  const { Text } = ui
  const parts = bandParts(view.badge, view.now)
  const pills = parts.pills.map((part, index) => {
    const look = part.tone === 'neutral' ? { dimColor: true } : { color: THEME_KEY[part.tone] }

    return <Text key={`tb-pill-${index}`} {...look} wrap="truncate">{pillText(part)}</Text>
  })

  return parts.meta === '' ? pills : [...pills, <Text key="tb-meta" dimColor>{parts.meta}</Text>]
}

export function bandTree(ui: Ui, view: BandView, theirs: unknown) {
  const { Box, Button, Svg } = ui
  const drawn = view.isRich ? pillsSvg(view) : null

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" alignItems="center" columnGap={1} flexWrap="wrap">
        {drawn === null ? pillTexts(ui, view) : <Svg source={drawn.source} alt={bandAlt(view.badge, view.now)} width={drawn.width} height={ROW_H} />}
        {view.hasDetails && <Button key="tb-details" variant="secondary" hotkey="t" label="Ayrıntı" onPress={view.onDetails} />}
        {view.onDismiss !== undefined && <Button key="tb-dismiss" plain dimColor role="dismiss" label="✕" onPress={view.onDismiss} />}
      </Box>
      {theirs}
    </Box>
  )
}
