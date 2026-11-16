// `/modz check`: each question the mods ask the engine, with its answer or why none came.
import { expect, test } from 'claude-code/testing'

import { checkText, type CheckFacts } from '../hooks/check'
import { setLang } from '../hooks/kit/lang'

const ok = (said: string) => ({ isOk: true, said })
const FACTS: CheckFacts = { version: ok('2.1.317'), surfaces: ok('desktop'), cost: ok('$0.42'), model: ok('haiku'), system: 'Windows', mods: ['modz', 'savvy-progress'] }

test('every answer is a ticked line, and the text says nothing is wrong', () => {
  setLang('en')
  const text = checkText(FACTS)

  expect(text).toContain('✓ Claude Code version: 2.1.317')
  expect(text).toContain('Mods on: modz, savvy-progress')
  expect(text).toContain('Everything answered')
  expect(text).not.toContain('✗')
})

test('a question with no answer is crossed and named as the reason for a zero', () => {
  setLang('tr')
  const text = checkText({ ...FACTS, cost: { isOk: false, said: 'henüz okuma yok' }, mods: [] })

  expect(text).toContain('✗ Maliyet okuması: henüz okuma yok')
  expect(text).toContain('Açık modlar: yok')
  expect(text).toContain('✗ işaretli satırlar')
  setLang('en')
})
