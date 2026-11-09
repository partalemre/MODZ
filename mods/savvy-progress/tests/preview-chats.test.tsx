import { expect } from 'claude-code/testing'

import { TURNS_KEY } from '../hooks/mood'
import { test, BAND, PANE, SECOND, finish, mainEnd, mainStart, setup, spawn } from './fixtures'

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

// Preview trees for the other chats and the home crab (preview.test.tsx holds the rest; this file
// keeps both under the line limit). Each state is drawn on the desktop and on the terminal.

const MINUTE = 60 * SECOND
const SURFACES = ['desktop', 'terminal'] as const
const COLS = 60

const dump = async (label: string, ui: any, cols?: number) => {
  const tree = await ui.drawn()
  const framed = cols ? { type: 'Box', props: { width: cols, flexDirection: 'column' }, children: [tree] } : tree
  console.log('@@TREE@@' + label + '@@' + JSON.stringify(framed))
  expect(tree).toBeDefined()
}

const dumpPane = async ($: any, label: string, presses: string[] = []) => {
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface, props: { ...PANE.props, bodyColumns: COLS } })
    if (surface === 'desktop') for (const key of presses) await ui.press({ key })
    await dump(`${label}-${surface}`, ui, COLS)
    await ui.unmount()
  }
}

const beat = (project: string, title: string, state: string, minutes: number) => ({ project, title, state, since: -minutes * MINUTE, at: 0 })
const OTHERS = {
  'sessions/A': beat('shop', 'Fix the checkout total rounding', 'waiting', 12),
  'sessions/B': beat('MODZ', 'Hub row for the effort router', 'waiting', 3),
  'sessions/C': beat('blog', 'Draft the release notes', 'idle', 40),
}

// One agent done and the main loop's turn ended the way `reason` says: the header has a job to name.
async function turnEndedWith($: any, reason: string) {
  await spawn($, 'Research competitor launches')
  await finish($, 'a1')
  await mainStart($, 'Ship the launch kit')
  await mainEnd($, reason)
}

test('preview: panel with two other chats waiting and one idle, folded then open', async ($, on) => {
  await setup($, on, { store: { ...OTHERS, [TURNS_KEY]: 57 } })
  await turnEndedWith($, 'answer')
  await dumpPane($, 'panel-chats-waiting')
  await dumpPane($, 'panel-chats-open', ['chats'])
})

test('preview: empty panel with a chat waiting elsewhere', async ($, on) => {
  await setup($, on, { store: { 'sessions/A': OTHERS['sessions/A'] } })
  await dumpPane($, 'panel-empty-chat-waiting')
})

test('preview: empty panel with agents running in other chats', async ($, on) => {
  const crew = [
    { id: 'a', name: 'Coral', title: 'Kurul ve Direktör metinleri yaz', startedAt: -2 * MINUTE, costUsd: 0.28 },
    { id: 'b', name: 'Sol', title: 'Sonuç kartları ve triyaj yaz', startedAt: 0, costUsd: 0.17 },
  ]
  const store = { 'sessions/A': { ...beat('IK Oyunu', 'Oyunu arkada başlatma', 'working', 4), agents: crew }, 'sessions/B': { ...beat('Satranç 2', 'Macbook geliştirme', 'working', 1), agents: [crew[0]] } }
  await setup($, on, { store })
  await dumpPane($, 'panel-empty-crew-elsewhere')
})

test('preview: the home crab working, no agent running', async ($, on) => {
  await setup($, on, { store: { [TURNS_KEY]: 12 } })
  await spawn($, 'Research competitor launches')
  await finish($, 'a1')
  await mainStart($, 'Ship the launch kit')
  await dumpPane($, 'panel-crab-working')
})

for (const [mood, reason] of [['happy', 'answer'], ['worried', 'error']] as const) {
  test(`preview: the home crab ${mood} after the turn`, async ($, on) => {
    await setup($, on, { store: { [TURNS_KEY]: 199 } })
    await turnEndedWith($, reason)
    await dumpPane($, `panel-crab-${mood}`)
  })
}

test('preview: band with crabInBand on, the session idle', { options: { crabInBand: true } }, async ($, on) => {
  await setup($, on)
  await turnEndedWith($, 'answer')
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, requestId: `band-${surface}`, surface, props: { ...BAND.props, isWorking: false, bodyColumns: 80 } })
    await dump(`band-crab-${surface}`, ui)
  }
})
