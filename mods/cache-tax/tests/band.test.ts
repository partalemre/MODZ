import { describe, expect, mock, test, tier } from 'claude-code/testing'
import type { ModelForkResult, On } from 'claude-code'
import type { Engine } from 'claude-code/testing'

import { statusIcons } from '../hooks/status-icons'
import { HOUR, MIN, START, bandProps, prompt, run, session, themeChange, turn, usage, warm, world } from './world'

tier('user')

const WORD = /^(sıcak|soğuk|bilinmiyor|durdu)$/
const ROW = { type: 'Text', text: 'Önbellek · ' } as const
const LO = '#8E8A80'
const MOSS = '#6FC593'
const KILN_LIGHT = '#A94A26'
const MOSS_OF = { terminal: 'success', desktop: MOSS } as const
const KILN_OF = { terminal: 'claude', desktop: '#E58A5F' } as const

describe('status row', () => {
  test('redraws reuse session preferences and theme changes repaint immediately', async ($, on) => {
    mock.clock(on, { now: START })
    const w = world(on, [])
    await $.session.start({ ...session, surface: 'terminal', isInteractive: true })
    await $.command.run(run('keepwarm', '90m'))
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'terminal', component: 'AbovePrompt', props: bandProps })
    await $.turn.complete(turn())
    await $.command.run(run('keepwarm', '2h'))
    expect((await ui.find({ type: 'Image' }))?.props.source).toEqual({ png: statusIcons.dark.warm.png })
    expect(w.reads).toEqual({ theme: 1, env: 1 })
    await $.config.set(themeChange('light'))
    expect((await ui.find({ type: 'Image' }))?.props.source).toEqual({ png: statusIcons.light.warm.png })
    await $.config.set(themeChange('dark'))
    expect((await ui.find({ type: 'Image' }))?.props.source).toEqual({ png: statusIcons.dark.warm.png })
    expect(w.reads).toEqual({ theme: 1, env: 1 })
    expect(w.forks.length).toBe(0)
  })

  test('a denied theme change preserves the existing icon', async ($, on) => {
    mock.clock(on, { now: START })
    world(on, [], { denyTheme: true })
    await $.session.start({ ...session, surface: 'terminal', isInteractive: true })
    await $.command.run(run('keepwarm', '90m'))
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'terminal', component: 'AbovePrompt', props: bandProps })
    expect((await $.config.set(themeChange('light'))).deny).toBe('theme locked')
    await $.turn.complete(turn())
    expect((await ui.find({ type: 'Image' }))?.props.source).toEqual({ png: statusIcons.dark.warm.png })
  })

  test('the written theme wins over the requested value', async ($, on) => {
    mock.clock(on, { now: START })
    world(on, [], { writtenTheme: 'light' })
    await $.session.start({ ...session, surface: 'terminal', isInteractive: true })
    await $.command.run(run('keepwarm', '90m'))
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'terminal', component: 'AbovePrompt', props: bandProps })
    await $.config.set(themeChange('dark'))
    expect((await ui.find({ type: 'Image' }))?.props.source).toEqual({ png: statusIcons.light.neutral.png })
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    test(`${surface}: official cube follows state and theme with a text alternative`, async ($, on) => {
      const clock = mock.clock(on, { now: 10 * HOUR })
      const theme = { value: 'dark' }
      // A ping with nothing to fork leaves the window waiting, so the cache goes cold by the clock alone.
      const w = world(on, [{ isAnswered: false, reason: 'nothing-to-fork' } satisfies ModelForkResult], { theme })
      await $.session.start({ ...session, surface, isInteractive: true })
      await $.command.run(run('keepwarm', '3h'))
      const ui = await $.ui.mount({ plugin: 'cache-tax', surface, component: 'AbovePrompt', props: bandProps })
      const type = surface === 'terminal' ? 'Image' : 'Svg'
      const lid = async () => String((await ui.find({ type }))?.props.source ?? '')
      if (surface === 'terminal') expect((await ui.find({ type }))?.props.source).toEqual({ png: statusIcons.dark.neutral.png })
      else expect(await lid()).toContain(`fill="${LO}"`)
      expect((await ui.find({ type }))?.props.alt).toBe(surface === 'terminal' ? '[>]' : 'Cache Tax')
      if (surface === 'terminal') {
        expect((await ui.find({ type }))?.props.columns).toBe(3)
        expect((await ui.find({ type }))?.props.rows).toBe(1)
      }
      await $.turn.complete(turn())
      if (surface === 'terminal') expect((await ui.find({ type }))?.props.source).toEqual({ png: statusIcons.dark.warm.png })
      else expect(await lid()).toContain(`fill="${MOSS}"`)
      await $.config.set(themeChange('light'))
      await clock.advance(HOUR)
      if (surface === 'terminal') expect((await ui.find({ type }))?.props.source).toEqual({ png: statusIcons.light.cold.png })
      else expect(await lid()).toContain(`fill="${KILN_LIGHT}"`)
      expect((await ui.find({ type: 'Text', text: /^soğuk$/ }))?.props.color).toBe(surface === 'terminal' ? 'claude' : KILN_LIGHT)
      expect(w.forks.length).toBe(1)
      await $.command.run(run('keepwarm', 'off'))
      // keepwarm is off, but a cold cache this big still earns its row.
      expect((await ui.find(ROW))?.text).toMatch(/soğuk · 0 dk önce soğudu · sonraki mesaj en fazla \$4,01/)
    })

    test(`${surface}: NO_COLOR uses a bold text icon and uncolored state`, async ($, on) => {
      mock.clock(on, { now: START })
      world(on, [], { noColor: true })
      await $.session.start({ ...session, surface, isInteractive: true })
      await $.turn.complete(turn())
      await $.command.run(run('keepwarm', '90m'))
      const ui = await $.ui.mount({ plugin: 'cache-tax', surface, component: 'AbovePrompt', props: bandProps })
      expect(await ui.find({ type: 'Image' })).toBe(undefined)
      expect(await ui.find({ type: 'Svg' })).toBe(undefined)
      expect((await ui.find({ type: 'Text', text: /^\[>\]$/ }))?.props.bold).toBe(true)
      expect((await ui.find({ type: 'Text', text: /^sıcak$/ }))?.props.color).toBe(undefined)
    })
  }

  for (const surface of ['terminal', 'desktop'] as const) {
    test(`${surface}: unknown, warm, cold and warm again agree with the card`, async ($, on) => {
      const clock = mock.clock(on, { now: 10 * HOUR })
      const w = world(on, [{ isAnswered: false, reason: 'nothing-to-fork' } satisfies ModelForkResult], { bandText: 'other mod' })
      await $.session.start({ ...session, surface, isInteractive: true })
      const ui = await $.ui.mount({ plugin: 'cache-tax', surface, component: 'AbovePrompt', props: bandProps })
      expect(await ui.find({ text: 'Önbellek · ' })).toBe(undefined)
      await $.command.run(run('keepwarm', '3h'))
      expect((await ui.find({ type: 'Text', text: WORD }))?.props.color).toBe(undefined)
      expect((await ui.find(ROW))?.text).toMatch(/bilinmiyor.*ilk tur bekleniyor/)
      await $.turn.complete(turn())
      expect((await ui.find({ type: 'Text', text: WORD }))?.props.color).toBe(MOSS_OF[surface])
      expect((await ui.find(ROW))?.text).toMatch(/sıcak.*ping 50 dk sonra/)
      await clock.advance(HOUR)
      expect((await ui.find({ type: 'Text', text: WORD }))?.props.color).toBe(KILN_OF[surface])
      expect((await ui.find(ROW))?.text).toMatch(/soğuk.*şimdi soğuk/)
      expect((await $.command.run(run('cache-tax', ''))).text).toMatch(/durum       SOĞUK/)
      expect(w.forks.length).toBe(1)
      expect((await ui.find({ text: /^other mod$/ }))?.text).toBe('other mod')
      await $.turn.complete(turn())
      expect((await ui.find({ type: 'Text', text: WORD }))?.props.color).toBe(MOSS_OF[surface])
      expect((await $.command.run(run('cache-tax', ''))).text).toMatch(/durum       sıcak/)
      expect(w.status.filter(Boolean)).toEqual([])
      await $.command.run(run('keepwarm', 'off'))
      expect(await ui.find({ text: 'Önbellek · ' })).toBe(undefined)
      expect(w.forks.length).toBe(1)
    })
  }

  test('cold resume, compaction and clear reset the row without a ping', async ($, on) => {
    const clock = mock.clock(on, { now: 10 * HOUR })
    const w = world(on, [], { store: new Map([['deadline:S1', 13 * HOUR]]) })
    await $.session.start({ ...session, surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'terminal', component: 'AbovePrompt', props: bandProps })
    await $.classic.SessionStart({ source: 'resume', seconds_since_last_response: 7200, context_tokens: 200000, prompt_cache_likely_expired: true })
    expect((await ui.find({ type: 'Text', text: WORD }))?.props.color).toBe('claude')
    await $.session.compact({ trigger: 'manual', messages: [{ role: 'user', text: 'summary', toolUses: [] }] })
    expect((await ui.find({ type: 'Text', text: WORD }))?.props.color).toBe(undefined)
    expect((await ui.find(ROW))?.text).toMatch(/bilinmiyor.*sıkıştırmadan sonraki/)
    await clock.advance(HOUR)
    expect(w.forks.length).toBe(0)
    await $.turn.complete(turn())
    expect((await ui.find({ type: 'Text', text: WORD }))?.props.color).toBe('success')
    await $.classic.SessionStart({ source: 'clear' })
    expect(await ui.find({ text: 'Önbellek · ' })).toBe(undefined)
    await clock.advance(HOUR)
    expect(w.forks.length).toBe(0)
  })

  test('window expiry removes the row and surveys retain their band', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [], { bandText: 'survey' })
    await $.session.start({ ...session, surface: 'terminal', isInteractive: true })
    await $.turn.complete(turn())
    await $.command.run(run('keepwarm', '10m'))
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'terminal', component: 'AbovePrompt', props: bandProps })
    const survey = await $.ui.mount({ plugin: 'cache-tax', surface: 'terminal', component: 'AbovePrompt', props: { ...bandProps, hasSurvey: true } })
    expect(await survey.find({ text: 'Önbellek · ' })).toBe(undefined)
    expect((await survey.find({ text: 'survey' }))?.text).toBe('survey')
    await clock.advance(10 * MIN)
    expect(await ui.find({ text: 'Önbellek · ' })).toBe(undefined)
    expect(w.forks.length).toBe(0)
  })

  test('a warm resume restores green and ignores subagent cache activity; a stored hour-long period pings at 50m', async ($, on) => {
    const clock = mock.clock(on, { now: 10 * HOUR })
    const w = world(on, [{ isAnswered: false, reason: 'nothing-to-fork' } satisfies ModelForkResult], { store: new Map<string, unknown>([['deadline:S1', 13 * HOUR], ['every:S1', 90 * MIN]]) })
    await $.session.start({ ...session, surface: 'terminal', isInteractive: true })
    await $.classic.SessionStart({ source: 'resume', seconds_since_last_response: 30 * 60, context_tokens: 200000 })
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'terminal', component: 'AbovePrompt', props: bandProps })
    expect((await ui.find({ type: 'Text', text: WORD }))?.props.color).toBe('success')
    await $.turn.complete(turn({ agentId: 'worker' }))
    await $.session.compact({ trigger: 'manual', agentId: 'worker', messages: [{ role: 'user', text: 'summary', toolUses: [] }] })
    await clock.advance(30 * MIN)
    expect((await ui.find({ type: 'Text', text: WORD }))?.props.color).toBe('claude')
    expect(w.forks.length).toBe(1)
  })

  for (const surface of ['vscode', 'mobile', null] as const) {
    test(`${surface ?? 'headless'} keeps the plain status fallback`, async ($, on) => {
      mock.clock(on, { now: START })
      const w = world(on, [])
      await $.session.start({ ...session, surface })
      await $.turn.complete(turn())
      await $.command.run(run('keepwarm', '90m'))
      expect(w.status.at(-1)).toBe('keepwarm 1 sa 30 dk kaldı · ping 50 dk sonra')
      expect(w.status.at(-1)).not.toMatch(/\x1b/)
      expect(w.forks.length).toBe(0)
    })
  }

  test('a warm ping keeps the green row and a cold read stops it neutrally', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [warm, { read: 0, write: 200000 }])
    await $.session.start({ ...session, surface: 'terminal', isInteractive: true })
    await $.turn.complete(turn())
    await $.command.run(run('keepwarm', '3h'))
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'terminal', component: 'AbovePrompt', props: bandProps })
    await clock.advance(50 * MIN)
    expect((await ui.find({ type: 'Text', text: WORD }))?.props.color).toBe('success')
    expect((await ui.find(ROW))?.text).toMatch(/son ping 200k okudu/)
    await clock.advance(50 * MIN)
    expect((await ui.find({ type: 'Text', text: WORD }))?.props.color).toBe(undefined)
    expect((await ui.find(ROW))?.text).toMatch(/durdu.*önbellek zaten gitmişti/)
    await clock.advance(HOUR)
    expect(w.forks.length).toBe(2)
  })

  for (const failure of [
    { isAnswered: false, reason: 'api-error', status: 400, error: 'invalid_request', usage: usage() },
    { isAnswered: false, reason: 'empty-reply', usage: usage() },
    { isAnswered: false, reason: 'aborted', usage: usage() },
  ] satisfies ModelForkResult[]) {
    test(`structured fork failure ${failure.reason}${'status' in failure ? ` ${failure.status}` : ''} stops without retrying`, async ($, on) => {
      const clock = mock.clock(on, { now: START })
      const w = world(on, [failure])
      await $.session.start({ ...session, surface: 'terminal', isInteractive: true })
      await $.turn.complete(turn())
      await $.command.run(run('keepwarm', '3h every 1m'))
      const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'terminal', component: 'AbovePrompt', props: bandProps })
      await clock.advance(MIN)
      expect((await ui.find({ type: 'Text', text: WORD }))?.props.color).toBe(undefined)
      expect((await ui.find(ROW))?.text).toMatch(/durdu/)
      await clock.advance(2 * HOUR)
      expect(w.forks.length).toBe(1)
    })
  }
})

