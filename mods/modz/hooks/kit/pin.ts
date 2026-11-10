// MODZ kit — pinned press handles. Every element the JSX runtime builds gets a fresh handle, and the
// host releases a drawing's old handles the moment it redraws. A desktop holds the tree it last
// painted, so a click that lands just after any redraw (a state write, a focus flip, a poll) names a
// released handle and the engine drops it ("ui_press not handled"). The host keeps a handle alive
// across redraws when the new tree carries the same one, so each element here keeps the first handle
// its site and key ever got: every tree a surface still holds stays pressable, with the latest closure.
// The same walk makes every text drawable (`drawable`, below), so one odd character never costs a whole pane.
import type { RenderElement } from 'claude-code'

export type PinSite = { surface: string; component?: string; requestId?: string }

type Node = { type?: string; props?: { key?: unknown }; press?: { plugin: string; handle: number }; children?: unknown[] }

// Far above the runtime's own counter, which starts at 1 and climbs by one per element drawn.
const FIRST_PINNED = 1_000_000_000
const pins = new Map<string, number>()

function handleFor(id: string): number {
  let handle = pins.get(id)
  if (handle === undefined) {
    handle = FIRST_PINNED + pins.size
    pins.set(id, handle)
  }

  return handle
}

// The engine refuses a whole tree for one text it cannot draw: a control character (an escape sequence out of a
// command's output) or half a surrogate pair (an emoji cut by a length limit), in a text child, a label or an alt.
// The pane then reads "Nothing to show yet" for as long as that text is in it. Every tree a hook returns passes
// through here, so such characters are dropped here, once, for every mod.
const UNDRAWABLE = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\ud800-\udfff\u{10eeee}]/gu

export const drawable = (text: string): string => text.replace(UNDRAWABLE, '')

// An element with its string props made drawable; the key stays as written, since the pins go by it.
function drawableProps(el: Node): Node {
  const props = el.props as Record<string, unknown> | undefined
  if (typeof props !== 'object' || props === null) return el
  const cleaned = Object.entries(props).filter(([name, value]) => name !== 'key' && typeof value === 'string' && drawable(value) !== value)
  if (cleaned.length === 0) return el

  return { ...el, props: { ...props, ...Object.fromEntries(cleaned.map(([name, value]) => [name, drawable(value as string)])) } }
}

function pinNode(node: unknown, ctx: { site: string; seen: Map<string, number> }): unknown {
  if (typeof node === 'string') return drawable(node)
  if (typeof node !== 'object' || node === null) return node
  const el = drawableProps(node as Node)
  const children = el.children?.map(child => pinNode(child, ctx))
  const withKids = children === undefined ? el : { ...el, children }
  // Only this plugin's own elements: the runtime names the plugin of every tree `next` returned.
  if (el.press?.plugin !== '' || typeof el.props?.key !== 'string') return withKids
  const base = `${ctx.site}\u0000${el.type}\u0000${el.props.key}`
  const nth = ctx.seen.get(base) ?? 0
  ctx.seen.set(base, nth + 1)

  return { ...withKids, press: { plugin: '', handle: handleFor(`${base}\u0000${nth}`) } }
}

// Return a render hook's tree through this: `return pinned(e, tree)`.
export function pinned<T extends RenderElement | null | undefined>(site: PinSite, tree: T): T {
  if (tree === null || tree === undefined) return tree
  const ctx = { site: `${site.surface}\u0000${site.component ?? ''}\u0000${site.requestId ?? ''}`, seen: new Map<string, number>() }

  return pinNode(tree, ctx) as T
}
