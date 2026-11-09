// The desktop keeps the Agents pane's tab across an engine restart and asks it to draw while the new engine lists no
// such pane; the tab would read "Nothing to show yet". The pane opens again, once, and only for a tab this engine never
// held: one the person closed in this engine stays closed.
import { expect } from 'claude-code/testing'

import { PANE, setup, test } from './fixtures'

test('a tab kept from before a restart, drawn while no pane is listed, opens the pane again', async ($: any, on: any) => {
  const { world } = await setup($, on)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.redraw(PANE.props)
  expect(world.opened.filter((id: string) => id === PANE.requestId)).toHaveLength(1)
  expect(world.panes.map((p: any) => p.id)).toContain(PANE.requestId)
})

test('a pane this engine closed is not opened again by a late draw', async ($: any, on: any) => {
  const { world } = await setup($, on)
  const toggle = () => $.command.run({ command: 'agents-info', args: '' })
  await toggle()
  await toggle()
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.redraw(PANE.props)
  expect(world.opened.filter((id: string) => id === PANE.requestId)).toHaveLength(1)
  expect(world.panes).toEqual([])
})
