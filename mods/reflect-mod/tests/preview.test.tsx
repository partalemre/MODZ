import { test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { BAND, say, start, world } from './world'

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

// Each card state drawn on the desktop, in both themes, for bin/preview to paint.
const SAID = 'hayır, bu repoda hep pnpm kullanıyoruz, npm değil'
const RULE = { is_rule: true, rule: 'Bu projede paket yönetimi için npm yerine her zaman pnpm kullan.', scope: 'project', confidence: 0.95 }
const WIDE = { ...BAND, props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 112 } as never }

const draw = async ($: Engine, label: string) => {
  const ui = await $.ui.mount({ plugin: 'reflect-mod', surface: 'desktop', ...WIDE })
  console.log(`@@TREE@@${label}@@` + JSON.stringify(await ui.drawn()))
  return ui
}

for (const theme of ['dark', 'light'] as const) {
  test(`preview ${theme}: reflect card`, async ($, on) => {
    const w = world(on, { verdicts: { [SAID]: RULE }, theme, root: () => '/Users/me/weather-station' })
    await start($)
    await say($, w, SAID)
    const ui = await draw($, `reflect-project-${theme}`)
    const keyOf = async (prefix: string) => (await ui.findAll({ type: 'Button' })).find(b => b.key?.startsWith(prefix))?.key ?? ''
    await ui.press({ key: await keyOf('pick-global:') })
    console.log(`@@TREE@@reflect-global-${theme}@@` + JSON.stringify(await ui.drawn()))
    await ui.press({ key: await keyOf('pick-project:') })
    await ui.press({ key: await keyOf('save:') })
    console.log(`@@TREE@@reflect-saved-${theme}@@` + JSON.stringify(await ui.drawn()))
  })
}
