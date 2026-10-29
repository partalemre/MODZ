import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { hasTrigger } from '../hooks/register'
import { BAND, mount, rows, say, start, world } from './world'

const TR = 'hayır, bu repoda hep pnpm kullan, npm değil'
const PNPM_TR = { is_rule: true, rule: 'Bu projede paket yönetimi için npm yerine pnpm kullan.', scope: 'project', confidence: 0.95 }

const buttons = async ($: Engine, surface: 'terminal' | 'desktop' = 'terminal') => {
  const ui = surface === 'terminal' ? await mount($) : await $.ui.mount({ plugin: 'reflect-mod', surface, ...BAND })
  // `*` marks the recommended save: the card's one primary button, on the `k` key, first in the row.
  const all = await ui.findAll({ type: 'Button' })
  expect(all.filter(b => b.props.variant === 'primary').map(b => b.props.hotkey)).toEqual(['k'])
  const found = all.map(b => `${b.props.hotkey === 'k' ? '*' : ''}${b.props.label}`)
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
  expect((await ui.find({ type: 'Text', text: /^Kural olarak kaydedilsin mi\?/ }))?.text).toBe('Kural olarak kaydedilsin mi?  %95 emin')
  expect((await ui.find({ type: 'Text', text: /^Söylediğin: / }))?.text).toBe(`Söylediğin: “${TR}”`)
  await ui.unmount()
  expect(await buttons($)).toEqual(['Sadece bu proje', 'Tüm projelerin', '*Bu projeye kaydet', 'Tüm projelere kaydet', 'Yeniden yaz', 'Kaydetme'])
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`the card has one primary button, the save the picked row asks for (${surface})`, async ($, on) => {
    const w = world(on, { verdicts: { [TR]: PNPM_TR } })
    await start($)
    await say($, w, TR)
    expect((await buttons($, surface)).filter(label => label.startsWith('*'))).toEqual(['*Bu projeye kaydet'])
    await pressKey($, 'pick-global:', surface)
    expect((await buttons($, surface)).filter(label => label.startsWith('*'))).toEqual(['*Tüm projelere kaydet'])
  })
}

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

const STILL = '<style>*{animation:none!important;transition:none!important}</style></svg>'

test('desktop draws the card in Svg; each destination is one drawing pressed whole, the picked one on a wash', async ($, on) => {
  const w = world(on, { verdicts: { [TR]: PNPM_TR } })
  await start($)
  await say($, w, TR)
  const ui = await $.ui.mount({ plugin: 'reflect-mod', surface: 'desktop', ...BAND })
  const head = String((await ui.find({ type: 'Svg' }))?.props.source)
  for (const part of ['Kural olarak kaydedilsin mi?', '%95 emin', 'Söylediğin: ', 'Nereye', 'pnpm kullan.”']) expect(head).toContain(part)
  expect(head).not.toMatch(/letter-spacing|<rect[^>]*rx="10"/)
  const dest = async () => (await ui.findAll({ type: 'Box' })).filter(b => b.key?.startsWith('dest-'))
  const washed = async () => (await ui.findAll({ type: 'Svg' })).map(svg => String(svg.props.source).includes('opacity="0.55"'))
  expect((await dest()).map(b => b.props.borderStyle)).toEqual([undefined, undefined])
  expect((await washed()).slice(1)).toEqual([true, false])
  await ui.press({ key: (await ui.findAll({ type: 'Button' })).find(b => b.key?.startsWith('pick-global:'))?.key ?? '' })
  expect((await washed()).slice(1)).toEqual([false, true])
  const picks = (await ui.findAll({ type: 'Button' })).filter(b => b.key?.startsWith('pick-'))
  expect(picks.map(b => [b.props.plain, /^\u3164+$/.test(String(b.props.label))])).toEqual([[true, true], [true, true]])
  expect((await ui.findAll({ type: 'Svg' })).slice(1).every(svg => svg.props.isInteractive !== true && String(svg.props.source).endsWith(STILL))).toBe(true)
  expect((await ui.findAll({ type: 'Svg' })).slice(1).map(svg => svg.props.alt)).toEqual(['Sadece bu proje: repo/CLAUDE.md', 'Tüm projelerin: ~/.claude/CLAUDE.md'])
  await ui.unmount()
})

test('on a narrow desktop band both destinations stack their path the same way', async ($, on) => {
  const w = world(on, { verdicts: { [TR]: PNPM_TR }, root: () => '/Users/me/a-rather-long-project-name' })
  await start($)
  await say($, w, TR)
  const ui = await $.ui.mount({ plugin: 'reflect-mod', surface: 'desktop', ...BAND, props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 50 } as never })
  const heights = (await ui.findAll({ type: 'Svg' })).slice(1).map(svg => svg.props.height)
  expect(heights).toEqual([54, 54])
  await ui.unmount()
})
