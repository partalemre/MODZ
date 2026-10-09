import type { Register } from 'claude-code'

import { loadCatalog, marketRoot } from './catalog'

const PANE = 'modz'
const TITLE = 'MODZ'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'modz',
      description: 'MODZ marketplace\'indeki modları bir panelde listeler',
    })

    return next(e)
  })

  on('command.run', { command: 'modz' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: 'MODZ paneli açıldı.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const root = marketRoot($.plugin.root)
    const mods = await loadCatalog(path => $.fs.read(path), root)

    return (
      <Box flexDirection="column">
        <Text dimColor>{root}</Text>
        {mods.length === 0 && <Text dimColor>Marketplace'te mod yok.</Text>}
        {mods.map(mod => (
          <Box key={`mod-${mod.name}`} flexDirection="column" marginTop={1}>
            <Text bold>
              {mod.name} <Text dimColor>v{mod.version}</Text>
            </Text>
            <Text>{mod.description}</Text>
          </Box>
        ))}
      </Box>
    )
  })
}
