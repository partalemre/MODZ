// The slash commands: /reflect-queue (what was found here and what the mod wrote where), /reflect-pause, /reflect-undo.

import { atom, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import { isHere, items } from './learn'
import type { Io } from './learn'
import { popWritten, withoutRule, writtenList } from './undo'
import { words } from './words'

const MAX_LISTED = 40

const savedThisSession = atom({ plugin: 'reflect-mod', key: 'savedThisSession' } as const, [])

export type CommandDeps = {
  /** Empties the prompts still waiting for a check. */
  clearQueue: () => void
}

async function readText($: EngineInterface, path: string): Promise<string> {
  if (!(await $.fs.exists(path))) return ''
  const got = await $.fs.read(path)
  return typeof got === 'string' ? got : ''
}

function ioOf($: EngineInterface): Io {
  return { get: key => $.store.get(key), set: (key, value) => $.store.set(key, value), now: () => $.clock.now(), read: path => readText($, path) }
}

// Columns as wide as the language's longest word, so the rules line up.
const widest = (table: Record<string, string>): number => Math.max(...Object.values(table).map(word => word.length))

async function queueText($: EngineInterface): Promise<string> {
  const root = await $.session.root()
  const list = (await items(ioOf($))).filter(l => isHere(l, root))
  const written = (await writtenList(ioOf($))).map(w => `  ${w.path}: ${w.rule}`)
  const says = words()
  const tail = written.length === 0 ? [] : ['', says.writtenHead, ...written]
  if (list.length === 0) return [says.nothingHere, ...tail].join('\n')
  const waiting = list.filter(l => l.status === 'pending')
  const lines = [...waiting, ...list.filter(l => l.status !== 'pending').sort((a, b) => b.lastAt - a.lastAt)]
    .slice(0, MAX_LISTED)
    .map(l => `${says.status[l.status].padEnd(widest(says.status))} ×${l.count} ${says.scope[l.scope].padEnd(widest(says.scope))} ${l.rule}`)
  return [says.queueHead(waiting.length, list.length), ...lines, ...tail].join('\n')
}

async function undoLast($: EngineInterface): Promise<string> {
  const last = await popWritten(ioOf($))
  if (last === undefined) return words().nothingToUndo
  const before = await readText($, last.path)
  const after = withoutRule(before, last.rule)
  if (after !== before) await $.fs.write(last.path, after)
  // The undone rule leaves this session's prompt too.
  await update($, savedThisSession, rules => rules.filter(saved => saved.rule !== last.rule))
  return words().undone(last.rule, last.path)
}

export function wireCommands(on: On, d: CommandDeps) {
  on('command.run', { command: 'reflect-queue' }, async $ => ({ text: await queueText($) }))

  on('command.run', { command: 'reflect-undo' }, async $ => ({ text: await undoLast($) }))

  on('command.run', { command: 'reflect-pause' }, async $ => {
    const isPaused = (await $.store.get('paused')) !== true
    await $.store.set('paused', isPaused)
    if (isPaused) d.clearQueue()
    return { text: isPaused ? words().paused : words().resumed }
  })
}
