import { expect, mock, test } from 'claude-code/testing'

// What the pane costs once it is gone: no timed reads, and no rewrite of files that did not change.
const REFRESH_MS = 120_000

// Stands for the MODZ main panel, which writes the stage.
const modz = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'modz-stage' }, async ($: any, e: any) => (await $.state.set({ plugin: 'modz', key: 'stage' }, { pane: e.args, at: 1 }), {}))
  },
}

type World = { lists: number; writes: string[] }

async function start($: any, on: any, world: World) {
  const clock = mock.clock(on)
  mock.env(on, {})
  for (const name of ['command.register', 'ui.log', 'ui.status', 'store.set']) on(name, () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/w' }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('classic.SessionStart', () => ({}))
  on('process.run', () => ({ value: { exitCode: 0, stdout: 'Darwin', stderr: '' } }))
  on('store.get', () => ({ value: undefined }))
  const disk = new Map<string, string>()
  on('fs.read', (_: any, e: any) => ({ value: disk.get(e.path) ?? '' }))
  on('fs.list', () => (world.lists++, { value: [] }))
  on('fs.write', (_: any, e: any) => (world.writes.push(e.path), disk.set(e.path, e.text), { value: undefined }))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
  await $.classic.SessionStart({ transcript_path: '/c/projects/x/s.jsonl' })

  return clock
}

test('another pane taking the stage stops the timed reads', { plugins: [modz] } as any, async ($: any, on: any) => {
  const world: World = { lists: 0, writes: [] }
  const clock = await start($, on, world)
  await $.command.run({ command: 'projects', args: '' })
  await clock.advance(REFRESH_MS)
  await $.command.run({ command: 'modz-stage', args: 'filetree' })
  const lists = world.lists

  await clock.advance(REFRESH_MS * 3)
  expect(world.lists).toBe(lists)
})

test('a timed read that finds nothing new writes no file', async ($: any, on: any) => {
  const world: World = { lists: 0, writes: [] }
  const clock = await start($, on, world)
  await $.command.run({ command: 'projects', args: '' })
  await clock.advance(REFRESH_MS)
  const writes = world.writes.length

  await clock.advance(REFRESH_MS)
  expect(world.writes.slice(writes)).toEqual([])
})
