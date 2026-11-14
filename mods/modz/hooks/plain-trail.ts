// The trail of a run of tool calls: what the agent set out to do, step by step, for someone who has never coded.
// A step leads with the agent's own words for it (the description it wrote with the call) and is followed by the
// rule-made sentence of what that means; calls that say little one by one (file reads, searches) fold into one
// step with a count, and a pause between two steps is left out. All read from the calls: no model call.
import type { Lang } from './kit/lang'
import { kindOf, plainCall, purposeOf } from './kit/plain'
import type { Kind } from './kit/plain'

/** One call as a row or a group hands it over. */
export type ToldCall = { tool: string; input: unknown; isRunning?: boolean; isErrored?: boolean; isInterrupted?: boolean }

export type StepState = 'live' | 'done' | 'failed' | 'stopped'

/** A file a step reads or changes: its name as the line says it, and its whole path, so the name can be pressed open. */
export type StepFile = { name: string; path: string }

/** `note` is the quiet half of the line; `count` is how many calls the step stands for; `files` are the ones it is about. */
export type Step = { kind: Kind; text: string; note: string; count: number; state: StepState; files: StepFile[] }

export type Trail = { steps: Step[]; more: number; flow: Array<{ kind: Kind; count: number; state: StepState }> }

// Calls that only keep the app's own displays current (the task list, a progress bar): nothing to tell a person.
const HOUSEKEEPING = /^mcp__(ccd_|savvy-progress__)/
const STEPS_SHOWN = 8
const NAMES_SHOWN = 3
const NAME_MAX = 28
const NAMED_BY = ['file_path', 'notebook_path', 'pattern', 'query', 'url'] as const

// A run of these reads as one step: "4 dosya okuyor · a.ts, b.ts, c.ts +1".
const MANY: Partial<Record<Kind, Record<Lang, (n: number) => string>>> = {
  read: { en: n => `Reading ${n} files`, tr: n => `${n} dosya okuyor` },
  edit: { en: n => `Changing ${n} files`, tr: n => `${n} dosyayı değiştiriyor` },
  search: { en: n => `Searching the files ${n} times`, tr: n => `Dosyalarda ${n} arama yapıyor` },
  web: { en: n => `Looking on the internet ${n} times`, tr: n => `İnternette ${n} kez bakıyor` },
}

// The worst that happened among a step's calls is what the step shows.
const RANK: readonly StepState[] = ['done', 'live', 'stopped', 'failed']

type Told = { kind: Kind; why: string; said: string; name: string; file?: StepFile; state: StepState }

export const isTold = (tool: string): boolean => !HOUSEKEEPING.test(tool)

export function stateOf(call: ToldCall): StepState {
  if (call.isInterrupted === true) return 'stopped'
  if (call.isErrored === true) return 'failed'

  return call.isRunning === true ? 'live' : 'done'
}

const worst = (states: readonly StepState[]): StepState =>
  states.reduce<StepState>((top, state) => (RANK.indexOf(state) > RANK.indexOf(top) ? state : top), 'done')

const unique = <T>(list: readonly T[]): T[] => list.filter((item, i) => list.indexOf(item) === i)

// The thing a call is about, short: a file's name, a site's host, the words searched for.
function nameOf(input: unknown): string {
  const fields = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  const field = NAMED_BY.find(key => typeof fields[key] === 'string' && fields[key] !== '')
  if (field === undefined) return ''
  const value = String(fields[field])
  if (field === 'url') return value.replace(/^\w+:\/\//, '').split('/')[0] ?? value
  const name = field === 'pattern' || field === 'query' ? `“${value}”` : value.split('/').filter(Boolean).at(-1) ?? value

  return name.length > NAME_MAX ? `${name.slice(0, NAME_MAX - 1)}…` : name
}

/** The file a call reads or changes, when its input names one by its whole path. */
export function fileOf(input: unknown): StepFile | undefined {
  const fields = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  const path = fields.file_path ?? fields.notebook_path
  if (typeof path !== 'string' || !path.startsWith('/')) return undefined

  return { name: path.split('/').filter(Boolean).at(-1) ?? path, path }
}

const toldOf = (call: ToldCall, lang: Lang): Told => ({
  kind: kindOf(call.tool, call.input),
  why: purposeOf(call.input),
  said: plainCall(call.tool, call.input, lang),
  name: nameOf(call.input),
  file: fileOf(call.input),
  state: stateOf(call),
})

// Calls the agent described stand each for themselves; the rest gather by kind when the kind folds, else by sentence.
const keyOf = (told: Told): string => {
  if (told.why !== '') return `why:${told.why}`

  return MANY[told.kind] === undefined ? `said:${told.said}` : `kind:${told.kind}`
}

const listOf = (names: readonly string[]): string =>
  names.slice(0, NAMES_SHOWN).join(', ') + (names.length > NAMES_SHOWN ? ` +${names.length - NAMES_SHOWN}` : '')

function stepOf(bucket: readonly Told[], lang: Lang): Step {
  const first = bucket[0] as Told
  const state = worst(bucket.map(told => told.state))
  const files = bucket.flatMap(told => (told.file === undefined ? [] : [told.file])).filter((file, i, all) => all.findIndex(other => other.path === file.path) === i)
  if (first.why !== '') return { kind: first.kind, text: first.why, note: first.said, count: bucket.length, state, files }
  const names = unique(bucket.map(told => told.name).filter(name => name !== ''))
  const many = MANY[first.kind]
  if (many !== undefined && names.length > 1) return { kind: first.kind, text: many[lang](names.length), note: listOf(names), count: 1, state, files }

  return { kind: first.kind, text: first.said, note: '', count: bucket.length, state, files }
}

// The order of the work as a picture: neighbours of one kind are one stop.
function flowOf(told: readonly Told[]): Trail['flow'] {
  const flow: Trail['flow'] = []
  for (const { kind, state } of told) {
    const stop = flow.at(-1)
    if (stop?.kind === kind) Object.assign(stop, { count: stop.count + 1, state: worst([stop.state, state]) })
    else flow.push({ kind, count: 1, state })
  }

  return flow
}

/** The steps of a run of calls in the order they were first made, and how many steps were left out. */
export function trailOf(calls: readonly ToldCall[], lang: Lang): Trail {
  const all = calls.filter(call => isTold(call.tool)).map(call => toldOf(call, lang))
  const working = all.filter(told => told.kind !== 'wait')
  const told = working.length > 0 ? working : all
  const keys = unique(told.map(keyOf))
  const steps = keys.map(key => stepOf(told.filter(item => keyOf(item) === key), lang))

  return { steps: steps.slice(0, STEPS_SHOWN), more: Math.max(0, steps.length - STEPS_SHOWN), flow: flowOf(told) }
}
