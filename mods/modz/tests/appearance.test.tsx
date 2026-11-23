// The hub's drawings follow the app they are drawn in: Claude Code's `theme` setting is the terminal's, and unset
// it reads `dark`, which once pinned the pane dark (black sheets, pale names) in a light desktop app.
import { expect } from 'claude-code/testing'
import { test } from './budget'

import { stubWorld } from './world'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', surface: 'desktop', props: {}, viewport: { columns: 100, rows: 40 } } as const

// A drawing's own class, as it stands in the drawn tree's JSON; the style sheet names every palette.
const cls = (theme: string) => `class=\\"${theme}\\"`

async function hubDrawn($: any, on: any, env: Record<string, string>): Promise<string> {
  stubWorld(on, { env })
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })

  return JSON.stringify(await (await $.ui.mount(PANE)).drawn())
}

test('the theme setting does not pin the hub: its drawings follow the app', async ($: any, on: any) => {
  const drawn = await hubDrawn($, on, { MODZ_LANG: 'tr' })

  expect(drawn).toContain(cls('t-auto'))
  expect(drawn).not.toContain(cls('t-dark'))
})

test('MODZ_THEME still pins a palette for a person who asks for one', async ($: any, on: any) => {
  const drawn = await hubDrawn($, on, { MODZ_LANG: 'tr', MODZ_THEME: 'light' })

  expect(drawn).toContain(cls('t-light'))
  expect(drawn).not.toContain(cls('t-auto'))
})
