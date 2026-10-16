import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { apply, gitBinary, list, locate, numstat, plan, prune, slug, snapshot } from './git'
import type { Repo, Run } from './git'
import { HUB_PANE, hubOf, isOpenFor } from './hub'
import { glyphOf, keepListed, markUndone, pendingOf, sortGlyphs } from './meta'
import type { MetaMap } from './meta'
import { clip, paneTree, targetOf } from './pane'
import { withHome } from './home'
import { pinned } from './pin'
import { shownOf } from './stage'
import { hookStage } from './stage-hook'
import { setLang } from './lang'
import { AUTO, themeFrom } from './tidemark'
import { words } from './words'
import type { CheckpointEntry, CheckpointStatus, CheckpointView, HubCard } from '../types'

const PANE = 'checkpoints'
const TOGGLE = 'checkpoint'
const STORE_KEY = 'checkpoint.enabled'
const META_KEY = 'checkpoint.meta'
const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit'])
const GIT_TIMEOUT_MS = 60_000
const PROMPT_LABEL_MAX = 100
const EMPTY_VIEW: CheckpointView = { entries: [], status: null, isBusy: false, pending: null }
const failed = (): CheckpointStatus => ({ text: words().failed, tone: 'error' })

const viewAtom = atom({ plugin: 'checkpoint', key: 'view' } as const, EMPTY_VIEW)
const enabledAtom = atom({ plugin: 'checkpoint', key: 'isEnabled' } as const, true)
const metaAtom = atom({ plugin: 'checkpoint', key: 'meta' } as const, {} as MetaMap)
const HUB = { plugin: 'checkpoint', key: 'hub' } as const
const HOME = { plugin: 'checkpoint', key: 'home' } as const
const themeAtom = atom({ plugin: 'checkpoint', key: 'theme' } as const, AUTO)

// Armed by each prompt; the first write after it takes the snapshot, later writes wait for it.
// `ref` is the turn's checkpoint once taken; `files` and `tools` what the turn did after it.
const turn = {
  isArmed: false, label: '', pending: null as Promise<void> | null, bin: undefined as string | null | undefined,
  number: 0, ref: null as string | null, files: new Set<string>(), tools: new Set<string>(),
}

function runnerOf($: EngineInterface): Run {
  return (argv, init) => $.process.run(argv, { timeoutMs: GIT_TIMEOUT_MS, ...init })
}

async function repoOf($: EngineInterface, isProbeOnly = false): Promise<Repo | null> {
  const home = (await $.env.get('HOME')) ?? ''
  const cwd = await $.session.cwd()
  turn.bin ??= await gitBinary(runnerOf($), cwd)
  if (turn.bin === null) return null

  return locate(runnerOf($), { cwd, home, bin: turn.bin, isProbeOnly })
}

// The main panel's card (DESIGN.md §9), written only when what it shows changes so the panel does not redraw for nothing.
async function writeHub($: EngineInterface, entries: CheckpointEntry[]): Promise<void> {
  const now = await $.clock.now()
  const shown = hubOf(entries, now)
  const { value } = await $.state.get(HUB)
  if (value !== undefined && value.detail === shown.detail && value.tone === shown.tone) return
  const card: HubCard = { pane: HUB_PANE, ...shown, at: now }
  await $.state.set(HUB, card)
}

// The main panel's card at session start: the checkpoints already there, read without making a shadow repo.
async function greetHub($: EngineInterface): Promise<void> {
  try {
    const repo = await repoOf($, true)
    await writeHub($, repo === null ? [] : await list(runnerOf($), repo))
  } catch (error) {
    $.ui.log(`checkpoint: could not count checkpoints (${error instanceof Error ? error.message : 'unknown'})`, { to: 'debug' })
  }
}

async function refName($: EngineInterface): Promise<string> {
  return `${slug(await $.session.id())}/${await $.clock.now()}`
}

async function setView($: EngineInterface, change: Partial<CheckpointView>): Promise<void> {
  await update($, viewAtom, view => ({ ...view, ...change }))
}

async function saveMeta($: EngineInterface, change: (meta: MetaMap) => MetaMap): Promise<void> {
  await update($, metaAtom, meta => change(meta ?? {}))
  await $.store.set(META_KEY, await read($, metaAtom))
}

