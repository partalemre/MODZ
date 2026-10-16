import { expect, test } from 'claude-code/testing'

import { setLang } from '../hooks/kit/lang'
import { HUB_DETAIL_MAX, hubOf, snippetOf } from '../hooks/turns'
import { begin, spy, stateOf, step, stub, turn, worldOf } from './stubs'

// The hub's row: a card that names itself (the hub does not know this mod), a measured detail ≤40 chars,
// written only when what it shows changes.
const row = (turnId: string, sent: unknown) => ({ turnId, at: 0, snippet: '', cls: null, asked: sent, sent, model: 'claude-opus-5-5' }) as any

test('the card names its own row and counts the effort of the last five turns', { plugins: [spy] }, async ($: any, on: any) => {
  stub(on, worldOf())
  await begin($)
  expect(await stateOf($, 'hub')).toMatchObject({ pane: 'effort', detail: '', tone: 'idle', title: 'Effort', icon: 'bolt', section: 'meter' })

  const efforts = ['low', 'high', 'low', 'high', 'high', 'medium']
  for (const [i, effort] of efforts.entries()) await turn($, { text: `Prompt ${i}`, turnId: `t${i}`, effort })
  const card = await stateOf($, 'hub')
  expect(card.detail).toBe('medium · last 5: 3 high, 1 medium, 1 low')
  expect(card.detail.length).toBeLessThanOrEqual(HUB_DETAIL_MAX)

  await step($, { turnId: 't5', effort: 'medium', index: 1 })
  expect((await stateOf($, 'hub')).at).toBe(card.at)
})

test('Turkish: the card and its detail in Turkish', { plugins: [spy] }, async ($: any, on: any) => {
  stub(on, worldOf({ env: { MODZ_LANG: 'tr' } }))
  await begin($)
  await turn($, { text: 'Yardımcıyı yeniden adlandır', turnId: 't1', effort: 'high' })
  expect(await stateOf($, 'hub')).toMatchObject({ title: 'Efor', hint: 'Her turun eforu ve modeli', detail: 'high · son 1: 1 high' })
})

test('off says so on the hub', { options: { mode: 'off' }, plugins: [spy] }, async ($: any, on: any) => {
  stub(on, worldOf())
  await begin($)
  expect((await stateOf($, 'hub')).detail).toBe('off')
})

test('a detail that would pass 40 chars folds its smallest groups into "+N"', () => {
  setLang('en')
  const turns = [row('a', 'xhigh'), row('b', 'medium'), row('c', 'high'), row('d', 'low'), row('e', 'max')]
  const { detail } = hubOf(turns, 'show')
  expect(detail.length).toBeLessThanOrEqual(HUB_DETAIL_MAX)
  expect(detail.startsWith('xhigh · last 5: 1 xhigh')).toBe(true)
  expect(detail).toMatch(/\+\d$/)
  expect(hubOf([], 'auto')).toEqual({ detail: '', tone: 'idle' })
})

test('a snippet is the first line, masked and at most 40 chars', () => {
  expect(snippetOf('\n  Fix the login bug\nsecond line')).toBe('Fix the login bug')
  expect([...snippetOf('a'.repeat(10) + ' ' + 'word '.repeat(20))].length).toBeLessThanOrEqual(40)
  expect(snippetOf('set GITHUB_TOKEN=ghp_abcdef')).toBe('set GITHUB_TOKEN=****')
})
