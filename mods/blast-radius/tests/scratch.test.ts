import { expect, test } from 'claude-code/testing'

import { isAllInside, plainPath, writtenPaths } from '../hooks/scratch'
import { classify } from '../hooks/classify'
import { BUILD_SCAN, EN, start, stub, world } from './world'

// The session's own scratchpad: a subagent's delete or overwrite there runs; anywhere else, the usual check.

const SCRATCH = '/tmp/claude-501/proj/sess-1/scratchpad'
const REAL = '/private/tmp/claude-501/proj/sess-1/scratchpad'
const call = ($: any, command: string) => $.tool.call({ tool: 'Bash', command, agentId: 'agent-1' })

// The scratch script on a disk where /tmp is /private/tmp and `link` inside the scratchpad leads to the project.
function fakeDisk(argv: string[]): string {
  const real = (path: string) => path.replace(/^\/tmp\//, '/private/tmp/').replace(`${REAL}/link`, '/work/demo-app')
  const [, , , , scratch = '', ...paths] = argv
  const rows = paths.map(path => {
    const parent = path.slice(0, path.lastIndexOf('/')) || '/'

    return `P\t${path.endsWith('/link') ? 1 : 0}\t${real(parent)}`
  })

  return [`S\t${real(scratch)}`, ...rows].join('\n')
}

const scratchWorld = () => world({ ...EN, scratch: SCRATCH, scratchRun: fakeDisk, answers: { files: BUILD_SCAN, writes: 'P\t40\tother\tx', [`find -L ${SCRATCH} -print`]: 'a\nb\n', [`find ${SCRATCH}/cache -name *.tmp -print`]: 'c\n' } })

test('a subagent deletes and overwrites files in its own scratchpad with no refusal', async ($, on) => {
  const w = scratchWorld()
  stub(on, w)
  await start($, w)

  expect((await call($, `rm -rf ${SCRATCH}/probe`))?.deny).toBeUndefined()
  expect((await call($, `rm -rf ${REAL}/probe/*`))?.deny).toBeUndefined()
  expect((await call($, `cd ${SCRATCH} && rm -rf out && echo hi > notes.txt`))?.deny).toBeUndefined()
  expect(w.ran).toHaveLength(3)
})

test('a traversal, a sibling folder, another session or a symlink out of the scratchpad keeps the refusal', async ($, on) => {
  const w = scratchWorld()
  stub(on, w)
  await start($, w)

  const ran: string[] = []
  for (const command of [
    `rm -rf ${SCRATCH}/../../other-session/scratchpad/x`,
    `rm -rf ${SCRATCH}-x/files`,
    'rm -rf /tmp/claude-501/proj/sess-2/scratchpad/x',
    `rm -rf ${SCRATCH}/link/src`,
    `rm -rf ${SCRATCH}/link/`,
    `cd ${SCRATCH}/.. && rm -rf build`,
    `rm -rf ${SCRATCH}/$HOME`,
    `find -L ${SCRATCH} -delete`,
    `find ${SCRATCH}/cache -name '*.tmp' -delete`,
    `rm -rf ${SCRATCH}/{..,x}`,
    'rm -rf build',
  ]) {
    if (!/it came from a subagent/.test(String(((await call($, command)) as any)?.deny))) ran.push(command)
  }
  expect(ran).toEqual([])
  expect(w.ran).toHaveLength(0)
})

test('a session with no scratchpad, or a scratch check that fails, keeps the usual check', async ($, on) => {
  const w = world({ ...EN, answers: { files: BUILD_SCAN } })
  stub(on, w)
  await start($, w)
  expect(((await call($, `rm -rf ${SCRATCH}/probe`)) as any)?.deny).toMatch(/it came from a subagent/)

  w.scratch = SCRATCH
  w.failing = ['scratch']
  expect(((await call($, `rm -rf ${SCRATCH}/probe`)) as any)?.deny).toMatch(/it came from a subagent/)
})

test('paths are read plainly or not at all', () => {
  expect(plainPath('a/./b', '/s')).toBe('/s/a/b')
  expect(plainPath('/s/x/../y', '/w')).toBeNull()
  expect(plainPath('~/x', '/s')).toBeNull()
  expect(plainPath('$D/x', '/s')).toBeNull()
  expect(plainPath('*/x', '/s')).toBeNull()
  expect(plainPath('x/.*', '/s')).toBeNull()
  expect(plainPath('x/', '/s')).toBeNull()
  expect(plainPath('x/*.log', '/s')).toBe('/s/x/*.log')
  expect(plainPath('{..,x}', '/s')).toBeNull()
  expect(writtenPaths(classify('find /s/a -name x -delete')!)).toBeNull()
  expect(writtenPaths(classify('git reset --hard')!)).toBeNull()
  expect(writtenPaths(classify('echo x > "/s/*.txt"')!)).toBeNull()
})

test('the script answer counts only when every path is inside, no symlink, and none is missing', () => {
  expect(isAllInside('S\t/r/s\nP\t0\t/r/s\nP\t0\t/r/s/a', 2)).toBe(true)
  expect(isAllInside('S\t/r/s\nP\t0\t/r/s-x', 1)).toBe(false)
  expect(isAllInside('S\t/r/s\nP\t1\t/r/s', 1)).toBe(false)
  expect(isAllInside('S\t/r/s\nP\t0\t', 1)).toBe(false)
  expect(isAllInside('S\t/r/s\nP\t0\t/r/s', 2)).toBe(false)
  expect(isAllInside('', 0)).toBe(false)
})