async function take($: EngineInterface, label: string): Promise<void> {
  try {
    const repo = await repoOf($)
    if (repo === null) {
      $.ui.log('checkpoint: no working git, or folder too broad for a shadow copy; skipped', { to: 'debug' })

      return
    }
    const ref = await refName($)
    await snapshot(runnerOf($), repo, { ref, label })
    const full = `refs/checkpoints/${ref}`
    turn.ref = full
    const entries = await prune(runnerOf($), repo)
    const number = turn.number
    await saveMeta($, meta => ({ ...keepListed(meta, entries), [full]: { turn: number } }))
    await setView($, { entries })
    await writeHub($, entries)
  } catch (error) {
    $.ui.log(`checkpoint: snapshot failed (${error instanceof Error ? error.message : 'unknown'})`, { to: 'debug' })
  }
}

// Step one of an undo: work out what it would change and put that before the person in the pane.
async function ask($: EngineInterface, entry: CheckpointEntry): Promise<void> {
  if ((await read($, viewAtom)).isBusy) return
  await setView($, { isBusy: true, pending: null, status: { text: words().checking, tone: 'busy' } })
  let change: Partial<CheckpointView> = { status: failed() }
  try {
    const repo = await repoOf($)
    const changes = repo === null ? null : await plan(runnerOf($), repo, entry.commit)
    if (repo === null || changes === null) change = { status: { text: words().noRepo, tone: 'error' } }
    else if (changes.restore.length + changes.remove.length === 0) change = { status: { text: words().alreadyThere, tone: 'info' } }
    else {
      const stats = await numstat(runnerOf($), repo, { tree: changes.tree, commit: entry.commit })
      const turnOf = (await read($, metaAtom))[entry.ref]?.turn ?? null
      change = { status: null, pending: pendingOf(entry, { changes, stats, turn: turnOf }) }
    }
  } catch (error) {
    $.ui.log(`checkpoint: undo check failed (${error instanceof Error ? error.message : 'unknown'})`, { to: 'debug' })
  }
  await setView($, { isBusy: false, ...change })
}

// Step two, on the confirm button: the plan is made again (files may have changed since), a safety snapshot first.
async function restore($: EngineInterface, entry: CheckpointEntry): Promise<CheckpointStatus> {
  const repo = await repoOf($)
  if (repo === null) return { text: words().noRepo, tone: 'error' }
  const run = runnerOf($)
  const changes = await plan(run, repo, entry.commit)
  const total = changes.restore.length + changes.remove.length
  if (total === 0) return { text: words().alreadyThere, tone: 'info' }
  const safety = await refName($)
  const label = `${words().safetyPrefix}${clip(entry.label)}`
  const commit = await snapshot(run, repo, { ref: safety, label })
  await apply(run, repo, { commit: entry.commit, plan: changes })
  const entries = await prune(run, repo)
  const safetyRef = `refs/checkpoints/${safety}`
  await saveMeta($, meta => keepListed(markUndone(meta, { entries, target: entry, safetyRef }), entries))
  await setView($, { entries })
  await writeHub($, entries)
  const number = (await read($, metaAtom))[entry.ref]?.turn

  const redo = entries.find(item => item.ref === safetyRef) ?? { ref: safetyRef, commit, at: await $.clock.now(), label }

  return { text: words().restored(total, targetOf(number, entry.label)), tone: 'success', redo }
}

async function confirm($: EngineInterface): Promise<void> {
  const view = await read($, viewAtom)
  if (view.isBusy || view.pending === null) return
  await setView($, { isBusy: true, status: { text: words().undoing, tone: 'busy' } })
  let status = failed()
  try {
    status = await restore($, view.pending.entry)
  } catch (error) {
    $.ui.log(`checkpoint: undo failed (${error instanceof Error ? error.message : 'unknown'})`, { to: 'debug' })
  }
  await setView($, { isBusy: false, pending: null, status })
}

async function wantedOn($: EngineInterface, arg: string): Promise<boolean> {
  if (arg === 'on') return true
  if (arg === 'off') return false

  return !(await read($, enabledAtom))
}

async function toggle($: EngineInterface, arg: string): Promise<void> {
  const isOn = await wantedOn($, arg)
  await update($, enabledAtom, () => isOn)
  await $.store.set(STORE_KEY, isOn)
  $.ui.toast(words().toggled(isOn))
}

// `isFocused` for the main panel's request: an open pane comes forward. Once up it takes a running hub's panel (kit/stage.ts).
async function openPane($: EngineInterface, isFocused = false): Promise<void> {
  try {
    const repo = await repoOf($)
    const entries = repo === null ? [] : await list(runnerOf($), repo)
    await setView($, { entries, status: null, pending: null })
    await writeHub($, entries)
  } catch {
    $.ui.log('checkpoint: could not list checkpoints', { to: 'debug' })
  }
  const opened = await $.ui.open({ id: PANE, title: words().title, ...(isFocused ? { focus: true } : {}) })
  try {
    const isHubOn = (await $.state.get({ plugin: 'modz', key: 'isOn' })).value === true
    if (opened.isPlaced && isHubOn) await $.state.set({ plugin: 'checkpoint', key: 'shown' }, shownOf(HUB_PANE, await $.clock.now()))
  } catch (error) {
    $.ui.log(`checkpoint: shown failed (${String(error)})`, { to: 'debug' })
  }
}

