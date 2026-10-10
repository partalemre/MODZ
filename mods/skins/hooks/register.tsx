import { atom, memberOf, read, update } from 'claude-code'
import type { EngineInterface, Frozen, On, Register, RenderInput } from 'claude-code'

import type { SkinSlot, UsageSnap } from '../types'
import { DEFAULT_PREFS } from './command'
import { DESIGN, DESIGN_TOOL, runDesign } from './designer'
import { diffstat } from './format'
import { EMPTY_HUB, isOwnOpen } from './hub'
import { lookOf } from './look'
import { activeSkin, commit, load, syncHub } from './prefs-store'
import type { PrefsHost } from './prefs-store'
import { abovePromptView, askView } from './render-bands'
import { FRAME_MS, replyView, spinnerView, turnDurationView, userMessageView } from './render-messages'
import { galleryView, SETTINGS_TITLE, settingsView } from './render-panes'
import type { SettingsHost } from './render-panes'
import { toolGroupView, toolResultView, toolUseView } from './render-tools'
import { runSkin, SKIN_COMMAND } from './skin-command'
import { PROBE_MS, refreshTheme } from './theme'
import type { ThemeHost } from './theme'
import { usageSnap } from './svg-usage'
import { addCall, type Live, NO_STATS, withTurn } from './turn-stats'
import type { View } from './view'

const SETTINGS = 'skins-settings'
const GALLERY = 'skins-gallery'
const DESIGN_MATCH = /^mcp__skins__design$/
// /compact starts on the next tick, in a dispatch of its own (see compact).
const NEXT_TICK_MS = 1

const prefsAtom = atom({ plugin: 'skins', key: 'prefs' } as const, DEFAULT_PREFS)
const customAtom = atom({ plugin: 'skins', key: 'custom' } as const, {})
const startedAtom = atom({ plugin: 'skins', key: 'startedAt' } as const, 0)
const frameAtom = atom({ plugin: 'skins', key: 'frame' } as const, 0)
const turnsAtom = atom({ plugin: 'skins', key: 'turns' } as const, {})
const durationAtom = atom({ plugin: 'skins', key: 'duration' } as const, -1)
const editingAtom = atom({ plugin: 'skins', key: 'editing' } as const, 'user' as SkinSlot)
const lightAtom = atom({ plugin: 'skins', key: 'isLight' } as const, false)
const imagesAtom = atom({ plugin: 'skins', key: 'images' } as const, false)
const usageAtom = atom({ plugin: 'skins', key: 'usage' } as const, { context: null, limits: [] } as UsageSnap)
const compactingAtom = atom({ plugin: 'skins', key: 'compacting' } as const, false)
const pinnedAtom = atom({ plugin: 'skins', key: 'pinned' } as const, false)
const hubAtom = atom({ plugin: 'skins', key: 'hub' } as const, EMPTY_HUB)

// The prefs store's port (prefs-store.ts).
function storeOf($: EngineInterface): PrefsHost {
  return {
    storeGet: key => $.store.get(key),
    storeSet: (key, value) => $.store.set(key, value),
    cwd: () => $.session.cwd(),
    now: () => $.clock.now(),
    prefs: () => read($, prefsAtom),
    setPrefs: prefs => update($, prefsAtom, () => prefs),
    custom: () => read($, customAtom),
    setCustom: custom => update($, customAtom, () => custom),
    isPinned: () => read($, pinnedAtom),
    setPinned: isPinned => update($, pinnedAtom, () => isPinned),
    isLight: () => read($, lightAtom),
    hub: () => read($, hubAtom),
    setHub: card => update($, hubAtom, () => card),
  }
}

// The theme's port (theme.ts).
function themeOf($: EngineInterface): ThemeHost {
  return {
    hints: async () => {
      const rows = await $.config.list()

      return { override: await $.env.get('SKINS_THEME'), theme: rows.find(row => row.key === 'theme')?.value, colorfgbg: await $.env.get('COLORFGBG') }
    },
    probe: argv => $.process.run(argv, { timeoutMs: PROBE_MS }),
    setLight: isLight => update($, lightAtom, () => isLight),
  }
}

async function refreshUsage($: EngineInterface): Promise<void> {
  const snap = usageSnap(await $.session.usage())
  await update($, usageAtom, () => snap)
}

