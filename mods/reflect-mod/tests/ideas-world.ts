// `/mine` in the mocked world: the project's transcript folder with the fixture chats, and the Ideas pane.
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

import { CHAT_A, CHAT_B, CHAT_C, CHAT_NOW } from './fixtures/chats'
import { world } from './world'
import type { Opts } from './world'

export const FOLDER = '/home/u/.claude/projects/-repo'

export const IDEAS = JSON.stringify({ ideas: [
  { type: 'rule', text: 'Use pnpm, not npm, in this repo', why: 'You corrected this twice', from: 4 },
  { type: 'hook', text: 'Make a PreToolUse hook that runs pnpm test instead of npm test', why: 'npm test failed 3 times', from: 1 },
] })

const ALL = { a: CHAT_A, b: CHAT_B, c: CHAT_C, now: CHAT_NOW }

/**
 * The world with the fixture chats in place. `chats`: 'all' (the default), 'calm' (one chat, nothing repeats),
 * or 'none' (the project has no transcript folder yet).
 */
export function mineWorld(on: On, opts: Opts & { chats?: 'all' | 'calm' | 'none' } = {}) {
  const picked = { all: ALL, calm: { c: CHAT_C }, none: {} }[opts.chats ?? 'all']
  const chats = Object.entries(picked)
  const files = { ...Object.fromEntries(chats.map(([name, text]) => [`${FOLDER}/${name}.jsonl`, text])), ...opts.files }
  const entries = chats.map(([name], i) => ({ name: `${name}.jsonl`, mtimeMs: i }))
  return world(on, { ...opts, files, dirs: chats.length > 0 ? { [FOLDER]: entries } : {} })
}

export const paneSite = (surface: 'terminal' | 'desktop', columns = 80) => ({
  plugin: 'reflect-mod', component: 'Pane', requestId: 'reflect-ideas', surface,
  viewport: { columns: 120, rows: 40 },
  props: { title: 'Ideas', isFocused: true, bodyColumns: columns, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
}) as never

export async function mine($: Engine, w: { clock: { settle: () => Promise<void> } }) {
  await $.command.run({ command: 'mine', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } } as never)
  await w.clock.settle()
}

type Mounted = Awaited<ReturnType<Engine['ui']['mount']>>

/** Every text, button (key=label) and Svg alt a mounted pane draws, in order. */
export async function wordsOf(ui: Mounted) {
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  const buttons = (await ui.findAll({ type: 'Button' })).map(b => `${b.key}=${b.props.label}`)
  const alts = (await ui.findAll({ type: 'Svg' })).map(s => String(s.props.alt))
  return { texts, buttons, alts }
}

/** The same, from the pane mounted for the look and unmounted again. */
export async function paneWords($: Engine, surface: 'terminal' | 'desktop') {
  const ui = await $.ui.mount(paneSite(surface))
  const drawn = await wordsOf(ui)
  await ui.unmount()
  return drawn
}
