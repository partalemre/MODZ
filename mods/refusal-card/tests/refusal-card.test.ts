import { expect, test } from 'claude-code/testing'

import { excerpt, feedbackLine } from '../hooks/flag'

// A turn the safeguards refused leaves a card; its one button only fills the prompt box, never sends.

type World = { draft: string; filled: string[]; submitted: string[]; toasts: string[]; env: Record<string, string> }

function stub(on: any, w: World): void {
  on('session.start', () => ({ cwd: '/work' }))
  on('env.get', (_: any, e: any) => ({ value: w.env[e.name] }))
  on('config.list', () => ({ value: [{ key: 'theme', label: 'Theme', kind: 'enum', value: 'dark' }] }))
  on('ui.render', () => ({ type: 'Text', children: ['beneath'] }))
  on('ui.toast', (_: any, e: any) => {
    w.toasts.push(e.text)

    return { value: undefined }
  })
  on('ui.log', () => ({ value: undefined }))
  on('turn.start', (_: any, e: any) => ({ text: e.text, turnId: e.turnId }))
  on('turn.complete', (_: any, e: any) => ({ text: e.answer }))
  on('prompt.read', () => ({ value: { text: w.draft, cursor: 0 } }))
  on('prompt.fill', (_: any, e: any) => {
    w.filled.push(e.text)
    w.draft = e.text

    return { isFilled: true, box: { text: e.text, cursor: e.text.length } }
  })
  on('prompt.submit', (_: any, e: any) => {
    w.submitted.push(e.text)

    return { text: e.text }
  })
}

const fresh = (over: Partial<World> = {}): World => ({ draft: '', filled: [], submitted: [], toasts: [], env: {}, ...over })
const ended = (over: Record<string, unknown> = {}) => ({ answer: '', durationMs: 900, isAborted: false, turnId: 't1', reason: 'refusal', refusal: { category: 'cyber', explanation: null }, ...over })
const band = ($: any, surface = 'terminal') =>
  $.ui.mount({
    plugin: 'refusal-card', component: 'AbovePrompt', requestId: 'band', surface, viewport: { columns: 120, rows: 40 },
    props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 110, scroll: { top: 0, bodyRows: 20, rows: 20 }, view: {} },
  })

async function drawnText($: any, surface = 'terminal'): Promise<string> {
  const ui = await band($, surface)
  const text = JSON.stringify(await ui.drawn())
  await ui.unmount()

  return text
}

async function refused($: any, w: World, request = 'Explain how TLS certificate pinning works in my iOS app') {
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.turn.start({ text: request, turnId: 't1' })
  await $.turn.complete(ended())
}

for (const surface of ['terminal', 'desktop']) {
  test(`a refused turn shows the request; Report fills /feedback and sends nothing (${surface})`, async ($, on) => {
    const w = fresh()
    stub(on, w)
    await refused($, w)
    const ui = await band($, surface)
    const drawn = JSON.stringify(await ui.drawn())

    expect(drawn).toContain('Safeguards flagged this turn')
    expect(drawn).toContain('certificate pinning')
    await ui.press({ key: 'refusal-card-report' })
    await ui.unmount()

    expect(w.filled).toEqual(['/feedback False positive: the safeguards flagged a normal request and the turn stopped. Request: "Explain how TLS certificate pinning works in my iOS app" Category: cyber.'])
    expect(w.submitted).toEqual([])
    expect(await drawnText($, surface)).not.toContain('Safeguards flagged')
  })
}

test('a draft in the prompt box is never replaced; the card stays to try again', async ($, on) => {
  const w = fresh({ draft: 'half a thought' })
  stub(on, w)
  await refused($, w)
  const ui = await band($)
  await ui.press({ key: 'refusal-card-report' })
  await ui.unmount()

  expect(w.filled).toEqual([])
  expect(w.toasts[0]).toMatch(/has a draft/)
  expect(await drawnText($)).toContain('Safeguards flagged')
})

test('an answered turn, a subagent\'s refusal and Dismiss leave no card; the next prompt clears one', async ($, on) => {
  const w = fresh()
  stub(on, w)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.turn.start({ text: 'hello', turnId: 't1' })
  await $.turn.complete(ended({ reason: 'answer', refusal: undefined }))
  await $.turn.complete(ended({ agentId: 'agent-1' }))
  expect(await drawnText($)).not.toContain('Safeguards flagged')

  await $.turn.complete(ended())
  const ui = await band($)
  await ui.press({ key: 'refusal-card-dismiss' })
  await ui.unmount()
  expect(await drawnText($)).not.toContain('Safeguards flagged')

  await $.turn.complete(ended())
  await $.turn.start({ text: 'try again', turnId: 't2' })
  expect(await drawnText($)).not.toContain('Safeguards flagged')
  expect(w.submitted).toEqual([])
})

test('the card speaks Turkish with MODZ_LANG=tr; the report stays English', async ($, on) => {
  const w = fresh({ env: { MODZ_LANG: 'tr' } })
  stub(on, w)
  await refused($, w)
  const ui = await band($)
  expect(JSON.stringify(await ui.drawn())).toContain('Güvenlik filtresi bu turu durdurdu')
  await ui.press({ key: 'refusal-card-report' })
  expect(w.filled[0]).toMatch(/^\/feedback False positive/)
})

test('the quote is one line and short', () => {
  expect(excerpt('  a\n\n b  ')).toBe('a b')
  expect(excerpt('x'.repeat(500))).toHaveLength(240)
  expect(feedbackLine({ request: '', category: null, explanation: null })).toBe('/feedback False positive: the safeguards flagged a normal request and the turn stopped.')
})
