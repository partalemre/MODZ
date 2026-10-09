import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { hasTrigger } from '../hooks/register'
import { BAND, mount, rows, say, start, world } from './world'

const TR = 'hayır, bu repoda hep pnpm kullan, npm değil'
const PNPM_TR = { is_rule: true, rule: 'Bu projede paket yönetimi için npm yerine pnpm kullan.', scope: 'project', confidence: 0.95 }

const buttons = async ($: Engine) => {
  const ui = await mount($)
  // `*` marks the recommended save: the one on the `k` key, first in the row (no button is drawn white).
  const found = (await ui.findAll({ type: 'Button' })).map(b => `${b.props.hotkey === 'k' ? '*' : ''}${b.props.label}`)
  await ui.unmount()
  return found
}

async function pressKey($: Engine, prefix: string, surface: 'terminal' | 'desktop' = 'terminal') {
  const ui = await $.ui.mount({ plugin: 'reflect-mod', surface, ...BAND })
  const key = (await ui.findAll({ type: 'Button' })).find(b => b.key?.startsWith(prefix))?.key ?? ''
  await ui.press({ key })
  await ui.unmount()
}

test('trigger words in Turkish and English gate the model call', () => {
  for (const t of ['hayır, pnpm kullan', 'bundan sonra testlerde gerçek DB kullan', 'İngilizce yazma, Türkçe cevap ver lütfen', 'never print secrets', 'no - use pnpm'])
    expect(hasTrigger(t)).toBe(true)
  for (const t of ['bunu düzelt', 'fix the login bug', 'şu dosyaya bak']) expect(hasTrigger(t)).toBe(false)
})

test('a Turkish correction: the card shows the rule, its confidence and the words it came from', async ($, on) => {
  const w = world(on, { verdicts: { [TR]: PNPM_TR } })
  await start($)
  await say($, w, 'tamam')
  await say($, w, 'bunu düzelt')
  await say($, w, TR)
  expect(w.asked).toEqual([TR])
  expect(await rows($)).toEqual(['“Bu projede paket yönetimi için npm yerine pnpm kullan.”'])
  const ui = await mount($)
  expect((await ui.find({ type: 'Text', text: /^● KURAL OLARAK KAYDEDİLSİN Mİ?/ }))?.text).toBe('● KURAL OLARAK KAYDEDİLSİN Mİ?  %95 emin')
  expect((await ui.find({ type: 'Text', text: /^Söylediğin: / }))?.text).toBe(`Söylediğin: “${TR}”`)
  await ui.unmount()
  expect(await buttons($)).toEqual(['Sadece bu proje', 'Tüm projelerin', '*Bu projeye kaydet', 'Tüm projelere kaydet', 'Yeniden yaz', 'Kaydetme'])
})

test('picking the global row moves the recommended button, and saving writes the global file', async ($, on) => {
  const w = world(on, { verdicts: { [TR]: PNPM_TR }, files: { '/home/u/.claude/CLAUDE.md': '# Me\n' } })
  await start($)
  await say($, w, TR)
  await pressKey($, 'pick-global:')
  expect(await buttons($)).toEqual(['Sadece bu proje', 'Tüm projelerin', '*Tüm projelere kaydet', 'Bu projeye kaydet', 'Yeniden yaz', 'Kaydetme'])
  await pressKey($, 'save:')
  expect(w.files['/home/u/.claude/CLAUDE.md']).toContain(`- ${PNPM_TR.rule}\n<!-- end claude-reflect -->`)
  expect(w.files['/repo/CLAUDE.md']).toBeUndefined()
  const ui = await mount($)
  expect((await ui.find({ type: 'Text', text: 'Tüm projelere kaydedildi' }))).not.toBe(undefined)
  await ui.unmount()
})

test('a rule either CLAUDE.md already holds is never proposed', async ($, on) => {
  const w = world(on, { verdicts: { [TR]: PNPM_TR }, files: { '/home/u/.claude/CLAUDE.md': `## Rules\n- ${PNPM_TR.rule}\n` } })
  await start($)
  await say($, w, TR)
  expect(w.asked).toEqual([TR])
  expect(await rows($)).toEqual([])
})

test('desktop draws the card in Svg with selectable rows and the band of others below', async ($, on) => {
  const w = world(on, { verdicts: { [TR]: PNPM_TR } })
  await start($)
  await say($, w, TR)
  const ui = await $.ui.mount({ plugin: 'reflect-mod', surface: 'desktop', ...BAND })
  const head = String((await ui.find({ type: 'Svg' }))?.props.source)
  for (const part of ['KURAL OLARAK KAYDEDİLSİN Mİ?', '%95 emin', 'Söylediğin: ', 'NEREYE', 'pnpm kullan.”']) expect(head).toContain(part)
  const project = await ui.find({ type: 'Box', key: (await ui.findAll({ type: 'Box' })).find(b => b.key?.startsWith('dest-project:'))?.key })
  expect(project?.props.borderColor).toBe('#2F5A42')
  await ui.press({ key: (await ui.findAll({ type: 'Button' })).find(b => b.key?.startsWith('pick-global:'))?.key ?? '' })
  const global = (await ui.findAll({ type: 'Box' })).find(b => b.key?.startsWith('dest-global:'))
  expect(global?.props.backgroundColor).toBe('#1B2F25')
  await ui.unmount()
})
