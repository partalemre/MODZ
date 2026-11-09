import { expect, mock, test } from 'claude-code/testing'

import { readGit } from '../hooks/collect'
import type { Io } from '../hooks/collect'

// What a refresh costs and leaves behind: the hub card, the "scanning" line, the error line and git's commands.
const REFRESH_MS = 120_000

const paneOf = () => ({
  plugin: 'projects', component: 'Pane', requestId: 'projects', surface: 'desktop', viewport: { columns: 160, rows: 40 },
  props: { title: 'Projects', isFocused: false, bodyColumns: 56, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
}) as const

type World = { hubs: unknown[]; busy: unknown[]; isWriteBroken: boolean }

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
  on('fs.read', () => ({ value: '' }))
  on('fs.list', () => ({ value: [] }))
  on('fs.write', () => {
    if (world.isWriteBroken) throw new Error('disk full')

    return { value: undefined }
  })
  on('state.set', { plugin: 'projects', key: 'hub' }, (_: any, e: any, next: any) => (world.hubs.push(e.value), next(e)))
  on('state.set', { plugin: 'projects', key: 'busy' }, (_: any, e: any, next: any) => (world.busy.push(e.value), next(e)))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
  await $.classic.SessionStart({ transcript_path: '/c/projects/x/s.jsonl' })

  return clock
}

const worldOf = (over: Partial<World> = {}): World => ({ hubs: [], busy: [], isWriteBroken: false, ...over })

test('a timed refresh that changes nothing neither rewrites the hub card nor says it is scanning', async ($: any, on: any) => {
  const world = worldOf()
  const clock = await start($, on, world)
  await $.command.run({ command: 'projects', args: '' })
  await clock.advance(REFRESH_MS)
  const [hubs, busy] = [world.hubs.length, world.busy.length]

  await clock.advance(REFRESH_MS)
  expect(world.hubs.length).toBe(hubs)
  expect(world.busy.length).toBe(busy)
})

test('a read that works again clears the error the failed one left', async ($: any, on: any) => {
  const world = worldOf({ isWriteBroken: true })
  const clock = await start($, on, world)
  await $.command.run({ command: 'projects', args: '' })
  const pane = await $.ui.mount(paneOf())
  expect(JSON.stringify(await pane.drawn())).toContain('Read failed')

  world.isWriteBroken = false
  await clock.advance(REFRESH_MS)
  expect(JSON.stringify(await pane.drawn())).not.toContain('Read failed')
})

test('git facts are read again only when HEAD, the index or the reflog moved; the working tree every time', async () => {
  const argv: string[] = []
  const stamp = { mtimeMs: 1 }
  const io = {
    list: async (dir: string) => (dir.endsWith('/.git') ? [{ name: 'HEAD', kind: 'file', size: 1, ...stamp }, { name: 'index', kind: 'file', size: 1, ...stamp }] : []),
    run: async (line: readonly string[]) => {
      argv.push(line.slice(3).join(' '))

      return { exitCode: 0, stdout: line.includes('log') ? 'abc\t1\tfeat: x' : line.includes('--count') ? '4' : '' }
    },
  } as unknown as Io
  const first = await readGit(io, '/cache/a')
  const reads = argv.length

  expect(await readGit(io, '/cache/a')).toEqual(first)
  expect(argv.slice(reads)).toEqual(['--no-optional-locks status --porcelain'])

  stamp.mtimeMs = 2
  await readGit(io, '/cache/a')
  expect(argv.slice(reads + 1).some(line => line.startsWith('log'))).toBe(true)
})
