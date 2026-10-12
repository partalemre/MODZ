import type { RenderChildren, RenderElement, RenderSurface } from 'claude-code'

import type { SvgPic } from './kit/svg'
import { Eyebrow, isTextSurface } from './kit/ui'
import type { Ui } from './kit/ui'

export type Ctx = { ui: Ui; surface: RenderSurface; isLight: boolean; width: number }

export const noop = (): void => undefined

export const isText = (ctx: Ctx): boolean => isTextSurface(ctx.ui, ctx.surface)

// A kit Svg on the desktop; its alt text on the terminal.
export function Pic(ctx: Ctx, pic: SvgPic): RenderElement {
  const { Text } = ctx.ui

  if (!('Svg' in ctx.ui) || isText(ctx)) return <Text dimColor>{pic.alt}</Text>

  const { Svg } = ctx.ui
  return <Svg source={pic.source} alt={pic.alt} width={pic.width} height={pic.height} />
}

export function Section(ctx: Ctx, o: { title: string; meta?: string; children: RenderChildren }): RenderElement {
  const { Box } = ctx.ui

  return (
    <Box flexDirection="column" gap={1}>
      {Eyebrow(ctx, { text: o.title, meta: o.meta, width: ctx.width, hasRule: true })}
      {o.children}
    </Box>
  )
}

export const Row = (ctx: Ctx, children: RenderChildren): RenderElement => {
  const { Box } = ctx.ui
  return <Box flexDirection="row" gap={1} flexWrap="wrap" alignItems="center">{children}</Box>
}