describe('keepwarm survives a restart and a busy API', () => {
  test('nothing to fork waits for the next turn instead of ending the window', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [{ isAnswered: false, reason: 'nothing-to-fork' } satisfies ModelForkResult, warm])
    await $.session.start({ ...session, surface: 'terminal', isInteractive: true })
    await $.turn.complete(turn())
    await $.command.run(run('keepwarm', '3h every 1m'))
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'terminal', component: 'AbovePrompt', props: bandProps })
    await clock.advance(MIN)
    expect((await ui.find(ROW))?.text).toMatch(/ilk tur bekleniyor/)
    await clock.advance(10 * MIN)
    expect(w.forks.length).toBe(1)
    await $.turn.complete(turn())
    await clock.advance(MIN)
    expect(w.forks.length).toBe(2)
    expect((await ui.find(ROW))?.text).toMatch(/son ping 200k okudu/)
  })

  test('a busy API is retried after 1, 2 and 4 minutes, then the window stops', async ($, on) => {
    const busy = { isAnswered: false, reason: 'api-error', status: 529, error: 'overloaded', usage: usage() } satisfies ModelForkResult
    const clock = mock.clock(on, { now: START })
    const w = world(on, [busy, busy, busy, busy, warm])
    await $.session.start({ ...session, surface: 'terminal', isInteractive: true })
    await $.turn.complete(turn())
    await $.command.run(run('keepwarm', '3h every 1m'))
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'terminal', component: 'AbovePrompt', props: bandProps })
    await clock.advance(MIN)
    expect(w.forks.length).toBe(1)
    await clock.advance(MIN)
    expect(w.forks.length).toBe(2)
    await clock.advance(2 * MIN)
    expect(w.forks.length).toBe(3)
    await clock.advance(4 * MIN)
    expect(w.forks.length).toBe(4)
    expect((await ui.find(ROW))?.text).toMatch(/durdu.*529/)
    await clock.advance(HOUR)
    expect(w.forks.length).toBe(4)
  })
})

