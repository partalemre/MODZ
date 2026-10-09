import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { AgentType } from '../types'
import { BUILTIN_TYPES, mergeTypes, parseAgentFile } from './agent-types'
import { isRunning } from './agents'
import { onBand } from './band'
import { onDispatch } from './dispatch'
import { onEvents } from './events'
import { PHASES } from './flow'
import { deriveJob } from './job'
import { hubDetailOf, toneOf } from './hub'
import { isLang, langOf, setLang } from './i18n'
import type { Lang } from './i18n'
import { readingOf, trackLimit } from './limit'
import { onPane } from './pane'
import { reconcile } from './roster'
import { isSame } from './same'
import { HUB_PANE } from './state'
import { onTranscript } from './transcript'

// State refs live in each file that reads them: the scan follows literals, not imports.
const agents = atom({ plugin: 'savvy-progress', key: 'agents' } as const, [])
const now = atom({ plugin: 'savvy-progress', key: 'now' } as const, 0)
const limit = atom({ plugin: 'savvy-progress', key: 'limit' } as const, null)
const flow = atom({ plugin: 'savvy-progress', key: 'flow' } as const, null)
const job = atom({ plugin: 'savvy-progress', key: 'job' } as const, null)
const tasks = atom({ plugin: 'savvy-progress', key: 'tasks' } as const, [])
const types = atom({ plugin: 'savvy-progress', key: 'types' } as const, BUILTIN_TYPES)
const hub = atom({ plugin: 'savvy-progress', key: 'hub' } as const, { pane: HUB_PANE, detail: '', tone: 'idle', at: 0 })

type On = Parameters<Register>[0]

const TICK_MS = 1000
// The project's agents folder (from the working directory), and the same folder under $HOME.
const AGENTS_DIR = '.claude/agents'

const PROGRESS_SPEC = {
  name: 'progress',
  description:
    'Report /savvy-flow progress to the progress bar above the prompt and the agents panel. ' +
    'Call it after presenting the plan (title, total, tasks, phase "delegate"), each time a task is accepted (done), ' +
    'when switching phase or re-planning (tasks), and once at the end with finished: true. Fields left out keep their previous value.',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Short name of the overall task, a few words.' },
      total: { type: 'integer', minimum: 0, description: 'Number of planned worker tasks.' },
      done: { type: 'integer', minimum: 0, description: 'Number of tasks accepted after review.' },
      phase: { type: 'string', enum: [...PHASES] },
      finished: { type: 'boolean', description: 'True once the flow is closed.' },
      tasks: {
        type: 'array',
        description:
          'The planned worker tasks in order, numbered from 1. Each title must equal the Agent tool `description` the task will be delegated with, so the panel can match runs to tasks.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'A few words; reused verbatim as the Agent description.' },
            tier: { type: 'string', enum: ['fable', 'heavy', 'careful', 'medium', 'light'] },
            after: { type: 'array', items: { type: 'integer' }, description: 'Numbers of the tasks this one waits for.' },
          },
          required: ['title', 'tier'],
        },
      },
    },
  },
} as const

const STEP_SPEC = {
  name: 'step',
  description:
    'For savvy-flow workers: report progress on your own task to the agents panel. ' +
    'Right after reading the brief, call it with `total` (your plan in 3-8 steps) and `done: 0`; ' +
    'call it again as each step finishes. Cheap and silent: it only draws a bar.',
  inputSchema: {
    type: 'object',
    properties: {
      done: { type: 'integer', minimum: 0, description: 'Steps finished so far.' },
      total: { type: 'integer', minimum: 1, description: 'Steps planned; may change if the plan changes.' },
      note: { type: 'string', description: 'The step in progress, a few words.' },
    },
    required: ['done'],
  },
} as const

async function settingsLang($: EngineInterface): Promise<Lang | null> {
  try {
    const settings = (await $.settings.read()) as Record<string, unknown>
    return langOf(settings.language)
  } catch (error) {
    $.ui.log(`savvy-progress: settings unreadable, using the locale (${String(error)})`, { to: 'debug' })
    return null
  }
}

async function detectLang($: EngineInterface, option: unknown): Promise<Lang> {
  if (isLang(option)) return option
  const fromSettings = await settingsLang($)
  if (fromSettings) return fromSettings
  const locale = (await $.env.get('LC_ALL')) || (await $.env.get('LC_MESSAGES')) || (await $.env.get('LANG'))
  return langOf(locale) ?? 'tr'
}

// Where the 5h window and the session's dollars stood when the session started.
async function seedLimit($: EngineInterface): Promise<void> {
  try {
    const usage = await $.session.usage()
    const reading = readingOf(usage.rateLimits, usage.cost?.usd)
    const prev = await read($, limit)
    if (reading && !isSame(trackLimit(prev, reading), prev)) await update($, limit, p => trackLimit(p, reading))
  } catch (error) {
    $.ui.log(`savvy-progress: no usage yet, the 5h share waits for a measure (${String(error)})`, { to: 'debug' })
  }
}

