import type { EngineInterface, Register } from 'claude-code'

import { resolveLight } from './kit/tokens'
import { cardInnerWidth } from './kit/ui'
import { SECTIONS } from './sections'
import type { Ctx } from './sections'

const PANE = 'kit-gallery'
const COLUMNS = 80

// `kit-gallery` draws every section; `kit-gallery:<section>:<dark|light>` (the preview test)
// draws one, in a fixed scheme.
async function isLightNow($: EngineInterface): Promise<boolean> {
  const rows = await $.config.list()

  return resolveLight({ override: await $.env.get('MODZ_THEME'), theme: rows.find(row => row.key === 'theme')?.value })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'kit-gallery', description: 'MODZ kit galerisi: her bileşen, birkaç durumda' })
    return next(e)
  })

  on('command.run', { command: 'kit-gallery' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Kit galerisi' })
    return { text: 'Kit galerisi açıldı.' }
  })

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (!e.requestId.startsWith(PANE)) return next(e)

    const [, only, scheme] = e.requestId.split(':')
    const ui = $.ui.resolve(e)
    const { Box } = ui
    const columns = e.props.bodyColumns || COLUMNS
    const ctx: Ctx = {
      ui,
      surface: e.surface,
      isLight: scheme ? scheme === 'light' : await isLightNow($),
      width: cardInnerWidth(columns),
    }
    const shown = SECTIONS.filter(section => !only || section.id === only)

    return (
      <Box flexDirection="column" gap={2}>
        {shown.map(section => section.draw(ctx))}
      </Box>
    )
  })
}
