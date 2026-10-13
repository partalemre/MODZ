// The collision guard: an edit to a file another chat on this machine changed within the last
// half hour is held on an Amber card, "Skip this edit" in focus. Every edit that lands is logged
// under this session's own store key (edits.ts) for the others to see. With nobody there to
// answer (a -p run, the SDK) the edit goes ahead: a caution never stalls a headless run.

import type { EngineInterface, Register } from 'claude-code'

import { clashView, minutesSince } from './caution'
import type { LineCount } from './caution'
import { editsKey, findClash, recordEdit } from './edits'
import type { Edit, EditStore } from './edits'
import { PANE_ID, SLEEP_TIMEOUT_MS, hold, take } from './hold'
import type { Decision, Held, HoldIo } from './hold'
import { parseNumstat } from './measure-git'
import { words } from './words'

type On = Parameters<Register>[0]

// MultiEdit is matched by name for builds that still have it.
const EDIT_TOOLS = /^(Write|Edit|MultiEdit|NotebookEdit)$/
const DIFF_TIMEOUT_MS = 5000

const WHY: Record<Exclude<Decision, 'proceed' | 'cancel' | 'error'>, string> = {
  closed: 'the user closed the Blast Radius pane',
  timeout: 'no answer within 10 minutes',
  interrupted: 'the turn was interrupted',
}

// The hold loop's calls, spelled here: the engine follows `$` only within one file.
const holdIo = ($: EngineInterface): HoldIo => ({
  sleep: seconds => $.process.run(['sleep', seconds], { timeoutMs: SLEEP_TIMEOUT_MS }),
  now: () => $.clock.now(),
  open: async rows => (await $.ui.open({ id: PANE_ID, title: 'Blast Radius', focus: true, closeOnEscape: true, rows })).isPlaced,
  close: () => $.ui.close({ id: PANE_ID }),
  redraw: () => $.ui.invalidate('ui.render'),
})

// `$` stays in this file: the store logic gets closures over it.
const storeOf = ($: EngineInterface): EditStore => ({
  get: key => $.store.get(key),
  set: (key, value) => $.store.set(key, value),
  delete: key => $.store.delete(key),
  keys: () => $.store.keys(),
})

function editPath(e: unknown): string {
  const args = e as Record<string, unknown>
  const path = args.file_path ?? args.notebook_path

  return typeof path === 'string' ? path : ''
}

const baseName = (path: string): string => path.split('/').filter(Boolean).pop() ?? path

/** Where the path lands, so two spellings of one file (a symlink, `./`) meet; a new file by its folder's. */
async function realPathOf($: EngineInterface, given: string): Promise<string> {
  const path = given.startsWith('/') ? given : `${await $.session.cwd()}/${given}`
  const own = await $.fs.stat(path, { resolve: true }).catch(() => undefined)
  if (own?.realPath !== undefined) return own.realPath
  const cut = path.lastIndexOf('/')
  const folder = cut < 0 ? '.' : path.slice(0, cut + 1)
  const dir = await $.fs.stat(folder, { resolve: true }).catch(() => undefined)

  return dir?.realPath === undefined ? path : `${dir.realPath.replace(/\/$/, '')}/${path.slice(cut + 1)}`
}

/** Lines the file has uncommitted now, or null outside git or when it has none. */
async function diffOf($: EngineInterface, real: string): Promise<LineCount | null> {
  const folder = real.slice(0, Math.max(1, real.lastIndexOf('/')))
  const ran = await $.process.run(['git', 'diff', '--numstat', '--', real], { cwd: folder, timeoutMs: DIFF_TIMEOUT_MS })
  if (ran.exitCode !== 0) return null
  const [first] = parseNumstat(ran.stdout).values()

  return first ?? null
}

type Clash = { clash: Edit; real: string; signal: AbortSignal }

async function prepare($: EngineInterface, mine: Held, input: Clash): Promise<boolean> {
  const cwd = await $.session.cwd()
  const shown = input.real.startsWith(`${cwd}/`) ? input.real.slice(cwd.length + 1) : input.real
  const card = { clash: input.clash, now: await $.clock.now(), shown, diff: await diffOf($, input.real) }
  mine.view = () => clashView(card)

  return true
}

/** Asks the person; a deny when they skip it, null when the edit goes ahead. */
async function settle($: EngineInterface, input: Clash): Promise<{ deny: string } | null> {
  const minutes = minutesSince(input.clash.at, await $.clock.now())
  if ((await $.session.surfaces()).length === 0) {
    $.ui.log(`blast-radius: another chat edited ${baseName(input.real)} ${minutes} min ago; nobody to ask, so the edit goes ahead`, { to: 'debug' })

    return null
  }
  const mine = await take(holdIo($), { command: input.real, signal: input.signal, canStrike: false })
  const decision = mine === null ? 'interrupted' : await held($, mine, input)
  // A guard that broke lets the edit through: this is a caution, not a lock.
  if (decision === 'proceed' || decision === 'error') return null
  const why = decision === 'cancel' ? words().edit.cancelWhy : WHY[decision]
  if (decision === 'cancel' || decision === 'closed') $.ui.toast(words().edit.skipped)

  return {
    deny: `Blast Radius held this edit and did not make it: ${why}. Another session edited ${input.real} ${minutes} min ago and may still be working on it. Do not retry it unless the user asks you to.`,
  }
}

async function held($: EngineInterface, mine: Held, input: Clash): Promise<Decision> {
  await hold(holdIo($), mine, { signal: input.signal, prepare: () => prepare($, mine, input) })

  return mine.decision ?? 'error'
}

async function projectOf($: EngineInterface): Promise<string> {
  return baseName(await $.session.root())
}

export function editHooks(on: On): void {
  on('tool.call', { tool: EDIT_TOOLS }, async ($, e, next) => {
    const path = editPath(e)
    if (path === '') return next(e)
    const real = await realPathOf($, path)
    const sessionId = await $.session.id()
    const clash = await findClash(storeOf($), { path: real, sessionId, now: await $.clock.now() })
    const refused = clash === null ? null : await settle($, { clash, real, signal: next.signal })
    if (refused !== null) return refused
    const result = await next(e)
    if (result.deny === undefined && result.isError !== true) {
      await recordEdit(storeOf($), { path: real, sessionId, project: await projectOf($), at: await $.clock.now() })
    }

    return result
  }).catch(($, e, next) => next(e))

  // An ended chat is no longer in any file.
  on('session.end', async ($, e, next) => {
    await $.store.delete(editsKey(e.sessionId))

    return next(e)
  }).catch(($, e, next) => next(e))
}
