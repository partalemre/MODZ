import { mock } from 'claude-code/testing'

// The engine stand-ins the filetree tests share: one repo folder, its git, and the session around it.

export type World = { root: string; files: string[]; status: string; heads: Record<string, string[]>; tool?: (e: any) => unknown }
export const opens: any[] = []

export function world(on: any, w: World) {
  mock.env(on, { HOME: '/Users/k' })
  const clock = mock.clock(on, { now: 1_800_000_000_000 })
  mock.store(on)
  on('session.start', (_$: any, e: any) => ({ cwd: e.cwd }))
  on('session.cwd', () => ({ value: w.root }))
  on('session.id', () => ({ value: 'hub' }))
  on('command.register', () => ({ value: undefined }))
  on('ui.open', (_$: any, e: any) => {
    opens.push(e)
    return { value: { isPlaced: true } }
  })
  on('ui.panes', () => ({ value: [] }))
  on('fs.read', () => {
    throw new Error('no file')
  })
  on('fs.list', (_$: any, e: any) => {
    if (e.path !== w.root) throw new Error(`ENOENT ${e.path}`)
    return { value: w.files.map(name => ({ name, kind: 'file', size: 1, mtimeMs: 1_700_000_000_000, isLink: false })) }
  })
  on('fs.stat', (_$: any, e: any) => {
    if (e.path === w.root) return { value: { kind: 'dir', size: 1, mtimeMs: 1, isLink: false } }
    if (w.files.some(f => `${w.root}/${f}` === e.path)) return { value: { kind: 'file', size: 1, mtimeMs: 1, isLink: false } }
    throw new Error(`ENOENT ${e.path}`)
  })
  on('process.run', (_$: any, e: any) => {
    const argv: string[] = [...e.argv]
    const ok = (stdout: string, exitCode = 0) => ({ value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
    if (argv[0] === 'uname') return ok('Darwin\n')
    if (argv[0] !== 'git') return ok('')
    const dir = argv[3] ?? ''
    const verb = argv.slice(4).find(a => !a.startsWith('-'))
    if (verb === 'rev-parse' && argv.at(-1) === 'HEAD') {
      const list = w.heads[dir] ?? []
      return list.length ? ok(`${list.length > 1 ? list.shift() : list[0]}\n`) : ok('', 128)
    }
    if (verb === 'rev-parse') return ok(`\n${w.root}\n`)
    if (verb === 'status') return ok(w.status)
    return ok('')
  })
  on('tool.call', (_$: any, e: any) => (w.tool?.(e) ?? { result: { stdout: '', stderr: '' } }) as any)
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', (_$: any, e: any) => ({ text: e.answer }))
  return clock
}