describe('status row visibility', () => {
  test('without keepwarm it shows only a big cache going cold within ten minutes, or cold', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [])
    await $.session.start({ ...session, surface: 'desktop', isInteractive: true })
    expect(w.status).toEqual([])
    await $.turn.complete(turn())
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'desktop', component: 'AbovePrompt', props: bandProps })
    await clock.advance(49 * MIN)
    expect(await ui.find(ROW)).toBe(undefined)
    await clock.advance(2 * MIN)
    expect((await ui.find(ROW))?.text).toBe('Önbellek · sıcak · 9 dk içinde soğuyacak · /keepwarm ile sıcak tut')
    await clock.advance(10 * MIN)
    expect((await ui.find(ROW))?.text).toBe('Önbellek · soğuk · 1 dk önce soğudu · sonraki mesaj en fazla $4,01')
    expect(w.forks.length).toBe(0)
  })

  test('a small cache never earns the row', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    world(on, [])
    await $.session.start({ ...session, surface: 'desktop', isInteractive: true })
    await $.turn.complete(turn({ usage: usage({ cache_read_input_tokens: 20000 }) }))
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'desktop', component: 'AbovePrompt', props: bandProps })
    await clock.advance(2 * HOUR)
    expect(await ui.find(ROW)).toBe(undefined)
  })

  test('a narrow band drops the least important segments first', async ($, on) => {
    mock.clock(on, { now: START })
    world(on, [warm])
    await $.session.start({ ...session, surface: 'terminal', isInteractive: true })
    await $.turn.complete(turn())
    await $.command.run(run('keepwarm', '90m'))
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'terminal', component: 'AbovePrompt', props: { ...bandProps, bodyColumns: 50 } })
    expect((await ui.find(ROW))?.text).toBe(' Önbellek · sıcak · keepwarm 1 sa 30 dk kaldı')
  })
})

