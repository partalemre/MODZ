import type { PaneHandlers } from './sections'

// A press on the Agents page the MODZ hub draws in its own pane (modz/hooks/pages/agents.tsx) reaches this mod as
// `{ plugin: 'modz', key: 'act' }` = `{ page: 'agents', action, arg?, at }`: the action is the handler's own name,
// so the hub's side and this mod's side are built from the one list below and cannot drift apart.

/** The page name the hub draws this mod's pane as (state.ts HUB_PANE). */
export const PAGE = 'agents'

export type PageAct = (action: string, arg?: string) => void

const BARE = ['onCompact', 'onDone', 'onTimeline', 'onChats', 'onNewTask', 'onCancelTask'] as const
const ONE = ['onToggle', 'onLook', 'onBrief', 'onStop', 'onLog', 'onPickType', 'onStartTask'] as const
// `onSend` carries an agent and a text: both travel in `arg` as a JSON pair.
const SEND = 'onSend'

const isOf = <K extends string>(list: readonly K[], action: string): action is K => (list as readonly string[]).includes(action)

/** The page's presses for the hub: each one hands its action on, nothing more. */
export function pageHandlers(act: PageAct): PaneHandlers {
  const bare = Object.fromEntries(BARE.map(name => [name, () => act(name)]))
  const one = Object.fromEntries(ONE.map(name => [name, (arg: string) => act(name, arg)]))

  return { ...bare, ...one, onSend: (id: string, text: string) => act(SEND, JSON.stringify([id, text])) } as PaneHandlers
}

const sendOf = (arg: string | undefined): [string, string] | null => {
  try {
    const pair: unknown = JSON.parse(arg ?? '')

    if (!Array.isArray(pair) || pair.length !== 2) return null
    const [id, text] = pair as unknown[]

    return typeof id === 'string' && typeof text === 'string' ? [id, text] : null
  } catch {
    return null
  }
}

/** Does what this mod's own pane's button does for a handed-on press; false for an action it does not know. */
export function runPageAct(on: PaneHandlers, action: string, arg?: string): boolean {
  const pair = action === SEND ? sendOf(arg) : null
  if (isOf(BARE, action)) on[action]()
  else if (isOf(ONE, action) && typeof arg === 'string') on[action](arg)
  else if (pair !== null) on.onSend(...pair)
  else return false

  return true
}

/** A `modz.act` value meant for this page, or null. */
export function pageActOf(value: unknown): { action: string; arg?: string } | null {
  if (typeof value !== 'object' || value === null) return null
  const { page, action, arg } = value as { page?: unknown; action?: unknown; arg?: unknown }
  if (page !== PAGE || typeof action !== 'string') return null

  return typeof arg === 'string' ? { action, arg } : { action }
}
