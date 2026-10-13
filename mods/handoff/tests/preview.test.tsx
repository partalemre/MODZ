import { test } from 'claude-code/testing'

import { MINUTE, bandOf, measure, newWorld, paneOf, said, start, stub } from './stubs'

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

// Visual states for bin/preview: the band card (ask, saved) and the pane (empty, with a note), on the desktop in
// both schemes and on the terminal. `-w<px>` names a narrow band.

const log = async (label: string, ui: any) => console.log(`@@TREE@@${label}@@${JSON.stringify(await ui.drawn())}`)

const MESSAGES = [
  said('user', 'Add a login form with email and password, then wire it to /api/session'),
  said('assistant', 'Form is in place; the API call is next.'),
  said('user', 'Also show an error under the field when the password is wrong'),
]

type Case = { name: string; surface: 'desktop' | 'terminal'; env: Record<string, string>; columns: number }
const CASES: Case[] = [
  { name: 'desktop-dark', surface: 'desktop', env: { MODZ_THEME: 'dark' }, columns: 100 },
  { name: 'desktop-dark-w520', surface: 'desktop', env: { MODZ_THEME: 'dark' }, columns: 65 },
  { name: 'desktop-light', surface: 'desktop', env: { MODZ_THEME: 'light' }, columns: 100 },
  { name: 'terminal', surface: 'terminal', env: {}, columns: 100 },
  { name: 'terminal-tr', surface: 'terminal', env: { MODZ_LANG: 'tr' }, columns: 100 },
]

// A test plugin is loaded apart from this file: its task list is written inside it.
const plan = {
  name: 'plan-steps',
  register(on: any) {
    on('session.start', async ($: any, e: any, next: any) => {
      await $.state.set({ plugin: 'plan-steps', key: 'tasks' }, [
        { id: '1', subject: 'Login form', status: 'completed' },
        { id: '2', subject: 'Wire /api/session', status: 'in_progress' },
        { id: '3', subject: 'Error under the field', status: 'pending' },
      ])

      return next(e)
    })
  },
}

for (const c of CASES) {
  test(`preview handoff states (${c.name})`, { plugins: [plan] }, async ($: any, on: any) => {
    const world = newWorld({ env: c.env, messages: MESSAGES })
    const clock = stub(on, world)
    await start($, c.surface)
    const pane = await $.ui.mount(paneOf(c.surface, Math.min(c.columns, 52)))
    await log(`pane-empty-${c.name}`, pane)
    await pane.unmount()

    await $.tool.call({ tool: 'Edit', file_path: '/w/src/login.tsx', old_string: 'a', new_string: 'b' })
    await $.tool.call({ tool: 'Write', file_path: '/w/src/api/session.ts', content: 'x' })
    await measure($, 82)
    const band = await $.ui.mount(bandOf(c.surface, { bodyColumns: c.columns }))
    await log(`band-ask-${c.name}`, band)
    await band.press({ key: 'handoff-write' })
    await log(`band-saved-${c.name}`, band)
    await band.unmount()

    await clock.advance(3 * MINUTE)
    await log(`pane-note-${c.name}`, await $.ui.mount(paneOf(c.surface, Math.min(c.columns, 52))))
  })
}