const HELD = 'Nerede kalmıştık? İki satırda özetle.'

async function holdOn($: Engine, on: On, surface: 'terminal' | 'desktop') {
  const clock = mock.clock(on, { now: START })
  const w = world(on, [])
  await $.session.start({ ...session, surface, isInteractive: true })
  await $.turn.complete(turn())
  await clock.advance(7 * HOUR)
  const ui = await $.ui.mount({ plugin: 'cache-tax', surface, component: 'AbovePrompt', props: bandProps })
  const dropped = await $.prompt.submit(prompt(HELD))
  return { w, ui, dropped }
}

describe('hold card', () => {
  for (const surface of ['terminal', 'desktop'] as const) {
    test(`${surface}: a cold send waits on the card, and pay sends it as the person's own words`, async ($, on) => {
      const { w, ui, dropped } = await holdOn($, on, surface)
      expect(dropped.drop).toBe('cache-tax: mesajın bekletiliyor, kartta seç (soğuk önbellek, en fazla $4,01).')
      expect(await ui.find({ key: 'cache-tax:hold' })).not.toBe(undefined)
      expect(await ui.find(ROW)).toBe(undefined)
      if (surface === 'desktop') {
        const header = String((await ui.find({ type: 'Svg' }))?.props.source)
        expect(header).toContain('ÖNBELLEK VERGİSİ')
        expect(header).toContain('Önbellek 6 sa önce soğudu.')
      } else expect(await ui.find({ type: 'Text', text: '● ÖNBELLEK VERGİSİ' })).not.toBe(undefined)
      expect((await ui.find({ type: 'Text', text: /^(⏸ )?Bekleyen: / }))?.text).toContain(`“${HELD}”`)
      expect((await ui.findAll({ type: 'Button' })).map(b => b.props.label)).toEqual(['Öde ve gönder', 'Yeni başla', 'Önbellek durumu'])
      await ui.press({ key: 'cache-tax:pay' })
      expect(w.entered).toEqual([HELD])
      expect(w.origins.at(-1)).toMatchObject({ kind: 'plugin', name: 'cache-tax', asUser: true })
      expect(await ui.find({ key: 'cache-tax:hold' })).toBe(undefined)
      await $.turn.complete(turn({ usage: usage({ cache_read_input_tokens: 0, cache_creation_input_tokens: 200502 }) }))
      expect(w.logs.at(-1)).toMatch(/201k token soğuk yazım ödendi \(\$4,01\)/)
    })
  }

  for (const surface of ['terminal', 'desktop'] as const) {
    test(`start fresh runs /clear and puts the held text back in the prompt box (${surface})`, async ($, on) => {
      const { w, ui } = await holdOn($, on, surface)
      await ui.press({ key: 'cache-tax:fresh' })
      expect(w.ran).toContain('clear')
      expect(w.fills).toEqual([HELD])
      expect(w.entered).toEqual([])
      expect(await ui.find({ key: 'cache-tax:hold' })).toBe(undefined)
    })

    test(`cache status leaves the card up, and typing the message again pays as before (${surface})`, async ($, on) => {
      const { w, ui } = await holdOn($, on, surface)
      await ui.press({ key: 'cache-tax:status' })
      expect(await ui.find({ key: 'cache-tax:hold' })).not.toBe(undefined)
      await $.prompt.submit(prompt(HELD))
      expect(w.entered).toEqual([HELD])
      expect(await ui.find({ key: 'cache-tax:hold' })).toBe(undefined)
    })
  }

  test('the comparison shows both prices, the token span, the price ratio and a visible warm sliver', async ($, on) => {
    const { ui } = await holdOn($, on, 'desktop')
    const compare = String((await ui.findAll({ type: 'Svg' }))[1]?.props.source)
    for (const part of ['Şimdi gönder', '$4,01', 'Sıcak bir tur', '$0,05', '~200.502 token', 'yeniden yazılır · $20/MTok', 'sıcakken olurdu · 80 kat ucuz']) {
      expect(compare).toContain(part)
    }
  })

  test('the terminal card says the same prices and ratio in text', async ($, on) => {
    const { ui } = await holdOn($, on, 'terminal')
    const drawn = JSON.stringify(await ui.drawn())
    for (const part of ['● ÖNBELLEK VERGİSİ', '$4,01', '$0,05', '80 kat ucuz', 'keepwarm önbelleği 3 sa tutsun']) {
      expect(drawn).toContain(part)
    }
  })
})
