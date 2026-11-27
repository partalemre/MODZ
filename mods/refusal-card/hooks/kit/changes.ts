// MODZ kit — what a changed drawing shows moving, found by comparing its new source with the one it replaces
// (moving.ts). Only real changes move: a meter's fill (`data-m-fill`, svg-meters.ts) slides from the width it had,
// and a done mark (`data-m-done`, icons.ts) draws itself once when the drawing had none before. A drawing redrawn
// with the same fills and marks gets nothing, so a busy pane stays calm.

const FILL = /<rect\b[^>]*\bdata-m-fill\b[^>]*>/g
const DONE = /<path\b[^>]*\bdata-m-done\b[^>]*>/g
const HAS_DONE = /\bdata-m-done\b/
const WIDTH = /\swidth="([\d.]+)"/
const CLASS = /\sclass="([^"]*)"/
const STYLE = /\sstyle="([^"]*)"/
// Below this the eye reads no move; a slide of under a pixel or two only blurs the edge.
const MIN_RATIO_STEP = 0.02
const RATIO_DIGITS = 3

const widthOf = (tag: string): number => Number(WIDTH.exec(tag)?.[1] ?? 0)

// `tag` with `name` added to its classes and `extra` attributes before its end.
function withClass(tag: string, name: string, extra = ''): string {
  const tagged = CLASS.test(tag) ? tag.replace(CLASS, (_, classes: string) => ` class="${classes} ${name}"`) : tag.replace(/\s*\/?>$/, ` class="${name}"$&`)

  return tagged.replace(/\s*\/?>$/, `${extra}$&`)
}

// Each fill slides from the width the same fill (by its order in the drawing) had before. Fills are matched by order,
// so when one came or went (an empty meter draws none) nothing slides rather than a fill taking another's width.
function slideFills(before: string, now: string): string {
  const old = before.match(FILL) ?? []
  if (old.length !== (now.match(FILL) ?? []).length) return now
  let index = 0

  return now.replace(FILL, tag => {
    const was = old[index++]
    const from = was === undefined ? 0 : widthOf(was)
    const to = widthOf(tag)
    if (from <= 0 || to <= 0 || Math.abs(from - to) / to < MIN_RATIO_STEP) return tag

    const slide = `--m-from:${(from / to).toFixed(RATIO_DIGITS)}`
    const styled = STYLE.test(tag) ? tag.replace(STYLE, (_, rules: string) => ` style="${slide};${rules}"`) : tag.replace(/\s*\/?>$/, ` style="${slide}"$&`)

    return withClass(styled, 'm-from')
  })
}

// Done marks draw themselves only when the drawing turns done: it had none and now has one.
function drawDone(before: string, now: string): string {
  if (HAS_DONE.test(before)) return now

  return now.replace(DONE, tag => withClass(tag, 'm-draw', ' pathLength="1"'))
}

// `now` with what changed since `before` marked to move.
export function markChanges(before: string, now: string): string {
  return drawDone(before, slideFills(before, now))
}
