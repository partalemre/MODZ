import type { PaneMotion } from './kit/moving'
import type { Look, SvgElement } from './look'

// The settings and gallery panes draw with the very row and card builders the transcript uses; only the panes
// move (kit/moving.ts), so each pane's draw hands those builders a look whose Svg draws interactive frames.

// The box the markup gives itself: an interactive Svg is a frame, and a frame needs a box.
const SIZE = (name: 'width' | 'height') => new RegExp(`^<svg\\b[^>]*?\\s${name}="([\\d.]+)"`)
const sizeOf = (source: string, name: 'width' | 'height'): number | undefined => {
  const found = SIZE(name).exec(source)

  return found === null ? undefined : Number(found[1])
}

// A drawing is known by what it says and its place among those that say the same: the pane's samples keep their
// order, so the third `read` icon is the third on every draw.
function movingSvg(Svg: SvgElement, motion: PaneMotion): SvgElement {
  const seen = new Map<string, number>()

  return props => {
    const nth = seen.get(props.alt) ?? 0
    seen.set(props.alt, nth + 1)
    const key = `${props.alt}#${nth}`
    const boxed = { ...props, width: props.width ?? sizeOf(props.source, 'width'), height: props.height ?? sizeOf(props.source, 'height') }

    return <Svg key={key} {...motion.pic(key, boxed)} />
  }
}

// `look` for one draw of a pane: its Svg, where the surface has one, moving with the pane's motion.
export const movingLook = (look: Look, motion: PaneMotion): Look => (look.svg === undefined ? look : { ...look, svg: movingSvg(look.svg, motion) })

// Opens a pane anew: its drawings cascade in again.
export function opening<T>(motion: PaneMotion, open: () => T): T {
  motion.reset()

  return open()
}
