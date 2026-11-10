import type { ModelCompleteRequest, ModelCompleteResult, PluginState, SessionCompactResult, SessionMessage } from 'claude-code'

import type { HandoffNote, HubCard, NoteEntry } from '../types'

// The engine calls the rest of the mod needs, as closures: only register.tsx holds `$`.

export type Values = Omit<PluginState['handoff'], 'hub' | 'home' | 'shown'>
export type ValueKey = keyof Values

export type RunOut = { exitCode: number; stdout: string }

export type Io = {
  get: <K extends ValueKey>(key: K) => Promise<Values[K]>
  // Writes only a value that changed (kit/same.ts).
  put: <K extends ValueKey>(key: K, value: Values[K]) => Promise<void>
  hub: { get: () => Promise<HubCard | undefined>; set: (card: HubCard) => Promise<void> }
  // plan-steps' task list, unchecked: another mod's value.
  tasks: () => Promise<unknown>
  store: { get: (key: string) => Promise<unknown>; set: (key: string, value: HandoffNote | NoteEntry[]) => Promise<void>; delete: (key: string) => Promise<void> }
  now: () => Promise<number>
  root: () => Promise<string>
  sessionId: () => Promise<string>
  messages: () => Promise<readonly SessionMessage[]>
  complete: (request: ModelCompleteRequest) => Promise<ModelCompleteResult>
  run: (argv: string[], options: { cwd?: string; timeoutMs: number }) => Promise<RunOut>
  writeFile: (path: string, text: string) => Promise<void>
  compact: () => Promise<SessionCompactResult>
  // Where auto-compaction fires, in tokens (null: off), and the window the fill is measured against.
  autoCompact: () => Promise<{ tokens: number | null; window: number }>
  // A user-role row the model reads on its next request; the person does not see it as typed.
  append: (text: string) => Promise<unknown>
  openPane: () => Promise<unknown>
  log: (text: string) => void
}

export const reasonOf = (error: unknown): string => (error instanceof Error ? error.message : 'unknown')
