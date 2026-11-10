import { expect, test } from 'claude-code/testing'

import { stepsFor } from '../hooks/record'
import { setLang } from '../hooks/lang'
import { SURFACES, bandOf, newWorld, paneOf, plannedTurn, replayCommand, setup, svgText, texts } from './fixtures'

// No card nobody asked for, what a turn's commands changed said plainly, and an edit shown in its file.

const done = (turnId: string) => ({ answer: 'tamam', durationMs: 1, isAborted: false, turnId, reason: 'answer' })
const shown = async (pane: any, surface: string) => (surface === 'desktop' ? `${await svgText(pane)}\n${(await texts(pane)).join('\n')}` : (await texts(pane)).join('\n'))

for (const surface of SURFACES) {
  test(`${surface}: a turn with edits leaves no card above the prompt`, async ($: any, on: any) => {
    const world = newWorld()
    await setup($, on, world)
    await plannedTurn($, world)

    const band = await $.ui.mount(bandOf(surface))
    expect(await texts(band)).toEqual(['engine'])
    expect(await band.find({ key: 'rt-open' })).toBeUndefined()
  })

  test(`${surface}: changes made by commands are named as not replayable`, async ($: any, on: any) => {
    const world = newWorld()
    const clock = await setup($, on, world)
    await $.turn.start({ text: 'iş', turnId: 't1' })
    await $.tool.call({ tool: 'Bash', command: "sed -i '' 's/greet/welcome/' README.md" })
    await $.tool.call({ tool: 'Bash', command: 'ls -la' })
    await $.turn.complete(done('t1'))
    await replayCommand($, clock, '')

    expect(await shown(await $.ui.mount(paneOf(surface)), surface)).toContain('Bu turda 1 komut dosyaları değiştirmiş olabilir; bu değişiklikler tekrar oynatılamaz.')
  })
}

test('an edit shows a few lines of the file around it', async ($: any, on: any) => {
  const world = newWorld()
  world.files['/w/src/long.js'] = ['a', 'b', 'c', 'd', 'old', 'e', 'f', 'g', 'h'].join('\n')
  const clock = await setup($, on, world)
  await $.turn.start({ text: 'iş', turnId: 't1' })
  await $.tool.call({ tool: 'Edit', file_path: '/w/src/long.js', old_string: 'old', new_string: 'new' })
  await $.turn.complete(done('t1'))
  await replayCommand($, clock, '')
  const text = (await texts(await $.ui.mount(paneOf('terminal')))).join('\n')

  for (const line of ['b', 'c', 'd', 'e', 'f', 'g']) expect(text).toMatch(new RegExp(`(^|\\s)${line}$`, 'm'))
  expect(text).not.toMatch(/(^|\s)a$/m)
})

test('a transcript that kept the file before the edit shows it around the change, with no span-only note', async () => {
  setLang('tr')
  const before = async () => ({ text: 'one\ntwo\nold\nthree\n', isNew: false })
  const [step] = await stepsFor({ cwd: '/w', before }, { tool: 'Edit', file_path: '/w/a.txt', old_string: 'old', new_string: 'new' })

  expect(step?.diff.map(line => `${line.op}${line.t}`)).toEqual([' one', ' two', '-old', '+new', ' three'])
  expect(step?.hasContext).toBe(true)
})
