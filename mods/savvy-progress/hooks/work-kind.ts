import type { WorkKind } from '../types'
import { kindOf } from './kit/plain'
import type { Kind } from './kit/plain'

// What an agent is doing right now, as the one picture its crab shows for it. Finer than the strip's five kinds:
// a search is not a read, a check is not a command, and word sent to another session or agent is its own thing.

const FROM: Record<Kind, WorkKind> = {
  read: 'read', search: 'search', edit: 'edit', delete: 'edit', run: 'run', install: 'run', test: 'test', save: 'save', github: 'save',
  web: 'web', service: 'web', agent: 'agent', wait: 'wait', ask: 'message', plan: 'other',
}

// Tools that carry word to someone else: another agent, another session, a person in a chat or by mail.
const MESSAGE = /SendMessage|transceiver|send_message|start_session|slack|(^|_)(send|reply|ask|inbox)$/i

/** The kind of work a tool call is, from the call itself. */
export const workKindOf = (tool: string, input: unknown): WorkKind => (MESSAGE.test(tool) ? 'message' : FROM[kindOf(tool, input)] ?? 'other')

// Work done with the claws walks the crab up and down its row; the rest keeps it in place.
export const IS_HANDS_ON: Record<WorkKind, boolean> = {
  read: false, search: false, edit: true, run: true, test: true, save: true, web: false, message: false, agent: false, wait: false, other: false,
}
