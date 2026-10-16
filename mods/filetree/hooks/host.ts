import type { EngineInterface, Timer } from 'claude-code'

import type { Activity, FileTree, HubCard, Look, ReadCost, Theme, TurnLog } from '../types'
import type { ApiMessage } from './readcost'

type Engine = EngineInterface

// The mod's own values in `$.state`, bound in register.tsx where their references stay literal.
export type StateHost = {
  tree(): Promise<FileTree>
  putTree(fn: (t: FileTree) => FileTree): Promise<void>
  activities(): Promise<Activity[]>
  setActivities(fn: (list: Activity[]) => Activity[]): Promise<void>
  turn(): Promise<TurnLog>
  setTurn(fn: (cur: TurnLog) => TurnLog): Promise<void>
  readTotal(): Promise<ReadCost | undefined>
  setReadTotal(fn: (cur: ReadCost | undefined) => ReadCost): Promise<void>
  hubCard(): Promise<HubCard | undefined>
  setHubCard(card: HubCard): Promise<void>
  look(): Promise<Look | undefined>
  setLook(look: Look): Promise<void>
  theme(): Promise<Theme | undefined>
  setTheme(theme: Theme): Promise<void>
  // Whether the MODZ hub runs, and a request for it to come forward (the "← MODZ" button).
  isHubOn(): Promise<boolean>
  goHome(): Promise<void>
  // The pane, opened when asked, now holds the MODZ panel: the hub and every other pane step aside (kit/stage.ts).
  reportShown(): Promise<void>
}

// Files, commands, the clock and the session's environment.
export type IoHost = {
  list: Engine['fs']['list']
  stat: Engine['fs']['stat']
  read(path: string): Promise<unknown>
  run: Engine['process']['run']
  now(): Promise<number>
  after(ms: number, fn: () => void): Timer
  every(ms: number, fn: () => void): Timer
  cwd(): Promise<string>
  sessionId(): Promise<string>
  // The loop's transcript as the API reads it: the main conversation, or a subagent's by its id.
  messages(agentId: string | undefined): Promise<readonly ApiMessage[]>
  tmpdir(): Promise<string | undefined>
  osEnv(): Promise<string | undefined>
  homeEnv(): Promise<string | undefined>
  herdrEnv(): Promise<string | undefined>
  herdrBin(): Promise<string | undefined>
}

// The pane, the clipboard, toasts and Claude's own settings.
export type UiHost = {
  toast(text: string): void
  // The pane by its own id: opened (focused when asked for) or retitled, and whether it is open now.
  openPane(isFocused: boolean): Promise<{ isPlaced: boolean }>
  isPaneOpen(): Promise<boolean>
  copy: Engine['ui']['copy']
  surfaces: Engine['session']['surfaces']
  config: Engine['config']['list']
}

// The engine's reach, bound in register.tsx: the engine follows `$` only into functions of the hooks module's own
// file, so every other module gets this port instead.
export type Host = StateHost & IoHost & UiHost

export function patch(h: Host, fn: (t: FileTree) => Partial<FileTree>): Promise<void> {
  return h.putTree(t => ({ ...t, ...fn(t) }))
}
