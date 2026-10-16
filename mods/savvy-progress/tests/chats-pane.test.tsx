import { expect, test } from 'claude-code/testing'

import { PANE, SECOND, SURFACES, setup, spawn, svgOf } from './fixtures'

// The Agents pane and the other chats: a card at the top only while one of them waits on the
// person, the rest folded at the foot, and nothing at all when this is the only chat.

const MINUTE = 60 * SECOND
const NOW = 0
const beat = (project: string, state: string, minutes = 0) => ({ project, title: `${project} work`, state, since: NOW - minutes * MINUTE, at: NOW })
const sessions = (list: [string, string, number?][]) =>
  Object.fromEntries(list.map(([project, state, minutes], i) => [`sessions/X${i}`, beat(project, state, minutes)]))

for (const surface of SURFACES) {
  const mount = ($: any) => $.ui.mount({ ...PANE, surface })
  const seen = async (ui: any) => {
    const words = (await ui.findAll({ type: 'Text' })).map((t: any) => t.text ?? '')
    const labels = (await ui.findAll({ type: 'Button' })).map((b: any) => b.props?.label ?? '')
    const drawn = surface === 'desktop' ? await svgOf(ui) : ''
    return [...words, ...labels, drawn].join('\n')
  }

  test(`${surface}: the only chat on the machine shows no other chats at all`, async ($, on) => {
    await setup($, on)
    await spawn($, 'Task 1')
    const all = await seen(await mount($))
    expect(all).not.toContain('Diğer sohbetler')
    expect(all).not.toContain('DİĞER SOHBETLER')
    expect(all).not.toContain('SENİ BEKLİYOR')
  })

  test(`${surface}: a chat that waits gets the card at the top: project, title and how long`, async ($, on) => {
    await setup($, on, { store: sessions([['shop', 'waiting', 3], ['blog', 'idle']]) })
    const ui = await mount($)
    const all = await seen(ui)
    expect(all).toContain(surface === 'terminal' ? '● SENİ BEKLİYOR' : 'Seni bekliyor, shop · shop work · 3 dk bekliyor')
    expect(all).toContain('shop')
    expect(all).toContain('shop work')
    expect(all).toContain('3 dk bekliyor')
    // The idle one waits folded under its own row, its title out of sight.
    expect(all).not.toContain('blog work')
    const fold = await ui.find({ key: 'chats' })
    expect(fold?.props?.label).toBe(surface === 'terminal' ? '▸ Diğer sohbetler · 1' : 'Göster')
    await ui.press({ key: 'chats' })
    expect(await seen(ui)).toContain('blog · blog work · boşta')
  })

  test(`${surface}: the card names three waiting chats and counts the rest`, async ($, on) => {
    const five: [string, string, number][] = ['a', 'b', 'c', 'd', 'e'].map((name, i) => [`p-${name}`, 'waiting', i])
    await setup($, on, { store: sessions(five) })
    const all = await seen(await mount($))
    for (const name of ['p-e', 'p-d', 'p-c']) expect(all).toContain(name)
    expect(all).not.toContain('p-a work')
    expect(all).toContain('+2 daha')
  })

  test(`${surface}: chats that only work or idle get the folded row and no card`, async ($, on) => {
    await setup($, on, { store: sessions([['shop', 'working'], ['blog', 'idle']]) })
    const ui = await mount($)
    const all = await seen(ui)
    expect(all).not.toContain('bekliyor')
    expect(all).not.toContain('● SENİ BEKLİYOR')
    expect(await ui.find({ key: 'chats' })).toBeDefined()
    expect(all).toContain(surface === 'terminal' ? '▸ Diğer sohbetler · 2' : 'Göster')
  })
}