async function scanDir($: EngineInterface, dir: string, source: string): Promise<AgentType[]> {
  const found: AgentType[] = []
  try {
    for (const entry of await $.fs.list(dir)) {
      if (!entry.name.endsWith('.md')) continue
      const type = parseAgentFile(await $.fs.read(`${dir}/${entry.name}`), source)
      if (type) found.push(type)
    }
  } catch (error) {
    $.ui.log(`savvy-progress: no agent files in ${dir} (${String(error)})`, { to: 'debug' })
  }
  return found
}

// The agent types "Yeni görev" can start from files: the project's, then the user's.
async function scanTypes($: EngineInterface): Promise<void> {
  const home = await $.env.get('HOME')
  const project = await scanDir($, AGENTS_DIR, 'project')
  const user = home ? await scanDir($, `${home}/${AGENTS_DIR}`, 'user') : []
  const found = [...project, ...user]
  const known = await read($, types)
  if (found.length && !isSame(mergeTypes(known, found), known)) await update($, types, current => mergeTypes(current, found))
}

// Folds the engine's own agent list into ours: an agent spawned before this mod loaded appears,
// one whose end event never came is closed. A failure only costs this beat, never the session.
async function syncRoster($: EngineInterface): Promise<void> {
  try {
    const roster = await $.agent.list()
    const at = await $.clock.now()
    const prev = await read($, agents)
    if (reconcile(prev, roster, at) !== prev) await update($, agents, list => reconcile(list, roster, at))
  } catch (error) {
    $.ui.log(`savvy-progress: no agent list this beat (${String(error)})`, { to: 'debug' })
  }
}

// One beat a second: the roster is folded in, and the running agents' clocks tick while any runs.
function startBeat($: EngineInterface): void {
  $.clock.every(TICK_MS, () => {
    void (async () => {
      await syncRoster($)
      const list = await read($, agents)
      if (!list.some(isRunning)) return
      const at = await $.clock.now()
      await update($, now, () => at)
    })()
  })
}

// The MODZ hub's card for this mod (DESIGN.md §9): written when its words or tone moved, or always
// when `isForced` (once per session start, so the card stands from the hub's first look).
async function syncHub($: EngineInterface, isForced = false): Promise<void> {
  const list = await read($, agents)
  const view = deriveJob({ flow: await read($, flow), agents: list, job: await read($, job), tasks: await read($, tasks) })
  const detail = hubDetailOf(view, list.filter(isRunning).length)
  const tone = toneOf(view)
  const prev = await read($, hub)
  if (!isForced && prev.detail === detail && prev.tone === tone) return
  const at = await $.clock.now()
  await update($, hub, () => ({ pane: HUB_PANE, detail, tone, at }))
}

// The values the card is derived from; `now`, `panel`, `limit` and `hub` itself never move it.
// A card that failed to sync never holds up the write it follows.
function onHubSources(on: On): void {
  on('state.set', { plugin: 'savvy-progress', key: 'flow' }, async ($, e, next) => {
    const done = await next(e)
    await syncHub($)
    return done
  }).catch(($, e, next) => next(e))
  on('state.set', { plugin: 'savvy-progress', key: 'agents' }, async ($, e, next) => {
    const done = await next(e)
    await syncHub($)
    return done
  }).catch(($, e, next) => next(e))
  on('state.set', { plugin: 'savvy-progress', key: 'job' }, async ($, e, next) => {
    const done = await next(e)
    await syncHub($)
    return done
  }).catch(($, e, next) => next(e))
  on('state.set', { plugin: 'savvy-progress', key: 'tasks' }, async ($, e, next) => {
    const done = await next(e)
    await syncHub($)
    return done
  }).catch(($, e, next) => next(e))
}

// A desktop that comes back keeps showing the tree it had; the engine released that tree's buttons when it
// left, so its first click would be refused. Drawing again on attach hands it live buttons.
function onAttach(on: On): void {
  on('session.attach', async ($, e, next) => {
    const attached = await next(e)
    $.ui.invalidate('ui.render')

    return attached
  })
}

export const register: Register = (on, options) => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    setLang(await detectLang($, options.language))
    await $.tool.register(PROGRESS_SPEC)
    await $.tool.register(STEP_SPEC)
    await $.command.register({
      name: 'agents-info',
      description: 'Ajanlar panelini aç/kapat: çalışan, biten ve planlı alt ajanlar; ilerleme, maliyet, zaman çizelgesi, sessiz ajan uyarısı; mesaj, durdur ve yeni görev',
    })
    startBeat($)
    await seedLimit($)
    await scanTypes($)
    await syncHub($, true)
    return started
  })

  onEvents(on)
  onPane(on)
  onDispatch(on)
  onBand(on)
  onHubSources(on)
  onTranscript(on)
  onAttach(on)
}
