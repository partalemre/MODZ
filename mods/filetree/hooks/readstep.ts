// The hooks' side of read costs (readcost.ts): a read waits in its loop until the loop's next request reports
// how big its prompt grew. Steps of the main loop and of each subagent are measured apart, by `agentId`.

import type { Host } from './host'
import { addedOf, attribute, growthOf, type PendingRead, rateAfter, sizeOf, type Usage } from './readcost'
import { type Loop, mem } from './session'
import { posix } from './tree'
import { noteCosts } from './turn'

type Step = { turnId: string; agentId: string | undefined; reads: PendingRead[]; usage: Usage | null }

const keyOf = (agentId: string | undefined): string => agentId ?? ''

function loopOf(agentId: string | undefined): Loop {
  const key = keyOf(agentId)
  const loop = mem.loops.get(key) ?? { turnId: '', size: null, pending: [] }
  mem.loops.set(key, loop)
  return loop
}

// A Read that answered: its file and the length of the text Claude got wait for the loop's next request.
export function noteRead(read: { id: string; file: string; text: string; agentId: string | undefined }): void {
  if (!read.id) return
  loopOf(read.agentId).pending.push({ id: read.id, file: posix(read.file), chars: read.text.length })
}

// At a request's start, the reads waiting are the step before's: this request's own tools have not run yet.
export function takeReads(agentId: string | undefined): PendingRead[] {
  const loop = loopOf(agentId)
  const reads = loop.pending
  loop.pending = []
  return reads
}

async function measure(h: Host, step: { reads: PendingRead[]; agentId: string | undefined; grown: number }): Promise<void> {
  const { reads, agentId, grown } = step
  if (reads.length === 0) return
  const added = grown > 0 ? addedOf(await h.messages(agentId), reads.map(r => r.id)) : null
  const costs = attribute({ reads, added, grown }, mem.rate)
  mem.rate = rateAfter(mem.rate, { added, grown })
  await noteCosts(h, costs)
}

// After a request's response: its size, against the size of the request before, measures that step's reads.
// The loop's size is kept at once, so the next step reads it whatever the measuring still awaits.
export function stepDone(h: Host, step: Step): Promise<void> {
  const loop = loopOf(step.agentId)
  const before = loop.turnId === step.turnId ? loop.size : null
  const after = sizeOf(step.usage)
  loop.turnId = step.turnId
  loop.size = after
  return measure(h, { reads: step.reads, agentId: step.agentId, grown: growthOf(before, after) })
}

// A loop that ended, or was cut short, with reads no request followed: they keep a guess.
export async function loopDone(h: Host, agentId: string | undefined): Promise<void> {
  const reads = takeReads(agentId)
  mem.loops.delete(keyOf(agentId))
  await measure(h, { reads, agentId, grown: 0 })
}
