import { test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { IDEAS, mine, mineWorld, paneSite } from './ideas-world'
import { BAND, say, start, world } from './world'

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

// Each card state drawn on the desktop, in both themes, for bin/preview to paint.
const SAID = 'hayır, bu repoda hep pnpm kullanıyoruz, npm değil'
const RULE = { is_rule: true, rule: 'Bu projede paket yönetimi için npm yerine her zaman pnpm kullan.', scope: 'project', confidence: 0.95 }
// Full width, then the band at about 520 px and 400 px (8 px a column); `-w<px>` sets the preview's page.
const SIZES = [{ tag: '', columns: 112 }, { tag: '-w520', columns: 65 }, { tag: '-w400', columns: 50 }]
const site = (columns: number) => ({ ...BAND, props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: columns } as never })

const draw = async ($: Engine, label: string, columns: number) => {
  const ui = await $.ui.mount({ plugin: 'reflect-mod', surface: 'desktop', ...site(columns) })
  console.log(`@@TREE@@${label}@@` + JSON.stringify(await ui.drawn()))
  return ui
}

for (const [theme, size] of (['dark', 'light'] as const).flatMap(theme => SIZES.map(size => [theme, size] as const))) {
  test(`preview ${theme}${size.tag}: reflect card`, async ($, on) => {
    const w = world(on, { verdicts: { [SAID]: RULE }, theme, root: () => '/Users/me/weather-station' })
    await start($)
    await say($, w, SAID)
    const ui = await draw($, `reflect-project-${theme}${size.tag}`, size.columns)
    const keyOf = async (prefix: string) => (await ui.findAll({ type: 'Button' })).find(b => b.key?.startsWith(prefix))?.key ?? ''
    await ui.press({ key: await keyOf('pick-global:') })
    console.log(`@@TREE@@reflect-global-${theme}${size.tag}@@` + JSON.stringify(await ui.drawn()))
    await ui.press({ key: await keyOf('pick-project:') })
    await ui.press({ key: await keyOf('save:') })
    console.log(`@@TREE@@reflect-saved-${theme}${size.tag}@@` + JSON.stringify(await ui.drawn()))
  })
}

// The Ideas pane `/mine` opens, in each state, both themes; the desktop at full width and at about 400 px,
// the terminal once. English, as the interface is by default.
const PANE_SIZES = [{ tag: '', columns: 90 }, { tag: '-w400', columns: 50 }]
const RUN_MINE = { command: 'mine', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } } as never

async function drawPane($: Engine, o: { label: string; surface: 'desktop' | 'terminal'; columns: number }) {
  const ui = await $.ui.mount(paneSite(o.surface, o.columns))
  console.log(`@@TREE@@${o.label}@@` + JSON.stringify(await ui.drawn()))
  return ui
}

for (const [theme, size] of (['dark', 'light'] as const).flatMap(theme => PANE_SIZES.map(size => [theme, size] as const))) {
  const at = (state: string) => ({ label: `ideas-${state}-${theme}${size.tag}`, surface: 'desktop' as const, columns: size.columns })
  test(`preview ${theme}${size.tag}: ideas pane`, async ($, on) => {
    const w = mineWorld(on, { ideas: IDEAS, theme, lang: null })
    await start($)
    await $.command.run(RUN_MINE)
    await (await drawPane($, at('reading'))).unmount()
    await w.clock.settle()
    const ui = await drawPane($, at('list'))
    await ui.press({ key: 'idea-save:0' })
    console.log(`@@TREE@@ideas-offered-${theme}${size.tag}@@` + JSON.stringify(await ui.drawn()))
  })

  test(`preview ${theme}${size.tag}: ideas pane, empty`, async ($, on) => {
    const w = mineWorld(on, { theme, lang: null, chats: 'calm' })
    await start($)
    await mine($, w)
    await (await drawPane($, at('empty'))).unmount()
  })

  test(`preview ${theme}${size.tag}: ideas pane, model failed`, async ($, on) => {
    const w = mineWorld(on, { ideas: 'nope', theme, lang: null })
    await start($)
    await mine($, w)
    await (await drawPane($, at('failed'))).unmount()
  })
}

for (const theme of ['dark', 'light'] as const) {
  test(`preview terminal ${theme}: ideas pane`, async ($, on) => {
    const w = mineWorld(on, { ideas: IDEAS, theme, lang: null })
    await start($)
    await mine($, w)
    await (await drawPane($, { label: `ideas-terminal-${theme}`, surface: 'terminal', columns: 80 })).unmount()
  })
}
