// MODZ kit — a drawing that is pressed as a whole (DESIGN.md §0.5). A desktop Svg cannot be pressed, so plain
// native buttons are laid over all of it: the drawing is what the person sees, the buttons what the press lands on.
// The drawing under them is a plain, still Svg (an image: a frame would sit over the buttons and take the click,
// and an image restarts its animations on every draw).
// Terminal surfaces keep their own buttons; this is for the desktop.
import type { ElementTable, RenderElement } from 'claude-code'

type Ui = ElementTable

// A native button is as wide as its label, one control tall, and lights on its own under the pointer; a label too
// long for its box is cut to "…" (measured on the desktop, 2026-10-29: 14 px type, 28 px of padding, ~28 px tall).
// Its label is painted and a space is trimmed away, so it is a run of Hangul fillers (blank at every weight, where a
// blank braille cell is drawn as dots from weight 500). The run is longer than the drawing could ever be drawn, in
// a line box wider still, so the button is never squeezed into "…" whatever width the pane really has; the cover
// clips it at the drawing's edges, the left one a cell in so its rounded end is cut too: the light is one straight
// band across the row. One button per control-height line: its own light is the row's hover.
const BLANK = '\u3164'
const CELL_PX = 11.9
const BUTTON_PX = 28
// How much wider than the drawing's stated width the run and its line are: a pane may draw it a good deal wider.
const RUN_SPAN = 2
const LINE_SPAN = '400%'

export type CoverOpts = { key: string; width: number; height: number; hotkey?: string; onPress: () => unknown }

// The buttons alone, laid over whatever their parent holds; the parent must hug the drawing (`width` × `height` px).
// A drawing one control tall takes one button; a taller one a stack, centred.
// shortcut: the labels are blank, so the drawing's alt names the row; name the button when the element set gains an
// accessible-name prop.
export function PressCover(ui: Ui, o: CoverOpts): RenderElement {
  const { Box, Button } = ui
  const lines = Math.max(1, Math.round(o.height / BUTTON_PX))
  const label = BLANK.repeat(Math.ceil((o.width * RUN_SPAN) / CELL_PX))
  const hotkey = o.hotkey === undefined ? {} : { hotkey: o.hotkey }

  return (
    <Box position="absolute" top={0} bottom={0} left={0} right={0} flexDirection="column" justifyContent="center" overflow="hidden">
      {Array.from({ length: lines }, (_, i) => (
        <Box key={`${o.key}~line${i}`} flexDirection="row" width={LINE_SPAN} marginLeft={-1} flexShrink={0}>
          <Button key={i === 0 ? o.key : `${o.key}~${i}`} label={label} plain {...(i === 0 ? hotkey : {})} onPress={o.onPress} />
        </Box>
      ))}
    </Box>
  )
}

const STILL = '<style>*{animation:none!important;transition:none!important}</style>'

type SvgProps = { key?: string; source: string; alt: string; width?: number; height?: number }

// A drawing held still: its own animations stopped, since an image restarts them on every draw.
export const stillSource = (source: string): string => source.replace(/<\/svg>\s*$/, `${STILL}</svg>`)

// An Svg element drawn again as a plain, still image, so the buttons over it take the press; others pass as they are.
export function stillSvg(ui: Ui, drawing: RenderElement): RenderElement {
  if (drawing.type !== 'Svg') return drawing
  const { Svg } = ui
  const { key, source, alt, width, height } = drawing.props as SvgProps

  return <Svg key={key} source={stillSource(source)} alt={alt} width={width} height={height} />
}

// A drawing that did not say its size: a hub row's, so the cover still reaches its edges.
const FALLBACK_PX = 52
const FALLBACK_WIDTH_PX = 360

export type PressRowOpts = { box: string; key: string; drawing: RenderElement; hotkey?: string; onPress: () => unknown }

// A drawing and its cover in one keyed box: the row is the control, its hover and its press one surface.
export function PressRow(ui: Ui, o: PressRowOpts): RenderElement {
  const { Box } = ui
  const props = o.drawing.type === 'Svg' ? (o.drawing.props as SvgProps) : {}
  const width = props.width ?? FALLBACK_WIDTH_PX
  const height = props.height ?? FALLBACK_PX

  return (
    <Box key={o.box} alignSelf="flex-start">
      {stillSvg(ui, o.drawing)}
      {PressCover(ui, { key: o.key, width, height, hotkey: o.hotkey, onPress: o.onPress })}
    </Box>
  )
}
