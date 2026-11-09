import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { openBoard, writeData } from './board'
import { withLiveNow } from './build'
import { collect, estimateOne, hiddenOf, needsEstimate, pathsOf, saveEstimate, setHidden } from './collect'
import type { Io, Paths } from './collect'
import { HomeButton } from './kit/home'
import { setLang } from './kit/lang'
import { paneMotion } from './kit/moving'
import { pinned } from './kit/pin'
import { isOffStage, shownOf } from './kit/stage'
import { isTextSurface } from './kit/ui'
import { paneTree } from './pane'
import type { PaneActions } from './view'
import { words } from './words'
import type { HubCard, Snapshot } from '../types'

const snapshotAtom = atom({ plugin: 'projects', key: 'snapshot' } as const, null)
const selectedAtom = atom({ plugin: 'projects', key: 'selected' } as const, '')
const openPlanAtom = atom({ plugin: 'projects', key: 'openPlan' } as const, '')
const unfoldedAtom = atom({ plugin: 'projects', key: 'unfolded' } as const, [])
const busyAtom = atom({ plugin: 'projects', key: 'busy' } as const, null)
const errorAtom = atom({ plugin: 'projects', key: 'error' } as const, '')

const PANE = 'projects'
const HUB_PANE = 'projects'
// Below build.ts's LIVE_MS, so a project still working stays live between two reads.
const REFRESH_MS = 120_000
const DEFAULT_COLUMNS = 48

type Timer = { cancel: () => void }
const kept = { paths: null as Paths | null, isReading: false, hasReadError: false, timer: null as Timer | null, platform: 'darwin' }
const motion = paneMotion()

const why = (error: unknown): string => (error instanceof Error ? error.message : String(error))

function ioOf($: EngineInterface): Io {
  return {
    list: dir => $.fs.list(dir),
    read: path => $.fs.read(path),
    write: (path, text) => $.fs.write(path, text),
    exists: path => $.fs.exists(path),
    isDir: async path => (await $.fs.stat(path)).kind === 'dir',
    spawn: argv => $.process.spawn({ argv, env: { LC_ALL: 'C' } }),
    run: (argv, timeoutMs) => $.process.run(argv, { timeoutMs }),
    now: () => $.clock.now(),
    storeGet: key => $.store.get(key),
    storeSet: (key, value) => $.store.set(key, value),
    complete: async request => {
      const reply = await $.model.complete({ model: 'haiku', effort: 'low', ...request })

      if (!reply.isAnswered) throw new Error(`model: ${reply.reason === 'api-error' ? reply.error ?? reply.reason : reply.reason}`)

      return reply.text
    },
  }
}

// Before the first read there is no snapshot, and still a row: it is the only way to the pane that does that first read.
async function writeHub($: EngineInterface, snapshot: Snapshot | null): Promise<void> {
  const say = words()
  const at = await $.clock.now()
  const live = snapshot === null ? 0 : withLiveNow(snapshot, at).projects.filter(project => project.isLive).length
  const detail = snapshot === null ? say.hubHint : say.hubDetail(snapshot.projects.length, live)
  const tone = live > 0 ? 'live' : 'idle'
  // A fresh `at` alone would redraw the hub on every timed read.
  const { value } = await $.state.get({ plugin: 'projects', key: 'hub' })
  if (value?.detail === detail && value?.tone === tone) return
  const card: HubCard = { pane: HUB_PANE, detail, tone, at, title: say.hubTitle, hint: say.hubHint, icon: 'layers', section: 'work' }
  await $.state.set({ plugin: 'projects', key: 'hub' }, card)
}

async function publish($: EngineInterface, snapshot: Snapshot, paths: Paths): Promise<void> {
  await update($, snapshotAtom, () => snapshot)
  await writeHub($, snapshot)
  await $.fs.write(`${paths.own}/snapshot.json`, JSON.stringify(snapshot))
  await writeData(ioOf($), paths.own, snapshot)
}

// One read at a time; a failure keeps the last good list on screen and says what went wrong. A timed read is quiet:
// no "scanning" line every two minutes.
async function refresh($: EngineInterface, isQuiet = false): Promise<void> {
  const { paths } = kept
  if (paths === null || kept.isReading) return
  kept.isReading = true
  try {
    if (!isQuiet) await update($, busyAtom, () => ({ label: 'scan', done: 0, total: 1 }))
    await publish($, await collect(ioOf($), paths, () => undefined), paths)
    // Only the read's own failure: an estimate's, shown until the next estimate, stays.
    if (kept.hasReadError) await update($, errorAtom, () => '')
    kept.hasReadError = false
  } catch (error) {
    kept.hasReadError = true
    await update($, errorAtom, () => why(error))
    $.ui.log(`projects: read failed (${why(error)})`, { to: 'debug' })
  } finally {
    kept.isReading = false
    if (!isQuiet) await update($, busyAtom, () => null)
  }
}

async function estimate($: EngineInterface, roots: readonly string[]): Promise<void> {
  const snapshot = await read($, snapshotAtom)
  if (snapshot === null || kept.isReading || kept.paths === null) return
  kept.isReading = true
  try {
    for (const [index, root] of roots.entries()) {
      await update($, busyAtom, () => ({ label: 'estimate', done: index, total: roots.length }))
      const project = snapshot.projects.find(one => one.root === root)
      if (project === undefined) continue
      try {
        const made = await estimateOne(ioOf($), project)
        if (made === null) throw new Error('the model gave no usable answer')
        await saveEstimate(ioOf($), root, made)
        await update($, errorAtom, () => '')
      } catch (error) {
        // One project's failure must not stop the rest, nor pass in silence.
        await update($, errorAtom, () => `${project.name}: ${why(error)}`)
        $.ui.log(`projects: estimate failed for ${project.name} (${why(error)})`, { to: 'debug' })
      }
    }
  } finally {
    kept.isReading = false
    await update($, busyAtom, () => null)
  }
  await refresh($)
}

