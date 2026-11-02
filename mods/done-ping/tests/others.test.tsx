import { expect, test } from 'claude-code/testing'

import { bandOf, setup, spyOf } from './world'
import { POLL_MS } from '../hooks/others'

// Another session on this computer that waits on you shows as a line above the prompt (in the terminal).

const waiting = (over: Record<string, unknown>) => ({ pid: 11, sessionId: 'web', status: 'waiting', waitingFor: 'permission prompt', cwd: '/work/web-shop', ...over })

test('another session waiting for approval shows its folder; this session, programs and dead ones do not', async ($, on) => {
  const spy = spyOf({
    lang: null,
    alive: [11, 13],
    sessions: [
      waiting({}),
      waiting({ pid: 12, sessionId: 'gone' }),
      waiting({ pid: 13, sessionId: 'me' }),
      waiting({ pid: 13, sessionId: 'bot', entrypoint: 'sdk-cli' }),
      waiting({ pid: 13, sessionId: 'menu', waitingFor: 'dialog open' }),
      { pid: 13, sessionId: 'busy', status: 'busy', cwd: '/work/api' },
    ],
  })
  await setup($, on, spy)

  const drawn = JSON.stringify(await (await $.ui.mount(bandOf('terminal') as any)).drawn())
  expect(drawn).toMatch(/web-shop/)
  expect(drawn).toMatch(/Waiting for approval/)
  expect(drawn).not.toMatch(/api|gone/)
})

test('✕ puts a wait away until it ends; the same session asking again shows', async ($, on) => {
  const spy = spyOf({ lang: null, alive: [11], sessions: [waiting({ waitingFor: 'input needed', name: 'release', nameSource: 'user' })] })
  await setup($, on, spy)
  const ui = await $.ui.mount(bandOf('terminal') as any)
  expect(JSON.stringify(await ui.drawn())).toMatch(/web-shop · release.*Waiting for an answer/)

  await ui.press({ key: 'done-ping-others-dismiss' })
  await spy.clock.advance(POLL_MS)
  expect(JSON.stringify(await ui.drawn())).not.toMatch(/web-shop/)

  spy.sessions = [waiting({ status: 'idle' })]
  await spy.clock.advance(POLL_MS)
  spy.sessions = [waiting({ waitingFor: 'input needed' })]
  await spy.clock.advance(POLL_MS)
  expect(JSON.stringify(await ui.drawn())).toMatch(/web-shop/)
})

test('on the desktop nothing is read: the app marks waiting sessions itself', async ($, on) => {
  const spy = spyOf({ surface: 'desktop', alive: [11], sessions: [waiting({})] })
  await setup($, on, spy)

  const drawn = JSON.stringify(await (await $.ui.mount(bandOf('desktop') as any)).drawn())
  expect(drawn).not.toMatch(/web-shop/)
  expect(spy.runs.some(argv => argv[0] === 'ps')).toBe(false)
})
