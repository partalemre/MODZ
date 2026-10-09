import { expect, test } from 'claude-code/testing'

import { MINUTE, PANE, SURFACES, call, setup, shows, spy } from './fixtures'

for (const surface of SURFACES) {
  test(`the overview line counts agents and each row is named by its task (${surface})`, async ($, on) => {
    await setup($, on, spy())

    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await shows(ui, surface, /2 ajan · 1 çalışıyor · 1 bitti · en uzun 0 sn/)).toBe(true)
    expect((await ui.find({ key: 'pick-a1' }))?.props?.label).toBe('find auth code')
    expect((await ui.find({ key: 'pick-a2' }))?.props?.label).toBe('plan the ui')
    expect(await ui.find({ type: 'Text', text: 'Bitenler' })).toBeDefined()
  })

  test(`with no agent yet the pane introduces the team (${surface})`, async ($, on) => {
    await setup($, on, spy(), [])

    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await ui.find({ type: 'Text', text: /Henüz ajan yok/ })).toBeDefined()
    expect(await ui.find({ key: 'give-Explore' })).toBeDefined()
  })

  test(`only the desktop pane draws the timeline (${surface})`, async ($, on) => {
    await setup($, on, spy())

    const ui = await $.ui.mount({ ...PANE, surface })
    const svgs = await ui.findAll({ type: 'Svg' })
    const lanes = svgs.find((svg: any) => String(svg.props?.alt).startsWith('Zaman çizelgesi'))

    if (surface === 'desktop') expect(lanes?.props?.source).toContain('find auth code')
    else expect(svgs.length).toBe(0)
  })

  test(`a picked agent opens its card and its transcript sits behind a button (${surface})`, async ($, on) => {
    await setup($, on, spy())

    const ui = await $.ui.mount({ ...PANE, surface })
    await ui.press({ key: 'pick-a1' })
    expect(await ui.find({ key: 'stop-a1' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Find where login/ })).toBeUndefined()

    await ui.press({ key: 'log-a1' })
    expect(await ui.find({ type: 'Text', text: /Find where login/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Grep login/ })).toBeDefined()
  })

  test(`tool calls show activity, tool count and the explore phase, never a percent (${surface})`, async ($, on) => {
    await setup($, on, spy())

    await call($, { tool: 'Read', file_path: '/repo/src/auth/login.ts', agentId: 'a1' })
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await shows(ui, surface, '› Read auth/login.ts')).toBe(true)
    expect(await shows(ui, surface, '1 araç')).toBe(true)
    expect(await shows(ui, surface, '●○○○ keşif')).toBe(true)
    expect(await ui.find({ type: 'Text', text: /\d%/ })).toBeUndefined()
  })

  test(`edits count each file once and move the phase to editing (${surface})`, async ($, on) => {
    await setup($, on, spy())

    await call($, { tool: 'Edit', file_path: 'a.ts', old_string: 'x', new_string: 'y', agentId: 'a1' })
    await call($, { tool: 'Edit', file_path: 'a.ts', old_string: 'y', new_string: 'z', agentId: 'a1' })
    await call($, { tool: 'Write', file_path: 'b.ts', content: '', agentId: 'a1' })
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await shows(ui, surface, '3 araç · 2 dosya')).toBe(true)
    expect(await shows(ui, surface, '●●○○ düzenleme')).toBe(true)
  })

  test(`an agent quiet for over two minutes is flagged and surfaced (${surface})`, async ($, on) => {
    const clock = await setup($, on, spy())

    await clock.advance(3 * MINUTE)
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await shows(ui, surface, 'sessiz 3 dk')).toBe(true)
    expect(await shows(ui, surface, 'find auth code: sessiz 3 dk')).toBe(true)
    await ui.press({ key: 'attend' })
    expect(await ui.find({ key: 'log-a1' })).toBeDefined()
  })

  test(`a failing test run is flagged on the row (${surface})`, async ($, on) => {
    await setup($, on, spy())

    await call($, { tool: 'Bash', command: 'npm test', agentId: 'a1' })
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await shows(ui, surface, 'son test kırık')).toBe(true)
    expect(await shows(ui, surface, '●●●○ test')).toBe(true)
  })

  test(`eight general-purpose agents stay apart by their task (${surface})`, async ($, on) => {
    const list = Array.from({ length: 8 }, (_, index) => ({ id: `g${index}`, description: `job ${index}`, type: 'general-purpose', status: index < 6 ? 'running' : 'completed' }))
    await setup($, on, spy(), list)

    const ui = await $.ui.mount({ ...PANE, surface, props: { ...PANE.props, bodyColumns: 110 } })

    expect(await shows(ui, surface, /8 ajan · 6 çalışıyor · 2 bitti/)).toBe(true)
    expect((await ui.find({ key: 'pick-g5' }))?.props?.label).toBe('job 5')
    expect(await ui.find({ type: 'Text', text: 'general-purpose' })).toBeDefined()
  })
}
