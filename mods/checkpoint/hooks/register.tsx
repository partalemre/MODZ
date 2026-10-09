import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { apply, gitBinary, list, locate, numstat, plan, prune, slug, snapshot } from './git'
import type { Repo, Run } from './git'
import { glyphOf, keepListed, markUndone, pendingOf, sortGlyphs } from './meta'
import type { MetaMap } from './meta'
import { clip, paneTree } from './pane'
import { AUTO, themeFrom } from './tidemark'
import type { CheckpointEntry, CheckpointStatus, CheckpointView } from '../types'

const PANE = 'checkpoints'
const TOGGLE = 'checkpoint'
const STORE_KEY = 'checkpoint.enabled'
const META_KEY = 'checkpoint.meta'
const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit'])
const GIT_TIMEOUT_MS = 60_000
const PROMPT_LABEL_MAX = 100
const EMPTY_VIEW: CheckpointView = { entries: [], status: null, isBusy: false, pending: null }
const FAILED: CheckpointStatus = { text: 'Geri alınamadı; ayrıntı debug günlüğünde.', tone: 'error' }

const viewAtom = atom({ plugin: 'checkpoint', key: 'view' } as const, EMPTY_VIEW)
const enabledAtom = atom({ plugin: 'checkpoint', key: 'isEnabled' } as const, true)
const metaAtom = atom({ plugin: 'checkpoint', key: 'meta' } as const, {} as MetaMap)
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

async function repoOf($: EngineInterface): Promise<Repo | null> {
  const home = (await $.env.get('HOME')) ?? ''
  const cwd = await $.session.cwd()
  turn.bin ??= await gitBinary(runnerOf($), cwd)
  if (turn.bin === null) return null

  return locate(runnerOf($), { cwd, home, bin: turn.bin })
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
  } catch (error) {
    $.ui.log(`checkpoint: snapshot failed (${error instanceof Error ? error.message : 'unknown'})`, { to: 'debug' })
  }
}

// Step one of an undo: work out what it would change and put that before the person in the pane.
async function ask($: EngineInterface, entry: CheckpointEntry): Promise<void> {
  if ((await read($, viewAtom)).isBusy) return
  await setView($, { isBusy: true, pending: null, status: { text: 'Denetleniyor…', tone: 'busy' } })
  let change: Partial<CheckpointView> = { status: FAILED }
  try {
    const repo = await repoOf($)
    const changes = repo === null ? null : await plan(runnerOf($), repo, entry.commit)
    if (repo === null || changes === null) change = { status: { text: 'Burada git deposu yok.', tone: 'error' } }
    else if (changes.restore.length + changes.remove.length === 0) change = { status: { text: 'Dosyalar zaten bu noktadaki gibi.', tone: 'info' } }
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

// Step two, on "Geri al": the plan is made again (files may have changed since), a safety snapshot first.
async function restore($: EngineInterface, entry: CheckpointEntry): Promise<CheckpointStatus> {
  const repo = await repoOf($)
  if (repo === null) return { text: 'Burada git deposu yok.', tone: 'error' }
  const run = runnerOf($)
  const changes = await plan(run, repo, entry.commit)
  const total = changes.restore.length + changes.remove.length
  if (total === 0) return { text: 'Dosyalar zaten bu noktadaki gibi.', tone: 'info' }
  const safety = await refName($)
  const label = `geri almadan önce: ${clip(entry.label)}`
  const commit = await snapshot(run, repo, { ref: safety, label })
  await apply(run, repo, { commit: entry.commit, plan: changes })
  const entries = await prune(run, repo)
  const safetyRef = `refs/checkpoints/${safety}`
  await saveMeta($, meta => keepListed(markUndone(meta, { entries, target: entry, safetyRef }), entries))
  await setView($, { entries })
  const number = (await read($, metaAtom))[entry.ref]?.turn
  const where = number === undefined ? `"${clip(entry.label)}" öncesine` : `tur ${number} öncesine`

  const redo = entries.find(item => item.ref === safetyRef) ?? { ref: safetyRef, commit, at: await $.clock.now(), label }

  return { text: `${total} dosya ${where} döndü.`, tone: 'success', redo }
}

async function confirm($: EngineInterface): Promise<void> {
  const view = await read($, viewAtom)
  if (view.isBusy || view.pending === null) return
  await setView($, { isBusy: true, status: { text: 'Geri alınıyor…', tone: 'busy' } })
  let status = FAILED
  try {
    status = await restore($, view.pending.entry)
  } catch (error) {
    $.ui.log(`checkpoint: undo failed (${error instanceof Error ? error.message : 'unknown'})`, { to: 'debug' })
  }
  await setView($, { isBusy: false, pending: null, status })
}

async function toggle($: EngineInterface, arg: string): Promise<void> {
  const isOn = arg === 'on' ? true : arg === 'off' ? false : !(await read($, enabledAtom))
  await update($, enabledAtom, () => isOn)
  await $.store.set(STORE_KEY, isOn)
  $.ui.toast(`checkpoint ${isOn ? 'açık' : 'kapalı'}`)
}

async function openPane($: EngineInterface): Promise<void> {
  try {
    const repo = await repoOf($)
    await setView($, { entries: repo === null ? [] : await list(runnerOf($), repo), status: null, pending: null })
  } catch {
    $.ui.log('checkpoint: could not list checkpoints', { to: 'debug' })
  }
  await $.ui.open({ id: PANE, title: 'Kontrol noktaları' })
}

type On = Parameters<Register>[0]

// Commands answer with no text: a transcript row would be read by the model on its next request.
function hookCommands(on: On): void {
  on('session.start', async ($, e, next) => {
    try {
      const saved = await $.store.get(STORE_KEY)
      await update($, enabledAtom, () => saved !== false)
      const meta = await $.store.get(META_KEY)
      if (typeof meta === 'object' && meta !== null) await update($, metaAtom, () => meta as MetaMap)
      const pinned = await $.env.get('MODZ_THEME').catch(() => undefined)
      await update($, themeAtom, () => themeFrom(pinned))
      await $.command.register({ name: TOGGLE, description: 'Her turun ilk yazımından önce sessiz anlık görüntü: aç/kapa', argumentHint: '[on|off]' })
      await $.command.register({ name: PANE, description: 'Kontrol noktalarını listeler; bir turu geri alır' })
    } catch {
      $.ui.log('checkpoint: could not load settings', { to: 'debug' })
    }

    return next(e)
  })

  on('command.run', { command: TOGGLE }, async ($, e) => (await toggle($, e.args.trim().toLowerCase()), {}))

  on('command.run', { command: PANE }, async $ => (await openPane($), {}))
}

// Both hooks hand the event on untouched: nothing reaches the prompt or a tool result.
function hookTurns(on: On): void {
  on('prompt.submit', async ($, e, next) => {
    turn.isArmed = true
    turn.label = clip(e.text.split('\n')[0]?.trim() || 'tur', PROMPT_LABEL_MAX)
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

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const actions = {
      onUndo: (entry: CheckpointEntry) => void ask($, entry),
      onConfirm: () => void confirm($),
      onCancel: () => void setView($, { pending: null, status: null }),
    }
    const look = { theme: await read($, themeAtom), columns: e.props.bodyColumns, isRich: e.surface !== 'terminal' }

    return paneTree($.ui.resolve(e), await read($, viewAtom), { now: await $.clock.now(), meta: await read($, metaAtom), look, actions })
  })
}
