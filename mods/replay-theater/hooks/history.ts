import { shortLine } from './explain'
import { currentStep, planAfter, PLAN_TOOLS } from './plan'
import { EDIT_TOOLS, stepsFor } from './record'
import type { Before, EditCall } from './record'
import { AGENT_TOOLS, MAIN } from './transcript'
import type { Fields, TranscriptEvent } from './transcript'
import { words } from './words'
import type { ReplayPlanItem, ReplayPlanStep, ReplayStep, ReplayTurnRow } from '../types'

// A session's turns rebuilt from its transcript events: each prompt starts a turn, and every answered edit
// of the main loop or of a subagent it started joins it, with the sentence said before it and the plan step.

export type PastEdit = { id: string; agent: string; tool: string; input: Fields; said?: string; plan?: ReplayPlanStep; before?: Before }
export type PastTurn = { n: number; ask: string; at: number; edits: PastEdit[] }
export type PastSession = { title: string; prompts: number; turns: PastTurn[] }

const stringOr = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined)
const isPlanTool = (tool: string): boolean => (PLAN_TOOLS as readonly string[]).includes(tool)

type Result = Extract<TranscriptEvent, { kind: 'result' }>
type Fold = {
  turns: PastTurn[]
  plan: ReplayPlanItem[]
  said: Map<string, string>
  // The turn each Agent call ran in, and each subagent's Agent call (from its meta file).
  turnOfUse: Map<string, PastTurn>
  owners: Map<string, string>
  results: Map<string, Result>
}

const timeOf = (at: string): number => {
  const ms = Date.parse(at)

  return Number.isFinite(ms) ? ms : 0
}

type Placed = { event: TranscriptEvent; k: number }

// ISO times compare as text; a tie keeps file order.
function earlier(a: Placed, b: Placed): number {
  if (a.event.at === b.event.at) return a.k - b.k

  return a.event.at < b.event.at ? -1 : 1
}

// Every source's events in time order.
export function inTimeOrder(events: TranscriptEvent[]): TranscriptEvent[] {
  return events.map((event, k) => ({ event, k })).sort(earlier).map(item => item.event)
}

// What the transcript holds of a Write's earlier text: none on a new file, the whole text when it was kept.
function beforeOf(tool: string, result: Result | undefined): Before | undefined {
  if (tool !== 'Write') return undefined
  const detail = result?.detail
  if (detail?.type === 'create') return { text: '', isNew: true }
  if (typeof detail?.originalFile === 'string') return { text: detail.originalFile, isNew: false }

  return { text: '', isNew: false, isKnown: false }
}

// A subagent's edit belongs to the turn its Agent call ran in; without its meta file, to the turn under way.
function turnFor(fold: Fold, agent: string): PastTurn | undefined {
  const owner = fold.owners.get(agent)
  const owned = owner === undefined ? undefined : fold.turnOfUse.get(owner)

  return owned ?? fold.turns[fold.turns.length - 1]
}

function opened(fold: Fold, at: string, ask: string): PastTurn {
  const turn = { n: fold.turns.length + 1, ask, at: timeOf(at), edits: [] }
  fold.turns.push(turn)

  return turn
}

function onUse(fold: Fold, event: Extract<TranscriptEvent, { kind: 'use' }>): void {
  const result = fold.results.get(event.id)
  const isAnswered = result === undefined || !result.isError
  if (AGENT_TOOLS.has(event.tool)) fold.turnOfUse.set(event.id, fold.turns[fold.turns.length - 1] ?? opened(fold, event.at, ''))
  // TodoWrite is the main loop's own list; a subagent's would replace it.
  if (isPlanTool(event.tool) && isAnswered && !(event.tool === 'TodoWrite' && event.agent !== MAIN)) {
    fold.plan = planAfter(fold.plan, { ...event.input, tool: event.tool }, result?.detail)
  }
  if (!EDIT_TOOLS.has(event.tool)) {
    fold.said.delete(event.agent)

    return
  }
  if (!isAnswered) return
  const turn = turnFor(fold, event.agent) ?? opened(fold, event.at, '')
  const said = fold.said.get(event.agent)
  const plan = currentStep(fold.plan) ?? undefined
  const before = beforeOf(event.tool, result)
  turn.edits.push({ id: event.id, agent: event.agent, tool: event.tool, input: event.input, ...(said === undefined ? {} : { said }), ...(plan === undefined ? {} : { plan }), ...(before === undefined ? {} : { before }) })
}

// The turns of one session from all its events (main transcript and subagents), already in time order.
export function foldSession(events: TranscriptEvent[], owners: Map<string, string>): PastSession {
  const results = new Map(events.flatMap(event => (event.kind === 'result' ? [[event.id, event] as const] : [])))
  const fold: Fold = { turns: [], plan: [], said: new Map(), turnOfUse: new Map(), owners, results }
  let prompts = 0
  let title = ''
  for (const event of events) {
    if (event.kind === 'prompt') {
      prompts += 1
      title = title === '' ? shortLine(event.text) : title
      opened(fold, event.at, shortLine(event.text))
      fold.said.clear()
    } else if (event.kind === 'said') fold.said.set(event.agent, shortLine(event.text))
    else if (event.kind === 'use') onUse(fold, event)
  }

  return { title, prompts, turns: fold.turns.filter(turn => turn.edits.length > 0) }
}

const filesOf = (turn: PastTurn): number => new Set(turn.edits.map(edit => stringOr(edit.input.file_path) ?? stringOr(edit.input.notebook_path) ?? '')).size

export const editCount = (session: PastSession): number => session.turns.reduce((sum, turn) => sum + turn.edits.length, 0)

// The list lines of a session's turns that edited files, newest first.
export function turnRows(session: PastSession): ReplayTurnRow[] {
  return session.turns.map(turn => ({ n: turn.n, ask: turn.ask, at: turn.at, edits: turn.edits.length, files: filesOf(turn) })).reverse()
}

// An Edit's transcript holds the changed span, not the file: its note says so.
function spanNote(step: ReplayStep): ReplayStep {
  if (step.tool !== 'Edit' && step.tool !== 'MultiEdit') return step

  return { ...step, note: [words().spanOnly, step.note].filter(Boolean).join(' · ') }
}

// The call's fields as an edit call, each of the type it must have; the texts stay as given (the diff reads any).
function callOf(edit: PastEdit): EditCall {
  const input = edit.input
  const edits = Array.isArray(input.edits) ? input.edits.filter((one): one is Fields => typeof one === 'object' && one !== null) : undefined

  return {
    tool: edit.tool, tool_use_id: edit.id, ...(edit.agent === MAIN ? {} : { agentId: edit.agent }),
    file_path: stringOr(input.file_path), notebook_path: stringOr(input.notebook_path),
    old_string: input.old_string, new_string: input.new_string, content: input.content, new_source: input.new_source,
    replace_all: input.replace_all === true, edit_mode: input.edit_mode, description: input.description, edits,
  }
}

// One turn's edits as replay steps, drawn exactly as a live turn's.
export async function stepsOfTurn(turn: PastTurn, cwd: string): Promise<ReplayStep[]> {
  const steps: ReplayStep[] = []
  for (const edit of turn.edits) {
    const call = callOf(edit)
    const unknown: Before = { text: '', isNew: false, isKnown: false }
    const made = await stepsFor({ cwd, before: async () => edit.before ?? unknown }, call)
    const extra = { ...(edit.said === undefined ? {} : { said: edit.said }), ...(edit.plan === undefined ? {} : { plan: edit.plan }) }
    steps.push(...made.map(step => spanNote({ ...extra, ...step })))
  }

  return steps
}
