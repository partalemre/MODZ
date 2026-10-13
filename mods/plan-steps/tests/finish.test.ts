import { expect, test } from 'claude-code/testing'

import { ALL_DONE, carried, compact, drawnText, kept, mountBand, seen, todos, turn, UNDER_WAY, UNSTARTED, world } from './world'

const SURFACES = ['terminal', 'desktop'] as const

const CONTINUE = 'Continue the plan with the next open step: Draw the band. Keep the task list current as you go.'

for (const surface of SURFACES) {
  test(`${surface}: an answer that worked on the plan and left steps open gets the PLAN card`, async ($: any, on: any) => {
    await world($, on)
    await turn($, () => $.tool.call(UNDER_WAY))
    const band = await mountBand($, surface)
    const text = await drawnText(band)
    expect(text).toContain('2 of 3 steps still open')
    expect(text).toContain('Next: Draw the band')
    expect(text).toContain('PLAN')
    for (const label of ['Continue the plan', 'Mark plan done', 'Not now']) expect(text).toContain(label)
    if (surface === 'terminal') expect(text).toContain('●')
    if (surface === 'desktop') expect(text).toContain('1/3')

    await turn($, async () => {})
    expect(await drawnText(band)).not.toContain('still open')
  })

  test(`${surface}: "Continue the plan" asks Claude to go on with the next open step, and the card goes`, async ($: any, on: any) => {
    await world($, on)
    await turn($, () => $.tool.call(UNDER_WAY))
    const band = await mountBand($, surface)
    await band.press({ key: 'plan-continue' })
    expect(seen.submitted).toEqual([CONTINUE])
    expect(await drawnText(band)).not.toContain('still open')
  })

  test(`${surface}: "Mark plan done" drops the kept plan and its carrying, and the card stays away`, async ($: any, on: any) => {
    await world($, on)
    await turn($, () => $.tool.call(UNDER_WAY))
    await compact($)
    const band = await mountBand($, surface)
    await band.press({ key: 'plan-done' })
    expect(await drawnText(band)).not.toContain('still open')
    expect(await carried($)).toBeUndefined()
    expect(kept()).toBeUndefined()

    await turn($, () => $.tool.call(UNDER_WAY))
    expect(await drawnText(band)).not.toContain('still open')
    expect(kept()).toBeUndefined()
    expect(seen.submitted).toEqual([])
  })

  test(`${surface}: "Not now" only hides the card`, async ($: any, on: any) => {
    await world($, on)
    await turn($, () => $.tool.call(UNDER_WAY))
    const band = await mountBand($, surface)
    await band.press({ key: 'plan-later' })
    expect(await drawnText(band)).not.toContain('still open')
    expect(kept()).toBeDefined()
    expect(seen.submitted).toEqual([])
  })
}

test('no card for a subagent\'s turn, an interrupted turn, or a turn that left the plan alone', async ($: any, on: any) => {
  await world($, on)
  const band = await mountBand($, 'terminal')
  await turn($, () => $.tool.call(UNDER_WAY), { agentId: 'ag-1' })
  expect(await drawnText(band)).not.toContain('still open')
  await turn($, () => $.tool.call(UNDER_WAY), { reason: 'aborted' })
  expect(await drawnText(band)).not.toContain('still open')
  await turn($, async () => {})
  expect(await drawnText(band)).not.toContain('still open')
})

test('no card when every step is done, or when no step has started yet', async ($: any, on: any) => {
  await world($, on)
  const band = await mountBand($, 'terminal')
  await turn($, () => $.tool.call(ALL_DONE))
  expect(await drawnText(band)).not.toContain('still open')
  await turn($, () => $.tool.call(UNSTARTED))
  expect(await drawnText(band)).not.toContain('still open')
})

test('a question in the band holds it: the card yields', async ($: any, on: any) => {
  await world($, on)
  await turn($, () => $.tool.call(UNDER_WAY))
  const band = await mountBand($, 'terminal', true)
  expect(await drawnText(band)).not.toContain('still open')
})

test('the card reads Turkish with MODZ_LANG=tr', async ($: any, on: any) => {
  await world($, on, { lang: 'tr' })
  await turn($, () => $.tool.call(todos([['Tipleri yaz', 'completed'], ['Bandı çiz', 'in_progress'], ['README', 'pending']])))
  const text = await drawnText(await mountBand($, 'terminal'))
  for (const part of ['2/3 adım hâlâ açık', 'Sıradaki: Bandı çiz', 'Plana devam et', 'Planı bitti say', 'Şimdi değil']) expect(text).toContain(part)
})

test('strict mode goes on by itself twice per plan, then shows the card', { options: { holdFinish: true } }, async ($: any, on: any) => {
  await world($, on)
  const band = await mountBand($, 'terminal')
  await turn($, () => $.tool.call(UNDER_WAY))
  await turn($, () => $.tool.call(UNDER_WAY))
  expect(seen.submitted).toEqual([CONTINUE, CONTINUE])
  expect(await drawnText(band)).not.toContain('still open')

  await turn($, () => $.tool.call(UNDER_WAY))
  expect(seen.submitted).toHaveLength(2)
  expect(await drawnText(band)).toContain('2 of 3 steps still open')
})

test('without the setting nothing is submitted on its own', async ($: any, on: any) => {
  await world($, on)
  await turn($, () => $.tool.call(UNDER_WAY))
  await turn($, () => $.tool.call(UNDER_WAY))
  expect(seen.submitted).toEqual([])
})
