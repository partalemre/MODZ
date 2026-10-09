import { expect, test } from 'claude-code/testing'

import { ALLOW } from '../hooks/card'
import { fresh, start } from './setup'

// A desktop that reattaches keeps a tree whose buttons the engine already released; the guard's
// question, whose answers are the pressables, is drawn again.

// Built from pieces so this file never holds a literal that a scanner would take for a real key.
const ANT = ['sk', 'ant', 'api03', 'Zx9Qw7Er5Ty3Ui1Op8As6Df4Gh2Jk'].join('-')

test('a reattaching desktop gets the guard question drawn again', async ($, on) => {
  const setup = fresh(ALLOW, 'desktop')
  on('session.attach', (_: any, e: any) => ({ clientId: e.clientId }))
  const seen: { card?: unknown; before?: number; after?: number } = {}
  setup.whileAsked = async questions => {
    const dialog = await ($ as any).ui.mount({
      plugin: 'secret-guard', component: 'AskUserQuestion', requestId: 'open', surface: 'desktop',
      viewport: { columns: 100, rows: 40 }, props: { tool: 'AskUserQuestion', questions },
    })
    seen.card = await dialog.find({ type: 'Svg' })
    // The stub beneath records each drawing that reaches it.
    seen.before = setup.dialogs.length
    await $.session.attach({ surface: 'desktop', clientId: 'desktop-2' })
    // A drawing follows an invalidate before its next read.
    await dialog.drawn()
    seen.after = setup.dialogs.length
    await dialog.unmount()
  }
  await start($, on, setup)

  await ($ as any).tool.call({ tool: 'Write', file_path: '/work/a.ts', content: `const k = "${ANT}"` })

  expect(seen.card).toBeDefined()
  expect(seen.after).toBeGreaterThan(seen.before ?? Infinity)
})
