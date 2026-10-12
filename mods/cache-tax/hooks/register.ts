import type { EngineInterface, On, PromptSubmitInput, PromptSubmitResult, Register, TurnCompleteInput } from 'claude-code'

import { composeBand } from './band'
import { pinned } from './pin'
import type { Prefs } from './band'
import { AUTO_WARM_MS, BIG_TOKENS, DEFAULT_WINDOW_MS, MIN_MS, MIN_PING_MS, PING_AFTER_MS, freshState, isCold, isFullMiss, parseDuration, priceOf, resetForClear } from './core'
import type { State } from './core'
import type { HoldActions } from './hold'
import { bandKey } from './row'
import { seedFromResume } from './session'
import { isLightTheme } from './theme'
import { KEY_ALWAYS, KEY_GUARD, arm, deadlineKey, everyKey, prune, startWindow, stop, stopForGood, updateStatus } from './warm'
import type { Io } from './warm'
import { setLang } from './lang'
import { alwaysText, armedText, cardText, commands, dropText, paidText, say, statusText, warnText } from './words'

export { fmtDuration } from './fmt'
export { freshState, parseDuration, resetForClear } from './core'
export type { State } from './core'
export { seedFromResume } from './session'
export type { ResumeFields } from './session'

const NAME = 'cache-tax'

/** keepwarm's reach, bound here: only this file holds `$`. */
function io($: EngineInterface): Io {
  return {
    now: () => $.clock.now(),
    after: (ms, fn) => $.clock.after(ms, fn),
    fork: prompt => $.model.fork({ prompt }),
    get: key => $.store.get(key),
    set: (key, value) => $.store.set(key, value),
    del: key => $.store.delete(key),
    redraw: () => $.ui.invalidate('ui.render'),
    status: text => $.ui.status(text),
  }
}

type Ctx = { s: State; prefs: Prefs; drawn: string }

/** What the band shows changes minute by minute; it is redrawn only when the drawing would differ. */
function tick($: EngineInterface, c: Ctx, now: number) {
  const key = bandKey(c.s, now)
  if (key === c.drawn) return
  c.drawn = key
  $.ui.invalidate('ui.render')
}

function actions($: EngineInterface, s: State): HoldActions {
  const release = () => {
    const held = s.held
    s.held = null
    $.ui.invalidate('ui.render')
    return held
  }
  return {
    pay: () => void (async () => {
      const held = release()
      if (!held) return
      s.resend = held.text
      await $.prompt.submit({ text: held.text, asUser: true })
    })(),
    fresh: () => void (async () => {
      const held = release()
      await $.command.run({ command: 'clear' })
      if (held) await $.prompt.fill({ text: held.text })
    })(),
    status: () => void $.command.run({ command: NAME }),
  }
}

async function readPrefs($: EngineInterface, prefs: Prefs) {
  const theme = (await $.config.list()).find(row => row.key === 'theme')?.value
  prefs.isLight = isLightTheme(theme)
  prefs.noColor = Boolean(await $.env.get('NO_COLOR'))
}

async function restore($: EngineInterface, s: State, now: number) {
  await prune(io($), s, now)
  const saved = await $.store.get(deadlineKey(s))
  const savedEvery = await $.store.get(everyKey(s))
  s.deadline = typeof saved === 'number' && saved > now ? saved : 0
  s.every = typeof savedEvery === 'number' && savedEvery >= MIN_PING_MS ? savedEvery : PING_AFTER_MS
  s.guard = (await $.store.get(KEY_GUARD)) === 'warn' ? 'warn' : 'refuse'
  s.always = (await $.store.get(KEY_ALWAYS)) === true
  // Always means a fresh default window every session, whatever the last one left behind.
  if (s.always) await startWindow(io($), s, { windowMs: DEFAULT_WINDOW_MS, every: PING_AFTER_MS })
  const usage = await $.session.usage()
  if (usage.context.tokens) s.ctx = usage.context.tokens
}

async function registerCommands($: EngineInterface) {
  const specs = commands()
  await $.command.register(specs.keepwarm)
  await $.command.register(specs.cacheTax)
  // The hook form of cache-tax ships a /cache-tax:status skill; both installed means two guards.
  if ((await $.command.list()).some(cmd => cmd.name === 'cache-tax:status')) $.ui.log(say().hookTwice)
}

