import { expect, test } from 'claude-code/testing'

import { opens, world } from './world'

// A hub that draws the Files page in its own pane (modz.drawn): /filetree asks it for the page, the stage naming
// the page loads the tree with no pane of this mod's, and a press on the hub's page (modz.act) does what the same
// control does in this mod's own pane.

const ROOT = '/Users/k/MODZ'
const WORLD = { root: ROOT, files: ['src/', 'a.ts'], status: '## main\0', heads: { [ROOT]: ['1111111aaaa'] } }

// Stands for the MODZ hub: it runs, draws the Files page, and writes the stage and presses as modz does.
const modz = {
  name: 'modz',
  register(on: any) {
    const homes: unknown[] = []
    on('command.run', { command: 'hub-draws' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)
      await $.state.set({ plugin: 'modz', key: 'drawn' }, ['plan', 'files'])

      return {}
    })
    on('command.run', { command: 'hub-stage' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'stage' }, { pane: e.args, at: 1 })

      return {}
    })
    on('command.run', { command: 'hub-act' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'act' }, { page: 'files', ...JSON.parse(e.args), at: 1 })

      return {}
    })
    on('state.set', { key: 'home' }, async ($: any, e: any, next: any) => {
      homes.push({ from: e.plugin, value: e.value })

      return next(e)
    })
    on('command.run', { command: 'hub-homes' }, async () => ({ text: JSON.stringify(homes) }))
    on('command.run', { command: 'hub-tree' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'filetree', key: 'tree' })).value ?? null) }))
  },
}
const logs: string[] = []
const WITH_HUB = { timeoutMs: 20_000, plugins: [modz] } as any

async function start($: any, on: any, closed: unknown[] = []) {
  on('ui.close', (_: any, e: any) => (closed.push(e.id), { value: undefined }))
  on('ui.log', (_: any, e: any) => (logs.push(e.text ?? JSON.stringify(e)), { value: undefined }))
  const clock = world(on, { ...WORLD })
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  await clock.settle()
  await $.command.run({ command: 'hub-draws', args: '' })

  return clock
}

const run = async ($: any, command: string, args = '') => $.command.run({ command, args })
const treeOf = async ($: any) => JSON.parse((await run($, 'hub-tree')).text)
const ownOpens = (from: number) => opens.slice(from).filter(o => o.id === 'filetree')

test('/filetree asks the hub for its page and opens no pane of its own', WITH_HUB, async ($: any, on: any) => {
  const clock = await start($, on)
  const before = opens.length
  await $.command.run({ command: 'filetree', args: '', origin: { kind: 'person' }, presentation: { isFullscreen: true, columns: 200 } })
  await clock.settle()

  expect(ownOpens(before)).toEqual([])
  expect(JSON.parse((await run($, 'hub-homes')).text)).toEqual([{ from: 'filetree', value: { at: await clock.now(), pane: 'files' } }])
})

test('the stage naming the page loads the tree, closes this mod\'s pane and opens none', WITH_HUB, async ($: any, on: any) => {
  const closed: unknown[] = []
  const clock = await start($, on, closed)
  const before = opens.length
  await run($, 'hub-stage', 'files')
  await clock.settle()

  expect(closed).toEqual(['filetree'])
  expect(ownOpens(before)).toEqual([])
  const t = await treeOf($)
  expect(t.root).toBe(ROOT)
  expect(t.nodes.map((n: any) => n.name).sort()).toEqual(['a.ts', 'src'])
})

test('a press on the hub\'s page does what the same control does here: More, find, a folder\'s row', WITH_HUB, async ($: any, on: any) => {
  const clock = await start($, on)
  await run($, 'hub-stage', 'files')
  await clock.settle()

  await run($, 'hub-act', JSON.stringify({ action: 'more' }))
  await clock.settle()
  expect((await treeOf($)).showTools).toBe(true)

  await run($, 'hub-act', JSON.stringify({ action: 'find', arg: 'a.t' }))
  await clock.settle()
  expect((await treeOf($)).query).toBe('a.t')

  const rows = JSON.stringify({ data: { press: `${ROOT}/src` }, view: { from: 0, max: 0 }, surface: 'desktop' })
  await run($, 'hub-act', JSON.stringify({ action: 'rows', arg: rows }))
  await clock.settle()
  const t = await treeOf($)
  expect(logs).toEqual([])
  expect(t.expanded).toContain(`${ROOT}/src`)
  expect(t.cursor).toBe(`${ROOT}/src`)
})

test('a press for another page, or a malformed one, changes nothing', WITH_HUB, async ($: any, on: any) => {
  const clock = await start($, on)
  await run($, 'hub-stage', 'files')
  await clock.settle()
  const before = await treeOf($)
  await $.command.run({ command: 'hub-act', args: JSON.stringify({ page: 'plan', action: 'more' }) })
  await run($, 'hub-act', JSON.stringify({ action: 'rows', arg: '{not json' }))
  await clock.settle()

  expect((await treeOf($)).showTools).toBe(before.showTools)
})
