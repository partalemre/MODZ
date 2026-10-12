import { type EngineInterface, type On, type Register, update } from 'claude-code'

import { drawDesktop } from './desktop'
import { gitDir } from './gitread'
import type { Host, IoHost, StateHost, UiHost } from './host'
import { HUB_PANE, isOpenFor } from './hub'
import { setLang } from './lang'
import { onRows, type RowsMessage, scrollBy } from './keys'
import { refreshLook } from './look'
import { followCwd, openFromHub, sync } from './pane'
import { promptContext } from './prompt'
import { settleBackground, touched } from './scan'
import { sceneOf } from './scene'
import { mem } from './session'
import { pinned } from './pin'
import { openByCommand, resumePane, startPane } from './start'
import { drawTerminal } from './terminal'
import { afterCall, beforeCall, callFailed, isWatched } from './toolcall'
import { emptyTree, join, posix, useDrives } from './tree'
import { NO_TURN, syncHub } from './turn'
import { words } from './words'

const TREE = { plugin: 'filetree', key: 'tree' } as const
const THEME = { plugin: 'filetree', key: 'theme' } as const
const ACTIVITY = { plugin: 'filetree', key: 'activity' } as const
const TURN = { plugin: 'filetree', key: 'turn' } as const
const LOOK = { plugin: 'filetree', key: 'look' } as const
const HUB = { plugin: 'filetree', key: 'hub' } as const
const PANE = 'filetree'
const ACTIVITY_KEEP = 6
// Git writes its index and HEAD in steps; the tree reads them once the burst settles.
const GIT_SETTLE_MS = 300
const MIN_WIDTH = 24
const DEFAULT_ROWS = 40

function stateOf($: EngineInterface): StateHost {
  return {
    tree: async () => ({ ...emptyTree(''), ...(await $.state.get(TREE)).value }),
    putTree: async fn => {
      await update($, TREE, cur => fn({ ...emptyTree(''), ...cur }))
    },
    activities: async () => (await $.state.get(ACTIVITY)).value ?? [],
    setActivities: async fn => {
      await update($, ACTIVITY, cur => fn(cur ?? []).slice(-ACTIVITY_KEEP))
    },
    turn: async () => ({ ...NO_TURN, ...(await $.state.get(TURN)).value }),
    setTurn: async fn => {
      await update($, TURN, cur => fn({ ...NO_TURN, ...cur }))
    },
    hubCard: async () => (await $.state.get(HUB)).value,
    setHubCard: async card => {
      await $.state.set(HUB, card)
    },
    look: async () => (await $.state.get(LOOK)).value,
    setLook: async look => {
      await update($, LOOK, () => look)
    },
    theme: async () => (await $.state.get(THEME)).value,
    setTheme: async theme => {
      await $.state.set(THEME, theme)
    },
  }
}

function ioOf($: EngineInterface): IoHost {
  return {
    list: path => $.fs.list(path),
    stat: (path, options) => $.fs.stat(path, options),
    read: path => $.fs.read(path),
    run: (argv, init) => $.process.run(argv, init),
    now: () => $.clock.now(),
    after: (ms, fn) => $.clock.after(ms, fn),
    every: (ms, fn) => $.clock.every(ms, fn),
    cwd: () => $.session.cwd(),
    sessionId: () => $.session.id(),
    tmpdir: () => $.env.get('TMPDIR'),
    osEnv: () => $.env.get('OS'),
    homeEnv: () => $.env.get('HOME'),
    herdrEnv: () => $.env.get('HERDR_ENV'),
    herdrBin: () => $.env.get('HERDR_BIN_PATH'),
  }
}

function uiOf($: EngineInterface): UiHost {
  return {
    toast: text => $.ui.toast(text),
    openPane: isFocused => $.ui.open(isFocused ? { id: PANE, title: words().title, focus: true } : { id: PANE, title: words().title }),
    isPaneOpen: async () => {
      try {
        return (await $.ui.panes()).some(p => p.id === PANE)
      } catch {
        return false
      }
    },
    copy: args => $.ui.copy(args),
    surfaces: () => $.session.surfaces(),
    config: () => $.config.list(),
  }
}

function hostOf($: EngineInterface): Host {
  return { ...stateOf($), ...ioOf($), ...uiOf($) }
}

function onStart(on: On): void {
  // DESIGN.md §9: the MODZ main panel asks for a pane by key; this only opens, never closes.
  // modz's contract is not this mod's to import, so its address stays untyped here.
  on('state.set', { plugin: 'modz', key: 'open' } as any, async ($: EngineInterface, e: any, next: any) => {
    const done = await next(e)
    if (isOpenFor(e.value, HUB_PANE)) await openFromHub(hostOf($))

    return done
  }).catch(($, e, next) => next(e))
  on('session.start', async ($, e, next) => {
    // The interface language (kit/lang.ts). Spelled out: the engine admits an env read by a literal name only.
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    await $.command.register({ name: 'filetree', description: words().command })
    const isWindows = (await $.env.get('OS')) === 'Windows_NT'
    useDrives(isWindows)
    mem.home = posix(((await $.env.get('HOME')) || (await $.env.get('USERPROFILE')) || '').replace(/[\\/]+$/, ''))
    const host = hostOf($)
    mem.activityId = Math.max(mem.activityId, ...(await host.activities()).map(a => a.id))
    void startPane(host, { isWindows, isRemote: async () => Boolean((await $.env.get('SSH_CONNECTION')) || (await $.env.get('SSH_TTY'))) })
    return next(e)
  })
  on('command.run', { command: 'filetree' }, async ($, e) => ({ text: await openByCommand(hostOf($), e) }))
}