// Opened by the person (/skin, or a press on its MODZ hub row) it asks for the keyboard: the hub
// stays open, so only a focused pane comes in front of it. Opened otherwise it takes none, so
// letters typed meant elsewhere never reach its hotkeys.
async function openSettings($: EngineInterface, isAsked: boolean): Promise<void> {
  await $.ui.open({ id: SETTINGS, title: SETTINGS_TITLE, closeOnEscape: true, ...(isAsked ? { focus: true } : {}) })
}

const openGallery = ($: EngineInterface) => $.ui.open({ id: GALLERY, title: 'Skin galerisi', focus: true, closeOnEscape: true })

// Runs Claude Code's own /compact, so the person sees its usual progress and result.
// Work a press starts is abandoned when the press ends, which cancels a compaction
// still running, so a timer starts it in a dispatch of its own, which returns the run
// so that dispatch lasts until the compaction ends. The button hides until then, so
// repeated presses do not queue one /compact each.
function compact($: EngineInterface): void {
  void update($, compactingAtom, () => true)
  $.clock.after(NEXT_TICK_MS, () =>
    $.command
      .run({ command: 'compact' })
      .catch((error: unknown) => $.ui.toast(`Sıkıştırma başarısız: ${error instanceof Error ? error.message : String(error)}`))
      .finally(() => update($, compactingAtom, () => false)),
  )
}

// The render modules' port (view.ts), for the drawing `e`.
function viewOf($: EngineInterface, e: Frozen<RenderInput>, live: Live): View {
  const copy = (text: string) => void $.ui.copy({ text, surface: e.surface }).then(result => $.ui.toast(result.isCopied ? 'Kopyalandı' : 'Burada kopyalanamadı'))

  return {
    active: () => activeSkin(storeOf($)),
    ui: () => $.ui.resolve(e),
    look: (active, isCopying = false) => lookOf({ ui: $.ui.resolve(e), active, surface: e.surface, ...(isCopying ? { copy } : {}) }),
    cwd: () => $.session.cwd(),
    now: () => $.clock.now(),
    duration: () => read($, memberOf(durationAtom, e)),
    hasImages: () => read($, memberOf(imagesAtom, e)),
    frame: () => read($, frameAtom),
    startedAt: () => read($, startedAtom),
    turns: () => read($, turnsAtom),
    usage: () => read($, usageAtom),
    isCompacting: () => read($, compactingAtom),
    compact: () => compact($),
    drewAt: columns => {
      live.lastColumns = columns
    },
  }
}

// The settings pane's port (render-panes.tsx).
function paneOf($: EngineInterface, e: Frozen<RenderInput>): SettingsHost {
  return {
    ...storeOf($),
    ui: () => $.ui.resolve(e),
    editing: () => read($, editingAtom),
    ports: {
      commit: state => void commit(storeOf($), state),
      edit: slot => void update($, editingAtom, () => slot),
      toast: text => $.ui.toast(text),
      gallery: () => void openGallery($),
    },
  }
}

async function refreshLook($: EngineInterface): Promise<void> {
  await load(storeOf($))
  await refreshTheme(themeOf($))
  await syncHub(storeOf($))
}

function onSession(on: On, live: Live): void {
  on('session.start', async ($, e, next) => {
    await $.command.register(SKIN_COMMAND)
    await $.tool.register({ name: DESIGN_TOOL.name, description: DESIGN_TOOL.description, inputSchema: DESIGN_TOOL.inputSchema })
    await load(storeOf($))
    await refreshUsage($)
    await refreshTheme(themeOf($))
    await syncHub(storeOf($))

    // Only the spinner reads the frame, so a tick redraws the spinner and nothing else.
    live.ticker?.cancel()
    live.ticker = $.clock.every(FRAME_MS, () => {
      if (live.isWorking) void update($, frameAtom, frame => frame + 1)
    })

    return next(e)
  })

  // /clear, /resume and /branch reset $.state to its defaults and skip session.start.
  on('classic.SessionStart', { source: ['clear', 'resume', 'fork'] }, async ($, e, next) => {
    await refreshLook($)

    return next(e)
  })
}