async function openPane($: EngineInterface): Promise<void> {
  motion.reset()
  const opened = await $.ui.open({ id: PANE, title: words().title, focus: true })
  if (opened.isPlaced && (await $.state.get({ plugin: 'modz', key: 'isOn' })).value === true) {
    await $.state.set({ plugin: 'projects', key: 'shown' }, shownOf(HUB_PANE, await $.clock.now()))
  }
  void refresh($)
  kept.timer ??= $.clock.every(REFRESH_MS, () => void refresh($, true))
}

function actionsOf($: EngineInterface, snapshot: Snapshot | null): PaneActions {
  const all = snapshot?.projects ?? []

  return {
    select: root => {
      void update($, unfoldedAtom, () => []).then(() => update($, selectedAtom, () => root))
    },
    togglePlan: path => void update($, openPlanAtom, open => (open === path ? '' : path)),
    toggleFold: name => void update($, unfoldedAtom, open => (open.includes(name) ? open.filter(one => one !== name) : [...open, name])),
    openBoard: () => {
      if (kept.paths === null || snapshot === null) return
      const { own } = kept.paths
      void writeData(ioOf($), own, snapshot).then(() => openBoard(ioOf($), { own, pluginRoot: $.plugin.root, platform: kept.platform })).catch((error: unknown) => update($, errorAtom, () => why(error)))
    },
    estimate: () => void estimate($, all.filter(needsEstimate).map(project => project.root)),
    estimateOne: root => void estimate($, [root]),
    hide: root => {
      void hiddenOf(ioOf($)).then(roots => setHidden(ioOf($), [...roots, root])).then(() => update($, selectedAtom, () => '')).then(() => refresh($))
    },
    showHidden: () => void setHidden(ioOf($), []).then(() => refresh($)),
  }
}

const goHome = async ($: EngineInterface): Promise<void> => {
  await $.state.set({ plugin: 'projects', key: 'home' }, { at: await $.clock.now() })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    await $.command.register({ name: 'projects', description: words().command }).catch(() => undefined)

    return next(e)
  })

  // The transcripts' folder and the last snapshot, so the list and the hub's line are there before any read.
  on('classic.SessionStart', async ($, e, next) => {
    // This hook writes the hub's line, and on the desktop it can run before session.start has read the language.
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    // A stock Windows names the home folder only in USERPROFILE.
    const home = (await $.env.get('HOME').catch(() => undefined)) || (await $.env.get('USERPROFILE').catch(() => undefined))
    kept.platform = (await $.env.get('OS').catch(() => undefined)) === 'Windows_NT' ? 'win32' : (await $.process.run(['uname', '-s'], { timeoutMs: 3000 }).catch(() => ({ stdout: '' }))).stdout.trim() === 'Darwin' ? 'darwin' : 'linux'
    kept.paths = pathsOf(typeof e.transcript_path === 'string' ? e.transcript_path : '', home ?? '')
    if (kept.paths !== null && (await read($, snapshotAtom)) === null) {
      const saved = await $.fs.read(`${kept.paths.own}/snapshot.json`).catch(() => '')
      if (saved !== '') await update($, snapshotAtom, () => JSON.parse(saved) as Snapshot)
    }
    await writeHub($, await read($, snapshotAtom))

    return next(e)
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'projects' }, async $ => {
    await openPane($)

    return {}
  })

  on('state.set', { plugin: 'modz', key: 'open' }, async ($, e, next) => {
    const done = await next(e)
    if ((e.value as { pane?: unknown } | undefined)?.pane === HUB_PANE) await openPane($)

    return done
  }).catch(($, e, next) => next(e))

  on('state.set', { plugin: 'modz', key: 'stage' }, async ($, e, next) => {
    const done = await next(e)
    if (isOffStage(e.value, HUB_PANE)) await $.ui.close({ id: PANE })

    return done
  }).catch(($, e, next) => next(e))

  on('ui.close', { id: PANE }, ($, e, next) => {
    kept.timer?.cancel()
    kept.timer = null

    return next(e)
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const nowMs = await $.clock.now()
    const held = await read($, snapshotAtom)
    const snapshot = held === null ? null : withLiveNow(held, nowMs)
    const isHubOn = (await $.state.get({ plugin: 'modz', key: 'isOn' })).value === true
    const tree = paneTree(ui, {
      isText: isTextSurface(ui, e.surface),
      snapshot,
      selected: await read($, selectedAtom),
      openPlan: await read($, openPlanAtom),
      unfolded: await read($, unfoldedAtom),
      busy: await read($, busyAtom),
      error: await read($, errorAtom),
      nowMs,
      columns: e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS,
      motion,
      acts: actionsOf($, snapshot),
      missing: (snapshot?.projects ?? []).filter(needsEstimate).length,
      home: isHubOn ? HomeButton(ui, () => void goHome($)) : null,
      homeDir: kept.paths?.home ?? '',
    })

    return pinned(e, tree)
  })
}