type On = Parameters<Register>[0]

// Commands answer with no text: a transcript row would be read by the model on its next request.
function hookCommands(on: On): void {
  on('session.start', async ($, e, next) => {
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    try {
      const saved = await $.store.get(STORE_KEY)
      await update($, enabledAtom, () => saved !== false)
      const meta = await $.store.get(META_KEY)
      if (typeof meta === 'object' && meta !== null) await update($, metaAtom, () => meta as MetaMap)
      const pinned = await $.env.get('MODZ_THEME').catch(() => undefined)
      await update($, themeAtom, () => themeFrom(pinned))
      await $.command.register({ name: TOGGLE, description: words().toggleLine, argumentHint: '[on|off]' })
      await $.command.register({ name: PANE, description: words().paneLine })
    } catch {
      $.ui.log('checkpoint: could not load settings', { to: 'debug' })
    }
    const done = await next(e)
    await greetHub($)

    return done
  })

  on('command.run', { command: TOGGLE }, async ($, e) => (await toggle($, e.args.trim().toLowerCase()), {}))

  on('command.run', { command: PANE }, async $ => (await openPane($), {}))
}

// Both hooks hand the event on untouched: nothing reaches the prompt or a tool result.
function hookTurns(on: On): void {
  on('prompt.submit', async ($, e, next) => {
    turn.isArmed = true
    turn.label = clip(e.text.split('\n')[0]?.trim() || words().promptFallback, PROMPT_LABEL_MAX)
    turn.number += 1
    turn.ref = null
    turn.files.clear()
    turn.tools.clear()

    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    const glyph = glyphOf(String(e.tool))
    if (glyph !== undefined) turn.tools.add(glyph)
    if (!WRITE_TOOLS.has(String(e.tool))) return next(e)
    const path = (e as { file_path?: unknown; notebook_path?: unknown }).file_path ?? (e as { notebook_path?: unknown }).notebook_path
    if (typeof path === 'string') turn.files.add(path)
    if (turn.isArmed && (await read($, enabledAtom))) {
      turn.isArmed = false
      turn.pending = take($, turn.label)
    }
    if (turn.pending !== null) await turn.pending

    return next(e)
  }).catch(($, e, next) => next(e))

  // The turn's files and tools join its checkpoint once it ends.
  on('turn.complete', async ($, e, next) => {
    const ref = turn.ref
    if (e.agentId === undefined && ref !== null) {
      const done = { files: turn.files.size, tools: sortGlyphs(turn.tools) }
      await saveMeta($, meta => ({ ...meta, [ref]: { ...meta[ref], ...done } })).catch(() => $.ui.log('checkpoint: could not keep turn notes', { to: 'debug' }))
    }

    return next(e)
  })
}

export const register: Register = on => {
  hookCommands(on)
  hookTurns(on)
  hookStage(on)

  // The main panel's open request: opens only, so a pane already open comes forward instead of closing.
  on('state.set', { plugin: 'modz', key: 'open' }, async ($, e, next) => {
    const done = await next(e)
    if (isOpenFor(e.value, HUB_PANE)) await openPane($, true)

    return done
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const actions = {
      onUndo: (entry: CheckpointEntry) => void ask($, entry),
      onConfirm: () => void confirm($),
      onCancel: () => void setView($, { pending: null, status: null }),
    }
    const look = { theme: await read($, themeAtom), columns: e.props.bodyColumns, isRich: e.surface !== 'terminal' }

    const isHubOn = (await $.state.get({ plugin: 'modz', key: 'isOn' })).value === true
    // Written when pressed, never while drawing; a failure only goes to the debug log.
    const goHome = () => void $.clock.now().then(at => $.state.set(HOME, { at })).catch(() => $.ui.log('checkpoint: could not go back to MODZ', { to: 'debug' }))
    const ui = $.ui.resolve(e)
    const tree = paneTree(ui, await read($, viewAtom), { now: await $.clock.now(), meta: await read($, metaAtom), look, actions })

    return pinned(e, withHome(ui, tree, isHubOn ? goHome : null))
  })
}