async function onKeepwarm($: EngineInterface, s: State, args: string): Promise<string> {
  const words = args.trim().split(/\s+/).filter(Boolean)
  const now = await $.clock.now()
  if (words[0] === 'off') {
    const wasAlways = s.always
    await stopForGood(io($), s)
    return wasAlways ? say().keepwarm.offAlways : say().keepwarm.off
  }
  if (words[0] === 'always') {
    s.always = true
    await $.store.set(KEY_ALWAYS, true)
    await startWindow(io($), s, { windowMs: DEFAULT_WINDOW_MS, every: PING_AFTER_MS })
    return alwaysText(s, now)
  }
  if (words[0] === 'status') return statusText(s, now) ?? say().keepwarm.off
  const window = words.length ? parseDuration(words[0] ?? '') : DEFAULT_WINDOW_MS
  if (window == null) return say().keepwarm.usage
  // "every 2m" is a testing knob and lasts only for the window it was given with.
  let every = PING_AFTER_MS
  if (words[1] === 'every') {
    const period = parseDuration(words[2] ?? '')
    if (period == null || period < MIN_PING_MS) return say().keepwarm.every
    every = period
  }
  await startWindow(io($), s, { windowMs: window, every })
  return armedText(s, now, window)
}

async function onCacheTax($: EngineInterface, s: State, args: string): Promise<string> {
  const words = args.trim().split(/\s+/).filter(Boolean)
  if (words[0] !== 'guard') return cardText(s, await $.clock.now())
  if (words[1] !== 'warn' && words[1] !== 'refuse') return say().guardMode.usage
  s.guard = words[1]
  await $.store.set(KEY_GUARD, s.guard)
  return s.guard === 'refuse' ? say().guardMode.refuse : say().guardMode.warn
}

type Submit = { e: PromptSubmitInput; next: (e: PromptSubmitInput) => Promise<PromptSubmitResult> }

// The message that pays. Of a typed prompt only its first character is read, and its text kept while it waits.
async function onPrompt($: EngineInterface, s: State, { e, next }: Submit): Promise<PromptSubmitResult> {
  if (e.origin.kind === 'plugin') {
    // The card's own resend: the person pressed pay, so its cold write is scored.
    if (e.origin.name === NAME && e.text === s.resend) {
      s.resend = null
      s.coldWritePending = true
    }
    return next(e)
  }
  if (typeof e.text !== 'string' || e.text.trimStart().startsWith('/')) return next(e)
  const now = await $.clock.now()
  if (!isCold(s, now) || s.ctx < BIG_TOKENS) return next(e)
  if (s.guard === 'warn' || s.ackedAt === s.lastRequestAt) {
    if (s.guard === 'warn') $.ui.log(warnText(s, now))
    s.ackedAt = 0
    s.coldWritePending = true
    if (s.held && s.hasBand) $.ui.invalidate('ui.render')
    s.held = null
    return next(e)
  }
  s.ackedAt = s.lastRequestAt
  s.held = { text: e.text, at: now }
  if (s.hasBand) $.ui.invalidate('ui.render')
  return { drop: dropText(s, now) }
}

async function onTurnComplete($: EngineInterface, s: State, e: TurnCompleteInput) {
  const now = await $.clock.now()
  // A sleeping host may deliver this turn before the expired window's timer.
  if (s.deadline && now >= s.deadline) await stop(io($), s, null)
  // turn.step stamps the exact request time; when no step of this turn did, the turn's end is the floor.
  if (now - s.lastRequestAt > e.durationMs) s.lastRequestAt = now
  s.compacted = false
  s.ackedAt = 0
  s.held = null
  const u = e.usage
  if (u) {
    if (u.model) s.lastModel = u.model
    const prev = s.ctx
    // A turn's usage is its responses summed, so a ten-step turn reports ten reads of the context. The live window
    // is the engine's figure; the sum is only the fallback for a host that reports no tokens.
    const write = u.cache_creation_input_tokens
    const live = (await $.session.usage()).context.tokens
    s.ctx = live && live > 0 ? live : u.input_tokens + u.cache_read_input_tokens + write
    if (isFullMiss(prev, write) || s.coldWritePending) await scoreMiss($, s, { now, write })
  }
  s.coldWritePending = false
  await arm(io($), s)
}