function onTools(on: On): void {
  on('tool.call', async ($, e, next) => {
    if (!isWatched(e.tool)) return next(e)
    const host = hostOf($)
    const call = await beforeCall(host, e)
    let result: Awaited<ReturnType<typeof next>>
    try {
      result = await next(e)
    } catch (err) {
      await callFailed(host, call)
      throw err
    }
    return afterCall(host, call, result)
  })
  on('tool.call', { tool: 'Read' }, async ($, e, next) => {
    const result = await next(e)
    if (result.deny || result.isError || e.tool !== 'Read' || !mem.showReads) return result
    void touched(hostOf($), [posix(e.file_path)], { tone: 'purple', isShown: true })
    return result
  })
}

function onTurns(on: On): void {
  on('turn.start', async ($, e, next) => {
    const host = hostOf($)
    await host.setTurn(() => ({ ...NO_TURN, isRunning: true, hasRun: true }))
    await syncHub(host)
    return next(e)
  })
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    const host = hostOf($)
    if (!e.agentId) await host.setTurn(cur => ({ ...NO_TURN, ...cur, isRunning: false }))
    if (!e.agentId) await syncHub(host)
    return result
  })
  on('ui.message', async ($, e, next) => {
    if (e.requestId !== PANE || e.element !== 'rows' || !e.data || typeof e.data !== 'object') return next(e)
    await onRows(hostOf($), e.data as RowsMessage, e.surface)
    return {}
  })
}

function onClassic(on: On): void {
  on('classic.SessionStart', async ($, e, next) => {
    const result = await next(e)
    const host = hostOf($)
    if (e.source === 'clear' || e.source === 'resume' || e.source === 'fork') void resumePane(host)
    const gd = await gitDir(host, posix(e.cwd))
    return gd ? { ...result, watchPaths: [...(result.watchPaths ?? []), join(gd, 'index'), join(gd, 'HEAD')] } : result
  })
  on('classic.CwdChanged', async ($, e, next) => {
    const result = await next(e)
    void followCwd(hostOf($))
    return result
  })
  on('classic.FileChanged', async ($, e, next) => {
    const result = await next(e)
    if (/[\\/]\.git[\\/]|[\\/](index|HEAD)$/.test(e.file_path)) $.clock.after(GIT_SETTLE_MS, () => void sync(hostOf($), true))
    return result
  })
}

function onPane(on: On): void {
  on('ui.focus', { component: 'Pane', requestId: PANE }, async ($, e, next) => {
    const result = await next(e)
    const host = hostOf($)
    void sync(host)
    if (await host.look()) void refreshLook(host)
    return result
  })
  on('ui.scroll', { component: 'Pane', requestId: PANE }, async ($, e) => {
    await scrollBy(hostOf($), e.by)
    return {}
  })
  on('prompt.submit', async ($, e, next) => {
    const context = await promptContext(hostOf($), e)
    return next(context.length ? { ...e, context } : e)
  })
  on('prompt.attachment', async ($, e, next) => {
    void settleBackground(hostOf($), e.text)
    return next(e)
  })
}

function onRender(on: On): void {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e, next) => {
    if (e.surface !== 'terminal' && e.surface !== 'desktop') return next(e)
    if (e.surface === 'terminal' && e.props.placement === 'inline') {
      mem.noDock = true
      void $.ui.close({ id: PANE }).catch(() => undefined)
      const { Box: Empty } = $.ui.resolve(e)
      return <Empty />
    }
    const host = hostOf($)
    const s = await sceneOf(host, e.surface === 'desktop')
    const room = { width: Math.max(MIN_WIDTH, e.props.bodyColumns), bodyRows: e.props.scroll?.bodyRows ?? DEFAULT_ROWS }
    if (e.surface === 'desktop') {
      const desk = $.ui.resolve(e)
      return pinned(e, drawDesktop(host, desk, { s, room }))
    }
    const ui = $.ui.resolve(e)
    return pinned(e, drawTerminal(host, ui, { s, room }))
  })
}

export const register: Register = (on, options) => {
  mem.glyphSetting = typeof options?.glyphs === 'string' ? options.glyphs : 'auto'
  const activity = typeof options?.activity === 'string' ? options.activity : 'reads and writes'
  mem.showReads = activity.includes('reads')
  mem.showWrites = activity.includes('writes')
  mem.followClaude = options?.follow !== 'off'
  mem.sizeDefault = options?.column === 'size'
  onStart(on)
  onTools(on)
  onTurns(on)
  onClassic(on)
  onPane(on)
  onRender(on)
}
