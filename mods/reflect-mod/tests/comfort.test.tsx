import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

import { similarity } from '../hooks/register'
import { mount, press, rows, say, start, world } from './world'

const GAME = { is_rule: true, rule: 'Oyunda düşmanlar asla ışınlanmasın', scope: 'global', confidence: 0.9 }
const SAID = 'hayır, düşmanlar asla ışınlanmasın'

const labels = async ($: Engine) => {
  const ui = await mount($)
  const all = (await ui.findAll({ type: 'Button' })).filter(b => b.key?.startsWith('save:') || b.key?.startsWith('other:'))
  await ui.unmount()
  return all.map(b => b.props.label)
}

const run = ($: Engine, command: string) => $.command.run({ command, args: '' } as never) as Promise<{ text: string }>

test('the card picks this project whatever scope the model guessed, and the save buttons name their file', async ($, on) => {
  const w = world(on, { verdicts: { [SAID]: GAME } })
  await start($)
  await say($, w, SAID)
  expect(await labels($)).toEqual(['Bu projeye kaydet → repo/CLAUDE.md', 'Tüm projelere kaydet → ~/.claude/CLAUDE.md'])
  await press($, 'save:')
  expect(w.files['/repo/CLAUDE.md']).toContain('- Oyunda düşmanlar asla ışınlanmasın')
  expect(w.files['/home/u/.claude/CLAUDE.md']).toBeUndefined()
})

test('/reflect-undo takes the last saved line back out, and /reflect-queue lists what was written where', async ($, on) => {
  const w = world(on, { verdicts: { [SAID]: GAME }, files: { '/repo/CLAUDE.md': '# Repo\n' } })
  await start($)
  await say($, w, SAID)
  await press($, 'save:')
  const queue = await run($, 'reflect-queue')
  expect(queue.text).toContain('/repo/CLAUDE.md: Oyunda düşmanlar asla ışınlanmasın')
  const undo = await run($, 'reflect-undo')
  expect(undo.text).toContain('/repo/CLAUDE.md')
  expect(w.files['/repo/CLAUDE.md']).not.toContain('ışınlanmasın')
  expect((await run($, 'reflect-undo')).text).toBe('reflect: geri alınacak bir kayıt yok')
})

test('a Turkish rule reworded only by its suffixes is the same rule', () => {
  expect(similarity('Bu projede paket yönetimi için pnpm kullan', 'Bu projelerde paket yönetimi için pnpm kullanın')).toBeGreaterThanOrEqual(0.6)
  expect(similarity('Use pnpm, not npm, in this repo', 'Use npm, not pnpm, in this repo')).toBeLessThan(0.6)
})

const desktop = (on: On) => on('session.surfaces', async () => ({ value: ['desktop'] }) as never)

test('a prompt typed in the desktop app (an sdk prompt there) is checked', async ($, on) => {
  desktop(on)
  const w = world(on)
  await start($)
  await say($, w, 'always answer in English', 'sdk')
  expect(w.asked).toEqual(['always answer in English'])
})

test('an sdk prompt with no app around it (claude -p) is not', async ($, on) => {
  const w = world(on)
  await start($)
  await say($, w, 'always answer in English', 'sdk')
  expect(w.asked).toEqual([])
  expect(await rows($)).toEqual([])
})
