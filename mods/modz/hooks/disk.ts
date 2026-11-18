// The reads market.ts works through, built where `$` is; shared by register.tsx and upkeep.tsx.
import type { EngineInterface } from 'claude-code'

import type { Disk } from './market'

// What market.ts reads the catalog and the settings through; built here, where `$` is. Each env name is spelled
// out, as the engine admits an env read by a literal name only.
export const diskOf = ($: EngineInterface): Disk => ({
  root: $.plugin.root,
  env: { home: () => $.env.get('HOME'), userProfile: () => $.env.get('USERPROFILE'), configDir: () => $.env.get('CLAUDE_CONFIG_DIR') },
  cwd: () => $.session.cwd(),
  settings: () => $.settings.read(),
  realPath: async path => (await $.fs.stat(path, { resolve: true })).realPath,
  read: path => $.fs.read(path),
  exists: path => $.fs.exists(path),
  write: (path, text) => $.fs.write(path, text),
  log: text => $.ui.log(text, { to: 'debug' }),
})
