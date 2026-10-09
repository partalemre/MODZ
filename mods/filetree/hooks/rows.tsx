import type { ClientModule, ClientPointerEvent, ClientSurface, RenderElement } from 'claude-code'

export type Seg = { t: string; c?: string; b?: boolean; s?: boolean; i?: boolean; sh?: string; dim?: boolean; one?: boolean; spin?: boolean; bg?: string; tab?: string }
// `bg` tints the whole row while Claude is on that file.
export type RowSpec = { id: string; left: Seg[]; right: Seg[]; bg?: string }
export type RowsProps = {
  rows: RowSpec[]
  active: string
  activeBg: string
  hoverBg: string
  tones: Record<string, { bright: string[]; dim: string[] }>
  spinner?: string[]
  pointer?: boolean
  bar?: { pos: number; size: number; thumb: string; track: string }
}
type Local = { hover: number; phase: number; drag: boolean; ref: { stop?: () => void; unpoint?: () => void } }

const TICK_MS = 90
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

// The band's distance from a character to its palette step: brightest at the band's center.
const STEPS = [0.8, 1.8, 2.8]
const BAND_SPEED = 1.6
const BAND_PAD = 4

function shimmer({ i, phase, len }: { i: number; phase: number; len: number }, palette: string[]): string {
  const band = ((phase * BAND_SPEED) % (len + 2 * BAND_PAD)) - BAND_PAD
  const d = Math.abs(i - band)
  const k = STEPS.findIndex(step => d < step)
  return palette[k < 0 ? 0 : STEPS.length - k] ?? palette[0] ?? '#f97316'
}

type Surface = ClientSurface<Local>
type Pointer = ClientPointerEvent

function stateOf(surface: Surface): Local {
  if (surface.state !== undefined) return surface.state
  const state: Local = { hover: -1, phase: 0, drag: false, ref: {} }
  surface.setState(state)
  return state
}

function tick(props: RowsProps, state: Local, surface: Surface): void {
  const lit = props.rows.some(r => r.left.some(s => s.sh || s.spin) || r.right.some(s => s.sh || s.spin))
  if (lit && !state.ref.stop) {
    state.ref.stop = surface.every(TICK_MS, () => {
      const cur = surface.state
      if (cur) surface.setState({ ...cur, phase: cur.phase + 1 })
    })
  } else if (!lit && state.ref.stop) {
    state.ref.stop()
    state.ref.stop = undefined
  }
}

// The scrollbar's column: a press there, and every move until the button lifts, scrolls.
function dragBar(props: RowsProps, cur: Local, { surface, e }: { surface: Surface; e: Pointer }): boolean {
  const onBar = Boolean(props.bar) && e.x >= surface.columns - 1
  if (!props.bar || !(cur.drag || (onBar && e.type === 'down' && (e.button ?? 'left') === 'left'))) return false
  if (e.type === 'up' || e.type === 'leave') {
    surface.setState({ ...cur, drag: false })
    return true
  }
  if (e.type !== 'down' && e.type !== 'move') return false
  if (!cur.drag) surface.setState({ ...cur, drag: true, hover: -1 })
  surface.post({ scrollTo: Math.max(0, Math.min(1, e.y / Math.max(1, props.rows.length - 1))) })
  return true
}

function pressRow(row: RowSpec, surface: Surface, e: Pointer): void {
  let x = 0
  for (const seg of row.left) {
    const w = [...seg.t].length
    if (seg.tab && e.x >= x && e.x < x + w) {
      surface.post({ tab: seg.tab })
      return
    }
    x += w
  }
  if (row.id) surface.post({ press: row.id, ctrl: Boolean(e.ctrl), shift: Boolean(e.shift) })
}

function pointer(props: RowsProps, state: Local, surface: Surface): (e: Pointer) => void {
  return e => {
    const cur = surface.state ?? state
    if (dragBar(props, cur, { surface, e })) return
    if (e.type === 'leave' || e.y < 0 || e.y >= props.rows.length) {
      if (cur.hover !== -1) surface.setState({ ...cur, hover: -1 })
      return
    }
    if (e.type === 'move' && !e.button && cur.hover !== e.y) surface.setState({ ...cur, hover: e.y })
    const row = props.rows[e.y]
    if (e.type === 'down' && e.button === 'right' && row?.id) {
      surface.post({ copy: row.id, shift: Boolean(e.shift) })
      return
    }
    if (e.type !== 'down' || (e.button ?? 'left') !== 'left' || !row) return
    pressRow(row, surface, e)
  }
}

function paletteOf(props: RowsProps, s: Seg): string[] | undefined {
  if (!s.sh) return undefined
  return s.dim ? props.tones[s.sh]?.dim : props.tones[s.sh]?.bright
}

function drawer(props: RowsProps, state: Local, surface: Surface): (s: Seg) => RenderElement {
  const { Text } = surface.elements
  const frames = props.spinner?.length ? props.spinner : FRAMES
  return s => {
    if (s.spin) {
      return (
        <Text color={s.c} bold={s.b}>
          {s.t + (frames[state.phase % frames.length] ?? '')}
        </Text>
      )
    }
    const palette = paletteOf(props, s)
    if (!palette) {
      return (
        <Text color={s.c} backgroundColor={s.bg} bold={s.b} strikethrough={s.s} italic={s.i}>
          {s.t}
        </Text>
      )
    }
    if (s.one) return <Text color={shimmer({ i: -1, phase: state.phase, len: s.t.length }, palette)}>{s.t}</Text>
    const chars = [...s.t]
    return (
      <Text bold={s.b}>
        {chars.map((ch, i) => (
          <Text color={shimmer({ i, phase: state.phase, len: chars.length }, palette)}>{ch}</Text>
        ))}
      </Text>
    )
  }
}

function rowBg(props: RowsProps, r: RowSpec, { i, hover }: { i: number; hover: number }): string | undefined {
  if (r.bg !== undefined) return r.bg
  if (r.id && r.id === props.active) return props.activeBg
  return r.id && i === hover ? props.hoverBg : undefined
}

const Rows: ClientModule<RowsProps, Local> = (props, surface) => {
  const { Box, Text } = surface.elements
  const state = stateOf(surface)
  tick(props, state, surface)
  if (props.pointer === false) {
    state.ref.unpoint?.()
    state.ref.unpoint = undefined
  } else state.ref.unpoint = surface.onPointer(pointer(props, state, surface))
  surface.onKey(e => surface.post({ key: e.key, ctrl: Boolean(e.ctrl), shift: Boolean(e.shift) }))
  const draw = drawer(props, state, surface)
  const isThumb = (i: number) => Boolean(props.bar) && i >= (props.bar?.pos ?? 0) && i < (props.bar?.pos ?? 0) + (props.bar?.size ?? 0)
  return (
    <Box flexDirection="column">
      {props.rows.map((r, i) => (
        <Box flexDirection="row" height={1} overflow="hidden" backgroundColor={rowBg(props, r, { i, hover: state.hover })}>
          <Box flexShrink={1} overflow="hidden">
            {r.left.map(draw)}
          </Box>
          <Box flexGrow={1} />
          {r.right.map(draw)}
          {props.bar && <Text color={isThumb(i) ? props.bar.thumb : props.bar.track}>{isThumb(i) ? '┃' : '│'}</Text>}
        </Box>
      ))}
    </Box>
  )
}

export default Rows
