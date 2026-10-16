import type { Register } from 'claude-code'

import { HUB_PANE } from './hub'
import { isOffStage } from './stage'

type On = Parameters<Register>[0]

const PANE = 'checkpoints'

// Another pane took the MODZ main panel (kit/stage.ts): this one steps aside rather than wait as a tab.
export function hookStage(on: On): void {
  on('state.set', { plugin: 'modz', key: 'stage' }, async ($, e, next) => {
    const done = await next(e)
    if (isOffStage(e.value, HUB_PANE)) await $.ui.close({ id: PANE })

    return done
  }).catch(($, e, next) => next(e))
}
