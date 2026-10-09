import { expect, test } from 'claude-code/testing'

import { BAND, press, say, start, world } from './world'

// The desktop press race the band can meet: a desktop that reattaches keeps a tree whose buttons the
// engine already released. The band draws no Pane, so a focus flip never redraws it under a click.

const PNPM = { is_rule: true, rule: 'Use pnpm, not npm, in this repo', scope: 'project', confidence: 0.92 }
const STAMP = { key: 'render-stamp' }

test('a reattaching desktop gets the band drawn again', async ($, on) => {
  const w = world(on, { verdicts: { 'нет, используй pnpm': PNPM }, files: { '/repo/CLAUDE.md': '# Repo\n' } })
  on('session.attach', (_: unknown, e: any) => ({ clientId: e.clientId }) as never)
  await start($)
  await say($, w, 'нет, используй pnpm')
  await press($, 'save:')
  const band = await $.ui.mount({ plugin: 'reflect-mod', surface: 'desktop', ...BAND })
  const before = (await band.find(STAMP))?.text
  expect(before).toBeDefined()

  await $.session.attach({ surface: 'desktop', clientId: 'desktop-2' } as never)

  expect((await band.find(STAMP))?.text).not.toBe(before)
})
