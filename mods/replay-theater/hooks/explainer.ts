import type { ModelCompleteRequest, SessionMessage } from 'claude-code'

import { EXPLAIN_MODEL, buildPrompt, idsOfLoop, notesFromMessages, parseReply, unexplained, withNotes } from './explain'
import type { Replay, ReplayStep } from '../types'

const MODEL_TIMEOUT_MS = 20_000

type Reply = { isAnswered: true; text: string } | { isAnswered: false; reason: string }

// What explaining needs from the engine, as closures the hooks module makes (it alone holds `$`).
export type ExplainIo = {
  replay: () => Promise<Replay | null>
  change: (id: string, change: (replay: Replay) => Replay) => Promise<unknown>
  messages: (agentId: string | undefined) => Promise<SessionMessage[] | unknown>
  complete: (request: ModelCompleteRequest) => Promise<Reply>
  log: (line: string) => void
}

export function why(error: unknown): string {
  return error instanceof Error ? error.message : 'bilinmiyor'
}

// What Claude itself wrote before each edit, from the main transcript and each subagent's: zero tokens.
async function transcriptNotes(io: ExplainIo, steps: ReplayStep[]): Promise<Map<string, string>> {
  const notes = new Map<string, string>()
  for (const agentId of new Set(steps.map(step => step.agentId))) {
    const ids = idsOfLoop(steps, agentId)
    if (ids.size === 0) continue
    try {
      const found = await io.messages(agentId)
      if (Array.isArray(found)) notesFromMessages(found as SessionMessage[], ids).forEach((note, id) => notes.set(id, note))
    } catch (error) {
      io.log(`replay-theater: transcript not readable (${why(error)})`)
    }
  }

  return notes
}

// One cheap call for every step nothing else explains; an empty map when none is needed or it fails.
async function modelNotes(io: ExplainIo, steps: ReplayStep[]): Promise<Map<number, string>> {
  const indexes = unexplained(steps)
  if (indexes.length === 0) return new Map()
  const { prompt, maxTokens } = buildPrompt(steps, indexes)
  const reply = await io.complete({ model: EXPLAIN_MODEL, prompt, maxTokens, effort: 'low', timeoutMs: MODEL_TIMEOUT_MS })
  if (reply.isAnswered) return parseReply(reply.text, indexes)
  io.log(`replay-theater: no explanation from the model (${reply.reason})`)

  return new Map()
}

// Fills each step's line once per replay, the first time it is opened; the lines stay cached on it.
export async function explainReplay(io: ExplainIo, id: string): Promise<void> {
  const replay = await io.replay()
  if (replay === null || replay.id !== id || replay.explain !== 'none') return
  await io.change(id, current => ({ ...current, explain: 'pending' }))
  try {
    const said = await transcriptNotes(io, replay.steps)
    await io.change(id, current => ({ ...current, steps: withNotes(current.steps, step => (step.toolUseId === undefined ? undefined : said.get(step.toolUseId))) }))
    const fresh = await io.replay()
    const guessed = fresh === null || fresh.id !== id ? new Map<number, string>() : await modelNotes(io, fresh.steps)
    await io.change(id, current => ({ ...current, steps: withNotes(current.steps, (_, index) => guessed.get(index)) }))
  } catch (error) {
    io.log(`replay-theater: explaining failed (${why(error)})`)
  } finally {
    await io.change(id, current => ({ ...current, explain: 'done' }))
  }
}
