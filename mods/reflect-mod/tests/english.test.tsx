import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { BAND, say, start, world } from './world'

// Without MODZ_LANG every word the card, its toasts and the commands show is English. The prompt
// prefilter still hears Turkish and English alike.

const SAID = 'no - always use pnpm here, not npm'
const PNPM = { is_rule: true, rule: 'Use pnpm, not npm, in this repo.', scope: 'project', confidence: 0.92 }
const TURKISH = /[çğıöşüİ]/
const SURFACES = ['terminal', 'desktop'] as const

const mountOn = ($: Engine, surface: (typeof SURFACES)[number]) => $.ui.mount({ plugin: 'reflect-mod', surface, ...BAND })

async function buttons($: Engine, surface: (typeof SURFACES)[number]) {
  const ui = await mountOn($, surface)
  const all = await ui.findAll({ type: 'Button' })
  await ui.unmount()
  return all.map(b => `${b.props.variant === 'primary' ? `[${b.props.hotkey}]` : ''}${b.props.label}`)
}

async function pressOn($: Engine, surface: (typeof SURFACES)[number], prefix: string) {
  const ui = await mountOn($, surface)
  await ui.press({ key: (await ui.findAll({ type: 'Button' })).find(b => b.key?.startsWith(prefix))?.key ?? '' })
  await ui.unmount()
}

for (const surface of SURFACES) {
  test(`English: the correction card, its scope choices and the saved state (${surface})`, async ($, on) => {
    const w = world(on, { lang: null, verdicts: { [SAID]: PNPM }, files: { '/repo/CLAUDE.md': '# Repo\n' } })
    await start($)
    await say($, w, SAID)
    // The desktop's destination rows are pressed whole: their buttons carry a blank label (Hangul fillers), the drawing's alt the words.
    const blank = (label: string) => (/^\u3164+$/.test(label) ? '~' : label)
    const picks = surface === 'desktop' ? ['~', '~'] : ['This project only', 'All your projects']
    expect((await buttons($, surface)).map(blank)).toEqual([...picks, '[s]Save to this project', 'Save to all projects', 'Rewrite', "Don't save"])
    const ui = await mountOn($, surface)
    const card = JSON.stringify(await ui.drawn())
    for (const part of ['Save as a rule?', '92% sure', 'You said: ', 'Where']) expect(card).toContain(part)
    expect(card).not.toMatch(TURKISH)
    await ui.unmount()

    await pressOn($, surface, 'pick-global:')
    expect((await buttons($, surface)).filter(label => label.startsWith('['))).toEqual(['[s]Save to all projects'])
    await pressOn($, surface, 'other:')
    const saved = JSON.stringify(await (await mountOn($, surface)).drawn())
    for (const part of ['Rule saved', 'Saved to this project', 'Added to: ']) expect(saved).toContain(part)
    expect(saved).not.toMatch(TURKISH)
  })
}

test('English: the queue and pause commands answer in English; a Turkish correction is still caught', async ($, on) => {
  const TR = 'hayır, bu repoda hep pnpm kullan'
  const w = world(on, { lang: null, verdicts: { [TR]: PNPM } })
  await start($)
  expect(await $.command.run({ command: 'reflect-queue', args: '' } as never)).toMatchObject({ text: 'Nothing found here yet.' })
  await say($, w, TR)
  expect(w.asked).toEqual([TR])
  expect((await $.command.run({ command: 'reflect-queue', args: '' } as never)).text)
    .toBe('1 waiting, 1 in all (here and global)\nwaiting ×1 project Use pnpm, not npm, in this repo.')
  expect(await $.command.run({ command: 'reflect-pause', args: '' } as never)).toMatchObject({ text: 'Paused. Your prompts are not checked.' })
})
