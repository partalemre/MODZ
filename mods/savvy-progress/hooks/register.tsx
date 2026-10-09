import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { isRunning } from './agents'
import { onBand } from './band'
import { onEvents } from './events'
import { PHASES } from './flow'
import { isLang, langOf, setLang } from './i18n'
import type { Lang } from './i18n'
import { onPane } from './pane'

// State refs live in each file that reads them: the scan follows literals, not imports.
const agents = atom({ plugin: 'savvy-progress', key: 'agents' } as const, [])
const now = atom({ plugin: 'savvy-progress', key: 'now' } as const, 0)

const TICK_MS = 1000

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

// Ticks the running agents' clocks; quiet when nothing runs.
function startTicker($: EngineInterface): void {
  $.clock.every(TICK_MS, () => {
    void (async () => {
      const list = await read($, agents)
      if (!list.some(isRunning)) return
      const at = await $.clock.now()
      await update($, now, () => at)
    })()
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
      description: 'Ajan panelini aç/kapat: çalışan, biten ve planlı alt ajanlar; model, bağlam, maliyet ve süre',
    })
    startTicker($)
    return started
  })

  onEvents(on)
  onPane(on)
  onBand(on)
}