async function scoreMiss($: EngineInterface, s: State, { now, write }: { now: number; write: number }) {
  const price = priceOf(s.lastModel)
  const usd = price ? write * price[1] / 1e6 : null
  s.misses.push({ at: now, tokens: write, usd })
  if (s.deadline >= now + AUTO_WARM_MS) return
  await startWindow(io($), s, { windowMs: AUTO_WARM_MS, every: s.every })
  $.ui.log(paidText(write, usd))
}

function wireBand(on: On, c: Ctx) {
  const { s } = c
  on('config.set', { key: 'theme' }, async ($, e, next) => {
    const result = await next(e)
    if (result.deny === undefined) {
      c.prefs.isLight = isLightTheme(result.value)
      if (s.hasBand) $.ui.invalidate('ui.render')
    }
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const theirs = await next(e)
    if (!s.hasBand || e.props.hasSurvey) return theirs
    const band = { s, prefs: c.prefs, actions: actions($, s), columns: e.props.bodyColumns, now: await $.clock.now() }
    if (e.surface === 'desktop') return pinned(e, composeBand({ surface: 'desktop', ui: $.ui.resolve(e) }, theirs, band))
    if (e.surface === 'terminal') return pinned(e, composeBand({ surface: 'terminal', ui: $.ui.resolve(e) }, theirs, band))
    return theirs
  })
}

function wireSession(on: On, c: Ctx) {
  const { s } = c
  on('session.start', async ($, e, next) => {
    // The interface language (kit/lang.ts). Spelled out: the engine admits an env read by a literal name only.
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    const r = await next(e)
    s.hasBand = e.surface === 'terminal' || e.surface === 'desktop'
    if (s.hasBand) {
      await readPrefs($, c.prefs)
      $.clock.every(MIN_MS, () => void $.clock.now().then(now => tick($, c, now)))
    }
    s.sid = await $.session.id()
    const now = await $.clock.now()
    await restore($, s, now)
    await registerCommands($)
    updateStatus(io($), s, now)
    return r
  })

  // Resume fields seed the guard before any turn of the resumed session has run.
  on('classic.SessionStart', async ($, e, next) => {
    const r = await next(e)
    if (e.source === 'clear') {
      await stop(io($), s, null)
      resetForClear(s)
      s.sid = await $.session.id()
      updateStatus(io($), s, await $.clock.now())
      return r
    }
    const line = seedFromResume(s, e, await $.clock.now())
    // The resume payload may omit the model; without it the guard cannot price the cold write.
    if (!s.lastModel) s.lastModel = await $.session.model()
    if (line) $.ui.log(line)
    // The seeded clock decides whether a restored or always window pings before the first turn: never when it is cold.
    await arm(io($), s)
    return r
  })
}

function wireTurns(on: On, s: State) {
  on('command.run', { command: 'keepwarm' }, async ($, e) => ({ text: await onKeepwarm($, s, String(e.args ?? '')) }))
  on('command.run', { command: NAME }, async ($, e) => ({ text: await onCacheTax($, s, String(e.args ?? '')) }))
  on('prompt.submit', ($, e, next) => onPrompt($, s, { e, next }))

  on('turn.step', async function* ($, e, next) {
    if (!e.agentId) s.lastRequestAt = await $.clock.now()
    yield* next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    if (!e.agentId) await onTurnComplete($, s, e)
    return r
  })

  on('session.compact', async ($, e, next) => {
    const r = await next(e)
    if (!e.agentId) {
      s.compacted = true
      s.ctx = 0
      s.ackedAt = 0
      s.held = null
      await arm(io($), s)
    }
    return r
  })
}

export const register: Register = on => {
  const c: Ctx = { s: freshState(), prefs: { isLight: false, noColor: false }, drawn: '' }
  wireBand(on, c)
  wireSession(on, c)
  wireTurns(on, c.s)
}
