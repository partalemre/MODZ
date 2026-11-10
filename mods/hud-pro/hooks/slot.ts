import type { SlotNotice } from '../types'

// The HUD's notices in the one shared line above the prompt (DESIGN.md §6): a turn that took a notable share of the
// window, or a pace that fills it before it resets. Oldest first, one drawn at a time; a louder mod's live notice
// holds the line, and a notice held off waits without counting down, so it is never lost and never stacked. Pure:
// the queue lives in this mod's `notices` value, the moment each was first drawn here (a draw may not write state).

// A notice stays this long once drawn; the minute clock takes it away after that.
export const NOTICE_MS = 30_000

// Louder notices, top first: the decision and notice mods above the meters, then the meters' own (session-budget's
// warning, effort-router's lowered turn). Their values are read under `{ plugin, key: 'notice' }`.
export const LOUDER = ['reflect', 'you-should-know', 'cache-tax', 'session-budget', 'effort-router'] as const

const shownAt = new Map<number, number>()

export function isLive(notice: unknown, nowMs: number): boolean {
  if (notice === undefined || notice === null) return false
  const expiresAt = (notice as { expiresAt?: unknown }).expiresAt

  return typeof expiresAt !== 'number' || expiresAt <= 0 || expiresAt > nowMs
}

export function enqueue(queue: readonly SlotNotice[], text: string): SlotNotice[] {
  const id = Math.max(0, ...queue.map(notice => notice.id)) + 1

  return [...queue, { id, text, expiresAt: 0 }]
}

// The head as a draw shows it, noting when it was first on screen.
export function headToDraw(queue: readonly SlotNotice[], nowMs: number): SlotNotice | null {
  const head = queue[0]
  if (head === undefined) return null
  if (!shownAt.has(head.id)) shownAt.set(head.id, nowMs)

  return head
}

// The queue once the clock moved: a head on screen for NOTICE_MS goes; one never drawn stays.
export function expired(queue: readonly SlotNotice[], nowMs: number): readonly SlotNotice[] {
  const head = queue[0]
  const since = head === undefined ? undefined : shownAt.get(head.id)
  if (head === undefined || since === undefined || nowMs - since < NOTICE_MS) return queue
  shownAt.delete(head.id)

  return queue.slice(1)
}

export function resetSlot(): void {
  shownAt.clear()
}