function onTurnStart(on: On, live: Live): void {
  on('turn.start', async ($, e, next) => {
    live.stats = NO_STATS
    live.isWorking = true
    const now = await $.clock.now()
    await update($, startedAtom, () => now)

    return next(e)
  })

  on('config.set', async ($, e, next) => {
    const result = await next(e)
    if (e.key === 'theme') {
      await refreshTheme(themeOf($))
      await syncHub(storeOf($))
    }

    return result
  })

  // Notes which prompts carried images, so their row keeps Claude Code's drawing of them.
  on('session.append', async ($, e, next) => {
    const stored = await next(e)
    const hasImage = e.door === 'prompt' && e.message.content.some(block => block.type === 'image')
    if (hasImage && stored.uuid !== undefined) await update($, memberOf(imagesAtom, { requestId: stored.uuid }), () => true)

    return stored
  })
}

function onTurnEnd(on: On, live: Live): void {
  // A turn's end and a plan limit's move are when the band's numbers change.
  on('session.measure', async ($, e, next) => {
    await refreshUsage($)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      await refreshUsage($)
      live.isWorking = false
      const finished = live.stats
      await update($, turnsAtom, turns => withTurn(turns, e.durationMs, finished))
    }

    return next(e)
  })

  // Times every call and counts the main loop's calls and changed lines.
  on('tool.call', async ($, e, next) => {
    const startedAt = await $.clock.now()
    const ran = await next(e)
    const ms = (await $.clock.now()) - startedAt

    await update($, memberOf(durationAtom, { requestId: e.tool_use_id }), () => ms)
    if (e.agentId === undefined && e.tool !== DESIGN && ran.deny === undefined) live.stats = addCall(live.stats, diffstat(ran.result))

    return ran
  })
}

function onCommands(on: On, live: Live): void {
  on('tool.call', { tool: DESIGN_MATCH }, async ($, e) => {
    const outcome = runDesign(e, { prefs: await read($, prefsAtom), custom: await read($, customAtom) })
    if (outcome.isError) return { deny: outcome.text }
    await commit(storeOf($), outcome.state)

    return { result: outcome.text }
  })

  // The MODZ main panel asks for the settings by writing `{ pane: 'skins' }` to `modz.open`.
  // modz's contract is not this mod's to import, so its address stays untyped here.
  on('state.set', { plugin: 'modz', key: 'open' } as any, async ($: EngineInterface, e: any, next: any) => {
    const done = await next(e)
    if (isOwnOpen(e.value)) await openSettings($, true)

    return done
  }).catch(($: EngineInterface, e: any, next: any) => next(e))

  on('command.run', { command: 'skin' }, ($, e) =>
    runSkin({ ...storeOf($), openSettings: () => openSettings($, true), openGallery: () => openGallery($), toast: text => $.ui.toast(text), columns: () => live.lastColumns }, e.args),
  )
}

function onRenders(on: On, live: Live): void {
  on('ui.render', { component: 'Pane', requestId: SETTINGS }, async ($, e) => {

    return settingsView(paneOf($, e), e)
  })
  on('ui.render', { component: 'Pane', requestId: GALLERY }, async ($, e) => {

    return galleryView({ view: viewOf($, e, live), e })
  })
  on('ui.render', { component: 'ToolUse' }, ($, e, next) => toolUseView({ view: viewOf($, e, live), e, pass: next }))
  on('ui.render', { component: 'ToolGroup' }, ($, e, next) => toolGroupView({ view: viewOf($, e, live), e, pass: next }))
  on('ui.render', { component: 'ToolResult' }, ($, e, next) => toolResultView({ view: viewOf($, e, live), e, pass: next }))
  on('ui.render', { component: 'UserMessage' }, ($, e, next) => userMessageView({ view: viewOf($, e, live), e, pass: next }))
  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => replyView({ view: viewOf($, e, live), e, pass: next }))
  on('ui.render', { component: 'Spinner' }, ($, e, next) => spinnerView({ view: viewOf($, e, live), e, pass: next }))
  on('ui.render', { component: 'TurnDuration' }, ($, e, next) => turnDurationView({ view: viewOf($, e, live), e, pass: next }))
  on('ui.render', { component: 'AbovePrompt' }, ($, e, next) => abovePromptView({ view: viewOf($, e, live), e, pass: next }))
  on('ui.render', { component: 'AskUserQuestion' }, ($, e, next) => askView({ view: viewOf($, e, live), e, pass: next }))
}

export const register: Register = on => {
  const live: Live = { stats: NO_STATS, isWorking: false }

  onSession(on, live)
  onTurnStart(on, live)
  onTurnEnd(on, live)
  onCommands(on, live)
  onRenders(on, live)
}
